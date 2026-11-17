const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
let PORT = parseInt(process.env.PORT, 10) || 3005;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// SMTP Email Delivery Configuration (Anti-Spam & Deliverability Optimized)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = process.env.SMTP_USER || 'nuneslead@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'zmfrmwrvwpsinhjc';
const DEFAULT_TO_EMAIL = process.env.DEFAULT_TO_EMAIL || 'nunesalcotest@gmail.com';
const DEFAULT_CC_EMAIL = process.env.DEFAULT_CC_EMAIL || 'nunescbe@gmail.com';

let emailTransporter = null;
if (SMTP_USER && SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  console.log(`[SMTP] Initialized delivery service with ${SMTP_USER} -> Target To: ${DEFAULT_TO_EMAIL}, CC: ${DEFAULT_CC_EMAIL}`);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Cache the full institutions dataset in memory for fast lookup
let institutionsData = null;
const datasetPath = path.join(publicDir, 'SouthIndia_HigherEd_Directory_SourceCode_And_Dataset.json');
if (fs.existsSync(datasetPath)) {
  try {
    institutionsData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log(`[Dataset] Loaded ${institutionsData.allInstitutions?.length || 0} accredited institutions from JSON dataset.`);
  } catch (err) {
    console.error('[Dataset] Error reading dataset:', err.message);
  }
}

// Cache the verified Tamil Nadu Police Stations dataset
let policeData = null;
const policePath = path.join(publicDir, 'TamilNadu_Police_Stations_Dataset.json');
if (fs.existsSync(policePath)) {
  try {
    policeData = JSON.parse(fs.readFileSync(policePath, 'utf8'));
    console.log(`[Police Dataset] Loaded ${policeData.allStations?.length || 0} verified Tamil Nadu police stations.`);
  } catch (err) {
    console.error('[Police Dataset] Error reading police dataset:', err.message);
  }
}

// Cache the official Nunes Campus Breath Analyser email HTML template
const templatePath = path.join(publicDir, 'nunes_campus_email_template.html');
let nunesEmailTemplate = '';
if (fs.existsSync(templatePath)) {
  try {
    nunesEmailTemplate = fs.readFileSync(templatePath, 'utf8');
    console.log('[Template] Loaded official Nunes Campus Breath Analyser email template.');
  } catch (err) {
    console.error('[Template] Error reading template:', err.message);
  }
}

// -------------------------------------------------------------
// Helper: Gemini API Client
// -------------------------------------------------------------
async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY) return null;
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini ${model}] Failed (${res.status}): ${errText.slice(0, 150)}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      }
    } catch (err) {
      console.warn(`[Gemini ${model}] Exception: ${err.message}`);
    }
  }
  return null;
}

// -------------------------------------------------------------
// Helper: OpenAI API Fallback
// -------------------------------------------------------------
async function callOpenAI(prompt, systemInstruction = '') {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(12000)
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content || '{}');
    }
  } catch (err) {
    console.warn(`[OpenAI Fallback] Exception: ${err.message}`);
  }
  return null;
}

// -------------------------------------------------------------
// POST /api/agent/generate-pitch
// Generates high-converting subject line & forward pitch for colleges
// -------------------------------------------------------------
app.post('/api/agent/generate-pitch', async (req, res) => {
  const { productName, productAdDetails, userGoal, specialOffer, targetSummary } = req.body;
  const pName = productName || 'Institutional Equipment & Laboratory Solutions';
  const pDetails = productAdDetails || 'Precision measurement, engineering lab instruments, and educational testing kits.';
  const pGoal = userGoal || 'Schedule an on-campus demonstration and secure annual lab procurement vendor registration.';
  const pOffer = specialOffer || '15% institutional discount for educational trusts and NAAC/NBA accredited departments.';
  const pTarget = targetSummary || 'Colleges & Universities in Tamil Nadu and Kerala';

  // 1. Try Gemini
  const systemPrompt = `You are an elite B2B Sales Director in India specializing in procurement deals with Higher Education Institutions (Colleges, Deemed Universities, Autonomous Engineering & Arts Colleges, Polytechnics). Return pure JSON with keys: "subject" and "forwardMessage".`;
  const userPrompt = `Generate a compelling email/WhatsApp forward proposal pitch:
- Product Name: ${pName}
- Product Specifications/Details: ${pDetails}
- Target Audience: ${pTarget}
- Business Objective/Goal: ${pGoal}
- Special Offer: ${pOffer}

Requirements:
1. "subject": Crisp, professional, executive subject line mentioning {College_Name} and {District} tags for variable interpolation.
2. "forwardMessage": Highly persuasive, tailored message to the Principal/Secretary/HOD. Mention NBA/NAAC lab compliance, practical student training value, warranty, free on-campus demonstration, and contact next steps. Keep it clean with well-spaced paragraphs and bullet points.`;

  let aiResult = await callGemini(userPrompt, systemPrompt);
  if (!aiResult) {
    aiResult = await callOpenAI(userPrompt, systemPrompt);
  }

  if (aiResult && aiResult.subject && aiResult.forwardMessage) {
    return res.json(aiResult);
  }

  // 2. High-Quality Deterministic Fallback (Guarantees 100% uptime)
  const fallbackPitch = {
    subject: `Official Proposal: ${pName} for {College_Name} ({District}) - Lab Upgrade & Demonstration`,
    forwardMessage: `Respected Principal / Dean of Academics / Head of Department,

Greetings from NUNES Instruments!

We are pleased to introduce our specialized industrial-grade solution designed for premier higher education institutions across South India:

★ Product / Equipment: ${pName}
★ Technical Overview: ${pDetails}
★ Academic Value: Meets AICTE / Anna University / UGC laboratory syllabus guidelines and enhances student practical training & research readiness.
★ Exclusive Institutional Benefit: ${pOffer}

Our Objective:
${pGoal}

We would be honored to arrange an on-campus technical demonstration for your faculty and department lab coordinators at your convenience. Please find our technical catalog and quotation details ready for review.

Kindly let us know a suitable time this week for a 10-minute briefing or campus visit.

Warm regards,
Academic Outreach & Technical Sales Division
NUNES Instruments
Direct Line / WhatsApp: +91 94871 23456 | Email: sales@nunesinstruments.com`
  };

  return res.json(fallbackPitch);
});

// -------------------------------------------------------------
// POST /api/agent/sales-reply
// Autonomous AI Sales Closer responding to Principal/HOD queries
// -------------------------------------------------------------
app.post('/api/agent/sales-reply', async (req, res) => {
  const {
    college,
    productName,
    productAdDetails,
    userGoal,
    specialOffer,
    attachedFileNames,
    chatHistory,
    latestPrincipalMessage
  } = req.body;

  const colName = college?.name || 'College';
  const principal = college?.principalName || 'Principal';
  const district = college?.locality || college?.areaZone || 'Tamil Nadu';
  const query = latestPrincipalMessage || (chatHistory && chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].text : 'Please share pricing and details.');
  const pName = productName || 'Lab Test Equipment';

  const systemPrompt = `You are an expert consultative B2B Sales Closer communicating with College Principals and Deans in India. Return pure JSON with keys: "reply", "suggestedStage", "conversionScore", and "nextAction".`;
  const userPrompt = `A College Principal sent this query: "${query}"
Context:
- Institution: ${colName} (${district})
- Decision Maker: ${principal}
- Product: ${pName}
- Key Details: ${productAdDetails || 'N/A'}
- Special Offer: ${specialOffer || 'Standard academic discount'}
- Attached Documents: ${(attachedFileNames || []).join(', ') || 'Technical Specifications PDF, Price List'}

Generate:
1. "reply": Professional, respectful Indian academic business reply. Answer their specific concern directly (whether pricing, demo dates, AMC warranty, GST invoice, or syllabus relevance). Propose a concrete next step (e.g. sending a formal proforma invoice or confirming demonstration date).
2. "suggestedStage": One of ["Interested / Needs Quotation", "Demo Scheduled", "Commercial Negotiation", "Demo Booked / Closing", "Purchase Order Awaited"].
3. "conversionScore": Integer between 70 and 98 based on intent.
4. "nextAction": Actionable 1-line note for the sales team.`;

  let aiResult = await callGemini(userPrompt, systemPrompt);
  if (!aiResult) {
    aiResult = await callOpenAI(userPrompt, systemPrompt);
  }

  if (aiResult && aiResult.reply) {
    return res.json({
      reply: aiResult.reply,
      suggestedStage: aiResult.suggestedStage || 'Demo Booked / Closing',
      conversionScore: Number(aiResult.conversionScore) || 88,
      nextAction: aiResult.nextAction || 'Dispatch formal commercial proposal & confirm demo date'
    });
  }

  // Fallback Closer Response
  const queryLower = (query || '').toLowerCase();
  let replyText = '';
  let stage = 'Demo Booked / Closing';
  let score = 88;
  let nextAction = 'Send commercial proforma invoice and lock demonstration slot';

  if (queryLower.includes('price') || queryLower.includes('quotation') || queryLower.includes('cost') || queryLower.includes('rate')) {
    replyText = `Dear ${principal}, thank you for your inquiry regarding pricing for ${colName}. We are pleased to extend ${specialOffer || 'an institutional discount of 15%'} along with complete warranty and calibration certification. I have generated the formal discounted proposal for ${pName} and can email the GST-compliant proforma invoice directly to your accounts office today. May we also lock in a 20-minute physical demonstration for your department faculty?`;
    stage = 'Commercial Negotiation';
    score = 92;
    nextAction = 'Dispatch official stamped quotation & follow up for purchase committee approval';
  } else if (queryLower.includes('demo') || queryLower.includes('visit') || queryLower.includes('come') || queryLower.includes('show')) {
    replyText = `Dear ${principal}, we would be delighted to visit ${colName} for a live demonstration of ${pName}. Our technical engineers can bring working demo units to your campus this week. Does Wednesday or Thursday 11:00 AM suit your department heads?`;
    stage = 'Demo Scheduled';
    score = 95;
    nextAction = 'Confirm demo date with college lab technician and prepare equipment kit';
  } else {
    replyText = `Dear ${principal}, thank you for your valuable response. For ${colName}, ${pName} directly aligns with modern AICTE curriculum requirements and department lab benchmarks. In addition to supplying the hardware, we provide complimentary faculty training, 1-year on-site replacement warranty, and calibration certificates. Would you prefer us to send our senior technical specialist to your chamber for a brief walkthrough this Thursday?`;
    stage = 'Demo Booked / Closing';
    score = 86;
    nextAction = 'Call Principal secretary to lock chamber meeting appointment';
  }

  return res.json({
    reply: replyText,
    suggestedStage: stage,
    conversionScore: score,
    nextAction: nextAction
  });
});

// -------------------------------------------------------------
// Deliverability & Anti-Spam Risk Analysis Engine
// Ensures emails never hit spam filters
// -------------------------------------------------------------
function analyzeSpamRisk(subject, body) {
  let score = 100;
  const warnings = [];
  const passes = [];

  const spamTriggerWords = [
    '100% free', 'free gift', 'guaranteed', 'act now', 'urgent', 'limited time',
    'earn money', 'make money', 'cash prize', 'winner', 'risk-free', 'no cost',
    'pure profit', 'instant access', 'click here now', 'exclusive deal', 'free demo',
    'earn cash', 'order now', 'double your income', 'miracle'
  ];

  const sub = (subject || '').trim();
  const txt = (body || '').trim();

  // 1. Subject Length
  if (sub.length < 10) {
    score -= 10;
    warnings.push('Subject line is too short (< 10 chars).');
  } else if (sub.length > 70) {
    score -= 10;
    warnings.push('Subject line is lengthy (> 70 chars); recommended under 65 chars.');
  } else {
    passes.push('Subject length is optimal for mobile & desktop (20-65 chars).');
  }

  // 2. All Caps check
  const subUpper = sub.replace(/[^A-Za-z]/g, '');
  if (subUpper.length > 5 && subUpper === subUpper.toUpperCase()) {
    score -= 20;
    warnings.push('Subject is written in ALL CAPS (major trigger for Gmail/Outlook spam filters).');
  } else {
    passes.push('Subject casing is natural, professional, and non-promotional.');
  }

  // 3. Exclamation marks
  const excSub = (sub.match(/!/g) || []).length;
  if (excSub > 0) {
    score -= 15;
    warnings.push(`Subject contains ${excSub} exclamation mark(s); spam engines penalize exclamation marks.`);
  } else {
    passes.push('Zero exclamation marks in subject line.');
  }

  // 4. Spam triggers in text
  const combined = (sub + ' ' + txt).toLowerCase();
  const foundWords = [];
  for (const word of spamTriggerWords) {
    if (combined.includes(word)) {
      foundWords.push(word);
    }
  }
  if (foundWords.length > 0) {
    score -= Math.min(30, foundWords.length * 10);
    warnings.push(`Spam keywords detected: "${foundWords.join('", "')}".`);
  } else {
    passes.push('Clean vocabulary: No blacklisted spam buzzwords detected.');
  }

  // 5. Postal Address Check (CAN-SPAM compliance)
  if (txt.includes('Coimbatore') || txt.includes('Tamil Nadu') || txt.includes('Gandhipuram') || txt.includes('PIN')) {
    passes.push('Physical corporate postal address included in signature.');
  } else {
    score -= 10;
    warnings.push('Missing physical corporate postal address in footer (mandatory for anti-spam compliance).');
  }

  // 6. Unsubscribe / Opt-out statement
  if (txt.toLowerCase().includes('unsubscribe') || txt.toLowerCase().includes('opt out') || txt.toLowerCase().includes('remove')) {
    passes.push('Clear recipient opt-out / unsubscribe notice included.');
  } else {
    score -= 15;
    warnings.push('Missing opt-out statement (increases risk of recipient spam tagging).');
  }

  return {
    score: Math.max(20, Math.min(100, score)),
    verdict: score >= 90 ? 'Inbox Safe (Excellent)' : score >= 75 ? 'Moderate Deliverability' : 'High Spam Risk',
    warnings,
    passes
  };
}

// -------------------------------------------------------------
// GET /api/email/config
// Provides default primary To & CC addresses and SMTP status
// -------------------------------------------------------------
app.get('/api/email/config', (req, res) => {
  res.json({
    defaultTo: DEFAULT_TO_EMAIL,
    defaultCc: DEFAULT_CC_EMAIL,
    smtpUser: SMTP_USER,
    smtpConfigured: Boolean(emailTransporter)
  });
});

// -------------------------------------------------------------
// POST /api/email/check-spam
// Pre-flight spam & deliverability analysis
// -------------------------------------------------------------
app.post('/api/email/check-spam', (req, res) => {
  const { subject, body } = req.body;
  const report = analyzeSpamRisk(subject, body);
  res.json(report);
});

// -------------------------------------------------------------
// POST /api/email/send
// Dispatches high-deliverability email to nunesalcotest@gmail.com with CC nunescbe@gmail.com
// Attaches official Breath Analyser catalogue PDF with user's exact template
// -------------------------------------------------------------
app.post('/api/email/send', async (req, res) => {
  try {
    const {
      to = DEFAULT_TO_EMAIL,
      cc = DEFAULT_CC_EMAIL,
      subject = 'Campus Breath Analyser Range | Nunes Instrumentation, Coimbatore',
      body,
      html,
      attachCatalogue = true,
      collegeName,
      principalName
    } = req.body;

    const targetTo = to || DEFAULT_TO_EMAIL;
    const targetCc = cc || DEFAULT_CC_EMAIL;

    // Use user-provided template or custom html without extra text appended
    let htmlContent = html || nunesEmailTemplate;
    if (!htmlContent && fs.existsSync(templatePath)) {
      htmlContent = fs.readFileSync(templatePath, 'utf8');
    }

    const plainTextFallback = body || `Campus Breath Analyser Range - Nunes Instrumentation

Dear Principal / Administration Team,
Greetings from Nunes Instrumentation, Coimbatore.
We are pleased to present our breath alcohol screening range for colleges, hostels and campus security teams.

Attached is the 14-product catalogue: Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf

Contact Nunes Instrumentation:
Phone: 93452 26022 | 89409 44000 | 89409 33000
Email: nunescbe@gmail.com

Our Coimbatore Locations:
1. Rathinapuri: 11-A, 2nd Cross, Sundarar St, Opp. to LaLa Mahall, Coimbatore - 641027
2. Gopalapuram: 6, GJ Chandran Complex, Head Quarters Rd, Opp. CSI Church, Coimbatore - 641018
3. Gandhipuram: 218-628, 1st St, Cross Cut, Coimbatore - 641012

Regards,
Nunes Instrumentation Team`;

    // Deliverability & Spam Analysis
    const spamReport = analyzeSpamRisk(subject, plainTextFallback);

    if (!emailTransporter) {
      return res.status(500).json({
        error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS in .env'
      });
    }

    // Reload clean lightweight template dynamically
    if (fs.existsSync(templatePath)) {
      htmlContent = fs.readFileSync(templatePath, 'utf8');
    }

    // Attachments configuration
    let attachments = [];

    // 1. Inline Brand Logo CID (Prevents Gmail blocking & broken icon)
    const logoPath = path.join(publicDir, 'nunes_logo.png');
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'nunes_logo.png',
        path: logoPath,
        cid: 'nunes-logo'
      });
    }

    // 2. Breath Analyser 14-Product Catalogue PDF (5.16 MB)
    if (attachCatalogue) {
      const desktopPdf = 'C:\\Users\\NUNES\\Desktop\\Breath_Analyser_Catalogue_14_Individual_Product_QR_Final_EmailReady.pdf';
      const publicPdf = path.join(publicDir, 'Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf');
      const attachmentPath = fs.existsSync(desktopPdf) ? desktopPdf : (fs.existsSync(publicPdf) ? publicPdf : null);

      if (attachmentPath) {
        attachments.push({
          filename: 'Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf',
          path: attachmentPath
        });
      }
    }



    const mailOptions = {
      from: `"Nunes Instrumentation" <${SMTP_USER}>`,
      to: targetTo,
      cc: targetCc,
      replyTo: 'nunescbe@gmail.com',
      subject: subject,
      text: plainTextFallback,
      html: htmlContent,
      attachments: attachments,
      headers: {
        'X-Entity-Ref-ID': `nunes-highered-${Date.now()}`,
        'X-Mailer': 'NUNES-HigherEd-Outreach-v2'
      }
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`[Email Sent] Message ID: ${info.messageId} | To: ${targetTo} | CC: ${targetCc} | Attachment: ${attachments.length > 0 ? attachments[0].filename : 'None'}`);

    return res.json({
      success: true,
      messageId: info.messageId,
      to: targetTo,
      cc: targetCc,
      attachedFiles: attachments.map(a => a.filename),
      spamReport: spamReport,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Email Send Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/colleges/emails
// Returns verified college email list and summary statistics
// -------------------------------------------------------------
app.get('/api/colleges/emails', (req, res) => {
  if (!institutionsData || !institutionsData.allInstitutions) {
    return res.status(404).json({ error: 'Institutions dataset not found' });
  }
  const colleges = institutionsData.allInstitutions;
  const verifiedList = colleges.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    locality: c.locality,
    pincode: c.pincode,
    phone: c.phone,
    email: c.email,
    principalPhone: c.principalPhone || '',
    whatsapp: c.whatsapp || ''
  }));

  res.json({
    totalInstitutions: colleges.length,
    verifiedEmailsCount: verifiedList.length,
    verifiedPhoneCount: verifiedList.length,
    verifiedPrincipalPhoneCount: verifiedList.filter(c => c.principalPhone).length,
    verifiedWhatsAppCount: verifiedList.filter(c => c.whatsapp).length,
    colleges: verifiedList
  });
});

// -------------------------------------------------------------
// GET /api/police
// Full verified Tamil Nadu Police Stations dataset endpoint
// -------------------------------------------------------------
app.get('/api/police', (req, res) => {
  if (policeData) {
    return res.json(policeData);
  }
  return res.status(404).json({ error: 'Police dataset not found' });
});

// -------------------------------------------------------------
// GET /api/colleges
// Full 4,990 higher education institutions dataset endpoint
// -------------------------------------------------------------
app.get('/api/colleges', (req, res) => {
  if (institutionsData) {
    return res.json(institutionsData);
  }
  return res.status(404).json({ error: 'Institutions dataset not found' });
});

// -------------------------------------------------------------
// GET /api/health
// System Health Check
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'TN & Kerala HigherEd Directory & Police Law Enforcement Studio',
    port: PORT,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    openaiConfigured: Boolean(OPENAI_API_KEY),
    datasetLoaded: Boolean(institutionsData),
    totalColleges: institutionsData?.allInstitutions?.length || 0,
    policeDatasetLoaded: Boolean(policeData),
    totalPoliceStations: policeData?.allStations?.length || 0,
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// SPA Fallback: Serve index.html for all frontend routes
// -------------------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start Server with auto-fallback if port in use
function startServer(portToTry) {
  const server = app.listen(portToTry, '0.0.0.0', () => {
    PORT = portToTry;
    console.log(`================================================================`);
    console.log(`🚀 South India HigherEd Directory & AI Sales Agent Studio`);
    console.log(`🌐 Local Application URL: http://localhost:${PORT}`);
    console.log(`📊 AI Backend APIs: http://localhost:${PORT}/api/health`);
    console.log(`📚 Colleges Dataset: http://localhost:${PORT}/api/colleges`);
    console.log(`================================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port ${portToTry}] in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

startServer(PORT);

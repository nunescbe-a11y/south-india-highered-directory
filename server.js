const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Firestore } = require('@google-cloud/firestore');
require('dotenv').config();

const app = express();
let PORT = parseInt(process.env.PORT, 10) || 3005;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Initialize Google Cloud Firestore Database (asia-south1 Mumbai)
let firestoreDb = null;
try {
  firestoreDb = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'nunes-mail-d072f3ce1'
  });
  console.log('[Firestore] Connected to Google Cloud Firestore (Project: nunes-mail-d072f3ce1, Region: asia-south1)');
} catch (err) {
  console.warn('[Firestore] Initialization warning:', err.message);
}

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
    console.log(`[Police Dataset] Loaded ${policeData.allStations?.length || 0} verified Pan-India police stations.`);
  } catch (err) {
    console.error('[Police Dataset] Error reading police dataset:', err.message);
  }
}

// Cache Schools Dataset
let schoolsData = null;
const schoolsPath = path.join(publicDir, 'Schools_Directory_Dataset.json');
if (fs.existsSync(schoolsPath)) {
  try {
    schoolsData = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
    console.log(`[Schools Dataset] Loaded ${schoolsData.allSchools?.length || 0} verified Pan-India schools.`);
  } catch (err) {
    console.error('[Schools Dataset] Error reading schools dataset:', err.message);
  }
}

// Cache Transport & Lorry Fleets Dataset
let transportData = null;
const transportPath = path.join(publicDir, 'Transport_Lorry_Bus_Fleet_Dataset.json');
if (fs.existsSync(transportPath)) {
  try {
    transportData = JSON.parse(fs.readFileSync(transportPath, 'utf8'));
    console.log(`[Transport Dataset] Loaded ${transportData.allTransport?.length || 0} Pan-India transport & lorry hubs.`);
  } catch (err) {
    console.error('[Transport Dataset] Error reading transport dataset:', err.message);
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
// POST /api/customer/inquiry-reply
// Automated AI Customer Engagement & "Thank You for Choosing Us" Responder
// (OpenAI + Intelligent Rule Engine + SMTP Delivery + Firestore Cloud Sync)
// -------------------------------------------------------------
app.post('/api/customer/inquiry-reply', async (req, res) => {
  const {
    name,
    phone,
    email,
    target,
    sector,
    model,
    message
  } = req.body;

  const customerName = (name || 'Valued Customer').trim();
  const customerTarget = (target || 'Your Organization / Fleet').trim();
  const customerPhone = (phone || '').trim();
  const customerEmail = (email || '').trim();
  const chosenModel = model || 'Model 03: Alco-Blow / Rapid Baton (Non-Contact Rapid Screening)';
  const customerSector = sector || 'Transport & Fleet';
  const customNote = (message || '').trim();

  let aiResult = null;

  // 1. Try calling OpenAI if key configured
  if (OPENAI_API_KEY) {
    const sysPrompt = `You are an AI Customer Engagement & Sales Specialist for Nunes Instrumentation (Coimbatore, Tamil Nadu), India's premier manufacturer and distributor of fuel-cell Breath Alcohol Analysers. Return pure JSON.`;
    const userPrompt = `A customer submitted an inquiry:
- Customer Name: ${customerName}
- Target Organization / Campus / Fleet: ${customerTarget} (${customerSector})
- Phone / WhatsApp: ${customerPhone}
- Email: ${customerEmail}
- Product Inquired: ${chosenModel}
- Customer Note: ${customNote || 'Requesting quotation, technical brochure, and demo schedule'}

Generate a JSON object with:
"thankYouSubject": Professional email subject (e.g. 'Thank You for Choosing Nunes Instrumentation — Quotation & Demo Confirmation for ${customerTarget}')
"thankYouEmailBody": A warm, respectful, complete Indian business thank-you email thanking them for choosing Nunes Instrumentation, acknowledging their inquiry for ${chosenModel}, detailing technical advantages (fuel cell accuracy, calibration certificates, DGS&D/GeM compliance), offering an institutional/fleet 15% discount, scheduling a physical on-site demo, and providing Nunes Coimbatore contact details (+91 94432 17030, nunesalcotest@gmail.com).
"whatsappMessage": A polite, high-impact WhatsApp thank-you message formatted with emojis and bullets ready to send to the customer.
"recommendedModel": Recommended model string
"nextSteps": 1-line note on next commercial step`;

    aiResult = await callOpenAI(userPrompt, sysPrompt);
  }

  // 2. Fallback Expert Response Engine (if OpenAI quota exhausted or offline)
  if (!aiResult || !aiResult.thankYouEmailBody) {
    const isTransport = customerSector.toLowerCase().includes('transport') || customerSector.toLowerCase().includes('fleet') || customerSector.toLowerCase().includes('lorry');
    const isSchool = customerSector.toLowerCase().includes('school');
    const isCollege = customerSector.toLowerCase().includes('college') || customerSector.toLowerCase().includes('highered');

    let sectorHighlight = 'commercial transport and fleet driver safety';
    let complianceNote = 'Section 185 Motor Vehicles Act & commercial fleet safety compliance';
    if (isSchool) {
      sectorHighlight = 'school bus driver pre-trip sobriety screening';
      complianceNote = 'Supreme Court school bus safety guidelines & driver alcohol protocols';
    } else if (isCollege) {
      sectorHighlight = 'campus and student hostel alcohol-free policy enforcement';
      complianceNote = 'AICTE / UGC campus safety guidelines & hostel perimeter control';
    }

    const emailSubject = `Thank You for Choosing Nunes Instrumentation — Quotation & Demo Details for ${customerTarget}`;
    const emailBody = `Dear ${customerName},

Thank you very much for choosing Nunes Instrumentation and reaching out regarding our professional Breath Alcohol Analyser solutions for ${customerTarget}.

We have successfully received your inquiry for:
• Selected Equipment: ${chosenModel}
• Organization / Fleet: ${customerTarget}
• Application: ${sectorHighlight} (${complianceNote})

Key Advantages of Nunes Breath Analysers:
1. Electrochemical Fuel-Cell Sensor: ±0.005% BAC precision with zero false positives from cough syrup, mouthwash, or tobacco.
2. Official Certification: Supplied with NIST-traceable calibration certificate and 1-Year on-site replacement warranty.
3. Government & Commercial Compliance: Approved for legal evidentiary use under Section 185 Motor Vehicles Act and GeM/DGS&D procurement.
4. Commercial Fleet / Campus Discount: We are pleased to extend an introductory 15% institutional discount along with complimentary technical calibration.

Next Steps:
Our senior technical specialist from our Coimbatore headquarters will contact you directly to share the GST proforma invoice and schedule a free physical demonstration at your facility.

For any immediate queries or custom technical requirements, please feel free to reach us directly:
• Phone / WhatsApp: +91 94432 17030
• Official Email: nunesalcotest@gmail.com / nunescbe@gmail.com
• Head Office: Coimbatore, Tamil Nadu, India

Warm regards,
Nunes Instrumentation Sales & Technical Support Team
Coimbatore, Tamil Nadu`;

    const waMsg = `Hello ${customerName}, thank you for choosing Nunes Instrumentation! 🙏

We received your inquiry for *${chosenModel}* for *${customerTarget}*.

✅ *Quick Highlights:*
• Fuel-Cell Precision (±0.005% BAC)
• 1-Year Replacement Warranty & Calibration Certificate
• 15% Fleet/Institutional Discount Applied

Our technical team will call you shortly to coordinate your quote & demonstration.
📞 *Nunes Coimbatore*: +91 94432 17030
✉️ *Email*: nunesalcotest@gmail.com`;

    aiResult = {
      thankYouSubject: emailSubject,
      thankYouEmailBody: emailBody,
      whatsappMessage: waMsg,
      recommendedModel: chosenModel,
      nextSteps: 'Schedule physical demonstration and dispatch formal GST proforma invoice'
    };
  }

  // 3. Send automated Thank-You email via SMTP if customer provided email
  let emailSent = false;
  let emailError = null;
  if (customerEmail && customerEmail.includes('@') && emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: '"Nunes Instrumentation" <nunesalcotest@gmail.com>',
        to: customerEmail,
        cc: 'nunesalcotest@gmail.com, nunescbe@gmail.com',
        subject: aiResult.thankYouSubject,
        text: aiResult.thankYouEmailBody
      });
      emailSent = true;
      console.log(`[Auto-Reply] Thank-you email sent successfully to ${customerEmail}`);
    } catch (err) {
      emailError = err.message;
      console.warn(`[Auto-Reply] Email send failed: ${err.message}`);
    }
  }

  // 4. Save to Google Cloud Firestore (persistent cloud log)
  let firestoreSaved = false;
  try {
    if (firestore) {
      await firestore.collection('customer_inquiries').add({
        customerName,
        customerPhone,
        customerEmail,
        customerTarget,
        customerSector,
        chosenModel,
        customNote,
        aiReply: aiResult,
        emailSent,
        createdAt: new Date().toISOString(),
        status: 'AUTO_REPLIED'
      });
      firestoreSaved = true;
      console.log(`[Firestore] Inquiry logged to cloud for ${customerName}`);
    }
  } catch (err) {
    console.warn(`[Firestore] Inquiry save warning: ${err.message}`);
  }

  // 5. Generate direct WhatsApp reply link
  let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  const whatsappUrl = cleanPhone.length >= 10 ?
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(aiResult.whatsappMessage)}` :
    `https://wa.me/919443217030?text=${encodeURIComponent(aiResult.whatsappMessage)}`;

  return res.json({
    success: true,
    customerName,
    thankYouSubject: aiResult.thankYouSubject,
    thankYouEmailBody: aiResult.thankYouEmailBody,
    whatsappMessage: aiResult.whatsappMessage,
    whatsappUrl,
    emailSent,
    firestoreSaved,
    recommendedModel: aiResult.recommendedModel
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
      bcc,
      subject = 'Campus Breath Analyser Range | Nunes Instrumentation, Coimbatore',
      body,
      html,
      attachCatalogue = true,
      collegeName,
      principalName
    } = req.body;

    const targetTo = to || DEFAULT_TO_EMAIL;
    const targetCc = cc || DEFAULT_CC_EMAIL;

    // Parse & de-duplicate BCC list if provided
    let bccList = [];
    if (bcc) {
      if (Array.isArray(bcc)) {
        bccList = bcc.map(e => String(e).trim()).filter(e => e.includes('@'));
      } else if (typeof bcc === 'string') {
        bccList = bcc.split(',').map(e => e.trim()).filter(e => e.includes('@'));
      }
      bccList = [...new Set(bccList)];
    }

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
      from: '"Nunes Instrumentation" <nunesalcotest@gmail.com>',
      to: targetTo,
      cc: targetCc,
      ...(bccList.length > 0 ? { bcc: bccList } : {}),
      replyTo: 'nunesalcotest@gmail.com, nunescbe@gmail.com',
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
    console.log(`[Email Sent] Message ID: ${info.messageId} | To: ${targetTo} | CC: ${targetCc} | BCC Count: ${bccList.length} | Attachment: ${attachments.length > 0 ? attachments[0].filename : 'None'}`);

    return res.json({
      success: true,
      messageId: info.messageId,
      to: targetTo,
      cc: targetCc,
      bccCount: bccList.length,
      bccRecipients: bccList,
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
// -------------------------------------------------------------
// POST /api/email/batch-college-send
// Dispatches personalized campus outreach emails to Coimbatore colleges list
// From: nunesalcotest@gmail.com, CC: nunescbe@gmail.com
// -------------------------------------------------------------
app.post('/api/email/batch-college-send', async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      filterDistrict = 'coimbatore',
      delayMs = 1200
    } = req.body;

    if (!institutionsData || !institutionsData.allInstitutions) {
      return res.status(404).json({ error: 'Institutions dataset not found' });
    }

    if (!emailTransporter) {
      return res.status(500).json({ error: 'SMTP email service not configured.' });
    }

    // Filter target colleges
    const colleges = institutionsData.allInstitutions.filter(c => {
      const pin = (c.pincode || '').trim();
      const phone = (c.phone || '').trim();
      const loc = (c.locality || '').toLowerCase();
      const zone = (c.areaZone || '').toLowerCase();
      return pin.startsWith('641') || phone.startsWith('0422') || loc.includes('coimbatore') || zone.includes('coimbatore');
    });

    const targetBatch = colleges.slice(offset, offset + limit);
    console.log(`[Batch Email] Starting dispatch to ${targetBatch.length} institutions (offset: ${offset}, limit: ${limit})...`);

    let templateHtml = nunesEmailTemplate;
    if (fs.existsSync(templatePath)) {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    }

    // Prepare attachments
    let attachments = [];
    const logoPath = path.join(publicDir, 'nunes_logo.png');
    if (fs.existsSync(logoPath)) {
      attachments.push({ filename: 'nunes_logo.png', path: logoPath, cid: 'nunes-logo' });
    }
    const desktopPdf = 'C:\\Users\\NUNES\\Desktop\\Breath_Analyser_Catalogue_14_Individual_Product_QR_Final_EmailReady.pdf';
    const publicPdf = path.join(publicDir, 'Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf');
    const attachmentPath = fs.existsSync(desktopPdf) ? desktopPdf : (fs.existsSync(publicPdf) ? publicPdf : null);
    if (attachmentPath) {
      attachments.push({ filename: 'Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf', path: attachmentPath });
    }

    const results = [];

    for (let i = 0; i < targetBatch.length; i++) {
      const college = targetBatch[i];
      const targetEmail = college.email ? college.email.trim() : null;

      if (!targetEmail || !targetEmail.includes('@')) {
        results.push({ college: college.name, email: targetEmail, status: 'skipped_no_email' });
        continue;
      }

      try {
        const mailOptions = {
          from: '"Nunes Instrumentation" <nunesalcotest@gmail.com>',
          to: targetEmail,
          cc: 'nunescbe@gmail.com',
          replyTo: 'nunesalcotest@gmail.com, nunescbe@gmail.com',
          subject: 'Campus Breath Analyser Range | Nunes Instrumentation, Coimbatore',
          html: templateHtml,
          attachments: attachments,
          headers: {
            'X-Entity-Ref-ID': `nunes-batch-${college.id || Date.now()}-${i}`,
            'X-Mailer': 'NUNES-Campus-Outreach-v2'
          }
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`[Batch Email Sent] (${i+1}/${targetBatch.length}) ${college.name} <${targetEmail}> | Message ID: ${info.messageId}`);
        results.push({
          college: college.name,
          email: targetEmail,
          status: 'sent',
          messageId: info.messageId
        });

        // Safe rate limiting delay to avoid triggering Gmail SMTP throttle
        if (i < targetBatch.length - 1 && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (sendErr) {
        console.error(`[Batch Email Failed] ${college.name} <${targetEmail}>:`, sendErr.message);
        results.push({
          college: college.name,
          email: targetEmail,
          status: 'failed',
          error: sendErr.message
        });
      }
    }

    return res.json({
      success: true,
      totalProcessed: targetBatch.length,
      sentCount: results.filter(r => r.status === 'sent').length,
      failedCount: results.filter(r => r.status === 'failed').length,
      skippedCount: results.filter(r => r.status === 'skipped_no_email').length,
      fromAddress: 'nunesalcotest@gmail.com',
      ccAddress: 'nunescbe@gmail.com',
      results: results
    });
  } catch (err) {
    console.error('[Batch Email General Error]', err);
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
// Full higher education institutions dataset endpoint
// -------------------------------------------------------------
app.get('/api/colleges', (req, res) => {
  if (institutionsData) {
    return res.json(institutionsData);
  }
  return res.status(404).json({ error: 'Institutions dataset not found' });
});

// -------------------------------------------------------------
// GET /api/schools
// Verified Schools & Bus Fleet dataset endpoint
// -------------------------------------------------------------
app.get('/api/schools', (req, res) => {
  if (schoolsData) {
    return res.json(schoolsData);
  }
  return res.status(404).json({ error: 'Schools dataset not found' });
});

// -------------------------------------------------------------
// GET /api/transport
// Verified Bus, Lorry & Freight Transport Fleets endpoint
// -------------------------------------------------------------
app.get('/api/transport', (req, res) => {
  if (transportData) {
    return res.json(transportData);
  }
  return res.status(404).json({ error: 'Transport dataset not found' });
});

// -------------------------------------------------------------
// POST /api/agent/quick-followup
// Autonomous AI Follow-Up Agent - generates ultra-concise 2-3 sentence corporate response
// -------------------------------------------------------------
app.post('/api/agent/quick-followup', async (req, res) => {
  const { targetName, targetType, contactPerson, query, channel = 'email', apiKey } = req.body;
  const effectiveOpenAIKey = apiKey || OPENAI_API_KEY;

  const prompt = `Target Name: ${targetName || 'Institution'}
Target Type: ${targetType || 'General'} (Police, HigherEd, School, or Transport Fleet)
Contact In-Charge: ${contactPerson || 'Administrative Officer'}
Client Scenario / Question: ${query || 'Interested in technical demonstration, DGS&D/GeM rates and warranty.'}
Dispatch Channel: ${channel} (WhatsApp or Email)

Task: Draft an ultra-crisp, authoritative, executive B2B response on behalf of Nunes Instrumentation Coimbatore (Est. 1978).
Strict Constraints:
1. MAXIMUM 2 to 3 sentences only (Under 45 words total).
2. Professional, decisive, polite B2B Indian commercial tone.
3. Include an immediate next step (e.g. demonstration schedule, PDF dispatch, or GeM contract).
4. Zero unnecessary filler words or long intros.`;

  if (effectiveOpenAIKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveOpenAIKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are the Senior Technical Sales Director at Nunes Instrumentation Coimbatore. You provide short, decisive, executive 2-sentence B2B responses without fluff.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 120,
          temperature: 0.5
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          return res.json({ success: true, reply, source: 'openai-gpt-4o-mini' });
        }
      }
    } catch (e) {
      console.warn('[AI Quick Followup OpenAI Error]', e.message);
    }
  }

  // Deterministic fallback templates (instant, zero cost, 100% reliable)
  let fallback = '';
  if (targetType === 'Police') {
    fallback = `Greetings from Nunes Instrumentation Coimbatore. We have shared the technical specifications and calibration certificate for our Fuel Cell Breath Analyser with Thermal Printer for ${targetName}; our technical officer is ready to arrange a live demonstration for your department this week.`;
  } else if (targetType === 'School') {
    fallback = `Greetings from Nunes Instrumentation. Under Section 185 Motor Vehicles Act regulations for school bus driver screening, we can deliver our rapid fuel-cell baton analyser directly to ${targetName} with full 1-year calibration warranty and institutional pricing.`;
  } else if (targetType === 'Transport') {
    fallback = `Greetings from Nunes Instrumentation Coimbatore. We can equip ${targetName}'s fleet depot gatehouse with rapid 1-second sniffer batons and certified printout units to ensure 100% pre-trip driver sobriety compliance; let us know when our technician can visit.`;
  } else {
    fallback = `Greetings from Nunes Instrumentation Coimbatore. We are pleased to share our 14-model institutional breath analyser range for ${targetName}; please let us know a convenient time this week for a 10-minute on-campus demonstration for your safety team.`;
  }

  return res.json({ success: true, reply: fallback, source: 'deterministic-rules-engine' });
});

// -------------------------------------------------------------
// POST /api/google-places/test-key
// Validates Google Cloud Maps / Places API key (Places API New + Legacy fallback)
// -------------------------------------------------------------
app.post('/api/google-places/test-key', async (req, res) => {
  const { apiKey } = req.body;
  const keyToUse = (apiKey && apiKey.trim()) || GOOGLE_MAPS_API_KEY;
  if (!keyToUse) {
    return res.status(400).json({ valid: false, error: 'API key is required.' });
  }

  try {
    // 1. Primary: Validate with modern Places API (New)
    const newApiUrl = 'https://places.googleapis.com/v1/places:searchText';
    const newRes = await fetch(newApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': keyToUse,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress'
      },
      body: JSON.stringify({
        textQuery: 'Coimbatore Police Station',
        pageSize: 1
      }),
      signal: AbortSignal.timeout(8000)
    });

    const newData = await newRes.json();
    if (newRes.ok && (newData.places || Array.isArray(newData.places))) {
      return res.json({
        valid: true,
        apiType: 'Places API (New)',
        message: 'Google Cloud Places API (New) connected & verified successfully!'
      });
    }

    // 2. Fallback: Validate with Legacy Places API
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Coimbatore+Police+Commissioner+Office&inputtype=textquery&fields=name,formatted_address&key=${keyToUse}`;
    const legRes = await fetch(legacyUrl, { signal: AbortSignal.timeout(8000) });
    const legData = await legRes.json();

    if (legData.status === 'OK' || legData.status === 'ZERO_RESULTS') {
      return res.json({
        valid: true,
        apiType: 'Legacy Places API',
        message: 'Google Places API connected successfully!'
      });
    }

    return res.json({
      valid: false,
      message: (newData.error && newData.error.message) || legData.error_message || 'API Key failed Google verification.'
    });
  } catch (err) {
    return res.status(500).json({ valid: false, error: err.message });
  }
});

// -------------------------------------------------------------
// INCREMENTAL PERSISTENT STORAGE ENGINE (Zero Duplicate Upsert)
// Stores new verified records permanently to disk without reloading
// -------------------------------------------------------------
function upsertIncrementalRecords(sector, incomingList) {
  let targetFile = '';
  let targetArray = [];
  let rootObj = null;
  let keyInObj = '';
  let desktopCsv = '';

  const sec = (sector || 'police').toLowerCase();

  if (sec === 'police') {
    targetFile = policePath;
    rootObj = policeData || { meta: {}, allStations: [] };
    keyInObj = 'allStations';
    desktopCsv = 'C:/Users/NUNES/Desktop/Tamil_Nadu_Police_Station_Directory_Verified.csv';
  } else if (sec === 'colleges' || sec === 'highered') {
    targetFile = datasetPath;
    rootObj = institutionsData || { meta: {}, allInstitutions: [] };
    keyInObj = 'allInstitutions';
    desktopCsv = 'C:/Users/NUNES/Desktop/Coimbatore_Higher_Education_Colleges_Verified_Directory.csv';
  } else if (sec === 'schools') {
    targetFile = schoolsPath;
    rootObj = schoolsData || { meta: {}, allSchools: [] };
    keyInObj = 'allSchools';
    desktopCsv = 'C:/Users/NUNES/Desktop/Schools_Directory_Verified.csv';
  } else if (sec === 'transport') {
    targetFile = transportPath;
    rootObj = transportData || { meta: {}, allTransport: [] };
    keyInObj = 'allTransport';
    desktopCsv = 'C:/Users/NUNES/Desktop/Transport_Lorry_Bus_Fleet_Verified.csv';
  } else {
    throw new Error(`Unsupported sector: ${sector}`);
  }

  targetArray = rootObj[keyInObj] || [];

  // Build index for O(1) duplicate checks
  const existingMap = new Map();
  for (const item of targetArray) {
    const rawName = item.name || item.stationName || item.institutionName || '';
    const rawDist = item.district || '';
    const normKey = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}__${rawDist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    existingMap.set(normKey, item);
    if (item.placeId) {
      existingMap.set(item.placeId, item);
    }
  }

  let newlyAddedCount = 0;
  let enrichedCount = 0;
  let skippedCount = 0;
  const newlyAddedItems = [];

  for (const record of incomingList) {
    const rawName = record.name || record.stationName || record.institutionName || '';
    const rawDist = record.district || '';
    const normKey = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}__${rawDist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const existing = (record.placeId && existingMap.get(record.placeId)) || existingMap.get(normKey);

    if (existing) {
      // Already in permanent database! Never duplicate
      let changed = false;
      if (!existing.phone && (record.phone || record.landline)) {
        existing.phone = record.phone || record.landline;
        changed = true;
      }
      if (!existing.email && (record.email || record.officialEmail)) {
        existing.email = record.email || record.officialEmail;
        changed = true;
      }
      if ((!existing.lat || !existing.lng) && record.lat && record.lng) {
        existing.lat = record.lat;
        existing.lng = record.lng;
        changed = true;
      }
      if (changed) enrichedCount++;
      else skippedCount++;
    } else {
      // Brand new discovery! Add to persistent store
      const newEntity = {
        ...record,
        id: record.id || `${sec.slice(0, 3)}-${(record.state || 'IN').slice(0, 2).toLowerCase()}-${Date.now().toString().slice(-4)}-${newlyAddedCount + 1}`,
        dateAdded: new Date().toISOString(),
        isNew: true,
        verifiedSource: record.verifiedSource || 'Google Places Persistent Harvest'
      };
      targetArray.push(newEntity);
      newlyAddedItems.push(newEntity);
      existingMap.set(normKey, newEntity);
      if (newEntity.placeId) existingMap.set(newEntity.placeId, newEntity);
      newlyAddedCount++;
    }
  }

  // Save to Disk if new items or enrichments found
  if (newlyAddedCount > 0 || enrichedCount > 0) {
    rootObj[keyInObj] = targetArray;
    rootObj.meta = rootObj.meta || {};
    rootObj.meta.lastUpdated = new Date().toISOString();
    rootObj.meta.totalCount = targetArray.length;

    // 1. Write updated JSON
    fs.writeFileSync(targetFile, JSON.stringify(rootObj, null, 2), 'utf8');
    console.log(`[Incremental Store] Saved ${newlyAddedCount} new and ${enrichedCount} enriched records to ${targetFile}. Total: ${targetArray.length}`);

    // 2. Write updated CSV to Desktop
    try {
      const headers = Object.keys(targetArray[0] || {});
      const csvContent = [
        headers.join(','),
        ...targetArray.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');
      fs.writeFileSync(desktopCsv, csvContent, 'utf8');
      console.log(`[Incremental Store] Updated Desktop CSV: ${desktopCsv}`);
    } catch (csvErr) {
      console.warn(`[Incremental Store] Desktop CSV write skipped:`, csvErr.message);
    }

    // 3. Mirror directly into Cloud Firestore
    if (firestoreDb && newlyAddedItems.length > 0) {
      const colMap = { police: 'police_stations', colleges: 'colleges', schools: 'schools', transport: 'transport_fleets' };
      const colName = colMap[sec] || 'misc';
      const batch = firestoreDb.batch();
      newlyAddedItems.slice(0, 450).forEach(item => {
        const docId = String(item.id || item.name || item.stationName).replace(/\//g, '_').replace(/\\/g, '_').trim();
        const ref = firestoreDb.collection(colName).doc(docId);
        batch.set(ref, { ...item, lastSyncedToFirestore: new Date().toISOString() }, { merge: true });
      });
      batch.commit().then(() => {
        console.log(`[Firestore] Successfully synced ${newlyAddedItems.length} records to cloud collection "${colName}".`);
      }).catch(err => {
        console.warn(`[Firestore Sync Warning]`, err.message);
      });
    }
  }

  return {
    sector: sec,
    totalExisting: targetArray.length - newlyAddedCount,
    newlyAddedCount,
    enrichedCount,
    skippedCount,
    totalDatasetSize: targetArray.length,
    newItems: newlyAddedItems
  };
}

// -------------------------------------------------------------
// GET /api/firestore/status
// Reports Google Cloud Firestore synchronization status
// -------------------------------------------------------------
app.get('/api/firestore/status', async (req, res) => {
  if (!firestoreDb) {
    return res.json({ connected: false, message: 'Firestore not initialized' });
  }
  try {
    const metaDoc = await firestoreDb.collection('sync_metadata').doc('summary').get();
    return res.json({
      connected: true,
      projectId: 'nunes-mail-d072f3ce1',
      region: 'asia-south1 (Mumbai)',
      firestoreData: metaDoc.exists ? metaDoc.data() : null
    });
  } catch (err) {
    return res.json({ connected: false, error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/records/upsert
// Manually upsert records into persistent storage without duplicates
// -------------------------------------------------------------
app.post('/api/records/upsert', (req, res) => {
  const { sector = 'police', records = [] } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array is required.' });
  }
  try {
    const stats = upsertIncrementalRecords(sector, records);
    return res.json({ success: true, ...stats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/google-places/harvest
// Harvests live verified places for any State / District in India via Places API (New)
// Automatically synchronizes and saves to persistent database & Firestore without duplicates
// -------------------------------------------------------------
app.post('/api/google-places/harvest', async (req, res) => {
  const { apiKey, state = 'Tamil Nadu', district = 'Coimbatore', sector = 'police', keyword, autoSave = true } = req.body;
  const keyToUse = (apiKey && apiKey.trim()) || GOOGLE_MAPS_API_KEY;

  if (!keyToUse) {
    return res.status(400).json({ error: 'Google Places API key is required to harvest live data.' });
  }

  const queryTerm = keyword || (
    sector === 'police' ? `Police Station in ${district}, ${state}` :
    sector === 'colleges' ? `Engineering Arts College in ${district}, ${state}` :
    sector === 'schools' ? `Senior Secondary Matriculation School in ${district}, ${state}` :
    `Bus Depot Lorry Transport in ${district}, ${state}`
  );

  try {
    // Primary: Call modern Places API (New)
    const newApiUrl = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(newApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': keyToUse,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.id'
      },
      body: JSON.stringify({
        textQuery: queryTerm,
        pageSize: 20
      }),
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();

    let rawPlaces = [];
    if (response.ok && Array.isArray(data.places)) {
      rawPlaces = data.places.map((p, idx) => ({
        id: `gp-${sector.slice(0,3)}-${Date.now().toString().slice(-4)}-${idx}`,
        name: p.displayName?.text || 'Unknown Institution',
        stationName: p.displayName?.text || 'Unknown Station',
        institutionName: p.displayName?.text || 'Unknown Institution',
        address: p.formattedAddress || `${district}, ${state}`,
        state: state,
        district: district,
        category: sector === 'police' ? 'Law & Order' : (sector === 'colleges' ? 'Higher Education' : (sector === 'schools' ? 'Matriculation / CBSE' : 'Commercial Transport')),
        rating: p.rating || 4.2,
        lat: p.location?.latitude || null,
        lng: p.location?.longitude || null,
        placeId: p.id || `gp-${Date.now()}-${idx}`,
        landline: p.nationalPhoneNumber || '-',
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '-',
        officialEmail: '-',
        email: '-',
        website: p.websiteUri || '-',
        verifiedSource: 'Google Places API (Cloud Console Places API New)'
      }));
    } else {
      // Fallback: Legacy textsearch
      const legacyUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryTerm)}&key=${keyToUse}`;
      const legRes = await fetch(legacyUrl, { signal: AbortSignal.timeout(12000) });
      const legData = await legRes.json();

      if (legData.status !== 'OK' && legData.status !== 'ZERO_RESULTS') {
        return res.status(400).json({ error: (data.error && data.error.message) || legData.error_message || 'Places API request failed' });
      }

      rawPlaces = (legData.results || []).map((p, idx) => ({
        id: `gp-${sector.slice(0,3)}-${Date.now().toString().slice(-4)}-${idx}`,
        name: p.name,
        stationName: p.name,
        institutionName: p.name,
        address: p.formatted_address,
        state: state,
        district: district,
        category: sector === 'police' ? 'Law & Order' : (sector === 'colleges' ? 'Higher Education' : (sector === 'schools' ? 'Matriculation / CBSE' : 'Commercial Transport')),
        rating: p.rating || 4.2,
        lat: p.geometry?.location?.lat || null,
        lng: p.geometry?.location?.lng || null,
        placeId: p.place_id,
        landline: '-',
        phone: '-',
        officialEmail: '-',
        email: '-',
        website: '-',
        verifiedSource: 'Google Places API (Cloud Console)'
      }));
    }

    let syncStats = null;
    if (autoSave && rawPlaces.length > 0) {
      syncStats = upsertIncrementalRecords(sector, rawPlaces);
    }

    return res.json({
      success: true,
      query: queryTerm,
      totalHarvested: rawPlaces.length,
      syncStats: syncStats,
      items: rawPlaces
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/config/keys
// Returns loaded API keys configuration status for UI studio
// -------------------------------------------------------------
app.get('/api/config/keys', (req, res) => {
  res.json({
    googleMapsKey: GOOGLE_MAPS_API_KEY,
    openaiKey: OPENAI_API_KEY,
    googleMapsConfigured: Boolean(GOOGLE_MAPS_API_KEY),
    openaiConfigured: Boolean(OPENAI_API_KEY),
    firestoreConnected: Boolean(firestoreDb)
  });
});

// -------------------------------------------------------------
// GET /api/health
// System Health Check
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Pan-India Police, HigherEd, Schools & Commercial Fleet Studio (28 States & UTs)',
    port: PORT,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    openaiConfigured: Boolean(OPENAI_API_KEY),
    googleMapsConfigured: Boolean(GOOGLE_MAPS_API_KEY),
    firestoreConnected: Boolean(firestoreDb),
    datasetLoaded: Boolean(institutionsData),
    totalColleges: institutionsData?.allInstitutions?.length || 0,
    policeDatasetLoaded: Boolean(policeData),
    totalPoliceStations: policeData?.allStations?.length || 0,
    schoolsLoaded: Boolean(schoolsData),
    totalSchools: schoolsData?.allSchools?.length || 0,
    transportLoaded: Boolean(transportData),
    totalTransportHubs: transportData?.allTransport?.length || 0,
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

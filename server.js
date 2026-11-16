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
// -------------------------------------------------------------
app.post('/api/email/send', async (req, res) => {
  try {
    const {
      to = DEFAULT_TO_EMAIL,
      cc = DEFAULT_CC_EMAIL,
      subject,
      body,
      collegeName,
      principalName
    } = req.body;

    const targetTo = to || DEFAULT_TO_EMAIL;
    const targetCc = cc || DEFAULT_CC_EMAIL;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required.' });
    }

    // Deliverability & Spam Analysis
    const spamReport = analyzeSpamRisk(subject, body);

    // Ensure CAN-SPAM compliant footer with NUNES physical address & opt-out
    let finalBody = body;
    if (!finalBody.includes('NUNES Instruments') || !finalBody.includes('Coimbatore')) {
      finalBody += `\n\n---\nNUNES Instruments\nPremier Laboratory Test Equipment & Educational Solutions\nDoor No. 124, 7th Street, Gandhipuram, Coimbatore - 641012, Tamil Nadu, India.\nDirect Line / WhatsApp: +91 94871 23456 | Official Email: nunescbe@gmail.com\nWeb: https://www.nunesinstruments.com\n\nNote: This email was sent regarding academic laboratory solutions. If received in error or you wish to opt out, reply with 'Unsubscribe' and your address will be excluded immediately.`;
    }

    if (!emailTransporter) {
      return res.status(500).json({
        error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS in .env'
      });
    }

    // Convert plain text to deliverability-optimized Branded HTML Template (Matching Nunes Official Format)
    const collegeTitle = collegeName || 'Coimbatore Higher Education Institutions';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Top Blue Gradient Header -->
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; background: #ffffff; padding: 4px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.15); margin-bottom: 10px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #0f172a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; border: 2px solid #facc15;">
                N
              </div>
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">Nunes Instrumentation</h1>
            <p style="margin: 3px 0 0; font-size: 12px; font-weight: 500; color: #bfdbfe; font-style: italic;">ISO 9001:2015 Certified Company</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #e2e8f0;">Importer &amp; Exporter of High Precision Instruments</p>
          </div>

          <!-- Approved & Certified Badges -->
          <div style="padding: 12px 16px; background: #ffffff; border-bottom: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Certified &amp; Approved By</p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="display: inline-block; padding: 4px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 700; color: #1e293b;">⭐ GeM Registered</span>
              <span style="display: inline-block; padding: 4px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 700; color: #1e293b;">🏢 MSME Govt. of India</span>
              <span style="display: inline-block; padding: 4px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 700; color: #1e293b;">🏅 ISO 9001:2015</span>
            </div>
          </div>

          <!-- Section Banner -->
          <div style="background: #1e40af; color: #ffffff; padding: 10px 16px; text-align: center; font-size: 13px; font-weight: 700;">
            🛡️ Campus Safety &amp; Laboratory Solutions — ${collegeTitle}
          </div>

          <!-- Main Body -->
          <div style="padding: 22px 20px 16px;">
            <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0f172a;">Dear Sir / Madam (Principal / Dean / Security &amp; Lab Director),</p>
            <p style="margin: 0 0 14px; font-size: 13px; line-height: 1.6; color: #334155;">
              We are <strong>Importers and Exporters</strong> specializing in <strong>High Precision Instruments &amp; Campus Safety Equipment</strong> based in Coimbatore. For ${collegeTitle}, we are pleased to present our comprehensive <strong>14-Model Breath Analyser &amp; Alcohol Screening Range</strong>.
            </p>

            <!-- Blue Box Key Highlights -->
            <div style="background: #f0f7ff; border: 1px solid #bae6fd; border-left: 4px solid #0284c7; border-radius: 10px; padding: 14px; margin: 16px 0;">
              <p style="margin: 0 0 10px; font-size: 12px; font-weight: 800; color: #0369a1;">📋 Institutional Advantages &amp; Specifications:</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.7; color: #1e293b;">
                <li>✅ <strong>Rapid Gate Screening Batons (Baton 01 &amp; 02):</strong> Instant non-contact breath detection with light indicator for main gates, hostel security &amp; campus checkpoints.</li>
                <li>✅ <strong>Evidential Testers with Thermal Printers (AT-9000 / 333-T):</strong> Camera photo capture with instant timestamped printed slips for official administrative &amp; disciplinary records.</li>
                <li>✅ <strong>Handheld Digital Testers (Models 03–08):</strong> Multi-unit digital LCD displays with precise mg/L and BAC% readouts.</li>
                <li>🚚 <strong>Ready Stock in Coimbatore:</strong> Fast local dispatch and direct delivery across Coimbatore colleges.</li>
                <li>🛡️ <strong>1-Year Warranty &amp; Calibration Certificate:</strong> Traceable calibration certificates supplied with every unit.</li>
                <li>📹 <strong>Free Live Campus Demo:</strong> Technical demonstration available at your campus premises.</li>
              </ul>
            </div>

            <p style="margin: 0 0 14px; font-size: 13px; line-height: 1.6; color: #334155;">
              Please find our detailed 14-product catalogue (<strong>Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf</strong>) attached with individual product QR codes.
            </p>

            <!-- Executive Contacts -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 10px; padding: 14px; margin: 16px 0;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: #1e3a8a;">Nunes Instrumentation</p>
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Technical Sales &amp; Purchase Executives:</p>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr>
                  <td style="padding: 3px 0; color: #334155;">📞 <strong>Shaeein</strong></td>
                  <td style="padding: 3px 0; font-family: monospace; font-weight: 700;"><a href="tel:+919500238556" style="color: #2563eb; text-decoration: none;">+91 95002 38556</a></td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #334155;">📞 <strong>Geetha</strong></td>
                  <td style="padding: 3px 0; font-family: monospace; font-weight: 700;"><a href="tel:+919498442690" style="color: #2563eb; text-decoration: none;">+91 94984 42690</a></td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #334155;">📞 <strong>Naveena</strong></td>
                  <td style="padding: 3px 0; font-family: monospace; font-weight: 700;"><a href="tel:+917373964350" style="color: #2563eb; text-decoration: none;">+91 73739 64350</a></td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #334155;">📞 <strong>S.F. Nunes</strong></td>
                  <td style="padding: 3px 0; font-family: monospace; font-weight: 700;"><a href="tel:+918940944000" style="color: #2563eb; text-decoration: none;">+91 89409 44000</a></td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 20px 0;">
              <a href="mailto:nunescbe@gmail.com?cc=nunesalcotest@gmail.com&subject=Quotation%20and%20Demo%20Request%20-%20Nunes%20Breath%20Analyser" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 25px; font-size: 13px; font-weight: 700;">
                ✉️ Send Your Quotation / Demo Request
              </a>
            </div>

            <!-- About Section -->
            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              <h4 style="margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #0f172a;">About Nunes Instrumentation</h4>
              <p style="margin: 0 auto; font-size: 11px; line-height: 1.5; color: #64748b; max-width: 480px;">
                Established with a vision to supply reliable, cutting-edge precision instruments across various industries, we stand for trust, quality, and technical excellence. Our customer-first approach ensures tailored solutions for every client.
              </p>
              <div style="margin: 12px 0 8px;">
                <span style="font-size: 12px; font-weight: 800; color: #eab308;">⭐ 4.7 / 5.0 Customer Rating</span>
                <p style="margin: 4px 0 2px; font-size: 11px; color: #64748b;">Hear from our happy clients:</p>
                <a href="https://www.google.com/search?q=Nunes+Instrumentation+Coimbatore" style="font-size: 11px; font-weight: 700; color: #2563eb; text-decoration: none;">
                  🌐 Visit Our Google Business Profile
                </a>
              </div>
            </div>

          </div>

          <!-- Corporate Navy Footer -->
          <div style="background: #1e3a8a; color: #ffffff; padding: 16px 18px; text-align: center; font-size: 10px; line-height: 1.5;">
            <p style="margin: 0 0 3px; font-weight: 600;">NUNES INSTRUMENTATION</p>
            <p style="margin: 0 0 6px; color: #cbd5e1;">
              11-A, 2nd Cross, Sundarar Street, Opp. to LaLa Mahall, Nalvar Layout, Rathinapuri, Coimbatore – 641027, Tamil Nadu, India.
            </p>
            <p style="margin: 0 0 3px; color: #93c5fd;">
              © 2026 Nunes Instrumentation. All rights reserved.
            </p>
            <p style="margin: 0; color: #94a3b8;">
              You're receiving this email due to institutional academic interactions. To unsubscribe, reply with "Unsubscribe".
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"NUNES Instruments" <${SMTP_USER}>`,
      to: targetTo,
      cc: targetCc,
      replyTo: 'nunescbe@gmail.com',
      subject: subject,
      text: finalBody,
      html: htmlBody,
      headers: {
        'X-Entity-Ref-ID': `nunes-highered-${Date.now()}`,
        'X-Mailer': 'NUNES-HigherEd-Outreach-v2'
      }
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`[Email Sent] Message ID: ${info.messageId} | To: ${targetTo} | CC: ${targetCc}`);

    return res.json({
      success: true,
      messageId: info.messageId,
      to: targetTo,
      cc: targetCc,
      spamReport: spamReport,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Email Send Error]', err);
    return res.status(500).json({ error: err.message });
  }
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
    appName: 'TN & Kerala HigherEd Directory & AI Sales Agent Studio',
    port: PORT,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    openaiConfigured: Boolean(OPENAI_API_KEY),
    datasetLoaded: Boolean(institutionsData),
    totalColleges: institutionsData?.allInstitutions?.length || 0,
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

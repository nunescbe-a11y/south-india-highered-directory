const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
let PORT = parseInt(process.env.PORT, 10) || 3005;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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

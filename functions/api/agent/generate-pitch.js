export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const { productName, productAdDetails, userGoal, specialOffer, targetSummary } = body;
    
    const pName = productName || 'Institutional Equipment & Laboratory Solutions';
    const pDetails = productAdDetails || 'Precision measurement, engineering lab instruments, and educational testing kits.';
    const pGoal = userGoal || 'Schedule an on-campus demonstration and secure annual lab procurement vendor registration.';
    const pOffer = specialOffer || '15% institutional discount for educational trusts and NAAC/NBA accredited departments.';
    const pTarget = targetSummary || 'Colleges & Universities in Tamil Nadu and Kerala';

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

    return new Response(JSON.stringify(fallbackPitch), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

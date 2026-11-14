export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const {
      college,
      productName,
      productAdDetails,
      specialOffer,
      chatHistory,
      latestPrincipalMessage
    } = body;

    const colName = college?.name || 'College';
    const principal = college?.principalName || 'Principal';
    const district = college?.locality || college?.areaZone || 'Tamil Nadu';
    const query = latestPrincipalMessage || (chatHistory && chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].text : 'Please share pricing and details.');
    const pName = productName || 'Lab Test Equipment';

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

    return new Response(JSON.stringify({
      reply: replyText,
      suggestedStage: stage,
      conversionScore: score,
      nextAction: nextAction
    }), {
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

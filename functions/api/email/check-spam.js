export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const { subject, body: emailBody } = body;

    let score = 100;
    const warnings = [];
    const passes = [];

    const spamWords = [
      '100% free', 'free gift', 'guaranteed', 'act now', 'urgent', 'limited time',
      'earn money', 'make money', 'cash prize', 'winner', 'risk-free', 'no cost',
      'pure profit', 'instant access', 'click here now', 'exclusive deal', 'free demo'
    ];

    const sub = (subject || '').trim();
    const txt = (emailBody || '').trim();

    if (sub.length < 10) {
      score -= 10;
      warnings.push('Subject is very short (<10 chars).');
    } else if (sub.length > 70) {
      score -= 10;
      warnings.push('Subject length >70 chars.');
    } else {
      passes.push('Subject length is optimal (20-65 chars).');
    }

    const subUpper = sub.replace(/[^A-Za-z]/g, '');
    if (subUpper.length > 5 && subUpper === subUpper.toUpperCase()) {
      score -= 25;
      warnings.push('Subject is in ALL CAPS.');
    } else {
      passes.push('Subject casing is natural and professional.');
    }

    if ((sub.match(/!/g) || []).length > 0) {
      score -= 15;
      warnings.push('Avoid exclamation marks in subject line.');
    } else {
      passes.push('Zero exclamation marks in subject line.');
    }

    const combined = (sub + ' ' + txt).toLowerCase();
    const found = spamWords.filter(w => combined.includes(w));
    if (found.length > 0) {
      score -= Math.min(30, found.length * 10);
      warnings.push(`Spam keywords: "${found.join('", "')}".`);
    } else {
      passes.push('Clean vocabulary: No blacklisted spam buzzwords.');
    }

    if (txt.includes('Coimbatore') || txt.includes('Tamil Nadu') || txt.includes('Gandhipuram')) {
      passes.push('Physical postal address included (CAN-SPAM).');
    } else {
      score -= 10;
      warnings.push('Missing corporate physical address in signature.');
    }

    if (txt.toLowerCase().includes('unsubscribe') || txt.toLowerCase().includes('opt out')) {
      passes.push('Clear opt-out / unsubscribe notice included.');
    } else {
      score -= 15;
      warnings.push('Missing opt-out notice.');
    }

    return new Response(JSON.stringify({
      score: Math.max(30, Math.min(100, score)),
      verdict: score >= 90 ? 'Inbox Safe (Excellent)' : score >= 75 ? 'Moderate Deliverability' : 'High Spam Risk',
      warnings,
      passes
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

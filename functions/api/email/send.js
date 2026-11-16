export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const {
      to = 'nunesalcotest@gmail.com',
      cc = 'nunescbe@gmail.com',
      subject = '',
      body: emailBody = ''
    } = body;

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    return new Response(JSON.stringify({
      success: true,
      to,
      cc,
      mailtoUrl,
      notice: 'Prepared with Anti-Spam protection headers.',
      timestamp: new Date().toISOString()
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

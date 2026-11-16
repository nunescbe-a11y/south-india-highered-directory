export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    defaultTo: 'nunesalcotest@gmail.com',
    defaultCc: 'nunescbe@gmail.com',
    smtpUser: 'nuneslead@gmail.com',
    smtpConfigured: true
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

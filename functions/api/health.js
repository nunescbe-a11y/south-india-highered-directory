export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    status: 'online',
    platform: 'Cloudflare Pages & Edge Functions',
    appName: 'TN & Kerala HigherEd Directory & AI Sales Agent Studio',
    totalColleges: 4990,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

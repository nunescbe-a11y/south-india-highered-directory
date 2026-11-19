async function test() {
  const res = await fetch('http://localhost:3005/api/agent/quick-followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetName: 'Coimbatore Central Police Station',
      targetType: 'Police',
      query: 'Need demo for inspector interceptor unit'
    })
  });
  const data = await res.json();
  console.log('API Response:', JSON.stringify(data, null, 2));
}

test();

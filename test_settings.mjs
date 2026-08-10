const run = async () => {
  const loginRes = await fetch('https://hodls-admissions.vercel.app/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: 'admin', password: 'admin123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login:', await loginRes.json());
  console.log('Cookie:', cookie);

  const updateRes = await fetch('https://hodls-admissions.vercel.app/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ action: 'updateParentEditSettings', enabled: false, deadline: '2026-08-31T23:59:59.000Z' })
  });
  console.log('Update:', await updateRes.json());
};
run().catch(console.error);

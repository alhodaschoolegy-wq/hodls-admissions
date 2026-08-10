fetch('https://hodls-admissions.vercel.app/api/test').then(async r => { const d = await r.json(); console.log('KEYS:', Object.keys(d.env)); }).catch(console.error);

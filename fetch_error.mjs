fetch('https://hodls-admissions.vercel.app/api?action=stats').then(async r => { console.log('STATUS:', r.status); console.log('BODY:', await r.text()); }).catch(console.error);

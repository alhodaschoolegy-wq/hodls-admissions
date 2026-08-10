process.env.JWT_SECRET = 'test';
process.env.SUPABASE_URL = 'https://example.com';
process.env.SUPABASE_ANON_KEY = 'test';

import handler from './api/index.js';

const req = {
  method: 'GET',
  headers: { origin: 'http://localhost:3000' },
  query: { action: 'stats' }
};
const res = {
  setHeader: (k, v) => console.log('setHeader', k, v),
  status: (code) => ({
    json: (data) => console.log('status', code, 'json', data)
  })
};

async function run() {
  try {
    await handler(req, res);
    console.log('Handler executed successfully!');
  } catch (err) {
    console.error('CRASH DURING HANDLER:', err);
  }
}
run();

process.env.JWT_SECRET = 'test';
process.env.SUPABASE_URL = 'https://example.com';
process.env.SUPABASE_ANON_KEY = 'test';

async function run() {
  try {
    await import('./api/index.js');
    console.log('Successfully imported api/index.js without crashing!');
  } catch (err) {
    console.error('CRASH DURING IMPORT:', err);
  }
}
run();

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase.from('school_settings').upsert({
  id: 'current_settings',
  parent_edits_enabled: false,
  parent_edit_deadline: '2026-08-31T23:59:59.000Z',
  updated_at: new Date().toISOString(),
}, { onConflict: 'id' }).select();

console.log('DATA:', data);
console.log('ERROR:', error);

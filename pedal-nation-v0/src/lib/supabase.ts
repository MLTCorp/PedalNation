import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = (supabaseUrl && supabaseKey && browser)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

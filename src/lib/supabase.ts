import { createBrowserClient } from '@supabase/ssr';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

/**
 * Browser-side Supabase client.
 * Use this in client-only code (components, client-side load functions).
 */
export const supabase = createBrowserClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);

export type { Session, User } from '@supabase/supabase-js';

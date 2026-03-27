import { createServerClient } from '@supabase/ssr';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';

/**
 * Server-side Supabase client with cookie-based session support.
 * Use this in server load functions and API routes.
 */
export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });
}

/**
 * Server-side Supabase admin client with service role key.
 * Bypasses RLS - use only in trusted server contexts.
 */
export function createSupabaseAdminClient() {
  return createServerClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op for admin client
      }
    }
  });
}

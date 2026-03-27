import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * OAuth callback route for PKCE flow.
 * Exchanges the authorization code for a session and redirects the user.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/builder';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Redirect to the intended destination after successful auth
			redirect(303, next);
		}
	}

	// If no code or exchange failed, redirect to login with error
	redirect(303, '/auth/login?error=auth_callback_failed');
};

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Logout route: signs out the user and redirects to home.
 * Supports both GET and POST to be called as a form action or direct link.
 */
export const GET: RequestHandler = async ({ locals: { supabase } }) => {
	await supabase.auth.signOut();
	redirect(303, '/');
};

export const POST: RequestHandler = async ({ locals: { supabase } }) => {
	await supabase.auth.signOut();
	redirect(303, '/');
};

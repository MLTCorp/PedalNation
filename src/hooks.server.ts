import { createServerClient } from '@supabase/ssr';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const adminGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path.startsWith('/admin')) {
		const { session, user } = await event.locals.safeGetSession();

		if (!session || !user) {
			throw redirect(303, `/auth/login?next=/admin`);
		}

		// Check admin role from users table
		const { data: userData } = await event.locals.supabase
			.from('users')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!userData || userData.role !== 'admin') {
			throw redirect(303, `/auth/login?next=/admin`);
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, adminGuard);

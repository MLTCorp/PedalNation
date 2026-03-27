import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	// Verify user is authenticated
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: {
		name: string;
		description?: string;
		is_public?: boolean;
		board_type?: string;
		canvas_data: unknown;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 422 });
	}

	// Validation
	if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
		return json({ error: 'name is required and must be a non-empty string' }, { status: 422 });
	}

	if (body.canvas_data === undefined || body.canvas_data === null) {
		return json({ error: 'canvas_data is required' }, { status: 422 });
	}

	if (body.name.trim().length > 255) {
		return json({ error: 'name must be 255 characters or less' }, { status: 422 });
	}

	const { data, error } = await supabase
		.from('user_boards')
		.insert({
			user_id: user.id,
			name: body.name.trim(),
			description: body.description ?? null,
			is_public: body.is_public ?? false,
			board_type: body.board_type ?? 'custom',
			canvas_data: body.canvas_data
		})
		.select('id, name, description, is_public, board_type, created_at, updated_at')
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ board: data }, { status: 201 });
};

export const GET: RequestHandler = async ({ cookies, url }) => {
	const supabase = createSupabaseServerClient(cookies);

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0);

	const { data, error, count } = await supabase
		.from('user_boards')
		.select('id, name, description, is_public, board_type, created_at, updated_at', {
			count: 'exact'
		})
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ boards: data ?? [], total: count ?? 0 });
};

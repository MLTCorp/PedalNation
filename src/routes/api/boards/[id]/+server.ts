import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const { id } = params;

	// Allow loading public boards without auth, and user's own boards with auth
	const {
		data: { user }
	} = await supabase.auth.getUser();

	// First fetch the board regardless of visibility
	const { data: board, error } = await supabase
		.from('user_boards')
		.select(
			'id, name, description, is_public, board_type, canvas_data, created_at, updated_at, user_id'
		)
		.eq('id', id)
		.single();

	if (error || !board) {
		return json({ error: 'Board not found' }, { status: 404 });
	}

	// Access control: public boards are accessible to all; private boards only to owner
	if (!board.is_public) {
		if (!user || user.id !== board.user_id) {
			return json({ error: 'Access denied' }, { status: 403 });
		}
	}

	const headers: Record<string, string> = {};
	// Only cache public boards
	if (board.is_public) {
		headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300';
	}

	return json({ board }, { headers });
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const { id } = params;

	// Verify user is authenticated
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: {
		name?: string;
		description?: string;
		is_public?: boolean;
		board_type?: string;
		canvas_data?: unknown;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 422 });
	}

	// Verify ownership
	const { data: existing } = await supabase
		.from('user_boards')
		.select('id, user_id')
		.eq('id', id)
		.single();

	if (!existing) {
		return json({ error: 'Board not found' }, { status: 404 });
	}

	if (existing.user_id !== user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	const updatePayload: Record<string, unknown> = {
		updated_at: new Date().toISOString()
	};

	if (body.name !== undefined) updatePayload.name = body.name;
	if (body.description !== undefined) updatePayload.description = body.description;
	if (body.is_public !== undefined) updatePayload.is_public = body.is_public;
	if (body.board_type !== undefined) updatePayload.board_type = body.board_type;
	if (body.canvas_data !== undefined) updatePayload.canvas_data = body.canvas_data;

	const { data, error: updateError } = await supabase
		.from('user_boards')
		.update(updatePayload)
		.eq('id', id)
		.eq('user_id', user.id)
		.select('id, name, description, is_public, board_type, created_at, updated_at')
		.single();

	if (updateError) {
		return json({ error: updateError.message }, { status: 500 });
	}

	return json({ board: data });
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const { id } = params;

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check board exists first
	const { data: existing } = await supabase
		.from('user_boards')
		.select('id, user_id')
		.eq('id', id)
		.single();

	if (!existing) {
		return json({ error: 'Board not found' }, { status: 404 });
	}

	if (existing.user_id !== user.id) {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	const { error: deleteError } = await supabase
		.from('user_boards')
		.delete()
		.eq('id', id)
		.eq('user_id', user.id);

	if (deleteError) {
		return json({ error: deleteError.message }, { status: 500 });
	}

	return json({ success: true });
};

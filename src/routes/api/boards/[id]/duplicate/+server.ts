import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const POST: RequestHandler = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	// Verify user is authenticated
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	// Fetch the original board (can be public or own)
	const { data: original, error: fetchError } = await supabase
		.from('user_boards')
		.select('id, name, description, board_type, canvas_data, is_public, user_id')
		.eq('id', id)
		.or(`user_id.eq.${user.id},is_public.eq.true`)
		.single();

	if (fetchError || !original) {
		return json({ error: 'Board not found or access denied' }, { status: 404 });
	}

	// Create duplicate — never modify original
	const { data: duplicate, error: insertError } = await supabase
		.from('user_boards')
		.insert({
			user_id: user.id,
			name: `Cópia de ${original.name}`,
			description: original.description ?? null,
			is_public: false,
			board_type: original.board_type ?? 'custom',
			canvas_data: original.canvas_data
		})
		.select('id, name, description, is_public, board_type, created_at, updated_at')
		.single();

	if (insertError || !duplicate) {
		return json({ error: insertError?.message ?? 'Failed to duplicate board' }, { status: 500 });
	}

	return json({ board: duplicate }, { status: 201 });
};

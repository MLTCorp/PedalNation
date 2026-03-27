import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);
	const { username } = params;

	// Get current session
	const {
		data: { user: sessionUser }
	} = await supabase.auth.getUser();

	// Find the profile user by username
	const { data: profileUser, error: userError } = await supabase
		.from('users')
		.select('id, username, display_name, avatar_url, created_at')
		.eq('username', username)
		.single();

	if (userError || !profileUser) {
		throw error(404, 'Usuário não encontrado');
	}

	const isOwner = sessionUser?.id === profileUser.id;

	// Fetch boards — all if owner, only public if visitor
	let boardsQuery = supabase
		.from('user_boards')
		.select('id, name, description, is_public, thumbnail_url, canvas_data, created_at, updated_at')
		.eq('user_id', profileUser.id)
		.order('updated_at', { ascending: false });

	if (!isOwner) {
		boardsQuery = boardsQuery.eq('is_public', true);
	}

	const { data: boards, error: boardsError } = await boardsQuery;

	if (boardsError) {
		throw error(500, 'Erro ao carregar boards');
	}

	// Compute pedal count per board from canvas_data
	const boardsWithCount = (boards ?? []).map((board) => {
		let pedalCount = 0;
		try {
			const canvas = board.canvas_data as { nodes?: unknown[] } | null;
			pedalCount = canvas?.nodes?.length ?? 0;
		} catch {
			pedalCount = 0;
		}
		return { ...board, pedalCount };
	});

	return {
		profileUser,
		boards: boardsWithCount,
		isOwner,
		sessionUser: sessionUser
			? {
					id: sessionUser.id,
					email: sessionUser.email
				}
			: null
	};
};

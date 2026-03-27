import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);
	const { id } = params;

	// Get current session
	const {
		data: { user: sessionUser }
	} = await supabase.auth.getUser();

	// Fetch the board (must be public)
	const { data: board, error: boardError } = await supabase
		.from('user_boards')
		.select(
			`id, name, description, is_public, thumbnail_url, canvas_data, created_at, updated_at, user_id,
			 users!user_boards_user_id_fkey(username, display_name, avatar_url)`
		)
		.eq('id', id)
		.eq('is_public', true)
		.single();

	if (boardError || !board) {
		throw error(404, 'Board não encontrado');
	}

	// Increment views_count — fire and forget
	void supabase.rpc('increment_board_views', { board_id: id }).then(() => {});
	// Fallback: direct update if RPC doesn't exist
	// void supabase.from('user_boards').update({ views_count: board.views_count + 1 }).eq('id', id);

	// Extract pedal IDs from canvas_data nodes
	let pedalIds: string[] = [];
	try {
		const canvas = board.canvas_data as { nodes?: { data?: { pedalId?: string } }[] } | null;
		pedalIds = (canvas?.nodes ?? [])
			.map((n) => n?.data?.pedalId)
			.filter((id): id is string => Boolean(id));
	} catch {
		pedalIds = [];
	}

	// Fetch pedals with affiliate links
	let pedals: {
		id: string;
		name: string;
		brand: string;
		image_url: string | null;
		affiliateLinks: { id: string; url: string; store_name: string; is_primary: boolean }[];
	}[] = [];

	if (pedalIds.length > 0) {
		const { data: pedalRows } = await supabase
			.from('pedals')
			.select('id, name, brand, image_url, slug')
			.in('id', pedalIds);

		if (pedalRows && pedalRows.length > 0) {
			const { data: linksRows } = await supabase
				.from('affiliate_links')
				.select('id, pedal_id, url, store_name, is_primary')
				.in('pedal_id', pedalIds)
				.eq('is_active', true);

			pedals = pedalRows.map((p) => ({
				id: p.id,
				name: p.name,
				brand: p.brand,
				image_url: p.image_url ?? null,
				affiliateLinks: (linksRows ?? [])
					.filter((l) => l.pedal_id === p.id)
					.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
			}));
		}
	}

	const userRow = Array.isArray(board.users) ? board.users[0] : board.users;
	const authorUsername = (userRow as { username?: string; display_name?: string; avatar_url?: string } | null)?.username ?? 'anônimo';
	const authorDisplayName = (userRow as { username?: string; display_name?: string; avatar_url?: string } | null)?.display_name ?? null;
	const authorAvatarUrl = (userRow as { username?: string; display_name?: string; avatar_url?: string } | null)?.avatar_url ?? null;

	return {
		board: {
			id: board.id,
			name: board.name,
			description: board.description ?? null,
			thumbnail_url: board.thumbnail_url ?? null,
			created_at: board.created_at,
			updated_at: board.updated_at,
			user_id: board.user_id
		},
		author: {
			username: authorUsername,
			display_name: authorDisplayName,
			avatar_url: authorAvatarUrl
		},
		pedals,
		isLoggedIn: Boolean(sessionUser),
		isOwner: sessionUser?.id === board.user_id
	};
};

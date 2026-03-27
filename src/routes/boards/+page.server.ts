import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

const PAGE_SIZE = 12;

export const load: PageServerLoad = async ({ cookies, url }) => {
	const supabase = createSupabaseServerClient(cookies);

	// Initial page load — fetch first 12
	const { data: boards, error } = await supabase
		.from('user_boards')
		.select(
			`id, name, thumbnail_url, canvas_data, created_at, updated_at,
			 users!user_boards_user_id_fkey(username, display_name)`
		)
		.eq('is_public', true)
		.order('created_at', { ascending: false })
		.range(0, PAGE_SIZE - 1);

	if (error) {
		return { boards: [], hasMore: false };
	}

	// Map to safe shape
	const mapped = (boards ?? []).map((b) => {
		let pedalCount = 0;
		try {
			const canvas = b.canvas_data as { nodes?: unknown[] } | null;
			pedalCount = canvas?.nodes?.length ?? 0;
		} catch {
			pedalCount = 0;
		}

		const userRow = Array.isArray(b.users) ? b.users[0] : b.users;
		return {
			id: b.id,
			name: b.name,
			thumbnail_url: b.thumbnail_url ?? null,
			created_at: b.created_at,
			updated_at: b.updated_at,
			pedalCount,
			username: (userRow as { username?: string; display_name?: string } | null)?.username ?? 'anônimo',
			display_name: (userRow as { username?: string; display_name?: string } | null)?.display_name ?? null
		};
	});

	// Check if there are more boards
	const { count } = await supabase
		.from('user_boards')
		.select('id', { count: 'exact', head: true })
		.eq('is_public', true);

	const hasMore = (count ?? 0) > PAGE_SIZE;

	return {
		boards: mapped,
		totalCount: count ?? 0,
		hasMore
	};
};

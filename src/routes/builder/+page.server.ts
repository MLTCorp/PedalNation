import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const boardId = url.searchParams.get('board');

	if (!boardId) {
		return { board: null };
	}

	const supabase = createSupabaseServerClient(cookies);

	const {
		data: { user }
	} = await supabase.auth.getUser();

	let query = supabase
		.from('user_boards')
		.select('id, name, description, is_public, board_type, canvas_data, user_id')
		.eq('id', boardId);

	if (user) {
		query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
	} else {
		query = query.eq('is_public', true);
	}

	const { data, error } = await query.single();

	if (error || !data) {
		return { board: null };
	}

	return { board: data };
};

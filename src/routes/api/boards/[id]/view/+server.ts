import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/supabase-server';

// POST /api/boards/[id]/view — increments views_count (fire-and-forget)
export const POST: RequestHandler = async ({ params }) => {
	const { id } = params;

	// Use admin client to bypass RLS for counter increment
	const supabase = createSupabaseAdminClient();

	// Try RPC first, fall back to raw update
	const { error: rpcError } = await supabase.rpc('increment_board_views', { board_id: id });

	if (rpcError) {
		// Fallback: fetch current count and increment
		const { data: board } = await supabase
			.from('user_boards')
			.select('views_count')
			.eq('id', id)
			.single();

		if (board !== null) {
			const currentViews = (board as { views_count?: number } | null)?.views_count ?? 0;
			await supabase
				.from('user_boards')
				.update({ views_count: currentViews + 1 })
				.eq('id', id);
		}
	}

	return json({ ok: true });
};

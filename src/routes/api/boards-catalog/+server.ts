import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const brand = url.searchParams.get('brand');
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '500', 10), 1000);
	const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0);

	let query = supabase
		.from('boards_catalog')
		.select('id, name, slug, brand, width_mm, height_mm, image_url, affiliate_url, is_active', {
			count: 'exact'
		})
		.eq('is_active', true)
		.range(offset, offset + limit - 1);

	if (brand) {
		query = query.eq('brand', brand);
	}

	query = query.order('brand', { ascending: true }).order('name', { ascending: true });

	const { data, error, count } = await query;

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(
		{ boards: data ?? [], total: count ?? 0 },
		{
			headers: {
				'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
			}
		}
	);
};

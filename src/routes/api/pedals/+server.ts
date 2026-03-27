import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const category = url.searchParams.get('category');
	const brand = url.searchParams.get('brand');
	const q = url.searchParams.get('q');
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 10000);
	const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0);

	let query = supabase
		.from('pedals')
		.select(
			'id, name, brand, category, subcategory, slug, image_url, thumbnail_url, width_mm, height_mm, depth_mm, specs, is_active',
			{ count: 'exact' }
		)
		.eq('is_active', true)
		.range(offset, offset + limit - 1);

	if (category) {
		query = query.eq('category', category);
	}

	if (brand) {
		query = query.eq('brand', brand);
	}

	if (q) {
		query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
	}

	query = query.order('brand', { ascending: true }).order('name', { ascending: true });

	const { data, error, count } = await query;

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(
		{ pedals: data ?? [], total: count ?? 0 },
		{
			headers: {
				'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
			}
		}
	);
};

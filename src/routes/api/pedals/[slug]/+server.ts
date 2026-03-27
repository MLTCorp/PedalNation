import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const { slug } = params;

	// Support both slug (string) and UUID (id) lookups for backwards compatibility
	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

	let pedalQuery = supabase
		.from('pedals')
		.select(
			'id, name, slug, brand, category, image_url, thumbnail_url, width_mm, height_mm, depth_mm, weight_g, specs, description, meta_description, price_usd, is_active, created_at, updated_at'
		)
		.eq('is_active', true);

	if (isUuid) {
		pedalQuery = pedalQuery.eq('id', slug);
	} else {
		pedalQuery = pedalQuery.eq('slug', slug);
	}

	const { data: pedal, error: pedalError } = await pedalQuery.single();

	if (pedalError || !pedal) {
		return json({ error: 'Pedal not found' }, { status: 404 });
	}

	const { data: affiliateLinks } = await supabase
		.from('affiliate_links')
		.select('id, store_name, url, affiliate_code, is_primary, is_active')
		.eq('pedal_id', pedal.id)
		.eq('is_active', true)
		.order('is_primary', { ascending: false });

	return json(
		{
			pedal,
			affiliate_links: affiliateLinks ?? []
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
			}
		}
	);
};

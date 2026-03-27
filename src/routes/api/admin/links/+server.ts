import { json } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const LinkSchema = z.object({
	pedal_id: z.string().uuid('Pedal inválido'),
	store_name: z.string().min(1, 'Nome da loja é obrigatório'),
	url: z.string().url('URL inválida').refine(v => v.startsWith('https://'), 'URL deve começar com https://'),
	affiliate_code: z.string().optional().default(''),
	region: z.enum(['br', 'us', 'global']).default('br'),
	is_primary: z.boolean().optional().default(false),
	is_active: z.boolean().optional().default(true)
});

export const GET: RequestHandler = async ({ url }) => {
	const supabase = createSupabaseAdminClient();

	const pedalSearch = url.searchParams.get('pedal') ?? '';
	const storeFilter = url.searchParams.get('store') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const offset = (page - 1) * limit;

	// Fetch links with pedal data and click counts
	let query = supabase
		.from('affiliate_links')
		.select(`
			id,
			pedal_id,
			store_name,
			url,
			affiliate_code,
			region,
			is_primary,
			is_active,
			created_at,
			pedals!inner(id, name, slug)
		`, { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (pedalSearch) {
		query = query.ilike('pedals.name', `%${pedalSearch}%`);
	}
	if (storeFilter) {
		query = query.eq('store_name', storeFilter);
	}

	const { data: links, error, count } = await query;

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	// Get click counts for each link
	const linkIds = (links ?? []).map((l: any) => l.id);
	let clickCounts: Record<string, number> = {};

	if (linkIds.length > 0) {
		const { data: clicks } = await supabase
			.from('link_clicks')
			.select('affiliate_link_id')
			.in('affiliate_link_id', linkIds);

		if (clicks) {
			for (const click of clicks) {
				clickCounts[click.affiliate_link_id] = (clickCounts[click.affiliate_link_id] ?? 0) + 1;
			}
		}
	}

	const linksWithClicks = (links ?? []).map((l: any) => ({
		...l,
		click_count: clickCounts[l.id] ?? 0
	}));

	return json({ links: linksWithClicks, total: count ?? 0, page, limit });
};

export const POST: RequestHandler = async ({ request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = LinkSchema.safeParse(body);
	if (!result.success) {
		return json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 });
	}

	const data = result.data;

	// If is_primary, deactivate other primary links for this pedal
	if (data.is_primary) {
		await supabase
			.from('affiliate_links')
			.update({ is_primary: false })
			.eq('pedal_id', data.pedal_id)
			.eq('is_primary', true);
	}

	const { data: link, error } = await supabase
		.from('affiliate_links')
		.insert({
			pedal_id: data.pedal_id,
			store_name: data.store_name,
			url: data.url,
			affiliate_code: data.affiliate_code || null,
			region: data.region,
			is_primary: data.is_primary ?? false,
			is_active: data.is_active ?? true
		})
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ link }, { status: 201 });
};

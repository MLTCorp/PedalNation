import { json } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';
import { z } from 'zod';

function generateSlug(name: string, brand: string): string {
	return `${brand}-${name}`
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

const PedalSchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	brand: z.string().min(1, 'Marca é obrigatória'),
	category: z.string().min(1, 'Categoria é obrigatória'),
	subcategory: z.string().optional().default(''),
	width_mm: z.coerce.number().positive().optional().nullable(),
	height_mm: z.coerce.number().positive().optional().nullable(),
	depth_mm: z.coerce.number().positive().optional().nullable(),
	voltage: z.string().optional().default(''),
	current_ma: z.coerce.number().optional().nullable(),
	bypass_type: z.string().optional().default(''),
	mono_stereo: z.string().optional().default(''),
	description: z.string().optional().default(''),
	history: z.string().optional().default(''),
	meta_title: z.string().optional().default(''),
	meta_desc: z.string().optional().default(''),
	keywords: z.string().optional().default(''),
	image_url: z.string().optional().default(''),
	thumbnail_url: z.string().optional().default(''),
	slug: z.string().optional(),
	is_active: z.boolean().optional().default(true)
});

export const GET: RequestHandler = async ({ url }) => {
	const supabase = createSupabaseAdminClient();

	const search = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const brand = url.searchParams.get('brand') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const offset = (page - 1) * limit;

	let query = supabase
		.from('pedals')
		.select('id, name, slug, brand, category, subcategory, is_active, thumbnail_url, image_url, width_mm, height_mm, depth_mm, voltage, current_ma, bypass_type, mono_stereo, description, history, meta_title, meta_desc, keywords, created_at', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (search) {
		query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
	}
	if (category) {
		query = query.eq('category', category);
	}
	if (brand) {
		query = query.ilike('brand', `%${brand}%`);
	}

	const { data, error, count } = await query;

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ pedals: data ?? [], total: count ?? 0, page, limit });
};

export const POST: RequestHandler = async ({ request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = PedalSchema.safeParse(body);
	if (!result.success) {
		return json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 });
	}

	const data = result.data;
	const baseSlug = data.slug || generateSlug(data.name, data.brand);

	// Ensure slug uniqueness
	let slug = baseSlug;
	let attempt = 0;
	while (true) {
		const { data: existing } = await supabase
			.from('pedals')
			.select('id')
			.eq('slug', slug)
			.single();
		if (!existing) break;
		attempt++;
		slug = `${baseSlug}-${attempt}`;
	}

	const { data: pedal, error } = await supabase
		.from('pedals')
		.insert({
			name: data.name,
			slug,
			brand: data.brand,
			category: data.category,
			subcategory: data.subcategory || null,
			width_mm: data.width_mm ?? null,
			height_mm: data.height_mm ?? null,
			depth_mm: data.depth_mm ?? null,
			voltage: data.voltage || null,
			current_ma: data.current_ma ?? null,
			bypass_type: data.bypass_type || null,
			mono_stereo: data.mono_stereo || null,
			description: data.description || null,
			history: data.history || null,
			meta_title: data.meta_title || null,
			meta_desc: data.meta_desc || null,
			keywords: data.keywords || null,
			image_url: data.image_url || null,
			thumbnail_url: data.thumbnail_url || null,
			is_active: data.is_active ?? true
		})
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ pedal }, { status: 201 });
};

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

const BoardSchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	brand: z.string().min(1, 'Marca é obrigatória'),
	width_mm: z.coerce.number().positive('Largura deve ser positiva'),
	height_mm: z.coerce.number().positive('Altura deve ser positiva'),
	image_url: z.string().optional().default(''),
	affiliate_url: z.string().optional().nullable(),
	is_active: z.boolean().optional().default(true),
	slug: z.string().optional()
});

export const GET: RequestHandler = async ({ url }) => {
	const supabase = createSupabaseAdminClient();

	const search = url.searchParams.get('q') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const offset = (page - 1) * limit;

	let query = supabase
		.from('boards_catalog')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (search) {
		query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
	}

	const { data, error, count } = await query;

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ boards: data ?? [], total: count ?? 0, page, limit });
};

export const POST: RequestHandler = async ({ request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = BoardSchema.safeParse(body);
	if (!result.success) {
		return json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 });
	}

	const data = result.data;
	const baseSlug = data.slug || generateSlug(data.name, data.brand);

	let slug = baseSlug;
	let attempt = 0;
	while (true) {
		const { data: existing } = await supabase
			.from('boards_catalog')
			.select('id')
			.eq('slug', slug)
			.single();
		if (!existing) break;
		attempt++;
		slug = `${baseSlug}-${attempt}`;
	}

	const { data: board, error } = await supabase
		.from('boards_catalog')
		.insert({
			name: data.name,
			slug,
			brand: data.brand,
			width_mm: data.width_mm,
			height_mm: data.height_mm,
			image_url: data.image_url || null,
			affiliate_url: data.affiliate_url || null,
			is_active: data.is_active ?? true
		})
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ board }, { status: 201 });
};

import { json } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const PedalUpdateSchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório').optional(),
	brand: z.string().min(1, 'Marca é obrigatória').optional(),
	category: z.string().min(1, 'Categoria é obrigatória').optional(),
	subcategory: z.string().optional().nullable(),
	width_mm: z.coerce.number().positive().optional().nullable(),
	height_mm: z.coerce.number().positive().optional().nullable(),
	depth_mm: z.coerce.number().positive().optional().nullable(),
	voltage: z.string().optional().nullable(),
	current_ma: z.coerce.number().optional().nullable(),
	bypass_type: z.string().optional().nullable(),
	mono_stereo: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	history: z.string().optional().nullable(),
	meta_title: z.string().optional().nullable(),
	meta_desc: z.string().optional().nullable(),
	keywords: z.string().optional().nullable(),
	image_url: z.string().optional().nullable(),
	thumbnail_url: z.string().optional().nullable(),
	slug: z.string().optional(),
	is_active: z.boolean().optional()
});

export const GET: RequestHandler = async ({ params }) => {
	const supabase = createSupabaseAdminClient();
	const { data, error } = await supabase
		.from('pedals')
		.select('*')
		.eq('id', params.id)
		.single();

	if (error || !data) {
		return json({ error: 'Pedal not found' }, { status: 404 });
	}

	return json({ pedal: data });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = PedalUpdateSchema.safeParse(body);
	if (!result.success) {
		return json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 });
	}

	const { data: pedal, error } = await supabase
		.from('pedals')
		.update({ ...result.data, updated_at: new Date().toISOString() })
		.eq('id', params.id)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ pedal });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const supabase = createSupabaseAdminClient();

	const { error } = await supabase
		.from('pedals')
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq('id', params.id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ success: true });
};

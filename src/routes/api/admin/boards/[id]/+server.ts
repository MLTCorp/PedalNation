import { json } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const BoardUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	brand: z.string().min(1).optional(),
	width_mm: z.coerce.number().positive().optional(),
	height_mm: z.coerce.number().positive().optional(),
	image_url: z.string().optional().nullable(),
	affiliate_url: z.string().optional().nullable(),
	is_active: z.boolean().optional(),
	slug: z.string().optional()
});

export const GET: RequestHandler = async ({ params }) => {
	const supabase = createSupabaseAdminClient();
	const { data, error } = await supabase
		.from('boards_catalog')
		.select('*')
		.eq('id', params.id)
		.single();

	if (error || !data) {
		return json({ error: 'Board not found' }, { status: 404 });
	}

	return json({ board: data });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = BoardUpdateSchema.safeParse(body);
	if (!result.success) {
		return json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 });
	}

	const { data: board, error } = await supabase
		.from('boards_catalog')
		.update(result.data)
		.eq('id', params.id)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ board });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const supabase = createSupabaseAdminClient();

	const { error } = await supabase
		.from('boards_catalog')
		.update({ is_active: false })
		.eq('id', params.id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ success: true });
};

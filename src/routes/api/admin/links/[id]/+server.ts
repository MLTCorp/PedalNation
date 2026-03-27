import { json } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const LinkUpdateSchema = z.object({
	pedal_id: z.string().uuid().optional(),
	store_name: z.string().min(1).optional(),
	url: z.string().url().refine(v => v.startsWith('https://'), 'URL deve começar com https://').optional(),
	affiliate_code: z.string().optional().nullable(),
	region: z.enum(['br', 'us', 'global']).optional(),
	is_primary: z.boolean().optional(),
	is_active: z.boolean().optional()
});

export const PUT: RequestHandler = async ({ params, request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = LinkUpdateSchema.safeParse(body);
	if (!result.success) {
		return json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 });
	}

	const data = result.data;

	// If setting as primary, get pedal_id first then deactivate others
	if (data.is_primary) {
		const { data: existing } = await supabase
			.from('affiliate_links')
			.select('pedal_id')
			.eq('id', params.id)
			.single();

		const pedalId = data.pedal_id ?? existing?.pedal_id;
		if (pedalId) {
			await supabase
				.from('affiliate_links')
				.update({ is_primary: false })
				.eq('pedal_id', pedalId)
				.eq('is_primary', true)
				.neq('id', params.id);
		}
	}

	const { data: link, error } = await supabase
		.from('affiliate_links')
		.update(data)
		.eq('id', params.id)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ link });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const supabase = createSupabaseAdminClient();

	const { error } = await supabase
		.from('affiliate_links')
		.delete()
		.eq('id', params.id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ success: true });
};

// Toggle active status
export const PATCH: RequestHandler = async ({ params, request }) => {
	const supabase = createSupabaseAdminClient();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { is_active } = body as { is_active: boolean };

	const { data: link, error } = await supabase
		.from('affiliate_links')
		.update({ is_active })
		.eq('id', params.id)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ link });
};

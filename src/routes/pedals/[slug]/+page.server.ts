import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const { data: pedal, error: dbError } = await supabase
		.from('pedals')
		.select('*')
		.eq('slug', params.slug)
		.eq('is_active', true)
		.single();

	if (dbError || !pedal) {
		throw error(404, 'Pedal não encontrado');
	}

	const { data: affiliateLinks } = await supabase
		.from('affiliate_links')
		.select('*')
		.eq('pedal_id', pedal.id)
		.eq('is_active', true)
		.order('is_primary', { ascending: false });

	return {
		pedal,
		affiliateLinks: affiliateLinks ?? []
	};
};

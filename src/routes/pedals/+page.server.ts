import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const prerender = false;

export const load: PageServerLoad = async ({ url, cookies }) => {
	const supabase = createSupabaseServerClient(cookies);

	const categoryFilter = url.searchParams.get('category');
	const brandFilter = url.searchParams.get('brand');

	// Build base query for active pedals
	let query = supabase
		.from('pedals')
		.select('id, name, slug, brand, category, thumbnail_url, width_mm, height_mm, is_active')
		.eq('is_active', true)
		.order('name', { ascending: true });

	if (categoryFilter) {
		query = query.eq('category', categoryFilter);
	}

	if (brandFilter) {
		query = query.eq('brand', brandFilter);
	}

	const { data: pedals, error } = await query;

	if (error) {
		console.error('Error fetching pedals:', error);
		return {
			pedals: [],
			allCategories: [],
			allBrands: [],
			totalCount: 0,
			activeCategory: categoryFilter,
			activeBrand: brandFilter
		};
	}

	// Fetch all categories and brands for filters (unfiltered)
	const { data: allPedals } = await supabase
		.from('pedals')
		.select('category, brand')
		.eq('is_active', true);

	const allCategories = [...new Set((allPedals ?? []).map((p) => p.category).filter(Boolean))].sort();
	const allBrands = [...new Set((allPedals ?? []).map((p) => p.brand).filter(Boolean))].sort();

	return {
		pedals: pedals ?? [],
		allCategories,
		allBrands,
		totalCount: pedals?.length ?? 0,
		activeCategory: categoryFilter,
		activeBrand: brandFilter
	};
};

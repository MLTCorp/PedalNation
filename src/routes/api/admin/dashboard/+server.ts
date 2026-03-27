import { json } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const supabase = createSupabaseAdminClient();
	const period = url.searchParams.get('period') ?? '30'; // days; 'total' = all time

	const now = new Date();
	let startDate: string | null = null;

	if (period !== 'total') {
		const days = parseInt(period);
		const start = new Date(now);
		start.setDate(start.getDate() - days);
		startDate = start.toISOString();
	}

	// KPI: Total pedals
	const { count: totalPedals } = await supabase
		.from('pedals')
		.select('id', { count: 'exact', head: true })
		.eq('is_active', true);

	// KPI: Total boards (user boards)
	const { count: totalBoards } = await supabase
		.from('user_boards')
		.select('id', { count: 'exact', head: true });

	// KPI: Registered users
	const { count: totalUsers } = await supabase
		.from('users')
		.select('id', { count: 'exact', head: true });

	// KPI: Affiliate clicks in period
	let clicksQuery = supabase
		.from('link_clicks')
		.select('id', { count: 'exact', head: true });
	if (startDate) {
		clicksQuery = clicksQuery.gte('created_at', startDate);
	}
	const { count: totalClicks } = await clicksQuery;

	// Chart data: clicks grouped by day
	let clicksChartQuery = supabase
		.from('link_clicks')
		.select('created_at, affiliate_link_id, pedal_id')
		.order('created_at', { ascending: true });
	if (startDate) {
		clicksChartQuery = clicksChartQuery.gte('created_at', startDate);
	}
	const { data: clicksRaw } = await clicksChartQuery;

	// Group clicks by day
	const clicksByDay: Record<string, number> = {};
	for (const click of (clicksRaw ?? [])) {
		const day = click.created_at.slice(0, 10);
		clicksByDay[day] = (clicksByDay[day] ?? 0) + 1;
	}

	// Fill missing days in period
	const clicksChart: { date: string; count: number }[] = [];
	if (period !== 'total') {
		const days = parseInt(period);
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const dayStr = d.toISOString().slice(0, 10);
			clicksChart.push({ date: dayStr, count: clicksByDay[dayStr] ?? 0 });
		}
	} else {
		// Use raw data days
		for (const [date, count] of Object.entries(clicksByDay)) {
			clicksChart.push({ date, count });
		}
	}

	// Top 10 pedals in boards (from canvas_data or a simple count)
	// We'll count by pedal_id in link_clicks as a proxy
	const pedalClickCount: Record<string, number> = {};
	for (const click of (clicksRaw ?? [])) {
		if (click.pedal_id) {
			pedalClickCount[click.pedal_id] = (pedalClickCount[click.pedal_id] ?? 0) + 1;
		}
	}

	// Get top 10 pedal IDs
	const top10PedalIds = Object.entries(pedalClickCount)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([id]) => id);

	let top10Pedals: { name: string; brand: string; count: number }[] = [];
	if (top10PedalIds.length > 0) {
		const { data: pedalsData } = await supabase
			.from('pedals')
			.select('id, name, brand')
			.in('id', top10PedalIds);

		top10Pedals = top10PedalIds.map(id => {
			const p = (pedalsData ?? []).find((x: any) => x.id === id);
			return {
				name: p?.name ?? 'Unknown',
				brand: p?.brand ?? '',
				count: pedalClickCount[id] ?? 0
			};
		});
	}

	// Last 20 clicks with details
	const { data: lastClicks } = await supabase
		.from('link_clicks')
		.select(`
			id,
			created_at,
			source,
			utm_params,
			pedals(name, brand),
			affiliate_links(store_name)
		`)
		.order('created_at', { ascending: false })
		.limit(20);

	return json({
		kpis: {
			totalPedals: totalPedals ?? 0,
			totalBoards: totalBoards ?? 0,
			totalUsers: totalUsers ?? 0,
			totalClicks: totalClicks ?? 0
		},
		clicksChart,
		top10Pedals,
		lastClicks: lastClicks ?? []
	});
};

<script lang="ts">
	import { onMount } from 'svelte';

	type KPIs = {
		totalPedals: number;
		totalBoards: number;
		totalUsers: number;
		totalClicks: number;
	};

	type ClickPoint = { date: string; count: number };
	type TopPedal = { name: string; brand: string; count: number };
	type RecentClick = {
		id: string;
		created_at: string;
		source: string;
		utm_params: Record<string, string> | null;
		pedals: { name: string; brand: string } | null;
		affiliate_links: { store_name: string } | null;
	};

	let period = $state<'7' | '30' | '90' | 'total'>('30');
	let loading = $state(true);
	let kpis = $state<KPIs | null>(null);
	let clicksChart = $state<ClickPoint[]>([]);
	let top10Pedals = $state<TopPedal[]>([]);
	let lastClicks = $state<RecentClick[]>([]);

	async function loadData() {
		loading = true;
		try {
			const res = await fetch(`/api/admin/dashboard?period=${period}`);
			if (!res.ok) throw new Error('Failed to load dashboard data');
			const data = await res.json();
			kpis = data.kpis;
			clicksChart = data.clicksChart;
			top10Pedals = data.top10Pedals;
			lastClicks = data.lastClicks;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	$effect(() => {
		period; // react to period changes
		loadData();
	});

	// Chart helpers
	function getLineChartPath(points: ClickPoint[]): string {
		if (points.length === 0) return '';
		const maxVal = Math.max(...points.map(p => p.count), 1);
		const w = 600;
		const h = 120;
		const coords = points.map((p, i) => {
			const x = (i / (points.length - 1)) * w;
			const y = h - (p.count / maxVal) * h;
			return `${x},${y}`;
		});
		return `M${coords.join(' L')}`;
	}

	function getAreaPath(points: ClickPoint[]): string {
		if (points.length === 0) return '';
		const maxVal = Math.max(...points.map(p => p.count), 1);
		const w = 600;
		const h = 120;
		const coords = points.map((p, i) => {
			const x = (i / (points.length - 1)) * w;
			const y = h - (p.count / maxVal) * h;
			return `${x},${y}`;
		});
		return `M0,${h} L${coords.join(' L')} L${w},${h} Z`;
	}

	function getBarHeight(count: number, max: number): number {
		if (max === 0) return 0;
		return Math.max((count / max) * 140, 4);
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
	}

	function formatDateTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
	}

	const kpiCards = $derived([
		{
			label: 'Total de Boards',
			value: kpis?.totalBoards ?? 0,
			icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
		},
		{
			label: 'Total de Pedais',
			value: kpis?.totalPedals ?? 0,
			icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`
		},
		{
			label: `Cliques (${period === 'total' ? 'Total' : `${period}d`})`,
			value: kpis?.totalClicks ?? 0,
			icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
		},
		{
			label: 'Usuários Registrados',
			value: kpis?.totalUsers ?? 0,
			icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
		}
	]);
</script>

<svelte:head>
	<title>Dashboard — Admin Pedal Nation</title>
</svelte:head>

<div class="dashboard">
	<div class="page-header">
		<div>
			<h2 class="page-title">Dashboard</h2>
			<p class="page-subtitle">Visão geral da plataforma</p>
		</div>

		<div class="period-selector">
			{#each [['7', '7 dias'], ['30', '30 dias'], ['90', '3 meses'], ['total', 'Total']] as [val, label]}
				<button
					class="period-btn"
					class:active={period === val}
					onclick={() => (period = val as any)}
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="kpi-grid">
		{#each kpiCards as card}
			<div class="kpi-card">
				{#if loading}
					<div class="skeleton skeleton-icon"></div>
					<div class="skeleton skeleton-number"></div>
					<div class="skeleton skeleton-label"></div>
				{:else}
					<div class="kpi-icon">{@html card.icon}</div>
					<div class="kpi-number">{card.value.toLocaleString('pt-BR')}</div>
					<div class="kpi-label">{card.label}</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Charts row -->
	<div class="charts-row">
		<!-- Line chart -->
		<div class="chart-card wide">
			<h3 class="chart-title">Cliques ao Longo do Tempo</h3>
			{#if loading}
				<div class="skeleton skeleton-chart"></div>
			{:else if clicksChart.length > 0}
				<div class="chart-container">
					<svg viewBox="0 0 620 150" preserveAspectRatio="none" class="line-chart">
						<!-- Grid lines -->
						<line x1="0" y1="40" x2="600" y2="40" stroke="#333" stroke-width="0.5"/>
						<line x1="0" y1="80" x2="600" y2="80" stroke="#333" stroke-width="0.5"/>
						<line x1="0" y1="120" x2="600" y2="120" stroke="#333" stroke-width="0.5"/>
						<!-- Area fill -->
						<path d={getAreaPath(clicksChart)} fill="rgba(255,107,53,0.1)"/>
						<!-- Line -->
						<path d={getLineChartPath(clicksChart)} fill="none" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<div class="chart-x-labels">
						{#if clicksChart.length <= 14}
							{#each clicksChart as point}
								<span class="chart-label">{formatDate(point.date)}</span>
							{/each}
						{:else}
							{#each [0, Math.floor(clicksChart.length / 4), Math.floor(clicksChart.length / 2), Math.floor(3 * clicksChart.length / 4), clicksChart.length - 1] as idx}
								<span class="chart-label">{formatDate(clicksChart[idx]?.date ?? '')}</span>
							{/each}
						{/if}
					</div>
				</div>
			{:else}
				<div class="empty-chart">Sem dados para o período selecionado</div>
			{/if}
		</div>

		<!-- Bar chart -->
		<div class="chart-card">
			<h3 class="chart-title">Top 10 Pedais em Boards</h3>
			{#if loading}
				<div class="skeleton skeleton-chart"></div>
			{:else if top10Pedals.length > 0}
				{@const maxCount = Math.max(...top10Pedals.map(p => p.count), 1)}
				<div class="bar-chart">
					{#each top10Pedals as pedal}
						<div class="bar-row">
							<div class="bar-label" title="{pedal.brand} {pedal.name}">{pedal.name}</div>
							<div class="bar-track">
								<div
									class="bar-fill"
									style="width: {(pedal.count / maxCount) * 100}%"
								></div>
							</div>
							<div class="bar-count">{pedal.count}</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-chart">Sem dados</div>
			{/if}
		</div>
	</div>

	<!-- Recent clicks table -->
	<div class="table-card">
		<h3 class="chart-title">Últimos 20 Cliques</h3>
		{#if loading}
			<div class="skeleton skeleton-table"></div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>Pedal</th>
							<th>Loja</th>
							<th>Source</th>
							<th>UTM Content</th>
							<th>Data</th>
						</tr>
					</thead>
					<tbody>
						{#if lastClicks.length === 0}
							<tr>
								<td colspan="5" class="empty-row">Nenhum clique registrado</td>
							</tr>
						{:else}
							{#each lastClicks as click, i}
								<tr class:alt={i % 2 !== 0}>
									<td>{click.pedals?.name ?? '—'}</td>
									<td>{(click.affiliate_links as any)?.store_name ?? '—'}</td>
									<td><span class="badge">{click.source ?? '—'}</span></td>
									<td class="mono">{click.utm_params?.utm_content ?? '—'}</td>
									<td class="mono">{formatDateTime(click.created_at)}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 22px;
		font-weight: 700;
		color: #F5F5F5;
		margin: 0 0 4px 0;
		letter-spacing: -0.02em;
	}

	.page-subtitle {
		font-size: 13px;
		color: #666666;
		margin: 0;
	}

	.period-selector {
		display: flex;
		gap: 4px;
		background-color: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 8px;
		padding: 4px;
	}

	.period-btn {
		padding: 5px 12px;
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		border: none;
		border-radius: 5px;
		background: transparent;
		color: #888888;
		cursor: pointer;
		transition: background-color 150ms ease, color 150ms ease;
	}

	.period-btn:hover {
		color: #F5F5F5;
	}

	.period-btn.active {
		background-color: #FF6B35;
		color: #FFFFFF;
	}

	/* KPI Cards */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	@media (max-width: 1024px) {
		.kpi-grid { grid-template-columns: repeat(2, 1fr); }
	}

	.kpi-card {
		background-color: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 10px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.kpi-icon {
		color: #FF6B35;
		display: flex;
	}

	.kpi-number {
		font-size: 32px;
		font-weight: 700;
		color: #F5F5F5;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.kpi-label {
		font-size: 13px;
		color: #999999;
	}

	/* Skeleton loaders */
	.skeleton {
		background: linear-gradient(90deg, #252525 25%, #2A2A2A 50%, #252525 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
		border-radius: 6px;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.skeleton-icon { width: 20px; height: 20px; border-radius: 50%; }
	.skeleton-number { width: 80px; height: 32px; }
	.skeleton-label { width: 120px; height: 14px; }
	.skeleton-chart { width: 100%; height: 160px; }
	.skeleton-table { width: 100%; height: 200px; }

	/* Charts */
	.charts-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 16px;
	}

	@media (max-width: 1024px) {
		.charts-row { grid-template-columns: 1fr; }
	}

	.chart-card {
		background-color: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 10px;
		padding: 20px;
	}

	.chart-title {
		font-size: 14px;
		font-weight: 600;
		color: #F5F5F5;
		margin: 0 0 16px 0;
	}

	.chart-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.line-chart {
		width: 100%;
		height: 140px;
	}

	.chart-x-labels {
		display: flex;
		justify-content: space-between;
	}

	.chart-label {
		font-size: 10px;
		color: #555555;
		font-family: 'JetBrains Mono', monospace;
	}

	.empty-chart {
		height: 140px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: #555555;
	}

	/* Bar chart */
	.bar-chart {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 100px 1fr 40px;
		align-items: center;
		gap: 8px;
	}

	.bar-label {
		font-size: 11px;
		color: #999999;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-track {
		height: 8px;
		background-color: #252525;
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background-color: #FF6B35;
		border-radius: 4px;
		transition: width 300ms ease;
	}

	.bar-count {
		font-size: 11px;
		color: #666666;
		text-align: right;
		font-family: 'JetBrains Mono', monospace;
	}

	/* Table */
	.table-card {
		background-color: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 10px;
		padding: 20px;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.data-table th {
		padding: 8px 12px;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
		color: #666666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background-color: #222222;
		border-bottom: 1px solid #2A2A2A;
	}

	.data-table td {
		padding: 10px 12px;
		color: #C0C0C0;
		border-bottom: 1px solid #222222;
	}

	.data-table tr.alt td {
		background-color: #1F1F1F;
	}

	.empty-row {
		text-align: center;
		color: #555555;
		padding: 24px 12px !important;
	}

	.badge {
		display: inline-block;
		padding: 2px 7px;
		border-radius: 4px;
		font-size: 11px;
		background-color: #252525;
		color: #999999;
		border: 1px solid #333333;
	}

	.mono {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
</style>

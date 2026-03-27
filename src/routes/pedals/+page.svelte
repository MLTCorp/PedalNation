<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	let { data }: { data: PageData } = $props();

	// Category badge colors
	const categoryColors: Record<string, { bg: string; color: string }> = {
		overdrive: { bg: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35' },
		distortion: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
		fuzz: { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
		delay: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
		reverb: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' },
		chorus: { bg: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' },
		flanger: { bg: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' },
		phaser: { bg: 'rgba(20, 184, 166, 0.15)', color: '#14B8A6' },
		compressor: { bg: 'rgba(234, 179, 8, 0.15)', color: '#EAB308' },
		boost: { bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316' },
		eq: { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' },
		wah: { bg: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E' },
		octave: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
		tremolo: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' },
		looper: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
		tuner: { bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF' }
	};

	function getCategoryStyle(category: string) {
		const normalized = category?.toLowerCase() ?? '';
		return categoryColors[normalized] ?? { bg: 'rgba(160, 160, 160, 0.15)', color: '#A0A0A0' };
	}

	function formatDimensions(width: number | null, height: number | null): string {
		if (!width && !height) return '';
		if (width && height) return `${width} x ${height} mm`;
		if (width) return `${width} mm`;
		if (height) return `${height} mm`;
		return '';
	}

	// Filter state — driven by URL
	let activeCategory = $derived(data.activeCategory ?? null);
	let activeBrand = $derived(data.activeBrand ?? null);

	let mobileFiltersOpen = $state(false);

	function toggleCategory(cat: string) {
		const params = new URLSearchParams($page.url.searchParams);
		if (activeCategory === cat) {
			params.delete('category');
		} else {
			params.set('category', cat);
		}
		goto(`/pedals?${params.toString()}`, { replaceState: false });
		mobileFiltersOpen = false;
	}

	function toggleBrand(brand: string) {
		const params = new URLSearchParams($page.url.searchParams);
		if (activeBrand === brand) {
			params.delete('brand');
		} else {
			params.set('brand', brand);
		}
		goto(`/pedals?${params.toString()}`, { replaceState: false });
		mobileFiltersOpen = false;
	}

	function clearFilters() {
		goto('/pedals', { replaceState: false });
		mobileFiltersOpen = false;
	}

	const hasActiveFilters = $derived(activeCategory !== null || activeBrand !== null);
</script>

<svelte:head>
	<title>Catálogo de Pedais de Guitarra | Pedal Nation</title>
	<meta
		name="description"
		content="Explore nosso catálogo com {data.totalCount} pedais de guitarra. Encontre overdrives, delays, reverbs e muito mais com especificações completas e links de compra."
	/>
	<link rel="canonical" href="https://pedalnation.com/pedals" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Catálogo de Pedais de Guitarra | Pedal Nation" />
	<meta
		property="og:description"
		content="Explore nosso catálogo com {data.totalCount} pedais de guitarra. Encontre overdrives, delays, reverbs e muito mais."
	/>
	<meta property="og:image" content="https://pedalnation.com/og-image.png" />
	<meta property="og:url" content="https://pedalnation.com/pedals" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Catálogo de Pedais de Guitarra | Pedal Nation" />
	<meta name="twitter:description" content="Explore nosso catálogo com {data.totalCount} pedais de guitarra. Encontre overdrives, delays, reverbs e muito mais." />
	<meta name="twitter:image" content="https://pedalnation.com/og-image.png" />
</svelte:head>

<div class="page-wrapper">
	<!-- Page header -->
	<div class="page-header">
		<div>
			<h1 class="page-title">Catálogo de Pedais</h1>
			<p class="page-subtitle">
				{data.totalCount}
				{data.totalCount === 1 ? 'pedal encontrado' : 'pedais encontrados'}
				{#if hasActiveFilters}
					<button class="clear-filters-btn" onclick={clearFilters}>
						Limpar filtros ×
					</button>
				{/if}
			</p>
		</div>

		<!-- Mobile filter trigger -->
		<button
			class="mobile-filter-btn"
			onclick={() => (mobileFiltersOpen = true)}
			aria-label="Abrir filtros"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<line x1="21" y1="6" x2="3" y2="6" />
				<line x1="15" y1="12" x2="3" y2="12" />
				<line x1="9" y1="18" x2="3" y2="18" />
			</svg>
			Filtros
			{#if hasActiveFilters}
				<span class="filter-badge">!</span>
			{/if}
		</button>
	</div>

	<div class="layout">
		<!-- Desktop Sidebar Filters -->
		<aside class="sidebar" aria-label="Filtros">
			<div class="filter-section">
				<h3 class="filter-title">Categoria</h3>
				<div class="filter-list">
					{#each data.allCategories as cat}
						<label class="filter-item">
							<input
								type="checkbox"
								class="filter-checkbox"
								checked={activeCategory === cat}
								onchange={() => toggleCategory(cat)}
							/>
							<span class="filter-label">{cat}</span>
						</label>
					{/each}
				</div>
			</div>

			{#if data.allBrands.length > 0}
				<div class="filter-section">
					<h3 class="filter-title">Marca</h3>
					<div class="filter-list">
						{#each data.allBrands as brand}
							<label class="filter-item">
								<input
									type="checkbox"
									class="filter-checkbox"
									checked={activeBrand === brand}
									onchange={() => toggleBrand(brand)}
								/>
								<span class="filter-label">{brand}</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}

			{#if hasActiveFilters}
				<button class="clear-all-btn" onclick={clearFilters}>
					Limpar todos os filtros
				</button>
			{/if}
		</aside>

		<!-- Pedal Grid -->
		<main class="main-content">
			{#if data.pedals.length === 0}
				<div class="empty-state">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<p class="empty-title">Nenhum pedal encontrado</p>
					<p class="empty-subtitle">Tente ajustar os filtros para ver mais resultados.</p>
					<button class="clear-filters-btn-large" onclick={clearFilters}>
						Limpar filtros
					</button>
				</div>
			{:else}
				<div class="pedal-grid">
					{#each data.pedals as pedal (pedal.id)}
						<a href="/pedals/{pedal.slug}" class="pedal-card" aria-label="{pedal.name} - {pedal.brand}">
							<!-- Category badge -->
							{#if pedal.category}
								{@const style = getCategoryStyle(pedal.category)}
								<span
									class="category-badge"
									style="background: {style.bg}; color: {style.color};"
								>
									{pedal.category}
								</span>
							{/if}

							<!-- Thumbnail -->
							<div class="card-image-wrapper">
								{#if pedal.thumbnail_url}
									<img
										src={pedal.thumbnail_url}
										alt={pedal.name}
										class="card-image"
										loading="lazy"
									/>
								{:else}
									<div class="card-image-placeholder" aria-hidden="true">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
											<circle cx="8.5" cy="8.5" r="1.5" />
											<polyline points="21 15 16 10 5 21" />
										</svg>
									</div>
								{/if}
							</div>

							<!-- Card info -->
							<div class="card-body">
								<p class="card-brand">{pedal.brand ?? ''}</p>
								<h2 class="card-name">{pedal.name}</h2>
								{#if pedal.width_mm || pedal.height_mm}
									<p class="card-dimensions">{formatDimensions(pedal.width_mm, pedal.height_mm)}</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>

<!-- Mobile Filters Sheet -->
<Sheet.Root bind:open={mobileFiltersOpen}>
	<Sheet.Content side="left" class="mobile-filters-sheet">
		<Sheet.Header>
			<Sheet.Title>Filtros</Sheet.Title>
		</Sheet.Header>

		<div class="sheet-filters-content">
			<div class="filter-section">
				<h3 class="filter-title">Categoria</h3>
				<div class="filter-list">
					{#each data.allCategories as cat}
						<label class="filter-item">
							<input
								type="checkbox"
								class="filter-checkbox"
								checked={activeCategory === cat}
								onchange={() => toggleCategory(cat)}
							/>
							<span class="filter-label">{cat}</span>
						</label>
					{/each}
				</div>
			</div>

			{#if data.allBrands.length > 0}
				<div class="filter-section">
					<h3 class="filter-title">Marca</h3>
					<div class="filter-list">
						{#each data.allBrands as brand}
							<label class="filter-item">
								<input
									type="checkbox"
									class="filter-checkbox"
									checked={activeBrand === brand}
									onchange={() => toggleBrand(brand)}
								/>
								<span class="filter-label">{brand}</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}

			{#if hasActiveFilters}
				<button class="clear-all-btn" onclick={clearFilters}>
					Limpar todos os filtros
				</button>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<style>
	/* Page wrapper */
	.page-wrapper {
		max-width: 1280px;
		margin: 0 auto;
		padding: 32px 24px;
		color: #F5F5F5;
	}

	/* Page header */
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 32px;
		gap: 16px;
	}

	.page-title {
		font-size: 28px;
		font-weight: 700;
		color: #F5F5F5;
		margin: 0 0 6px 0;
		letter-spacing: -0.02em;
	}

	.page-subtitle {
		font-size: 14px;
		color: #A0A0A0;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.clear-filters-btn {
		background: none;
		border: none;
		color: #FF6B35;
		font-size: 13px;
		cursor: pointer;
		padding: 0;
		transition: opacity 150ms ease;
	}

	.clear-filters-btn:hover {
		opacity: 0.8;
	}

	/* Mobile filter button - hidden on desktop */
	.mobile-filter-btn {
		display: none;
		align-items: center;
		gap: 6px;
		height: 36px;
		padding: 0 14px;
		background: #1A1A1A;
		border: 1px solid #333333;
		border-radius: 8px;
		color: #F5F5F5;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		flex-shrink: 0;
		transition: border-color 150ms ease;
		position: relative;
	}

	.mobile-filter-btn:hover {
		border-color: #FF6B35;
	}

	.filter-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 14px;
		height: 14px;
		background: #FF6B35;
		color: #FFFFFF;
		font-size: 9px;
		font-weight: 700;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Layout: sidebar + content */
	.layout {
		display: flex;
		gap: 32px;
		align-items: flex-start;
	}

	/* Sidebar */
	.sidebar {
		width: 220px;
		flex-shrink: 0;
		position: sticky;
		top: 72px;
	}

	.filter-section {
		margin-bottom: 28px;
	}

	.filter-title {
		font-size: 12px;
		font-weight: 600;
		color: #A0A0A0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 12px 0;
	}

	.filter-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.filter-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	.filter-item:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.filter-checkbox {
		width: 14px;
		height: 14px;
		accent-color: #FF6B35;
		cursor: pointer;
		flex-shrink: 0;
	}

	.filter-label {
		font-size: 13px;
		color: #F5F5F5;
		cursor: pointer;
		text-transform: capitalize;
	}

	.clear-all-btn {
		width: 100%;
		padding: 8px 12px;
		background: none;
		border: 1px solid #333333;
		border-radius: 6px;
		color: #A0A0A0;
		font-size: 13px;
		cursor: pointer;
		transition: border-color 150ms ease, color 150ms ease;
		margin-top: 4px;
	}

	.clear-all-btn:hover {
		border-color: #FF6B35;
		color: #FF6B35;
	}

	/* Main content */
	.main-content {
		flex: 1;
		min-width: 0;
	}

	/* Pedal grid */
	.pedal-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	/* Pedal card */
	.pedal-card {
		position: relative;
		background: #1A1A1A;
		border: 1px solid #333333;
		border-radius: 8px;
		padding: 12px;
		text-decoration: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		transition: border-color 200ms ease, transform 200ms ease;
		overflow: hidden;
	}

	.pedal-card:hover {
		border-color: #555555;
		transform: translateY(-2px);
	}

	/* Category badge */
	.category-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		font-size: 11px;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 4px;
		text-transform: capitalize;
		line-height: 1.4;
		z-index: 1;
	}

	/* Image area */
	.card-image-wrapper {
		width: 100%;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #111111;
		border-radius: 4px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.card-image-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	/* Card body */
	.card-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.card-brand {
		font-size: 11px;
		font-weight: 500;
		color: #A0A0A0;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-name {
		font-size: 14px;
		font-weight: 600;
		color: #F5F5F5;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-dimensions {
		font-size: 11px;
		color: #606060;
		margin: 2px 0 0 0;
		font-family: "JetBrains Mono", monospace;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 24px;
		gap: 12px;
		text-align: center;
	}

	.empty-title {
		font-size: 16px;
		font-weight: 600;
		color: #F5F5F5;
		margin: 0;
	}

	.empty-subtitle {
		font-size: 14px;
		color: #A0A0A0;
		margin: 0;
	}

	.clear-filters-btn-large {
		margin-top: 8px;
		padding: 8px 20px;
		background: #FF6B35;
		border: none;
		border-radius: 6px;
		color: #FFFFFF;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	.clear-filters-btn-large:hover {
		opacity: 0.9;
	}

	/* Sheet filters content */
	.sheet-filters-content {
		padding: 24px 0;
		overflow-y: auto;
		flex: 1;
	}

	/* Tablet: 3 col grid */
	@media (min-width: 640px) {
		.pedal-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Desktop: 4 col grid, show sidebar */
	@media (min-width: 1024px) {
		.pedal-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	/* Mobile: hide sidebar, show filter button */
	@media (max-width: 767px) {
		.sidebar {
			display: none;
		}

		.mobile-filter-btn {
			display: flex;
		}

		.page-wrapper {
			padding: 24px 16px;
		}

		.page-title {
			font-size: 22px;
		}
	}

	/* Tablet: sidebar visible, 3 col */
	@media (min-width: 768px) {
		.mobile-filter-btn {
			display: none;
		}

		.sidebar {
			display: block;
		}
	}
</style>

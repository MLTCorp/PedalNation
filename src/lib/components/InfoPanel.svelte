<script lang="ts">
	import { selectedNodeData, selectedNodeCount, rotateSelectedNode, rotateAllSelected, deleteSelectedNodes } from '$lib/stores/canvasStore';
	import { generateFallbackLinks, type FallbackAffiliateLink } from '$lib/utils/affiliate';

	interface AffiliateLink {
		id: string;
		store_name: string;
		url: string;
		affiliate_code: string | null;
		is_primary: boolean;
		is_active: boolean;
		is_fallback?: false;
	}

	type DisplayLink = AffiliateLink | FallbackAffiliateLink;

	interface PedalDetail {
		id: string;
		name: string;
		slug: string;
		brand: string;
		category: string;
		image_url: string | null;
		width_mm: number | null;
		height_mm: number | null;
		depth_mm: number | null;
		specs: Record<string, unknown> | null;
		description: string | null;
		meta_description: string | null;
	}

	// Current fetched pedal data
	let pedalDetail = $state<PedalDetail | null>(null);
	let affiliateLinks = $state<AffiliateLink[]>([]);
	let displayLinks = $state<DisplayLink[]>([]);
	let loadingDetail = $state(false);
	let currentPedalId = $state<string | null>(null);
	let buyingLinkId = $state<string | null>(null);

	// Transition key for fade effect
	let fadeKey = $state(0);

	// Fetch pedal details when selectedNodeData changes
	$effect(() => {
		const nodeData = $selectedNodeData;
		if (!nodeData) {
			pedalDetail = null;
			affiliateLinks = [];
			displayLinks = [];
			currentPedalId = null;
			return;
		}

		const pedalId = nodeData.pedal_id;
		if (pedalId === currentPedalId) return;

		currentPedalId = pedalId;
		fadeKey += 1;
		loadingDetail = true;
		pedalDetail = null;
		affiliateLinks = [];
		displayLinks = [];

		fetch(`/api/pedals/${pedalId}`)
			.then((res) => res.ok ? res.json() : Promise.reject(res))
			.then((data) => {
				if (currentPedalId === pedalId) {
					pedalDetail = data.pedal;
					affiliateLinks = data.affiliateLinks ?? [];
					// Use DB links if available, otherwise generate fallback search links
					if (affiliateLinks.length > 0) {
						displayLinks = affiliateLinks;
					} else {
						displayLinks = generateFallbackLinks(
							nodeData.brand,
							nodeData.name
						);
					}
				}
			})
			.catch(() => {
				if (currentPedalId === pedalId) {
					pedalDetail = null;
					affiliateLinks = [];
					// Even on error, show fallback links
					displayLinks = generateFallbackLinks(
						nodeData.brand,
						nodeData.name
					);
				}
			})
			.finally(() => {
				if (currentPedalId === pedalId) {
					loadingDetail = false;
				}
			});
	});

	async function handleBuyClick(link: DisplayLink) {
		if (!pedalDetail && !$selectedNodeData) return;

		// Fallback links open directly without tracking
		if ('is_fallback' in link && link.is_fallback) {
			window.open(link.url, '_blank', 'noopener,noreferrer');
			return;
		}

		// DB links go through click tracking
		const dbLink = link as AffiliateLink;
		buyingLinkId = dbLink.id;

		try {
			const res = await fetch('/api/clicks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					affiliate_link_id: dbLink.id,
					pedal_id: pedalDetail?.id ?? $selectedNodeData?.pedal_id,
					source: 'builder'
				})
			});

			if (res.ok) {
				const { redirect_url } = await res.json();
				window.open(redirect_url, '_blank', 'noopener,noreferrer');
			} else {
				window.open(dbLink.url, '_blank', 'noopener,noreferrer');
			}
		} catch {
			window.open(dbLink.url, '_blank', 'noopener,noreferrer');
		} finally {
			buyingLinkId = null;
		}
	}

	function handleViewFullPage() {
		if (!pedalDetail?.slug) return;
		window.open(`/pedals/${pedalDetail.slug}`, '_blank', 'noopener,noreferrer');
	}

	// Derived specs
	function getSpecs(detail: PedalDetail) {
		const specs = detail.specs ?? {};
		const rows: { label: string; value: string }[] = [];

		if (detail.width_mm && detail.height_mm) {
			const dim = detail.depth_mm
				? `${detail.width_mm} × ${detail.height_mm} × ${detail.depth_mm} mm`
				: `${detail.width_mm} × ${detail.height_mm} mm`;
			rows.push({ label: 'Dimensões', value: dim });
		}
		if ((specs as Record<string, unknown>).voltage) {
			rows.push({ label: 'Tensão', value: String((specs as Record<string, unknown>).voltage) });
		}
		if ((specs as Record<string, unknown>).current_ma) {
			rows.push({ label: 'Corrente', value: `${(specs as Record<string, unknown>).current_ma} mA` });
		}
		if ((specs as Record<string, unknown>).bypass_type) {
			rows.push({ label: 'Bypass', value: String((specs as Record<string, unknown>).bypass_type) });
		}

		return rows;
	}

	// Primary link — for DB links use is_primary flag, for fallbacks Amazon is first
	let primaryLink: DisplayLink | null = $derived.by(() => {
		if (displayLinks.length === 0) return null;
		const dbPrimary = displayLinks.find((l) => 'is_primary' in l && (l as AffiliateLink).is_primary);
		return dbPrimary ?? displayLinks[0] ?? null;
	});
	let secondaryLinks: DisplayLink[] = $derived(displayLinks.filter((l) => l !== primaryLink));
</script>

<div class="info-panel-outer">
{#key fadeKey}
<div class="info-panel-inner">
	{#if $selectedNodeCount > 1}
		<!-- Multi-select view -->
		<div class="info-content">
			<div class="multi-select-header">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" stroke-width="1.5">
					<rect x="3" y="3" width="7" height="7" rx="1"></rect>
					<rect x="14" y="3" width="7" height="7" rx="1"></rect>
					<rect x="3" y="14" width="7" height="7" rx="1"></rect>
					<rect x="14" y="14" width="7" height="7" rx="1" stroke-dasharray="3 2"></rect>
				</svg>
				<span class="multi-select-count">{$selectedNodeCount} pedais selecionados</span>
			</div>

			<div class="info-actions multi-actions">
				<button class="info-action-btn" onclick={() => rotateAllSelected()}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6"></path>
						<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
					</svg>
					Girar todos
				</button>
				<button class="info-action-btn danger" onclick={() => { deleteSelectedNodes(); }}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6l-1 14H6L5 6"></path>
						<path d="M10 11v6M14 11v6"></path>
						<path d="M9 6V4h6v2"></path>
					</svg>
					Remover todos
				</button>
			</div>
		</div>
	{:else if $selectedNodeData}
		<div class="info-content">
			<!-- Image -->
			<div class="info-image-bg">
				{#if $selectedNodeData.image_url}
					<img
						src={$selectedNodeData.image_url}
						alt={$selectedNodeData.name}
						class="info-image"
					/>
				{:else}
					<div class="info-image-placeholder">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.5">
							<rect x="2" y="7" width="20" height="15" rx="2"></rect>
							<circle cx="12" cy="14" r="3"></circle>
							<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
						</svg>
					</div>
				{/if}
			</div>

			<!-- Meta -->
			<div class="info-meta">
				<h3 class="info-name">{$selectedNodeData.name}</h3>
				<div class="info-meta-row">
					<span class="info-brand">{$selectedNodeData.brand}</span>
					{#if $selectedNodeData.category}
						<span class="info-category-badge">{$selectedNodeData.category}</span>
					{/if}
				</div>
			</div>

			<!-- Specs Grid -->
			{#if pedalDetail}
				{@const specs = getSpecs(pedalDetail)}
				{#if specs.length > 0}
					<div class="specs-grid">
						{#each specs as spec}
							<div class="spec-row">
								<span class="spec-label">{spec.label}</span>
								<span class="spec-value">{spec.value}</span>
							</div>
						{/each}
					</div>
				{/if}
			{:else if loadingDetail}
				<div class="specs-loading">
					<div class="spinner-sm"></div>
					<span class="specs-loading-text">Carregando specs...</span>
				</div>
			{/if}

			<!-- Description -->
			{#if pedalDetail?.description || pedalDetail?.meta_description}
				<div class="info-description-wrap">
					<p class="info-description">
						{pedalDetail.description ?? pedalDetail.meta_description}
					</p>
				</div>
			{/if}

			<!-- Affiliate Links -->
			<div class="info-buy-section">
				{#if displayLinks.length > 0}
					<!-- Primary buy button -->
					{#if primaryLink}
						<button
							class="btn-buy"
							onclick={() => handleBuyClick(primaryLink!)}
							disabled={buyingLinkId !== null}
						>
							{#if 'id' in primaryLink && buyingLinkId === primaryLink.id}
								<div class="spinner-sm-white"></div>
							{:else}
								<!-- Cart icon -->
								<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<circle cx="9" cy="21" r="1"></circle>
									<circle cx="20" cy="21" r="1"></circle>
									<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
								</svg>
							{/if}
							Comprar em {primaryLink.store_name}
						</button>
					{/if}

					<!-- Secondary links -->
					{#if secondaryLinks.length > 0}
						<div class="secondary-links">
							{#each secondaryLinks as link}
								<button
									class="btn-secondary-link"
									onclick={() => handleBuyClick(link)}
									disabled={buyingLinkId !== null}
								>
									{link.store_name}
									<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
										<polyline points="15 3 21 3 21 9"></polyline>
										<line x1="10" y1="14" x2="21" y2="3"></line>
									</svg>
								</button>
							{/each}
						</div>
					{/if}
				{:else if !loadingDetail}
					<p class="no-affiliate">Link de compra indisponível</p>
				{/if}
			</div>

			<!-- View full page -->
			{#if pedalDetail?.slug}
				<button class="btn-full-page" onclick={handleViewFullPage}>
					Ver página completa
					<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
						<polyline points="15 3 21 3 21 9"></polyline>
						<line x1="10" y1="14" x2="21" y2="3"></line>
					</svg>
				</button>
			{/if}

			<!-- Rotate / Remove actions -->
			<div class="info-actions">
				<button class="info-action-btn" onclick={() => rotateSelectedNode()}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6"></path>
						<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
					</svg>
					Girar 90°
				</button>
				<button class="info-action-btn danger" onclick={() => { deleteSelectedNodes(); }}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6l-1 14H6L5 6"></path>
						<path d="M10 11v6M14 11v6"></path>
						<path d="M9 6V4h6v2"></path>
					</svg>
					Remover
				</button>
			</div>
		</div>
	{:else}
		<!-- Placeholder -->
		<div class="info-placeholder">
			<!-- Mouse click icon -->
			<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="1.5" aria-hidden="true">
				<path d="M5 3.5A2.5 2.5 0 0 1 7.5 1h9A2.5 2.5 0 0 1 19 3.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 10.5v-7z"></path>
				<line x1="12" y1="1" x2="12" y2="6"></line>
				<line x1="5" y1="6" x2="19" y2="6"></line>
				<path d="M12 12v9"></path>
				<path d="M8 17l4 4 4-4"></path>
			</svg>
			<span class="placeholder-text">Selecione um pedal no canvas</span>
		</div>
	{/if}
</div>
{/key}
</div>

<style>
	.info-panel-outer {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.info-panel-inner {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: #2a2a2a transparent;
		animation: fadeIn 0.2s ease;
	}

	.info-panel-inner::-webkit-scrollbar {
		width: 4px;
	}

	.info-panel-inner::-webkit-scrollbar-track {
		background: transparent;
	}

	.info-panel-inner::-webkit-scrollbar-thumb {
		background: #2a2a2a;
		border-radius: 2px;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* ── Placeholder ────────────────────────────────────────────────── */
	.info-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		height: 100%;
		padding: 24px;
	}

	.placeholder-text {
		color: #666666;
		font-size: 13px;
		text-align: center;
		line-height: 1.4;
	}

	/* ── Content ────────────────────────────────────────────────────── */
	.info-content {
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-bottom: 16px;
	}

	/* ── Image ──────────────────────────────────────────────────────── */
	.info-image-bg {
		width: 100%;
		max-height: 160px;
		background: #0f0f0f;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.info-image {
		width: 100%;
		max-height: 160px;
		object-fit: contain;
		display: block;
	}

	.info-image-placeholder {
		width: 100%;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Meta ───────────────────────────────────────────────────────── */
	.info-meta {
		padding: 12px 14px 10px;
		border-bottom: 1px solid #222;
	}

	.info-name {
		font-size: 14px;
		font-weight: 600;
		color: #f5f5f5;
		margin: 0 0 6px 0;
		line-height: 1.3;
	}

	.info-meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.info-brand {
		font-size: 12px;
		color: #999999;
	}

	.info-category-badge {
		font-size: 11px;
		color: #888;
		background: #252525;
		padding: 2px 7px;
		border-radius: 3px;
		border: 1px solid #333;
	}

	/* ── Specs Grid ─────────────────────────────────────────────────── */
	.specs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 0 14px;
		border-bottom: 1px solid #222;
	}

	.spec-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 0;
		border-bottom: 1px solid #333333;
	}

	.spec-row:nth-last-child(-n+2) {
		border-bottom: none;
	}

	.spec-label {
		font-size: 11px;
		color: #999999;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.spec-value {
		font-size: 12px;
		color: #f5f5f5;
		font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
	}

	.specs-loading {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-bottom: 1px solid #222;
	}

	.specs-loading-text {
		font-size: 12px;
		color: #666;
	}

	/* ── Description ────────────────────────────────────────────────── */
	.info-description-wrap {
		padding: 10px 14px;
		border-bottom: 1px solid #222;
	}

	.info-description {
		font-size: 12px;
		color: #aaa;
		line-height: 1.5;
		margin: 0;
		/* Truncate to 3 lines */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ── Buy section ────────────────────────────────────────────────── */
	.info-buy-section {
		padding: 12px 14px 4px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.btn-buy {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		width: 100%;
		padding: 10px 14px;
		background: #ff6b35;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
		line-height: 1;
	}

	.btn-buy:hover:not(:disabled) {
		background: #ff8b5e;
	}

	.btn-buy:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.secondary-links {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.btn-secondary-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		padding: 7px 10px;
		background: #252525;
		border: 1px solid #333;
		border-radius: 5px;
		color: #ccc;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.btn-secondary-link:hover:not(:disabled) {
		background: #2e2e2e;
		color: #f5f5f5;
	}

	.btn-secondary-link:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.no-affiliate {
		font-size: 12px;
		color: #999999;
		text-align: center;
		margin: 0;
		padding: 6px 0;
	}

	/* ── Full page link ─────────────────────────────────────────────── */
	.btn-full-page {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		margin: 0 14px 8px;
		padding: 7px 10px;
		background: transparent;
		border: 1px solid #333;
		border-radius: 5px;
		color: #888;
		font-size: 12px;
		cursor: pointer;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.btn-full-page:hover {
		color: #ccc;
		border-color: #555;
	}

	/* ── Rotate / Remove actions ────────────────────────────────────── */
	.info-actions {
		display: flex;
		gap: 8px;
		padding: 8px 14px 0;
	}

	.info-action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 7px 8px;
		background: #252525;
		border: 1px solid #333;
		border-radius: 5px;
		color: #aaa;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.info-action-btn:hover {
		background: #2e2e2e;
		color: #f5f5f5;
	}

	.info-action-btn.danger:hover {
		background: #3a1a1a;
		color: #ff6b6b;
		border-color: #5a2020;
	}

	/* ── Spinners ───────────────────────────────────────────────────── */
	.spinner-sm {
		width: 14px;
		height: 14px;
		border: 2px solid #333;
		border-top-color: #ff6b35;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.spinner-sm-white {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ── Multi-select ──────────────────────────────────────────────────── */
	.multi-select-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 24px 14px 16px;
		border-bottom: 1px solid #222;
	}

	.multi-select-count {
		font-size: 14px;
		font-weight: 600;
		color: #f5f5f5;
	}

	.multi-actions {
		padding: 12px 14px;
		flex-direction: column;
		gap: 8px;
	}
</style>

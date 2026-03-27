<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const pedal = data.pedal;
	const affiliateLinks: any[] = data.affiliateLinks ?? [];

	const specs = pedal.specs ?? {};

	const specsGrid = [
		{ label: 'Tensão', value: specs.voltage ? `${specs.voltage}` : null },
		{ label: 'Corrente', value: specs.current_ma ? `${specs.current_ma} mA` : null },
		{ label: 'Bypass', value: specs.bypass_type ?? null },
		{ label: 'Mono/Stereo', value: specs.mono_stereo ?? null },
		{ label: 'Dimensões', value: pedal.width_mm && pedal.height_mm ? `${pedal.width_mm} × ${pedal.height_mm} mm` : null },
		{ label: 'Profundidade', value: pedal.depth_mm ? `${pedal.depth_mm} mm` : null },
		{ label: 'Peso', value: pedal.weight_g ? `${pedal.weight_g} g` : null }
	].filter((s) => s.value !== null);

	const pedalDescription = specs.description ?? pedal.meta_description ?? '';
	const pedalHistory = specs.history ?? '';

	const pageTitle = `${pedal.name} — ${pedal.brand} | Specs, Review, Onde Comprar | Pedal Nation`;
	const metaDescription =
		pedalDescription ||
		`Specs completas do ${pedal.name} (${pedal.brand}). Tensão, bypass, dimensões e onde comprar.`;

	const imageUrl = pedal.image_url ?? pedal.thumbnail_url ?? '';
	const canonicalUrl = `https://pedalnation.com/pedals/${pedal.slug}`;

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: pedal.name,
		brand: {
			'@type': 'Brand',
			name: pedal.brand
		},
		description: metaDescription,
		image: imageUrl,
		offers: affiliateLinks.map((link: any) => ({
			'@type': 'Offer',
			url: link.url,
			seller: {
				'@type': 'Organization',
				name: link.store_name
			}
		}))
	};

	async function handleBuyClick(link: any) {
		try {
			const res = await fetch('/api/clicks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					affiliate_link_id: link.id,
					pedal_id: pedal.id,
					source: 'pedal-page'
				})
			});

			if (res.ok) {
				const { redirect_url } = await res.json();
				window.open(redirect_url, '_blank', 'noopener,noreferrer');
			} else {
				window.open(link.url, '_blank', 'noopener,noreferrer');
			}
		} catch {
			window.open(link.url, '_blank', 'noopener,noreferrer');
		}
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="product" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={metaDescription} />
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
	{/if}
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content="Pedal Nation" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={metaDescription} />
	{#if imageUrl}
		<meta name="twitter:image" content={imageUrl} />
	{:else}
		<meta name="twitter:image" content="https://pedalnation.com/og-image.png" />
	{/if}

	<!-- JSON-LD -->
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<main style="max-width: 1280px; margin: 0 auto; padding: 32px 24px; color: #F5F5F5; background: #0F0F0F; min-height: 100vh;">
	<!-- Breadcrumb -->
	<nav style="display: flex; align-items: center; gap: 8px; margin-bottom: 28px; font-size: 13px;">
		<a
			href="/pedals"
			style="color: #999999; text-decoration: none; transition: color 150ms ease;"
			onmouseenter={(e) => (e.currentTarget.style.color = '#FF6B35')}
			onmouseleave={(e) => (e.currentTarget.style.color = '#999999')}
		>
			Catálogo
		</a>
		<span style="color: #444444;">/</span>
		<span style="color: #F5F5F5;">{pedal.name}</span>
	</nav>

	<!-- 2-Column Layout -->
	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start;">

		<!-- LEFT: Large Image -->
		<div style="position: sticky; top: 24px;">
			<div style="background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 16px; padding: 32px; display: flex; align-items: center; justify-content: center; min-height: 420px;">
				{#if imageUrl}
					<img
						src={imageUrl}
						alt={pedal.name}
						style="width: 100%; max-width: 380px; height: 380px; object-fit: contain; border-radius: 8px;"
					/>
				{:else}
					<div style="width: 100%; height: 380px; display: flex; align-items: center; justify-content: center; color: #444444; font-size: 14px; font-family: 'Inter', sans-serif;">
						Sem imagem disponível
					</div>
				{/if}
			</div>

			<!-- Add to Board Link -->
			<a
				href="/builder?pedal={pedal.id}"
				style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; padding: 12px; border: 1px solid #2A2A2A; border-radius: 10px; color: #999999; text-decoration: none; font-size: 14px; font-family: 'Inter', sans-serif; transition: all 150ms ease; background: #1A1A1A;"
				onmouseenter={(e) => {
					(e.currentTarget as HTMLElement).style.color = '#FF6B35';
					(e.currentTarget as HTMLElement).style.borderColor = '#FF6B35';
				}}
				onmouseleave={(e) => {
					(e.currentTarget as HTMLElement).style.color = '#999999';
					(e.currentTarget as HTMLElement).style.borderColor = '#2A2A2A';
				}}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<line x1="12" y1="8" x2="12" y2="16" />
					<line x1="8" y1="12" x2="16" y2="12" />
				</svg>
				Adicionar ao meu board
			</a>
		</div>

		<!-- RIGHT: Info + Specs + Buy -->
		<div style="display: flex; flex-direction: column; gap: 24px;">

			<!-- Brand + Name + Category Badge -->
			<div>
				{#if pedal.brand}
					<p style="font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; font-family: 'Inter', sans-serif;">
						{pedal.brand}
					</p>
				{/if}
				<h1 style="font-size: 34px; font-weight: 700; color: #F5F5F5; margin: 0 0 14px 0; letter-spacing: -0.025em; line-height: 1.1; font-family: 'Inter', sans-serif;">
					{pedal.name}
				</h1>
				{#if pedal.category}
					<span style="display: inline-block; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; background: rgba(255,107,53,0.15); color: #FF6B35; text-transform: capitalize; font-family: 'Inter', sans-serif; letter-spacing: 0.03em;">
						{pedal.category}
					</span>
				{/if}
			</div>

			<!-- Short Description -->
			{#if pedalDescription}
				<p style="font-size: 15px; color: #A0A0A0; line-height: 1.65; margin: 0; font-family: 'Inter', sans-serif;">
					{pedalDescription}
				</p>
			{/if}

			<!-- Technical Specs Grid 2x2 -->
			{#if specsGrid.length > 0}
				<div>
					<h2 style="font-size: 11px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 14px 0; font-family: 'Inter', sans-serif;">
						Specs Técnicas
					</h2>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; border: 1px solid #2A2A2A; border-radius: 10px; overflow: hidden;">
						{#each specsGrid as spec, i}
							<div style="background: #1A1A1A; padding: 14px 16px; {i % 2 === 0 && i === specsGrid.length - 1 ? 'grid-column: span 2;' : ''}">
								<div style="font-size: 11px; color: #999999; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
									{spec.label}
								</div>
								<div style="font-size: 13px; color: #F5F5F5; font-family: 'JetBrains Mono', monospace; font-weight: 500;">
									{spec.value}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Buy Buttons -->
			{#if affiliateLinks.length > 0}
				<div>
					<h2 style="font-size: 11px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 14px 0; font-family: 'Inter', sans-serif;">
						Onde Comprar
					</h2>
					<div style="display: flex; flex-direction: column; gap: 10px;">
						{#each affiliateLinks as link}
							{#if link.is_primary}
								<!-- Primary Buy Button -->
								<button
									onclick={() => handleBuyClick(link)}
									style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; background: #FF6B35; border: none; border-radius: 10px; color: #FFFFFF; font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: opacity 150ms ease; letter-spacing: 0.01em;"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
								>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="9" cy="21" r="1" />
										<circle cx="20" cy="21" r="1" />
										<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
									</svg>
									Comprar em {link.store_name}
								</button>
							{:else}
								<!-- Alternative Buy Buttons -->
								<button
									onclick={() => handleBuyClick(link)}
									style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 20px; background: transparent; border: 1px solid #FF6B35; border-radius: 10px; color: #FF6B35; font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 150ms ease; letter-spacing: 0.01em;"
									onmouseenter={(e) => {
										(e.currentTarget as HTMLElement).style.background = 'rgba(255,107,53,0.08)';
									}}
									onmouseleave={(e) => {
										(e.currentTarget as HTMLElement).style.background = 'transparent';
									}}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="9" cy="21" r="1" />
										<circle cx="20" cy="21" r="1" />
										<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
									</svg>
									Ver em {link.store_name}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

		</div>
	</div>

	<!-- History Section -->
	{#if pedalHistory}
		<div style="margin-top: 64px; border-top: 1px solid #2A2A2A; padding-top: 48px; max-width: 720px;">
			<h2 style="font-size: 20px; font-weight: 700; color: #F5F5F5; margin: 0 0 20px 0; font-family: 'Inter', sans-serif; letter-spacing: -0.01em;">
				História
			</h2>
			<div style="font-size: 15px; color: #AAAAAA; line-height: 1.7; font-family: 'Inter', sans-serif; white-space: pre-wrap;">
				{pedalHistory}
			</div>
		</div>
	{/if}
</main>

<style>
	@media (max-width: 768px) {
		main > div:nth-child(2) {
			grid-template-columns: 1fr !important;
		}
	}
</style>

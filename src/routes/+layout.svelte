<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';

	let { children, data } = $props();

	// Routes where header should NOT appear
	const noHeaderRoutes = ['/builder'];
	const isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));
	const isBuilderRoute = $derived(noHeaderRoutes.includes($page.url.pathname));
	const showHeader = $derived(!isAdminRoute && !isBuilderRoute);

	const BASE_URL = 'https://pedalnation.com';
	const canonicalUrl = $derived(`${BASE_URL}${$page.url.pathname}`);

	// Default meta values — individual pages override via svelte:head
	const defaultTitle = 'Pedal Nation — Editor Visual de Pedalboard';
	const defaultDescription = 'Monte seu pedalboard virtual com drag & drop. Explore centenas de pedais com specs completas e links de compra.';
	const defaultImage = `${BASE_URL}/og-image.png`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={canonicalUrl} />
	<!-- Default Twitter Card — pages override with specific values -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@pedalnation" />
	<meta name="twitter:title" content={defaultTitle} />
	<meta name="twitter:description" content={defaultDescription} />
	<meta name="twitter:image" content={defaultImage} />
	<!-- Default OG -->
	<meta property="og:site_name" content="Pedal Nation" />
	<meta property="og:url" content={canonicalUrl} />
</svelte:head>

{#if showHeader}
	<Header session={data.session} user={data.user} />
{/if}

{@render children()}

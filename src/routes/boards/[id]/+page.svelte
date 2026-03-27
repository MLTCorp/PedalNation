<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	const { board, author, pedals, isLoggedIn, isOwner } = data;

	// Toast for duplicate action
	let toastMessage = $state('');
	let toastVisible = $state(false);
	let duplicating = $state(false);

	function showToast(msg: string) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => (toastVisible = false), 3500);
	}

	async function duplicateBoard() {
		if (!isLoggedIn) {
			window.location.href = `/auth/login?next=/boards/${board.id}`;
			return;
		}
		duplicating = true;
		try {
			const res = await fetch(`/api/boards/${board.id}/duplicate`, { method: 'POST' });
			if (res.ok) {
				const { board: newBoard } = await res.json();
				showToast('Board duplicado! Abrindo no Builder...');
				setTimeout(() => {
					window.location.href = `/builder?board=${newBoard.id}`;
				}, 1200);
			} else {
				showToast('Erro ao duplicar board.');
			}
		} catch {
			showToast('Erro ao duplicar board.');
		} finally {
			duplicating = false;
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	// Fire-and-forget view increment (client-side fallback)
	onMount(() => {
		// The server already increments views via RPC, but as a fallback fire from client
		fetch(`/api/boards/${board.id}/view`, { method: 'POST' }).catch(() => {});
	});
</script>

<svelte:head>
	<title>{board.name} — {author.display_name ?? author.username} | Pedal Nation</title>
	<meta name="description" content="Board de pedalboard: {board.name} por {author.display_name ?? author.username}. {pedals.length} pedais." />
	<link rel="canonical" href="https://pedalnation.com/boards/{board.id}" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="{board.name} — {author.display_name ?? author.username} | Pedal Nation" />
	<meta property="og:description" content="Board de pedalboard: {board.name} por {author.display_name ?? author.username}. {pedals.length} pedais." />
	<meta property="og:url" content="https://pedalnation.com/boards/{board.id}" />
	{#if board.thumbnail_url}
		<meta property="og:image" content={board.thumbnail_url} />
		<meta name="twitter:image" content={board.thumbnail_url} />
	{:else}
		<meta property="og:image" content="https://pedalnation.com/og-image.png" />
		<meta name="twitter:image" content="https://pedalnation.com/og-image.png" />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{board.name} — {author.display_name ?? author.username} | Pedal Nation" />
	<meta name="twitter:description" content="Board de pedalboard: {board.name} por {author.display_name ?? author.username}. {pedals.length} pedais." />
</svelte:head>

<main style="max-width: 1280px; margin: 0 auto; padding: 40px 24px; color: #F5F5F5; min-height: 100vh; background: #0F0F0F;">

	<!-- Breadcrumb -->
	<nav style="display: flex; align-items: center; gap: 8px; margin-bottom: 28px; font-size: 13px; font-family: 'Inter', sans-serif;">
		<a href="/boards" style="color: #999999; text-decoration: none; transition: color 150ms ease;"
			onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FF6B35')}
			onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.color = '#999999')}
		>Boards</a>
		<span style="color: #444444;">/</span>
		<span style="color: #F5F5F5; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{board.name}</span>
	</nav>

	<div style="display: grid; grid-template-columns: 1fr; gap: 32px;">

		<!-- Board Header -->
		<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
			<div style="flex: 1; min-width: 0;">
				<h1 style="font-size: 26px; font-weight: 700; color: #F5F5F5; margin: 0 0 10px 0; font-family: 'Inter', sans-serif; line-height: 1.2;">
					{board.name}
				</h1>
				{#if board.description}
					<p style="font-size: 14px; color: #888888; margin: 0 0 14px 0; font-family: 'Inter', sans-serif; line-height: 1.6;">
						{board.description}
					</p>
				{/if}
				<!-- Author -->
				<a
					href="/profile/{author.username}"
					style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; transition: opacity 150ms ease;"
					onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.75')}
					onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
				>
					<div style="width: 28px; height: 28px; border-radius: 50%; background: #252525; overflow: hidden; flex-shrink: 0; border: 1px solid #333333;">
						{#if author.avatar_url}
							<img src={author.avatar_url} alt={author.username} style="width: 100%; height: 100%; object-fit: cover;" />
						{:else}
							<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #666666; font-family: 'Inter', sans-serif; font-weight: 600;">
								{(author.display_name ?? author.username).charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>
					<span style="font-size: 13px; color: #888888; font-family: 'Inter', sans-serif;">
						{author.display_name ?? '@' + author.username}
					</span>
					<span style="font-size: 12px; color: #555555; font-family: 'Inter', sans-serif;">
						· {formatDate(board.created_at)}
					</span>
				</a>
			</div>

			<!-- Action Buttons -->
			<div style="display: flex; gap: 10px; flex-shrink: 0; align-items: center;">
				<!-- Open in Builder -->
				<a
					href="/builder?board={board.id}"
					style="display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border: 1px solid #333333; border-radius: 8px; color: #F5F5F5; text-decoration: none; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; background: #1A1A1A; transition: border-color 150ms ease, color 150ms ease;"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#FF6B35'; (e.currentTarget as HTMLElement).style.color = '#FF6B35'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#333333'; (e.currentTarget as HTMLElement).style.color = '#F5F5F5'; }}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<polyline points="14 2 20 2 20 8" />
						<line x1="10" y1="14" x2="20" y2="2" />
					</svg>
					Abrir no Builder
				</a>

				<!-- Duplicate Board -->
				<button
					onclick={duplicateBoard}
					disabled={duplicating}
					style="display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; background: #FF6B35; border: 1px solid #FF6B35; border-radius: 8px; color: #FFFFFF; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 150ms ease; opacity: {duplicating ? 0.6 : 1};"
					onmouseenter={(e) => { if (!duplicating) (e.currentTarget as HTMLElement).style.background = '#E55A24'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FF6B35'; }}
					title={isLoggedIn ? 'Duplicar board para sua conta' : 'Faça login para duplicar'}
				>
					{#if duplicating}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
							<path d="M12 2a10 10 0 0 1 10 10" />
						</svg>
					{:else}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="9" y="9" width="13" height="13" rx="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
					{/if}
					{isLoggedIn ? 'Duplicar este board' : 'Login para duplicar'}
				</button>
			</div>
		</div>

		<!-- Thumbnail -->
		{#if board.thumbnail_url}
			<div style="border-radius: 12px; overflow: hidden; border: 1px solid #2A2A2A; max-height: 420px;">
				<img
					src={board.thumbnail_url}
					alt={board.name}
					style="width: 100%; height: 100%; object-fit: cover; display: block; max-height: 420px;"
				/>
			</div>
		{:else}
			<div style="border-radius: 12px; background: #1A1A1A; border: 1px solid #2A2A2A; display: flex; align-items: center; justify-content: center; height: 240px;">
				<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="2" y="5" width="20" height="14" rx="2" stroke="#444444" stroke-width="1.5" fill="none" />
					<circle cx="7" cy="12" r="2.2" fill="#444444" />
					<circle cx="12" cy="12" r="2.2" fill="#444444" />
					<circle cx="17" cy="12" r="2.2" fill="#444444" />
					<line x1="2" y1="9" x2="22" y2="9" stroke="#444444" stroke-width="1" />
				</svg>
			</div>
		{/if}

		<!-- Pedal List -->
		{#if pedals.length > 0}
			<div>
				<h2 style="font-size: 18px; font-weight: 600; color: #F5F5F5; margin: 0 0 20px 0; font-family: 'Inter', sans-serif;">
					Pedais ({pedals.length})
				</h2>
				<div style="display: flex; flex-direction: column; gap: 10px;">
					{#each pedals as pedal (pedal.id)}
						<div style="display: flex; align-items: center; gap: 16px; padding: 14px 16px; background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; transition: border-color 150ms ease;"
							onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#3A3A3A')}
							onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#2A2A2A')}
						>
							<!-- Pedal image -->
							<div style="flex-shrink: 0; width: 52px; height: 52px; background: #252525; border-radius: 8px; overflow: hidden; border: 1px solid #333333;">
								{#if pedal.image_url}
									<img src={pedal.image_url} alt={pedal.name} style="width: 100%; height: 100%; object-fit: contain;" />
								{:else}
									<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555555" stroke-width="1.5">
											<rect x="3" y="8" width="18" height="10" rx="2" />
											<circle cx="8" cy="13" r="2" />
											<circle cx="16" cy="13" r="2" />
										</svg>
									</div>
								{/if}
							</div>

							<!-- Pedal info -->
							<div style="flex: 1; min-width: 0;">
								<p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #F5F5F5; font-family: 'Inter', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
									{pedal.name}
								</p>
								<p style="margin: 0; font-size: 12px; color: #777777; font-family: 'Inter', sans-serif;">
									{pedal.brand}
								</p>
							</div>

							<!-- Affiliate link -->
							{#if pedal.affiliateLinks.length > 0}
								<a
									href={pedal.affiliateLinks[0].url}
									target="_blank"
									rel="noopener noreferrer"
									style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: transparent; border: 1px solid #FF6B35; border-radius: 6px; color: #FF6B35; text-decoration: none; font-size: 12px; font-weight: 500; font-family: 'Inter', sans-serif; transition: background 150ms ease, color 150ms ease;"
									onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FF6B35'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
									onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#FF6B35'; }}
								>
									Comprar
									<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="15 3 21 3 21 9" />
										<line x1="10" y1="14" x2="21" y2="3" />
									</svg>
								</a>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div style="padding: 32px; text-align: center; color: #555555; font-family: 'Inter', sans-serif; font-size: 14px; background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px;">
				Nenhum pedal encontrado neste board.
			</div>
		{/if}

	</div>
</main>

<!-- Toast -->
{#if toastVisible}
	<div
		style="position: fixed; bottom: 24px; right: 24px; z-index: 200; background: #1A1A1A; border: 1px solid #333333; border-radius: 8px; padding: 12px 20px; color: #F5F5F5; font-size: 14px; font-family: 'Inter', sans-serif; box-shadow: 0 4px 24px rgba(0,0,0,0.5);"
		role="status"
		aria-live="polite"
	>
		{toastMessage}
	</div>
{/if}

<style>
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>

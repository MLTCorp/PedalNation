<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	type BoardCard = {
		id: string;
		name: string;
		thumbnail_url: string | null;
		created_at: string;
		updated_at: string;
		pedalCount: number;
		username: string;
		display_name: string | null;
	};

	let boards = $state<BoardCard[]>(data.boards as BoardCard[]);
	let hasMore = $state(data.hasMore as boolean);
	let loading = $state(false);
	let loadMoreEl: HTMLDivElement | null = $state(null);

	function formatRelative(dateStr: string) {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `há ${Math.max(1, mins)} min`;
		const hours = Math.floor(diff / 3600000);
		if (hours < 24) return `há ${hours}h`;
		const days = Math.floor(diff / 86400000);
		if (days === 1) return 'ontem';
		if (days < 30) return `há ${days} dias`;
		if (days < 365) return `há ${Math.floor(days / 30)} meses`;
		return `há ${Math.floor(days / 365)} anos`;
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		try {
			const res = await fetch(`/api/boards-public?offset=${boards.length}`);
			if (res.ok) {
				const result = await res.json();
				boards = [...boards, ...result.boards];
				hasMore = result.hasMore;
			}
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!loadMoreEl) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && hasMore && !loading) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(loadMoreEl);
		return () => observer.disconnect();
	});

	let hoveredId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Boards da Comunidade | Pedal Nation</title>
	<meta name="description" content="Explore boards de pedalboard criados pela comunidade Pedal Nation." />
</svelte:head>

<main style="max-width: 1280px; margin: 0 auto; padding: 40px 24px; color: #F5F5F5; min-height: 100vh; background: #0F0F0F;">

	<!-- Page Header -->
	<div style="margin-bottom: 32px;">
		<h1 style="font-size: 28px; font-weight: 700; color: #F5F5F5; margin: 0 0 8px 0; font-family: 'Inter', sans-serif;">
			Boards da Comunidade
		</h1>
		<p style="font-size: 14px; color: #777777; margin: 0; font-family: 'Inter', sans-serif;">
			Inspire-se com setups de outros guitarristas
		</p>
	</div>

	<!-- Grid -->
	{#if boards.length === 0}
		<div style="text-align: center; padding: 80px 24px; font-family: 'Inter', sans-serif;">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#444444" stroke-width="1.5" style="margin: 0 auto 16px; display: block;">
				<rect x="2" y="6" width="20" height="13" rx="2" />
				<circle cx="7" cy="12" r="2" />
				<circle cx="12" cy="12" r="2" />
				<circle cx="17" cy="12" r="2" />
			</svg>
			<p style="color: #555555; font-size: 15px; margin: 0;">Nenhum board público ainda. Seja o primeiro!</p>
		</div>
	{:else}
		<div class="boards-grid">
			{#each boards as board (board.id)}
				<a
					href="/boards/{board.id}"
					class="board-card"
					onmouseenter={() => (hoveredId = board.id)}
					onmouseleave={() => (hoveredId = null)}
					style="text-decoration: none; display: block;"
				>
					<!-- Thumbnail 16:9 -->
					<div style="position: relative; aspect-ratio: 16/9; overflow: hidden; border-radius: 8px 8px 0 0;">
						{#if board.thumbnail_url}
							<img
								src={board.thumbnail_url}
								alt={board.name}
								style="width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 300ms ease;"
								style:transform={hoveredId === board.id ? 'scale(1.04)' : 'scale(1)'}
							/>
						{:else}
							<!-- Placeholder: bg #252525, icon #444444 -->
							<div style="width: 100%; height: 100%; background: #252525; display: flex; align-items: center; justify-content: center;">
								<svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<rect x="2" y="5" width="20" height="14" rx="2" stroke="#444444" stroke-width="1.5" fill="none" />
									<circle cx="7" cy="12" r="2.2" fill="#444444" />
									<circle cx="12" cy="12" r="2.2" fill="#444444" />
									<circle cx="17" cy="12" r="2.2" fill="#444444" />
									<line x1="2" y1="9" x2="22" y2="9" stroke="#444444" stroke-width="1" />
								</svg>
							</div>
						{/if}

						<!-- Gradient overlay with title and author -->
						<div
							style="position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 14px 12px; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); transition: opacity 200ms ease;"
							style:opacity={hoveredId === board.id ? 1 : 0.92}
						>
							<p style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #FFFFFF; font-family: 'Inter', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">
								{board.name}
							</p>
							<p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.65); font-family: 'Inter', sans-serif;">
								@{board.username}
							</p>
						</div>
					</div>

					<!-- Card footer -->
					<div style="padding: 10px 12px; background: #1A1A1A; border-radius: 0 0 8px 8px; border: 1px solid #2A2A2A; border-top: none; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
						<span style="font-size: 11px; color: #666666; font-family: 'Inter', sans-serif;">
							{board.pedalCount} {board.pedalCount === 1 ? 'pedal' : 'pedais'}
						</span>
						<span style="font-size: 11px; color: #555555; font-family: 'Inter', sans-serif;">
							{formatRelative(board.created_at)}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}

	<!-- Load More sentinel for Intersection Observer -->
	{#if hasMore}
		<div bind:this={loadMoreEl} style="height: 1px; margin-top: 48px;"></div>
	{/if}

	<!-- Loading indicator -->
	{#if loading}
		<div style="text-align: center; padding: 32px; color: #555555; font-size: 14px; font-family: 'Inter', sans-serif;">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle;">
				<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" />
			</svg>
			Carregando...
		</div>
	{/if}

	<!-- End of list message -->
	{#if !hasMore && boards.length > 0}
		<div style="text-align: center; padding: 32px; color: #444444; font-size: 13px; font-family: 'Inter', sans-serif;">
			Todos os boards foram carregados.
		</div>
	{/if}
</main>

<style>
	.boards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.board-card {
		border-radius: 8px;
		border: 1px solid #2A2A2A;
		overflow: hidden;
		transition: border-color 150ms ease, transform 150ms ease;
	}

	.board-card:hover {
		border-color: #444444;
		transform: translateY(-2px);
	}

	@media (min-width: 768px) {
		.boards-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.boards-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>

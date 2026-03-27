<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { profileUser, isOwner } = data;

	// Reactive boards list (supports fade-out on delete)
	let boards = $state(data.boards as typeof data.boards);

	// Toast state
	let toastMessage = $state('');
	let toastVisible = $state(false);

	function showToast(msg: string) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 3000);
	}

	// Format member since date
	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
	}

	// Format updated_at relative date
	function formatRelative(dateStr: string) {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'hoje';
		if (days === 1) return 'ontem';
		if (days < 30) return `há ${days} dias`;
		if (days < 365) return `há ${Math.floor(days / 30)} meses`;
		return `há ${Math.floor(days / 365)} anos`;
	}

	// Delete confirmation dialog
	let confirmDeleteId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	function openDeleteConfirm(id: string) {
		confirmDeleteId = id;
	}

	function cancelDelete() {
		confirmDeleteId = null;
	}

	async function confirmDelete() {
		if (!confirmDeleteId) return;
		const id = confirmDeleteId;
		confirmDeleteId = null;
		deletingId = id;

		try {
			const res = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
			if (res.ok) {
				// Trigger fade-out then remove
				setTimeout(() => {
					boards = boards.filter((b) => b.id !== id);
					deletingId = null;
					showToast('Board deletado com sucesso.');
				}, 350);
			} else {
				deletingId = null;
				showToast('Erro ao deletar board.');
			}
		} catch {
			deletingId = null;
			showToast('Erro ao deletar board.');
		}
	}

	// Duplicate board
	async function duplicateBoard(boardId: string, boardName: string) {
		try {
			const res = await fetch(`/api/boards/${boardId}/duplicate`, { method: 'POST' });
			if (res.ok) {
				const { board } = await res.json();
				boards = [board, ...boards];
				showToast(`Board "${boardName}" duplicado.`);
			} else {
				showToast('Erro ao duplicar board.');
			}
		} catch {
			showToast('Erro ao duplicar board.');
		}
	}

	let hoveredId = $state<string | null>(null);
</script>

<svelte:head>
	<title>{profileUser.display_name ?? profileUser.username} | Pedal Nation</title>
	<meta name="description" content="Boards de {profileUser.display_name ?? profileUser.username} no Pedal Nation." />
</svelte:head>

<main style="max-width: 1280px; margin: 0 auto; padding: 40px 24px; color: #F5F5F5; min-height: 100vh; background: #0F0F0F;">

	<!-- Profile Header -->
	<div style="display: flex; align-items: center; gap: 24px; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 1px solid #2A2A2A;">
		<!-- Avatar -->
		<div style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #1A1A1A; border: 2px solid #2A2A2A;">
			{#if profileUser.avatar_url}
				<img
					src={profileUser.avatar_url}
					alt={profileUser.display_name ?? profileUser.username}
					style="width: 100%; height: 100%; object-fit: cover;"
				/>
			{:else}
				<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #252525;">
					<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="12" cy="8" r="4" fill="#555555" />
						<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#555555" />
					</svg>
				</div>
			{/if}
		</div>

		<!-- Info -->
		<div style="flex: 1; min-width: 0;">
			<h2 style="font-size: 24px; font-weight: 700; color: #F5F5F5; margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">
				{profileUser.display_name ?? profileUser.username}
			</h2>
			<p style="font-size: 14px; color: #999999; margin: 0 0 6px 0; font-family: 'Inter', sans-serif;">
				@{profileUser.username}
			</p>
			<p style="font-size: 12px; color: #666666; margin: 0; font-family: 'Inter', sans-serif;">
				Membro desde {formatDate(profileUser.created_at)}
			</p>
		</div>

		<!-- Owner badge -->
		{#if isOwner}
			<div style="font-size: 12px; color: #FF6B35; background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.2); padding: 4px 12px; border-radius: 20px; font-family: 'Inter', sans-serif; font-weight: 500; flex-shrink: 0;">
				Seu perfil
			</div>
		{/if}
	</div>

	<!-- Section heading -->
	<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
		<h3 style="font-size: 18px; font-weight: 600; color: #F5F5F5; margin: 0; font-family: 'Inter', sans-serif;">
			{isOwner ? 'Meus Boards' : 'Boards Públicos'}
			<span style="font-size: 14px; color: #666666; font-weight: 400; margin-left: 8px;">({boards.length})</span>
		</h3>
		{#if isOwner}
			<a
				href="/builder"
				style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #FF6B35; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; transition: background 150ms ease;"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#E55A24')}
				onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '#FF6B35')}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Novo Board
			</a>
		{/if}
	</div>

	<!-- Board Grid -->
	{#if boards.length === 0}
		<div style="text-align: center; padding: 80px 24px; color: #555555; font-family: 'Inter', sans-serif;">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; display: block; opacity: 0.4;">
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<line x1="9" y1="3" x2="9" y2="21" />
				<line x1="15" y1="3" x2="15" y2="21" />
				<line x1="3" y1="9" x2="21" y2="9" />
				<line x1="3" y1="15" x2="21" y2="15" />
			</svg>
			<p style="font-size: 15px; color: #555555; margin: 0;">
				{isOwner ? 'Você ainda não tem boards. Crie um no Builder!' : 'Nenhum board público ainda.'}
			</p>
		</div>
	{:else}
		<div class="boards-grid">
			{#each boards as board (board.id)}
				<div
					class="board-card"
					style="opacity: {deletingId === board.id ? 0 : 1}; transition: opacity 350ms ease;"
					onmouseenter={() => (hoveredId = board.id)}
					onmouseleave={() => (hoveredId = null)}
					role="group"
					aria-label="Board: {board.name}"
				>
					<!-- Thumbnail -->
					<div style="position: relative; aspect-ratio: 16/9; background: #1A1A1A; border-radius: 8px 8px 0 0; overflow: hidden;">
						{#if board.thumbnail_url}
							<img
								src={board.thumbnail_url}
								alt={board.name}
								style="width: 100%; height: 100%; object-fit: cover;"
							/>
						{:else}
							<!-- Placeholder -->
							<div style="width: 100%; height: 100%; background: #252525; display: flex; align-items: center; justify-content: center;">
								<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<rect x="2" y="6" width="20" height="13" rx="2" stroke="#444444" stroke-width="1.5" fill="none" />
									<circle cx="7" cy="12" r="2" fill="#444444" />
									<circle cx="12" cy="12" r="2" fill="#444444" />
									<circle cx="17" cy="12" r="2" fill="#444444" />
									<line x1="2" y1="10" x2="22" y2="10" stroke="#444444" stroke-width="1" />
								</svg>
							</div>
						{/if}

						<!-- Hover overlay with action buttons (owner only) -->
						{#if isOwner && hoveredId === board.id}
							<div
								style="position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; gap: 12px; border-radius: 8px 8px 0 0;"
							>
								<!-- Edit -->
								<a
									href="/builder?board={board.id}"
									title="Editar board"
									style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 8px; color: #F5F5F5; text-decoration: none; transition: background 150ms ease;"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,107,53,0.3)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
									</svg>
								</a>

								<!-- Duplicate -->
								<button
									onclick={() => duplicateBoard(board.id, board.name)}
									title="Duplicar board"
									style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 8px; color: #F5F5F5; cursor: pointer; border: none; transition: background 150ms ease;"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="9" y="9" width="13" height="13" rx="2" />
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
									</svg>
								</button>

								<!-- Delete -->
								<button
									onclick={() => openDeleteConfirm(board.id)}
									title="Deletar board"
									style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 8px; color: #F5F5F5; cursor: pointer; border: none; transition: background 150ms ease;"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.4)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="3 6 5 6 21 6" />
										<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
										<path d="M10 11v6" />
										<path d="M14 11v6" />
										<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
									</svg>
								</button>
							</div>
						{/if}
					</div>

					<!-- Card body -->
					<div style="padding: 12px 14px; background: #1A1A1A; border-radius: 0 0 8px 8px; border: 1px solid #2A2A2A; border-top: none;">
						<a
							href="/boards/{board.id}"
							style="display: block; font-size: 14px; font-weight: 600; color: #F5F5F5; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; font-family: 'Inter', sans-serif; transition: color 150ms ease;"
							onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FF6B35')}
							onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.color = '#F5F5F5')}
						>
							{board.name}
						</a>
						<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
							<span style="font-size: 11px; color: #555555; font-family: 'Inter', sans-serif;">
								Atualizado {formatRelative(board.updated_at)}
							</span>
							{#if !board.is_public}
								<span style="font-size: 10px; color: #666666; background: #252525; border: 1px solid #333333; padding: 1px 6px; border-radius: 4px; font-family: 'Inter', sans-serif;">
									Privado
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>

<!-- Delete Confirmation Dialog -->
{#if confirmDeleteId}
	<div
		style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px;"
		role="dialog"
		aria-modal="true"
		aria-label="Confirmar exclusão"
	>
		<div style="background: #1A1A1A; border: 1px solid #333333; border-radius: 12px; padding: 28px 32px; max-width: 400px; width: 100%; font-family: 'Inter', sans-serif;">
			<h4 style="font-size: 17px; font-weight: 600; color: #F5F5F5; margin: 0 0 10px 0;">Deletar board?</h4>
			<p style="font-size: 14px; color: #999999; margin: 0 0 24px 0; line-height: 1.5;">
				Esta ação não pode ser desfeita. O board será permanentemente removido.
			</p>
			<div style="display: flex; gap: 10px; justify-content: flex-end;">
				<button
					onclick={cancelDelete}
					style="padding: 8px 20px; background: transparent; border: 1px solid #333333; border-radius: 7px; color: #999999; cursor: pointer; font-size: 14px; font-family: 'Inter', sans-serif; transition: border-color 150ms ease, color 150ms ease;"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#555555'; (e.currentTarget as HTMLElement).style.color = '#F5F5F5'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#333333'; (e.currentTarget as HTMLElement).style.color = '#999999'; }}
				>
					Cancelar
				</button>
				<button
					onclick={confirmDelete}
					style="padding: 8px 20px; background: #EF4444; border: 1px solid #EF4444; border-radius: 7px; color: #FFFFFF; cursor: pointer; font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif; transition: background 150ms ease;"
					onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#DC2626')}
					onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '#EF4444')}
				>
					Deletar
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Notification -->
{#if toastVisible}
	<div
		style="position: fixed; bottom: 24px; right: 24px; z-index: 200; background: #1A1A1A; border: 1px solid #333333; border-radius: 8px; padding: 12px 20px; color: #F5F5F5; font-size: 14px; font-family: 'Inter', sans-serif; box-shadow: 0 4px 24px rgba(0,0,0,0.5); transition: opacity 300ms ease;"
		role="status"
		aria-live="polite"
	>
		{toastMessage}
	</div>
{/if}

<style>
	.boards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.board-card {
		background: #1A1A1A;
		border-radius: 8px;
		border: 1px solid #2A2A2A;
		overflow: hidden;
		cursor: default;
		transition: border-color 150ms ease, transform 150ms ease;
	}

	.board-card:hover {
		border-color: #444444;
		transform: translateY(-2px);
	}

	@media (min-width: 1024px) {
		.boards-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>

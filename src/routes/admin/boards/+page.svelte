<script lang="ts">
	import { onMount } from 'svelte';

	type Board = {
		id: string;
		name: string;
		slug: string;
		brand: string;
		width_mm: number;
		height_mm: number;
		image_url: string | null;
		affiliate_url: string | null;
		is_active: boolean;
		created_at: string;
	};

	type FormData = Omit<Board, 'id' | 'created_at'>;

	let boards = $state<Board[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let page = $state(1);
	const limit = 20;

	let search = $state('');
	let sheetOpen = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formErrors = $state<Record<string, string[]>>({});
	let formError = $state('');

	const emptyForm = (): FormData => ({
		name: '',
		slug: '',
		brand: '',
		width_mm: 0,
		height_mm: 0,
		image_url: '',
		affiliate_url: '',
		is_active: true
	});

	let form = $state<FormData>(emptyForm());

	async function loadBoards() {
		loading = true;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				q: search
			});
			const res = await fetch(`/api/admin/boards?${params}`);
			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			boards = data.boards;
			total = data.total;
		} catch {
			boards = [];
		} finally {
			loading = false;
		}
	}

	onMount(loadBoards);

	let searchTimeout: ReturnType<typeof setTimeout>;
	function onSearchChange() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			page = 1;
			loadBoards();
		}, 300);
	}

	function openCreate() {
		editingId = null;
		form = emptyForm();
		formErrors = {};
		formError = '';
		sheetOpen = true;
	}

	function openEdit(board: Board) {
		editingId = board.id;
		form = {
			name: board.name,
			slug: board.slug,
			brand: board.brand,
			width_mm: board.width_mm,
			height_mm: board.height_mm,
			image_url: board.image_url ?? '',
			affiliate_url: board.affiliate_url ?? '',
			is_active: board.is_active
		};
		formErrors = {};
		formError = '';
		sheetOpen = true;
	}

	function autoSlug() {
		if (!editingId) {
			form.slug = `${form.brand}-${form.name}`
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.replace(/^-|-$/g, '');
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formLoading = true;
		formErrors = {};
		formError = '';

		try {
			const url = editingId ? `/api/admin/boards/${editingId}` : '/api/admin/boards';
			const method = editingId ? 'PUT' : 'POST';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});

			const data = await res.json();

			if (res.status === 422) {
				formErrors = data.details ?? {};
				return;
			}

			if (!res.ok) {
				formError = data.error ?? 'Erro ao salvar';
				return;
			}

			sheetOpen = false;
			await loadBoards();
		} catch {
			formError = 'Erro ao salvar board';
		} finally {
			formLoading = false;
		}
	}

	async function toggleActive(board: Board) {
		const res = await fetch(`/api/admin/boards/${board.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ is_active: !board.is_active })
		});
		if (res.ok) {
			board.is_active = !board.is_active;
			boards = [...boards];
		}
	}

	const totalPages = $derived(Math.ceil(total / limit));
</script>

<svelte:head>
	<title>Boards — Admin Pedal Nation</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Boards Comerciais</h2>
			<p class="page-subtitle">{total} boards no catálogo</p>
		</div>
		<button class="btn-primary" onclick={openCreate}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			Novo Board
		</button>
	</div>

	<div class="filters">
		<div class="search-wrap">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
			<input
				type="search"
				class="search-input"
				placeholder="Buscar por nome ou marca..."
				bind:value={search}
				oninput={onSearchChange}
			/>
		</div>
	</div>

	<div class="table-card">
		{#if loading}
			<div class="loading-rows">
				{#each Array(5) as _}
					<div class="skeleton-row">
						<div class="skeleton sk-text"></div>
						<div class="skeleton sk-text-sm"></div>
						<div class="skeleton sk-text-sm"></div>
						<div class="skeleton sk-badge"></div>
						<div class="skeleton sk-actions"></div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>Nome</th>
							<th>Marca</th>
							<th>Dimensões (L × A mm)</th>
							<th>Status</th>
							<th style="width:120px">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#if boards.length === 0}
							<tr>
								<td colspan="5" class="empty-row">Nenhum board encontrado</td>
							</tr>
						{:else}
							{#each boards as board, i}
								<tr class:alt={i % 2 !== 0}>
									<td>
										<div class="board-name">{board.name}</div>
										<div class="board-slug">{board.slug}</div>
									</td>
									<td class="text-secondary">{board.brand}</td>
									<td class="mono">{board.width_mm} × {board.height_mm}</td>
									<td>
										<span class="status-badge" class:active={board.is_active}>
											{board.is_active ? 'Ativo' : 'Inativo'}
										</span>
									</td>
									<td>
										<div class="action-btns">
											<button class="action-btn edit" onclick={() => openEdit(board)} title="Editar">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
											</button>
											<button
												class="action-btn"
												class:deactivate={board.is_active}
												class:reactivate={!board.is_active}
												onclick={() => toggleActive(board)}
												title={board.is_active ? 'Desativar' : 'Ativar'}
											>
												{#if board.is_active}
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
												{:else}
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
												{/if}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="pagination">
					<button class="page-btn" disabled={page <= 1} onclick={() => { page--; loadBoards(); }}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
					</button>
					<span class="page-info">Página {page} de {totalPages}</span>
					<button class="page-btn" disabled={page >= totalPages} onclick={() => { page++; loadBoards(); }}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Sheet -->
{#if sheetOpen}
	<div class="sheet-overlay" onclick={() => (sheetOpen = false)} role="presentation" aria-hidden="true"></div>
	<div class="sheet" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar Board' : 'Novo Board'}>
		<div class="sheet-header">
			<h3 class="sheet-title">{editingId ? 'Editar Board' : 'Novo Board'}</h3>
			<button class="close-btn" onclick={() => (sheetOpen = false)} aria-label="Fechar">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
			</button>
		</div>

		<form class="sheet-form" onsubmit={handleSubmit}>
			{#if formError}
				<div class="form-error-banner">{formError}</div>
			{/if}

			<div class="form-section">
				<h4 class="section-title">Informações Básicas</h4>
				<div class="form-grid-2">
					<div class="field">
						<label class="label">Nome *</label>
						<input
							class="input"
							class:input-error={!!formErrors.name}
							bind:value={form.name}
							oninput={autoSlug}
							placeholder="Ex: Classic Pro"
							required
						/>
						{#if formErrors.name}<p class="field-error">{formErrors.name[0]}</p>{/if}
					</div>
					<div class="field">
						<label class="label">Marca *</label>
						<input
							class="input"
							class:input-error={!!formErrors.brand}
							bind:value={form.brand}
							oninput={autoSlug}
							placeholder="Ex: Pedaltrain"
							required
						/>
						{#if formErrors.brand}<p class="field-error">{formErrors.brand[0]}</p>{/if}
					</div>
					<div class="field col-span-2">
						<label class="label">Slug</label>
						<input class="input mono" bind:value={form.slug} placeholder="gerado automaticamente" />
					</div>
				</div>
			</div>

			<div class="form-section">
				<h4 class="section-title">Dimensões</h4>
				<div class="form-grid-2">
					<div class="field">
						<label class="label">Largura (mm) *</label>
						<input
							class="input"
							class:input-error={!!formErrors.width_mm}
							type="number"
							bind:value={form.width_mm}
							placeholder="ex: 580"
							required
						/>
						{#if formErrors.width_mm}<p class="field-error">{formErrors.width_mm[0]}</p>{/if}
					</div>
					<div class="field">
						<label class="label">Altura (mm) *</label>
						<input
							class="input"
							class:input-error={!!formErrors.height_mm}
							type="number"
							bind:value={form.height_mm}
							placeholder="ex: 330"
							required
						/>
						{#if formErrors.height_mm}<p class="field-error">{formErrors.height_mm[0]}</p>{/if}
					</div>
				</div>
			</div>

			<div class="form-section">
				<h4 class="section-title">Links</h4>
				<div class="field">
					<label class="label">URL da Imagem</label>
					<input class="input mono" type="url" bind:value={form.image_url} placeholder="https://..." />
				</div>
				<div class="field" style="margin-top: 12px">
					<label class="label">URL de Afiliado (opcional)</label>
					<input class="input mono" type="url" bind:value={form.affiliate_url} placeholder="https://..." />
				</div>
			</div>

			<div class="form-section">
				<div class="toggle-field">
					<label class="label">Ativo</label>
					<button
						type="button"
						class="toggle"
						class:on={form.is_active}
						onclick={() => (form.is_active = !form.is_active)}
						role="switch"
						aria-checked={form.is_active}
					>
						<span class="toggle-knob"></span>
					</button>
				</div>
			</div>

			<div class="sheet-actions">
				<button type="button" class="btn-cancel" onclick={() => (sheetOpen = false)}>Cancelar</button>
				<button type="submit" class="btn-save" disabled={formLoading}>
					{#if formLoading}
						<span class="spinner-sm"></span>
						Salvando...
					{:else}
						{editingId ? 'Salvar alterações' : 'Criar board'}
					{/if}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.page { display: flex; flex-direction: column; gap: 20px; }
	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
	.page-title { font-size: 22px; font-weight: 700; color: #F5F5F5; margin: 0 0 4px 0; letter-spacing: -0.02em; }
	.page-subtitle { font-size: 13px; color: #666666; margin: 0; }

	.btn-primary {
		display: flex; align-items: center; gap: 6px; padding: 8px 16px;
		background-color: #FF6B35; color: #FFFFFF; font-size: 13px; font-weight: 600;
		font-family: inherit; border: none; border-radius: 7px; cursor: pointer;
		transition: background-color 150ms ease; white-space: nowrap;
	}
	.btn-primary:hover { background-color: #FF8555; }

	.filters { display: flex; gap: 10px; }
	.search-wrap { flex: 1; position: relative; display: flex; align-items: center; }
	.search-wrap svg { position: absolute; left: 10px; color: #555555; pointer-events: none; }
	.search-input {
		width: 100%; height: 36px; padding: 0 12px 0 32px;
		background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 7px;
		color: #F5F5F5; font-size: 13px; font-family: inherit;
	}
	.search-input:focus { outline: none; border-color: #FF6B35; }

	.table-card { background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; overflow: hidden; }
	.table-wrapper { overflow-x: auto; }
	.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
	.data-table th {
		padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
		color: #666666; text-transform: uppercase; letter-spacing: 0.05em;
		background-color: #222222; border-bottom: 1px solid #2A2A2A;
	}
	.data-table td { padding: 10px 14px; color: #C0C0C0; border-bottom: 1px solid #1F1F1F; vertical-align: middle; }
	.data-table tr.alt td { background-color: #1D1D1D; }
	.data-table tr:last-child td { border-bottom: none; }

	.board-name { font-weight: 500; color: #F5F5F5; font-size: 13px; }
	.board-slug { font-size: 11px; color: #555555; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
	.text-secondary { color: #888888; }
	.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

	.status-badge {
		display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
		background-color: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.25);
	}
	.status-badge.active { background-color: rgba(34, 197, 94, 0.1); color: #22C55E; border-color: rgba(34, 197, 94, 0.25); }

	.action-btns { display: flex; gap: 6px; }
	.action-btn {
		width: 30px; height: 30px; border-radius: 5px; border: 1px solid #333333;
		background: transparent; color: #666666; cursor: pointer;
		display: flex; align-items: center; justify-content: center; transition: all 150ms ease;
	}
	.action-btn.edit:hover { background-color: rgba(255, 107, 53, 0.1); border-color: rgba(255, 107, 53, 0.3); color: #FF6B35; }
	.action-btn.deactivate:hover { background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #EF4444; }
	.action-btn.reactivate:hover { background-color: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); color: #22C55E; }

	.empty-row { text-align: center; color: #555555; padding: 32px 12px !important; font-size: 13px; }

	.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 16px; border-top: 1px solid #222222; }
	.page-btn { width: 30px; height: 30px; border-radius: 5px; border: 1px solid #333333; background: transparent; color: #888888; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms ease; }
	.page-btn:hover:not(:disabled) { background-color: #252525; color: #F5F5F5; }
	.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.page-info { font-size: 12px; color: #666666; }

	.loading-rows { padding: 8px 0; }
	.skeleton-row { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-bottom: 1px solid #1F1F1F; }
	.skeleton { background: linear-gradient(90deg, #252525 25%, #2A2A2A 50%, #252525 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 5px; }
	@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
	.sk-text { flex: 1; height: 14px; }
	.sk-text-sm { width: 80px; height: 14px; }
	.sk-badge { width: 70px; height: 20px; }
	.sk-actions { width: 70px; height: 28px; }

	/* Sheet */
	.sheet-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); z-index: 100; }
	.sheet { position: fixed; top: 0; right: 0; width: 480px; height: 100vh; background-color: #1A1A1A; border-left: 1px solid #2A2A2A; z-index: 101; display: flex; flex-direction: column; overflow: hidden; }
	.sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #2A2A2A; flex-shrink: 0; }
	.sheet-title { font-size: 16px; font-weight: 600; color: #F5F5F5; margin: 0; }
	.close-btn { width: 30px; height: 30px; border-radius: 5px; border: 1px solid #333333; background: transparent; color: #666666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms ease; }
	.close-btn:hover { background-color: #252525; color: #F5F5F5; }
	.sheet-form { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 0; }
	.form-section { margin-bottom: 20px; }
	.section-title { font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #222222; }
	.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
	.col-span-2 { grid-column: span 2; }
	.field { display: flex; flex-direction: column; gap: 5px; }
	.label { font-size: 12px; font-weight: 500; color: #AAAAAA; }
	.input { width: 100%; height: 36px; padding: 0 10px; background-color: #141414; border: 1px solid #2A2A2A; border-radius: 6px; color: #F5F5F5; font-size: 13px; font-family: inherit; transition: border-color 150ms ease; box-sizing: border-box; }
	.input:focus { outline: none; border-color: #FF6B35; box-shadow: 0 0 0 2px rgba(255,107,53,0.12); }
	.input.input-error { border-color: #EF4444; }
	.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
	.field-error { font-size: 11px; color: #EF4444; margin: 0; }
	.form-error-banner { padding: 10px 12px; background-color: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 6px; color: #EF4444; font-size: 13px; margin-bottom: 16px; }
	.toggle-field { display: flex; align-items: center; justify-content: space-between; }
	.toggle { width: 40px; height: 22px; border-radius: 11px; background-color: #333333; border: none; cursor: pointer; position: relative; transition: background-color 150ms ease; padding: 0; }
	.toggle.on { background-color: #FF6B35; }
	.toggle-knob { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background-color: #FFFFFF; transition: transform 150ms ease; }
	.toggle.on .toggle-knob { transform: translateX(18px); }
	.sheet-actions { display: flex; gap: 10px; padding: 16px 0 4px; border-top: 1px solid #222222; margin-top: auto; }
	.btn-cancel { flex: 1; height: 38px; background: transparent; border: 1px solid #333333; border-radius: 7px; color: #888888; font-size: 13px; font-family: inherit; cursor: pointer; transition: all 150ms ease; }
	.btn-cancel:hover { border-color: #555555; color: #F5F5F5; }
	.btn-save { flex: 2; height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #FF6B35; border: none; border-radius: 7px; color: #FFFFFF; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background-color 150ms ease; }
	.btn-save:hover:not(:disabled) { background-color: #FF8555; }
	.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
	.spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
	@keyframes spin { to { transform: rotate(360deg); } }
</style>

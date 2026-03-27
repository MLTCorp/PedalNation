<script lang="ts">
	import { onMount } from 'svelte';

	type AffiliateLink = {
		id: string;
		pedal_id: string;
		store_name: string;
		url: string;
		affiliate_code: string | null;
		region: 'br' | 'us' | 'global';
		is_primary: boolean;
		is_active: boolean;
		created_at: string;
		pedals: { id: string; name: string; slug: string } | null;
		click_count: number;
	};

	type Pedal = { id: string; name: string; brand: string; slug: string };

	type FormData = {
		pedal_id: string;
		store_name: string;
		url: string;
		affiliate_code: string;
		region: 'br' | 'us' | 'global';
		is_primary: boolean;
		is_active: boolean;
	};

	let links = $state<AffiliateLink[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let page = $state(1);
	const limit = 20;

	let pedalSearch = $state('');
	let storeFilter = $state('');
	let sheetOpen = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formErrors = $state<Record<string, string[]>>({});
	let formError = $state('');

	// Pedal autocomplete
	let pedals = $state<Pedal[]>([]);
	let pedalSearchInput = $state('');
	let pedalDropdownOpen = $state(false);
	let filteredPedals = $derived(
		pedals.filter(p =>
			`${p.name} ${p.brand}`.toLowerCase().includes(pedalSearchInput.toLowerCase())
		).slice(0, 8)
	);
	let selectedPedal = $state<Pedal | null>(null);

	const emptyForm = (): FormData => ({
		pedal_id: '',
		store_name: '',
		url: '',
		affiliate_code: '',
		region: 'br',
		is_primary: false,
		is_active: true
	});

	let form = $state<FormData>(emptyForm());

	const storeNames = ['Amazon', 'Thomann', 'Mercado Livre', 'Guitar Center', 'Sweetwater', 'Submarino', 'Americanas'];

	async function loadLinks() {
		loading = true;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				pedal: pedalSearch,
				store: storeFilter
			});
			const res = await fetch(`/api/admin/links?${params}`);
			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			links = data.links;
			total = data.total;
		} catch {
			links = [];
		} finally {
			loading = false;
		}
	}

	async function loadPedals() {
		const res = await fetch('/api/admin/pedals?limit=200');
		if (res.ok) {
			const data = await res.json();
			pedals = data.pedals;
		}
	}

	onMount(() => {
		loadLinks();
		loadPedals();
	});

	let searchTimeout: ReturnType<typeof setTimeout>;
	function onFilterChange() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			page = 1;
			loadLinks();
		}, 300);
	}

	function openCreate() {
		editingId = null;
		form = emptyForm();
		selectedPedal = null;
		pedalSearchInput = '';
		formErrors = {};
		formError = '';
		sheetOpen = true;
	}

	function openEdit(link: AffiliateLink) {
		editingId = link.id;
		form = {
			pedal_id: link.pedal_id,
			store_name: link.store_name,
			url: link.url,
			affiliate_code: link.affiliate_code ?? '',
			region: link.region,
			is_primary: link.is_primary,
			is_active: link.is_active
		};
		selectedPedal = link.pedals ? { ...link.pedals, brand: '' } : null;
		pedalSearchInput = link.pedals?.name ?? '';
		formErrors = {};
		formError = '';
		sheetOpen = true;
	}

	function selectPedal(pedal: Pedal) {
		selectedPedal = pedal;
		form.pedal_id = pedal.id;
		pedalSearchInput = `${pedal.brand} ${pedal.name}`;
		pedalDropdownOpen = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formLoading = true;
		formErrors = {};
		formError = '';

		try {
			const url = editingId ? `/api/admin/links/${editingId}` : '/api/admin/links';
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
			await loadLinks();
		} catch {
			formError = 'Erro ao salvar link';
		} finally {
			formLoading = false;
		}
	}

	// Optimistic toggle
	async function toggleActive(link: AffiliateLink) {
		const prevState = link.is_active;
		// Optimistic update
		link.is_active = !prevState;
		links = [...links];

		const res = await fetch(`/api/admin/links/${link.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ is_active: link.is_active })
		});

		if (!res.ok) {
			// Revert
			link.is_active = prevState;
			links = [...links];
		}
	}

	function truncateUrl(url: string, maxLen = 50): string {
		if (url.length <= maxLen) return url;
		return url.slice(0, maxLen) + '...';
	}

	const totalPages = $derived(Math.ceil(total / limit));
</script>

<svelte:head>
	<title>Links de Afiliado — Admin Pedal Nation</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Links de Afiliado</h2>
			<p class="page-subtitle">{total} links cadastrados</p>
		</div>
		<button class="btn-primary" onclick={openCreate}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			Novo Link
		</button>
	</div>

	<div class="filters">
		<div class="search-wrap">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
			<input
				type="search"
				class="search-input"
				placeholder="Buscar por pedal..."
				bind:value={pedalSearch}
				oninput={onFilterChange}
			/>
		</div>
		<select class="filter-select" bind:value={storeFilter} onchange={onFilterChange}>
			<option value="">Todas as lojas</option>
			{#each storeNames as store}
				<option value={store}>{store}</option>
			{/each}
		</select>
	</div>

	<div class="table-card">
		{#if loading}
			<div class="loading-rows">
				{#each Array(5) as _}
					<div class="skeleton-row">
						{#each Array(6) as _}
							<div class="skeleton sk-text"></div>
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>Pedal</th>
							<th>Loja</th>
							<th>URL</th>
							<th>Região</th>
							<th>Primário</th>
							<th>Ativo</th>
							<th>Cliques</th>
							<th style="width:80px">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#if links.length === 0}
							<tr>
								<td colspan="8" class="empty-row">Nenhum link encontrado</td>
							</tr>
						{:else}
							{#each links as link, i}
								<tr class:alt={i % 2 !== 0}>
									<td>
										<span class="pedal-name">{link.pedals?.name ?? '—'}</span>
									</td>
									<td class="text-secondary">{link.store_name}</td>
									<td>
										<span class="url-cell" title={link.url}>{truncateUrl(link.url)}</span>
									</td>
									<td>
										<span class="region-badge region-{link.region}">{link.region.toUpperCase()}</span>
									</td>
									<td>
										{#if link.is_primary}
											<span class="primary-badge">Primário</span>
										{:else}
											<span class="text-muted">—</span>
										{/if}
									</td>
									<td>
										<button
											class="toggle-inline"
											class:on={link.is_active}
											onclick={() => toggleActive(link)}
											role="switch"
											aria-checked={link.is_active}
											title={link.is_active ? 'Desativar' : 'Ativar'}
										>
											<span class="toggle-knob-sm"></span>
										</button>
									</td>
									<td>
										<span class="clicks-count">{link.click_count}</span>
									</td>
									<td>
										<div class="action-btns">
											<button class="action-btn edit" onclick={() => openEdit(link)} title="Editar">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
					<button class="page-btn" disabled={page <= 1} onclick={() => { page--; loadLinks(); }}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
					</button>
					<span class="page-info">Página {page} de {totalPages}</span>
					<button class="page-btn" disabled={page >= totalPages} onclick={() => { page++; loadLinks(); }}>
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
	<div class="sheet" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar Link' : 'Novo Link'}>
		<div class="sheet-header">
			<h3 class="sheet-title">{editingId ? 'Editar Link de Afiliado' : 'Novo Link de Afiliado'}</h3>
			<button class="close-btn" onclick={() => (sheetOpen = false)} aria-label="Fechar">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
			</button>
		</div>

		<form class="sheet-form" onsubmit={handleSubmit}>
			{#if formError}
				<div class="form-error-banner">{formError}</div>
			{/if}

			<div class="form-section">
				<h4 class="section-title">Associação</h4>
				<div class="field">
					<label class="label">Pedal *</label>
					<div class="autocomplete-wrap">
						<input
							class="input"
							class:input-error={!!formErrors.pedal_id}
							bind:value={pedalSearchInput}
							onfocus={() => (pedalDropdownOpen = true)}
							oninput={() => (pedalDropdownOpen = true)}
							onblur={() => setTimeout(() => (pedalDropdownOpen = false), 150)}
							placeholder="Buscar pedal..."
						/>
						{#if pedalDropdownOpen && filteredPedals.length > 0}
							<div class="autocomplete-dropdown">
								{#each filteredPedals as p}
									<button
										type="button"
										class="autocomplete-item"
										onmousedown={() => selectPedal(p)}
									>
										<span class="ac-name">{p.name}</span>
										<span class="ac-brand">{p.brand}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
					{#if formErrors.pedal_id}<p class="field-error">{formErrors.pedal_id[0]}</p>{/if}
				</div>
			</div>

			<div class="form-section">
				<h4 class="section-title">Link</h4>
				<div class="form-grid-2">
					<div class="field">
						<label class="label">Loja *</label>
						<input
							class="input"
							class:input-error={!!formErrors.store_name}
							bind:value={form.store_name}
							list="stores-list"
							placeholder="Ex: Amazon"
						/>
						<datalist id="stores-list">
							{#each storeNames as s}
								<option value={s}></option>
							{/each}
						</datalist>
						{#if formErrors.store_name}<p class="field-error">{formErrors.store_name[0]}</p>{/if}
					</div>
					<div class="field">
						<label class="label">Região</label>
						<select class="input" bind:value={form.region}>
							<option value="br">Brasil (BR)</option>
							<option value="us">USA (US)</option>
							<option value="global">Global</option>
						</select>
					</div>
					<div class="field col-span-2">
						<label class="label">URL * (deve começar com https://)</label>
						<input
							class="input mono"
							class:input-error={!!formErrors.url}
							type="url"
							bind:value={form.url}
							placeholder="https://..."
						/>
						{#if formErrors.url}<p class="field-error">{formErrors.url[0]}</p>{/if}
					</div>
					<div class="field col-span-2">
						<label class="label">Código de Afiliado</label>
						<input class="input mono" bind:value={form.affiliate_code} placeholder="Ex: pedalnation-20" />
					</div>
				</div>
			</div>

			<div class="form-section">
				<h4 class="section-title">Configurações</h4>
				<div class="toggle-row">
					<div class="toggle-item">
						<span class="label">Link Primário</span>
						<p class="toggle-hint">Aparece com destaque na página do pedal</p>
					</div>
					<button
						type="button"
						class="toggle"
						class:on={form.is_primary}
						onclick={() => (form.is_primary = !form.is_primary)}
						role="switch"
						aria-checked={form.is_primary}
					>
						<span class="toggle-knob"></span>
					</button>
				</div>
				<div class="toggle-row" style="margin-top: 14px">
					<div class="toggle-item">
						<span class="label">Ativo</span>
					</div>
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
						{editingId ? 'Salvar alterações' : 'Criar link'}
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

	.btn-primary { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background-color: #FF6B35; color: #FFFFFF; font-size: 13px; font-weight: 600; font-family: inherit; border: none; border-radius: 7px; cursor: pointer; transition: background-color 150ms ease; white-space: nowrap; }
	.btn-primary:hover { background-color: #FF8555; }

	.filters { display: flex; gap: 10px; flex-wrap: wrap; }
	.search-wrap { flex: 1; min-width: 200px; position: relative; display: flex; align-items: center; }
	.search-wrap svg { position: absolute; left: 10px; color: #555555; pointer-events: none; }
	.search-input { width: 100%; height: 36px; padding: 0 12px 0 32px; background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 7px; color: #F5F5F5; font-size: 13px; font-family: inherit; }
	.search-input:focus { outline: none; border-color: #FF6B35; }
	.filter-select { height: 36px; padding: 0 12px; background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 7px; color: #F5F5F5; font-size: 13px; font-family: inherit; cursor: pointer; }

	.table-card { background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; overflow: hidden; }
	.table-wrapper { overflow-x: auto; }
	.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
	.data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.05em; background-color: #222222; border-bottom: 1px solid #2A2A2A; }
	.data-table td { padding: 10px 14px; color: #C0C0C0; border-bottom: 1px solid #1F1F1F; vertical-align: middle; }
	.data-table tr.alt td { background-color: #1D1D1D; }
	.data-table tr:last-child td { border-bottom: none; }

	.pedal-name { font-weight: 500; color: #F5F5F5; }
	.text-secondary { color: #888888; }
	.text-muted { color: #555555; }

	.url-cell { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #888888; cursor: default; }

	.region-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }
	.region-br { background-color: rgba(34, 197, 94, 0.1); color: #22C55E; border: 1px solid rgba(34, 197, 94, 0.25); }
	.region-us { background-color: rgba(59, 130, 246, 0.1); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.25); }
	.region-global { background-color: rgba(168, 85, 247, 0.1); color: #A855F7; border: 1px solid rgba(168, 85, 247, 0.25); }

	.primary-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; background-color: rgba(255, 107, 53, 0.1); color: #FF6B35; border: 1px solid rgba(255, 107, 53, 0.25); }

	.toggle-inline { width: 32px; height: 18px; border-radius: 9px; background-color: #333333; border: none; cursor: pointer; position: relative; transition: background-color 150ms ease; padding: 0; }
	.toggle-inline.on { background-color: #FF6B35; }
	.toggle-knob-sm { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background-color: #FFFFFF; transition: transform 150ms ease; }
	.toggle-inline.on .toggle-knob-sm { transform: translateX(14px); }

	.clicks-count { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #FF6B35; font-weight: 600; }

	.action-btns { display: flex; gap: 6px; }
	.action-btn { width: 30px; height: 30px; border-radius: 5px; border: 1px solid #333333; background: transparent; color: #666666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms ease; }
	.action-btn.edit:hover { background-color: rgba(255, 107, 53, 0.1); border-color: rgba(255, 107, 53, 0.3); color: #FF6B35; }

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

	/* Autocomplete */
	.autocomplete-wrap { position: relative; }
	.autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; background-color: #1E1E1E; border: 1px solid #2A2A2A; border-radius: 6px; z-index: 200; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.4); margin-top: 2px; }
	.autocomplete-item { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 12px; background: transparent; border: none; cursor: pointer; text-align: left; transition: background-color 100ms ease; }
	.autocomplete-item:hover { background-color: #252525; }
	.ac-name { font-size: 13px; color: #F5F5F5; }
	.ac-brand { font-size: 11px; color: #666666; }

	/* Toggle */
	.toggle-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
	.toggle-item { display: flex; flex-direction: column; gap: 2px; }
	.toggle-hint { font-size: 11px; color: #666666; margin: 0; }
	.toggle { width: 40px; height: 22px; border-radius: 11px; background-color: #333333; border: none; cursor: pointer; position: relative; transition: background-color 150ms ease; padding: 0; flex-shrink: 0; }
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

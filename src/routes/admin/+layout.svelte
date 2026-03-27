<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const navItems = [
		{
			href: '/admin/dashboard',
			label: 'Dashboard',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
		},
		{
			href: '/admin/pedals',
			label: 'Pedais',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`
		},
		{
			href: '/admin/boards',
			label: 'Boards',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
		},
		{
			href: '/admin/links',
			label: 'Links de Afiliado',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
		}
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<div class="admin-layout">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/admin/dashboard" class="brand">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="12" r="10" fill="#FF6B35" opacity="0.2"/>
					<circle cx="12" cy="12" r="5" fill="#FF6B35"/>
				</svg>
				<span class="brand-name">PedalNation</span>
			</a>
			<span class="admin-badge">Admin</span>
		</div>

		<nav class="nav">
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-link"
					class:active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					<span class="nav-icon">{@html item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<div class="user-info">
				<div class="user-avatar">
					{(data.user?.email?.[0] ?? 'A').toUpperCase()}
				</div>
				<div class="user-details">
					<span class="user-email">{data.user?.email ?? 'Admin'}</span>
					<span class="user-role">Administrador</span>
				</div>
			</div>
			<button class="logout-btn" onclick={handleLogout} aria-label="Sair">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
					<polyline points="16 17 21 12 16 7"/>
					<line x1="21" y1="12" x2="9" y2="12"/>
				</svg>
			</button>
		</div>
	</aside>

	<!-- Main content -->
	<div class="main">
		<header class="top-header">
			<h1 class="header-title">Admin — Pedal Nation</h1>
			<div class="header-actions">
				<a href="/" class="view-site-btn" target="_blank" rel="noopener noreferrer">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
						<polyline points="15 3 21 3 21 9"/>
						<line x1="10" y1="14" x2="21" y2="3"/>
					</svg>
					Ver site
				</a>
			</div>
		</header>

		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
		background-color: #0F0F0F;
		font-family: 'Inter', sans-serif;
	}

	/* Sidebar */
	.sidebar {
		width: 240px;
		min-width: 240px;
		background-color: #1A1A1A;
		border-right: 1px solid #2A2A2A;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		z-index: 50;
		overflow-y: auto;
	}

	.sidebar-header {
		padding: 20px 16px 16px;
		border-bottom: 1px solid #2A2A2A;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
	}

	.brand-name {
		font-size: 15px;
		font-weight: 700;
		color: #F5F5F5;
		letter-spacing: -0.02em;
	}

	.admin-badge {
		font-size: 10px;
		font-weight: 600;
		color: #FF6B35;
		background-color: rgba(255, 107, 53, 0.12);
		border: 1px solid rgba(255, 107, 53, 0.25);
		border-radius: 4px;
		padding: 2px 6px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		align-self: flex-start;
	}

	.nav {
		padding: 12px 8px;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 10px;
		border-radius: 6px;
		text-decoration: none;
		color: #999999;
		font-size: 13px;
		font-weight: 500;
		transition: background-color 150ms ease, color 150ms ease;
	}

	.nav-link:hover {
		background-color: #252525;
		color: #F5F5F5;
	}

	.nav-link.active {
		background-color: rgba(255, 107, 53, 0.15);
		color: #FF6B35;
	}

	.nav-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.nav-label {
		flex: 1;
	}

	.sidebar-footer {
		padding: 12px 8px;
		border-top: 1px solid #2A2A2A;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.user-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: rgba(255, 107, 53, 0.2);
		border: 1px solid rgba(255, 107, 53, 0.3);
		color: #FF6B35;
		font-size: 13px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.user-email {
		font-size: 11px;
		color: #F5F5F5;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-role {
		font-size: 10px;
		color: #666666;
	}

	.logout-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: transparent;
		border: 1px solid #333333;
		color: #666666;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
	}

	.logout-btn:hover {
		background-color: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #EF4444;
	}

	/* Main content */
	.main {
		flex: 1;
		margin-left: 240px;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.top-header {
		height: 56px;
		background-color: #1A1A1A;
		border-bottom: 1px solid #2A2A2A;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
		position: sticky;
		top: 0;
		z-index: 40;
	}

	.header-title {
		font-size: 15px;
		font-weight: 600;
		color: #F5F5F5;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.view-site-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #999999;
		text-decoration: none;
		padding: 5px 10px;
		border-radius: 5px;
		border: 1px solid #333333;
		transition: color 150ms ease, border-color 150ms ease;
	}

	.view-site-btn:hover {
		color: #F5F5F5;
		border-color: #555555;
	}

	.content {
		flex: 1;
		padding: 24px;
	}
</style>

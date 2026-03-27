<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Session, User } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabase';

	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		session: Session | null;
		user: User | null;
	}

	let { session, user }: Props = $props();

	const navLinks = [
		{ label: 'Builder', href: '/builder' },
		{ label: 'Catálogo', href: '/pedals' },
		{ label: 'Boards', href: '/boards' }
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}

	function getUserInitials(): string {
		if (user?.user_metadata?.full_name) {
			return user.user_metadata.full_name
				.split(' ')
				.map((n: string) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		if (user?.email) {
			return user.email.slice(0, 2).toUpperCase();
		}
		return 'U';
	}

	let mobileMenuOpen = $state(false);
</script>

<header
	class="header"
	style="background: #1A1A1A; border-bottom: 1px solid #333333; height: 56px;"
>
	<div class="header-inner">
		<!-- Logo -->
		<a href="/" class="logo" aria-label="PedalNation - Home">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
					fill="#FF6B35"
				/>
				<path
					d="M9 6c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v.5c0 .28-.22.5-.5.5h-5C9.22 7 9 6.78 9 6.5V6z"
					fill="#FF6B35"
					opacity="0.7"
				/>
				<!-- Guitar body shape -->
				<ellipse cx="12" cy="15" rx="4" ry="5" fill="#FF6B35" opacity="0.15" />
				<path
					d="M10 10.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-5z"
					fill="none"
					stroke="#FF6B35"
					stroke-width="1.5"
				/>
			</svg>
			<span class="logo-text">PedalNation</span>
		</a>

		<!-- Desktop Navigation -->
		<nav class="nav-desktop" aria-label="Navegação principal">
			{#each navLinks as link}
				<a
					href={link.href}
					class="nav-link"
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Auth Controls -->
		<div class="auth-controls">
			{#if session && user}
				<!-- Authenticated: Avatar with dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<button class="avatar-button" aria-label="Menu do usuário">
							<Avatar.Root class="avatar-root">
								{#if user.user_metadata?.avatar_url}
									<Avatar.Image
										src={user.user_metadata.avatar_url}
										alt={user.user_metadata?.full_name ?? user.email ?? 'Avatar'}
									/>
								{/if}
								<Avatar.Fallback class="avatar-fallback">
									{getUserInitials()}
								</Avatar.Fallback>
							</Avatar.Root>
				</button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="dropdown-content">
						<DropdownMenu.Label class="dropdown-label">
							{user.user_metadata?.full_name ?? user.email ?? 'Minha Conta'}
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="dropdown-item" onclick={() => goto('/profile')}>
							Meu Perfil
						</DropdownMenu.Item>
						<DropdownMenu.Item class="dropdown-item" onclick={() => goto('/my-boards')}>
							Meus Boards
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="dropdown-item dropdown-item-danger" onclick={handleSignOut}>
							Sair
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<!-- Not authenticated: Login button -->
				<a href="/auth/login" class="login-btn">
					Login
				</a>
			{/if}

			<!-- Mobile hamburger -->
			<button class="hamburger-btn" aria-label="Abrir menu de navegação" onclick={() => (mobileMenuOpen = true)}>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>
			<Sheet.Root bind:open={mobileMenuOpen}>
				<Sheet.Content side="left" class="mobile-sheet">
					<Sheet.Header>
						<Sheet.Title>
							<a href="/" class="logo" onclick={() => (mobileMenuOpen = false)}>
						<svg
									width="24"
									height="24"
							viewBox="0 0 24 24"
							fill="none"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
						>
									<ellipse cx="12" cy="15" rx="4" ry="5" fill="#FF6B35" opacity="0.15" />
									<path
										d="M10 10.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-5z"
								fill="none"
										stroke="#FF6B35"
										stroke-width="1.5"
									/>
						</svg>
								<span class="logo-text">PedalNation</span>
							</a>
						</Sheet.Title>
					</Sheet.Header>
					<nav class="mobile-nav" aria-label="Navegação mobile">
						{#each navLinks as link}
							<a
								href={link.href}
								class="mobile-nav-link"
								class:active={isActive(link.href)}
								onclick={() => (mobileMenuOpen = false)}
								aria-current={isActive(link.href) ? 'page' : undefined}
					>
								{link.label}
							</a>
						{/each}
					</nav>
					{#if !session}
						<div class="mobile-auth">
							<a
								href="/auth/login"
								class="login-btn w-full"
								onclick={() => (mobileMenuOpen = false)}
					>
								Login
							</a>
						</div>
					{/if}
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 50;
		width: 100%;
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		max-width: 1280px;
		margin: 0 auto;
		padding: 0 24px;
		gap: 32px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		flex-shrink: 0;
	}

	.logo-text {
		font-size: 16px;
		font-weight: 700;
		color: #F5F5F5;
		letter-spacing: -0.02em;
	}

	/* Desktop nav */
	.nav-desktop {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: 1;
	}

	.nav-link {
		position: relative;
		padding: 6px 12px;
		font-size: 14px;
		font-weight: 500;
		color: #F5F5F5;
		text-decoration: none;
		border-radius: 6px;
		transition: color 150ms ease;
	}

	.nav-link:hover {
		color: #FF6B35;
	}

	.nav-link.active {
		color: #FF6B35;
	}

	.nav-link.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 12px;
		right: 12px;
		height: 2px;
		background-color: #FF6B35;
		border-radius: 1px;
	}

	/* Auth controls */
	.auth-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.login-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 34px;
		padding: 0 16px;
		font-size: 14px;
		font-weight: 500;
		color: #F5F5F5;
		text-decoration: none;
		border: 1px solid #333333;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
		white-space: nowrap;
	}

	.login-btn:hover {
		background: #FF6B35;
		border-color: #FF6B35;
		color: #FFFFFF;
	}

	/* Avatar button */
	.avatar-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		border-radius: 50%;
		transition: opacity 150ms ease;
	}

	.avatar-button:hover {
		opacity: 0.85;
	}

	/* Hamburger - hidden on desktop */
	.hamburger-btn {
		display: none;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: none;
		border: 1px solid #333333;
		border-radius: 6px;
		color: #F5F5F5;
		cursor: pointer;
		transition: border-color 150ms ease, color 150ms ease;
	}

	.hamburger-btn:hover {
		border-color: #FF6B35;
		color: #FF6B35;
	}

	/* Mobile nav inside Sheet */
	.mobile-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 24px;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		padding: 10px 12px;
		font-size: 15px;
		font-weight: 500;
		color: #F5F5F5;
		text-decoration: none;
		border-radius: 6px;
		transition: color 150ms ease, background-color 150ms ease;
	}

	.mobile-nav-link:hover {
		color: #FF6B35;
		background-color: rgba(255, 107, 53, 0.08);
	}

	.mobile-nav-link.active {
		color: #FF6B35;
		background-color: rgba(255, 107, 53, 0.1);
		border-left: 2px solid #FF6B35;
		padding-left: 10px;
	}

	.mobile-auth {
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid #333333;
	}

	/* Responsive: show hamburger, hide desktop nav on mobile */
	@media (max-width: 767px) {
		.nav-desktop {
			display: none;
		}

		.hamburger-btn {
			display: flex;
		}
	}
</style>

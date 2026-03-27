<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let googleLoading = $state(false);
	let errors = $state<{ email?: string; password?: string; form?: string }>({});
	let successMessage = $state('');

	function validateEmail(value: string): string | undefined {
		if (!value) return 'Email é obrigatório';
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(value)) return 'Email inválido';
		return undefined;
	}

	function validatePassword(value: string): string | undefined {
		if (!value) return 'Senha é obrigatória';
		if (value.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
		return undefined;
	}

	function validate(): boolean {
		const newErrors: typeof errors = {};
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);
		if (emailError) newErrors.email = emailError;
		if (passwordError) newErrors.password = passwordError;
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!validate()) return;

		loading = true;
		errors = {};

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			errors = { form: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message };
			loading = false;
			return;
		}

		successMessage = 'Login realizado com sucesso!';

		const next = $page.url.searchParams.get('next');
		setTimeout(() => {
			goto(next || '/builder');
		}, 800);
	}

	async function handleGoogleLogin() {
		googleLoading = true;
		errors = {};

		const next = $page.url.searchParams.get('next');
		const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;

		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo
			}
		});

		if (error) {
			errors = { form: error.message };
			googleLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login — PedalNation</title>
	<meta name="description" content="Faça login na PedalNation para salvar e gerenciar seus boards." />
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<!-- Logo -->
		<a href="/" class="logo" aria-label="PedalNation - Home">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="#FF6B35" />
				<path d="M9 6c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v.5c0 .28-.22.5-.5.5h-5C9.22 7 9 6.78 9 6.5V6z" fill="#FF6B35" opacity="0.7" />
				<ellipse cx="12" cy="15" rx="4" ry="5" fill="#FF6B35" opacity="0.15" />
				<path d="M10 10.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-5z" fill="none" stroke="#FF6B35" stroke-width="1.5" />
			</svg>
			<span class="logo-text">PedalNation</span>
		</a>

		<h1 class="auth-title">Entrar na sua conta</h1>
		<p class="auth-subtitle">Bem-vindo de volta!</p>

		{#if successMessage}
			<div class="success-alert" role="status">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
				{successMessage}
			</div>
		{/if}

		{#if errors.form}
			<div class="error-alert" role="alert">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				{errors.form}
			</div>
		{/if}

		<form onsubmit={handleLogin} novalidate>
			<!-- Email field -->
			<div class="field">
				<label for="email" class="label">Email</label>
				<input
					id="email"
					type="email"
					class="input"
					class:input-error={!!errors.email}
					bind:value={email}
					placeholder="seu@email.com"
					autocomplete="email"
					disabled={loading}
				/>
				{#if errors.email}
					<p class="field-error" role="alert">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						{errors.email}
					</p>
				{/if}
			</div>

			<!-- Password field -->
			<div class="field">
				<label for="password" class="label">Senha</label>
				<input
					id="password"
					type="password"
					class="input"
					class:input-error={!!errors.password}
					bind:value={password}
					placeholder="••••••••"
					autocomplete="current-password"
					disabled={loading}
				/>
				{#if errors.password}
					<p class="field-error" role="alert">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						{errors.password}
					</p>
				{/if}
			</div>

			<button type="submit" class="btn-primary" disabled={loading || !!successMessage}>
				{#if loading}
					<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M21 12a9 9 0 1 1-6.219-8.56" />
					</svg>
					Entrando...
				{:else}
					Entrar
				{/if}
			</button>
		</form>

		<!-- Separator -->
		<div class="separator">
			<div class="separator-line"></div>
			<span class="separator-text">ou continue com</span>
			<div class="separator-line"></div>
		</div>

		<!-- Google button -->
		<button
			type="button"
			class="btn-google"
			onclick={handleGoogleLogin}
			disabled={googleLoading || loading || !!successMessage}
		>
			{#if googleLoading}
				<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M21 12a9 9 0 1 1-6.219-8.56" />
				</svg>
				Conectando...
			{:else}
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
				</svg>
				Entrar com Google
			{/if}
		</button>

		<p class="auth-footer">
			Não tem uma conta?
			<a href="/auth/register" class="auth-link">Criar conta</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		background-color: #0F0F0F;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		background-color: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 12px;
		padding: 40px 32px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		margin-bottom: 24px;
	}

	.logo-text {
		font-size: 18px;
		font-weight: 700;
		color: #F5F5F5;
		letter-spacing: -0.02em;
	}

	.auth-title {
		font-size: 22px;
		font-weight: 700;
		color: #F5F5F5;
		margin: 0 0 6px 0;
		text-align: center;
	}

	.auth-subtitle {
		font-size: 14px;
		color: #999999;
		margin: 0 0 24px 0;
		text-align: center;
	}

	.success-alert {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		background-color: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 8px;
		color: #22C55E;
		font-size: 14px;
		margin-bottom: 16px;
	}

	.error-alert {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #EF4444;
		font-size: 14px;
		margin-bottom: 16px;
	}

	form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label {
		font-size: 13px;
		font-weight: 500;
		color: #F5F5F5;
	}

	.input {
		width: 100%;
		height: 40px;
		padding: 0 12px;
		background-color: #252525;
		border: 1px solid #333333;
		border-radius: 8px;
		color: #F5F5F5;
		font-size: 14px;
		font-family: inherit;
		transition: border-color 150ms ease, box-shadow 150ms ease;
		box-sizing: border-box;
	}

	.input::placeholder {
		color: #606060;
	}

	.input:focus {
		outline: none;
		border-color: #FF6B35;
		box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
	}

	.input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input-error {
		border-color: #EF4444 !important;
	}

	.input-error:focus {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
	}

	.field-error {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		color: #EF4444;
		margin: 0;
	}

	.btn-primary {
		width: 100%;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background-color: #FF6B35;
		color: #FFFFFF;
		font-size: 14px;
		font-weight: 600;
		font-family: inherit;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 150ms ease, opacity 150ms ease;
		margin-top: 4px;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #FF8555;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.separator {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 20px 0;
	}

	.separator-line {
		flex: 1;
		height: 1px;
		background-color: #2A2A2A;
	}

	.separator-text {
		font-size: 12px;
		color: #999999;
		white-space: nowrap;
	}

	.btn-google {
		width: 100%;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background-color: #252525;
		color: #F5F5F5;
		font-size: 14px;
		font-weight: 500;
		font-family: inherit;
		border: 1px solid #333333;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 150ms ease, border-color 150ms ease;
	}

	.btn-google:hover:not(:disabled) {
		background-color: #2D2D2D;
		border-color: #444444;
	}

	.btn-google:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.auth-footer {
		font-size: 13px;
		color: #999999;
		margin: 20px 0 0 0;
		text-align: center;
	}

	.auth-link {
		color: #FF6B35;
		text-decoration: none;
		font-weight: 500;
	}

	.auth-link:hover {
		text-decoration: underline;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.spinner {
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}
</style>

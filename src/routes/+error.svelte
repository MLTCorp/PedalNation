<script lang="ts">
	import { page } from '$app/stores';

	const statusMessages: Record<number, { title: string; description: string }> = {
		404: {
			title: 'Página não encontrada',
			description: 'A página que você está procurando não existe ou foi movida.'
		},
		403: {
			title: 'Acesso negado',
			description: 'Você não tem permissão para acessar esta página.'
		},
		500: {
			title: 'Erro interno do servidor',
			description: 'Algo deu errado no nosso lado. Tente novamente em instantes.'
		},
		503: {
			title: 'Serviço indisponível',
			description: 'O serviço está temporariamente indisponível. Tente novamente em breve.'
		}
	};

	const status = $derived($page.status);
	const errorMessage = $derived($page.error?.message ?? '');
	const info = $derived(
		statusMessages[status] ?? {
			title: 'Algo deu errado',
			description: errorMessage || 'Ocorreu um erro inesperado. Tente novamente.'
		}
	);
</script>

<svelte:head>
	<title>{status} — {info.title} | Pedal Nation</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page">
	<div class="error-container">
		<div class="error-code">{status}</div>

		<div class="error-divider"></div>

		<div class="error-content">
			<h1 class="error-title">{info.title}</h1>
			<p class="error-description">{info.description}</p>

			{#if errorMessage && !statusMessages[status]}
				<p class="error-detail">{errorMessage}</p>
			{/if}

			<div class="error-actions">
				<a href="/" class="btn-primary">Ir para a página inicial</a>
				<button onclick={() => history.back()} class="btn-secondary">Voltar</button>
			</div>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--background);
		padding: 24px;
	}

	.error-container {
		display: flex;
		align-items: center;
		gap: 32px;
		max-width: 600px;
		width: 100%;
	}

	.error-code {
		font-family: "JetBrains Mono", "Fira Code", monospace;
		font-size: 72px;
		font-weight: 500;
		color: var(--accent);
		line-height: 1;
		flex-shrink: 0;
	}

	.error-divider {
		width: 1px;
		height: 80px;
		background-color: var(--border);
		flex-shrink: 0;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-title {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	.error-description {
		font-size: 14px;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.6;
	}

	.error-detail {
		font-family: "JetBrains Mono", "Fira Code", monospace;
		font-size: 12px;
		color: var(--text-muted);
		background-color: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 12px;
		margin: 4px 0 0;
		word-break: break-word;
	}

	.error-actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
		flex-wrap: wrap;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		background-color: var(--accent);
		color: #ffffff;
		font-size: 14px;
		font-weight: 500;
		border-radius: 8px;
		text-decoration: none;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
		line-height: 1.5;
	}

	.btn-primary:hover {
		background-color: var(--accent-hover);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		background-color: transparent;
		color: var(--text-secondary);
		font-size: 14px;
		font-weight: 500;
		border-radius: 8px;
		text-decoration: none;
		border: 1px solid var(--border);
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
		line-height: 1.5;
		font-family: inherit;
	}

	.btn-secondary:hover {
		background-color: var(--surface-elevated);
		color: var(--text-primary);
	}

	@media (max-width: 480px) {
		.error-container {
			flex-direction: column;
			gap: 24px;
			text-align: center;
		}

		.error-divider {
			width: 80px;
			height: 1px;
		}

		.error-code {
			font-size: 56px;
		}

		.error-actions {
			justify-content: center;
		}
	}
</style>

<script lang="ts">
	import type { BoardNodeData } from '$lib/stores/canvasStore';

	interface Props {
		id: string;
		data: BoardNodeData;
		selected?: boolean;
		[key: string]: unknown;
	}

	let { data }: Props = $props();

	// Format dimensions: width x height in cm
	let dimensionsLabel = $derived(
		`${data.width_cm}x${data.height_cm}cm`
	);
</script>

<!-- Board node: base layer, non-interactive, acts as the pedalboard surface -->
<div class="board-node">
	<!-- Board thumbnail if available -->
	{#if data.image_url}
		<img
			class="board-bg-img"
			src={data.image_url}
			alt={data.name}
			draggable="false"
		/>
	{/if}

	<!-- Board name centered -->
	<span class="board-name">{data.name}</span>

	<!-- Dimensions at bottom-right -->
	<span class="board-dimensions">{dimensionsLabel}</span>
</div>

<style>
	.board-node {
		width: 100%;
		height: 100%;
		position: relative;
		background: #2a2a2a;
		border: 1px solid #444444;
		border-radius: 4px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
		user-select: none;
	}

	.board-bg-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.25;
		pointer-events: none;
		user-select: none;
	}

	.board-name {
		position: relative;
		z-index: 1;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		font-size: 12px;
		color: #999999;
		text-align: center;
		pointer-events: none;
		user-select: none;
		padding: 0 8px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 90%;
	}

	.board-dimensions {
		position: absolute;
		bottom: 6px;
		right: 8px;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		font-size: 11px;
		color: #666666;
		pointer-events: none;
		user-select: none;
		z-index: 1;
	}
</style>

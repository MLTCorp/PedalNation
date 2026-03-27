<script lang="ts">
	import { rotateSelectedNode, activeLayer, layerVisibility, moveNodeToLayer } from '$lib/stores/canvasStore';
	import type { PedalNodeData } from '$lib/stores/canvasStore';

	// NodeProps-compatible: SvelteFlow passes these props to custom nodes
	interface Props {
		id: string;
		data: PedalNodeData;
		selected?: boolean;
		[key: string]: unknown;
	}

	let { id, data, selected = false }: Props = $props();

	// Context menu state
	let showContextMenu = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);

	// Derived layer info
	let nodeLayer = $derived(data.layer ?? 'top');
	let isBottomLayer = $derived(nodeLayer === 'bottom');
	let isActiveLayer = $derived($activeLayer === nodeLayer);
	let isLayerVisible = $derived($layerVisibility[nodeLayer as 'top' | 'bottom'] ?? true);
	// Editable only if node belongs to active layer and layer is visible
	let isEditable = $derived(isActiveLayer && isLayerVisible);

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		showContextMenu = true;
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
	}

	function closeContextMenu() {
		showContextMenu = false;
	}

	function moveToTop() {
		moveNodeToLayer(id, 'top');
		closeContextMenu();
	}

	function moveToBottom() {
		moveNodeToLayer(id, 'bottom');
		closeContextMenu();
	}
</script>

<!-- svelte:window to close context menu on click outside -->
<svelte:window onclick={closeContextMenu} />

<!-- Node wrapper: no background, just the image + overlays -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="pedal-node"
	class:selected
	class:bottom-layer={isBottomLayer}
	class:inactive-layer={!isEditable}
	title="{data.name} — {data.brand}"
	style="opacity: {isLayerVisible ? 1 : 0.1}; pointer-events: {isLayerVisible ? 'all' : 'none'};"
	oncontextmenu={handleContextMenu}
>
	<!-- Pedal image -->
	{#if data.image_url}
		<img
			class="pedal-img"
			src={data.image_url}
			alt={data.name}
			draggable="false"
			style="transform: rotate({data.rotation ?? 0}deg);"
		/>
	{:else}
		<!-- Fallback placeholder -->
		<div class="pedal-placeholder" style="transform: rotate({data.rotation ?? 0}deg);">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5">
				<rect x="2" y="7" width="20" height="15" rx="2"></rect>
				<circle cx="12" cy="14" r="3"></circle>
				<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
			</svg>
			<span class="pedal-placeholder-label">{data.name}</span>
		</div>
	{/if}

	<!-- Controls: shown only when selected AND node is in active layer -->
	{#if selected && isEditable}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="node-controls" onclick={(e) => e.stopPropagation()}>
			<!-- Rotate button -->
			<button
				class="node-ctrl-btn"
				title="Girar 90° (R)"
				onclick={() => rotateSelectedNode()}
				aria-label="Girar pedal"
			>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M23 4v6h-6"></path>
					<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
				</svg>
			</button>
		</div>
	{/if}
</div>

<!-- Right-click context menu rendered at fixed position -->
{#if showContextMenu}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="context-menu"
		style="left: {contextMenuX}px; top: {contextMenuY}px;"
		onclick={(e) => e.stopPropagation()}
	>
		{#if nodeLayer !== 'top'}
			<button class="context-menu-item" onclick={moveToTop}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="17 11 12 6 7 11"></polyline>
					<polyline points="17 18 12 13 7 18"></polyline>
				</svg>
				Mover para Top Layer
			</button>
		{/if}
		{#if nodeLayer !== 'bottom'}
			<button class="context-menu-item" onclick={moveToBottom}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="17 6 12 11 7 6"></polyline>
					<polyline points="17 13 12 18 7 13"></polyline>
				</svg>
				Mover para Bottom Layer
			</button>
		{/if}
	</div>
{/if}

<style>
	.pedal-node {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: move;
		border-radius: 4px;
		outline: 2px solid transparent;
		outline-offset: 3px;
		transition: outline-color 0.1s, opacity 0.2s;
	}

	.pedal-node.selected {
		outline-color: #ff6b35;
		box-shadow: 0 0 0 2px #ff6b35, 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	/* Bottom layer nodes get dashed border */
	.pedal-node.bottom-layer {
		outline: 2px dashed #666666;
		outline-offset: 3px;
	}

	.pedal-node.bottom-layer.selected {
		outline: 2px dashed #ff6b35;
		box-shadow: 0 0 0 2px #ff6b35, 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	/* Inactive layer nodes are slightly dimmed but still visible */
	.pedal-node.inactive-layer {
		cursor: default;
	}

	.pedal-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		user-select: none;
		pointer-events: none;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
		transition: transform 0.15s ease;
	}

	.pedal-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.pedal-placeholder-label {
		font-size: 10px;
		color: #606060;
		text-align: center;
		padding: 0 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	/* Floating controls — appear above the pedal image at top-center */
	.node-controls {
		position: absolute;
		top: -34px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 4px;
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 3px 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
		z-index: 100;
		white-space: nowrap;
		pointer-events: all;
	}

	.node-ctrl-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: #a0a0a0;
		cursor: pointer;
		transition: background 0.1s, color 0.1s;
	}

	.node-ctrl-btn:hover {
		background: #2a2a2a;
		color: #ff6b35;
	}

	/* Context menu */
	.context-menu {
		position: fixed;
		background: #1a1a1a;
		border: 1px solid #333333;
		border-radius: 6px;
		padding: 4px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
		z-index: 99999;
		min-width: 180px;
	}

	.context-menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 10px;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: #a0a0a0;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s, color 0.1s;
	}

	.context-menu-item:hover {
		background: #2a2a2a;
		color: #f5f5f5;
	}
</style>

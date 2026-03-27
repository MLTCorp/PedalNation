<script lang="ts">
	/**
	 * CanvasInner: rendered as a child of <SvelteFlow>.
	 * Has access to the SvelteFlow context and can use useSvelteFlow.
	 * Exposes zoom controls and fitView to the parent via a callback.
	 * Also renders the dot grid background and alignment guides.
	 */
	import { onMount } from 'svelte';
	import { useSvelteFlow, Background, BackgroundVariant, type Viewport } from '@xyflow/svelte';
	import type { Readable } from 'svelte/store';

	interface AlignmentGuide {
		type: 'horizontal' | 'vertical';
		position: number;
	}

	interface Props {
		showGrid: boolean;
		alignmentGuides?: AlignmentGuide[];
		viewport?: Readable<Viewport>;
		onReady: (api: {
			zoomIn: () => void;
			zoomOut: () => void;
			fitView: (padding?: number) => void;
		}) => void;
	}

	let { showGrid, alignmentGuides = [], viewport, onReady }: Props = $props();

	const sf = useSvelteFlow();

	onMount(() => {
		onReady({
			zoomIn: () => sf.zoomIn({ duration: 200 }),
			zoomOut: () => sf.zoomOut({ duration: 200 }),
			fitView: (padding?: number) => sf.fitView({ padding: padding ?? 0.2, duration: 300 })
		});
	});

	// Get current viewport for converting flow coords to screen coords for guides
	let currentViewport = $state<Viewport>({ x: 0, y: 0, zoom: 1 });

	$effect(() => {
		if (viewport) {
			const unsubscribe = viewport.subscribe((vp) => {
				currentViewport = vp;
			});
			return unsubscribe;
		}
	});
</script>

{#if showGrid}
	<Background
		variant={BackgroundVariant.Dots}
		bgColor="#0f0f0f"
		patternColor="#2A2A2A"
		gap={10}
		size={1.5}
	/>
{/if}

<!-- Alignment guides: blue dashed lines rendered in screen space -->
{#if alignmentGuides.length > 0}
	<svg
		class="alignment-guides-svg"
		aria-hidden="true"
	>
		{#each alignmentGuides as guide}
			{#if guide.type === 'vertical'}
				<!-- Convert flow x to screen x -->
				<line
					x1={guide.position * currentViewport.zoom + currentViewport.x}
					y1="0"
					x2={guide.position * currentViewport.zoom + currentViewport.x}
					y2="100%"
					stroke="#3B82F6"
					stroke-width="1"
					stroke-dasharray="4 3"
					opacity="0.85"
				/>
			{:else}
				<!-- Convert flow y to screen y -->
				<line
					x1="0"
					y1={guide.position * currentViewport.zoom + currentViewport.y}
					x2="100%"
					y2={guide.position * currentViewport.zoom + currentViewport.y}
					stroke="#3B82F6"
					stroke-width="1"
					stroke-dasharray="4 3"
					opacity="0.85"
				/>
			{/if}
		{/each}
	</svg>
{/if}

<style>
	.alignment-guides-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10;
		overflow: visible;
	}
</style>

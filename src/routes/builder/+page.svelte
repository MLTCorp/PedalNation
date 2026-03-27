<script lang="ts">
	import { onMount } from 'svelte';
	import Fuse from 'fuse.js';
	import {
		SvelteFlow,
		SelectionMode,
		type Node
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	import PedalNode from '$lib/components/PedalNode.svelte';
	import BoardNode from '$lib/components/BoardNode.svelte';
	import CanvasInner from '$lib/components/CanvasInner.svelte';
	import InfoPanel from '$lib/components/InfoPanel.svelte';
	import { page } from '$app/stores';
	import { pushState } from '$app/navigation';
	import {
		nodes,
		edges,
		viewport,
		selectedNodeId,
		selectedNodeData,
		addPedalNode,
		addBoardNode,
		removeBoardNode,
		hasBoardNode,
		getBoardNode,
		deleteSelectedNodes,
		undo,
		redo,
		copySelectedNodes,
		pasteNodes,
		rotateSelectedNode,
		pushHistory,
		activeLayer,
		layerVisibility,
		setActiveLayer,
		toggleLayerVisibility,
		snapGridEnabled,
		toggleSnapGrid,
		currentBoardId,
		loadCanvasState,
		clearDraft,
		hasDraft,
		type PedalNodeData,
		type BoardNodeData,
		type LayerId,
		type CanvasNode
	} from '$lib/stores/canvasStore';

	// ── Props (layout data) ───────────────────────────────────────────────────
	let { data } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────
	interface Pedal {
		id: string;
		name: string;
		brand: string;
		category: string;
		slug: string;
		image_url: string | null;
		width_mm: number | null;
		height_mm: number | null;
		depth_mm: number | null;
		description: string | null;
		price_usd: number | null;
	}

	interface BoardCatalogItem {
		id: string;
		name: string;
		brand: string;
		width_mm: number;
		height_mm: number;
		image_url: string | null;
		price_usd: number | null;
		is_active: boolean;
	}

	// ── Node types ────────────────────────────────────────────────────────────
	const nodeTypes = { pedalNode: PedalNode, boardNode: BoardNode };

	// ── State ─────────────────────────────────────────────────────────────────
	let pedals: Pedal[] = $state([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let debouncedQuery = $state('');
	let selectedCategory = $state('');
	let selectedBrand = $state('');
	let searchInputEl: HTMLInputElement | null = $state(null);
	let focusedResultIndex = $state(-1);

	// Fuse.js instance (rebuilt when pedals change) — plain var, not reactive state
	let fuseIndex: Fuse<Pedal> | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Left panel tabs
	let activeTab = $state<'pedals' | 'boards'>('pedals');

	// Board catalog state
	let boards: BoardCatalogItem[] = $state([]);
	let boardsLoading = $state(false);

	// Confirm replace board dialog
	let showReplaceDialog = $state(false);
	let pendingBoardData = $state<BoardNodeData | null>(null);

	// Custom board dialog
	let showCustomBoardDialog = $state(false);
	let customBoardUnit = $state<'cm' | 'inches'>('cm');
	let customBoardWidthCm = $state('');
	let customBoardHeightCm = $state('');
	let customBoardWidthIn = $state('');
	let customBoardHeightIn = $state('');

	// Canvas element size
	let canvasElWidth = $state(0);
	let canvasElHeight = $state(0);

	// Panel widths (in px)
	const DEFAULT_LEFT_WIDTH = 280;
	const DEFAULT_RIGHT_WIDTH = 300;
	const MIN_PANEL = 240;
	const MAX_PANEL = 400;

	let leftWidth = $state(DEFAULT_LEFT_WIDTH);
	let rightWidth = $state(DEFAULT_RIGHT_WIDTH);
	let rightCollapsed = $state(true);

	// Canvas controls state
	// showGrid is now driven by the snapGridEnabled store (persisted in localStorage)

	// Layers panel state
	let showLayersPanel = $state(false);

	// Alt key pressed state — temporarily disables snap during drag
	let altKeyActive = $state(false);

	// Board info
	let boardName = $state('Novo Pedalboard');

	// ── Save dialog state ─────────────────────────────────────────────────────
	let showSaveDialog = $state(false);
	let showLoginPrompt = $state(false);
	let showDraftDialog = $state(false);
	let saveDialogMode = $state<'save' | 'save-as'>('save');
	let saveName = $state('Meu Board');
	let saveDescription = $state('');
	let saveIsPublic = $state(false);
	let isSaving = $state(false);

	// ── Toast state ───────────────────────────────────────────────────────────
	let toastMessage = $state('');
	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function showToast(message: string) {
		toastMessage = message;
		toastVisible = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastVisible = false;
		}, 3000);
	}

	// Resize drag state
	let draggingLeft = $state(false);
	let draggingRight = $state(false);
	let dragStartX = 0;
	let dragStartWidth = 0;

	// Tooltip state
	let activeTooltip = $state<string | null>(null);

	// Drag ghost state
	let ghostVisible = $state(false);
	let ghostX = $state(0);
	let ghostY = $state(0);
	let ghostData = $state<Pedal | null>(null);

	// Canvas element ref
	let canvasEl: HTMLElement | null = null;

	// Canvas API exposed from CanvasInner
	let canvasApi: { zoomIn: () => void; zoomOut: () => void; fitView: (padding?: number) => void } | null = null;

	// ── 3-dot menu state (US-016) ──────────────────────────────────────────
	let showMoreMenu = $state(false);
	let isDuplicating = $state(false);
	let showDuplicateLoginPrompt = $state(false);

	// ── Export dialog state (US-017) ───────────────────────────────────────
	let showExportDialog = $state(false);
	let exportBgDark = $state(true);
	let exportQuality = $state<'normal' | 'high'>('normal');
	let exportIncludeList = $state(false);
	let isExporting = $state(false);
	let exportPreviewUrl = $state<string | null>(null);
	let exportPreviewLoading = $state(false);

	// Zoom display
	let zoomDisplay = $state(100);

	// Derived
	let pedalCount = $derived($nodes.filter((n) => n.type !== 'boardNode').length);

	let filteredPedals = $derived(() => {
		let result = pedals;

		// Apply fuzzy search first using Fuse.js
		if (debouncedQuery.trim() && fuseIndex) {
			const fuseResults = fuseIndex.search(debouncedQuery.trim());
			result = fuseResults.map((r) => r.item);
		}

		// Filter by category
		if (selectedCategory) {
			result = result.filter((p) => p.category === selectedCategory);
		}

		// Filter by brand
		if (selectedBrand) {
			result = result.filter((p) => p.brand === selectedBrand);
		}

		return result;
	});

	let categories = $derived(() => {
		const cats = [...new Set(pedals.map((p) => p.category).filter(Boolean))];
		return cats.sort();
	});

	let brands = $derived(() => {
		const bs = [...new Set(pedals.map((p) => p.brand).filter(Boolean))];
		return bs.sort();
	});

	// ── Data loading ─────────────────────────────────────────────────────────
	async function loadPedals() {
		loading = true;
		try {
			const res = await fetch('/api/pedals?limit=200');
			if (res.ok) {
				const data = await res.json();
				pedals = data.pedals ?? [];
				// Build Fuse.js index
				fuseIndex = new Fuse(pedals, {
					keys: [
						{ name: 'name', weight: 2 },
						{ name: 'brand', weight: 1.5 },
						{ name: 'category', weight: 1 },
						{ name: 'description', weight: 0.5 }
					],
					threshold: 0.4,
					includeScore: true
				});
			}
		} catch (e) {
			console.error('Failed to load pedals:', e);
		} finally {
			loading = false;
		}
	}

	function handleSearchInput(value: string) {
		searchQuery = value;
		focusedResultIndex = -1;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debouncedQuery = value;
		}, 150);
	}

	function clearSearch() {
		searchQuery = '';
		debouncedQuery = '';
		selectedCategory = '';
		selectedBrand = '';
		focusedResultIndex = -1;
		if (debounceTimer) clearTimeout(debounceTimer);
		if (searchInputEl) searchInputEl.blur();
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		const results = filteredPedals();

		if (e.key === 'Escape') {
			clearSearch();
			return;
		}

		if (e.key === 'Enter') {
			// Focus first result card
			if (results.length > 0) {
				focusedResultIndex = 0;
				const firstCard = document.querySelector<HTMLElement>('.pedal-card[data-index="0"]');
				if (firstCard) firstCard.focus();
			}
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			const nextIdx = Math.min(focusedResultIndex + 1, results.length - 1);
			focusedResultIndex = nextIdx;
			const card = document.querySelector<HTMLElement>(`.pedal-card[data-index="${nextIdx}"]`);
			if (card) card.focus();
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (focusedResultIndex <= 0) {
				focusedResultIndex = -1;
				if (searchInputEl) searchInputEl.focus();
			} else {
				const prevIdx = focusedResultIndex - 1;
				focusedResultIndex = prevIdx;
				const card = document.querySelector<HTMLElement>(`.pedal-card[data-index="${prevIdx}"]`);
				if (card) card.focus();
			}
			return;
		}
	}

	async function loadBoards() {
		if (boards.length > 0) return; // already loaded
		boardsLoading = true;
		try {
			const res = await fetch('/api/boards-catalog');
			if (res.ok) {
				const data = await res.json();
				boards = (data.boards ?? []).filter((b: BoardCatalogItem) => b.is_active);
			}
		} catch (e) {
			console.error('Failed to load boards:', e);
		} finally {
			boardsLoading = false;
		}
	}

	function mmToCm(mm: number): number {
		return Math.round((mm / 10) * 10) / 10;
	}

	function tryAddBoard(boardData: BoardNodeData) {
		if (hasBoardNode()) {
			pendingBoardData = boardData;
			showReplaceDialog = true;
		} else {
			placeBoard(boardData);
		}
	}

	function placeBoard(boardData: BoardNodeData) {
		addBoardNode(boardData, $viewport, canvasElWidth || 800, canvasElHeight || 600);
		// Zoom to fit with 5% padding after a brief delay so the node is rendered
		setTimeout(() => {
			canvasApi?.fitView(0.05);
		}, 80);
	}

	function confirmReplaceBoard() {
		if (pendingBoardData) {
			removeBoardNode();
			placeBoard(pendingBoardData);
			pendingBoardData = null;
		}
		showReplaceDialog = false;
	}

	function cancelReplaceBoard() {
		pendingBoardData = null;
		showReplaceDialog = false;
	}

	function handleBoardCardClick(board: BoardCatalogItem) {
		const widthCm = mmToCm(board.width_mm);
		const heightCm = mmToCm(board.height_mm);
		const boardData: BoardNodeData = {
			board_id: board.id,
			name: board.name,
			brand: board.brand,
			width_cm: widthCm,
			height_cm: heightCm,
			image_url: board.image_url
		};
		tryAddBoard(boardData);
	}

	function openCustomBoardDialog() {
		customBoardUnit = 'cm';
		customBoardWidthCm = '';
		customBoardHeightCm = '';
		customBoardWidthIn = '';
		customBoardHeightIn = '';
		showCustomBoardDialog = true;
	}

	function closeCustomBoardDialog() {
		showCustomBoardDialog = false;
	}

	// Unit conversion helpers
	const CM_PER_INCH = 2.54;

	function handleCustomWidthCmInput(val: string) {
		customBoardWidthCm = val;
		const num = parseFloat(val);
		if (!isNaN(num) && num > 0) {
			customBoardWidthIn = (num / CM_PER_INCH).toFixed(2);
		} else {
			customBoardWidthIn = '';
		}
	}

	function handleCustomHeightCmInput(val: string) {
		customBoardHeightCm = val;
		const num = parseFloat(val);
		if (!isNaN(num) && num > 0) {
			customBoardHeightIn = (num / CM_PER_INCH).toFixed(2);
		} else {
			customBoardHeightIn = '';
		}
	}

	function handleCustomWidthInInput(val: string) {
		customBoardWidthIn = val;
		const num = parseFloat(val);
		if (!isNaN(num) && num > 0) {
			customBoardWidthCm = (num * CM_PER_INCH).toFixed(1);
		} else {
			customBoardWidthCm = '';
		}
	}

	function handleCustomHeightInInput(val: string) {
		customBoardHeightIn = val;
		const num = parseFloat(val);
		if (!isNaN(num) && num > 0) {
			customBoardHeightCm = (num * CM_PER_INCH).toFixed(1);
		} else {
			customBoardHeightCm = '';
		}
	}

	function toggleCustomUnit() {
		customBoardUnit = customBoardUnit === 'cm' ? 'inches' : 'cm';
	}

	function confirmCustomBoard() {
		const w = parseFloat(customBoardWidthCm);
		const h = parseFloat(customBoardHeightCm);
		if (!w || !h || w <= 0 || h <= 0) return;
		const boardData: BoardNodeData = {
			board_id: 'custom-' + crypto.randomUUID(),
			name: 'Board Customizado',
			brand: '',
			width_cm: w,
			height_cm: h,
			image_url: null
		};
		closeCustomBoardDialog();
		tryAddBoard(boardData);
	}

	// ── Switch tab ─────────────────────────────────────────────────────────
	function switchTab(tab: 'pedals' | 'boards') {
		activeTab = tab;
		if (tab === 'boards') {
			loadBoards();
		}
	}

	// ── Panel resize ─────────────────────────────────────────────────────────
	function startLeftResize(e: MouseEvent | TouchEvent) {
		draggingLeft = true;
		dragStartX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		dragStartWidth = leftWidth;
		document.addEventListener('mousemove', onLeftDrag);
		document.addEventListener('mouseup', stopLeftResize);
		document.addEventListener('touchmove', onLeftDragTouch);
		document.addEventListener('touchend', stopLeftResize);
	}

	function onLeftDrag(e: MouseEvent) {
		if (!draggingLeft) return;
		const delta = e.clientX - dragStartX;
		leftWidth = Math.min(MAX_PANEL, Math.max(MIN_PANEL, dragStartWidth + delta));
	}

	function onLeftDragTouch(e: TouchEvent) {
		if (!draggingLeft) return;
		const delta = e.touches[0].clientX - dragStartX;
		leftWidth = Math.min(MAX_PANEL, Math.max(MIN_PANEL, dragStartWidth + delta));
	}

	function stopLeftResize() {
		draggingLeft = false;
		document.removeEventListener('mousemove', onLeftDrag);
		document.removeEventListener('mouseup', stopLeftResize);
		document.removeEventListener('touchmove', onLeftDragTouch);
		document.removeEventListener('touchend', stopLeftResize);
	}

	function restoreLeftWidth() {
		leftWidth = DEFAULT_LEFT_WIDTH;
	}

	function startRightResize(e: MouseEvent | TouchEvent) {
		draggingRight = true;
		dragStartX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		dragStartWidth = rightWidth;
		document.addEventListener('mousemove', onRightDrag);
		document.addEventListener('mouseup', stopRightResize);
		document.addEventListener('touchmove', onRightDragTouch);
		document.addEventListener('touchend', stopRightResize);
	}

	function onRightDrag(e: MouseEvent) {
		if (!draggingRight) return;
		const delta = dragStartX - e.clientX;
		rightWidth = Math.min(MAX_PANEL, Math.max(MIN_PANEL, dragStartWidth + delta));
	}

	function onRightDragTouch(e: TouchEvent) {
		if (!draggingRight) return;
		const delta = dragStartX - e.touches[0].clientX;
		rightWidth = Math.min(MAX_PANEL, Math.max(MIN_PANEL, dragStartWidth + delta));
	}

	function stopRightResize() {
		draggingRight = false;
		document.removeEventListener('mousemove', onRightDrag);
		document.removeEventListener('mouseup', stopRightResize);
		document.removeEventListener('touchmove', onRightDragTouch);
		document.removeEventListener('touchend', stopRightResize);
	}

	function restoreRightWidth() {
		rightWidth = DEFAULT_RIGHT_WIDTH;
	}

	// ── Drag from catalog ─────────────────────────────────────────────────────
	function handlePedalDragStart(e: DragEvent, pedal: Pedal) {
		if (!e.dataTransfer) return;
		e.dataTransfer.setData('application/pedal-id', pedal.id);
		e.dataTransfer.setData('application/pedal-json', JSON.stringify(pedal));
		e.dataTransfer.effectAllowed = 'copy';

		// Start ghost
		ghostData = pedal;
		ghostVisible = true;
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (!ghostVisible) return;
		ghostX = e.clientX + 12;
		ghostY = e.clientY + 12;
	}

	function handleGlobalDragEnd() {
		ghostVisible = false;
		ghostData = null;
	}

	function handleCanvasDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
		ghostX = e.clientX + 12;
		ghostY = e.clientY + 12;
	}

	function handleCanvasDrop(e: DragEvent) {
		e.preventDefault();
		ghostVisible = false;
		ghostData = null;

		if (!e.dataTransfer) return;

		const pedalJson = e.dataTransfer.getData('application/pedal-json');
		if (!pedalJson) return;

		let pedal: Pedal;
		try {
			pedal = JSON.parse(pedalJson);
		} catch {
			return;
		}

		// Convert screen position to flow coordinates
		if (!canvasEl) return;
		const bounds = canvasEl.getBoundingClientRect();
		const screenX = e.clientX - bounds.left;
		const screenY = e.clientY - bounds.top;

		// Use viewport to convert screen coords to flow coords
		const vp = $viewport;
		const flowX = (screenX - vp.x) / vp.zoom;
		const flowY = (screenY - vp.y) / vp.zoom;

		const data: PedalNodeData = {
			pedal_id: pedal.id,
			name: pedal.name,
			brand: pedal.brand,
			image_url: pedal.image_url,
			width_mm: pedal.width_mm,
			height_mm: pedal.height_mm,
			rotation: 0,
			category: pedal.category,
			
		};

		addPedalNode(data, { x: flowX, y: flowY });
	}

	function addPedalToCenter(pedal: PedalData) {
		const vp = $viewport;
		const centerX = ((canvasElWidth || 800) / 2 - vp.x) / vp.zoom;
		const centerY = ((canvasElHeight || 600) / 2 - vp.y) / vp.zoom;

		const data: PedalNodeData = {
			pedal_id: pedal.id,
			name: pedal.name,
			brand: pedal.brand,
			image_url: pedal.image_url,
			width_mm: pedal.width_mm,
			height_mm: pedal.height_mm,
			rotation: 0,
			category: pedal.category
		};

		addPedalNode(data, { x: centerX, y: centerY });
		pushHistory();
	}

	function handleCanvasDragLeave(e: DragEvent) {
		// Check if we actually left the canvas area
		const target = e.relatedTarget as HTMLElement | null;
		if (!canvasEl || !target || !canvasEl.contains(target)) {
			ghostVisible = false;
		}
	}

	// ── Alignment guides ─────────────────────────────────────────────────────
	interface AlignmentGuide {
		type: 'horizontal' | 'vertical';
		position: number; // in flow coordinates
	}

	let alignmentGuides = $state<AlignmentGuide[]>([]);

	const ALIGN_THRESHOLD = 8; // pixels in flow space to snap/show guide

	function handleNodeDrag({ targetNode }: { targetNode: Node | null; nodes: Node[] }) {
		const node = targetNode;
		if (!node) {
			alignmentGuides = [];
			return;
		}

		// Calculate alignment guides relative to other nodes
		const draggingId = node.id;
		const otherNodes = $nodes.filter((n) => n.id !== draggingId && n.type !== 'boardNode');

		if (otherNodes.length === 0) {
			alignmentGuides = [];
			return;
		}

		const guides: AlignmentGuide[] = [];

		// Get dragged node bounds
		const dLeft = node.position.x;
		const dTop = node.position.y;

		// Try to get width/height from style string
		const styleStr = (node as CanvasNode).style ?? '';
		const wMatch = styleStr.match(/width:\s*([\d.]+)px/);
		const hMatch = styleStr.match(/height:\s*([\d.]+)px/);
		const dW = wMatch ? parseFloat(wMatch[1]) : 80;
		const dH = hMatch ? parseFloat(hMatch[1]) : 120;

		const dRight = dLeft + dW;
		const dCenterX = dLeft + dW / 2;
		const dBottom = dTop + dH;
		const dCenterY = dTop + dH / 2;

		for (const other of otherNodes) {
			const oStyleStr = (other as CanvasNode).style ?? '';
			const oW = (oStyleStr.match(/width:\s*([\d.]+)px/) ?? [])[1];
			const oH = (oStyleStr.match(/height:\s*([\d.]+)px/) ?? [])[1];
			const otherW = oW ? parseFloat(oW) : 80;
			const otherH = oH ? parseFloat(oH) : 120;

			const oLeft = other.position.x;
			const oTop = other.position.y;
			const oRight = oLeft + otherW;
			const oCenterX = oLeft + otherW / 2;
			const oBottom = oTop + otherH;
			const oCenterY = oTop + otherH / 2;

			// Vertical lines (x-axis alignment)
			const xChecks = [
				[dLeft, oLeft], [dLeft, oRight], [dLeft, oCenterX],
				[dRight, oLeft], [dRight, oRight], [dRight, oCenterX],
				[dCenterX, oLeft], [dCenterX, oRight], [dCenterX, oCenterX]
			];
			for (const [a, b] of xChecks) {
				if (Math.abs(a - b) < ALIGN_THRESHOLD) {
					if (!guides.find((g) => g.type === 'vertical' && g.position === b)) {
						guides.push({ type: 'vertical', position: b });
					}
				}
			}

			// Horizontal lines (y-axis alignment)
			const yChecks = [
				[dTop, oTop], [dTop, oBottom], [dTop, oCenterY],
				[dBottom, oTop], [dBottom, oBottom], [dBottom, oCenterY],
				[dCenterY, oTop], [dCenterY, oBottom], [dCenterY, oCenterY]
			];
			for (const [a, b] of yChecks) {
				if (Math.abs(a - b) < ALIGN_THRESHOLD) {
					if (!guides.find((g) => g.type === 'horizontal' && g.position === b)) {
						guides.push({ type: 'horizontal', position: b });
					}
				}
			}
		}

		alignmentGuides = guides;
	}

	// ── Node drag stop → push to history ────────────────────────────────────
	function handleNodeDragStop(_event?: unknown) {
		alignmentGuides = [];
		pushHistory($nodes, $edges);
	}

	// ── Node selection ────────────────────────────────────────────────────────
	function handleNodeClick({ node }: { node: Node }) {
		const data = node.data as unknown as PedalNodeData;
		selectedNodeId.set(node.id);
		selectedNodeData.set(data);
		rightCollapsed = false;
	}

	function handlePaneClick() {
		selectedNodeId.set(null);
		selectedNodeData.set(null);
	}

	// ── Canvas controls ───────────────────────────────────────────────────────
	function zoomIn() {
		canvasApi?.zoomIn();
	}

	function zoomOut() {
		canvasApi?.zoomOut();
	}

	function fitView() {
		canvasApi?.fitView();
	}

	function toggleGrid() {
		toggleSnapGrid();
	}

	function toggleLayersPanel() {
		showLayersPanel = !showLayersPanel;
	}

	function handleLayerClick(layer: LayerId) {
		setActiveLayer(layer);
	}

	function handleLayerVisibilityToggle(layer: LayerId) {
		toggleLayerVisibility(layer);
	}

	function handleExport() {
		openExportDialog();
	}

	function handleShare() {
		console.log('Share triggered');
	}

	// ── US-016: Duplicate board ────────────────────────────────────────────
	async function handleDuplicate() {
		showMoreMenu = false;
		const session = $page.data?.session;
		if (!session) {
			showDuplicateLoginPrompt = true;
			return;
		}
		const boardId = $currentBoardId;
		if (!boardId) {
			showToast('Salve o board antes de duplicar.');
			return;
		}
		isDuplicating = true;
		try {
			const res = await fetch(`/api/boards/${boardId}/duplicate`, { method: 'POST' });
			if (res.ok) {
				const result = await res.json();
				const newId = result.board.id;
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.set('board', newId);
				// Navigate to new board
				window.location.href = newUrl.toString() + '&_toast=duplicated';
			} else {
				showToast('Erro ao duplicar board. Tente novamente.');
			}
		} catch {
			showToast('Erro ao duplicar board. Tente novamente.');
		} finally {
			isDuplicating = false;
		}
	}

	// ── US-017: Export helpers ─────────────────────────────────────────────

	function getCanvasBoundingBox() {
		// Get all pedal nodes and board node to compute bounding box
		const allNodes = $nodes;
		if (allNodes.length === 0) return null;

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

		for (const node of allNodes) {
			const x = node.position.x;
			const y = node.position.y;
			const styleStr = (node as CanvasNode).style ?? '';
			const wMatch = styleStr.match(/width:\s*([\d.]+)px/);
			const hMatch = styleStr.match(/height:\s*([\d.]+)px/);
			const w = wMatch ? parseFloat(wMatch[1]) : 80;
			const h = hMatch ? parseFloat(hMatch[1]) : 80;
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x + w);
			maxY = Math.max(maxY, y + h);
		}

		const padding = 24;
		return {
			x: minX - padding,
			y: minY - padding,
			width: maxX - minX + padding * 2,
			height: maxY - minY + padding * 2
		};
	}

	async function generateExportImage(pixelRatio: number): Promise<string | null> {
		if (!canvasEl) return null;

		// Import html-to-image dynamically
		const { toPng } = await import('html-to-image');

		const flowEl = canvasEl.querySelector('.svelte-flow-canvas') as HTMLElement | null;
		if (!flowEl) return null;

		const transformEl = flowEl.querySelector('.svelte-flow__transformationpane') as HTMLElement | null;
		if (!transformEl) return null;

		const bbox = getCanvasBoundingBox();
		const vp = $viewport;

		let filter: ((node: HTMLElement) => boolean) | undefined = undefined;
		// Exclude UI overlays
		filter = (node: HTMLElement) => {
			if (!node.classList) return true;
			if (node.classList.contains('canvas-controls')) return false;
			if (node.classList.contains('layers-panel')) return false;
			if (node.classList.contains('canvas-empty-state')) return false;
			return true;
		};

		const bgColor = exportBgDark ? '#0F0F0F' : '#FFFFFF';

		let clipX: number | undefined;
		let clipY: number | undefined;
		let clipWidth: number | undefined;
		let clipHeight: number | undefined;

		if (bbox) {
			// Convert flow coords to screen coords
			clipX = bbox.x * vp.zoom + vp.x;
			clipY = bbox.y * vp.zoom + vp.y;
			clipWidth = bbox.width * vp.zoom;
			clipHeight = bbox.height * vp.zoom;
		}

		try {
			const dataUrl = await toPng(flowEl, {
				backgroundColor: bgColor,
				pixelRatio,
				filter,
				...(clipWidth && clipHeight ? {
					width: clipWidth,
					height: clipHeight,
					style: {
						transform: `translate(${-(clipX ?? 0)}px, ${-(clipY ?? 0)}px)`,
						transformOrigin: 'top left',
						width: flowEl.offsetWidth + 'px',
						height: flowEl.offsetHeight + 'px'
					}
				} : {})
			});
			return dataUrl;
		} catch (err) {
			console.error('Export failed:', err);
			return null;
		}
	}

	async function openExportDialog() {
		showExportDialog = true;
		exportPreviewUrl = null;
		exportPreviewLoading = true;
		// Generate preview thumbnail at low res
		const url = await generateExportImage(1);
		exportPreviewUrl = url;
		exportPreviewLoading = false;
	}

	async function performExport() {
		isExporting = true;
		try {
			const pixelRatio = exportQuality === 'high' ? 2 : 1;
			const dataUrl = await generateExportImage(pixelRatio);
			if (!dataUrl) {
				showToast('Erro ao exportar. Tente novamente.');
				return;
			}

			// Add watermark via canvas
			const watermarkedUrl = await addWatermark(dataUrl);

			if (exportIncludeList) {
				await downloadWithEquipmentList(watermarkedUrl);
			} else {
				downloadDataUrl(watermarkedUrl, `${boardName}-pedalnation.jpg`);
			}
			showExportDialog = false;
			showToast('Exportado com sucesso!');
		} catch (err) {
			console.error('Export error:', err);
			showToast('Erro ao exportar. Tente novamente.');
		} finally {
			isExporting = false;
		}
	}

	async function addWatermark(dataUrl: string): Promise<string> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0);

				// Watermark: 'pedalnation.com' bottom-right
				const fontSize = Math.max(12, Math.round(canvas.width * 0.016));
				ctx.font = `${fontSize}px sans-serif`;
				const watermarkColor = exportBgDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
				ctx.fillStyle = watermarkColor;
				ctx.textAlign = 'right';
				ctx.textBaseline = 'bottom';
				const margin = fontSize;
				ctx.fillText('pedalnation.com', canvas.width - margin, canvas.height - margin);

				resolve(canvas.toDataURL('image/jpeg', 0.92));
			};
			img.src = dataUrl;
		});
	}

	function downloadDataUrl(dataUrl: string, filename: string) {
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = filename;
		a.click();
	}

	async function downloadWithEquipmentList(imageDataUrl: string) {
		const pedalNodes = $nodes.filter((n) => n.type === 'pedalNode');
		const topPedals = pedalNodes.filter((n) => ((n.data as PedalNodeData).layer ?? 'top') === 'top');
		const bottomPedals = pedalNodes.filter((n) => (n.data as PedalNodeData).layer === 'bottom');

		return new Promise<void>((resolve) => {
			const img = new Image();
			img.onload = () => {
				const lineHeight = 20;
				const padding = 20;
				const listItems: string[] = [];

				if (topPedals.length > 0) {
					listItems.push('Top Layer:');
					for (const n of topPedals) {
						const d = n.data as PedalNodeData;
						listItems.push(`  • ${d.brand} ${d.name}`);
					}
				}
				if (bottomPedals.length > 0) {
					listItems.push('Bottom Layer:');
					for (const n of bottomPedals) {
						const d = n.data as PedalNodeData;
						listItems.push(`  • ${d.brand} ${d.name}`);
					}
				}

				const listHeight = listItems.length * lineHeight + padding * 2;
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height + listHeight;

				const ctx = canvas.getContext('2d')!;

				// Background for list section
				ctx.fillStyle = exportBgDark ? '#1a1a1a' : '#f5f5f5';
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				// Draw image
				ctx.drawImage(img, 0, 0);

				// Draw equipment list
				ctx.fillStyle = exportBgDark ? '#f5f5f5' : '#0f0f0f';
				ctx.font = `14px sans-serif`;
				let textY = img.height + padding + 14;
				for (const item of listItems) {
					if (item.endsWith(':')) {
						ctx.font = 'bold 14px sans-serif';
						ctx.fillStyle = exportBgDark ? '#ff6b35' : '#cc4400';
					} else {
						ctx.font = '14px sans-serif';
						ctx.fillStyle = exportBgDark ? '#f5f5f5' : '#0f0f0f';
					}
					ctx.fillText(item, padding, textY);
					textY += lineHeight;
				}

				const finalUrl = canvas.toDataURL('image/jpeg', 0.92);
				downloadDataUrl(finalUrl, `${boardName}-pedalnation.jpg`);
				resolve();
			};
			img.src = imageDataUrl;
		});
	}

	// ── Board type detection ───────────────────────────────────────────────────
	function detectBoardType(): 'catalog' | 'custom' {
		const boardNode = getBoardNode();
		if (!boardNode) return 'custom';
		// If the board_id starts with 'custom-', it was manually sized
		if (boardNode.data.board_id.startsWith('custom-')) return 'custom';
		return 'catalog';
	}

	// ── Serialize canvas data ──────────────────────────────────────────────────
	function serializeCanvasData() {
		return {
			nodes: $nodes,
			edges: $edges,
			viewport: $viewport
		};
	}

	// ── Save actions ──────────────────────────────────────────────────────────
	function handleSave() {
		const session = $page.data?.session;
		if (!session) {
			showLoginPrompt = true;
			return;
		}
		const boardId = $currentBoardId;
		if (boardId) {
			// Existing board: save directly without dialog
			performSave(boardId, null, null, null);
		} else {
			// New board: open save dialog
			saveName = boardName !== 'Novo Pedalboard' ? boardName : 'Meu Board';
			saveDescription = '';
			saveIsPublic = false;
			saveDialogMode = 'save';
			showSaveDialog = true;
		}
	}

	function handleSaveAs() {
		const session = $page.data?.session;
		if (!session) {
			showLoginPrompt = true;
			return;
		}
		saveName = boardName !== 'Novo Pedalboard' ? boardName : 'Meu Board';
		saveDescription = '';
		saveIsPublic = false;
		saveDialogMode = 'save-as';
		showSaveDialog = true;
	}

	async function confirmSaveDialog() {
		if (!saveName.trim()) return;
		isSaving = true;
		try {
			await performSave(
				saveDialogMode === 'save' ? ($currentBoardId ?? null) : null,
				saveName.trim(),
				saveDescription.trim() || null,
				saveIsPublic
			);
			showSaveDialog = false;
		} finally {
			isSaving = false;
		}
	}

	async function performSave(
		existingId: string | null,
		name: string | null,
		description: string | null,
		isPublic: boolean | null
	) {
		const canvasData = serializeCanvasData();
		const boardType = detectBoardType();

		if (existingId) {
			// PUT update existing
			const res = await fetch(`/api/boards/${existingId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					canvas_data: canvasData,
					board_type: boardType,
					...(name !== null ? { name } : {}),
					...(description !== null ? { description } : {}),
					...(isPublic !== null ? { is_public: isPublic } : {})
				})
			});

			if (res.ok) {
				const result = await res.json();
				boardName = result.board.name;
				clearDraft();
				showToast('Board salvo com sucesso!');
			} else {
				showToast('Erro ao salvar board. Tente novamente.');
			}
		} else {
			// POST create new
			const res = await fetch('/api/boards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name ?? 'Meu Board',
					description: description ?? null,
					is_public: isPublic ?? false,
					board_type: boardType,
					canvas_data: canvasData
				})
			});

			if (res.ok) {
				const result = await res.json();
				const newId = result.board.id;
				currentBoardId.set(newId);
				boardName = result.board.name;
				clearDraft();
				// Update URL without navigation
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.set('board', newId);
				pushState(newUrl.toString(), {});
				showToast('Board salvo com sucesso!');
			} else {
				showToast('Erro ao salvar board. Tente novamente.');
			}
		}
	}

	// ── Keyboard shortcuts ────────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent) {
		// Handle Ctrl+F / Cmd+F to focus search
		if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
			e.preventDefault();
			activeTab = 'pedals';
			if (searchInputEl) {
				searchInputEl.focus();
				searchInputEl.select();
			}
			return;
		}

		// Ctrl+E / Cmd+E — export
		if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
			e.preventDefault();
			openExportDialog();
			return;
		}

		// Ctrl+S / Cmd+S — save
		if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') {
			e.preventDefault();
			handleSave();
			return;
		}

		// Ctrl+Shift+S / Cmd+Shift+S — save as new
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
			e.preventDefault();
			handleSaveAs();
			return;
		}

		// Don't fire on input fields
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

		if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			deleteSelectedNodes();
			return;
		}

		if (e.ctrlKey || e.metaKey) {
			if (e.shiftKey && e.key === 'z') {
				e.preventDefault();
				redo();
				return;
			}
			if (e.key === 'z') {
				e.preventDefault();
				undo();
				return;
			}
			if (e.key === 'c') {
				e.preventDefault();
				copySelectedNodes();
				return;
			}
			if (e.key === 'v') {
				e.preventDefault();
				pasteNodes();
				return;
			}
		}

		if (e.key === 'r' || e.key === 'R') {
			if ($selectedNodeId) {
				e.preventDefault();
				rotateSelectedNode();
			}
		}

		if (e.key === 'g' || e.key === 'G') {
			e.preventDefault();
			toggleSnapGrid();
		}
	}

	function handleKeyup(e: KeyboardEvent) {
		if (e.key === 'Alt') {
			altKeyActive = false;
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Alt') {
			altKeyActive = true;
		}
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────
	onMount(() => {
		loadPedals();
		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('keydown', handleGlobalKeydown);
		document.addEventListener('keyup', handleKeyup);
		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('dragend', handleGlobalDragEnd);

		// Check for post-duplicate toast
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			if (url.searchParams.get('_toast') === 'duplicated') {
				url.searchParams.delete('_toast');
				window.history.replaceState({}, '', url.toString());
				setTimeout(() => showToast('Board duplicado!'), 100);
			}
		}

		// Load board from server data if ?board= param was passed
		if (data?.board && data.board.canvas_data) {
			const bd = data.board;
			loadCanvasState(bd.canvas_data as { nodes?: CanvasNode[]; edges?: never[]; viewport?: { x: number; y: number; zoom: number } });
			currentBoardId.set(bd.id);
			boardName = bd.name;
		} else {
			// No board from URL — check for draft
			if (hasDraft()) {
				showDraftDialog = true;
			}
		}

		// Track canvas size for board placement
		if (canvasEl) {
			const ro = new ResizeObserver((entries) => {
				for (const entry of entries) {
					canvasElWidth = entry.contentRect.width;
					canvasElHeight = entry.contentRect.height;
				}
			});
			ro.observe(canvasEl);
			canvasElWidth = canvasEl.clientWidth;
			canvasElHeight = canvasEl.clientHeight;

			return () => {
				ro.disconnect();
				document.removeEventListener('keydown', handleKeydown);
				document.removeEventListener('keydown', handleGlobalKeydown);
				document.removeEventListener('keyup', handleKeyup);
				document.removeEventListener('mousemove', handleGlobalMouseMove);
				document.removeEventListener('dragend', handleGlobalDragEnd);
			};
		}

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('keydown', handleGlobalKeydown);
			document.removeEventListener('keyup', handleKeyup);
			document.removeEventListener('mousemove', handleGlobalMouseMove);
			document.removeEventListener('dragend', handleGlobalDragEnd);
		};
	});

	// Initialize zoomDisplay from stored viewport
	$effect(() => {
		zoomDisplay = Math.round($viewport.zoom * 100);
	});

	// Update node interactivity based on active layer and visibility
	$effect(() => {
		const al = $activeLayer;
		const vis = $layerVisibility;
		nodes.update((ns) =>
			ns.map((n) => {
				if (n.type !== 'pedalNode') return n;
				const nodeLayer = (n.data as PedalNodeData).layer ?? 'top';
				const layerVis = vis[nodeLayer as 'top' | 'bottom'] ?? true;
				const isActive = nodeLayer === al;
				const canInteract = isActive && layerVis;
				return {
					...n,
					draggable: canInteract,
					selectable: canInteract
				};
			})
		);
	});
</script>

<!-- Drag ghost: follows cursor during catalog drag -->
{#if ghostVisible && ghostData}
	<div
		class="drag-ghost"
		style="left: {ghostX}px; top: {ghostY}px;"
	>
		{#if ghostData.image_url}
			<img src={ghostData.image_url} alt={ghostData.name} />
		{:else}
			<div class="drag-ghost-placeholder">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5">
					<rect x="2" y="7" width="20" height="15" rx="2"></rect>
					<circle cx="12" cy="14" r="3"></circle>
				</svg>
			</div>
		{/if}
		<span class="drag-ghost-label">{ghostData.name}</span>
	</div>
{/if}

<div class="builder-root">
	<!-- ── Left Panel ───────────────────────────────────────────────────── -->
	<aside class="panel panel-left" style="width: {leftWidth}px; min-width: {MIN_PANEL}px; max-width: {MAX_PANEL}px;">

		<!-- Tab bar -->
		<div class="panel-tabs">
			<button
				class="panel-tab {activeTab === 'pedals' ? 'active' : ''}"
				onclick={() => switchTab('pedals')}
			>
				Pedais
			</button>
			<button
				class="panel-tab {activeTab === 'boards' ? 'active' : ''}"
				onclick={() => switchTab('boards')}
			>
				Boards
			</button>
		</div>

		<!-- Pedals tab -->
		{#if activeTab === 'pedals'}
			<div class="panel-search">
				<div class="search-wrapper">
					<svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
					</svg>
					<input
						class="search-input"
						type="text"
						placeholder="Buscar pedais... (Ctrl+F)"
						bind:this={searchInputEl}
						value={searchQuery}
						oninput={(e) => handleSearchInput((e.target as HTMLInputElement).value)}
						onkeydown={handleSearchKeydown}
					/>
					{#if searchQuery}
						<button class="search-clear" onclick={clearSearch} aria-label="Limpar busca" type="button">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					{/if}
				</div>
				<div class="category-scroll">
					<button
						class="category-chip {selectedCategory === '' ? 'active' : ''}"
						onclick={() => (selectedCategory = '')}
					>
						Todos
					</button>
					{#each categories() as cat}
						<button
							class="category-chip {selectedCategory === cat ? 'active' : ''}"
							onclick={() => (selectedCategory = cat)}
						>
							{cat}
						</button>
					{/each}
				</div>
				{#if brands().length > 0}
					<div class="brand-filter-row">
						<select
							class="brand-select"
							value={selectedBrand}
							onchange={(e) => (selectedBrand = (e.target as HTMLSelectElement).value)}
							aria-label="Filtrar por marca"
						>
							<option value="">Todas as marcas</option>
							{#each brands() as brand}
								<option value={brand}>{brand}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<div class="pedal-list">
				{#if loading}
					<div class="panel-empty">
						<div class="spinner"></div>
						<span>Carregando pedais...</span>
					</div>
				{:else if filteredPedals().length === 0}
					<div class="panel-empty">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
						</svg>
						{#if debouncedQuery.trim()}
							<span>Nenhum pedal encontrado para "{debouncedQuery.trim()}"</span>
						{:else}
							<span>Nenhum pedal encontrado</span>
						{/if}
					</div>
				{:else}
					{#each filteredPedals() as pedal, idx (pedal.id)}
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<div
							class="pedal-card"
							role="listitem"
							tabindex="0"
							data-index={idx}
							draggable="true"
							ondragstart={(e) => handlePedalDragStart(e, pedal)}
							ondragend={handleGlobalDragEnd}
							onkeydown={(e) => {
								if (e.key === 'ArrowDown') {
									e.preventDefault();
									const next = document.querySelector<HTMLElement>(`.pedal-card[data-index="${idx + 1}"]`);
									if (next) { focusedResultIndex = idx + 1; next.focus(); }
								} else if (e.key === 'ArrowUp') {
									e.preventDefault();
									if (idx === 0) {
										focusedResultIndex = -1;
										if (searchInputEl) searchInputEl.focus();
									} else {
										const prev = document.querySelector<HTMLElement>(`.pedal-card[data-index="${idx - 1}"]`);
										if (prev) { focusedResultIndex = idx - 1; prev.focus(); }
									}
								} else if (e.key === 'Escape') {
									clearSearch();
								}
							}}
						>
							<div class="pedal-thumb">
								{#if pedal.image_url}
									<img src={pedal.image_url} alt={pedal.name} loading="lazy" />
								{:else}
									<div class="pedal-thumb-placeholder">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5">
											<rect x="2" y="7" width="20" height="15" rx="2"></rect>
											<circle cx="12" cy="14" r="3"></circle>
											<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
										</svg>
									</div>
								{/if}
							</div>
							<div class="pedal-info">
								<span class="pedal-name">{pedal.name}</span>
								<span class="pedal-brand">{pedal.brand}</span>
								{#if pedal.category}
									<span class="pedal-category">{pedal.category}</span>
								{/if}
							</div>
							<button
								class="pedal-add-btn"
								title="Adicionar ao canvas"
								onclick={(e) => { e.stopPropagation(); addPedalToCenter(pedal); }}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
							</button>
						</div>
					{/each}
				{/if}
			</div>

		<!-- Boards tab -->
		{:else}
			<div class="boards-list">
				<!-- Custom board option -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="board-card board-card-custom" onclick={openCustomBoardDialog} role="button" tabindex="0">
					<div class="board-thumb board-thumb-custom">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" stroke-width="1.5">
							<rect x="2" y="3" width="20" height="18" rx="2"></rect>
							<line x1="12" y1="8" x2="12" y2="16"></line>
							<line x1="8" y1="12" x2="16" y2="12"></line>
						</svg>
					</div>
					<div class="board-info">
						<span class="board-name-label">Board Customizado</span>
						<span class="board-meta">Definir dimensoes manualmente</span>
					</div>
				</div>

				{#if boardsLoading}
					<div class="panel-empty">
						<div class="spinner"></div>
						<span>Carregando boards...</span>
					</div>
				{:else if boards.length === 0}
					<div class="panel-empty">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5">
							<rect x="2" y="3" width="20" height="18" rx="2"></rect>
						</svg>
						<span>Nenhum board encontrado</span>
					</div>
				{:else}
					{#each boards as board (board.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="board-card"
							role="button"
							tabindex="0"
							onclick={() => handleBoardCardClick(board)}
						>
							<div class="board-thumb">
								{#if board.image_url}
									<img src={board.image_url} alt={board.name} loading="lazy" />
								{:else}
									<div class="board-thumb-placeholder">
										<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5">
											<rect x="2" y="3" width="20" height="18" rx="2"></rect>
										</svg>
									</div>
								{/if}
							</div>
							<div class="board-info">
								<span class="board-name-label">{board.name}</span>
								<span class="board-meta">{board.brand} &nbsp;·&nbsp; {mmToCm(board.width_mm)}x{mmToCm(board.height_mm)}cm</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</aside>

	<!-- Left resize handle -->
	<button
		class="resize-handle resize-handle-left {draggingLeft ? 'dragging' : ''}"
		aria-label="Redimensionar painel esquerdo — duplo-clique para restaurar"
		onmousedown={startLeftResize}
		ontouchstart={startLeftResize}
		ondblclick={restoreLeftWidth}
	></button>

	<!-- ── Canvas Area ────────────────────────────────────────────────────── -->
	<main
		class="canvas-area"
		bind:this={canvasEl}
		ondragover={handleCanvasDragOver}
		ondrop={handleCanvasDrop}
		ondragleave={handleCanvasDragLeave}
	>
		<SvelteFlow
			bind:nodes={$nodes}
			bind:edges={$edges}
			bind:viewport={$viewport}
			{nodeTypes}
			fitView={$nodes.length === 0}
			minZoom={0.25}
			maxZoom={4}
			panOnDrag={true}
			zoomOnScroll={true}
			selectionMode={SelectionMode.Partial}
			deleteKey={null}
			snapGrid={$snapGridEnabled && !altKeyActive ? [10, 10] : undefined}
			onnodeclick={handleNodeClick}
			onnodedrag={handleNodeDrag}
			onnodedragstop={handleNodeDragStop}
			onpaneclick={() => handlePaneClick()}
			onmoveend={(_e, vp) => { zoomDisplay = Math.round(vp.zoom * 100); }}
			colorMode="dark"
			class="svelte-flow-canvas"
		>
			<CanvasInner
				showGrid={$snapGridEnabled}
				{alignmentGuides}
				{viewport}
				onReady={(api) => { canvasApi = api; }}
			/>
		</SvelteFlow>

		<!-- Empty state overlay (shown when canvas is empty) -->
		{#if $nodes.length === 0}
			<div class="canvas-empty-state" aria-hidden="true">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" stroke-width="1.5">
					<rect x="2" y="7" width="20" height="15" rx="2"></rect>
					<circle cx="12" cy="14" r="3"></circle>
					<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
				</svg>
				<p>Arraste pedais do painel esquerdo para montar seu board</p>
			</div>
		{/if}

		<!-- ── Layers Panel Overlay (bottom-left) ──────────────────────── -->
		{#if showLayersPanel}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="layers-panel">
				<div class="layers-panel-header">
					<span class="layers-panel-title">Layers</span>
				</div>

				<!-- Board Layer (locked) -->
				<div class="layer-row layer-row-board">
					<span class="layer-lock-icon" title="Board Layer (bloqueado)">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="2">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						</svg>
					</span>
					<span class="layer-name layer-name-board">Board Layer</span>
				</div>

				<!-- Bottom Layer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="layer-row {$activeLayer === 'bottom' ? 'layer-row-active' : ''}"
					onclick={() => handleLayerClick('bottom')}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && handleLayerClick('bottom')}
					aria-label="Selecionar Bottom Layer"
				>
					<!-- Eye icon -->
					<button
						class="layer-eye-btn"
						onclick={(e) => { e.stopPropagation(); handleLayerVisibilityToggle('bottom'); }}
						aria-label={$layerVisibility.bottom ? 'Ocultar Bottom Layer' : 'Mostrar Bottom Layer'}
						title={$layerVisibility.bottom ? 'Ocultar' : 'Mostrar'}
					>
						{#if $layerVisibility.bottom}
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
						{:else}
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
								<line x1="1" y1="1" x2="23" y2="23"></line>
							</svg>
						{/if}
					</button>
					<span class="layer-name" class:layer-hidden={!$layerVisibility.bottom}>Bottom Layer</span>
					{#if $activeLayer === 'bottom'}
						<span class="layer-active-dot" title="Camada ativa"></span>
					{/if}
				</div>

				<!-- Top Layer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="layer-row {$activeLayer === 'top' ? 'layer-row-active' : ''}"
					onclick={() => handleLayerClick('top')}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && handleLayerClick('top')}
					aria-label="Selecionar Top Layer"
				>
					<!-- Eye icon -->
					<button
						class="layer-eye-btn"
						onclick={(e) => { e.stopPropagation(); handleLayerVisibilityToggle('top'); }}
						aria-label={$layerVisibility.top ? 'Ocultar Top Layer' : 'Mostrar Top Layer'}
						title={$layerVisibility.top ? 'Ocultar' : 'Mostrar'}
					>
						{#if $layerVisibility.top}
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
						{:else}
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
								<line x1="1" y1="1" x2="23" y2="23"></line>
							</svg>
						{/if}
					</button>
					<span class="layer-name" class:layer-hidden={!$layerVisibility.top}>Top Layer</span>
					{#if $activeLayer === 'top'}
						<span class="layer-active-dot" title="Camada ativa"></span>
					{/if}
				</div>
			</div>
		{/if}

		<!-- ── Floating Canvas Controls (bottom-right) ─────────────────── -->
		<div class="canvas-controls">
			<!-- Save -->
			<button
				class="ctrl-btn"
				onclick={handleSave}
				onmouseenter={() => (activeTooltip = 'Salvar (Ctrl+S)')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Salvar (Ctrl+S)"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
					<polyline points="17 21 17 13 7 13 7 21"></polyline>
					<polyline points="7 3 7 8 15 8"></polyline>
				</svg>
				{#if activeTooltip === 'Salvar (Ctrl+S)'}
					<span class="tooltip">Salvar (Ctrl+S)</span>
				{/if}
			</button>

			<!-- Share -->
			<button
				class="ctrl-btn"
				onclick={handleShare}
				onmouseenter={() => (activeTooltip = 'Compartilhar')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Compartilhar"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="18" cy="5" r="3"></circle>
					<circle cx="6" cy="12" r="3"></circle>
					<circle cx="18" cy="19" r="3"></circle>
					<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
					<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
				</svg>
				{#if activeTooltip === 'Compartilhar'}
					<span class="tooltip">Compartilhar</span>
				{/if}
			</button>

			<!-- Export -->
			<button
				class="ctrl-btn"
				onclick={handleExport}
				onmouseenter={() => (activeTooltip = 'Exportar (Ctrl+E)')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Exportar (Ctrl+E)"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="7 10 12 15 17 10"></polyline>
					<line x1="12" y1="15" x2="12" y2="3"></line>
				</svg>
				{#if activeTooltip === 'Exportar (Ctrl+E)'}
					<span class="tooltip">Exportar (Ctrl+E)</span>
				{/if}
			</button>

			<!-- 3-dot menu (US-016) -->
			<div class="ctrl-more-wrap">
				<button
					class="ctrl-btn {showMoreMenu ? 'active' : ''}"
					onclick={() => (showMoreMenu = !showMoreMenu)}
					onmouseenter={() => (activeTooltip = 'Mais opções')}
					onmouseleave={() => (activeTooltip = null)}
					aria-label="Mais opções"
					aria-expanded={showMoreMenu}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="5" r="1"></circle>
						<circle cx="12" cy="12" r="1"></circle>
						<circle cx="12" cy="19" r="1"></circle>
					</svg>
					{#if activeTooltip === 'Mais opções' && !showMoreMenu}
						<span class="tooltip">Mais opções</span>
					{/if}
				</button>

				{#if showMoreMenu}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div class="more-menu-backdrop" onclick={() => (showMoreMenu = false)}></div>
					<div class="more-menu">
						<button
							class="more-menu-item"
							onclick={handleDuplicate}
							disabled={isDuplicating}
						>
							{#if isDuplicating}
								<span class="btn-spinner btn-spinner-sm"></span>
							{:else}
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
								</svg>
							{/if}
							Duplicar board
						</button>
					</div>
				{/if}
			</div>

			<div class="ctrl-divider"></div>

			<!-- Grid toggle -->
			<button
				class="ctrl-btn ctrl-btn-grid {$snapGridEnabled ? 'snap-active' : ''}"
				onclick={toggleGrid}
				onmouseenter={() => (activeTooltip = $snapGridEnabled ? 'Ocultar Grid (G)' : 'Mostrar Grid (G)')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Grid Magnético"
				aria-pressed={$snapGridEnabled}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="7" height="7"></rect>
					<rect x="14" y="3" width="7" height="7"></rect>
					<rect x="14" y="14" width="7" height="7"></rect>
					<rect x="3" y="14" width="7" height="7"></rect>
				</svg>
				{#if activeTooltip === 'Mostrar Grid (G)' || activeTooltip === 'Ocultar Grid (G)'}
					<span class="tooltip">{activeTooltip}</span>
				{/if}
			</button>

			<!-- Layers toggle -->
			<button
				class="ctrl-btn {showLayersPanel ? 'active' : ''}"
				onclick={toggleLayersPanel}
				onmouseenter={() => (activeTooltip = showLayersPanel ? 'Ocultar Layers' : 'Layers')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Layers"
				aria-pressed={showLayersPanel}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
					<polyline points="2 17 12 22 22 17"></polyline>
					<polyline points="2 12 12 17 22 12"></polyline>
				</svg>
				{#if activeTooltip === 'Layers' || activeTooltip === 'Ocultar Layers'}
					<span class="tooltip">{activeTooltip}</span>
				{/if}
			</button>

			<div class="ctrl-divider"></div>

			<!-- Zoom Out -->
			<button
				class="ctrl-btn"
				onclick={zoomOut}
				onmouseenter={() => (activeTooltip = 'Zoom Out')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Zoom Out"
				disabled={zoomDisplay <= 25}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					<line x1="8" y1="11" x2="14" y2="11"></line>
				</svg>
				{#if activeTooltip === 'Zoom Out'}
					<span class="tooltip">Zoom Out</span>
				{/if}
			</button>

			<!-- Zoom level indicator + Fit on click -->
			<button
				class="ctrl-btn zoom-label"
				onclick={fitView}
				onmouseenter={() => (activeTooltip = 'Ajustar Tela')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Ajustar Tela"
			>
				{zoomDisplay}%
				{#if activeTooltip === 'Ajustar Tela'}
					<span class="tooltip">Ajustar Tela</span>
				{/if}
			</button>

			<!-- Zoom In -->
			<button
				class="ctrl-btn"
				onclick={zoomIn}
				onmouseenter={() => (activeTooltip = 'Zoom In')}
				onmouseleave={() => (activeTooltip = null)}
				aria-label="Zoom In"
				disabled={zoomDisplay >= 400}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					<line x1="11" y1="8" x2="11" y2="14"></line>
					<line x1="8" y1="11" x2="14" y2="11"></line>
				</svg>
				{#if activeTooltip === 'Zoom In'}
					<span class="tooltip">Zoom In</span>
				{/if}
			</button>
		</div>
	</main>

	<!-- Right resize handle (only visible when right panel is expanded) -->
	{#if !rightCollapsed}
		<button
			class="resize-handle resize-handle-right {draggingRight ? 'dragging' : ''}"
			aria-label="Redimensionar painel direito — duplo-clique para restaurar"
			onmousedown={startRightResize}
			ontouchstart={startRightResize}
			ondblclick={restoreRightWidth}
		></button>
	{/if}

	<!-- ── Right Panel: Info Panel ───────────────────────────────────────── -->
	<aside
		class="panel panel-right {rightCollapsed ? 'collapsed' : ''}"
		style={rightCollapsed ? 'width: 0; min-width: 0; overflow: hidden;' : `width: ${rightWidth}px; min-width: ${MIN_PANEL}px; max-width: ${MAX_PANEL}px;`}
	>
		{#if !rightCollapsed}
			<div class="panel-header">
				<span class="panel-title">Informações</span>
				<button
					class="panel-close"
					onclick={() => (rightCollapsed = true)}
					aria-label="Fechar painel"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="panel-body">
				<InfoPanel />
			</div>
		{/if}
	</aside>
</div>

<!-- ── Toast Notification ─────────────────────────────────────────────────── -->
{#if toastVisible}
	<div class="toast {toastVisible ? 'toast-visible' : ''}">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="20 6 9 17 4 12"></polyline>
		</svg>
		{toastMessage}
	</div>
{/if}

<!-- ── Login Prompt Dialog ────────────────────────────────────────────────── -->
{#if showLoginPrompt}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={() => (showLoginPrompt = false)} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">Entrar para salvar</span>
				<button class="dialog-close" onclick={() => (showLoginPrompt = false)} aria-label="Fechar">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="dialog-body">
				<p class="dialog-message">Voce precisa estar logado para salvar seu board.</p>
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={() => (showLoginPrompt = false)}>Cancelar</button>
				<a class="dialog-btn dialog-btn-confirm" href="/auth/login?redirect=/builder">Entrar</a>
			</div>
		</div>
	</div>
{/if}

<!-- ── Save Board Dialog ───────────────────────────────────────────────────── -->
{#if showSaveDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={() => { if (!isSaving) showSaveDialog = false; }} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box dialog-box-save" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">{saveDialogMode === 'save-as' ? 'Salvar como novo' : 'Salvar Board'}</span>
				<button class="dialog-close" onclick={() => { if (!isSaving) showSaveDialog = false; }} aria-label="Fechar" disabled={isSaving}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="dialog-body">
				<div class="save-field">
					<label class="save-field-label" for="save-name">Nome</label>
					<input
						id="save-name"
						class="save-field-input"
						type="text"
						placeholder="Meu Board"
						bind:value={saveName}
						disabled={isSaving}
						maxlength="120"
					/>
				</div>
				<div class="save-field">
					<label class="save-field-label" for="save-desc">Descricao (opcional)</label>
					<textarea
						id="save-desc"
						class="save-field-textarea"
						placeholder="Descreva seu pedalboard..."
						bind:value={saveDescription}
						disabled={isSaving}
						rows="3"
						maxlength="500"
					></textarea>
				</div>
				<div class="save-toggle-row">
					<div class="save-toggle-info">
						<span class="save-toggle-label">Publicar no feed</span>
						<span class="save-toggle-hint">Visivel para outros usuarios</span>
					</div>
					<button
						class="switch-btn {saveIsPublic ? 'switch-on' : ''}"
						onclick={() => (saveIsPublic = !saveIsPublic)}
						disabled={isSaving}
						aria-pressed={saveIsPublic}
						aria-label="Publicar no feed"
						type="button"
					>
						<span class="switch-thumb"></span>
					</button>
				</div>
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={() => { if (!isSaving) showSaveDialog = false; }} disabled={isSaving}>Cancelar</button>
				<button
					class="dialog-btn dialog-btn-save"
					onclick={confirmSaveDialog}
					disabled={isSaving || !saveName.trim()}
				>
					{#if isSaving}
						<span class="btn-spinner"></span>
					{/if}
					Salvar
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Restore Draft Dialog ───────────────────────────────────────────────── -->
{#if showDraftDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={() => (showDraftDialog = false)} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">Restaurar rascunho?</span>
			</div>
			<div class="dialog-body">
				<p class="dialog-message">Existe um rascunho salvo localmente. Deseja restaura-lo?</p>
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={() => { clearDraft(); showDraftDialog = false; }}>Descartar</button>
				<button class="dialog-btn dialog-btn-confirm" onclick={() => { showDraftDialog = false; }}>Restaurar</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Confirm Replace Board Dialog ──────────────────────────────────────── -->
{#if showReplaceDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={cancelReplaceBoard} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">Substituir board atual?</span>
			</div>
			<div class="dialog-body">
				<p class="dialog-message">Ja existe um board no canvas. Deseja substituir pelo novo board selecionado?</p>
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={cancelReplaceBoard}>Cancelar</button>
				<button class="dialog-btn dialog-btn-confirm" onclick={confirmReplaceBoard}>Substituir</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Duplicate Login Prompt Dialog (US-016) ────────────────────────────── -->
{#if showDuplicateLoginPrompt}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={() => (showDuplicateLoginPrompt = false)} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">Entrar para duplicar</span>
				<button class="dialog-close" onclick={() => (showDuplicateLoginPrompt = false)} aria-label="Fechar">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="dialog-body">
				<p class="dialog-message">Voce precisa estar logado para duplicar um board.</p>
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={() => (showDuplicateLoginPrompt = false)}>Cancelar</button>
				<a class="dialog-btn dialog-btn-confirm" href="/auth/login?redirect=/builder">Entrar</a>
			</div>
		</div>
	</div>
{/if}

<!-- ── Export Dialog (US-017) ─────────────────────────────────────────────── -->
{#if showExportDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={() => { if (!isExporting) showExportDialog = false; }} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box dialog-box-export" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">Exportar Board</span>
				<button class="dialog-close" onclick={() => { if (!isExporting) showExportDialog = false; }} aria-label="Fechar" disabled={isExporting}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="dialog-body">
				<!-- Preview thumbnail -->
				<div class="export-preview-wrap">
					{#if exportPreviewLoading}
						<div class="export-preview-loading">
							<div class="spinner"></div>
						</div>
					{:else if exportPreviewUrl}
						<img class="export-preview-img" src={exportPreviewUrl} alt="Preview do board" />
					{:else}
						<div class="export-preview-loading">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#606060" stroke-width="1.5">
								<rect x="2" y="7" width="20" height="15" rx="2"></rect>
							</svg>
						</div>
					{/if}
				</div>

				<!-- Background toggle -->
				<div class="export-option-row">
					<span class="export-option-label">Fundo</span>
					<div class="export-bg-toggle">
						<button
							class="export-bg-btn {exportBgDark ? 'active' : ''}"
							onclick={() => (exportBgDark = true)}
							type="button"
							disabled={isExporting}
						>
							<span class="export-bg-swatch export-bg-swatch-dark"></span>
							Escuro
						</button>
						<button
							class="export-bg-btn {!exportBgDark ? 'active' : ''}"
							onclick={() => (exportBgDark = false)}
							type="button"
							disabled={isExporting}
						>
							<span class="export-bg-swatch export-bg-swatch-light"></span>
							Claro
						</button>
					</div>
				</div>

				<!-- Quality toggle -->
				<div class="export-option-row">
					<span class="export-option-label">Qualidade</span>
					<div class="export-bg-toggle">
						<button
							class="export-bg-btn {exportQuality === 'normal' ? 'active' : ''}"
							onclick={() => (exportQuality = 'normal')}
							type="button"
							disabled={isExporting}
						>
							Normal
						</button>
						<button
							class="export-bg-btn {exportQuality === 'high' ? 'active' : ''}"
							onclick={() => (exportQuality = 'high')}
							type="button"
							disabled={isExporting}
						>
							Alta resolucao
						</button>
					</div>
				</div>

				<!-- Include equipment list -->
				<div class="export-option-row export-option-row-check">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<label class="export-checkbox-label" for="export-include-list">
						<input
							id="export-include-list"
							type="checkbox"
							class="export-checkbox"
							bind:checked={exportIncludeList}
							disabled={isExporting}
						/>
						<span class="export-checkbox-text">Incluir lista de equipamentos</span>
					</label>
				</div>
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={() => { if (!isExporting) showExportDialog = false; }} disabled={isExporting}>Cancelar</button>
				<button
					class="dialog-btn dialog-btn-save"
					onclick={performExport}
					disabled={isExporting}
				>
					{#if isExporting}
						<span class="btn-spinner"></span>
					{/if}
					Exportar JPG
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Custom Board Dialog ────────────────────────────────────────────────── -->
{#if showCustomBoardDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-overlay" onclick={closeCustomBoardDialog} role="dialog" aria-modal="true">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<span class="dialog-title">Board Customizado</span>
				<button class="dialog-close" onclick={closeCustomBoardDialog} aria-label="Fechar">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="dialog-body">
				<!-- Unit toggle -->
				<div class="unit-toggle-row">
					<span class="unit-toggle-label">Unidade</span>
					<button
						class="unit-toggle-btn {customBoardUnit === 'cm' ? 'active' : ''}"
						onclick={() => { customBoardUnit = 'cm'; }}
					>cm</button>
					<button
						class="unit-toggle-btn {customBoardUnit === 'inches' ? 'active' : ''}"
						onclick={() => { customBoardUnit = 'inches'; }}
					>pol</button>
				</div>

				{#if customBoardUnit === 'cm'}
					<div class="custom-board-fields">
						<div class="custom-field">
							<label class="custom-field-label" for="cb-width-cm">Largura (cm)</label>
							<input
								id="cb-width-cm"
								class="custom-field-input"
								type="number"
								min="1"
								step="0.1"
								placeholder="ex: 60"
								value={customBoardWidthCm}
								oninput={(e) => handleCustomWidthCmInput((e.target as HTMLInputElement).value)}
							/>
						</div>
						<div class="custom-field">
							<label class="custom-field-label" for="cb-height-cm">Altura (cm)</label>
							<input
								id="cb-height-cm"
								class="custom-field-input"
								type="number"
								min="1"
								step="0.1"
								placeholder="ex: 30"
								value={customBoardHeightCm}
								oninput={(e) => handleCustomHeightCmInput((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>
					{#if customBoardWidthIn || customBoardHeightIn}
						<div class="custom-board-conversion">
							<span class="conversion-label">Em polegadas:</span>
							<span class="conversion-value">{customBoardWidthIn || '—'} x {customBoardHeightIn || '—'} pol</span>
						</div>
					{/if}
				{:else}
					<div class="custom-board-fields">
						<div class="custom-field">
							<label class="custom-field-label" for="cb-width-in">Largura (pol)</label>
							<input
								id="cb-width-in"
								class="custom-field-input"
								type="number"
								min="1"
								step="0.1"
								placeholder="ex: 24"
								value={customBoardWidthIn}
								oninput={(e) => handleCustomWidthInInput((e.target as HTMLInputElement).value)}
							/>
						</div>
						<div class="custom-field">
							<label class="custom-field-label" for="cb-height-in">Altura (pol)</label>
							<input
								id="cb-height-in"
								class="custom-field-input"
								type="number"
								min="1"
								step="0.1"
								placeholder="ex: 12"
								value={customBoardHeightIn}
								oninput={(e) => handleCustomHeightInInput((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>
					{#if customBoardWidthCm || customBoardHeightCm}
						<div class="custom-board-conversion">
							<span class="conversion-label">Em centimetros:</span>
							<span class="conversion-value">{customBoardWidthCm || '—'} x {customBoardHeightCm || '—'} cm</span>
						</div>
					{/if}
				{/if}
			</div>
			<div class="dialog-footer">
				<button class="dialog-btn dialog-btn-cancel" onclick={closeCustomBoardDialog}>Cancelar</button>
				<button
					class="dialog-btn dialog-btn-confirm"
					onclick={confirmCustomBoard}
					disabled={!customBoardWidthCm || !customBoardHeightCm}
				>Adicionar ao Canvas</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Status Bar ─────────────────────────────────────────────────────────── -->
<footer class="status-bar">
	<span class="status-item">
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<rect x="2" y="7" width="20" height="15" rx="2"></rect>
			<circle cx="12" cy="14" r="3"></circle>
			<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
		</svg>
		{pedalCount} {pedalCount === 1 ? 'pedal' : 'pedais'}
	</span>
	<span class="status-sep">·</span>
	<span class="status-item status-board-name">
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"></path>
			<path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
			<path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"></path>
			<path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"></path>
			<path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"></path>
			<path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"></path>
			<path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"></path>
			<path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"></path>
		</svg>
		{boardName}
	</span>
	<span class="status-sep">·</span>
	<span class="status-item">{zoomDisplay}%</span>
	<span class="status-sep">·</span>
	<span class="status-item status-shortcuts">Del: remover &nbsp;·&nbsp; R: girar &nbsp;·&nbsp; Ctrl+Z: desfazer</span>
</footer>

<style>
	/* ── Root layout ──────────────────────────────────────────────────────── */
	.builder-root {
		display: flex;
		flex-direction: row;
		height: calc(100vh - 28px);
		overflow: hidden;
		background: #0f0f0f;
	}

	/* ── Panels ───────────────────────────────────────────────────────────── */
	.panel {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		overflow: hidden;
		transition: width 0.2s ease;
	}

	.panel-left {
		background: #1a1a1a;
		border-right: 1px solid #333333;
	}

	.panel-right {
		background: #1a1a1a;
		border-left: 1px solid #333333;
	}

	.panel-right.collapsed {
		width: 0 !important;
		border-left: none;
		transition: width 0.2s ease;
	}

	/* ── Left Panel Search ────────────────────────────────────────────────── */
	.panel-search {
		flex-shrink: 0;
		padding: 12px;
		border-bottom: 1px solid #2a2a2a;
		background: #1a1a1a;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.search-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 10px;
		color: #606060;
		pointer-events: none;
		flex-shrink: 0;
	}

	.search-input {
		width: 100%;
		background: #252525;
		border: 1px solid #333333;
		border-radius: 6px;
		padding: 7px 32px 7px 32px;
		color: #f5f5f5;
		font-size: 13px;
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}

	.search-input::placeholder {
		color: #606060;
	}

	.search-input:focus {
		border-color: #ff6b35;
	}

	.search-clear {
		position: absolute;
		right: 8px;
		background: transparent;
		border: none;
		color: #606060;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		border-radius: 3px;
		transition: color 0.15s;
	}

	.search-clear:hover {
		color: #f5f5f5;
	}

	/* Category chips */
	.category-scroll {
		display: flex;
		flex-wrap: nowrap;
		gap: 6px;
		overflow-x: auto;
		margin-top: 10px;
		padding-bottom: 2px;
		scrollbar-width: none;
	}

	.category-scroll::-webkit-scrollbar {
		display: none;
	}

	.category-chip {
		flex-shrink: 0;
		background: #252525;
		border: 1px solid #333333;
		border-radius: 4px;
		padding: 3px 10px;
		color: #999999;
		font-size: 11px;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
		font-family: inherit;
	}

	.category-chip:hover {
		border-color: #555;
		color: #f5f5f5;
	}

	.category-chip.active {
		background: rgba(255, 107, 53, 0.2);
		border-color: #ff6b35;
		color: #ff6b35;
	}

	/* Brand filter */
	.brand-filter-row {
		margin-top: 8px;
	}

	.brand-select {
		width: 100%;
		background: #252525;
		border: 1px solid #333333;
		border-radius: 6px;
		padding: 6px 10px;
		color: #f5f5f5;
		font-size: 12px;
		font-family: inherit;
		outline: none;
		cursor: pointer;
		transition: border-color 0.15s;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 28px;
	}

	.brand-select:focus {
		border-color: #ff6b35;
	}

	.brand-select option {
		background: #1a1a1a;
		color: #f5f5f5;
	}

	/* ── Pedal list ───────────────────────────────────────────────────────── */
	.pedal-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		scrollbar-width: thin;
		scrollbar-color: #2a2a2a transparent;
	}

	.pedal-list::-webkit-scrollbar {
		width: 4px;
	}

	.pedal-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.pedal-list::-webkit-scrollbar-thumb {
		background: #2a2a2a;
		border-radius: 2px;
	}

	.pedal-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border-radius: 6px;
		cursor: grab;
		transition: background 0.12s;
		border: 1px solid transparent;
		user-select: none;
	}

	.pedal-card:hover {
		background: #242424;
		border-color: #2a2a2a;
	}

	.pedal-card:active {
		cursor: grabbing;
		background: #2a2a2a;
	}

	.pedal-card:focus {
		outline: none;
		background: #242424;
		border-color: #ff6b35;
	}

	.pedal-card:focus-visible {
		outline: none;
		background: #242424;
		border-color: #ff6b35;
	}

	.pedal-thumb {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		border-radius: 4px;
		overflow: hidden;
		background: #0f0f0f;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pedal-thumb img {
		width: 48px;
		height: 48px;
		object-fit: contain;
	}

	.pedal-thumb-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.pedal-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.pedal-name {
		font-size: 13px;
		color: #f5f5f5;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pedal-brand {
		font-size: 11px;
		color: #999999;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pedal-category {
		font-size: 10px;
		color: #ff6b35;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* ── Empty / loading states ───────────────────────────────────────────── */
	.panel-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 40px 16px;
		color: #606060;
		font-size: 12px;
		text-align: center;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #2a2a2a;
		border-top-color: #ff6b35;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Resize handles ───────────────────────────────────────────────────── */
	.resize-handle {
		width: 4px;
		min-width: 4px;
		flex-shrink: 0;
		cursor: col-resize;
		background: transparent;
		border: none;
		padding: 0;
		position: relative;
		transition: background 0.15s;
		z-index: 10;
		align-self: stretch;
	}

	.resize-handle::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 2px;
		height: 32px;
		background: #2a2a2a;
		border-radius: 1px;
		transition: background 0.15s, height 0.15s;
	}

	.resize-handle:hover::after,
	.resize-handle.dragging::after {
		background: #ff6b35;
		height: 48px;
	}

	/* ── Canvas area ──────────────────────────────────────────────────────── */
	.canvas-area {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-width: 0;
	}

	/* SvelteFlow fills canvas area */
	:global(.svelte-flow-canvas) {
		width: 100%;
		height: 100%;
		background: #0f0f0f;
		cursor: grab;
	}

	:global(.svelte-flow-canvas .svelte-flow__pane) {
		cursor: grab;
	}

	:global(.svelte-flow-canvas .svelte-flow__pane.dragging) {
		cursor: grabbing !important;
	}

	:global(.svelte-flow-canvas .svelte-flow__node) {
		cursor: move;
	}

	/* Remove default node styles that conflict */
	:global(.svelte-flow-canvas .svelte-flow__node-pedalNode) {
		background: transparent;
		border: none;
		box-shadow: none;
		padding: 0;
	}

	/* Hide node handles (no connections needed) */
	:global(.svelte-flow-canvas .svelte-flow__handle) {
		display: none;
	}

	/* Selection box styling */
	:global(.svelte-flow-canvas .svelte-flow__selection) {
		background: rgba(255, 107, 53, 0.05);
		border: 1px solid rgba(255, 107, 53, 0.4);
	}

	/* Dot background via SvelteFlow Background component shows through */

	.canvas-empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		color: #2a2a2a;
		font-size: 13px;
		text-align: center;
		pointer-events: none;
		user-select: none;
		max-width: 260px;
		z-index: 1;
	}

	/* ── Layers Panel Overlay ─────────────────────────────────────────────── */
	.layers-panel {
		position: absolute;
		bottom: 16px;
		left: 16px;
		width: 200px;
		background: #1a1a1a;
		border: 1px solid #333333;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
		z-index: 20;
		overflow: hidden;
	}

	.layers-panel-header {
		padding: 8px 10px 6px;
		border-bottom: 1px solid #2a2a2a;
	}

	.layers-panel-title {
		font-size: 10px;
		font-weight: 600;
		color: #606060;
		text-transform: uppercase;
		letter-spacing: 0.8px;
	}

	.layer-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 10px;
		cursor: pointer;
		transition: background 0.12s;
		position: relative;
	}

	.layer-row:hover {
		background: #242424;
	}

	.layer-row-active {
		background: rgba(255, 107, 53, 0.08);
	}

	.layer-row-active:hover {
		background: rgba(255, 107, 53, 0.12);
	}

	.layer-row-board {
		cursor: default;
		opacity: 0.6;
	}

	.layer-row-board:hover {
		background: transparent;
	}

	.layer-lock-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		width: 22px;
		justify-content: center;
	}

	.layer-eye-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		background: transparent;
		border: none;
		border-radius: 3px;
		color: #606060;
		cursor: pointer;
		transition: background 0.1s, color 0.1s;
		padding: 0;
	}

	.layer-eye-btn:hover {
		background: #2a2a2a;
		color: #a0a0a0;
	}

	.layer-name {
		flex: 1;
		font-size: 12px;
		color: #c0c0c0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.layer-name-board {
		color: #606060;
	}

	.layer-name.layer-hidden {
		opacity: 0.4;
	}

	.layer-active-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #ff6b35;
		flex-shrink: 0;
	}

	/* ── Floating canvas controls ─────────────────────────────────────────── */
	.canvas-controls {
		position: absolute;
		bottom: 16px;
		right: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		background: #1a1a1a;
		border: 1px solid #333333;
		border-radius: 8px;
		padding: 4px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
		z-index: 20;
	}

	.ctrl-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 5px;
		background: transparent;
		color: #a0a0a0;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
	}

	.ctrl-btn:hover:not(:disabled) {
		background: #242424;
		color: #f5f5f5;
	}

	.ctrl-btn.active {
		color: #ff6b35;
		background: rgba(255, 107, 53, 0.1);
	}

	.ctrl-btn.active:hover {
		background: rgba(255, 107, 53, 0.15);
	}

	.ctrl-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.ctrl-btn.zoom-label {
		width: auto;
		padding: 0 6px;
		font-size: 10px;
		font-family: 'JetBrains Mono', monospace;
		color: #606060;
	}

	/* Grid button specific styles — solid fill per spec */
	.ctrl-btn-grid {
		background: #252525;
		color: #a0a0a0;
	}

	.ctrl-btn-grid:hover:not(:disabled) {
		background: #2e2e2e;
		color: #f5f5f5;
	}

	.ctrl-btn-grid.snap-active {
		background: #ff6b35;
		color: #ffffff;
	}

	.ctrl-btn-grid.snap-active:hover {
		background: #e85e2a;
		color: #ffffff;
	}

	.ctrl-divider {
		width: 20px;
		height: 1px;
		background: #2a2a2a;
		margin: 2px 0;
	}

	/* Tooltip */
	.tooltip {
		position: absolute;
		right: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
		background: #242424;
		border: 1px solid #333333;
		color: #f5f5f5;
		font-size: 11px;
		font-family: inherit;
		padding: 4px 8px;
		border-radius: 4px;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.tooltip::after {
		content: '';
		position: absolute;
		right: -5px;
		top: 50%;
		transform: translateY(-50%);
		border: 5px solid transparent;
		border-right: none;
		border-left-color: #333333;
	}

	/* ── Right panel header ───────────────────────────────────────────────── */
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		height: 44px;
		border-bottom: 1px solid #2a2a2a;
		flex-shrink: 0;
	}

	.panel-title {
		font-size: 12px;
		font-weight: 600;
		color: #a0a0a0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.panel-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: #606060;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}

	.panel-close:hover {
		background: #242424;
		color: #f5f5f5;
	}

	.panel-body {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* Info Panel styles moved to InfoPanel.svelte component */

	/* ── Status bar ───────────────────────────────────────────────────────── */
	.status-bar {
		height: 28px;
		background: #0f0f0f;
		border-top: 1px solid #333333;
		display: flex;
		align-items: center;
		padding: 0 12px;
		gap: 8px;
		flex-shrink: 0;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 5px;
		color: #999999;
		font-size: 12px;
		font-family: 'JetBrains Mono', monospace;
	}

	.status-board-name {
		color: #a0a0a0;
	}

	.status-sep {
		color: #3a3a3a;
		font-size: 12px;
		font-family: 'JetBrains Mono', monospace;
	}

	.status-shortcuts {
		color: #3a3a3a;
		font-size: 11px;
		margin-left: auto;
	}

	/* ── Drag ghost ───────────────────────────────────────────────────────── */
	.drag-ghost {
		position: fixed;
		pointer-events: none;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		opacity: 0.7;
		transform: translate(0, 0);
		background: rgba(26, 26, 26, 0.9);
		border: 1px solid #333;
		border-radius: 8px;
		padding: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
		max-width: 80px;
	}

	.drag-ghost img {
		width: 56px;
		height: 56px;
		object-fit: contain;
		display: block;
	}

	.drag-ghost-placeholder {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.drag-ghost-label {
		font-size: 10px;
		color: #a0a0a0;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 72px;
	}

	/* ── Panel Tabs ───────────────────────────────────────────────────────── */
	.panel-tabs {
		display: flex;
		flex-shrink: 0;
		border-bottom: 1px solid #2a2a2a;
		background: #1a1a1a;
	}

	.panel-tab {
		flex: 1;
		padding: 10px 0;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: #606060;
		font-size: 12px;
		font-weight: 600;
		font-family: inherit;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
		margin-bottom: -1px;
	}

	.panel-tab:hover {
		color: #a0a0a0;
	}

	.panel-tab.active {
		color: #ff6b35;
		border-bottom-color: #ff6b35;
	}

	/* ── Boards list ──────────────────────────────────────────────────────── */
	.boards-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		scrollbar-width: thin;
		scrollbar-color: #2a2a2a transparent;
	}

	.boards-list::-webkit-scrollbar {
		width: 4px;
	}

	.boards-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.boards-list::-webkit-scrollbar-thumb {
		background: #2a2a2a;
		border-radius: 2px;
	}

	.board-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.12s;
		border: 1px solid transparent;
		user-select: none;
	}

	.board-card:hover {
		background: #242424;
		border-color: #2a2a2a;
	}

	.board-card:active {
		background: #2a2a2a;
	}

	.board-card-custom {
		border: 1px dashed #333;
		margin-bottom: 8px;
	}

	.board-card-custom:hover {
		border-color: #ff6b35;
		background: rgba(255, 107, 53, 0.05);
	}

	.board-thumb {
		width: 60px;
		height: 60px;
		flex-shrink: 0;
		border-radius: 4px;
		overflow: hidden;
		background: #0f0f0f;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #2a2a2a;
	}

	.board-thumb img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.board-thumb-custom {
		background: rgba(255, 107, 53, 0.08);
		border-color: rgba(255, 107, 53, 0.2);
	}

	.board-thumb-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.board-info {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.board-name-label {
		font-size: 13px;
		color: #f5f5f5;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.board-meta {
		font-size: 11px;
		color: #999999;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── BoardNode CSS in SvelteFlow ──────────────────────────────────────── */
	:global(.svelte-flow-canvas .svelte-flow__node-boardNode) {
		background: transparent;
		border: none;
		box-shadow: none;
		padding: 0;
		cursor: default !important;
	}

	/* ── Dialog ───────────────────────────────────────────────────────────── */
	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9000;
	}

	.dialog-box {
		background: #1a1a1a;
		border: 1px solid #333333;
		border-radius: 10px;
		padding: 0;
		min-width: 320px;
		max-width: 420px;
		width: 90vw;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
		display: flex;
		flex-direction: column;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px 14px;
		border-bottom: 1px solid #2a2a2a;
	}

	.dialog-title {
		font-size: 14px;
		font-weight: 600;
		color: #f5f5f5;
	}

	.dialog-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: #606060;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}

	.dialog-close:hover {
		background: #242424;
		color: #f5f5f5;
	}

	.dialog-body {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dialog-message {
		font-size: 13px;
		color: #a0a0a0;
		line-height: 1.5;
		margin: 0;
	}

	.dialog-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 20px 16px;
		border-top: 1px solid #2a2a2a;
	}

	.dialog-btn {
		padding: 7px 16px;
		border-radius: 6px;
		font-size: 13px;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s, color 0.12s;
		border: 1px solid transparent;
	}

	.dialog-btn-cancel {
		background: transparent;
		border-color: #333;
		color: #a0a0a0;
	}

	.dialog-btn-cancel:hover {
		background: #242424;
		color: #f5f5f5;
	}

	.dialog-btn-confirm {
		background: #ff6b35;
		border-color: #ff6b35;
		color: #fff;
	}

	.dialog-btn-confirm:hover:not(:disabled) {
		background: #ff7d4d;
		border-color: #ff7d4d;
	}

	.dialog-btn-confirm:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Custom board form ────────────────────────────────────────────────── */
	.unit-toggle-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.unit-toggle-label {
		font-size: 12px;
		color: #606060;
		margin-right: 4px;
	}

	.unit-toggle-btn {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-family: 'JetBrains Mono', monospace;
		border: 1px solid #333;
		background: transparent;
		color: #a0a0a0;
		cursor: pointer;
		transition: all 0.12s;
	}

	.unit-toggle-btn:hover {
		border-color: #555;
		color: #f5f5f5;
	}

	.unit-toggle-btn.active {
		background: rgba(255, 107, 53, 0.15);
		border-color: #ff6b35;
		color: #ff6b35;
	}

	.custom-board-fields {
		display: flex;
		gap: 12px;
	}

	.custom-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.custom-field-label {
		font-size: 11px;
		color: #606060;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.custom-field-input {
		background: #0f0f0f;
		border: 1px solid #2a2a2a;
		border-radius: 6px;
		padding: 8px 10px;
		color: #f5f5f5;
		font-size: 13px;
		font-family: 'JetBrains Mono', monospace;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
	}

	.custom-field-input:focus {
		border-color: #ff6b35;
	}

	.custom-field-input::placeholder {
		color: #3a3a3a;
	}

	.custom-board-conversion {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #0f0f0f;
		border-radius: 4px;
		padding: 6px 10px;
	}

	.conversion-label {
		font-size: 11px;
		color: #606060;
	}

	.conversion-value {
		font-size: 12px;
		color: #a0a0a0;
		font-family: 'JetBrains Mono', monospace;
	}

	/* ── Toast ─────────────────────────────────────────────────────────────── */
	.toast {
		position: fixed;
		bottom: 48px;
		left: 50%;
		transform: translateX(-50%) translateY(16px);
		background: #252525;
		border: 1px solid #333;
		border-left: 3px solid #22c55e;
		color: #f5f5f5;
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 8px;
		z-index: 9999;
		opacity: 0;
		transition: opacity 0.2s ease, transform 0.2s ease;
		pointer-events: none;
		white-space: nowrap;
	}

	.toast.toast-visible {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	/* ── Save dialog specifics ─────────────────────────────────────────────── */
	.dialog-box-save {
		width: 420px;
		max-width: calc(100vw - 32px);
	}

	.save-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 16px;
	}

	.save-field:last-child {
		margin-bottom: 0;
	}

	.save-field-label {
		font-size: 12px;
		font-weight: 500;
		color: #a0a0a0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.save-field-input {
		background: #252525;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 8px 12px;
		color: #f5f5f5;
		font-size: 14px;
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}

	.save-field-input:focus {
		border-color: #ff6b35;
	}

	.save-field-textarea {
		background: #252525;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 8px 12px;
		color: #f5f5f5;
		font-size: 14px;
		font-family: inherit;
		outline: none;
		resize: vertical;
		min-height: 72px;
		transition: border-color 0.15s;
	}

	.save-field-textarea:focus {
		border-color: #ff6b35;
	}

	.save-toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 0;
		border-top: 1px solid #2a2a2a;
		margin-top: 4px;
	}

	.save-toggle-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.save-toggle-label {
		font-size: 13px;
		color: #f5f5f5;
		font-weight: 500;
	}

	.save-toggle-hint {
		font-size: 11px;
		color: #606060;
	}

	/* Switch button */
	.switch-btn {
		position: relative;
		width: 40px;
		height: 22px;
		background: #333;
		border: none;
		border-radius: 11px;
		cursor: pointer;
		transition: background 0.2s ease;
		padding: 0;
		flex-shrink: 0;
	}

	.switch-btn.switch-on {
		background: #ff6b35;
	}

	.switch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.switch-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.2s ease;
		display: block;
	}

	.switch-on .switch-thumb {
		transform: translateX(18px);
	}

	/* ── 3-dot more menu (US-016) ──────────────────────────────────────────── */
	.ctrl-more-wrap {
		position: relative;
	}

	.more-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 30;
	}

	.more-menu {
		position: absolute;
		right: calc(100% + 8px);
		bottom: 0;
		background: #1a1a1a;
		border: 1px solid #333333;
		border-radius: 8px;
		padding: 4px;
		min-width: 180px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
		z-index: 40;
		white-space: nowrap;
	}

	.more-menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		background: transparent;
		border: none;
		border-radius: 5px;
		color: #c0c0c0;
		font-size: 13px;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
		text-align: left;
	}

	.more-menu-item:hover:not(:disabled) {
		background: #242424;
		color: #f5f5f5;
	}

	.more-menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-spinner-sm {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255,255,255,0.2);
		border-top-color: #ff6b35;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		flex-shrink: 0;
	}

	/* ── Export dialog (US-017) ─────────────────────────────────────────────── */
	.dialog-box-export {
		width: 460px;
		max-width: calc(100vw - 32px);
	}

	.export-preview-wrap {
		width: 100%;
		max-width: 300px;
		margin: 0 auto 4px;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid #2a2a2a;
		background: #0f0f0f;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 120px;
	}

	.export-preview-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		width: 100%;
	}

	.export-preview-img {
		width: 300px;
		max-width: 100%;
		height: auto;
		display: block;
	}

	.export-option-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0;
		border-top: 1px solid #2a2a2a;
	}

	.export-option-row-check {
		justify-content: flex-start;
	}

	.export-option-label {
		font-size: 13px;
		color: #a0a0a0;
		font-weight: 500;
	}

	.export-bg-toggle {
		display: flex;
		gap: 4px;
	}

	.export-bg-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		border-radius: 5px;
		border: 1px solid #333;
		background: transparent;
		color: #a0a0a0;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.12s;
	}

	.export-bg-btn:hover:not(:disabled) {
		border-color: #555;
		color: #f5f5f5;
	}

	.export-bg-btn.active {
		border-color: #ff6b35;
		background: rgba(255, 107, 53, 0.15);
		color: #ff6b35;
	}

	.export-bg-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.export-bg-swatch {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		border: 1px solid #555;
		flex-shrink: 0;
	}

	.export-bg-swatch-dark {
		background: #0F0F0F;
	}

	.export-bg-swatch-light {
		background: #FFFFFF;
	}

	.export-checkbox-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-size: 13px;
		color: #a0a0a0;
	}

	.export-checkbox {
		width: 16px;
		height: 16px;
		accent-color: #ff6b35;
		cursor: pointer;
	}

	.export-checkbox-text {
		color: #a0a0a0;
	}

	/* Save confirm button */
	.dialog-btn-save {
		background: #ff6b35;
		color: #fff;
		border: none;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dialog-btn-save:hover:not(:disabled) {
		background: #e55a25;
	}

	.dialog-btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Spinner inside button */
	.btn-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.pedal-add-btn {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #FF6B35;
		border: none;
		border-radius: 6px;
		color: white;
		cursor: pointer;
		opacity: 0;
		transition: opacity 150ms ease, background 150ms ease;
	}
	.pedal-card:hover .pedal-add-btn,
	.pedal-card:focus .pedal-add-btn {
		opacity: 1;
	}
	.pedal-add-btn:hover {
		background: #FF8B5E;
	}
	.pedal-card {
		position: relative;
	}
</style>

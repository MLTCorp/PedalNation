import { writable, derived, get } from 'svelte/store';
import type { Node, Edge, Viewport } from '@xyflow/svelte';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LayerId = 'top' | 'bottom';

export interface PedalNodeData extends Record<string, unknown> {
	pedal_id: string;
	name: string;
	brand: string;
	image_url: string | null;
	width_mm: number | null;
	height_mm: number | null;
	rotation: number; // degrees: 0, 90, 180, 270
	category?: string;
	description?: string | null;
	price_usd?: number | null;
	layer?: LayerId; // 'top' | 'bottom'
}

export interface BoardNodeData extends Record<string, unknown> {
	board_id: string;
	name: string;
	brand: string;
	width_cm: number;
	height_cm: number;
	image_url: string | null;
}

export type PedalNode = Node<PedalNodeData>;
export type BoardNode = Node<BoardNodeData>;
export type CanvasNode = PedalNode | BoardNode;

interface CanvasState {
	nodes: CanvasNode[];
	edges: Edge[];
	viewport: Viewport;
}

interface HistoryEntry {
	nodes: CanvasNode[];
	edges: Edge[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pedalnation-draft';
const MM_TO_PX = 1; // 1px per 1mm at zoom 1x
const DEFAULT_WIDTH_PX = 80;
const DEFAULT_HEIGHT_PX = 120;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function mmToPx(mm: number | null, fallback: number): number {
	if (!mm || mm <= 0) return fallback;
	return Math.round(mm * MM_TO_PX);
}

function loadFromStorage(): Partial<CanvasState> {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		return JSON.parse(raw) as Partial<CanvasState>;
	} catch {
		return {};
	}
}

function saveToStorage(state: CanvasState): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore storage errors
	}
}

// ── Stores ────────────────────────────────────────────────────────────────────

const stored = loadFromStorage();

export const nodes = writable<CanvasNode[]>(stored.nodes ?? []);
export const edges = writable<Edge[]>(stored.edges ?? []);
export const viewport = writable<Viewport>(stored.viewport ?? { x: 0, y: 0, zoom: 1 });

// Current saved board ID (null if unsaved)
export const currentBoardId = writable<string | null>(null);

// Selected node for Info Panel
export const selectedNodeId = writable<string | null>(null);
export const selectedNodeData = writable<PedalNodeData | null>(null);

// Multi-selection: derived from nodes store
export const selectedNodes = derived(nodes, ($nodes) =>
	$nodes.filter((n) => n.selected && n.type !== 'boardNode') as PedalNode[]
);

export const selectedNodeCount = derived(selectedNodes, ($sel) => $sel.length);

// ── Snap Grid state ───────────────────────────────────────────────────────────

const SNAP_STORAGE_KEY = 'pedalnation-snap-grid';

function loadSnapFromStorage(): boolean {
	if (typeof localStorage === 'undefined') return false;
	try {
		const raw = localStorage.getItem(SNAP_STORAGE_KEY);
		if (raw === null) return false;
		return JSON.parse(raw) === true;
	} catch {
		return false;
	}
}

function saveSnapToStorage(value: boolean): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// ignore
	}
}

export const snapGridEnabled = writable<boolean>(loadSnapFromStorage());

snapGridEnabled.subscribe((value) => {
	saveSnapToStorage(value);
});

export function toggleSnapGrid(): void {
	snapGridEnabled.update((v) => !v);
}

// ── Layer state ───────────────────────────────────────────────────────────────

export const activeLayer = writable<LayerId>('top');
export const layerVisibility = writable<Record<LayerId, boolean>>({ top: true, bottom: true });

export function setActiveLayer(layer: LayerId): void {
	activeLayer.set(layer);
}

export function toggleLayerVisibility(layer: LayerId): void {
	layerVisibility.update((vis) => ({ ...vis, [layer]: !vis[layer] }));
}

export function moveNodeToLayer(nodeId: string, layer: LayerId): void {
	nodes.update((ns) =>
		ns.map((n) => {
			if (n.id !== nodeId || n.type !== 'pedalNode') return n;
			const updated = { ...n, data: { ...(n.data as PedalNodeData), layer } } as PedalNode;
			// If this is the selected node update selectedNodeData too
			const selId = get(selectedNodeId);
			if (selId === nodeId) selectedNodeData.set(updated.data);
			return updated;
		})
	);
	pushHistory(get(nodes), get(edges));
}

// ── History (undo/redo) ───────────────────────────────────────────────────────

const MAX_HISTORY = 50;

let history: HistoryEntry[] = [];
let historyIndex = -1;

export function pushHistory(n: CanvasNode[], e: Edge[]): void {
	// Remove any future states
	history = history.slice(0, historyIndex + 1);
	history.push({ nodes: structuredClone(n) as CanvasNode[], edges: structuredClone(e) });
	if (history.length > MAX_HISTORY) {
		history = history.slice(history.length - MAX_HISTORY);
	}
	historyIndex = history.length - 1;
}

export function undo(): void {
	if (historyIndex <= 0) return;
	historyIndex--;
	const entry = history[historyIndex];
	nodes.set(structuredClone(entry.nodes) as CanvasNode[]);
	edges.set(structuredClone(entry.edges));
}

export function redo(): void {
	if (historyIndex >= history.length - 1) return;
	historyIndex++;
	const entry = history[historyIndex];
	nodes.set(structuredClone(entry.nodes) as CanvasNode[]);
	edges.set(structuredClone(entry.edges));
}

// ── Board functions ───────────────────────────────────────────────────────────

// Pixels per cm at zoom 1x (1cm = ~10px for a readable scale)
const CM_TO_PX = 10;

export function hasBoardNode(): boolean {
	return get(nodes).some((n) => n.type === 'boardNode');
}

export function addBoardNode(data: BoardNodeData, viewportRef: Viewport, canvasWidth: number, canvasHeight: number): void {
	// Calculate board size in pixels
	const w = Math.round(data.width_cm * CM_TO_PX);
	const h = Math.round(data.height_cm * CM_TO_PX);

	// Center in viewport
	const flowX = (canvasWidth / 2 - viewportRef.x) / viewportRef.zoom - w / 2;
	const flowY = (canvasHeight / 2 - viewportRef.y) / viewportRef.zoom - h / 2;

	const boardNode: BoardNode = {
		id: 'board-node',
		type: 'boardNode',
		position: { x: flowX, y: flowY },
		data: { ...data },
		style: `width: ${w}px; height: ${h}px;`,
		selectable: false,
		draggable: false,
		zIndex: -1
	};

	const current = get(nodes).filter((n) => n.type !== 'boardNode');
	const next = [boardNode, ...current];
	nodes.set(next);
	pushHistory(next, get(edges));
}

export function removeBoardNode(): void {
	const current = get(nodes).filter((n) => n.type !== 'boardNode');
	nodes.set(current);
	pushHistory(current, get(edges));
}

export function getBoardNode(): BoardNode | null {
	const found = get(nodes).find((n) => n.type === 'boardNode');
	return found ? (found as BoardNode) : null;
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

let clipboard: PedalNode[] = [];

export function copySelectedNodes(): void {
	const current = get(nodes);
	// Only copy pedal nodes, not board nodes
	const selected = current.filter((n) => n.selected && n.type !== 'boardNode');
	if (selected.length > 0) {
		clipboard = structuredClone(selected) as PedalNode[];
	}
}

export function pasteNodes(): void {
	if (clipboard.length === 0) return;
	const current = get(nodes);
	const OFFSET = 24;

	const pasted: PedalNode[] = clipboard.map((n) => ({
		...structuredClone(n),
		id: crypto.randomUUID(),
		position: { x: n.position.x + OFFSET, y: n.position.y + OFFSET },
		selected: true
	}));

	// Deselect all existing, add pasted
	const deselected = current.map((n) => ({ ...n, selected: false }));
	const next = [...deselected, ...pasted];
	nodes.set(next);
	pushHistory(next, get(edges));
}

// ── Node operations ───────────────────────────────────────────────────────────

export function addPedalNode(data: PedalNodeData, position: { x: number; y: number }): void {
	const w = mmToPx(data.width_mm, DEFAULT_WIDTH_PX);
	const h = mmToPx(data.height_mm, DEFAULT_HEIGHT_PX);
	const currentLayer = get(activeLayer);

	const node: PedalNode = {
		id: crypto.randomUUID(),
		type: 'pedalNode',
		position,
		data: { ...data, rotation: 0, layer: currentLayer },
		style: `width: ${w}px; height: ${h}px;`,
		origin: [0.5, 0.5],
		zIndex: currentLayer === 'top' ? 10 : 5
	};

	const current = get(nodes);
	const next = [...current, node];
	nodes.set(next);
	pushHistory(next, get(edges));
}

export function deleteSelectedNodes(): void {
	const current = get(nodes);
	const selected = current.filter((n) => n.selected).map((n) => n.id);
	if (selected.length === 0) return;

	const next = current.filter((n) => !n.selected);
	nodes.set(next);
	// Also remove connected edges
	edges.update((e) => e.filter((edge) => !selected.includes(edge.source) && !selected.includes(edge.target)));

	selectedNodeId.set(null);
	selectedNodeData.set(null);

	pushHistory(next, get(edges));
}

export function rotateSelectedNode(): void {
	const nid = get(selectedNodeId);
	if (!nid) return;

	nodes.update((ns): CanvasNode[] => {
		return ns.map((n) => {
			if (n.id !== nid) return n;
			if (n.type === 'boardNode') return n; // boards are not rotatable
			const pedalData = n.data as PedalNodeData;
			const currentRot = pedalData.rotation ?? 0;
			const nextRot = (currentRot + 90) % 360;
			const updated = { ...n, data: { ...pedalData, rotation: nextRot } } as PedalNode;
			// Also update selectedNodeData
			selectedNodeData.set(updated.data);
			return updated;
		});
	});

	pushHistory(get(nodes), get(edges));
}

/** Rotate ALL selected pedal nodes by 90° */
export function rotateAllSelected(): void {
	const selected = get(selectedNodes);
	if (selected.length === 0) return;

	const ids = new Set(selected.map((n) => n.id));
	nodes.update((ns): CanvasNode[] => {
		return ns.map((n) => {
			if (!ids.has(n.id) || n.type === 'boardNode') return n;
			const pedalData = n.data as PedalNodeData;
			const nextRot = ((pedalData.rotation ?? 0) + 90) % 360;
			return { ...n, data: { ...pedalData, rotation: nextRot } } as PedalNode;
		});
	});

	pushHistory(get(nodes), get(edges));
}

// ── Persistence (debounced) ───────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(): void {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveToStorage({
			nodes: get(nodes),
			edges: get(edges),
			viewport: get(viewport)
		});
	}, 2000);
}

nodes.subscribe(scheduleSave);
edges.subscribe(scheduleSave);
viewport.subscribe(scheduleSave);

// ── Load canvas state from saved board ────────────────────────────────────────

export function loadCanvasState(state: { nodes?: CanvasNode[]; edges?: Edge[]; viewport?: Viewport }): void {
	const ns = (state.nodes ?? []) as CanvasNode[];
	const es = (state.edges ?? []) as Edge[];
	const vp = state.viewport ?? { x: 0, y: 0, zoom: 1 };
	nodes.set(ns);
	edges.set(es);
	viewport.set(vp);
	// Reset history with loaded state
	history = [];
	historyIndex = -1;
	pushHistory(ns, es);
}

// ── Clear draft from localStorage ────────────────────────────────────────────

export function clearDraft(): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function hasDraft(): boolean {
	if (typeof localStorage === 'undefined') return false;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return false;
		const parsed = JSON.parse(raw) as Partial<CanvasState>;
		return !!(parsed.nodes && parsed.nodes.length > 0);
	} catch {
		return false;
	}
}

// Initialize history with current state
pushHistory(get(nodes), get(edges));

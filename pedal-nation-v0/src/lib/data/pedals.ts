// Pedal data loaded from Pedal Playground's open dataset
// Images served from pedalplayground.com CDN

export interface PPPedal {
  Brand: string;
  Name: string;
  Width: number;  // inches
  Height: number; // inches
  Image: string;  // filename
}

export interface PPBoard {
  Brand: string;
  Name: string;
  Width: number;
  Height: number;
  Image: string;
}

const PEDAL_IMG_BASE = 'https://pedalplayground.com/public/images/pedals/';
const BOARD_IMG_BASE = 'https://pedalplayground.com/public/images/pedalboards/';

let pedalsCache: PPPedal[] | null = null;
let boardsCache: PPBoard[] | null = null;

export async function loadPedals(): Promise<PPPedal[]> {
  if (pedalsCache) return pedalsCache;
  const res = await fetch('/data/pedals.json');
  pedalsCache = await res.json();
  return pedalsCache!;
}

export async function loadBoards(): Promise<PPBoard[]> {
  if (boardsCache) return boardsCache;
  const res = await fetch('/data/pedalboards.json');
  boardsCache = await res.json();
  return boardsCache!;
}

export function pedalImageUrl(filename: string): string {
  return PEDAL_IMG_BASE + encodeURIComponent(filename);
}

export function boardImageUrl(filename: string): string {
  return BOARD_IMG_BASE + encodeURIComponent(filename);
}

export function pedalDisplayName(p: PPPedal): string {
  return `${p.Brand} ${p.Name}`;
}

// Convert inches to pixels at a given scale
export function inToPixels(inches: number, scale: number): number {
  return inches * scale;
}

import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/supabase-server';

const BASE_URL = 'https://pedalnation.com';

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return new Date().toISOString().split('T')[0];
	return new Date(dateStr).toISOString().split('T')[0];
}

export const GET: RequestHandler = async () => {
	const supabase = createSupabaseAdminClient();

	// Fetch active pedals for their slugs and updated_at
	const { data: pedals } = await supabase
		.from('pedals')
		.select('slug, updated_at')
		.eq('is_active', true)
		.order('updated_at', { ascending: false });

	// Fetch public boards for their IDs and updated_at
	const { data: boards } = await supabase
		.from('user_boards')
		.select('id, updated_at')
		.eq('is_public', true)
		.order('updated_at', { ascending: false });

	const now = new Date().toISOString().split('T')[0];

	const urls: string[] = [];

	// Static pages
	urls.push(`
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`);

	urls.push(`
  <url>
    <loc>${BASE_URL}/pedals</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

	urls.push(`
  <url>
    <loc>${BASE_URL}/boards</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

	// Dynamic pedal pages
	for (const pedal of pedals ?? []) {
		urls.push(`
  <url>
    <loc>${BASE_URL}/pedals/${escapeXml(pedal.slug)}</loc>
    <lastmod>${formatDate(pedal.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
	}

	// Dynamic public board pages
	for (const board of boards ?? []) {
		urls.push(`
  <url>
    <loc>${BASE_URL}/boards/${escapeXml(board.id)}</loc>
    <lastmod>${formatDate(board.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
		}
	});
};

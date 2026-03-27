import type { RequestHandler } from './$types';

const BASE_URL = 'https://pedalnation.com';

export const GET: RequestHandler = async () => {
	const robotsTxt = `User-agent: *
Allow: /
Allow: /pedals
Allow: /pedals/
Allow: /boards
Allow: /boards/
Disallow: /admin/
Disallow: /auth/
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml
`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase-server';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const body = await request.json().catch(() => null);

	if (!body) {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { affiliate_link_id, pedal_id, source, user_id } = body;

	if (!affiliate_link_id || !pedal_id) {
		return json({ error: 'affiliate_link_id and pedal_id are required' }, { status: 422 });
	}

	const supabase = createSupabaseServerClient(cookies);

	// Fetch the affiliate link to get the base URL
	const { data: link, error: linkError } = await supabase
		.from('affiliate_links')
		.select('id, url, store_name, affiliate_code, pedal_id')
		.eq('id', affiliate_link_id)
		.eq('is_active', true)
		.single();

	if (linkError || !link) {
		// On error, still return a usable redirect URL (fallback)
		return json({ error: 'Affiliate link not found', redirect_url: null }, { status: 404 });
	}

	// Fetch pedal slug for utm_campaign
	const { data: pedal } = await supabase
		.from('pedals')
		.select('slug')
		.eq('id', pedal_id)
		.single();

	const pedalSlug = pedal?.slug ?? String(pedal_id);

	// Get user session (optional — prefer body user_id if provided)
	const {
		data: { user: sessionUser }
	} = await supabase.auth.getUser();

	const resolvedUserId = user_id ?? sessionUser?.id ?? null;
	const utmContent = resolvedUserId ?? 'anonymous';

	// Build UTM params per spec
	// utm_source='pedalnation', utm_medium={source}, utm_campaign={pedal_slug}, utm_content={user_id||'anonymous'}
	const utmParams = {
		utm_source: 'pedalnation',
		utm_medium: source ?? 'pedal-page',
		utm_campaign: pedalSlug,
		utm_content: utmContent
	};

	// Append UTMs to the URL
	let redirectUrl = link.url;
	try {
		const urlObj = new URL(link.url);
		Object.entries(utmParams).forEach(([key, value]) => {
			urlObj.searchParams.set(key, String(value));
		});
		redirectUrl = urlObj.toString();
	} catch {
		// If URL parsing fails, use original URL
	}

	// Try to hash IP address (SHA-256 for LGPD anonymization)
	let ipHash: string | null = null;
	try {
		const ip = getClientAddress();
		const encoder = new TextEncoder();
		const data = encoder.encode(ip);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		ipHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	} catch {
		// IP hashing is best-effort
	}

	const userAgent = request.headers.get('user-agent') ?? null;

	// Insert click record — fire and forget (does not block response)
	void supabase.from('link_clicks').insert({
		affiliate_link_id,
		pedal_id,
		user_id: resolvedUserId,
		source: source ?? 'pedal-page',
		utm_params: utmParams,
		ip_hash: ipHash,
		user_agent: userAgent
	});

	return json({ redirect_url: redirectUrl });
};

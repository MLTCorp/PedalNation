import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('[affiliate-click]', body);
    return json({ ok: true });
  } catch {
    return json({ ok: false }, { status: 400 });
  }
};

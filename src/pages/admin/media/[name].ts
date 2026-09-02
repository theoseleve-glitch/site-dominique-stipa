export const prerender = false;
import type { APIRoute } from 'astro';
import { currentEmail } from '../../../admin/http';
import { getFile } from '../../../admin/github';
import { PATHS } from '../../../admin/store';

const NAME_RE = /^[a-z0-9-]+\.(jpg|mp4)$/;
const TYPES: Record<string, string> = { jpg: 'image/jpeg', mp4: 'video/mp4' };

/** Serves a file from public/videos as stored on the branch (posters/videos not yet deployed). */
export const GET: APIRoute = async ({ params, cookies }) => {
  if (!currentEmail(cookies)) return new Response('Non autorisé', { status: 401 });
  const name = params.name ?? '';
  const m = NAME_RE.exec(name);
  if (!m) return new Response('Introuvable', { status: 404 });
  if (name === 'portrait.jpg') {
    const portrait = await getFile(PATHS.portrait);
    if (!portrait) return new Response('Introuvable', { status: 404 });
    return new Response(new Uint8Array(portrait), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=60' } });
  }
  const file = await getFile(`${PATHS.videos}/${name}`);
  if (!file) return new Response('Introuvable', { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: { 'content-type': TYPES[m[1]] ?? 'application/octet-stream', 'cache-control': 'private, max-age=60' },
  });
};

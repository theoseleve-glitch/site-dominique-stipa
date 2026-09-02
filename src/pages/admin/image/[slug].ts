export const prerender = false;
import type { APIRoute } from 'astro';
import { currentEmail } from '../../../admin/http';
import { SLUG_RE } from '../../../admin/content';
import { getFile } from '../../../admin/github';
import { PATHS, readSculpture } from '../../../admin/store';
import { sniffImage } from '../../../admin/uploads';

/** Thumbnail source for the admin lists: the sculpture photo as stored on the branch. */
export const GET: APIRoute = async ({ params, cookies }) => {
  if (!currentEmail(cookies)) return new Response('Non autorisé', { status: 401 });
  const slug = params.slug ?? '';
  if (!SLUG_RE.test(slug)) return new Response('Introuvable', { status: 404 });
  const sculpture = await readSculpture(slug).catch(() => null);
  if (!sculpture) return new Response('Introuvable', { status: 404 });
  const file = await getFile(`${PATHS.sculptures}/${sculpture.data.image.replace(/^\.\//, '')}`);
  if (!file) return new Response('Introuvable', { status: 404 });
  const kind = sniffImage(file) ?? 'jpeg';
  return new Response(new Uint8Array(file), {
    headers: { 'content-type': `image/${kind}`, 'cache-control': 'private, max-age=60' },
  });
};

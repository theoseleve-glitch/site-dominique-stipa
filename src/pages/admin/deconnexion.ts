export const prerender = false;
import type { APIRoute } from 'astro';
import { endSession, isSameOrigin } from '../../admin/http';

export const POST: APIRoute = ({ cookies, request, redirect }) => {
  if (!isSameOrigin(request)) return new Response('Requête refusée.', { status: 403 });
  endSession(cookies);
  return redirect('/admin/connexion', 303);
};

export const GET: APIRoute = ({ redirect }) => redirect('/admin', 303);

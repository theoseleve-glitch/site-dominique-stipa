// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://site-dominique-stipa.vercel.app',
  // The public site is fully static; only /admin/* opts into on-demand rendering
  // with `export const prerender = false`, served by Vercel functions.
  output: 'static',
  adapter: vercel(),
  redirects: {
    '/oeuvres': '/sculptures',
    '/oeuvres/[slug]': '/sculptures/[slug]',
  },
});

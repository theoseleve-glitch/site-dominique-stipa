// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dominique-stipa.vercel.app',
  output: 'static',
  redirects: {
    '/oeuvres': '/sculptures',
    '/oeuvres/[slug]': '/sculptures/[slug]',
  },
});

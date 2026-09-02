# Site Dominique Stipa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark, cinematic, French-language portfolio site for the sculptor Dominique Stipa, statically generated with Astro and deployed on Vercel.

**Architecture:** Astro 7 static site. Each sculpture is a Markdown file with a colocated photo in `src/content/oeuvres/`, validated by a content collection schema. Pure helper functions in `src/lib/oeuvres.ts` (sorting, featured selection, previous/next) are unit-tested with Vitest. Pages are `.astro` components; motion is CSS plus two tiny scripts (reveal, parallax) and Astro's `<ClientRouter />` for page transitions.

**Tech Stack:** Astro 7.2 (static output), TypeScript strict, Vitest, `astro:assets` `<Picture>`/`<Image>`, Fontsource (Cormorant Garamond + Inter Variable), Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-02-site-dominique-stipa-design.md`

## Global Constraints

- All user-facing text in French.
- Palette: bg `#0a0a0a`, surface `#141414`, text `#ece6dc`, muted `#8a857c`, accent `#c0392b` (small details only).
- Fonts: Cormorant Garamond (300, 400) for display; Inter for UI. Self-hosted via Fontsource, no runtime CDN.
- No UI framework, no animation library. Plain `.astro` + small `<script>` blocks.
- Every animation disabled under `prefers-reduced-motion: reduce`. Site readable with JS disabled.
- Largest served image under 300 KB. Lighthouse performance 90+, accessibility 90+.
- Node 25 / npm 11 on Windows; use forward slashes in paths, run commands from the project root `C:/Users/Admin/Documents/site papa`.
- Commit after every task with the trailer:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012aBg5nCbqzasVeW4AYoQ9L
  ```
  Use `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit ...` if no git identity is configured.

## File Structure

```
astro.config.mjs               Astro config (static, site URL)
package.json                   scripts: dev, build, preview, check, test
tsconfig.json                  extends astro/tsconfigs/strict
vitest.config.ts               getViteConfig from astro/config
src/content.config.ts          `oeuvres` collection: glob loader + zod schema with image()
src/content/oeuvres/<slug>.md  one work per file, photo colocated (<slug>.jpg)
src/data/site.ts               artist name, tagline, email, instagram URL, bio paragraphs, hero slug
src/lib/oeuvres.ts             pure helpers: sortByYearDesc, getFeatured, getNeighbours
src/lib/oeuvres.test.ts        Vitest unit tests for the helpers
src/styles/global.css          tokens, reset, typography, grain, reveal + parallax classes
src/scripts/reveal.ts          IntersectionObserver adds .is-visible
src/scripts/parallax.ts        scroll-driven translate for [data-parallax]
src/layouts/Base.astro         <head>, fonts, ClientRouter, Nav, Footer, grain, scripts
src/components/Nav.astro       top bar
src/components/Footer.astro    email + instagram + copyright
src/components/Hero.astro      full-viewport hero
src/components/FeaturedWork.astro   one home-page section (numeral, image, caption)
src/components/CatalogueEntry.astro one catalogue entry (numbered, alternating size)
src/components/WorkNav.astro   previous / next on a work page
src/pages/index.astro          Accueil
src/pages/oeuvres/index.astro  Œuvres
src/pages/oeuvres/[slug].astro Une œuvre
src/pages/a-propos.astro       À propos + contact block
src/pages/404.astro            Page introuvable
scripts/photos.json            harvested Instagram image URLs (slug, url, caption)
scripts/download-photos.mjs    downloads photos.json into src/content/oeuvres and writes .md stubs
```

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/pages/index.astro` (temporary), `public/favicon.svg`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `check`, `test` that later tasks run.

- [ ] **Step 1: Scaffold into a temp folder and move files up (create-astro requires an empty folder, ours has docs/ and .git)**

```bash
cd "C:/Users/Admin/Documents/site papa"
npm create astro@latest scaffold -- --template minimal --no-install --no-git --yes
cp -r scaffold/. . && rm -rf scaffold
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D @astrojs/check typescript vitest
npm install @fontsource/cormorant-garamond @fontsource-variable/inter
```

- [ ] **Step 3: Configure Astro, TypeScript, Vitest, scripts**

`astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dominique-stipa.vercel.app',
  output: 'static',
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

In `package.json` set `"scripts"` to:
```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",
  "test": "vitest run"
}
```

Ensure `.gitignore` contains `node_modules/`, `dist/`, `.astro/`, `.vercel/`, `.env`, `.env.*`.

- [ ] **Step 4: Verify the toolchain**

Run: `npm run check && npm run build`
Expected: check reports 0 errors; build writes `dist/index.html`.

Run: `npm test`
Expected: Vitest reports "No test files found" and exits 0 (or exits 1 with that message; either is acceptable at this stage).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with fonts, check and vitest"
```

---

### Task 2: Content collection, site data, and tested helpers

**Files:**
- Create: `src/content.config.ts`, `src/data/site.ts`, `src/lib/oeuvres.ts`, `src/lib/oeuvres.test.ts`
- Create: `src/content/oeuvres/exemple-un.md`, `src/content/oeuvres/exemple-deux.md` + two generated placeholder JPEGs (replaced in Task 3)

**Interfaces:**
- Produces:
  ```ts
  // src/content.config.ts  → collection "oeuvres", entry.data has:
  { title: string; year: number; material: string; dimensions?: string;
    featured: boolean; order: number; image: ImageMetadata; alt: string }
  // src/lib/oeuvres.ts
  export type OeuvreLike = { id: string; data: { year: number; featured: boolean; order: number } };
  export function sortByYearDesc<T extends OeuvreLike>(items: T[]): T[];
  export function getFeatured<T extends OeuvreLike>(items: T[], max?: number): T[]; // default max 6, sorted by order asc
  export function getNeighbours<T extends OeuvreLike>(sorted: T[], id: string): { prev: T | null; next: T | null };
  // src/data/site.ts
  export const site = { name, firstName, lastName, tagline, city, email, instagram, heroSlug, bio: string[], expositions: string[] };
  ```

- [ ] **Step 1: Write the failing helper tests**

`src/lib/oeuvres.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sortByYearDesc, getFeatured, getNeighbours } from './oeuvres';

const mk = (id: string, year: number, featured = false, order = 99) => ({
  id,
  data: { year, featured, order },
});

describe('sortByYearDesc', () => {
  it('orders newest first and keeps input order for equal years', () => {
    const items = [mk('a', 2020), mk('b', 2023), mk('c', 2023), mk('d', 2019)];
    expect(sortByYearDesc(items).map((i) => i.id)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('does not mutate the input', () => {
    const items = [mk('a', 2020), mk('b', 2023)];
    sortByYearDesc(items);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
  });
});

describe('getFeatured', () => {
  it('returns only featured items sorted by order', () => {
    const items = [mk('a', 2020, true, 3), mk('b', 2021, false, 1), mk('c', 2022, true, 1)];
    expect(getFeatured(items).map((i) => i.id)).toEqual(['c', 'a']);
  });
  it('caps at max (default 6)', () => {
    const items = Array.from({ length: 8 }, (_, i) => mk(`w${i}`, 2020, true, i));
    expect(getFeatured(items)).toHaveLength(6);
    expect(getFeatured(items, 2).map((i) => i.id)).toEqual(['w0', 'w1']);
  });
});

describe('getNeighbours', () => {
  const sorted = [mk('a', 2023), mk('b', 2022), mk('c', 2021)];
  it('returns prev and next around a middle item', () => {
    const { prev, next } = getNeighbours(sorted, 'b');
    expect(prev?.id).toBe('a');
    expect(next?.id).toBe('c');
  });
  it('returns null at the edges', () => {
    expect(getNeighbours(sorted, 'a').prev).toBeNull();
    expect(getNeighbours(sorted, 'c').next).toBeNull();
  });
  it('returns nulls for an unknown id', () => {
    expect(getNeighbours(sorted, 'zzz')).toEqual({ prev: null, next: null });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, "Failed to resolve import './oeuvres'" or similar.

- [ ] **Step 3: Implement the helpers**

`src/lib/oeuvres.ts`:
```ts
export type OeuvreLike = {
  id: string;
  data: { year: number; featured: boolean; order: number };
};

export function sortByYearDesc<T extends OeuvreLike>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.year - a.data.year);
}

export function getFeatured<T extends OeuvreLike>(items: T[], max = 6): T[] {
  return items
    .filter((i) => i.data.featured)
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, max);
}

export function getNeighbours<T extends OeuvreLike>(
  sorted: T[],
  id: string,
): { prev: T | null; next: T | null } {
  const index = sorted.findIndex((i) => i.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 7 tests pass.

- [ ] **Step 5: Define the collection schema and site data**

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const oeuvres = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/oeuvres' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      year: z.number().int().min(1950).max(2100),
      material: z.string().min(1),
      dimensions: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().int().default(99),
      image: image(),
      alt: z.string().min(1),
    }),
});

export const collections = { oeuvres };
```

`src/data/site.ts`:
```ts
export const site = {
  firstName: 'Dominique',
  lastName: 'Stipa',
  name: 'Dominique Stipa',
  tagline: 'Sculpteur',
  city: 'La Rochelle',
  email: 'contact@example.com', // TODO(famille): vraie adresse
  instagram: 'https://www.instagram.com/domistipa/',
  instagramHandle: '@domistipa',
  /** slug of the work shown in the home hero */
  heroSlug: 'exemple-un',
  bio: [
    // TODO(famille): remplacer par la vraie biographie
    'Dominique Stipa est un artiste sculpteur et plasticien installé à La Rochelle. Il travaille la pierre et le plâtre, et revient sans cesse à une figure : le clown.',
    'Ses formes, épurées jusqu’à l’essentiel, cherchent l’équilibre entre le rire et la gravité. Chaque pièce est taillée à la main, dans l’atelier ou en plein air, au fil des saisons.',
  ],
  expositions: [] as string[], // TODO(famille): liste des expositions, ex. '2024 — Galerie X, La Rochelle'
};
```

- [ ] **Step 6: Create two placeholder works so the collection is non-empty**

Generate two dark placeholder JPEGs with sharp (already installed by Astro):

```bash
node -e "
const sharp = require('sharp');
const mk = (f, c) => sharp({ create: { width: 1600, height: 2000, channels: 3, background: c } }).jpeg({ quality: 80 }).toFile(f);
Promise.all([
  mk('src/content/oeuvres/exemple-un.jpg', { r: 40, g: 38, b: 36 }),
  mk('src/content/oeuvres/exemple-deux.jpg', { r: 60, g: 56, b: 52 }),
]).then(() => console.log('ok'));
"
```

`src/content/oeuvres/exemple-un.md`:
```md
---
title: "Exemple un"
year: 2024
material: "Pierre calcaire"
dimensions: "45 × 30 × 25 cm"
featured: true
order: 1
image: "./exemple-un.jpg"
alt: "Sculpture en pierre claire sur fond sombre"
---
Texte d’exemple, remplacé plus tard.
```

`src/content/oeuvres/exemple-deux.md`:
```md
---
title: "Exemple deux"
year: 2023
material: "Plâtre"
featured: true
order: 2
image: "./exemple-deux.jpg"
alt: "Sculpture en plâtre sur fond sombre"
---
```

- [ ] **Step 7: Verify the schema rejects a bad entry, then remove the fixture**

Create `src/content/oeuvres/_bad.md` — note the underscore means the glob ignores it, so instead name it `bad.md`:
```md
---
title: "Cassé"
material: "Pierre"
image: "./exemple-un.jpg"
alt: "x"
---
```
Run: `npm run build`
Expected: FAIL with a schema error mentioning `year` is required for `bad`.
Then: `rm src/content/oeuvres/bad.md` and `npm run build` → PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: oeuvres content collection, site data, tested sorting helpers"
```

---

### Task 3: Harvest and download the Instagram photos

**Files:**
- Create: `scripts/photos.json`, `scripts/download-photos.mjs`
- Create: `src/content/oeuvres/<slug>.jpg` + `<slug>.md` for each harvested photo
- Delete: `src/content/oeuvres/exemple-*.{md,jpg}`
- Modify: `src/data/site.ts` (`heroSlug`)

**Interfaces:**
- Consumes: the schema from Task 2 (fields `title, year, material, dimensions?, featured, order, image, alt`).
- Produces: the real content set every page renders.

The user has explicitly approved downloading photos from the public `@domistipa` posts (conversation, 2026-09-02).

- [ ] **Step 1: Harvest image URLs with the Chrome tools**

Using `mcp__claude-in-chrome__*`: navigate to `https://www.instagram.com/domistipa/`, scroll until all 26 posts have loaded, then use `read_page` / `find` to collect every `a[href^="/p/"]` and `a[href^="/domistipa/p/"]` href. For each post URL, navigate to it and read the main `<img>` `src` inside `article` (the largest `srcset` candidate) plus the caption text. Skip posts that are videos/reels (`/reel/`) and photos where the sculpture is not the subject (e.g. exhibition crowd shots), but keep one photo of the artist at work for the about page and save it as `src/assets/atelier.jpg` instead of a work.

Write the result to `scripts/photos.json`:
```json
[
  { "slug": "clown-blanc", "url": "https://scontent...jpg", "caption": "Instagram caption verbatim", "year": 2024 },
  { "slug": "atelier", "url": "https://scontent...jpg", "caption": "", "year": 2024, "portrait": true }
]
```
Slugs: lowercase ASCII, hyphens, derived from the caption when it names the piece, otherwise `oeuvre-01`, `oeuvre-02`... in post order (newest = 01). `year` is the post year, read from the post date.

- [ ] **Step 2: Write the download script**

`scripts/download-photos.mjs`:
```js
import { readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

await mkdir('src/assets', { recursive: true });

const list = JSON.parse(await readFile('scripts/photos.json', 'utf8'));
const dir = 'src/content/oeuvres';

const exists = async (p) => access(p, constants.F_OK).then(() => true, () => false);

for (const [i, item] of list.entries()) {
  const target = item.portrait ? 'src/assets/atelier.jpg' : path.join(dir, `${item.slug}.jpg`);
  if (!(await exists(target))) {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`${item.slug}: HTTP ${res.status}`);
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log('saved', target);
  }
  if (item.portrait) continue;

  const md = path.join(dir, `${item.slug}.md`);
  if (await exists(md)) continue;
  const caption = (item.caption ?? '').trim().replace(/#\w+/g, '').trim();
  await writeFile(
    md,
    `---
# TODO(famille): vérifier titre, année, matière, dimensions
title: "Sans titre"
year: ${item.year}
material: "Pierre"
featured: ${i < 5}
order: ${i + 1}
image: "./${item.slug}.jpg"
alt: "Sculpture de Dominique Stipa"
---
${caption}
`,
  );
  console.log('wrote', md);
}
```

- [ ] **Step 3: Run it and remove the placeholders**

```bash
node scripts/download-photos.mjs
rm src/content/oeuvres/exemple-un.md src/content/oeuvres/exemple-un.jpg src/content/oeuvres/exemple-deux.md src/content/oeuvres/exemple-deux.jpg
```
Then set `heroSlug` in `src/data/site.ts` to the most striking work's slug (a single white sculpture on a plain background if one exists).

- [ ] **Step 4: Verify**

Run: `ls src/content/oeuvres | wc -l` → an even number ≥ 20 (md + jpg pairs).
Run: `npm run build` → PASS, no schema errors.
Open two downloaded JPEGs with the Read tool to confirm they are sculpture photos, not error pages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "content: import sculpture photos from Instagram with stub metadata"
```

---

### Task 4: Global styles, base layout, navigation, footer, motion scripts

**Files:**
- Create: `src/styles/global.css`, `src/scripts/reveal.ts`, `src/scripts/parallax.ts`, `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro` (use the layout with a heading, real content in Task 5)

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description?: string; }` and a default slot. CSS classes: `.reveal` (+ `.is-visible` added by script), `[data-parallax="0.15"]` (speed factor), `.container`, `.label` (small caps), `.display` (serif). CSS custom properties `--bg --surface --text --muted --accent --font-display --font-sans`.

- [ ] **Step 1: Global stylesheet**

`src/styles/global.css`:
```css
@import '@fontsource/cormorant-garamond/300.css';
@import '@fontsource/cormorant-garamond/400.css';
@import '@fontsource/cormorant-garamond/300-italic.css';
@import '@fontsource-variable/inter';

:root {
  --bg: #0a0a0a;
  --surface: #141414;
  --text: #ece6dc;
  --muted: #8a857c;
  --accent: #c0392b;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --max: 1400px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}
img, picture { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
a:focus-visible { outline: 1px solid var(--accent); outline-offset: 4px; }

.container { width: min(100% - 3rem, var(--max)); margin-inline: auto; }
.display { font-family: var(--font-display); font-weight: 300; line-height: 1.05; letter-spacing: -0.01em; }
.label {
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
.numeral { font-family: var(--font-display); color: var(--accent); font-size: 1.1rem; letter-spacing: 0.1em; }
.link-underline { position: relative; }
.link-underline::after {
  content: ''; position: absolute; left: 0; bottom: -0.25em; height: 1px; width: 100%;
  background: var(--accent); transform: scaleX(0); transform-origin: left;
  transition: transform 0.5s var(--ease);
}
.link-underline:hover::after { transform: scaleX(1); }

/* film grain */
.grain {
  pointer-events: none; position: fixed; inset: 0; z-index: 50; opacity: 0.06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

/* reveal on scroll */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 1.1s var(--ease), transform 1.1s var(--ease); }
.reveal.is-visible { opacity: 1; transform: none; }
[data-parallax] { will-change: transform; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  [data-parallax] { transform: none !important; }
}
/* no-JS: content simply visible */
html.no-js .reveal { opacity: 1; transform: none; }
```

- [ ] **Step 2: Motion scripts**

`src/scripts/reveal.ts`:
```ts
export function initReveal(root: ParentNode = document): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
  if (els.length === 0) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
  );
  els.forEach((el) => io.observe(el));
}
```

`src/scripts/parallax.ts`:
```ts
let frame = 0;
let items: { el: HTMLElement; speed: number }[] = [];

function update(): void {
  frame = 0;
  const vh = window.innerHeight;
  for (const { el, speed } of items) {
    const rect = el.getBoundingClientRect();
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh; // -1 .. 1 around center
    const offset = Math.max(-1, Math.min(1, progress)) * speed * -100;
    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  }
}

function onScroll(): void {
  if (!frame) frame = requestAnimationFrame(update);
}

export function initParallax(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  items = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]')).map((el) => ({
    el,
    speed: Number(el.dataset.parallax) || 0.15,
  }));
  window.removeEventListener('scroll', onScroll);
  if (items.length === 0) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
```

- [ ] **Step 3: Nav and Footer**

`src/components/Nav.astro`:
```astro
---
import { site } from '../data/site';
const path = Astro.url.pathname;
const links = [
  { href: '/oeuvres', label: 'Œuvres' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/a-propos#contact', label: 'Contact' },
];
---
<header class="nav" transition:persist>
  <div class="container nav__inner">
    <a href="/" class="nav__brand display">{site.name}</a>
    <nav aria-label="Navigation principale">
      {links.map((l) => (
        <a href={l.href} class:list={['label', 'link-underline', { 'is-active': path.startsWith(l.href.split('#')[0]) && !l.href.includes('#') }]}>{l.label}</a>
      ))}
    </nav>
  </div>
</header>
<style>
  .nav { position: fixed; inset: 0 0 auto 0; z-index: 40; padding-block: 1.25rem;
         background: linear-gradient(to bottom, rgba(10,10,10,0.85), rgba(10,10,10,0)); }
  .nav__inner { display: flex; align-items: baseline; justify-content: space-between; gap: 2rem; }
  .nav__brand { font-size: 1.35rem; letter-spacing: 0.04em; }
  nav { display: flex; gap: 2rem; }
  nav a { color: var(--text); padding-block: 0.25rem; }
  nav a.is-active::after { transform: scaleX(1); }
  @media (max-width: 600px) { nav { gap: 1.25rem; } .nav__brand { font-size: 1.1rem; } }
</style>
```

`src/components/Footer.astro`:
```astro
---
import { site } from '../data/site';
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="container footer__inner">
    <p class="label">{site.name} — {site.tagline}, {site.city}</p>
    <nav aria-label="Contact" class="footer__links">
      <a class="link-underline" href={`mailto:${site.email}`}>{site.email}</a>
      <a class="link-underline" href={site.instagram} rel="noopener" target="_blank">Instagram {site.instagramHandle}</a>
    </nav>
    <p class="label">© {year} {site.name}</p>
  </div>
</footer>
<style>
  .footer { padding-block: 4rem 3rem; border-top: 1px solid rgba(236,230,220,0.08); margin-top: 6rem; }
  .footer__inner { display: grid; gap: 1.5rem; }
  .footer__links { display: flex; flex-wrap: wrap; gap: 2rem; font-size: 0.95rem; }
  @media (min-width: 800px) {
    .footer__inner { grid-template-columns: 1fr auto 1fr; align-items: center; }
    .footer__inner > :last-child { text-align: right; }
  }
</style>
```

- [ ] **Step 4: Base layout**

`src/layouts/Base.astro`:
```astro
---
import { ClientRouter } from 'astro:transitions';
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import { site } from '../data/site';

interface Props { title: string; description?: string; }
const { title, description = `${site.name}, sculpteur à ${site.city}. Pierre, plâtre, clowns.` } = Astro.props;
const fullTitle = title === site.name ? title : `${title} — ${site.name}`;
---
<!doctype html>
<html lang="fr" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script is:inline>document.documentElement.classList.remove('no-js');</script>
    <ClientRouter />
  </head>
  <body>
    <Nav />
    <main id="contenu">
      <slot />
    </main>
    <Footer />
    <div class="grain" aria-hidden="true"></div>
    <script>
      import { initReveal } from '../scripts/reveal';
      import { initParallax } from '../scripts/parallax';
      document.addEventListener('astro:page-load', () => {
        initReveal();
        initParallax();
      });
    </script>
  </body>
</html>
```

- [ ] **Step 5: Wire the temporary home page and verify**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../data/site';
---
<Base title={site.name}>
  <section class="container" style="padding-top: 40vh">
    <h1 class="display reveal">{site.name}</h1>
  </section>
</Base>
```

Run: `npm run check && npm run build` → PASS.
Run: `npm run dev` in background, open `http://localhost:4321` in Chrome, take a screenshot. Expected: dark page, serif name fading in, nav top, footer with email + Instagram links, faint grain. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: base layout with dark theme, nav, footer, grain, reveal and parallax scripts"
```

---

### Task 5: Home page — hero, featured walk, teaser

**Files:**
- Create: `src/components/Hero.astro`, `src/components/FeaturedWork.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getCollection('oeuvres')`, `getFeatured`, `site.heroSlug`, classes from Task 4.
- Produces: `Hero.astro` props `{ work: CollectionEntry<'oeuvres'> }`; `FeaturedWork.astro` props `{ work: CollectionEntry<'oeuvres'>; index: number }`.

- [ ] **Step 1: Hero**

`src/components/Hero.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { site } from '../data/site';
interface Props { work: CollectionEntry<'oeuvres'>; }
const { work } = Astro.props;
---
<section class="hero">
  <Picture
    src={work.data.image}
    alt={work.data.alt}
    formats={['avif', 'webp']}
    widths={[640, 1080, 1600]}
    sizes="100vw"
    loading="eager"
    fetchpriority="high"
    class="hero__img"
  />
  <div class="hero__veil" aria-hidden="true"></div>
  <div class="container hero__text">
    <p class="label hero__kicker">{site.tagline} — {site.city}</p>
    <h1 class="display hero__title">
      <span>{site.firstName}</span>
      <span>{site.lastName}</span>
    </h1>
  </div>
  <a href="#parcours" class="label hero__cue">Découvrir</a>
</section>
<style>
  .hero { position: relative; height: 100svh; min-height: 560px; overflow: hidden; display: grid; align-items: end; }
  .hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;
               animation: hero-in 2.4s var(--ease) both; }
  .hero__veil { position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.35) 45%, rgba(10,10,10,0.15) 100%); }
  .hero__text { position: relative; padding-bottom: 14vh; }
  .hero__kicker { animation: rise 1.4s 0.6s var(--ease) both; }
  .hero__title { font-size: clamp(3.2rem, 11vw, 9.5rem); margin: 0.5rem 0 0; display: flex; flex-wrap: wrap; column-gap: 0.25em; }
  .hero__title span { animation: rise 1.6s var(--ease) both; }
  .hero__title span:nth-child(2) { animation-delay: 0.25s; font-style: italic; }
  .hero__cue { position: absolute; left: 50%; bottom: 2rem; transform: translateX(-50%); color: var(--text);
               animation: rise 1.4s 1.4s var(--ease) both; }
  @keyframes hero-in { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: none; } }
  @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .hero__img, .hero__kicker, .hero__title span, .hero__cue { animation: none; } }
</style>
```

- [ ] **Step 2: Featured section**

`src/components/FeaturedWork.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
interface Props { work: CollectionEntry<'oeuvres'>; index: number; }
const { work, index } = Astro.props;
const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const flip = index % 2 === 1;
---
<article class:list={['feat', { 'feat--flip': flip }]}>
  <a href={`/oeuvres/${work.id}`} class="feat__media reveal" data-parallax="0.12">
    <Picture
      src={work.data.image}
      alt={work.data.alt}
      formats={['avif', 'webp']}
      widths={[480, 900, 1400]}
      sizes="(max-width: 800px) 100vw, 60vw"
      transition:name={`oeuvre-${work.id}`}
    />
  </a>
  <div class="feat__text reveal" data-parallax="0.04">
    <p class="numeral">{numerals[index] ?? index + 1}</p>
    <h2 class="display feat__title"><a href={`/oeuvres/${work.id}`}>{work.data.title}</a></h2>
    <p class="label">{work.data.year} — {work.data.material}</p>
  </div>
</article>
<style>
  .feat { display: grid; gap: 2rem; align-items: center; min-height: 90vh; padding-block: 8vh;
          width: min(100% - 3rem, var(--max)); margin-inline: auto; }
  .feat__media img { width: 100%; height: auto; }
  .feat__title { font-size: clamp(2.2rem, 5vw, 4.5rem); margin: 0.5rem 0 1rem; }
  @media (min-width: 800px) {
    .feat { grid-template-columns: 7fr 4fr; gap: 6vw; }
    .feat--flip .feat__media { order: 2; }
    .feat--flip .feat__text { text-align: right; }
  }
</style>
```

- [ ] **Step 3: Home page**

`src/pages/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import FeaturedWork from '../components/FeaturedWork.astro';
import { getFeatured } from '../lib/oeuvres';
import { site } from '../data/site';

const all = await getCollection('oeuvres');
const hero = all.find((w) => w.id === site.heroSlug) ?? all[0];
if (!hero) throw new Error('Aucune œuvre : ajoutez un fichier dans src/content/oeuvres/');
const featured = getFeatured(all).filter((w) => w.id !== hero.id);
---
<Base title={site.name}>
  <Hero work={hero} />
  <section id="parcours" aria-label="Parcours">
    {featured.map((work, i) => <FeaturedWork work={work} index={i} />)}
  </section>
  <section class="container teaser reveal">
    <p class="label">L’artiste</p>
    <p class="display teaser__text">{site.bio[0]}</p>
    <a href="/a-propos" class="label link-underline">Lire la suite</a>
  </section>
  <section class="container all reveal">
    <a href="/oeuvres" class="display link-underline all__link">Voir toutes les œuvres</a>
  </section>
</Base>
<style>
  .teaser { padding-block: 12vh; max-width: 60ch; }
  .teaser__text { font-size: clamp(1.6rem, 3vw, 2.6rem); margin: 1rem 0 2rem; }
  .all { padding-block: 6vh 10vh; }
  .all__link { font-size: clamp(1.8rem, 4vw, 3.2rem); color: var(--text); }
</style>
```

- [ ] **Step 4: Verify**

Run: `npm run check && npm run build` → PASS.
Start `npm run dev`, screenshot `http://localhost:4321` at 1280 wide and at 390 wide (use `mcp__claude-in-chrome__resize_window`). Expected: hero fills the viewport with the name in serif; scrolling shows one work per section alternating sides with parallax; teaser and "Voir toutes les œuvres" at the bottom; on mobile everything stacks in one column.
Check the built image sizes: `ls -la dist/_astro/*.avif dist/_astro/*.webp | sort -k5 -n | tail -3` → largest under 300 KB (300000 bytes). If over, lower `widths` maxima to 1400.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: home page with cinematic hero, featured walk, and teaser"
```

---

### Task 6: Catalogue page (Œuvres)

**Files:**
- Create: `src/components/CatalogueEntry.astro`, `src/pages/oeuvres/index.astro`

**Interfaces:**
- Consumes: `sortByYearDesc`, classes from Task 4.
- Produces: `CatalogueEntry.astro` props `{ work: CollectionEntry<'oeuvres'>; index: number }`. Uses `transition:name={`oeuvre-${work.id}`}` on the image so Task 7 can morph it.

- [ ] **Step 1: Catalogue entry**

`src/components/CatalogueEntry.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
interface Props { work: CollectionEntry<'oeuvres'>; index: number; }
const { work, index } = Astro.props;
// editorial rhythm: large, medium-right, medium-left, large...
const variant = (['large', 'right', 'left'] as const)[index % 3];
const number = String(index + 1).padStart(2, '0');
---
<article class:list={['entry', `entry--${variant}`, 'reveal']}>
  <a href={`/oeuvres/${work.id}`} class="entry__link">
    <Picture
      src={work.data.image}
      alt={work.data.alt}
      formats={['avif', 'webp']}
      widths={[480, 900, 1400]}
      sizes={variant === 'large' ? '(max-width: 800px) 100vw, 70vw' : '(max-width: 800px) 100vw, 45vw'}
      transition:name={`oeuvre-${work.id}`}
    />
    <div class="entry__caption">
      <span class="numeral">{number}</span>
      <h2 class="display entry__title">{work.data.title}</h2>
      <p class="label">{work.data.year} — {work.data.material}</p>
    </div>
  </a>
</article>
<style>
  .entry { margin-block: 10vh; }
  .entry__link { display: block; }
  .entry img { width: 100%; height: auto; transition: opacity 0.6s var(--ease); }
  .entry__link:hover img { opacity: 0.85; }
  .entry__caption { margin-top: 1.25rem; display: grid; gap: 0.25rem; }
  .entry__title { font-size: clamp(1.6rem, 2.6vw, 2.4rem); margin: 0; }
  @media (min-width: 800px) {
    .entry--large { width: 70%; }
    .entry--right { width: 45%; margin-left: auto; }
    .entry--left { width: 45%; }
    .entry--right .entry__caption { text-align: right; }
  }
</style>
```

- [ ] **Step 2: Catalogue page**

`src/pages/oeuvres/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import CatalogueEntry from '../../components/CatalogueEntry.astro';
import { sortByYearDesc } from '../../lib/oeuvres';

const works = sortByYearDesc(await getCollection('oeuvres'));
---
<Base title="Œuvres">
  <section class="container catalogue">
    <header class="catalogue__head reveal">
      <p class="label">Catalogue</p>
      <h1 class="display catalogue__title">Œuvres</h1>
      <p class="label">{works.length} pièces</p>
    </header>
    {works.map((work, i) => <CatalogueEntry work={work} index={i} />)}
  </section>
</Base>
<style>
  .catalogue { padding-top: 22vh; }
  .catalogue__head { display: grid; gap: 0.5rem; margin-bottom: 4vh; }
  .catalogue__title { font-size: clamp(3rem, 8vw, 7rem); margin: 0; }
</style>
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build` → PASS.
Dev server: `http://localhost:4321/oeuvres` at 1280 and 390 wide. Expected: heading, then entries alternating large / right / left with numbers 01, 02...; on mobile full width. Clicking an entry navigates (Task 7 makes the target page).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: editorial catalogue page"
```

---

### Task 7: Work page with shared-element transition and previous/next

**Files:**
- Create: `src/components/WorkNav.astro`, `src/pages/oeuvres/[slug].astro`

**Interfaces:**
- Consumes: `sortByYearDesc`, `getNeighbours`, `render` from `astro:content`, `transition:name` convention `oeuvre-<id>`.
- Produces: `WorkNav.astro` props `{ prev: CollectionEntry<'oeuvres'> | null; next: CollectionEntry<'oeuvres'> | null }`.

- [ ] **Step 1: Previous / next**

`src/components/WorkNav.astro`:
```astro
---
import type { CollectionEntry } from 'astro:content';
interface Props { prev: CollectionEntry<'oeuvres'> | null; next: CollectionEntry<'oeuvres'> | null; }
const { prev, next } = Astro.props;
---
<nav class="worknav container" aria-label="Œuvre précédente ou suivante">
  {prev ? (
    <a href={`/oeuvres/${prev.id}`} class="worknav__item">
      <span class="label">← Précédente</span>
      <span class="display worknav__title">{prev.data.title}</span>
    </a>
  ) : <span />}
  <a href="/oeuvres" class="label link-underline worknav__all">Toutes les œuvres</a>
  {next ? (
    <a href={`/oeuvres/${next.id}`} class="worknav__item worknav__item--next">
      <span class="label">Suivante →</span>
      <span class="display worknav__title">{next.data.title}</span>
    </a>
  ) : <span />}
</nav>
<style>
  .worknav { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem;
             padding-block: 6vh; border-top: 1px solid rgba(236,230,220,0.08); margin-top: 8vh; }
  .worknav__item { display: grid; gap: 0.25rem; color: var(--text); }
  .worknav__item--next { text-align: right; }
  .worknav__title { font-size: clamp(1.2rem, 2vw, 1.8rem); }
  .worknav__all { color: var(--text); }
  @media (max-width: 600px) { .worknav__title { display: none; } }
</style>
```

- [ ] **Step 2: Work page**

`src/pages/oeuvres/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import { Picture } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import WorkNav from '../../components/WorkNav.astro';
import { sortByYearDesc, getNeighbours } from '../../lib/oeuvres';

export async function getStaticPaths() {
  const works = await getCollection('oeuvres');
  return works.map((work) => ({ params: { slug: work.id }, props: { work } }));
}

const { work } = Astro.props;
const sorted = sortByYearDesc(await getCollection('oeuvres'));
const { prev, next } = getNeighbours(sorted, work.id);
const { Content } = await render(work);
const hasBody = Boolean(work.body && work.body.trim().length > 0);
---
<Base title={work.data.title} description={`${work.data.title}, ${work.data.year}, ${work.data.material}.`}>
  <article class="work">
    <figure class="work__figure">
      <Picture
        src={work.data.image}
        alt={work.data.alt}
        formats={['avif', 'webp']}
        widths={[640, 1080, 1600]}
        sizes="(max-width: 800px) 100vw, 80vw"
        loading="eager"
        fetchpriority="high"
        transition:name={`oeuvre-${work.id}`}
      />
    </figure>
    <div class="container work__meta">
      <h1 class="display work__title reveal">{work.data.title}</h1>
      <dl class="work__facts reveal">
        <div><dt class="label">Année</dt><dd>{work.data.year}</dd></div>
        <div><dt class="label">Matière</dt><dd>{work.data.material}</dd></div>
        {work.data.dimensions && <div><dt class="label">Dimensions</dt><dd>{work.data.dimensions}</dd></div>}
      </dl>
      {hasBody && <div class="work__text reveal"><Content /></div>}
    </div>
  </article>
  <WorkNav prev={prev} next={next} />
</Base>
<style>
  .work__figure { margin: 0; height: 100svh; min-height: 520px; display: grid; place-items: center;
                  padding: 12vh 1.5rem 4vh; background: var(--bg); }
  .work__figure img { max-height: 100%; width: auto; max-width: 100%; height: auto; object-fit: contain; }
  .work__meta { padding-block: 6vh; display: grid; gap: 2rem; max-width: 70ch; }
  .work__title { font-size: clamp(2.4rem, 6vw, 5.5rem); margin: 0; }
  .work__facts { display: flex; flex-wrap: wrap; gap: 2.5rem; margin: 0; }
  .work__facts dd { margin: 0.25rem 0 0; font-family: var(--font-display); font-size: 1.4rem; }
  .work__text { font-size: 1.1rem; color: var(--text); max-width: 60ch; }
  .work__text :global(p) { margin: 0 0 1em; }
</style>
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build` → PASS; `ls dist/oeuvres` lists one folder per work.
Dev server: from `/oeuvres` click the first entry. Expected: the image morphs from its catalogue position to the full-screen figure (View Transitions, Chrome), title and facts fade in, previous/next at the bottom; first work has no "Précédente", last has no "Suivante". Test `/oeuvres/inexistant` → Astro 404.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: work detail page with shared-element transition and prev/next"
```

---

### Task 8: About page, contact block, 404

**Files:**
- Create: `src/pages/a-propos.astro`, `src/pages/404.astro`
- Uses: `src/assets/atelier.jpg` from Task 3 (if none was harvested, copy the hero work photo there).

- [ ] **Step 1: About page**

`src/pages/a-propos.astro`:
```astro
---
import { Image } from 'astro:assets';
import Base from '../layouts/Base.astro';
import { site } from '../data/site';
import atelier from '../assets/atelier.jpg';
---
<Base title="À propos">
  <section class="container about">
    <div class="about__media reveal" data-parallax="0.08">
      <Image src={atelier} alt={`${site.name} dans son atelier`} widths={[480, 900, 1400]} sizes="(max-width: 800px) 100vw, 45vw" />
    </div>
    <div class="about__text">
      <p class="label reveal">L’artiste</p>
      <h1 class="display about__title reveal">{site.name}</h1>
      {site.bio.map((p) => <p class="about__p reveal">{p}</p>)}
      {site.expositions.length > 0 && (
        <section class="reveal">
          <h2 class="label">Expositions</h2>
          <ul class="about__expos">{site.expositions.map((e) => <li>{e}</li>)}</ul>
        </section>
      )}
      <section id="contact" class="contact reveal">
        <h2 class="label">Contact</h2>
        <p class="display contact__line"><a class="link-underline" href={`mailto:${site.email}`}>{site.email}</a></p>
        <p class="display contact__line"><a class="link-underline" href={site.instagram} target="_blank" rel="noopener">Instagram {site.instagramHandle}</a></p>
        <p class="label">{site.city}</p>
      </section>
    </div>
  </section>
</Base>
<style>
  .about { padding-top: 22vh; display: grid; gap: 3rem; }
  .about__media img { width: 100%; height: auto; }
  .about__title { font-size: clamp(2.6rem, 6vw, 5.5rem); margin: 0.5rem 0 2rem; }
  .about__p { font-size: 1.15rem; line-height: 1.75; max-width: 58ch; color: var(--text); }
  .about__expos { list-style: none; padding: 0; margin: 0.5rem 0 0; display: grid; gap: 0.4rem; }
  .contact { margin-top: 4rem; scroll-margin-top: 20vh; display: grid; gap: 0.5rem; }
  .contact__line { font-size: clamp(1.4rem, 3vw, 2.4rem); margin: 0; }
  @media (min-width: 800px) {
    .about { grid-template-columns: 5fr 6fr; gap: 6vw; align-items: start; }
    .about__media { position: sticky; top: 12vh; }
  }
</style>
```


- [ ] **Step 2: 404 page**

`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Page introuvable">
  <section class="container nf">
    <p class="label">Erreur 404</p>
    <h1 class="display nf__title">Cette page n’existe pas.</h1>
    <a href="/" class="label link-underline">Retour à l’accueil</a>
  </section>
</Base>
<style>
  .nf { min-height: 70vh; display: grid; align-content: center; gap: 1rem; padding-top: 20vh; }
  .nf__title { font-size: clamp(2.4rem, 6vw, 5rem); margin: 0; }
</style>
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build` → PASS.
Dev server: `/a-propos` at 1280 and 390 wide, click the nav "Contact" link from the home page → lands on `/a-propos#contact` with the contact block in view. `/nimportequoi` → 404 page styled.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: about page with contact block, styled 404"
```

---

### Task 9: Quality pass and Vercel deployment

**Files:**
- Modify as needed by findings. Possibly create `vercel.json` (only if auto-detection fails).

- [ ] **Step 1: Reduced motion and no-JS**

In Chrome DevTools (or `mcp__claude-in-chrome__javascript_tool` cannot toggle emulation; use the rendering panel manually if needed), verify: with `prefers-reduced-motion: reduce` emulated the hero has no animation and `.reveal` elements are visible immediately. With JavaScript disabled (`chrome://settings/content/javascript` off for localhost), all content is visible and links work.

- [ ] **Step 2: Lighthouse**

```bash
npm run build && npx serve dist -l 4173
```
Then `npx lighthouse http://localhost:4173 --preset=desktop --only-categories=performance,accessibility --output=json --output-path=./lighthouse.json --chrome-flags="--headless"` and read `categories.performance.score` and `categories.accessibility.score` (≥ 0.9 each). Repeat for `/oeuvres` and one work page. Fix any flagged image size, contrast (muted `#8a857c` on `#0a0a0a` is 5.1:1, fine), or missing labels. Delete `lighthouse.json` after (do not commit it).

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: quality pass (lighthouse, reduced motion)"
```

- [ ] **Step 4: Deploy to Vercel**

Install the CLI if missing: `npm i -g vercel`. Then from the project root:
```bash
vercel login          # user runs this themselves: suggest `! vercel login`
vercel --yes          # preview deployment, framework auto-detected as Astro
vercel --prod --yes   # production
```
Expected: a `https://*.vercel.app` URL serving the home page. Open it in Chrome and screenshot. Save the production URL in `docs/superpowers/specs/2026-09-02-site-dominique-stipa-design.md` under a new "Deployment" line and commit.

- [ ] **Step 5: Hand-off note for the family**

Append to the spec a short "Comment ajouter une œuvre" section (in French) describing: copy the photo into `src/content/oeuvres/`, create `<slug>.md` with the frontmatter fields, run `npm run build`, push. Commit.

```bash
git add -A
git commit -m "docs: deployment URL and how to add a work"
```

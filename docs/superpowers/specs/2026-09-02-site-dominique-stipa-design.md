# Site Dominique Stipa — Design Spec

Date: 2026-09-02
Status: approved in conversation, pending written review

## 1. Goal

A portfolio website for the sculptor Dominique Stipa (La Rochelle, stone and plaster,
clowns as recurring theme). It must feel like a high-end gallery experience: the
visitor walks through the work rather than browsing thumbnails. Reference point: what
an artist selling pieces for millions would want as their site.

The site does not sell anything. It shows the work, tells who the artist is, and makes
him reachable.

## 2. Audience and success criteria

- Audience: galleries, curators, collectors, press, and curious visitors. French-speaking.
- Success: a visitor lands, is impressed within five seconds by one sculpture on a dark
  stage, can see every piece large and unhurried, and can email or reach Instagram in one
  click from any page.
- Loads fast on a phone (largest image under 300 KB, Lighthouse performance 90+).

## 3. Pages and experience

All text in French. Four routes plus one dynamic route.

### `/` Accueil
- Full-viewport hero: one sculpture emerging from darkness, artist name in large thin
  serif, slow fade-in on load. A small "Découvrir" cue at the bottom.
- Below: a curated sequence of 4 to 6 featured works, one per screen section. Each
  section is one large photo with a short caption (title, year, material) and a numeral
  (I, II, III). Text and image drift at slightly different speeds on scroll (light
  parallax). Elements reveal as they enter the viewport.
- Short "L'artiste" teaser: one sentence and a link to `/a-propos`.
- Footer: email link, Instagram link, copyright.

### `/oeuvres` Œuvres
- Editorial catalogue, not a uniform grid: alternating large and medium images with
  generous dark space, numbered like a catalogue raisonné. Each entry shows title, year,
  material. Click goes to the work's page.
- Ordered newest first by default.

### `/oeuvres/[slug]` Une œuvre
- Full-screen photo of the piece, title, year, material, dimensions, optional one-paragraph
  text. Previous / next navigation at the bottom. Back link to the catalogue.
- Astro View Transitions animate the image from the catalogue into place (shared element).

### `/a-propos` À propos
- Portrait of the artist at work, a biography of a few paragraphs (placeholder text to be
  replaced by the family), a short list of exhibitions if provided, and the contact block
  (email + Instagram).

### Contact
No dedicated page. Email link and Instagram link appear in the footer of every page and in
the about page contact block.

## 4. Content model

One Markdown file per work in `src/content/oeuvres/<slug>.md`, validated by an Astro
content collection schema:

```yaml
---
title: "Le Clown blanc"
year: 2023
material: "Pierre calcaire"
dimensions: "45 × 30 × 25 cm"   # optional
featured: true                    # appears on the home page
order: 1                          # home page order among featured
image: "./le-clown-blanc.jpg"     # colocated in the same folder
---
Optional paragraph shown on the work's page.
```

Photos live next to their Markdown file so adding a piece is: drop the photo, write the
file. Site-wide text (bio, email, Instagram URL, hero work slug) lives in `src/data/site.ts`.

## 5. Visual design

- Palette: background `#0a0a0a`, surface `#141414`, text warm off-white `#ece6dc`,
  muted text `#8a857c`, one accent muted vermilion `#c0392b` used only for small details
  (numerals, hover underline). Never large blocks of red.
- Typography: display serif for names and titles (Cormorant Garamond via Fontsource,
  self-hosted, weights 300 and 400), a neutral sans (Inter) for captions and navigation.
  Large type sizes, wide letter-spacing on small caps labels.
- Imagery: photos are the only color on the page. A very light film grain overlay
  (CSS, no image) gives the dark a cinematic texture.
- Layout: max width about 1400 px, lots of vertical breathing room (sections 100vh or
  near), asymmetric placement in the catalogue.
- Navigation: minimal top bar, artist name left, three links right (Œuvres, À propos,
  Contact anchor). Becomes a translucent bar on scroll.

## 6. Motion

- Page transitions: Astro `<ClientRouter />` (View Transitions) with a fade and the
  shared-image morph on catalogue → work.
- Reveals: IntersectionObserver adds a class; CSS handles the fade/rise. No animation
  library.
- Parallax on the home sections: small translate driven by scroll position, capped, and
  disabled under `prefers-reduced-motion`.
- Everything must remain usable with JavaScript disabled (content simply appears).

## 7. Tech stack

- Astro 5, static output, TypeScript.
- Astro `<Image>` and `<Picture>` for optimization (WebP/AVIF, responsive sizes, lazy).
- Fontsource packages for fonts. No external CDN at runtime.
- No UI framework, no client-side framework. Plain `.astro` components and a few small
  `<script>` blocks.
- Hosting: Vercel, static preset, free tier. Deployment from the git repo.

## 8. Photo sourcing (first version)

Photos come from the public Instagram account `@domistipa`. Process:
1. Open each post in the user's Chrome, read the full-size image URL.
2. Download with the user's explicit permission into `src/content/oeuvres/`.
3. Skip videos, reels, and photos where the sculpture is not the subject.
4. Titles, years, materials are unknown from Instagram: files are created with
   `title: "Sans titre"` and a `TODO` comment for the family to fill in. Captions from
   Instagram are copied into the optional body when they describe the piece.

Later, the family replaces these with high-resolution originals by overwriting the files.

## 9. Testing and verification

- `astro check` and `astro build` pass with no errors.
- Content schema rejects a work with a missing image or year (verified with a bad fixture
  during development, then removed).
- Manual check in a browser: home hero, scroll reveals, catalogue → work transition,
  previous/next, about page, footer links, on desktop and a 390 px mobile viewport.
- Lighthouse on the built site: performance 90+, accessibility 90+.
- `prefers-reduced-motion` disables parallax and reveal animations.

## 10. Out of scope

Admin interface, online sales, Instagram sync, English version, contact form, blog or
news feed, newsletter, custom cursor, sound.

## 11. Comment ajouter une œuvre (pour la famille)

1. Copier la photo (JPEG, idéalement 1600 px de large ou plus) dans `src/content/oeuvres/`,
   par exemple `clown-blanc.jpg`.
2. Créer à côté un fichier `clown-blanc.md` :

   ```md
   ---
   title: "Le Clown blanc"
   year: 2024
   material: "Pierre calcaire"
   dimensions: "45 × 30 × 25 cm"   # facultatif
   featured: true                    # true = apparaît sur la page d'accueil (6 max)
   order: 3                          # ordre sur l'accueil et dans le catalogue
   image: "./clown-blanc.jpg"
   alt: "Description courte de la photo pour l'accessibilité"
   ---
   Un paragraphe facultatif affiché sur la page de l'œuvre.
   ```

3. Lancer `npm run build` pour vérifier qu'il n'y a pas d'erreur (un champ manquant est signalé).
4. `git add . && git commit -m "content: nouvelle œuvre" && git push` : Vercel redéploie le site.

Textes du site (biographie, e-mail, Instagram, œuvre du bandeau d'accueil) : `src/data/site.ts`.
Les fiches importées depuis Instagram portent un commentaire `TODO(famille)` : titre, année,
matière et dimensions restent à vérifier.

## 12. Deployment

- Code: private GitHub repo `theoseleve-glitch/site-dominique-stipa`, branch `master`.
- Vercel: project creation through the Claude connector was refused (403). A temporary
  anonymous deployment was made on 2026-09-02 with `vercel deploy --temporary`
  (expires after 60 minutes unless claimed). Permanent setup: run `vercel login` once, then
  `vercel link` and `vercel --prod` from the project folder, or import the GitHub repo at
  https://vercel.com/new so every push to `master` redeploys.

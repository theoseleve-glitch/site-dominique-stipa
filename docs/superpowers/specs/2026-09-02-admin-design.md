# Admin (espace d'édition) — Design Spec

Date: 2026-09-02
Status: approved in conversation (design + fine-grained GitHub token)

## 1. Goal

Give the artist a private page, `https://site-dominique-stipa.vercel.app/admin`, where he can
edit every text and image of the site and add sculptures and videos, with only an email and a
password he chooses on the first visit. No third-party service, nothing to pay.

## 2. How it works

- The site stays static. Only the `/admin/*` pages and their form handlers are server-rendered
  on Vercel (Astro + `@astrojs/vercel`, `prerender = false` on those routes).
- Content stays in the GitHub repo, exactly as today (Markdown files with colocated photos,
  `src/data/site.json`, `public/videos`). Every save in the admin is one commit on `master`
  made through the GitHub API with a fine-grained token that can only touch this repo.
- The push triggers the existing Vercel build. The admin tells the artist: "Enregistré. Le site
  se met à jour, comptez deux minutes."
- The admin reads the current content from GitHub (not from the deployed bundle), so several
  edits in a row chain correctly even before a deploy finishes.

## 3. Authentication

- First visit with no credentials on file: `/admin/installation` asks for email + password
  (minimum 10 characters) and commits `src/data/admin.json` with `{ email, passwordHash }`.
  The hash is scrypt (N=2^15, r=8, p=1, 16-byte salt). Once the file exists, the installation
  page is disabled.
- `/admin/connexion`: email + password, verified with a constant-time compare. On success a
  session cookie `admin_session` is set: `base64(email.expiry).hmacSHA256(SESSION_SECRET)`,
  7 days, HttpOnly, Secure, SameSite=Lax, path `/admin`.
- `/admin/deconnexion` (POST) clears it.
- POST handlers require a valid session (except installation/connexion) and a same-origin
  request (`Sec-Fetch-Site` is `same-origin` or absent, or `Origin` matches the site).
- Password change: from the site-texts page, optional "nouveau mot de passe" field.
- Brute force: scrypt cost plus a best-effort per-instance limiter (5 failures → 1 minute).

## 4. Content model (unchanged for the public site)

- Sculpture: `src/content/sculptures/<slug>.md` — `title, year, material, dimensions?, featured,
  order, image: "./<slug>.<ext>", alt` + optional body text. Photo colocated.
- Site texts: `src/data/site.json` (replaces `site.ts`; a thin `site.ts` parses it with zod so
  pages keep their types). Fields: firstName, lastName, tagline, city, email, instagram,
  instagramHandle, heroSlug, statement, description, bio[], expositions[], videos[].
- Portrait for the about page: fixed path `src/assets/portrait.jpg`, overwritten on upload.
- Videos: `public/videos/<slug>.mp4` + optional poster `public/videos/<slug>.jpg`; listed in
  `site.json.videos` as `{ title, caption, file, poster? }`.

## 5. Admin pages (all in French)

| Route | Purpose |
|---|---|
| `/admin` | Dashboard: sculptures list (title, year, featured), links to every section |
| `/admin/installation` | First-run credentials (only while `admin.json` is absent) |
| `/admin/connexion`, `/admin/deconnexion` | Login / logout |
| `/admin/sculptures/nouvelle` | Add: title, year, material, dimensions, featured, order, alt, text, photo (required) |
| `/admin/sculptures/[slug]` | Edit same fields, replace photo, delete (with confirmation checkbox) |
| `/admin/site` | Names, tagline, city, email, Instagram, statement, description, bio paragraphs, expositions, hero sculpture (select), portrait upload, new password |
| `/admin/videos` | List with delete; add: title, caption, mp4 file, optional poster |

Plain server-rendered HTML forms, the site's dark palette and fonts, large inputs, one column,
no JavaScript required. Success and error messages at the top of the page.

## 6. Uploads and validation

- Images: JPEG/PNG/WebP by magic bytes, max 15 MB. Re-encoded with sharp to JPEG quality 85,
  max 2000 px on the long side (keeps the repo and builds small). Stored as `<slug>.jpg`.
- Videos: MP4 by magic bytes (`ftyp`), max 40 MB (Vercel request body limit is 100 MB).
- Slugs: from the title (lowercase ASCII, hyphens), unique; only `[a-z0-9-]+` accepted in URLs.
- All form fields validated with zod at the handler boundary.

## 7. GitHub access

- Env vars on Vercel and in local `.env`: `GITHUB_TOKEN` (fine-grained, this repo, Contents
  read/write), `GITHUB_REPO` (`theoseleve-glitch/site-dominique-stipa`), `GITHUB_BRANCH`
  (`master`; a throwaway branch during local testing), `SESSION_SECRET` (random 32 bytes).
- Writes use the Git Data API so one save = one commit even when it touches two files
  (Markdown + photo): create blobs → create tree (base = current commit) → create commit →
  update ref. Deletions are tree entries with `sha: null`.
- Reads use the Contents API (`?ref=<branch>`), base64-decoded.
- A 401/403 from GitHub surfaces as: "Le jeton GitHub est invalide ou expiré : demandez à Théo
  de le renouveler dans Vercel."

## 8. Testing

- Vitest: frontmatter round-trip (parse ↔ stringify), slugify + uniqueness, password hash/verify,
  session sign/verify (tampered cookie rejected, expired rejected), magic-byte sniffing.
- Manual, locally with `GITHUB_BRANCH=admin-test`: installation, login, add a sculpture with a
  photo, edit it, delete it, edit site texts, add and delete a video; confirm each step is one
  commit on the test branch; `astro build` of that branch succeeds. Delete the test branch after.
- `astro check` and `astro build` clean; public pages unchanged (Lighthouse spot check).

## 9. Out of scope

Multiple users, roles, drafts/preview before publish, image cropping, video transcoding,
deploy-status polling, password reset by email (the son resets by deleting `admin.json`).

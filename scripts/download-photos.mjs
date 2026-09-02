// Télécharge les photos listées dans scripts/photos.json (posts publics Instagram)
// et crée un fichier Markdown par œuvre dans src/content/oeuvres/.
// Usage : node scripts/download-photos.mjs
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const list = JSON.parse(await readFile('scripts/photos.json', 'utf8'));
const dir = 'src/content/oeuvres';
await mkdir('src/assets', { recursive: true });
await mkdir(dir, { recursive: true });

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36';

for (const item of list) {
  const url = item.url ?? `https://www.instagram.com/p/${item.code}/media/?size=l`;
  const target = item.portrait ? 'src/assets/atelier.jpg' : path.join(dir, `${item.slug}.jpg`);
  if (!(await exists(target))) {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) {
      throw new Error(`${item.slug}: HTTP ${res.status} ${res.headers.get('content-type')}`);
    }
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log('saved', target);
  }
  if (item.portrait) continue;

  const md = path.join(dir, `${item.slug}.md`);
  if (await exists(md)) continue;
  const dims = item.dimensions ? `dimensions: "${item.dimensions}"\n` : '';
  await writeFile(
    md,
    `---
# TODO(famille): vérifier titre, année, matière, dimensions
title: "${item.title ?? 'Sans titre'}"
year: ${item.year}
material: "${item.material ?? 'Pierre'}"
${dims}featured: ${item.featured ? 'true' : 'false'}
order: ${item.order ?? 99}
image: "./${item.slug}.jpg"
alt: "${item.alt ?? 'Sculpture de Dominique Stipa'}"
---
${(item.caption ?? '').trim()}
`,
  );
  console.log('wrote', md);
}

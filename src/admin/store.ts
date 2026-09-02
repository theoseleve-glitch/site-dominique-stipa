/**
 * Content I/O for the admin, on top of the GitHub module. Everything the admin
 * shows comes from the configured branch, never from the deployed bundle, so
 * consecutive edits chain correctly before a deploy finishes.
 */
import { siteSchema, type SiteData } from '../data/site';
import { commitFiles, getFile, getText, listDir, type FileChange } from './github';
import { parseSculpture, stringifySculpture, type SculptureData } from './content';

export const PATHS = {
  credentials: 'src/data/admin.json',
  site: 'src/data/site.json',
  sculptures: 'src/content/sculptures',
  portrait: 'src/assets/portrait.jpg',
  videos: 'public/videos',
} as const;

export interface Credentials {
  email: string;
  passwordHash: string;
}

export async function readCredentials(): Promise<Credentials | null> {
  const text = await getText(PATHS.credentials);
  if (!text) return null;
  const parsed = JSON.parse(text) as Partial<Credentials>;
  if (typeof parsed.email !== 'string' || typeof parsed.passwordHash !== 'string') return null;
  return { email: parsed.email, passwordHash: parsed.passwordHash };
}

export async function writeCredentials(creds: Credentials, message: string): Promise<void> {
  await commitFiles(message, [{ path: PATHS.credentials, content: JSON.stringify(creds, null, 2) + '\n' }]);
}

export interface Sculpture {
  slug: string;
  data: SculptureData;
  body: string;
}

export async function listSculptures(): Promise<Sculpture[]> {
  const entries = await listDir(PATHS.sculptures);
  const mdFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md') && !e.name.startsWith('_'));
  const items = await Promise.all(
    mdFiles.map(async (e) => {
      const text = await getText(e.path);
      if (!text) return null;
      try {
        const { data, body } = parseSculpture(text);
        return { slug: e.name.replace(/\.md$/, ''), data, body } satisfies Sculpture;
      } catch {
        return null; // a hand-edited file that does not validate is simply not listed
      }
    }),
  );
  return items
    .filter((s): s is Sculpture => s !== null)
    .sort((a, b) => b.data.year - a.data.year || a.data.order - b.data.order);
}

export async function readSculpture(slug: string): Promise<Sculpture | null> {
  const text = await getText(`${PATHS.sculptures}/${slug}.md`);
  if (!text) return null;
  const { data, body } = parseSculpture(text);
  return { slug, data, body };
}

/** Writes the Markdown file and, when given, the colocated JPEG, in one commit. */
export async function writeSculpture(
  slug: string,
  data: SculptureData,
  body: string,
  image: Buffer | null,
  message: string,
  /** previous `image` field, so a differently named old photo is removed in the same commit */
  previousImage?: string,
): Promise<void> {
  const changes: FileChange[] = [{ path: `${PATHS.sculptures}/${slug}.md`, content: stringifySculpture(data, body) }];
  if (image) {
    changes.push({ path: `${PATHS.sculptures}/${slug}.jpg`, content: image });
    const old = previousImage?.replace(/^\.\//, '');
    if (old && old !== `${slug}.jpg`) changes.push({ path: `${PATHS.sculptures}/${old}`, delete: true });
  }
  await commitFiles(message, changes);
}

export async function deleteSculpture(sculpture: Sculpture, message: string): Promise<void> {
  const imageName = sculpture.data.image.replace(/^\.\//, '');
  await commitFiles(message, [
    { path: `${PATHS.sculptures}/${sculpture.slug}.md`, delete: true },
    { path: `${PATHS.sculptures}/${imageName}`, delete: true },
  ]);
}

export async function readSite(): Promise<SiteData> {
  const text = await getText(PATHS.site);
  if (!text) throw new Error('src/data/site.json est introuvable sur la branche.');
  return siteSchema.parse(JSON.parse(text));
}

export async function writeSite(data: SiteData, extra: FileChange[], message: string): Promise<void> {
  await commitFiles(message, [{ path: PATHS.site, content: JSON.stringify(data, null, 2) + '\n' }, ...extra]);
}

export async function readPortrait(): Promise<Buffer | null> {
  return getFile(PATHS.portrait);
}

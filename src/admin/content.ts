import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'astro/zod';

/** Same rules as src/content.config.ts, plus a strict image path (colocated file only). */
export const sculptureSchema = z.object({
  title: z.string().trim().min(1).max(120),
  year: z.coerce.number().int().min(1950).max(2100),
  material: z.string().trim().min(1).max(120),
  dimensions: z.string().trim().max(120).optional(),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0).max(999).default(99),
  image: z.string().regex(/^\.\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/),
  alt: z.string().trim().min(1).max(300),
});
export type SculptureData = z.infer<typeof sculptureSchema>;

export const SLUG_RE = /^[a-z0-9-]+$/;

export function slugify(input: string): string {
  const s = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'sculpture';
}

export function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseSculpture(markdown: string): { data: SculptureData; body: string } {
  const m = FRONTMATTER.exec(markdown);
  if (!m) throw new Error('Fichier sans en-tête (frontmatter).');
  const raw = parseYaml(m[1]) ?? {};
  const data = sculptureSchema.parse(raw);
  return { data, body: m[2].trim() };
}

export function stringifySculpture(data: SculptureData, body: string): string {
  const ordered: Record<string, unknown> = {
    title: data.title,
    year: data.year,
    material: data.material,
  };
  if (data.dimensions) ordered.dimensions = data.dimensions;
  ordered.featured = data.featured;
  ordered.order = data.order;
  ordered.image = data.image;
  ordered.alt = data.alt;
  const yaml = stringifyYaml(ordered, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN', lineWidth: 0 });
  const text = body.trim();
  return `---\n${yaml}---\n${text ? text + '\n' : ''}`;
}

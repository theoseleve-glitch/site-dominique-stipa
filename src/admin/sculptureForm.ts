import { z } from 'astro/zod';
import { MAX_IMAGE_BYTES, processImage, sniffImage } from './uploads';

/** Fields of the sculpture form, before slug/image are decided. */
export const sculptureFormSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire.').max(120),
  year: z.coerce.number({ message: 'Année invalide.' }).int().min(1950, 'Année invalide.').max(2100, 'Année invalide.'),
  material: z.string().trim().min(1, 'La matière est obligatoire.').max(120),
  dimensions: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === '' ? undefined : v)),
  featured: z.boolean(),
  order: z.coerce.number({ message: 'Ordre invalide.' }).int().min(0).max(999),
  alt: z.string().trim().min(1, 'La description de la photo (pour l’accessibilité) est obligatoire.').max(300),
  body: z.string().trim().max(5000),
});
export type SculptureFormFields = z.infer<typeof sculptureFormSchema>;

export interface SculptureFormResult {
  fields: SculptureFormFields;
  /** processed JPEG, or null when no file was sent */
  image: Buffer | null;
}

export class FormError extends Error {}

const str = (form: FormData, name: string) => String(form.get(name) ?? '');

/** Validates the multipart form; throws FormError with a French message. */
export async function readSculptureForm(form: FormData): Promise<SculptureFormResult> {
  const parsed = sculptureFormSchema.safeParse({
    title: str(form, 'title'),
    year: str(form, 'year'),
    material: str(form, 'material'),
    dimensions: str(form, 'dimensions'),
    featured: form.get('featured') === 'on',
    order: str(form, 'order') || '99',
    alt: str(form, 'alt'),
    body: str(form, 'body'),
  });
  if (!parsed.success) throw new FormError(parsed.error.issues[0]?.message ?? 'Formulaire invalide.');
  return { fields: parsed.data, image: await readImageField(form, 'image') };
}

/** Reads an optional image field: null when empty, processed JPEG otherwise. */
export async function readImageField(form: FormData, name: string): Promise<Buffer | null> {
  const file = form.get(name);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_IMAGE_BYTES) throw new FormError('La photo dépasse 15 Mo.');
  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(buf)) throw new FormError('La photo doit être un fichier JPEG, PNG ou WebP.');
  try {
    return await processImage(buf);
  } catch {
    throw new FormError('La photo n’a pas pu être lue.');
  }
}

/** Values shown in the form (strings, as typed). */
export function formValues(fields: Partial<SculptureFormFields>): Record<string, string> {
  return {
    title: fields.title ?? '',
    year: fields.year !== undefined ? String(fields.year) : String(new Date().getFullYear()),
    material: fields.material ?? 'Pierre',
    dimensions: fields.dimensions ?? '',
    featured: fields.featured ? 'on' : '',
    order: fields.order !== undefined ? String(fields.order) : '99',
    alt: fields.alt ?? '',
    body: fields.body ?? '',
  };
}

import { z } from 'astro/zod';
import raw from './site.json';

/** Shape of src/data/site.json — edited by the admin, validated here at build time. */
export const videoSchema = z.object({
  title: z.string().min(1),
  caption: z.string().default(''),
  file: z.string().regex(/^\/videos\/[a-z0-9-]+\.mp4$/),
  poster: z.string().regex(/^\/videos\/[a-z0-9-]+\.jpg$/).optional(),
});

export const siteSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tagline: z.string().min(1),
  city: z.string().min(1),
  email: z.email(),
  instagram: z.url(),
  instagramHandle: z.string().min(1),
  heroSlug: z.string().regex(/^[a-z0-9-]+$/),
  statement: z.string().min(1),
  description: z.string().min(1),
  bio: z.array(z.string().min(1)).min(1),
  expositions: z.array(z.string().min(1)).default([]),
  videos: z.array(videoSchema).default([]),
});

export type SiteData = z.infer<typeof siteSchema>;
export type VideoData = z.infer<typeof videoSchema>;

const parsed = siteSchema.parse(raw);

export const site = {
  ...parsed,
  name: `${parsed.firstName} ${parsed.lastName}`,
};

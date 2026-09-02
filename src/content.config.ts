import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const sculptures = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/sculptures' }),
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

export const collections = { sculptures };

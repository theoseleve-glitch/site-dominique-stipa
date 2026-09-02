import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug, parseSculpture, stringifySculpture, sculptureSchema } from './content';

describe('slugify', () => {
  it('lowercases, strips accents, and hyphenates', () => {
    expect(slugify('Prête pour un long voyage')).toBe('prete-pour-un-long-voyage');
    expect(slugify('  N°1 — Visage  ')).toBe('n-1-visage');
    expect(slugify('Œuvre à l’atelier')).toBe('oeuvre-a-l-atelier');
  });
  it('falls back when nothing is left', () => {
    expect(slugify('***')).toBe('sculpture');
  });
});

describe('uniqueSlug', () => {
  it('returns the slug when free and suffixes when taken', () => {
    expect(uniqueSlug('masque', [])).toBe('masque');
    expect(uniqueSlug('masque', ['masque'])).toBe('masque-2');
    expect(uniqueSlug('masque', ['masque', 'masque-2'])).toBe('masque-3');
  });
});

describe('sculpture frontmatter', () => {
  const data = {
    title: 'N°1',
    year: 2025,
    material: 'Pierre',
    dimensions: '45 × 30 × 25 cm',
    featured: true,
    order: 1,
    image: './numero-1.jpg',
    alt: 'Visage souriant: "test"',
  };
  it('round-trips data and body', () => {
    const md = stringifySculpture(data, 'Présentée au salon.\n\nDeuxième paragraphe.');
    const back = parseSculpture(md);
    expect(back.data).toEqual(data);
    expect(back.body).toBe('Présentée au salon.\n\nDeuxième paragraphe.');
  });
  it('omits optional dimensions when absent and parses an empty body', () => {
    const { dimensions: _d, ...noDims } = data;
    const md = stringifySculpture(noDims, '');
    expect(md).not.toContain('dimensions');
    const back = parseSculpture(md);
    expect(back.data.dimensions).toBeUndefined();
    expect(back.body).toBe('');
  });
  it('parses the files written by the import script (with a comment line)', () => {
    const md = `---\n# TODO(famille): vérifier\ntitle: "N°2"\nyear: 2025\nmaterial: "Pierre"\nfeatured: true\norder: 2\nimage: "./numero-2.jpg"\nalt: "Forme"\n---\nTexte.\n`;
    const back = parseSculpture(md);
    expect(back.data.title).toBe('N°2');
    expect(back.data.order).toBe(2);
    expect(back.body).toBe('Texte.');
  });
  it('rejects invalid data through the schema', () => {
    expect(() => sculptureSchema.parse({ ...data, year: 'abc' })).toThrow();
    expect(() => sculptureSchema.parse({ ...data, image: '../../etc/passwd' })).toThrow();
  });
});

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
  it('breaks year ties by ascending order', () => {
    const items = [mk('a', 2025, false, 5), mk('b', 2025, false, 1), mk('c', 2025, false, 3)];
    expect(sortByYearDesc(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
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

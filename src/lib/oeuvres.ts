export type OeuvreLike = {
  id: string;
  data: { year: number; featured: boolean; order: number };
};

export function sortByYearDesc<T extends OeuvreLike>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.year - a.data.year);
}

export function getFeatured<T extends OeuvreLike>(items: T[], max = 6): T[] {
  return items
    .filter((i) => i.data.featured)
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, max);
}

export function getNeighbours<T extends OeuvreLike>(
  sorted: T[],
  id: string,
): { prev: T | null; next: T | null } {
  const index = sorted.findIndex((i) => i.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}

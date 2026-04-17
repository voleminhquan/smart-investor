import type { Collection } from '../data/mockData';
import { defaultCollections } from '../data/mockData';

const STORAGE_KEY = 'smart-investor-collections';

export function loadCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore parse errors
  }
  // First time — seed with defaults
  saveCollections(defaultCollections);
  return defaultCollections;
}

export function saveCollections(collections: Collection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export function createCollection(name: string, icon: string): Collection {
  return {
    id: `col-${Date.now()}`,
    name,
    icon,
    symbols: [],
    createdAt: Date.now(),
  };
}

import { HISTORY_LIMIT } from '../constants/universe';
import type { StoredUniverse, UniverseConfig } from '../types/universe';

const STORAGE_KEY = 'moment-universe:archives:v1';

function isUniverseConfig(value: unknown): value is UniverseConfig {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<UniverseConfig>;
  return (
    typeof candidate.text === 'string' &&
    typeof candidate.seed === 'string' &&
    typeof candidate.energy === 'number' &&
    typeof candidate.order === 'number' &&
    typeof candidate.fluctuation === 'number' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.universeType === 'string' &&
    typeof candidate.catalogId === 'string'
  );
}

export function parseHistory(raw: string | null): StoredUniverse[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is StoredUniverse =>
          Boolean(item) &&
          typeof item === 'object' &&
          (item as Partial<StoredUniverse>).version === 1 &&
          typeof (item as Partial<StoredUniverse>).savedAt === 'string' &&
          isUniverseConfig((item as Partial<StoredUniverse>).config),
      )
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function loadHistory(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    return parseHistory(storage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveUniverse(
  config: UniverseConfig,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
) {
  try {
    const current = loadHistory(storage);
    const next: StoredUniverse[] = [
      { version: 1 as const, config, savedAt: new Date().toISOString() },
      ...current.filter((item) => item.config.catalogId !== config.catalogId),
    ].slice(0, HISTORY_LIMIT);
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function clearHistory(storage: Pick<Storage, 'removeItem'> = localStorage) {
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

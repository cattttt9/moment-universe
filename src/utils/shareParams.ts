import { clampParameter } from '../engine/universeGenerator';
import type { UniverseParameters } from '../types/universe';

export interface ShareState extends UniverseParameters {
  seed: string;
}

const SEED_PATTERN = /^[a-f0-9]{8}$/i;

export function createShareHash(state: ShareState) {
  const params = new URLSearchParams({
    seed: state.seed,
    energy: String(clampParameter(state.energy)),
    order: String(clampParameter(state.order)),
    fluctuation: String(clampParameter(state.fluctuation)),
  });
  return `#${params.toString()}`;
}

export function parseShareHash(hash: string): ShareState | null {
  try {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const seed = params.get('seed') ?? '';
    if (!SEED_PATTERN.test(seed)) return null;
    const values = ['energy', 'order', 'fluctuation'].map((key) => {
      const raw = params.get(key);
      if (raw === null || raw.trim() === '') return null;
      const value = Number(raw);
      return Number.isFinite(value) ? clampParameter(value) : null;
    });
    if (values.some((value) => value === null)) return null;
    return {
      seed: seed.toLowerCase(),
      energy: values[0]!,
      order: values[1]!,
      fluctuation: values[2]!,
    };
  } catch {
    return null;
  }
}

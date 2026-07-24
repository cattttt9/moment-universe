import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../engine/seededRandom';
import { textHash } from '../engine/textHash';
import {
  clampParameter,
  createUniverseConfig,
  generateUniverseBlueprint,
  getUniverseType,
} from '../engine/universeGenerator';

describe('textHash', () => {
  it('returns the same hash for the same normalized text', () => {
    expect(textHash('宇宙 e\u0301')).toBe(textHash('宇宙 é'));
  });

  it('usually separates different text', () => {
    expect(textHash('我想试一试')).not.toBe(textHash('我不想试一试'));
  });
});

describe('seeded random', () => {
  it('replays the same sequence for the same seed', () => {
    const first = createSeededRandom('same-seed');
    const second = createSeededRandom('same-seed');
    expect(Array.from({ length: 8 }, first.next)).toEqual(Array.from({ length: 8 }, second.next));
  });
});

describe('universe generator', () => {
  it.each([
    [-8, 0],
    [40.4, 40],
    [130, 100],
    [Number.NaN, 50],
  ])('clamps %s to %s', (input, expected) => {
    expect(clampParameter(input)).toBe(expected);
  });

  it('keeps universe type and structure stable', () => {
    const config = createUniverseConfig(
      '我不知道能不能做成，但我还是想试一试。',
      { energy: 42, order: 68, fluctuation: 79 },
      '2026-07-24T14:46:00.000Z',
    );
    expect(getUniverseType(config.seed, config)).toBe(getUniverseType(config.seed, config));
    const first = generateUniverseBlueprint(config, 'low');
    const second = generateUniverseBlueprint(config, 'low');
    expect(first.particles.slice(0, 5)).toEqual(second.particles.slice(0, 5));
    expect(first.armCount).toBe(second.armCount);
  });
});

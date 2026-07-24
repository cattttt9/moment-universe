import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../engine/seededRandom';
import { textHash } from '../engine/textHash';
import {
  clampParameter,
  createUniverseConfig,
  generateVisualProfile,
  generateUniverseBlueprint,
  getUniverseType,
  selectUniverseArchetype,
  UNIVERSE_PALETTES,
} from '../engine/universeGenerator';
import { UNIVERSE_ARCHETYPES } from '../engine/archetypes';

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
    expect(first.profile).toEqual(second.profile);
  });

  it('creates different visual profiles for different seeds', () => {
    const base = createUniverseConfig(
      '第一颗宇宙',
      { energy: 42, order: 68, fluctuation: 79 },
      '2026-07-24T14:46:00.000Z',
    );
    const first = generateVisualProfile({ ...base, seed: '00000001' });
    const second = generateVisualProfile({ ...base, seed: '00000006' });
    expect(first.archetype).not.toBe(second.archetype);
    expect(first).not.toEqual(second);
  });

  it('builds valid particles for every archetype', () => {
    const base = createUniverseConfig(
      '八种结构验证',
      { energy: 60, order: 50, fluctuation: 45 },
      '2026-07-24T14:46:00.000Z',
    );
    const generated = UNIVERSE_ARCHETYPES.map((archetype, index) => {
      const seed = index.toString(16).padStart(8, '0');
      expect(selectUniverseArchetype(seed)).toBe(archetype);
      const blueprint = generateUniverseBlueprint({ ...base, seed }, 'low');
      expect(blueprint.profile.archetype).toBe(archetype);
      expect(blueprint.particles.length).toBeGreaterThan(100);
      expect(blueprint.particles.every((particle) => Number.isFinite(particle.x))).toBe(true);
      return blueprint.profile.archetype;
    });
    expect(new Set(generated).size).toBe(8);
  });

  it('selects palettes deterministically', () => {
    const config = createUniverseConfig(
      '颜色不会漂移',
      { energy: 33, order: 74, fluctuation: 28 },
      '2026-07-24T14:46:00.000Z',
    );
    const first = generateVisualProfile(config);
    const second = generateVisualProfile(config);
    expect(first.palette).toEqual(second.palette);
    expect(UNIVERSE_PALETTES).toContainEqual(first.palette);
    expect(new Set(UNIVERSE_PALETTES.map((palette) => palette.name)).size).toBe(8);
  });
});

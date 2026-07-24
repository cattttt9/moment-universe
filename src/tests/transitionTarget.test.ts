import { describe, expect, it } from 'vitest';
import { getTransitionTarget } from '../engine/textParticleSampler';
import { createUniverseConfig, generateVisualProfile } from '../engine/universeGenerator';

describe('text-to-universe transition targets', () => {
  it('is deterministic for the same visual profile', () => {
    const config = createUniverseConfig(
      '文字转场',
      { energy: 60, order: 50, fluctuation: 40 },
      '2026-07-25T00:00:00.000Z',
    );
    const profile = generateVisualProfile(config);
    expect(getTransitionTarget(12, 1200, 800, profile)).toEqual(
      getTransitionTarget(12, 1200, 800, profile),
    );
  });

  it('uses visibly different targets for different archetypes', () => {
    const config = createUniverseConfig(
      '原型转场',
      { energy: 60, order: 50, fluctuation: 40 },
      '2026-07-25T00:00:00.000Z',
    );
    const ring = generateVisualProfile({ ...config, seed: '00000004' });
    const filament = generateVisualProfile({ ...config, seed: '00000005' });
    expect(getTransitionTarget(21, 1200, 800, ring)).not.toEqual(
      getTransitionTarget(21, 1200, 800, filament),
    );
  });
});

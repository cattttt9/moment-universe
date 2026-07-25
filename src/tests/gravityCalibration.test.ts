import { describe, expect, it } from 'vitest';
import {
  bodiesToParameters,
  createGravityBodies,
  getGravityScore,
  isGravityStable,
} from '../engine/gravityCalibration';

describe('gravity calibration', () => {
  it('creates a stable, deterministic starting constellation', () => {
    const parameters = { energy: 56, order: 64, fluctuation: 38 };
    const first = createGravityBodies(parameters);
    const second = createGravityBodies(parameters);
    expect(first).toEqual(second);
    expect(getGravityScore(first)).toBeGreaterThanOrEqual(72);
    expect(isGravityStable(first)).toBe(true);
  });

  it('maps changed geometry back to generation parameters', () => {
    const bodies = createGravityBodies({ energy: 56, order: 64, fluctuation: 38 });
    const initial = bodiesToParameters(bodies);
    bodies[0] = { ...bodies[0]!, x: -4.1, y: 0, velocity: 2.4 };
    const changed = bodiesToParameters(bodies);
    expect(changed.energy).toBeGreaterThan(initial.energy);
    expect(changed.order).toBe(initial.order);
    expect(changed.fluctuation).toBe(initial.fluctuation);
  });

  it('maps each body radius to exactly one generation parameter', () => {
    const bodies = createGravityBodies({ energy: 20, order: 50, fluctuation: 80 });
    expect(bodiesToParameters(bodies)).toEqual({ energy: 20, order: 50, fluctuation: 80 });

    bodies[2] = { ...bodies[2]!, x: 0, y: 1.25 };
    expect(bodiesToParameters(bodies)).toEqual({ energy: 20, order: 50, fluctuation: 0 });
  });
});

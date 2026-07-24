import { describe, expect, it } from 'vitest';
import {
  angleToValue,
  clampOrbitValue,
  normalizeAngle,
  pointerAngle,
  valueToAngle,
} from '../components/OrbitDial/orbitMath';

describe('OrbitDial math', () => {
  it('maps the 270 degree arc to values', () => {
    expect(valueToAngle(0)).toBe(-135);
    expect(valueToAngle(50)).toBe(0);
    expect(valueToAngle(100)).toBe(135);
    expect(angleToValue(-135)).toBe(0);
    expect(angleToValue(0)).toBe(50);
    expect(angleToValue(135)).toBe(100);
  });

  it('keeps the dead-zone edge continuous', () => {
    expect(angleToValue(179, 94)).toBe(100);
    expect(angleToValue(-179, 6)).toBe(0);
  });

  it('normalizes angles and clamps invalid values', () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(clampOrbitValue(-20)).toBe(0);
    expect(clampOrbitValue(140)).toBe(100);
    expect(clampOrbitValue(Number.NaN)).toBe(50);
  });

  it('calculates pointer angle with zero at the top', () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    expect(pointerAngle(50, 0, rect)).toBe(0);
    expect(pointerAngle(100, 50, rect)).toBe(90);
    expect(pointerAngle(0, 50, rect)).toBe(-90);
  });
});

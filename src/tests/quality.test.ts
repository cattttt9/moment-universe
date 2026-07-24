import { describe, expect, it } from 'vitest';
import { detectQualityLevel } from '../hooks/useQualityLevel';

describe('rendering quality', () => {
  it('uses low quality when reduced motion is enabled', () => {
    expect(detectQualityLevel(true)).toBe('low');
  });
});

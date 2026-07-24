import { useMemo } from 'react';
import type { QualityLevel } from '../types/universe';
import { useReducedMotion } from './useReducedMotion';

export function detectQualityLevel(reducedMotion = false): QualityLevel {
  if (typeof window === 'undefined') return 'medium';
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  if (reducedMotion || (memory !== undefined && memory <= 4) || (narrow && coarse)) return 'low';
  if (coarse || window.devicePixelRatio > 2) return 'medium';
  return 'high';
}

export function useQualityLevel() {
  const reducedMotion = useReducedMotion();
  return useMemo(() => detectQualityLevel(reducedMotion), [reducedMotion]);
}

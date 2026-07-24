import type { QualityLevel, UniverseParameters } from '../types/universe';

export const TEXT_LIMIT = 80;
export const HISTORY_LIMIT = 20;

export const DEFAULT_PARAMETERS: UniverseParameters = {
  energy: 56,
  order: 64,
  fluctuation: 38,
};

export const QUALITY_PARTICLE_COUNTS: Record<QualityLevel, number> = {
  high: 7200,
  medium: 4300,
  low: 2200,
};

export const QUALITY_PIXEL_RATIOS: Record<QualityLevel, number> = {
  high: 1.8,
  medium: 1.4,
  low: 1,
};

export const PARAMETER_COPY = {
  energy: {
    label: '能量',
    english: 'ENERGY',
    description: '星核的亮度与粒子远行的速度',
    low: '微光',
    high: '炽烈',
  },
  order: {
    label: '秩序',
    english: 'ORDER',
    description: '轨道的规律、对称与长期稳定',
    low: '游离',
    high: '整齐',
  },
  fluctuation: {
    label: '波动',
    english: 'FLUCTUATION',
    description: '脉冲、扰动与局部形态的改变',
    low: '平缓',
    high: '起伏',
  },
} as const;

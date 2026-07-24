export type AppStage = 'intro' | 'sentence' | 'parameters' | 'generating' | 'universe';

export type QualityLevel = 'high' | 'medium' | 'low';

export interface UniverseParameters {
  energy: number;
  order: number;
  fluctuation: number;
}

export interface UniverseConfig extends UniverseParameters {
  text: string;
  seed: string;
  createdAt: string;
  universeType: string;
  catalogId: string;
}

export interface UniversePalette {
  core: string;
  inner: string;
  outer: string;
  haze: string;
}

export interface ParticleBlueprint {
  x: number;
  y: number;
  z: number;
  size: number;
  phase: number;
  branch: number;
  brightness: number;
}

export interface UniverseBlueprint {
  config: UniverseConfig;
  palette: UniversePalette;
  particles: ParticleBlueprint[];
  coreCount: number;
  armCount: number;
  orbitEccentricity: number;
  pulseRate: number;
}

export interface StoredUniverse {
  version: 1;
  config: UniverseConfig;
  savedAt: string;
}

export interface PosterArchive {
  title: '此刻宇宙';
  text: string;
  createdAt: string;
  catalogId: string;
  universeType: string;
  parameters: UniverseParameters;
  signature: 'MOMENT UNIVERSE / LOCAL EDITION';
}

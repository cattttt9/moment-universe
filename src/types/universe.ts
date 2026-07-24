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
  name: string;
  core: string;
  inner: string;
  outer: string;
  haze: string;
}

export type UniverseArchetype =
  | 'spiral-galaxy'
  | 'accretion-disk'
  | 'binary-system'
  | 'drifting-nebula'
  | 'ring-nebula'
  | 'filament-cluster'
  | 'pulsar'
  | 'void-system';

export type CameraPreset =
  | 'left-offset'
  | 'right-offset'
  | 'diagonal'
  | 'close'
  | 'distant'
  | 'dual-center';

export interface UniverseVisualProfile {
  archetype: UniverseArchetype;
  seed: string;
  palette: UniversePalette;
  coreCount: number;
  armCount: number;
  orientation: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
  density: number;
  spread: number;
  symmetry: number;
  turbulence: number;
  pulse: number;
  emission: number;
  cameraPreset: CameraPreset;
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
  profile: UniverseVisualProfile;
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

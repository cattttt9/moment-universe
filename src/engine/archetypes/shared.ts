import type {
  ParticleBlueprint,
  UniverseConfig,
  UniverseVisualProfile,
} from '../../types/universe';
import { createSeededRandom } from '../seededRandom';

export interface ArchetypeContext {
  config: UniverseConfig;
  profile: UniverseVisualProfile;
  count: number;
}

export function particleRandom(context: ArchetypeContext, index: number) {
  return createSeededRandom(`${context.profile.seed}:${context.profile.archetype}:${index}`);
}

export function particle(
  x: number,
  y: number,
  z: number,
  index: number,
  context: ArchetypeContext,
  brightness = 1,
): ParticleBlueprint {
  const random = particleRandom(context, index);
  return {
    x,
    y,
    z,
    size: random.range(0.45, 1.8) * (0.78 + context.profile.emission * 0.34),
    phase: random.range(0, Math.PI * 2),
    branch: index % Math.max(1, context.profile.armCount),
    brightness: random.range(0.38, 1) * brightness,
  };
}

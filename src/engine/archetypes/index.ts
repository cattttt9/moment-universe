import type { ParticleBlueprint, UniverseArchetype } from '../../types/universe';
import { buildAccretionDisk } from './accretionDisk';
import { buildBinarySystem } from './binarySystem';
import { buildDriftingNebula } from './driftingNebula';
import { buildFilamentCluster } from './filamentCluster';
import { buildPulsar } from './pulsar';
import { buildRingNebula } from './ringNebula';
import type { ArchetypeContext } from './shared';
import { buildSpiralGalaxy } from './spiralGalaxy';
import { buildVoidSystem } from './voidSystem';

export const UNIVERSE_ARCHETYPES: UniverseArchetype[] = [
  'spiral-galaxy',
  'accretion-disk',
  'binary-system',
  'drifting-nebula',
  'ring-nebula',
  'filament-cluster',
  'pulsar',
  'void-system',
];

const BUILDERS: Record<UniverseArchetype, (context: ArchetypeContext) => ParticleBlueprint[]> = {
  'spiral-galaxy': buildSpiralGalaxy,
  'accretion-disk': buildAccretionDisk,
  'binary-system': buildBinarySystem,
  'drifting-nebula': buildDriftingNebula,
  'ring-nebula': buildRingNebula,
  'filament-cluster': buildFilamentCluster,
  pulsar: buildPulsar,
  'void-system': buildVoidSystem,
};

export function buildArchetypeParticles(context: ArchetypeContext) {
  return BUILDERS[context.profile.archetype](context);
}

import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildFilamentCluster(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const strand = index % Math.max(3, context.profile.armCount + 1);
    const t = random.range(-1, 1);
    const phase = (strand / Math.max(3, context.profile.armCount + 1)) * Math.PI * 2;
    const curl = Math.sin(t * 3.2 + phase) * context.profile.spread;
    return particle(
      t * context.profile.spread * 4.2,
      curl + random.signed() * (0.18 + context.profile.turbulence * 0.32),
      Math.cos(t * 2.5 + phase) * context.profile.spread + random.signed() * 0.22,
      index,
      context,
      0.5 + (strand % 2) * 0.28,
    );
  });
}

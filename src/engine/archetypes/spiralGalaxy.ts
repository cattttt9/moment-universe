import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildSpiralGalaxy(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const radiusN = Math.pow((index + random.next()) / context.count, 0.62);
    const arm = index % context.profile.armCount;
    const angle =
      (arm / context.profile.armCount) * Math.PI * 2 +
      radiusN * (4.2 + context.profile.symmetry * 4.6) +
      random.signed() * context.profile.turbulence * 0.85;
    const radius = 0.18 + radiusN * context.profile.spread * 4.8;
    return particle(
      Math.cos(angle) * radius,
      random.signed() * (0.08 + context.profile.turbulence * 0.42) * radiusN,
      Math.sin(angle) * radius,
      index,
      context,
      0.72 + (1 - radiusN) * 0.4,
    );
  });
}

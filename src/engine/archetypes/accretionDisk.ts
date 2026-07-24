import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildAccretionDisk(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const radiusN = Math.pow(random.next(), 0.44);
    const radius = 0.45 + radiusN * context.profile.spread * 4.9;
    const angle = random.range(0, Math.PI * 2) + radiusN * 1.8;
    const tilt = 0.12 + context.profile.turbulence * 0.16;
    return particle(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * tilt + random.signed() * 0.08,
      Math.sin(angle) * radius * 0.52,
      index,
      context,
      0.65 + (1 - radiusN) * 0.65,
    );
  });
}

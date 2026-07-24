import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildRingNebula(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const angle = random.range(0, Math.PI * 2);
    const band = random.signed() * (0.18 + context.profile.turbulence * 0.5);
    const radius = context.profile.spread * (3.25 + band);
    const knot = 1 + Math.sin(angle * context.profile.armCount) * 0.12;
    return particle(
      Math.cos(angle) * radius * knot,
      band * 1.9 + random.signed() * 0.12,
      Math.sin(angle) * radius,
      index,
      context,
      0.62 + Math.abs(Math.sin(angle * 2)) * 0.38,
    );
  });
}

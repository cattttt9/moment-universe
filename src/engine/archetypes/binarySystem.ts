import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildBinarySystem(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const side = index % 2 === 0 ? -1 : 1;
    const localRadius = Math.pow(random.next(), 0.58) * context.profile.spread * 2.5;
    const angle = random.range(0, Math.PI * 2) + localRadius * 1.4 * side;
    const center = side * context.profile.spread * 1.45;
    return particle(
      center + Math.cos(angle) * localRadius,
      random.signed() * (0.12 + context.profile.turbulence * 0.28),
      Math.sin(angle) * localRadius * 0.72,
      index,
      context,
      0.75 + (1 - localRadius / 3.5) * 0.3,
    );
  });
}

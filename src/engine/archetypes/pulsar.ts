import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildPulsar(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const jet = index % 5 === 0;
    if (jet) {
      const distance = random.signed() * context.profile.spread * 5.4;
      return particle(
        random.signed() * 0.16,
        distance,
        random.signed() * (0.08 + Math.abs(distance) * 0.04),
        index,
        context,
        0.9,
      );
    }
    const radius = Math.pow(random.next(), 0.55) * context.profile.spread * 3.2;
    const angle = random.range(0, Math.PI * 2) + radius * 2;
    return particle(
      Math.cos(angle) * radius,
      random.signed() * 0.12,
      Math.sin(angle) * radius * 0.58,
      index,
      context,
      0.65,
    );
  });
}

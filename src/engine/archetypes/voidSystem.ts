import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildVoidSystem(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const angle = random.range(0, Math.PI * 2);
    const polar = Math.acos(random.range(-1, 1));
    const radius = context.profile.spread * (2.5 + Math.pow(random.next(), 0.7) * 2.8);
    return particle(
      Math.sin(polar) * Math.cos(angle) * radius,
      Math.cos(polar) * radius * 0.72,
      Math.sin(polar) * Math.sin(angle) * radius,
      index,
      context,
      0.42 + random.next() * 0.42,
    );
  });
}

import { particle, particleRandom, type ArchetypeContext } from './shared';

export function buildDriftingNebula(context: ArchetypeContext) {
  return Array.from({ length: context.count }, (_, index) => {
    const random = particleRandom(context, index);
    const t = random.range(-1, 1);
    const branch = Math.sin(t * 4.8) * 1.2 + Math.sin(t * 9.2) * 0.35;
    const width = (0.24 + Math.abs(t) * 0.7) * (0.4 + context.profile.turbulence);
    return particle(
      t * context.profile.spread * 4.5 + random.signed() * width,
      branch + random.signed() * width,
      random.signed() * context.profile.spread * 1.3,
      index,
      context,
      0.55 + random.next() * 0.45,
    );
  });
}

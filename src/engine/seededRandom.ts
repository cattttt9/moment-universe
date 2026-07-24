function xmur3(seed: string) {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

export interface SeededRandom {
  next: () => number;
  range: (minimum: number, maximum: number) => number;
  integer: (minimum: number, maximum: number) => number;
  pick: <T>(items: readonly T[]) => T;
  signed: () => number;
}

export function createSeededRandom(seed: string): SeededRandom {
  const hash = xmur3(seed);
  let state = hash();
  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (minimum, maximum) => minimum + (maximum - minimum) * next(),
    integer: (minimum, maximum) => Math.floor(minimum + next() * (maximum - minimum + 1)),
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)]!,
    signed: () => next() * 2 - 1,
  };
}

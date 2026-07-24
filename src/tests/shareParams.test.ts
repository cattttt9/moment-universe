import { describe, expect, it } from 'vitest';
import { createShareHash, parseShareHash } from '../utils/shareParams';

describe('share params', () => {
  it('round trips privacy-safe parameters', () => {
    const hash = createShareHash({ seed: '12ab34cd', energy: 42, order: 68, fluctuation: 79 });
    expect(hash).not.toContain('text');
    expect(parseShareHash(hash)).toEqual({
      seed: '12ab34cd',
      energy: 42,
      order: 68,
      fluctuation: 79,
    });
  });

  it.each(['#', '#seed=bad', '#seed=12ab34cd&energy=nope&order=2&fluctuation=3'])(
    'rejects malformed hash %s',
    (hash) => {
      expect(parseShareHash(hash)).toBeNull();
    },
  );
});

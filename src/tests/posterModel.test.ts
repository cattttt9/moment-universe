import { describe, expect, it } from 'vitest';
import { createUniverseConfig } from '../engine/universeGenerator';
import { createPosterArchive } from '../utils/posterModel';

describe('poster archive', () => {
  it('contains every required archive field', () => {
    const config = createUniverseConfig(
      '让此刻继续发光。',
      { energy: 55, order: 67, fluctuation: 31 },
      '2026-07-24T14:46:00.000Z',
    );
    expect(createPosterArchive(config)).toEqual({
      title: '此刻宇宙',
      text: config.text,
      createdAt: config.createdAt,
      catalogId: config.catalogId,
      universeType: config.universeType,
      parameters: { energy: 55, order: 67, fluctuation: 31 },
      signature: 'MOMENT UNIVERSE / LOCAL EDITION',
    });
  });
});

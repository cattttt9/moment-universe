import type { PosterArchive, UniverseConfig } from '../types/universe';

export function createPosterArchive(config: UniverseConfig): PosterArchive {
  return {
    title: '此刻宇宙',
    text: config.text,
    createdAt: config.createdAt,
    catalogId: config.catalogId,
    universeType: config.universeType,
    parameters: {
      energy: config.energy,
      order: config.order,
      fluctuation: config.fluctuation,
    },
    signature: 'MOMENT UNIVERSE / LOCAL EDITION',
  };
}

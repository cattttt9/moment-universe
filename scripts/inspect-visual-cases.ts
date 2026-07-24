import { createUniverseConfig, generateUniverseBlueprint } from '../src/engine/universeGenerator';

const cases = [
  ['A', '我想重新开始', 20, 90, 20],
  ['B', '今天一切都失控了', 85, 15, 95],
  ['C', '背景动效不足，如何美化页面？', 75, 84, 85],
] as const;

for (const [name, text, energy, order, fluctuation] of cases) {
  const config = createUniverseConfig(
    text,
    { energy, order, fluctuation },
    '2026-07-25T00:00:00.000Z',
  );
  const blueprint = generateUniverseBlueprint(config, 'low');
  process.stdout.write(
    `${JSON.stringify({
      name,
      seed: config.seed,
      universeType: config.universeType,
      archetype: blueprint.profile.archetype,
      palette: blueprint.palette.name,
      coreCount: blueprint.coreCount,
      armCount: blueprint.armCount,
      cameraPreset: blueprint.profile.cameraPreset,
      orientation: blueprint.profile.orientation,
      scale: Number(blueprint.profile.scale.toFixed(3)),
      spread: Number(blueprint.profile.spread.toFixed(3)),
      turbulence: Number(blueprint.profile.turbulence.toFixed(3)),
      particles: blueprint.particles.length,
    })}\n`,
  );
}

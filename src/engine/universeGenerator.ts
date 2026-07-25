import { QUALITY_PARTICLE_COUNTS, TEXT_LIMIT } from '../constants/universe';
import type {
  CameraPreset,
  QualityLevel,
  UniverseArchetype,
  UniverseBlueprint,
  UniverseConfig,
  CosmicPhenomenon,
  PlanetBlueprint,
  PlanetMaterial,
  UniversePalette,
  UniverseParameters,
  UniverseVisualProfile,
} from '../types/universe';
import { buildArchetypeParticles, UNIVERSE_ARCHETYPES } from './archetypes';
import { createSeededRandom } from './seededRandom';
import { countPunctuation, normalizeUniverseText, textHash } from './textHash';

const LITERARY_TYPES = [
  '缓慢坍缩的琥珀矮星',
  '尚未命名的漂流星系',
  '低能量稳定宇宙',
  '无序扩张星云',
  '被遗忘的双星系统',
  '午夜脉冲星',
  '轻微失重的行星群',
  '即将醒来的红色恒星',
  '反复绕行的小型宇宙',
  '安静燃烧的远日点',
  '尚未发送的星际信号',
  '仍在加载的未知天体',
  '越过暗面的微光星群',
  '不再偏移的黄昏轨道',
  '在寂静中生长的星核',
] as const;

const HIDDEN_TYPES = [
  '稳定复现的未知异常',
  '已提交但尚未部署',
  '正在回滚的行星系统',
  '长期运行但没有输出',
  '低电量开发者星系',
] as const;

export const UNIVERSE_PALETTES: UniversePalette[] = [
  { name: '琥珀金', core: '#f1d3a0', inner: '#c98850', outer: '#756553', haze: '#9a5b38' },
  { name: '冷灰蓝', core: '#dce6e8', inner: '#8ca4ac', outer: '#59666b', haze: '#526c75' },
  { name: '深红铜', core: '#edc0a0', inner: '#a6533f', outer: '#613d39', haze: '#7c342d' },
  { name: '青绿色', core: '#d5e4d5', inner: '#71a18f', outer: '#486c65', haze: '#32675f' },
  { name: '月白色', core: '#f0ede2', inner: '#c9c7bb', outer: '#777a78', haze: '#8b8e89' },
  { name: '暗紫灰', core: '#dfd4df', inner: '#948294', outer: '#5b5360', haze: '#59455f' },
  { name: '沙金色', core: '#ead7af', inner: '#b99a66', outer: '#706149', haze: '#86683f' },
  { name: '冰蓝色', core: '#e4f0ef', inner: '#9bbbc2', outer: '#557079', haze: '#487986' },
];

const CAMERA_PRESETS: CameraPreset[] = [
  'left-offset',
  'right-offset',
  'diagonal',
  'close',
  'distant',
  'dual-center',
];

const PLANET_MATERIALS: PlanetMaterial[] = ['rock', 'gas', 'ice', 'volcanic', 'ocean'];

const PHENOMENA: CosmicPhenomenon[] = [
  'comet',
  'lensing',
  'rift',
  'black-hole',
  'supernova-remnant',
  'dust-wind',
  'orbital-resonance',
];

const MAIN_STARS = [
  '低温橙星',
  '银白主序星',
  '青色亚巨星',
  '暗红矮星',
  '冰白脉冲星',
  '双生金色恒星',
] as const;

const GRAVITY_TENDENCIES = [
  '缓慢坍缩',
  '稳定绕行',
  '轻微扩张',
  '潮汐偏移',
  '双核共振',
  '局部失重',
] as const;

export function clampParameter(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeParameters(parameters: UniverseParameters): UniverseParameters {
  return {
    energy: clampParameter(parameters.energy),
    order: clampParameter(parameters.order),
    fluctuation: clampParameter(parameters.fluctuation),
  };
}

export function buildUniverseSeed(text: string, parameters: UniverseParameters, variation = '') {
  const normalized = normalizeParameters(parameters);
  return textHash(
    `${normalizeUniverseText(text)}|${normalized.energy}|${normalized.order}|${normalized.fluctuation}|${variation}`,
  );
}

export function getUniverseType(seed: string, parameters: UniverseParameters) {
  const { energy, order, fluctuation } = normalizeParameters(parameters);
  const random = createSeededRandom(`${seed}:type`);
  const hiddenResult = Number.parseInt(seed.slice(-2), 16) % 29 === 0;
  if (hiddenResult) return random.pick(HIDDEN_TYPES);
  if (energy < 28 && order > 64) return '低能量稳定宇宙';
  if (energy > 76 && fluctuation > 68) return '即将醒来的红色恒星';
  if (order < 27 && fluctuation > 62) return '无序扩张星云';
  if (order > 82 && fluctuation < 30) return '不再偏移的黄昏轨道';
  return random.pick(LITERARY_TYPES);
}

function buildCatalogId(seed: string, createdAt: string) {
  const date = new Date(createdAt);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const suffix = Number.parseInt(seed.slice(0, 5), 16) % 10000;
  return `M-${month}${day}-${String(suffix).padStart(4, '0')}`;
}

export function createUniverseConfig(
  text: string,
  parameters: UniverseParameters,
  createdAt = new Date().toISOString(),
  variation = '',
): UniverseConfig {
  const normalizedText = normalizeUniverseText(text).slice(0, TEXT_LIMIT);
  if (!normalizedText) throw new Error('生成宇宙需要至少一个可见字符。');
  const normalized = normalizeParameters(parameters);
  const seed = buildUniverseSeed(normalizedText, normalized, variation);
  return {
    text: normalizedText,
    seed,
    ...normalized,
    createdAt,
    universeType: getUniverseType(seed, normalized),
    catalogId: buildCatalogId(seed, createdAt),
  };
}

export function selectUniverseArchetype(seed: string): UniverseArchetype {
  const index = Number.parseInt(seed.slice(0, 8), 16) % UNIVERSE_ARCHETYPES.length;
  return UNIVERSE_ARCHETYPES[index]!;
}

export function generateVisualProfile(config: UniverseConfig): UniverseVisualProfile {
  const random = createSeededRandom(`${config.seed}:visual-profile`);
  const archetype = selectUniverseArchetype(config.seed);
  const punctuation = countPunctuation(config.text);
  const paletteIndex = Number.parseInt(config.seed.slice(2, 8), 16) % UNIVERSE_PALETTES.length;
  const archetypeCoreCounts: Record<UniverseArchetype, number> = {
    'spiral-galaxy': 1,
    'accretion-disk': 1,
    'binary-system': 2,
    'drifting-nebula': 1 + (punctuation % 2),
    'ring-nebula': 1,
    'filament-cluster': 2 + (punctuation % 2),
    pulsar: 1,
    'void-system': 0,
  };
  return {
    archetype,
    seed: config.seed,
    palette: UNIVERSE_PALETTES[paletteIndex]!,
    coreCount: archetypeCoreCounts[archetype],
    armCount: 2 + ((Number.parseInt(config.seed.slice(4, 6), 16) + punctuation) % 5),
    orientation: {
      x: random.range(-0.55, 0.42),
      y: random.range(-0.7, 0.7),
      z: random.range(-0.38, 0.38),
    },
    scale: random.range(1.45, 1.88) + config.energy / 360,
    density: 0.72 + config.text.length / 240 + config.energy / 360,
    spread: 0.78 + config.energy / 220 + (100 - config.order) / 520,
    symmetry: config.order / 100,
    turbulence: Math.min(1, config.fluctuation / 100 + (100 - config.order) / 330),
    pulse: 0.12 + config.fluctuation / 105,
    emission: 0.55 + config.energy / 125,
    cameraPreset:
      CAMERA_PRESETS[Number.parseInt(config.seed.slice(-6), 16) % CAMERA_PRESETS.length]!,
  };
}

export function generateUniverseBlueprint(
  config: UniverseConfig,
  quality: QualityLevel = 'medium',
): UniverseBlueprint {
  const random = createSeededRandom(`${config.seed}:structure`);
  const baseCount = QUALITY_PARTICLE_COUNTS[quality];
  const lengthFactor = 0.7 + Math.min(config.text.length, TEXT_LIMIT) / 180;
  const profile = generateVisualProfile(config);
  const particleCount = Math.round(baseCount * lengthFactor * profile.density);
  const particles = buildArchetypeParticles({ config, profile, count: particleCount });
  const planetRandom = createSeededRandom(`${config.seed}:planet-system`);
  const planetCount =
    profile.archetype === 'void-system'
      ? planetRandom.integer(0, 2)
      : profile.archetype === 'binary-system'
        ? planetRandom.integer(1, 4)
        : planetRandom.integer(2, 6);
  const planets: PlanetBlueprint[] = Array.from({ length: planetCount }, (_, index) => {
    const material = planetRandom.pick(PLANET_MATERIALS);
    const orbitRadius = 1.45 + index * planetRandom.range(0.7, 1.18);
    return {
      radius: planetRandom.range(0.08, index === 0 ? 0.19 : 0.3),
      orbitRadius,
      orbitSpeed: planetRandom.range(0.035, 0.14) / Math.sqrt(orbitRadius),
      orbitTilt: planetRandom.range(-0.62, 0.62),
      phase: planetRandom.range(0, Math.PI * 2),
      rotationSpeed: planetRandom.range(-0.42, 0.58),
      color: planetRandom.pick([
        profile.palette.inner,
        profile.palette.outer,
        profile.palette.core,
        profile.palette.haze,
      ]),
      accent: planetRandom.pick([
        profile.palette.core,
        profile.palette.inner,
        '#c7d5d7',
        '#8d5c43',
        '#6c8d87',
      ]),
      material,
      atmosphere: planetRandom.range(0.08, material === 'gas' ? 0.82 : 0.55),
      ring: index > 0 && planetRandom.next() < 0.24,
      moons: planetRandom.next() < 0.34 ? planetRandom.integer(1, 2) : 0,
    };
  });
  const phenomenonRandom = createSeededRandom(`${config.seed}:phenomenon`);
  const phenomenon =
    phenomenonRandom.next() <
    (profile.archetype === 'void-system' || profile.archetype === 'pulsar' ? 0.84 : 0.48)
      ? phenomenonRandom.pick(PHENOMENA)
      : null;

  return {
    config,
    palette: profile.palette,
    profile,
    particles,
    coreCount: profile.coreCount,
    armCount: profile.armCount,
    orbitEccentricity: 0.15 + (1 - config.order / 100) * 0.48 + random.range(-0.04, 0.04),
    pulseRate: 0.22 + config.fluctuation / 125 + config.energy / 480,
    planets,
    record: {
      mainStar:
        profile.archetype === 'binary-system'
          ? '双生金色恒星'
          : random.pick(MAIN_STARS.filter((name) => name !== '双生金色恒星')),
      gravityTendency: random.pick(GRAVITY_TENDENCIES),
      stabilityIndex: clampParameter(46 + config.order * 0.46 + random.range(-8, 8)),
      unobservedRegion: clampParameter(18 + (100 - config.energy) * 0.42 + random.range(-6, 10)),
      phenomenon,
    },
  };
}

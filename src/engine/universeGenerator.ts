import { QUALITY_PARTICLE_COUNTS, TEXT_LIMIT } from '../constants/universe';
import type {
  ParticleBlueprint,
  QualityLevel,
  UniverseBlueprint,
  UniverseConfig,
  UniversePalette,
  UniverseParameters,
} from '../types/universe';
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

const PALETTES: UniversePalette[] = [
  { core: '#f2d29b', inner: '#c27649', outer: '#5f5145', haze: '#8a4f32' },
  { core: '#f0c6a1', inner: '#a85a43', outer: '#555c55', haze: '#693a30' },
  { core: '#e9d7b6', inner: '#b89a72', outer: '#6d645b', haze: '#6f543d' },
  { core: '#f1b879', inner: '#b7633e', outer: '#4f5c56', haze: '#824326' },
  { core: '#e8c8ad', inner: '#976c58', outer: '#5d5550', haze: '#62443b' },
];

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

export function buildUniverseSeed(text: string, parameters: UniverseParameters) {
  const normalized = normalizeParameters(parameters);
  return textHash(
    `${normalizeUniverseText(text)}|${normalized.energy}|${normalized.order}|${normalized.fluctuation}`,
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
): UniverseConfig {
  const normalizedText = normalizeUniverseText(text).slice(0, TEXT_LIMIT);
  if (!normalizedText) throw new Error('生成宇宙需要至少一个可见字符。');
  const normalized = normalizeParameters(parameters);
  const seed = buildUniverseSeed(normalizedText, normalized);
  return {
    text: normalizedText,
    seed,
    ...normalized,
    createdAt,
    universeType: getUniverseType(seed, normalized),
    catalogId: buildCatalogId(seed, createdAt),
  };
}

function createParticle(
  index: number,
  count: number,
  config: UniverseConfig,
  armCount: number,
): ParticleBlueprint {
  const random = createSeededRandom(`${config.seed}:particle:${index}`);
  const normalizedRadius = Math.pow((index + random.next()) / count, 0.58);
  const order = config.order / 100;
  const fluctuation = config.fluctuation / 100;
  const arm = index % armCount;
  const baseAngle = (arm / armCount) * Math.PI * 2;
  const spiral = normalizedRadius * (3.5 + order * 4.8);
  const angle = baseAngle + spiral + random.signed() * (1.25 - order * 0.95);
  const radius = 0.25 + normalizedRadius * (4.5 + config.energy * 0.018);
  const flattening = 0.24 + (1 - order) * 0.34;
  const turbulence = random.signed() * fluctuation * normalizedRadius * 1.1;

  return {
    x: Math.cos(angle) * radius + turbulence,
    y: random.signed() * flattening * (0.3 + normalizedRadius) + turbulence * 0.2,
    z: Math.sin(angle) * radius + random.signed() * (1 - order) * 0.65,
    size: random.range(0.55, 1.85) * (0.8 + config.energy / 180),
    phase: random.range(0, Math.PI * 2),
    branch: arm,
    brightness: random.range(0.45, 1) * (0.65 + config.energy / 180),
  };
}

export function generateUniverseBlueprint(
  config: UniverseConfig,
  quality: QualityLevel = 'medium',
): UniverseBlueprint {
  const random = createSeededRandom(`${config.seed}:structure`);
  const punctuation = countPunctuation(config.text);
  const baseCount = QUALITY_PARTICLE_COUNTS[quality];
  const lengthFactor = 0.7 + Math.min(config.text.length, TEXT_LIMIT) / 180;
  const particleCount = Math.round(baseCount * lengthFactor);
  const armCount = 2 + ((Number.parseInt(config.seed.slice(0, 2), 16) + punctuation) % 4);
  const coreCount = 1 + Math.min(2, punctuation % 3);
  const palette = PALETTES[Number.parseInt(config.seed.slice(2, 4), 16) % PALETTES.length]!;
  const particles: ParticleBlueprint[] = Array.from({ length: particleCount }, (_, index) =>
    createParticle(index, particleCount, config, armCount),
  );

  return {
    config,
    palette,
    particles,
    coreCount,
    armCount,
    orbitEccentricity: 0.15 + (1 - config.order / 100) * 0.48 + random.range(-0.04, 0.04),
    pulseRate: 0.22 + config.fluctuation / 125 + config.energy / 480,
  };
}

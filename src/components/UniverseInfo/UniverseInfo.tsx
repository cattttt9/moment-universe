import type { CosmicPhenomenon, QualityLevel, UniverseBlueprint } from '../../types/universe';
import styles from './UniverseInfo.module.css';

interface UniverseInfoProps {
  blueprint: UniverseBlueprint;
  quiet: boolean;
  visible: boolean;
  quality: QualityLevel;
  audioEnabled: boolean;
  onQuietToggle: () => void;
  onAudioToggle: () => void;
  onQualityChange: (quality: QualityLevel) => void;
  onSave: () => void;
  onEdit: () => void;
  onRestart: () => void;
  onShare: () => void;
}

const PHENOMENON_NAMES: Record<CosmicPhenomenon, string> = {
  comet: '掠过的彗星',
  lensing: '引力透镜',
  rift: '空间裂隙',
  'black-hole': '黑洞轮廓',
  'supernova-remnant': '超新星余辉',
  'dust-wind': '星尘风',
  'orbital-resonance': '轨道共振',
};

const QUALITY_NAMES: Record<QualityLevel, string> = {
  high: '高画质',
  medium: '平衡',
  low: '流畅',
};

export function UniverseInfo({
  blueprint,
  quiet,
  visible,
  quality,
  audioEnabled,
  onQuietToggle,
  onAudioToggle,
  onQualityChange,
  onSave,
  onEdit,
  onRestart,
  onShare,
}: UniverseInfoProps) {
  const { config, record } = blueprint;
  const createdAt = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(config.createdAt))
    .replace(/\//g, '.');
  const qualitySequence: QualityLevel[] = ['high', 'medium', 'low'];
  const nextQuality =
    qualitySequence[(qualitySequence.indexOf(quality) + 1) % qualitySequence.length]!;

  return (
    <div
      className={`${styles.info} ${quiet ? styles.quiet : ''} ${
        visible ? styles.visible : styles.hidden
      }`}
    >
      <header>
        <span>MOMENT UNIVERSE / OBSERVATION ARCHIVE</span>
        <strong>{config.catalogId}</strong>
      </header>
      <section>
        <p className={styles.type}>{config.universeType}</p>
        <blockquote>「{config.text}」</blockquote>
        <dl>
          <div>
            <dt>诞生时刻</dt>
            <dd>{createdAt}</dd>
          </div>
          <div>
            <dt>引力倾向</dt>
            <dd>{record.gravityTendency}</dd>
          </div>
          <div>
            <dt>主恒星</dt>
            <dd>{record.mainStar}</dd>
          </div>
          <div>
            <dt>稳定指数</dt>
            <dd>{record.stabilityIndex}%</dd>
          </div>
          <div>
            <dt>未观测区域</dt>
            <dd>{record.unobservedRegion}%</dd>
          </div>
          <div>
            <dt>稀有现象</dt>
            <dd>{record.phenomenon ? PHENOMENON_NAMES[record.phenomenon] : '未检出'}</dd>
          </div>
        </dl>
        <p className={styles.seed}>SEED / {config.seed.toUpperCase()}</p>
      </section>
      <footer>
        <button type="button" onClick={onAudioToggle}>
          声音 {audioEnabled ? '开' : '关'}
        </button>
        <button type="button" onClick={() => onQualityChange(nextQuality)}>
          {QUALITY_NAMES[quality]}
        </button>
        <button type="button" onClick={onQuietToggle}>
          {quiet ? '退出静谧' : '静谧模式'}
        </button>
        <button type="button" onClick={onEdit}>
          返回修改
        </button>
        <button type="button" onClick={onRestart}>
          重新校准
        </button>
        <button type="button" onClick={onShare}>
          分享链接
        </button>
        <button className={styles.save} type="button" onClick={onSave}>
          保存此刻
        </button>
      </footer>
    </div>
  );
}

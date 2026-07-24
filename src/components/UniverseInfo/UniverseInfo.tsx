import type { UniverseConfig } from '../../types/universe';
import styles from './UniverseInfo.module.css';

interface UniverseInfoProps {
  config: UniverseConfig;
  quiet: boolean;
  onQuietToggle: () => void;
  onSave: () => void;
  onEdit: () => void;
  onRestart: () => void;
}

export function UniverseInfo({
  config,
  quiet,
  onQuietToggle,
  onSave,
  onEdit,
  onRestart,
}: UniverseInfoProps) {
  return (
    <div className={`${styles.info} ${quiet ? styles.quiet : ''}`}>
      <header>
        <span>MOMENT UNIVERSE ARCHIVE</span>
        <strong>{config.catalogId}</strong>
      </header>
      <section>
        <p className={styles.type}>{config.universeType}</p>
        <blockquote>「{config.text}」</blockquote>
        <dl>
          <div>
            <dt>能量</dt>
            <dd>{config.energy}</dd>
          </div>
          <div>
            <dt>秩序</dt>
            <dd>{config.order}</dd>
          </div>
          <div>
            <dt>波动</dt>
            <dd>{config.fluctuation}</dd>
          </div>
        </dl>
      </section>
      <footer>
        <button type="button" onClick={onQuietToggle}>
          {quiet ? '退出静谧' : '静谧模式'}
        </button>
        <button type="button" onClick={onEdit}>
          返回修改
        </button>
        <button type="button" onClick={onRestart}>
          重新生成
        </button>
        <button className={styles.save} type="button" onClick={onSave}>
          保存此刻
        </button>
      </footer>
    </div>
  );
}

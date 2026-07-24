import type { UniverseBlueprint } from '../../types/universe';
import { UniverseInfo } from '../UniverseInfo/UniverseInfo';
import styles from './UniverseResult.module.css';

interface UniverseResultProps {
  blueprint: UniverseBlueprint;
  quiet: boolean;
  onQuietToggle: () => void;
  onSave: () => void;
  onEdit: () => void;
  onRestart: () => void;
}

export function UniverseResult({
  blueprint,
  quiet,
  onQuietToggle,
  onSave,
  onEdit,
  onRestart,
}: UniverseResultProps) {
  return (
    <main className={styles.screen}>
      <div
        className={`${styles.placeholder} ${quiet ? styles.placeholderQuiet : ''}`}
        style={
          {
            '--core': blueprint.palette.core,
            '--inner': blueprint.palette.inner,
            '--outer': blueprint.palette.outer,
          } as React.CSSProperties
        }
        aria-label="星云交互画布将在下一开发阶段接入"
      >
        <span />
        <i />
      </div>
      <UniverseInfo
        config={blueprint.config}
        quiet={quiet}
        onQuietToggle={onQuietToggle}
        onSave={onSave}
        onEdit={onEdit}
        onRestart={onRestart}
      />
      <p className={styles.hint}>移动以扰动 · 长按以聚集 · 双击产生脉冲 · 滚动缩放</p>
    </main>
  );
}

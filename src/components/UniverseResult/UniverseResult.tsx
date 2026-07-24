import { useState } from 'react';
import type { QualityLevel, UniverseBlueprint } from '../../types/universe';
import { PosterExporter } from '../PosterExporter/PosterExporter';
import { UniverseInfo } from '../UniverseInfo/UniverseInfo';
import styles from './UniverseResult.module.css';

interface UniverseResultProps {
  blueprint: UniverseBlueprint;
  quality: QualityLevel;
  quiet: boolean;
  onQuietToggle: () => void;
  onSave: () => void;
  onEdit: () => void;
  onRestart: () => void;
  captureScene: () => string | null;
  revealed: boolean;
  onHideReveal: () => void;
}

export function UniverseResult({
  blueprint,
  quality,
  quiet,
  onQuietToggle,
  onSave,
  onEdit,
  onRestart,
  captureScene,
  revealed,
  onHideReveal,
}: UniverseResultProps) {
  const [posterOpen, setPosterOpen] = useState(false);
  const [sceneDataUrl, setSceneDataUrl] = useState<string | null>(null);

  const save = () => {
    onSave();
    setSceneDataUrl(captureScene());
    setPosterOpen(true);
  };

  return (
    <main className={styles.screen}>
      <span className={styles.quality} aria-hidden="true">
        {quality.toUpperCase()} FIELD
      </span>
      <UniverseInfo
        config={blueprint.config}
        quiet={quiet}
        onQuietToggle={onQuietToggle}
        onSave={save}
        onEdit={onEdit}
        onRestart={onRestart}
      />
      <p className={styles.hint}>移动以扰动 · 长按以聚集 · 双击产生脉冲 · 滚动缩放</p>
      {revealed && (
        <button type="button" className={styles.reveal} onClick={onHideReveal}>
          「{blueprint.config.text}」
        </button>
      )}
      <PosterExporter
        open={posterOpen}
        blueprint={blueprint}
        sceneDataUrl={sceneDataUrl}
        onClose={() => setPosterOpen(false)}
      />
    </main>
  );
}

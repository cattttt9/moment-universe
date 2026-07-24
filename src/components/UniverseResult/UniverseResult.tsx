import { lazy, Suspense, useRef, useState } from 'react';
import type { QualityLevel, UniverseBlueprint } from '../../types/universe';
import { PosterExporter } from '../PosterExporter/PosterExporter';
import type { UniverseCanvasHandle } from '../UniverseCanvas/UniverseCanvas';
import { UniverseInfo } from '../UniverseInfo/UniverseInfo';
import styles from './UniverseResult.module.css';

const UniverseCanvas = lazy(async () => {
  const module = await import('../UniverseCanvas/UniverseCanvas');
  return { default: module.UniverseCanvas };
});

interface UniverseResultProps {
  blueprint: UniverseBlueprint;
  quality: QualityLevel;
  quiet: boolean;
  onQuietToggle: () => void;
  onSave: () => void;
  onEdit: () => void;
  onRestart: () => void;
}

export function UniverseResult({
  blueprint,
  quality,
  quiet,
  onQuietToggle,
  onSave,
  onEdit,
  onRestart,
}: UniverseResultProps) {
  const canvasRef = useRef<UniverseCanvasHandle>(null);
  const [posterOpen, setPosterOpen] = useState(false);
  const [sceneDataUrl, setSceneDataUrl] = useState<string | null>(null);

  const save = () => {
    onSave();
    setSceneDataUrl(canvasRef.current?.capture() ?? null);
    setPosterOpen(true);
  };

  return (
    <main className={styles.screen}>
      <Suspense
        fallback={
          <div className={styles.loading} role="status">
            <span aria-hidden="true">·</span>
            正在点亮星核
          </div>
        }
      >
        <UniverseCanvas ref={canvasRef} blueprint={blueprint} quality={quality} quiet={quiet} />
      </Suspense>
      <UniverseInfo
        config={blueprint.config}
        quiet={quiet}
        onQuietToggle={onQuietToggle}
        onSave={save}
        onEdit={onEdit}
        onRestart={onRestart}
      />
      <p className={styles.hint}>移动以扰动 · 长按以聚集 · 双击产生脉冲 · 滚动缩放</p>
      <PosterExporter
        open={posterOpen}
        blueprint={blueprint}
        sceneDataUrl={sceneDataUrl}
        onClose={() => setPosterOpen(false)}
      />
    </main>
  );
}

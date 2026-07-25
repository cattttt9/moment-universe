import { useEffect, useRef, useState } from 'react';
import type { QualityLevel, UniverseBlueprint } from '../../types/universe';
import { createShareHash } from '../../utils/shareParams';
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
  audioEnabled: boolean;
  onAudioToggle: () => void;
  onQualityChange: (quality: QualityLevel) => void;
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
  audioEnabled,
  onAudioToggle,
  onQualityChange,
}: UniverseResultProps) {
  const [posterOpen, setPosterOpen] = useState(false);
  const [sceneDataUrl, setSceneDataUrl] = useState<string | null>(null);
  const [hudVisible, setHudVisible] = useState(true);
  const [shareStatus, setShareStatus] = useState('');
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const revealHud = () => {
      setHudVisible(true);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setHudVisible(false), 3200);
    };
    revealHud();
    window.addEventListener('pointermove', revealHud, { passive: true });
    window.addEventListener('pointerdown', revealHud, { passive: true });
    window.addEventListener('keydown', revealHud);
    return () => {
      window.removeEventListener('pointermove', revealHud);
      window.removeEventListener('pointerdown', revealHud);
      window.removeEventListener('keydown', revealHud);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const save = () => {
    onSave();
    setSceneDataUrl(captureScene());
    setPosterOpen(true);
  };

  const share = async () => {
    const hash = createShareHash(blueprint.config);
    const url = `${window.location.href.split('#')[0]}${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('观测链接已复制');
    } catch {
      window.history.replaceState(null, '', hash);
      setShareStatus('链接已写入地址栏');
    }
    window.setTimeout(() => setShareStatus(''), 2200);
  };

  return (
    <main className={styles.screen}>
      <span className={styles.quality} aria-hidden="true">
        {quality.toUpperCase()} FIELD
      </span>
      <UniverseInfo
        blueprint={blueprint}
        quiet={quiet}
        visible={hudVisible}
        quality={quality}
        audioEnabled={audioEnabled}
        onQuietToggle={onQuietToggle}
        onAudioToggle={onAudioToggle}
        onQualityChange={onQualityChange}
        onSave={save}
        onEdit={onEdit}
        onRestart={onRestart}
        onShare={share}
      />
      <p className={styles.hint}>移动以扰动 · 长按以聚集 · 双击产生脉冲 · 滚动缩放</p>
      {revealed && (
        <button type="button" className={styles.reveal} onClick={onHideReveal}>
          「{blueprint.config.text}」
        </button>
      )}
      {shareStatus && (
        <p className={styles.toast} role="status">
          {shareStatus}
        </p>
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

import { useEffect, useRef, useState } from 'react';
import type { UniverseBlueprint } from '../../types/universe';
import { canvasToPngBlob, renderPoster } from '../../utils/posterExporter';
import styles from './PosterExporter.module.css';

interface PosterExporterProps {
  open: boolean;
  blueprint: UniverseBlueprint;
  sceneDataUrl: string | null;
  onClose: () => void;
}

export function PosterExporter({ open, blueprint, sceneDataUrl, onClose }: PosterExporterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'idle' | 'rendering' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    setStatus('rendering');
    setMessage('正在整理星云画面与档案文字…');
    const prepare = async () => {
      try {
        if ('fonts' in document) await document.fonts.ready;
        await renderPoster(canvas, blueprint, sceneDataUrl);
        if (!cancelled) {
          setStatus('ready');
          setMessage('3:4 高分辨率档案已准备好。');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setMessage(error instanceof Error ? error.message : '海报生成失败，请重试。');
        }
      }
    };
    void prepare();
    return () => {
      cancelled = true;
    };
  }, [blueprint, open, sceneDataUrl]);

  if (!open) return null;

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      setMessage('正在写入 PNG…');
      const blob = await canvasToPngBlob(canvas);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `此刻宇宙-${blueprint.config.catalogId}.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus('ready');
      setMessage('PNG 已交给浏览器下载。若未出现，请允许下载后重试。');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'PNG 导出失败，请重试。');
    }
  };

  return (
    <div className={styles.backdrop}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="poster-title"
      >
        <header>
          <div>
            <p>ARCHIVE EXPORT / 3:4</p>
            <h2 id="poster-title">保存此刻</h2>
          </div>
          <button type="button" aria-label="关闭海报预览" onClick={onClose}>
            ×
          </button>
        </header>
        <div className={styles.preview}>
          <canvas ref={canvasRef} aria-label="此刻宇宙档案海报预览" />
          {status === 'rendering' && <span className={styles.loading}>正在显影…</span>}
        </div>
        <footer>
          <div>
            <strong>1800 × 2400 PNG</strong>
            <span className={status === 'error' ? styles.error : ''} role="status">
              {message}
            </span>
          </div>
          <button
            className="primary-action"
            type="button"
            disabled={status !== 'ready'}
            onClick={() => void download()}
          >
            <span>下载 PNG</span>
            <span aria-hidden="true">↓</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

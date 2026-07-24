import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './GenerationTransition.module.css';

interface GenerationTransitionProps {
  text: string;
  onComplete: () => void;
}

const statuses = ['正在采样文字微光', '校准引力与轨道', '等待星核出现', '宇宙已形成'];

export function GenerationTransition({ text, onComplete }: GenerationTransitionProps) {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = reducedMotion ? 650 : 3800;
    const start = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const next = Math.min(1, (now - start) / duration);
      setProgress(next);
      if (next >= 1) {
        window.setTimeout(onComplete, reducedMotion ? 20 : 260);
      } else {
        frame = window.requestAnimationFrame(update);
      }
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [onComplete, reducedMotion]);

  const statusIndex = Math.min(statuses.length - 1, Math.floor(progress * statuses.length));

  return (
    <main className={styles.screen} aria-live="polite">
      <button className={styles.skip} type="button" onClick={onComplete}>
        跳过生成动画
      </button>
      <div className={styles.collapse} style={{ '--progress': progress } as React.CSSProperties}>
        <p className={styles.sentence}>{text}</p>
        <div className={styles.core} aria-hidden="true" />
      </div>
      <div className={styles.status}>
        <span>{String(Math.round(progress * 100)).padStart(3, '0')}%</span>
        <p>{statuses[statusIndex]}</p>
        <div>
          <i style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </main>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { TextParticleTransition } from './TextParticleTransition';
import styles from './GenerationTransition.module.css';

interface GenerationTransitionProps {
  text: string;
  onComplete: () => void;
}

const statuses = ['正在采样文字微光', '校准引力与轨道', '等待星核出现', '宇宙已形成'];

export function GenerationTransition({ text, onComplete }: GenerationTransitionProps) {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const state = { progress: 0 };
    const tween = gsap.to(state, {
      progress: 1,
      duration: reducedMotion ? 0.55 : 4.2,
      ease: reducedMotion ? 'none' : 'power2.inOut',
      onUpdate: () => setProgress(state.progress),
      onComplete: () => window.setTimeout(complete, reducedMotion ? 20 : 180),
    });
    return () => {
      tween.kill();
    };
  }, [complete, reducedMotion]);

  const statusIndex = Math.min(statuses.length - 1, Math.floor(progress * statuses.length));

  return (
    <main className={styles.screen} aria-live="polite">
      <button className={styles.skip} type="button" onClick={complete}>
        跳过生成动画
      </button>
      <TextParticleTransition text={text} progress={progress} reducedMotion={reducedMotion} />
      <div className={styles.collapse} style={{ '--progress': progress } as React.CSSProperties}>
        {reducedMotion && <p className={styles.sentence}>{text}</p>}
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

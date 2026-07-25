import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { UniverseVisualProfile } from '../../types/universe';
import { TextParticleTransition } from './TextParticleTransition';
import styles from './GenerationTransition.module.css';

interface GenerationTransitionProps {
  text: string;
  profile: UniverseVisualProfile;
  onProgress?: (progress: number) => void;
  onComplete: () => void;
}

const statuses = [
  '正在读取引力参数',
  '正在归零空间',
  '正在点亮第一颗恒星',
  '正在建立恒星群',
  '正在展开轨道',
  '正在凝聚行星',
  '正在扩散星云',
  '正在生成未被观测的区域',
  '宇宙结构已稳定',
];

export function GenerationTransition({
  text,
  profile,
  onProgress,
  onComplete,
}: GenerationTransitionProps) {
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
      onUpdate: () => {
        setProgress(state.progress);
        onProgress?.(state.progress);
      },
      onComplete: () => window.setTimeout(complete, reducedMotion ? 20 : 180),
    });
    return () => {
      tween.kill();
    };
  }, [complete, onProgress, reducedMotion]);

  const statusIndex = Math.min(statuses.length - 1, Math.floor(progress * statuses.length));

  return (
    <main className={styles.screen} aria-live="polite">
      <button className={styles.skip} type="button" onClick={complete}>
        跳过生成动画
      </button>
      <TextParticleTransition
        text={text}
        profile={profile}
        progress={progress}
        reducedMotion={reducedMotion}
      />
      <div className={styles.collapse} style={{ '--progress': progress } as React.CSSProperties}>
        {reducedMotion && <p className={styles.sentence}>{text}</p>}
        <div className={styles.core} aria-hidden="true" />
      </div>
      <div className={styles.status}>
        <span>PHASE {String(statusIndex + 1).padStart(2, '0')}</span>
        <p>{statuses[statusIndex]}</p>
        <div className={styles.phaseLine} aria-hidden="true">
          {statuses.map((_, index) => (
            <i key={index} className={index <= statusIndex ? styles.phaseActive : ''} />
          ))}
        </div>
      </div>
    </main>
  );
}

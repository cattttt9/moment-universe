import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { UniverseStage as UniverseStageEngine } from '../../scene/UniverseStage';
import type {
  AppStage,
  QualityLevel,
  UniverseBlueprint,
  UniverseParameters,
} from '../../types/universe';
import styles from './UniverseStage.module.css';

export interface UniverseStageHandle {
  capture: () => string | null;
}

interface UniverseStageProps {
  stage: AppStage;
  parameters: UniverseParameters;
  blueprint: UniverseBlueprint | null;
  quality: QualityLevel;
  quiet: boolean;
  reducedMotion: boolean;
  transitionProgress: number;
  inputActivity: number;
  inputLength: number;
  introAttraction: boolean;
  onReveal: () => void;
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export const UniverseStage = forwardRef<UniverseStageHandle, UniverseStageProps>(
  function UniverseStage(props, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<UniverseStageEngine | null>(null);
    const latestPropsRef = useRef(props);
    const onRevealRef = useRef(props.onReveal);
    const [available] = useState(isWebGLAvailable);
    latestPropsRef.current = props;
    onRevealRef.current = props.onReveal;

    useImperativeHandle(ref, () => ({
      capture: () => engineRef.current?.capture() ?? null,
    }));

    useEffect(() => {
      const host = hostRef.current;
      if (!host || !available) return;
      const current = latestPropsRef.current;
      const engine = new UniverseStageEngine(
        host,
        {
          stage: current.stage,
          parameters: current.parameters,
          blueprint: current.blueprint,
          quiet: current.quiet,
          transitionProgress: current.transitionProgress,
          inputActivity: current.inputActivity,
          inputLength: current.inputLength,
          introAttraction: current.introAttraction,
        },
        current.quality,
        current.reducedMotion,
        () => onRevealRef.current(),
      );
      engineRef.current = engine;
      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    }, [available]);

    useEffect(() => {
      engineRef.current?.updateState({
        stage: props.stage,
        parameters: props.parameters,
        blueprint: props.blueprint,
        quiet: props.quiet,
        transitionProgress: props.transitionProgress,
        inputActivity: props.inputActivity,
        inputLength: props.inputLength,
        introAttraction: props.introAttraction,
      });
    }, [
      props.blueprint,
      props.inputActivity,
      props.inputLength,
      props.introAttraction,
      props.parameters,
      props.quiet,
      props.stage,
      props.transitionProgress,
    ]);

    return (
      <div ref={hostRef} className={styles.stage} aria-hidden="true">
        {!available && <div className={styles.fallback}>WebGL 不可用，将使用静态档案模式。</div>}
      </div>
    );
  },
);

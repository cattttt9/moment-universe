import { useEffect, useRef } from 'react';
import type { AppStage, UniverseParameters } from '../types/universe';

export function useCosmicAudio(enabled: boolean, stage: AppStage, parameters: UniverseParameters) {
  const parametersRef = useRef(parameters);
  parametersRef.current = parameters;
  useEffect(() => {
    if (!enabled || typeof AudioContext === 'undefined') return;
    const context = new AudioContext();
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const primary = context.createOscillator();
    const secondary = context.createOscillator();
    const secondaryGain = context.createGain();

    master.gain.value = 0.0001;
    filter.type = 'lowpass';
    const current = parametersRef.current;
    filter.frequency.value = 150 + current.energy * 1.1;
    filter.Q.value = 0.7;
    primary.type = 'sine';
    primary.frequency.value = 34 + current.order * 0.08;
    secondary.type = 'triangle';
    secondary.frequency.value = 52 + current.fluctuation * 0.11;
    secondaryGain.gain.value = 0.12;

    primary.connect(filter);
    secondary.connect(secondaryGain);
    secondaryGain.connect(filter);
    filter.connect(master);
    master.connect(context.destination);
    primary.start();
    secondary.start();

    const now = context.currentTime;
    const stageGain =
      stage === 'universe'
        ? 0.012
        : stage === 'generating'
          ? 0.009
          : stage === 'parameters'
            ? 0.006
            : 0.004;
    master.gain.exponentialRampToValueAtTime(stageGain, now + 1.4);

    return () => {
      const end = context.currentTime + 0.16;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, end);
      primary.stop(end + 0.02);
      secondary.stop(end + 0.02);
      window.setTimeout(() => void context.close(), 220);
    };
  }, [enabled, stage]);
}

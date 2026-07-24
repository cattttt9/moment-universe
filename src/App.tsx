import { useCallback, useMemo, useRef, useState } from 'react';
import { DEFAULT_PARAMETERS } from './constants/universe';
import { GenerationTransition } from './components/GenerationTransition/GenerationTransition';
import { HistoryDrawer } from './components/HistoryDrawer/HistoryDrawer';
import { IntroScreen } from './components/IntroScreen/IntroScreen';
import { SentenceInput } from './components/SentenceInput/SentenceInput';
import { UniverseControls } from './components/UniverseControls/UniverseControls';
import { UniverseResult } from './components/UniverseResult/UniverseResult';
import { UniverseStage, type UniverseStageHandle } from './components/UniverseStage/UniverseStage';
import { createUniverseConfig, generateUniverseBlueprint } from './engine/universeGenerator';
import { useQualityLevel } from './hooks/useQualityLevel';
import { useReducedMotion } from './hooks/useReducedMotion';
import { clearHistory, loadHistory, saveUniverse } from './stores/historyStore';
import type {
  AppStage,
  StoredUniverse,
  UniverseConfig,
  UniverseParameters,
} from './types/universe';

export function App() {
  const [stage, setStage] = useState<AppStage>('intro');
  const [sentence, setSentence] = useState('');
  const [parameters, setParameters] = useState<UniverseParameters>(DEFAULT_PARAMETERS);
  const [config, setConfig] = useState<UniverseConfig | null>(null);
  const [quiet, setQuiet] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [inputActivity, setInputActivity] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [introAttraction, setIntroAttraction] = useState(false);
  const universeStageRef = useRef<UniverseStageHandle>(null);
  const quality = useQualityLevel();
  const reducedMotion = useReducedMotion();

  const blueprint = useMemo(
    () => (config ? generateUniverseBlueprint(config, quality) : null),
    [config, quality],
  );

  const beginGeneration = () => {
    setConfig(createUniverseConfig(sentence, parameters));
    setQuiet(false);
    setTransitionProgress(0);
    setRevealed(false);
    setStage('generating');
  };

  const completeGeneration = useCallback(() => setStage('universe'), []);

  const archiveCurrent = () => {
    if (!config) return;
    const next = saveUniverse(config);
    if (next) setHistory(next);
  };

  const restore = (item: StoredUniverse) => {
    setSentence(item.config.text);
    setParameters({
      energy: item.config.energy,
      order: item.config.order,
      fluctuation: item.config.fluctuation,
    });
    setConfig(item.config);
    setHistoryOpen(false);
    setStage('universe');
  };

  return (
    <>
      <UniverseStage
        ref={universeStageRef}
        stage={stage}
        parameters={parameters}
        blueprint={blueprint}
        quality={quality}
        quiet={quiet}
        reducedMotion={reducedMotion}
        transitionProgress={transitionProgress}
        inputActivity={inputActivity}
        inputLength={sentence.length}
        introAttraction={introAttraction}
        onReveal={() => setRevealed(true)}
      />
      {stage === 'intro' && (
        <IntroScreen
          onStart={() => setStage('sentence')}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={history.length}
          onAttractionChange={setIntroAttraction}
        />
      )}
      {stage === 'sentence' && (
        <SentenceInput
          value={sentence}
          onChange={setSentence}
          onActivity={setInputActivity}
          onBack={() => setStage('intro')}
          onContinue={() => setStage('parameters')}
        />
      )}
      {stage === 'parameters' && (
        <UniverseControls
          text={sentence}
          parameters={parameters}
          onChange={setParameters}
          onBack={() => setStage('sentence')}
          onGenerate={beginGeneration}
        />
      )}
      {stage === 'generating' && config && (
        <GenerationTransition
          text={config.text}
          profile={blueprint!.profile}
          onProgress={setTransitionProgress}
          onComplete={completeGeneration}
        />
      )}
      {stage === 'universe' && blueprint && (
        <UniverseResult
          blueprint={blueprint}
          quality={quality}
          quiet={quiet}
          onQuietToggle={() => setQuiet((current) => !current)}
          onSave={archiveCurrent}
          onEdit={() => setStage('sentence')}
          onRestart={() => setStage('parameters')}
          captureScene={() => universeStageRef.current?.capture() ?? null}
          revealed={revealed}
          onHideReveal={() => setRevealed(false)}
        />
      )}
      <HistoryDrawer
        open={historyOpen}
        items={history}
        onClose={() => setHistoryOpen(false)}
        onRestore={restore}
        onClear={() => {
          if (clearHistory()) setHistory([]);
        }}
      />
    </>
  );
}

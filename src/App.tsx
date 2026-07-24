import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PARAMETERS } from './constants/universe';
import { GenerationTransition } from './components/GenerationTransition/GenerationTransition';
import { HistoryDrawer } from './components/HistoryDrawer/HistoryDrawer';
import { IntroScreen } from './components/IntroScreen/IntroScreen';
import { SentenceInput } from './components/SentenceInput/SentenceInput';
import { UniverseControls } from './components/UniverseControls/UniverseControls';
import { UniverseResult } from './components/UniverseResult/UniverseResult';
import { createUniverseConfig, generateUniverseBlueprint } from './engine/universeGenerator';
import { useQualityLevel } from './hooks/useQualityLevel';
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
  const quality = useQualityLevel();

  const blueprint = useMemo(
    () => (config ? generateUniverseBlueprint(config, quality) : null),
    [config, quality],
  );

  const beginGeneration = () => {
    setConfig(createUniverseConfig(sentence, parameters));
    setQuiet(false);
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
      {stage === 'intro' && (
        <IntroScreen
          onStart={() => setStage('sentence')}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={history.length}
        />
      )}
      {stage === 'sentence' && (
        <SentenceInput
          value={sentence}
          onChange={setSentence}
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
        <GenerationTransition text={config.text} onComplete={completeGeneration} />
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

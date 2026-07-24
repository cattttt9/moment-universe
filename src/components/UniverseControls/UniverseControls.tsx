import { PARAMETER_COPY } from '../../constants/universe';
import type { UniverseParameters } from '../../types/universe';
import { OrbitDial } from '../OrbitDial/OrbitDial';
import { StageFrame } from '../StageFrame/StageFrame';
import styles from './UniverseControls.module.css';

interface UniverseControlsProps {
  text: string;
  parameters: UniverseParameters;
  onChange: (parameters: UniverseParameters) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export function UniverseControls({
  text,
  parameters,
  onChange,
  onBack,
  onGenerate,
}: UniverseControlsProps) {
  const setParameter = (key: keyof UniverseParameters, value: number) => {
    onChange({ ...parameters, [key]: Math.max(0, Math.min(100, Math.round(value))) });
  };

  return (
    <StageFrame stageNumber="02" kicker="CALIBRATE THE PRESENT" onBack={onBack}>
      <section className={styles.section}>
        <header className={styles.intro}>
          <div>
            <h2>校准此刻的引力</h2>
            <p>拖动轨道上的微小天体。数值只塑造星云，不解释你。</p>
          </div>
          <blockquote>「{text}」</blockquote>
        </header>
        <div className={styles.controls}>
          {(Object.keys(PARAMETER_COPY) as (keyof UniverseParameters)[]).map((key) => (
            <OrbitDial
              key={key}
              {...PARAMETER_COPY[key]}
              value={parameters[key]}
              onChange={(value) => setParameter(key, value)}
            />
          ))}
        </div>
        <footer className={styles.footer}>
          <p>键盘操作：聚焦任一轨道后，使用方向键调整；Page Up / Page Down 可大幅调整。</p>
          <button className="primary-action" type="button" onClick={onGenerate}>
            <span>生成我的宇宙</span>
            <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </section>
    </StageFrame>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { GravityCalibrationState, UniverseParameters } from '../../types/universe';
import { StageFrame } from '../StageFrame/StageFrame';
import styles from './UniverseControls.module.css';

interface UniverseControlsProps {
  text: string;
  parameters: UniverseParameters;
  calibration: GravityCalibrationState;
  onBack: () => void;
  onGenerate: () => void;
}

const bodyLabels = [
  {
    id: 'memory',
    name: '记忆',
    english: 'MEMORY',
    parameter: '能量',
    parameterKey: 'energy',
    color: '#cf936e',
  },
  {
    id: 'moment',
    name: '此刻',
    english: 'PRESENT',
    parameter: '秩序',
    parameterKey: 'order',
    color: '#ded7cb',
  },
  {
    id: 'future',
    name: '尚未发生',
    english: 'UNWRITTEN',
    parameter: '波动',
    parameterKey: 'fluctuation',
    color: '#78a5a1',
  },
] as const;

export function UniverseControls({
  text,
  parameters,
  calibration,
  onBack,
  onGenerate,
}: UniverseControlsProps) {
  const holdTimerRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);
  const holdStartedRef = useRef(0);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
    },
    [],
  );

  const cancelHold = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
    holdTimerRef.current = null;
    holdFrameRef.current = null;
    holdStartedRef.current = 0;
    setHoldProgress(0);
  };

  const startHold = () => {
    if (!calibration.stable) return;
    cancelHold();
    holdStartedRef.current = performance.now();
    const update = () => {
      setHoldProgress(Math.min(1, (performance.now() - holdStartedRef.current) / 1200));
      holdFrameRef.current = requestAnimationFrame(update);
    };
    holdFrameRef.current = requestAnimationFrame(update);
    holdTimerRef.current = window.setTimeout(() => {
      cancelHold();
      onGenerate();
    }, 1200);
  };

  return (
    <StageFrame
      stageNumber="02"
      kicker="GRAVITY CALIBRATION / LIVE FIELD"
      onBack={onBack}
      className={styles.frame}
    >
      <section className={styles.section}>
        <header className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>THREE BODY OBSERVATION</p>
            <h2>校准此刻的引力</h2>
            <p>拖动三颗天体改变参数；离场心越远，数值越高。</p>
          </div>
          <blockquote>「{text}」</blockquote>
        </header>

        <div className={styles.legend} aria-label="三颗校准天体">
          {bodyLabels.map((body) => (
            <div
              key={body.id}
              className={calibration.dragging === body.id ? styles.activeBody : ''}
            >
              <i style={{ '--body-color': body.color } as React.CSSProperties} />
              <span>
                {body.name}
                <b>控制{body.parameter}</b>
              </span>
              <small>{body.english}</small>
            </div>
          ))}
        </div>

        <div className={styles.readout} aria-live="polite">
          <div className={styles.score}>
            <span>GRAVITY STABILITY</span>
            <strong>{String(calibration.score).padStart(2, '0')}</strong>
            <i style={{ '--score': `${calibration.score}%` } as React.CSSProperties} />
          </div>
          <div className={styles.state}>
            <span className={calibration.stable ? styles.stable : ''} />
            <p>
              {calibration.stable
                ? '引力已稳定 · 长按中心光核完成校准'
                : '结构仍在漂移 · 调整距离与三角关系'}
            </p>
          </div>
          <button
            className={styles.generateAction}
            type="button"
            disabled={!calibration.stable}
            style={{ '--hold-progress': holdProgress } as React.CSSProperties}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              startHold();
            }}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onPointerLeave={(event) => {
              if (event.buttons === 0) cancelHold();
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && calibration.stable) {
                event.preventDefault();
                onGenerate();
              }
            }}
          >
            <small>{calibration.stable ? 'CALIBRATION READY' : 'STABILIZING FIELD'}</small>
            <strong>{calibration.stable ? '长按进入下一步' : '调整至稳定结构'}</strong>
            <span>{calibration.stable ? '保持 1.2 秒，开始生成宇宙' : '稳定度达到 72 后解锁'}</span>
            <i aria-hidden="true" />
          </button>
        </div>

        <div className={styles.telemetry} aria-label="实时引力参数">
          {(
            [
              ['energy', '能量'],
              ['order', '秩序'],
              ['fluctuation', '波动'],
            ] as const
          ).map(([key, label], index) => (
            <div
              key={key}
              className={calibration.dragging === bodyLabels[index]!.id ? styles.activeMetric : ''}
              style={{ '--metric-color': bodyLabels[index]!.color } as React.CSSProperties}
            >
              <span>
                {bodyLabels[index]!.name} · {label}
              </span>
              <strong>{String(parameters[key]).padStart(2, '0')}</strong>
              <i style={{ '--metric': `${parameters[key]}%` } as React.CSSProperties} />
            </div>
          ))}
        </div>
      </section>
    </StageFrame>
  );
}

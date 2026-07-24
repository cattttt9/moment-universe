import { useRef, useState } from 'react';
import { TEXT_LIMIT } from '../../constants/universe';
import { StageFrame } from '../StageFrame/StageFrame';
import styles from './SentenceInput.module.css';

interface SentenceInputProps {
  value: string;
  onChange: (value: string) => void;
  onActivity: (activity: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function SentenceInput({
  value,
  onChange,
  onActivity,
  onBack,
  onContinue,
}: SentenceInputProps) {
  const [error, setError] = useState('');
  const lastInputAt = useRef(performance.now());

  const change = (nextValue: string) => {
    const normalized = nextValue.replace(/\r\n/g, '\n').slice(0, TEXT_LIMIT);
    const now = performance.now();
    const elapsed = Math.max(now - lastInputAt.current, 40);
    lastInputAt.current = now;
    onActivity(Math.min(10, 1400 / elapsed));
    window.setTimeout(() => {
      onActivity(0);
    }, 480);
    onChange(normalized);
    if (normalized.trim()) setError('');
  };

  const submit = () => {
    if (!value.trim()) {
      setError('请先留下一句话。哪怕只有一个字。');
      return;
    }
    onContinue();
  };

  return (
    <>
      <StageFrame stageNumber="01" kicker="LEAVE A SENTENCE" onBack={onBack}>
        <section className={styles.layout}>
          <div className={styles.prompt}>
            <span className={styles.number}>01</span>
            <h2>
              此刻，你最想留下
              <br />
              哪句话？
            </h2>
            <p>无需完整，也无需解释。它只会在你的浏览器里被看见。</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="moment-sentence">此刻想留下的话</label>
            <textarea
              id="moment-sentence"
              autoFocus
              rows={4}
              maxLength={TEXT_LIMIT}
              value={value}
              placeholder="在这里写下……"
              onChange={(event) => change(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
              }}
              aria-describedby="sentence-hint sentence-error"
              aria-invalid={Boolean(error)}
            />
            <div className={styles.rule}>
              <span className={value.length > 0 ? styles.live : ''} />
            </div>
            <div className={styles.meta}>
              <span id="sentence-hint">Ctrl / ⌘ + Enter 继续</span>
              <span className={value.length >= TEXT_LIMIT ? styles.limit : ''}>
                {String(value.length).padStart(2, '0')} / {TEXT_LIMIT}
              </span>
            </div>
            <p id="sentence-error" className={styles.error} role="alert">
              {error}
            </p>
            <button className="primary-action" type="button" onClick={submit}>
              <span>继续，校准此刻</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
      </StageFrame>
    </>
  );
}

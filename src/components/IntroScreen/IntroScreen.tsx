import styles from './IntroScreen.module.css';

interface IntroScreenProps {
  onStart: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onAttractionChange: (active: boolean) => void;
}

export function IntroScreen({
  onStart,
  onOpenHistory,
  historyCount,
  onAttractionChange,
}: IntroScreenProps) {
  return (
    <main className={styles.screen}>
      <div className={styles.index} aria-hidden="true">
        NO. 00 — PRESENT
      </div>
      <section className={styles.hero}>
        <p className={styles.kicker}>AN ORBIT FOR UNSAID THINGS</p>
        <h1>
          <span>此刻</span>
          <span>宇宙</span>
        </h1>
        <p className={styles.lead}>
          宇宙不会重复此刻。
          <small>校准你的位置，生成只属于现在的宇宙。</small>
        </p>
        <button
          className={styles.coordinate}
          type="button"
          onClick={onStart}
          onPointerEnter={() => onAttractionChange(true)}
          onPointerLeave={() => onAttractionChange(false)}
          onFocus={() => onAttractionChange(true)}
          onBlur={() => onAttractionChange(false)}
        >
          <i aria-hidden="true" />
          <span>
            <strong>激活观测坐标</strong>
            <small>HOLD THE PRESENT</small>
          </span>
        </button>
      </section>
      <footer className={styles.footer}>
        <span>所有文字只停留在此设备</span>
        <button type="button" onClick={onOpenHistory}>
          本地档案 {historyCount > 0 && `(${historyCount})`}
        </button>
      </footer>
    </main>
  );
}

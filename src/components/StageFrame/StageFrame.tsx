import type { PropsWithChildren, ReactNode } from 'react';
import styles from './StageFrame.module.css';

interface StageFrameProps extends PropsWithChildren {
  stageNumber?: string;
  kicker?: string;
  onBack?: () => void;
  aside?: ReactNode;
  className?: string;
}

export function StageFrame({
  stageNumber,
  kicker,
  onBack,
  aside,
  children,
  className = '',
}: StageFrameProps) {
  return (
    <main className={`${styles.frame} ${className}`}>
      <header className={styles.header}>
        {onBack ? (
          <button className={styles.back} type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> 返回
          </button>
        ) : (
          <span className={styles.mark}>MOMENT UNIVERSE</span>
        )}
        {stageNumber && <span className={styles.stage}>{stageNumber} / 04</span>}
      </header>
      <div className={styles.content}>
        {kicker && <p className={styles.kicker}>{kicker}</p>}
        {children}
      </div>
      {aside && <aside className={styles.aside}>{aside}</aside>}
    </main>
  );
}

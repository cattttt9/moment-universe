import { useId, useRef } from 'react';
import styles from './OrbitControl.module.css';

interface OrbitControlProps {
  label: string;
  english: string;
  description: string;
  value: number;
  low: string;
  high: string;
  onChange: (value: number) => void;
}

export function OrbitControl({
  label,
  english,
  description,
  value,
  low,
  high,
  onChange,
}: OrbitControlProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const angle = -135 + value * 2.7;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    let degrees = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (degrees < -135) degrees += 360;
    const clamped = Math.max(-135, Math.min(135, degrees));
    onChange(Math.round(((clamped + 135) / 270) * 100));
  };

  return (
    <section className={styles.control}>
      <div
        ref={trackRef}
        className={styles.dial}
        style={{ '--angle': `${angle}deg`, '--progress': `${value}%` } as React.CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event.clientX, event.clientY);
          }
        }}
      >
        <span className={styles.orbit} aria-hidden="true" />
        <span className={styles.planet} aria-hidden="true" />
        <div className={styles.value}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{english}</span>
        </div>
        <input
          id={id}
          className={styles.range}
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          aria-label={`${label}：${description}`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        <small>{description}</small>
      </label>
      <div className={styles.ends} aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </section>
  );
}

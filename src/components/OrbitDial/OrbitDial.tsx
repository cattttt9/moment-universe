import { useId, useRef, useState } from 'react';
import { angleToValue, clampOrbitValue, pointerAngle, valueToAngle } from './orbitMath';
import styles from './OrbitDial.module.css';

interface OrbitDialProps {
  label: string;
  english: string;
  description: string;
  value: number;
  low: string;
  high: string;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
}

export function OrbitDial({
  label,
  english,
  description,
  value,
  low,
  high,
  onChange,
  onChangeEnd,
}: OrbitDialProps) {
  const descriptionId = useId();
  const dialRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const pendingRef = useRef(value);
  const valueRef = useRef(value);
  const [dragging, setDragging] = useState(false);
  valueRef.current = value;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    pendingRef.current = angleToValue(pointerAngle(clientX, clientY, rect), valueRef.current);
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      valueRef.current = pendingRef.current;
      onChange(pendingRef.current);
    });
  };

  const finishDrag = (element: HTMLDivElement, pointerId: number) => {
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    draggingRef.current = false;
    setDragging(false);
    onChangeEnd?.(pendingRef.current);
  };

  const adjust = (delta: number) => {
    const next = clampOrbitValue(value + delta);
    onChange(next);
    onChangeEnd?.(next);
  };

  const angle = valueToAngle(value);

  return (
    <section className={styles.control}>
      <div
        ref={dialRef}
        className={`${styles.dial} ${dragging ? styles.dragging : ''}`}
        style={{ '--angle': `${angle}deg`, '--progress': `${value}%` } as React.CSSProperties}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-describedby={descriptionId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}，${description}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          pendingRef.current = value;
          draggingRef.current = true;
          setDragging(true);
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current || event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event.clientX, event.clientY);
          }
        }}
        onPointerUp={(event) => finishDrag(event.currentTarget, event.pointerId)}
        onPointerCancel={(event) => finishDrag(event.currentTarget, event.pointerId)}
        onKeyDown={(event) => {
          const delta =
            event.key === 'ArrowRight' || event.key === 'ArrowUp'
              ? 1
              : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                ? -1
                : event.key === 'PageUp'
                  ? 10
                  : event.key === 'PageDown'
                    ? -10
                    : event.key === 'Home'
                      ? -value
                      : event.key === 'End'
                        ? 100 - value
                        : 0;
          if (delta !== 0 || event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            adjust(delta);
          }
        }}
      >
        <span className={styles.orbit} aria-hidden="true" />
        <span className={styles.progress} aria-hidden="true" />
        <span className={styles.planetTrack} aria-hidden="true">
          <span className={styles.trail} />
          <span className={styles.planet} />
        </span>
        <span className={styles.value}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{english}</span>
        </span>
      </div>
      <div id={descriptionId} className={styles.label}>
        <span>{label}</span>
        <small>{description}</small>
      </div>
      <div className={styles.ends} aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </section>
  );
}

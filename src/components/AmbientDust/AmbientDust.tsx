import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './AmbientDust.module.css';

interface Dust {
  x: number;
  y: number;
  depth: number;
  alpha: number;
  radius: number;
}

interface AmbientDustProps {
  activity?: number;
}

export function AmbientDust({ activity = 0 }: AmbientDustProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dust: Dust[] = [];
    const count = reducedMotion ? 45 : Math.min(120, Math.floor(window.innerWidth / 10));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dust = Array.from({ length: count }, (_, index) => ({
        x: ((index * 193.7) % width) + Math.sin(index) * 12,
        y: (index * 101.3) % height,
        depth: 0.2 + ((index * 47) % 80) / 100,
        alpha: 0.1 + ((index * 31) % 45) / 100,
        radius: 0.35 + ((index * 17) % 14) / 10,
      }));
    };

    const movePointer = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX / Math.max(width, 1) - 0.5,
        y: event.clientY / Math.max(height, 1) - 0.5,
      };
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      for (const mote of dust) {
        const drift = reducedMotion ? 0 : Math.sin(time * 0.00008 + mote.x) * 5;
        const inputLift = activity * mote.depth * 16;
        const x = mote.x + pointerRef.current.x * mote.depth * 20 + drift;
        const y =
          (mote.y + time * 0.0025 * mote.depth * (1 + activity * 0.08) - inputLift) % height;
        context.beginPath();
        context.fillStyle = `rgba(211, 181, 143, ${mote.alpha})`;
        context.arc(x, y, mote.radius, 0, Math.PI * 2);
        context.fill();
      }
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', movePointer, { passive: true });
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', movePointer);
    };
  }, [activity, reducedMotion]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

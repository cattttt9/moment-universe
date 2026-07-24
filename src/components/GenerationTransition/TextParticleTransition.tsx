import { useEffect, useRef } from 'react';
import { sampleTextParticles, type TextSampleParticle } from '../../engine/textParticleSampler';
import type { UniverseVisualProfile } from '../../types/universe';
import styles from './TextParticleTransition.module.css';

interface TextParticleTransitionProps {
  text: string;
  progress: number;
  reducedMotion: boolean;
  profile: UniverseVisualProfile;
}

function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function positionFor(
  particle: TextSampleParticle,
  progress: number,
  index: number,
): { x: number; y: number; alpha: number } {
  const fracture = Math.min(1, Math.max(0, (progress - 0.12) / 0.26));
  const collapse = easeInOut(Math.min(1, Math.max(0, (progress - 0.36) / 0.28)));
  const formation = easeInOut(Math.min(1, Math.max(0, (progress - 0.69) / 0.31)));
  const jitter = Math.sin(progress * 18 + particle.phase) * fracture * 2.2;
  const fracturedX = particle.x + particle.driftX * fracture + jitter;
  const fracturedY = particle.y + particle.driftY * fracture + jitter * 0.5;
  const centerX = mix(fracturedX, window.innerWidth / 2, collapse);
  const centerY = mix(fracturedY, window.innerHeight / 2, collapse);
  return {
    x: mix(centerX, particle.targetX, formation),
    y: mix(centerY, particle.targetY, formation),
    alpha: particle.alpha * (1 - formation * 0.22) * (0.8 + (index % 7) / 35),
  };
}

export function TextParticleTransition({
  text,
  progress,
  reducedMotion,
  profile,
}: TextParticleTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TextSampleParticle[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      dimensionsRef.current = { width, height };
      particlesRef.current = sampleTextParticles(text, width, height, width <= 680, profile);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [profile, reducedMotion, text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const ratio = Math.min(window.devicePixelRatio, 1.5);
    const { width, height } = dimensionsRef.current;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';
    particlesRef.current.forEach((particle, index) => {
      const position = positionFor(particle, progress, index);
      const glow = Math.max(0, (progress - 0.56) / 0.44);
      context.beginPath();
      context.fillStyle = `rgba(${218 + Math.round(glow * 22)}, ${
        183 + Math.round(glow * 22)
      }, ${139 + Math.round(glow * 18)}, ${position.alpha})`;
      context.arc(position.x, position.y, particle.radius * (1 + glow * 0.5), 0, Math.PI * 2);
      context.fill();
    });
  }, [progress, reducedMotion]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

export interface TextSampleParticle {
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  targetX: number;
  targetY: number;
  radius: number;
  alpha: number;
  phase: number;
}

function wrapCharacters(
  context: CanvasRenderingContext2D,
  text: string,
  maximumWidth: number,
): string[] {
  const lines: string[] = [];
  let current = '';
  for (const character of [...text]) {
    if (character === '\n') {
      lines.push(current);
      current = '';
      continue;
    }
    const candidate = current + character;
    if (current && context.measureText(candidate).width > maximumWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current || lines.length === 0) lines.push(current);
  return lines.slice(0, 5);
}

function pseudoRandom(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function getTransitionTarget(
  index: number,
  width: number,
  height: number,
  profile?: UniverseVisualProfile,
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const angle = pseudoRandom(index, 1) * Math.PI * 2;
  const radius = 40 + pseudoRandom(index, 2) * Math.min(width, height) * 0.34;
  if (!profile || profile.archetype === 'spiral-galaxy') {
    return {
      x: centerX + Math.cos(angle + radius * 0.012) * radius,
      y: centerY + Math.sin(angle) * radius * 0.36,
    };
  }
  const spread = 0.78 + profile.spread * 0.22;
  switch (profile.archetype) {
    case 'accretion-disk':
      return {
        x: centerX + Math.cos(angle) * radius * spread,
        y: centerY + Math.sin(angle) * radius * 0.2,
      };
    case 'binary-system': {
      const side = index % 2 === 0 ? -1 : 1;
      const localRadius = radius * 0.48;
      return {
        x: centerX + side * width * 0.13 + Math.cos(angle) * localRadius,
        y: centerY + Math.sin(angle) * localRadius * 0.55,
      };
    }
    case 'drifting-nebula': {
      const t = pseudoRandom(index, 7) * 2 - 1;
      return {
        x: centerX + t * width * 0.34,
        y: centerY + Math.sin(t * 5.2) * height * 0.12 + Math.sin(angle) * radius * 0.12,
      };
    }
    case 'ring-nebula': {
      const ringRadius = Math.min(width, height) * (0.22 + profile.spread * 0.045);
      return {
        x: centerX + Math.cos(angle) * ringRadius,
        y: centerY + Math.sin(angle) * ringRadius * 0.62,
      };
    }
    case 'filament-cluster': {
      const t = pseudoRandom(index, 8) * 2 - 1;
      const strand = index % Math.max(3, profile.armCount);
      return {
        x: centerX + t * width * 0.35,
        y: centerY + Math.sin(t * 4 + (strand / profile.armCount) * Math.PI * 2) * height * 0.16,
      };
    }
    case 'pulsar':
      return index % 5 === 0
        ? {
            x: centerX + (pseudoRandom(index, 9) - 0.5) * 12,
            y: centerY + (pseudoRandom(index, 10) - 0.5) * height * 0.62,
          }
        : {
            x: centerX + Math.cos(angle) * radius * 0.76,
            y: centerY + Math.sin(angle) * radius * 0.18,
          };
    case 'void-system': {
      const shellRadius = Math.min(width, height) * (0.2 + pseudoRandom(index, 11) * 0.14);
      return {
        x: centerX + Math.cos(angle) * shellRadius,
        y: centerY + Math.sin(angle) * shellRadius * 0.72,
      };
    }
  }
}

export function sampleTextParticles(
  text: string,
  width: number,
  height: number,
  mobile = false,
  profile?: UniverseVisualProfile,
): TextSampleParticle[] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];

  const fontSize = Math.max(
    26,
    Math.min(mobile ? 40 : 62, width / Math.max(9, text.length * 0.66)),
  );
  const lineHeight = fontSize * 1.65;
  context.font = `300 ${fontSize}px "Noto Serif SC", "Songti SC", "SimSun", serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  const lines = wrapCharacters(context, text, width * (mobile ? 0.82 : 0.66));
  const totalHeight = (lines.length - 1) * lineHeight;
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, height / 2 - totalHeight / 2 + index * lineHeight);
  });

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const step = mobile ? 7 : 6;
  const maximum = mobile ? 900 : 1600;
  const particles: TextSampleParticle[] = [];
  for (let y = 0; y < canvas.height && particles.length < maximum; y += step) {
    for (let x = 0; x < canvas.width && particles.length < maximum; x += step) {
      const alpha = image.data[(y * canvas.width + x) * 4 + 3] ?? 0;
      if (alpha < 90) continue;
      const index = particles.length;
      const target = getTransitionTarget(index, width, height, profile);
      particles.push({
        x,
        y,
        driftX: (pseudoRandom(index, 3) - 0.5) * 90,
        driftY: (pseudoRandom(index, 4) - 0.5) * 70,
        targetX: target.x,
        targetY: target.y,
        radius: 0.55 + pseudoRandom(index, 5) * 1.2,
        alpha: 0.28 + (alpha / 255) * 0.65,
        phase: pseudoRandom(index, 6) * Math.PI * 2,
      });
    }
  }
  return particles;
}
import type { UniverseVisualProfile } from '../types/universe';

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

export function sampleTextParticles(
  text: string,
  width: number,
  height: number,
  mobile = false,
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
      const angle = pseudoRandom(index, 1) * Math.PI * 2;
      const targetRadius = 40 + pseudoRandom(index, 2) * Math.min(width, height) * 0.34;
      particles.push({
        x,
        y,
        driftX: (pseudoRandom(index, 3) - 0.5) * 90,
        driftY: (pseudoRandom(index, 4) - 0.5) * 70,
        targetX: width / 2 + Math.cos(angle + targetRadius * 0.012) * targetRadius,
        targetY: height / 2 + Math.sin(angle) * targetRadius * 0.36,
        radius: 0.55 + pseudoRandom(index, 5) * 1.2,
        alpha: 0.28 + (alpha / 255) * 0.65,
        phase: pseudoRandom(index, 6) * Math.PI * 2,
      });
    }
  }
  return particles;
}

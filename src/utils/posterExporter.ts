import type { UniverseBlueprint, UniverseConfig } from '../types/universe';

const POSTER_WIDTH = 1800;
const POSTER_HEIGHT = 2400;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('星云画面载入失败。'));
    image.src = source;
  });
}

function formatArchiveDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  const parts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}.${part('month')}.${part('day')}  ${part('hour')}:${part('minute')}`;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maximumWidth: number,
  maximumLines = 5,
) {
  const lines: string[] = [];
  let current = '';
  for (const character of [...text]) {
    if (character === '\n') {
      lines.push(current);
      current = '';
      continue;
    }
    if (current && context.measureText(current + character).width > maximumWidth) {
      lines.push(current);
      current = character;
    } else {
      current += character;
    }
    if (lines.length >= maximumLines) break;
  }
  if (current && lines.length < maximumLines) lines.push(current);
  if (lines.join('').length < text.replace(/\n/g, '').length) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex]?.slice(0, -1) ?? ''}…`;
  }
  return lines;
}

function drawDeterministicDust(context: CanvasRenderingContext2D, blueprint: UniverseBlueprint) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  const scale = 112;
  for (let index = 0; index < Math.min(blueprint.particles.length, 1400); index += 3) {
    const particle = blueprint.particles[index]!;
    const x = POSTER_WIDTH / 2 + particle.x * scale;
    const y = 960 + particle.z * scale * 0.42 + particle.y * scale;
    const radius = Math.max(0.7, particle.size * 0.8);
    context.fillStyle = `${blueprint.palette.outer}${Math.round(particle.brightness * 150)
      .toString(16)
      .padStart(2, '0')}`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawSceneImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  blueprint: UniverseBlueprint,
) {
  const region = { x: 90, y: 310, width: 1620, height: 1120 };
  const sourceRatio = image.width / image.height;
  const targetRatio = region.width / region.height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }
  context.save();
  context.globalAlpha = 0.92;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    region.x,
    region.y,
    region.width,
    region.height,
  );
  const fade = context.createLinearGradient(0, region.y, 0, region.y + region.height);
  fade.addColorStop(0, 'rgba(9, 7, 5, 0.35)');
  fade.addColorStop(0.3, 'rgba(9, 7, 5, 0)');
  fade.addColorStop(0.75, 'rgba(9, 7, 5, 0.1)');
  fade.addColorStop(1, 'rgba(9, 7, 5, 1)');
  context.fillStyle = fade;
  context.fillRect(region.x, region.y, region.width, region.height);
  context.strokeStyle = `${blueprint.palette.inner}33`;
  context.strokeRect(region.x + 0.5, region.y + 0.5, region.width - 1, region.height - 1);
  context.restore();
}

function drawArchiveCopy(context: CanvasRenderingContext2D, config: UniverseConfig) {
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#9d7f5d';
  context.font = '24px "SFMono-Regular", Consolas, monospace';
  context.letterSpacing = '6px';
  context.fillText('MOMENT UNIVERSE / ARCHIVE', 130, 155);

  context.fillStyle = '#e7dfd1';
  context.font = '300 102px "Noto Serif SC", "Songti SC", "SimSun", serif';
  context.letterSpacing = '18px';
  context.fillText('此刻宇宙', 124, 270);

  context.fillStyle = '#c9bdac';
  context.font = '300 46px "Noto Serif SC", "Songti SC", "SimSun", serif';
  context.letterSpacing = '3px';
  const quoteLines = wrapText(context, `「${config.text}」`, 1500, 5);
  const startY = 1600;
  quoteLines.forEach((line, index) => {
    context.fillText(line, 130, startY + index * 82);
  });

  const detailsY = 2065;
  context.fillStyle = '#70685f';
  context.font = '22px "SFMono-Regular", Consolas, monospace';
  context.letterSpacing = '4px';
  context.fillText(formatArchiveDate(config.createdAt), 130, detailsY);
  context.fillText(config.catalogId, 1170, detailsY);

  context.strokeStyle = 'rgba(209, 169, 118, 0.22)';
  context.beginPath();
  context.moveTo(130, detailsY + 55);
  context.lineTo(1670, detailsY + 55);
  context.stroke();

  context.fillStyle = '#a89c8d';
  context.font = '28px "Noto Serif SC", "Songti SC", "SimSun", serif';
  context.letterSpacing = '4px';
  context.fillText('宇宙状态', 130, detailsY + 130);
  context.fillStyle = '#e0d5c5';
  context.font = '34px "Noto Serif SC", "Songti SC", "SimSun", serif';
  context.fillText(config.universeType, 340, detailsY + 130);

  const metrics = [
    ['能量', config.energy],
    ['秩序', config.order],
    ['波动', config.fluctuation],
  ] as const;
  metrics.forEach(([label, value], index) => {
    const x = 1040 + index * 210;
    context.fillStyle = '#766d63';
    context.font = '20px "Noto Serif SC", "Songti SC", "SimSun", serif';
    context.fillText(label, x, detailsY + 104);
    context.fillStyle = '#c9bdac';
    context.font = '32px "SFMono-Regular", Consolas, monospace';
    context.fillText(String(value).padStart(2, '0'), x, detailsY + 148);
  });

  context.fillStyle = '#4e4943';
  context.font = '18px "SFMono-Regular", Consolas, monospace';
  context.letterSpacing = '4px';
  context.fillText('THIS IMAGE WAS GENERATED LOCALLY · 此刻宇宙', 130, 2310);
}

export async function renderPoster(
  canvas: HTMLCanvasElement,
  blueprint: UniverseBlueprint,
  sceneDataUrl: string | null,
) {
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建海报画布。');

  context.fillStyle = '#090705';
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  const glow = context.createRadialGradient(1050, 850, 0, 1050, 850, 880);
  glow.addColorStop(0, `${blueprint.palette.haze}2e`);
  glow.addColorStop(1, '#09070500');
  context.fillStyle = glow;
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  if (sceneDataUrl) {
    try {
      const image = await loadImage(sceneDataUrl);
      drawSceneImage(context, image, blueprint);
    } catch {
      drawDeterministicDust(context, blueprint);
    }
  } else {
    drawDeterministicDust(context, blueprint);
  }

  drawArchiveCopy(context, blueprint.config);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('浏览器未能生成 PNG，请重试或降低设备内存占用。'));
    }, 'image/png');
  });
}

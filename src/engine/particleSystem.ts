import * as THREE from 'three';
import type { UniverseBlueprint } from '../types/universe';

const vertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aBrightness;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFluctuation;
  uniform float uPixelRatio;
  uniform float uPulse;
  uniform float uInteraction;
  uniform float uAttract;
  uniform vec2 uPointer;
  varying float vBrightness;
  varying float vRadius;

  void main() {
    vec3 transformed = position;
    float radius = length(transformed.xz);
    float theta = uTime * uSpeed * (0.16 + 0.42 / max(radius, 0.5));
    transformed.xz = mat2(cos(theta), -sin(theta), sin(theta), cos(theta)) * transformed.xz;
    float wave = sin(uTime * (0.45 + uFluctuation) + aPhase + radius * 1.8);
    transformed.y += wave * uFluctuation * 0.16 * (0.3 + radius * 0.15);
    transformed.xz *= 1.0 + uPulse * (0.025 + 0.015 * sin(aPhase));

    vec2 pointerWorld = vec2(uPointer.x * 5.8, uPointer.y * 3.5);
    vec2 delta = transformed.xy - pointerWorld;
    float influence = smoothstep(2.2, 0.0, length(delta)) * uInteraction;
    transformed.xy += normalize(delta + vec2(0.0001)) * influence * mix(0.42, -0.32, uAttract);

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * uPixelRatio * (13.0 / max(1.0, -viewPosition.z));
    vBrightness = aBrightness * (1.0 + uPulse * 0.8 + influence * 0.35);
    vRadius = radius;
  }
`;

const fragmentShader = `
  uniform vec3 uInnerColor;
  uniform vec3 uOuterColor;
  uniform float uOpacity;
  varying float vBrightness;
  varying float vRadius;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.2);
    vec3 color = mix(uInnerColor, uOuterColor, smoothstep(0.8, 5.7, vRadius));
    gl_FragColor = vec4(color, glow * vBrightness * uOpacity);
  }
`;

export interface ParticleSystem {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  material: THREE.ShaderMaterial;
  dispose: () => void;
}

export function createParticleSystem(
  blueprint: UniverseBlueprint,
  pixelRatio: number,
): ParticleSystem {
  const count = blueprint.particles.length;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const brightness = new Float32Array(count);

  blueprint.particles.forEach((particle, index) => {
    const positionIndex = index * 3;
    positions[positionIndex] = particle.x;
    positions[positionIndex + 1] = particle.y;
    positions[positionIndex + 2] = particle.z;
    sizes[index] = particle.size;
    phases[index] = particle.phase;
    brightness[index] = particle.brightness;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0.09 + blueprint.config.energy / 620 },
      uFluctuation: { value: blueprint.config.fluctuation / 100 },
      uPixelRatio: { value: pixelRatio },
      uPulse: { value: 0 },
      uInteraction: { value: 0 },
      uAttract: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uInnerColor: { value: new THREE.Color(blueprint.palette.inner) },
      uOuterColor: { value: new THREE.Color(blueprint.palette.outer) },
      uOpacity: { value: 0.92 },
    },
  });

  const points = new THREE.Points(geometry, material);
  points.rotation.x = -0.18;
  return {
    points,
    material,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

export function createHazeTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.24, `${color}66`);
  gradient.addColorStop(1, `${color}00`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

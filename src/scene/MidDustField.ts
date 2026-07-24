import * as THREE from 'three';
import type { QualityLevel, UniverseParameters } from '../types/universe';
import { createSeededRandom } from '../engine/seededRandom';

const vertexShader = `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uTurbulence;
  uniform vec2 uPointer;
  uniform float uInteraction;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float drift = sin(uTime * uSpeed + aPhase + p.z * 0.12);
    p.x += drift * (0.08 + uTurbulence * 0.22);
    p.y += cos(uTime * uSpeed * 0.7 + aPhase) * 0.06;
    vec2 target = vec2(uPointer.x * 8.0, uPointer.y * 4.8);
    vec2 delta = p.xy - target;
    float influence = smoothstep(2.8, 0.0, length(delta)) * uInteraction;
    p.xy += normalize(delta + vec2(0.0001)) * influence * 0.34;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * uPixelRatio * (11.0 / max(1.0, -viewPosition.z));
    vAlpha = 0.25 + influence * 0.18;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.0);
    gl_FragColor = vec4(uColor, glow * vAlpha * uOpacity);
  }
`;

export class MidDustField {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

  constructor(quality: QualityLevel, pixelRatio: number) {
    const count = quality === 'high' ? 5200 : quality === 'medium' ? 3300 : 1700;
    const random = createSeededRandom('moment-universe:mid-dust:v2');
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      const cluster = index % 7;
      const centerX = Math.sin(cluster * 2.11) * 7;
      const centerY = Math.cos(cluster * 1.37) * 3.5;
      positions[index * 3] = centerX + random.signed() * random.range(1.2, 6.5);
      positions[index * 3 + 1] = centerY + random.signed() * random.range(0.8, 4.4);
      positions[index * 3 + 2] = random.range(-12, 4);
      phases[index] = random.range(0, Math.PI * 2);
      sizes[index] = random.range(0.7, 2.1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.08 },
        uTurbulence: { value: 0.3 },
        uPointer: { value: new THREE.Vector2() },
        uInteraction: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new THREE.Color('#b79b78') },
        uOpacity: { value: 0.48 },
      },
    });
    this.points = new THREE.Points(geometry, material);
  }

  setParameters(parameters: UniverseParameters) {
    this.points.material.uniforms.uSpeed!.value = 0.035 + parameters.energy / 430;
    this.points.material.uniforms.uTurbulence!.value =
      parameters.fluctuation / 100 + (100 - parameters.order) / 240;
  }

  update(time: number, pointer: THREE.Vector2, interaction: number, quiet: boolean) {
    this.points.material.uniforms.uTime!.value = time;
    this.points.material.uniforms.uPointer!.value.copy(pointer);
    this.points.material.uniforms.uInteraction!.value = interaction;
    this.points.material.uniforms.uOpacity!.value = quiet ? 0.18 : 0.48;
    this.points.rotation.y = time * 0.003;
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}

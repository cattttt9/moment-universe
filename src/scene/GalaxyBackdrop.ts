import * as THREE from 'three';
import { createSeededRandom } from '../engine/seededRandom';
import type { AppStage, QualityLevel } from '../types/universe';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + 13.7;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= 1.55;
    float bend = sin(uv.x * 2.3 + uTime * 0.006) * 0.075;
    float band = exp(-pow(abs(uv.y - bend) * 7.2, 1.45));
    float dust = fbm(uv * vec2(4.8, 11.0) + vec2(uTime * 0.002, 0.0));
    float fissure = fbm(uv * vec2(9.0, 16.0) - 8.0);
    float density = band * smoothstep(0.3, 0.92, dust) * (0.44 + fissure * 0.56);
    float core = exp(-length(uv * vec2(0.9, 3.5)) * 4.2) * 0.45;
    vec3 cool = vec3(0.20, 0.29, 0.34);
    vec3 warm = vec3(0.48, 0.31, 0.19);
    vec3 color = mix(cool, warm, smoothstep(-0.6, 0.7, uv.x));
    float alpha = (density * 0.35 + core * 0.16) * uOpacity;
    gl_FragColor = vec4(color * (0.34 + dust * 0.7), alpha);
  }
`;

export class GalaxyBackdrop {
  readonly group = new THREE.Group();
  private readonly plane: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly clusters: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;

  constructor(quality: QualityLevel) {
    const planeGeometry = new THREE.PlaneGeometry(46, 24);
    const planeMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: quality === 'low' ? 0.32 : 0.58 },
      },
    });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.plane.position.set(2.5, 1.8, -31);
    this.plane.rotation.z = -0.29;
    this.group.add(this.plane);

    const count = quality === 'high' ? 1300 : quality === 'medium' ? 820 : 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = createSeededRandom('moment-universe:galaxy-backdrop:v3');
    for (let index = 0; index < count; index += 1) {
      const x = random.range(-18, 18);
      const lane = Math.sin(x * 0.13) * 0.9 + random.signed() * random.range(0.2, 2.8);
      positions[index * 3] = x + 2.5;
      positions[index * 3 + 1] = lane + 1.4;
      positions[index * 3 + 2] = random.range(-28, -19);
      const bright = random.next() > 0.96 ? random.range(0.58, 0.88) : random.range(0.08, 0.28);
      colors[index * 3] = bright;
      colors[index * 3 + 1] = bright * random.range(0.82, 0.97);
      colors[index * 3 + 2] = bright * random.range(0.66, 0.92);
    }
    const clusterGeometry = new THREE.BufferGeometry();
    clusterGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    clusterGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const clusterMaterial = new THREE.PointsMaterial({
      size: 0.058,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.clusters = new THREE.Points(clusterGeometry, clusterMaterial);
    this.clusters.rotation.z = -0.25;
    this.group.add(this.clusters);
  }

  update(time: number, pointer: THREE.Vector2, stage: AppStage, quiet: boolean) {
    this.plane.material.uniforms.uTime!.value = time;
    const stageOpacity =
      stage === 'intro' ? 0.78 : stage === 'sentence' ? 0.56 : stage === 'universe' ? 0.82 : 0.66;
    this.plane.material.uniforms.uOpacity!.value = stageOpacity * (quiet ? 0.44 : 1);
    this.group.position.x = pointer.x * -0.12;
    this.group.position.y = pointer.y * -0.07;
    this.clusters.rotation.y = time * 0.00055;
    this.clusters.material.opacity = (stage === 'universe' ? 0.78 : 0.52) * (quiet ? 0.42 : 1);
  }

  dispose() {
    this.plane.geometry.dispose();
    this.plane.material.dispose();
    this.clusters.geometry.dispose();
    this.clusters.material.dispose();
  }
}

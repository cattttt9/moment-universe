import * as THREE from 'three';
import { createSeededRandom } from '../engine/seededRandom';

const PARTICLES_PER_CHARACTER = 5;
const MAX_CHARACTERS = 80;

export class InputEchoField {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private targetCount = 0;
  private visibleCount = 0;
  private activity = 0;

  constructor() {
    const count = MAX_CHARACTERS * PARTICLES_PER_CHARACTER;
    const random = createSeededRandom('moment-universe:input-echo:v2');
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const character = Math.floor(index / PARTICLES_PER_CHARACTER);
      const angle = character * 0.43 + random.signed() * 0.2;
      const radius = 0.8 + (character / MAX_CHARACTERS) * 3.8 + random.signed() * 0.25;
      positions[index * 3] = 2.1 + Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.42 + random.signed() * 0.2;
      positions[index * 3 + 2] = random.range(-1.2, 1.2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const material = new THREE.PointsMaterial({
      color: '#d1aa79',
      size: 0.045,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geometry, material);
  }

  setSignal(length: number, activity: number, active: boolean) {
    this.targetCount = active
      ? Math.max(0, Math.min(MAX_CHARACTERS, length)) * PARTICLES_PER_CHARACTER
      : 0;
    this.activity = activity;
  }

  update(time: number, delta: number) {
    this.visibleCount = THREE.MathUtils.damp(this.visibleCount, this.targetCount, 5.2, delta);
    this.points.geometry.setDrawRange(0, Math.round(this.visibleCount));
    this.points.material.opacity = THREE.MathUtils.damp(
      this.points.material.opacity,
      this.targetCount > 0 ? 0.34 + Math.min(0.28, this.activity * 0.025) : 0,
      4,
      delta,
    );
    this.points.rotation.z = time * (0.007 + this.activity * 0.0008);
    this.points.scale.setScalar(1 + Math.min(0.12, this.activity * 0.01));
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}

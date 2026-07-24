import * as THREE from 'three';
import type { QualityLevel } from '../types/universe';
import { createSeededRandom } from '../engine/seededRandom';

export class FarStarField {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly baseOpacity: number;

  constructor(quality: QualityLevel) {
    const count = quality === 'high' ? 2200 : quality === 'medium' ? 1500 : 800;
    const random = createSeededRandom('moment-universe:far-stars:v2');
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = random.range(22, 48);
      const theta = random.range(0, Math.PI * 2);
      const phi = Math.acos(random.range(-1, 1));
      positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[index * 3 + 1] = Math.cos(phi) * radius;
      positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 12;
      const brightness = random.next() > 0.93 ? random.range(0.65, 1) : random.range(0.12, 0.42);
      colors.set([brightness, brightness * 0.96, brightness * 0.86], index * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: quality === 'low' ? 0.045 : 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.baseOpacity = material.opacity;
    this.points = new THREE.Points(geometry, material);
  }

  update(time: number, quiet: boolean) {
    this.points.rotation.y = time * 0.0014;
    this.points.rotation.x = Math.sin(time * 0.022) * 0.006;
    this.points.material.opacity =
      this.baseOpacity * (quiet ? 0.45 : 1) * (0.94 + Math.sin(time * 0.7) * 0.025);
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}

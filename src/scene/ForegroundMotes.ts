import * as THREE from 'three';
import type { QualityLevel } from '../types/universe';
import { createSeededRandom } from '../engine/seededRandom';

function makeSoftTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(240,218,184,.32)');
  gradient.addColorStop(0.28, 'rgba(213,175,126,.10)');
  gradient.addColorStop(1, 'rgba(184,133,83,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export class ForegroundMotes {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly texture: THREE.Texture;

  constructor(quality: QualityLevel) {
    const count = quality === 'high' ? 96 : quality === 'medium' ? 62 : 32;
    const random = createSeededRandom('moment-universe:foreground:v2');
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = random.range(-12, 12);
      positions[index * 3 + 1] = random.range(-7, 7);
      positions[index * 3 + 2] = random.range(3, 8);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.texture = makeSoftTexture();
    const material = new THREE.PointsMaterial({
      map: this.texture,
      color: '#d6b486',
      size: quality === 'low' ? 0.34 : 0.48,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geometry, material);
  }

  update(time: number, pointer: THREE.Vector2, quiet: boolean) {
    this.points.position.x = pointer.x * 0.42;
    this.points.position.y = pointer.y * 0.28 + Math.sin(time * 0.06) * 0.08;
    this.points.rotation.z = time * -0.002;
    this.points.material.opacity = quiet ? 0.035 : 0.1;
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.texture.dispose();
  }
}

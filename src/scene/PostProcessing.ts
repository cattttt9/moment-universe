import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { QualityLevel } from '../types/universe';

export class PostProcessing {
  private readonly composer: EffectComposer | null;
  private readonly bloom: UnrealBloomPass | null;
  private enabled: boolean;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    quality: QualityLevel,
  ) {
    this.enabled = quality !== 'low';
    if (!this.enabled) {
      this.composer = null;
      this.bloom = null;
      return;
    }
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.55, 0.72);
    this.composer.addPass(this.bloom);
  }

  setEnergy(energy: number, quiet: boolean) {
    if (this.bloom) this.bloom.strength = quiet ? 0.08 : 0.14 + energy / 360;
  }

  setSize(width: number, height: number) {
    this.composer?.setSize(width, height);
  }

  disable() {
    this.enabled = false;
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    if (this.enabled && this.composer) this.composer.render();
    else this.renderer.render(scene, camera);
  }

  dispose() {
    this.composer?.dispose();
  }
}

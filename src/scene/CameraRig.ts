import * as THREE from 'three';
import type { AppStage, CameraPreset } from '../types/universe';

const STAGE_DISTANCE: Record<AppStage, number> = {
  intro: 15.5,
  sentence: 13.6,
  parameters: 11.8,
  generating: 8.8,
  universe: 10.2,
};

export class CameraRig {
  private stage: AppStage = 'intro';
  private preset: CameraPreset = 'right-offset';
  private distance = STAGE_DISTANCE.intro;
  private zoomOffset = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly reducedMotion: boolean,
  ) {}

  setStage(stage: AppStage, preset?: CameraPreset) {
    this.stage = stage;
    if (preset) this.preset = preset;
  }

  zoom(delta: number) {
    this.zoomOffset = THREE.MathUtils.clamp(this.zoomOffset + delta, -2.3, 3.6);
  }

  update(time: number, delta: number, pointer: THREE.Vector2) {
    const presetDistance =
      this.stage !== 'universe'
        ? 0
        : this.preset === 'close'
          ? -1.35
          : this.preset === 'distant'
            ? 0.85
            : this.preset === 'dual-center'
              ? 0.35
              : -0.45;
    const targetDistance = STAGE_DISTANCE[this.stage] + presetDistance + this.zoomOffset;
    this.distance = THREE.MathUtils.damp(this.distance, targetDistance, 2.4, delta);
    const motion = this.reducedMotion ? 0.18 : 1;
    const orbit =
      this.stage === 'universe' ? Math.sin((time / 22) * Math.PI * 2) * 0.28 * motion : 0;
    const presetX =
      this.preset === 'left-offset'
        ? -0.65
        : this.preset === 'right-offset'
          ? 0.65
          : this.preset === 'diagonal'
            ? 0.4
            : 0;
    const autonomousX = Math.sin(time * 0.075) * 0.18 * motion + orbit;
    const autonomousY = Math.cos(time * 0.058) * 0.12 * motion;
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      presetX + autonomousX + pointer.x * 0.32 * motion,
      2.2,
      delta,
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      1.25 + autonomousY + pointer.y * 0.22 * motion,
      2.2,
      delta,
    );
    this.camera.position.z = this.distance;
    this.camera.lookAt(0, 0, 0);
  }
}

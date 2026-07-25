import * as THREE from 'three';
import type { AppStage, CameraPreset } from '../types/universe';

const STAGE_DISTANCE: Record<AppStage, number> = {
  intro: 17.2,
  sentence: 14.3,
  parameters: 10.9,
  generating: 6.8,
  universe: 9.7,
};

const STAGE_FOV: Record<AppStage, number> = {
  intro: 51,
  sentence: 48,
  parameters: 44,
  generating: 39,
  universe: 47,
};

export class CameraRig {
  private stage: AppStage = 'intro';
  private preset: CameraPreset = 'right-offset';
  private distance = STAGE_DISTANCE.intro;
  private zoomOffset = 0;
  private readonly lookTarget = new THREE.Vector3();

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
    const nextFov = THREE.MathUtils.damp(
      this.camera.fov,
      STAGE_FOV[this.stage],
      this.stage === 'generating' ? 1.6 : 2.2,
      delta,
    );
    if (Math.abs(nextFov - this.camera.fov) > 0.001) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
    const targetY = this.stage === 'intro' ? 0.5 : this.stage === 'sentence' ? 0.2 : 0;
    this.lookTarget.set(
      this.stage === 'universe' ? presetX * 0.14 : 0,
      targetY,
      this.stage === 'generating' ? -0.9 : 0,
    );
    this.camera.lookAt(this.lookTarget);
  }
}

import * as THREE from 'three';
import { QUALITY_PIXEL_RATIOS } from '../constants/universe';
import type {
  AppStage,
  GravityCalibrationState,
  QualityLevel,
  UniverseBlueprint,
  UniverseParameters,
} from '../types/universe';
import { CameraRig } from './CameraRig';
import { FarStarField } from './FarStarField';
import { ForegroundMotes } from './ForegroundMotes';
import { GalaxyBackdrop } from './GalaxyBackdrop';
import { GravityCalibrationField } from './GravityCalibrationField';
import { InputEchoField } from './InputEchoField';
import { MidDustField } from './MidDustField';
import { PointerGravity } from './PointerGravity';
import { PostProcessing } from './PostProcessing';
import { ProceduralNebula } from './ProceduralNebula';

export interface UniverseStageState {
  stage: AppStage;
  parameters: UniverseParameters;
  blueprint: UniverseBlueprint | null;
  quiet: boolean;
  transitionProgress: number;
  inputActivity: number;
  inputLength: number;
  introAttraction: boolean;
}

export class UniverseStage {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cameraRig: CameraRig;
  private readonly farStars: FarStarField;
  private readonly midDust: MidDustField;
  private readonly foreground: ForegroundMotes;
  private readonly galaxy: GalaxyBackdrop;
  private readonly calibration: GravityCalibrationField;
  private readonly inputEcho: InputEchoField;
  private readonly nebula: ProceduralNebula;
  private readonly pointerGravity: PointerGravity;
  private readonly postProcessing: PostProcessing;
  private animationFrame = 0;
  private disposed = false;
  private visible = !document.hidden;
  private lastTime = performance.now();
  private elapsed = 0;
  private state: UniverseStageState;
  private fpsElapsed = 0;
  private fpsFrames = 0;
  private lowFpsWindows = 0;
  private pixelRatio: number;

  constructor(
    private readonly host: HTMLElement,
    initialState: UniverseStageState,
    quality: QualityLevel,
    reducedMotion: boolean,
    private readonly onReveal: () => void,
    private readonly onCalibrationChange: (
      parameters: UniverseParameters,
      state: GravityCalibrationState,
    ) => void,
    private readonly onCalibrationComplete: () => void,
  ) {
    this.state = initialState;
    this.scene.background = new THREE.Color('#050403');
    this.scene.fog = new THREE.FogExp2('#050403', quality === 'low' ? 0.021 : 0.015);
    this.camera.position.set(0, 1.25, 15.5);

    this.pixelRatio = Math.min(window.devicePixelRatio, QUALITY_PIXEL_RATIOS[quality]);
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality !== 'low',
      preserveDrawingBuffer: true,
      powerPreference: quality === 'high' ? 'high-performance' : 'default',
      alpha: false,
    });
    this.renderer.setClearColor('#050403', 1);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.82;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.host.appendChild(this.renderer.domElement);

    this.cameraRig = new CameraRig(this.camera, reducedMotion);
    this.farStars = new FarStarField(quality);
    this.midDust = new MidDustField(quality, this.pixelRatio);
    this.foreground = new ForegroundMotes(quality);
    this.galaxy = new GalaxyBackdrop(quality);
    this.inputEcho = new InputEchoField();
    this.nebula = new ProceduralNebula(initialState.parameters, quality, this.pixelRatio);
    this.calibration = new GravityCalibrationField(
      this.camera,
      this.renderer.domElement,
      initialState.parameters,
      {
        onChange: this.onCalibrationChange,
        onComplete: this.onCalibrationComplete,
      },
      quality,
    );
    this.scene.add(
      this.galaxy.group,
      this.farStars.points,
      this.midDust.points,
      this.nebula.group,
      this.calibration.group,
      this.inputEcho.points,
      this.foreground.points,
    );
    this.pointerGravity = new PointerGravity({
      onPulse: () => this.nebula.pulseOnce(),
      onZoom: (delta) => this.cameraRig.zoom(delta),
    });
    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera, quality);

    this.updateState(initialState);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('click', this.handleClick);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  updateState(next: UniverseStageState) {
    this.state = next;
    this.cameraRig.setStage(next.stage, next.blueprint?.profile.cameraPreset);
    this.pointerGravity.setActive(next.stage === 'universe');
    this.calibration.setActive(next.stage === 'parameters');
    this.nebula.setStage(next.stage);
    this.nebula.setTransitionProgress(next.transitionProgress);
    this.nebula.setParameters(next.parameters);
    this.nebula.setBlueprint(next.blueprint, this.pixelRatio);
    this.midDust.setParameters(next.parameters);
    this.inputEcho.setSignal(next.inputLength, next.inputActivity, next.stage === 'sentence');
    this.postProcessing.setEnergy(next.parameters.energy, next.quiet);
  }

  capture() {
    try {
      return this.renderer.domElement.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('click', this.handleClick);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.pointerGravity.dispose();
    this.farStars.dispose();
    this.midDust.dispose();
    this.foreground.dispose();
    this.galaxy.dispose();
    this.inputEcho.dispose();
    this.nebula.dispose();
    this.calibration.dispose();
    this.postProcessing.dispose();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private resize = () => {
    const { width, height } = this.host.getBoundingClientRect();
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.calibration.setViewport(width, height);
    this.postProcessing.setSize(width, height);
  };

  private handleVisibility = () => {
    this.visible = !document.hidden;
    if (this.visible && !this.disposed) {
      this.lastTime = performance.now();
      this.animationFrame = requestAnimationFrame(this.render);
    } else {
      cancelAnimationFrame(this.animationFrame);
    }
  };

  private handleClick = (event: MouseEvent) => {
    if (this.state.stage !== 'universe') return;
    if (event.target instanceof HTMLElement && event.target.closest('button')) return;
    const pointer = new THREE.Vector2(
      (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
      -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1),
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this.camera);
    if (raycaster.intersectObjects(this.nebula.cores, false).length > 0) this.onReveal();
  };

  private samplePerformance(delta: number) {
    this.fpsElapsed += delta;
    this.fpsFrames += 1;
    if (this.fpsElapsed < 4) return;
    const fps = this.fpsFrames / this.fpsElapsed;
    this.lowFpsWindows = fps < 42 ? this.lowFpsWindows + 1 : 0;
    this.fpsElapsed = 0;
    this.fpsFrames = 0;
    if (this.lowFpsWindows < 2) return;
    this.lowFpsWindows = 0;
    this.pixelRatio = Math.max(0.8, this.pixelRatio * 0.78);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.postProcessing.disable();
    this.resize();
  }

  private render = (now: number) => {
    if (this.disposed || !this.visible) return;
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += delta;
    this.pointerGravity.update(delta);
    const activityBoost = Math.min(1, this.state.inputActivity / 8);
    const introBoost = this.state.introAttraction && this.state.stage === 'intro' ? 0.42 : 0;
    const interaction = Math.min(
      1,
      this.pointerGravity.interaction + activityBoost * 0.32 + introBoost,
    );
    const fieldPointer =
      introBoost > 0 ? new THREE.Vector2(-0.34, -0.36) : this.pointerGravity.pointer;

    this.cameraRig.update(this.elapsed, delta, this.pointerGravity.pointer);
    this.farStars.update(this.elapsed, this.state.quiet);
    this.midDust.update(this.elapsed, fieldPointer, interaction, this.state.quiet);
    this.foreground.update(this.elapsed, this.pointerGravity.pointer, this.state.quiet);
    this.galaxy.update(
      this.elapsed,
      this.pointerGravity.pointer,
      this.state.stage,
      this.state.quiet,
    );
    this.inputEcho.update(this.elapsed, delta);
    this.nebula.update(
      this.elapsed,
      delta,
      this.pointerGravity.pointer,
      interaction,
      this.pointerGravity.attracting,
      this.state.quiet,
    );
    this.calibration.update(this.elapsed, delta);
    this.renderer.toneMappingExposure = THREE.MathUtils.damp(
      this.renderer.toneMappingExposure,
      0.72 + this.state.parameters.energy / 310,
      2,
      delta,
    );
    this.postProcessing.setEnergy(this.state.parameters.energy, this.state.quiet);
    this.postProcessing.render(this.scene, this.camera);
    this.samplePerformance(delta);
    this.animationFrame = requestAnimationFrame(this.render);
  };
}

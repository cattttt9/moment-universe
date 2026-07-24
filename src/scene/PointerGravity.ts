import * as THREE from 'three';

interface PointerGravityCallbacks {
  onPulse: () => void;
  onZoom: (delta: number) => void;
}

export class PointerGravity {
  readonly pointer = new THREE.Vector2();
  interaction = 0;
  attracting = false;
  private active = false;

  constructor(private readonly callbacks: PointerGravityCallbacks) {
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerdown', this.onDown, { passive: true });
    window.addEventListener('pointerup', this.onUp, { passive: true });
    window.addEventListener('pointercancel', this.onUp, { passive: true });
    window.addEventListener('dblclick', this.onDoubleClick);
    window.addEventListener('wheel', this.onWheel, { passive: true });
  }

  setActive(active: boolean) {
    this.active = active;
    if (!active) this.attracting = false;
  }

  update(delta: number) {
    this.interaction = THREE.MathUtils.damp(this.interaction, 0, 1.8, delta);
  }

  dispose() {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('dblclick', this.onDoubleClick);
    window.removeEventListener('wheel', this.onWheel);
  }

  private onMove = (event: PointerEvent) => {
    this.pointer.set(
      (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
      -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1),
    );
    this.interaction = event.pointerType === 'mouse' ? 0.58 : 0.82;
  };

  private onDown = () => {
    if (this.active) this.attracting = true;
  };

  private onUp = () => {
    this.attracting = false;
  };

  private onDoubleClick = (event: MouseEvent) => {
    if (this.active && !(event.target instanceof HTMLElement && event.target.closest('button'))) {
      this.callbacks.onPulse();
    }
  };

  private onWheel = (event: WheelEvent) => {
    if (this.active) this.callbacks.onZoom(event.deltaY * 0.003);
  };
}

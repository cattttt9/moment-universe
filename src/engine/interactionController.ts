export interface InteractionState {
  pointerX: number;
  pointerY: number;
  intensity: number;
  attracting: boolean;
}

interface InteractionCallbacks {
  onPointer: (state: InteractionState) => void;
  onPulse: () => void;
  onZoom: (delta: number) => void;
  onTap: (x: number, y: number) => void;
}

export class InteractionController {
  private readonly element: HTMLElement;
  private readonly callbacks: InteractionCallbacks;
  private pointers = new Map<number, PointerEvent>();
  private lastTapAt = 0;
  private lastTapPosition = { x: 0, y: 0 };
  private pinchDistance = 0;
  private state: InteractionState = {
    pointerX: 0,
    pointerY: 0,
    intensity: 0,
    attracting: false,
  };

  constructor(element: HTMLElement, callbacks: InteractionCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove, { passive: true });
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
    element.addEventListener('dblclick', this.onDoubleClick);
    element.addEventListener('wheel', this.onWheel, { passive: false });
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
    this.element.removeEventListener('dblclick', this.onDoubleClick);
    this.element.removeEventListener('wheel', this.onWheel);
  }

  private normalize(event: PointerEvent) {
    const rect = this.element.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      y: -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1),
    };
  }

  private emitPointer(event: PointerEvent) {
    const point = this.normalize(event);
    this.state = {
      pointerX: point.x,
      pointerY: point.y,
      intensity: event.pointerType === 'mouse' ? 0.7 : 1,
      attracting: this.pointers.size > 0,
    };
    this.callbacks.onPointer(this.state);
  }

  private updatePinch() {
    if (this.pointers.size !== 2) {
      this.pinchDistance = 0;
      return;
    }
    const [first, second] = [...this.pointers.values()];
    if (!first || !second) return;
    const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    if (this.pinchDistance > 0) this.callbacks.onZoom((this.pinchDistance - distance) * 0.018);
    this.pinchDistance = distance;
  }

  private onPointerDown = (event: PointerEvent) => {
    this.element.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, event);
    this.emitPointer(event);
    this.updatePinch();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, event);
    this.emitPointer(event);
    this.updatePinch();
  };

  private onPointerUp = (event: PointerEvent) => {
    this.pointers.delete(event.pointerId);
    this.updatePinch();
    this.state.attracting = false;
    this.callbacks.onPointer(this.state);
    const now = performance.now();
    const point = this.normalize(event);
    const closeToPrevious =
      Math.hypot(point.x - this.lastTapPosition.x, point.y - this.lastTapPosition.y) < 0.12;
    if (event.pointerType !== 'mouse' && now - this.lastTapAt < 360 && closeToPrevious) {
      this.callbacks.onPulse();
      this.lastTapAt = 0;
    } else {
      this.lastTapAt = now;
      this.lastTapPosition = point;
      this.callbacks.onTap(point.x, point.y);
    }
  };

  private onDoubleClick = () => this.callbacks.onPulse();

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.callbacks.onZoom(event.deltaY * 0.0035);
  };
}

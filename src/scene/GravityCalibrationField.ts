import * as THREE from 'three';
import {
  bodiesToParameters,
  createGravityBodies,
  getGravityScore,
  isGravityStable,
} from '../engine/gravityCalibration';
import type {
  GravityBodyState,
  GravityCalibrationState,
  QualityLevel,
  UniverseParameters,
} from '../types/universe';

interface GravityCalibrationCallbacks {
  onChange: (parameters: UniverseParameters, state: GravityCalibrationState) => void;
  onComplete: () => void;
}

interface CalibrationBody {
  id: GravityBodyState['id'];
  mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>;
  hitArea: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  glow: THREE.Sprite;
  velocity: THREE.Vector2;
  radius: number;
  dragWeight: number;
}

interface GravityLink {
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  positions: Float32Array;
  from: number;
  to: number;
}

const BODY_SPECS = [
  {
    id: 'memory',
    color: '#cf936e',
    accent: '#ffe1bd',
    radius: 0.21,
    dragWeight: 0.84,
  },
  {
    id: 'moment',
    color: '#d9d2c3',
    accent: '#ffffff',
    radius: 0.25,
    dragWeight: 0.9,
  },
  {
    id: 'future',
    color: '#6e9c9a',
    accent: '#c5eeea',
    radius: 0.17,
    dragWeight: 0.78,
  },
] as const;

const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
  gradient.addColorStop(0, 'rgba(255,255,255,.9)');
  gradient.addColorStop(0.14, 'rgba(255,255,255,.34)');
  gradient.addColorStop(0.48, 'rgba(255,255,255,.08)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  return new THREE.CanvasTexture(canvas);
}

function createBodyMaterial(color: string, accent: string, phase: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: phase },
      uColor: { value: new THREE.Color(color) },
      uAccent: { value: new THREE.Color(accent) },
      uDrag: { value: 0 },
      uGravity: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uPhase;
      uniform float uDrag;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 displaced = position;
        float grain = sin(position.x * 18.0 + uTime * 0.32 + uPhase)
          * sin(position.y * 23.0 - uTime * 0.21);
        displaced += normal * grain * (0.018 + uDrag * 0.018);
        vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
        vView = normalize(-viewPosition.xyz);
        vPosition = displaced;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uPhase;
      uniform float uDrag;
      uniform float uGravity;
      uniform vec3 uColor;
      uniform vec3 uAccent;
      void main() {
        float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.3);
        float bands = sin(vPosition.y * 31.0 + vPosition.x * 13.0 + uTime * 0.5 + uPhase);
        bands = smoothstep(-0.65, 0.9, bands);
        vec3 color = mix(uColor * 0.38, uColor, bands * 0.62);
        color = mix(color, uAccent, fresnel * (0.45 + uGravity * 0.22));
        color += uAccent * uDrag * 0.12;
        gl_FragColor = vec4(color, 0.96);
      }
    `,
  });
}

export class GravityCalibrationField {
  readonly group = new THREE.Group();
  private readonly glowTexture = createGlowTexture();
  private readonly bodies: CalibrationBody[] = [];
  private readonly links: GravityLink[] = [];
  private readonly streamGeometry: THREE.BufferGeometry;
  private readonly streamPositions: Float32Array;
  private readonly streamMaterial: THREE.PointsMaterial;
  private readonly streamPoints: THREE.Points;
  private readonly core: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>;
  private readonly rings: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private readonly intersection = new THREE.Vector3();
  private readonly grabOffset = new THREE.Vector3();
  private active = false;
  private dragged: CalibrationBody | null = null;
  private pointerId: number | null = null;
  private lastPointerAt = 0;
  private lastEmitAt = 0;
  private holdStartedAt = 0;
  private holdProgress = 0;
  private completed = false;
  private score = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    parameters: UniverseParameters,
    private readonly callbacks: GravityCalibrationCallbacks,
    quality: QualityLevel,
  ) {
    this.group.name = 'gravity-calibration';
    const initialBodies = createGravityBodies(parameters);
    BODY_SPECS.forEach((spec, index) => {
      const geometry = new THREE.IcosahedronGeometry(spec.radius, quality === 'low' ? 2 : 4);
      const material = createBodyMaterial(spec.color, spec.accent, index * 2.17);
      const mesh = new THREE.Mesh(geometry, material);
      const initial = initialBodies[index]!;
      mesh.position.set(initial.x, initial.y, index === 0 ? 0.35 : index === 1 ? -0.18 : 0.12);
      mesh.userData.gravityBody = spec.id;
      const hitArea = new THREE.Mesh(
        new THREE.SphereGeometry(spec.radius * 2.35, 12, 8),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      hitArea.userData.gravityBody = spec.id;
      mesh.add(hitArea);
      const glowMaterial = new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: spec.accent,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.setScalar(spec.radius * 7.5);
      mesh.add(glow);
      this.group.add(mesh);
      this.bodies.push({
        id: spec.id,
        mesh,
        hitArea,
        glow,
        velocity: new THREE.Vector2(),
        radius: spec.radius,
        dragWeight: spec.dragWeight,
      });
    });

    LINKS.forEach(([from, to]) => {
      const positions = new Float32Array(48 * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({
        color: '#d7b284',
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      this.group.add(line);
      this.links.push({ line, positions, from, to });
    });

    const streamCount = quality === 'low' ? 30 : 54;
    this.streamPositions = new Float32Array(streamCount * 3);
    this.streamGeometry = new THREE.BufferGeometry();
    this.streamGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.streamPositions, 3),
    );
    this.streamMaterial = new THREE.PointsMaterial({
      color: '#e5c49b',
      size: quality === 'low' ? 0.035 : 0.048,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.streamPoints = new THREE.Points(this.streamGeometry, this.streamMaterial);
    this.group.add(this.streamPoints);

    const coreGeometry = new THREE.IcosahedronGeometry(0.105, 3);
    const coreMaterial = createBodyMaterial('#d0b38e', '#fff3dd', 5.8);
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.core.userData.gravityCore = true;
    this.group.add(this.core);

    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index === 0 ? '#d4ae80' : '#809c9a',
        transparent: true,
        opacity: 0.1 - index * 0.018,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.38 + index * 0.22, 0.385 + index * 0.22, 96),
        material,
      );
      ring.position.z = -0.12 - index * 0.02;
      this.rings.push(ring);
      this.group.add(ring);
    }

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.group.visible = false;
  }

  setActive(active: boolean) {
    this.active = active;
    this.group.visible = active;
    this.canvas.style.touchAction = active ? 'none' : '';
    if (!active) this.releasePointer();
  }

  setViewport(width: number, height: number) {
    const portraitScale = width < 620 && height > width ? 0.43 : width < 860 ? 0.76 : 1;
    this.group.scale.setScalar(portraitScale);
    this.group.position.y = width < 620 && height > width ? 0.08 : 0;
  }

  update(time: number, delta: number) {
    if (!this.active) return;
    const centroid = this.getCentroid();
    this.score = getGravityScore(this.getBodyStates());
    const stable = isGravityStable(this.getBodyStates());
    const gravity = this.score / 100;

    this.bodies.forEach((body, index) => {
      if (body !== this.dragged) {
        body.mesh.position.x += body.velocity.x * delta;
        body.mesh.position.y += body.velocity.y * delta;
        const damping = Math.exp(-delta * (2.7 + body.dragWeight));
        body.velocity.multiplyScalar(damping);
        const distanceToCore = Math.hypot(
          body.mesh.position.x - centroid.x,
          body.mesh.position.y - centroid.y,
        );
        if (distanceToCore > 4.2) {
          body.velocity.x += (centroid.x - body.mesh.position.x) * delta * 0.32;
          body.velocity.y += (centroid.y - body.mesh.position.y) * delta * 0.32;
        }
      }
      body.mesh.position.x = THREE.MathUtils.clamp(body.mesh.position.x, -4.65, 4.65);
      body.mesh.position.y = THREE.MathUtils.clamp(body.mesh.position.y, -2.9, 2.9);
      body.mesh.rotation.x += delta * (0.16 + index * 0.04);
      body.mesh.rotation.y += delta * (0.22 - index * 0.03);
      body.mesh.material.uniforms.uTime!.value = time;
      body.mesh.material.uniforms.uDrag!.value = body === this.dragged ? 1 : 0;
      body.mesh.material.uniforms.uGravity!.value = gravity;
      body.glow.material.opacity = 0.14 + gravity * 0.24 + (body === this.dragged ? 0.22 : 0);
      const pulse = 1 + Math.sin(time * (0.8 + index * 0.18) + index) * 0.035;
      body.mesh.scale.setScalar(pulse * (body === this.dragged ? 1.16 : 1));
    });

    this.core.position.set(0, 0, -0.04);
    this.core.material.uniforms.uTime!.value = time;
    this.core.material.uniforms.uGravity!.value = gravity;
    this.core.scale.setScalar(0.72 + gravity * 1.1 + this.holdProgress * 0.75);
    this.rings.forEach((ring, index) => {
      ring.position.x = 0;
      ring.position.y = 0;
      ring.rotation.z = time * (index % 2 === 0 ? 0.035 : -0.026);
      ring.scale.setScalar(0.8 + gravity * 0.55 + this.holdProgress * (0.65 + index * 0.2));
      ring.material.opacity =
        (stable ? 0.1 + gravity * 0.11 : 0.035 + gravity * 0.035) * (1 - index * 0.12);
    });

    this.updateLinks(time, gravity);

    if (this.holdStartedAt > 0 && stable) {
      this.holdProgress = THREE.MathUtils.clamp(
        (performance.now() - this.holdStartedAt) / 1350,
        0,
        1,
      );
      if (this.holdProgress >= 1 && !this.completed) {
        this.completed = true;
        this.callbacks.onComplete();
      }
    } else {
      this.holdProgress = THREE.MathUtils.damp(this.holdProgress, 0, 5, delta);
    }

    if (time - this.lastEmitAt > 0.08) {
      this.lastEmitAt = time;
      const states = this.getBodyStates();
      this.callbacks.onChange(bodiesToParameters(states), {
        bodies: states,
        score: this.score,
        stable,
        dragging: this.dragged?.id ?? null,
      });
    }
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.bodies.forEach((body) => {
      body.mesh.geometry.dispose();
      body.mesh.material.dispose();
      body.hitArea.geometry.dispose();
      body.hitArea.material.dispose();
      body.glow.material.dispose();
    });
    this.links.forEach((link) => {
      link.line.geometry.dispose();
      link.line.material.dispose();
    });
    this.streamGeometry.dispose();
    this.streamMaterial.dispose();
    this.core.geometry.dispose();
    this.core.material.dispose();
    this.rings.forEach((ring) => {
      ring.geometry.dispose();
      ring.material.dispose();
    });
    this.glowTexture.dispose();
  }

  private updateLinks(time: number, gravity: number) {
    this.links.forEach((link, linkIndex) => {
      const first = this.bodies[link.from]!.mesh.position;
      const second = this.bodies[link.to]!.mesh.position;
      const midpointX = (first.x + second.x) * 0.5;
      const midpointY = (first.y + second.y) * 0.5;
      const distance = first.distanceTo(second);
      const bend = (0.16 + gravity * 0.48) * (linkIndex % 2 === 0 ? 1 : -1);
      const controlX = midpointX - (second.y - first.y) * bend;
      const controlY = midpointY + (second.x - first.x) * bend;
      for (let pointIndex = 0; pointIndex < 48; pointIndex += 1) {
        const t = pointIndex / 47;
        const inverse = 1 - t;
        const offset = pointIndex * 3;
        link.positions[offset] =
          inverse * inverse * first.x + 2 * inverse * t * controlX + t * t * second.x;
        link.positions[offset + 1] =
          inverse * inverse * first.y + 2 * inverse * t * controlY + t * t * second.y;
        link.positions[offset + 2] =
          inverse * inverse * first.z + 2 * inverse * t * -0.15 + t * t * second.z;
      }
      const attribute = link.line.geometry.getAttribute('position') as THREE.BufferAttribute;
      attribute.needsUpdate = true;
      link.line.material.opacity =
        THREE.MathUtils.clamp(0.48 - distance * 0.065, 0.055, 0.34) + gravity * 0.08;
    });

    const particlesPerLink = this.streamPositions.length / 3 / this.links.length;
    this.links.forEach((link, linkIndex) => {
      for (let index = 0; index < particlesPerLink; index += 1) {
        const t =
          (time * (0.045 + gravity * 0.09) + index / particlesPerLink + linkIndex * 0.21) % 1;
        const scaled = t * 47;
        const lower = Math.floor(scaled);
        const upper = Math.min(47, lower + 1);
        const mix = scaled - lower;
        const outputIndex = (linkIndex * particlesPerLink + index) * 3;
        for (let axis = 0; axis < 3; axis += 1) {
          const first = link.positions[lower * 3 + axis]!;
          const second = link.positions[upper * 3 + axis]!;
          this.streamPositions[outputIndex + axis] = THREE.MathUtils.lerp(first, second, mix);
        }
      }
    });
    (this.streamGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    this.streamMaterial.opacity = 0.26 + gravity * 0.42;
  }

  private getCentroid() {
    const centroid = new THREE.Vector3();
    this.bodies.forEach((body) => centroid.add(body.mesh.position));
    return centroid.multiplyScalar(1 / this.bodies.length);
  }

  private getBodyStates(): GravityBodyState[] {
    return this.bodies.map((body) => ({
      id: body.id,
      x: body.mesh.position.x,
      y: body.mesh.position.y,
      velocity: body.velocity.length(),
    }));
  }

  private setPointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1),
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.active) return;
    this.setPointer(event);
    const intersections = this.raycaster.intersectObjects(
      [...this.bodies.map((body) => body.hitArea), this.core],
      false,
    );
    const hit = intersections[0]?.object;
    if (!hit) return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointerId = event.pointerId;
    if (hit === this.core) {
      if (isGravityStable(this.getBodyStates())) this.holdStartedAt = performance.now();
      return;
    }
    const body = this.bodies.find((candidate) => candidate.hitArea === hit);
    if (!body) return;
    this.dragged = body;
    this.dragPlane.constant = -body.mesh.position.z;
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) {
      this.grabOffset.copy(body.mesh.position).sub(this.intersection);
    } else {
      this.grabOffset.set(0, 0, 0);
    }
    body.velocity.set(0, 0);
    this.lastPointerAt = performance.now();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.active || this.pointerId !== event.pointerId || !this.dragged) return;
    event.preventDefault();
    this.setPointer(event);
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) return;
    const now = performance.now();
    const delta = Math.max((now - this.lastPointerAt) / 1000, 1 / 120);
    const nextX = THREE.MathUtils.clamp(this.intersection.x + this.grabOffset.x, -4.65, 4.65);
    const nextY = THREE.MathUtils.clamp(this.intersection.y + this.grabOffset.y, -2.9, 2.9);
    this.dragged.velocity.set(
      THREE.MathUtils.clamp((nextX - this.dragged.mesh.position.x) / delta, -5, 5),
      THREE.MathUtils.clamp((nextY - this.dragged.mesh.position.y) / delta, -5, 5),
    );
    this.dragged.mesh.position.x = nextX;
    this.dragged.mesh.position.y = nextY;
    this.lastPointerAt = now;
  };

  private onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.releasePointer();
  };

  private releasePointer() {
    if (this.pointerId !== null && this.canvas.hasPointerCapture(this.pointerId)) {
      this.canvas.releasePointerCapture(this.pointerId);
    }
    this.pointerId = null;
    this.dragged = null;
    this.holdStartedAt = 0;
  }
}

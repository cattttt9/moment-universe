import * as THREE from 'three';
import { createUniverseConfig, generateUniverseBlueprint } from '../engine/universeGenerator';
import {
  createHazeTexture,
  createParticleSystem,
  type ParticleSystem,
} from '../engine/particleSystem';
import type {
  AppStage,
  QualityLevel,
  UniverseBlueprint,
  UniverseParameters,
} from '../types/universe';

interface NebulaResources {
  particleSystem: ParticleSystem;
  coreMaterials: THREE.ShaderMaterial[];
  animatedMaterials: THREE.ShaderMaterial[];
  orbitingBodies: {
    pivot: THREE.Group;
    mesh: THREE.Mesh;
    speed: number;
    rotationSpeed: number;
  }[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
  textures: THREE.Texture[];
}

const PREVIEW_DATE = '2026-01-01T00:00:00.000Z';

function createCoreMaterial(coreColor: string, innerColor: string, phase: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uPhase: { value: phase },
      uCore: { value: new THREE.Color(coreColor) },
      uInner: { value: new THREE.Color(innerColor) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        vPosition = position;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPulse;
      uniform float uPhase;
      uniform vec3 uCore;
      uniform vec3 uInner;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;
      void main() {
        float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
        float flow = sin(vPosition.y * 19.0 + uTime * 0.42 + uPhase);
        flow += sin(vPosition.x * 27.0 - uTime * 0.31) * 0.55;
        flow = smoothstep(-0.9, 1.2, flow);
        vec3 color = mix(uInner * 0.72, uCore, flow * 0.72 + fresnel * 0.34);
        color += uCore * fresnel * (0.35 + uPulse * 0.3);
        gl_FragColor = vec4(color, 0.92);
      }
    `,
  });
}

function createPlanetMaterial(color: string, accent: string, atmosphere: number, phase: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: phase },
      uAtmosphere: { value: atmosphere },
      uColor: { value: new THREE.Color(color) },
      uAccent: { value: new THREE.Color(accent) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        vPosition = position;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uPhase;
      uniform float uAtmosphere;
      uniform vec3 uColor;
      uniform vec3 uAccent;
      void main() {
        vec3 lightDirection = normalize(vec3(-0.55, 0.42, 0.76));
        float diffuse = max(dot(vNormal, lightDirection), 0.0);
        float night = smoothstep(-0.2, 0.58, diffuse);
        float bands = sin(vPosition.y * 28.0 + sin(vPosition.x * 17.0 + uPhase) * 1.8);
        bands += sin(vPosition.z * 37.0 - uTime * 0.09) * 0.45;
        bands = smoothstep(-0.8, 1.0, bands);
        float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
        vec3 surface = mix(uColor * 0.24, uColor, night * (0.52 + bands * 0.32));
        surface = mix(surface, uAccent, bands * 0.18 + fresnel * uAtmosphere * 0.48);
        gl_FragColor = vec4(surface, 1.0);
      }
    `,
  });
}

export class ProceduralNebula {
  readonly group = new THREE.Group();
  readonly cores: THREE.Mesh[] = [];
  private preview: ParticleSystem;
  private result: NebulaResources | null = null;
  private blueprint: UniverseBlueprint | null = null;
  private parameters: UniverseParameters;
  private stage: AppStage = 'intro';
  private transitionProgress = 0;
  private pulse = 0;

  constructor(
    parameters: UniverseParameters,
    private readonly quality: QualityLevel,
    pixelRatio: number,
  ) {
    this.parameters = parameters;
    const previewConfig = createUniverseConfig('此刻宇宙', parameters, PREVIEW_DATE);
    const previewBlueprint = generateUniverseBlueprint(previewConfig, this.quality);
    this.preview = createParticleSystem(previewBlueprint, pixelRatio);
    this.preview.points.scale.setScalar(0.76);
    this.group.add(this.preview.points);
  }

  setStage(stage: AppStage) {
    this.stage = stage;
  }

  setTransitionProgress(progress: number) {
    this.transitionProgress = progress;
  }

  setParameters(parameters: UniverseParameters) {
    this.parameters = parameters;
    const material = this.preview.material;
    material.uniforms.uSpeed!.value = 0.06 + parameters.energy / 390;
    material.uniforms.uFluctuation!.value = parameters.fluctuation / 100;
    material.uniforms.uOrder!.value = parameters.order / 100;
    material.uniforms.uEmission!.value = 0.5 + parameters.energy / 150;
    this.preview.points.scale.setScalar(
      0.62 + parameters.energy / 250 + (100 - parameters.order) / 700,
    );
    this.preview.points.rotation.x = -0.1 - parameters.order / 480;
  }

  setBlueprint(blueprint: UniverseBlueprint | null, pixelRatio: number) {
    if (!blueprint || this.blueprint?.config.seed === blueprint.config.seed) return;
    this.disposeResult();
    this.blueprint = blueprint;
    const resultGroup = new THREE.Group();
    resultGroup.name = 'generated-universe';
    const particleSystem = createParticleSystem(blueprint, pixelRatio);
    resultGroup.add(particleSystem.points);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const coreMaterials: THREE.ShaderMaterial[] = [];
    const animatedMaterials: THREE.ShaderMaterial[] = [];
    const orbitingBodies: NebulaResources['orbitingBodies'] = [];
    this.cores.length = 0;

    for (let index = 0; index < blueprint.profile.coreCount; index += 1) {
      const geometry = new THREE.SphereGeometry(0.18 + blueprint.config.energy / 620, 40, 26);
      const material = createCoreMaterial(
        index % 2 === 0 ? blueprint.palette.core : blueprint.palette.inner,
        blueprint.palette.inner,
        index * 1.73,
      );
      const core = new THREE.Mesh(geometry, material);
      const separation = blueprint.profile.coreCount > 1 ? 1.45 : 0;
      core.position.x = (index - (blueprint.profile.coreCount - 1) / 2) * separation;
      this.cores.push(core);
      resultGroup.add(core);
      geometries.push(geometry);
      materials.push(material);
      coreMaterials.push(material);
      animatedMaterials.push(material);

      const texture = createHazeTexture(
        index % 2 === 0 ? blueprint.palette.core : blueprint.palette.inner,
      );
      const glowMaterial = new THREE.SpriteMaterial({
        map: texture,
        color: index % 2 === 0 ? blueprint.palette.core : blueprint.palette.inner,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.55 + blueprint.config.energy / 280,
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.position.copy(core.position);
      glow.scale.setScalar(0.92 + blueprint.config.energy / 122);
      resultGroup.add(glow);
      textures.push(texture);
      materials.push(glowMaterial);
    }

    blueprint.planets.forEach((planet) => {
      const pivot = new THREE.Group();
      pivot.rotation.set(planet.orbitTilt, planet.phase, blueprint.profile.orientation.z * 0.28);
      const geometry = new THREE.SphereGeometry(
        planet.radius,
        this.quality === 'low' ? 18 : 30,
        this.quality === 'low' ? 12 : 20,
      );
      const material = createPlanetMaterial(
        planet.color,
        planet.accent,
        planet.atmosphere,
        planet.phase,
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.orbitRadius;
      pivot.add(mesh);
      resultGroup.add(pivot);
      geometries.push(geometry);
      materials.push(material);
      animatedMaterials.push(material);
      orbitingBodies.push({
        pivot,
        mesh,
        speed: planet.orbitSpeed,
        rotationSpeed: planet.rotationSpeed,
      });

      if (planet.atmosphere > 0.12) {
        const atmosphereGeometry = new THREE.SphereGeometry(
          planet.radius * (1.07 + planet.atmosphere * 0.07),
          this.quality === 'low' ? 16 : 28,
          this.quality === 'low' ? 10 : 18,
        );
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
          color: planet.accent,
          transparent: true,
          opacity: 0.035 + planet.atmosphere * 0.12,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        mesh.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));
        geometries.push(atmosphereGeometry);
        materials.push(atmosphereMaterial);
      }

      if (planet.ring) {
        const ringGeometry = new THREE.RingGeometry(planet.radius * 1.55, planet.radius * 2.45, 72);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: planet.accent,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI * 0.5 + planet.orbitTilt * 0.4;
        mesh.add(ring);
        geometries.push(ringGeometry);
        materials.push(ringMaterial);
      }

      for (let moonIndex = 0; moonIndex < planet.moons; moonIndex += 1) {
        const moonPivot = new THREE.Group();
        moonPivot.rotation.y = planet.phase + moonIndex * 2.1;
        const moonGeometry = new THREE.SphereGeometry(planet.radius * 0.18, 12, 8);
        const moonMaterial = new THREE.MeshBasicMaterial({
          color: blueprint.palette.outer,
          transparent: true,
          opacity: 0.76,
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.x = planet.radius * (2.4 + moonIndex * 0.7);
        moonPivot.add(moon);
        mesh.add(moonPivot);
        geometries.push(moonGeometry);
        materials.push(moonMaterial);
      }
    });

    const hazeLayers = blueprint.profile.archetype === 'drifting-nebula' ? 7 : 4;
    for (let index = 0; index < hazeLayers; index += 1) {
      const texture = createHazeTexture(
        index % 2 === 0 ? blueprint.palette.haze : blueprint.palette.outer,
      );
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: index % 2 === 0 ? blueprint.palette.haze : blueprint.palette.outer,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.055 + blueprint.profile.emission * 0.028,
        rotation: index * 0.63,
      });
      const haze = new THREE.Sprite(material);
      const angle = (index / hazeLayers) * Math.PI * 2 + blueprint.profile.orientation.y;
      haze.position.set(
        Math.cos(angle) * blueprint.profile.spread * (0.8 + index * 0.36),
        Math.sin(angle * 1.7) * 0.5,
        Math.sin(angle) * 0.45,
      );
      haze.scale.set(
        blueprint.profile.spread * (4.2 + index * 0.5),
        blueprint.profile.spread * (2 + (index % 3) * 0.55),
        1,
      );
      resultGroup.add(haze);
      textures.push(texture);
      materials.push(material);
    }

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: blueprint.palette.outer,
      transparent: true,
      opacity: 0.11,
    });
    materials.push(orbitMaterial);
    const orbitCount =
      blueprint.profile.archetype === 'void-system'
        ? Math.min(1, blueprint.planets.length)
        : Math.min(this.quality === 'low' ? 3 : 6, blueprint.planets.length);
    for (let index = 0; index < orbitCount; index += 1) {
      const radius = blueprint.planets[index]?.orbitRadius ?? 2 + index * 1.25;
      const orbitPoints = Array.from({ length: 100 }, (_, pointIndex) => {
        const angle = (pointIndex / 100) * Math.PI * 2;
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * (0.1 + (1 - blueprint.profile.symmetry) * 0.28),
          Math.sin(angle) * radius,
        );
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbit = new THREE.LineLoop(geometry, orbitMaterial);
      orbit.rotation.set(
        blueprint.planets[index]?.orbitTilt ?? index * 0.15,
        blueprint.profile.orientation.y,
        blueprint.profile.orientation.z,
      );
      resultGroup.add(orbit);
      geometries.push(geometry);
    }

    if (blueprint.record.phenomenon) {
      const phenomenon = new THREE.Group();
      phenomenon.name = `phenomenon-${blueprint.record.phenomenon}`;
      phenomenon.position.set(
        blueprint.profile.cameraPreset === 'left-offset' ? 2.6 : -2.8,
        blueprint.profile.orientation.y * 1.7,
        -0.8,
      );
      const phenomenonMaterial = new THREE.MeshBasicMaterial({
        color:
          blueprint.record.phenomenon === 'rift' ? blueprint.palette.inner : blueprint.palette.core,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      materials.push(phenomenonMaterial);

      if (
        blueprint.record.phenomenon === 'black-hole' ||
        blueprint.record.phenomenon === 'lensing'
      ) {
        const geometry = new THREE.TorusGeometry(
          blueprint.record.phenomenon === 'black-hole' ? 0.5 : 0.72,
          0.025,
          12,
          120,
        );
        const torus = new THREE.Mesh(geometry, phenomenonMaterial);
        torus.scale.y = 0.42;
        phenomenon.add(torus);
        geometries.push(geometry);
        if (blueprint.record.phenomenon === 'black-hole') {
          const voidGeometry = new THREE.SphereGeometry(0.36, 24, 16);
          const voidMaterial = new THREE.MeshBasicMaterial({ color: '#010101' });
          phenomenon.add(new THREE.Mesh(voidGeometry, voidMaterial));
          geometries.push(voidGeometry);
          materials.push(voidMaterial);
        }
      } else if (
        blueprint.record.phenomenon === 'supernova-remnant' ||
        blueprint.record.phenomenon === 'orbital-resonance'
      ) {
        const ringCount = blueprint.record.phenomenon === 'orbital-resonance' ? 3 : 1;
        for (let index = 0; index < ringCount; index += 1) {
          const geometry = new THREE.RingGeometry(0.42 + index * 0.22, 0.435 + index * 0.22, 120);
          const ring = new THREE.Mesh(geometry, phenomenonMaterial);
          ring.rotation.set(index * 0.34, index * 0.18, index * 0.72);
          phenomenon.add(ring);
          geometries.push(geometry);
        }
      } else {
        const pointCount = this.quality === 'low' ? 38 : 84;
        const positions = new Float32Array(pointCount * 3);
        for (let index = 0; index < pointCount; index += 1) {
          const t = index / Math.max(pointCount - 1, 1);
          positions[index * 3] =
            blueprint.record.phenomenon === 'rift'
              ? Math.sin(t * 18) * 0.08
              : -t * (2.4 + blueprint.profile.spread);
          positions[index * 3 + 1] =
            blueprint.record.phenomenon === 'rift'
              ? (t - 0.5) * 2.8
              : Math.sin(t * 11) * (0.12 + t * 0.42);
          positions[index * 3 + 2] = Math.cos(t * 9) * 0.08;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
          color: blueprint.palette.core,
          size: blueprint.record.phenomenon === 'rift' ? 0.055 : 0.075,
          transparent: true,
          opacity: 0.52,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        phenomenon.add(new THREE.Points(geometry, material));
        geometries.push(geometry);
        materials.push(material);
      }
      resultGroup.add(phenomenon);
    }

    const preset = blueprint.profile.cameraPreset;
    resultGroup.position.x =
      preset === 'left-offset'
        ? -0.55
        : preset === 'right-offset'
          ? 1.35
          : preset === 'dual-center'
            ? 0.45
            : 0.85;
    resultGroup.position.y = preset === 'diagonal' ? 0.65 : 0;
    resultGroup.rotation.set(
      blueprint.profile.orientation.x,
      blueprint.profile.orientation.y,
      blueprint.profile.orientation.z,
    );
    resultGroup.scale.setScalar(blueprint.profile.scale);
    resultGroup.visible = false;
    this.group.add(resultGroup);
    this.result = {
      particleSystem,
      coreMaterials,
      animatedMaterials,
      orbitingBodies,
      geometries,
      materials,
      textures,
    };
  }

  pulseOnce() {
    this.pulse = 1;
  }

  update(
    time: number,
    delta: number,
    pointer: THREE.Vector2,
    interaction: number,
    attracting: boolean,
    quiet: boolean,
  ) {
    const previewVisible = this.stage !== 'universe' && this.stage !== 'generating';
    this.preview.points.visible = previewVisible;
    this.preview.material.uniforms.uTime!.value = time;
    this.preview.material.uniforms.uInteraction!.value = interaction * 0.5;
    this.preview.material.uniforms.uPointer!.value.copy(pointer);
    this.preview.material.uniforms.uAttract!.value = attracting ? 1 : 0;
    this.preview.material.uniforms.uOpacity!.value =
      this.stage === 'parameters' ? 0.68 : this.stage === 'sentence' ? 0.3 : 0.22;

    this.pulse = THREE.MathUtils.damp(this.pulse, 0, 3.1, delta);
    const generated = this.group.getObjectByName('generated-universe');
    if (generated && this.result && this.blueprint) {
      generated.visible = this.stage === 'universe' || this.stage === 'generating';
      const formation =
        this.stage === 'generating'
          ? THREE.MathUtils.smoothstep(this.transitionProgress, 0.62, 1)
          : 1;
      generated.scale.setScalar(this.blueprint.profile.scale * Math.max(0.03, formation));
      generated.rotation.y += delta * (0.006 + this.parameters.energy / 7500) * (quiet ? 0.18 : 1);
      const uniforms = this.result.particleSystem.material.uniforms;
      uniforms.uTime!.value += delta * (quiet ? 0.18 : 1);
      uniforms.uInteraction!.value = interaction * (quiet ? 0.25 : 1);
      uniforms.uAttract!.value = attracting ? 1 : 0;
      uniforms.uPointer!.value.copy(pointer);
      uniforms.uPulse!.value = this.pulse;
      uniforms.uOpacity!.value = (quiet ? 0.46 : 0.92) * formation;
      this.result.coreMaterials.forEach((material) => {
        material.uniforms.uTime!.value = time;
        material.uniforms.uPulse!.value = this.pulse;
      });
      this.result.animatedMaterials.forEach((material) => {
        if (material.uniforms.uTime) material.uniforms.uTime.value = time;
      });
      this.result.orbitingBodies.forEach((body) => {
        body.pivot.rotation.y += delta * body.speed * (quiet ? 0.2 : 1);
        body.mesh.rotation.y += delta * body.rotationSpeed * (quiet ? 0.2 : 1);
      });
      const phenomenon = generated.children.find((child) => child.name.startsWith('phenomenon-'));
      if (phenomenon) {
        phenomenon.rotation.z += delta * 0.018 * (quiet ? 0.16 : 1);
        phenomenon.rotation.y += delta * 0.009 * (quiet ? 0.16 : 1);
      }
    }
  }

  private disposeResult() {
    const generated = this.group.getObjectByName('generated-universe');
    if (generated) this.group.remove(generated);
    if (!this.result) return;
    this.result.particleSystem.dispose();
    this.result.geometries.forEach((geometry) => geometry.dispose());
    this.result.materials.forEach((material) => material.dispose());
    this.result.textures.forEach((texture) => texture.dispose());
    this.result = null;
  }

  dispose() {
    this.preview.dispose();
    this.disposeResult();
  }
}

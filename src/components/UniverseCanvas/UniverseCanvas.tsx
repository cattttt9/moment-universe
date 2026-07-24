import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { QUALITY_PIXEL_RATIOS } from '../../constants/universe';
import { InteractionController, type InteractionState } from '../../engine/interactionController';
import { createHazeTexture, createParticleSystem } from '../../engine/particleSystem';
import type { QualityLevel, UniverseBlueprint } from '../../types/universe';
import styles from './UniverseCanvas.module.css';

export interface UniverseCanvasHandle {
  capture: () => string | null;
}

interface UniverseCanvasProps {
  blueprint: UniverseBlueprint;
  quality: QualityLevel;
  quiet: boolean;
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

export const UniverseCanvas = forwardRef<UniverseCanvasHandle, UniverseCanvasProps>(
  function UniverseCanvas({ blueprint, quality, quiet }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const quietRef = useRef(quiet);
    const [available, setAvailable] = useState(true);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
      quietRef.current = quiet;
    }, [quiet]);

    useImperativeHandle(ref, () => ({
      capture: () => {
        try {
          return rendererRef.current?.domElement.toDataURL('image/png') ?? null;
        } catch {
          return null;
        }
      },
    }));

    useEffect(() => {
      const host = hostRef.current;
      if (!host || !isWebGLAvailable()) {
        setAvailable(false);
        return;
      }

      let animationFrame = 0;
      let disposed = false;
      let visible = !document.hidden;
      let cameraDistance = quality === 'low' ? 11.5 : 10.5;
      let targetCameraDistance = cameraDistance;
      let interactionTarget: InteractionState = {
        pointerX: 0,
        pointerY: 0,
        intensity: 0,
        attracting: false,
      };
      let interactionStrength = 0;
      let pulse = 0;
      let lastTime = performance.now();

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2('#050403', quality === 'low' ? 0.025 : 0.018);
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
      camera.position.set(0, 2.6, cameraDistance);
      camera.lookAt(0, 0, 0);

      const pixelRatio = Math.min(window.devicePixelRatio, QUALITY_PIXEL_RATIOS[quality]);
      const renderer = new THREE.WebGLRenderer({
        antialias: quality !== 'low',
        preserveDrawingBuffer: true,
        powerPreference: quality === 'high' ? 'high-performance' : 'default',
      });
      renderer.setClearColor('#050403', 1);
      renderer.setPixelRatio(pixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;
      host.appendChild(renderer.domElement);

      const universe = new THREE.Group();
      universe.position.x = window.innerWidth > 720 ? 1.45 : 0;
      universe.position.y = window.innerWidth > 720 ? 0 : 1.25;
      scene.add(universe);

      const particles = createParticleSystem(blueprint, pixelRatio);
      universe.add(particles.points);

      const coreMaterial = new THREE.MeshBasicMaterial({
        color: blueprint.palette.core,
        transparent: true,
        opacity: 0.96,
      });
      const coreGeometry = new THREE.SphereGeometry(
        0.12 + blueprint.config.energy / 950,
        quality === 'low' ? 20 : 32,
        quality === 'low' ? 12 : 20,
      );
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      universe.add(core);

      const coreGlowTexture = createHazeTexture(blueprint.palette.core);
      const coreGlowMaterial = new THREE.SpriteMaterial({
        map: coreGlowTexture,
        color: blueprint.palette.core,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.78,
      });
      const coreGlow = new THREE.Sprite(coreGlowMaterial);
      coreGlow.scale.setScalar(1.4 + blueprint.config.energy / 80);
      universe.add(coreGlow);

      const hazeTexture = createHazeTexture(blueprint.palette.haze);
      const hazeMaterial = new THREE.SpriteMaterial({
        map: hazeTexture,
        color: blueprint.palette.haze,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: quality === 'low' ? 0.08 : 0.13,
      });
      const hazes: THREE.Sprite[] = [];
      const hazeCount = quality === 'high' ? 5 : quality === 'medium' ? 3 : 1;
      for (let index = 0; index < hazeCount; index += 1) {
        const haze = new THREE.Sprite(hazeMaterial);
        const angle = (index / hazeCount) * Math.PI * 2 + index * 0.7;
        haze.position.set(Math.cos(angle) * (1.1 + index * 0.48), index * 0.08, Math.sin(angle));
        haze.scale.set(4.8 + index * 0.55, 2.1 + index * 0.25, 1);
        hazes.push(haze);
        universe.add(haze);
      }

      const orbitMaterial = new THREE.LineBasicMaterial({
        color: blueprint.palette.outer,
        transparent: true,
        opacity: 0.14,
      });
      const orbits: THREE.LineLoop[] = [];
      const orbitCount = quality === 'low' ? 1 : 3;
      for (let index = 0; index < orbitCount; index += 1) {
        const radius = 2.3 + index * 1.15;
        const points = Array.from({ length: 96 }, (_, pointIndex) => {
          const angle = (pointIndex / 96) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius * (0.18 + blueprint.orbitEccentricity * 0.22),
            Math.sin(angle) * radius,
          );
        });
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const orbit = new THREE.LineLoop(geometry, orbitMaterial);
        orbit.rotation.set(index * 0.13 - 0.26, index * 0.24, -0.2);
        orbits.push(orbit);
        universe.add(orbit);
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const controller = new InteractionController(host, {
        onPointer: (state) => {
          interactionTarget = state;
        },
        onPulse: () => {
          pulse = 1;
        },
        onZoom: (delta) => {
          targetCameraDistance = THREE.MathUtils.clamp(targetCameraDistance + delta, 7.2, 15);
        },
        onTap: (x, y) => {
          pointer.set(x, y);
          raycaster.setFromCamera(pointer, camera);
          if (raycaster.intersectObject(core, false).length > 0) setRevealed(true);
        },
      });

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        universe.position.x = width > 720 ? 1.45 : 0;
        universe.position.y = width > 720 ? 0 : 1.25;
      };

      const render = (now: number) => {
        if (disposed || !visible) return;
        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        const quietFactor = quietRef.current ? 0.18 : 1;
        interactionStrength = THREE.MathUtils.damp(
          interactionStrength,
          interactionTarget.intensity,
          4,
          delta,
        );
        interactionTarget.intensity *= Math.pow(0.84, delta * 60);
        pulse = THREE.MathUtils.damp(pulse, 0, 3.4, delta);
        cameraDistance = THREE.MathUtils.damp(cameraDistance, targetCameraDistance, 4, delta);
        camera.position.z = cameraDistance;

        particles.material.uniforms.uTime!.value += delta * quietFactor;
        particles.material.uniforms.uInteraction!.value = interactionStrength * quietFactor;
        particles.material.uniforms.uAttract!.value = interactionTarget.attracting ? 1 : 0;
        particles.material.uniforms.uPointer!.value.set(
          interactionTarget.pointerX,
          interactionTarget.pointerY,
        );
        particles.material.uniforms.uPulse!.value = pulse;
        particles.material.uniforms.uOpacity!.value = quietRef.current ? 0.62 : 0.92;
        orbitMaterial.opacity = quietRef.current ? 0.04 : 0.14;
        coreGlowMaterial.opacity = (quietRef.current ? 0.42 : 0.78) + pulse * 0.2;
        coreGlow.scale.setScalar(
          1.4 + blueprint.config.energy / 80 + pulse * (0.4 + blueprint.config.fluctuation / 130),
        );
        universe.rotation.y += delta * 0.012 * quietFactor;
        hazes.forEach((haze, index) => {
          haze.material.rotation += delta * (index % 2 === 0 ? 0.006 : -0.004) * quietFactor;
        });
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(render);
      };

      const handleVisibility = () => {
        visible = !document.hidden;
        if (visible && !disposed) {
          lastTime = performance.now();
          animationFrame = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(animationFrame);
        }
      };

      resize();
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', handleVisibility);
      animationFrame = requestAnimationFrame(render);

      return () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', handleVisibility);
        controller.dispose();
        particles.dispose();
        coreGeometry.dispose();
        coreMaterial.dispose();
        coreGlowMaterial.dispose();
        coreGlowTexture.dispose();
        hazeMaterial.dispose();
        hazeTexture.dispose();
        orbits.forEach((orbit) => orbit.geometry.dispose());
        orbitMaterial.dispose();
        scene.clear();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        rendererRef.current = null;
      };
    }, [blueprint, quality]);

    return (
      <div ref={hostRef} className={styles.host}>
        {!available && (
          <div className={styles.fallback} role="status">
            <span aria-hidden="true">○</span>
            <h2>这台设备暂时无法绘制动态星云</h2>
            <p>WebGL 不可用。你仍然可以查看档案信息并生成静态海报。</p>
          </div>
        )}
        {revealed && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setRevealed(false)}
            aria-label="收起原句"
          >
            「{blueprint.config.text}」
          </button>
        )}
      </div>
    );
  },
);

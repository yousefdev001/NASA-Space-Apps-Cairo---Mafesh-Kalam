import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut } from 'lucide-react';
import {
  createAstronautModel,
  createCrewCapsuleModel,
  createNasaSpacecraftModel,
  createRelaySatelliteModel,
  createSpaceEnvironment,
} from '../three/models';
import {
  CAMERA_PRESETS,
  SUBSYSTEM_INFO,
  clampCameraZoom,
  computeExplodedOffsets,
  getCameraPreset,
  type CameraPresetId,
  type SubsystemHitId,
} from '../three/sceneConfig';
import { createProceduralTextures } from '../three/textures';

import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { TapeStrip } from './HandDrawnDecor';

gsap.registerPlugin(ScrollTrigger);

// Pre-allocated scratch vectors for zero-GC animation loop
const _desiredCamPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _pointer = new THREE.Vector2();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function OrbitalSceneSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const inspectorCardRef = useRef<HTMLDivElement | null>(null);

  const [activePreset, setActivePreset] = useState<CameraPresetId>('astronaut');
  const [explodeLevel, setExplodeLevel] = useState<number>(0);
  const [autoDrift, setAutoDrift] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [selectedSubsystem, setSelectedSubsystem] =
    useState<SubsystemHitId>('chest-ecg');
  const [webglError, setWebglError] = useState<boolean>(false);

  // Mutable refs for WebGL loop without tearing down canvas on React state updates
  const targetPresetRef = useRef<CameraPresetId>('astronaut');
  const cameraAnimatingRef = useRef<boolean>(false);
  const zoomTargetDistanceRef = useRef<number | null>(null);
  const explodeTargetRef = useRef<number>(0);
  const explodeCurrentRef = useRef<number>(0);
  const autoDriftRef = useRef<boolean>(true);
  const scrollProgressRef = useRef<number>(0);
  const onSelectSubsystemRef = useRef<(id: SubsystemHitId) => void>(() => {});
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  onSelectSubsystemRef.current = (id: SubsystemHitId) => {
    setSelectedSubsystem(id);
  };

  useEffect(() => {
    autoDriftRef.current = autoDrift;
  }, [autoDrift]);

  useEffect(() => {
    explodeTargetRef.current = explodeLevel;
  }, [explodeLevel]);

  // GSAP ScrollTrigger parallax tracking across the 3D Orbital section (zero scroll blocking)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress - 0.5;
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // GSAP subtle entrance pop when inspected subsystem changes
  useEffect(() => {
    if (!inspectorCardRef.current) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      inspectorCardRef.current,
      { y: 10, opacity: 0.7 },
      { y: 0, opacity: 1, duration: 0.25, ease: 'power3.out', clearProps: 'transform' }
    );
  }, [selectedSubsystem]);

  // Keyboard shortcut 'H' to toggle HUD dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Main Three.js WebGL lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebglError(true);
    };
    const onContextRestored = () => {
      setWebglError(false);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050a);
    scene.fog = new THREE.FogExp2(0x03050a, 0.014);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const initialPreset = getCameraPreset('astronaut');
    const camera = new THREE.PerspectiveCamera(width < 520 ? 54 : 45, width / height, 0.1, 150);
    camera.position.set(...initialPreset.position);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...initialPreset.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    // CRITICAL SCROLL FIX: Disable OrbitControls wheel hijack so vertical page scroll works smoothly over the 3D model
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minDistance = 2.6;
    controls.maxDistance = 16;
    controls.update();
    // Allow vertical touch swipes to scroll the page naturally while horizontal drags orbit the 3D scene
    canvas.style.touchAction = 'pan-y';
    controlsRef.current = controls;

    const onControlsStart = () => {
      cameraAnimatingRef.current = false;
      zoomTargetDistanceRef.current = null;
    };
    controls.addEventListener('start', onControlsStart);

    // Optional Ctrl/Cmd + Wheel zoom (normal wheel always scrolls the page up/down)
    const onWheelZoom = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      const currentDist = camera.position.distanceTo(controls.target);
      const nextDist = clampCameraZoom(currentDist + e.deltaY * 0.008);
      zoomTargetDistanceRef.current = nextDist;
    };
    canvas.addEventListener('wheel', onWheelZoom, { passive: false });

    // 3-Point Orbital Lighting Rig
    const sunKeyLight = new THREE.DirectionalLight(0xfff4e0, 2.35);
    sunKeyLight.position.set(7, 8, 6);
    if (!isSoftwareGl) {
      sunKeyLight.castShadow = true;
      sunKeyLight.shadow.mapSize.set(1024, 1024);
      sunKeyLight.shadow.camera.near = 1;
      sunKeyLight.shadow.camera.far = 30;
      const d = 6;
      sunKeyLight.shadow.camera.left = -d;
      sunKeyLight.shadow.camera.right = d;
      sunKeyLight.shadow.camera.top = d;
      sunKeyLight.shadow.camera.bottom = -d;
      sunKeyLight.shadow.bias = -0.0005;
      sunKeyLight.shadow.normalBias = 0.02;
    }
    scene.add(sunKeyLight);

    const earthHemiLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 0.9);
    scene.add(earthHemiLight);

    const orangeRimLight = new THREE.DirectionalLight(0xff4d00, 1.5);
    orangeRimLight.position.set(-6, 3, -5);
    scene.add(orangeRimLight);

    // Procedural Textures & Composite Multi-Part Space Models
    const textures = createProceduralTextures(
      renderer.capabilities.getMaxAnisotropy()
    );
    const spaceEnv = createSpaceEnvironment(textures);
    scene.add(spaceEnv.root);

    const spacecraft = createNasaSpacecraftModel(textures);
    spacecraft.root.position.set(-2.6, 0.55, -4.3);
    spacecraft.root.rotation.set(0.14, 0.42, -0.06);
    scene.add(spacecraft.root);

    const capsule = createCrewCapsuleModel(textures);
    capsule.root.position.set(4.5, 1.25, -3.2);
    capsule.root.rotation.set(0.28, -0.45, 0.36);
    scene.add(capsule.root);

    const relaySat = createRelaySatelliteModel(textures);
    relaySat.root.position.set(5.4, -1.0, -6.2);
    relaySat.root.rotation.set(0.18, -0.35, -0.15);
    scene.add(relaySat.root);

    const astronaut = createAstronautModel(textures);
    astronaut.root.position.set(0, 0.2, 0);
    astronaut.root.rotation.y = -0.25;
    scene.add(astronaut.root);

    const baseCoords = {
      helmetY: astronaut.helmetGroup.position.y,
      visorZ: astronaut.visorGroup.position.z,
      chestZ: astronaut.chestGroup.position.z,
      plssZ: astronaut.plssGroup.position.z,
      leftArmX: astronaut.leftArmGroup.position.x,
      rightArmX: astronaut.rightArmGroup.position.x,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycaster for interactive 3D EVA subsystem inspection
    const raycaster = new THREE.Raycaster();
    const clickables = [
      ...astronaut.interactables,
      ...spacecraft.interactables,
      ...capsule.interactables,
    ];
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(clickables, true);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.subsystemId as
          | SubsystemHitId
          | undefined;
        if (hitId) {
          onSelectSubsystemRef.current(hitId);
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 720;
      camera.fov = w < 520 ? 54 : 45;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let disposed = false;
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const scrollParallax = scrollProgressRef.current;

      // Gentle zero-G orbital kinematics + GSAP scroll parallax
      if (autoDriftRef.current) {
        astronaut.root.position.y =
          0.2 + Math.sin(elapsed * 0.9) * 0.12 - scrollParallax * 0.45;
        astronaut.root.rotation.y =
          -0.25 + Math.sin(elapsed * 0.45) * 0.16 + scrollParallax * 0.25;
        astronaut.root.rotation.z = Math.cos(elapsed * 0.65) * 0.04;
        astronaut.leftArmGroup.rotation.x = Math.sin(elapsed * 1.1) * 0.08;
        astronaut.rightArmGroup.rotation.x = -Math.sin(elapsed * 1.1) * 0.08;

        capsule.root.position.y =
          1.25 + Math.cos(elapsed * 0.7) * 0.14 + scrollParallax * 0.55;
        capsule.root.rotation.y = -0.45 + Math.sin(elapsed * 0.3) * 0.1;

        relaySat.root.position.y =
          -1.0 + Math.sin(elapsed * 0.8 + 1.2) * 0.16;
        relaySat.root.rotation.y = -0.35 + elapsed * 0.08;

        spaceEnv.earthMesh.rotation.y += delta * 0.015;
        spaceEnv.moonMesh.rotation.y += delta * 0.01;
        spaceEnv.stars.rotation.y += delta * 0.005;
        spacecraft.dishGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.22;
      }

      // Smooth exponential damping for Exploded Suit inspection
      explodeCurrentRef.current = THREE.MathUtils.damp(
        explodeCurrentRef.current,
        explodeTargetRef.current,
        6,
        delta
      );
      const offsets = computeExplodedOffsets(explodeCurrentRef.current);
      astronaut.helmetGroup.position.y = baseCoords.helmetY + offsets.helmetY;
      astronaut.visorGroup.position.z = baseCoords.visorZ + offsets.visorZ;
      astronaut.chestGroup.position.z = baseCoords.chestZ + offsets.chestZ;
      astronaut.plssGroup.position.z = baseCoords.plssZ + offsets.plssZ;
      astronaut.leftArmGroup.position.x = baseCoords.leftArmX + offsets.leftArmX;
      astronaut.rightArmGroup.position.x = baseCoords.rightArmX + offsets.rightArmX;

      // Smooth exponential damping for scripted Camera Presets
      if (cameraAnimatingRef.current) {
        const preset = getCameraPreset(targetPresetRef.current);
        _desiredCamPos.set(...preset.position);
        _desiredTarget.set(...preset.target);

        const alpha = 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(_desiredCamPos, alpha);
        controls.target.lerp(_desiredTarget, alpha);

        if (
          camera.position.distanceTo(_desiredCamPos) < 0.03 &&
          controls.target.distanceTo(_desiredTarget) < 0.03
        ) {
          camera.position.copy(_desiredCamPos);
          controls.target.copy(_desiredTarget);
          cameraAnimatingRef.current = false;
        }
      } else if (zoomTargetDistanceRef.current !== null) {
        _camOffset.copy(camera.position).sub(controls.target);
        const currentDist = _camOffset.length();
        const nextDist = THREE.MathUtils.damp(
          currentDist,
          zoomTargetDistanceRef.current,
          8,
          delta
        );
        _camOffset.normalize().multiplyScalar(nextDist);
        camera.position.copy(controls.target).add(_camOffset);

        if (Math.abs(nextDist - zoomTargetDistanceRef.current) < 0.02) {
          zoomTargetDistanceRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('wheel', onWheelZoom);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      controls.removeEventListener('start', onControlsStart);
      controls.dispose();
      cameraRef.current = null;
      controlsRef.current = null;

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      textures.dispose();
      envTexture.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  const handleSelectPreset = (presetId: CameraPresetId) => {
    const preset = getCameraPreset(presetId);
    setActivePreset(presetId);
    targetPresetRef.current = presetId;
    zoomTargetDistanceRef.current = null;
    cameraAnimatingRef.current = true;
    setExplodeLevel(preset.defaultExplode);

    if (presetId === 'station') {
      setSelectedSubsystem('spacecraft');
    } else if (presetId === 'capsule') {
      setSelectedSubsystem('capsule');
    } else if (presetId === 'exploded') {
      setSelectedSubsystem('helmet');
    }
  };

  const handleZoomStep = (deltaDistance: number) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    cameraAnimatingRef.current = false;
    const current = zoomTargetDistanceRef.current ?? cam.position.distanceTo(ctrl.target);
    zoomTargetDistanceRef.current = clampCameraZoom(current + deltaDistance);
  };

  const activeInfo = SUBSYSTEM_INFO[selectedSubsystem];

  return (
    <section
      ref={sectionRef}
      id="orbital-3d"
      aria-labelledby="orbital-3d-heading"
      className="scroll-mt-24 py-12 sm:py-16 lg:py-20 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <p className="font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00] mb-1">
              Interactive WebGL Blueprint · Drag to Orbit · Scroll Page Freely
            </p>
            <h2
              id="orbital-3d-heading"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[#2d2d2d] dark:text-white leading-tight"
            >
              Suit &amp; Orbital Fleet Rig
            </h2>
          </div>
          <span
            style={getWobblyBorderStyle('wobblyTag')}
            className="self-start sm:self-auto bg-[#fff9c4] dark:bg-[#18110c] text-[#2d2d2d] dark:text-[#FF4D00] border-2 border-[#2d2d2d] dark:border-[#FF4D00] px-3 sm:px-4 py-1 text-sm sm:text-base -rotate-1 sketch-shadow-card"
          >
            Click astronaut, NASA module, or capsule
          </span>
        </div>

        {/* Wobbly Sketch Frame around Isolated WebGL Viewport */}
        <div
          style={getWobblyBorderStyle('wobblyMd')}
          className="relative w-full h-[400px] sm:h-[540px] lg:h-[640px] bg-[#03050a] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] sketch-shadow-lg overflow-hidden"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30">
            <TapeStrip />
          </div>

          {/* Dedicated Isolated WebGL Canvas Mount */}
          <div
            ref={mountRef}
            data-testid="orbital-3d-canvas-mount"
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {webglError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#03050a] text-white p-6 sm:p-8 text-center">
              <p className="font-sans text-base sm:text-lg text-[#ff4d4d] dark:text-[#FF4D00] mb-2">
                WebGL context paused
              </p>
              <h3 className="font-display font-bold text-2xl sm:text-3xl">
                3D EVA Stage Standby
              </h3>
              <p className="font-sans text-sm sm:text-base text-white/80 max-w-md mt-2">
                Hardware graphics are unavailable here. Live orbital biometrics remain
                interactive below.
              </p>
            </div>
          )}

          {/* Top-Left Hand-Drawn Subsystem Inspector Sticky Note (Tablet/Desktop) */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 pointer-events-none max-w-[270px] sm:max-w-xs">
            <div
              ref={inspectorCardRef}
              data-testid="subsystem-inspector"
              style={getWobblyBorderStyle('wobblySm')}
              className="pointer-events-auto hidden sm:block bg-[#fff9c4] dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-4 py-3 -rotate-1 sketch-shadow"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-display font-bold text-sm text-[#ff4d4d] dark:text-[#FF4D00]">
                  {activeInfo.code}
                </span>
                <span className="font-sans text-xs text-[#2d2d2d]/75 dark:text-white/75">
                  {activeInfo.metric}
                </span>
              </div>
              <p className="font-display font-bold text-lg leading-snug text-[#2d2d2d] dark:text-white">
                {activeInfo.title}
              </p>
              <p className="font-sans text-sm text-[#2d2d2d]/85 dark:text-white/85 mt-1 leading-snug">
                {activeInfo.detail}
              </p>
            </div>
          </div>

          {/* Collapsible Bottom Sketch Control Dock (Solid Surface, Zero Backdrop Blur) */}
          <div
            className={`absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(960px,96%)] transition-transform duration-200 ${
              dockCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
            }`}
          >
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setDockCollapsed((prev) => !prev)}
                aria-expanded={!dockCollapsed}
                style={getWobblyBorderStyle('wobblySm')}
                className="bg-[#fdfbf7] dark:bg-black text-[#2d2d2d] dark:text-white border-2 border-b-0 border-[#2d2d2d] dark:border-[#FF4D00] px-3.5 sm:px-4 py-1 font-sans text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00] dark:hover:text-black transition-colors"
              >
                {dockCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                    <span>Show 3D Controls (H)</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                    <span>Hide Controls (H)</span>
                  </>
                )}
              </button>
            </div>

            <div
              style={getWobblyBorderStyle('wobblyMd')}
              className="bg-[#fdfbf7] dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-2.5 py-2 sm:px-4 sm:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-2.5 sketch-shadow"
            >
              {/* Camera View Presets — Single horizontal swipe strip on mobile */}
              <div
                className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
                role="group"
                aria-label="3D Camera View Presets"
              >
                {CAMERA_PRESETS.map((preset) => {
                  const active = preset.id === activePreset;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      aria-pressed={active}
                      style={getWobblyBorderStyle('wobblySm')}
                      className={`font-sans text-xs sm:text-sm px-2.5 py-1.5 border-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black border-[#2d2d2d] dark:border-white font-bold'
                          : 'bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-[#2d2d2d] dark:border-white/30 hover:bg-[#fff9c4] dark:hover:border-[#FF4D00]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Exploded Suit Slider + Zoom Buttons + Drift Toggle */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-2 sm:gap-2.5">
                <label className="flex items-center gap-1.5 sm:gap-2 font-sans text-xs sm:text-sm text-[#2d2d2d] dark:text-white whitespace-nowrap">
                  <span>Explode</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={explodeLevel}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setExplodeLevel(val);
                      if (val > 0.1 && activePreset !== 'exploded') {
                        setActivePreset('exploded');
                      } else if (val === 0 && activePreset === 'exploded') {
                        setActivePreset('astronaut');
                      }
                    }}
                    aria-label="Explode astronaut suit layers"
                    className="w-16 sm:w-20 accent-[#ff4d4d] dark:accent-[#FF4D00] cursor-pointer"
                  />
                  <span className="tabular-nums text-[#ff4d4d] dark:text-[#FF4D00] w-8 text-right font-bold">
                    {Math.round(explodeLevel * 100)}%
                  </span>
                </label>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1" role="group" aria-label="3D Zoom controls">
                    <button
                      type="button"
                      onClick={() => handleZoomStep(-1.3)}
                      aria-label="Zoom in 3D camera"
                      style={getWobblyBorderStyle('wobblySm')}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-white/30 hover:bg-[#e5e0d8] dark:hover:bg-[#FF4D00] dark:hover:text-black cursor-pointer transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoomStep(1.3)}
                      aria-label="Zoom out 3D camera"
                      style={getWobblyBorderStyle('wobblySm')}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-white/30 hover:bg-[#e5e0d8] dark:hover:bg-[#FF4D00] dark:hover:text-black cursor-pointer transition-colors"
                    >
                      <ZoomOut className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoDrift((prev) => !prev)}
                    aria-pressed={autoDrift}
                    style={getWobblyBorderStyle('wobbly')}
                    className={`font-sans text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 border-2 transition-colors cursor-pointer whitespace-nowrap ${
                      autoDrift
                        ? 'bg-[#2d5da1] dark:bg-white text-white dark:text-black border-[#2d2d2d] dark:border-white font-bold'
                        : 'bg-[#e5e0d8] dark:bg-black text-[#2d2d2d] dark:text-white/80 border-[#2d2d2d] dark:border-white/30'
                    }`}
                  >
                    {autoDrift ? 'Zero-G: On' : 'Zero-G: Off'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Subsystem Inspector Sticky Note below stage so 3D viewport stays unobstructed */}
        <div
          style={getWobblyBorderStyle('wobblySm')}
          className="sm:hidden mt-4 bg-[#fff9c4] dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-4 py-3 sketch-shadow"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-display font-bold text-sm text-[#ff4d4d] dark:text-[#FF4D00]">
              {activeInfo.code}
            </span>
            <span className="font-sans text-xs text-[#2d2d2d]/75 dark:text-white/75">
              {activeInfo.metric}
            </span>
          </div>
          <p className="font-display font-bold text-lg leading-snug text-[#2d2d2d] dark:text-white">
            {activeInfo.title}
          </p>
          <p className="font-sans text-sm text-[#2d2d2d]/85 dark:text-white/85 mt-1 leading-snug">
            {activeInfo.detail}
          </p>
        </div>
      </div>
    </section>
  );
}

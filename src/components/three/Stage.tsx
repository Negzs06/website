'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { Core } from './Core';
import { DataField } from './DataField';
import { sampleBeats, type Sampled } from '@/lib/choreography';
import { story, damp } from '@/lib/story';
import { useExperience, BUDGET } from '@/stores/useExperience';

/* ------------------------------------------------------------------
   Camera rig — samples the timeline and drives everything.
   ------------------------------------------------------------------ */

function Rig({ state }: { state: React.RefObject<Sampled> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const target = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(0, 0.35, 8.4));
  const ready = useRef(0);

  useFrame((_, rawDt) => {
    // Clamp dt: a tab returning from the background reports a huge
    // delta, and an un-clamped damp would teleport the camera.
    const dt = Math.min(rawDt, 1 / 30);

    // Smoothed pointer, shared with everything else in the scene.
    story.smooth.x = damp(story.smooth.x, story.pointer.x, 3.6, dt);
    story.smooth.y = damp(story.smooth.y, story.pointer.y, 3.6, dt);

    const s = sampleBeats(story.progress);
    state.current = s;

    // Pointer parallax on the camera. Small — the scene should feel
    // responsive to the visitor, not steered by them.
    const px = story.smooth.x * 0.55;
    const py = story.smooth.y * 0.32;

    pos.current.set(s.cam[0] + px, s.cam[1] + py, s.cam[2]);
    camera.position.lerp(pos.current, 1 - Math.exp(-7 * dt));

    target.current.set(s.look[0] + px * 0.16, s.look[1] + py * 0.1, s.look[2]);
    camera.lookAt(target.current);

    if (Math.abs(camera.fov - s.fov) > 0.01) {
      camera.fov = damp(camera.fov, s.fov, 7, dt);
      camera.updateProjectionMatrix();
    }

    gl.toneMappingExposure = s.exposure;

    // Announce readiness once a few real frames have gone through, so
    // the loader's progress bar reflects a scene that is genuinely
    // compiled rather than merely mounted.
    if (ready.current < 4) {
      ready.current += 1;
      if (ready.current === 4) {
        window.dispatchEvent(new CustomEvent('chronolith:scene', { detail: 1 }));
      }
    }
  });

  return null;
}

/* ------------------------------------------------------------------
   Post — every effect here is doing a job.
   ------------------------------------------------------------------ */

function Post({ state, tier }: { state: React.RefObject<Sampled>; tier: 'high' | 'mid' | 'low' }) {
  const bloom = useRef<{ intensity: number } | null>(null);
  const ca = useRef<{ offset: THREE.Vector2 } | null>(null);
  const offset = useRef(new THREE.Vector2(0.0005, 0.0005));

  useFrame((_, dt) => {
    const s = state.current;
    if (!s) return;
    if (bloom.current) bloom.current.intensity = s.bloom;
    if (ca.current) {
      // Aberration tracks scroll velocity. It is invisible at rest and
      // only shows up when the visitor is moving fast, which is the
      // only time an optical artefact like this is earned.
      const v = Math.abs(story.velocity);
      const amt = 0.00018 + v * 0.0032;
      offset.current.x = damp(offset.current.x, amt, 9, Math.min(dt, 0.05));
      offset.current.y = offset.current.x * 0.55;
      ca.current.offset = offset.current;
    }
  });

  if (tier === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <Vignette offset={0.28} darkness={0.62} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={tier === 'high' ? 2 : 0}>
      <Bloom
        ref={bloom as never}
        intensity={0.45}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.28}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />
      <ChromaticAberration ref={ca as never} offset={offset.current} />
      <Noise opacity={0.032} premultiply blendFunction={BlendFunction.OVERLAY} />
      <Vignette offset={0.26} darkness={0.66} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

/* ------------------------------------------------------------------
   Lighting — built from lightformers, so there is no HDRI to ship.
   ------------------------------------------------------------------ */

function Lighting() {
  return (
    <>
      {/* Rendered once: nothing in this environment moves, so paying
          for it every frame would be pure waste. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#05060a']} />
        {/* Key: a broad soft source overhead, warm. */}
        <Lightformer
          form="rect"
          intensity={5.2}
          color="#fff3dc"
          position={[0, 6, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 9, 1]}
        />
        {/* Oxide rim from camera left — the only warm accent. */}
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#ff7a3c"
          position={[-5, 0.5, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[7, 5, 1]}
        />
        {/* Halite fill from camera right, cold. */}
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#89c4bb"
          position={[5, -0.5, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[7, 5, 1]}
        />
        {/* A tight bright ring behind, for the edge of the glass. */}
        <Lightformer
          form="ring"
          intensity={7}
          color="#ffffff"
          position={[0, 1.5, -6]}
          scale={[4, 4, 1]}
        />
        {/* Floor bounce, dim, keeps the underside from going flat black. */}
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#6f7f7c"
          position={[0, -6, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[9, 9, 1]}
        />
      </Environment>

      {/* One real light so the instanced beds have a consistent key
          even where the environment contribution is weak. */}
      <directionalLight position={[-4, 6, 4]} intensity={1.15} color="#fff1d8" />
      <ambientLight intensity={0.18} color="#93b3ac" />
    </>
  );
}

/* ------------------------------------------------------------------
   The stage itself.
   ------------------------------------------------------------------ */

export function Stage() {
  const tier = useExperience((s) => s.tier);
  const reduced = useExperience((s) => s.reduced);
  const menuOpen = useExperience((s) => s.menuOpen);
  const [mounted, setMounted] = useState(false);
  const state = useRef<Sampled>(sampleBeats(0));

  const budget = BUDGET[tier];

  useEffect(() => setMounted(true), []);

  // If WebGL is unavailable the scene simply never reports ready; tell
  // the loader so it does not sit waiting on a canvas that cannot exist.
  useEffect(() => {
    if (!mounted) return;
    const canvas = document.createElement('canvas');
    const ok = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    if (!ok) window.dispatchEvent(new CustomEvent('chronolith:scene', { detail: 1 }));
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="gl-stage" data-ready={String(!reduced)} aria-hidden="true">
      <Canvas
        dpr={budget.dpr}
        // Parking the loop while the index is open hands the whole GPU
        // back for the duration — there is nothing visible behind it.
        frameloop={menuOpen ? 'never' : 'always'}
        gl={{
          antialias: false, // the composer handles AA; MSAA on the
          // default framebuffer would be paid for and thrown away
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0.35, 8.4], fov: 38, near: 0.1, far: 60 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <Rig state={state} />
        <Lighting />
        <Core state={state} transmission={budget.transmission} />
        <DataField count={budget.particles} state={state} />
        {!reduced && <Post state={state} tier={tier} />}
      </Canvas>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { wipeVert, wipeFrag } from '@/shaders/wipe';
import { damp } from '@/lib/story';
import { useExperience, BUDGET } from '@/stores/useExperience';

type Props = {
  /** Plate basenames, in register order. */
  plates: string[];
  /** Index currently under the pointer. */
  active: number;
};

function Quad({ plates, active }: Props) {
  const { viewport, gl } = useThree();
  const mat = useRef<THREE.ShaderMaterial>(null);

  // The pair currently being blended: `from` is what is on screen,
  // `to` is what we are moving toward.
  const pair = useRef({ from: 0, to: 0, progress: 0, last: 0 });

  const sizes = useMemo(
    () => plates.map(() => new THREE.Vector2(640, 640)),
    [plates],
  );

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return plates.map((name, i) => {
      // The real pixel dimensions arrive with the decode; `cover` needs
      // them or every plate gets cropped as if it were square.
      const t = loader.load(`/images/${name}-640.webp`, (tex) => {
        sizes[i].set(tex.image.width, tex.image.height);
      });
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      return t;
    });
  }, [plates, sizes]);

  const noise = useMemo(() => {
    const t = new THREE.TextureLoader().load('/textures/noise-rgba.png');
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTexA: { value: textures[0] },
      uTexB: { value: textures[0] },
      uNoise: { value: noise },
      uProgress: { value: 0 },
      uVelocity: { value: 0 },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uPlane: { value: new THREE.Vector2(1, 1) },
      uImageA: { value: sizes[0] },
      uImageB: { value: sizes[0] },
    }),
    [textures, noise, sizes],
  );

  useEffect(() => {
    return () => {
      textures.forEach((t) => t.dispose());
      noise.dispose();
    };
  }, [textures, noise]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const u = uniforms;
    const p = pair.current;

    u.uTime.value += dt;

    // When the target changes, whatever is currently displayed becomes
    // the new `from`. Snapping progress back to 0 mid-wipe would cause a
    // visible jump, so the settled frame is committed first.
    if (active !== p.to) {
      if (p.progress > 0.5) p.from = p.to;
      p.to = active;
      p.progress = p.progress > 0.5 ? 0 : p.progress;
    }

    const target = 1;
    const next = damp(p.progress, target, 4.6, dt);
    u.uVelocity.value = Math.abs(next - p.progress) / Math.max(dt, 1e-4) * 0.35;
    p.progress = next;

    u.uTexA.value = textures[p.from] ?? textures[0];
    u.uTexB.value = textures[p.to] ?? textures[0];
    u.uImageA.value = sizes[p.from] ?? sizes[0];
    u.uImageB.value = sizes[p.to] ?? sizes[0];
    u.uProgress.value = p.progress;
    u.uPlane.value.set(viewport.width, viewport.height);
    u.uHover.value = damp(u.uHover.value, 1, 3, dt);
  });

  useEffect(() => {
    gl.setClearAlpha(0);
  }, [gl]);

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={wipeVert}
        fragmentShader={wipeFrag}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/**
 * A single WebGL plane that shows whichever record is under the
 * pointer. One canvas, one draw call, six textures — the effect is
 * doing real work (a displacement wipe with a moving front) rather
 * than being WebGL for its own sake, and it degrades to a plain
 * cross-faded image stack on reduced motion and low-end devices.
 */
export function PlateViewer({ plates, active }: Props) {
  const tier = useExperience((s) => s.tier);
  const reduced = useExperience((s) => s.reduced);

  if (reduced || tier === 'low') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {plates.map((name, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={`/images/${name}-640.webp`}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: i === active ? 1 : 0,
              transition: 'opacity .5s ease',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <Canvas
      dpr={BUDGET[tier].dpr}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Quad plates={plates} active={active} />
    </Canvas>
  );
}

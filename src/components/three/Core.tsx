'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { strataVert, strataFrag } from '@/shaders/strata';
import type { Sampled } from '@/lib/choreography';

const BANDS = 30;
const CORE_H = 7.0;
const CORE_R = 0.50;

/** Bed colours, drawn from the same palette as the CSS. */
const PALETTE = [
  new THREE.Color('#e7e2d6'),
  new THREE.Color('#d7d0c1'),
  new THREE.Color('#a8a091'),
  new THREE.Color('#6f6a61'),
  new THREE.Color('#c2502a'),
  new THREE.Color('#8bb0a7'),
  new THREE.Color('#f4e9cd'),
];

/** Deterministic PRNG so the core is the same object on every load. */
function makeRng(seed: number) {
  let x = seed;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

/**
 * The core: a stack of instanced beds inside a transmissive shell.
 *
 * The beds are one InstancedMesh — thirty separate meshes would be
 * thirty draw calls per frame plus thirty more through the transmission
 * pass, which is the sort of thing that quietly costs 8ms on a laptop.
 */
export function Core({
  state,
  transmission,
}: {
  state: React.RefObject<Sampled>;
  transmission: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const shellMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const uniforms = useRef({
    uTime: { value: 0 },
    uSeparate: { value: 0 },
    uDissolve: { value: 0 },
    uWrite: { value: 0 },
    uWriteOn: { value: 0 },
    uKey: { value: new THREE.Color('#f4e9cd') },
    uFill: { value: new THREE.Color('#8bb0a7') },
    uHot: { value: new THREE.Color('#ff6a2e') },
    uOpacity: { value: 1 },
  });

  // ---- instance layout, built once ----
  const { matrices, tints, seeds, bands } = useMemo(() => {
    const rng = makeRng(0x5eed1);
    const m = new THREE.Matrix4();
    const matrices = new Float32Array(BANDS * 16);
    const tints = new Float32Array(BANDS * 3);
    const seeds = new Float32Array(BANDS);
    const bands = new Float32Array(BANDS);

    // Bed thicknesses are uneven, the way a real sequence is: a few
    // thick beds carry the composition and the rest are partings.
    const thicknesses: number[] = [];
    let total = 0;
    for (let i = 0; i < BANDS; i++) {
      const t = 0.35 + Math.pow(rng(), 2.1) * 2.4;
      thicknesses.push(t);
      total += t;
    }

    let y = -CORE_H / 2;
    for (let i = 0; i < BANDS; i++) {
      const h = (thicknesses[i] / total) * CORE_H;
      const cy = y + h / 2;
      y += h;

      // Slight radius variation so the silhouette is not a perfect
      // extrusion, plus a small random tilt.
      const r = CORE_R * (0.80 + rng() * 0.035);
      m.compose(
        new THREE.Vector3(0, cy, 0),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rng() - 0.5) * 0.02, rng() * Math.PI, (rng() - 0.5) * 0.02),
        ),
        new THREE.Vector3(r / 0.5, (h * 0.93) / 1, r / 0.5),
      );
      m.toArray(matrices, i * 16);

      // Colour. The sequence is overwhelmingly neutral: a stack where
      // every third bed is a different hue reads as confectionery, not
      // as rock. Oxide and halite appear rarely enough to be events.
      const roll = rng();
      const c = new THREE.Color();
      if (roll > 0.93) c.copy(PALETTE[4]); // oxide — 7%
      else if (roll > 0.88) c.copy(PALETTE[5]); // halite — 5%
      else {
        // Neutrals, biased pale, with the value varying continuously
        // rather than snapping between four fixed swatches.
        const t = Math.pow(rng(), 1.5);
        c.copy(PALETTE[0]).lerp(PALETTE[3], t);
        // A whisper of warmth or cool on each bed, never more.
        c.lerp(rng() > 0.5 ? PALETTE[4] : PALETTE[5], rng() * 0.09);
      }
      c.toArray(tints, i * 3);

      seeds[i] = rng();
      bands[i] = i / (BANDS - 1);
    }
    return { matrices, tints, seeds, bands };
  }, []);

  const geo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1, false), []);

  useMemo(() => {
    // Seed the instance matrices once the geometry exists.
    return () => geo.dispose();
  }, [geo]);

  useFrame((_, dt) => {
    const s = state.current;
    if (!s) return;
    const u = uniforms.current;

    u.uTime.value += dt;
    u.uSeparate.value = s.separate;
    u.uDissolve.value = s.dissolve;
    u.uOpacity.value = 1 - s.dissolve * 0.35;

    // The write head sweeps the length of the core while the
    // inscription beat is active, then parks.
    u.uWriteOn.value = s.write;
    if (s.write > 0.01) {
      u.uWrite.value = (Math.sin(u.uTime.value * 0.75) * 0.5 + 0.5);
    }

    if (group.current) {
      group.current.rotation.y = s.turn + u.uTime.value * s.spin;
    }
    if (shellMat.current) {
      shellMat.current.opacity = s.glass;
      shellMat.current.transmission = transmission ? s.glass : 0;
      // The shell stops receiving pointer-ray work and stops being
      // drawn at all once it is effectively invisible.
      if (shell.current) shell.current.visible = s.glass > 0.02;
    }
  });

  return (
    <group ref={group}>
      {/* --- the beds --- */}
      <instancedMesh
        ref={mesh}
        args={[geo, undefined, BANDS]}
        frustumCulled={false}
        onUpdate={(self) => {
          self.instanceMatrix.array.set(matrices);
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <instancedBufferAttribute attach="geometry-attributes-aTint" args={[tints, 3]} />
        <instancedBufferAttribute attach="geometry-attributes-aSeed" args={[seeds, 1]} />
        <instancedBufferAttribute attach="geometry-attributes-aBand" args={[bands, 1]} />
        <shaderMaterial
          vertexShader={strataVert}
          fragmentShader={strataFrag}
          uniforms={uniforms.current}
          transparent
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* --- the glass shell ---
          One transmissive body. Dispersion splits the refraction into
          colour at the rim, which is the detail that makes it read as
          real glass rather than a translucent plastic tube. */}
      <mesh ref={shell} renderOrder={2}>
        <cylinderGeometry args={[CORE_R + 0.14, CORE_R + 0.14, CORE_H + 0.2, 64, 1, false]} />
        <meshPhysicalMaterial
          ref={shellMat}
          transmission={transmission ? 1 : 0}
          thickness={1.35}
          roughness={0.055}
          ior={1.52}
          dispersion={transmission ? 3.2 : 0}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.08}
          attenuationDistance={3.2}
          attenuationColor={new THREE.Color('#9fbdb4')}
          transparent
          opacity={1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* End caps — polished silica, catching the key light. */}
      {[-1, 1].map((dir) => (
        <mesh key={dir} position={[0, dir * (CORE_H / 2 + 0.1), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[CORE_R + 0.14, 64]} />
          <meshPhysicalMaterial
            color="#3c4643"
            roughness={0.72}
            metalness={0.05}
            clearcoat={0.35}
            clearcoatRoughness={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

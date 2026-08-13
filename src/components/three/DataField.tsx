'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildDataField, dataFieldVert, dataFieldFrag } from '@/shaders/dataField';
import { story, damp } from '@/lib/story';
import type { Sampled } from '@/lib/choreography';

/**
 * The record itself, as points.
 *
 * Additive blending with depth writing off — depth-sorting tens of
 * thousands of transparent points every frame is not affordable, and
 * additive light accumulation is the correct model here anyway: these
 * are meant to look like light trapped in glass, not like objects.
 */
export function DataField({
  count,
  state,
}: {
  count: number;
  state: React.RefObject<Sampled>;
}) {
  const points = useRef<THREE.Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const data = useMemo(() => buildDataField(count), [count]);

  const uniforms = useRef({
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uRibbon: { value: 0 },
    uDrift: { value: 0.04 },
    uSize: { value: 1.0 },
    uPixelRatio: { value: 1 },
    uPointer: { value: new THREE.Vector3(0, 0, 1) },
    uOpacity: { value: 0.3 },
    uColdColor: { value: new THREE.Color('#9fc3ba') },
    uWarmColor: { value: new THREE.Color('#f4e9cd') },
    uHotColor: { value: new THREE.Color('#ff7738') },
    uFogNear: { value: 4.0 },
    uFogFar: { value: 22.0 },
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // `position` must exist for three to compute anything, but the real
    // positions come from the three target attributes.
    g.setAttribute('position', new THREE.BufferAttribute(data.core, 3));
    g.setAttribute('aCore', new THREE.BufferAttribute(data.core, 3));
    g.setAttribute('aShell', new THREE.BufferAttribute(data.shell, 3));
    g.setAttribute('aRibbon', new THREE.BufferAttribute(data.ribbon, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(data.seed, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(data.scale, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    return g;
  }, [data]);

  useFrame((_, dt) => {
    const s = state.current;
    if (!s) return;
    const u = uniforms.current;

    u.uTime.value += dt;
    u.uMorph.value = s.morph;
    u.uRibbon.value = s.ribbon;
    u.uDrift.value = s.drift;
    u.uOpacity.value = s.particles;
    u.uPixelRatio.value = dpr;

    // Pointer parallax, damped so it glides rather than snaps.
    u.uPointer.value.x = damp(u.uPointer.value.x, story.smooth.x, 3.2, dt);
    u.uPointer.value.y = damp(u.uPointer.value.y, story.smooth.y, 3.2, dt);
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={dataFieldVert}
        fragmentShader={dataFieldFrag}
        uniforms={uniforms.current}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

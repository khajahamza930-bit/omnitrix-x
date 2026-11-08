import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Hologram effects that every alien can use.

const SPARK_COUNT = 40;

// a repeatable number from 0 to 1, so the sparks always start the same way
function pseudoRandom(n) {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

// small green sparks drifting upwards around the alien
export function DataSparks({ height = 2, radius = 0.8 }) {
  const points = useRef();

  const data = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const speeds = new Float32Array(SPARK_COUNT);
    for (let i = 0; i < SPARK_COUNT; i++) {
      const angle = pseudoRandom(i) * Math.PI * 2;
      const distance = radius + pseudoRandom(i + 50) * 0.3;
      positions[i * 3] = Math.cos(angle) * distance;
      positions[i * 3 + 1] = pseudoRandom(i + 100) * height;
      positions[i * 3 + 2] = Math.sin(angle) * distance;
      speeds[i] = 0.12 + pseudoRandom(i + 150) * 0.2;
    }
    return { positions, speeds };
  }, [height, radius]);

  useFrame((state, delta) => {
    if (!points.current) return;
    const attribute = points.current.geometry.attributes.position;
    for (let i = 0; i < SPARK_COUNT; i++) {
      let y = attribute.array[i * 3 + 1] + data.speeds[i] * delta;
      if (y > height) y = 0.05;
      attribute.array[i * 3 + 1] = y;
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#9dffb4"
        size={0.03}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// a thin ring of light that sweeps up the alien
export function ScanRing({ height = 2, radius = 0.8 }) {
  const ring = useRef();

  useFrame((state) => {
    if (!ring.current) return;
    const progress = (state.clock.elapsedTime * 0.35) % 1;
    ring.current.position.y = progress * height;
    ring.current.material.opacity = 0.7 * Math.sin(progress * Math.PI);
  });

  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 8, 48]} />
      <meshBasicMaterial
        color="#9dffb4"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
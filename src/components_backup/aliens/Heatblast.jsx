
import React from "react";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function FlameSpike({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.18, 0.65, 6]} />
      <meshStandardMaterial
        color="#ff5b16"
        emissive="#ff3500"
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

export default function Heatblast({ hologram = true }) {
  const alienRef = useRef();

  useFrame((state) => {
    if (!alienRef.current) return;

    alienRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 2) * 0.08;

    alienRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
  });

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: hologram ? "#19ff75" : "#d93612",
    emissive: hologram ? "#00ff66" : "#ff3000",
    emissiveIntensity: hologram ? 1.2 : 0.8,
    transparent: hologram,
    opacity: hologram ? 0.72 : 1,
    wireframe: hologram,
  });

  const flameMaterial = new THREE.MeshStandardMaterial({
    color: hologram ? "#43ff9b" : "#ff6b16",
    emissive: hologram ? "#00ff66" : "#ff3300",
    emissiveIntensity: 1.5,
    transparent: hologram,
    opacity: hologram ? 0.8 : 1,
  });

  return (
    <group ref={alienRef} position={[0, 1.45, 0]} scale={0.85}>
      {/* BODY */}
      <mesh position={[0, 0, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.32, 0.65, 6, 12]} />
      </mesh>

      {/* HEAD */}
      <mesh position={[0, 0.85, 0]} material={flameMaterial}>
        <sphereGeometry args={[0.34, 16, 16]} />
      </mesh>

      {/* FLAME HEAD SPIKES */}
      <FlameSpike position={[-0.2, 1.18, 0]} scale={1.1} />
      <FlameSpike position={[0, 1.3, 0]} scale={1.3} />
      <FlameSpike position={[0.2, 1.18, 0]} scale={1.1} />

      {/* EYES */}
      <mesh position={[-0.13, 0.9, 0.29]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>

      <mesh position={[0.13, 0.9, 0.29]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>

      {/* LEFT ARM */}
      <mesh position={[-0.48, 0.05, 0]} rotation={[0, 0, -0.35]} material={bodyMaterial}>
        <capsuleGeometry args={[0.13, 0.5, 5, 10]} />
      </mesh>

      {/* RIGHT ARM */}
      <mesh position={[0.48, 0.05, 0]} rotation={[0, 0, 0.35]} material={bodyMaterial}>
        <capsuleGeometry args={[0.13, 0.5, 5, 10]} />
      </mesh>

      {/* LEFT LEG */}
      <mesh position={[-0.18, -0.65, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.14, 0.48, 5, 10]} />
      </mesh>

      {/* RIGHT LEG */}
      <mesh position={[0.18, -0.65, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.14, 0.48, 5, 10]} />
      </mesh>

      {/* SHOULDER FLAMES */}
      <FlameSpike position={[-0.42, 0.35, 0]} rotation={[0, 0, 0.8]} />
      <FlameSpike position={[0.42, 0.35, 0]} rotation={[0, 0, -0.8]} />

      {/* OMNITRIX CHEST SYMBOL */}
      <mesh position={[0, 0.12, 0.31]}>
        <circleGeometry args={[0.12, 6]} />
        <meshBasicMaterial color="#b5ff00" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

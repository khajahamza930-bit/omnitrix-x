
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function HoloMaterial({ opacity = 0.72 }) {
  return (
    <meshStandardMaterial
      color="#8aff62"
      emissive="#36ff24"
      emissiveIntensity={1.8}
      transparent
      opacity={opacity}
      roughness={0.25}
      metalness={0.15}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
}

function FlameSpike({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.13, 0.48, 8]} />
      <HoloMaterial opacity={0.55} />
    </mesh>
  );
}

function HeatblastModel() {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.24, 20, 20]} />
        <HoloMaterial />
      </mesh>

      {/* Flame-shaped crown */}
      <FlameSpike position={[0, 1.22, 0]} scale={[1.2, 1.5, 1]} />
      <FlameSpike
        position={[-0.17, 1.13, 0]}
        rotation={[0, 0, 0.45]}
      />
      <FlameSpike
        position={[0.17, 1.14, 0]}
        rotation={[0, 0, -0.45]}
      />

      {/* Neck */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.18, 12]} />
        <HoloMaterial />
      </mesh>

      {/* Chest and torso */}
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.2, 0.38, 5, 12]} />
        <HoloMaterial />
      </mesh>

      {/* Shoulder flames */}
      <FlameSpike position={[-0.31, 0.58, 0]} rotation={[0, 0, 0.8]} />
      <FlameSpike position={[0.31, 0.58, 0]} rotation={[0, 0, -0.8]} />

      {/* Arms */}
      <mesh position={[-0.31, 0.28, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.075, 0.3, 5, 10]} />
        <HoloMaterial />
      </mesh>

      <mesh position={[0.31, 0.28, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.075, 0.3, 5, 10]} />
        <HoloMaterial />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.34, 0.06, 0]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <HoloMaterial />
      </mesh>

      <mesh position={[0.34, 0.06, 0]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <HoloMaterial />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.12, -0.1, 0]}>
        <capsuleGeometry args={[0.085, 0.32, 5, 10]} />
        <HoloMaterial />
      </mesh>

      <mesh position={[0.12, -0.1, 0]}>
        <capsuleGeometry args={[0.085, 0.32, 5, 10]} />
        <HoloMaterial />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.13, -0.34, 0.05]}>
        <boxGeometry args={[0.16, 0.09, 0.24]} />
        <HoloMaterial />
      </mesh>

      <mesh position={[0.13, -0.34, 0.05]}>
        <boxGeometry args={[0.16, 0.09, 0.24]} />
        <HoloMaterial />
      </mesh>

      {/* Fire details on the shoulders and back */}
      <FlameSpike
        position={[-0.22, 0.78, -0.02]}
        rotation={[0, 0, 0.6]}
        scale={0.65}
      />
      <FlameSpike
        position={[0.22, 0.78, -0.02]}
        rotation={[0, 0, -0.6]}
        scale={0.65}
      />
    </group>
  );
}

export default function HologramAlien({ alien }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Gentle floating animation
    groupRef.current.position.y = 1.25 + Math.sin(time * 2) * 0.045;

    // Subtle hologram rotation
    groupRef.current.rotation.y = Math.sin(time * 0.6) * 0.12;
  });

  if (!alien) return null;

  return (
    <group ref={groupRef} position={[0, 1.25, 0]}>
      {/* First prototype: Heatblast-style hologram */}
      <group scale={0.85}>
        <HeatblastModel />
      </group>

      {/* Hologram base ring */}
      <mesh
        position={[0, -0.43, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.38, 0.43, 48]} />
        <meshBasicMaterial
          color="#75ff45"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

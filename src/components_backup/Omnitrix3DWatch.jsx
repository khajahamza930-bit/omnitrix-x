
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";

import Heatblast from "./aliens/Heatblast";

function Screw({ position }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.055, 0.055, 0.025, 16]} />
      <meshStandardMaterial
        color="#a7b6ad"
        metalness={0.9}
        roughness={0.25}
      />
    </mesh>
  );
}

function WatchBody() {
  return (
    <group>
      {/* Main watch body */}
      <mesh>
        <cylinderGeometry args={[1.55, 1.55, 0.32, 64]} />
        <meshStandardMaterial
          color="#202a26"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>

      {/* Outer metal rim */}
      <mesh position={[0, 0.18, 0]}>
        <torusGeometry args={[1.43, 0.11, 16, 64]} />
        <meshStandardMaterial
          color="#9ca9a1"
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      {/* Green glowing ring */}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[1.22, 0.045, 16, 64]} />
        <meshStandardMaterial
          color="#32ff65"
          emissive="#00ff40"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Dark watch face */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.08, 64]} />
        <meshStandardMaterial
          color="#07120d"
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Screws */}
      {[
        [-1.3, 0.2, 0],
        [1.3, 0.2, 0],
        [0, 0.2, -1.3],
        [0, 0.2, 1.3],
      ].map((position, index) => (
        <Screw key={index} position={position} />
      ))}

      {/* Side buttons */}
      <mesh position={[1.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.25, 24]} />
        <meshStandardMaterial
          color="#38ed68"
          metalness={0.7}
          emissive="#00ff44"
          emissiveIntensity={0.7}
        />
      </mesh>

      <mesh position={[-1.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.25, 24]} />
        <meshStandardMaterial color="#aab4ae" metalness={0.9} />
      </mesh>
    </group>
  );
}

function Hourglass() {
  return (
    <group position={[0, 0.27, 0]} rotation={[0, 0, Math.PI]}>
      <mesh>
        <torusGeometry args={[0.28, 0.055, 16, 48]} />
        <meshStandardMaterial
          color="#70ff8a"
          emissive="#00ff44"
          emissiveIntensity={2}
        />
      </mesh>

      <mesh>
        <coneGeometry args={[0.22, 0.38, 6]} />
        <meshBasicMaterial
          color="#45ff75"
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function AlienPortrait({ alien }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const loadedTexture = loader.load(alien.image);
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    return loadedTexture;
  }, [alien.image]);

  return (
    <mesh position={[0, 0.28, 0]}>
      <circleGeometry args={[0.35, 32]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AlienRotor({ aliens, selectedIndex, onSelect }) {
  const radius = 1.02;

  return (
    <group rotation={[0, 0, 0]}>
      {aliens.map((alien, index) => {
        const angle =
          (index / aliens.length) * Math.PI * 2;

        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <group
            key={alien.id}
            position={[x, 0.28, z]}
            rotation={[0, angle, 0]}
            onClick={() => onSelect(index)}
          >
            <mesh>
              <circleGeometry args={[0.22, 32]} />
              <meshStandardMaterial
                color={
                  selectedIndex === index
                    ? "#49ff79"
                    : "#17251c"
                }
                emissive={
                  selectedIndex === index
                    ? "#00ff44"
                    : "#001c09"
                }
                emissiveIntensity={
                  selectedIndex === index ? 2 : 0.3
                }
                side={THREE.DoubleSide}
              />
            </mesh>

            <AlienPortrait alien={alien} />
          </group>
        );
      })}
    </group>
  );
}

function WatchScene({ aliens, selectedIndex, onSelect }) {
  return (
    <>
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[4, 6, 5]}
        intensity={2}
      />

      <pointLight
        position={[0, 3, 0]}
        intensity={2}
        color="#36ff70"
      />

      <group
        rotation={[-0.2, 0, 0.12]}
        position={[0, -0.05, 0]}
      >
        <WatchBody />

        <AlienRotor
          aliens={aliens}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
        />

        <Hourglass />

        {/* Custom Heatblast hologram */}
        <Heatblast hologram={true} />
      </group>

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.35}
        scale={5}
        blur={2}
      />

      <Environment preset="city" />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        minPolarAngle={0.5}
        maxPolarAngle={2.2}
      />
    </>
  );
}

export default function Omnitrix3DWatch({
  aliens = [],
  selectedIndex = 0,
  onSelect,
}) {
  if (!aliens.length) {
    return <p>Loading alien database...</p>;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "520px",
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: [0, 3.1, 3.8],
          fov: 45,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
        shadows
      >
        <WatchScene
          aliens={aliens}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
        />
      </Canvas>
    </div>
  );
}

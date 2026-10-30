import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  OrbitControls,
} from "@react-three/drei";
import { DoubleSide } from "three";

import Heatblast from "./aliens/Heatblast";

// --------------------------------------------------
// METAL RINGS
// --------------------------------------------------

function MetalRing({ radius, tube, color, emissive = "#000000" }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, tube, 20, 96]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.22}
        emissive={emissive}
        emissiveIntensity={1}
      />
    </mesh>
  );
}

// --------------------------------------------------
// OMNITRIX WATCH BODY
// --------------------------------------------------

function WatchBody() {
  return (
    <group position={[0, -0.85, 0]}>
      {/* Main watch housing */}
      <mesh>
        <cylinderGeometry args={[1.35, 1.35, 0.34, 96]} />
        <meshStandardMaterial
          color="#202a27"
          metalness={0.95}
          roughness={0.25}
        />
      </mesh>

      {/* Upper metal bezel */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[1.25, 1.35, 0.12, 96]} />
        <meshStandardMaterial
          color="#a5b4ae"
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      {/* Dark screen */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[1.16, 1.16, 0.055, 96]} />
        <meshStandardMaterial
          color="#07130d"
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>

      {/* Outer green energy ring */}
      <MetalRing
        radius={1.13}
        tube={0.055}
        color="#67ff80"
        emissive="#00ff33"
      />

      {/* Inner green energy ring */}
      <MetalRing
        radius={0.94}
        tube={0.018}
        color="#20a849"
        emissive="#00ff33"
      />

      {/* Omnitrix symbol */}
      <mesh position={[0, 0.32, 0]}>
        <circleGeometry args={[0.31, 6]} />
        <meshBasicMaterial color="#9bff42" />
      </mesh>

      {/* Right-side button */}
      <mesh position={[1.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.3, 32]} />
        <meshStandardMaterial
          color="#91ff5b"
          metalness={0.8}
          emissive="#24ff45"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Left-side button */}
      <mesh position={[-1.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 32]} />
        <meshStandardMaterial color="#aab5b0" metalness={0.9} />
      </mesh>
    </group>
  );
}

// --------------------------------------------------
// HOLOGRAM ENERGY BEAM (taller now, rings lie flat)
// --------------------------------------------------

function EnergyBeam() {
  return (
    <group position={[0, 0.4, 0]}>
      {/* see-through projection beam */}
      <mesh>
        <cylinderGeometry args={[0.55, 0.9, 1.9, 48, 1, true]} />
        <meshBasicMaterial
          color="#42ff80"
          transparent
          opacity={0.05}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* bottom ring */}
      <mesh position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.018, 12, 64]} />
        <meshBasicMaterial color="#42ff80" />
      </mesh>

      {/* top ring */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.018, 12, 64]} />
        <meshBasicMaterial color="#42ff80" />
      </mesh>
    </group>
  );
}

// --------------------------------------------------
// ALIEN HOLOGRAM DISPLAY
// --------------------------------------------------

// height of the watch screen, the alien stands on this
const PLATFORM_TOP = -0.55;

function HologramDisplay({ selectedIndex }) {
  // only Heatblast has a real model for now
  if (selectedIndex === 0) {
    return (
      <group position={[0, PLATFORM_TOP + 0.12, 0]}>
        <Float speed={1.5} rotationIntensity={0} floatIntensity={0.5}>
          <Heatblast />
        </Float>
      </group>
    );
  }

  // placeholder for the other aliens
  return (
    <group position={[0, 0.9, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial
          color="#36ff80"
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}

// --------------------------------------------------
// COMPLETE WATCH SCENE
// --------------------------------------------------

function WatchScene({ selectedIndex }) {
  return (
    <>
      {/* Background */}
      <color attach="background" args={["#050a07"]} />

      {/* Lighting */}
      <ambientLight intensity={1.2} />

      <directionalLight position={[4, 6, 5]} intensity={2.5} />

      <pointLight position={[0, 2, 0]} intensity={2} color="#38ff76" />

      <pointLight position={[-3, 1, 2]} intensity={1.2} color="#1bff8a" />

      {/* Watch */}
      <WatchBody />

      {/* Projection beam */}
      <EnergyBeam />

      {/* Selected alien */}
      <Suspense fallback={null}>
        <HologramDisplay selectedIndex={selectedIndex} />
      </Suspense>

      {/* Ground shadows (softer, so no hard dark square) */}
      <ContactShadows
        position={[0, -1.04, 0]}
        opacity={0.25}
        scale={8}
        blur={3.5}
        far={2}
      />

      {/* Environment */}
      <Environment preset="city" />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.8}
        maxPolarAngle={1.8}
      />
    </>
  );
}

// --------------------------------------------------
// MAIN OMNITRIX 3D WATCH COMPONENT
// --------------------------------------------------

export default function Omnitrix3DWatch({ aliens = [], selectedIndex = 0 }) {
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
          position: [0, 2.7, 5.5],
          fov: 42,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
        dpr={[1, 1.5]}
      >
        <WatchScene selectedIndex={selectedIndex} />
      </Canvas>
    </div>
  );
}
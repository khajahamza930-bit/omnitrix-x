import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Html,
  OrbitControls,
} from "@react-three/drei";
import { AdditiveBlending, DoubleSide } from "three";

import alienModels from "./aliens/index";
import { useHologramClock } from "./hologram/hologramMaterials";

// the height of the watch screen, the alien stands here
const PLATFORM_TOP = -0.55;

// ---------- metal rings ----------

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

// ---------- the watch ----------

function WatchBody() {
  return (
    <group position={[0, -0.85, 0]}>
      {/* main body */}
      <mesh>
        <cylinderGeometry args={[1.35, 1.35, 0.34, 96]} />
        <meshStandardMaterial color="#202a27" metalness={0.95} roughness={0.25} />
      </mesh>

      {/* metal edge on top */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[1.25, 1.35, 0.12, 96]} />
        <meshStandardMaterial color="#a5b4ae" metalness={1} roughness={0.2} />
      </mesh>

      {/* glowing green screen */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[1.16, 1.16, 0.055, 96]} />
        <meshStandardMaterial
          color="#1a9a40"
          emissive="#2cff5a"
          emissiveIntensity={1.1}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* green rings */}
      <MetalRing radius={1.13} tube={0.055} color="#67ff80" emissive="#00ff33" />
      <MetalRing radius={0.94} tube={0.018} color="#20a849" emissive="#00ff33" />

      {/* Omnitrix symbol, lying flat on the screen */}
      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.31, 6]} />
        <meshBasicMaterial color="#9bff42" />
      </mesh>

      {/* right button */}
      <mesh position={[1.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.3, 32]} />
        <meshStandardMaterial
          color="#91ff5b"
          metalness={0.8}
          emissive="#24ff45"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* left button */}
      <mesh position={[-1.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 32]} />
        <meshStandardMaterial color="#aab5b0" metalness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- the green projection beam ----------

function EnergyBeam() {
  return (
    <group position={[0, 0.75, 0]}>
      {/* see-through beam */}
      <mesh>
        <cylinderGeometry args={[0.75, 0.9, 2.6, 48, 1, true]} />
        <meshBasicMaterial
          color="#42ff80"
          transparent
          opacity={0.04}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* top ring */}
      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.018, 12, 64]} />
        <meshBasicMaterial color="#42ff80" />
      </mesh>
    </group>
  );
}

// ---------- glowing light disc under the alien ----------

function HologramBase() {
  return (
    <group position={[0, PLATFORM_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* big soft glow */}
      <mesh>
        <circleGeometry args={[0.95, 64]} />
        <meshBasicMaterial
          color="#4dff7a"
          transparent
          opacity={0.16}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* brighter middle */}
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[0.55, 64]} />
        <meshBasicMaterial
          color="#9dffb4"
          transparent
          opacity={0.1}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ---------- thin lines of light that swirl around the alien ----------

function SwirlRing({ radius, speed, tilt, height }) {
  const ring = useRef();

  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <group position={[0, PLATFORM_TOP + height, 0]} rotation={tilt}>
      <mesh ref={ring}>
        <torusGeometry args={[radius, 0.01, 8, 80, Math.PI * 1.3]} />
        <meshBasicMaterial
          color="#8dffa8"
          transparent
          opacity={0.7}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function EnergySwirl() {
  return (
    <group>
      <SwirlRing radius={0.8} speed={0.9} tilt={[Math.PI / 2.3, 0, 0.3]} height={0.7} />
      <SwirlRing radius={0.65} speed={-1.2} tilt={[Math.PI / 2.6, 0, -0.4]} height={1.2} />
      <SwirlRing radius={0.55} speed={1.5} tilt={[Math.PI / 2.2, 0, 0.1]} height={1.7} />
    </group>
  );
}

// ---------- the alien on top of the watch ----------

// shown when an alien does not have a 3D model yet
function ComingSoon({ alien }) {
  return (
    <group position={[0, 0.9, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial color="#36ff80" wireframe transparent opacity={0.65} />
      </mesh>

      <Html center position={[0, 0.8, 0]}>
        <div
          style={{
            color: "#b6ff3a",
            fontSize: "11px",
            letterSpacing: "1px",
            textAlign: "center",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {alien.name.toUpperCase()}
          <br />
          3D MODEL COMING SOON
        </div>
      </Html>
    </group>
  );
}

function HologramDisplay({ alien }) {
  // find the model for this alien using its id
  const Model = alienModels[alien.id];

  if (!Model) {
    return <ComingSoon alien={alien} />;
  }

  return (
    <group position={[0, PLATFORM_TOP + 0.12, 0]}>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.5}>
        <Model />
      </Float>
    </group>
  );
}

// ---------- the whole scene ----------

function WatchScene({ alien }) {
  // keeps the hologram time moving
  useHologramClock();

  return (
    <>
      {/* background */}
      <color attach="background" args={["#050a07"]} />

      {/* lights */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} />
      <pointLight position={[0, 2, 0]} intensity={2} color="#38ff76" />
      <pointLight position={[-3, 1, 2]} intensity={1.2} color="#1bff8a" />

      <WatchBody />
      <HologramBase />
      <EnergyBeam />
      <EnergySwirl />

      <Suspense fallback={null}>
        <HologramDisplay alien={alien} />
      </Suspense>

      {/* soft shadow under the watch */}
      <ContactShadows
        position={[0, -1.04, 0]}
        opacity={0.25}
        scale={8}
        blur={3.5}
        far={2}
      />

      <Environment preset="city" />

      {/* the user can drag to rotate */}
      <OrbitControls
        target={[0, 0.7, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.8}
        maxPolarAngle={1.8}
      />
    </>
  );
}

// ---------- main component ----------

export default function Omnitrix3DWatch({ aliens = [], selectedIndex = 0 }) {
  const selectedAlien = aliens[selectedIndex];

  if (!selectedAlien) {
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
        camera={{ position: [0, 2.3, 4.8], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <WatchScene alien={selectedAlien} />
      </Canvas>
    </div>
  );
}
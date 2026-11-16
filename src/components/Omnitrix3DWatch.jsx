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

const PLATFORM_TOP = -0.55;

// Per-alien presentation adjustments. Model source files remain untouched.
const SHOWCASE_SCALE = {
  1: 1.48,
  2: 1.12,
  3: 1.32,
  4: 1.18,
  5: 1.30,
  6: 1.18,
  7: 1.16,
  8: 1.30,
  9: 1.05,
  10: 1.28,
  11: 1.15,
};

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

function WatchBody() {
  return (
    <group position={[0, -0.85, 0]}>
      <mesh>
        <cylinderGeometry args={[1.35, 1.35, 0.34, 96]} />
        <meshStandardMaterial color="#202a27" metalness={0.95} roughness={0.25} />
      </mesh>

      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[1.25, 1.35, 0.12, 96]} />
        <meshStandardMaterial color="#a5b4ae" metalness={1} roughness={0.2} />
      </mesh>

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

      <MetalRing radius={1.13} tube={0.055} color="#67ff80" emissive="#00ff33" />
      <MetalRing radius={0.94} tube={0.018} color="#20a849" emissive="#00ff33" />
      <MetalRing radius={1.30} tube={0.025} color="#71877a" emissive="#164e2b" />

      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.31, 6]} />
        <meshBasicMaterial color="#9bff42" />
      </mesh>

      <mesh position={[1.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.3, 32]} />
        <meshStandardMaterial
          color="#91ff5b"
          metalness={0.8}
          emissive="#24ff45"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh position={[-1.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 32]} />
        <meshStandardMaterial color="#aab5b0" metalness={0.9} />
      </mesh>
    </group>
  );
}

function EnergyBeam() {
  const beam = useRef();
  const innerBeam = useRef();

  useFrame((state) => {
    const pulse = 0.045 + (Math.sin(state.clock.elapsedTime * 2.1) + 1) * 0.018;

    if (beam.current) beam.current.opacity = pulse;
    if (innerBeam.current) {
      innerBeam.current.opacity =
        0.025 + (Math.sin(state.clock.elapsedTime * 2.1 + 1) + 1) * 0.012;
    }
  });

  return (
    <group position={[0, 0.75, 0]}>
      <mesh>
        <cylinderGeometry args={[0.82, 0.96, 2.6, 64, 1, true]} />
        <meshBasicMaterial
          ref={beam}
          color="#42ff80"
          transparent
          opacity={0.05}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <cylinderGeometry args={[0.70, 0.78, 2.6, 48, 1, true]} />
        <meshBasicMaterial
          ref={innerBeam}
          color="#a2ffb4"
          transparent
          opacity={0.035}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.025, 12, 96]} />
        <meshBasicMaterial color="#75ff98" />
      </mesh>
    </group>
  );
}

function HologramBase() {
  return (
    <group position={[0, PLATFORM_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[1.05, 96]} />
        <meshBasicMaterial
          color="#4dff7a"
          transparent
          opacity={0.19}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[0.65, 96]} />
        <meshBasicMaterial
          color="#9dffb4"
          transparent
          opacity={0.14}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SwirlRing({ radius, speed, tilt, height }) {
  const ring = useRef();

  useFrame((state) => {
    if (ring.current) {
      ring.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <group position={[0, PLATFORM_TOP + height, 0]} rotation={tilt}>
      <mesh ref={ring}>
        <torusGeometry args={[radius, 0.012, 8, 96, Math.PI * 1.55]} />
        <meshBasicMaterial
          color="#8dffa8"
          transparent
          opacity={0.8}
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
      <SwirlRing radius={0.91} speed={0.65} tilt={[Math.PI / 2.3, 0, 0.3]} height={0.65} />
      <SwirlRing radius={0.74} speed={-0.9} tilt={[Math.PI / 2.6, 0, -0.4]} height={1.15} />
      <SwirlRing radius={0.62} speed={1.1} tilt={[Math.PI / 2.2, 0, 0.1]} height={1.75} />
    </group>
  );
}

const PARTICLES = Array.from({ length: 28 }, (_, index) => {
  const angle = index * 2.399;
  const radius = 0.85 + (index % 5) * 0.12;

  return [
    Math.cos(angle) * radius,
    -0.35 + (index % 7) * 0.31,
    Math.sin(angle) * radius,
  ];
});

function HologramParticles() {
  const particleGroup = useRef();

  useFrame((state) => {
    if (particleGroup.current) {
      particleGroup.current.rotation.y = state.clock.elapsedTime * 0.09;
    }
  });

  return (
    <group ref={particleGroup}>
      {PARTICLES.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[index % 4 === 0 ? 0.018 : 0.009, 8, 8]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? "#c5ff9b" : "#42ff80"}
            transparent
            opacity={0.65}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function ScanRing() {
  const scan = useRef();

  useFrame((state) => {
    if (scan.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.045;
      scan.current.scale.set(pulse, pulse, pulse);
      scan.current.rotation.z = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <mesh
      ref={scan}
      position={[0, PLATFORM_TOP + 0.035, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[1.0, 1.035, 96]} />
      <meshBasicMaterial
        color="#b4ffb7"
        transparent
        opacity={0.72}
        blending={AdditiveBlending}
        side={DoubleSide}
      />
    </mesh>
  );
}

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
  const Model = alienModels[alien.id];

  if (!Model) return <ComingSoon alien={alien} />;

  const scale = SHOWCASE_SCALE[alien.id] ?? 1.25;

  return (
    <group position={[0, PLATFORM_TOP + 0.12, 0]} scale={scale}>
      <Float speed={1.35} rotationIntensity={0.035} floatIntensity={0.22}>
        <Model />
      </Float>
    </group>
  );
}

function WatchScene({ alien }) {
  useHologramClock();

  return (
    <>
      <color attach="background" args={["#050a07"]} />

      <fog attach="fog" args={["#050a07", 8, 16]} />

      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 7, 5]} intensity={2.1} />
      <directionalLight position={[-4, 3, -3]} intensity={0.8} color="#8affae" />
      <pointLight position={[0, 2.8, 0]} intensity={2.8} color="#38ff76" />
      <pointLight position={[-3, 1, 2]} intensity={1.5} color="#1bff8a" />
      <pointLight position={[3, 0.2, -2]} intensity={1.0} color="#b0ff70" />

      <WatchBody />
      <HologramBase />
      <EnergyBeam />
      <EnergySwirl />
      <HologramParticles />
      <ScanRing />

      <Suspense fallback={null}>
        <HologramDisplay alien={alien} />
      </Suspense>

      <ContactShadows
        position={[0, -1.04, 0]}
        opacity={0.32}
        scale={8}
        blur={3.5}
        far={2}
      />

      <Environment preset="city" />

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

export default function Omnitrix3DWatch({ aliens = [], selectedIndex = 0 }) {
  const selectedAlien = aliens[selectedIndex];

  if (!selectedAlien) return <p>Loading alien database...</p>;

  return (
    <div className="omnitrix-watch-canvas">
      <Canvas
        camera={{ position: [0, 2.25, 4.65], fov: 39 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <WatchScene alien={selectedAlien} />
      </Canvas>
    </div>
  );
}




import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --------------------------------------------------
// OMNITRIX GREEN HOLOGRAM MATERIALS
// --------------------------------------------------

const rockMaterial = new THREE.MeshStandardMaterial({
  color: "#65d936",
  emissive: "#1d870c",
  emissiveIntensity: 0.65,
  roughness: 0.48,
  metalness: 0.2,
  transparent: true,
  opacity: 0.96,
});

const darkRockMaterial = new THREE.MeshStandardMaterial({
  color: "#183c24",
  emissive: "#087b25",
  emissiveIntensity: 0.8,
  roughness: 0.65,
  metalness: 0.25,
  transparent: true,
  opacity: 0.95,
});

const flameMaterial = new THREE.MeshStandardMaterial({
  color: "#a5ff55",
  emissive: "#49ff00",
  emissiveIntensity: 2.1,
  roughness: 0.28,
  transparent: true,
  opacity: 0.96,
  side: THREE.DoubleSide,
});

const brightMaterial = new THREE.MeshBasicMaterial({
  color: "#d9ff9c",
});

const fissureMaterial = new THREE.MeshBasicMaterial({
  color: "#b8ff55",
});

const eyeMaterial = new THREE.MeshBasicMaterial({
  color: "#edffbd",
});

// --------------------------------------------------
// CUSTOM FLAME GEOMETRY
// --------------------------------------------------

function createFlameGeometry(height = 0.6, radius = 0.14) {
  const geometry = new THREE.BufferGeometry();

  const segments = 12;
  const rings = 7;
  const positions = [];
  const indices = [];

  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const y = t * height;

    const taper = Math.pow(1 - t, 0.85);
    const wave = Math.sin(t * Math.PI * 2) * radius * 0.22;
    const currentRadius = radius * taper;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      positions.push(
        Math.cos(angle) * currentRadius + wave,
        y,
        Math.sin(angle) * currentRadius
      );
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * (segments + 1) + i;
      const b = a + segments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function Flame({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  height = 0.6,
  radius = 0.14,
}) {
  const geometry = useMemo(
    () => createFlameGeometry(height, radius),
    [height, radius]
  );

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      material={flameMaterial}
    />
  );
}

// --------------------------------------------------
// VOLCANIC ROCK PLATES
// --------------------------------------------------

function RockPlate({
  position,
  scale,
  rotation = [0, 0, 0],
  dark = false,
}) {
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation}
      material={dark ? darkRockMaterial : rockMaterial}
    >
      <dodecahedronGeometry args={[1, 1]} />
    </mesh>
  );
}

// --------------------------------------------------
// CHEST AND ABDOMEN DETAILS
// --------------------------------------------------

function ChestDetails() {
  return (
    <group>
      {/* Central chest armour */}
      <RockPlate
        position={[0, 0.31, 0.275]}
        scale={[0.31, 0.28, 0.105]}
        rotation={[0.08, 0, 0]}
      />

      {/* Chest plates */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <RockPlate
            position={[side * 0.18, 0.38, 0.36]}
            scale={[0.19, 0.16, 0.075]}
            rotation={[0, 0, side * -0.12]}
          />

          <RockPlate
            position={[side * 0.14, 0.05, 0.35]}
            scale={[0.15, 0.13, 0.07]}
          />

          {/* Green volcanic fissures */}
          <mesh
            position={[side * 0.18, 0.29, 0.435]}
            rotation={[0, 0, side * 0.55]}
            material={fissureMaterial}
          >
            <boxGeometry args={[0.018, 0.2, 0.008]} />
          </mesh>
        </group>
      ))}

      {/* Abdominal armour sections */}
      {[-1, 0, 1].map((row) => (
        <mesh
          key={row}
          position={[0, -0.12 - row * 0.14, 0.3]}
          scale={[0.22 - Math.abs(row) * 0.025, 0.07, 0.045]}
          material={darkRockMaterial}
        >
          <dodecahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

// --------------------------------------------------
// HEAD AND FACE
// --------------------------------------------------

function HeatblastHead() {
  return (
    <group position={[0, 0.86, 0]}>
      {/* Head structure */}
      <mesh
        position={[0, 0, 0]}
        scale={[0.78, 1.05, 0.8]}
        material={rockMaterial}
      >
        <dodecahedronGeometry args={[0.25, 2]} />
      </mesh>

      {/* Forehead armour */}
      <RockPlate
        position={[0, 0.12, 0.15]}
        scale={[0.19, 0.12, 0.08]}
      />

      {/* Jaw */}
      <mesh
        position={[0, -0.13, 0.11]}
        scale={[0.72, 0.43, 0.72]}
        material={darkRockMaterial}
      >
        <sphereGeometry args={[0.2, 24, 20]} />
      </mesh>

      {/* Eyes */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.105, 0.025, 0.185]}
            rotation={[0, 0, side * -0.12]}
            material={eyeMaterial}
          >
            <sphereGeometry args={[0.047, 16, 16]} />
          </mesh>

          <mesh
            position={[side * 0.105, 0.025, 0.22]}
            material={brightMaterial}
          >
            <sphereGeometry args={[0.018, 12, 12]} />
          </mesh>
        </group>
      ))}

      {/* Nose and lower facial ridge */}
      <mesh
        position={[0, -0.055, 0.2]}
        scale={[0.09, 0.13, 0.08]}
        material={darkRockMaterial}
      >
        <coneGeometry args={[1, 1, 6]} />
      </mesh>

      {/* Flame crown - central and side lobes */}
      <group position={[0, 0.17, 0]}>
        <Flame
          position={[0, 0.02, 0]}
          height={0.82}
          radius={0.17}
        />

        <Flame
          position={[-0.17, 0, 0]}
          rotation={[0, 0, -0.28]}
          height={0.64}
          radius={0.14}
        />

        <Flame
          position={[0.17, 0, 0]}
          rotation={[0, 0, 0.28]}
          height={0.67}
          radius={0.14}
        />

        <Flame
          position={[-0.29, -0.02, -0.015]}
          rotation={[0, 0, -0.58]}
          height={0.45}
          radius={0.12}
        />

        <Flame
          position={[0.29, -0.02, -0.015]}
          rotation={[0, 0, 0.58]}
          height={0.48}
          radius={0.12}
        />
      </group>

      {/* Small side flames */}
      <Flame
        position={[-0.25, -0.05, -0.02]}
        rotation={[0, 0, -0.7]}
        height={0.35}
        radius={0.09}
      />

      <Flame
        position={[0.25, -0.05, -0.02]}
        rotation={[0, 0, 0.7]}
        height={0.35}
        radius={0.09}
      />
    </group>
  );
}

// --------------------------------------------------
// ARMS
// --------------------------------------------------

function HeatblastArm({ side }) {
  return (
    <group
      position={[side * 0.43, 0.26, 0]}
      rotation={[0, 0, side * -0.17]}
    >
      {/* Shoulder armour */}
      <RockPlate
        position={[0, 0, 0]}
        scale={[0.22, 0.22, 0.22]}
      />

      {/* Upper arm */}
      <mesh
        position={[side * 0.035, -0.24, 0]}
        rotation={[0, 0, side * -0.1]}
        material={rockMaterial}
      >
        <capsuleGeometry args={[0.105, 0.29, 8, 16]} />
      </mesh>

      {/* Elbow */}
      <RockPlate
        position={[side * 0.05, -0.43, 0.02]}
        scale={[0.12, 0.13, 0.13]}
        dark
      />

      {/* Forearm */}
      <mesh
        position={[side * 0.065, -0.59, 0.015]}
        rotation={[0, 0, side * -0.08]}
        material={rockMaterial}
      >
        <capsuleGeometry args={[0.105, 0.22, 8, 16]} />
      </mesh>

      {/* Wrist */}
      <RockPlate
        position={[side * 0.07, -0.76, 0.02]}
        scale={[0.12, 0.09, 0.12]}
      />

      {/* Hand */}
      <mesh
        position={[side * 0.07, -0.87, 0.045]}
        scale={[0.12, 0.13, 0.09]}
        material={darkRockMaterial}
      >
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>

      {/* Fingers */}
      {[-1, 0, 1].map((finger) => (
        <mesh
          key={finger}
          position={[
            side * 0.07 + finger * 0.065,
            -0.98,
            0.09,
          ]}
          material={rockMaterial}
        >
          <capsuleGeometry args={[0.025, 0.09, 5, 8]} />
        </mesh>
      ))}

      {/* Shoulder flame */}
      <Flame
        position={[0, 0.1, 0]}
        height={0.34}
        radius={0.11}
        rotation={[0, 0, side * -0.25]}
      />

      {/* Forearm flame */}
      <Flame
        position={[side * 0.07, -0.57, 0.03]}
        height={0.24}
        radius={0.07}
        rotation={[0, 0, side * 0.2]}
      />
    </group>
  );
}

// --------------------------------------------------
// LEGS AND FEET
// --------------------------------------------------

function HeatblastLeg({ side }) {
  return (
    <group position={[side * 0.19, -0.48, 0]}>
      {/* Upper leg */}
      <mesh
        position={[0, -0.15, 0]}
        material={rockMaterial}
      >
        <capsuleGeometry args={[0.15, 0.28, 8, 16]} />
      </mesh>

      {/* Knee armour */}
      <RockPlate
        position={[0, -0.34, 0.04]}
        scale={[0.14, 0.13, 0.13]}
        dark
      />

      {/* Lower leg */}
      <mesh
        position={[0, -0.54, 0]}
        material={rockMaterial}
      >
        <capsuleGeometry args={[0.105, 0.29, 8, 16]} />
      </mesh>

      {/* Shin plate */}
      <RockPlate
        position={[0, -0.53, 0.085]}
        scale={[0.09, 0.21, 0.045]}
      />

      {/* Foot */}
      <mesh
        position={[0, -0.76, 0.09]}
        scale={[0.15, 0.09, 0.25]}
        material={darkRockMaterial}
      >
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>

      {/* Toe flame */}
      <Flame
        position={[0, -0.7, 0.26]}
        height={0.2}
        radius={0.07}
      />
    </group>
  );
}

// --------------------------------------------------
// MAIN HEATBLAST MODEL
// --------------------------------------------------

export default function Heatblast({ hologram = true }) {
  const alien = useRef();
  const flameGroup = useRef();
  const chest = useRef();

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (alien.current) {
      alien.current.position.y =
        Math.sin(time * 1.8) * 0.035;

      alien.current.rotation.y =
        Math.sin(time * 0.55) * 0.1;
    }

    if (flameGroup.current) {
      flameGroup.current.rotation.z =
        Math.sin(time * 2.5) * 0.035;
    }

    if (chest.current) {
      chest.current.scale.y =
        1 + Math.sin(time * 2.2) * 0.012;
    }
  });

  return (
    <group ref={alien} scale={0.85}>
      {/* Main torso */}
      <group ref={chest}>
        <mesh
          position={[0, 0.03, 0]}
          scale={[1, 1.12, 0.85]}
          material={rockMaterial}
        >
          <capsuleGeometry args={[0.29, 0.58, 12, 24]} />
        </mesh>

        {/* Chest and abdominal armour */}
        <ChestDetails />

        {/* Waist */}
        <mesh
          position={[0, -0.37, 0]}
          scale={[0.82, 0.42, 0.8]}
          material={darkRockMaterial}
        >
          <dodecahedronGeometry args={[0.27, 2]} />
        </mesh>

        {/* Neck */}
        <mesh
          position={[0, 0.47, 0]}
          material={rockMaterial}
        >
          <cylinderGeometry args={[0.105, 0.15, 0.2, 12]} />
        </mesh>
      </group>

      {/* Head and flame crown */}
      <group ref={flameGroup}>
        <HeatblastHead />
      </group>

      {/* Arms */}
      <HeatblastArm side={-1} />
      <HeatblastArm side={1} />

      {/* Legs */}
      <HeatblastLeg side={-1} />
      <HeatblastLeg side={1} />

      {/* Omnitrix chest emblem */}
      <group position={[0, 0.02, 0.45]}>
        <mesh material={darkRockMaterial}>
          <circleGeometry args={[0.105, 32]} />
        </mesh>

        <mesh position={[0, 0, 0.008]} material={brightMaterial}>
          <circleGeometry args={[0.073, 6]} />
        </mesh>

        <mesh position={[0, 0, 0.014]} material={darkRockMaterial}>
          <circleGeometry args={[0.035, 6]} />
        </mesh>
      </group>

      {/* Extra green energy details */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.32, 0.25, 0.25]}
            rotation={[0, 0, side * 0.4]}
            material={fissureMaterial}
          >
            <boxGeometry args={[0.025, 0.15, 0.012]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

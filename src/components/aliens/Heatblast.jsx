import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { createLoft, createFlameSheet } from "../../utils/bodyShapes";
import {
  holoCore,
  holoRock,
  holoDarkRock,
  holoFlame,
  holoBright,
  holoCrack,
} from "../hologram/hologramMaterials";

// The feet are at y = 0 and the alien faces the +z direction.
// Height is about 2 units before flames. Scaled down in the main component.

function sec(x, y, z, rx, rz) {
  return { x, y, z, rx, rz };
}

// ---------- body shapes (rings from bottom to top) ----------

const LEG_X = 0.16;

// wide shoulders, narrow waist
const TORSO = [
  sec(0, 0.84, 0, 0.2, 0.14),
  sec(0, 0.95, 0, 0.16, 0.12),
  sec(0, 1.08, 0, 0.19, 0.135),
  sec(0, 1.22, 0, 0.27, 0.16),
  sec(0, 1.38, 0, 0.37, 0.19),
  sec(0, 1.5, 0, 0.42, 0.18),
  sec(0, 1.58, 0, 0.24, 0.12),
  sec(0, 1.62, 0, 0.12, 0.09),
];

const NECK = [sec(0, 1.6, 0, 0.09, 0.09), sec(0, 1.7, 0.01, 0.085, 0.09)];

// angular head (only 6 sides, so it looks like carved rock)
const HEAD = [
  sec(0, 1.66, 0.02, 0.05, 0.05),
  sec(0, 1.71, 0.03, 0.09, 0.09),
  sec(0, 1.78, 0.01, 0.12, 0.11),
  sec(0, 1.86, 0, 0.13, 0.115),
  sec(0, 1.93, -0.01, 0.1, 0.1),
];

function makeLeg(s) {
  const x = s * LEG_X;
  return [
    sec(x, 0.14, 0, 0.08, 0.085),
    sec(x, 0.3, -0.01, 0.1, 0.105),
    sec(x, 0.46, 0, 0.09, 0.09),
    sec(x, 0.52, 0, 0.095, 0.1),
    sec(x, 0.62, 0, 0.12, 0.125),
    sec(x, 0.75, 0, 0.145, 0.14),
    sec(x, 0.9, 0, 0.15, 0.135),
  ];
}

// big forearm gauntlets
function makeArm(s) {
  return [
    sec(s * 0.54, 0.84, 0.02, 0.06, 0.065),
    sec(s * 0.53, 0.96, 0.02, 0.1, 0.1),
    sec(s * 0.52, 1.1, 0.01, 0.13, 0.125),
    sec(s * 0.5, 1.2, 0, 0.1, 0.1),
    sec(s * 0.49, 1.32, 0, 0.11, 0.105),
    sec(s * 0.47, 1.44, 0, 0.12, 0.115),
    sec(s * 0.45, 1.54, 0, 0.13, 0.12),
  ];
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// ---------- magma cracks (lists of 3D points) ----------

function mirror(points, s) {
  return points.map(([x, y, z]) => [x * s, y, z]);
}

const CENTER_CRACKS = [
  // down the stomach
  [[0, 1.26, 0.17], [0.01, 1.18, 0.16], [-0.01, 1.1, 0.14], [0, 1.0, 0.125]],
  // down the back
  [[0, 1.5, -0.17], [0.02, 1.35, -0.19], [0, 1.2, -0.15], [0, 1.05, -0.12]],
];

const SIDE_CRACKS = [
  // chest
  [[0.1, 1.46, 0.19], [0.2, 1.38, 0.205], [0.27, 1.3, 0.175], [0.31, 1.2, 0.125]],
  // stomach
  [[0.05, 1.12, 0.14], [0.1, 1.04, 0.135], [0.13, 0.95, 0.125]],
  // arm
  [[0.5, 1.5, 0.12], [0.52, 1.38, 0.13], [0.5, 1.26, 0.11], [0.52, 1.1, 0.14], [0.53, 0.98, 0.11]],
  // leg
  [[LEG_X, 0.88, 0.14], [LEG_X + 0.01, 0.74, 0.15], [LEG_X, 0.62, 0.125], [LEG_X, 0.5, 0.1], [LEG_X, 0.36, 0.105]],
];

const CRACKS = [
  ...CENTER_CRACKS,
  ...SIDE_CRACKS.map((c) => mirror(c, 1)),
  ...SIDE_CRACKS.map((c) => mirror(c, -1)),
];

// hourglass symbol on the chest
const hourglass = new THREE.Shape([
  new THREE.Vector2(-0.5, 0.6),
  new THREE.Vector2(0.5, 0.6),
  new THREE.Vector2(0.06, 0),
  new THREE.Vector2(0.5, -0.6),
  new THREE.Vector2(-0.5, -0.6),
  new THREE.Vector2(-0.06, 0),
]);

// ---------- small reusable parts ----------

// a smooth body part made from rings
function BodyPart({ sections, segments = 10, material = holoCore }) {
  const geometry = useMemo(
    () => createLoft(sections, segments),
    [sections, segments]
  );
  return <mesh geometry={geometry} material={material} />;
}

// an angular rock chunk
function Plate({
  position,
  scale,
  rotation = [0, 0, 0],
  material = holoRock,
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} material={material}>
      <icosahedronGeometry args={[1, 0]} />
    </mesh>
  );
}

// a glowing line
function Crack({ points }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
    return new THREE.TubeGeometry(curve, 14, 0.007, 4, false);
  }, [points]);

  return <mesh geometry={geometry} material={holoCrack} />;
}

// one flat flame sheet that flickers
function FlameSheet({
  position = [0, 0, 0],
  rotationY = 0,
  tilt = 0,
  width = 0.3,
  height = 0.7,
  tongues = 5,
  seed = 1,
  phase = 0,
}) {
  const ref = useRef();

  const geometry = useMemo(
    () => createFlameSheet({ width, height, tongues, seed }),
    [width, height, tongues, seed]
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + phase;
    ref.current.scale.y = 1 + Math.sin(t * 4.1) * 0.08;
    ref.current.scale.x = 1 + Math.sin(t * 3.3 + 1) * 0.05;
    ref.current.rotation.z = tilt + Math.sin(t * 2.7) * 0.04;
  });

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      material={holoFlame}
      position={position}
      rotation={[0, rotationY, tilt]}
    />
  );
}

// two sheets crossed, so the fire looks 3D from every side
function FlameCluster({ position, tilt = 0, width, height, tongues, seed, phase = 0 }) {
  return (
    <group position={position}>
      <FlameSheet tilt={tilt} width={width} height={height} tongues={tongues} seed={seed} phase={phase} />
      <FlameSheet
        rotationY={Math.PI / 2}
        tilt={tilt}
        width={width}
        height={height * 0.9}
        tongues={tongues}
        seed={seed + 1}
        phase={phase + 1}
      />
    </group>
  );
}

// small floating sparks
function Embers() {
  const points = useRef();

  const data = useMemo(() => {
    const count = 26;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.0;
      positions[i * 3 + 1] = Math.random() * 2.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      speeds[i] = 0.15 + Math.random() * 0.25;
    }
    return { positions, speeds, count };
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const attribute = points.current.geometry.attributes.position;
    for (let i = 0; i < data.count; i++) {
      let y = attribute.array[i * 3 + 1] + data.speeds[i] * delta;
      if (y > 2.8) y = 0.3;
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
        color="#e4ffb0"
        size={0.035}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

// ---------- Heatblast body parts ----------

function Head() {
  return (
    <group>
      <BodyPart sections={HEAD} segments={6} material={holoRock} />

      {[-1, 1].map((s) => (
        <group key={s}>
          {/* glowing slanted eye (angry look) */}
          <mesh
            position={[s * 0.055, 1.83, 0.105]}
            rotation={[0, 0, s * 0.4]}
            scale={[0.04, 0.014, 0.02]}
            material={holoBright}
          >
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>

          {/* brow ridge */}
          <Plate
            position={[s * 0.06, 1.88, 0.105]}
            scale={[0.07, 0.02, 0.04]}
            rotation={[0, 0, s * 0.35]}
            material={holoDarkRock}
          />

          {/* cheek bone */}
          <Plate position={[s * 0.11, 1.77, 0.07]} scale={[0.03, 0.05, 0.04]} material={holoDarkRock} />

          {/* side ear spike */}
          <Plate position={[s * 0.14, 1.86, -0.01]} scale={[0.035, 0.05, 0.03]} />
        </group>
      ))}

      {/* mouth: one glowing line with two small teeth */}
      <mesh position={[0, 1.745, 0.1]} material={holoBright}>
        <boxGeometry args={[0.075, 0.008, 0.01]} />
      </mesh>
      {[-1, 1].map((s) => (
        <Plate
          key={s}
          position={[s * 0.025, 1.73, 0.1]}
          scale={[0.008, 0.014, 0.008]}
          material={holoBright}
        />
      ))}

      {/* chin plate */}
      <Plate position={[0, 1.69, 0.05]} scale={[0.04, 0.03, 0.04]} material={holoDarkRock} />
    </group>
  );
}

// big flame mane around the head
function Crown() {
  return (
    <group>
      {/* three tall sheets crossed at the head */}
      <FlameSheet position={[0, 1.9, -0.01]} width={0.36} height={0.85} tongues={5} seed={1} phase={0} />
      <FlameSheet position={[0, 1.9, -0.01]} rotationY={Math.PI / 3} width={0.34} height={0.78} tongues={5} seed={2} phase={1.3} />
      <FlameSheet position={[0, 1.9, -0.01]} rotationY={-Math.PI / 3} width={0.34} height={0.8} tongues={5} seed={3} phase={2.6} />

      {/* tallest flame, behind the head */}
      <FlameSheet position={[0, 1.88, -0.07]} width={0.3} height={1.05} tongues={4} seed={4} phase={3.9} />

      {/* side flames that widen the silhouette */}
      <FlameSheet position={[-0.1, 1.82, -0.02]} tilt={0.65} width={0.2} height={0.5} tongues={3} seed={5} phase={0.7} />
      <FlameSheet position={[0.1, 1.82, -0.02]} tilt={-0.65} width={0.2} height={0.5} tongues={3} seed={6} phase={2.1} />
    </group>
  );
}

function ChestArmor() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* chest plates */}
          <Plate position={[s * 0.2, 1.4, 0.15]} scale={[0.14, 0.11, 0.07]} rotation={[0.15, 0, s * 0.2]} />
          <Plate position={[s * 0.15, 1.26, 0.125]} scale={[0.1, 0.06, 0.05]} material={holoDarkRock} />
          <Plate position={[s * 0.3, 1.3, 0.06]} scale={[0.07, 0.12, 0.09]} rotation={[0, 0, s * -0.15]} />

          {/* stomach plates */}
          <Plate position={[s * 0.1, 1.17, 0.12]} scale={[0.07, 0.045, 0.04]} />
          <Plate position={[s * 0.09, 1.05, 0.11]} scale={[0.06, 0.04, 0.035]} />

          {/* shoulder-neck plates */}
          <Plate position={[s * 0.15, 1.57, 0]} scale={[0.12, 0.06, 0.1]} rotation={[0, 0, s * -0.3]} material={holoDarkRock} />
        </group>
      ))}

      {/* belt */}
      <Plate position={[0, 0.88, 0.12]} scale={[0.13, 0.09, 0.04]} material={holoDarkRock} />

      {/* back plates */}
      <Plate position={[0, 1.4, -0.15]} scale={[0.24, 0.17, 0.06]} />
      <Plate position={[0, 1.15, -0.12]} scale={[0.14, 0.1, 0.05]} material={holoDarkRock} />

      {/* Omnitrix hourglass symbol */}
      <mesh position={[0, 1.38, 0.205]} scale={0.085} material={holoBright}>
        <shapeGeometry args={[hourglass]} />
      </mesh>
    </group>
  );
}

function Arm({ side }) {
  return (
    <group>
      <BodyPart sections={ARMS[side]} segments={8} />

      {/* big shoulder armor */}
      <Plate position={[side * 0.44, 1.58, 0]} scale={[0.17, 0.1, 0.15]} rotation={[0, 0, side * -0.35]} />
      <Plate position={[side * 0.53, 1.5, 0]} scale={[0.09, 0.08, 0.11]} rotation={[0, 0, side * -0.6]} material={holoDarkRock} />

      {/* upper arm, elbow and forearm gauntlet */}
      <Plate position={[side * 0.47, 1.36, 0.06]} scale={[0.09, 0.09, 0.06]} />
      <Plate position={[side * 0.5, 1.2, -0.1]} scale={[0.05, 0.06, 0.09]} material={holoDarkRock} />
      <Plate position={[side * 0.52, 1.12, 0.07]} scale={[0.11, 0.14, 0.07]} />
      <Plate position={[side * 0.52, 1.1, -0.07]} scale={[0.1, 0.12, 0.06]} material={holoDarkRock} />

      {/* fist and knuckles */}
      <Plate position={[side * 0.54, 0.86, 0.02]} scale={[0.085, 0.09, 0.08]} material={holoDarkRock} />
      {[-1, 0, 1].map((k) => (
        <Plate key={k} position={[side * 0.54 + k * 0.04, 0.79, 0.07]} scale={[0.025, 0.03, 0.03]} />
      ))}

      {/* flames on shoulder and forearm */}
      <FlameCluster
        position={[side * 0.46, 1.62, -0.02]}
        tilt={side * -0.4}
        width={0.2}
        height={0.5}
        tongues={3}
        seed={side * 3 + 10}
        phase={side * 2}
      />
      <FlameCluster
        position={[side * 0.52, 1.0, -0.1]}
        tilt={side * -0.1}
        width={0.16}
        height={0.32}
        tongues={3}
        seed={side * 3 + 20}
        phase={side * 3}
      />
    </group>
  );
}

function Leg({ side }) {
  const x = side * LEG_X;

  return (
    <group>
      <BodyPart sections={LEGS[side]} segments={8} />

      {/* hip, thigh, knee, shin */}
      <Plate position={[side * 0.24, 0.9, 0]} scale={[0.08, 0.09, 0.12]} rotation={[0, 0, side * -0.3]} />
      <Plate position={[x, 0.78, 0.125]} scale={[0.1, 0.14, 0.05]} />
      <Plate position={[x, 0.53, 0.1]} scale={[0.09, 0.08, 0.06]} rotation={[0.2, 0, 0]} material={holoDarkRock} />
      <Plate position={[x, 0.34, 0.095]} scale={[0.065, 0.13, 0.045]} />

      {/* foot and toes */}
      <Plate position={[x, 0.075, 0.07]} scale={[0.1, 0.065, 0.17]} material={holoDarkRock} />
      {[-1, 0, 1].map((k) => (
        <Plate key={k} position={[x + k * 0.04, 0.05, 0.22]} scale={[0.025, 0.03, 0.04]} />
      ))}

      {/* small ankle flame */}
      <FlameCluster
        position={[x, 0.14, -0.08]}
        width={0.12}
        height={0.22}
        tongues={3}
        seed={side + 30}
        phase={side * 4}
      />
    </group>
  );
}

// ---------- the complete alien ----------

export default function Heatblast() {
  const alien = useRef();
  const body = useRef();
  const head = useRef();

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // slow sway
    if (alien.current) {
      alien.current.rotation.y = Math.sin(time * 0.5) * 0.12;
    }

    // breathing
    if (body.current) {
      const breath = 1 + Math.sin(time * 2) * 0.012;
      body.current.scale.x = breath;
      body.current.scale.z = breath;
    }

    // head turns a little
    if (head.current) {
      head.current.rotation.y = Math.sin(time * 0.9) * 0.08;
    }
  });

  return (
    <group ref={alien} scale={0.8}>
      <group ref={body}>
        <BodyPart sections={TORSO} segments={10} />
        <BodyPart sections={NECK} segments={8} />
        <ChestArmor />
      </group>

      <group ref={head}>
        <Head />
        <Crown />
      </group>

      <Arm side={-1} />
      <Arm side={1} />
      <Leg side={-1} />
      <Leg side={1} />

      {CRACKS.map((points, i) => (
        <Crack key={i} points={points} />
      ))}

      <Embers />
    </group>
  );
}
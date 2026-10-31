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

function sec(x, y, z, rx, rz) {
  return { x, y, z, rx, rz };
}

// ---------- body shapes (rings from bottom to top) ----------

const LEG_X = 0.19;

// wide shoulders, narrow waist
const TORSO = [
  sec(0, 0.84, 0, 0.21, 0.145),
  sec(0, 0.95, 0, 0.165, 0.125),
  sec(0, 1.08, 0, 0.195, 0.14),
  sec(0, 1.22, 0, 0.28, 0.165),
  sec(0, 1.38, 0, 0.39, 0.195),
  sec(0, 1.5, 0, 0.44, 0.185),
  sec(0, 1.58, 0, 0.25, 0.125),
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

// thick legs
function makeLeg(s) {
  const x = s * LEG_X;
  return [
    sec(x, 0.14, 0, 0.1, 0.1),
    sec(x, 0.3, -0.01, 0.12, 0.12),
    sec(x, 0.46, 0, 0.105, 0.105),
    sec(x, 0.52, 0, 0.11, 0.115),
    sec(x, 0.62, 0, 0.14, 0.14),
    sec(x, 0.75, 0, 0.17, 0.16),
    sec(x, 0.9, 0, 0.17, 0.15),
  ];
}

// thick arms with big forearm gauntlets
function makeArm(s) {
  return [
    sec(s * 0.54, 0.84, 0.02, 0.07, 0.075),
    sec(s * 0.53, 0.96, 0.02, 0.115, 0.115),
    sec(s * 0.52, 1.1, 0.01, 0.15, 0.14),
    sec(s * 0.5, 1.2, 0, 0.115, 0.11),
    sec(s * 0.49, 1.32, 0, 0.125, 0.12),
    sec(s * 0.47, 1.44, 0, 0.135, 0.125),
    sec(s * 0.45, 1.54, 0, 0.145, 0.13),
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
  [[0, 1.26, 0.17], [0.01, 1.18, 0.16], [-0.01, 1.1, 0.145], [0, 1.0, 0.13]],
  // down the back
  [[0, 1.5, -0.17], [0.02, 1.35, -0.2], [0, 1.2, -0.16], [0, 1.05, -0.13]],
];

const SIDE_CRACKS = [
  // chest
  [[0.1, 1.46, 0.19], [0.2, 1.38, 0.21], [0.27, 1.3, 0.18], [0.31, 1.2, 0.13]],
  // stomach
  [[0.05, 1.12, 0.145], [0.1, 1.04, 0.14], [0.13, 0.95, 0.13]],
  // arm
  [[0.48, 1.5, 0.135], [0.5, 1.38, 0.13], [0.5, 1.26, 0.125], [0.52, 1.1, 0.15], [0.53, 0.98, 0.125]],
  // leg
  [[LEG_X, 0.88, 0.16], [LEG_X + 0.01, 0.74, 0.175], [LEG_X, 0.62, 0.155], [LEG_X, 0.5, 0.125], [LEG_X, 0.36, 0.13]],
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
    return new THREE.TubeGeometry(curve, 14, 0.013, 4, false);
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
  tongues = 4,
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
      {/* the head is the same glowing green as the body */}
      <BodyPart sections={HEAD} segments={6} material={holoCore} />

      {[-1, 1].map((s) => (
        <group key={s}>
          {/* dark eye socket */}
          <Plate
            position={[s * 0.055, 1.83, 0.105]}
            scale={[0.052, 0.03, 0.02]}
            rotation={[0, 0, s * 0.4]}
            material={holoDarkRock}
          />

          {/* bright glowing eye */}
          <mesh
            position={[s * 0.055, 1.83, 0.114]}
            rotation={[0, 0, s * 0.4]}
            scale={[0.04, 0.014, 0.02]}
            material={holoBright}
          >
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>

          {/* heavy brow ridge */}
          <Plate
            position={[s * 0.06, 1.885, 0.108]}
            scale={[0.075, 0.022, 0.04]}
            rotation={[0, 0, s * 0.4]}
            material={holoDarkRock}
          />

          {/* cheek bone */}
          <Plate position={[s * 0.11, 1.77, 0.07]} scale={[0.03, 0.05, 0.04]} material={holoDarkRock} />

          {/* side ear spike */}
          <Plate position={[s * 0.14, 1.86, -0.01]} scale={[0.035, 0.05, 0.03]} material={holoDarkRock} />
        </group>
      ))}

      {/* forehead plate */}
      <Plate position={[0, 1.92, 0.09]} scale={[0.05, 0.03, 0.04]} material={holoDarkRock} />

      {/* dark open mouth */}
      <mesh position={[0, 1.745, 0.105]} material={holoDarkRock}>
        <boxGeometry args={[0.09, 0.03, 0.01]} />
      </mesh>

      {/* bright teeth, top row and bottom row */}
      {[-0.03, -0.01, 0.01, 0.03].map((x) => (
        <group key={x}>
          <Plate position={[x, 1.757, 0.112]} scale={[0.007, 0.013, 0.007]} material={holoBright} />
          <Plate position={[x, 1.733, 0.112]} scale={[0.007, 0.013, 0.007]} material={holoBright} />
        </group>
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
      {/* three sheets crossed at the head */}
      <FlameSheet position={[0, 1.95, 0]} width={0.5} height={0.8} tongues={4} seed={1} phase={0} />
      <FlameSheet position={[0, 1.95, 0]} rotationY={Math.PI / 3} width={0.5} height={0.7} tongues={4} seed={2} phase={1.3} />
      <FlameSheet position={[0, 1.95, 0]} rotationY={-Math.PI / 3} width={0.5} height={0.72} tongues={4} seed={3} phase={2.6} />

      {/* tall flame behind the head */}
      <FlameSheet position={[0, 1.93, -0.08]} width={0.45} height={0.95} tongues={3} seed={4} phase={3.9} />

      {/* side flames that make the shape wider */}
      <FlameSheet position={[-0.14, 1.85, -0.02]} tilt={0.7} width={0.3} height={0.5} tongues={3} seed={5} phase={0.7} />
      <FlameSheet position={[0.14, 1.85, -0.02]} tilt={-0.7} width={0.3} height={0.5} tongues={3} seed={6} phase={2.1} />

      {/* flames beside the face, so the head looks like it is made of fire */}
      <FlameSheet position={[-0.16, 1.72, -0.06]} tilt={0.95} width={0.3} height={0.5} tongues={3} seed={9} phase={1.8} />
      <FlameSheet position={[0.16, 1.72, -0.06]} tilt={-0.95} width={0.3} height={0.5} tongues={3} seed={10} phase={3.2} />

      {/* lower back flames */}
      <FlameSheet position={[-0.1, 1.8, -0.1]} tilt={0.35} width={0.3} height={0.55} tongues={3} seed={7} phase={4.4} />
      <FlameSheet position={[0.1, 1.8, -0.1]} tilt={-0.35} width={0.3} height={0.55} tongues={3} seed={8} phase={5.2} />
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
          <Plate position={[s * 0.32, 1.3, 0.06]} scale={[0.07, 0.12, 0.09]} rotation={[0, 0, s * -0.15]} />

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
      <Plate position={[0, 1.4, -0.15]} scale={[0.26, 0.17, 0.06]} />
      <Plate position={[0, 1.15, -0.12]} scale={[0.14, 0.1, 0.05]} material={holoDarkRock} />

      {/* Omnitrix hourglass symbol */}
      <mesh position={[0, 1.38, 0.21]} scale={0.085} material={holoBright}>
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
      <Plate position={[side * 0.46, 1.58, 0]} scale={[0.19, 0.11, 0.16]} rotation={[0, 0, side * -0.35]} />
      <Plate position={[side * 0.55, 1.5, 0]} scale={[0.1, 0.09, 0.12]} rotation={[0, 0, side * -0.6]} material={holoDarkRock} />

      {/* upper arm, elbow and forearm gauntlet */}
      <Plate position={[side * 0.47, 1.36, 0.08]} scale={[0.1, 0.09, 0.06]} />
      <Plate position={[side * 0.5, 1.2, -0.1]} scale={[0.05, 0.06, 0.09]} material={holoDarkRock} />
      <Plate position={[side * 0.52, 1.12, 0.09]} scale={[0.12, 0.15, 0.07]} />
      <Plate position={[side * 0.52, 1.1, -0.09]} scale={[0.11, 0.13, 0.06]} material={holoDarkRock} />

      {/* fist and knuckles */}
      <Plate position={[side * 0.54, 0.86, 0.02]} scale={[0.095, 0.1, 0.09]} material={holoDarkRock} />
      {[-1, 0, 1].map((k) => (
        <Plate key={k} position={[side * 0.54 + k * 0.045, 0.78, 0.08]} scale={[0.028, 0.033, 0.033]} />
      ))}

      {/* flames on shoulder and forearm */}
      <FlameCluster
        position={[side * 0.48, 1.62, -0.02]}
        tilt={side * -0.4}
        width={0.28}
        height={0.6}
        tongues={4}
        seed={side * 3 + 10}
        phase={side * 2}
      />
      <FlameCluster
        position={[side * 0.52, 1.0, -0.1]}
        tilt={side * -0.1}
        width={0.2}
        height={0.4}
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
      <Plate position={[side * 0.3, 0.9, 0]} scale={[0.08, 0.09, 0.12]} rotation={[0, 0, side * -0.3]} />
      <Plate position={[x, 0.78, 0.145]} scale={[0.11, 0.14, 0.05]} />
      <Plate position={[x, 0.53, 0.11]} scale={[0.1, 0.08, 0.06]} rotation={[0.2, 0, 0]} material={holoDarkRock} />
      <Plate position={[x, 0.34, 0.11]} scale={[0.07, 0.13, 0.05]} />

      {/* foot and toes */}
      <Plate position={[x, 0.075, 0.08]} scale={[0.12, 0.07, 0.19]} material={holoDarkRock} />
      {[-1, 0, 1].map((k) => (
        <Plate key={k} position={[x + k * 0.045, 0.05, 0.24]} scale={[0.028, 0.032, 0.045]} />
      ))}
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
      {/* body, arms and legs are stretched front to back, so he is not flat from the side */}
      <group scale={[1, 1, 1.35]}>
        <group ref={body}>
          <BodyPart sections={TORSO} segments={10} />
          <BodyPart sections={NECK} segments={8} />
          <ChestArmor />
        </group>

        <Arm side={-1} />
        <Arm side={1} />
        <Leg side={-1} />
        <Leg side={1} />

        {CRACKS.map((points, i) => (
          <Crack key={i} points={points} />
        ))}
      </group>

      <group ref={head}>
        {/* the head is 50% bigger, scaled around the neck */}
        <group position={[0, 1.7, 0]} scale={1.5}>
          <group position={[0, -1.7, 0]}>
            <Head />
          </group>
        </group>
        <Crown />
      </group>

      <Embers />
    </group>
  );
}
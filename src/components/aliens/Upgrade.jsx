import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { sec, BodyPart, OmnitrixSymbol } from "./parts";
import { holoCore, holoDarkRock, holoCrack } from "../hologram/hologramMaterials";
import { surfaceLine, makeLinesGeometry } from "../../utils/circuitLines";

// Upgrade, built from the reference picture.
// The feet are at y = 0 and he faces the +z direction. The head tip is at about y = 2.
// Head and left arm are dark with bright lines. The rest is bright with dark lines.
// The arms are much longer than the legs.

// ---------- body shapes (rings from bottom to top) ----------

// broad chest, narrow waist, wide hips
const TORSO = [
  sec(0, 0.8, 0, 0.24, 0.14),
  sec(0, 0.95, 0, 0.22, 0.135),
  sec(0, 1.1, 0, 0.2, 0.13),
  sec(0, 1.3, 0, 0.25, 0.145),
  sec(0, 1.5, 0, 0.29, 0.16),
  sec(0, 1.62, 0, 0.29, 0.15),
  sec(0, 1.7, 0, 0.14, 0.11),
];

// tall tapering head. The base is wide, and the tip is a little right of the middle
const HEAD = [
  sec(-0.03, 1.6, 0, 0.2, 0.14),
  sec(-0.01, 1.72, 0, 0.17, 0.125),
  sec(0.02, 1.83, 0, 0.13, 0.105),
  sec(0.06, 1.92, 0, 0.095, 0.08),
  sec(0.1, 1.98, 0, 0.055, 0.05),
  sec(0.12, 2.01, 0, 0.022, 0.022),
];

// short, thick legs
function makeLeg(s) {
  return [
    sec(s * 0.2, 0.12, 0, 0.105, 0.11),
    sec(s * 0.195, 0.3, 0, 0.115, 0.12),
    sec(s * 0.185, 0.45, 0, 0.12, 0.125),
    sec(s * 0.175, 0.6, 0, 0.135, 0.135),
    sec(s * 0.165, 0.78, 0, 0.145, 0.14),
    sec(s * 0.16, 0.9, 0, 0.14, 0.13),
  ];
}

// very long arms that lean a little outwards
function makeArm(s) {
  const rows = [
    sec(s * 0.5, 0.66, 0, 0.085, 0.07),
    sec(s * 0.48, 0.82, 0, 0.115, 0.095),
    sec(s * 0.45, 1.0, 0, 0.125, 0.105),
    sec(s * 0.42, 1.2, 0, 0.12, 0.105),
    sec(s * 0.38, 1.38, 0, 0.13, 0.115),
    sec(s * 0.34, 1.52, 0, 0.15, 0.13),
  ];

  if (s === -1) {
    // the dark shoulder rises up into the head
    rows.push(sec(-0.28, 1.64, 0, 0.15, 0.12));
    rows.push(sec(-0.2, 1.74, 0, 0.12, 0.1));
  } else {
    rows.push(sec(0.3, 1.6, 0, 0.13, 0.115));
  }
  return rows;
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// ---------- the flat hand with four long fingers ----------

function makeHandGeometry() {
  const half = 0.026; // half the width of a finger
  const centers = [0.105, 0.035, -0.035, -0.105];
  const lengths = [0.24, 0.27, 0.27, 0.24];

  const shape = new THREE.Shape();
  shape.moveTo(-0.08, 0);
  shape.lineTo(0.08, 0);
  shape.lineTo(0.14, -0.1);

  // go along the fingers from right to left
  centers.forEach((cx, i) => {
    const tip = -0.2 - lengths[i];
    shape.lineTo(cx + half, -0.2);
    shape.lineTo(cx + half, tip + 0.02);
    shape.lineTo(cx, tip);
    shape.lineTo(cx - half, tip + 0.02);
    shape.lineTo(cx - half, -0.2);
  });

  shape.lineTo(-0.14, -0.2);
  shape.lineTo(-0.14, -0.1);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false });
  geometry.translate(0, 0, -0.025);
  return geometry;
}

const HAND_GEOMETRY = makeHandGeometry();

// ---------- circuit lines ----------
// Each corner is [height, angle]. Lines go up or down, then sideways, in steps.

// lines on the front of the head (angle below 0 is towards the left)
const HEAD_LINES = [
  [[1.96, 0.0], [1.62, 0.0]],
  [[1.74, 0.0], [1.74, -0.7], [1.66, -0.7], [1.66, -1.1]],
  [[1.82, 0.0], [1.82, 0.6], [1.74, 0.6]],
];

// lines in the middle of the torso
const TORSO_CENTER_LINES = [
  [[1.385, 0.0], [1.1, 0.0]],
  [[0.98, -0.9], [0.98, -0.35], [0.9, -0.35], [0.9, 0.35], [0.98, 0.35], [0.98, 0.9]],
];

// lines on one side of the torso (they are copied to the other side)
const TORSO_HALF_LINES = [
  [[1.64, 0.15], [1.64, 0.5], [1.56, 0.5], [1.56, 0.8], [1.42, 0.8]],
  [[1.36, 0.9], [1.2, 0.9], [1.2, 1.15], [1.05, 1.15]],
  [[1.3, 0.0], [1.3, 0.35], [1.2, 0.35], [1.2, 0.6], [1.08, 0.6]],
  [[1.16, 0.0], [1.16, 0.28], [1.06, 0.28], [1.06, 0.5]],
];

// lines on one arm. A positive angle is towards the outside of the arm
const ARM_LINES = [
  [[1.5, 0.0], [1.5, 0.5], [1.38, 0.5], [1.38, -0.3], [1.24, -0.3], [1.24, 0.4], [1.12, 0.4]],
  [[1.04, -0.4], [1.04, 0.3], [0.94, 0.3], [0.94, -0.5], [0.82, -0.5]],
  [[0.78, 0.6], [0.78, 0.0], [0.7, 0.0]],
];

// lines on one leg. A positive angle is towards the outside of the leg
const LEG_LINES = [
  [[0.86, -0.6], [0.86, 0.2], [0.76, 0.2], [0.76, 0.8]],
  [[0.5, -0.8], [0.5, 0.8]],
  [[0.4, 0.0], [0.4, 0.5], [0.28, 0.5], [0.28, -0.4], [0.2, -0.4]],
];

// turns the angles around, so a line can be used on the other side
function mirrorLine(line, s) {
  return line.map(([y, angle]) => [y, angle * s]);
}

// the line shapes are made once, so React does not rebuild them
const HEAD_LINES_GEOMETRY = makeLinesGeometry(HEAD_LINES.map((line) => surfaceLine(HEAD, line)));

const TORSO_LINES_GEOMETRY = makeLinesGeometry([
  ...TORSO_CENTER_LINES.map((line) => surfaceLine(TORSO, line)),
  ...[-1, 1].flatMap((s) => TORSO_HALF_LINES.map((line) => surfaceLine(TORSO, mirrorLine(line, s)))),
]);

const ARM_LINES_GEOMETRY = {
  "-1": makeLinesGeometry(ARM_LINES.map((line) => surfaceLine(ARMS[-1], mirrorLine(line, -1)))),
  "1": makeLinesGeometry(ARM_LINES.map((line) => surfaceLine(ARMS[1], mirrorLine(line, 1)))),
};

const LEG_LINES_GEOMETRY = {
  "-1": makeLinesGeometry(LEG_LINES.map((line) => surfaceLine(LEGS[-1], mirrorLine(line, -1)))),
  "1": makeLinesGeometry(LEG_LINES.map((line) => surfaceLine(LEGS[1], mirrorLine(line, 1)))),
};

// ---------- body parts ----------

function Body() {
  return (
    <group>
      <BodyPart sections={TORSO} segments={12} material={holoCore} />
      <mesh geometry={TORSO_LINES_GEOMETRY} material={holoDarkRock} />

      {/* Omnitrix emblem on the upper chest: dark disc, bright ring, hourglass */}
      <mesh position={[0.04, 1.46, 0.165]} material={holoDarkRock}>
        <circleGeometry args={[0.075, 20]} />
      </mesh>
      <mesh position={[0.04, 1.46, 0.168]} material={holoCrack}>
        <torusGeometry args={[0.075, 0.01, 8, 24]} />
      </mesh>
      <OmnitrixSymbol position={[0.04, 1.46, 0.172]} size={0.1} />
    </group>
  );
}

// the group turns around the base of the head, so the head tilts
function Head({ groupRef }) {
  return (
    <group ref={groupRef} position={[0, 1.62, 0]}>
      <group position={[0, -1.62, 0]}>
        <BodyPart sections={HEAD} segments={12} material={holoDarkRock} />
        <mesh geometry={HEAD_LINES_GEOMETRY} material={holoCrack} />

        {/* small ring at the very tip of the head */}
        <mesh position={[0.08, 1.95, 0.075]} material={holoCrack}>
          <torusGeometry args={[0.03, 0.007, 8, 20]} />
        </mesh>
      </group>
    </group>
  );
}

function Hand({ side }) {
  const material = side === -1 ? holoDarkRock : holoCore;

  return (
    <group position={[side * 0.5, 0.64, 0]} rotation={[0, 0, side * 0.1]}>
      <mesh geometry={HAND_GEOMETRY} material={material} />
    </group>
  );
}

// the group turns around the shoulder, so the whole arm swings like a pendulum
function Arm({ side, groupRef }) {
  const material = side === -1 ? holoDarkRock : holoCore;
  const lineMaterial = side === -1 ? holoCrack : holoDarkRock;

  return (
    <group ref={groupRef} position={[side * 0.36, 1.5, 0]}>
      <group position={[side * -0.36, -1.5, 0]}>
        <BodyPart sections={ARMS[side]} segments={12} material={material} />
        <Hand side={side} />
        <mesh geometry={ARM_LINES_GEOMETRY[side]} material={lineMaterial} />
      </group>
    </group>
  );
}

function Leg({ side }) {
  const x = side * 0.2;

  return (
    <group>
      <BodyPart sections={LEGS[side]} segments={12} material={holoCore} />
      <mesh geometry={LEG_LINES_GEOMETRY[side]} material={holoDarkRock} />

      {/* wide blunt foot with a dark sole */}
      <mesh position={[x, 0.065, 0.07]} scale={[0.135, 0.065, 0.2]} material={holoCore}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      <mesh position={[x, 0.025, 0.07]} scale={[0.14, 0.025, 0.205]} material={holoDarkRock}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
    </group>
  );
}

// ---------- the complete alien ----------

export default function Upgrade() {
  const alien = useRef();
  const body = useRef();
  const head = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // slow sway
    if (alien.current) {
      alien.current.rotation.y = Math.sin(t * 0.4) * 0.12;
    }

    // breathing
    if (body.current) {
      const breath = 1 + Math.sin(t * 1.8) * 0.012;
      body.current.scale.x = breath;
      body.current.scale.z = breath;
    }

    // head tilts and turns a little
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.6) * 0.03;
      head.current.rotation.y = Math.sin(t * 0.5) * 0.08;
    }

    // the long arms swing like pendulums
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 0.9) * 0.05;
      leftArm.current.rotation.z = Math.sin(t * 0.7) * 0.02;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = Math.sin(t * 0.9 + 1) * 0.05;
      rightArm.current.rotation.z = Math.sin(t * 0.7 + 1) * -0.02;
    }
  });

  return (
    <group ref={alien} scale={1.05}>
      <group ref={body}>
        <Body />
      </group>

      <Head groupRef={head} />

      <Leg side={-1} />
      <Leg side={1} />

      <Arm side={-1} groupRef={leftArm} />
      <Arm side={1} groupRef={rightArm} />
    </group>
  );
}
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { sec, BodyPart, Halo, OmnitrixSymbol } from "./parts";
import { DataSparks, ScanRing } from "./effects";
import { makeHoloMaterial, holoSoft, holoDarkRock, holoBright } from "../hologram/hologramMaterials";
import { surfacePoint, surfaceLine, makeLinesGeometry } from "../../utils/circuitLines";

// Ghostfreak, built from the reference picture.
// He floats and faces the +z direction. He is about 1.8 tall.
// A smooth boneless body with no legs: a tall hood with one big green eye, a broad chest
// with black lines, two thin arms with long claws, and a long tail that curls up into a fin.
// He fades in and out, like a ghost.

// ---------- his own materials, so only he fades ----------

const ghostBody = makeHoloMaterial({ color: "#cfffe0", rim: "#f2fff6", opacity: 0.35 });
const ghostLine = makeHoloMaterial({ color: "#063a1a", rim: "#5cff8a", opacity: 0.9 });

// ---------- body shapes ----------

// the upper body: from the waist up to the tip of the hood
const UPPER = [
  sec(0.0, 0.85, 0, 0.17, 0.14),
  sec(0.0, 1.0, 0, 0.22, 0.17),
  sec(-0.01, 1.2, 0, 0.27, 0.18),
  sec(-0.01, 1.4, 0, 0.28, 0.18),
  sec(-0.02, 1.55, 0, 0.22, 0.16),
  sec(-0.03, 1.7, 0, 0.17, 0.14),
  sec(-0.04, 1.82, 0, 0.13, 0.11),
  sec(-0.05, 1.92, 0, 0.085, 0.07),
  sec(-0.06, 1.98, 0, 0.045, 0.04),
  sec(-0.06, 2.02, 0, 0.012, 0.012),
];

// a thin arm, drawn hanging down from the shoulder (the shoulder is at y = 0)
function makeArm(length, width) {
  return [
    sec(0, -length, 0, width * 0.55, width * 0.55),
    sec(0, -length * 0.5, 0, width * 0.7, width * 0.7),
    sec(0, 0, 0, width, width),
    sec(0, 0.02, 0, width * 0.8, width * 0.8),
  ];
}

const LEFT_LENGTH = 0.55;
const RIGHT_LENGTH = 0.8;
const LEFT_ARM = makeArm(LEFT_LENGTH, 0.05);
const RIGHT_ARM = makeArm(RIGHT_LENGTH, 0.05);

// how the arms hang. The right arm leans in a little
const LEFT_ANGLE = -0.08;
const RIGHT_ANGLE = -0.15;

// ---------- the black lines on the chest ----------
// Each corner is [height, angle]. An angle below 0 is towards the left. These are my approximation.

const LINES = [
  [[1.6, -0.9], [1.5, -0.5], [1.44, 0.0], [1.4, 0.5], [1.36, 1.0]],
  [[1.28, -1.0], [1.24, -0.4], [1.2, 0.1], [1.22, 0.7], [1.3, 1.1]],
  [[1.1, -1.1], [1.0, -0.6], [0.95, -0.2]],
  [[0.95, -0.2], [1.05, 0.3], [1.12, 0.9]],
  [[0.95, -0.2], [0.88, 0.2], [0.86, 0.8]],
];

// made once, so React does not rebuild them
const LINES_GEOMETRY = makeLinesGeometry(LINES.map((line) => surfaceLine(UPPER, line, 0.014)), 0.014);

// where the eye and the Omnitrix sit on the surface
const EYE_POINT = surfacePoint(UPPER, 1.85, -0.55, 0.012);
const SYMBOL_POINT = surfacePoint(UPPER, 1.34, -0.75, 0.014);

// ---------- the tail ----------

const TAIL_PIECES = 12;
const PIECE_LENGTH = 0.11;

// how much each piece turns. The tail goes down, then sweeps to the right, then curls up
const TAIL_BEND = [0, 0.05, 0.12, 0.2, 0.28, 0.3, 0.3, 0.3, 0.25, 0.2, 0.12, 0.05];

// the radius of the tail at a piece. It gets thinner towards the tip
function tailRadius(i) {
  return 0.15 * Math.pow(1 - i / (TAIL_PIECES + 1), 1.1) + 0.03;
}

// the forked fin at the end of the tail (it points down, along the last piece)
function makeFin() {
  const points = [
    [0, 0], [-0.07, -0.08], [-0.14, -0.22], [-0.12, -0.36], [-0.04, -0.28],
    [0, -0.4], [0.04, -0.28], [0.12, -0.36], [0.14, -0.22], [0.07, -0.08],
  ];
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => {
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
  geometry.translate(0, 0, -0.01);
  return geometry;
}

const FIN = makeFin();

// ---------- body parts ----------

// one piece of the tail. Each piece holds the next piece, so the tail bends like a whip
function TailPiece({ index }) {
  const ref = useRef();
  const top = tailRadius(index);
  const bottom = tailRadius(index + 1);

  useFrame((state) => {
    if (!ref.current) return;
    const wave = Math.sin(state.clock.elapsedTime * 1.5 - index * 0.45) * 0.07;
    ref.current.rotation.z = TAIL_BEND[index] + wave;
  });

  // the piece after the last one is empty
  if (index >= TAIL_PIECES) return null;

  const isLast = index === TAIL_PIECES - 1;
  const hasBand = index === 7 || index === 9;

  return (
    <group ref={ref}>
      {/* a ball at the joint, so there are no gaps when the tail bends */}
      <mesh scale={[top, top, top]} material={ghostBody}>
        <sphereGeometry args={[1, 12, 10]} />
      </mesh>

      <mesh position={[0, -PIECE_LENGTH / 2, 0]} material={ghostBody}>
        <cylinderGeometry args={[top, bottom, PIECE_LENGTH, 14]} />
      </mesh>

      {/* a black band around the tail */}
      {hasBand && (
        <mesh position={[0, -PIECE_LENGTH / 2, 0]} material={ghostLine}>
          <cylinderGeometry args={[(top + bottom) / 2 + 0.006, (top + bottom) / 2 + 0.006, 0.025, 14]} />
        </mesh>
      )}

      {/* the forked fin on the last piece */}
      {isLast && (
        <group position={[0, -PIECE_LENGTH, 0]}>
          <mesh geometry={FIN} material={ghostBody} />
        </group>
      )}

      <group position={[0, -PIECE_LENGTH, 0]}>
        <TailPiece index={index + 1} />
      </group>
    </group>
  );
}

// the hand: a small palm and three long claws
function Hand({ length }) {
  return (
    <group position={[0, -length, 0]}>
      <mesh scale={[0.035, 0.05, 0.03]} material={holoSoft}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
      {[-1, 0, 1].map((k) => (
        <mesh
          key={k}
          position={[k * 0.035, -0.12, 0]}
          rotation={[0, 0, Math.PI + k * 0.18]}
          material={holoSoft}
        >
          <coneGeometry args={[0.014, 0.2, 5]} />
        </mesh>
      ))}
    </group>
  );
}

// a thin arm. The group turns around the shoulder
function Arm({ sections, length, position, angle, groupRef }) {
  return (
    <group ref={groupRef} position={position} rotation={[0, 0, angle]}>
      <BodyPart sections={sections} segments={10} material={ghostBody} />
      <Hand length={length} />
    </group>
  );
}

// the body, the one big eye, the black lines and the Omnitrix
function Body({ irisRef }) {
  return (
    <group>
      <Halo sections={UPPER} segments={16} />
      <BodyPart sections={UPPER} segments={16} material={ghostBody} wire />
      <mesh geometry={LINES_GEOMETRY} material={ghostLine} />

      {/* the single big eye: a dark rim, a bright middle and a dark slit */}
      <group position={EYE_POINT} rotation={[0, -0.55, 0.15]}>
        <mesh scale={[0.058, 0.088, 0.02]} material={holoDarkRock}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <mesh ref={irisRef} position={[0, 0, 0.012]} scale={[0.046, 0.074, 0.02]} material={holoBright}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <mesh position={[0, 0, 0.034]} material={holoDarkRock}>
          <boxGeometry args={[0.012, 0.09, 0.01]} />
        </mesh>
      </group>

      {/* the Omnitrix on the upper left of the chest */}
      <group position={SYMBOL_POINT} rotation={[0, -0.75, 0]}>
        <mesh position={[0, 0, -0.003]} material={holoDarkRock}>
          <circleGeometry args={[0.05, 18]} />
        </mesh>
        <OmnitrixSymbol position={[0, 0, 0.002]} size={0.07} />
      </group>
    </group>
  );
}

// ---------- the complete alien ----------

// eases a number from 0 to 1 smoothly (slow start, slow end)
function smooth(x) {
  return x * x * (3 - 2 * x);
}

// how solid he is at a time. 1 is fully there and 0.2 is almost gone. It repeats every 10 seconds
function solidAt(t) {
  const u = (t % 10) / 10;
  if (u < 0.6) return 1;
  if (u < 0.72) return 1 - smooth((u - 0.6) / 0.12) * 0.8;
  if (u < 0.84) return 0.2;
  if (u < 0.96) return 0.2 + smooth((u - 0.84) / 0.12) * 0.8;
  return 1;
}

export default function Ghostfreak() {
  const alien = useRef();
  const float = useRef();
  const iris = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (alien.current) {
      // slow turn, and a very short glitch every 4 seconds
      alien.current.rotation.y = Math.sin(t * 0.35) * 0.2;
      const glitching = t % 4 < 0.12;
      alien.current.position.x = glitching ? Math.sin(t * 90) * 0.03 : 0;
    }

    // floating
    if (float.current) {
      float.current.position.y = 0.05 + Math.sin(t * 0.9) * 0.06;
      float.current.rotation.z = Math.sin(t * 0.6) * 0.03;
    }

    // the eye pulses
    if (iris.current) {
      iris.current.scale.x = 0.046 * (1 + Math.sin(t * 2.2) * 0.08);
      iris.current.scale.y = 0.074 * (1 + Math.sin(t * 2.2) * 0.08);
    }

    // the arms drift
    if (leftArm.current) {
      leftArm.current.rotation.z = LEFT_ANGLE + Math.sin(t * 0.8) * 0.05;
      leftArm.current.rotation.x = Math.sin(t * 0.6) * 0.05;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = RIGHT_ANGLE + Math.sin(t * 0.8 + 1) * 0.05;
      rightArm.current.rotation.x = Math.sin(t * 0.6 + 1) * 0.06;
    }

    // phasing: he fades almost out and comes back. The black lines stay a little visible
    const solid = solidAt(t);
    ghostBody.uniforms.uOpacity.value = 0.35 * solid;
    ghostLine.uniforms.uOpacity.value = 0.9 * (0.4 + 0.6 * solid);
  });

  return (
    <group ref={alien} position={[-0.35, 0, 0]} scale={0.85}>
      <group ref={float}>
        <Body irisRef={iris} />

        {/* the tail starts at the waist */}
        <group position={[0, 0.85, 0]}>
          <TailPiece index={0} />
        </group>

        <Arm sections={LEFT_ARM} length={LEFT_LENGTH} position={[-0.26, 1.0, 0]} angle={LEFT_ANGLE} groupRef={leftArm} />
        <Arm sections={RIGHT_ARM} length={RIGHT_LENGTH} position={[0.26, 1.4, 0]} angle={RIGHT_ANGLE} groupRef={rightArm} />
      </group>

      <DataSparks height={2.1} radius={0.8} />
      <ScanRing height={1.9} radius={0.85} />
    </group>
  );
}
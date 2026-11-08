import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { sec, BodyPart, Halo, OmnitrixSymbol } from "./parts";
import { DataSparks, ScanRing } from "./effects";
import { holoCore, holoDarkRock, holoBright, holoGold } from "../hologram/hologramMaterials";
import { sectionAt } from "../../utils/circuitLines";

// Wildmutt, built from the reference pictures.
// The feet are at y = 0 and he faces the +z direction. He is about 1.9 long and 1.3 tall.
// A crouched four-legged beast with NO eyes, two tusks, a black band across the face,
// shaggy fur tufts, very long arms and huge clawed hands. There is no tail in the pictures.

// ---------- body shapes ----------

// The body and the head are drawn upright and then laid down (the group is turned by 90 degrees).
// That is why the sizes are described as: along (back to front), up (height), half width, half height.
function ring(x, along, up, halfWidth, halfHeight) {
  return sec(x, along, -up, halfWidth, halfHeight);
}

// the body: narrow hips, a big chest, high shoulders
const TORSO = [
  ring(0, -0.72, 0.68, 0.17, 0.2),
  ring(0, -0.55, 0.72, 0.26, 0.27),
  ring(0, -0.3, 0.74, 0.25, 0.25),
  ring(0, -0.05, 0.8, 0.3, 0.3),
  ring(0, 0.2, 0.9, 0.36, 0.36),
  ring(0, 0.4, 0.9, 0.32, 0.33),
  ring(0, 0.52, 0.86, 0.2, 0.22),
];

// the long wedge-shaped head. It hangs low and ends in a blunt snout
const HEAD = [
  ring(0, 0.45, 0.84, 0.2, 0.2),
  ring(0, 0.6, 0.78, 0.22, 0.2),
  ring(0, 0.75, 0.7, 0.19, 0.16),
  ring(0, 0.9, 0.62, 0.17, 0.13),
  ring(0, 1.0, 0.585, 0.145, 0.115),
  ring(0, 1.06, 0.575, 0.135, 0.105),
  ring(0, 1.09, 0.575, 0.09, 0.07),
];

// a limb that hangs down from the origin. The rings go from the bottom to the top.
function limbSections(length, topWidth, midWidth, bottomWidth) {
  return [
    sec(0, -length, 0, bottomWidth, bottomWidth * 0.9),
    sec(0, -length * 0.55, 0, midWidth, midWidth * 0.9),
    sec(0, -length * 0.1, 0, topWidth, topWidth * 0.95),
    sec(0, 0, 0, topWidth * 0.9, topWidth * 0.85),
  ];
}

const FRONT_UP_LENGTH = 0.45;
const FRONT_LOW_LENGTH = 0.52;
const HIND_UP_LENGTH = 0.42;
const HIND_LOW_LENGTH = 0.45;

const FRONT_UPPER = limbSections(FRONT_UP_LENGTH, 0.15, 0.15, 0.12);
const FRONT_LOWER = limbSections(FRONT_LOW_LENGTH, 0.12, 0.15, 0.1);
const HIND_UPPER = limbSections(HIND_UP_LENGTH, 0.21, 0.19, 0.12);
const HIND_LOWER = limbSections(HIND_LOW_LENGTH, 0.11, 0.1, 0.065);

// how the legs bend (in radians). Negative leans forward, positive leans backwards
const FRONT_A = -0.35; // the upper arm
const FRONT_B = -0.4; // the forearm, on top of the upper arm
const HIND_A = -0.9; // the thigh
const HIND_B = 1.4; // the shin, on top of the thigh

// ---------- the fur tufts ----------

// makes one shape from many thin cones. Each tuft says where it is, how it leans and how big it is
function makeTufts(items) {
  const pieces = items.map(({ x, y, z, tiltX = 0, tiltZ = 0, size }) => {
    const cone = new THREE.ConeGeometry(size * 0.18, size, 5);
    cone.translate(0, size / 2, 0);
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, 0, tiltZ));
    cone.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), turn, new THREE.Vector3(1, 1, 1)));
    return cone;
  });
  const merged = mergeGeometries(pieces);
  pieces.forEach((piece) => piece.dispose());
  return merged;
}

// tufts along the back, swept backwards
const BACK_ITEMS = [];
for (let i = 0; i < 9; i++) {
  const z = -0.62 + i * 0.12;
  const s = sectionAt(TORSO, z);
  const top = -s.z + s.rz;
  const size = 0.1 + 0.08 * Math.sin((i / 8) * Math.PI);
  BACK_ITEMS.push({ x: 0, y: top, z: z, tiltX: -0.9, size: size });
  BACK_ITEMS.push({ x: -0.08, y: top - 0.03, z: z + 0.04, tiltX: -0.8, tiltZ: 0.4, size: size * 0.8 });
  BACK_ITEMS.push({ x: 0.08, y: top - 0.03, z: z + 0.04, tiltX: -0.8, tiltZ: -0.4, size: size * 0.8 });
}

// a ring of tufts around the neck, like a mane
const MANE_ITEMS = [];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  MANE_ITEMS.push({
    x: Math.cos(a) * 0.19,
    y: 0.84 + Math.sin(a) * 0.19,
    z: 0.5,
    tiltX: -1.1,
    tiltZ: -Math.cos(a) * 0.5,
    size: 0.14,
  });
}

// tufts under the chin, like a beard
const BEARD_ITEMS = [];
for (let i = 0; i < 6; i++) {
  BEARD_ITEMS.push({ x: -0.1 + i * 0.04, y: 0.5, z: 0.85 + (i % 2) * 0.08, tiltX: -2.3, size: 0.1 });
}

// tufts on the back of a forearm (drawn hanging down)
const ARM_ITEMS = [];
for (let i = 0; i < 5; i++) {
  ARM_ITEMS.push({ x: 0, y: -0.08 - i * 0.09, z: -0.1, tiltX: -1.9, size: 0.12 });
  ARM_ITEMS.push({ x: 0.05, y: -0.12 - i * 0.09, z: -0.09, tiltX: -1.9, tiltZ: -0.3, size: 0.1 });
  ARM_ITEMS.push({ x: -0.05, y: -0.12 - i * 0.09, z: -0.09, tiltX: -1.9, tiltZ: 0.3, size: 0.1 });
}

// made once, so React does not rebuild them
const BACK_TUFTS = makeTufts(BACK_ITEMS);
const MANE_TUFTS = makeTufts(MANE_ITEMS);
const BEARD_TUFTS = makeTufts(BEARD_ITEMS);
const ARM_TUFTS = makeTufts(ARM_ITEMS);

// ---------- body parts ----------

// the body, laid down along the z axis
function Body() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Halo sections={TORSO} segments={14} />
      <BodyPart sections={TORSO} segments={14} material={holoCore} wire />
    </group>
  );
}

// the head: the snout, the black band, the small teeth and the two tusks. There are no eyes.
function Head() {
  return (
    <group>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Halo sections={HEAD} segments={12} />
        <BodyPart sections={HEAD} segments={12} material={holoCore} wire />
      </group>

      {/* the thick black band across the front of the face */}
      <mesh position={[0, 0.575, 1.075]} material={holoDarkRock}>
        <boxGeometry args={[0.27, 0.04, 0.03]} />
      </mesh>

      {/* small teeth above the band */}
      {[-0.09, -0.045, 0, 0.045, 0.09].map((x) => (
        <mesh key={x} position={[x, 0.605, 1.08]} rotation={[0, 0, Math.PI]} material={holoBright}>
          <coneGeometry args={[0.014, 0.04, 4]} />
        </mesh>
      ))}

      {/* two tusks that point up */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.66, 1.04]} rotation={[0.15, 0, -s * 0.15]} material={holoBright}>
          <coneGeometry args={[0.03, 0.2, 6]} />
        </mesh>
      ))}

      <mesh geometry={BEARD_TUFTS} material={holoGold} />
    </group>
  );
}

// a huge hand with four long black claws. It is flat on the ground
function Hand() {
  return (
    <group>
      <mesh position={[0, 0.05, 0.06]} scale={[0.18, 0.07, 0.17]} material={holoCore}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>

      {[-0.1, -0.033, 0.033, 0.1].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.04, 0.2]} scale={[0.032, 0.035, 0.07]} material={holoCore}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
          <mesh position={[x, 0.035, 0.29]} rotation={[Math.PI / 2 + 0.3, 0, 0]} material={holoDarkRock}>
            <coneGeometry args={[0.028, 0.2, 5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// a big foot with three claws. It is flat on the ground
function Foot() {
  return (
    <group>
      <mesh position={[0, 0.05, 0.08]} scale={[0.13, 0.06, 0.2]} material={holoCore}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>

      {[-0.07, 0, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.035, 0.27]} rotation={[Math.PI / 2 + 0.3, 0, 0]} material={holoDarkRock}>
          <coneGeometry args={[0.026, 0.18, 5]} />
        </mesh>
      ))}
    </group>
  );
}

// a front leg (his long arm). The upper group turns at the shoulder, the lower group at the elbow.
// The hand turns back by the same amount, so it always lies flat.
function FrontLeg({ side, upperRef, lowerRef }) {
  const total = FRONT_A + FRONT_B;

  return (
    <group ref={upperRef} position={[side * 0.36, 0.86, 0.2]} rotation={[FRONT_A, 0, 0]}>
      <Halo sections={FRONT_UPPER} segments={10} />
      <BodyPart sections={FRONT_UPPER} segments={10} material={holoCore} wire />
      <mesh scale={[0.17, 0.17, 0.17]} material={holoCore}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>

      <group ref={lowerRef} position={[0, -FRONT_UP_LENGTH, 0]} rotation={[FRONT_B, 0, 0]}>
        <mesh scale={[0.14, 0.14, 0.14]} material={holoCore}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <Halo sections={FRONT_LOWER} segments={10} />
        <BodyPart sections={FRONT_LOWER} segments={10} material={holoCore} wire />
        <mesh geometry={ARM_TUFTS} material={holoGold} />

        {/* the Omnitrix on the wrist of one arm */}
        {side === 1 && (
          <group position={[0, -0.36, 0]}>
            <mesh material={holoDarkRock}>
              <cylinderGeometry args={[0.16, 0.16, 0.09, 12]} />
            </mesh>
            <group position={[0.165, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <OmnitrixSymbol position={[0, 0, 0]} size={0.07} />
            </group>
          </group>
        )}

        <group position={[0, -FRONT_LOW_LENGTH, 0]} rotation={[-total, 0, 0]}>
          <Hand />
        </group>
      </group>
    </group>
  );
}

// a back leg. The upper group turns at the hip, the lower group at the knee.
function HindLeg({ side, upperRef, lowerRef }) {
  const total = HIND_A + HIND_B;

  return (
    <group ref={upperRef} position={[side * 0.28, 0.72, -0.5]} rotation={[HIND_A, 0, 0]}>
      <Halo sections={HIND_UPPER} segments={10} />
      <BodyPart sections={HIND_UPPER} segments={10} material={holoCore} wire />

      <group ref={lowerRef} position={[0, -HIND_UP_LENGTH, 0]} rotation={[HIND_B, 0, 0]}>
        <mesh scale={[0.12, 0.12, 0.12]} material={holoCore}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <Halo sections={HIND_LOWER} segments={10} />
        <BodyPart sections={HIND_LOWER} segments={10} material={holoCore} wire />

        <group position={[0, -HIND_LOW_LENGTH, 0]} rotation={[-total, 0, 0]}>
          <Foot />
        </group>
      </group>
    </group>
  );
}

// ---------- the complete alien ----------

export default function Wildmutt() {
  const alien = useRef();
  const body = useRef();
  const head = useRef();
  const leftFrontUpper = useRef();
  const leftFrontLower = useRef();
  const rightFrontUpper = useRef();
  const rightFrontLower = useRef();
  const leftHindUpper = useRef();
  const leftHindLower = useRef();
  const rightHindUpper = useRef();
  const rightHindLower = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (alien.current) {
      // slow sway, and a very short glitch every 4 seconds
      alien.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      const glitching = t % 4 < 0.12;
      alien.current.position.x = glitching ? Math.sin(t * 90) * 0.03 : 0;
    }

    // breathing
    if (body.current) {
      body.current.scale.y = 1 + Math.sin(t * 1.8) * 0.015;
    }

    // sniffing: the head sways, the snout lifts, and it sniffs quickly
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6) * 0.22;
      head.current.rotation.x = Math.sin(t * 3.4) * 0.04 - Math.max(0, Math.sin(t * 0.7)) * 0.12;
    }

    // the shoulders and hips shift a little. The upper and lower part move in opposite ways,
    // so the hands and feet stay flat on the ground
    const shift = Math.sin(t * 0.9) * 0.04;
    if (leftFrontUpper.current) leftFrontUpper.current.rotation.x = FRONT_A + shift;
    if (leftFrontLower.current) leftFrontLower.current.rotation.x = FRONT_B - shift;
    if (rightFrontUpper.current) rightFrontUpper.current.rotation.x = FRONT_A - shift;
    if (rightFrontLower.current) rightFrontLower.current.rotation.x = FRONT_B + shift;
    if (leftHindUpper.current) leftHindUpper.current.rotation.x = HIND_A - shift * 0.5;
    if (leftHindLower.current) leftHindLower.current.rotation.x = HIND_B + shift * 0.5;
    if (rightHindUpper.current) rightHindUpper.current.rotation.x = HIND_A + shift * 0.5;
    if (rightHindLower.current) rightHindLower.current.rotation.x = HIND_B - shift * 0.5;
  });

  return (
    <group ref={alien} scale={0.85} position={[0, 0, -0.15]}>
      <group ref={body}>
        <Body />
        <mesh geometry={BACK_TUFTS} material={holoGold} />
        <mesh geometry={MANE_TUFTS} material={holoGold} />
      </group>

      {/* the head turns around the neck */}
      <group ref={head} position={[0, 0.84, 0.45]}>
        <group position={[0, -0.84, -0.45]}>
          <Head />
        </group>
      </group>

      <FrontLeg side={-1} upperRef={leftFrontUpper} lowerRef={leftFrontLower} />
      <FrontLeg side={1} upperRef={rightFrontUpper} lowerRef={rightFrontLower} />
      <HindLeg side={-1} upperRef={leftHindUpper} lowerRef={leftHindLower} />
      <HindLeg side={1} upperRef={rightHindUpper} lowerRef={rightHindLower} />

      <DataSparks height={1.7} radius={0.75} />
      <ScanRing height={1.5} radius={0.9} />
    </group>
  );
}
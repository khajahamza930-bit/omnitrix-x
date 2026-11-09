import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { sec, BodyPart, Halo, OmnitrixSymbol } from "./parts";
import { DataSparks, ScanRing } from "./effects";
import { holoCore, holoSoft, holoDarkRock, holoBright, holoCrystal } from "../hologram/hologramMaterials";
import { makeLinesGeometry } from "../../utils/circuitLines";

// Stinkfly, built from the reference picture.
// He hovers in the air and faces the +z direction. He is about 2 tall with the wings.
// A white capsule body with black bands, a black dome head with two stalks, four long thin legs,
// two arms with claws, a black blade tail, and two huge see-through wings with veins.

// ---------- the body ----------

// the body leans forward (in radians), like in the picture
const TILT = 0.75;

// the body, from the tail end (y = 0) up to the neck (y = 0.7)
const TORSO = [
  sec(0, 0.0, 0, 0.07, 0.07),
  sec(0, 0.1, 0, 0.11, 0.1),
  sec(0, 0.25, 0, 0.125, 0.11),
  sec(0, 0.4, 0, 0.14, 0.12),
  sec(0, 0.55, 0, 0.14, 0.12),
  sec(0, 0.66, 0, 0.1, 0.09),
  sec(0, 0.7, 0, 0.05, 0.05),
];

// the black armor bands around the body: [height, radius]
const BANDS = [[0.16, 0.12], [0.33, 0.145], [0.5, 0.15]];

// ---------- flat shapes: the wings and the tail blade ----------

// makes a flat shape from a list of [x, y] points
function makeFlat(points, depth) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => {
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

// turns [x, y] points into 3D points at the height z
function toLine(points, z) {
  return points.map(([x, y]) => [x, y, z]);
}

// the outline of one wing: a long curved blade with a notch cut out of the back edge
const WING_POINTS = [
  [0, 0], [0.12, 0.3], [0.28, 0.65], [0.5, 1.05], [0.75, 1.4], [1.0, 1.65],
  [0.9, 1.4], [0.82, 1.15], [0.7, 1.0], [0.62, 0.85], [0.72, 0.82],
  [0.68, 0.62], [0.5, 0.42], [0.3, 0.22], [0.14, 0.08],
];

// the veins: one long vein in the middle, and shorter ones that make the cells
const WING_VEINS = [
  [[0.05, 0.04], [0.22, 0.35], [0.45, 0.7], [0.62, 1.05], [0.9, 1.55]],
  [[0.22, 0.35], [0.42, 0.42], [0.5, 0.42]],
  [[0.45, 0.7], [0.62, 0.68], [0.68, 0.62]],
  [[0.45, 0.7], [0.32, 0.5], [0.22, 0.35]],
  [[0.62, 1.05], [0.7, 1.0]],
  [[0.45, 0.7], [0.5, 0.88], [0.62, 1.05]],
  [[0.62, 1.05], [0.78, 1.3], [0.9, 1.4]],
];

// made once, so React does not rebuild them
const WING_GEOMETRY = makeFlat(WING_POINTS, 0.008);
const WING_OUTLINE = makeLinesGeometry([toLine([...WING_POINTS, WING_POINTS[0]], 0)], 0.008);
const WING_VEINS_FRONT = makeLinesGeometry(WING_VEINS.map((line) => toLine(line, 0.008)), 0.006);
const WING_VEINS_BACK = makeLinesGeometry(WING_VEINS.map((line) => toLine(line, -0.008)), 0.006);

// the blade on the tail, a curved crescent
const BLADE = makeFlat(
  [[0.04, 0.25], [-0.08, 0.2], [-0.18, 0.05], [-0.24, -0.15], [-0.22, -0.35], [-0.12, -0.2], [-0.06, -0.05], [0.04, 0.05]],
  0.03
);

// ---------- the stalks on the head ----------

// a thin curved stalk that goes forward from the front of the head
function makeStalk(s) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.05, 0.0, 0.12),
    new THREE.Vector3(s * 0.09, 0.05, 0.22),
    new THREE.Vector3(s * 0.13, 0.09, 0.3),
    new THREE.Vector3(s * 0.14, 0.07, 0.38),
  ]);
  return makeLinesGeometry([curve.getPoints(12).map((p) => [p.x, p.y, p.z])], 0.012);
}

const STALKS = { "-1": makeStalk(-1), "1": makeStalk(1) };

// ---------- the legs ----------

// the four legs: where they start, how far they spread, and how long the lower part is
const LEG_LIST = [
  { x: -0.1, y: 1.0, z: 0.1, spread: -0.55, lower: 0.62, back: -0.1 },
  { x: 0.1, y: 1.0, z: 0.1, spread: 0.55, lower: 0.62, back: -0.1 },
  { x: -0.1, y: 0.87, z: -0.04, spread: -0.75, lower: 0.5, back: 0.15 },
  { x: 0.1, y: 0.87, z: -0.04, spread: 0.75, lower: 0.5, back: 0.15 },
];

// ---------- body parts ----------

// the head: a glossy black dome with the Omnitrix on the front and two stalks
function Head({ stalkRefs }) {
  return (
    <group>
      <mesh scale={[0.14, 0.13, 0.17]} material={haloLook} renderOrder={1}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[0.13, 0.12, 0.16]} material={holoDarkRock}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>

      {/* the Omnitrix on the front of the head */}
      <group position={[0, 0.06, 0.15]} rotation={[-0.6, 0, 0]}>
        <mesh material={holoBright}>
          <torusGeometry args={[0.045, 0.007, 8, 20]} />
        </mesh>
        <OmnitrixSymbol position={[0, 0, 0.002]} size={0.055} />
      </group>

      {/* the two thin stalks with round tips. There are no eyes */}
      {[-1, 1].map((s, i) => (
        <group key={s} ref={(el) => (stalkRefs.current[i] = el)}>
          <mesh geometry={STALKS[s]} material={holoSoft} />
          <mesh position={[s * 0.14, 0.07, 0.38]} scale={[0.024, 0.024, 0.024]} material={holoSoft}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// the soft glow around the head. It is a bit bigger than the head
const haloLook = new THREE.MeshBasicMaterial({
  color: "#7dffa0",
  transparent: true,
  opacity: 0.2,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// one see-through wing. The outer group puts it in place, and the inner group flaps
function Wing({ side, flapRef }) {
  return (
    <group position={[side * 0.08, 1.2, 0]} rotation={[-0.45, side === -1 ? Math.PI : 0, 0]}>
      <group ref={flapRef} rotation={[0, 0, 0.15]} scale={0.75}>
        <mesh geometry={WING_GEOMETRY} material={holoCrystal} />
        <mesh geometry={WING_OUTLINE} material={holoBright} />
        <mesh geometry={WING_VEINS_FRONT} material={holoBright} />
        <mesh geometry={WING_VEINS_BACK} material={holoBright} />
      </group>
    </group>
  );
}

// one long thin leg: a short upper part that goes out, and a long pointed lower part that goes down
function Leg({ info, upperRef, lowerRef }) {
  return (
    <group ref={upperRef} position={[info.x, info.y, info.z]} rotation={[0, 0, info.spread]}>
      <mesh position={[0, -0.16, 0]} material={holoSoft}>
        <cylinderGeometry args={[0.03, 0.022, 0.32, 8]} />
      </mesh>
      <mesh scale={[0.034, 0.034, 0.034]} material={holoSoft}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>

      <group ref={lowerRef} position={[0, -0.32, 0]} rotation={[info.back, 0, -info.spread]}>
        <mesh scale={[0.028, 0.028, 0.028]} material={holoSoft}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        <mesh position={[0, -info.lower / 2, 0]} material={holoSoft}>
          <cylinderGeometry args={[0.022, 0.004, info.lower, 8]} />
        </mesh>
      </group>
    </group>
  );
}

// an arm that reaches forward and ends in a hand with three claws
function Arm({ side, upperRef, lowerRef }) {
  return (
    <group ref={upperRef} position={[side * 0.15, 1.12, 0.2]} rotation={[-0.9, 0, side * 0.3]}>
      <mesh position={[0, -0.14, 0]} material={holoSoft}>
        <cylinderGeometry args={[0.032, 0.024, 0.28, 8]} />
      </mesh>
      <mesh scale={[0.036, 0.036, 0.036]} material={holoSoft}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>

      <group ref={lowerRef} position={[0, -0.28, 0]} rotation={[-0.7, 0, 0]}>
        <mesh scale={[0.03, 0.03, 0.03]} material={holoSoft}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        <mesh position={[0, -0.16, 0]} material={holoSoft}>
          <cylinderGeometry args={[0.024, 0.016, 0.32, 8]} />
        </mesh>

        {/* the hand and three sharp claws */}
        <group position={[0, -0.34, 0]}>
          <mesh scale={[0.03, 0.04, 0.025]} material={holoSoft}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          {[-1, 0, 1].map((k) => (
            <mesh
              key={k}
              position={[k * 0.025, -0.07, 0]}
              rotation={[Math.PI, 0, k * 0.2]}
              material={holoBright}
            >
              <coneGeometry args={[0.012, 0.12, 5]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// the tail: a thin stalk and a big black blade at the end. The group turns at the body
function Tail({ groupRef }) {
  return (
    <group ref={groupRef} position={[0, 0.74, -0.2]} rotation={[0.7, 0, 0]}>
      <mesh position={[0, -0.15, 0]} material={holoSoft}>
        <cylinderGeometry args={[0.04, 0.03, 0.3, 8]} />
      </mesh>

      <group position={[0, -0.3, 0]} rotation={[-0.7, 0, 0]} scale={1.3}>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={BLADE} material={holoDarkRock} />
        </group>
      </group>
    </group>
  );
}

// ---------- the complete alien ----------

export default function Stinkfly() {
  const alien = useRef();
  const bob = useRef();
  const torso = useRef();
  const tail = useRef();
  const leftWing = useRef();
  const rightWing = useRef();
  const legUpper = useRef([]);
  const legLower = useRef([]);
  const armUpper = useRef([]);
  const armLower = useRef([]);
  const stalks = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (alien.current) {
      // slow turn, and a very short glitch every 4 seconds
      alien.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      const glitching = t % 4 < 0.12;
      alien.current.position.x = glitching ? Math.sin(t * 90) * 0.03 : 0;
    }

    // hovering: the whole body floats up and down
    if (bob.current) {
      bob.current.position.y = Math.sin(t * 1.6) * 0.05;
    }

    if (torso.current) {
      torso.current.rotation.x = TILT + Math.sin(t * 1.2) * 0.03;
    }

    // the wings flap fast
    const flap = Math.sin(t * 13);
    if (leftWing.current) leftWing.current.rotation.z = 0.15 + flap * 0.25;
    if (rightWing.current) rightWing.current.rotation.z = 0.15 + flap * 0.25;

    // the legs dangle and sway
    LEG_LIST.forEach((info, i) => {
      const sway = Math.sin(t * 1.3 + i) * 0.06;
      if (legUpper.current[i]) legUpper.current[i].rotation.z = info.spread + sway;
      if (legLower.current[i]) legLower.current[i].rotation.z = -(info.spread + sway);
    });

    // the arms reach and the claws open and close a little
    [0, 1].forEach((i) => {
      if (armUpper.current[i]) armUpper.current[i].rotation.x = -0.9 + Math.sin(t * 1.5 + i) * 0.08;
      if (armLower.current[i]) armLower.current[i].rotation.x = -0.7 + Math.sin(t * 2 + i) * 0.1;
    });

    // the stalks twitch
    [0, 1].forEach((i) => {
      if (stalks.current[i]) {
        stalks.current[i].rotation.y = Math.sin(t * 2.4 + i * 2) * 0.1;
        stalks.current[i].rotation.x = Math.sin(t * 1.9 + i) * 0.06;
      }
    });

    // the tail sways
    if (tail.current) {
      tail.current.rotation.z = Math.sin(t * 1.7) * 0.12;
    }
  });

  return (
    <group ref={alien} scale={0.9}>
      <group ref={bob}>
        {/* the body, leaned forward */}
        <group ref={torso} position={[0, 0.75, -0.2]} rotation={[TILT, 0, 0]}>
          <Halo sections={TORSO} segments={12} />
          <BodyPart sections={TORSO} segments={12} material={holoCore} wire />

          {/* the black armor bands */}
          {BANDS.map(([y, radius]) => (
            <mesh key={y} position={[0, y, 0]} scale={[1, 1, 0.87]} material={holoDarkRock}>
              <cylinderGeometry args={[radius, radius, 0.04, 14]} />
            </mesh>
          ))}

          {/* the head, turned back a little, so it looks forward */}
          <group position={[0, 0.76, 0.06]} rotation={[-0.45, 0, 0]}>
            <Head stalkRefs={stalks} />
          </group>
        </group>

        <Tail groupRef={tail} />

        <Wing side={-1} flapRef={leftWing} />
        <Wing side={1} flapRef={rightWing} />

        {LEG_LIST.map((info, i) => (
          <Leg
            key={i}
            info={info}
            upperRef={(el) => (legUpper.current[i] = el)}
            lowerRef={(el) => (legLower.current[i] = el)}
          />
        ))}

        {[-1, 1].map((s, i) => (
          <Arm
            key={s}
            side={s}
            upperRef={(el) => (armUpper.current[i] = el)}
            lowerRef={(el) => (armLower.current[i] = el)}
          />
        ))}
      </group>

      <DataSparks height={2.2} radius={0.85} />
      <ScanRing height={2.0} radius={0.9} />
    </group>
  );
}
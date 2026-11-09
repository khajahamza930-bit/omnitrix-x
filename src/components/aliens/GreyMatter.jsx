import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { sec, BodyPart, Halo, OmnitrixSymbol } from "./parts";
import { DataSparks, ScanRing } from "./effects";
import { holoCore, holoSoft, holoDarkRock, holoBright } from "../hologram/hologramMaterials";
import { sectionAt, surfacePoint, surfaceLine, makeLinesGeometry } from "../../utils/circuitLines";

// Grey Matter, built from the reference render.
// The feet are at y = 0 and he faces the +z direction. He is about 1 tall (the others are about 2).
// A huge heart-shaped head with two big round eyes, a slim white suit with a black stripe,
// black wristbands, and gray hands with long thin fingers.

// ---------- body shapes (rings from bottom to top) ----------

// the slim body, from the hips up to the shoulders
const TORSO = [
  sec(0, 0.38, 0, 0.085, 0.06),
  sec(0, 0.5, 0, 0.075, 0.055),
  sec(0, 0.6, 0, 0.12, 0.07),
  sec(0, 0.66, 0, 0.145, 0.07),
  sec(0, 0.69, 0, 0.05, 0.045),
];

// the head is wide at the top and narrow at the chin, like an upside-down heart
const HEAD = [
  sec(0, 0.7, 0.01, 0.03, 0.04),
  sec(0, 0.73, 0.01, 0.07, 0.07),
  sec(0, 0.78, 0, 0.13, 0.1),
  sec(0, 0.84, 0, 0.17, 0.115),
  sec(0, 0.9, 0, 0.19, 0.12),
  sec(0, 0.96, 0, 0.17, 0.105),
  sec(0, 0.995, 0, 0.1, 0.07),
  sec(0, 1.005, 0, 0.03, 0.03),
];

// thin legs
function makeLeg(s) {
  const x = s * 0.05;
  return [
    sec(x, 0.04, 0, 0.03, 0.035),
    sec(x, 0.12, 0, 0.036, 0.04),
    sec(x, 0.2, 0, 0.038, 0.042),
    sec(x, 0.3, 0, 0.05, 0.055),
    sec(x, 0.38, 0, 0.06, 0.06),
  ];
}

// a thin arm, drawn hanging down from the shoulder (the shoulder is at y = 0)
function makeArm(s) {
  return [
    sec(s * 0.02, -0.23, 0, 0.024, 0.024),
    sec(s * 0.017, -0.15, 0, 0.03, 0.03),
    sec(s * 0.012, -0.08, 0, 0.034, 0.034),
    sec(0, 0, 0, 0.04, 0.04),
    sec(0, 0.02, 0, 0.03, 0.03),
  ];
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// ---------- the markings ----------

// the black stripe from the neck down the middle of the chest
const STRIPE_GEOMETRY = makeLinesGeometry([surfaceLine(TORSO, [[0.675, 0], [0.38, 0]], 0.01)], 0.011);

// the black bar on the forehead, between the eyes
const FOREHEAD_GEOMETRY = makeLinesGeometry([surfaceLine(HEAD, [[0.985, 0], [0.85, 0]], 0.012)], 0.035);

// the tiny flat frown (the ends point down a little)
const MOUTH_GEOMETRY = makeLinesGeometry(
  [surfaceLine(HEAD, [[0.728, -0.5], [0.722, 0], [0.728, 0.5]], 0.008)],
  0.006
);

// where the Omnitrix sits on the chest, beside the stripe
const CHEST_POINT = surfacePoint(TORSO, 0.57, 0.65, 0.012);

// ---------- the eyes ----------

const EYE_X = 0.108;
const EYE_Y = 0.89;

// a point on the front of the head. x is sideways and y is height
function headSurface(x, y, lift) {
  const s = sectionAt(HEAD, y);
  const inside = Math.max(0, 1 - (x / s.rx) ** 2);
  return [x, y, s.z + s.rz * Math.sqrt(inside) + lift];
}

// how far the eye must turn, so it faces out from the curved head
function eyeTurn(x, y) {
  const s = sectionAt(HEAD, y);
  const inside = Math.max(0, 1 - (x / s.rx) ** 2);
  return Math.atan2(x / (s.rx * s.rx), Math.sqrt(inside) / s.rz);
}

// the first one is the left eye and the second one is the right eye
const EYE_POSITIONS = [-1, 1].map((s) => headSurface(s * EYE_X, EYE_Y, 0.008));
const EYE_TURNS = [-1, 1].map((s) => eyeTurn(s * EYE_X, EYE_Y));

// ---------- body parts ----------

function Body() {
  return (
    <group>
      <Halo sections={TORSO} segments={12} />
      <BodyPart sections={TORSO} segments={12} material={holoCore} wire />
      <mesh geometry={STRIPE_GEOMETRY} material={holoDarkRock} />

      {/* the Omnitrix on the chest. It is not visible in the render, so this is my choice */}
      <group position={CHEST_POINT} rotation={[0, 0.65, 0]}>
        <mesh position={[0, 0, -0.003]} material={holoDarkRock}>
          <circleGeometry args={[0.032, 18]} />
        </mesh>
        <OmnitrixSymbol position={[0, 0, 0.002]} size={0.042} />
      </group>

      {/* the short neck */}
      <mesh position={[0, 0.695, 0]} material={holoSoft}>
        <cylinderGeometry args={[0.035, 0.04, 0.03, 12]} />
      </mesh>
    </group>
  );
}

// the head with the two big eyes. The eyes can blink, so we keep a reference to each one
function Head({ eyeRefs }) {
  return (
    <group>
      <Halo sections={HEAD} segments={14} />
      <BodyPart sections={HEAD} segments={14} material={holoSoft} wire />
      <mesh geometry={FOREHEAD_GEOMETRY} material={holoDarkRock} />
      <mesh geometry={MOUTH_GEOMETRY} material={holoDarkRock} />

      {[0, 1].map((i) => (
        <group
          key={i}
          ref={(el) => (eyeRefs.current[i] = el)}
          position={EYE_POSITIONS[i]}
          rotation={[0, EYE_TURNS[i], 0]}
        >
          {/* the thick black rim */}
          <mesh scale={[0.074, 0.074, 0.02]} material={holoDarkRock}>
            <sphereGeometry args={[1, 18, 12]} />
          </mesh>

          {/* the bright eye */}
          <mesh position={[0, 0, 0.012]} scale={[0.056, 0.056, 0.02]} material={holoBright}>
            <sphereGeometry args={[1, 18, 12]} />
          </mesh>

          {/* the black bar across the middle of the eye */}
          <mesh position={[0, 0, 0.034]} material={holoDarkRock}>
            <boxGeometry args={[0.07, 0.012, 0.01]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// a thin arm with a black wristband and a gray hand. The group turns around the shoulder
function Arm({ side, groupRef }) {
  return (
    <group ref={groupRef} position={[side * 0.15, 0.65, 0]}>
      <BodyPart sections={ARMS[side]} segments={10} material={holoCore} wire />

      {/* the thick black wristband */}
      <mesh position={[side * 0.02, -0.2, 0]} material={holoDarkRock}>
        <cylinderGeometry args={[0.034, 0.034, 0.04, 12]} />
      </mesh>

      {/* the gray hand: a small palm and four very long thin fingers */}
      <group position={[side * 0.02, -0.25, 0]}>
        <mesh position={[0, -0.04, 0]} scale={[0.03, 0.045, 0.016]} material={holoSoft}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>

        {[-0.024, -0.008, 0.008, 0.024].map((x, k) => (
          <mesh key={x} position={[x, -0.15, 0]} rotation={[0, 0, (k - 1.5) * 0.07]} material={holoSoft}>
            <cylinderGeometry args={[0.009, 0.004, 0.16, 6]} />
          </mesh>
        ))}

        {/* a short thumb on the inside of the hand */}
        <mesh position={[-side * 0.04, -0.09, 0]} rotation={[0, 0, -side * 0.5]} material={holoSoft}>
          <cylinderGeometry args={[0.008, 0.004, 0.08, 6]} />
        </mesh>
      </group>
    </group>
  );
}

function Leg({ side }) {
  const x = side * 0.05;

  return (
    <group>
      <Halo sections={LEGS[side]} segments={10} />
      <BodyPart sections={LEGS[side]} segments={10} material={holoCore} wire />

      {/* the black band at the ankle and a small dark shoe */}
      <mesh position={[x, 0.06, 0.005]} material={holoDarkRock}>
        <cylinderGeometry args={[0.036, 0.034, 0.04, 12]} />
      </mesh>
      <mesh position={[x, 0.018, 0.03]} scale={[0.042, 0.02, 0.075]} material={holoDarkRock}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
    </group>
  );
}

// ---------- the complete alien ----------

export default function GreyMatter() {
  const alien = useRef();
  const body = useRef();
  const head = useRef();
  const eyes = useRef([]);
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (alien.current) {
      // slow sway, and a very short glitch every 4 seconds
      alien.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      const glitching = t % 4 < 0.12;
      alien.current.position.x = glitching ? Math.sin(t * 90) * 0.015 : 0;
    }

    // breathing
    if (body.current) {
      const breath = 1 + Math.sin(t * 1.8) * 0.015;
      body.current.scale.x = breath;
      body.current.scale.z = breath;
    }

    // the head tilts, like he is thinking
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.6) * 0.08;
      head.current.rotation.x = Math.sin(t * 0.45) * 0.04;
    }

    // blinking, every 4.5 seconds
    const blinkTime = t % 4.5;
    const eyeScale = blinkTime < 0.16 ? 1 - Math.sin((blinkTime / 0.16) * Math.PI) * 0.92 : 1;
    eyes.current.forEach((eye) => {
      if (eye) eye.scale.y = eyeScale;
    });

    // the left arm sways, and the right arm lifts forward now and then, like a gesture
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 0.9) * 0.04;
    }
    if (rightArm.current) {
      const lift = Math.max(0, Math.sin(t * 0.5));
      rightArm.current.rotation.x = -lift * 0.9 + Math.sin(t * 0.9 + 1) * 0.03;
    }
  });

  return (
    <group ref={alien} scale={1.1}>
      <group ref={body}>
        <Body />
      </group>

      {/* the head turns around the neck */}
      <group ref={head} position={[0, 0.7, 0]}>
        <group position={[0, -0.7, 0]}>
          <Head eyeRefs={eyes} />
        </group>
      </group>

      <Leg side={-1} />
      <Leg side={1} />

      <Arm side={-1} groupRef={leftArm} />
      <Arm side={1} groupRef={rightArm} />

      <DataSparks height={1.3} radius={0.45} />
      <ScanRing height={1.2} radius={0.5} />
    </group>
  );
}
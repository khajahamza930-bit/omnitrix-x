import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { sec, BodyPart, Plate, OmnitrixSymbol } from "./parts";
import { holoCore, holoDarkRock, holoBright, holoCrystal } from "../hologram/hologramMaterials";

// Diamondhead. The feet are at y = 0 and he faces the +z direction.
// A slim suit (one half dark, one half light) with huge crystal arms,
// a crystal head and two big crystal spikes on his back.

const LEG_X = 0.1;

// body rows: [height, half width, half depth]
const TORSO_ROWS = [
  [0.95, 0.15, 0.1],
  [1.1, 0.13, 0.09],
  [1.35, 0.19, 0.12],
  [1.55, 0.21, 0.12],
  [1.62, 0.09, 0.07],
];

// one half of the body. side -1 is the dark half, side 1 is the light half
function makeTorsoHalf(s) {
  return TORSO_ROWS.map(([y, rx, rz]) => sec(s * rx * 0.45, y, 0, rx * 0.55, rz));
}

const NECK = [sec(0, 1.58, 0, 0.07, 0.07), sec(0, 1.72, 0, 0.065, 0.065)];

// long thin legs
function makeLeg(s) {
  const x = s * LEG_X;
  return [
    sec(x, 0.06, 0.03, 0.05, 0.06),
    sec(x, 0.28, 0.0, 0.058, 0.065),
    sec(x, 0.5, 0.0, 0.07, 0.075),
    sec(x, 0.72, 0.0, 0.09, 0.09),
    sec(x, 0.96, 0.0, 0.11, 0.1),
  ];
}

// made once, so React does not rebuild them
const TORSO = { "-1": makeTorsoHalf(-1), "1": makeTorsoHalf(1) };
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };

// ---------- small crystal parts ----------

// a flat-sided crystal box
function Block({ position, size, rotation = [0, 0, 0], material = holoCrystal }) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <boxGeometry args={size} />
    </mesh>
  );
}

// a pointed crystal (a long diamond shape)
function Shard({ position, scale, rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} material={holoCrystal}>
      <octahedronGeometry args={[1, 0]} />
    </mesh>
  );
}

// ---------- body parts ----------

function Body() {
  return (
    <group>
      {/* left half dark, right half light, like the reference */}
      <BodyPart sections={TORSO["-1"]} segments={10} material={holoDarkRock} />
      <BodyPart sections={TORSO["1"]} segments={10} material={holoCore} />
      <BodyPart sections={NECK} segments={8} material={holoCore} />

      {/* crystal collar plates at the base of the neck */}
      {[-1, 1].map((s) => (
        <Plate key={s} position={[s * 0.1, 1.62, 0]} scale={[0.09, 0.05, 0.09]} material={holoCrystal} />
      ))}

      {/* Omnitrix symbol on the right side of the chest, with a dark circle behind it */}
      <mesh position={[0.09, 1.36, 0.128]} material={holoDarkRock}>
        <circleGeometry args={[0.065, 16]} />
      </mesh>
      <OmnitrixSymbol position={[0.09, 1.36, 0.135]} size={0.075} />
    </group>
  );
}

function Head() {
  return (
    <group>
      {/* skull and jaw */}
      <Block position={[0, 0.1, 0]} size={[0.23, 0.2, 0.21]} />
      <Block position={[0, -0.04, 0.02]} size={[0.16, 0.11, 0.17]} />

      {/* flat slab on top that slopes up at the front */}
      <Block position={[0, 0.215, 0.05]} size={[0.26, 0.04, 0.32]} rotation={[-0.25, 0, 0]} />

      {[-1, 1].map((s) => (
        <group key={s}>
          {/* narrow slanted eye */}
          <Block
            position={[s * 0.055, 0.105, 0.108]}
            size={[0.06, 0.018, 0.012]}
            rotation={[0, 0, s * 0.35]}
            material={holoBright}
          />

          {/* heavy brow above the eye */}
          <Block
            position={[s * 0.055, 0.14, 0.105]}
            size={[0.085, 0.022, 0.03]}
            rotation={[0, 0, s * 0.35]}
            material={holoDarkRock}
          />

          {/* cheek crystal */}
          <Plate position={[s * 0.12, 0.06, 0.04]} scale={[0.025, 0.05, 0.05]} material={holoCrystal} />
        </group>
      ))}

      {/* mouth line */}
      <Block position={[0, -0.025, 0.105]} size={[0.08, 0.012, 0.01]} material={holoDarkRock} />
    </group>
  );
}

function Leg({ side }) {
  const x = side * LEG_X;
  // left leg dark, right leg light
  const material = side === -1 ? holoDarkRock : holoCore;

  return (
    <group>
      <BodyPart sections={LEGS[side]} segments={8} material={material} />

      {/* foot */}
      <Plate position={[x, 0.04, 0.07]} scale={[0.06, 0.04, 0.13]} material={material} />
    </group>
  );
}

// one huge crystal arm. The group is at the shoulder, and the arm hangs down from it.
function Arm({ side, groupRef }) {
  return (
    <group
      ref={groupRef}
      position={[side * 0.34, 1.5, 0]}
      rotation={[0, 0, side * 0.08]}
      scale={0.75}
    >
      {/* big shoulder block and a smaller one on the outside */}
      <Plate position={[side * 0.04, 0.05, 0]} scale={[0.24, 0.2, 0.22]} rotation={[0, 0, side * -0.3]} material={holoCrystal} />
      <Plate position={[side * 0.12, -0.02, 0]} scale={[0.13, 0.13, 0.18]} material={holoCrystal} />

      {/* upper arm */}
      <Plate position={[side * 0.05, -0.28, 0]} scale={[0.17, 0.3, 0.16]} rotation={[0, 0, side * 0.06]} material={holoCrystal} />

      {/* elbow */}
      <Plate position={[side * 0.06, -0.55, -0.02]} scale={[0.13, 0.1, 0.12]} material={holoCrystal} />

      {/* forearm, heavier towards the hand */}
      <Plate position={[side * 0.07, -0.78, 0.01]} scale={[0.2, 0.3, 0.17]} rotation={[0, 0, side * 0.05]} material={holoCrystal} />
      <Plate position={[side * 0.09, -0.95, 0.02]} scale={[0.22, 0.2, 0.18]} material={holoCrystal} />

      {/* fist */}
      <Plate position={[side * 0.09, -1.12, 0.02]} scale={[0.13, 0.1, 0.11]} material={holoCrystal} />

      {/* two claw fingers */}
      {[-1, 1].map((k) => (
        <Shard
          key={k}
          position={[side * 0.09 + k * 0.05, -1.25, 0.04]}
          scale={[0.03, 0.12, 0.03]}
        />
      ))}

      {/* thumb, pointing down and inwards */}
      <Shard
        position={[-side * 0.03, -1.17, 0.06]}
        scale={[0.03, 0.09, 0.03]}
        rotation={[0, 0, -side * 0.7]}
      />
    </group>
  );
}

// a tall crystal spike on the back. The group is at its base, so it grows from there.
function Spike({ side, groupRef }) {
  return (
    <group
      ref={groupRef}
      position={[side * 0.2, 1.6, -0.1]}
      rotation={[0, 0, -side * 0.3]}
    >
      <Shard position={[0, 0.34, 0]} scale={[0.07, 0.34, 0.06]} />
    </group>
  );
}

// ---------- the complete alien ----------

export default function Diamondhead() {
  const alien = useRef();
  const body = useRef();
  const head = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const leftSpike = useRef();
  const rightSpike = useRef();

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

    // head turns a little
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.7) * 0.1;
    }

    // arms swing a little
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 0.9) * 0.05;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = Math.sin(t * 0.9 + 1) * 0.05;
    }

    // crystal spikes slowly grow and shrink
    if (leftSpike.current) {
      leftSpike.current.scale.y = 1 + Math.sin(t * 1.5) * 0.05;
    }
    if (rightSpike.current) {
      rightSpike.current.scale.y = 1 + Math.sin(t * 1.5 + 1.5) * 0.05;
    }
  });

  return (
    <group ref={alien} scale={0.95}>
      <group ref={body}>
        <Body />
      </group>

      <group ref={head} position={[0, 1.72, 0.01]}>
        <Head />
      </group>

      <Leg side={-1} />
      <Leg side={1} />

      <Arm side={-1} groupRef={leftArm} />
      <Arm side={1} groupRef={rightArm} />

      <Spike side={-1} groupRef={leftSpike} />
      <Spike side={1} groupRef={rightSpike} />
    </group>
  );
}
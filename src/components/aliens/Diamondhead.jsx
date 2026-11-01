import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { sec, BodyPart, Plate, OmnitrixSymbol } from "./parts";
import { holoCore, holoDarkRock, holoBright, holoCrystal } from "../hologram/hologramMaterials";

// Diamondhead, built from the reference picture.
// The feet are at y = 0 and he faces the +z direction. The head crest is at about y = 2.
// Slim suit (left half dark, right half light) + huge crystal arms, head and two back spikes.

// ---------- body shapes ----------

// body rows: [height, half width, half depth]
const TORSO_ROWS = [
  [0.93, 0.2, 0.12],
  [1.15, 0.17, 0.11],
  [1.45, 0.26, 0.14],
  [1.66, 0.28, 0.13],
  [1.74, 0.1, 0.08],
];

// one half of the body. side -1 is the dark half, side 1 is the light half
function makeTorsoHalf(s) {
  return TORSO_ROWS.map(([y, rx, rz]) => sec(s * rx * 0.45, y, 0, rx * 0.55, rz));
}

const NECK = [sec(0, 1.7, 0, 0.09, 0.08), sec(0, 1.76, 0, 0.08, 0.08)];

// long thin legs that spread a little towards the feet
function makeLeg(s) {
  const x = (y) => s * (0.1 + 0.1 * (1 - y / 0.95));
  return [
    sec(x(0.06), 0.06, 0.03, 0.05, 0.06),
    sec(x(0.28), 0.28, 0.0, 0.062, 0.07),
    sec(x(0.5), 0.5, 0.0, 0.075, 0.08),
    sec(x(0.72), 0.72, 0.0, 0.095, 0.095),
    sec(x(0.95), 0.95, 0.0, 0.115, 0.105),
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

      {/* Omnitrix symbol high on the right chest: dark disc, bright ring, hourglass */}
      <mesh position={[0.17, 1.52, 0.135]} material={holoDarkRock}>
        <circleGeometry args={[0.07, 20]} />
      </mesh>
      <mesh position={[0.17, 1.52, 0.138]} material={holoBright}>
        <torusGeometry args={[0.07, 0.008, 8, 24]} />
      </mesh>
      <OmnitrixSymbol position={[0.17, 1.52, 0.142]} size={0.1} />
    </group>
  );
}

// the head is drawn with the chin at y = 0
function Head() {
  return (
    <group>
      {/* narrow jaw and wide skull */}
      <Block position={[0, 0.05, 0.02]} size={[0.17, 0.1, 0.17]} />
      <Block position={[0, 0.17, 0]} size={[0.28, 0.14, 0.24]} />

      {/* flat slab on top that rises towards the front, with a pointed tip */}
      <Block position={[0, 0.265, 0.04]} size={[0.3, 0.04, 0.34]} rotation={[-0.3, 0, 0]} />
      <Shard position={[0, 0.3, 0.2]} scale={[0.05, 0.03, 0.12]} />

      {[-1, 1].map((s) => (
        <group key={s}>
          {/* narrow slanted eye */}
          <Block
            position={[s * 0.07, 0.15, 0.126]}
            size={[0.07, 0.02, 0.012]}
            rotation={[0, 0, s * 0.35]}
            material={holoBright}
          />

          {/* heavy brow above the eye */}
          <Block
            position={[s * 0.07, 0.195, 0.12]}
            size={[0.1, 0.025, 0.04]}
            rotation={[0, 0, s * 0.35]}
            material={holoDarkRock}
          />

          {/* cheek crystal */}
          <Plate position={[s * 0.15, 0.12, 0.03]} scale={[0.03, 0.06, 0.07]} material={holoCrystal} />
        </group>
      ))}

      {/* mouth line */}
      <Block position={[0, 0.045, 0.105]} size={[0.08, 0.012, 0.01]} material={holoDarkRock} />
    </group>
  );
}

function Leg({ side }) {
  // left leg dark, right leg light
  const material = side === -1 ? holoDarkRock : holoCore;
  const ankleX = side * 0.195;

  return (
    <group>
      <BodyPart sections={LEGS[side]} segments={8} material={material} />

      {/* long foot, turned outwards like in the picture */}
      <Plate
        position={[ankleX + side * 0.04, 0.045, 0.08]}
        scale={[0.07, 0.045, 0.16]}
        rotation={[0, side * 0.45, 0]}
        material={material}
      />
    </group>
  );
}

// one huge crystal arm. The group is at the shoulder, and the arm hangs down from it.
function Arm({ side, groupRef }) {
  const s = side;

  return (
    <group ref={groupRef} position={[s * 0.42, 1.5, 0]} rotation={[0, 0, s * 0.05]}>
      {/* big shoulder block with a smaller cap on top */}
      <Plate position={[s * 0.05, 0.0, 0]} scale={[0.19, 0.19, 0.17]} rotation={[0, 0, s * -0.25]} material={holoCrystal} />
      <Plate position={[s * 0.03, 0.17, 0]} scale={[0.14, 0.07, 0.14]} rotation={[0, 0, s * -0.3]} material={holoCrystal} />

      {/* upper arm and elbow */}
      <Plate position={[s * 0.07, -0.2, 0]} scale={[0.15, 0.13, 0.14]} material={holoCrystal} />
      <Plate position={[s * 0.08, -0.33, -0.04]} scale={[0.12, 0.06, 0.11]} material={holoCrystal} />

      {/* forearm: very heavy, widest near the hand */}
      <Plate position={[s * 0.1, -0.58, 0]} scale={[0.19, 0.25, 0.16]} rotation={[0, 0, s * 0.04]} material={holoCrystal} />
      <Plate position={[s * 0.1, -0.72, 0.01]} scale={[0.21, 0.17, 0.17]} material={holoCrystal} />

      {/* hand */}
      <Plate position={[s * 0.1, -0.86, 0.02]} scale={[0.13, 0.08, 0.11]} material={holoCrystal} />

      {/* two long claws pointing down */}
      {[-1, 1].map((k) => (
        <mesh
          key={k}
          position={[s * 0.1 + k * 0.06, -0.97, 0.05]}
          rotation={[Math.PI, 0, s * 0.15]}
          material={holoCrystal}
        >
          <coneGeometry args={[0.04, 0.16, 4]} />
        </mesh>
      ))}

      {/* thumb, pointing down and inwards */}
      <mesh
        position={[s * -0.02, -0.88, 0.09]}
        rotation={[Math.PI, 0, s * 0.5]}
        material={holoCrystal}
      >
        <coneGeometry args={[0.035, 0.13, 4]} />
      </mesh>
    </group>
  );
}

// a tall crystal spike on the back. The group is at its base, so it grows from there.
function Spike({ side, groupRef }) {
  return (
    <group
      ref={groupRef}
      position={[side * 0.2, 1.55, -0.1]}
      rotation={[0, 0, -side * 0.3]}
    >
      <mesh position={[0, 0.275, 0]} scale={[0.09, 0.55, 0.03]} material={holoCrystal}>
        <coneGeometry args={[1, 1, 4]} />
      </mesh>
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
      leftArm.current.rotation.x = Math.sin(t * 0.9) * 0.04;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = Math.sin(t * 0.9 + 1) * 0.04;
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
    <group ref={alien} scale={1.05}>
      <group ref={body}>
        <Body />
      </group>

      <group ref={head} position={[0, 1.71, 0.01]}>
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
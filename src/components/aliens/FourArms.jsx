import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { sec, BodyPart, Plate, Muscle, Stripe, OmnitrixSymbol } from "./parts";
import { holoDarkRock, holoBright } from "../hologram/hologramMaterials";

// Four Arms. The feet are at y = 0 and he faces the +z direction.

const LEG_X = 0.24;

// very broad chest, narrower waist
const TORSO = [
  sec(0, 1.0, 0, 0.3, 0.2),
  sec(0, 1.15, 0, 0.26, 0.19),
  sec(0, 1.35, 0, 0.38, 0.24),
  sec(0, 1.55, 0, 0.55, 0.29),
  sec(0, 1.75, 0, 0.66, 0.3),
  sec(0, 1.88, 0, 0.55, 0.24),
  sec(0, 1.95, 0, 0.22, 0.14),
];

const NECK = [sec(0, 1.9, 0, 0.15, 0.14), sec(0, 2.02, 0.02, 0.14, 0.13)];

// compact head with a wide jaw
const HEAD = [
  sec(0, 1.98, 0.02, 0.1, 0.1),
  sec(0, 2.04, 0.03, 0.17, 0.15),
  sec(0, 2.14, 0.01, 0.16, 0.15),
  sec(0, 2.24, 0, 0.15, 0.14),
  sec(0, 2.3, -0.01, 0.1, 0.1),
];

// thick legs
function makeLeg(s) {
  const x = s * LEG_X;
  return [
    sec(x, 0.1, 0, 0.14, 0.14),
    sec(x, 0.3, -0.02, 0.16, 0.16),
    sec(x, 0.5, 0, 0.14, 0.14),
    sec(x, 0.6, 0.01, 0.15, 0.155),
    sec(x, 0.78, 0, 0.19, 0.18),
    sec(x, 0.95, 0, 0.23, 0.2),
    sec(x, 1.12, 0, 0.24, 0.2),
  ];
}

// one arm, drawn hanging down from its shoulder (the shoulder is at y = 0)
function makeArm(s) {
  const rows = [
    [0.1, -0.95, 0.1, 0.1],
    [0.09, -0.8, 0.14, 0.13],
    [0.06, -0.62, 0.17, 0.155],
    [0.04, -0.45, 0.14, 0.13],
    [0.03, -0.35, 0.15, 0.14],
    [0.02, -0.18, 0.17, 0.16],
    [0.0, 0.0, 0.18, 0.17],
  ];
  return rows.map(([x, y, rx, rz]) => sec(s * x, y, 0, rx, rz));
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// ---------- body parts ----------

function Body() {
  return (
    <group>
      <BodyPart sections={TORSO} segments={10} />
      <BodyPart sections={NECK} segments={8} />

      {/* chest muscles */}
      {[-1, 1].map((s) => (
        <Muscle key={s} position={[s * 0.26, 1.62, 0.2]} scale={[0.27, 0.2, 0.13]} />
      ))}

      {/* stomach muscles */}
      {[1.4, 1.26, 1.12].map((y, i) => (
        <group key={y}>
          <Muscle position={[-0.1, y, 0.2 - i * 0.02]} scale={[0.09, 0.06, 0.07]} />
          <Muscle position={[0.1, y, 0.2 - i * 0.02]} scale={[0.09, 0.06, 0.07]} />
        </group>
      ))}

      {/* neck muscles and back muscles */}
      {[-1, 1].map((s) => (
        <Muscle key={s} position={[s * 0.3, 1.9, -0.02]} scale={[0.22, 0.13, 0.16]} />
      ))}
      <Muscle position={[0, 1.6, -0.22]} scale={[0.45, 0.3, 0.1]} />

      {/* belt */}
      <Plate position={[0, 1.02, 0.17]} scale={[0.16, 0.08, 0.05]} material={holoDarkRock} />

      {/* Omnitrix symbol in the middle of the chest */}
      <OmnitrixSymbol position={[0, 1.5, 0.3]} size={0.11} />

      {/* glowing chest markings */}
      {[-1, 1].map((s) => (
        <Stripe key={s} position={[s * 0.2, 1.56, 0.31]} rotation={[0, 0, s * 0.5]} size={[0.2, 0.018, 0.012]} />
      ))}
      {[-1, 1].map((s) => (
        <Stripe key={s} position={[s * 0.2, 1.46, 0.3]} rotation={[0, 0, s * 0.5]} size={[0.16, 0.018, 0.012]} />
      ))}
    </group>
  );
}

function Head() {
  return (
    <group>
      <BodyPart sections={HEAD} segments={8} />

      {[-1, 1].map((s) => (
        <group key={s}>
          {/* dark eye socket */}
          <Plate
            position={[s * 0.07, 2.19, 0.13]}
            scale={[0.055, 0.032, 0.03]}
            rotation={[0, 0, s * 0.3]}
            material={holoDarkRock}
          />

          {/* bright eye */}
          <mesh
            position={[s * 0.07, 2.19, 0.145]}
            rotation={[0, 0, s * 0.3]}
            scale={[0.04, 0.016, 0.02]}
            material={holoBright}
          >
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>

          {/* heavy brow */}
          <Plate
            position={[s * 0.075, 2.25, 0.13]}
            scale={[0.085, 0.025, 0.05]}
            rotation={[0, 0, s * 0.3]}
            material={holoDarkRock}
          />

          {/* cheek bone */}
          <Plate position={[s * 0.14, 2.08, 0.08]} scale={[0.04, 0.06, 0.05]} material={holoDarkRock} />

          {/* small tusk */}
          <Plate position={[s * 0.07, 2.1, 0.175]} scale={[0.015, 0.045, 0.015]} material={holoBright} />
        </group>
      ))}

      {/* mouth */}
      <mesh position={[0, 2.06, 0.175]} material={holoDarkRock}>
        <boxGeometry args={[0.14, 0.035, 0.02]} />
      </mesh>

      {/* chin */}
      <Plate position={[0, 2.0, 0.1]} scale={[0.07, 0.04, 0.05]} material={holoDarkRock} />

      {/* short hair crest on top of the head */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Plate
          key={i}
          position={[0, 2.31 - i * 0.012, 0.06 - i * 0.04]}
          scale={[0.025, 0.05, 0.035]}
          material={holoDarkRock}
        />
      ))}
    </group>
  );
}

function Leg({ side }) {
  const x = side * LEG_X;

  return (
    <group>
      <BodyPart sections={LEGS[side]} segments={8} />

      {/* thigh and calf muscles */}
      <Muscle position={[x, 0.88, 0.13]} scale={[0.2, 0.28, 0.14]} />
      <Muscle position={[x, 0.4, -0.08]} scale={[0.14, 0.2, 0.13]} />

      {/* knee plate */}
      <Plate position={[x, 0.58, 0.15]} scale={[0.1, 0.09, 0.07]} material={holoDarkRock} />

      {/* foot and toes */}
      <Plate position={[x, 0.07, 0.12]} scale={[0.17, 0.07, 0.26]} material={holoDarkRock} />
      {[-1, 0, 1].map((k) => (
        <Plate key={k} position={[x + k * 0.06, 0.05, 0.34]} scale={[0.035, 0.035, 0.05]} />
      ))}
    </group>
  );
}

// one arm with its muscles, wrist band and knuckles
function Arm({ side, size, armor, groupRef, position }) {
  return (
    <group ref={groupRef} position={position} scale={size}>
      <BodyPart sections={ARMS[side]} segments={8} />

      {/* shoulder, upper arm and forearm muscles */}
      <Muscle position={[0, -0.02, 0]} scale={[0.26, 0.22, 0.23]} />
      <Muscle position={[side * 0.02, -0.22, 0.07]} scale={[0.15, 0.2, 0.14]} />
      <Muscle position={[side * 0.05, -0.56, 0.04]} scale={[0.18, 0.26, 0.16]} />

      {/* shoulder armor, only on the big upper arms */}
      {armor && <Plate position={[side * 0.05, 0.1, 0]} scale={[0.2, 0.1, 0.18]} />}

      {/* wrist band */}
      <mesh position={[side * 0.08, -0.74, 0]} material={holoDarkRock}>
        <cylinderGeometry args={[0.15, 0.15, 0.07, 10]} />
      </mesh>

      {/* knuckles */}
      {[-1, 0, 1].map((k) => (
        <Plate
          key={k}
          position={[side * 0.09 + k * 0.05, -0.93, 0.1]}
          scale={[0.035, 0.04, 0.04]}
          material={holoDarkRock}
        />
      ))}

      {/* glowing forearm markings */}
      <Stripe position={[side * 0.05, -0.5, 0.155]} size={[0.16, 0.015, 0.01]} />
      <Stripe position={[side * 0.05, -0.42, 0.15]} size={[0.14, 0.015, 0.01]} />
    </group>
  );
}

// ---------- the complete alien ----------

export default function FourArms() {
  const alien = useRef();
  const body = useRef();
  const head = useRef();
  const leftUpper = useRef();
  const rightUpper = useRef();
  const leftLower = useRef();
  const rightLower = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // slow sway
    if (alien.current) {
      alien.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }

    // breathing
    if (body.current) {
      const breath = 1 + Math.sin(t * 1.8) * 0.015;
      body.current.scale.x = breath;
      body.current.scale.z = breath;
    }

    // head turns a little
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.8) * 0.08;
    }

    // upper arms flex outward and back
    if (leftUpper.current) {
      leftUpper.current.rotation.z = -(0.12 + Math.sin(t * 1.3) * 0.06);
    }
    if (rightUpper.current) {
      rightUpper.current.rotation.z = 0.12 + Math.sin(t * 1.3 + 0.5) * 0.06;
    }

    // lower arms punch forward, one after the other
    const punchLeft = Math.max(0, Math.sin(t * 1.6));
    const punchRight = Math.max(0, Math.sin(t * 1.6 + Math.PI));
    if (leftLower.current) {
      leftLower.current.rotation.x = -(0.15 + punchLeft * 0.9);
    }
    if (rightLower.current) {
      rightLower.current.rotation.x = -(0.15 + punchRight * 0.9);
    }
  });

  return (
    <group ref={alien} scale={0.72}>
      <group ref={body}>
        <Body />
      </group>

      <group ref={head}>
        <Head />
      </group>

      <Leg side={-1} />
      <Leg side={1} />

      {/* upper pair of arms */}
      <Arm side={-1} size={1} armor={true} groupRef={leftUpper} position={[-0.78, 1.78, -0.03]} />
      <Arm side={1} size={1} armor={true} groupRef={rightUpper} position={[0.78, 1.78, -0.03]} />

      {/* lower pair of arms, a bit smaller */}
      <Arm side={-1} size={0.85} armor={false} groupRef={leftLower} position={[-0.58, 1.45, 0.12]} />
      <Arm side={1} size={0.85} armor={false} groupRef={rightLower} position={[0.58, 1.45, 0.12]} />
    </group>
  );
}
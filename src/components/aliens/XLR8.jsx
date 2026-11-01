import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";

import { sec, BodyPart, Plate, Muscle, Stripe, OmnitrixSymbol } from "./parts";
import { holoCore, holoRock, holoDarkRock, holoBright } from "../hologram/hologramMaterials";

// XLR8. The feet are at y = 0 and he faces the +z direction.
// He leans forward like he is running, and he has a long tail.

const HIP_HEIGHT = 0.86;
const LEG_X = 0.12;
const LEAN = 0.35; // how far the upper body leans forward

// ---------- body shapes ----------
// The upper body is drawn with the hip at y = 0, then it is leaned forward.

// narrow, streamlined body
const TORSO = [
  sec(0, 0.0, 0, 0.15, 0.11),
  sec(0, 0.12, 0, 0.13, 0.1),
  sec(0, 0.3, 0, 0.17, 0.12),
  sec(0, 0.5, 0, 0.22, 0.14),
  sec(0, 0.62, 0, 0.23, 0.13),
  sec(0, 0.72, 0, 0.12, 0.09),
];

const NECK = [sec(0, 0.68, 0, 0.07, 0.07), sec(0, 0.8, 0.03, 0.065, 0.07)];

// long helmet head that sweeps back to a point
const HEAD = [
  sec(0, 0.78, 0.03, 0.07, 0.08),
  sec(0, 0.86, 0.04, 0.11, 0.12),
  sec(0, 0.95, 0.03, 0.12, 0.14),
  sec(0, 1.04, 0.0, 0.11, 0.15),
  sec(0, 1.12, -0.07, 0.09, 0.14),
  sec(0, 1.18, -0.16, 0.06, 0.12),
  sec(0, 1.2, -0.24, 0.035, 0.07),
];

// legs bend backwards at the knee, like a runner. Drawn in world position.
function makeLeg(s) {
  const x = s * LEG_X;
  return [
    sec(x, 0.18, -0.06, 0.05, 0.055),
    sec(x, 0.3, -0.02, 0.055, 0.06),
    sec(x, 0.42, 0.08, 0.06, 0.07),
    sec(x, 0.52, 0.17, 0.075, 0.08),
    sec(x, 0.62, 0.15, 0.09, 0.09),
    sec(x, 0.74, 0.08, 0.1, 0.1),
    sec(x, 0.86, 0.0, 0.1, 0.1),
  ];
}

// thin arm, drawn hanging down from the shoulder (the shoulder is at y = 0)
function makeArm(s) {
  const rows = [
    [0.02, -0.55, 0.04, 0.04],
    [0.02, -0.42, 0.06, 0.06],
    [0.01, -0.3, 0.05, 0.05],
    [0.0, -0.15, 0.065, 0.065],
    [0.0, 0.0, 0.07, 0.07],
  ];
  return rows.map(([x, y, rx, rz]) => sec(s * x, y, 0, rx, rz));
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// streaks of light behind him
const TRAILS = [
  { x: -0.25, y: 0.5, offset: 0.0 },
  { x: 0.2, y: 0.75, offset: 0.3 },
  { x: 0.0, y: 1.0, offset: 0.6 },
  { x: -0.15, y: 1.25, offset: 0.15 },
  { x: 0.28, y: 0.35, offset: 0.8 },
];

// ---------- body parts ----------

function UpperBody() {
  return (
    <group>
      <BodyPart sections={TORSO} segments={10} />
      <BodyPart sections={NECK} segments={8} />

      {/* chest armor */}
      {[-1, 1].map((s) => (
        <Plate
          key={s}
          position={[s * 0.14, 0.52, 0.12]}
          scale={[0.09, 0.07, 0.04]}
          rotation={[0, 0, s * -0.3]}
        />
      ))}

      {/* stomach armor */}
      {[0.36, 0.26, 0.16].map((y) => (
        <Plate key={y} position={[0, y, 0.1]} scale={[0.07, 0.03, 0.03]} material={holoDarkRock} />
      ))}

      {/* shoulder pads */}
      {[-1, 1].map((s) => (
        <Plate
          key={s}
          position={[s * 0.25, 0.65, 0]}
          scale={[0.08, 0.05, 0.09]}
          rotation={[0, 0, s * 0.4]}
        />
      ))}

      {/* hip armor */}
      {[-1, 1].map((s) => (
        <Plate key={s} position={[s * 0.15, 0.03, 0]} scale={[0.06, 0.08, 0.09]} material={holoDarkRock} />
      ))}

      {/* fins along the back */}
      {[0.2, 0.34, 0.48, 0.62].map((y) => (
        <Plate key={y} position={[0, y, -0.12]} scale={[0.018, 0.06, 0.05]} material={holoDarkRock} />
      ))}

      {/* glowing chest markings */}
      {[-1, 1].map((s) => (
        <Stripe key={s} position={[s * 0.15, 0.6, 0.125]} rotation={[0, 0, s * -0.3]} size={[0.12, 0.01, 0.01]} />
      ))}

      {/* Omnitrix symbol on the chest */}
      <OmnitrixSymbol position={[0, 0.46, 0.15]} size={0.07} />
    </group>
  );
}

function Head() {
  return (
    <group>
      <BodyPart sections={HEAD} segments={8} />

      {/* visor: a dark band with a bright slit */}
      <Plate position={[0, 0.94, 0.155]} scale={[0.12, 0.04, 0.03]} material={holoDarkRock} />
      <mesh position={[0, 0.94, 0.19]} material={holoBright}>
        <boxGeometry args={[0.15, 0.014, 0.01]} />
      </mesh>

      {/* side fins of the helmet */}
      {[-1, 1].map((s) => (
        <Plate key={s} position={[s * 0.12, 0.98, 0.0]} scale={[0.025, 0.05, 0.07]} material={holoDarkRock} />
      ))}

      {/* jaw */}
      <Plate position={[0, 0.82, 0.08]} scale={[0.05, 0.03, 0.05]} material={holoDarkRock} />

      {/* fin on the back of the helmet */}
      <Plate position={[0, 1.15, -0.12]} scale={[0.02, 0.05, 0.12]} material={holoDarkRock} />
    </group>
  );
}

function Arm({ side, groupRef }) {
  return (
    <group ref={groupRef} position={[side * 0.26, 0.64, 0]}>
      <BodyPart sections={ARMS[side]} segments={8} />

      <Muscle position={[0, -0.1, 0.02]} scale={[0.06, 0.1, 0.06]} />

      {/* forearm armor */}
      <Plate position={[0, -0.4, 0.05]} scale={[0.045, 0.1, 0.035]} material={holoDarkRock} />

      {/* hand and three claws */}
      <Plate position={[0, -0.58, 0.01]} scale={[0.045, 0.045, 0.04]} material={holoDarkRock} />
      {[-1, 0, 1].map((k) => (
        <Plate key={k} position={[k * 0.03, -0.65, 0.02]} scale={[0.01, 0.045, 0.01]} material={holoBright} />
      ))}
    </group>
  );
}

function Leg({ side, groupRef }) {
  const x = side * LEG_X;
  const wheel = useRef();

  // the wheel spins fast
  useFrame((state) => {
    if (wheel.current) {
      wheel.current.rotation.y = -state.clock.elapsedTime * 18;
    }
  });

  return (
    <group ref={groupRef}>
      <BodyPart sections={LEGS[side]} segments={8} />

      {/* thigh muscle */}
      <Muscle position={[x, 0.72, 0.07]} scale={[0.1, 0.16, 0.1]} />

      {/* knee plate */}
      <Plate position={[x, 0.53, 0.22]} scale={[0.05, 0.06, 0.05]} material={holoDarkRock} />

      {/* shin armor */}
      <Plate position={[x, 0.36, 0.0]} scale={[0.04, 0.12, 0.04]} rotation={[-0.4, 0, 0]} />

      {/* ankle spike */}
      <Plate position={[x, 0.22, -0.12]} scale={[0.02, 0.05, 0.05]} material={holoDarkRock} />

      {/* foot */}
      <Plate position={[x, 0.09, 0.08]} scale={[0.05, 0.04, 0.12]} material={holoDarkRock} />

      {/* wheel under the foot, turned so its axle points sideways */}
      <group position={[x, 0.08, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <group ref={wheel}>
          <mesh material={holoRock}>
            <cylinderGeometry args={[0.08, 0.08, 0.07, 14]} />
          </mesh>
          {/* a bright bar, so you can see the wheel spin */}
          <mesh material={holoBright}>
            <boxGeometry args={[0.1, 0.075, 0.012]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// one piece of the tail. Each piece holds the next piece, so the tail bends like a whip.
function TailSegment({ index, count }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 3 - index * 0.6) * 0.18;
    }
  });

  // the last piece has nothing after it
  if (index >= count) return null;

  // thinner towards the tip
  const size = 0.08 * (1 - index / (count + 1));

  return (
    <group ref={ref}>
      <mesh position={[0, 0, -0.07]} scale={[size, size * 0.9, 0.09]} material={holoCore}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      <group position={[0, 0, -0.14]}>
        <TailSegment index={index + 1} count={count} />
      </group>
    </group>
  );
}

// thin streaks of light that drift back and fade
function SpeedTrails() {
  const streaks = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    streaks.current.forEach((streak, i) => {
      if (!streak) return;
      const progress = (t * 1.2 + TRAILS[i].offset) % 1;
      streak.position.z = -0.5 - progress * 1.0;
      streak.material.opacity = 0.6 * (1 - progress);
    });
  });

  return (
    <group>
      {TRAILS.map((trail, i) => (
        <mesh
          key={i}
          ref={(el) => (streaks.current[i] = el)}
          position={[trail.x, trail.y, -0.5]}
        >
          <boxGeometry args={[0.012, 0.012, 0.5]} />
          <meshBasicMaterial
            color="#9dffb4"
            transparent
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- the complete alien ----------

export default function XLR8() {
  const alien = useRef();
  const upper = useRef();
  const head = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const run = t * 9; // how fast the legs and arms move

    // slow turn, and a small bounce while running
    if (alien.current) {
      alien.current.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.1;
      alien.current.position.y = Math.abs(Math.sin(run)) * 0.02;
    }

    // upper body leans and bobs
    if (upper.current) {
      upper.current.rotation.x = LEAN + Math.sin(run * 2) * 0.02;
    }

    // head stays level
    if (head.current) {
      head.current.rotation.x = -0.25;
    }

    // legs run: one forward, one back
    if (leftLeg.current) {
      leftLeg.current.position.z = Math.sin(run) * 0.1;
      leftLeg.current.position.y = Math.max(0, Math.cos(run)) * 0.04;
    }
    if (rightLeg.current) {
      rightLeg.current.position.z = Math.sin(run + Math.PI) * 0.1;
      rightLeg.current.position.y = Math.max(0, Math.cos(run + Math.PI)) * 0.04;
    }

    // arms swing the opposite way to the legs
    if (leftArm.current) {
      leftArm.current.rotation.x = -LEAN + Math.sin(run) * 0.8;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = -LEAN - Math.sin(run) * 0.8;
    }
  });

  return (
    <group ref={alien} scale={0.85} position={[0, 0, -0.12]}>
      {/* upper body, leaned forward */}
      <group ref={upper} position={[0, HIP_HEIGHT, 0]} rotation={[LEAN, 0, 0]}>
        <UpperBody />

        <group ref={head} position={[0, 0.75, 0]}>
          <group position={[0, -0.75, 0]}>
            <Head />
          </group>
        </group>

        <Arm side={-1} groupRef={leftArm} />
        <Arm side={1} groupRef={rightArm} />
      </group>

      <Leg side={-1} groupRef={leftLeg} />
      <Leg side={1} groupRef={rightLeg} />

      {/* long tail */}
      <group position={[0, 0.92, -0.1]} rotation={[0.25, 0, 0]}>
        <TailSegment index={0} count={8} />
      </group>

      <SpeedTrails />
    </group>
  );
}
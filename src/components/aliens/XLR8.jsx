import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";

import { sec, BodyPart, Plate, Muscle, OmnitrixSymbol } from "./parts";
import { holoCore, holoRock, holoDarkRock, holoBright } from "../hologram/hologramMaterials";

// XLR8. The feet are at y = 0 and he faces the +z direction.
// He runs in a low crouch, with a long striped tail.

const HIP_Y = 0.58; // height of the hips
const LEG_X = 0.1; // how far each leg is from the middle
const LEAN = 0.85; // the upper body leans forward this much (in radians)
const HEAD_PITCH = 0.1; // the head tilts down a little
const TAIL_PIECES = 9; // how many pieces the tail has

// ---------- body shapes (rings from bottom to top) ----------

// narrow body. The hip is at y = 0 and the shoulders are near y = 0.55
const TORSO = [
  sec(0, 0.0, 0, 0.11, 0.09),
  sec(0, 0.1, 0, 0.09, 0.08),
  sec(0, 0.25, 0, 0.12, 0.1),
  sec(0, 0.42, 0, 0.17, 0.12),
  sec(0, 0.54, 0, 0.18, 0.11),
  sec(0, 0.62, 0, 0.1, 0.08),
];

const NECK = [sec(0, 0.6, 0, 0.05, 0.05), sec(0, 0.72, 0.03, 0.045, 0.05)];

// sleek head. The chin is at y = 0 and the top slopes back
const HEAD = [
  sec(0, 0.0, 0.05, 0.035, 0.05),
  sec(0, 0.05, 0.06, 0.06, 0.09),
  sec(0, 0.12, 0.03, 0.075, 0.13),
  sec(0, 0.2, 0.0, 0.07, 0.14),
  sec(0, 0.27, -0.05, 0.05, 0.12),
  sec(0, 0.32, -0.12, 0.03, 0.08),
];

// thin leg. The knee points forward and the ankle is behind it
function makeLeg(s) {
  const x = s * LEG_X;
  return [
    sec(x, 0.1, 0.0, 0.03, 0.035),
    sec(x, 0.18, 0.04, 0.035, 0.04),
    sec(x, 0.26, 0.12, 0.04, 0.045),
    sec(x, 0.34, 0.18, 0.05, 0.055),
    sec(x, 0.42, 0.14, 0.06, 0.07),
    sec(x, 0.5, 0.06, 0.07, 0.085),
    sec(x, 0.58, -0.04, 0.075, 0.09),
  ];
}

// thin arm, drawn hanging down from the shoulder (the shoulder is at y = 0)
function makeArm(s) {
  const rows = [
    [0.0, -0.55, 0.03, 0.03],
    [0.0, -0.42, 0.045, 0.045],
    [0.0, -0.3, 0.035, 0.035],
    [0.0, -0.15, 0.05, 0.05],
    [0.0, 0.0, 0.055, 0.055],
  ];
  return rows.map(([x, y, rx, rz]) => sec(s * x, y, 0, rx, rz));
}

// makes every ring a bit wider, so the part gets thicker
function thicker(sections, amount) {
  return sections.map((s) => sec(s.x, s.y, s.z, s.rx * amount, s.rz * amount));
}

// made once, so React does not rebuild them
const LEGS = { "-1": thicker(makeLeg(-1), 1.25), "1": thicker(makeLeg(1), 1.25) };
const ARMS = { "-1": thicker(makeArm(-1), 1.25), "1": thicker(makeArm(1), 1.25) };

// streaks of light behind him
const TRAILS = [
  { x: -0.25, y: 0.3, offset: 0.0 },
  { x: 0.2, y: 0.55, offset: 0.3 },
  { x: 0.0, y: 0.8, offset: 0.6 },
  { x: -0.15, y: 1.0, offset: 0.15 },
  { x: 0.28, y: 0.2, offset: 0.8 },
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
          position={[s * 0.12, 0.46, 0.09]}
          scale={[0.08, 0.07, 0.04]}
          rotation={[0, 0, s * -0.3]}
        />
      ))}

      {/* stomach armor */}
      {[0.34, 0.24, 0.14].map((y) => (
        <Plate key={y} position={[0, y, 0.085]} scale={[0.06, 0.025, 0.03]} material={holoDarkRock} />
      ))}

      {/* hip armor */}
      {[-1, 1].map((s) => (
        <Plate key={s} position={[s * 0.11, 0.03, 0]} scale={[0.05, 0.07, 0.08]} material={holoDarkRock} />
      ))}

      {/* small fins along the back */}
      {[0.15, 0.28, 0.4, 0.52].map((y) => (
        <Plate key={y} position={[0, y, -0.11]} scale={[0.015, 0.055, 0.045]} material={holoDarkRock} />
      ))}

      {/* two blades on the shoulder blades, pointing straight back.
          The group turns the opposite way to the lean, so the blades point back in the world. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.14, 0.52, -0.06]} rotation={[-LEAN, 0, 0]}>
          <mesh
            position={[0, 0.04, -0.196]}
            rotation={[-1.37, 0, 0]}
            scale={[0.03, 0.4, 0.09]}
            material={holoRock}
          >
            <coneGeometry args={[1, 1, 5]} />
          </mesh>
        </group>
      ))}

      {/* Omnitrix symbol on the chest */}
      <OmnitrixSymbol position={[0, 0.36, 0.125]} size={0.07} />
    </group>
  );
}

function Head() {
  return (
    <group>
      <BodyPart sections={HEAD} segments={8} />

      {[-1, 1].map((s) => (
        <group key={s}>
          {/* slanted bright eye */}
          <mesh
            position={[s * 0.045, 0.13, 0.14]}
            rotation={[0, 0, s * 0.5]}
            scale={[0.03, 0.012, 0.015]}
            material={holoBright}
          >
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>

          {/* brow above the eye */}
          <Plate
            position={[s * 0.045, 0.16, 0.12]}
            scale={[0.05, 0.012, 0.03]}
            rotation={[0, 0, s * 0.5]}
            material={holoDarkRock}
          />

          {/* cheek */}
          <Plate position={[s * 0.07, 0.1, 0.07]} scale={[0.02, 0.04, 0.04]} material={holoDarkRock} />

          {/* fin on the side of the head */}
          <Plate position={[s * 0.075, 0.2, -0.02]} scale={[0.012, 0.05, 0.08]} material={holoDarkRock} />
        </group>
      ))}

      {/* small mouth line */}
      <mesh position={[0, 0.045, 0.15]} material={holoBright}>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
      </mesh>

      {/* the long blade that sweeps back and up from the head */}
      <mesh
        position={[0, 0.366, -0.228]}
        rotation={[-0.93, 0, 0]}
        scale={[0.035, 0.42, 0.1]}
        material={holoRock}
      >
        <coneGeometry args={[1, 1, 6]} />
      </mesh>
    </group>
  );
}

function Arm({ side, groupRef }) {
  return (
    <group ref={groupRef} position={[side * 0.2, 0.5, 0]} rotation={[-LEAN - 0.45, 0, 0]}>
      <BodyPart sections={ARMS[side]} segments={8} />

      <Muscle position={[0, -0.12, 0.02]} scale={[0.055, 0.1, 0.055]} />

      {/* forearm armor */}
      <Plate position={[0, -0.4, 0.04]} scale={[0.04, 0.1, 0.03]} material={holoDarkRock} />

      {/* blade on the back of the elbow */}
      <mesh
        position={[0, -0.28, -0.107]}
        rotation={[-1.3, 0, 0]}
        scale={[0.02, 0.14, 0.03]}
        material={holoRock}
      >
        <coneGeometry args={[1, 1, 5]} />
      </mesh>

      {/* hand */}
      <Plate position={[0, -0.58, 0.0]} scale={[0.04, 0.04, 0.035]} material={holoDarkRock} />

      {/* three sharp claws */}
      {[-1, 0, 1].map((k) => (
        <mesh
          key={k}
          position={[k * 0.025, -0.66, 0.015]}
          rotation={[Math.PI, 0, 0]}
          material={holoBright}
        >
          <coneGeometry args={[0.01, 0.1, 5]} />
        </mesh>
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
    // the outer group sits at the hip, so the whole leg swings from the hip
    <group ref={groupRef} position={[0, HIP_Y, -0.04]}>
      <group position={[0, -HIP_Y, 0.04]}>
        <BodyPart sections={LEGS[side]} segments={8} />

        {/* thigh muscle */}
        <Muscle position={[x, 0.5, 0.05]} scale={[0.07, 0.12, 0.08]} />

        {/* knee plate */}
        <Plate position={[x, 0.34, 0.23]} scale={[0.04, 0.05, 0.04]} material={holoDarkRock} />

        {/* spike on the back of the lower leg */}
        <Plate position={[x, 0.22, -0.04]} scale={[0.015, 0.05, 0.04]} material={holoDarkRock} />

        {/* foot */}
        <Plate position={[x, 0.07, 0.06]} scale={[0.04, 0.03, 0.09]} material={holoDarkRock} />

        {/* two toe claws pointing forward */}
        {[-1, 1].map((k) => (
          <mesh
            key={k}
            position={[x + k * 0.02, 0.06, 0.24]}
            rotation={[Math.PI / 2, 0, 0]}
            material={holoBright}
          >
            <coneGeometry args={[0.012, 0.08, 5]} />
          </mesh>
        ))}

        {/* wheel, turned so its axle points sideways */}
        <group position={[x, 0.06, 0.13]} rotation={[0, 0, Math.PI / 2]}>
          <group ref={wheel}>
            <mesh material={holoRock}>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 14]} />
            </mesh>
            {/* a bright bar, so you can see the wheel spin */}
            <mesh material={holoBright}>
              <boxGeometry args={[0.11, 0.055, 0.012]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

// one piece of the tail. Each piece holds the next piece, so the tail bends like a whip.
function TailSegment({ index }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    // the tail drops first, then every piece curls up a little
    const wave = Math.sin(state.clock.elapsedTime * 3 - index * 0.5) * 0.12;
    const curl = index === 0 ? -0.35 : 0.075;
    ref.current.rotation.set(curl, wave, 0);
  });

  // the piece after the last one is empty
  if (index >= TAIL_PIECES) return null;

  // thinner towards the tip
  const size = 0.085 * Math.pow(1 - index / TAIL_PIECES, 0.8) + 0.008;

  // stripes: one piece glowing, the next one dark
  const material = index % 2 === 0 ? holoCore : holoRock;
  const isLast = index === TAIL_PIECES - 1;

  return (
    <group ref={ref}>
      <mesh position={[0, 0, -0.05]} scale={[size, size * 0.9, 0.09]} material={material}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>

      {/* sharp tip on the last piece */}
      {isLast && (
        <mesh position={[0, 0, -0.15]} rotation={[-Math.PI / 2, 0, 0]} material={holoBright}>
          <coneGeometry args={[0.02, 0.2, 6]} />
        </mesh>
      )}

      <group position={[0, 0, -0.1]}>
        <TailSegment index={index + 1} />
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
      streak.position.z = -0.9 - progress * 0.9;
      streak.material.opacity = 0.6 * (1 - progress);
    });
  });

  return (
    <group>
      {TRAILS.map((trail, i) => (
        <mesh
          key={i}
          ref={(el) => (streaks.current[i] = el)}
          position={[trail.x, trail.y, -0.9]}
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
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const run = t * 8; // how fast the legs and arms move

    // turned sideways so you see his side, and a small bounce while running
    if (alien.current) {
      alien.current.rotation.y = 0.9 + Math.sin(t * 0.5) * 0.12;
      alien.current.position.y = Math.abs(Math.sin(run)) * 0.015;
    }

    // upper body stays leaned and bobs a little
    if (upper.current) {
      upper.current.rotation.x = LEAN + Math.sin(run * 2) * 0.02;
    }

    // legs swing from the hip, one forward and one back
    if (leftLeg.current) {
      leftLeg.current.rotation.x = Math.sin(run) * 0.5;
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = Math.sin(run + Math.PI) * 0.5;
    }

    // arms swing the opposite way to the leg on the same side
    if (leftArm.current) {
      leftArm.current.rotation.x = -LEAN - 0.45 - Math.sin(run) * 0.7;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = -LEAN - 0.45 + Math.sin(run) * 0.7;
    }
  });

  return (
    <group ref={alien}>
      <group position={[0, 0, 0.2]} scale={1.3}>
        {/* upper body, leaned forward from the hip */}
        <group ref={upper} position={[0, HIP_Y, 0]} rotation={[LEAN, 0, 0]}>
          <UpperBody />

          {/* head, turned against the lean so it looks forward */}
          <group position={[0, 0.7, 0.04]} rotation={[-(LEAN - HEAD_PITCH), 0, 0]}>
            <Head />
          </group>

          <Arm side={-1} groupRef={leftArm} />
          <Arm side={1} groupRef={rightArm} />
        </group>

        <Leg side={-1} groupRef={leftLeg} />
        <Leg side={1} groupRef={rightLeg} />

        {/* long striped tail */}
        <group position={[0, 0.56, -0.1]}>
          <TailSegment index={0} />
        </group>

        <SpeedTrails />
      </group>
    </group>
  );
}
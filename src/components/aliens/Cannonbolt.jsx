import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { sec, BodyPart, OmnitrixSymbol } from "./parts";
import { holoRock, holoDarkRock, holoBright, holoSoft, holoGold } from "../hologram/hologramMaterials";
import { sectionAt, surfaceLine, makeLinesGeometry } from "../../utils/circuitLines";
import { createLoft } from "../../utils/bodyShapes";

// Cannonbolt, built from the reference sheet.
// The feet are at y = 0 and he faces the +z direction. He is about 1.8 tall.
// An upright body with a clear round head, big gold plates, and an egg-shaped shell on his back.
// Every 14 seconds he curls up and rolls on his shell like a ball.

// ---------- body shapes (rings from bottom to top) ----------

// the wide barrel body, from the hips up to the shoulders
const TORSO = [
  sec(0, 0.66, 0, 0.34, 0.26),
  sec(0, 0.8, 0, 0.4, 0.3),
  sec(0, 0.98, 0, 0.44, 0.32),
  sec(0, 1.15, 0, 0.46, 0.32),
  sec(0, 1.3, 0, 0.44, 0.29),
  sec(0, 1.4, 0, 0.3, 0.22),
  sec(0, 1.47, 0, 0.14, 0.12),
];

// short, thick legs
function makeLeg(s) {
  return [
    sec(s * 0.2, 0.06, 0.05, 0.14, 0.19),
    sec(s * 0.2, 0.2, 0, 0.14, 0.16),
    sec(s * 0.2, 0.36, 0, 0.155, 0.17),
    sec(s * 0.2, 0.52, 0, 0.18, 0.2),
    sec(s * 0.2, 0.7, 0, 0.2, 0.22),
  ];
}

// thick arms that hang down to the knees
function makeArm(s) {
  return [
    sec(s * 0.66, 0.42, 0.08, 0.1, 0.1),
    sec(s * 0.66, 0.56, 0.06, 0.13, 0.13),
    sec(s * 0.66, 0.74, 0.03, 0.15, 0.15),
    sec(s * 0.65, 0.92, 0, 0.16, 0.16),
    sec(s * 0.62, 1.1, 0, 0.17, 0.16),
    sec(s * 0.56, 1.25, 0, 0.17, 0.16),
    sec(s * 0.5, 1.33, 0, 0.14, 0.13),
  ];
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// ---------- stronger glow: a slightly bigger copy that only shows at the edges ----------

const haloMaterial = new THREE.MeshBasicMaterial({
  color: "#7dffa0",
  transparent: true,
  opacity: 0.2,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// makes every ring a bit bigger
function bigger(sections, amount) {
  return sections.map((s) => sec(s.x, s.y, s.z, s.rx * amount, s.rz * amount));
}

// a glowing edge around a body part
function Halo({ sections, segments }) {
  const geometry = useMemo(
    () => createLoft(bigger(sections, 1.07), segments),
    [sections, segments]
  );
  return <mesh geometry={geometry} material={haloMaterial} renderOrder={1} />;
}

// ---------- the head and the markings ----------

// half width, half height and half depth of the head
const HEAD_SIZE = [0.27, 0.26, 0.25];

// a point on the front of the head. x is sideways and y is height (0, 0 is the middle of the head)
function headPoint(x, y, lift = 0.012) {
  const [rx, ry, rz] = HEAD_SIZE;
  const inside = 1 - (x / rx) ** 2 - (y / ry) ** 2;
  return [x, y, rz * Math.sqrt(Math.max(0, inside)) + lift];
}

// the flat frown, and the short dark bar between the eyes
const MOUTH_GEOMETRY = makeLinesGeometry(
  [[headPoint(-0.11, -0.085), headPoint(-0.06, -0.108), headPoint(0, -0.114), headPoint(0.06, -0.108), headPoint(0.11, -0.085)]],
  0.02
);
const BAR_GEOMETRY = makeLinesGeometry(
  [[headPoint(0, 0.13), headPoint(0, 0.03), headPoint(0, -0.04)]],
  0.017
);

// the white stripe that goes over the black cap, from the front to the back
const STRIPE_POINTS = [];
for (let i = 0; i <= 12; i++) {
  const a = -0.95 + (1.9 * i) / 12;
  STRIPE_POINTS.push([0, 0.275 * Math.cos(a) * 1.012, 0.265 * Math.sin(a) * 1.012]);
}
const STRIPE_GEOMETRY = makeLinesGeometry([STRIPE_POINTS], 0.016);

// ---------- the stripe on the belly ----------

// the angle on the torso that matches a sideways position x at a height y
function angleAt(y, x) {
  const s = sectionAt(TORSO, y);
  return Math.asin(Math.max(-1, Math.min(1, x / s.rx)));
}

// a line on the front of the torso. The points are [x, y]
function frontLine(points) {
  const corners = points.map(([x, y]) => [y, angleAt(y, x)]);
  return surfaceLine(TORSO, corners, 0.02);
}

// the black diagonal stripe, going down and to the left
const BELLY_STRIPE = makeLinesGeometry(
  [frontLine([[0.1, 1.12], [0.04, 0.98], [-0.02, 0.84], [-0.07, 0.72]])],
  0.045
);

// ---------- body parts ----------

// a gold shell plate in a black ring, with a gray ring in between and a glowing outline
function ShellPlate({ position, rotation = [0, 0, 0], radius }) {
  const [rx, ry, rz] = radius;

  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[rx * 1.34, ry * 1.42, rz * 0.9]} material={haloMaterial} renderOrder={1}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[rx * 1.24, ry * 1.33, rz * 0.75]} material={holoDarkRock}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[rx * 1.12, ry * 1.17, rz * 0.85]} material={holoRock}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[rx, ry, rz]} material={holoGold}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[rx * 1.26, ry * 1.35, 0.35]} material={holoBright}>
        <torusGeometry args={[1, 0.045, 6, 40]} />
      </mesh>
    </group>
  );
}

// the egg-shaped shell on his back, with two dark ridge bands
function Shell() {
  const center = [0, 0.98, -0.36];
  const size = [0.4, 0.62, 0.25];
  const bands = [1.2, 0.84];

  return (
    <group position={center}>
      <mesh scale={[size[0] * 1.09, size[1] * 1.09, size[2] * 1.09]} material={haloMaterial} renderOrder={1}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={size} material={holoGold}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>

      {bands.map((h) => {
        // how much smaller the shell is at this height
        const f = Math.sqrt(1 - ((h - center[1]) / size[1]) ** 2);
        return (
          <mesh
            key={h}
            position={[0, h - center[1], 0]}
            scale={[size[0] * f * 1.03, 0.03, size[2] * f * 1.03]}
            material={holoDarkRock}
          >
            <sphereGeometry args={[1, 20, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Body() {
  return (
    <group>
      <Halo sections={TORSO} segments={16} />
      <BodyPart sections={TORSO} segments={16} material={holoSoft} wire />
      <mesh geometry={BELLY_STRIPE} material={holoDarkRock} />
      <Shell />
    </group>
  );
}

// the head with the black cap, the white stripe, the eyes and the mouth
function Head() {
  return (
    <group position={[0, 1.5, 0.04]}>
      {/* a soft glow behind the head, and the head itself */}
      <mesh scale={[HEAD_SIZE[0] * 1.08, HEAD_SIZE[1] * 1.08, HEAD_SIZE[2] * 1.08]} material={haloMaterial} renderOrder={1}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh scale={HEAD_SIZE} material={holoSoft}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>

      {/* the black cap on the top of the head, and the white stripe over it */}
      <mesh scale={[0.285, 0.275, 0.265]} material={holoDarkRock}>
        <sphereGeometry args={[1, 24, 10, 0, Math.PI * 2, 0, 1.0]} />
      </mesh>
      <mesh geometry={STRIPE_GEOMETRY} material={holoBright} />

      {/* Omnitrix on the cap, with a dark disc behind it */}
      <group position={[0.09, 0.19, 0.18]} rotation={[-0.8, 0.25, 0]}>
        <mesh position={[0, 0, -0.004]} material={holoDarkRock}>
          <circleGeometry args={[0.06, 20]} />
        </mesh>
        <OmnitrixSymbol position={[0, 0, 0]} size={0.075} />
      </group>

      {/* the eyes: a dark rim and a glowing middle. They are slanted, so he looks angry */}
      {[-1, 1].map((s) => (
        <group key={s} position={headPoint(s * 0.105, 0.0)} rotation={[0, s * 0.4, s * 0.35]}>
          <mesh scale={[0.085, 0.055, 0.02]} material={holoDarkRock}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.012]} scale={[0.065, 0.04, 0.02]} material={holoBright}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
        </group>
      ))}

      <mesh geometry={BAR_GEOMETRY} material={holoDarkRock} />
      <mesh geometry={MOUTH_GEOMETRY} material={holoDarkRock} />
    </group>
  );
}

// the group turns around the shoulder, so the arm can swing and wrap forward
function Arm({ side, groupRef }) {
  const s = side;

  return (
    <group ref={groupRef} position={[s * 0.52, 1.25, 0]}>
      <group position={[s * -0.52, -1.25, 0]}>
        <Halo sections={ARMS[s]} segments={12} />
        <BodyPart sections={ARMS[s]} segments={12} material={holoSoft} wire />

        {/* big mitt hand with three black claws */}
        <mesh position={[s * 0.66, 0.37, 0.1]} scale={[0.14, 0.1, 0.12]} material={holoSoft}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        {[-1, 0, 1].map((k) => (
          <mesh
            key={k}
            position={[s * 0.66 + k * 0.065, 0.25, 0.15]}
            rotation={[Math.PI - 0.3, 0, 0]}
            material={holoDarkRock}
          >
            <coneGeometry args={[0.03, 0.2, 5]} />
          </mesh>
        ))}

        {/* the big plate over the shoulder, and a plate on the upper arm */}
        <ShellPlate position={[s * 0.58, 1.38, 0]} rotation={[0, s * 0.35, -s * 0.35]} radius={[0.26, 0.17, 0.16]} />
        <ShellPlate position={[s * 0.74, 0.98, 0.05]} rotation={[0, s * 0.5, 0]} radius={[0.1, 0.17, 0.09]} />
      </group>
    </group>
  );
}

// the group turns around the hip, so the leg can fold up
function Leg({ side, groupRef }) {
  const x = side * 0.2;

  return (
    <group ref={groupRef} position={[x, 0.62, 0]}>
      <group position={[-x, -0.62, 0]}>
        <Halo sections={LEGS[side]} segments={12} />
        <BodyPart sections={LEGS[side]} segments={12} material={holoSoft} wire />

        {/* the plate on the knee */}
        <ShellPlate position={[x, 0.42, 0.2]} rotation={[0, side * 0.2, 0]} radius={[0.1, 0.14, 0.07]} />

        {/* blunt foot with three black claws */}
        <mesh position={[x, 0.06, 0.12]} scale={[0.16, 0.07, 0.22]} material={holoSoft}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        {[-1, 0, 1].map((k) => (
          <mesh
            key={k}
            position={[x + k * 0.08, 0.05, 0.33]}
            rotation={[Math.PI / 2 + 0.3, 0, 0]}
            material={holoDarkRock}
          >
            <coneGeometry args={[0.03, 0.2, 5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------- hologram effects ----------

const SPARK_COUNT = 40;

// a repeatable number from 0 to 1, so the sparks always start the same way
function pseudoRandom(n) {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

// small green sparks drifting upwards around him
function DataSparks() {
  const points = useRef();

  const data = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const speeds = new Float32Array(SPARK_COUNT);
    for (let i = 0; i < SPARK_COUNT; i++) {
      const angle = pseudoRandom(i) * Math.PI * 2;
      const radius = 0.7 + pseudoRandom(i + 50) * 0.35;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = pseudoRandom(i + 100) * 2.0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.12 + pseudoRandom(i + 150) * 0.2;
    }
    return { positions, speeds };
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const attribute = points.current.geometry.attributes.position;
    for (let i = 0; i < SPARK_COUNT; i++) {
      let y = attribute.array[i * 3 + 1] + data.speeds[i] * delta;
      if (y > 2.1) y = 0.05;
      attribute.array[i * 3 + 1] = y;
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#9dffb4"
        size={0.03}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// a thin ring of light that sweeps up his body
function ScanRing() {
  const ring = useRef();

  useFrame((state) => {
    if (!ring.current) return;
    const progress = (state.clock.elapsedTime * 0.35) % 1;
    ring.current.position.y = progress * 1.9;
    ring.current.material.opacity = 0.7 * Math.sin(progress * Math.PI);
  });

  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.8, 0.008, 8, 48]} />
      <meshBasicMaterial
        color="#9dffb4"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---------- the complete alien ----------

// eases a number from 0 to 1 smoothly (slow start, slow end)
function smooth(x) {
  return x * x * (3 - 2 * x);
}

const ROLL_EVERY = 14; // seconds between two rolls
const ROLL_START = 8; // the roll starts this many seconds into every cycle
const ROLL_TIME = 5; // how long one roll takes

export default function Cannonbolt() {
  const alien = useRef(); // sway and glitch
  const spin = useRef(); // turns him over when he rolls
  const upper = useRef(); // body, head and arms. Leans forward when he curls up
  const leftArm = useRef();
  const rightArm = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // where we are in the rolling cycle. roll is 0 when standing and 1 when curled up
    const u = ((t % ROLL_EVERY) - ROLL_START) / ROLL_TIME;
    let roll = 0;
    let spinAngle = 0;

    if (u > 0 && u < 1) {
      if (u < 0.2) {
        roll = smooth(u / 0.2); // curling up
      } else if (u > 0.8) {
        roll = smooth((1 - u) / 0.2); // standing up again
      } else {
        roll = 1; // rolling
      }
      // three full turns, so he ends upright
      spinAngle = Math.PI * 6 * smooth(u);
    }

    if (alien.current) {
      // slow sway, and a very short glitch every 4 seconds
      alien.current.rotation.y = Math.sin(t * 0.4) * 0.12 * (1 - roll);
      const glitching = t % 4 < 0.12;
      alien.current.position.x = glitching ? Math.sin(t * 90) * 0.03 : 0;
    }

    if (spin.current) {
      spin.current.rotation.x = spinAngle;
    }

    if (upper.current) {
      // breathing, and leaning forward while curling up
      const breath = 1 + Math.sin(t * 1.8) * 0.012 * (1 - roll);
      upper.current.scale.x = breath;
      upper.current.scale.z = breath;
      upper.current.rotation.x = roll * 0.55;
    }

    // the arms sway, and wrap forward when he curls up
    const swing = Math.sin(t * 0.9) * 0.04 * (1 - roll);
    if (leftArm.current) {
      leftArm.current.rotation.x = swing - roll * 1.5;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = swing - roll * 1.5;
    }

    // the legs fold up
    if (leftLeg.current) {
      leftLeg.current.rotation.x = -roll * 1.25;
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = -roll * 1.25;
    }
  });

  return (
    <group ref={alien} scale={1.05}>
      {/* the ball turns around its middle */}
      <group ref={spin} position={[0, 0.85, 0]}>
        <group position={[0, -0.85, 0]}>
          {/* upper body leans forward around the hips */}
          <group ref={upper} position={[0, 0.7, 0]}>
            <group position={[0, -0.7, 0]}>
              <Body />
              <Head />
              <Arm side={-1} groupRef={leftArm} />
              <Arm side={1} groupRef={rightArm} />
            </group>
          </group>

          <Leg side={-1} groupRef={leftLeg} />
          <Leg side={1} groupRef={rightLeg} />
        </group>
      </group>

      <DataSparks />
      <ScanRing />
    </group>
  );
}
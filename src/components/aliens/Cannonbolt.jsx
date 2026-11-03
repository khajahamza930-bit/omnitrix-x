import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { sec, BodyPart, OmnitrixSymbol } from "./parts";
import { holoCore, holoRock, holoDarkRock, holoBright, holoShell } from "../hologram/hologramMaterials";
import { sectionAt, surfacePoint, surfaceLine, makeLinesGeometry } from "../../utils/circuitLines";

// Cannonbolt, built from the reference picture.
// The feet are at y = 0 and he faces the +z direction. He is about 1.45 tall and 1.5 wide.
// A wide heavy body with no neck. White body, gold shell plates in black rings.
// Every 14 seconds he curls up and rolls like a ball.

// ---------- body shapes (rings from bottom to top) ----------

// one big body. The face is on the upper part, and the top is the dome of the head
const TORSO = [
  sec(0, 0.42, 0, 0.3, 0.27),
  sec(0, 0.5, 0, 0.34, 0.3),
  sec(0, 0.7, 0, 0.44, 0.36),
  sec(0, 0.95, 0, 0.5, 0.38),
  sec(0, 1.1, 0, 0.5, 0.36),
  sec(0, 1.25, 0, 0.42, 0.32),
  sec(0, 1.34, 0, 0.28, 0.22),
  sec(0, 1.4, 0, 0.1, 0.09),
];

// short, thick legs
function makeLeg(s) {
  return [
    sec(s * 0.19, 0.06, 0.04, 0.14, 0.18),
    sec(s * 0.19, 0.22, 0, 0.145, 0.16),
    sec(s * 0.19, 0.38, 0, 0.16, 0.17),
    sec(s * 0.19, 0.52, 0, 0.18, 0.2),
    sec(s * 0.19, 0.66, 0, 0.18, 0.2),
  ];
}

// thick arms that hang down to the knees
function makeArm(s) {
  return [
    sec(s * 0.64, 0.34, 0.02, 0.15, 0.14),
    sec(s * 0.64, 0.5, 0, 0.17, 0.16),
    sec(s * 0.64, 0.7, 0, 0.19, 0.18),
    sec(s * 0.6, 0.9, 0, 0.2, 0.19),
    sec(s * 0.55, 1.05, 0, 0.2, 0.19),
    sec(s * 0.5, 1.13, 0, 0.17, 0.16),
  ];
}

// made once, so React does not rebuild them
const LEGS = { "-1": makeLeg(-1), "1": makeLeg(1) };
const ARMS = { "-1": makeArm(-1), "1": makeArm(1) };

// ---------- face and markings ----------

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

// thick black bands: the bar on the forehead, the stripe on the belly (they make a 7 with the mouth),
// and the arch over the top of the head
const BAND_GEOMETRY = makeLinesGeometry(
  [
    frontLine([[0, 1.22], [0, 1.08], [0, 0.93]]),
    frontLine([[0.06, 0.78], [0.02, 0.66], [-0.03, 0.56], [-0.06, 0.47]]),
    frontLine([
      [-0.5, 1.1], [-0.42, 1.22], [-0.28, 1.31], [-0.14, 1.36], [0, 1.375],
      [0.14, 1.36], [0.28, 1.31], [0.42, 1.22], [0.5, 1.1],
    ]),
  ],
  0.04
);

// the flat frown that is his mouth (the ends point down)
const MOUTH_GEOMETRY = makeLinesGeometry(
  [frontLine([[-0.2, 0.83], [-0.1, 0.855], [0, 0.865], [0.1, 0.855], [0.2, 0.83]])],
  0.02
);

// where the eyes and the Omnitrix sit on the surface
const EYE_ANGLE = angleAt(1.07, 0.19);
const EYE_POSITIONS = [-1, 1].map((s) => surfacePoint(TORSO, 1.07, s * EYE_ANGLE, 0.02));
const SYMBOL_POSITION = surfacePoint(TORSO, 1.3, 0.3, 0.03);

// ---------- body parts ----------

// a gold shell plate sitting in a black ring, with a gray ring in between
function ShellPlate({ position, rotation = [0, 0, 0], radius }) {
  const [rx, ry, rz] = radius;

  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[rx * 1.24, ry * 1.33, rz * 0.75]} material={holoDarkRock}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[rx * 1.12, ry * 1.17, rz * 0.85]} material={holoRock}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh scale={[rx, ry, rz]} material={holoShell}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  );
}

// the body, the face, the black bands and the two big shoulder plates
function Body() {
  return (
    <group>
      <BodyPart sections={TORSO} segments={16} material={holoCore} />

      <mesh geometry={BAND_GEOMETRY} material={holoDarkRock} />
      <mesh geometry={MOUTH_GEOMETRY} material={holoDarkRock} />

      {/* the eyes: a black rim and a glowing middle */}
      {[-1, 1].map((s, i) => (
        <group key={s} position={EYE_POSITIONS[i]} rotation={[0, s * EYE_ANGLE, s * 0.15]}>
          <mesh scale={[0.062, 0.078, 0.02]} material={holoDarkRock}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.012]} scale={[0.044, 0.058, 0.02]} material={holoBright}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
        </group>
      ))}

      {/* Omnitrix on the black band over the head, with a dark disc behind it */}
      <group position={SYMBOL_POSITION} rotation={[-0.83, 0.3, 0]}>
        <mesh position={[0, 0, -0.004]} material={holoDarkRock}>
          <circleGeometry args={[0.07, 20]} />
        </mesh>
        <OmnitrixSymbol position={[0, 0, 0]} size={0.085} />
      </group>

      {/* two huge shoulder plates, tilted outwards */}
      {[-1, 1].map((s) => (
        <ShellPlate
          key={s}
          position={[s * 0.36, 1.25, 0.1]}
          rotation={[0, 0, -s * 0.25]}
          radius={[0.25, 0.18, 0.2]}
        />
      ))}
    </group>
  );
}

// big white mitt hand with three black claws
function Hand({ side }) {
  return (
    <group>
      <mesh position={[side * 0.64, 0.3, 0.03]} scale={[0.17, 0.13, 0.13]} material={holoCore}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>

      {[-1, 0, 1].map((k) => (
        <mesh
          key={k}
          position={[side * 0.64 + k * 0.08, 0.17, 0.1]}
          rotation={[Math.PI - 0.4, 0, 0]}
          material={holoDarkRock}
        >
          <coneGeometry args={[0.028, 0.18, 5]} />
        </mesh>
      ))}
    </group>
  );
}

// the group turns around the shoulder
function Arm({ side, groupRef }) {
  return (
    <group ref={groupRef} position={[side * 0.5, 1.05, 0]}>
      <group position={[side * -0.5, -1.05, 0]}>
        <BodyPart sections={ARMS[side]} segments={12} material={holoCore} />
        <Hand side={side} />

        {/* the shell plate on the outer arm */}
        <ShellPlate position={[side * 0.66, 0.7, 0.1]} radius={[0.17, 0.23, 0.13]} />
      </group>
    </group>
  );
}

// the group turns around the hip
function Leg({ side, groupRef }) {
  const x = side * 0.19;

  return (
    <group ref={groupRef} position={[x, 0.6, 0]}>
      <group position={[-x, -0.6, 0]}>
        <BodyPart sections={LEGS[side]} segments={12} material={holoCore} />

        {/* the shell plate on the knee */}
        <ShellPlate position={[x, 0.38, 0.14]} radius={[0.09, 0.125, 0.07]} />

        {/* blunt foot with three black claws */}
        <mesh position={[x, 0.06, 0.12]} scale={[0.15, 0.07, 0.2]} material={holoCore}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        {[-1, 0, 1].map((k) => (
          <mesh
            key={k}
            position={[x + k * 0.08, 0.05, 0.3]}
            rotation={[Math.PI / 2 + 0.3, 0, 0]}
            material={holoDarkRock}
          >
            <coneGeometry args={[0.025, 0.15, 5]} />
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
      const radius = 0.55 + pseudoRandom(i + 50) * 0.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = pseudoRandom(i + 100) * 1.7;
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
      if (y > 1.8) y = 0.05;
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
    ring.current.position.y = progress * 1.6;
    ring.current.material.opacity = 0.7 * Math.sin(progress * Math.PI);
  });

  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.75, 0.008, 8, 48]} />
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
  const upper = useRef(); // body and arms, leans forward when he curls up
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
    <group ref={alien} scale={0.92}>
      {/* the ball turns around its middle */}
      <group ref={spin} position={[0, 0.65, 0]}>
        <group position={[0, -0.65, 0]}>
          {/* upper body leans forward around the hips */}
          <group ref={upper} position={[0, 0.55, 0]}>
            <group position={[0, -0.55, 0]}>
              <Body />
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
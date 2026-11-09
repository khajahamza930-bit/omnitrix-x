import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { sec, BodyPart, Halo, haloMaterial, OmnitrixSymbol } from "./parts";
import { DataSparks, ScanRing } from "./effects";
import { holoCore, holoSoft, holoGold, holoDarkRock, holoBright } from "../hologram/hologramMaterials";
import { surfaceLine, makeLinesGeometry } from "../../utils/circuitLines";

// Ripjaws, built from the clean cartoon picture.
// The alien floats and swims. He is about 2 tall (with the lure and the tail).
// A pale ribbed body, a huge mouth full of teeth that opens and closes, a glowing lure,
// webbed hands with long claws, green fins, and a black tail with pale chevron stripes.

// ---------- body shapes ----------

// the thin upper body, from the waist to the shoulders
const TORSO = [
  sec(0.0, 1.02, 0, 0.12, 0.1),
  sec(0.01, 1.15, 0, 0.14, 0.11),
  sec(0.03, 1.3, 0, 0.18, 0.13),
  sec(0.05, 1.45, 0, 0.22, 0.14),
  sec(0.07, 1.58, 0, 0.23, 0.13),
  sec(0.09, 1.66, 0, 0.12, 0.09),
];

// a thin arm, drawn hanging down from the shoulder (the shoulder is at y = 0)
const ARM = [
  sec(0, -0.75, 0, 0.035, 0.033),
  sec(0, -0.5, 0, 0.04, 0.038),
  sec(0, -0.3, 0, 0.048, 0.045),
  sec(0, -0.1, 0, 0.055, 0.05),
  sec(0, 0, 0, 0.06, 0.055),
];

// how the arms are turned. The left arm points down and out, the right arm reaches up and out
const LEFT_ARM_ANGLE = -0.9;
const RIGHT_ARM_ANGLE = 1.9;

// ---------- flat shapes: fins and webbed hands ----------

// makes a flat shape from a list of [x, y] points
function makeFlat(points, depth = 0.015) {
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

// made once, so React does not rebuild them
const DORSAL_FIN = makeFlat([[0, 0], [0.26, 0.16], [0, 0.2]]);
const SHOULDER_FIN = makeFlat([[0, 0], [0.1, 0.3], [0.2, 0]]);
const ELBOW_FIN = makeFlat([[0, 0], [0.12, 0.1], [0, 0.16]]);
const WEB = makeFlat([[-0.03, 0], [-0.1, -0.19], [-0.06, -0.1], [0, -0.2], [0.06, -0.1], [0.1, -0.19], [0.03, 0]], 0.012);
const TAIL_FIN = makeFlat([[0, 0], [-0.12, -0.12], [-0.2, -0.45], [0, -0.33], [0.2, -0.45], [0.12, -0.12]]);

// where the pairs of fins sit on the back (the heights)
const FIN_HEIGHTS = [1.56, 1.44, 1.32, 1.2, 1.08];

// ---------- rib lines and gill marks ----------

const RIB_LINES = [1.5, 1.4, 1.3, 1.2].map((y) => [[y, -0.9], [y - 0.04, 0], [y, 0.9]]);
const GILL_LINES = [
  [[1.6, -1.15], [1.57, -1.05], [1.6, -0.95]],
  [[1.6, 1.15], [1.57, 1.05], [1.6, 0.95]],
  [[1.53, -1.2], [1.5, -1.1], [1.53, -1.0]],
  [[1.53, 1.2], [1.5, 1.1], [1.53, 1.0]],
];
const RIBS_GEOMETRY = makeLinesGeometry(
  [...RIB_LINES, ...GILL_LINES].map((line) => surfaceLine(TORSO, line)),
  0.008
);

// ---------- the teeth and the lure ----------

// one row of long sharp teeth. The upper teeth point down, the lower teeth point up
function makeTeeth(isUpper) {
  const count = 9;
  const pieces = [];

  for (let i = 0; i < count; i++) {
    const x = -0.15 + (0.3 * i) / (count - 1);
    const length = 0.065 + 0.04 * (1 - Math.abs(x) / 0.15);
    const z = 0.28 - Math.abs(x) * 0.7;

    const tooth = new THREE.ConeGeometry(0.017, length, 5);
    if (isUpper) {
      tooth.rotateX(Math.PI);
      tooth.translate(x, -length / 2, z);
    } else {
      tooth.translate(x, length / 2, z);
    }
    pieces.push(tooth);
  }

  const merged = mergeGeometries(pieces);
  pieces.forEach((piece) => piece.dispose());
  return merged;
}

const UPPER_TEETH = makeTeeth(true);
const LOWER_TEETH = makeTeeth(false);

// the thin stalk of the lure. It goes up, then curves forward and down
const LURE_POINTS = [[0, 0.13, 0.08], [0, 0.3, 0.1], [0, 0.42, 0.18], [0, 0.46, 0.32], [0, 0.4, 0.44]];
const LURE_CURVE = new THREE.CatmullRomCurve3(LURE_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
const LURE_GEOMETRY = makeLinesGeometry(
  [LURE_CURVE.getPoints(16).map((p) => [p.x, p.y, p.z])],
  0.011
);
const LURE_END = LURE_POINTS[LURE_POINTS.length - 1];

// the glow around the bulb of the lure
const glowMaterial = new THREE.MeshBasicMaterial({
  color: "#caffb0",
  transparent: true,
  opacity: 0.45,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// ---------- body parts ----------

// a flat shape (a fin) put in place
function Flat({ geometry, position, rotation = [0, 0, 0], scale = 1, material = holoGold }) {
  return <mesh geometry={geometry} position={position} rotation={rotation} scale={scale} material={material} />;
}

function Body() {
  return (
    <group>
      <Halo sections={TORSO} segments={12} />
      <BodyPart sections={TORSO} segments={12} material={holoCore} wire />
      <mesh geometry={RIBS_GEOMETRY} material={holoDarkRock} />

      {/* the Omnitrix on the chest (it is not in the picture, but every alien wears it) */}
      <mesh position={[0.07, 1.4, 0.15]} material={holoDarkRock}>
        <circleGeometry args={[0.055, 18]} />
      </mesh>
      <OmnitrixSymbol position={[0.07, 1.4, 0.155]} size={0.07} />

      {/* pairs of fins along the back, a bit smaller towards the waist */}
      {FIN_HEIGHTS.map((y, i) =>
        [-1, 1].map((s) => (
          <Flat
            key={y + "_" + s}
            geometry={DORSAL_FIN}
            position={[0.05 + s * 0.07, y, -0.11]}
            rotation={[0, Math.PI / 2 - s * 0.6, 0]}
            scale={1 - i * 0.12}
          />
        ))
      )}

      {/* two bigger spiky fins on the shoulders */}
      {[-1, 1].map((s) => (
        <Flat
          key={s}
          geometry={SHOULDER_FIN}
          position={[0.08 + s * 0.2, 1.64, -0.04]}
          rotation={[0, 0, -s * 0.45]}
        />
      ))}
    </group>
  );
}

// the head. The lower jaw turns around the back of the mouth, so the mouth opens
function Head({ jawRef, bulbRef }) {
  return (
    <group>
      {/* the flat wide skull, with a soft glow around it */}
      <mesh position={[0, 0.04, 0.1]} scale={[0.22, 0.125, 0.26]} material={haloMaterial} renderOrder={1}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh position={[0, 0.04, 0.1]} scale={[0.2, 0.11, 0.24]} material={holoCore}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>

      {/* a round eye on each side, in a dark socket */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.18, 0.07, 0.12]}>
          <mesh scale={[0.056, 0.056, 0.056]} material={holoDarkRock}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[s * 0.018, 0, 0.012]} scale={[0.04, 0.04, 0.04]} material={holoBright}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
        </group>
      ))}

      {/* the upper row of teeth */}
      <mesh geometry={UPPER_TEETH} position={[0, -0.06, 0.04]} material={holoBright} />

      {/* the lower jaw with its teeth and the pale green mouth inside */}
      <group ref={jawRef} position={[0, -0.05, 0.02]}>
        <mesh position={[0, -0.02, 0.12]} scale={[0.17, 0.05, 0.22]} material={holoCore}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh position={[0, 0.0, 0.12]} scale={[0.15, 0.035, 0.2]} material={holoSoft}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh geometry={LOWER_TEETH} position={[0, 0.0, 0.0]} material={holoBright} />
      </group>

      {/* the lure: a thin stalk with a glowing bulb */}
      <mesh geometry={LURE_GEOMETRY} material={holoDarkRock} />
      <group ref={bulbRef} position={LURE_END}>
        <mesh scale={[0.045, 0.045, 0.045]} material={holoBright}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh scale={[0.1, 0.1, 0.1]} material={glowMaterial}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      </group>

      {/* a fin on the back of the head */}
      <Flat geometry={DORSAL_FIN} position={[0, 0.1, -0.12]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
    </group>
  );
}

// a thin arm with a webbed hand and three long claws. The group turns around the shoulder
function Arm({ side, angle, groupRef }) {
  return (
    <group ref={groupRef} position={[0.09 + side * 0.22, 1.56, 0]} rotation={[0, 0, angle]}>
      <BodyPart sections={ARM} segments={10} material={holoCore} />

      {/* a small green fin on the forearm */}
      <Flat geometry={ELBOW_FIN} position={[0, -0.5, -0.04]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />

      {/* the hand */}
      <group position={[0, -0.75, 0]}>
        <mesh geometry={WEB} material={holoGold} />
        {[-1, 0, 1].map((k) => (
          <mesh
            key={k}
            position={[k * 0.1, -0.265, 0]}
            rotation={[0, 0, Math.PI + k * 0.25]}
            material={holoBright}
          >
            <coneGeometry args={[0.02, 0.13, 5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------- the tail ----------

const TAIL_PIECES = 9;
const PIECE_LENGTH = 0.085;

// how much each piece turns, so the tail has an S shape
const TAIL_CURVE = [-0.08, -0.06, 0, 0.08, 0.14, 0.16, 0.12, 0.08, 0.04];

// the radius of the tail at a piece. It gets thinner towards the tip
function tailRadius(i) {
  return 0.13 * Math.pow(1 - i / (TAIL_PIECES + 1), 0.9) + 0.025;
}

// a pale V-shaped stripe around the front of a piece
function makeChevronGeometry(radius) {
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const angle = -1.2 + (2.4 * i) / 10;
    points.push([
      Math.sin(angle) * (radius + 0.01),
      -PIECE_LENGTH / 2 + 0.02 + Math.abs(angle) * 0.03,
      Math.cos(angle) * (radius + 0.01),
    ]);
  }
  return makeLinesGeometry([points], 0.011);
}

// one piece of the tail. Each piece holds the next piece, so the tail bends like a whip
function TailPiece({ index }) {
  const ref = useRef();
  const top = tailRadius(index);
  const bottom = tailRadius(index + 1);
  const middle = (top + bottom) / 2;

  // every second piece gets a stripe
  const chevron = useMemo(
    () => (index < TAIL_PIECES && index % 2 === 0 ? makeChevronGeometry(middle) : null),
    [index, middle]
  );

  useFrame((state) => {
    if (!ref.current) return;
    // the wave grows stronger towards the tip
    const wave = Math.sin(state.clock.elapsedTime * 2.2 - index * 0.55) * (0.04 + index * 0.012);
    ref.current.rotation.z = TAIL_CURVE[index] + wave;
  });

  // the piece after the last one is empty
  if (index >= TAIL_PIECES) return null;

  const isLast = index === TAIL_PIECES - 1;

  return (
    <group ref={ref}>
      <mesh position={[0, -PIECE_LENGTH / 2, 0]} material={holoDarkRock}>
        <cylinderGeometry args={[top, bottom, PIECE_LENGTH, 14]} />
      </mesh>

      {chevron && <mesh geometry={chevron} material={holoBright} />}

      {/* the forked tail fin on the last piece */}
      {isLast && (
        <group position={[0, -PIECE_LENGTH, 0]} scale={0.8}>
          <mesh geometry={TAIL_FIN} material={holoGold} />
        </group>
      )}

      <group position={[0, -PIECE_LENGTH, 0]}>
        <TailPiece index={index + 1} />
      </group>
    </group>
  );
}

// ---------- the complete alien ----------

export default function Ripjaws() {
  const alien = useRef();
  const upper = useRef();
  const jaw = useRef();
  const bulb = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (alien.current) {
      // floats up and down, sways slowly, and glitches for a moment every 4 seconds
      alien.current.position.y = 0.2 + Math.sin(t * 1.1) * 0.04;
      alien.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      const glitching = t % 4 < 0.12;
      alien.current.position.x = glitching ? Math.sin(t * 90) * 0.03 : 0;
    }

    // the upper body sways from side to side, like swimming
    if (upper.current) {
      upper.current.rotation.z = Math.sin(t * 0.9) * 0.05;
    }

    // the mouth opens and closes slowly
    if (jaw.current) {
      jaw.current.rotation.x = 0.12 + (0.5 + 0.5 * Math.sin(t * 1.3)) * 0.4;
    }

    // the bulb of the lure pulses
    if (bulb.current) {
      bulb.current.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
    }

    // the arms drift
    if (leftArm.current) {
      leftArm.current.rotation.z = LEFT_ARM_ANGLE + Math.sin(t * 1.2) * 0.1;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = RIGHT_ARM_ANGLE + Math.sin(t * 1.2 + 1.5) * 0.1;
    }
  });

  return (
    <group ref={alien} scale={0.95}>
      {/* the upper body turns around the waist */}
      <group ref={upper} position={[0, 1.02, 0]}>
        <group position={[0, -1.02, 0]}>
          <Body />

          <group position={[0.1, 1.72, 0.05]} rotation={[0.15, 0, 0]}>
            <Head jawRef={jaw} bulbRef={bulb} />
          </group>

          <Arm side={-1} angle={LEFT_ARM_ANGLE} groupRef={leftArm} />
          <Arm side={1} angle={RIGHT_ARM_ANGLE} groupRef={rightArm} />
        </group>
      </group>

      {/* the tail starts at the waist */}
      <group position={[0, 1.02, 0]}>
        <TailPiece index={0} />
      </group>

      <DataSparks height={2.2} radius={0.85} />
      <ScanRing height={2.0} radius={0.9} />
    </group>
  );
}
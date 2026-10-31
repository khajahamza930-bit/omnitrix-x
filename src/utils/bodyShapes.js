import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Builds a body part by stacking oval rings from bottom to top.
// Each section is { x, y, z, rx, rz } = center position and ring size.
export function createLoft(sections, segments = 10, capEnds = true) {
  const positions = [];
  const indices = [];

  sections.forEach((s) => {
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      positions.push(
        s.x + Math.cos(angle) * s.rx,
        s.y,
        s.z + Math.sin(angle) * s.rz
      );
    }
  });

  // connect each ring to the ring above it
  for (let r = 0; r < sections.length - 1; r++) {
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = r * segments + i;
      const b = r * segments + next;
      const c = (r + 1) * segments + i;
      const d = (r + 1) * segments + next;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // close the bottom and the top
  if (capEnds) {
    const last = sections.length - 1;
    const bottomCenter = positions.length / 3;
    positions.push(sections[0].x, sections[0].y, sections[0].z);
    const topCenter = bottomCenter + 1;
    positions.push(sections[last].x, sections[last].y, sections[last].z);

    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      indices.push(bottomCenter, i, next);
      indices.push(topCenter, last * segments + next, last * segments + i);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// A round flame tongue made from rings (older version, not used right now).
export function createFlameTongue({
  length = 0.5,
  width = 0.09,
  thickness = 0.5,
  lean = 0,
  wobble = 0.03,
}) {
  const rings = 10;
  const segments = 8;
  const sections = [];

  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const size = width * Math.pow(1 - t, 0.8) * (1 + 0.35 * Math.sin(t * Math.PI));
    sections.push({
      x: lean * t * t + Math.sin(t * Math.PI * 2) * wobble,
      y: t * length,
      z: 0,
      rx: size,
      rz: size * thickness,
    });
  }

  const geometry = createLoft(sections, segments, false);

  const colors = [];
  const base = new THREE.Color("#1f8f2a");
  const tip = new THREE.Color("#e6ffaa");
  const mix = new THREE.Color();
  for (let r = 0; r <= rings; r++) {
    mix.copy(base).lerp(tip, r / rings);
    for (let i = 0; i < segments; i++) {
      colors.push(mix.r, mix.g, mix.b);
    }
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

// One flat flame tongue.
// It is fat at the bottom, bends in an S shape and ends in a soft point.
function createTongue(baseX, halfWidth, height, lean, wiggle, depth, zShift) {
  const steps = 14;
  const leftSide = [];
  const rightSide = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height;

    // the middle line bends sideways
    const centerX = baseX + lean * t * t + Math.sin(t * Math.PI * 2) * wiggle;

    // wide at the bottom, thin at the top
    const half = halfWidth * Math.pow(1 - t, 0.6);

    leftSide.push(new THREE.Vector2(centerX - half, y));
    rightSide.push(new THREE.Vector2(centerX + half, y));
  }

  // draw up the left side, then down the right side
  const shape = new THREE.Shape();
  shape.moveTo(leftSide[0].x, leftSide[0].y);
  for (let i = 1; i <= steps; i++) {
    shape.lineTo(leftSide[i].x, leftSide[i].y);
  }
  for (let i = steps - 1; i >= 0; i--) {
    shape.lineTo(rightSide[i].x, rightSide[i].y);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
  });

  // zShift stops two tongues from fighting over the same space
  geometry.translate(0, 0, -depth / 2 + zShift);
  return geometry;
}

// A flame made from several tongues side by side.
// width and height are in 3D units. seed changes the shape.
export function createFlameSheet({
  width = 0.4,
  height = 0.8,
  tongues = 4,
  depth = 0.035,
  seed = 1,
}) {
  const step = width / tongues;
  const pieces = [];

  for (let i = 0; i < tongues; i++) {
    const baseX = -width / 2 + step * (i + 0.5);

    // middle tongues are taller, and each tongue is a bit different
    const middle = 1 - Math.abs((i + 0.5) / tongues - 0.5) * 1.1;
    const random = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(seed * 7.3 + i * 2.1));
    const tongueHeight = height * middle * random;

    // outer tongues lean outward, plus a little randomness
    const lean = baseX * 0.9 + Math.sin(seed * 3.1 + i * 1.7) * step * 0.6;

    pieces.push(
      createTongue(baseX, step * 0.65, tongueHeight, lean, step * 0.25, depth, i * 0.003)
    );
  }

  // join all tongues into one shape
  const geometry = mergeGeometries(pieces);
  pieces.forEach((piece) => piece.dispose());

  // green at the bottom, bright lime at the tips
  const position = geometry.attributes.position;
  const colors = [];
  const bottom = new THREE.Color("#12801a");
  const middleColor = new THREE.Color("#4fe024");
  const top = new THREE.Color("#c8ff5a");
  const mix = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const t = Math.min(1, Math.max(0, position.getY(i) / height));
    if (t < 0.5) {
      mix.copy(bottom).lerp(middleColor, t * 2);
    } else {
      mix.copy(middleColor).lerp(top, (t - 0.5) * 2);
    }
    colors.push(mix.r, mix.g, mix.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return geometry;
}
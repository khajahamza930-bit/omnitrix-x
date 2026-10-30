import * as THREE from "three";

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

// A round flame tongue made from rings (older version, kept for later use).
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

// A flat flame sheet with several uneven tongues.
// width and height are in 3D units. seed changes the shape.
export function createFlameSheet({
  width = 0.4,
  height = 0.8,
  tongues = 5,
  depth = 0.035,
  seed = 1,
}) {
  const half = width / 2;
  const step = width / tongues;
  const shape = new THREE.Shape();

  shape.moveTo(-half, 0);
  shape.lineTo(-half, height * 0.12);

  for (let i = 0; i < tongues; i++) {
    const x0 = -half + i * step;
    const x1 = x0 + step;

    // middle tongues are taller, and each tongue is a bit different
    const middle = 1 - Math.abs((i + 0.5) / tongues - 0.5) * 1.3;
    const random = 0.78 + 0.22 * Math.sin(seed * 7.3 + i * 2.1);
    const h = height * middle * random;

    // the tip leans a little to the left or right
    const lean = Math.sin(seed * 3.1 + i * 1.7) * step * 0.5;
    const tipX = x0 + step * 0.5 + lean;

    const nextValleyY = i === tongues - 1 ? height * 0.1 : h * 0.22 + height * 0.06;

    // left side curves up to the tip, right side curves back down
    shape.quadraticCurveTo(x0 + step * 0.05, h * 0.6, tipX, h);
    shape.quadraticCurveTo(tipX + step * 0.3, h * 0.45, x1, nextValleyY);
  }

  shape.lineTo(half, 0);
  shape.lineTo(-half, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -depth / 2);

  // dark green at the bottom, bright at the tips
  const position = geometry.attributes.position;
  const colors = [];
  const base = new THREE.Color("#2c9a22");
  const tip = new THREE.Color("#f2ffb4");
  const mix = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const t = Math.min(1, Math.max(0, position.getY(i) / height));
    mix.copy(base).lerp(tip, t);
    colors.push(mix.r, mix.g, mix.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return geometry;
}
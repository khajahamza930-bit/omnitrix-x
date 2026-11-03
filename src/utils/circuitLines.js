import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Helpers for drawing lines on the surface of a body part.
// A line is a list of points like [height, angle].
// The angle is measured from the front: 0 is the front, positive turns towards +x.

// finds the size of a body part at a height (looks between the two nearest rings)
export function sectionAt(sections, y) {
  const last = sections[sections.length - 1];
  if (y <= sections[0].y) return sections[0];
  if (y >= last.y) return last;

  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i];
    const b = sections[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / (b.y - a.y);
      return {
        x: a.x + (b.x - a.x) * t,
        y: y,
        z: a.z + (b.z - a.z) * t,
        rx: a.rx + (b.rx - a.rx) * t,
        rz: a.rz + (b.rz - a.rz) * t,
      };
    }
  }
  return last;
}

// a 3D point on the surface of a body part, a little bit above it (the lift)
export function surfacePoint(sections, y, angle, lift) {
  const s = sectionAt(sections, y);
  const x = s.x + (s.rx + lift) * Math.sin(angle);
  const z = s.z + (s.rz + lift) * Math.cos(angle);
  return [x, y, z];
}

// turns a list of [height, angle] corners into points that follow the surface
export function surfaceLine(sections, corners, lift = 0.016) {
  const points = [];

  for (let i = 0; i < corners.length - 1; i++) {
    const [y0, a0] = corners[i];
    const [y1, a1] = corners[i + 1];

    // cut long pieces into small steps, so the line bends with the body
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(y1 - y0) / 0.08, Math.abs(a1 - a0) / 0.3))
    );

    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      points.push(surfacePoint(sections, y0 + (y1 - y0) * t, a0 + (a1 - a0) * t, lift));
    }
  }

  const [yEnd, aEnd] = corners[corners.length - 1];
  points.push(surfacePoint(sections, yEnd, aEnd, lift));
  return points;
}

// makes one geometry from many lines. Each line is a list of 3D points.
export function makeLinesGeometry(lines, radius = 0.013) {
  const pieces = [];
  const up = new THREE.Vector3(0, 1, 0);

  lines.forEach((points) => {
    for (let i = 0; i < points.length - 1; i++) {
      const start = new THREE.Vector3(points[i][0], points[i][1], points[i][2]);
      const end = new THREE.Vector3(points[i + 1][0], points[i + 1][1], points[i + 1][2]);
      const length = start.distanceTo(end);
      if (length < 0.0001) continue;

      // a thin stick from start to end
      const stick = new THREE.CylinderGeometry(radius, radius, length, 5, 1);
      const direction = end.clone().sub(start).normalize();
      const turn = new THREE.Quaternion().setFromUnitVectors(up, direction);
      const middle = start.clone().add(end).multiplyScalar(0.5);
      stick.applyMatrix4(new THREE.Matrix4().compose(middle, turn, new THREE.Vector3(1, 1, 1)));
      pieces.push(stick);

      // a small ball at the end, so the corners have no gaps
      const ball = new THREE.SphereGeometry(radius, 5, 4);
      ball.translate(end.x, end.y, end.z);
      pieces.push(ball);
    }
  });

  const merged = mergeGeometries(pieces);
  pieces.forEach((piece) => piece.dispose());
  return merged;
}
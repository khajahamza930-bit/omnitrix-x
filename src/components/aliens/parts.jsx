import { useMemo } from "react";
import * as THREE from "three";
import { createLoft } from "../../utils/bodyShapes";
import { holoCore, holoRock, holoCrack, holoBright } from "../hologram/hologramMaterials";

// Small parts that every alien can use.

// a faint wireframe that can be drawn over a body part
export const wireMaterial = new THREE.MeshBasicMaterial({
  color: "#8dffa8",
  wireframe: true,
  transparent: true,
  opacity: 0.14,
  depthWrite: false,
});

// one ring of a body part
export function sec(x, y, z, rx, rz) {
  return { x, y, z, rx, rz };
}

// a smooth body part made from rings
export function BodyPart({ sections, segments = 10, material = holoCore, wire = false }) {
  const geometry = useMemo(
    () => createLoft(sections, segments),
    [sections, segments]
  );
  return (
    <group>
      <mesh geometry={geometry} material={material} />
      {wire && <mesh geometry={geometry} material={wireMaterial} />}
    </group>
  );
}

// an angular rock chunk
export function Plate({
  position,
  scale,
  rotation = [0, 0, 0],
  material = holoRock,
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} material={material}>
      <dodecahedronGeometry args={[1, 0]} />
    </mesh>
  );
}

// a round muscle bump. Its edge glows in the hologram, so it shows the muscle shape
export function Muscle({ position, scale, rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} material={holoCore}>
      <sphereGeometry args={[1, 14, 10]} />
    </mesh>
  );
}

// a thin glowing marking
export function Stripe({ position, size, rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={rotation} material={holoCrack}>
      <boxGeometry args={size} />
    </mesh>
  );
}
// the shape of the Omnitrix hourglass symbol
const hourglassShape = new THREE.Shape([
  new THREE.Vector2(-0.5, 0.6),
  new THREE.Vector2(0.5, 0.6),
  new THREE.Vector2(0.06, 0),
  new THREE.Vector2(0.5, -0.6),
  new THREE.Vector2(-0.5, -0.6),
  new THREE.Vector2(-0.06, 0),
]);

// the Omnitrix symbol, every alien wears it on the chest
export function OmnitrixSymbol({ position, size = 0.1 }) {
  return (
    <mesh position={position} scale={size} material={holoBright}>
      <shapeGeometry args={[hourglassShape]} />
    </mesh>
  );
}
import { useMemo } from "react";
import { createLoft } from "../../utils/bodyShapes";
import { holoCore, holoRock, holoCrack } from "../hologram/hologramMaterials";

// Small parts that every alien can use.

// one ring of a body part
export function sec(x, y, z, rx, rz) {
  return { x, y, z, rx, rz };
}

// a smooth body part made from rings
export function BodyPart({ sections, segments = 10, material = holoCore }) {
  const geometry = useMemo(
    () => createLoft(sections, segments),
    [sections, segments]
  );
  return <mesh geometry={geometry} material={material} />;
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
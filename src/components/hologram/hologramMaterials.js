import * as THREE from "three";

// Green Omnitrix hologram materials.
// Every alien uses these, so they all get the same look.
// Idea: green body + dark armor + bright cracks, so the shape stays readable.

// glowing body under the armor
export const holoCore = new THREE.MeshStandardMaterial({
  color: "#7fe83a",
  emissive: "#2fd90a",
  emissiveIntensity: 0.45,
  roughness: 0.45,
  flatShading: true,
});

// main armor / rock plates (dark, so they stand out from the body)
export const holoRock = new THREE.MeshStandardMaterial({
  color: "#0b4f22",
  emissive: "#03300c",
  emissiveIntensity: 0.5,
  roughness: 0.6,
  metalness: 0.15,
  flatShading: true,
});

// even darker plates
export const holoDarkRock = new THREE.MeshStandardMaterial({
  color: "#05301a",
  emissive: "#022a0c",
  emissiveIntensity: 0.5,
  roughness: 0.65,
  metalness: 0.2,
  flatShading: true,
});

// flames use vertex colors (the gradient comes from the geometry)
export const holoFlame = new THREE.MeshStandardMaterial({
  vertexColors: true,
  emissive: "#46f000",
  emissiveIntensity: 0.9,
  roughness: 0.4,
  side: THREE.DoubleSide,
});

// eyes, mouth, chest symbol
export const holoBright = new THREE.MeshBasicMaterial({
  color: "#f0ffc8",
});

// glowing magma cracks
export const holoCrack = new THREE.MeshBasicMaterial({
  color: "#e8ff80",
});
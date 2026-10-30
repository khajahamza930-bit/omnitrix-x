import * as THREE from "three";

// Green Omnitrix hologram materials.
// Every alien uses these, so they all get the same look.
// Idea: bright body + dark armor + very bright cracks, so the shape stays readable.

// glowing body under the armor
export const holoCore = new THREE.MeshStandardMaterial({
  color: "#a6ff4a",
  emissive: "#4cff12",
  emissiveIntensity: 0.8,
  roughness: 0.4,
  flatShading: true,
});

// main armor / rock plates (dark, so they stand out from the body)
export const holoRock = new THREE.MeshStandardMaterial({
  color: "#0d5a26",
  emissive: "#04380f",
  emissiveIntensity: 0.6,
  roughness: 0.6,
  metalness: 0.15,
  flatShading: true,
});

// even darker plates
export const holoDarkRock = new THREE.MeshStandardMaterial({
  color: "#06361a",
  emissive: "#022a0c",
  emissiveIntensity: 0.6,
  roughness: 0.65,
  metalness: 0.2,
  flatShading: true,
});

// flames use vertex colors (the gradient comes from the geometry)
export const holoFlame = new THREE.MeshStandardMaterial({
  vertexColors: true,
  emissive: "#5cff00",
  emissiveIntensity: 1.6,
  roughness: 0.35,
  side: THREE.DoubleSide,
});

// eyes, mouth, chest symbol
export const holoBright = new THREE.MeshBasicMaterial({
  color: "#f0ffc8",
});

// glowing magma cracks
export const holoCrack = new THREE.MeshBasicMaterial({
  color: "#d4ff70",
});
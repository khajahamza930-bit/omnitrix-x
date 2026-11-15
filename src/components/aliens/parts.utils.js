import * as THREE from "three";

// Shared geometry helper for alien body sections.
export function sec(x, y, z, rx, rz) {
  return { x, y, z, rx, rz };
}

// Faint wireframe drawn over selected body parts.
export const wireMaterial = new THREE.MeshBasicMaterial({
  color: "#8dffa8",
  wireframe: true,
  transparent: true,
  opacity: 0.14,
  depthWrite: false,
});

// Soft glow around body parts.
export const haloMaterial = new THREE.MeshBasicMaterial({
  color: "#7dffa0",
  transparent: true,
  opacity: 0.2,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
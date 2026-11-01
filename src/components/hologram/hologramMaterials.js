import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Hologram materials for all aliens.
// A hologram here means: see-through, bright glowing edges,
// faint moving lines and a tiny flicker.

// All materials share this time value, so they animate together.
export const holoTime = { value: 0 };

// Call this once inside the 3D scene to keep the time updated.
export function useHologramClock() {
  useFrame((state) => {
    holoTime.value = state.clock.elapsedTime;
  });
}

// ---------- shaders (small programs that run on the graphics card) ----------

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vWorldY;
  varying vec3 vVertexColor;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-viewPosition.xyz);
    vWorldY = (modelMatrix * vec4(position, 1.0)).y;

    #ifdef USE_COLOR
      vVertexColor = color;
    #else
      vVertexColor = vec3(1.0);
    #endif

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vWorldY;
  varying vec3 vVertexColor;

  void main() {
    // edges of the shape (facing away from the camera) glow brighter
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.0);

    vec3 base = uColor * vVertexColor;
    vec3 color = mix(base, uRim, rim);

    // thin lines that slowly move upward
    float lines = 0.88 + 0.12 * sin(vWorldY * 80.0 - uTime * 2.0);

    // tiny flicker
    float flicker = 0.95 + 0.05 * sin(uTime * 25.0);

    float alpha = (uOpacity + 0.15 + rim * 0.35) * lines * flicker;

    gl_FragColor = vec4(color * lines, alpha);

    #include <colorspace_fragment>
  }
`;

// makes one hologram material
function makeHoloMaterial({ color, rim, opacity, vertexColors = false, doubleSided = false }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: holoTime,
      uColor: { value: new THREE.Color(color) },
      uRim: { value: new THREE.Color(rim) },
      uOpacity: { value: opacity },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    vertexColors: vertexColors,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
}

// ---------- the materials the aliens use ----------

// glowing body, mostly see-through
export const holoCore = makeHoloMaterial({
  color: "#6bf06a",
  rim: "#c8ffd0",
  opacity: 0.5,
});

// rock plates, darker and less see-through
export const holoRock = makeHoloMaterial({
  color: "#0a5a24",
  rim: "#7dff9a",
  opacity: 0.92,
});

// even darker plates
export const holoDarkRock = makeHoloMaterial({
  color: "#063a1a",
  rim: "#5cff8a",
  opacity: 0.92,
});

// flames use the color gradient from the geometry
export const holoFlame = makeHoloMaterial({
  color: "#ffffff",
  rim: "#eaffc8",
  opacity: 0.75,
  vertexColors: true,
  doubleSided: true,
});

// eyes, teeth, chest symbol
export const holoBright = new THREE.MeshBasicMaterial({
  color: "#f0ffc8",
  toneMapped: false,
});

// glowing cracks
export const holoCrack = new THREE.MeshBasicMaterial({
  color: "#f4ffa0",
  toneMapped: false,
});
// bright glassy crystal, used by Diamondhead
export const holoCrystal = makeHoloMaterial({
  color: "#5fe8b4",
  rim: "#e0fff0",
  opacity: 0.55,
});
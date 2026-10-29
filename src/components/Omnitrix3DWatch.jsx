
import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Screw({ position }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 4]}>
      <cylinderGeometry args={[0.035, 0.035, 0.018, 16]} />
      <meshStandardMaterial color="#a5afa7" metalness={0.9} roughness={0.25} />
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.04, 0.008, 0.008]} />
        <meshStandardMaterial color="#171c18" metalness={0.7} />
      </mesh>
    </mesh>
  );
}

function WatchBody() {
  const screws = [
    [-0.72, 0.72, 0.22],
    [0.72, 0.72, 0.22],
    [-0.72, -0.72, 0.22],
    [0.72, -0.72, 0.22],
  ];

  return (
    <group>
      {/* Thick watch housing */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.32, 1.32, 0.34, 12]} />
        <meshStandardMaterial
          color="#222a24"
          metalness={0.92}
          roughness={0.27}
        />
      </mesh>

      {/* Outer armored rim */}
      <mesh position={[0, 0.185, 0]} castShadow>
        <cylinderGeometry args={[1.27, 1.27, 0.09, 48]} />
        <meshStandardMaterial
          color="#6b766d"
          metalness={0.95}
          roughness={0.24}
        />
      </mesh>

      {/* Dark inset face */}
      <mesh position={[0, 0.238, 0]}>
        <cylinderGeometry args={[1.17, 1.17, 0.055, 48]} />
        <meshStandardMaterial
          color="#101610"
          metalness={0.65}
          roughness={0.34}
        />
      </mesh>

      {/* Green energy ring */}
      <mesh position={[0, 0.276, 0]}>
        <torusGeometry args={[1.02, 0.035, 12, 64]} />
        <meshStandardMaterial
          color="#69ff39"
          emissive="#36e918"
          emissiveIntensity={1.5}
          metalness={0.3}
          roughness={0.22}
        />
      </mesh>

      {screws.map((position, index) => (
        <Screw key={index} position={position} />
      ))}

      {/* Side control buttons */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.28, 0.02, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.19, 24]} />
            <meshStandardMaterial
              color="#455147"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[side * 0.09, 0, 0]}>
            <sphereGeometry args={[0.095, 20, 16]} />
            <meshStandardMaterial
              color="#65ff3c"
              emissive="#2bff19"
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Hourglass() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.27, 0.32);
    s.lineTo(0.27, 0.32);
    s.lineTo(0.055, 0.04);
    s.lineTo(0.27, -0.32);
    s.lineTo(-0.27, -0.32);
    s.lineTo(-0.055, 0.04);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh position={[0, 0.34, 0.2]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color="#9aff68"
        emissive="#46ff24"
        emissiveIntensity={1.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AlienRotor({ aliens, selectedIndex, onSelect }) {
  const rotor = useRef();

  const count = aliens.length;
  const angle = count ? (Math.PI * 2) / count : 0;

  return (
    <group
      ref={rotor}
      rotation={[0, 0, count ? -selectedIndex * angle : 0]}
    >
      {aliens.map((alien, index) => {
        const a = index * angle;
        const x = Math.sin(a) * 0.82;
        const z = Math.cos(a) * 0.82;

        return (
          <group
            key={alien.id ?? alien.name}
            position={[x, 0.33, z]}
            rotation={[0, a, 0]}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(index);
            }}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.235, 0.255, 0.09, 32]} />
              <meshStandardMaterial
                color={index === selectedIndex ? "#77ff43" : "#303b30"}
                emissive={index === selectedIndex ? "#36ff18" : "#000000"}
                emissiveIntensity={index === selectedIndex ? 0.8 : 0}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>

            <mesh position={[0, 0.055, 0]}>
              <cylinderGeometry args={[0.19, 0.19, 0.025, 32]} />
              <meshStandardMaterial
                color="#101810"
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>

            {alien.image && (
              <AlienPortrait image={alien.image} />
            )}
          </group>
        );
      })}
    </group>
  );
}

function AlienPortrait({ image }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(image);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [image]);

  return (
    <mesh position={[0, 0.075, 0]}>
      <circleGeometry args={[0.15, 32]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function WatchScene({ aliens, selectedIndex, onSelect }) {
  const alien = aliens[selectedIndex];

  return (
    <>
      <color attach="background" args={["#070b08"]} />
      <ambientLight intensity={1.3} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={2.6}
        castShadow
      />
      <pointLight position={[-3, 2, -2]} intensity={35} color="#69ff42" />

      <group rotation={[-0.2, 0, 0.12]} position={[0, -0.05, 0]}>
        <WatchBody />

        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.59, 0.65, 0.09, 48]} />
          <meshStandardMaterial
            color="#19251a"
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>

        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.51, 0.51, 0.06, 48]} />
          <meshStandardMaterial
            color="#102112"
            emissive="#1a701c"
            emissiveIntensity={0.35}
            metalness={0.45}
            roughness={0.25}
          />
        </mesh>

        <AlienRotor
          aliens={aliens}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
        />

        <Hourglass />
      </group>

      {alien && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.001, 8, 8]} />
          <meshBasicMaterial color="#65ff3c" />
        </mesh>
      )}

      <ContactShadows
        position={[0, -0.42, 0]}
        opacity={0.55}
        scale={4}
        blur={2.5}
      />
      <Environment preset="studio" />
      <OrbitControls
        enablePan={false}
        minDistance={3.8}
        maxDistance={5.5}
        minPolarAngle={0.45}
        maxPolarAngle={1.45}
        enableDamping
      />
    </>
  );
}

export default function Omnitrix3DWatch({
  aliens = [],
  selectedIndex = 0,
  onSelect,
}) {
  return (
    <div style={{ width: "100%", height: "min(78vw, 520px)", minHeight: 320 }}>
      <Canvas
        shadows
        camera={{ position: [0, 3.1, 3.8], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.7]}
      >
        <WatchScene
          aliens={aliens}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
        />
      </Canvas>
    </div>
  );
}

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Points,
  PointsMaterial,
} from "three";
import { ContactShadows, Environment, Html } from "@react-three/drei";

import alienModels from "./aliens/index";

import "../styles/battle-arena.css";

// Presentation adjustments applied outside each alien model
const ALIEN_PRESENTATION = Object.freeze({
  1:  { scale: 1.00, position: [0, 0, 0], rotationY: 0 },
  2:  { scale: 1.25, position: [0, 0, 0], rotationY: 0 },
  3:  { scale: 0.88, position: [0, 0, 0], rotationY: -0.9 },
  4:  { scale: 1.00, position: [0, 0, 0], rotationY: 0 },
  5:  { scale: 0.95, position: [0, 0, 0], rotationY: 0 },
  6:  { scale: 1.05, position: [0, 0, 0], rotationY: 0 },
  7:  { scale: 1.15, position: [0, 0, 0], rotationY: 0 },
  8:  { scale: 1.00, position: [0, -0.18, 0], rotationY: 0 },
  9:  { scale: 1.75, position: [0, 0, 0], rotationY: 0 },
  10: { scale: 1.00, position: [0, 0, 0], rotationY: 0 },
  11: { scale: 1.30, position: [0, 0, 0], rotationY: 0 },
});

// Alien-specific attack effect configurations
const ALIEN_EFFECTS = Object.freeze({
  1: { // Heatblast
    color: "#ff682e",
    trailColor: "#ffb84d",
    particleColor: "#ff8833",
    type: "fire",
    projectileShape: "fireball",
  },
  2: { // Four Arms
    color: "#ffcc55",
    trailColor: "#ffdd88",
    particleColor: "#ffaa22",
    type: "physical",
    projectileShape: "fist",
  },
  3: { // XLR8
    color: "#4ddcff",
    trailColor: "#88efff",
    particleColor: "#00ffff",
    type: "speed",
    projectileShape: "blur",
  },
  4: { // Diamondhead
    color: "#75eaff",
    trailColor: "#aaffff",
    particleColor: "#88ffff",
    type: "crystal",
    projectileShape: "shard",
  },
  5: { // Upgrade
    color: "#44ff88",
    trailColor: "#88ffaa",
    particleColor: "#00ff66",
    type: "tech",
    projectileShape: "circuit",
  },
  6: { // Cannonbolt
    color: "#ffaa33",
    trailColor: "#ffcc66",
    particleColor: "#ff8800",
    type: "physical",
    projectileShape: "sphere",
  },
  7: { // Wildmutt
    color: "#ff8844",
    trailColor: "#ffaa77",
    particleColor: "#ff6622",
    type: "physical",
    projectileShape: "claw",
  },
  8: { // Ripjaws
    color: "#33aaff",
    trailColor: "#66ccff",
    particleColor: "#0088ff",
    type: "water",
    projectileShape: "torpedo",
  },
  9: { // Grey Matter
    color: "#88ff44",
    trailColor: "#aaff88",
    particleColor: "#66ff00",
    type: "tech",
    projectileShape: "pulse",
  },
  10: { // Stinkfly
    color: "#aaff33",
    trailColor: "#ccff66",
    particleColor: "#88ff00",
    type: "bio",
    projectileShape: "goo",
  },
  11: { // Ghostfreak
    color: "#b58aff",
    trailColor: "#ccbbff",
    particleColor: "#aa88ff",
    type: "ghost",
    projectileShape: "spectral",
  },
});

function ArenaFloor() {
  const pylons = [
    [-5.05, -3.1],
    [5.05, -3.1],
    [-5.05, 3.1],
    [5.05, 3.1],
  ];

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.27, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial
          color="#050907"
          metalness={0.35}
          roughness={0.9}
        />
      </mesh>

      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[5.85, 6.05, 0.18, 64]} />
        <meshStandardMaterial
          color="#111b15"
          metalness={0.88}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[5.65, 5.85, 0.08, 64]} />
        <meshStandardMaterial
          color="#17231b"
          metalness={0.72}
          roughness={0.42}
        />
      </mesh>

      <gridHelper
        args={[24, 32, "#31583b", "#192b20"]}
        position={[0, -0.17, 0]}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.047, 0]}
      >
        <ringGeometry args={[5.3, 5.38, 96]} />
        <meshBasicMaterial
          color="#91ff52"
          transparent
          opacity={0.85}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.046, 0]}
      >
        <ringGeometry args={[5.48, 5.51, 96]} />
        <meshBasicMaterial
          color="#3c8050"
          transparent
          opacity={0.55}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.046, 0]}
      >
        <ringGeometry args={[3.05, 3.09, 96]} />
        <meshBasicMaterial
          color="#70db58"
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.045, 0]}
      >
        <ringGeometry args={[3.7, 3.72, 96]} />
        <meshBasicMaterial
          color="#3c8650"
          transparent
          opacity={0.42}
        />
      </mesh>

      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        const radius = 4.55;

        return (
          <mesh
            key={index}
            position={[
              Math.sin(angle) * radius,
              0.05,
              Math.cos(angle) * radius,
            ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.035, 0.012, 0.72]} />
            <meshBasicMaterial
              color="#65bd62"
              transparent
              opacity={0.58}
            />
          </mesh>
        );
      })}

      {pylons.map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 0.18, 8]} />
            <meshStandardMaterial
              color="#26382b"
              metalness={0.9}
              roughness={0.28}
            />
          </mesh>

          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.16, 1.12, 8]} />
            <meshStandardMaterial
              color="#17251b"
              metalness={0.85}
              roughness={0.32}
            />
          </mesh>

          <mesh position={[0, 0.72, 0.105]}>
            <boxGeometry args={[0.045, 0.72, 0.035]} />
            <meshBasicMaterial
              color="#a1ff48"
              emissive="#70ff35"
              emissiveIntensity={1.6}
            />
          </mesh>

          <pointLight
            position={[0, 0.85, 0]}
            color="#79ff58"
            intensity={0.7}
            distance={3.2}
          />
        </group>
      ))}
    </group>
  );
}

function FighterPlatform({ position, active }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.16, 8]} />
        <meshStandardMaterial
          color="#18251d"
          metalness={0.85}
          roughness={0.32}
        />
      </mesh>

      <mesh position={[0, 0.105, 0]}>
        <torusGeometry args={[1.08, 0.025, 8, 64]} />
        <meshBasicMaterial
          color={active ? "#a1ff48" : "#39734b"}
          transparent
          opacity={active ? 0.95 : 0.48}
        />
      </mesh>

      <pointLight
        position={[0, 0.35, 0]}
        color={active ? "#8dff46" : "#367d50"}
        intensity={active ? 1.2 : 0.45}
        distance={3}
      />
    </group>
  );
}

function FighterModel({ alien, side, playerId, battleEvent }){
  const group = useRef();
  const animation = useRef({
    sequence: 0,
    startedAt: 0,
    kind: null,
    attackType: "basic",
  });

  const Model = alien ? alienModels[alien.id] : null;
  const presentation =
    ALIEN_PRESENTATION[alien?.id] || {
      scale: 1,
      position: [0, 0, 0],
      rotationY: 0,
    };

  useFrame((state) => {
    if (!group.current) return;

    const time = state.clock.elapsedTime;

    if (
      battleEvent?.sequence &&
      animation.current.sequence !== battleEvent.sequence
    ) {
      animation.current = {
        sequence: battleEvent.sequence,
        startedAt: time,
        kind:
          playerId === battleEvent.attackerId
            ? "attack"
            : playerId === battleEvent.defenderId
              ? "hit"
              : null,
        attackType: battleEvent.attackType || "basic",
      };
    }

    const current = animation.current;
    const isUltimate = current.attackType === "ultimate";
    const isSpecial = current.attackType === "special";

    const duration =
      current.kind === "hit"
        ? isUltimate ? 1.35 : isSpecial ? 1.15 : 0.95
        : 0.72;

    const elapsed = time - current.startedAt;
    const progress = Math.min(elapsed / duration, 1);
    const intensity = Math.sin(Math.PI * Math.pow(progress, 0.72));

    let horizontalOffset = 0;
    let verticalOffset = 0;
    let tilt = 0;
    let twist = 0;
    let squash = 0;

    if (current.kind === "attack" && elapsed <= duration) {
      horizontalOffset = -side * 0.72 * intensity;
      tilt = -side * 0.12 * intensity;
    } else if (current.kind === "hit" && elapsed <= duration){
      const knockback = isUltimate ? 1.45 : isSpecial ? 1.12 : 0.82;
      const lift = isUltimate ? 0.52 : isSpecial ? 0.38 : 0.25;
      const recoilTilt = isUltimate ? 0.68 : isSpecial ? 0.50: 0.36;
      const bodyTwist = isUltimate ? 0.32 : isSpecial ? 0.23 : 0.15;

      horizontalOffset = side * knockback * intensity;
      verticalOffset = lift * intensity;
      tilt = side * recoilTilt * intensity;
      twist = -side * bodyTwist * intensity;
      squash = (isUltimate ? 0.20 : isSpecial ? 0.14 : 0.09) * intensity;
    } else if (elapsed > duration) {
      current.kind = null;
    }

    group.current.position.x = side * 1.95 + horizontalOffset;
    group.current.position.y =
      0.18 + Math.sin(time * 1.4 + side) * 0.025 + verticalOffset;

    group.current.rotation.x = twist;
    group.current.rotation.z = tilt;

    group.current.scale.set(
      1 - squash * 0.55,
      1 + squash,
      1 - squash * 0.35
    );
  });

  return (
    <group
      ref={group}
      position={[side * 1.95, 0.18, 0]}
      rotation={[0, side === -1 ? Math.PI / 2 : -Math.PI / 2,0]}
    >
      {Model ? (
        <Suspense fallback={
  <mesh position={[0, 1, 0]}>
    <icosahedronGeometry args={[0.65, 1]} />
    <meshStandardMaterial
      color="#8dff46"
      wireframe
      emissive="#367d32"
    />
  </mesh>
}>
          <group position={presentation.position} rotation={[0, presentation.rotationY, 0]} scale={1.05 * presentation.scale}>
            <Model />
          </group>
        </Suspense>
      ) : (
        <mesh position={[0, 1, 0]}>
          <icosahedronGeometry args={[0.65, 1]} />
          <meshStandardMaterial
            color="#8dff46"
            wireframe
            emissive="#367d32"
          />
        </mesh>
      )}
    </group>
  );
}

// take a burst of particles out of the scene and free its memory
function removeBurst(burst) {
  burst.scene.remove(burst.points);
  burst.geometry.dispose();
  burst.material.dispose();
}

// Particle system for attack effects
// a new burst starts every time burstId changes
function AttackParticles({
  burstId,
  count = 20,
  color = "#a5ff38",
  position = [0, 1, 0],
  size = 0.15,
  speed = 1.0,
  spread = 1.0,
  gravity = -0.5,
  lifetime = 1.0,
}) {
  // all bursts that are alive right now (this array is never replaced)
  const bursts = useRef([]);
  const lastBurstId = useRef(null);
  const lastTime = useRef(0);

  // when this component goes away, clean up the particles
  useEffect(() => {
    const aliveBursts = bursts.current;

    return () => {
      aliveBursts.forEach(removeBurst);
      aliveBursts.length = 0;
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // time since the last frame (we measure it here so it is always correct)
    if (lastTime.current === 0) lastTime.current = time;
    const delta = Math.min(time - lastTime.current, 0.1);
    lastTime.current = time;

    // a new attack happened, so start a new burst
    if (burstId && burstId !== lastBurstId.current) {
      lastBurstId.current = burstId;

      const baseColor = new Color(color);
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const lifetimes = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.acos(2 * Math.random() - 1);
        const speedVar = (0.5 + Math.random() * 0.5) * speed;

        positions[i * 3] = position[0];
        positions[i * 3 + 1] = position[1];
        positions[i * 3 + 2] = position[2];

        velocities[i * 3] = Math.sin(angle2) * Math.cos(angle1) * speedVar * spread;
        velocities[i * 3 + 1] = Math.cos(angle2) * speedVar * spread + 2;
        velocities[i * 3 + 2] = Math.sin(angle2) * Math.sin(angle1) * speedVar * spread;

        lifetimes[i] = 0.3 + Math.random() * 0.7;

        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;
      }

      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(positions, 3));
      geometry.setAttribute("color", new BufferAttribute(colors, 3));

      const material = new PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new Points(geometry, material);
      // the particles move after they are created, so do not hide them by mistake
      points.frustumCulled = false;
      state.scene.add(points);

      bursts.current.push({
        points,
        geometry,
        material,
        scene: state.scene,
        velocities,
        lifetimes,
        startTime: time,
      });
    }

    // move the particles, and remove bursts that are finished
    for (let b = bursts.current.length - 1; b >= 0; b--) {
      const burst = bursts.current[b];
      const elapsed = time - burst.startTime;

      if (elapsed > lifetime) {
        removeBurst(burst);
        bursts.current.splice(b, 1);
        continue;
      }

      const positions = burst.geometry.attributes.position.array;
      const total = positions.length / 3;

      for (let i = 0; i < total; i++) {
        if (elapsed > burst.lifetimes[i]) continue;

        positions[i * 3] += burst.velocities[i * 3] * delta;
        positions[i * 3 + 1] += burst.velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += burst.velocities[i * 3 + 2] * delta;

        burst.velocities[i * 3 + 1] += gravity * delta;
      }

      burst.geometry.attributes.position.needsUpdate = true;
      burst.material.size = size * (1 - elapsed / lifetime);
      burst.material.opacity = 0.9 * (1 - elapsed / lifetime);
    }
  });

  return null;
}

// Enhanced CombatEffect with alien-specific visuals
function CombatEffect({ players, battleEvent, aliens }) {
  const projectile = useRef();
  const projectileLight = useRef();
  const impact = useRef();
  const impactMaterial = useRef();
  const flash = useRef();
  const flashMaterial = useRef();
  const burstRing = useRef();
  const burstRingMaterial = useRef();
  const shockwave = useRef();
  const shockwaveMaterial = useRef();

  // which attack is playing and when it started
  const animation = useRef({ sequence: 0, startedAt: 0 });

  // work out how this attack should look (straight from the props)
  const attackerIndex = players.findIndex(
    (player) => player.id === battleEvent?.attackerId
  );
  const attacker = players[attackerIndex];
  const attackerAlien = aliens.find(
    (alien) => alien.name.toLowerCase() === attacker?.alien?.toLowerCase()
  );
  const effectConfig = ALIEN_EFFECTS[attackerAlien?.id] || ALIEN_EFFECTS[1];
  const attackerSide = attackerIndex === 1 ? 1 : -1;
  const attackType = battleEvent?.attackType || "basic";

  let particleCount = 25;
  if (attackType === "ultimate") particleCount = 60;
  else if (attackType === "special") particleCount = 40;

  useFrame((state) => {
    if (!battleEvent?.sequence) return;

    const time = state.clock.elapsedTime;

    // a new attack started, so remember when it began
    if (animation.current.sequence !== battleEvent.sequence) {
      animation.current = { sequence: battleEvent.sequence, startedAt: time };
    }

    const elapsed = time - animation.current.startedAt;

    const duration =
      attackType === "ultimate"
        ? 1.65
        : attackType === "special"
          ? 1.25
          : 1.05;

    const progress = Math.min(elapsed / duration, 1);
    const projectileProgress = Math.min(progress / 0.55, 1);
    const impactProgress = Math.max(
      0,
      Math.min((progress - 0.52) / 0.48, 1)
    );

    const startX = attackerSide * 1.95;
    const endX = -attackerSide * 1.95;

    const projectileScale =
      attackType === "ultimate"
        ? 0.5
        : attackType === "special"
          ? 0.34
          : 0.24;

    const shockwaveScale =
      attackType === "ultimate"
        ? 3.8
        : attackType === "special"
          ? 2.8
          : 2.0;

    const impactActive = elapsed >= duration * 0.52 && elapsed <= duration;

    // Projectile animation
    if (projectile.current) {
      projectile.current.visible = elapsed <= duration * 0.55;

      // Different projectile paths based on the alien
      let yOffset = Math.sin(projectileProgress * Math.PI) * 0.65;
      if (effectConfig.type === "speed") {
        yOffset = Math.sin(projectileProgress * Math.PI * 2) * 0.3;
      } else if (effectConfig.type === "ghost") {
        yOffset = Math.sin(projectileProgress * Math.PI) * 0.8 + Math.sin(time * 10) * 0.1;
      }

      projectile.current.position.set(
        startX + (endX - startX) * projectileProgress,
        1.05 + yOffset,
        0.45 + Math.sin(projectileProgress * Math.PI * 3) * 0.15
      );

      projectile.current.scale.setScalar(projectileScale);
      projectile.current.rotation.y = time * 5;
      projectile.current.rotation.x = time * 3;

      if (projectileLight.current) {
        projectileLight.current.position.copy(projectile.current.position);
        projectileLight.current.intensity =
          projectile.current.visible
            ? attackType === "ultimate" ? 7 : 4
            : 0;
      }
    }

    // Impact effects
    if (impact.current) {
      impact.current.visible = impactActive;
      impact.current.position.set(endX, 0.23, 0.35);
      impact.current.scale.setScalar(
        0.35 + impactProgress * shockwaveScale
      );
      impact.current.rotation.z = time * (attackType === "ultimate" ? 2 : 1);

      if (impactMaterial.current) {
        impactMaterial.current.opacity = 0.95 * (1 - impactProgress);
      }
    }

    // Shockwave ring
    if (shockwave.current) {
      shockwave.current.visible = impactActive;
      shockwave.current.position.set(endX, 0.15, 0.35);
      shockwave.current.scale.setScalar(
        0.5 + impactProgress * shockwaveScale * 1.2
      );
      shockwave.current.rotation.x = -Math.PI / 2;

      if (shockwaveMaterial.current) {
        shockwaveMaterial.current.opacity = 0.6 * (1 - impactProgress);
      }
    }

    // Flash
    if (flash.current) {
      flash.current.visible = impactActive;
      flash.current.position.set(endX, 1.05, 0.45);

      const flashScale =
        0.2 +
        Math.sin(impactProgress * Math.PI) *
          (attackType === "ultimate" ? 2.0 : 1.35);

      flash.current.scale.setScalar(flashScale);

      if (flashMaterial.current) {
        flashMaterial.current.opacity =
          Math.sin(impactProgress * Math.PI) * 0.95;
      }
    }

    // Burst ring
    if (burstRing.current) {
      burstRing.current.visible = impactActive;
      burstRing.current.position.set(endX, 1.05, 0.4);
      burstRing.current.scale.setScalar(
        0.3 + impactProgress * shockwaveScale * 0.7
      );
      burstRing.current.rotation.x = Math.sin(time * 20) * 0.2;

      if (burstRingMaterial.current) {
        burstRingMaterial.current.opacity =
          0.95 * (1 - impactProgress);
      }
    }

    if (elapsed >= duration) {
      if (projectile.current) projectile.current.visible = false;
      if (impact.current) impact.current.visible = false;
      if (flash.current) flash.current.visible = false;
      if (burstRing.current) burstRing.current.visible = false;
      if (shockwave.current) shockwave.current.visible = false;
    }

    // Camera shake
    const shakeStrength =
      attackType === "ultimate"
        ? 0.38
        : attackType === "special"
          ? 0.24
          : 0.13;

    const shake = impactActive
      ? Math.sin(impactProgress * Math.PI * 8) *
        shakeStrength *
        (1 - impactProgress)
      : 0;

    const cameraLift = impactActive
      ? Math.abs(Math.sin(impactProgress * Math.PI * 8)) *
        shakeStrength * 0.35
      : 0;

    const cameraPunch = impactActive
      ? Math.sin(impactProgress * Math.PI) *
        shakeStrength * 0.9
      : 0;

    state.camera.position.x = shake;
    state.camera.position.y = 3.4 + cameraLift;
    state.camera.position.z = 8.8 - cameraPunch;
  });

  // the shape of the projectile depends on the alien
  const isFire = effectConfig.type === "fire";
  const isSpeed = effectConfig.type === "speed";
  const isCrystal = effectConfig.type === "crystal";
  const isGhost = effectConfig.type === "ghost";

  return (
    <>
      {/* Projectile */}
      <group>
        <mesh ref={projectile} visible={false}>
          {isFire && (
            <>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial
                color={effectConfig.color}
                toneMapped={false}
              />
            </>
          )}
          {isCrystal && (
            <>
              <octahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial
                color={effectConfig.color}
                emissive={effectConfig.color}
                emissiveIntensity={1.5}
                metalness={0.3}
                roughness={0.4}
              />
            </>
          )}
          {isSpeed && (
            <>
              <capsuleGeometry args={[0.3, 1.5, 8, 16]} />
              <meshBasicMaterial
                color={effectConfig.color}
                transparent
                opacity={0.8}
                toneMapped={false}
              />
            </>
          )}
          {isGhost && (
            <>
              <torusGeometry args={[0.6, 0.15, 8, 32]} />
              <meshBasicMaterial
                color={effectConfig.color}
                transparent
                opacity={0.7}
                side={DoubleSide}
                toneMapped={false}
              />
            </>
          )}
          {!isFire && !isCrystal && !isSpeed && !isGhost && (
            <>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial
                color={effectConfig.color}
                toneMapped={false}
              />
            </>
          )}
        </mesh>

        <pointLight
          ref={projectileLight}
          color={effectConfig.color}
          intensity={0}
          distance={5}
        />
      </group>

      {/* Impact shockwave */}
      <mesh
        ref={shockwave}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.45, 0.62, 64]} />
        <meshBasicMaterial
          ref={shockwaveMaterial}
          color={effectConfig.color}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={impact}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.45, 0.62, 64]} />
        <meshBasicMaterial
          ref={impactMaterial}
          color={effectConfig.color}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial
          ref={flashMaterial}
          color={effectConfig.color}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={burstRing} visible={false}>
        <torusGeometry args={[0.7, 0.055, 12, 64]} />
        <meshBasicMaterial
          ref={burstRingMaterial}
          color={effectConfig.color}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Attack particles: a new burst starts for every attack */}
      <AttackParticles
        burstId={battleEvent?.sequence}
        count={particleCount}
        color={effectConfig.particleColor}
        position={[attackerSide * 1.95, 1.05, 0.45]}
        size={0.12}
        speed={1.5}
        spread={1.2}
        gravity={-0.3}
        lifetime={1.2}
      />
    </>
  );
}

function BattleScene({ players, aliens, currentTurnPlayerId, battleEvent }) {
  return (
    <>
      <color attach="background" args={["#070d09"]} />

      <ambientLight intensity={0.8} />
      <hemisphereLight
        args={["#a9ffc2", "#07100b", 0.8]}
      />

      <directionalLight
        position={[3, 7, 5]}
        intensity={2}
        castShadow
      />

      <pointLight
        position={[0, 3, -3]}
        color="#4dff78"
        intensity={2}
        distance={12}
      />

      <ArenaFloor />
      <CombatEffect players={players} battleEvent={battleEvent} aliens={aliens} />

      {players.map((player, index) => {
        const side = index === 0 ? -1 : 1;
        const alien = aliens.find(
      (item) =>
        item.name.toLowerCase() === (player.alien || "").toLowerCase()
    );
        const active = player.id === currentTurnPlayerId;

        return (
          <group key={player.id}>
            <FighterPlatform
              position={[side * 1.95, 0, 0]}
              active={active}
            />
            <FighterModel alien={alien} side={side} playerId={player.id} battleEvent={battleEvent} />
          </group>
        );
      })}

      <ContactShadows
        position={[0, 0.015, 0]}
        opacity={0.35}
        scale={12}
        blur={2.8}
        far={5}
      />

      <Environment preset="city" />
    </>
  );
}

function StatusMeter({ label, value, type }) {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className={`ox-arena-meter ox-arena-meter--${type}`}>
      <div className="ox-arena-meter__label">
        <span>{label}</span>
        <strong>{safeValue}/100</strong>
      </div>

      <div
        className="ox-arena-meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

// Victory/Defeat overlay component
function BattleResult({ winner, myId, onAcknowledge }) {
  const isVictory = winner.winnerId === myId;
  const group = useRef();

  useFrame((state) => {
    if (group.current) {
      const time = state.clock.elapsedTime;
      group.current.rotation.y = Math.sin(time * 0.3) * 0.05;
      group.current.position.y = Math.sin(time * 1.5) * 0.02;
    }
  });

  return (
    <Html
      transform
      position={[0, 2.5, 0]}
      prepend
      sprite
      distanceFactor={10}
      zIndexRange={[100, 100]}
    >
      <div
        ref={group}
        className={`ox-battle-result ${isVictory ? "ox-battle-result--victory" : "ox-battle-result--defeat"}`}
        role="status"
        aria-live="polite"
        onClick={onAcknowledge}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div className="ox-battle-result__bg" />
        <div className="ox-battle-result__content">
          <div className="ox-battle-result__icon">
            {isVictory ? "\u{1F3C6}" : "\u{1F480}"}
          </div>
          <h2 className="ox-battle-result__title">
            {isVictory ? "VICTORY" : "DEFEAT"}
          </h2>
          <p className="ox-battle-result__winner">
            {isVictory 
              ? "You have prevailed!" 
              : `${winner.winnerName || "Opponent"} wins!`}
          </p>
          <span className="ox-battle-result__hint">Click to continue</span>
        </div>
      </div>
    </Html>
  );
}

export default function BattleArena3D({
  room,
  myId,
  canAttack,
  currentTurnName,
  battleWinner,
  battleEvent,
  aliens = [],
}) {
  const players = room?.players || [];
  // remember which result the player already closed
  const [closedWinner, setClosedWinner] = useState(null);
  const showResult = Boolean(battleWinner) && closedWinner !== battleWinner;

  if (!room || players.length !== 2) {
    return null;
  }

  const currentTurnPlayer = players.find(
    (player) => player.id === room.currentTurnPlayerId
  );

  return (
    <section className="ox-arena" aria-label="3D battle arena">
      <header className="ox-arena__header">
        <div>
          <span className="ox-arena__eyebrow">
            OMNITRIX X / COMBAT SYSTEM
          </span>
          <h2 className="ox-arena__title">Battle arena</h2>
        </div>

        <span className="ox-arena__room">
          ROOM {room.code}
        </span>
      </header>

      <div className="ox-arena__stage">
        <div className="ox-arena__fighter-info">
          {players.map((player) => (
            <div
              className={`ox-arena__player ${
                player.id === room.currentTurnPlayerId
                  ? "ox-arena__player--active"
                  : ""
              }`}
              key={player.id}
            >
              <div className="ox-arena__player-top">
                <span>
                  {player.id === myId ? "YOU" : "OPPONENT"}
                </span>
                {player.id === room.currentTurnPlayerId && (
                  <span className="ox-arena__active-tag">
                    ACTIVE
                  </span>
                )}
              </div>

              <strong className="ox-arena__player-name">
                {player.name}
              </strong>

              <span className="ox-arena__alien-name">
                {player.alien || "Alien not selected"}
              </span>

              <StatusMeter
                label="HEALTH"
                value={player.health}
                type="health"
              />

              <StatusMeter
                label="ENERGY"
                value={player.energy}
                type="energy"
              />
            </div>
          ))}
        </div>

        <div className="ox-arena__canvas">
          <Canvas
            camera={{ position: [0, 3.4, 8.8], fov: 38 }}
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false }}
          >
            <BattleScene
              players={players}
              aliens={aliens}
              currentTurnPlayerId={room.currentTurnPlayerId}
              battleEvent={battleEvent}
            />
            {showResult && battleWinner && (
              <BattleResult
                winner={battleWinner}
                myId={myId}
                onAcknowledge={() => setClosedWinner(battleWinner)}
              />
            )}
          </Canvas>

          <div className="ox-arena__versus" aria-hidden="true">
            VS
          </div>
        </div>

        <div className="ox-arena__turn">
          <span className="ox-arena__turn-light" />
          {battleWinner && !showResult
            ? "BATTLE COMPLETE"
            : canAttack
              ? "YOUR TURN"
              : `${currentTurnName || currentTurnPlayer?.name|| "OPPONENT"}'S TURN`}
        </div>
      </div>

      {battleWinner && !showResult && (
        <div className="ox-arena__result" role="status">
          {battleWinner.winnerId === myId
            ? "VICTORY"
            : `${battleWinner.winnerName || "OPPONENT"} WINS`}
        </div>
      )}
    </section>
  );
}
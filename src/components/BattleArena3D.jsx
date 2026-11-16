import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";

import alienModels from "./aliens/index";

import "../styles/battle-arena.css";

// Presentation adjustments are applied outside each alien's
// original model so their internal animations remain untouched.
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

function ArenaFloor() {
  const pylons = [
    [-5.05, -3.1],
    [5.05, -3.1],
    [-5.05, 3.1],
    [5.05, 3.1],
  ];

  return (
    <group>
      {/* Large arena foundation */}
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

      {/* Raised metallic combat deck */}
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[5.85, 6.05, 0.18, 64]} />
        <meshStandardMaterial
          color="#111b15"
          metalness={0.88}
          roughness={0.3}
        />
      </mesh>

      {/* Upper deck surface */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[5.65, 5.85, 0.08, 64]} />
        <meshStandardMaterial
          color="#17231b"
          metalness={0.72}
          roughness={0.42}
        />
      </mesh>

      {/* Recessed floor grid */}
      <gridHelper
        args={[24, 32, "#31583b", "#192b20"]}
        position={[0, -0.17, 0]}
      />

      {/* Outer illuminated arena boundaries */}
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

      {/* Inner combat-zone rings */}
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

      {/* Sixteen radial deck markings */}
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

      {/* Four illuminated perimeter pylons */}
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

function FighterModel({ alien, side, playerId, battleEvent }) {
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
    } else if (current.kind === "hit" && elapsed <= duration) {
      const knockback = isUltimate ? 1.45 : isSpecial ? 1.12 : 0.82;
      const lift = isUltimate ? 0.52 : isSpecial ? 0.38 : 0.25;
      const recoilTilt = isUltimate ? 0.68 : isSpecial ? 0.50 : 0.36;
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
      rotation={[0, side === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}
    >
      {Model ? (
        <Suspense fallback={null}>
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
function CombatEffect({ players, battleEvent }) {
  const projectile = useRef();
  const projectileMaterial = useRef();
  const projectileLight = useRef();
  const impact = useRef();
  const impactMaterial = useRef();
  const flash = useRef();
  const flashMaterial = useRef();
  const burstRing = useRef();
  const burstRingMaterial = useRef();

  const animation = useRef({
    sequence: 0,
    startedAt: 0,
    attackerSide: -1,
    attackType: "basic",
  });

  useFrame((state) => {
    if (!battleEvent?.sequence) return;

    const time = state.clock.elapsedTime;

    if (animation.current.sequence !== battleEvent.sequence) {
      const attackerIndex = players.findIndex(
        (player) => player.id === battleEvent.attackerId
      );

      animation.current = {
        sequence: battleEvent.sequence,
        startedAt: time,
        attackerSide: attackerIndex === 1 ? 1 : -1,
        attackType: battleEvent.attackType || "basic",
      };

      const attackId = String(battleEvent.attackId || "").toLowerCase();
      let effectColor = "#ffb45e";

      if (/fire|inferno|flame/.test(attackId)) {
        effectColor = "#ff682e";
      } else if (/crystal|diamond/.test(attackId)) {
        effectColor = "#75eaff";
      } else if (/ghost|phantom|spectral/.test(attackId)) {
        effectColor = "#b58aff";
      } else if (battleEvent.attackType === "ultimate") {
        effectColor = "#c9ff45";
      } else if (battleEvent.attackType === "special") {
        effectColor = "#4ddcff";
      }

      projectileMaterial.current?.color.set(effectColor);
      impactMaterial.current?.color.set(effectColor);
      flashMaterial.current?.color.set(effectColor);
      burstRingMaterial.current?.color.set(effectColor);
    }

    const current = animation.current;
    const elapsed = time - current.startedAt;

    const duration =
      current.attackType === "ultimate"
        ? 1.65
        : current.attackType === "special"
          ? 1.25
          : 1.05;

    const progress = Math.min(elapsed / duration, 1);
    const projectileProgress = Math.min(progress / 0.55, 1);
    const impactProgress = Math.max(
      0,
      Math.min((progress - 0.52) / 0.48, 1)
    );

    const startX = current.attackerSide * 1.95;
    const endX = -current.attackerSide * 1.95;

    const projectileScale =
      current.attackType === "ultimate"
        ? 0.5
        : current.attackType === "special"
          ? 0.34
          : 0.24;

    const shockwaveScale =
      current.attackType === "ultimate"
        ? 3.8
        : current.attackType === "special"
          ? 2.8
          : 2.0;

    const impactActive = elapsed >= duration * 0.52 && elapsed <= duration;

    if (projectile.current) {
      projectile.current.visible = elapsed <= duration * 0.55;

      projectile.current.position.set(
        startX + (endX - startX) * projectileProgress,
        1.05 + Math.sin(projectileProgress * Math.PI) * 0.65,
        0.45
      );

      projectile.current.scale.setScalar(projectileScale);

      if (projectileLight.current) {
        projectileLight.current.position.copy(projectile.current.position);
        projectileLight.current.intensity =
          projectile.current.visible
            ? current.attackType === "ultimate" ? 7 : 4
            : 0;
      }
    }

    if (impact.current) {
      impact.current.visible = impactActive;
      impact.current.position.set(endX, 0.23, 0.35);
      impact.current.scale.setScalar(
        0.35 + impactProgress * shockwaveScale
      );

      if (impactMaterial.current) {
        impactMaterial.current.opacity = 0.95 * (1 - impactProgress);
      }
    }

    if (flash.current) {
      flash.current.visible = impactActive;
      flash.current.position.set(endX, 1.05, 0.45);

      const flashScale =
        0.2 +
        Math.sin(impactProgress * Math.PI) *
          (current.attackType === "ultimate" ? 2.0 : 1.35);

      flash.current.scale.setScalar(flashScale);

      if (flashMaterial.current) {
        flashMaterial.current.opacity =
          Math.sin(impactProgress * Math.PI) * 0.95;
      }
    }

    if (burstRing.current) {
      burstRing.current.visible = impactActive;
      burstRing.current.position.set(endX, 1.05, 0.4);
      burstRing.current.scale.setScalar(
        0.3 + impactProgress * shockwaveScale * 0.7
      );

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
    }

    const shakeStrength =
      current.attackType === "ultimate"
        ? 0.38
        : current.attackType === "special"
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

  return (
    <>
      <mesh ref={projectile} visible={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          ref={projectileMaterial}
          color="#ffb45e"
          toneMapped={false}
        />
      </mesh>

      <pointLight
        ref={projectileLight}
        color="#ffb45e"
        intensity={0}
        distance={5}
      />

      <mesh
        ref={impact}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.45, 0.62, 64]} />
        <meshBasicMaterial
          ref={impactMaterial}
          color="#ffb45e"
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
          color="#ffb45e"
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
          color="#ffb45e"
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
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
      <CombatEffect players={players} battleEvent={battleEvent} />

      {players.map((player, index) => {
        const side = index === 0 ? -1 : 1;
        const alien = aliens.find(
          (item) =>
            item.name.toLowerCase() === player.alien?.toLowerCase()
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
          </Canvas>

          <div className="ox-arena__versus" aria-hidden="true">
            VS
          </div>
        </div>

        <div className="ox-arena__turn">
          <span className="ox-arena__turn-light" />
          {battleWinner
            ? "BATTLE COMPLETE"
            : canAttack
              ? "YOUR TURN"
              : `${currentTurnName || currentTurnPlayer?.name || "OPPONENT"}'S TURN`}
        </div>
      </div>

      {battleWinner && (
        <div className="ox-arena__result" role="status">
          {battleWinner.winnerId === myId
            ? "VICTORY"
            : `${battleWinner.winnerName || "OPPONENT"} WINS`}
        </div>
      )}
    </section>
  );
}

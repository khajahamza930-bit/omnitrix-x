const ENERGY_CONFIG = Object.freeze({
  MAX: 100,
  START: 50,
  REGEN_PER_TURN: 10,
});

function canAffordMove(player, move) {
  return (
    Number.isInteger(player?.energy) &&
    Number.isInteger(move?.energyCost) &&
    move.energyCost >= 0 &&
    player.energy >= move.energyCost
  );
}

function spendEnergy(player, move) {
  if (!canAffordMove(player, move)) return false;

  player.energy -= move.energyCost;
  return true;
}

function regenerateEnergy(player) {
  if (!player || !Number.isInteger(player.energy)) return false;

  player.energy = Math.min(
    ENERGY_CONFIG.MAX,
    player.energy + ENERGY_CONFIG.REGEN_PER_TURN
  );

  return player.energy;
}

const combatDefinitions = {
  "Heatblast": [
    { id: "fire-punch", name: "Fire Punch", type: "basic", damage: 12, energyCost: 0, description: "A focused flame-powered strike." },
    { id: "fireball", name: "Fireball", type: "special", damage: 20, energyCost: 20, description: "Launches a concentrated fireball." },
    { id: "inferno-burst", name: "Inferno Burst", type: "ultimate", damage: 30, energyCost: 40, description: "Unleashes an explosive wave of fire." }
  ],
  "Four Arms": [
    { id: "heavy-punch", name: "Heavy Punch", type: "basic", damage: 14, energyCost: 0, description: "A powerful four-armed punch." },
    { id: "ground-slam", name: "Ground Slam", type: "special", damage: 22, energyCost: 20, description: "Smashes the ground with tremendous force." },
    { id: "titan-smash", name: "Titan Smash", type: "ultimate", damage: 32, energyCost: 40, description: "A devastating full-strength assault." }
  ],
  "XLR8": [
    { id: "quick-strike", name: "Quick Strike", type: "basic", damage: 10, energyCost: 0, description: "A lightning-fast hit." },
    { id: "speed-combo", name: "Speed Combo", type: "special", damage: 19, energyCost: 20, description: "A rapid sequence of attacks." },
    { id: "sonic-rush", name: "Sonic Rush", type: "ultimate", damage: 28, energyCost: 40, description: "A high-speed multi-directional assault." }
  ],
  "Diamondhead": [
    { id: "crystal-strike", name: "Crystal Strike", type: "basic", damage: 12, energyCost: 0, description: "A sharp crystal-powered strike." },
    { id: "crystal-shards", name: "Crystal Shards", type: "special", damage: 20, energyCost: 20, description: "Fires a spread of crystal projectiles." },
    { id: "crystal-barrage", name: "Crystal Barrage", type: "ultimate", damage: 29, energyCost: 40, description: "Unleashes a heavy crystal projectile barrage." }
  ],
  "Upgrade": [
    { id: "tech-pulse", name: "Tech Pulse", type: "basic", damage: 11, energyCost: 0, description: "Fires a focused energy pulse." },
    { id: "system-overload", name: "System Overload", type: "special", damage: 19, energyCost: 20, description: "Overloads the target with energy." },
    { id: "omega-beam", name: "Omega Beam", type: "ultimate", damage: 28, energyCost: 40, description: "Releases a concentrated technological beam." }
  ],
  "Cannonbolt": [
    { id: "armored-strike", name: "Armored Strike", type: "basic", damage: 13, energyCost: 0, description: "A reinforced close-range impact." },
    { id: "rolling-crash", name: "Rolling Crash", type: "special", damage: 21, energyCost: 20, description: "Charges forward in an armored roll." },
    { id: "meteor-impact", name: "Meteor Impact", type: "ultimate", damage: 31, energyCost: 40, description: "Delivers a massive rolling impact." }
  ],
  "Wildmutt": [
    { id: "claw-swipe", name: "Claw Swipe", type: "basic", damage: 12, energyCost: 0, description: "A fast and powerful claw attack." },
    { id: "predator-pounce", name: "Predator Pounce", type: "special", damage: 20, energyCost: 20, description: "Leaps onto the opponent with force." },
    { id: "feral-onslaught", name: "Feral Onslaught", type: "ultimate", damage: 29, energyCost: 40, description: "A relentless series of beastly strikes." }
  ],
  "Ripjaws": [
    { id: "jaw-strike", name: "Jaw Strike", type: "basic", damage: 13, energyCost: 0, description: "A powerful bite attack." },
    { id: "deep-sea-lunge", name: "Deep Sea Lunge", type: "special", damage: 21, energyCost: 20, description: "Lunges forward with crushing force." },
    { id: "abyssal-bite", name: "Abyssal Bite", type: "ultimate", damage: 30, energyCost: 40, description: "A devastating full-force bite." }
  ],
  "Grey Matter": [
    { id: "precision-jab", name: "Precision Jab", type: "basic", damage: 10, energyCost: 0, description: "A carefully timed precision strike." },
    { id: "tactical-trap", name: "Tactical Trap", type: "special", damage: 18, energyCost: 20, description: "Uses clever tactics to catch the opponent off guard." },
    { id: "genius-counter", name: "Genius Counter", type: "ultimate", damage: 26, energyCost: 40, description: "A calculated attack exploiting an opening." }
  ],
  "Stinkfly": [
    { id: "wing-strike", name: "Wing Strike", type: "basic", damage: 11, energyCost: 0, description: "A fast aerial strike." },
    { id: "slime-blast", name: "Slime Blast", type: "special", damage: 19, energyCost: 20, description: "Fires a concentrated slime projectile." },
    { id: "aerial-storm", name: "Aerial Storm", type: "ultimate", damage: 28, energyCost: 40, description: "Launches a powerful aerial assault." }
  ],
  "Ghostfreak": [
    { id: "spectral-touch", name: "Spectral Touch", type: "basic", damage: 11, energyCost: 0, description: "A chilling ghostly strike." },
    { id: "phase-strike", name: "Phase Strike", type: "special", damage: 20, energyCost: 20, description: "Phases through defences before striking." },
    { id: "phantom-assault", name: "Phantom Assault", type: "ultimate", damage: 30, energyCost: 40, description: "Unleashes a powerful spectral attack." }
  ]
};

const combatMoves = Object.freeze(
  Object.fromEntries(
    Object.entries(combatDefinitions).map(([alien, moves]) => [
      alien,
      Object.freeze(moves.map((move) => Object.freeze({ ...move })))
    ])
  )
);

function getAlienMoves(alienName) {
  if (typeof alienName !== "string") return [];

  return combatMoves[alienName] || [];
}

function getCombatMove(alienName, moveId) {
  if (typeof moveId !== "string") return null;

  return getAlienMoves(alienName).find((move) => move.id === moveId) || null;
}

module.exports = {
  combatMoves,
  getAlienMoves,
  getCombatMove,
  ENERGY_CONFIG,
  canAffordMove,
  spendEnergy,
  regenerateEnergy,
};

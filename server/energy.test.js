const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ENERGY_CONFIG,
  canAffordMove,
  spendEnergy,
  regenerateEnergy,
} = require("./combat");

test("energy configuration has the expected limits", () => {
  assert.equal(ENERGY_CONFIG.MAX, 100);
  assert.equal(ENERGY_CONFIG.START, 50);
  assert.equal(ENERGY_CONFIG.REGEN_PER_TURN, 10);
});

test("basic moves do not consume energy", () => {
  const player = { energy: 50 };
  const basicMove = { energyCost: 0 };

  assert.equal(canAffordMove(player, basicMove), true);
  assert.equal(spendEnergy(player, basicMove), true);
  assert.equal(player.energy, 50);
});

test("special moves consume their configured energy", () => {
  const player = { energy: 50 };
  const specialMove = { energyCost: 20 };

  assert.equal(spendEnergy(player, specialMove), true);
  assert.equal(player.energy, 30);
});

test("ultimate moves consume their configured energy", () => {
  const player = { energy: 50 };
  const ultimateMove = { energyCost: 40 };

  assert.equal(spendEnergy(player, ultimateMove), true);
  assert.equal(player.energy, 10);
});

test("moves cannot be used when energy is insufficient", () => {
  const player = { energy: 10 };
  const specialMove = { energyCost: 20 };

  assert.equal(canAffordMove(player, specialMove), false);
  assert.equal(spendEnergy(player, specialMove), false);
  assert.equal(player.energy, 10);
});

test("energy regeneration increases energy by ten", () => {
  const player = { energy: 30 };

  assert.equal(regenerateEnergy(player), 40);
  assert.equal(player.energy, 40);
});

test("energy regeneration never exceeds the maximum", () => {
  const player = { energy: 95 };

  assert.equal(regenerateEnergy(player), 100);
  assert.equal(player.energy, 100);
});

test("energy helpers reject invalid player or move data", () => {
  assert.equal(canAffordMove(null, { energyCost: 0 }), false);
  assert.equal(canAffordMove({ energy: 20 }, null), false);
  assert.equal(canAffordMove({ energy: -1 }, { energyCost: 0 }), false);
  assert.equal(canAffordMove({ energy: 20 }, { energyCost: -1 }), false);
  assert.equal(spendEnergy(null, { energyCost: 0 }), false);
  assert.equal(regenerateEnergy(null), false);
});
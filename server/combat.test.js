const test = require("node:test");
const assert = require("node:assert/strict");

const {
  combatMoves,
  getAlienMoves,
  getCombatMove
} = require("./combat");

const expectedAliens = [
  "Heatblast",
  "Four Arms",
  "XLR8",
  "Diamondhead",
  "Upgrade",
  "Cannonbolt",
  "Wildmutt",
  "Ripjaws",
  "Grey Matter",
  "Stinkfly",
  "Ghostfreak"
];

test("combat configuration contains all 11 approved aliens", () => {
  assert.deepEqual(Object.keys(combatMoves).sort(), [...expectedAliens].sort());
});

test("every alien has exactly three attacks", () => {
  for (const alien of expectedAliens) {
    assert.equal(getAlienMoves(alien).length, 3, alien);
  }
});

test("every alien has basic, special and ultimate attacks", () => {
  for (const alien of expectedAliens) {
    const types = getAlienMoves(alien).map((move) => move.type).sort();
    assert.deepEqual(types, ["basic", "special", "ultimate"], alien);
  }
});

test("all attack IDs are unique across the configuration", () => {
  const ids = Object.values(combatMoves).flat().map((move) => move.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("attack damage and energy costs are within configured limits", () => {
  for (const moves of Object.values(combatMoves)) {
    for (const move of moves) {
      assert.ok(Number.isInteger(move.damage));
      assert.ok(move.damage >= 1 && move.damage <= 100);
      assert.ok(Number.isInteger(move.energyCost));
      assert.ok(move.energyCost >= 0 && move.energyCost <= 100);
      assert.ok(["basic", "special", "ultimate"].includes(move.type));
    }
  }
});

test("move lookup returns only a move belonging to the selected alien", () => {
  assert.equal(getCombatMove("Heatblast", "fireball").damage, 20);
  assert.equal(getCombatMove("XLR8", "fireball"), null);
  assert.equal(getCombatMove("Unknown Alien", "fireball"), null);
});

test("invalid alien names and move IDs are handled safely", () => {
  assert.deepEqual(getAlienMoves(null), []);
  assert.deepEqual(getAlienMoves("Unknown Alien"), []);
  assert.equal(getCombatMove("Heatblast", null), null);
  assert.equal(getCombatMove("Heatblast", "missing-move"), null);
});

test("move definitions cannot be mutated at runtime", () => {
  assert.equal(Object.isFrozen(combatMoves), true);
  assert.equal(Object.isFrozen(combatMoves.Heatblast), true);
  assert.equal(Object.isFrozen(combatMoves.Heatblast[0]), true);
});

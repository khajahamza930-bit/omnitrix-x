const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePlayerName } = require("./security");
const { getAlienMoves, getCombatMove } = require("./combat");

test("normal player names are accepted", () => {
  assert.equal(normalizePlayerName("Hamza"), "Hamza");
  assert.equal(normalizePlayerName("  Ben 10  "), "Ben 10");
});

test("invisible and direction-changing characters are rejected", () => {
  assert.equal(normalizePlayerName("Ha\u200Bmza"), null); // zero-width space
  assert.equal(normalizePlayerName("Ha\u202Emza"), null); // right-to-left override
  assert.equal(normalizePlayerName("Ha\uFEFFmza"), null); // byte order mark inside the name
  assert.equal(normalizePlayerName("Ha\u2066mza"), null); // direction isolate
  assert.equal(normalizePlayerName("Ha\u0085mza"), null); // hidden control character
});

test("the older name rules still work", () => {
  assert.equal(normalizePlayerName("   "), null);
  assert.equal(normalizePlayerName("A".repeat(21)), null);
  assert.equal(normalizePlayerName("Ha\nmza"), null);
  assert.equal(normalizePlayerName(42), null);
});

test("names such as constructor are not treated as aliens", () => {
  assert.deepEqual(getAlienMoves("constructor"), []);
  assert.deepEqual(getAlienMoves("__proto__"), []);
  assert.equal(getCombatMove("constructor", "fireball"), null);
});

test("real aliens and moves still work", () => {
  assert.equal(getAlienMoves("Heatblast").length, 3);
  assert.equal(getCombatMove("Heatblast", "fireball").damage, 20);
});

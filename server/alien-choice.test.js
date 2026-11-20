const test = require("node:test");
const assert = require("node:assert/strict");
const { parseAlienChoice } = require("./security");

test("a missing alien defaults to Heatblast", () => {
  assert.equal(parseAlienChoice(undefined), "Heatblast");
  assert.equal(parseAlienChoice(null), "Heatblast");
});

test("a valid alien name is returned unchanged", () => {
  assert.equal(parseAlienChoice("Four Arms"), "Four Arms");
});

test("an unknown or wrongly cased alien is rejected", () => {
  assert.equal(parseAlienChoice("Goku"), null);
  assert.equal(parseAlienChoice("heatblast"), null);
  assert.equal(parseAlienChoice(42), null);
});
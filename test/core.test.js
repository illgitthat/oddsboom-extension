const test = require("node:test");
const assert = require("node:assert/strict");
const OB = require("../odds/core.js");

const site = (id) => OB.SITES.find((s) => s.id === id);
const noFees = { ...OB.DEFAULTS, fees: false };
const show = (text, id, settings = OB.DEFAULTS) => {
  const parsed = OB.parse(text, site(id).american);
  return parsed && OB.label(parsed, settings, site(id));
};

test("prices convert to sportsbook odds", () => {
  assert.equal(show("60¢", "kalshi", noFees), "−150");
  assert.equal(show("50%", "novig"), "+100");
  assert.equal(show("YES 60¢", "kalshi", noFees), "−150");
  assert.equal(show("62% chance", "kalshi", noFees), "−163");
  assert.equal(show("25%", "novig", { ...OB.DEFAULTS, decimal: true }), "+300 · 4.00");
});

test("fees make the odds worse", () => {
  assert.equal(show("50¢", "kalshi"), "−107"); // 50¢ + 1.75¢ fee
  assert.equal(show("50%", "prophetx"), "−102"); // 2% of winnings
  assert.equal(show("+150", "prophetx", { ...noFees, american: false, implied: true }), "40%");
});

test("non-prices are ignored", () => {
  for (const text of ["3.5% APY", "(2%)", "-5.92%", "+$23.08 (2%)", "$0.21", "100%", "0¢", "Will at least 50% of flights be cancelled?"]) {
    assert.equal(OB.parse(text, true), null, text);
  }
  assert.equal(OB.parse("-110", false), null);
});

test("nothing is shown when it would repeat the site's own price", () => {
  assert.equal(show("40%", "novig", { ...OB.DEFAULTS, american: false, implied: true }), "");
});

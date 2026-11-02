'use strict';
const presets = require('./picks.json');
const byId = Object.fromEntries(presets.map(p => [p.id, p]));
function getPick(id) {
  const p = byId[id];
  if (!p) throw new Error('Unknown pick: ' + id);
  return JSON.parse(JSON.stringify(p));
}
// elapsed is seconds since the cut began. Render both input scenes at the current time.
function framePick(bridge, from, to, id, elapsed, overrides = {}) {
  const p = getPick(id);
  return bridge.frame(from, to, 'wp_' + id, elapsed / p.dur, {
    seed: p.seed, focus: p.focus, dir: p.dir, time: elapsed,
    grain: 0, vignette: 0, ...overrides
  });
}
module.exports = { presets, getPick, framePick };

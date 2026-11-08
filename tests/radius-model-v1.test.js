'use strict';
const assert = require('node:assert/strict');
require('../js/engine.js');
const engine = globalThis.GrieveskBendEngine;
assert.ok(engine, 'shared engine must load');

const sample = engine.estimateInnerRadiusExperimental({
  thickness: 1, tensileStrength: 420, dieOpening: 8,
  punchRadius: 1, angle: 90, dieAngle: 30
});
assert.equal(sample.valid, true);
assert.ok(sample.innerRadius >= 1 && sample.innerRadius <= 4);
assert.equal(sample.model, 'experimental-ri-v1');

const obtuse = engine.estimateInnerRadiusExperimental({
  thickness: 1, tensileStrength: 420, dieOpening: 8,
  punchRadius: 1, angle: 120, dieAngle: 30
});
assert.equal(obtuse.valid, true);
assert.ok(obtuse.innerRadius > sample.innerRadius, 'obtuse-angle model should account for increased effective V');

const invalid = engine.estimateInnerRadiusExperimental({
  thickness: 0, tensileStrength: 420, dieOpening: 8,
  punchRadius: 1, angle: 90, dieAngle: 30
});
assert.equal(invalid.valid, false);
console.log('experimental Ri model smoke tests passed');

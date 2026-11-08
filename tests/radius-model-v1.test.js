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

const integrated = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', dieOpening: 6,
  punchRadius: 1, angle: 45, dieAngle: 30, flangeA: 50, flangeB: 50
});
assert.equal(integrated.valid, true);
assert.equal(integrated.radiusSource, 'experimental-ri-v1');
assert.ok(Math.abs(integrated.innerRadius - sample.innerRadius) > 0.1,
  'the development calculation should now use the experimental Ri model');

const differentDieAngle = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', dieOpening: 8,
  punchRadius: 1, angle: 90, dieAngle: 85, flangeA: 50, flangeB: 50
});
const referenceDieAngle = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', dieOpening: 8,
  punchRadius: 1, angle: 90, dieAngle: 30, flangeA: 50, flangeB: 50
});
assert.ok(differentDieAngle.innerRadius < referenceDieAngle.innerRadius,
  'die angle must influence the predicted Ri');

console.log('experimental Ri model integration smoke tests passed');

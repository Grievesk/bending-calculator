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
  thickness: 1, tensileStrength: 420, method: 'air', v: 8,
  punchRadius: 1, angle: 45, dieAngle: 30, flangeA: 50, flangeB: 50
});
assert.equal(integrated.valid, true);
assert.equal(integrated.radiusSource, 'experimental-ri-v1');
assert.ok(Math.abs(integrated.innerRadius - sample.innerRadius) > 0.1,
  'the development calculation should now use the experimental Ri model');

const differentDieAngle = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', v: 8,
  punchRadius: 1, angle: 90, dieAngle: 85, flangeA: 50, flangeB: 50
});
const referenceDieAngle = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', v: 8,
  punchRadius: 1, angle: 90, dieAngle: 30, flangeA: 50, flangeB: 50
});
assert.ok(differentDieAngle.innerRadius < referenceDieAngle.innerRadius,
  'die angle must influence the predicted Ri');

console.log('experimental Ri model integration smoke tests passed');

// A development result must be exactly reversible through the sample calculator.
for (const angle of [80, 90]) {
  const development = engine.calculateDevelopment({
    thickness: 1, tensileStrength: 420, method: 'air', v: 8,
    punchRadius: 1, angle, dieAngle: 30, flangeA: 50, flangeB: 50
  });
  assert.equal(development.valid, true);
  const inverse = engine.calculateSampleK({
    thickness: 1, angle, innerRadius: development.innerRadius,
    flatLength: development.flatLength, flangeA: 50, flangeB: 50
  });
  assert.equal(inverse.valid, true);
  assert.ok(Math.abs(inverse.k - development.k) < 1e-10,
    `K must be reversible at inside angle ${angle}°`);
  assert.ok(Math.abs(inverse.bendAllowance - development.bendAllowance) < 1e-10);
  assert.ok(Math.abs(inverse.bendDeduction - development.bendDeduction) < 1e-10);
}

// The sign is irrelevant: negative values represent the same inside angle.
const positiveAngle = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', v: 8,
  punchRadius: 1, angle: 80, dieAngle: 30, flangeA: 50, flangeB: 50
});
const negativeAngle = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'air', v: 8,
  punchRadius: 1, angle: -80, dieAngle: 30, flangeA: 50, flangeB: 50
});
assert.equal(negativeAngle.valid, true);
assert.equal(negativeAngle.innerRadius, positiveAngle.innerRadius);
assert.equal(negativeAngle.k, positiveAngle.k);
assert.equal(negativeAngle.flatLength, positiveAngle.flatLength);
const invalidMethod = engine.calculateDevelopment({
  thickness: 1, tensileStrength: 420, method: 'unknown', v: 8,
  punchRadius: 1, angle: 80, dieAngle: 30, flangeA: 50, flangeB: 50
});
assert.equal(invalidMethod.valid, false, 'unknown methods must not silently fall through to panel-bending rules');
const negativeSampleAngle = engine.calculateSampleK({
  thickness: 1, angle: -80, innerRadius: positiveAngle.innerRadius,
  flatLength: positiveAngle.flatLength, flangeA: 50, flangeB: 50
});
assert.equal(negativeSampleAngle.valid, true);
assert.ok(Math.abs(negativeSampleAngle.k - positiveAngle.k) < 1e-10);

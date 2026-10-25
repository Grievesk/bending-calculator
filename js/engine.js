/* Grievesk Bend shared calculation engine.
 * Internal dimensional unit: millimetres (mm). UI formatting/conversion belongs to the app layer.
 * Keep these formula functions free of DOM dependencies so Italian and English interfaces use identical logic.
 */
(function (root) {
  'use strict';
  const STANDARD_DIES = [4, 6, 7, 8, 10, 12, 14, 16, 18, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

  function recommendedV(s, rm, method) {
    let multiplier = 8;
    if (method === 'wing' || method === 'coining') multiplier = 6;
    else if (method === 'panel') multiplier = 3;
    else if (rm >= 650) multiplier = 10;
    else if (s <= 2.5) multiplier = 6;
    else if (s <= 8) multiplier = 8;
    else multiplier = 12;
    return s * multiplier;
  }

  function estimatedKFromGeometry(ri, s, method) {
    const ratio = Math.max(0.2, ri / s);
    let k;
    if (method === 'wing') k = 0.22 + 0.055 * Math.log2(ratio + 0.5);
    else if (method === 'coining') k = 0.34 + 0.025 * Math.log2(ratio + 0.5);
    else if (method === 'panel') k = 0.28 + 0.04 * ratio;
    else k = 0.33 + 0.045 * Math.log2(ratio + 0.5);
    return Math.min(method === 'panel' ? 0.46 : 0.50, Math.max(method === 'wing' ? 0.18 : 0.25, k));
  }

  function calculateSampleK({ thickness: s, angle, innerRadius: ri, flatLength: flat, flangeA: a, flangeB: b }) {
    if (![s, angle, ri, flat, a, b].every(Number.isFinite) || s <= 0 || angle <= 0 || angle >= 180 || ri <= 0 || flat <= 0 || a <= 0 || b <= 0) {
      return { valid: false, reason: 'invalid-input' };
    }
    const theta = (180 - angle) * Math.PI / 180;
    const outsideSetback = Math.tan(theta / 2) * (ri + s);
    const ba = flat - a - b + 2 * outsideSetback;
    const bd = a + b - flat;
    const k = (ba / theta - ri) / s;
    const valid = Number.isFinite(k) && k >= 0 && k <= 1 && ba > 0 && bd >= 0;
    return { valid, k, bendAllowance: ba, bendDeduction: bd, theta, outsideSetback, reason: valid ? null : 'out-of-range' };
  }

  function calculateDevelopment({ thickness: s, tensileStrength: rm, method, v, punchRadius: rp, angle, flangeA: a, flangeB: b }) {
    if (![s, rm, v, rp, angle, a, b].every(Number.isFinite) || s <= 0 || rm <= 0 || v <= 0 || rp <= 0 || angle <= 0 || angle >= 180 || a <= 0 || b <= 0) {
      return { valid: false, reason: 'invalid-input' };
    }
    let ri, minFlange, radiusSource;
    if (method === 'air') {
      const factor = rm >= 650 ? 0.20 : rm <= 280 ? 0.14 : 0.16;
      ri = Math.max(v * factor, rp);
      minFlange = 0.7 * v;
      radiusSource = 'empirical-v-material';
    } else if (method === 'wing') {
      ri = rp; minFlange = 0.45 * v; radiusSource = 'punch-guided';
    } else if (method === 'coining') {
      ri = rp; minFlange = 0.65 * v; radiusSource = 'tooling-dependent';
    } else {
      ri = Math.max(rp, 0.8 * s); minFlange = 2.5 * s; radiusSource = 'panel-estimate';
    }
    const k = estimatedKFromGeometry(ri, s, method);
    const theta = (180 - angle) * Math.PI / 180;
    const ba = theta * (ri + k * s);
    const ossb = Math.tan(theta / 2) * (ri + s);
    const bd = 2 * ossb - ba;
    return { valid: true, v, innerRadius: ri, minFlange, k, bendAllowance: ba, bendDeduction: bd, flatLength: a + b - bd, radiusSource, theta };
  }

  function matrixCell({ thickness: s, v, tensileStrength: rm }) {
    if (![s, v, rm].every(Number.isFinite) || s <= 0 || v <= 0 || rm <= 0 || v / s < 4.5 || v / s > 18) return null;
    const vFactor = rm >= 650 ? 0.20 : (rm <= 280 ? 0.14 : 0.16);
    const forceTonsPerMetre = ((8 * rm * Math.pow(s, 2)) / v) / 9.81;
    const innerRadius = v * vFactor;
    const minFlange = 0.7 * v;
    const ratio = v / s;
    const optimal = rm >= 650 ? ratio >= 7.5 && ratio <= 12 : ratio >= 5.5 && ratio <= 9.5;
    return { forceTonsPerMetre, innerRadius, minFlange, ratio, optimal };
  }

  root.GrieveskBendEngine = Object.freeze({
    STANDARD_DIES: Object.freeze(STANDARD_DIES.slice()),
    recommendedV, estimatedKFromGeometry, calculateSampleK, calculateDevelopment, matrixCell
  });
})(typeof window !== 'undefined' ? window : globalThis);

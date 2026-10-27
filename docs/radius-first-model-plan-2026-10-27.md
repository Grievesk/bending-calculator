# Radius-first model plan — 2026-10-27

## Decision

The primary target is the CAM-derived formed inside radius Ri. Flange lengths are not required.

Workflow:
1. Predict Ri from inside angle and known process/setup inputs.
2. Estimate/select K under the agreed convention.
3. Calculate bend allowance and deduction.
4. Compare calculated deduction with the CAM deduction as a secondary consistency check.

Preserve all CAM values. A mismatch in derived deduction/K must not overwrite or invalidate a CAM radius; record it separately for investigation.

## Fixed-setup evidence

Seven records share the nominal setup Rm=420 MPa, s=1 mm, punch radius=1 mm, V=8 mm, die angle=30 degrees. CAM-derived radii are:

| Inside angle | Ri mm |
|---:|---:|
| 45 | 1.192 |
| 80 | 1.519 |
| 90 | 1.622 |
| 100 | 1.952 |
| 120 | 2.728 |
| 135 | 3.329 |
| 150 | 3.967 |

The current air-bending heuristic returns 1.28 mm for every row and therefore does not capture this angle trend.

An exploratory quadratic fit is recorded in `technical-audit-notes-2026-10.md`: Ri = 0.000253266*a^2 - 0.0221953*a + 1.6586356, where a is the inside angle in degrees. Training RMSE is about 0.057 mm on the same seven records. This is descriptive only, not a validated general formula, and must not be deployed in production yet.

## Limits

This subset varies angle but does not independently identify the effects of thickness, V opening, punch radius, die angle, material, or process. Do not extrapolate outside 45–150 degrees or apply the fit to near-flat or crushed/hemmed cases. Do not claim transferability to wing bending, coining, or panel bending.

## Secondary deduction check

Using the conventional equations, theta = radians(180 degrees - inside angle), OSSB = tan(theta/2)*(Ri+s), BA = theta*(Ri+K*s), and BD_calc = 2*OSSB-BA. This calculation needs no flange lengths. Compare BD_calc with the CAM deduction as a separate diagnostic. The 45-degree and signed -80-degree rows do not reconcile when their reported Ri, K and deduction are used together. Keep source values unchanged and record this as a convention/consistency issue, not as evidence that the CAM radius is invalid.

## Next stage

1. Add reproducible analysis tests reporting radius residuals and MAE/RMSE for the current heuristic and the angle-aware candidate.
2. Keep the seven points together; do not describe random row splitting as independent validation.
3. Collect additional CAM cases where one input changes at a time, especially V/s, punch radius, die angle, thickness, material and process.
4. Use grouped validation once more independent cases exist.
5. Change production formulas only after candidate-model evaluation.

Documentation only: no CAM values, engine formulas, or user-facing behavior are changed.
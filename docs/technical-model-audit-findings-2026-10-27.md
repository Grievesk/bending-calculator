# Technical model audit findings — 2026-10-27

Branch reviewed: `fix/technical-audit-oct-2026`
Scope: `js/engine.js` and `data/model-registry/bysoft-cam-samples.csv`, compared with the supplied `Bysoft Cam(3).txt` source.

## Executive finding

Do not merge the current radius/K model as a validated predictor yet. The current engine is internally consistent in using `theta = 180° - insideAngle` for the standard bend allowance equation, but the CAM sample records do not all reconcile with the standard geometric reconstruction using their reported radius, K and bend deduction. The discrepancies need to be understood before calibrating or changing formulas. The CAM values remain the source of truth; this report does not overwrite or challenge them.

## Finding 1 — fixed radius heuristic misses the angle trend

For air bending, `calculateDevelopment()` currently estimates:
`Ri = max(V × factor, punchRadius)`
with factor 0.16 for Rm=420 MPa. Thus for s=1 mm, V8, R1, Rm420, it predicts Ri=1.28 mm regardless of angle.

The source records for the same nominal setup (V8, R1, 30° die angle, s=1 mm, Rm420) show:
- 45°: 1.192 mm
- 80°: 1.519 mm
- 90°: 1.622 mm
- 100°: 1.952 mm
- 120°: 2.728 mm
- 135°: 3.329 mm
- 150°: 3.967 mm

Prediction residual (model minus CAM) therefore ranges from +0.088 mm at 45° to -2.687 mm at 150°. This is a strong reason not to describe the current output as a CAM-calibrated radius prediction. The exploratory angle-only fit documented elsewhere is descriptive only and should not be deployed without a held-out validation set and process comparability checks.

## Finding 2 — current K heuristic is not supported by these records

`estimatedKFromGeometry()` derives K mainly from Ri/s and process method, not the inside angle. With the fixed 1.28 mm radius above, it returns the same K for all angles in this group (approximately 0.367), while the source K values vary (0.362–0.473).

Other samples also show radius residuals larger than 0.5 mm:
- s=2, V12, 135°: CAM Ri=3.524 mm; current heuristic=1.92 mm.
- s=3, V16, 90°: CAM Ri=1.870 mm; current heuristic=2.56 mm.
- s=3, V16, 175.2°: CAM Ri=6.733 mm; current heuristic=2.56 mm.

The 175.2° sample is near-flat and should be handled as a distinct edge regime, not treated as evidence that a general model extrapolates reliably.

## Finding 3 — standard geometric reconstruction does not reconcile every reported CAM tuple

For each record with angle, Ri, thickness and bend deduction, the standard relation used by the engine is:
- `theta = radians(180° - insideAngle)`
- `OSSB = tan(theta/2) × (Ri + thickness)`
- `BA = 2 × OSSB - bendDeduction`
- `K = (BA/theta - Ri)/thickness`

Using the source values as-is, most ordinary samples reconstruct the reported K within rounding. However, the 45° record (s=1, Ri=1.192, reported K=0.473, deduction=0.462) reconstructs to K≈3.104; the −80°/inside-80° record (s=1, Ri=1.519, reported K=0.474, deduction=1.56) reconstructs to K≈1.027. The 175.2° case reconstructs to about 0.485 versus reported 0.479, a smaller difference that may be rounding or source conventions.

This is not a basis to alter source data. It is a blocker for assuming the CAM “deduzione” is interchangeable with the standard bend-deduction formula under the current angle convention. Verify the precise meaning of the CAM angle and deduction fields and the reference points used for flange dimensions before using these rows to calibrate K. Keep raw values intact.

## Finding 4 — process and metadata limitations

- All 14 records currently say process method “not specified”. The engine's branch-specific heuristics for air, wing, coining and panel cannot be validated from these rows until process method is recorded.
- Die angle and V opening are separate features and must stay separate.
- Most source angles do not include a direction sign. Do not infer direction from angle magnitude.
- The 0/180° crushed/hemmed record remains a separate process family and must not enter ordinary bend fitting.
- CAM-derived values are trusted source records per project instructions, but are not independent physical measurements. Preserve provenance and do not silently relabel them as measured.

## Recommended next actions (no production formula changed by this audit)

1. Confirm the exact Bysoft definitions for angle and “deduzione”, particularly for the 45° and −80° records. If necessary, capture the relevant CAM screen/report field definitions.
2. Add process method and any missing setup variables to the registry where known; otherwise keep them explicitly unknown.
3. Keep the present radius and K equations labeled as preliminary estimates, not validated predictors.
4. Add a small automated regression suite for mathematical invariants and known sample cases. Separate “known source facts” from “expected model predictions”; tests must not encode the heuristic's outputs as physical truth.
5. Only after convention reconciliation, compare baseline and angle-aware models using grouped/held-out validation. Do not replace the current formula with the exploratory polynomial yet.
6. Verify the air-bending force coefficient against a reputable press-brake/tooling reference and keep process-specific load limits separate.

## Current conclusion

The audit found material model limitations and a geometry/convention discrepancy in two source tuples. It did not change `js/engine.js` or modify the source CSV. The safe next step is to reconcile the meaning of CAM angle/deduction, then add tests before changing the prediction model.

# Bysoft CAM convention resolution — next technical step

Date: 2026-10-27  
Branch: `fix/technical-audit-oct-2026`

## Purpose

Before changing the production bend-development model, establish that the geometric quantities used by the calculator have the same definitions and reference points as the values exported by Bysoft CAM.

The CAM sample values are retained as trusted source data. The discrepancies below are treated as a **definition/convention mismatch to resolve**, not as evidence that the CAM values are incorrect.

## Known source cases

The strongest comparison group currently available uses nominally the same setup: S235/Rm 420 MPa, thickness 1 mm, V8 die, punch radius 1 mm, die angle 30°. The source has these inside-angle / inside-radius / bend-deduction / K values:

| Inside angle | Inside radius (mm) | Bend deduction (mm) | K |
|---:|---:|---:|---:|
| 45° | 1.192 | 0.462 | 0.473 |
| 80° (source signed -80°) | 1.519 | 1.560 | 0.474 |
| 90° | 1.622 | 2.080 | 0.392 |
| 100° | 1.952 | 1.649 | 0.415 |
| 120° | 2.728 | 1.011 | 0.417 |
| 135° | 3.329 | 0.664 | 0.391 |
| 150° | 3.967 | 0.395 | 0.362 |

The hem/crush sample at 0°/180° is excluded from normal bend fitting. The 1.5, 2 and 3 mm cases remain separate validation groups because their tooling and/or setup differ.

## Definitions to confirm from Bysoft

Please confirm from the Bysoft interface, a CAM report, or your established shop practice:

1. **Angle field:** Is the displayed/exported value the finished inside angle (0° = closed, 90° = square, 180° = flat), while the sign only indicates bend direction? Is the value the commanded final angle or a nominal design angle?
2. **Bend deduction field:** Is “bend deduction” the standard `BD = A + B - Lflat`, with A/B the outside flange dimensions and `Lflat` the developed flat length? Or is Bysoft reporting a different allowance/deduction convention or using different dimension reference points?
3. **Flange dimensions:** If the standard definition applies, are A and B outside dimensions measured to the theoretical sharp corner, and is the displayed flat length measured between the same datums?
4. **Inside radius:** Is the reported radius a predicted formed inside radius for the selected die/punch/material/angle, or a tooling/part-design radius? Does Bysoft vary this prediction with the inside angle?
5. **K-factor:** Is the K value shown as a material/process-calculated neutral-axis factor for that bend, or is it an entered/default parameter? Is it expected to be mathematically consistent with the displayed radius and deduction using the standard circular-bend equations?
6. **Setup parity:** For the seven comparison cases, can we confirm that material grade/strength, thickness, V opening, die angle, punch radius, process mode, and any bend-table/material override are unchanged, with only the bend angle changed?

## Why this matters

Using the conventional equations

- `theta = radians(180° - insideAngle)`
- `OSSB = tan(theta/2) × (Ri + s)`
- `BA = theta × (Ri + K × s)`
- `BD = 2 × OSSB - BA`

the 45° and signed -80° source cases do not reconstruct the displayed K value, while most other ordinary cases are much closer. This points to an unresolved definition, datum, or convention difference. It is not appropriate to “correct” those source values or fit a universal formula until this is explained.

## Decision gate

- **If Bysoft uses the standard definitions above:** keep all CAM values unchanged, and investigate rounding, angle reference, and hidden process/material overrides in the export.
- **If Bysoft uses different definitions/datums:** document the exact mapping and implement an explicit conversion layer before comparing or calibrating the calculator.
- **Only after this gate:** create automated regression tests for the agreed conventions and evaluate any candidate radius/K model against held-out cases. Do not deploy the exploratory angle-only fit as a general model.

## Scope of this step

Documentation only. No production formula, CAM source value, or user-facing calculator behaviour is changed by this file.

# Technical audit notes — October 2026

## Angle convention from Bysoft CAM

Keep the original CAM angle field unchanged in source records. The magnitude represents the inside angle of the finished bend:
- 0°: flanges touch/closed position.
- 45°: acute inside angle.
- 90°: right angle.
- 135°: obtuse inside angle.

The sign is directional metadata only: positive means the bend moves toward the observer; negative means it moves away from the observer. Therefore, for geometric calculations, normalize the inside-angle magnitude separately from the direction sign. Never infer direction from the normalized angle, and never overwrite the original signed CAM value. The geometric bend rotation for BA/OSS calculations is 180° minus the inside angle.

## Data provenance and model eligibility

- Preserve the original Bysoft CAM artifact and raw field values.
- Store normalized values and conventions separately from source values.
- Label the current samples as CAM-derived, not independently physically measured.
- Keep crushed/hemmed or 0°/180° special cases separate from ordinary air-bending samples unless comparability is demonstrated.
- Keep the sample-derived K calculation geometric and independent of the prediction model.
- Treat all current radius/K estimates as preliminary until tested against data held out from calibration.

## Air-bending force estimate

The quick S/V/F table now uses the conventional estimate:

F [kN/m] ≈ 1.42 × Rm [MPa] × s² [mm²] / V [mm]

For metric ton-force per metre, divide kN/m by standard gravity 9.80665. This is an empirical estimate for air bending, not a substitute for the press-brake manufacturer's force charts, tooling load limits, material-specific factors or safety checks. Coining/bottoming and panel bending must not be represented by this air-bending equation.

Regression check: Rm = 420 MPa, s = 1 mm, V = 8 mm gives approximately 7.60 metric ton-force/m.

## Editorial principles

- Distinguish physical/geometric relationships from empirical rules of thumb.
- State the applicable process and assumptions alongside each formula.
- Do not describe a heuristic threshold as universal.
- Avoid absolute statements about rolling direction, springback or cracking without material-specific support.
- The sample K-factor calculator uses the inside angle; 0° is a closed-flange limit and is not a valid input for the current geometric equations.
- FAQ structured data must not be published unless it accurately matches the visible FAQ content in the same language.


## First exploratory fit from the Bysoft registry

The 14 source records are normalized in `data/model-registry/bysoft-cam-samples.csv`. The original angle text/value is retained, while the inside-angle magnitude and direction metadata are separate. The source gives no direction sign for most records, so their direction is marked as not encoded rather than guessed. The 0/180° crushed/hemmed record is retained but excluded from ordinary bend-angle fitting.

A first exploratory angle-only fit was calculated on the seven samples sharing the same nominal setup: material strength 420 MPa, thickness 1 mm, punch radius 1 mm, V8 die opening and 30° die angle. Using the normalized inside-angle magnitude `a` in degrees, ordinary least squares gives:

`Ri [mm] ≈ 0.000253266 × a² − 0.0221953 × a + 1.6586356`

Training RMSE is approximately 0.057 mm on those same seven points. This is evidence that angle is associated with the CAM-derived radius within this fixed setup, but it is **not yet a deployable universal law**: it has no independent validation set, it should not be extrapolated outside 45°–150°, and it cannot estimate the separate effects of thickness, V opening, die angle, punch radius or tensile strength because those factors are not independently varied enough in this subset. The near-flat 175.2° sample and the crushed/hemmed case must be evaluated as separate edge regimes.

## Initial model strategy

1. Establish a baseline radius model from normalized dimensionless features (for example V/s and Rp/s) plus inside angle and die angle.
2. Add material strength only after collecting samples where Rm varies while the other parameters are as comparable as possible; aluminum data will be especially useful for identifying material dependence, but alloy/temper must also be recorded rather than treating all aluminum as one material.
3. Fit a deliberately small, interpretable model first. Compare baseline rules against angle-aware regression and inspect residuals by angle, thickness, die geometry and material family.
4. Use grouped validation by setup/material, not random row splitting alone, to avoid claiming accuracy from near-duplicate samples.
5. Keep measured K calculation separate from predicted K. The sample-derived K remains a geometric calculation from measured dimensions; the model predicts K or radius and is judged against CAM/physical reference values.
6. Add physically measured samples when possible, with provenance and measurement uncertainty recorded. Do not silently blend them with CAM-derived values.

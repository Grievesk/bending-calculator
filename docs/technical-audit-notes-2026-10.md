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

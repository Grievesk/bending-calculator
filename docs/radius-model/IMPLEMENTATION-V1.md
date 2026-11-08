# Experimental Ri model v1 — implementation notes

**Branch:** `feature/radius-model-v1`  
**Status:** connected to the development calculator on the preview branch only; not merged into the public main branch.  
**Purpose:** make the documented exploratory model executable and testable without changing current site outputs.

## Formula transcribed from the research document

Inputs: sheet thickness (s), die opening (V), punch radius (R_p), inside bend angle (alpha), die angle (eta). The die-entry radius (R_e) is optional; if absent, the documented approximation (R_e=V/9) is used.

[
u=(alpha-90)/90,quad x=s/V,quad b=(eta-30)/60
]

[
Q=-1.01993+3.52556u-0.57932u^2-1.18255x-0.80313b-0.10452ux
]

[
C=1/(1+e^{-Q})
]

[
G(alpha)=0;(alphaleq90^circ),quad
G(alpha)=((alpha-90)/90)^{0.5};(alpha>90^circ)
]

[
V_{eff}=V+2R_eG(alpha)
]

[
R_i=R_p+C(V_{eff}/2-R_p)
]

## Deliberate limitations

- The coefficients come from 19 ordinary Bysoft samples, not an independent validation set.
- All 19 calibration samples have (Rm=420 N/mm^2) and (R_p=1 mm). Their independent effects cannot be estimated from this dataset. The function accepts the Rm argument only for interface consistency; it does not use it.
- `calculateDevelopment` uses this candidate for air bending on the preview branch. Other bending methods retain their previous radius rules.
- The optional (R_e) input is accepted as a direct mm value. Its interpretation must be confirmed against the upcoming Table Entry exports.
- Do not present this candidate as validated or use it to replace production calculations before out-of-sample checks.

## Integration plan

1. Compare candidate Ri against all 19 source samples and report residuals.
2. Validate the angle and die-angle conventions against Table Entry exports.
3. Check whether (R_e=V/9) is adequate or replace it with the actual die-entry radius.
4. Add new independent samples and perform grouped/out-of-sample validation.
5. Only then connect the model to the development UI and derive K from verified geometry.

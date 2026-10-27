# Website release checklist — UX, SEO, privacy and AdSense

Updated: 2026-10-27
Branch: `fix/technical-audit-oct-2026`

This checklist separates code changes made in this branch from checks that require access to the live site, Google account settings, or owner confirmation. It does not claim that a live-site or legal-compliance audit has passed.

## Completed in this branch

- Added reciprocal `hreflang` links for Italian and English landing pages and Italian legal/about pages.
- Added Open Graph metadata to both landing pages.
- Added visible keyboard focus styling, reduced-motion support, and anchor scroll offsets.
- Connected calculator tabs and tab panels with `aria-controls` / `aria-labelledby`; marked calculation warnings and key results for polite screen-reader announcements.
- Replaced the empty ad placeholder with substantive technical guidance about model limitations and the need to verify tooling limits and validate with a test bend.
- Updated the landing-page `lastmod` in the sitemap.
- Kept the existing calculator model and sample-derived data untouched in this UI/SEO pass.

## Required before requesting or relying on AdSense approval

1. **Consent Management Platform (CMP):** verify the actual live behaviour in the EU/EEA. The repository pages load the AdSense library, but this code review did not confirm a Google-certified CMP, its publication status, consent storage, or that tags respect consent choices. Configure and publish an appropriate Google-certified CMP in the relevant Google account/site setup, then test accept, reject and preferences flows. Do not describe the site as consent-compliant until verified.
2. **Privacy notice accuracy:** compare the published privacy notice with the real hosting, CDN, AdSense/CMP, analytics and logging configuration. The site owner/controller identity and contact details must be confirmed by the owner. Do not add analytics or user-data collection as part of this task.
3. **AdSense account and crawler:** confirm the domain is added in the correct account, the current review state, policy-centre issues, and that `/ads.txt` is reachable from the public domain with the expected publisher ID. The repository file alone does not prove the live deployment is correct.
4. **Live URL smoke test:** check `/`, `/en/`, `/privacy.html`, `/en/privacy.html`, `/terms.html`, `/en/terms.html`, `/about.html`, `/en/about.html`, `/robots.txt` and `/sitemap.xml` after deployment. Verify HTTPS, canonical URLs, language switchers, no 404s, and no mixed-content or console errors.
5. **Responsive and accessibility test:** test at least a narrow iPhone viewport, tablet and desktop; keyboard-only navigation; focus visibility; screen-reader announcements; tab switching; matrix horizontal scrolling; unit conversion and shared links.
6. **Performance:** run Lighthouse/PageSpeed on the deployed pages. Tailwind is currently loaded from its CDN, which may add runtime and render cost; measure before deciding whether to compile a local production CSS file. Check logo/font/image sizes and Core Web Vitals.
7. **Search Console:** submit the sitemap and inspect canonical selection, indexing, hreflang and mobile usability. Search results and AdSense approval are not guaranteed by metadata changes alone.

## Still intentionally deferred

- New technical articles, source citations, manufacturer-specific tables and real-world measured values.
- Calibration of radius/K/force models from independently verified samples.
- Any user-submitted data, accounts, analytics or other collection of visitor-entered calculator values.

## Known scope limitation

GitHub source inspection does not prove what Cloudflare currently serves or which external account settings are enabled. This checklist must be completed against the live deployment and account configuration before declaring release-ready.

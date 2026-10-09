# Startup order and mobile movement previews

2026-10-09, app shell v31. Synthetic local fixtures only; no production accounts or backend requests.

## Causes and fixes

- The initial HTML showed the Today header/navigation while the entry overlay was hidden. Scripts then opened the overlay, producing a visible reversal. The overlay is now open in HTML; the app stays hidden and inert until entry completes.
- Cached profile restoration and background cloud pulls could rebuild the home view during the animation. Startup now suppresses home renders and coalesces sync requests, builds the cached home once at exit, then starts background sync. Service worker registration also waits until entry finishes to avoid installation downloads competing with entry.
- Movement images had a `height="240"` attribute while CSS only reduced their width. Explicit proportional sizing for the image/picture fixes the tall empty boxes; list and desk picture wrappers also fill their existing containers.
- Clicking Skip could invoke the splash completion handler twice through event bubbling. The second invocation now safely checks whether the handler still exists, and late image decoding cannot restart a finishing splash.

## Verification

Serve the repository on localhost:8765. Run with Playwright and installed Chrome:

```sh
PLAYWRIGHT_BROWSER=chrome PLAYWRIGHT_MODULE=/path/to/playwright node tests/startup-browser.js
PLAYWRIGHT_BROWSER=chrome PLAYWRIGHT_MODULE=/path/to/playwright node tests/image-browser.js
```

`startup-browser.js` deliberately holds config loading to inspect the actual first paint, then checks cached and cold saved sessions, first-time role selection, Skip, reduced motion, missing-session recovery, and local mode. It checks that cached home is built once before the background response and is not constructed during the running animation. Screenshots and results are in this directory.

`image-browser.js` checks Today image height against width × 3/4 for both the ordinary and 10-minute plan, in addition to WebP selection, next-movement warming, small-screen fit and offline image access. Updated mobile screenshots are in `../image-loading/`, including `today-short-mobile.png` matching the reported layout.

Other checks: `scenarios.js`, `default-plan.js`, `cloud-connection.js`, `meal-ui.js`, and `sw-cache.js` pass. No real iPhone performance measurement is claimed; cold network downloads and device-specific rendering still need observation on the user's device.

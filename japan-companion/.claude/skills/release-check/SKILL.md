---
name: release-check
description: The pre-push verification routine for Japan Companion — lint, unit tests, content checks, production build, then a Playwright pass on an iPhone-sized viewport in Hebrew and English, including an offline reload and screenshots. Use before every commit/push of app changes, when asked "does it work?", or to produce screenshots for the user.
---

# Release check

Run from `japan-companion/app/`. Push only when every step is clean.

## 1. Static checks

```bash
npm run lint
npm test          # vitest: converter maths, i18n key parity, content schema
npm run build     # tsc + vite build + service worker generation
```

## 2. Real browser on an iPhone viewport

Chromium is pre-installed (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
**Never** run `playwright install`.

```bash
(npx vite preview --port 4173 --strictPort >/dev/null 2>&1 &); sleep 2
node scripts/smoke.mjs             # writes screenshots to ../screenshots/
pkill -f "vite preview --port 4173"   # exit code 144 here is pkill matching itself, not a failure
```

`scripts/smoke.mjs` stubs the exchange-rate API with fixed rates (no real network) and must:

1. Open the app at 393×852 (iPhone 15), with `isMobile` and `hasTouch`.
2. For `he` and `en`: visit each tab (Phrases, Signs, Money, Guide), take a
   screenshot, and fail on any console error.
3. Type `5000` in the converter and check that ₪ and $ values appear.
4. Open a show-card and check the Japanese text is visible.
5. Wait for the service worker, go offline
   (`context.setOffline(true)`), reload, and check the app still renders.

## 3. Look at the screenshots

Open the PNGs and check them by eye:

- Hebrew screens are right-aligned, English left-aligned.
- Japanese is not reversed, and no text is clipped.
- Currency symbols sit on the correct side.
- There's nothing under the notch or home indicator.

## 4. Report

Say what ran and what passed, attach 2–4 screenshots for the user, and
list anything skipped.

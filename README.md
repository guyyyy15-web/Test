# Kalimba Coach

A web app that listens to a 17-key C kalimba through the phone's mic and
coaches you through songs. Static, no backend, built for iOS Safari.

**Live:** https://guyyyy15-web.github.io/Test/

```bash
npm install
npm run dev      # https://<your-computer-ip>:5173/Test/ (self-signed cert)
npm test
npm run build
```

## Layout

```
src/config/tunings.ts   instrument layouts (Gecko K17 C); add tunings here
src/detect/             note detection: pure functions, no DOM, tested in Node
  detector.ts           NoteDetector: audio frames in, note events out
  salience.ts           amplitude at each tine's frequency (Goertzel)
  yin.ts                YIN + low-pass refinement for the tine's inharmonic partial
  snap.ts               snap a frequency to the nearest tine (±50 cents)
  synth.ts              synthetic kalimba performances for tests
src/audio/mic.ts        getUserMedia + AudioContext, iOS-safe start/resume
src/ui/                 kalimba strip, debug panel
src/main.ts             app wiring
```

## How a note is detected

A kalimba note rings for seconds and overlaps the next one, so "a pitch is
present" is not a note. `NoteDetector` looks for:

1. **An onset**: the 2–8 kHz band (the pluck's click and the tine's fast-dying
   upper modes) jumps over its decaying envelope, or one tine's amplitude
   jumps over its own. Envelopes, not recent minimums, because neighbouring
   tines ringing together beat 20–40 times a second.
2. **The tine that grew**: 60 ms later, the tine whose amplitude grew most since
   just before the onset. Old notes only decay, so this works under a ringing
   chord. Growth spread across many tines is a knock; a drop in overall level
   is a tine being muted. YIN referees between neighbours on a clean signal,
   rejects notes between the tines, and gives the cents.

The tests render synthetic performances (overlapping decays, thumb-muted
re-plucks, beating neighbours, noise, a detuned instrument) and replay them at
120, 60 and 30 frames per second.

Every push to the deploy branch builds, tests and publishes to GitHub Pages
via `.github/workflows/deploy.yml`.

# Kalimba Coach

A web app that listens to a 17-key C kalimba through the phone's mic and
coaches you through songs. Static, no backend, built for iOS Safari.

**Live:** https://guyyyy15-web.github.io/Test/kalimba/

```bash
cd kalimba
npm install
npm run dev      # https://<your-computer-ip>:5173/Test/kalimba/ (self-signed cert)
npm test
npm run build
```

## Layout

```
src/config/tunings.ts   instrument layouts (Gecko K17 C); add tunings here
src/detect/             pitch detection: pure functions, no DOM, tested in Node
  yin.ts                YIN + low-pass refinement for the tine's inharmonic partial
  snap.ts               snap a frequency to the nearest tine (±50 cents)
  synth.ts              synthetic kalimba tones for tests
src/audio/mic.ts        getUserMedia + AudioContext, iOS-safe start/resume
src/main.ts             UI
```

Deployed with the game by `.github/workflows/deploy.yml`.

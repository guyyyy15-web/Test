# Japan Companion (יפן בכיס)

A pocket web app for getting around Japan, built for two Hebrew speakers on
iPhones. It's a general Japan app, not tied to one route: it opens from the
home screen, works without signal, and does the two hardest things for a
visitor well.

1. **Language:** talk to people, read signs, order food.
2. **Money:** know what something costs in shekels and dollars, and handle a
   country that still runs on cash.

> **Status:** v0.2, adding the **phrase builder**. It has phrases, show-cards, signs, a converter
> and a guide, and it works offline. It isn't deployed yet (see open questions).

## Run it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: money maths, i18n parity, content schema, every builder sentence
npm run lint
npm run build      # dist/ + service worker
npm run preview &  # then: npm run smoke  (iPhone-viewport browser test, writes screenshots/)
```

## What's in the app

| Tab | What it does |
|-----|--------------|
| 💬 Phrases | 102 phrases in 9 categories: Japanese, Hebrew pronunciation, romaji, 🔊 audio, ★ favorites, search. 🪧 opens a **full-screen card** to show staff, with the screen kept on and a flip-toward-them button. **👂 "They say"**: 20 phrases staff say to *you* (konbini, restaurant, station), each with what to answer. |
| 🧩 Builder | **Build your own sentence**: pick a frame ("Where is …?", "How much is …?", "No …, please", "My … hurts", "To …, please" for taxis… 21 in all), then a word (121: places, food, drinks, ingredients, body, belongings, payment) or type a name, e.g. pasted from Google Maps. You get correct Japanese with kana, romaji, Hebrew pronunciation, 🔊 and the show-card; there's a 1–5 counter for orders and a Recent list. See [the design](docs/05-phrase-builder.md). |
| 🈯 Signs | 83 kanji from signs and menus (exits, push/pull, open/closed, tax-free, pork/beef, onsen curtains…), by place, searchable |
| 💴 Money | ¥ ↔ ₪ ↔ $ keypad converter, live rate cached for offline, optional card-fee % and a manual rate, a quick-reference table, and a tax-free check (≥ ¥5,000 before tax) |
| 🧭 Guide | Tap-to-call emergency numbers and the Israeli embassy, a pre-flight checklist, cash & ATMs, tax-free rules, trains & Suica, etiquette, earthquakes |

Everything is Hebrew (RTL) or English with one toggle.

| Hebrew phrases | Phrase builder | Show-card | Converter | Signs (English) |
|---|---|---|---|---|
| ![](screenshots/he-phrases.png) | ![](screenshots/he-builder-count.png) | ![](screenshots/he-showcard.png) | ![](screenshots/he-money-5000.png) | ![](screenshots/en-signs.png) |

## Claude skills for this project

`.claude/skills/` holds project skills Claude uses while building this app:

| Skill | Use |
|-------|-----|
| `japanese-phrase-content` | Schema, politeness level, Hebrew transliteration rules, and a verification checklist for every phrase/sign |
| `ios-pwa` | iPhone Safari PWA rules: install, offline, sub-path hosting, Japanese speech, wake lock, safe areas |
| `bilingual-rtl-ui` | Hebrew/English i18n and RTL: logical CSS, isolating Japanese and money, Hebrew copy tone |
| `release-check` | The pre-push routine: lint, tests, build, then an iPhone-viewport browser pass in both languages plus an offline reload |

## Documents

| # | Doc | What's in it |
|---|-----|--------------|
| 1 | [Research](docs/01-research.md) | What actually trips up visitors to Japan, with sources |
| 2 | [Product plan](docs/02-product-plan.md) | Features, what's in the MVP, extra ideas, build phases |
| 3 | [Architecture](docs/03-architecture.md) | Tech choices: offline PWA, Hebrew/English + RTL, exchange rates |
| 4 | [Open questions](docs/04-open-questions.md) | Decisions still to make together |
| 5 | [Phrase builder](docs/05-phrase-builder.md) | Why frame + word works in Japanese, the frames, research notes |

## Decisions so far

| Topic | Decision |
|-------|----------|
| Platform | Installable web app (PWA) on iPhone, no App Store |
| UI language | Hebrew and English, with a toggle; Hebrew is right-to-left |
| Priority | Language help and money first |
| Scope | General Japan, not tied to a specific itinerary |
| Diet cards | Not needed |
| Look | Calm Japanese minimal: paper white, ink, vermilion (torii red); follows dark mode |
| Tax-free | Trip ends before Nov 1, 2026, so the **current** rules apply (discount at the till) |

## Layout

```
japan-companion/
├── .claude/skills/        project skills (see above)
├── docs/                  research, plan, architecture, open questions
├── screenshots/           output of `npm run smoke`
└── app/
    ├── public/            icons (torii), rendered by scripts/icons.mjs
    ├── scripts/           smoke.mjs (browser test), icons.mjs
    └── src/
        ├── content/       phrases.json, listening.json, signs.json, vocab.json, patterns.ts, guide.ts, content data only
        ├── i18n/          en.ts (source of keys), he.ts
        ├── lib/           money, builder, storage, speech, wake lock, search
        ├── components/    Ja, MoneyText, ShowCard, Chips, TabBar
        ├── features/      phrases, builder, signs, money, guide
        └── test/          vitest suites
```

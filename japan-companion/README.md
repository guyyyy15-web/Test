# Japan Companion (יפן בכיס)

A pocket web app for getting around Japan, built for two Hebrew speakers on
iPhones. It's a general Japan app, not tied to one route: it opens from the
home screen, works without signal, and does the two hardest things for a
visitor well.

1. **Language:** talk to people, read signs, order food.
2. **Money:** know what something costs in shekels and dollars, and handle a
   country that still runs on cash.

> **Status:** planning. There is no app code yet. Start with the docs below.

## Documents

| # | Doc | What's in it |
|---|-----|--------------|
| 1 | [Research](docs/01-research.md) | What actually trips up visitors to Japan, with sources |
| 2 | [Product plan](docs/02-product-plan.md) | Features, what's in the MVP, extra ideas, build phases |
| 3 | [Architecture](docs/03-architecture.md) | Tech choices: offline PWA, Hebrew/English + RTL, exchange rates |
| 4 | [Open questions](docs/04-open-questions.md) | Decisions still to make together |

## Decisions so far

| Topic | Decision |
|-------|----------|
| Platform | Installable web app (PWA) on iPhone, no App Store |
| UI language | Hebrew and English, with a toggle; Hebrew is right-to-left |
| Priority | Language help and money first |
| Scope | General Japan, not tied to a specific itinerary |
| Diet cards | Not needed personally; keep a generic allergy card as a stretch |
| Tax-free | Trip ends before Nov 1, 2026, so the **current** rules apply (discount at the till) |

## Planned layout

```
japan-companion/
├── README.md
├── docs/            planning documents (this phase)
├── app/             the PWA source (phase 1)
│   ├── src/
│   │   ├── features/phrasebook/
│   │   ├── features/converter/
│   │   ├── features/signs/
│   │   ├── features/money-guide/
│   │   ├── features/emergency/
│   │   └── i18n/    he.json, en.json
│   └── public/      icons, manifest, offline assets
└── content/         phrase & sign data (JSON), editable without touching code
```

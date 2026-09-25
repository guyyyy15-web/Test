# 3. Architecture

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| App type | **PWA** (Progressive Web App) | No App Store. Installs from Safari with "Add to Home Screen" and works offline. |
| Build | **Vite** | Already used in this repo, fast, simple. |
| UI | **React + TypeScript** (or plain TS; open question) | Easy component reuse for cards and lists |
| Offline | **vite-plugin-pwa** (Workbox service worker) | Precaches all phrases, signs, fonts and audio-free assets |
| i18n | Small JSON dictionaries (`he.json`, `en.json`) + `dir="rtl"` on `<html>` | Hebrew RTL through CSS logical properties (`margin-inline-start`, etc.) |
| Storage | `localStorage` / IndexedDB | Favorites, last exchange rate, personal card. Nothing leaves the phone. |
| Hosting | **GitHub Pages** | Free, and the repo already deploys to Pages |
| Tests | Vitest | Converter maths, i18n completeness (every key exists in both languages) |

## Exchange rates

- Source: `https://open.er-api.com/v6/latest/JPY`. Free, no key, updated
  daily, includes ILS and USD.
- Fetched at most once every 12 h while online. The result and its date are
  cached, and the converter always works from the cache.
- A rate bundled with the app is the fallback on the very first offline
  launch.
- Show "rate from <date>" under the result so you know how fresh it is.
- Optional **manual override**: enter the actual rate your card or the
  exchange booth gave you.

## Japanese audio

- `speechSynthesis` with a `ja-JP` voice. iOS ships Japanese voices ("Kyoko",
  "Otoya"). Speaking works offline once the voice is on the phone.
  **Setup step:** Settings → Accessibility → Spoken Content → Voices →
  Japanese → download.
- Fallback: show the romaji / Hebrew pronunciation large.

## Content model (`content/phrases.json`)

```json
{
  "id": "restaurant.table-for-two",
  "category": "restaurant",
  "ja": "二人です",
  "kana": "ふたりです",
  "romaji": "futari desu",
  "he_pron": "פוּטָרִי דֶס",
  "he": "שניים, בבקשה (שולחן לשניים)",
  "en": "Two people, please",
  "showcard": true,
  "tags": ["favorite-candidate"]
}
```

Signs (`content/signs.json`) use the same idea: `kanji`, `reading`, `he`,
`en`, `where` (e.g. "station", "restaurant").

## Hebrew / RTL notes

- Hebrew UI: `<html lang="he" dir="rtl">`. Japanese strings are wrapped in
  `<span lang="ja" dir="ltr">` so they never flip.
- Numbers and currency are shown with `Intl.NumberFormat` (`he-IL`, `en-US`,
  `ja-JP`).
- Font stack: system fonts (SF Pro / Hiragino on iOS already cover Hebrew
  and Japanese). No web font download is needed.

## Privacy

No accounts, no analytics, no server. The only network call is the
exchange-rate fetch.

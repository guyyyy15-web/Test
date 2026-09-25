---
name: japanese-phrase-content
description: How to write and check the Japanese phrase, sign and listening-card content for Japan Companion (app/src/content/*.json). Covers the JSON schema, politeness level, Hebrew transliteration rules for Japanese, and a verification checklist. Use whenever adding, editing or reviewing a phrase, sign, menu word or show-card, or when someone asks "how do I say X in Japanese" for the app.
---

# Japanese phrase content

The content is the product. A wrong phrase handed to a waiter is worse than
no phrase. Everything in `app/src/content/` must pass the checklist below.

## Files

| File | Holds |
|------|-------|
| `phrases.json` | Things **we say**, grouped by category. Can be shown as a card. |
| `listening.json` | Things **they say to us** (konbini, restaurant, station), with what to answer |
| `signs.json` | Kanji seen on signs and menus, for recognising, not saying |
| `vocab.json` + `patterns.ts` | The phrase builder: words with types, and sentence frames with a `{N}` slot |

## Phrase schema

```json
{
  "id": "restaurant.table-for-two",
  "cat": "restaurant",
  "ja": "二人です",
  "kana": "ふたりです",
  "romaji": "futari desu",
  "he_pron": "פוטארי דס",
  "he": "שניים (שולחן לשניים)",
  "en": "Two people (table for two)",
  "card": true
}
```

- `id`: `<cat>.<kebab-slug>`, unique. Never rename one, because favorites
  are stored by id.
- `cat`: must be one of the categories in `app/src/content/categories.ts`.
- `ja`: the natural written form (kanji + kana), exactly what a native would
  write on a note.
- `kana`: the full reading in hiragana (katakana for loanwords). It must
  read `ja` exactly.
- `romaji`: modified Hepburn, lowercase, long vowels written out (`ou`,
  `ee`), particles written as pronounced (`wa`, `e`, `o`).
- `card: true` if it makes sense to show the screen to someone.

## Politeness

- Default to the **desu/masu** polite form. Add `kudasai` / `onegaishimasu`
  for requests.
- Never use casual forms (`da`, plain verbs) in `phrases.json`.
- Prefer short, fixed, set phrases people actually say over literal
  translations. For example, "the check please" is `お会計お願いします`, not
  a word-for-word translation.

## Hebrew transliteration (`he_pron`)

The goal: an Israeli reads it aloud **without niqqud** and is understood.
Use the unpointed style common in Israeli travel guides:
`אריגאטו גוזאימאס`, `סומימאסן`, `קוניצ'יווה`.

| Japanese | Hebrew | Example |
|----------|--------|---------|
| a | א inside a word, ה or א at the end | `sumimasen` → סומימאסן, `futari` → פוטארי |
| i | י | `kippu` → קיפו |
| u | ו | `sushi` → סושי |
| e | usually nothing; ה at the end of a word; א at the start | `desu` → דס, `kore` → קורה, `eki` → אקי |
| o | ו | `onegai` → אונגאי |
| long vowel (ou, ee, ii) | write it once (length isn't marked) | `arigatou` → אריגאטו |
| devoiced final `su` | ס | `masu` → מאס, `desu` → דס |
| ch | צ' | `ocha` → אוצ'ה |
| ts | צ | `tsuki` → צוקי |
| j | ג' | `daijoubu` → דאיג'ובו |
| sh | ש | |
| fu | פו | `futari` → פוטארי |
| g | ג | |
| r | ר | |
| w | ו | `wa` → ווה at the start, וה after a word |
| small っ (double consonant) | write the consonant once | `kitte` → קיטה |
| ん before a vowel/y | ן + space or ' | `kon'ya` → קון'יה |

Stress is flat in Japanese, so don't mark it. The first time a phrase is
added, read it next to `romaji` aloud. If an Israeli would stumble, simplify.

## Signs schema

```json
{ "id": "exit", "kanji": "出口", "reading": "でぐち", "romaji": "deguchi",
  "he": "יציאה", "en": "Exit", "where": "station" }
```

`where` must be one of `station | street | restaurant | shop | toilet | onsen | hotel | menu`.

## Phrase builder (`vocab.json`, `patterns.ts`)

A frame is a fixed Japanese sentence with one noun slot `{N}` (and `{C}`
for a count). The particle belongs to the **frame** (`{N}はどこですか`),
never to the word, so any noun keeps the sentence grammatical. The job is
to prevent **nonsense**, and that's what types do.

- **Adding a word:** give it every type it really fits (`ticket` is both
  `thing` and `belonging`). Fill `he` (indefinite) and `he_def`
  (definite, with ה in the right place: "תחנת הרכבת", not "התחנת רכבת").
  Set `en_a` when "a/an + en" reads wrong ("an ATM", "cash", "chopsticks").
  Set `counter: "mai"` for flat things (tickets, maps, towels, receipts).
- **Adding a frame:** `accepts` lists only types where *every* word makes
  sense. Read the result for 3–4 words of each accepted type before
  committing.
- **Hebrew gloss:** never glue a prefix letter onto `{he_def}`
  (ל/ב/מ/ה/ו/כ/ש + "התחנה"). Use free-standing words ("עד", "אל",
  "את", "המחיר של") or the indefinite `{he}` ("ב{he}" → "בכרטיס אשראי").
  `builder.test.ts` enforces this.
- **Verbs** go in `vocab.json` as ready **te-form** phrases (温めて,
  ペンを貸して, 写真を撮って) typed `request` ("Could you …?" →
  〜もらえますか) or `may-i` ("May I …?" → 〜もいいですか). Check the
  te-form carefully: う/つ/る → って, む/ぶ/ぬ → んで, く → いて, ぐ → いで,
  す → して, and 行く → 行って. `he` is a Hebrew infinitive ("לחמם את
  זה") because the frames are "תוכלו …?" and "אפשר …?".
- Watch for frames where one type contains a word that turns the sentence
  into nonsense (現金が使えません). Split off a narrower type (`works`)
  rather than accepting a broad one.
- `builder.test.ts` builds every frame × word and checks there are no
  leftover `{…}`, the kana is kana only, and there's Hebrew in the gloss.
  Add a pinned example for any new frame.

## Verification checklist (every change)

1. `kana` reads `ja` exactly. Check each kanji's reading in context
   (e.g. 一人 = ひとり, not いちにん).
2. The phrase is natural and polite. Ask: "would a hotel clerk say this?"
3. `romaji` matches `kana` syllable by syllable.
4. Read `he_pron` aloud: does it sound like `romaji`?
5. `he` and `en` mean the same thing, and both are short.
6. Run `npm test` in `app/`. `content.test.ts` checks ids, categories,
   required fields and that `kana` contains only kana.
7. If unsure about a phrase, leave it out and list it in the PR for a
   native speaker to check. Never guess.

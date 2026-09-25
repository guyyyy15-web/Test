---
name: bilingual-rtl-ui
description: Hebrew/English bilingual UI rules for Japan Companion — the i18n dictionaries (he.ts / en.ts), direction switching, CSS logical properties, isolating Japanese and numbers inside Hebrew text, currency formatting, and Hebrew UI copy tone. Use when adding any user-visible string, building or styling a component, or fixing text that shows up reversed, misaligned or untranslated. For deeper RTL issues also load the hebrew-rtl-forge skill if available.
---

# Hebrew / English UI

## Strings

- Every UI string goes through `t('key')`. No literal text in components.
- Dictionaries: `app/src/i18n/en.ts` is the source of truth for keys, and
  `he.ts` must have **exactly** the same keys. `i18n.test.ts` fails
  otherwise.
- Content text (phrases, signs) is **not** in the dictionaries. It carries
  its own `he` / `en` fields.
- Language choice is stored in `localStorage` (`jc.lang`). The first
  launch defaults to Hebrew.

## Direction

- The `setLang()` helper sets `<html lang dir>`: `he` → `rtl`, `en` → `ltr`.
- CSS uses **logical properties only**: `margin-inline-start`,
  `padding-inline`, `inset-inline-end`, `text-align: start`. Never
  `left`/`right` for layout.
- Icons that mean direction (back arrow, chevron) flip in RTL. Icons that
  don't (🔊, ★, ¥) never flip.
- Japanese is always wrapped: `<span lang="ja" dir="ltr">…</span>`
  (the `<Ja>` component). This gives the right font and keeps the order.
- Amounts: wrap in `<bdi>` (the `<MoneyText>` component), so an amount
  never gets split or reordered inside a Hebrew sentence. `he-IL` puts the
  symbol after the number ("‏96.00 ₪"). That's correct Hebrew style; don't
  "fix" it.

## Numbers and currency

- Use `Intl.NumberFormat` via `formatMoney(amount, currency, lang)`:
  - JPY: 0 decimals.
  - ILS/USD: 2 decimals under 100, 0 decimals at 100 and above.
- Keep Western digits in both languages. That's normal in Israel.

## Hebrew copy tone

- Address **plural / gender-neutral**. The app speaks to a couple:
  imperatives in plural ("הקישו", "בחרו") or noun form ("המרה", "הגדרות").
  Avoid singular masculine ("הקש").
- Short and warm, the way a friend who knows Japan would say it. No
  bureaucratic Hebrew.
- Japanese terms keep their common Israeli spelling: סואיקה, קונביני,
  אונסן, ין.

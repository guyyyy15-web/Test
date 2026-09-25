# 2. Product plan

## Who it's for

Two Hebrew speakers with iPhones, travelling around Japan, who speak no
Japanese. It should work one-handed, with bad signal, while someone is
waiting for an answer.

## Design principles

1. **Offline first.** Everything except refreshing exchange rates works in
   airplane mode.
2. **Three taps or less** to any answer.
3. **Show, don't speak.** A big card you turn toward the other person beats
   trying to pronounce things.
4. **Bilingual.** Hebrew (RTL) and English, switchable at any time.
5. **Content is data.** Phrases and signs live in JSON files, so adding one
   never needs a code change.

## Features

### A. Language (MVP)

| Feature | Details |
|---------|---------|
| **Phrasebook** | About 150 phrases in categories: basics, restaurant, shopping, transport, hotel, onsen, health, emergency. Each has Japanese (kanji + kana), romaji, **Hebrew pronunciation** (e.g. סוּמִימָסֶן), and the meaning in Hebrew and English. |
| **Show-card mode** | Tap a phrase and it fills the screen in big Japanese text, rotated toward the other person, with the screen kept bright. Ready-made examples: "Table for two, please", "Can I pay by card?", "Where is the toilet?", "Please take me to this address". |
| **Speak it** | 🔊 button. iOS has a built-in Japanese voice, which works offline once installed on the phone. |
| **Favorites** | Pin the 10 phrases you actually use. |
| **Sign & menu decoder** | Offline list of ~80 kanji you see everywhere: 出口 exit, 入口 entrance, 男/女 men/women, 押/引 push/pull, 営業中 open, 準備中 closed/preparing, 禁煙 no smoking, 会計 pay here, 大盛 large portion, plus common menu words: ramen types, 牛 beef, 豚 pork, 鶏 chicken, 魚 fish… |
| **Camera translate** | One button that opens Google Translate / Lens. We don't rebuild this. |
| **Numbers & counting** | How to read prices (千 = 1,000, 万 = 10,000!) and how to say "two people" / "two of these". |

### B. Money (MVP)

| Feature | Details |
|---------|---------|
| **Converter** | Big number pad; type ¥ and see ₪ and $ at once (and the other way round). Works offline with the last saved rate and shows the date of that rate. |
| **Mental-math anchors** | A small table: ¥100 / ¥500 / ¥1,000 / ¥5,000 / ¥10,000 in ₪, so you learn it by feel. |
| **Price tag mode** | Type the price → see "≈ ₪X" in large text. Also shows whether the purchase qualifies for tax-free (≥ ¥5,000 before tax, same store, same day). |
| **Cash guide** | Where to withdraw (7-Eleven, Japan Post, Aeon ATMs), where cash-only is common, a coin and banknote guide with pictures. |
| **Tax-free cheat sheet** | Current rules (until October 31, 2026), plus a note on the November 2026 change. |

### C. Getting around (phase 2)

- Suica guide: add to Apple Wallet, top up, the Hokkaido area limits, gate
  problems.
- Taxi card: "Please take me to →" plus a field to paste an address in
  Japanese.
- Etiquette in two minutes: onsen, temples, shoes, tipping, trains,
  rubbish.

### D. Safety (phase 2)

- Emergency numbers, embassy contacts, hospital/pharmacy show-cards
  ("I need a doctor", "Where is a pharmacy?").
- Earthquake do's and don'ts, and a link to the Safety tips app.
- **Personal card**: blood type, allergies, hotel address in Japanese.
  Stored only on the phone.

## More ideas (for discussion)

| Idea | Value | Effort |
|------|-------|--------|
| **Trip wallet**: log spending in ¥, see totals in ₪, split between the two of you | High | Medium |
| **"Konbini decoder"**: what the 7-Eleven / FamilyMart / Lawson staples are, and phrases you'll hear at the till ("Do you need a bag?", "Heat it up?") | High, since you'll hear these daily | Low |
| **Listening cards**: phrases *they* say to you, with meanings (いらっしゃいませ, お箸は?, 温めますか?) | High, often overlooked | Low |
| **Hotel address card**: save each hotel's Japanese address and show it to a taxi driver | High | Low |
| **Daily Japanese word**: one useful word a day, both learn it | Fun | Low |
| **Quiz mode** for phrases on the plane | Fun | Low |
| **Couple mode**: share favorites and the wallet between both phones | Nice | High (needs a backend) |
| **Weather + what to wear** per city | Medium | Low |
| **Size converter** (clothes and shoes, IL/EU/US ↔ JP) | Medium for shopping | Low |
| **Voltage/plug note** (100V, type A; Israeli plugs need an adapter) | Small but important | Trivial |

## Phases

| Phase | Scope | Goal |
|-------|-------|------|
| **0 – Plan** (now) | Research, plan, open questions | Agree on scope |
| **1 – MVP** | PWA shell, he/en toggle, phrasebook + show-cards + audio, sign decoder, converter, cash and tax-free guides | Usable on day one of the trip |
| **2 – Getting around** | Suica/taxi/etiquette, safety & personal card, konbini and listening cards | Covers the daily pain points |
| **3 – Extras** | Trip wallet, quiz, sizes, and so on | Nice to have |

## Definition of done for the MVP

- Installs to the iPhone home screen and opens in airplane mode.
- The converter shows ₪ and $ for any ¥ amount within one tap.
- At least 100 phrases, each with Hebrew pronunciation and working audio.
- The whole UI works in Hebrew (RTL) and English.
- Deployed to a URL both phones can open.

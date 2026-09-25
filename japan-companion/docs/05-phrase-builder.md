# 5. Phrase builder

## Idea

Instead of hunting for a ready-made sentence, you build one in two taps:

1. **Pick what you want to say**: "Where is …?", "How much is …?",
   "No … please", "My … hurts"…
2. **Pick the word**: toilet, station, ramen, passport, head… Or type or
   paste your own (a place name copied from Google Maps).

The app shows a full, correct Japanese sentence with kana, romaji, Hebrew
pronunciation, audio and the show-card. Everything works offline.

## Why this works in Japanese

Japanese marks a noun's role with a **particle after the noun**
(は wa, を o, に ni, まで made, が ga). The rest of the sentence is a
fixed ending that doesn't change with the noun: no gender, no plural, no
articles, no agreement. So:

| Frame | + トイレ (toilet) | + 駅 (station) |
|-------|-------------------|----------------|
| `{N}はどこですか` | トイレはどこですか | 駅はどこですか |
| `{N}までお願いします` | – (makes no sense) | 駅までお願いします |

Grammar never breaks. The only risk is **nonsense** ("My station hurts"),
so each word has **types** and each frame lists the types it accepts.

This is the same approach travel guides teach: learn a few frames, then
swap nouns ("… wa doko desu ka", "… o kudasai", "… wa arimasu ka",
"… nuki de onegaishimasu").

## Frames (v1)

| Group | Frame (EN) | Japanese | Accepts |
|-------|------------|----------|---------|
| Getting around | Where is the …? | {N}はどこですか | place, custom |
| | Is there a … nearby? | 近くに{N}はありますか | place |
| | We want to go to … | {N}に行きたいです | place, pointer-place, custom |
| | How do we get to …? | {N}までどうやって行けばいいですか | place, pointer-place, custom |
| | To …, please (taxi) | {N}までお願いします | place, pointer-place, custom |
| | Is … far from here? | {N}まで遠いですか | place, pointer-place, custom |
| | How long does it take to …? | {N}までどのくらいかかりますか | place, pointer-place, custom |
| | Does this go to …? | これは{N}に行きますか | place, pointer-place, custom |
| | What time does … open / close? | {N}は何時に開きますか / 閉まりますか | place, custom |
| Ordering & shopping | …, please | {N}をお願いします | food, drink, thing, this |
| | … × n, please | {N}を{n}お願いします | food, drink, thing, this (counter つ or 枚) |
| | Do you have …? | {N}はありますか | food, drink, thing, this |
| | How much is …? | {N}はいくらですか | food, drink, thing, this |
| | Where can I buy …? | {N}はどこで買えますか | thing, drink, this |
| | No …, please | {N}抜きでお願いします | ingredient |
| | Is there … in this? | これに{N}は入っていますか | ingredient |
| | Can I use … here? | ここで{N}は使えますか | usable |
| | Where does … leave from? / When is the next …? | {N}はどこから出ますか / 次の{N}は何時ですか | vehicle |
| | Do you know …? | {N}を知っていますか | place, sight, pointer, this, custom |
| Ordering & shopping (v0.3) | Can I have …? | {N}をもらえますか | food, drink, thing, this, amenity |
| | Could you show me …? | {N}を見せてもらえますか | thing, this |
| | Any … you recommend? | おすすめの{N}はありますか | food, drink, sight |
| | How much to rent …? / Where can I rent …? | {N}のレンタルはいくらですか / {N}はどこで借りられますか | rentable |
| | Is … included? | {N}は付いていますか | amenity |
| Requests (v0.3) | Could you …? | {V}もらえますか | request verbs (22) |
| | May I …? | {V}もいいですか | may-i verbs (16) |
| Problems | … is broken / … doesn't work | {N}が壊れています / {N}が使えません | fixture, works |
| | We're looking for … | {N}を探しています | place, thing, belonging, custom |
| | I lost my … | {N}をなくしました | belonging |
| | My … hurts | {N}が痛いです | body |

**Pointer words** make the builder work with maps and fingers: "here"
(ここ) and "this address" (この住所) for places; "this" (これ), "that"
(それ, near the other person) and "that one over there" (あれ) for things.

## Verb frames (v0.3)

"Could you heat it up?", "Can you help me fix that?", "May I take a
photo?" are about **actions**, not things. Japanese makes these regular
too. Take the verb's **te-form** and add a fixed ending:

| Ending | Meaning | Example |
|--------|---------|---------|
| 〜てもらえますか | Could you … (for me)? | 温めてもらえますか: could you heat it up? |
| 〜てもいいですか | May I …? | 写真を撮ってもいいですか: may I take a photo? |

So verbs are stored as ready te-form phrases ("温めて", "地図で教えて",
"ペンを貸して") and slot into `{N}` like any word. The two lists are
separate, because "may I heat it up?" and "could you sit here?" make no
sense.

## Hebrew and English glosses

The Japanese is always correct. The Hebrew/English line under it tells
*you* what you're saying, and follows two rules:

- Hebrew frames avoid prefix letters that fuse with ה (ל/ב/מ + the word).
  They use free-standing words instead: "עד התחנה", "אל התחנה",
  "המחיר של…". Each word has an indefinite form (`he`) and a definite one
  (`he_def`).
- English words carry `en` / `en_a` / `en_the`, so "an ATM", "the station"
  and "this" all read naturally.

## Custom words

"Type your own": for a place name (Kinkakuji, Tokyo Tower…). Paste the
**Japanese** name from Google Maps if you can; a Japanese reader reads
that far more easily than romaji. It's allowed only in frames where a name
makes sense (places, looking for).

## Counters

Japanese counts objects with counters: general things take 〜つ
(ひとつ, ふたつ…), and flat things like tickets, maps and towels take 〜枚
(いちまい, にまい…). Each word stores its counter, and the count picker
offers 1–5.

## Status

Built in v0.2 and extended in v0.3: 34 frames, 190 words and verbs, 1–5 counters, custom names, a
"Recent" list, and the sticky result card with 🔊 and 🪧. Tests build
**every frame × every word it accepts** and check that each sentence is
complete, in kana, and glossed in Hebrew. They also pin known sentences
(トイレはどこですか, 切符を二枚お願いします, わさび抜きでお願いします…)
and forbid Hebrew prefix letters glued to definite nouns.

## Research notes

- Travel-Japanese guides teach exactly these frames as "insert the word
  here" patterns: `… wa doko desu ka`, `… o kudasai`, `… wa arimasu ka`
  ([Migaku](https://migaku.com/blog/japanese/japanese-travel-phrases),
  [The Invisible Tourist](https://www.theinvisibletourist.com/japanese-for-tourists/)).
- `〜抜きでお願いします` ("without …, please") is the standard way to drop
  an ingredient (wasabi, onion, mayo), but small shops may not accommodate it
  ([Japan Experience](https://www.japan-experience.com/plan-your-trip/to-know/japanese-language/ordering-in-a-japanese-restaurant),
  [SubLearn](https://sublearn.com/learn/ja/vocabulary/without)).
- Existing offline apps are fixed phrasebooks of 700–1,600 sentences
  ([Japanese Phrases for Travelers](https://apps.apple.com/us/app/japanese-phrases-for-travelers/id6746664066),
  [Learn Japanese Phrases Offline](https://apps.apple.com/us/app/learn-japanese-phrases-offline/id1341467207)).
  None builds sentences from parts, and none works in Hebrew.

## Later

- Save built sentences to ★ favorites ("Recent" covers most of this now).
- Adjectives ("a bigger one", "cheaper").
- Time slots ("at 7 o'clock", "tomorrow") for reservations.

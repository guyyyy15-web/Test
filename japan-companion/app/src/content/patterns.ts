import type { Bi } from './guide'

/** Word kinds. A frame lists the kinds that make sense in its slot. */
export type WordType =
  | 'place'
  | 'pointer-place'
  | 'this'
  | 'thing'
  | 'food'
  | 'drink'
  | 'ingredient'
  | 'body'
  | 'belonging'
  | 'usable'
  | 'sight'
  | 'fixture'
  | 'rentable'
  | 'amenity'
  | 'vehicle'
  | 'request'
  | 'may-i'
  | 'works'
  | 'custom'

export type PatternGroup = 'around' | 'order' | 'requests' | 'problems'

/**
 * A sentence frame. `{N}` is the noun; `{C}` the count (only with `count: true`).
 * Hebrew/English templates pick the noun form: {he} / {he_def}, {en} / {a} / {the}.
 */
export interface Pattern {
  id: string
  group: PatternGroup
  accepts: WordType[]
  count?: boolean
  label: Bi
  ja: string
  kana: string
  romaji: string
  he_pron: string
  he: string
  en: string
}

const PLACES: WordType[] = ['place', 'pointer-place', 'custom']
const GOODS: WordType[] = ['food', 'drink', 'thing', 'this']

export const PATTERNS: Pattern[] = [
  {
    id: 'where', group: 'around', accepts: ['place', 'custom'],
    label: { he: 'איפה …?', en: 'Where is …?' },
    ja: '{N}はどこですか', kana: '{N}はどこですか', romaji: '{N} wa doko desu ka', he_pron: '{N} וה דוקו דס קה',
    he: 'איפה {he_def}?', en: 'Where is {the}?',
  },
  {
    id: 'nearby', group: 'around', accepts: ['place'],
    label: { he: 'יש … קרוב?', en: 'Is there a … nearby?' },
    ja: '近くに{N}はありますか', kana: 'ちかくに{N}はありますか', romaji: 'chikaku ni {N} wa arimasu ka', he_pron: 'צ\'יקאקו ני {N} וה ארימאס קה',
    he: 'יש {he} קרוב?', en: 'Is there {a} nearby?',
  },
  {
    id: 'go-to', group: 'around', accepts: PLACES,
    label: { he: 'רוצים להגיע אל …', en: 'We want to go to …' },
    ja: '{N}に行きたいです', kana: '{N}にいきたいです', romaji: '{N} ni ikitai desu', he_pron: '{N} ני איקיטאי דס',
    he: 'אנחנו רוצים להגיע אל {he_def}', en: 'We want to go to {the}',
  },
  {
    id: 'how-get', group: 'around', accepts: PLACES,
    label: { he: 'איך מגיעים עד …?', en: 'How do we get to …?' },
    ja: '{N}までどうやって行けばいいですか', kana: '{N}までどうやっていけばいいですか', romaji: '{N} made dou yatte ikeba ii desu ka', he_pron: '{N} מאדה דו יאטה איקבה אי דס קה',
    he: 'איך מגיעים עד {he_def}?', en: 'How do we get to {the}?',
  },
  {
    id: 'taxi', group: 'around', accepts: PLACES,
    label: { he: 'עד …, בבקשה (מונית)', en: 'To …, please (taxi)' },
    ja: '{N}までお願いします', kana: '{N}までおねがいします', romaji: '{N} made onegaishimasu', he_pron: '{N} מאדה אונגאי שימאס',
    he: 'עד {he_def}, בבקשה', en: 'To {the}, please',
  },
  {
    id: 'far', group: 'around', accepts: PLACES,
    label: { he: 'כמה רחוק …?', en: 'Is … far?' },
    ja: '{N}まで遠いですか', kana: '{N}までとおいですか', romaji: '{N} made tooi desu ka', he_pron: '{N} מאדה טואי דס קה',
    he: 'זה רחוק עד {he_def}?', en: 'Is it far to {the}?',
  },
  {
    id: 'how-long', group: 'around', accepts: PLACES,
    label: { he: 'כמה זמן לוקח עד …?', en: 'How long to get to …?' },
    ja: '{N}までどのくらいかかりますか', kana: '{N}までどのくらいかかりますか', romaji: '{N} made dono kurai kakarimasu ka', he_pron: '{N} מאדה דונו קוראי קאקארימאס קה',
    he: 'כמה זמן לוקח להגיע עד {he_def}?', en: 'How long does it take to get to {the}?',
  },
  {
    id: 'does-this-go', group: 'around', accepts: PLACES,
    label: { he: 'זה נוסע עד …?', en: 'Does this go to …?' },
    ja: 'これは{N}に行きますか', kana: 'これは{N}にいきますか', romaji: 'kore wa {N} ni ikimasu ka', he_pron: 'קורה וה {N} ני איקימאס קה',
    he: 'זה (הרכבת/האוטובוס) נוסע עד {he_def}?', en: 'Does this (train/bus) go to {the}?',
  },
  {
    id: 'opens', group: 'around', accepts: ['place', 'custom'],
    label: { he: 'מתי פותחים את …?', en: 'When does … open?' },
    ja: '{N}は何時に開きますか', kana: '{N}はなんじにあきますか', romaji: '{N} wa nanji ni akimasu ka', he_pron: '{N} וה נאנג\'י ני אקימאס קה',
    he: 'באיזו שעה פותחים את {he_def}?', en: 'What time does {the} open?',
  },
  {
    id: 'closes', group: 'around', accepts: ['place', 'custom'],
    label: { he: 'מתי סוגרים את …?', en: 'When does … close?' },
    ja: '{N}は何時に閉まりますか', kana: '{N}はなんじにしまりますか', romaji: '{N} wa nanji ni shimarimasu ka', he_pron: '{N} וה נאנג\'י ני שימארימאס קה',
    he: 'באיזו שעה סוגרים את {he_def}?', en: 'What time does {the} close?',
  },

  {
    id: 'next', group: 'around', accepts: ['vehicle'],
    label: { he: 'מתי ה… הבא?', en: 'When is the next …?' },
    ja: '次の{N}は何時ですか', kana: 'つぎの{N}はなんじですか', romaji: 'tsugi no {N} wa nanji desu ka', he_pron: 'צוגי נו {N} וה נאנג\'י דס קה',
    he: 'מתי היציאה הבאה של {he_def}?', en: 'What time is the next {en}?',
  },
  {
    id: 'leaves-from', group: 'around', accepts: ['vehicle'],
    label: { he: 'מאיפה עולים על …?', en: 'Where does … leave from?' },
    ja: '{N}はどこから出ますか', kana: '{N}はどこからでますか', romaji: '{N} wa doko kara demasu ka', he_pron: '{N} וה דוקו קארה דמאס קה',
    he: 'מאיפה עולים על {he_def}?', en: 'Where does {the} leave from?',
  },
  {
    id: 'know', group: 'around', accepts: ['place', 'sight', 'pointer-place', 'this', 'custom'],
    label: { he: 'אתם מכירים את …?', en: 'Do you know …?' },
    ja: '{N}を知っていますか', kana: '{N}をしっていますか', romaji: '{N} o shitte imasu ka', he_pron: '{N} או שיטה אימאס קה',
    he: 'אתם מכירים את {he_def}?', en: 'Do you know {the}?',
  },

  {
    id: 'please', group: 'order', accepts: GOODS,
    label: { he: '…, בבקשה', en: '…, please' },
    ja: '{N}をお願いします', kana: '{N}をおねがいします', romaji: '{N} o onegaishimasu', he_pron: '{N} או אונגאי שימאס',
    he: '{he}, בבקשה', en: '{En}, please',
  },
  {
    id: 'count', group: 'order', accepts: GOODS, count: true,
    label: { he: '… × כמות, בבקשה', en: '… × number, please' },
    ja: '{N}を{C}お願いします', kana: '{N}を{C}おねがいします', romaji: '{N} o {C} onegaishimasu', he_pron: '{N} או {C} אונגאי שימאס',
    he: '{he} ×{n}, בבקשה', en: '{En} ×{n}, please',
  },
  {
    id: 'have', group: 'order', accepts: GOODS,
    label: { he: 'יש לכם …?', en: 'Do you have …?' },
    ja: '{N}はありますか', kana: '{N}はありますか', romaji: '{N} wa arimasu ka', he_pron: '{N} וה ארימאס קה',
    he: 'יש לכם {he}?', en: 'Do you have {a}?',
  },
  {
    id: 'how-much', group: 'order', accepts: GOODS,
    label: { he: 'כמה עולה …?', en: 'How much is …?' },
    ja: '{N}はいくらですか', kana: '{N}はいくらですか', romaji: '{N} wa ikura desu ka', he_pron: '{N} וה איקורה דס קה',
    he: 'מה המחיר של {he_def}?', en: 'How much is {the}?',
  },
  {
    id: 'buy-where', group: 'order', accepts: ['thing', 'drink', 'this'],
    label: { he: 'איפה קונים …?', en: 'Where can I buy …?' },
    ja: '{N}はどこで買えますか', kana: '{N}はどこでかえますか', romaji: '{N} wa doko de kaemasu ka', he_pron: '{N} וה דוקו דה קאאמאס קה',
    he: 'איפה אפשר לקנות {he}?', en: 'Where can I buy {a}?',
  },
  {
    id: 'without', group: 'order', accepts: ['ingredient'],
    label: { he: 'בלי …, בבקשה', en: 'No …, please' },
    ja: '{N}抜きでお願いします', kana: '{N}ぬきでおねがいします', romaji: '{N} nuki de onegaishimasu', he_pron: '{N} נוקי דה אונגאי שימאס',
    he: 'בלי {he}, בבקשה', en: 'No {en}, please',
  },
  {
    id: 'contains', group: 'order', accepts: ['ingredient'],
    label: { he: 'יש בזה …?', en: 'Is there … in this?' },
    ja: 'これに{N}は入っていますか', kana: 'これに{N}ははいっていますか', romaji: 'kore ni {N} wa haitte imasu ka', he_pron: 'קורה ני {N} וה האיטה אימאס קה',
    he: 'יש בזה {he}?', en: 'Is there {en} in this?',
  },
  {
    id: 'can-use', group: 'order', accepts: ['usable'],
    label: { he: 'אפשר להשתמש כאן ב…?', en: 'Can I use … here?' },
    ja: 'ここで{N}は使えますか', kana: 'ここで{N}はつかえますか', romaji: 'koko de {N} wa tsukaemasu ka', he_pron: 'קוקו דה {N} וה צוקאאמאס קה',
    he: 'אפשר להשתמש כאן ב{he}?', en: 'Can I use {a} here?',
  },

  {
    id: 'can-i-have', group: 'order', accepts: [...GOODS, 'amenity'],
    label: { he: 'אפשר לקבל …?', en: 'Can I have …?' },
    ja: '{N}をもらえますか', kana: '{N}をもらえますか', romaji: '{N} o moraemasu ka', he_pron: '{N} או מוראאמאס קה',
    he: 'אפשר לקבל {he}?', en: 'Can I have {a}?',
  },
  {
    id: 'show-me', group: 'order', accepts: ['thing', 'this'],
    label: { he: 'אפשר לראות את …?', en: 'Can you show me …?' },
    ja: '{N}を見せてもらえますか', kana: '{N}をみせてもらえますか', romaji: '{N} o misete moraemasu ka', he_pron: '{N} או מיסטה מוראאמאס קה',
    he: 'תוכלו להראות לי את {he_def}?', en: 'Could you show me {the}?',
  },
  {
    id: 'recommend', group: 'order', accepts: ['food', 'drink', 'sight'],
    label: { he: 'המלצה על …?', en: 'Any … you recommend?' },
    ja: 'おすすめの{N}はありますか', kana: 'おすすめの{N}はありますか', romaji: 'osusume no {N} wa arimasu ka', he_pron: 'אוסוסומה נו {N} וה ארימאס קה',
    he: 'יש לכם המלצה על {he}?', en: 'Is there {a} you recommend?',
  },
  {
    id: 'rent-price', group: 'order', accepts: ['rentable'],
    label: { he: 'כמה עולה לשכור …?', en: 'How much to rent …?' },
    ja: '{N}のレンタルはいくらですか', kana: '{N}のレンタルはいくらですか', romaji: '{N} no rentaru wa ikura desu ka', he_pron: '{N} נו רנטארו וה איקורה דס קה',
    he: 'כמה עולה לשכור {he}?', en: 'How much is it to rent {a}?',
  },
  {
    id: 'rent-where', group: 'order', accepts: ['rentable'],
    label: { he: 'איפה אפשר לשכור …?', en: 'Where can I rent …?' },
    ja: '{N}はどこで借りられますか', kana: '{N}はどこでかりられますか', romaji: '{N} wa doko de kariraremasu ka', he_pron: '{N} וה דוקו דה קארירארמאס קה',
    he: 'איפה אפשר לשכור {he}?', en: 'Where can I rent {a}?',
  },
  {
    id: 'included', group: 'order', accepts: ['amenity'],
    label: { he: '… כלול?', en: 'Is … included?' },
    ja: '{N}は付いていますか', kana: '{N}はついていますか', romaji: '{N} wa tsuite imasu ka', he_pron: '{N} וה צויטה אימאס קה',
    he: 'זה כולל {he}?', en: 'Is {a} included?',
  },

  {
    id: 'do-for-me', group: 'requests', accepts: ['request'],
    label: { he: 'תוכלו …?', en: 'Could you …?' },
    ja: '{N}もらえますか', kana: '{N}もらえますか', romaji: '{N} moraemasu ka', he_pron: '{N} מוראאמאס קה',
    he: 'תוכלו {he}?', en: 'Could you {en}?',
  },
  {
    id: 'may-i', group: 'requests', accepts: ['may-i'],
    label: { he: 'אפשר …?', en: 'May I …?' },
    ja: '{N}もいいですか', kana: '{N}もいいですか', romaji: '{N} mo ii desu ka', he_pron: '{N} מו אי דס קה',
    he: 'אפשר {he}?', en: 'May I {en}?',
  },

  {
    id: 'looking-for', group: 'problems', accepts: ['place', 'thing', 'custom'],
    label: { he: 'אנחנו מחפשים …', en: "We're looking for …" },
    ja: '{N}を探しています', kana: '{N}をさがしています', romaji: '{N} o sagashite imasu', he_pron: '{N} או סאגאשיטה אימאס',
    he: 'אנחנו מחפשים {he}', en: "We're looking for {a}",
  },
  {
    id: 'lost', group: 'problems', accepts: ['belonging'],
    label: { he: 'איבדתי את …', en: 'I lost my …' },
    ja: '{N}をなくしました', kana: '{N}をなくしました', romaji: '{N} o nakushimashita', he_pron: '{N} או נאקושימאשיטה',
    he: 'איבדתי את {he_def}', en: 'I lost my {en}',
  },
  {
    id: 'hurts', group: 'problems', accepts: ['body'],
    label: { he: 'כואב לי …', en: 'My … hurts' },
    ja: '{N}が痛いです', kana: '{N}がいたいです', romaji: '{N} ga itai desu', he_pron: '{N} גה איטאי דס',
    he: 'כואב לי {he_def}', en: 'My {en} hurts',
  },
  {
    id: 'broken', group: 'problems', accepts: ['fixture'],
    label: { he: 'יש תקלה ב…', en: '… is broken' },
    ja: '{N}が壊れています', kana: '{N}がこわれています', romaji: '{N} ga kowarete imasu', he_pron: '{N} גה קווארטה אימאס',
    he: 'יש תקלה ב{he}', en: '{The} is broken',
  },
  {
    id: 'not-working', group: 'problems', accepts: ['fixture', 'works'],
    label: { he: 'לא מצליחים להשתמש ב…', en: "… doesn't work" },
    ja: '{N}が使えません', kana: '{N}がつかえません', romaji: '{N} ga tsukaemasen', he_pron: '{N} גה צוקאאמאסן',
    he: 'לא מצליחים להשתמש ב{he}', en: "{The} doesn't work",
  },
]

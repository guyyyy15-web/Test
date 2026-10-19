// Built-in songs: traditional, folk and classical melodies only (public
// domain), arranged in C for a 17-key kalimba (C4–E6). Number notation:
// 1 = C4, 1' = C5, 1'' = C6; "-" holds a beat, "_" is half, "." is dotted.
// library.test.ts checks every note exists on the instrument.

import type { Song } from './song'

export const LIBRARY: Song[] = [
  {
    id: 'yonatan',
    title: 'Hänschen klein',
    titleHe: 'יונתן הקטן',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי', 'ישראלי'],
    bpm: 100,
    tab: `5 3 3- | 4 2 2-
1 2 3 4 | 5 5 5-
5 3 3- | 4 2 2-
1 3 5 5 | 1---
2 2 2 2 | 2 3 4-
3 3 3 3 | 3 4 5-
5 3 3- | 4 2 2-
1 3 5 5 | 1---`,
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    titleHe: 'כוכב קטן',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי'],
    bpm: 100,
    tab: `1 1 5 5 | 6 6 5-
4 4 3 3 | 2 2 1-
5 5 4 4 | 3 3 2-
5 5 4 4 | 3 3 2-
1 1 5 5 | 6 6 5-
4 4 3 3 | 2 2 1-`,
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    titleHe: 'האודה לשמחה',
    artist: 'Beethoven',
    difficulty: 'easy',
    category: 'קלאסי',
    tags: ['קלאסי'],
    bpm: 108,
    tab: `3 3 4 5 | 5 4 3 2
1 1 2 3 | 3. 2_ 2-
3 3 4 5 | 5 4 3 2
1 1 2 3 | 2. 1_ 1-`,
    levelNote: 'הנושא הראשי, פעמיים',
    levels: [
      {
        difficulty: 'hard',
        note: 'היצירה המלאה עם החלק האמצעי, אוקטבה למעלה',
        tab: `3' 3' 4' 5' | 5' 4' 3' 2' | 1' 1' 2' 3' | 3'. 2'_ 2'-
3' 3' 4' 5' | 5' 4' 3' 2' | 1' 1' 2' 3' | 2'. 1'_ 1'-
2' 2' 3' 1' | 2' 3'_ 4'_ 3' 1' | 2' 3'_ 4'_ 3' 2' | 1' 2' 5-
3' 3' 4' 5' | 5' 4' 3' 2' | 1' 1' 2' 3' | 2'. 1'_ 1'-`,
      },
    ],
  },
  {
    id: 'mary-lamb',
    title: 'Mary Had a Little Lamb',
    titleHe: 'למרי היה כבש קטן',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי'],
    bpm: 108,
    tab: `3 2 1 2 | 3 3 3-
2 2 2- | 3 5 5-
3 2 1 2 | 3 3 3 3
2 2 3 2 | 1---`,
  },
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    titleHe: 'אחי יעקב',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי'],
    bpm: 100,
    tab: `1' 2' 3' 1' | 1' 2' 3' 1'
3' 4' 5'- | 3' 4' 5'-
5'_ 6'_ 5'_ 4'_ 3' 1' | 5'_ 6'_ 5'_ 4'_ 3' 1'
1' 5 1'- | 1' 5 1'-`,
  },
  {
    id: 'london-bridge',
    title: 'London Bridge',
    titleHe: 'גשר לונדון',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי'],
    bpm: 108,
    tab: `5. 6_ 5 4 | 3 4 5-
2 3 4- | 3 4 5-
5. 6_ 5 4 | 3 4 5-
2- 5- | 3 1--`,
  },
  {
    id: 'row-boat',
    title: 'Row, Row, Row Your Boat',
    titleHe: 'שוטה שוטה סירה',
    difficulty: 'medium',
    category: 'ילדים',
    tags: ['ילדים', 'עממי'],
    bpm: 96,
    tab: `1- 1- | 1. 2_ 3-
3. 2_ 3. 4_ | 5---
1'_ 1'_ 1'_ 5_ 5_ 5_ | 3_ 3_ 3_ 1_ 1_ 1_
5. 4_ 3. 2_ | 1---`,
    levelNote: 'עם הרצף המהיר של "merrily"',
    levels: [
      {
        difficulty: 'easy',
        bpm: 84,
        note: 'בלי הרצף המהיר: ארבעה תווים במקום שנים עשר',
        tab: `1- 1- | 1. 2_ 3-
3. 2_ 3. 4_ | 5---
1' 5 3 1
5. 4_ 3. 2_ | 1---`,
      },
    ],
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    titleHe: 'ג׳ינגל בלס',
    difficulty: 'medium',
    category: 'חגים',
    tags: ['חגים', 'עממי'],
    bpm: 120,
    tab: `3 3 3- | 3 3 3-
3 5 1. 2_ | 3---
4 4 4. 4_ | 4 3 3 3_ 3_
3 2 2 3 | 2- 5-
3 3 3- | 3 3 3-
3 5 1. 2_ | 3---
4 4 4 4 | 4 3 3 3_ 3_
5 5 4 2 | 1---`,
    levelNote: 'הפזמון',
    levels: [
      {
        difficulty: 'hard',
        note: 'בית ופזמון, אוקטבה למעלה',
        tab: `5 3' 2' 1' | 5---
5 3' 2' 1' | 6---
6 4' 3' 2' | 7---
5' 5' 4' 2' | 3'---
5 3' 2' 1' | 5---
5 3' 2' 1' | 6---
6 4' 3' 2' | 5' 5' 5' 5'
6' 5' 4' 2' | 1'---
3' 3' 3'- | 3' 3' 3'- | 3' 5' 1'. 2'_ | 3'---
4' 4' 4'. 4'_ | 4' 3' 3' 3'_ 3'_ | 3' 2' 2' 3' | 2'- 5'-
3' 3' 3'- | 3' 3' 3'- | 3' 5' 1'. 2'_ | 3'---
4' 4' 4' 4' | 4' 3' 3' 3'_ 3'_ | 5' 5' 4' 2' | 1'---`,
      },
    ],
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    titleHe: 'יום הולדת שמח',
    difficulty: 'medium',
    category: 'חגים',
    tags: ['חגים', 'עממי'],
    bpm: 100,
    meter: 3,
    tab: `5. 5_ 6 5 | 1' 7-
5. 5_ 6 5 | 2' 1'-
5. 5_ 5' 3' | 1' 7 6-
4'. 4'_ 3' 1' | 2' 1'--`,
  },
  {
    id: 'brahms-lullaby',
    title: 'Lullaby (Wiegenlied)',
    titleHe: 'שיר הערש של ברהמס',
    artist: 'Brahms',
    difficulty: 'medium',
    category: 'קלאסי',
    tags: ['קלאסי', 'שיר ערש'],
    bpm: 84,
    meter: 3,
    tab: `3_ 3_ 5-- | 3_ 3_ 5--
3_ 5_ 1' 7. 6_ | 6 5 2_ 3_
4 2 2_ 3_ | 4-- 2_ 4_
7_ 6_ 5 7 | 1'--`,
  },
  {
    id: 'canon',
    title: 'Canon in D (theme, in C)',
    titleHe: 'הקנון של פכלבל',
    artist: 'Pachelbel',
    difficulty: 'medium',
    category: 'קלאסי',
    tags: ['קלאסי', 'חתונה'],
    bpm: 72,
    tab: `3'- 2'- | 1'- 7-
6- 5- | 6- 7-
1'- 7- | 6- 5-
4- 3- | 4- 2-`,
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    titleHe: 'אמייזינג גרייס',
    difficulty: 'hard',
    category: 'עממי',
    tags: ['עממי', 'גוספל'],
    bpm: 80,
    meter: 3,
    tab: `5 | 1'- 3'_ 1'_ | 3'- 2' | 1'- 6 | 5- 5
1'- 3'_ 1'_ | 3'- 2' | 5'-- | -- 3'
5'. 3'_ 5'_ 3'_ | 1'- 5 | 6. 1'_ 1'_ 6_ | 5- 5
1'- 3'_ 1'_ | 3'- 2' | 1'--`,
    levelNote: 'עם כל הקישוטים',
    levels: [
      {
        difficulty: 'medium',
        note: 'בלי הקישוטים הקטנים',
        tab: `5 | 1'- 3' | 3'- 2' | 1'- 6 | 5- 5
1'- 3' | 3'- 2' | 5'-- | 5'- 3'
5'- 3' | 1'- 5 | 6- 1' | 5- 5
1'- 3' | 3'- 2' | 1'--`,
      },
    ],
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    titleHe: 'גרינסליבס',
    difficulty: 'hard',
    category: 'עממי',
    tags: ['עממי', 'אנגלי'],
    bpm: 96,
    meter: 3,
    tab: `6 | 1'- 2' | 3'. 4'_ 3' | 2'- 7 | 5. 6_ 7
1'- 6 | 6. 5_ 6 | 7- 5 | 3- 6
1'- 2' | 3'. 4'_ 3' | 2'- 7 | 5. 6_ 7
1'. 7_ 6 | 5. 4_ 5 | 6-- | 6--`,
  },
  {
    id: 'scarborough',
    title: 'Scarborough Fair',
    titleHe: 'סקרבורו פייר',
    difficulty: 'hard',
    category: 'עממי',
    tags: ['עממי', 'אנגלי'],
    bpm: 90,
    meter: 3,
    tab: `2- 2 | 6 6 6 | 3. 4_ 3 | 2--
6 1' 2' | 1' 6 7 | 5 6-- | 6--
2'- 2' | 2' 1' 6 | 6 5 4 | 3 1 2
2'- 6 | 5 4 3 | 2 1 2 | 2--`,
  },
  {
    id: 'auld-lang-syne',
    title: 'Auld Lang Syne',
    titleHe: 'אולד לנג סיין',
    difficulty: 'hard',
    category: 'עממי',
    tags: ['עממי', 'סקוטי', 'חגים'],
    bpm: 84,
    tab: `5 | 1'. 1'_ 1' 3' | 2'. 1'_ 2' 3'
1'. 1'_ 3' 5' | 6'-- 6'
5'. 3'_ 3' 1' | 2'. 1'_ 2' 3'
1'. 6_ 6 5 | 1'--`,
  },
  // ---- More classical ----
  {
    id: 'bach-minuet',
    title: 'Minuet in G (in C)',
    titleHe: 'מינואט בסול',
    artist: 'Bach (Petzold)',
    difficulty: 'medium',
    category: 'קלאסי',
    tags: ['קלאסי', 'בארוק'],
    bpm: 100,
    meter: 3,
    levelNote: 'המנגינה המלאה עם הריצות',
    tab: `5' 1'_ 2'_ 3'_ 4'_ | 5' 1' 1' | 6' 4'_ 5'_ 6'_ 7'_ | 1'' 1' 1'
4' 5'_ 4'_ 3'_ 2'_ | 3' 4'_ 3'_ 2'_ 1'_ | 7 1'_ 2'_ 3'_ 1'_ | 2'--
5' 1'_ 2'_ 3'_ 4'_ | 5' 1' 1' | 6' 4'_ 5'_ 6'_ 7'_ | 1'' 1' 1'
4' 5'_ 4'_ 3'_ 2'_ | 3' 4'_ 3'_ 2'_ 1'_ | 2' 3'_ 2'_ 1'_ 7_ | 1'--`,
    levels: [
      {
        difficulty: 'easy',
        bpm: 90,
        note: 'רק התווים הראשיים, בלי הריצות',
        tab: `5'- 3' | 5' 1' 1' | 6'- 6' | 1'' 1' 1'
4'- 2' | 3'- 1' | 7- 1' | 2'--
5'- 3' | 5' 1' 1' | 6'- 6' | 1'' 1' 1'
4'- 2' | 3'- 1' | 2'- 7 | 1'--`,
      },
    ],
  },
  {
    id: 'haydn-surprise',
    title: 'Surprise Symphony (theme)',
    titleHe: 'סימפוניית ההפתעה',
    artist: 'Haydn',
    difficulty: 'easy',
    category: 'קלאסי',
    tags: ['קלאסי'],
    bpm: 100,
    tab: `1' 1' 3' 3' | 5' 5' 3'-
4' 4' 2' 2' | 7 7 5-
1' 1' 3' 3' | 5' 5' 3'-
4' 4' 2' 2' | 7 7 5-`,
  },
  {
    id: 'going-home',
    title: 'Going Home (New World Symphony, Largo)',
    titleHe: 'מהעולם החדש (לארגו)',
    artist: 'Dvořák',
    difficulty: 'easy',
    category: 'קלאסי',
    tags: ['קלאסי', 'רומנטי'],
    bpm: 66,
    tab: `3 5 5- | 3 2 1-
2 3 5 3 | 2---
3 5 5- | 3 2 1-
2 3 2 1 | 1---`,
  },
  {
    id: 'morning-mood',
    title: 'Morning Mood (Peer Gynt)',
    titleHe: 'מצב רוח של בוקר',
    artist: 'Grieg',
    difficulty: 'medium',
    category: 'קלאסי',
    tags: ['קלאסי', 'רומנטי'],
    bpm: 132,
    meter: 6,
    tab: `5 3 2 1 2 3 | 5 3 2 1 2_ 3_ 2_ 3_
5 3 5 6 3 6 | 5 3 2 1--`,
  },
  {
    id: 'vivaldi-spring',
    title: 'Spring (The Four Seasons)',
    titleHe: 'האביב (ארבע העונות)',
    artist: 'Vivaldi',
    difficulty: 'medium',
    category: 'קלאסי',
    tags: ['קלאסי', 'בארוק'],
    bpm: 100,
    tab: `1 | 3 3 3 2_ 1_ | 5-- 5_ 4_
3 3 3 2_ 1_ | 5-- 5_ 4_
3 4_ 5_ 4 3 | 2---`,
  },
  {
    id: 'can-can',
    title: 'Can-Can (Orpheus in the Underworld)',
    titleHe: 'קאן-קאן',
    artist: 'Offenbach',
    difficulty: 'hard',
    category: 'קלאסי',
    tags: ['קלאסי', 'מהיר'],
    bpm: 112,
    tab: `1 2_ 4_ 3_ 2_ | 5 5 | 5_ 6_ 3_ 4_ | 2 2
2_ 4_ 3_ 2_ | 1_ 1'_ 7_ 6_ | 5_ 4_ 3_ 2_ | 1-
1 2_ 4_ 3_ 2_ | 5 5 | 5_ 6_ 3_ 4_ | 2 2
2_ 4_ 3_ 2_ | 1_ 1'_ 7_ 6_ | 5_ 4_ 3_ 2_ | 1-`,
  },

  // ---- More folk and children's songs ----
  {
    id: 'hot-cross-buns',
    title: 'Hot Cross Buns',
    titleHe: 'לחמניות חמות',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי', 'למתחילים'],
    bpm: 96,
    tab: `3 2 1- | 3 2 1-
1_ 1_ 1_ 1_ 2_ 2_ 2_ 2_ | 3 2 1-`,
  },
  {
    id: 'old-macdonald',
    title: 'Old MacDonald Had a Farm',
    titleHe: 'לדוד משה הייתה חווה',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי'],
    bpm: 108,
    tab: `1' 1' 1' 5 | 6 6 5-
3' 3' 2' 2' | 1'---
5 1' 1' 1' 5 | 6 6 5-
3' 3' 2' 2' | 1'---`,
  },
  {
    id: 'au-clair',
    title: 'Au clair de la lune',
    titleHe: 'לאור הירח',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['ילדים', 'עממי', 'צרפתי'],
    bpm: 96,
    tab: `1' 1' 1' 2' | 3'- 2'- | 1' 3' 2' 2' | 1'---
1' 1' 1' 2' | 3'- 2'- | 1' 3' 2' 2' | 1'---
2' 2' 2' 2' | 6- 6- | 2' 1' 7 6 | 5---
1' 1' 1' 2' | 3'- 2'- | 1' 3' 2' 2' | 1'---`,
  },
  {
    id: 'kumbaya',
    title: 'Kumbaya',
    titleHe: 'קומבאיה',
    difficulty: 'easy',
    category: 'עממי',
    tags: ['עממי', 'מדורה'],
    bpm: 84,
    tab: `1 3 5 5- | 5 6 6 5-
1 3 5 5- | 4 3 2--
1 3 5 5- | 5 6 6 5-
4 3 3 2 2 1---`,
  },
  {
    id: 'saints',
    title: 'When the Saints Go Marching In',
    titleHe: 'כשהקדושים צועדים',
    difficulty: 'medium',
    category: 'עממי',
    tags: ['עממי', 'ג׳אז'],
    bpm: 120,
    tab: `1 3 4 | 5---
1 3 4 | 5---
1 3 4 5- 3- 1- 3- | 2---
3 3 2 1- 1 3- 5 5 4---
3 4 5- 3- 1- 2- | 1---`,
  },
]

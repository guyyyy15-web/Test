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
    tags: ['ילדים', 'עממי', 'ישראלי', 'אירופאי', 'גרמני'],
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
    tags: ['ילדים', 'עממי', 'אירופאי', 'צרפתי', 'רגוע'],
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
    tags: ['קלאסי', 'אירופאי'],
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
    tags: ['ילדים', 'עממי', 'אמריקאי'],
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
    tags: ['ילדים', 'עממי', 'אירופאי', 'צרפתי'],
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
    tags: ['ילדים', 'עממי', 'אירופאי', 'אנגלי'],
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
    tags: ['ילדים', 'עממי', 'אמריקאי'],
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
    tags: ['חגים', 'עממי', 'אמריקאי'],
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
    tags: ['חגים', 'עממי', 'אמריקאי'],
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
    tags: ['קלאסי', 'שיר ערש', 'אירופאי', 'רגוע'],
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
    tags: ['קלאסי', 'חתונה', 'אירופאי', 'רגוע'],
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
    tags: ['עממי', 'גוספל', 'אמריקאי', 'רגוע'],
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
    tags: ['עממי', 'אנגלי', 'אירופאי', 'רגוע'],
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
    tags: ['עממי', 'אנגלי', 'אירופאי', 'רגוע'],
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
    tags: ['עממי', 'סקוטי', 'חגים', 'אירופאי'],
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
    tags: ['קלאסי', 'בארוק', 'אירופאי'],
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
    tags: ['קלאסי', 'אירופאי'],
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
    tags: ['קלאסי', 'רומנטי', 'רגוע'],
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
    tags: ['קלאסי', 'רומנטי', 'אירופאי', 'רגוע'],
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
    tags: ['קלאסי', 'בארוק', 'אירופאי'],
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
    tags: ['קלאסי', 'מהיר', 'אירופאי'],
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
    tags: ['ילדים', 'עממי', 'למתחילים', 'אנגלי'],
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
    tags: ['ילדים', 'עממי', 'אמריקאי'],
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
    tags: ['ילדים', 'עממי', 'צרפתי', 'אירופאי'],
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
    tags: ['עממי', 'מדורה', 'אמריקאי', 'רגוע'],
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
    tags: ['עממי', 'ג׳אז', 'אמריקאי'],
    bpm: 120,
    tab: `1 3 4 | 5---
1 3 4 | 5---
1 3 4 5- 3- 1- 3- | 2---
3 3 2 1- 1 3- 5 5 4---
3 4 5- 3- 1- 2- | 1---`,
  },
  // ---- Japan ----
  {
    id: 'sakura',
    title: 'Sakura Sakura',
    titleHe: 'סאקורה סאקורה',
    difficulty: 'medium',
    category: 'עממי',
    tags: ['יפני', 'עממי', 'רגוע'],
    bpm: 72,
    tab: `6' 6' 7'- | 6' 6' 7'-
6' 7' 1'' 7' | 6' 7'_ 6'_ 4'-
3' 1' 3' 4' | 3' 3'_ 1'_ 7-
6' 7' 1'' 7' | 6' 7'_ 6'_ 4'-
3' 1' 3' 4' | 3' 3'_ 1'_ 7-
6' 6' 7'- | 6' 6' 7'-
3' 4' 7'_ 6'_ 4' | 3'---`,
  },
  {
    id: 'kojo-no-tsuki',
    title: 'Kōjō no Tsuki (The Moon over the Ruined Castle)',
    titleHe: 'הירח מעל הטירה ההרוסה',
    artist: 'Rentarō Taki',
    difficulty: 'medium',
    category: 'עממי',
    tags: ['יפני', 'רגוע'],
    bpm: 66,
    tab: `3' 3' 6' 7' | 1'' 7' 6'-
4' 4' 3' 2' | 3'---
3' 3' 6' 7' | 1'' 7' 6'-
4' 2' 3' 3' | 6---`,
  },

  // ---- Europe ----
  {
    id: 'alle-meine-entchen',
    title: 'Alle meine Entchen',
    titleHe: 'כל הברווזונים שלי',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['אירופאי', 'גרמני', 'ילדים', 'למתחילים'],
    bpm: 100,
    tab: `1 2 3 4 | 5- 5-
6 6 6 6 | 5---
6 6 6 6 | 5---
4 4 4 4 | 3- 3-
2 2 2 2 | 1---`,
  },
  {
    id: 'korobeiniki',
    title: 'Korobeiniki (the Tetris theme)',
    titleHe: 'קורובייניקי (המנגינה של טטריס)',
    difficulty: 'medium',
    category: 'עממי',
    tags: ['אירופאי', 'רוסי', 'עממי', 'משחקים'],
    bpm: 120,
    levelNote: 'המנגינה המלאה',
    tab: `3' 7_ 1'_ 2' 1'_ 7_ | 6 6_ 1'_ 3' 2'_ 1'_
7. 1'_ 2' 3' | 1' 6 6-
2'. 4'_ 6' 5'_ 4'_ | 3'. 1'_ 3' 2'_ 1'_
7 7_ 1'_ 2' 3' | 1' 6 6-`,
    levels: [
      {
        difficulty: 'easy',
        bpm: 96,
        note: 'רק החצי הראשון, לאט',
        tab: `3' 7_ 1'_ 2' 1'_ 7_ | 6 6_ 1'_ 3' 2'_ 1'_
7. 1'_ 2' 3' | 1' 6 6-
3' 7_ 1'_ 2' 1'_ 7_ | 6 6_ 1'_ 3' 2'_ 1'_
7. 1'_ 2' 3' | 1' 6 6-`,
      },
      {
        difficulty: 'hard',
        bpm: 144,
        note: 'הכל פעמיים, מהר',
        tab: `3' 7_ 1'_ 2' 1'_ 7_ | 6 6_ 1'_ 3' 2'_ 1'_
7. 1'_ 2' 3' | 1' 6 6-
2'. 4'_ 6' 5'_ 4'_ | 3'. 1'_ 3' 2'_ 1'_
7 7_ 1'_ 2' 3' | 1' 6 6-
3' 7_ 1'_ 2' 1'_ 7_ | 6 6_ 1'_ 3' 2'_ 1'_
7. 1'_ 2' 3' | 1' 6 6-
2'. 4'_ 6' 5'_ 4'_ | 3'. 1'_ 3' 2'_ 1'_
7 7_ 1'_ 2' 3' | 1' 6 6-`,
      },
    ],
  },
  {
    id: 'o-tannenbaum',
    title: 'O Tannenbaum',
    titleHe: 'הו עץ האשוח',
    difficulty: 'medium',
    category: 'חגים',
    tags: ['אירופאי', 'גרמני', 'חגים'],
    bpm: 90,
    meter: 3,
    tab: `5 | 1'. 1'_ 1' | 2'. 3'_ 3'- | 3' 2' 3' | 4' 7- | 2' 1'-
5 | 1'. 1'_ 1' | 2'. 3'_ 3'- | 3' 2' 3' | 4' 7- | 2' 1'-
5' 5' 3' | 6'. 5'_ 5' | 4' 4'. 4'_ | 4' 2' 5'. 4'_ | 4' 3'-
5 | 1'. 1'_ 1' | 2'. 3'_ 3'- | 3' 2' 3' | 4' 7- | 2' 1'-`,
  },
  {
    id: 'silent-night',
    title: 'Silent Night (Stille Nacht)',
    titleHe: 'לילה שקט',
    artist: 'Gruber',
    difficulty: 'medium',
    category: 'חגים',
    tags: ['אירופאי', 'חגים', 'רגוע', 'שיר ערש'],
    bpm: 84,
    meter: 3,
    tab: `5. 6_ 5 | 3--
5. 6_ 5 | 3--
2'- 2' | 7--
1'- 1' | 5--
6- 6 | 1'. 7_ 6 | 5. 6_ 5 | 3--
6- 6 | 1'. 7_ 6 | 5. 6_ 5 | 3--
2'- 2' | 4'. 2'_ 7 | 1'-- | 3'--
1'. 5_ 3 | 5. 4_ 2 | 1--`,
  },
  {
    id: 'deck-the-halls',
    title: 'Deck the Halls',
    titleHe: 'קשטו את האולמות',
    difficulty: 'medium',
    category: 'חגים',
    tags: ['אירופאי', 'וולשי', 'חגים'],
    bpm: 112,
    tab: `5'. 4'_ 3' 2' | 1' 2' 3' 1' | 2'_ 3'_ 4'_ 2'_ 3'. 2'_ | 1' 7 1'-
5'. 4'_ 3' 2' | 1' 2' 3' 1' | 2'_ 3'_ 4'_ 2'_ 3'. 2'_ | 1' 7 1'-
2'. 3'_ 4' 2' | 3'. 4'_ 5' 2' | 3'_ 4'_ 5' 6'_ 7'_ 1'' | 7' 6' 5'-
5'. 4'_ 3' 2' | 1' 2' 3' 1' | 6'_ 6'_ 6'_ 6'_ 5'. 4'_ | 3' 2' 1'-`,
  },
  {
    id: 'we-wish-you',
    title: 'We Wish You a Merry Christmas',
    titleHe: 'אנחנו מאחלים לכם חג שמח',
    difficulty: 'medium',
    category: 'חגים',
    tags: ['אירופאי', 'אנגלי', 'חגים'],
    bpm: 120,
    meter: 3,
    tab: `5 | 1' 1'_ 2'_ 1'_ 7_ | 6 6 6
2' 2'_ 3'_ 2'_ 1'_ | 7 5 5
3' 3'_ 4'_ 3'_ 2'_ | 1' 6 5_ 5_
6 2' 7 | 1'--`,
  },

  // ---- America ----
  {
    id: 'oh-susanna',
    title: 'Oh! Susanna',
    titleHe: 'הו סוזנה',
    artist: 'Stephen Foster',
    difficulty: 'easy',
    category: 'עממי',
    tags: ['אמריקאי', 'עממי'],
    bpm: 108,
    levelNote: 'הבית',
    tab: `1 2 | 3 5 5. 6_ | 5 3 1. 2_ | 3 3 2 1 | 2---
1 2 | 3 5 5. 6_ | 5 3 1. 2_ | 3 3 2 2 | 1---`,
    levels: [
      {
        difficulty: 'medium',
        note: 'בית ופזמון',
        tab: `1 2 | 3 5 5. 6_ | 5 3 1. 2_ | 3 3 2 1 | 2---
1 2 | 3 5 5. 6_ | 5 3 1. 2_ | 3 3 2 2 | 1---
4- 4- | 6- 6- | 6 5 5 3 | 1 2--
1 2 | 3 5 5. 6_ | 5 3 1. 2_ | 3 3 2 2 | 1---`,
      },
    ],
  },
  {
    id: 'yankee-doodle',
    title: 'Yankee Doodle',
    titleHe: 'יאנקי דודל',
    difficulty: 'easy',
    category: 'עממי',
    tags: ['אמריקאי', 'עממי', 'ילדים'],
    bpm: 120,
    tab: `1' 1' 2' 3' | 1' 3' 2' 5
1' 1' 2' 3' | 1'- 7-
1' 1' 2' 3' | 4' 3' 2' 1'
7 5 6 7 | 1'- 1'-`,
  },
  {
    id: 'camptown-races',
    title: 'Camptown Races',
    titleHe: 'מרוצי קמפטאון',
    artist: 'Stephen Foster',
    difficulty: 'easy',
    category: 'עממי',
    tags: ['אמריקאי', 'עממי'],
    bpm: 116,
    tab: `5 5 3 5 | 6 5 3-
3 2- - | 3 2- -
5 5 3 5 | 6 5 3-
2- 2 3 | 2 1--`,
  },
  {
    id: 'michael-row',
    title: 'Michael, Row the Boat Ashore',
    titleHe: 'מייקל, חתור את הסירה',
    difficulty: 'easy',
    category: 'עממי',
    tags: ['אמריקאי', 'עממי', 'רגוע'],
    bpm: 96,
    tab: `1 3 5- 3 5 6- | 5---
3 5 6- | 5---
3 5 5- 3 4 3- | 2---
1 2 3- 2 1 2- | 1---`,
  },
  {
    id: 'this-old-man',
    title: 'This Old Man',
    titleHe: 'הזקן הזה',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['אמריקאי', 'אנגלי', 'ילדים'],
    bpm: 108,
    tab: `5 3 5- | 5 3 5-
6 5 4 3 | 2 3 4-
3 4 5 1 | 1 1 1_ 2_ 3_ 4_
5- 5 2 | 2 4 3 2 | 1---`,
  },
  {
    id: 'aura-lee',
    title: 'Aura Lee',
    titleHe: 'אורה לי',
    artist: 'George R. Poulton',
    difficulty: 'easy',
    category: 'עממי',
    tags: ['אמריקאי', 'רגוע'],
    bpm: 76,
    tab: `5 1' 7 1' | 2' 6 2'-
1' 7 6 7 | 1'---
5 1' 7 1' | 2' 6 2'-
1' 7 6 7 | 1'---
3' 3' 3' 3' | 3'- 3'-
3' 2' 1' 2' | 3'---
3' 3' 4' 3' | 2' 6 2'-
1' 7 6 7 | 1'---`,
  },
  {
    id: 'rain-rain',
    title: 'Rain, Rain, Go Away',
    titleHe: 'גשם גשם לך מכאן',
    difficulty: 'easy',
    category: 'ילדים',
    tags: ['אמריקאי', 'אנגלי', 'ילדים', 'למתחילים'],
    bpm: 100,
    tab: `5 3- | 5 5 3-
5 5 3 6 | 5 5 3-`,
  },
]

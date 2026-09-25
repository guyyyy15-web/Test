// Guide texts. Each section is a list of short bilingual points; rules are as of Sep 2026.
export interface Bi {
  he: string
  en: string
}

export interface GuideSection {
  id: string
  icon: string
  title: Bi
  points: Bi[]
}

export interface Contact {
  label: Bi
  tel: string
}

export const EMERGENCY_CONTACTS: Contact[] = [
  { label: { he: 'משטרה', en: 'Police' }, tel: '110' },
  { label: { he: 'אמבולנס / כיבוי אש', en: 'Ambulance / fire' }, tel: '119' },
  { label: { he: 'קו חם לתיירים (24/7, אנגלית)', en: 'Japan Visitor Hotline (24/7, English)' }, tel: '050-3816-2787' },
  { label: { he: 'שגרירות ישראל בטוקיו', en: 'Embassy of Israel, Tokyo' }, tel: '03-3264-0911' },
  { label: { he: 'שגרירות – חירום', en: 'Embassy – emergency' }, tel: '090-6020-5007' },
  { label: { he: 'שגרירות – חירום (קו 2)', en: 'Embassy – emergency (line 2)' }, tel: '090-2564-6065' },
]

export const GUIDE: GuideSection[] = [
  {
    id: 'setup',
    icon: '✅',
    title: { he: 'לפני הטיסה', en: 'Before you fly' },
    points: [
      { he: 'התקינו את האפליקציה: ספארי ← שיתוף ← "הוסף למסך הבית". כך היא עובדת גם בלי אינטרנט.', en: 'Install this app: Safari → Share → "Add to Home Screen". That makes it work offline.' },
      { he: 'הורידו קול יפני: הגדרות ← נגישות ← תוכן מדובר ← קולות ← יפנית. בלי זה כפתור ההשמעה לא יעבוד בלי רשת.', en: 'Download a Japanese voice: Settings → Accessibility → Spoken Content → Voices → Japanese. Without it, 🔊 needs a connection.' },
      { he: 'Google Translate: הורידו את חבילת היפנית לשימוש אופליין. מצלמת התרגום שם מעולה לתפריטים.', en: 'Google Translate: download the Japanese offline pack. Its camera mode is great for menus.' },
      { he: 'הוסיפו Suica לארנק של האייפון (Apple Wallet ← + ← כרטיס תחבורה).', en: 'Add a Suica to Apple Wallet (Wallet → + → Transit card).' },
      { he: 'התקינו את אפליקציית Safety tips (התרעות רעידת אדמה באנגלית).', en: 'Install the "Safety tips" app (earthquake alerts in English).' },
      { he: 'מתאם חשמל: ביפן 100V ושקע שטוח (סוג A). תקע ישראלי לא ייכנס.', en: 'Power: Japan is 100V with flat two-pin plugs (type A). Israeli plugs won\'t fit.' },
      { he: 'eSIM או נתב כיס. Wi-Fi ציבורי קיים אבל לא בכל מקום.', en: 'Get an eSIM or pocket Wi-Fi. Public Wi-Fi exists but is patchy.' },
    ],
  },
  {
    id: 'cash',
    icon: '💴',
    title: { he: 'מזומן וכספומטים', en: 'Cash & ATMs' },
    points: [
      { he: 'שמרו כ-¥10,000–20,000 במזומן בכל רגע: מקדשים, מסעדות קטנות, לוקרים וחלק מהמוניות הם מזומן בלבד.', en: 'Keep about ¥10,000–20,000 cash on you: shrines, small eateries, lockers and some taxis are cash only.' },
      { he: 'כספומטים שמקבלים כרטיסים זרים: 7-Eleven (Seven Bank), Japan Post (דואר), Aeon. רוב כספומטי הבנקים לא.', en: 'ATMs that take foreign cards: 7-Eleven (Seven Bank), Japan Post, Aeon. Most bank ATMs don\'t.' },
      { he: 'כשהכספומט שואל אם להמיר בשבילכם – סרבו ("without conversion"). שער ההמרה של הכרטיס שלכם כמעט תמיד עדיף.', en: 'If the ATM or card reader offers to convert for you, decline ("without conversion"). Your card\'s own rate is almost always better.' },
      { he: 'לא נותנים טיפ ביפן. זה אפילו עלול להביך.', en: 'No tipping in Japan. It can even be awkward.' },
      { he: 'בקופה שמים כסף במגש הקטן, לא ביד.', en: 'At the till, put money in the little tray, not in their hand.' },
      { he: 'מטבעות: ¥1, 5, 10, 50, 100, 500. שטרות: ¥1,000, 5,000, 10,000. שמרו ארנק קטן למטבעות, מצטברים הרבה.', en: 'Coins: ¥1, 5, 10, 50, 100, 500. Notes: ¥1,000, 5,000, 10,000. Bring a coin purse; they pile up.' },
    ],
  },
  {
    id: 'tax-free',
    icon: '🧾',
    title: { he: 'קניות פטורות ממס', en: 'Tax-free shopping' },
    points: [
      { he: 'עד 31.10.2026 (כל הטיול שלכם): בחנויות עם שלט Tax-Free מראים דרכון בקופה וה-10% מורדים במקום.', en: 'Until 31 Oct 2026 (your whole trip): at stores with a Tax-Free sign, show your passport and the 10% is taken off at the till.' },
      { he: 'מינימום ¥5,000 לפני מס, באותה חנות, באותו יום.', en: 'Minimum ¥5,000 before tax, same store, same day.' },
      { he: 'מזון וקוסמטיקה נארזים בשקית אטומה – אסור לפתוח עד שעוזבים את יפן.', en: 'Food and cosmetics get sealed in a bag. Don\'t open it until you leave Japan.' },
      { he: 'הדרכון חייב להיות המקורי (לא צילום) עם חותמת הכניסה או רישום הכניסה הדיגיטלי.', en: 'Bring the real passport (not a copy) with your entry stamp or digital landing record.' },
      { he: 'בחנויות כלבו גדולות יש לפעמים דלפק מס נפרד – משלמים מלא ומקבלים החזר באותו מקום.', en: 'Big department stores often have a separate tax counter: pay in full, then get the refund there.' },
      { he: 'מ-1.11.2026 השיטה משתנה: משלמים מחיר מלא ומקבלים החזר בשדה התעופה.', en: 'From 1 Nov 2026 it changes: you pay full price and claim the refund at the airport.' },
    ],
  },
  {
    id: 'suica',
    icon: '🚃',
    title: { he: 'רכבות וסואיקה', en: 'Trains & Suica' },
    points: [
      { he: 'Suica בארנק האייפון עובד ברכבות, אוטובוסים, קונביני ומכונות שתייה ברוב הערים הגדולות.', en: 'Suica in Apple Wallet works on trains, buses, konbini and vending machines in most big cities.' },
      { he: 'טעינה: מתוך Wallet עם כרטיס אשראי (לפעמים כרטיסים זרים נדחים), או במזומן במכונות בתחנות ובקופות 7-Eleven.', en: 'Top up in Wallet with a card (foreign cards are sometimes refused) or with cash at station machines and 7-Eleven tills.' },
      { he: 'אין מעבר רציף בין אזורים (למשל טוקיו ↔ הוקאידו). יוצאים מהשערים ונכנסים מחדש.', en: 'You can\'t ride continuously between regions (e.g. Tokyo ↔ Hokkaido). Exit the gates and re-enter.' },
      { he: 'שינקנסן ואקספרס מוגבל: צריך כרטיס רגיל. קונים במכונות, בקופה (みどりの窓口) או באפליקציה.', en: 'Shinkansen and limited express need a proper ticket: buy at machines, the ticket office (みどりの窓口) or online.' },
      { he: 'השער צפצף ונסגר? לא ללחוץ – ניגשים לחלון של העובד בצד השערים.', en: 'Gate beeped and closed? Don\'t push through: go to the staffed window at the side.' },
      { he: 'עומדים בצד שמאל של המדרגות הנעות בטוקיו, ובצד ימין באוסקה.', en: 'Stand on the left of escalators in Tokyo, on the right in Osaka.' },
    ],
  },
  {
    id: 'etiquette',
    icon: '🙇',
    title: { he: 'נימוסים בשתי דקות', en: 'Etiquette in 2 minutes' },
    points: [
      { he: 'ברכבת: שקט, בלי שיחות טלפון, התיק מקדימה.', en: 'On trains: quiet, no phone calls, bag in front.' },
      { he: 'אין כמעט פחים ברחוב – שומרים שקית לזבל ומרוקנים במלון או בקונביני.', en: 'Almost no public bins: carry a rubbish bag and empty it at the hotel or a konbini.' },
      { he: 'לא אוכלים תוך כדי הליכה. אוכלים ליד הדוכן או בצד.', en: 'Don\'t eat while walking. Eat by the stall or step aside.' },
      { he: 'חולצים נעליים כשרואים מדרגה בכניסה, נעלי בית או טטאמי.', en: 'Take shoes off when you see a raised step, slippers or tatami.' },
      { he: 'אונסן: מתקלחים היטב לפני הכניסה, נכנסים בלי בגד ים, המגבת הקטנה לא נכנסת למים. קעקועים – לשאול קודם.', en: 'Onsen: wash thoroughly first, go in without a swimsuit, keep the small towel out of the water. Tattoos: ask first.' },
      { he: 'מקדש: קידה קלה בשער, שוטפים ידיים ופה במזרקה, לא מצלמים איפה שכתוב 撮影禁止.', en: 'Shrines: a small bow at the gate, rinse hands and mouth at the fountain, no photos where it says 撮影禁止.' },
      { he: 'מקלות: לא נועצים אותם באורז ולא מעבירים אוכל ממקל למקל.', en: 'Chopsticks: never stand them in rice or pass food chopstick to chopstick.' },
      { he: 'לסלרפ נודלס זה לגמרי בסדר, אפילו מחמאה.', en: 'Slurping noodles is fine, even a compliment.' },
    ],
  },
  {
    id: 'emergency',
    icon: '🆘',
    title: { he: 'חירום', en: 'Emergency' },
    points: [
      { he: 'רעידת אדמה: מתחת לשולחן, מגינים על הראש, לא יוצאים החוצה בזמן הרעידה. אחרי – עוקבים אחרי השלטים 避難場所.', en: 'Earthquake: get under a table, protect your head, don\'t run outside while shaking. After: follow 避難場所 signs.' },
      { he: 'דרכון אבד: קודם לקובאן (交番) לאישור משטרה, ואז לשגרירות לתעודת מעבר.', en: 'Lost passport: first a police report at a koban (交番), then the embassy for travel papers.' },
      { he: 'שגרירות ישראל: 3 Nibancho, Chiyoda-ku, Tokyo. קונסוליה א׳–ה׳ 10:00–13:00. חירום אחרי שעות: herum.tokyo@gmail.com', en: 'Israeli Embassy: 3 Nibancho, Chiyoda-ku, Tokyo. Consular Mon–Fri 10:00–13:00. After-hours emergencies: herum.tokyo@gmail.com' },
      { he: 'כרטיסי "הראו לצוות" בנושא בריאות וחירום נמצאים בלשונית ביטויים.', en: 'Show-cards for health and emergencies are in the Phrases tab.' },
    ],
  },
]

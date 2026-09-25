// Release smoke test (see .claude/skills/release-check): iPhone viewport, he + en, every tab,
// converter, show-card, and an offline reload through the service worker. Needs `npm run preview` on :4173.
import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const URL_ = process.env.APP_URL ?? 'http://localhost:4173/'
const OUT = new URL('../../screenshots/', import.meta.url).pathname
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'light',
})
// Deterministic rates, no real network.
await context.route('https://open.er-api.com/**', (route) =>
  route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ result: 'success', time_last_update_unix: 1790294400, rates: { ILS: 0.0192, USD: 0.0063 } }),
  }),
)

const page = await context.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

const check = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
  console.log(`ok  ${msg}`)
}

await page.goto(URL_)
await page.waitForSelector('.tabbar')

const tabs = [
  ['phrases', { he: 'ביטויים', en: 'Phrases' }],
  ['builder', { he: 'בונה משפטים', en: 'Builder' }],
  ['signs', { he: 'שלטים', en: 'Signs' }],
  ['money', { he: 'כסף', en: 'Money' }],
  ['guide', { he: 'מדריך', en: 'Guide' }],
]

for (const lang of ['he', 'en']) {
  const current = await page.evaluate(() => document.documentElement.lang)
  if (current !== lang) await page.click('.lang')
  const dir = await page.evaluate(() => document.documentElement.dir)
  check(dir === (lang === 'he' ? 'rtl' : 'ltr'), `${lang}: dir=${dir}`)
  for (const [id, label] of tabs) {
    await page.click(`.tab:has-text("${label[lang]}")`)
    await page.waitForTimeout(150)
    await page.screenshot({ path: `${OUT}${lang}-${id}.png` })
  }
}

// Converter: ¥5,000 shows ₪ and $.
await page.click('.lang') // back to Hebrew
await page.click('.tab:has-text("כסף")')
for (const k of ['5', '000']) await page.click(`.key:text-is("${k}")`)
const outs = await page.$$eval('.display-out', (els) => els.map((e) => e.textContent))
check(outs.some((t) => t.includes('₪')) && outs.some((t) => t.includes('$')), `converter ¥5,000 → ${outs.join(' / ')}`)
check((await page.textContent('.rate-line')).includes('שער עדכני'), 'live rate picked up')
await page.screenshot({ path: `${OUT}he-money-5000.png`, fullPage: true })

// Builder: "Where is …?" + toilet, then tickets × 2.
await page.click('.tab:has-text("בונה משפטים")')
await page.click('.frame:has-text("איפה …?")')
await page.click('.word:has-text("שירותים")')
check((await page.textContent('.builder-result .ja-line')) === 'トイレはどこですか', 'builder: where + toilet')
await page.screenshot({ path: `${OUT}he-builder.png` })
await page.click('.frame:has-text("× כמות")')
await page.click('.word:has-text("כרטיס") >> nth=0')
await page.click('.stepper button:has-text("+")')
const tickets = await page.textContent('.builder-result .ja-line')
check(tickets === '切符を二枚お願いします', `builder: tickets × 2 → ${tickets}`)
await page.screenshot({ path: `${OUT}he-builder-count.png` })
await page.click('.frame:has-text("תוכלו …?")')
await page.click('.word:has-text("לחמם את זה")')
const heat = await page.textContent('.builder-result .ja-line')
check(heat === '温めてもらえますか', `builder: could you heat it up → ${heat}`)
await page.screenshot({ path: `${OUT}he-builder-request.png` })

// Show-card.
await page.click('.tab:has-text("ביטויים")')
await page.click('.chip:has-text("מסעדה")')
await page.click('.phrase-main >> nth=0')
check(await page.isVisible('.showcard-ja'), 'show-card opens with Japanese text')
await page.screenshot({ path: `${OUT}he-showcard.png` })
await page.click('.showcard-actions .primary')

// Offline reload.
await page.evaluate(() => navigator.serviceWorker.ready)
await page.reload()
await page.waitForFunction(() => !!navigator.serviceWorker.controller)
await context.setOffline(true)
await page.reload()
check(await page.isVisible('.tabbar'), 'app renders offline')
await context.setOffline(false)

check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`)
await browser.close()

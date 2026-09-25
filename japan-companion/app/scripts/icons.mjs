// Renders public/icon.svg to the PNG sizes iOS and the manifest need.
import { chromium } from 'playwright-core'
import { readFile } from 'node:fs/promises'

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
for (const [name, size, square] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['apple-touch-icon.png', 180, true]]) {
  // iOS rounds corners itself, so its icon is a full square.
  const body = square ? svg.replace('rx="112"', 'rx="0"') : svg
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${body}`)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: true })
}
await browser.close()

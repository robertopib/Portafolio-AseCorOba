/**
 * Full-page screenshot harness for the visual-parity gate.
 * Drives the system Chrome headless via puppeteer-core.
 *
 * Usage: node scripts/shoot.mjs <baseUrl> <outDir>
 *   e.g. node scripts/shoot.mjs http://localhost:4173 screenshots/baseline
 *
 * Captures each route at desktop + mobile, in ES and EN (via the nav toggle).
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'fs'
import path from 'path'

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const baseUrl = process.argv[2] || 'http://localhost:4173'
const outDir = process.argv[3] || 'screenshots/out'

const routes = [
  ['home', '/'],
  ['branding', '/proyectos/branding'],
  ['web-apps', '/proyectos/web-apps'],
  ['uxui', '/proyectos/uxui-producto'],
  ['fotografia', '/proyectos/fotografia-producto'],
  ['marketing', '/proyectos/marketing-360'],
]
const viewports = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

mkdirSync(outDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
})

const settle = async (page) => {
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready)
  } catch {}
  // Wait for every <img> to finish loading/decoding (production images come from
  // the CDN and load slower than local disk — without this, screenshots can fire
  // mid-decode and produce spurious diffs).
  try {
    await page.evaluate(async () => {
      const imgs = Array.from(document.images)
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise((res) => {
                img.addEventListener('load', res, { once: true })
                img.addEventListener('error', res, { once: true })
              }),
        ),
      )
    })
  } catch {}
  await sleep(1200)
}

// Click the ES/EN language toggle (the nav button whose text is 'EN' or 'ES').
const toggleLang = async (page) => {
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => ['EN', 'ES'].includes((b.textContent || '').trim()),
    )
    if (btn) { btn.click(); return true }
    return false
  })
  return clicked
}

for (const [name, route] of routes) {
  for (const [vp, w, h] of viewports) {
    const page = await browser.newPage()
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
    await page.goto(baseUrl + route, { waitUntil: 'networkidle0', timeout: 60000 })
    await settle(page)
    await page.screenshot({ path: path.join(outDir, `${name}-${vp}-es.png`), fullPage: true })
    const ok = await toggleLang(page)
    if (ok) { await settle(page); await page.screenshot({ path: path.join(outDir, `${name}-${vp}-en.png`), fullPage: true }) }
    await page.close()
    console.log(`shot ${name}-${vp}${ok ? ' (es+en)' : ' (es)'}`)
  }
}

await browser.close()
console.log('DONE ->', outDir)

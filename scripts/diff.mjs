/**
 * Pixel-diff two screenshot dirs (baseline vs candidate) for the parity gate.
 * Usage: node scripts/diff.mjs screenshots/baseline screenshots/candidate
 * Writes screenshots/diff/<name>.png for any mismatch and prints a summary.
 * Exit code 0 = all match (within tolerance), 1 = differences found.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const [, , baseDir = 'screenshots/baseline', candDir = 'screenshots/candidate'] = process.argv
const diffDir = 'screenshots/diff'
mkdirSync(diffDir, { recursive: true })

const files = readdirSync(baseDir).filter((f) => f.endsWith('.png'))
let totalMismatch = 0
const report = []

for (const f of files) {
  let base, cand
  try {
    base = PNG.sync.read(readFileSync(path.join(baseDir, f)))
    cand = PNG.sync.read(readFileSync(path.join(candDir, f)))
  } catch (e) {
    report.push({ file: f, status: 'MISSING', note: e.message })
    totalMismatch++
    continue
  }
  const w = Math.min(base.width, cand.width)
  const h = Math.min(base.height, cand.height)
  const dimsDiffer = base.width !== cand.width || base.height !== cand.height
  const diff = new PNG({ width: w, height: h })
  // Crop both to common size for the comparison
  const crop = (png) => {
    if (png.width === w && png.height === h) return png
    const out = new PNG({ width: w, height: h })
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (w * y + x) << 2
        const j = (png.width * y + x) << 2
        out.data[i] = png.data[j]; out.data[i + 1] = png.data[j + 1]
        out.data[i + 2] = png.data[j + 2]; out.data[i + 3] = png.data[j + 3]
      }
    return out
  }
  const b = crop(base), c = crop(cand)
  const mismatch = pixelmatch(b.data, c.data, diff.data, w, h, { threshold: 0.1 })
  const pct = ((mismatch / (w * h)) * 100).toFixed(3)
  if (mismatch > 0 || dimsDiffer) {
    writeFileSync(path.join(diffDir, f), PNG.sync.write(diff))
    totalMismatch++
  }
  report.push({
    file: f, mismatchPx: mismatch, pct: `${pct}%`,
    base: `${base.width}x${base.height}`, cand: `${cand.width}x${cand.height}`,
    dimsDiffer,
  })
}

report.sort((a, b) => (b.mismatchPx || 0) - (a.mismatchPx || 0))
for (const r of report) {
  const flag = r.status === 'MISSING' ? 'MISSING' : (r.mismatchPx || r.dimsDiffer) ? 'DIFF' : 'OK  '
  console.log(`${flag} ${r.file}  ${r.pct ?? ''} ${r.dimsDiffer ? `(dims ${r.base} vs ${r.cand})` : ''}`)
}
console.log(`\n${totalMismatch === 0 ? 'ALL MATCH ✅' : totalMismatch + ' file(s) differ ❌'}`)
writeFileSync(path.join(diffDir, 'report.json'), JSON.stringify(report, null, 2))
process.exit(totalMismatch === 0 ? 0 : 1)

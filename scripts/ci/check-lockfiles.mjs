/**
 * CI GATE — two-lockfile invariants.
 *
 * This repo deliberately has TWO independent pnpm projects:
 *   - root  → Vercel project `asecoroba-site`, installs from `pnpm-lock.yaml`
 *   - cms/  → Vercel project `asecoroba-cms`, installs with
 *             `pnpm install --ignore-workspace` from `cms/pnpm-lock.yaml`
 *
 * A root-level `pnpm add` once updated the WRONG lockfile, which would have
 * failed the CMS's frozen install on Vercel. The frozen installs in CI catch the
 * drift itself; this script guards the STRUCTURE that keeps the two separate, so
 * the trap can't be reopened.
 *
 * Usage: node scripts/ci/check-lockfiles.mjs
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const errors = []

const rel = (p) => path.relative(ROOT, p)

// 1. Both lockfiles must exist and be committed.
for (const lock of ['pnpm-lock.yaml', 'cms/pnpm-lock.yaml']) {
  const p = path.join(ROOT, lock)
  if (!existsSync(p)) {
    errors.push(
      `${lock} is missing. Vercel installs with --frozen-lockfile, so a missing lockfile fails the build.`,
    )
  }
}

// 2. cms must NOT be a member of the root pnpm workspace.
//    If it were, a root `pnpm add` would rewrite cms deps into the ROOT lockfile
//    while Vercel keeps installing cms with --ignore-workspace from cms/pnpm-lock.yaml.
const wsPath = path.join(ROOT, 'pnpm-workspace.yaml')
if (existsSync(wsPath)) {
  const ws = readFileSync(wsPath, 'utf8')
  const pkgs = [...ws.matchAll(/^\s*-\s*'?"?([^'"\n]+?)'?"?\s*$/gm)].map((m) => m[1].trim())
  const cmsMembers = pkgs.filter((p) => p === 'cms' || p.startsWith('cms/') || p === '**' || p === '*')
  if (cmsMembers.length) {
    errors.push(
      `pnpm-workspace.yaml lists ${cmsMembers.map((c) => `'${c}'`).join(', ')}, which pulls cms/ into the root workspace. ` +
        `Vercel builds the CMS with \`pnpm install --ignore-workspace\` against cms/pnpm-lock.yaml — ` +
        `keep cms out of the workspace so the two lockfiles stay independent.`,
    )
  } else {
    console.log(`pnpm-workspace.yaml packages: ${pkgs.map((p) => `'${p}'`).join(', ')} — cms excluded ✓`)
  }
} else {
  console.log('no pnpm-workspace.yaml — nothing to check')
}

// 3. Root lockfile must not have resolved the CMS's own package as a workspace importer.
const rootLock = path.join(ROOT, 'pnpm-lock.yaml')
if (existsSync(rootLock)) {
  const lock = readFileSync(rootLock, 'utf8')
  if (/^\s{2}cms:\s*$/m.test(lock)) {
    errors.push(
      `pnpm-lock.yaml contains a 'cms:' importer — the CMS was installed through the root workspace. ` +
        `Run \`pnpm install\` at the root and \`pnpm install --ignore-workspace\` inside cms/ separately.`,
    )
  } else {
    console.log('root pnpm-lock.yaml has no cms importer ✓')
  }
}

// 4. CMS lockfile must actually contain the CMS's own dependencies, i.e. it was
//    generated from cms/package.json and not accidentally copied from the root.
const cmsLock = path.join(ROOT, 'cms/pnpm-lock.yaml')
if (existsSync(cmsLock)) {
  const lock = readFileSync(cmsLock, 'utf8')
  if (!lock.includes('payload')) {
    errors.push(
      `cms/pnpm-lock.yaml does not reference payload — it does not look like it was generated from cms/package.json.`,
    )
  } else {
    console.log('cms/pnpm-lock.yaml references payload ✓')
  }
}

for (const e of errors) console.log(`::error title=Lockfiles::${e.replace(/\n/g, '%0A')}`)

if (errors.length) {
  console.error(`\n❌ lockfile invariants: ${errors.length} error(s)`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('\n✅ lockfile invariants OK')

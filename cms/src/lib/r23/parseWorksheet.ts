/**
 * R23b-i — read the owner's client answers out of the committed worksheet.
 *
 * The worksheet (`docs/delivery/r23-backfill-mapping.md`) is the human decision gate:
 * the client behind each of the 40 photographs is NOT recoverable from the row text
 * (`Croissant Artesanal` and `Croissant Premium` carry no client marker at all, yet are
 * D'Argent's), so the owner filled it in by hand. R23a's prefix-grouping is the bug this
 * whole task corrects — see r23-backfill-mapping.md's header.
 *
 * WHY A PARSER AND NOT A HAND-TRANSCRIBED TABLE. A wrong client on the right file forms a
 * wrong project that "would look correct" (worksheet §3.1). Transcribing 40 rows by hand
 * reintroduces exactly that risk one layer down. Parsing the committed markdown removes it,
 * and lets a unit test assert forever that the map the migration uses still equals what the
 * owner wrote.
 *
 * PURE ON PURPOSE: no `fs`, no `path`, no Payload. That is what lets the root Vitest suite
 * import it (root tsconfig has no @types/node) and what makes it unit-testable at all.
 *
 * ── The three table shapes, and why precedence matters ──────────────────────
 * Under each `### 2.x <Categoría>` heading the worksheet mixes three layouts:
 *
 *   1. a `**CLIENTE**` column          — every "B. Falta el cliente" table
 *   2. a `→ Cliente` column            — the five logos, Marketing A, Web y Apps A
 *   3. neither: the client is the bold line above the table
 *                                      — `**WodFest Costa Rica** · Branding → …`
 *
 * Columns are checked BEFORE the heading, and that order is load-bearing: the logos table
 * sits under `**Los cinco logos** · Branding → …`, which is a section label and not a
 * client. Reading the heading first would file five logos under one invented client.
 *
 * `—` (U+2014) is the worksheet's explicit token for "no client — its own project" and
 * parses to `null`. A BLANK cell is not an answer and THROWS: blank means "not answered"
 * and must stop the migration before it touches the database
 * (r23-target-model.md §5.2, §5.3 check 0).
 */

/** One photograph's answer. `cliente: null` is the worksheet's `—` — no client, own project. */
export type WorksheetEntry = {
  /** Category slug, matching CATEGORY_SPECS in cms/src/scripts/content-map.ts. */
  categoria: string
  /** Media filename, e.g. `wodfest-1.png`. Unique within a category. */
  archivo: string
  /** Client name exactly as the owner wrote it, or null for `—`. */
  cliente: string | null
}

/** The worksheet's token for "this image has no client and is its own project". */
export const NO_CLIENT = '—'

/**
 * `### 2.x` heading number -> category slug, with the label the heading must still carry.
 * The label is asserted, not just parsed: a renamed heading should fail loudly here rather
 * than silently drop a whole category from the backfill.
 */
const SECTIONS: Record<string, { slug: string; label: string }> = {
  '2.1': { slug: 'branding', label: 'Branding Corporativo' },
  '2.2': { slug: 'fotografia-producto', label: 'Fotografía de Producto' },
  '2.3': { slug: 'marketing-360', label: 'Marketing 360°' },
  '2.4': { slug: 'web-apps', label: 'Web y Apps' },
}

/** Strip markdown emphasis/code decoration from one table cell. */
const cell = (s: string) => s.replace(/\*\*/g, '').replace(/`/g, '').trim()

/** Split a markdown table row into its cells (dropping the leading/trailing pipes). */
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')

/** `| --- | :-: |` — the row between a table's header and its body. */
const isSeparator = (line: string) => /^\|[\s:|-]+\|$/.test(line.trim())

/**
 * Parse the worksheet markdown into one entry per photograph.
 *
 * Only `## 2. Las tablas` is read. Bounding to that section is deliberate: §3's recap table
 * has a `Cliente` column but no `Archivo` column, and §5 embeds a JavaScript listing full of
 * `|` characters inside a fenced block.
 *
 * @throws if a category heading is missing/renamed, if a table under §2 has no `Archivo`
 *   column and no resolvable client, if the same file appears twice in one category, or if
 *   any client cell is blank.
 */
export function parseWorksheet(md: string): WorksheetEntry[] {
  const lines = md.split('\n')

  const start = lines.findIndex((l) => /^##\s+2\.\s/.test(l))
  if (start === -1) throw new Error('parseWorksheet: no "## 2." section found in the worksheet.')
  const rest = lines.slice(start + 1).findIndex((l) => /^##\s+\d/.test(l))
  const body = lines.slice(start + 1, rest === -1 ? undefined : start + 1 + rest)

  const entries: WorksheetEntry[] = []
  const seen = new Set<string>()

  let section: { slug: string; label: string } | null = null
  /** The most recent `**<Cliente>** · …` line — shape 3's fallback. */
  let heading: string | null = null
  /** Column indices of the table currently being read, or null when not in a table. */
  let cols: { archivo: number; cliente: number | null } | null = null

  for (const raw of body) {
    const line = raw.trim()

    if (line.startsWith('|')) {
      if (isSeparator(line)) continue

      const c = cells(line).map(cell)

      // A header row opens a new table: `Archivo` is the column every one of them has.
      const archivo = c.indexOf('Archivo')
      if (archivo !== -1) {
        const cliente = c.findIndex((h) => h === 'CLIENTE' || h === '→ Cliente')
        cols = { archivo, cliente: cliente === -1 ? null : cliente }
        continue
      }

      if (!cols) continue // a table under §2 with no Archivo column — not a worksheet table
      if (!section) throw new Error(`parseWorksheet: table row outside any "### 2.x" section: ${line}`)

      const file = c[cols.archivo]
      if (!file || !file.endsWith('.png')) continue // e.g. a stray note row

      const answer = cols.cliente === null ? heading : c[cols.cliente]
      if (answer === null || answer === undefined || answer === '') {
        throw new Error(
          `parseWorksheet: BLANK client cell for ${section.slug}/${file}. ` +
            'Blank means "not answered" and stops the migration; write a name, or "—" for ' +
            '"no client, its own project" (r23-target-model.md §5.2).',
        )
      }

      const key = `${section.slug}|${file}`
      if (seen.has(key)) throw new Error(`parseWorksheet: ${key} appears twice in the worksheet.`)
      seen.add(key)

      entries.push({
        categoria: section.slug,
        archivo: file,
        cliente: answer === NO_CLIENT ? null : answer,
      })
      continue
    }

    cols = null // any non-table line ends the current table

    const head = line.match(/^###\s+(2\.\d)\s+(.+?)\s+—/)
    if (head) {
      const spec = SECTIONS[head[1]!]
      if (!spec) throw new Error(`parseWorksheet: unexpected section heading "${line}".`)
      if (head[2] !== spec.label) {
        throw new Error(
          `parseWorksheet: section ${head[1]} is titled "${head[2]}" but the parser expects ` +
            `"${spec.label}". If the worksheet was retitled, update SECTIONS.`,
        )
      }
      section = spec
      heading = null
      continue
    }

    // Shape 3's client line: `**Adriana Muñoz** · Branding → **2 imágenes**`. Anchored at the
    // start, so the blockquote notes (`> Nombres que ya existen…: **Ana Grace** · …`) and the
    // bold client names inside row text never match.
    const bold = line.match(/^\*\*(.+?)\*\*\s+·\s/)
    if (bold) heading = bold[1]!
  }

  return entries
}

/** Distinct client names across the whole worksheet, in first-seen order. `—` excluded. */
export const clientNames = (entries: WorksheetEntry[]): string[] => [
  ...new Set(entries.map((e) => e.cliente).filter((c): c is string => c !== null)),
]

/**
 * The generative rule, applied mechanically: one `Cliente` + one `Categoría` = one `Proyecto`
 * (r23-target-model.md §3.0). Each `—` image is its own project, so it gets a key nothing
 * else can collide with.
 */
export const projectKey = (e: WorksheetEntry): string =>
  e.cliente === null ? `${e.categoria}|—|${e.archivo}` : `${e.categoria}|${e.cliente}`

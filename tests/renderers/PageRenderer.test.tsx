/**
 * @vitest-environment jsdom
 *
 * Integration layer (standard §2): PageRenderer against a SYNTHETIC page list.
 *
 * The risk covered is risk 1 — content-shaped breakage. CI builds the site from
 * the committed content/pages.json; production rebuilds against the live CMS. So
 * the composition PageRenderer actually receives in production is one no CI job
 * has ever seen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderPublic } from './render-helpers'
import { PageRenderer } from '../../src/app/PageRenderer'

// Stand in for content/pages.json. PageRenderer imports it directly rather than
// taking blocks as a prop, so the CMS payload can only be varied by replacing the
// module. Resolves to the same path as PageRenderer's own import, and vi.mock is
// hoisted above the import above.
vi.mock('../../content/pages.json', async () => ({
  default: (await import('../fixtures/hostile-content')).hostilePages,
}))

const spyOnConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {})
let consoleError: ReturnType<typeof spyOnConsoleError>

beforeEach(() => {
  consoleError = spyOnConsoleError()
})

afterEach(() => {
  consoleError.mockRestore()
  cleanup()
  // PageRenderer calls useScrollRestoration, which persists a scroll offset to
  // sessionStorage on unmount and reads it back on the next mount. Left alone it
  // leaks between tests in this file, so each test must start from a clean slate.
  sessionStorage.clear()
})

describe('PageRenderer — an unknown blockType must be reported, not swallowed', () => {
  /**
   * Bug it would catch: an editor renames a block in the CMS (or a registry key is
   * dropped in a refactor) and the matching section silently disappears from the
   * live page. Before R12 this branch returned null in total silence — no build
   * failure (CI builds committed fixtures, and a missing registry key is not a
   * type error), no console output, no visual cue. A whole section stopped
   * existing and nobody found out.
   */
  it('reports the unknown blockType, naming the type, the page and the registry', () => {
    renderPublic(<PageRenderer slug="hostile" />)

    expect(consoleError).toHaveBeenCalledTimes(1)
    const message = String(consoleError.mock.calls[0]?.[0])

    // Name the block that vanished...
    expect(message).toContain('renamedInTheCms')
    // ...which page it vanished from...
    expect(message).toContain('hostile')
    // ...and where a developer goes to fix it.
    expect(message).toContain('blockRegistry')
  })

  /**
   * Bug it would catch: making the unknown-block failure loud by THROWING, which
   * would unmount the tree and blank the page — trading one lost section for the
   * whole document. Degrading locally is roadmap R18's error boundary, not this
   * seam's job. The visitor must still get every block that IS known.
   */
  it('renders the surrounding blocks anyway — one bad block is not a blank page', () => {
    renderPublic(<PageRenderer slug="hostile" />)

    // The hero sits before the unknown block and must survive it.
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Título')
    expect(screen.getByRole('button', { name: 'Ver trabajo' })).toBeTruthy()
  })

  /**
   * Bug it would catch: the unknown block's `anchorId` wrapper still being
   * emitted, leaving an empty anchored <div> in the flow — one silent failure
   * traded for a subtler one that also moves the layout.
   */
  it('emits nothing at all for the unknown block, not an empty anchored wrapper', () => {
    const { container } = renderPublic(<PageRenderer slug="hostile" />)
    expect(container.querySelector('#orphan')).toBeNull()
  })

  /**
   * Bug it would catch: a KNOWN blockType being reported as unknown — the new
   * console.error firing on the happy path, which would train everyone to ignore
   * it. This is what keeps the signal worth reading.
   */
  it('stays silent when every blockType is registered', () => {
    renderPublic(<PageRenderer slug="hostile-empty" />)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('PageRenderer — an unknown slug', () => {
  /**
   * Bug it would catch: a page deleted in the CMS while a route still points at
   * it. Rendering nothing is correct (the route shell owns 404s); what must not
   * happen is a throw, which with no error boundary blanks the whole document.
   */
  it('renders nothing rather than throwing', () => {
    const { container } = renderPublic(<PageRenderer slug="no-such-page" />)
    expect(container.innerHTML).toBe('')
  })
})

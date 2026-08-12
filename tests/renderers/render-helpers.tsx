/**
 * The two providers every public renderer needs, and nothing else.
 *
 * Renderers read the active locale from LanguageContext and the project pages
 * link with react-router's <Link>, so a bare render() throws on both counts. This
 * helper is deliberately thin — it is NOT a place to stub content. Content comes
 * from tests/fixtures/hostile-content.ts so each test states its own hostile case
 * in the test body, where a reader can see it.
 */
import { Component, useEffect, type ErrorInfo, type ReactElement, type ReactNode } from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { LanguageProvider, useLanguage } from '../../src/app/context/LanguageContext'

/** Render in the site's default locale (Spanish). */
export function renderPublic(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  )
}

/**
 * Render with the locale switched to English.
 *
 * English is where the bilingual degradation lives: a missing `en` renders blank
 * rather than falling back to Spanish. The switch goes through the context's own
 * `toggleLanguage()` — the same call the visitor's language button makes — rather
 * than reaching into provider internals.
 */
export function renderPublicInEnglish(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <SwitchToEnglish />
        {ui}
      </LanguageProvider>
    </MemoryRouter>,
  )
}

function SwitchToEnglish() {
  const { language, toggleLanguage } = useLanguage()
  useEffect(() => {
    if (language === 'es') toggleLanguage()
  }, [language, toggleLanguage])
  return null
}

const BOUNDARY_FALLBACK = 'the tree above this component was destroyed'

class CatchRenderError extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? BOUNDARY_FALLBACK : this.props.children
  }
}

/**
 * Render something that is expected to throw during render, and return the error.
 *
 * There is NO error boundary anywhere in src/ (roadmap R18), so in production a
 * throwing renderer unmounts everything up to the React root and the visitor gets
 * a blank document. This helper supplies the boundary the app does not have,
 * purely so a test can observe the blast radius: the assertion to make is that
 * the whole subtree was replaced by the fallback, i.e. the failure did not stay
 * local to the section that caused it.
 *
 * React re-logs an uncaught render error through console.error; that is expected
 * output here and is swallowed so a passing run does not look broken.
 */
export function renderExpectingThrow(
  ui: ReactElement,
  /**
   * Set `providers: false` to render with the boundary as the ONLY wrapper. That
   * is how the "used outside LanguageProvider" case is exercised — wrapping it in
   * the provider is precisely what stops it throwing.
   */
  { providers = true }: { providers?: boolean } = {},
): { error: Error | undefined; container: HTMLElement } {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  let error: Error | undefined
  const boundary = <CatchRenderError onError={(e) => (error = e)}>{ui}</CatchRenderError>
  try {
    const { container } = render(
      providers ? (
        <MemoryRouter>
          <LanguageProvider>{boundary}</LanguageProvider>
        </MemoryRouter>
      ) : (
        boundary
      ),
    )
    return { error, container }
  } finally {
    consoleError.mockRestore()
  }
}

/** What the boundary renders in place of the destroyed subtree. */
export { BOUNDARY_FALLBACK }

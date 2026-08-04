/**
 * @vitest-environment jsdom
 *
 * Integration layer (standard §2): the bilingual UI-string lookup — risk 4.
 *
 * LanguageContext.tsx:26 is `translations[language][key] || key`, so a UI string
 * the CMS has not got renders as its own KEY. The visitor reads `nav.back` where
 * a word should be. It is the most visible silent degradation on the site and the
 * cheapest to test.
 *
 * content/ui.json is replaced with a synthetic fixture (standard §5): the real
 * file is CMS-generated, so a test written against its 73 live keys would churn
 * with editor activity and hide the three states that actually matter.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../../src/app/context/LanguageContext'
import { renderExpectingThrow } from './render-helpers'
import { MISSING_UI_KEY } from '../fixtures/hostile-content'

vi.mock('../../content/ui.json', async () => ({
  default: (await import('../fixtures/hostile-content')).hostileUiStrings,
}))

afterEach(cleanup)

/** Renders one UI string the way a section renderer does: `t('some.key')`. */
function UiString({ k }: { k: string }) {
  const { t, language, toggleLanguage } = useLanguage()
  return (
    <>
      <span data-testid="value">{t(k)}</span>
      <button data-testid="toggle" onClick={toggleLanguage}>
        {language}
      </button>
    </>
  )
}

const renderUiString = (key: string) =>
  render(
    <LanguageProvider>
      <UiString k={key} />
    </LanguageProvider>,
  )

describe('LanguageContext — a UI string the CMS does not have', () => {
  /**
   * Bug it would catch: this degradation being taken for a safe fallback, so the
   * raw-key render never gets fixed. `|| key` publishes the KEY to the page: the
   * visitor reads "nav.key.the.cms.does.not.have" instead of a word. No build
   * failure, no console output, no CMS warning — and because ui.json is generated
   * from the CMS, renaming a key produces this instantly.
   *
   * Pinned rather than fixed: a real fix (render nothing, or fall back across
   * locales) changes rendered output and belongs with R18's degradation work.
   */
  it('renders the raw key itself, which is what a visitor then reads', () => {
    renderUiString(MISSING_UI_KEY)
    expect(screen.getByTestId('value').textContent).toBe(MISSING_UI_KEY)
  })

  /**
   * Bug it would catch: `||` being "tidied up" into `??`.
   *
   * The distinction is load-bearing and easy to get backwards — it is the same
   * trap as contentMeta's `?? fallback`, pointing the other way. An editor who
   * CLEARS a UI string leaves an empty string, not an absent key. `||` treats that
   * as missing and renders the key, which is visibly wrong and gets reported.
   * `??` would accept the empty string and ship a silent blank gap instead.
   */
  it('treats a cleared string as missing, because the check is `||` not `??`', () => {
    renderUiString('nav.cleared')
    expect(screen.getByTestId('value').textContent).toBe('nav.cleared')
  })
})

describe('LanguageContext — a UI string the CMS does have', () => {
  /**
   * Bug it would catch: the lookup returning the key for VALID strings too, which
   * would let the tests above pass while the whole site rendered dotted keys.
   */
  it('renders the translation, in each locale', () => {
    renderUiString('nav.back')

    expect(screen.getByTestId('value').textContent).toBe('Volver al inicio')
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('value').textContent).toBe('Back to home')
  })
})

describe('LanguageContext — the default locale', () => {
  /**
   * Bug it would catch: the default flipping to English. Spanish is the site's
   * primary language and the only locale guaranteed to be fully populated; an
   * English default would expose every unfilled `en` field on the site at once.
   */
  it('starts in Spanish', () => {
    renderUiString('nav.back')
    expect(screen.getByTestId('toggle').textContent).toBe('es')
  })

  /** Bug it would catch: the toggle failing to switch, stranding English visitors. */
  it('toggles to English and back', () => {
    renderUiString('nav.back')

    const toggle = screen.getByTestId('toggle')
    expect(toggle.textContent).toBe('es')
    fireEvent.click(toggle)
    expect(toggle.textContent).toBe('en')
    fireEvent.click(toggle)
    expect(toggle.textContent).toBe('es')
  })
})

describe('LanguageContext — a renderer used outside the provider', () => {
  /**
   * Bug it would catch: the guard being dropped. Without it `useContext` returns
   * undefined and destructuring `{ language }` throws a TypeError deep inside an
   * unrelated section — the same blank-page failure as HeroSection's missing
   * field, but with a stack trace that points nowhere useful. The explicit throw
   * is a real feature; this test stops anyone "simplifying" it away.
   */
  it('throws a named error rather than an anonymous TypeError', () => {
    // Rendered WITHOUT LanguageProvider on purpose — renderExpectingThrow's
    // boundary is the only wrapper, so the error observed is the provider's own.
    const { error } = renderExpectingThrow(<UiString k="nav.back" />, {
      providers: false,
    })

    expect(error?.message).toMatch(/useLanguage must be used within a LanguageProvider/)
  })
})

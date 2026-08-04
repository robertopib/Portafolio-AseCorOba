/**
 * @vitest-environment jsdom
 *
 * Integration layer (standard §2): HeroSection against hostile-but-legal content.
 *
 * HeroSection is the worked example in the standard because it is the shortest
 * path from "an editor changed a field" to "the visitor gets nothing":
 * HeroSection.tsx:50 indexes `home.hero.title[language]` with no guard, and there
 * is no error boundary anywhere in src/ (roadmap R18).
 *
 * Assertions are RTL queries — headings, buttons, visible text — because the
 * question these tests answer is what a VISITOR ends up with, not how the
 * component is put together.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { HeroSection } from '../../src/app/components/HeroSection'
import {
  BOUNDARY_FALLBACK,
  renderExpectingThrow,
  renderPublic,
  renderPublicInEnglish,
} from './render-helpers'
import {
  OVER_LONG_EN,
  OVER_LONG_ES,
  OVER_LONG_MIN_LENGTH,
  heroAllHidden,
  heroHappy,
  heroMissingEnglish,
  heroMissingTitle,
  heroOverLongTitle,
} from '../fixtures/hostile-content'

afterEach(cleanup)

describe('HeroSection — a complete hero', () => {
  /**
   * Bug it would catch: a regression in the happy path that the hostile cases
   * below would then mask. Without this, "the heading is missing" could be true
   * for every fixture and three tests would still pass.
   */
  it('renders every field a visitor is meant to see', () => {
    renderPublic(<HeroSection content={heroHappy} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Título')
    expect(screen.getByText('Subtítulo')).toBeTruthy()
    expect(screen.getByText('Cuerpo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver trabajo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Contactar' })).toBeTruthy()
  })
})

describe('HeroSection — an over-long heading (nothing clamps it)', () => {
  /**
   * Bug it would catch: a renderer "defensively" slicing content to a maximum
   * length. An editor's copy would be silently truncated mid-word with no way to
   * tell from the CMS that it had happened. Whatever the editor published is what
   * must reach the page — clamping, if it is ever wanted, is a CSS decision that
   * has to go through pixel-parity, not a quiet `.slice()` in a renderer.
   */
  it('renders the whole over-long heading, truncating nothing', () => {
    renderPublic(<HeroSection content={heroOverLongTitle} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe(OVER_LONG_ES)
    // Guard the fixture itself: an assertion that the text survived intact says
    // nothing if the text was short to begin with.
    expect(OVER_LONG_ES.length).toBeGreaterThan(OVER_LONG_MIN_LENGTH)
  })

  /**
   * Bug it would catch: the layout collapsing around an over-long field — the
   * heading pushing its siblings out of the tree, or the CTAs failing to render
   * because the section's children are laid out relative to it. A visitor who
   * gets an ugly-but-complete hero is in a far better place than one who gets a
   * heading and no way to act on it.
   */
  it('still renders the CTAs and the body alongside it', () => {
    renderPublic(<HeroSection content={heroOverLongTitle} />)

    expect(screen.getByText('Cuerpo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver trabajo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Contactar' })).toBeTruthy()
  })

  it('does the same in English', () => {
    renderPublicInEnglish(<HeroSection content={heroOverLongTitle} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(OVER_LONG_EN)
    expect(screen.getByRole('button', { name: 'View work' })).toBeTruthy()
  })
})

describe('HeroSection — an English translation the editor never filled in', () => {
  /**
   * Bug it would catch: this degradation being mistaken for a fallback. Payload's
   * `fallback: true` (payload.config.ts) serves Spanish when `en` is ABSENT, but
   * an editor who clears the field publishes an EMPTY STRING, which falls back to
   * nothing. The English visitor gets a blank heading, and the CMS reports the
   * field as filled. Nothing anywhere flags it.
   *
   * The assertion pins the real, unpleasant behaviour on purpose. If R18 (or a
   * fallback fix) ever makes English degrade to Spanish instead, this test goes
   * red and forces that to be a deliberate, reviewed change rather than a drive-by.
   */
  it('renders an EMPTY heading in English rather than falling back to Spanish', () => {
    renderPublicInEnglish(<HeroSection content={heroMissingEnglish} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('')
    expect(screen.queryByText('Soy diseñadora gráfica')).toBeNull()
  })

  /**
   * Bug it would catch: an empty `en` taking the rest of the hero down with it.
   * The blank heading is bad; a blank page would be far worse.
   */
  it('leaves the fields that DO have English intact', () => {
    renderPublicInEnglish(<HeroSection content={heroMissingEnglish} />)

    expect(screen.getByText('Body')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'View work' })).toBeTruthy()
  })

  it('is unaffected in Spanish, which is the locale that has the content', () => {
    renderPublic(<HeroSection content={heroMissingEnglish} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Soy diseñadora gráfica',
    )
  })
})

describe('HeroSection — a required field the editor deleted', () => {
  /**
   * Bug it would catch: the blast radius of one missing CMS field, pinned so it
   * cannot quietly get worse — and so it cannot quietly get BETTER without the
   * roadmap noticing.
   *
   * `title` is absent (not empty), so HeroSection.tsx:50's unguarded
   * `home.hero.title[language]` throws a TypeError. With no error boundary
   * anywhere in src/, React unmounts the whole tree and the visitor gets a blank
   * document — not a hero missing its heading.
   *
   * ⚠️ THIS EXPECTATION IS THE R18 RATCHET. R18 adds runtime guards plus an error
   * boundary, at which point this must flip from "throws" to "renders the rest of
   * the hero without the heading". Update it there, deliberately. Do not delete
   * it, and do not add a guard here to make it pass — that IS R18, and it changes
   * rendered output.
   */
  it('throws, taking the whole surrounding tree down — no error boundary (R18)', () => {
    const { error, container } = renderExpectingThrow(
      <HeroSection content={heroMissingTitle} />,
    )

    expect(error).toBeInstanceOf(TypeError)

    // The blast radius, which is the actual finding: nothing of the hero survives.
    // The only reason a fallback is visible at all is that this test supplied the
    // boundary src/ does not have — in production the nearest boundary is the
    // React root, so this is a blank document.
    expect(container.textContent).toBe(BOUNDARY_FALLBACK)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  /**
   * Bug it would catch: someone concluding from the test above that any missing
   * field is fatal, and "fixing" it by making fields non-optional in the CMS. The
   * per-field show/hide meta already handles absence correctly — a field that is
   * explicitly HIDDEN is never indexed, so it never throws. The bug is the
   * unguarded read, not the optionality.
   */
  it('does NOT throw when the field is hidden through the CMS show/hide meta', () => {
    const { container } = renderPublic(<HeroSection content={heroAllHidden} />)

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    // The section itself still renders — an empty hero, not a broken page.
    expect(container.querySelector('section')).not.toBeNull()
  })
})

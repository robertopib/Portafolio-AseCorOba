/**
 * @vitest-environment jsdom
 *
 * Integration layer (standard §2): the gallery "query block" against uploads whose
 * aspect ratios disagree with the layout, and against a variant the CMS renamed.
 *
 * CategoryGallery is where the highest-churn content lands: it renders whatever
 * Proyectos its Categoría currently has, so an editor adding one photo changes
 * this component's input without a line of code changing.
 *
 * The aspect-ratio suites sweep EVERY entry in the variant dispatcher rather than
 * picking one. There are eleven layouts with 22 fixed-aspect containers between
 * them, and the first draft of this file checked one variant — which let a
 * deliberate `object-cover` removal pass while looking green. A new variant added
 * later is covered automatically, because the list comes from the source.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { CategoryGallery, VARIANTS } from '../../src/app/blocks/CategoryGalleryBlocks'
import { renderExpectingThrow, renderPublic, renderPublicInEnglish } from './render-helpers'
import {
  PANORAMA_IMAGE,
  PORTRAIT_IMAGE,
  SQUARE_SOURCES,
  WRONG_ASPECT_SOURCES,
  galleryBeautyUngrouped,
  galleryContent,
  galleryLandscape,
  galleryUnknownVariant,
  galleryWrongAspect,
} from '../fixtures/hostile-content'

const spyOnConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {})
let consoleError: ReturnType<typeof spyOnConsoleError>

beforeEach(() => {
  consoleError = spyOnConsoleError()
})

afterEach(() => {
  consoleError.mockRestore()
  cleanup()
})

/** Every layout an editor can choose in the CMS, taken from the source of truth. */
const everyVariant = Object.keys(VARIANTS)

/** Every image the gallery put on the page, in document order. */
const galleryImages = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('img'))

describe('CategoryGallery — the dispatcher itself', () => {
  /**
   * Bug it would catch: the sweeps below quietly covering nothing. They are all
   * `it.each(everyVariant)`, so if the export ever comes back empty every one of
   * them silently stops running while the suite still reports green.
   */
  it('exposes every layout variant to the sweeps below', () => {
    expect(everyVariant.length).toBeGreaterThan(5)
  })
})

describe.each(everyVariant)('CategoryGallery [%s] — a wrong-aspect upload', (variant) => {
  /**
   * Bug it would catch: a card layout driven by the IMAGE instead of by the grid —
   * sizing a card from intrinsic dimensions, or dropping an image that fails a
   * ratio check. An editor uploading a portrait photo into a slot drawn for
   * landscape would reflow or lose cards, and because production renders live CMS
   * uploads that CI has never seen, nothing would catch it.
   *
   * The assertion is the strongest form available: the markup must be IDENTICAL
   * for portrait/panorama uploads and for square ones once `src` attributes are
   * normalised away. If the only difference is which file is pointed at, the image
   * dimensions cannot have influenced the layout.
   */
  it('renders identical markup whatever the uploaded aspect ratio is', () => {
    const normalise = (html: string) => html.replace(/src="[^"]*"/g, 'src="NORMALISED"')

    const square = renderPublic(
      <CategoryGallery content={galleryContent(variant, SQUARE_SOURCES)} />,
    )
    const squareHtml = normalise(square.container.innerHTML)
    cleanup()

    const mixed = renderPublic(
      <CategoryGallery content={galleryContent(variant, WRONG_ASPECT_SOURCES)} />,
    )

    expect(normalise(mixed.container.innerHTML)).toBe(squareHtml)
  })

  /**
   * Bug it would catch: removal of the crop that makes a wrong-aspect upload safe.
   *
   * The mechanism is `object-cover`/`object-contain` on the image inside a clipped,
   * layout-sized container: the container decides the box and the image is fitted
   * into it. Take either away and a 600x2400 portrait dictates its own card height,
   * pushing the grid apart — the exact failure the standard lists as an unguarded
   * path, across 22 such containers.
   *
   * Asserted structurally rather than by measurement because jsdom computes no
   * layout: no CSS is loaded, so every element reports zero height and a visual
   * assertion here would pass no matter what. The visual guarantee itself is
   * pixel-parity's job; this guards the mechanism pixel-parity depends on.
   */
  it('fits every image to its container instead of letting it set its own size', () => {
    const { container } = renderPublic(
      <CategoryGallery content={galleryContent(variant, WRONG_ASPECT_SOURCES)} />,
    )

    const images = galleryImages(container)
    expect(images.length).toBeGreaterThan(0)

    for (const img of images) {
      expect(img.className).toMatch(/object-(cover|contain)/)
      expect(img.closest('.overflow-hidden')).not.toBeNull()
    }
  })
})

describe('CategoryGallery — card content survives a wrong-aspect upload', () => {
  /**
   * Bug it would catch: a wrong-aspect upload silently costing the visitor a card.
   * Card count is content-driven and must stay so.
   */
  it('renders one image per project, each keeping its alt text', () => {
    const { container } = renderPublic(<CategoryGallery content={galleryWrongAspect} />)

    expect(galleryImages(container)).toHaveLength(galleryWrongAspect.projects.length)
    for (const project of galleryWrongAspect.projects) {
      expect(screen.getByAltText(project.alt.es)).toBeTruthy()
    }
  })

  it('shows the portrait and panorama uploads it was given', () => {
    const { container } = renderPublic(<CategoryGallery content={galleryWrongAspect} />)

    const sources = galleryImages(container).map((img) => img.getAttribute('src'))
    expect(sources).toContain(PORTRAIT_IMAGE)
    expect(sources).toContain(PANORAMA_IMAGE)
  })
})

describe('CategoryGallery — a layoutVariant the CMS renamed', () => {
  /**
   * Bug it would catch: the SECOND silent-drop path in the render chain, one layer
   * below an unregistered blockType. The `categoryGallery` blockType resolves
   * perfectly, so PageRenderer is satisfied and reports nothing — then the variant
   * dispatcher finds no match and the whole gallery renders as nothing. Before R12
   * that happened without a single signal anywhere.
   */
  it('reports the unknown variant, naming it and the dispatcher', () => {
    renderPublic(<CategoryGallery content={galleryUnknownVariant} />)

    expect(consoleError).toHaveBeenCalledTimes(1)
    const message = String(consoleError.mock.calls[0]?.[0])
    expect(message).toContain(galleryUnknownVariant.layoutVariant)
    expect(message).toContain('VARIANTS')
  })

  /** Bug it would catch: degrading by throwing, which blanks the page (R18). */
  it('renders nothing rather than throwing', () => {
    const { container } = renderPublic(
      <CategoryGallery content={galleryUnknownVariant} />,
    )
    expect(container.innerHTML).toBe('')
  })

  /**
   * Bug it would catch: a gallery block whose Categoría reference did not resolve
   * at export time, so `content` never arrives. Same vanished section, and it used
   * to be equally silent.
   */
  it('reports a gallery that arrived with no content at all', () => {
    renderPublic(<CategoryGallery />)

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(String(consoleError.mock.calls[0]?.[0])).toContain('no content')
  })

  /**
   * Bug it would catch: the new reporting firing on the happy path, which would
   * train reviewers to ignore it.
   */
  it('stays silent for a variant that exists', () => {
    renderPublic(<CategoryGallery content={galleryLandscape} />)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('CategoryGallery — the beauty grid, whose cards lost their group', () => {
  /**
   * Bug it would catch: the blast radius of an unset `group` on a Proyecto.
   *
   * branding:beauty is the only variant that partitions its cards, splitting them
   * by `group` into `adrianaMunoz` and `anaGrace` and then indexing fixed slots
   * (`adrianaMunozProjects[0].src`, `[1]`, `.slice(2)`). `group` is optional free
   * text in the CMS, so clearing it, or renaming a studio, empties a partition and
   * the fixed slot indexes past the end — a TypeError, and with no error boundary
   * (roadmap R18) a blank page rather than a short gallery.
   *
   * ⚠️ Another R18 ratchet, like HeroSection's missing title. When R18 lands guards
   * and a boundary, flip this to "renders the cards it does have". Do not fix it
   * here — that changes rendered output and pixel-parity would correctly object.
   */
  it('throws, rather than rendering the cards it does have', () => {
    const { error } = renderExpectingThrow(
      <CategoryGallery content={galleryBeautyUngrouped} />,
    )
    expect(error).toBeInstanceOf(TypeError)
  })
})

describe('CategoryGallery — a missing English translation', () => {
  /**
   * Bug it would catch: an empty `en` on a card's alt text degrading to an empty
   * accessible name instead of the Spanish it was published with. A sighted
   * visitor sees the image and never knows; a screen-reader user gets nothing.
   * Payload's `fallback: true` only covers an ABSENT `en`, not a cleared one.
   */
  it('renders an empty alt in English rather than falling back to Spanish', () => {
    const cleared = {
      ...galleryLandscape,
      projects: galleryLandscape.projects.map((p) => ({
        ...p,
        alt: { es: p.alt.es, en: '' },
      })),
    }

    const { container } = renderPublicInEnglish(<CategoryGallery content={cleared} />)

    const alts = galleryImages(container).map((img) => img.getAttribute('alt'))
    expect(alts.length).toBeGreaterThan(0)
    expect(alts.every((alt) => alt === '')).toBe(true)
    // ...and specifically NOT the Spanish text, which is what a fallback would give.
    expect(alts).not.toContain(galleryLandscape.projects[0]?.alt.es)
  })
})

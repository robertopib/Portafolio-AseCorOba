import type { Block } from 'payload'

import { Hero } from './Hero'
import { PortfolioSection } from './PortfolioSection'
import { ProjectGallery } from './ProjectGallery'
import { RichTextBlock } from './RichTextBlock'
import { TwoColumn } from './TwoColumn'
import { DetailsTable } from './DetailsTable'
import { Timeline } from './Timeline'
import { JourneyMap } from './JourneyMap'
import { PersonaCards } from './PersonaCards'
import { QA } from './QA'
import { InfoColumns } from './InfoColumns'
import { ExperienceAccordion } from './ExperienceAccordion'
import { ContactBlock } from './ContactBlock'
import { ImageBlock } from './ImageBlock'
import { CTAButton } from './CTAButton'
import { SectionHeading } from './SectionHeading'
import { Spacer } from './Spacer'

export {
  Hero,
  PortfolioSection,
  ProjectGallery,
  RichTextBlock,
  TwoColumn,
  DetailsTable,
  Timeline,
  JourneyMap,
  PersonaCards,
  QA,
  InfoColumns,
  ExperienceAccordion,
  ContactBlock,
  ImageBlock,
  CTAButton,
  SectionHeading,
  Spacer,
}

/** Every block available to the Pages page-builder layout. */
export const allBlocks: Block[] = [
  Hero,
  PortfolioSection,
  ProjectGallery,
  SectionHeading,
  RichTextBlock,
  TwoColumn,
  DetailsTable,
  Timeline,
  JourneyMap,
  PersonaCards,
  QA,
  InfoColumns,
  ExperienceAccordion,
  ContactBlock,
  ImageBlock,
  CTAButton,
  Spacer,
]

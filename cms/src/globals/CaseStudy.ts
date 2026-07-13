import type { GlobalConfig } from 'payload'

/**
 * Mirrors content/sections/uxui-casestudy.json (the "Snaga" UX/UI case study).
 *
 * Every field in the source JSON has a home here. Bilingual {es,en} values are
 * `localized: true`; language-agnostic values (image paths, stage numbers) are not.
 * Arrays of bilingual strings are modeled as arrays of { item/text: localized }
 * rows; with ?locale=all a fetch script can pivot each row's .es/.en to reproduce
 * the original parallel arrays.
 *
 * Top-level JSON keys: header, hero, project, intro, problemSolution, details,
 * timeline, journey, personas, sketches, learnings.
 */
export const CaseStudy: GlobalConfig = {
  slug: 'case-study',
  admin: { group: 'Content' },
  fields: [
    // header: { title:{es,en}, tagline:{es,en} }
    {
      type: 'group',
      name: 'header',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'tagline', type: 'text', localized: true },
      ],
    },

    // hero: { image (path), alt:{es,en} }
    {
      type: 'group',
      name: 'hero',
      fields: [
        { name: 'image', type: 'text' }, // language-agnostic path
        { name: 'alt', type: 'text', localized: true },
      ],
    },

    // project: { name:{es,en}, subtitle:{es,en}, overview:[ {label:{es,en}, text:{es,en}} ] }
    {
      type: 'group',
      name: 'project',
      fields: [
        { name: 'name', type: 'text', localized: true },
        { name: 'subtitle', type: 'text', localized: true },
        {
          name: 'overview',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'text', type: 'textarea', localized: true },
          ],
        },
      ],
    },

    // intro: [ {es,en}, ... ]  -> array of localized paragraphs.
    {
      name: 'intro',
      type: 'array',
      fields: [{ name: 'text', type: 'textarea', localized: true }],
    },

    // problemSolution: { problem:{label,text}, solution:{label,text} }
    {
      type: 'group',
      name: 'problemSolution',
      fields: [
        {
          type: 'group',
          name: 'problem',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'text', type: 'textarea', localized: true },
          ],
        },
        {
          type: 'group',
          name: 'solution',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'text', type: 'textarea', localized: true },
          ],
        },
      ],
    },

    // details: { headers:{tools,team,role}, rows:[ {tools,team,role} ] }
    {
      type: 'group',
      name: 'details',
      fields: [
        {
          type: 'group',
          name: 'headers',
          fields: [
            { name: 'tools', type: 'text', localized: true },
            { name: 'team', type: 'text', localized: true },
            { name: 'role', type: 'text', localized: true },
          ],
        },
        {
          name: 'rows',
          type: 'array',
          fields: [
            { name: 'tools', type: 'text', localized: true },
            { name: 'team', type: 'text', localized: true },
            { name: 'role', type: 'text', localized: true },
          ],
        },
      ],
    },

    // timeline: { title, durationLabel, durationValue, phases:[ {phase, duration} ] }
    {
      type: 'group',
      name: 'timeline',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'durationLabel', type: 'text', localized: true },
        { name: 'durationValue', type: 'text', localized: true },
        {
          name: 'phases',
          type: 'array',
          fields: [
            { name: 'phase', type: 'text', localized: true },
            { name: 'duration', type: 'text', localized: true },
          ],
        },
      ],
    },

    // journey: { title, intro:[...], labels:{action,thought,friction},
    //            stages:[ {number, name, action, thought, friction} ],
    //            qa:[ {question, answer?} | {question, bullets:[...]} ] }
    {
      type: 'group',
      name: 'journey',
      fields: [
        { name: 'title', type: 'text', localized: true },
        {
          name: 'intro',
          type: 'array',
          fields: [{ name: 'text', type: 'textarea', localized: true }],
        },
        {
          type: 'group',
          name: 'labels',
          fields: [
            { name: 'action', type: 'text', localized: true },
            { name: 'thought', type: 'text', localized: true },
            { name: 'friction', type: 'text', localized: true },
          ],
        },
        {
          name: 'stages',
          type: 'array',
          fields: [
            { name: 'number', type: 'text' }, // "1".."5" - language-agnostic
            { name: 'name', type: 'text', localized: true },
            { name: 'action', type: 'textarea', localized: true },
            { name: 'thought', type: 'text', localized: true },
            { name: 'friction', type: 'text', localized: true },
          ],
        },
        // qa rows: some have a scalar `answer` ({es,en}), one has `bullets` ([{es,en}]).
        // Both optional fields are provided so every qa entry round-trips.
        {
          name: 'qa',
          type: 'array',
          fields: [
            { name: 'question', type: 'textarea', localized: true },
            { name: 'answer', type: 'textarea', localized: true },
            {
              name: 'bullets',
              type: 'array',
              fields: [{ name: 'text', type: 'textarea', localized: true }],
            },
          ],
        },
      ],
    },

    // personas: { title, intro:[...], qa:[ {question, answer:[...]} ],
    //             sectionLabels:{basicInfo,channels,motivations,painPoints},
    //             cards:[ {name, descriptor, quote, basicInfo:[...], channels:[...],
    //                      motivations:[...], painPoints:[...]} ] }
    {
      type: 'group',
      name: 'personas',
      fields: [
        { name: 'title', type: 'text', localized: true },
        {
          name: 'intro',
          type: 'array',
          fields: [{ name: 'text', type: 'textarea', localized: true }],
        },
        {
          // personas.qa answers are ARRAYS of paragraphs ({es,en}), unlike journey.qa.
          name: 'qa',
          type: 'array',
          fields: [
            { name: 'question', type: 'textarea', localized: true },
            {
              name: 'answer',
              type: 'array',
              fields: [{ name: 'text', type: 'textarea', localized: true }],
            },
          ],
        },
        {
          type: 'group',
          name: 'sectionLabels',
          fields: [
            { name: 'basicInfo', type: 'text', localized: true },
            { name: 'channels', type: 'text', localized: true },
            { name: 'motivations', type: 'text', localized: true },
            { name: 'painPoints', type: 'text', localized: true },
          ],
        },
        {
          name: 'cards',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', localized: true },
            { name: 'descriptor', type: 'text', localized: true },
            { name: 'quote', type: 'textarea', localized: true },
            {
              name: 'basicInfo',
              type: 'array',
              fields: [{ name: 'text', type: 'text', localized: true }],
            },
            {
              name: 'channels',
              type: 'array',
              fields: [{ name: 'text', type: 'text', localized: true }],
            },
            {
              name: 'motivations',
              type: 'array',
              fields: [{ name: 'text', type: 'text', localized: true }],
            },
            {
              name: 'painPoints',
              type: 'array',
              fields: [{ name: 'text', type: 'text', localized: true }],
            },
          ],
        },
      ],
    },

    // sketches: { title, intro:[...], qa:[ {question, answer} ] }
    {
      type: 'group',
      name: 'sketches',
      fields: [
        { name: 'title', type: 'text', localized: true },
        {
          name: 'intro',
          type: 'array',
          fields: [{ name: 'text', type: 'textarea', localized: true }],
        },
        {
          name: 'qa',
          type: 'array',
          fields: [
            { name: 'question', type: 'textarea', localized: true },
            { name: 'answer', type: 'textarea', localized: true },
          ],
        },
      ],
    },

    // learnings: { title, qa:[ {question, answer:[...]} ] }  (answers are arrays)
    {
      type: 'group',
      name: 'learnings',
      fields: [
        { name: 'title', type: 'text', localized: true },
        {
          name: 'qa',
          type: 'array',
          fields: [
            { name: 'question', type: 'textarea', localized: true },
            {
              name: 'answer',
              type: 'array',
              fields: [{ name: 'text', type: 'textarea', localized: true }],
            },
          ],
        },
      ],
    },
  ],
}

import i18next from 'i18next'
import type { PsyEduTopic, PsyEduBlock } from '@psytool/shared'

const SECTION_ORDER: Readonly<Record<string, number>> = { why: 0, how: 1, sources: 2 }

/** Résout une clé i18n psyedu (teen prioritaire si actif), '' si absente. */
export function localizeKey(key: string, isTeenMode: boolean): string {
  if (isTeenMode && i18next.exists(key, { ns: 'psyedu_teen' })) {
    return i18next.t(key, { ns: 'psyedu_teen' })
  }
  if (i18next.exists(key, { ns: 'psyedu' })) {
    return i18next.t(key, { ns: 'psyedu' })
  }
  return ''
}

export function topicTitle(t: PsyEduTopic, isTeenMode: boolean): string {
  return localizeKey(`${t.module_key}.${t.topic_key}.title`, isTeenMode)
}

export function topicSummary(t: PsyEduTopic, isTeenMode: boolean): string {
  return localizeKey(`${t.module_key}.${t.topic_key}.summary`, isTeenMode)
}

export function sortBlocks(blocks: readonly PsyEduBlock[]): PsyEduBlock[] {
  return [...blocks].sort((a, b) => {
    const sectionDelta = (SECTION_ORDER[a.section_key] ?? 99) - (SECTION_ORDER[b.section_key] ?? 99)
    if (sectionDelta !== 0) return sectionDelta
    return a.sort_order - b.sort_order
  })
}

import type { ContentField } from '@services/moduleService'
import type { DomainItem, SuggestionItem } from './types'

// Parsing pur de la config DB-driven du layout activity_log : bornes des
// échelles, couleurs de statut et regroupement des suggestions par domaine.
// Fonctions pures (testables sans rendu) — aucune dépendance React.

export interface ActivityLogConfig {
  pleasureSteps: number[]
  masterySteps: number[]
  pleasureColor: string
  masteryColor: string
  dotDoneColor: string
  dotPlannedColor: string
  locale: string
}

function buildPipSteps(min: number, max: number, step: number): number[] {
  const steps: number[] = []
  for (let v = min; v <= max; v += step) steps.push(v)
  return steps
}

export interface ActivityLogConfigFallbacks {
  successColor: string
  primaryColor: string
}

export function parseActivityLogConfig(
  configField: ContentField | undefined,
  fallbacks: ActivityLogConfigFallbacks,
): ActivityLogConfig {
  const props = configField?.props ?? {}
  const num = (key: string, def: number): number => {
    const parsed = parseInt(props[key] ?? '', 10)
    return Number.isFinite(parsed) ? parsed : def
  }
  return {
    pleasureSteps: buildPipSteps(num('pleasure_min', 0), num('pleasure_max', 10), num('pleasure_step', 1)),
    masterySteps: buildPipSteps(num('mastery_min', 0), num('mastery_max', 10), num('mastery_step', 1)),
    pleasureColor: props['pleasure_color'] ?? '#059669',
    masteryColor: props['mastery_color'] ?? '#4F46E5',
    dotDoneColor: props['dot_done_color'] ?? fallbacks.successColor,
    dotPlannedColor: props['dot_planned_color'] ?? fallbacks.primaryColor,
    locale: props['locale'] ?? 'fr-FR',
  }
}

/** Domaines de vie du seed, triés par sort_order, libellés résolus. */
export function collectDomains(
  fields: ContentField[],
  t: (code: string) => string,
): DomainItem[] {
  return fields
    .filter(f => f.field_type === 'activity_log_domain' && f.text_code != null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({ id: f.id, label: t(f.text_code as string) }))
}

/** Suggestions du seed, triées, avec leur domaine (prop `domain`, atomique). */
export function collectSuggestions(
  fields: ContentField[],
  t: (code: string) => string,
): SuggestionItem[] {
  return fields
    .filter(f => f.field_type === 'activity_log_suggestion' && f.text_code != null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({
      id: f.id,
      text: t(f.text_code as string),
      domainId: f.props['domain'] ?? null,
    }))
    .filter(s => s.text.length > 0)
}

/** Groupe les suggestions par domaine (ordre des domaines du seed, hors-domaine en dernier). */
export function groupSuggestionsByDomain(
  suggestions: SuggestionItem[],
  domains: DomainItem[],
): { domain: DomainItem | null; items: SuggestionItem[] }[] {
  const groups: { domain: DomainItem | null; items: SuggestionItem[] }[] = []
  for (const domain of domains) {
    const items = suggestions.filter(s => s.domainId === domain.id)
    if (items.length > 0) groups.push({ domain, items })
  }
  const orphans = suggestions.filter(s => s.domainId == null || !domains.some(d => d.id === s.domainId))
  if (orphans.length > 0) groups.push({ domain: null, items: orphans })
  return groups
}

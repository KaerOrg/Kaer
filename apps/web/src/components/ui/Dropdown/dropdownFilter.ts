import { normalizeSearch } from '../../../lib/search'
import type { DropdownOption } from './Dropdown.types'

/** Une section de la liste : un en-tête de groupe + ses options. */
export interface OptionSection {
  group: string
  label: string | null
  options: DropdownOption[]
}

/**
 * Options retenues pour `query` (insensible casse/accents via `lib/search`).
 * `query` vide → toutes les options. Une copie est renvoyée (jamais le tableau source).
 */
export function filterOptions(options: readonly DropdownOption[], query: string): DropdownOption[] {
  const needle = normalizeSearch(query)
  if (!needle) return options.slice()
  return options.filter(opt => normalizeSearch(opt.label).includes(needle))
}

/** Regroupe les options par `group`, dans l'ordre d'apparition. `groupLabels` mappe l'en-tête affiché. */
export function groupSections(
  options: readonly DropdownOption[],
  groupLabels?: Readonly<Record<string, string>>,
): OptionSection[] {
  const byGroup = new Map<string, OptionSection>()
  const order: OptionSection[] = []
  for (const opt of options) {
    const group = opt.group ?? ''
    let section = byGroup.get(group)
    if (!section) {
      section = { group, label: groupLabels?.[group] ?? null, options: [] }
      byGroup.set(group, section)
      order.push(section)
    }
    section.options.push(opt)
  }
  return order
}

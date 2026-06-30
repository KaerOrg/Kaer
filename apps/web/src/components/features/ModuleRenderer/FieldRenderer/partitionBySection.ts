import type { ContentField } from '@services/moduleService'

/**
 * Répartit des fields entre leurs sections (`section_id`) et les fields
 * hors section. Utilisé par les layouts `steps`, `cards` et `editable_steps`.
 */
export function partitionBySection(fields: ContentField[]): {
  sections: Map<string, ContentField[]>
  unsectioned: ContentField[]
} {
  const sections = new Map<string, ContentField[]>()
  const unsectioned: ContentField[] = []
  for (const f of fields) {
    if (!f.section_id) {
      unsectioned.push(f)
      continue
    }
    if (!sections.has(f.section_id)) sections.set(f.section_id, [])
    sections.get(f.section_id)!.push(f)
  }
  return { sections, unsectioned }
}

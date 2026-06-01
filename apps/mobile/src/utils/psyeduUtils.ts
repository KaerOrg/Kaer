import type { PsyEduBlock } from '@psytool/shared'

const SECTION_ORDER: Readonly<Record<string, number>> = { why: 0, how: 1, sources: 2 }

export interface SectionGroup {
  key: string
  blocks: PsyEduBlock[]
}

export function groupAndSortBlocks(blocks: readonly PsyEduBlock[]): SectionGroup[] {
  const map = new Map<string, PsyEduBlock[]>()
  for (const block of blocks) {
    const list = map.get(block.section_key) ?? []
    list.push(block)
    map.set(block.section_key, list)
  }
  const groups: SectionGroup[] = []
  for (const [key, sectionBlocks] of map) {
    groups.push({
      key,
      blocks: [...sectionBlocks].sort((a, b) => a.sort_order - b.sort_order),
    })
  }
  return groups.sort((a, b) => (SECTION_ORDER[a.key] ?? 99) - (SECTION_ORDER[b.key] ?? 99))
}

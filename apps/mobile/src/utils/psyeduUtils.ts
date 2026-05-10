import type { PsyEduBlock, PsyEduSectionKey } from '@psytool/shared'

export interface SectionGroup {
  key: PsyEduSectionKey
  blocks: PsyEduBlock[]
}

const SECTION_ORDER: Record<PsyEduSectionKey, number> = { why: 0, how: 1, sources: 2 }

export function groupAndSortBlocks(blocks: readonly PsyEduBlock[]): SectionGroup[] {
  const map = new Map<PsyEduSectionKey, PsyEduBlock[]>()
  for (const block of blocks) {
    const key = block.section_key as PsyEduSectionKey
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(block)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.sort_order - b.sort_order)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (SECTION_ORDER[a] ?? 99) - (SECTION_ORDER[b] ?? 99))
    .map(([key, blks]) => ({ key, blocks: blks }))
}

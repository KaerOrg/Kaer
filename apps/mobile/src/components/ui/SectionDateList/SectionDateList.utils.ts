import type { GroupByDateFn } from './SectionDateList.types'

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

export const groupByDate: GroupByDateFn = (items) => {
  const map = new Map<string, typeof items>()

  for (const item of items) {
    const key = new Date(item.created_at).toLocaleDateString('fr-FR', DATE_FORMAT)
    const group = map.get(key)
    if (group) {
      group.push(item)
    } else {
      map.set(key, [item])
    }
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

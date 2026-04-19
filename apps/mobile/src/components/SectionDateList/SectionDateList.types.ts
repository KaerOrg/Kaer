import type { SectionListProps } from 'react-native'

export interface DateSection<T> {
  title: string
  data: T[]
}

export interface SectionDateListProps<T> extends Omit<SectionListProps<T, DateSection<T>>, 'sections' | 'renderSectionHeader'> {
  sections: DateSection<T>[]
  sectionHeaderStyle?: object
}

export type GroupByDateFn = <T extends { created_at: string }>(items: T[]) => DateSection<T>[]

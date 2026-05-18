import React, { useCallback } from 'react'
import { SectionList, Text, View } from 'react-native'
import { styles } from './SectionDateList.styles'
import type { SectionDateListProps, DateSection } from './SectionDateList.types'

function SectionHeader<T>({ section }: { section: DateSection<T> }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  )
}

export function SectionDateList<T>({ sections, ...props }: SectionDateListProps<T>) {
  const renderHeader = useCallback(({ section }: { section: DateSection<T> }) => (
    <SectionHeader section={section} />
  ), [])

  return (
    <SectionList
      sections={sections}
      renderSectionHeader={renderHeader}
      stickySectionHeadersEnabled
      {...props}
    />
  )
}

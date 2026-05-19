import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { SectionDateList } from './SectionDateList'
import { groupByDate } from './SectionDateList.utils'

describe('groupByDate', () => {
  const items = [
    { id: '1', created_at: '2024-01-15T10:00:00Z', label: 'Item A' },
    { id: '2', created_at: '2024-01-15T14:00:00Z', label: 'Item B' },
    { id: '3', created_at: '2024-01-16T09:00:00Z', label: 'Item C' },
  ]

  it('regroupe les items par date', () => {
    const sections = groupByDate(items)
    expect(sections).toHaveLength(2)
  })

  it('place les items du même jour dans la même section', () => {
    const sections = groupByDate(items)
    const first = sections.find(s => s.data.length === 2)
    expect(first).toBeDefined()
    expect(first!.data.map(i => i.label)).toContain('Item A')
    expect(first!.data.map(i => i.label)).toContain('Item B')
  })

  it('retourne un tableau vide pour une entrée vide', () => {
    expect(groupByDate([])).toHaveLength(0)
  })
})

describe('SectionDateList', () => {
  it('affiche les titres de sections', () => {
    const sections = [{ title: '15 janvier 2024', data: ['Item A', 'Item B'] }]
    render(
      <SectionDateList
        sections={sections}
        renderItem={({ item }) => <Text>{item}</Text>}
        keyExtractor={item => item}
      />
    )
    expect(screen.getByText('15 janvier 2024')).toBeTruthy()
  })
})

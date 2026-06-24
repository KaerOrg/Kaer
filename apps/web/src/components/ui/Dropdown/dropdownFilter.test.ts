import { describe, it, expect } from 'vitest'
import { filterOptions, groupSections } from './dropdownFilter'
import type { DropdownOption } from './Dropdown.types'

const options: DropdownOption[] = [
  { value: 'anxiety', label: 'Anxiété', group: 'indication' },
  { value: 'ocd', label: 'TOC', group: 'indication' },
  { value: 'teen', label: 'Adolescent', group: 'population' },
]

describe('filterOptions', () => {
  it('renvoie toutes les options quand la requête est vide', () => {
    expect(filterOptions(options, '')).toHaveLength(3)
    expect(filterOptions(options, '   ')).toHaveLength(3)
  })

  it('renvoie une copie, jamais le tableau source', () => {
    const result = filterOptions(options, '')
    expect(result).not.toBe(options)
    expect(result).toEqual(options)
  })

  it('filtre insensible à la casse', () => {
    expect(filterOptions(options, 'ANXI').map(o => o.value)).toEqual(['anxiety'])
  })

  it('filtre insensible aux accents', () => {
    expect(filterOptions(options, 'anxiete').map(o => o.value)).toEqual(['anxiety'])
  })

  it('filtre sur une sous-chaîne au milieu du label', () => {
    expect(filterOptions(options, 'oc').map(o => o.value)).toEqual(['ocd'])
  })

  it('renvoie un tableau vide quand rien ne correspond', () => {
    expect(filterOptions(options, 'xyz')).toEqual([])
  })
})

describe('groupSections', () => {
  it('regroupe par `group` dans l ordre d apparition', () => {
    const sections = groupSections(options, { indication: 'Indication', population: 'Public' })
    expect(sections).toHaveLength(2)
    expect(sections[0]).toMatchObject({ group: 'indication', label: 'Indication' })
    expect(sections[0].options.map(o => o.value)).toEqual(['anxiety', 'ocd'])
    expect(sections[1]).toMatchObject({ group: 'population', label: 'Public' })
  })

  it('label null quand le groupe n est pas dans groupLabels', () => {
    const sections = groupSections(options)
    expect(sections.every(s => s.label === null)).toBe(true)
  })

  it('options sans group tombent dans un unique groupe vide', () => {
    const flat: DropdownOption[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]
    const sections = groupSections(flat)
    expect(sections).toHaveLength(1)
    expect(sections[0].group).toBe('')
    expect(sections[0].options).toHaveLength(2)
  })

  it('renvoie un tableau vide pour aucune option', () => {
    expect(groupSections([])).toEqual([])
  })
})

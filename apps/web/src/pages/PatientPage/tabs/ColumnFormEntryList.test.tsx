import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { FormEntryRow } from '@services/engagementService'
import { ColumnFormEntryList } from './ColumnFormEntryList'

const entries: FormEntryRow[] = [
  { date: '2026-07-06T10:00:00Z', values: { emotion: 'Anxiété', emotion_intensity: 80, outcome_intensity: 40 } },
  { date: '2026-06-28T10:00:00Z', values: { emotion: 'Tristesse' } },
]

function renderList(selectedIndex = 0, onSelect = vi.fn()) {
  return {
    onSelect,
    ...render(
      <ColumnFormEntryList
        entries={entries}
        selectedIndex={selectedIndex}
        locale="fr-FR"
        title="Saisies"
        onSelect={onSelect}
      />,
    ),
  }
}

describe('ColumnFormEntryList', () => {
  it('rend une ligne par saisie et porte le libellé d’accessibilité', () => {
    const { container, getByLabelText } = renderList()
    expect(container.querySelectorAll('.cfd-entry').length).toBe(2)
    expect(getByLabelText('Saisies')).toBeTruthy()
  })

  it('marque la saisie sélectionnée', () => {
    const { container } = renderList(1)
    const items = container.querySelectorAll('.cfd-entry')
    expect(items[1].getAttribute('aria-current')).toBe('true')
    expect(items[0].getAttribute('aria-current')).toBeNull()
  })

  it('remonte l’index au clic sur une ligne', () => {
    const { container, onSelect } = renderList(0)
    fireEvent.click(container.querySelectorAll('.cfd-entry')[1])
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})

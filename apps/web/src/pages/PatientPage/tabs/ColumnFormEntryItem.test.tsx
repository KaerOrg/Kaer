import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { FormEntryRow } from '@services/engagementService'
import { ColumnFormEntryItem } from './ColumnFormEntryItem'

const withMove: FormEntryRow = { date: '2026-07-06T10:00:00Z', values: { emotion: 'Anxiété', emotion_intensity: 80, outcome_intensity: 40 } }
const noMove: FormEntryRow = { date: '2026-06-28T10:00:00Z', values: { emotion: 'Tristesse' } }

function renderItem(entry: FormEntryRow, selected = false, onSelect = vi.fn()) {
  return {
    onSelect,
    ...render(<ColumnFormEntryItem entry={entry} index={2} selected={selected} locale="fr-FR" onSelect={onSelect} />),
  }
}

describe('ColumnFormEntryItem', () => {
  it('affiche la date, l’émotion et le mouvement d’intensité brut', () => {
    const { container } = renderItem(withMove)
    const text = container.textContent ?? ''
    expect(text.toLowerCase()).toContain('juillet')
    expect(text).toContain('Anxiété')
    expect(text).toContain('80')
    expect(text).toContain('40')
  })

  it('omet le mouvement quand une borne manque, garde l’émotion', () => {
    const { container } = renderItem(noMove)
    expect(container.textContent).toContain('Tristesse')
    expect(container.querySelector('.cfd-entry__move')).toBeNull()
  })

  it('marque la sélection via aria-current', () => {
    const { container } = renderItem(withMove, true)
    expect(container.querySelector('.cfd-entry')?.getAttribute('aria-current')).toBe('true')
  })

  it('remonte son index au clic', () => {
    const { container, onSelect } = renderItem(withMove)
    fireEvent.click(container.querySelector('.cfd-entry') as HTMLButtonElement)
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('conformité MDR : valeur brute sans qualificatif de gravité', () => {
    const { container } = renderItem({ date: '2026-07-06T10:00:00Z', values: { emotion_intensity: 95, outcome_intensity: 90 } })
    for (const word of ['sévère', 'élevé', 'high', 'severe']) {
      expect(container.textContent?.toLowerCase()).not.toContain(word)
    }
  })
})

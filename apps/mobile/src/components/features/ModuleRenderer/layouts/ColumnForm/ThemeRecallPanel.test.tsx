jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('../../../../../lib/dateUtils', () => ({
  formatDateNumeric: (s: string) => `num:${s}`,
}))

import { render, screen, fireEvent } from '@testing-library/react-native'
import { ThemeRecallPanel, type ThemeRecallPanelProps } from './ThemeRecallPanel'
import type { ThemeEntry, RecallField } from './themeRecall'

const t = (k: string) => k

const RECALL_FIELDS: RecallField[] = [
  { key: 'evidence_against', labelCode: 'lbl.eva', color: '#10B981', unit: '' },
  { key: 'rational_response', labelCode: 'lbl.rat', color: '#6366F1', unit: '' },
  { key: 'outcome_intensity', labelCode: 'lbl.out', color: '#EC4899', unit: '%' },
]

const ENTRIES: ThemeEntry[] = [
  {
    id: 'e1', created_at: '2026-03-03T10:00:00Z',
    values: {
      situation_theme: 'Réunions', evidence_against: 'Ça s’est bien passé',
      rational_response: 'Je peux gérer', outcome_intensity: 40,
    },
  },
  {
    id: 'e2', created_at: '2026-02-02T10:00:00Z',
    values: { situation_theme: 'réunions', rational_response: 'Autre note' },
  },
  { id: 'e3', created_at: '2026-01-01T10:00:00Z', values: { situation_theme: 'Autre' } },
]

function renderPanel(over: Partial<ThemeRecallPanelProps> = {}) {
  const onPickTheme = jest.fn()
  render(
    <ThemeRecallPanel
      entries={ENTRIES}
      themeKey="situation_theme"
      currentTheme=""
      editingId={null}
      chipsLabelCode="lbl.chips"
      titleCode="lbl.title"
      hintCode="lbl.hint"
      recallFields={RECALL_FIELDS}
      accent="#0EA5E9"
      t={t}
      onPickTheme={onPickTheme}
      {...over}
    />,
  )
  return { onPickTheme }
}

describe('ThemeRecallPanel', () => {
  it('ne rend rien quand le patient n’a aucun thème passé', () => {
    renderPanel({ entries: [{ id: 'x', created_at: '2026-01-01T10:00:00Z', values: { situation_theme: '' } }] })
    expect(screen.queryByTestId('theme-recall')).toBeNull()
  })

  it('affiche les puces des thèmes passés, sans encart tant qu’aucun thème courant', () => {
    renderPanel()
    expect(screen.getByTestId('theme-recall')).toBeTruthy()
    expect(screen.getByTestId('theme-chip-Réunions')).toBeTruthy()
    expect(screen.getByTestId('theme-chip-Autre')).toBeTruthy()
    // Pas de thème courant → pas de rappel de fiches passées.
    expect(screen.queryByTestId('theme-recall-matches')).toBeNull()
  })

  it('taper une puce réutilise l’étiquette (onPickTheme)', () => {
    const { onPickTheme } = renderPanel()
    fireEvent.press(screen.getByTestId('theme-chip-Réunions'))
    expect(onPickTheme).toHaveBeenCalledWith('Réunions')
  })

  it('ré-affiche brut les fiches passées du même thème (titre + compte + valeurs)', () => {
    renderPanel({ currentTheme: 'réunions' })
    expect(screen.getByTestId('theme-recall-matches')).toBeTruthy()
    // Titre + nombre total de correspondances (e1 + e2).
    expect(screen.getByText('lbl.title (2)')).toBeTruthy()
    // Contenu BRUT du patient, daté, avec unité pour la valeur numérique.
    expect(screen.getByText('num:2026-03-03T10:00:00Z')).toBeTruthy()
    expect(screen.getByText('Ça s’est bien passé')).toBeTruthy()
    expect(screen.getByText('Je peux gérer')).toBeTruthy()
    expect(screen.getByText('40%')).toBeTruthy()
    // Lecture seule : aucune action d’édition/suppression.
    expect(screen.queryByTestId('edit-e1')).toBeNull()
    expect(screen.queryByTestId('delete-e1')).toBeNull()
  })

  it('exclut la fiche en cours d’édition du rappel', () => {
    renderPanel({ currentTheme: 'réunions', editingId: 'e1' })
    expect(screen.getByText('lbl.title (1)')).toBeTruthy()
    expect(screen.queryByTestId('theme-recall-e1')).toBeNull()
    expect(screen.getByTestId('theme-recall-e2')).toBeTruthy()
  })
})

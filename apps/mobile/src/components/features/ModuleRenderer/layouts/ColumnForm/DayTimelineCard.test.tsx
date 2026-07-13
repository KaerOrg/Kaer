jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('../../../../../lib/dateUtils', () => ({
  formatDateFull: (s: string) => `full:${s}`,
}))

import { render, screen, fireEvent } from '@testing-library/react-native'
import { DayTimelineCard } from './DayTimelineCard'
import type { FormEntry } from '../../../../../lib/database'

const t = (k: string) => k

function makeEntry(values: FormEntry['values'] = {}): FormEntry {
  return { id: 'e1', module_id: 'chronobiology_tracker', values, created_at: '2026-07-05T10:00:00Z' }
}

function renderCard(over: Partial<Parameters<typeof DayTimelineCard>[0]> = {}) {
  const onToggleExpand = jest.fn()
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  render(
    <DayTimelineCard
      entry={makeEntry({ wake_time: '07:00', bedtime: '23:00' })}
      expanded={false}
      t={t}
      onToggleExpand={onToggleExpand}
      onEdit={onEdit}
      onDelete={onDelete}
      {...over}
    />,
  )
  return { onToggleExpand, onEdit, onDelete }
}

describe('DayTimelineCard', () => {
  it('pose un marqueur par ancre renseignée sur la frise', () => {
    renderCard()
    expect(screen.getByTestId('frise-marker-wake_time')).toBeTruthy()
    expect(screen.getByTestId('frise-marker-bedtime')).toBeTruthy()
    // Ancre non renseignée = aucun marqueur (pas de placeholder).
    expect(screen.queryByTestId('frise-marker-light')).toBeNull()
  })

  it('un tap déclenche le dépli', () => {
    const { onToggleExpand } = renderCard()
    fireEvent.press(screen.getByTestId('record-e1'))
    expect(onToggleExpand).toHaveBeenCalledWith('e1')
  })

  it('le détail (icône + libellé + heure) n’apparaît qu’au dépli', () => {
    renderCard({ expanded: false })
    expect(screen.queryByTestId('frise-detail-e1')).toBeNull()

    renderCard({ expanded: true })
    expect(screen.getByTestId('frise-detail-row-wake_time')).toBeTruthy()
    expect(screen.getByText('07:00')).toBeTruthy()
    expect(screen.getByText('23:00')).toBeTruthy()
  })

  it('affiche un message neutre au dépli quand aucun repère n’est noté', () => {
    renderCard({ entry: makeEntry({}), expanded: true })
    expect(screen.getByText('modules.chrono_bio.day_no_anchors')).toBeTruthy()
  })
})

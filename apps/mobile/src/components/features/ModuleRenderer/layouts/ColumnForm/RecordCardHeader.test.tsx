jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('../../../../../lib/dateUtils', () => ({
  formatDateFull: (s: string) => `full:${s}`,
}))

import { render, screen, fireEvent } from '@testing-library/react-native'
import { RecordCardHeader } from './RecordCardHeader'
import type { FormEntry } from '../../../../../lib/database'

const t = (k: string) => k

function makeEntry(values: FormEntry['values'] = {}): FormEntry {
  return { id: 'e1', module_id: 'beck_columns', values, created_at: '2026-07-05T10:00:00Z' }
}

function renderHeader(over: Partial<Parameters<typeof RecordCardHeader>[0]> = {}) {
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  render(
    <RecordCardHeader
      entry={makeEntry()}
      showCompletion={false}
      completeKeys={[]}
      toCompleteLabel="à finir"
      t={t}
      onEdit={onEdit}
      onDelete={onDelete}
      {...over}
    />,
  )
  return { onEdit, onDelete }
}

describe('RecordCardHeader', () => {
  it('affiche la date formatée et les actions', () => {
    renderHeader()
    expect(screen.getByText('full:2026-07-05T10:00:00Z')).toBeTruthy()
    expect(screen.getByTestId('edit-e1')).toBeTruthy()
    expect(screen.getByTestId('delete-e1')).toBeTruthy()
  })

  it('crayon et poubelle déclenchent onEdit / onDelete', () => {
    const { onEdit, onDelete } = renderHeader()
    fireEvent.press(screen.getByTestId('edit-e1'))
    fireEvent.press(screen.getByTestId('delete-e1'))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('affiche la puce « à finir » quand une complete_key manque, et l\'ouvre en édition', () => {
    const { onEdit } = renderHeader({
      entry: makeEntry({ situation: 'x' }),
      showCompletion: true,
      completeKeys: ['rational_response'],
    })
    const chip = screen.getByTestId('to-complete-e1')
    fireEvent.press(chip)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('masque la puce « à finir » quand toutes les complete_keys sont renseignées', () => {
    renderHeader({
      entry: makeEntry({ rational_response: 'ok' }),
      showCompletion: true,
      completeKeys: ['rational_response'],
    })
    expect(screen.queryByTestId('to-complete-e1')).toBeNull()
  })
})

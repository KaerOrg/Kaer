import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MarkerRow } from './MarkerRow'
import type { TimelineMarker } from '../../../lib/database'

const marker: TimelineMarker = {
  id: 'm1', scale_id: 'mood_tracker', date: '2026-06-14',
  label: 'Passage à 150 mg', type: 'treatment', created_at: '',
}

describe('MarkerRow', () => {
  it('affiche le libellé et déclenche onDelete avec l’id du repère', () => {
    const onDelete = jest.fn()
    render(<MarkerRow marker={marker} locale="fr" deleteLabel="Supprimer" onDelete={onDelete} />)
    expect(screen.getByText('Passage à 150 mg')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Supprimer'))
    expect(onDelete).toHaveBeenCalledWith('m1')
  })
})

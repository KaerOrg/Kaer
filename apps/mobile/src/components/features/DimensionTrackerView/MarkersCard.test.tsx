import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MarkersCard } from './MarkersCard'
import type { MarkerType, TimelineMarker } from '../../../lib/database'

const typeLabels: Record<MarkerType, string> = {
  treatment: 'Traitement', life_event: 'Événement de vie', other: 'Autre',
}

const markers: TimelineMarker[] = [
  { id: 'm1', scale_id: 'mood_tracker', date: '2026-06-14', label: 'Passage à 150 mg', type: 'treatment', created_at: '' },
  { id: 'm2', scale_id: 'mood_tracker', date: '2026-07-02', label: 'Reprise du travail', type: 'life_event', created_at: '' },
]

const base = {
  markers, title: 'Repères', addLabel: 'Ajouter un repère', emptyLabel: 'Aucun repère',
  allLabel: 'Tout', typeLabels, deleteLabel: 'Supprimer', locale: 'fr', accentColor: '#4FA5A9',
  onAdd: jest.fn(), onDelete: jest.fn(),
}

describe('MarkersCard', () => {
  it('liste les repères et déclenche onAdd', () => {
    const onAdd = jest.fn()
    render(<MarkersCard {...base} onAdd={onAdd} />)
    expect(screen.getByText('Passage à 150 mg')).toBeTruthy()
    expect(screen.getByText('Reprise du travail')).toBeTruthy()
    fireEvent.press(screen.getByText('Ajouter un repère'))
    expect(onAdd).toHaveBeenCalled()
  })

  it('filtre par type : « Traitement » ne garde que les repères de traitement', () => {
    render(<MarkersCard {...base} />)
    // Le filtre « Traitement » est une puce cliquable (label du type).
    fireEvent.press(screen.getByText('Traitement'))
    expect(screen.getByText('Passage à 150 mg')).toBeTruthy()
    expect(screen.queryByText('Reprise du travail')).toBeNull()
  })

  it('affiche l’état vide quand aucun repère', () => {
    render(<MarkersCard {...base} markers={[]} />)
    expect(screen.getByText('Aucun repère')).toBeTruthy()
  })
})

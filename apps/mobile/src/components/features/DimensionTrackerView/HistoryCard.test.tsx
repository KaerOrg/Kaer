import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { HistoryCard } from './HistoryCard'
import type { ScaleEntry } from '../../../lib/database'

const entry: ScaleEntry = {
  id: 'e1',
  scale_id: 'mood_tracker',
  answers: [7, 6, 4],
  total_score: 6,
  subscale_scores: { mood: 7, energy: 6, anxiety: 4 },
  created_at: '2026-05-30T10:00:00.000Z',
}

const dimensionKeys = ['mood', 'energy', 'anxiety']
const labels = { mood: 'Hum', energy: 'Éne', anxiety: 'Str' }
const fills = { mood: '#C4B8ED', energy: '#F0CE96', anxiety: '#EDB1B1' }
const midColors = { mood: '#9C89D6', energy: '#E3B45E', anxiety: '#DE8E8E' }

const base = {
  entry, dimensionKeys, labels, fills, colors: midColors, yMax: 10, accentColor: '#4FA5A9',
  modifyLabel: 'Modifier', deleteLabel: 'Supprimer',
  onEdit: jest.fn(), onDelete: jest.fn(),
}

describe('HistoryCard', () => {
  it('kind=fingerprint : empreinte 6 barres, aucun score global', () => {
    render(<HistoryCard {...base} kind="fingerprint" />)
    expect(screen.getByTestId('fingerprint-e1')).toBeTruthy()
    // Valeurs des barres visibles, pas de libellé de score.
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.queryByText('score_label')).toBeNull()
  })

  it('kind=score : affiche le score arrondi et les chips', () => {
    render(<HistoryCard {...base} kind="score" scoreLabel="Score" scoreMax="/ 10" />)
    expect(screen.getByText('Score')).toBeTruthy()
    expect(screen.getByText('6')).toBeTruthy()
    expect(screen.queryByTestId('fingerprint-e1')).toBeNull()
  })

  it('appelle onEdit au press de la carte et onDelete au press de la poubelle', () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    render(<HistoryCard {...base} kind="fingerprint" onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.press(screen.getByLabelText('Modifier'))
    expect(onEdit).toHaveBeenCalledWith('e1')
    fireEvent.press(screen.getByLabelText('Supprimer'))
    expect(onDelete).toHaveBeenCalledWith('e1')
  })
})

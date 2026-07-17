import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MoodMiniChart } from './MoodMiniChart'
import { MOOD_WEB_DIMENSIONS } from './moodDimensions'
import type { TrendPoint } from '@ui/Chart'

const dim = MOOD_WEB_DIMENSIONS[0] // humeur
const trend: TrendPoint[] = [
  { date: '2026-07-01', value: 5 },
  { date: '2026-07-03', value: 8 },
]

describe('MoodMiniChart', () => {
  it('affiche la dernière valeur renseignée', () => {
    render(<MoodMiniChart dim={dim} label="Humeur" trend={trend} locale="fr" expandLabel="Agrandir" onExpand={vi.fn()} />)
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByText('8')).toBeTruthy()
  })

  it('le bouton agrandir appelle onExpand avec la clé de dimension', () => {
    const onExpand = vi.fn()
    render(<MoodMiniChart dim={dim} label="Humeur" trend={trend} locale="fr" expandLabel="Agrandir" onExpand={onExpand} />)
    fireEvent.click(screen.getByLabelText('Agrandir'))
    expect(onExpand).toHaveBeenCalledWith('humeur')
  })
})

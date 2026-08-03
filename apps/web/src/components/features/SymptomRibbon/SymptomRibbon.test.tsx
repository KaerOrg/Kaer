import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SymptomRibbon, type RibbonRow } from './SymptomRibbon'

const rows: RibbonRow[] = [
  { key: 'mood', label: 'Humeur', color: '#9C89D6', values: [8, null, 6] },
  { key: 'energy', label: 'Énergie', color: '#E3B45E', values: [null, null, 5] },
]

describe('SymptomRibbon', () => {
  it('rend une ligne par dimension avec son libellé et sa pastille teintée', () => {
    const { container } = render(
      <SymptomRibbon rows={rows} yMax={10} title="Vue par symptôme" assiduityLabel="1/3 saisis" legendLabel="Intensité brute" />,
    )
    expect(container.querySelectorAll('.symptom-ribbon__row')).toHaveLength(2)
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByText('Énergie')).toBeTruthy()
    const dot = container.querySelector('.symptom-ribbon__dot') as HTMLElement
    expect(dot.style.background).toBeTruthy()
  })

  it('cellule non renseignée (null) = cellule vide, sans teinte de fond', () => {
    const { container } = render(
      <SymptomRibbon rows={rows} yMax={10} title="t" assiduityLabel="a" legendLabel="l" />,
    )
    // 3 valeurs nulles au total (mood[1], energy[0], energy[1]).
    expect(container.querySelectorAll('.symptom-ribbon__cell--empty')).toHaveLength(3)
    const empties = screen.getAllByTestId('ribbon-cell-empty')
    for (const c of empties) expect((c as HTMLElement).style.background).toBe('')
  })

  it('cellule renseignée : opacité croissante avec la magnitude (miroir mobile, MDR)', () => {
    const { container } = render(
      <SymptomRibbon rows={rows} yMax={10} title="t" assiduityLabel="a" legendLabel="l" />,
    )
    const filled = container.querySelectorAll<HTMLElement>('.symptom-ribbon__cell:not(.symptom-ribbon__cell--empty)')
    // mood[0]=8 doit être plus opaque que mood[2]=6.
    const op8 = Number(filled[0].style.opacity)
    const op6 = Number(filled[1].style.opacity)
    expect(op8).toBeGreaterThan(op6)
  })

  it('affiche titre, assiduité et légende fournis', () => {
    render(<SymptomRibbon rows={rows} yMax={10} title="Vue par symptôme" assiduityLabel="1/3 saisis" legendLabel="Ma légende" />)
    expect(screen.getByText('Vue par symptôme')).toBeTruthy()
    expect(screen.getByText('1/3 saisis')).toBeTruthy()
    expect(screen.getByText('Ma légende')).toBeTruthy()
  })
})

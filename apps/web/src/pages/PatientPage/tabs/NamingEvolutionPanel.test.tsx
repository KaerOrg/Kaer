import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NamingEvolutionPanel } from './NamingEvolutionPanel'
import type { EmotionNamingEntry, NamingTaxonomy } from '../../../lib/emotionNamingData'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}))

const TAXONOMY: NamingTaxonomy = {
  families: ['fam.joy', 'fam.fear'],
  nuancesByFamily: { 'fam.joy': ['n.a', 'n.b'], 'fam.fear': ['n.c'] },
  wordsByNuance: { 'n.a': ['w.1', 'w.2'], 'n.b': [], 'n.c': [] },
  words: ['w.1', 'w.2'],
  colorByFamily: { 'fam.joy': '#EFC98A', 'fam.fear': '#AC9BDE' },
}

function entry(over: Partial<EmotionNamingEntry> = {}): EmotionNamingEntry {
  return {
    date: '2026-07-20T09:00:00Z',
    familyCode: 'fam.joy', nuanceCode: null, wordCode: null,
    intensity: null, context: ['ctx.work'], contextOther: null, notes: null,
    ...over,
  }
}

function renderPanel(entries: EmotionNamingEntry[]) {
  return render(
    <NamingEvolutionPanel
      entries={entries}
      taxonomy={TAXONOMY}
      contextCodes={['ctx.work', 'ctx.family']}
      rangeDays={90}
    />
  )
}

describe('NamingEvolutionPanel', () => {
  it('rend les quatre comptages de profondeur, en effectifs bruts', () => {
    renderPanel([
      entry({ familyCode: null }),
      entry({ familyCode: 'fam.joy' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.a' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.a', wordCode: 'w.1' }),
      entry({ familyCode: 'fam.fear', nuanceCode: 'n.c', wordCode: 'w.2' }),
    ])
    const band = screen.getByTestId('naming-depth-band')
    expect(band.textContent).toContain('naming_depth_none 1')
    expect(band.textContent).toContain('naming_depth_family 1')
    expect(band.textContent).toContain('naming_depth_nuance 1')
    expect(band.textContent).toContain('naming_depth_word 2')
  })

  it('rend la couverture du répertoire sur les dénominateurs de la taxonomie', () => {
    renderPanel([
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.a', wordCode: 'w.1' }),
      entry({ familyCode: 'fam.fear', nuanceCode: 'n.c' }),
    ])
    const band = screen.getByTestId('naming-repertoire-band')
    expect(band.textContent).toContain('"used":2,"total":2')  // familles
    expect(band.textContent).toContain('"used":1,"total":2')  // mots employés sur 2
  })

  it('monte la table de croisement, le même composant que l\'onglet Données', () => {
    renderPanel(Array.from({ length: 12 }, () => entry({ nuanceCode: 'n.a' })))
    expect(screen.getByTestId('crosstab')).toBeInTheDocument()
  })

  it('n\'affiche ni score, ni tendance, ni comparaison', () => {
    const { container } = renderPanel(Array.from({ length: 12 }, () => entry()))
    expect(container.textContent).not.toMatch(/score|tendance|%|moyenne|progression/i)
    expect(screen.getByText('evolution.naming_note')).toBeInTheDocument()
  })
})

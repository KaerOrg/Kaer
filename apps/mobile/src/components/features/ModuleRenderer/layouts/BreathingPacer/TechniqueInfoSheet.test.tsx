import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TechniqueInfoSheet } from './TechniqueInfoSheet'
import type { BreathingTechnique, TechniqueInfoBlock } from '@services/breathingService'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const TECHNIQUE: BreathingTechnique = {
  key: 'coherence_cardiaque',
  color: '#4A9EA3',
  recommended_duration_min: 5,
  phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }],
}

const BLOCKS: TechniqueInfoBlock[] = [
  { id: 'what', labelCode: 'label.what', textCode: 'texte.what', section: 'body' },
  { id: 'when', labelCode: 'label.when', textCode: 'texte.when', section: 'body' },
  { id: 'src', labelCode: null, textCode: 'texte.evidence', section: 'sources' },
]

const lbl = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key
const t = (key: string) => key

function renderSheet(over: Partial<React.ComponentProps<typeof TechniqueInfoSheet>> = {}) {
  const props = {
    visible: true, technique: TECHNIQUE, blocks: BLOCKS,
    onClose: jest.fn(), lbl, t, closeLabel: 'Fermer', ...over,
  }
  return { ...render(<TechniqueInfoSheet {...props} />), props }
}

describe('TechniqueInfoSheet', () => {
  it('présente la technique et son bénéfice en langage patient', () => {
    const { getByText } = renderSheet()
    expect(getByText('coherence_cardiaque_name')).toBeTruthy()
    expect(getByText('coherence_cardiaque_benefit')).toBeTruthy()
  })

  it('rend les blocs venus de la base, titre et texte', () => {
    const { getByText } = renderSheet()
    expect(getByText('label.what')).toBeTruthy()
    expect(getByText('texte.what')).toBeTruthy()
    expect(getByText('label.when')).toBeTruthy()
    expect(getByText('texte.when')).toBeTruthy()
  })

  it('rend un bloc par déclaration de la base', () => {
    const { getByTestId } = renderSheet()
    expect(getByTestId('breathing-info-block-what')).toBeTruthy()
    expect(getByTestId('breathing-info-block-when')).toBeTruthy()
  })

  it('garde les références repliées à l’ouverture', () => {
    const { queryByTestId, queryByText } = renderSheet()
    expect(queryByTestId('breathing-info-sources')).toBeNull()
    expect(queryByText('texte.evidence')).toBeNull()
  })

  it('déplie les références à la demande', () => {
    const { getByTestId, getByText } = renderSheet()
    fireEvent.press(getByTestId('breathing-info-sources-toggle'))
    expect(getByText('texte.evidence')).toBeTruthy()
  })

  it('replie les références à la réouverture', () => {
    const base = {
      technique: TECHNIQUE, blocks: BLOCKS, onClose: jest.fn(), lbl, t, closeLabel: 'Fermer',
    }
    const { getByTestId, queryByTestId, rerender } = render(<TechniqueInfoSheet {...base} visible />)
    fireEvent.press(getByTestId('breathing-info-sources-toggle'))
    expect(queryByTestId('breathing-info-sources')).toBeTruthy()

    rerender(<TechniqueInfoSheet {...base} visible={false} />)
    rerender(<TechniqueInfoSheet {...base} visible />)
    expect(queryByTestId('breathing-info-sources')).toBeNull()
  })

  it('n’affiche pas la section repliée quand la base ne déclare aucune référence', () => {
    const { queryByTestId } = renderSheet({ blocks: BLOCKS.filter(b => b.section === 'body') })
    expect(queryByTestId('breathing-info-sources-toggle')).toBeNull()
  })

  it('rappelle le rythme phase par phase', () => {
    const { getByText } = renderSheet()
    expect(getByText('info_label_rhythm')).toBeTruthy()
    expect(getByText('hub_rhythm_inhale:5')).toBeTruthy()
  })

  it('affiche un bloc sans titre sans planter', () => {
    const { getByText } = renderSheet({
      blocks: [{ id: 'nu', labelCode: null, textCode: 'texte.nu', section: 'body' }],
    })
    expect(getByText('texte.nu')).toBeTruthy()
  })

  it('ne dérive aucune clé de contenu : sans bloc, rien n’est rendu', () => {
    const { queryByText } = renderSheet({ blocks: [] })
    expect(queryByText('coherence_cardiaque_description')).toBeNull()
    expect(queryByText('coherence_cardiaque_evidence')).toBeNull()
  })
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { FinishStep, type FinishStepLabels } from './FinishStep'

const LABELS: FinishStepLabels = {
  title: 'C\'est noté',
  colBefore: 'Avant',
  colAfter: 'Après',
  rowDiscomfort: 'Inconfort',
  rowBelief: 'Conviction',
  durationLabel: 'Durée : ',
  note: 'Ces chiffres sont enregistrés tels quels.',
  closeLabel: 'Fermer',
  redoLabel: 'Refaire une séance',
  skipped: '-',
}

function renderFinish(over: Partial<React.ComponentProps<typeof FinishStep>> = {}) {
  return render(
    <FinishStep
      before={{ discomfort: 8, belief: 7 }}
      after={{ discomfort: 5, belief: 6 }}
      durationSeconds={30}
      accent="#F59E0B"
      labels={LABELS}
      onClose={jest.fn()}
      onRedo={jest.fn()}
      {...over}
    />,
  )
}

describe('FinishStep — grille brute (MDR)', () => {
  it('affiche les 4 chiffres bruts avant / après', () => {
    renderFinish()
    expect(screen.getByTestId('finish-discomfort-before').props.children).toBe('8')
    expect(screen.getByTestId('finish-discomfort-after').props.children).toBe('5')
    expect(screen.getByTestId('finish-belief-before').props.children).toBe('7')
    expect(screen.getByTestId('finish-belief-after').props.children).toBe('6')
  })

  it('avant et après partagent EXACTEMENT le même style (aucune couleur selon la valeur)', () => {
    renderFinish()
    const before = screen.getByTestId('finish-discomfort-before').props.style
    const after = screen.getByTestId('finish-discomfort-after').props.style
    expect(before).toEqual(after)
  })

  it('ne montre aucune flèche ni écart calculé', () => {
    renderFinish()
    expect(screen.queryByText(/→|↑|↓/)).toBeNull()
    expect(screen.queryByText(/-3|−3/)).toBeNull()
  })

  it('une mesure passée s\'affiche « - » (jamais 0 implicite)', () => {
    renderFinish({ after: null })
    expect(screen.getByTestId('finish-discomfort-after').props.children).toBe('-')
    expect(screen.getByTestId('finish-belief-after').props.children).toBe('-')
  })

  it('masque la ligne durée quand la durée est 0 (distanciation sans minuteur)', () => {
    renderFinish({ durationSeconds: 0 })
    expect(screen.queryByText(/Durée/)).toBeNull()
  })

  it('déclenche Fermer et Refaire', () => {
    const onClose = jest.fn()
    const onRedo = jest.fn()
    renderFinish({ onClose, onRedo })
    fireEvent.press(screen.getByText('Fermer'))
    fireEvent.press(screen.getByText('Refaire une séance'))
    expect(onClose).toHaveBeenCalled()
    expect(onRedo).toHaveBeenCalled()
  })
})

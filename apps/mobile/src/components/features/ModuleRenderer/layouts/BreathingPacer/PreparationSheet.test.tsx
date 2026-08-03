import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PreparationSheet, type PreparationDraft } from './PreparationSheet'
import type { BreathingTechnique } from '@services/breathingService'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const TECHNIQUE: BreathingTechnique = {
  key: 'coherence_cardiaque',
  color: '#4A9EA3',
  recommended_duration_min: 5,
  phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }],
}

const DEFAULTS: PreparationDraft = {
  durationMin: 5, haptics: true, breathSound: false, ambientSound: false, ambientSoundKey: 'river',
}

const lbl = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

function renderSheet(over: Partial<React.ComponentProps<typeof PreparationSheet>> = {}) {
  const props = {
    visible: true,
    technique: TECHNIQUE,
    value: DEFAULTS,
    durations: [2, 5, 10],
    ambientSounds: ['river', 'waves', 'rain', 'wind', 'bowl'] as const,
    onClose: jest.fn(),
    onStart: jest.fn(),
    lbl,
    closeLabel: 'Fermer',
    ...over,
  }
  return { ...render(<PreparationSheet {...props} />), props }
}

describe('PreparationSheet', () => {
  it('présente la technique et la consigne de posture', () => {
    const { getByText } = renderSheet()
    expect(getByText('coherence_cardiaque_name')).toBeTruthy()
    expect(getByText('prep_posture')).toBeTruthy()
  })

  it('propose les durées lues en config', () => {
    const { getByText } = renderSheet()
    expect(getByText('prep_duration_option:2')).toBeTruthy()
    expect(getByText('prep_duration_option:5')).toBeTruthy()
    expect(getByText('prep_duration_option:10')).toBeTruthy()
  })

  it('démarre avec les réglages par défaut sans rien toucher', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent.press(getByTestId('breathing-prep-start'))
    expect(props.onStart).toHaveBeenCalledWith(DEFAULTS)
  })

  it('remonte la durée choisie', () => {
    const { getByText, getByTestId, props } = renderSheet()
    fireEvent.press(getByText('prep_duration_option:10'))
    fireEvent.press(getByTestId('breathing-prep-start'))
    expect(props.onStart).toHaveBeenCalledWith(expect.objectContaining({ durationMin: 10 }))
  })

  it('cumule les trois accompagnements', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent(getByTestId('breathing-prep-breath-switch'), 'valueChange', true)
    fireEvent(getByTestId('breathing-prep-ambient-switch'), 'valueChange', true)
    fireEvent.press(getByTestId('breathing-prep-start'))
    expect(props.onStart).toHaveBeenCalledWith(
      expect.objectContaining({ haptics: true, breathSound: true, ambientSound: true }),
    )
  })

  it('n’affiche les puces d’ambiance que lorsque la bascule est active', () => {
    const { getByTestId, queryByTestId } = renderSheet()
    expect(queryByTestId('breathing-prep-ambient-chips')).toBeNull()
    fireEvent(getByTestId('breathing-prep-ambient-switch'), 'valueChange', true)
    expect(getByTestId('breathing-prep-ambient-chips')).toBeTruthy()
  })

  it('remonte l’ambiance choisie parmi celles proposées', () => {
    const { getByTestId, props } = renderSheet({
      value: { ...DEFAULTS, ambientSound: true },
    })
    fireEvent.press(getByTestId('breathing-ambient-rain'))
    fireEvent.press(getByTestId('breathing-prep-start'))
    expect(props.onStart).toHaveBeenCalledWith(expect.objectContaining({ ambientSoundKey: 'rain' }))
  })

  it('rouvre sur les derniers réglages enregistrés', () => {
    const { getByTestId } = renderSheet({
      value: { durationMin: 10, haptics: false, breathSound: true, ambientSound: true, ambientSoundKey: 'bowl' },
    })
    expect(getByTestId('breathing-prep-haptics-switch').props.value).toBe(false)
    expect(getByTestId('breathing-prep-breath-switch').props.value).toBe(true)
    expect(getByTestId('breathing-ambient-bowl').props.accessibilityState.selected).toBe(true)
  })

  it('recale une durée enregistrée absente des options proposées', () => {
    const { getByTestId, props } = renderSheet({ value: { ...DEFAULTS, durationMin: 7 } })
    fireEvent.press(getByTestId('breathing-prep-start'))
    expect(props.onStart).toHaveBeenCalledWith(expect.objectContaining({ durationMin: 5 }))
  })

  it('oublie un réglage abandonné à la réouverture', () => {
    const base = {
      technique: TECHNIQUE, value: DEFAULTS, durations: [2, 5, 10],
      ambientSounds: ['river'] as const, onClose: jest.fn(), onStart: jest.fn(),
      lbl, closeLabel: 'Fermer',
    }
    const { getByTestId, rerender } = render(<PreparationSheet {...base} visible />)
    fireEvent(getByTestId('breathing-prep-breath-switch'), 'valueChange', true)
    expect(getByTestId('breathing-prep-breath-switch').props.value).toBe(true)

    rerender(<PreparationSheet {...base} visible={false} />)
    rerender(<PreparationSheet {...base} visible />)
    expect(getByTestId('breathing-prep-breath-switch').props.value).toBe(false)
  })

  it('ferme sans rien démarrer au tap sur le voile', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent.press(getByTestId('breathing-prep-sheet-backdrop'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onStart).not.toHaveBeenCalled()
  })
})

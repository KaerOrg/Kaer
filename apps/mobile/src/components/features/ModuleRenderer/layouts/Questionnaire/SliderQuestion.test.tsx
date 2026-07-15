import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import type { ContentField } from '@services/moduleService'
import { SliderQuestion } from './SliderQuestion'

function makeField(props: Record<string, string>): ContentField {
  return {
    id: 'q_mood',
    module_id: 'mood_tracker',
    section_id: null,
    parent_field_id: null,
    field_type: 'scale_slider_question',
    text_code: 'modules.mood_tracker.dim_mood',
    sort_order: 20,
    props,
    children: [],
  }
}

const PROPS = {
  min: '1', max: '10',
  color: '#C4B8ED', ink_color: '#7C6DB6',
  icon: 'emoticon-outline',
  low_hint_code: 'low', mid_hint_code: 'normal', high_hint_code: 'high',
}

// t simplifié : renvoie une étiquette lisible par clé.
const t = (k: string) =>
  ({ 'modules.mood_tracker.dim_mood': 'Humeur', low: 'Très basse', normal: 'Normal', high: 'Très élevée' }[k] ?? k)

describe('SliderQuestion', () => {
  it('affiche le libellé, la valeur et les ancres bas/Normal/haut', () => {
    render(<SliderQuestion field={makeField(PROPS)} index={0} value={7} onAnswer={jest.fn()} t={t} />)
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('Très basse')).toBeTruthy()
    expect(screen.getByText('Normal')).toBeTruthy()
    expect(screen.getByText('Très élevée')).toBeTruthy()
  })

  it('value=null : aucune valeur affichée (dimension non renseignée)', () => {
    render(<SliderQuestion field={makeField(PROPS)} index={0} value={null} onAnswer={jest.fn()} t={t} />)
    expect(screen.getByText('Humeur')).toBeTruthy()
    // Aucune valeur numérique tant que le curseur n'a pas été touché.
    expect(screen.queryByTestId('slider-q_mood-value')).toBeNull()
  })

  it('propage la valeur choisie au parent avec le bon index', () => {
    const onAnswer = jest.fn()
    render(<SliderQuestion field={makeField(PROPS)} index={3} value={5} onAnswer={onAnswer} t={t} />)
    fireEvent(screen.getByTestId('slider-q_mood-track'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    })
    expect(onAnswer).toHaveBeenCalledWith(3, 6)
  })
})

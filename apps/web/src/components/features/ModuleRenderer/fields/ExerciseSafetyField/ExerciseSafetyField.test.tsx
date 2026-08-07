import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ExerciseSafetyField } from './ExerciseSafetyField'
import type { ContentField } from '@services/moduleService'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

function field(props: Record<string, string>, textCode: string | null = 'num.15'): ContentField {
  return {
    id: 'f', module_id: 'crisis_plan', section_id: null, parent_field_id: null,
    field_type: 'exercise_safety', text_code: textCode, sort_order: 0, props, children: [],
  } as ContentField
}

describe('ExerciseSafetyField', () => {
  it('rend le libellé du numéro et son sous-libellé, tous deux traduits', () => {
    render(<ExerciseSafetyField field={field({ phone: '15', label_code: 'lbl.15' })} />)
    expect(screen.getByText('num.15')).toBeInTheDocument()
    expect(screen.getByText('lbl.15')).toBeInTheDocument()
  })

  // La couleur vient d'une `tone` sémantique, plus d'un `bgColor` en dur dans la donnée.
  it('applique la classe de teinte correspondant à la tone', () => {
    const { container } = render(<ExerciseSafetyField field={field({ phone: '15', tone: 'danger' })} />)
    expect(container.querySelector('.exercise-safety-field--danger')).toBeTruthy()
  })

  it('retombe sur la teinte neutre quand la tone est absente ou inconnue', () => {
    const { container } = render(<ExerciseSafetyField field={field({ phone: '111' })} />)
    expect(container.querySelector('.exercise-safety-field--primary')).toBeTruthy()
    expect(container.querySelector('.exercise-safety-field--danger')).toBeNull()
  })

  it('retombe sur le numéro brut quand le field ne porte aucun text_code', () => {
    render(<ExerciseSafetyField field={field({ phone: '3114' }, null)} />)
    expect(screen.getByText('3114')).toBeInTheDocument()
  })
})

import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ExposureTrackerLayout } from './ExposureTrackerLayout'
import type { ContentField } from '@services/moduleService'

// `t` déterministe : renvoie la clé i18n telle quelle.
const t = (key: string) => key

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'fear_thermometer',
    section_id: null,
    parent_field_id: null,
    text_code: `${field_type}.text`,
    sort_order: 0,
    props: {},
    children: [],
    field_type,
    ...overrides,
  }
}

function fields(): ContentField[] {
  return [
    field('exposure_tracker_config', { id: 'et.cfg', props: { suds_min: '0', suds_max: '100', suds_step: '10' } }),
    field('exposure_tracker_strategy', { id: 'et.s1', text_code: 'modules.fear_thermometer.strategy_breathing', sort_order: 100 }),
    field('exposure_tracker_strategy', { id: 'et.s2', text_code: 'modules.fear_thermometer.strategy_grounding', sort_order: 101 }),
  ]
}

describe('ExposureTrackerLayout (aperçu parcours d\'exposition)', () => {
  it('affiche l\'échelle de la peur avec ses marches, le bandeau MDR et le FAB', () => {
    const { container } = render(<ExposureTrackerLayout fields={fields()} t={t} />)
    expect(screen.getByTestId('ej-ladder')).toBeTruthy()
    expect(container.querySelector('.ej-disclaimer')).toBeTruthy()
    expect(container.querySelectorAll('.ej-ladder-row')).toHaveLength(3)
    expect(screen.getByText('modules.fear_thermometer.add_step')).toBeTruthy()
  })

  it('ouvre le détail d\'une marche (courbe + bouton exposition) au clic', () => {
    const { container } = render(<ExposureTrackerLayout fields={fields()} t={t} />)
    fireEvent.click(container.querySelectorAll('.ej-ladder-row')[0])
    expect(screen.getByTestId('ej-detail')).toBeTruthy()
    expect(container.querySelector('svg.ej-svg')).toBeTruthy()
    expect(screen.getByText('modules.fear_thermometer.detail_do_exposure')).toBeTruthy()
  })

  it('ouvre le formulaire d\'exposition depuis le détail', () => {
    const { container } = render(<ExposureTrackerLayout fields={fields()} t={t} />)
    fireEvent.click(container.querySelectorAll('.ej-ladder-row')[0])
    fireEvent.click(screen.getByText('modules.fear_thermometer.detail_do_exposure'))
    expect(screen.getByTestId('ej-form')).toBeTruthy()
    // 3 curseurs SUDS (anticipé / pic / final)
    expect(container.querySelectorAll('.ej-suds-picker')).toHaveLength(3)
    expect(screen.getByText('modules.fear_thermometer.expectation_label')).toBeTruthy()
    expect(screen.getByText('modules.fear_thermometer.outcome_label')).toBeTruthy()
  })

  it('revient à l\'échelle via la flèche retour', () => {
    const { container } = render(<ExposureTrackerLayout fields={fields()} t={t} />)
    fireEvent.click(container.querySelectorAll('.ej-ladder-row')[0])
    fireEvent.click(screen.getByLabelText('back'))
    expect(screen.getByTestId('ej-ladder')).toBeTruthy()
  })
})

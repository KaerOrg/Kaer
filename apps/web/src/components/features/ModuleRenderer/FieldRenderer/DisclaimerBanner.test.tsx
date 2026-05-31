import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DisclaimerBanner } from './DisclaimerBanner'
import type { ContentField } from '../../../../services/moduleService'

function disclaimer(props: Record<string, unknown> = {}): ContentField {
  return {
    id: 'disclaimer-1',
    module_id: 'mod',
    section_id: null,
    parent_field_id: null,
    text_code: null,
    sort_order: 0,
    props,
    children: [],
    field_type: 'disclaimer_banner',
  }
}

describe('DisclaimerBanner', () => {
  it('résout la clé modules.{moduleId}.disclaimer par défaut', () => {
    const { container } = render(<DisclaimerBanner field={disclaimer()} moduleId="grounding" />)
    expect(container.querySelector('.preview-disclaimer__text')?.textContent).toBe('modules.grounding.disclaimer')
  })

  it('le prop text_code prime sur la clé par défaut', () => {
    const { container } = render(
      <DisclaimerBanner field={disclaimer({ text_code: 'custom.key' })} moduleId="grounding" />
    )
    expect(container.querySelector('.preview-disclaimer__text')?.textContent).toBe('custom.key')
  })

  it('le prop module_key prime sur moduleId', () => {
    const { container } = render(
      <DisclaimerBanner field={disclaimer({ module_key: 'override' })} moduleId="grounding" />
    )
    expect(container.querySelector('.preview-disclaimer__text')?.textContent).toBe('modules.override.disclaimer')
  })

  it('applique le tone info par défaut et danger via le prop', () => {
    const info = render(<DisclaimerBanner field={disclaimer()} moduleId="m" />)
    expect(info.container.querySelector('.preview-disclaimer--info')).toBeTruthy()
    const danger = render(<DisclaimerBanner field={disclaimer({ tone: 'danger' })} moduleId="m" />)
    expect(danger.container.querySelector('.preview-disclaimer--danger')).toBeTruthy()
  })
})

import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ColumnFormLayout } from './ColumnFormLayout'
import type { ContentField } from '@services/moduleService'

const t = (key: string) => key

function field(over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>): ContentField {
  return {
    module_id: 'chronobiology_tracker', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, ...over,
  } as ContentField
}

const CONFIG = field({ id: 'cfg', field_type: 'column_form_config', props: { new_btn_label: 'modules.chrono_bio.add_today' } })

function timeChild(id: string, key: string): ContentField {
  return field({ id, section_id: 'anchors', parent_field_id: 'col.h', field_type: 'column_time_field', props: { key, optional: '1' } })
}

// buildColumnSpecs lit les enfants dans `header.children` (imbriqués).
function header(children: ContentField[]): ContentField {
  return field({ id: 'col.h', section_id: 'anchors', field_type: 'column_header', text_code: 'sec', props: { color: '#3B82F6' }, children })
}

describe('ColumnFormLayout — dispatch frise/formulaire', () => {
  it('config 100 % horaires (chrono) → frise 24 h, pas le formulaire de saisie', () => {
    const fields = [CONFIG, header([timeChild('t.wake', 'wake_time'), timeChild('t.bed', 'bedtime')])]
    const { container } = render(<ColumnFormLayout fields={fields} t={t} />)
    expect(container.querySelector('.cj-legend')).not.toBeNull()
    expect(container.querySelectorAll('.cj-frise__marker').length).toBeGreaterThan(0)
    expect(container.querySelector('.cf-entry')).toBeNull()
  })

  it('config avec un champ texte → formulaire de saisie, pas la frise', () => {
    const textChild = field({ id: 'x', section_id: 'anchors', parent_field_id: 'col.h', field_type: 'column_text_field', text_code: 'ph' })
    const fields = [CONFIG, header([timeChild('t.wake', 'wake_time'), textChild])]
    const { container } = render(<ColumnFormLayout fields={fields} t={t} />)
    expect(container.querySelector('.cf-entry')).not.toBeNull()
    expect(container.querySelector('.cj-legend')).toBeNull()
  })
})

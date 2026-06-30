import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldRow } from './FieldRow'
import type { ContentField } from '@services/moduleService'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (key: string) => key,
}))

function field(props: Record<string, string> = {}, text_code: string | null = null): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type: 'field_row', text_code, sort_order: 0, props, children: [],
  }
}

describe('FieldRow', () => {
  it('affiche le label depuis text_code', () => {
    render(<FieldRow field={field({}, 'row.label')} />)
    expect(screen.getByText('row.label')).toBeTruthy()
  })

  it('affiche une Ionicon pour une icône connue', () => {
    const { UNSAFE_getByProps } = render(<FieldRow field={field({ icon: 'moon' }, 'label')} />)
    expect(UNSAFE_getByProps({ name: 'moon-outline' })).toBeTruthy()
  })

  it('affiche le nom brut pour une icône inconnue', () => {
    render(<FieldRow field={field({ icon: 'icone-custom' }, 'label')} />)
    expect(screen.getByText('icone-custom')).toBeTruthy()
  })

  it('affiche le widget quand widget_type est défini', () => {
    render(<FieldRow field={field({ widget_type: 'info', detail_code: 'widget.detail' }, 'label')} />)
    expect(screen.getByText('widget.detail')).toBeTruthy()
  })

  it('affiche le detailText quand pas de widget_type', () => {
    render(<FieldRow field={field({ detail_code: 'detail.text' }, 'label')} />)
    expect(screen.getByText('detail.text')).toBeTruthy()
  })

  it("n'affiche pas la zone de contrôle sans widget ni detail_code", () => {
    render(<FieldRow field={field({}, 'label')} />)
    expect(screen.getByText('label')).toBeTruthy()
    expect(screen.queryByText('detail.text')).toBeNull()
  })

  it("n'affiche pas d'icône quand icon est absent", () => {
    const { UNSAFE_queryAllByProps } = render(<FieldRow field={field({}, 'label')} />)
    expect(UNSAFE_queryAllByProps({ name: /outline/ })).toHaveLength(0)
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CrisisCompanionLayout } from './CrisisCompanionLayout'
import type { ContentField } from '../../../../../services/moduleService'

// `t` déterministe : renvoie la clé i18n telle quelle (cf. autres tests de layout).
const t = (key: string) => key

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'distress_tolerance',
    section_id: null,
    parent_field_id: 'dt.tab.now',
    text_code: null,
    sort_order: 0,
    props: {},
    children: [],
    field_type,
    ...overrides,
  }
}

function fields(): ContentField[] {
  return [
    field('exercise_intro', { id: 'i1', text_code: 'modules.distress_tolerance.now.intro1', sort_order: 1 }),
    field('exercise_config', { id: 'cfg', props: { durations: '5,15' }, sort_order: 3 }),
    field('crisis_category', { id: 'c.tipp', section_id: 'tipp', text_code: 'modules.distress_tolerance.now.cat.tipp', props: { icon: 'Wind', color: '#0EA5E9' }, sort_order: 1 }),
    field('crisis_activity', { id: 'a.tipp1', section_id: 'tipp', text_code: 'modules.distress_tolerance.now.act.tipp1', sort_order: 2 }),
    field('crisis_category', { id: 'c.sens', section_id: 'sens', text_code: 'modules.distress_tolerance.now.cat.sens', props: { icon: 'Heart', color: '#10B981' }, sort_order: 1 }),
    field('crisis_activity', { id: 'a.sens1', section_id: 'sens', text_code: 'modules.distress_tolerance.now.act.sens1', sort_order: 2 }),
  ]
}

describe('CrisisCompanionLayout (aperçu web)', () => {
  it('affiche le titre, les catégories et leurs activités', () => {
    render(<CrisisCompanionLayout fields={fields()} t={t} moduleId="distress_tolerance" />)
    expect(screen.getByText('modules.distress_tolerance.now.title')).toBeTruthy()
    expect(screen.getByText('modules.distress_tolerance.now.cat.tipp')).toBeTruthy()
    expect(screen.getByText('modules.distress_tolerance.now.act.tipp1')).toBeTruthy()
    expect(screen.getByText('modules.distress_tolerance.now.cat.sens')).toBeTruthy()
    expect(screen.getByText('modules.distress_tolerance.now.act.sens1')).toBeTruthy()
  })

  it('affiche les durées configurées + message de fin neutre', () => {
    const { container } = render(<CrisisCompanionLayout fields={fields()} t={t} moduleId="distress_tolerance" />)
    expect(container.querySelectorAll('.cc-duration')).toHaveLength(2)
    expect(screen.getByText('modules.distress_tolerance.now.done_title')).toBeTruthy()
  })

  it('ne rend rien sans catégorie', () => {
    const onlyUi = [
      field('exercise_intro', { id: 'i1', text_code: 'modules.distress_tolerance.now.intro1', sort_order: 1 }),
      field('exercise_config', { id: 'cfg', props: { durations: '5,15' }, sort_order: 3 }),
    ]
    const { container } = render(<CrisisCompanionLayout fields={onlyUi} t={t} moduleId="distress_tolerance" />)
    expect(container.firstChild).toBeNull()
  })
})

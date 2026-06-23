jest.mock('../../../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_: unknown, key: string) => Stub(String(key)) })
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { CrisisCompanionLayout } from './CrisisCompanionLayout'
import type { ContentField } from '../../../../../services/moduleService'

function field(overrides: Partial<ContentField>): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'distress_tolerance',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? 'dt.tab.now',
    field_type: overrides.field_type ?? 'crisis_activity',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: [],
  }
}

const UI_FIELDS: ContentField[] = [
  field({ id: 'dt.now.intro1', field_type: 'exercise_intro', text_code: 'modules.distress_tolerance.now.intro1', sort_order: 1 }),
  field({ id: 'dt.now.config', field_type: 'exercise_config', props: { duration_1: '5', duration_2: '15' }, sort_order: 3 }),
]

const SECTIONS = new Map<string, ContentField[]>([
  ['tipp', [
    field({ id: 'dt.now.cat.tipp', field_type: 'crisis_category', section_id: 'tipp', text_code: 'modules.distress_tolerance.now.cat.tipp', props: { icon: 'Wind', color: '#0EA5E9' }, sort_order: 1 }),
    field({ id: 'dt.now.act.tipp1', section_id: 'tipp', text_code: 'modules.distress_tolerance.now.act.tipp1', sort_order: 2 }),
    field({ id: 'dt.now.act.tipp2', section_id: 'tipp', text_code: 'modules.distress_tolerance.now.act.tipp2', sort_order: 3 }),
  ]],
  ['sens', [
    field({ id: 'dt.now.cat.sens', field_type: 'crisis_category', section_id: 'sens', text_code: 'modules.distress_tolerance.now.cat.sens', props: { icon: 'Heart', color: '#10B981' }, sort_order: 1 }),
    field({ id: 'dt.now.act.sens1', section_id: 'sens', text_code: 'modules.distress_tolerance.now.act.sens1', sort_order: 2 }),
  ]],
])

function renderLayout() {
  return render(
    <CrisisCompanionLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="distress_tolerance" />
  )
}

describe('CrisisCompanionLayout', () => {
  it('affiche l\'accueil avec la métaphore de la vague et les catégories', () => {
    renderLayout()
    expect(screen.getByText('Traverser la vague')).toBeTruthy()
    // les catégories sont directement accessibles sur l'accueil (pas d'écran intermédiaire)
    expect(screen.getByTestId('crisis-category-tipp')).toBeTruthy()
    expect(screen.getByTestId('crisis-category-sens')).toBeTruthy()
  })

  it('affiche une activité et les durées après le choix d\'une catégorie', () => {
    renderLayout()
    fireEvent.press(screen.getByTestId('crisis-category-tipp'))
    // une activité de la catégorie tipp est affichée
    expect(screen.getByText(/eau froide sur votre visage/i)).toBeTruthy()
    // les deux durées configurées sont proposées
    expect(screen.getByTestId('crisis-duration-5')).toBeTruthy()
    expect(screen.getByTestId('crisis-duration-15')).toBeTruthy()
  })

  it('fait tourner les activités avec « Une autre idée »', () => {
    renderLayout()
    fireEvent.press(screen.getByTestId('crisis-category-tipp'))
    expect(screen.getByText(/eau froide sur votre visage/i)).toBeTruthy()
    fireEvent.press(screen.getByText('Une autre idée'))
    expect(screen.getByText(/Bougez intensément/i)).toBeTruthy()
  })

  it('lance le minuteur puis affiche la fin neutre après « J\'ai tenu »', () => {
    renderLayout()
    fireEvent.press(screen.getByTestId('crisis-category-tipp'))
    fireEvent.press(screen.getByTestId('crisis-duration-5'))
    // minuteur initialisé à 5:00
    expect(screen.getByText('5:00')).toBeTruthy()
    expect(screen.getByText('J\'ai tenu')).toBeTruthy()

    fireEvent.press(screen.getByText('J\'ai tenu'))
    expect(screen.getByText('La vague est passée')).toBeTruthy()
  })

  it('ne rend rien sans catégorie', () => {
    const { toJSON } = render(
      <CrisisCompanionLayout sections={new Map()} uiFields={UI_FIELDS} moduleId="distress_tolerance" />
    )
    expect(toJSON()).toBeNull()
  })
})

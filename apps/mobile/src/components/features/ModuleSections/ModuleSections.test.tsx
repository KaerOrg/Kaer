import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ModuleSections } from './ModuleSections'
import type { UnlockedModule } from '@services/homeService'

function mk(module_type: string, category_id: string): UnlockedModule {
  return {
    id: `pm-${module_type}`,
    module_type,
    config: {},
    unlocked_at: '2026-01-01',
    module: { mobile_icon: 'target', color: '#000', preview_kind: 'form', category_id, is_hidden: false },
  }
}

const baseProps = {
  isTeenMode: false,
  teenColor: () => undefined,
  isAvailable: () => true,
  onModulePress: jest.fn(),
}

describe('ModuleSections', () => {
  beforeEach(() => jest.clearAllMocks())

  it('affiche les libellés de section quand il y a plusieurs groupes', () => {
    render(
      <ModuleSections
        {...baseProps}
        modules={[mk('crisis_plan', 'safety'), mk('medication_side_effects', 'iatrogenic')]}
      />,
    )
    expect(screen.getByText('Sécurité & Gestion de Crise')).toBeTruthy()
    expect(screen.getByText('Surveillance Iatrogénique & Somatique')).toBeTruthy()
    expect(screen.getByText('Plan de crise')).toBeTruthy()
  })

  it('masque le libellé de section quand il n\'y a qu\'un groupe', () => {
    render(<ModuleSections {...baseProps} modules={[mk('crisis_plan', 'safety')]} />)
    expect(screen.queryByText('Sécurité & Gestion de Crise')).toBeNull()
    expect(screen.getByText('Plan de crise')).toBeTruthy()
  })

  it('affiche le PHQ-9 sous son nom en clair et son sous-titre de format (#405)', () => {
    // Écran 01 de la maquette : le sigle n'est plus le titre, il passe en second rang
    // dans le sous-titre, qui annonce aussi la longueur et la durée.
    render(<ModuleSections {...baseProps} modules={[mk('phq9', 'assessments')]} />)
    expect(screen.getByText('Mon humeur ces 2 semaines')).toBeTruthy()
    expect(screen.getByText('Questionnaire PHQ-9 · 10 questions, 4 min')).toBeTruthy()
    expect(screen.queryByText('PHQ-9')).toBeNull()
  })

  // ── Pastille d'échéance (#414) ────────────────────────────────────────────

  it('affiche la pastille d\'échéance du module concerné', () => {
    render(
      <ModuleSections
        {...baseProps}
        modules={[mk('phq9', 'assessments')]}
        dueByModule={new Map([['phq9', 'À remplir avant le 5 août']])}
      />,
    )
    expect(screen.getByTestId('module-due-badge')).toBeTruthy()
    expect(screen.getByText('À remplir avant le 5 août')).toBeTruthy()
  })

  it('n\'affiche aucune pastille pour un module sans échéance', () => {
    render(
      <ModuleSections
        {...baseProps}
        modules={[mk('phq9', 'assessments'), mk('crisis_plan', 'safety')]}
        dueByModule={new Map([['phq9', 'À remplir avant le 5 août']])}
      />,
    )
    // Une seule pastille : celle du module programmé.
    expect(screen.getAllByTestId('module-due-badge')).toHaveLength(1)
  })

  it('n\'affiche aucune pastille quand aucune programmation n\'existe', () => {
    render(<ModuleSections {...baseProps} modules={[mk('phq9', 'assessments')]} />)
    expect(screen.queryByTestId('module-due-badge')).toBeNull()
  })

  it('MDR : la pastille ne porte ni retard, ni compte à rebours, ni couleur d\'alerte', () => {
    // « En retard » serait un jugement adressé à quelqu'un dont le biais interprétatif
    // négatif fait partie du tableau clinique. Une date, affichée, rien d'autre.
    const { toJSON } = render(
      <ModuleSections
        {...baseProps}
        modules={[mk('phq9', 'assessments')]}
        dueByModule={new Map([['phq9', 'À remplir avant le 5 août']])}
      />,
    )
    const rendered = JSON.stringify(toJSON())
    expect(rendered).not.toMatch(/retard|overdue|jours restants|urgent/i)
    // Aucune teinte d'alerte : la pastille porte le couple de marque, pas du rouge.
    expect(rendered).not.toMatch(/#EF4444|#DC2626/i)
  })

  it('appelle onModulePress avec le bon module au tap', () => {
    const onModulePress = jest.fn()
    const mod = mk('crisis_plan', 'safety')
    render(<ModuleSections {...baseProps} onModulePress={onModulePress} modules={[mod]} />)
    fireEvent.press(screen.getByLabelText('Plan de crise'))
    expect(onModulePress).toHaveBeenCalledWith(mod)
  })
})

const mockGetPlanItems = jest.fn()
const mockSavePlanItem = jest.fn()
const mockDeletePlanItem = jest.fn()
jest.mock('@services/planItemService', () => ({
  getPlanItems: (...a: unknown[]) => mockGetPlanItems(...a),
  savePlanItem: (...a: unknown[]) => mockSavePlanItem(...a),
  deletePlanItem: (...a: unknown[]) => mockDeletePlanItem(...a),
}))

// Sentinelle MDR : si un jour le layout enquêue quoi que ce soit, ce mock le voit.
const mockEnqueue = jest.fn()
jest.mock('../../../../../services/sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

// Les boutons d'urgence ont leurs propres tests — stubbés pour isoler le parcours.
jest.mock('../shared', () => {
  const R = require('react')
  const { Text } = require('react-native')
  return { CrisisEmergencyCalls: () => R.createElement(Text, { testID: 'emergency-stub' }, 'urgences') }
})

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { SafetySequenceLayout } from './SafetySequenceLayout'
import type { ContentField } from '@services/moduleService'

function field(over: Partial<ContentField>): ContentField {
  return {
    id: over.id ?? 'f',
    module_id: 'crisis_plan',
    section_id: over.section_id ?? null,
    parent_field_id: null,
    field_type: over.field_type ?? 'step_title',
    text_code: over.text_code ?? null,
    sort_order: over.sort_order ?? 0,
    props: over.props ?? {},
    children: [],
  }
}

function planItem(id: string, sectionId: string, text: string) {
  return {
    id, module_id: 'crisis_plan', section_id: sectionId, text,
    sort_order: 0, weight: null, phone: null, contact_source: null,
    created_at: '2026-01-01T00:00:00Z',
  }
}

const SECTIONS = new Map<string, ContentField[]>([
  ['step_1', [field({ id: 's1', section_id: 'step_1', text_code: 'modules.crisis_plan.step_1_title' })]],
  ['step_2', [field({ id: 's2', section_id: 'step_2', text_code: 'modules.crisis_plan.step_2_title' })]],
  // Seule l'étape 3 porte un sous-titre ici : c'est ce qui permet de vérifier qu'il
  // n'apparaît PAS sur les étapes qui n'en configurent pas.
  ['step_3', [field({
    id: 's3',
    section_id: 'step_3',
    text_code: 'modules.crisis_plan.step_3_title',
    props: {
      subtitle_code: 'modules.crisis_plan.step_3_subtitle',
      // Raccourci déclaré par la CONFIG : le layout ne connaît aucun numéro d'étape.
      direct_access_label_code: 'modules.crisis_plan.sequence_home_shelter',
      direct_access_hint_code: 'modules.crisis_plan.sequence_home_shelter_hint',
    },
  })]],
])

function renderLayout(onExit = jest.fn()) {
  render(
    <SafetySequenceLayout sections={SECTIONS} uiFields={[]} moduleId="crisis_plan" onExit={onExit} />,
  )
  return onExit
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPlanItems.mockResolvedValue([
    planItem('i1', 'step_1', 'Je ne dors plus'),
    planItem('i2', 'step_3', 'Le square derrière l\'école'),
  ])
})

/** Entre dans le parcours par l'action dominante de l'accueil (P-6). */
async function enterPlan() {
  fireEvent.press(await screen.findByTestId('safety-sequence-home-follow'))
}

describe('SafetySequenceLayout — parcours', () => {
  it('ouvre sur l\'écran d\'arrivée', async () => {
    renderLayout()
    expect(await screen.findByTestId('safety-sequence-home-follow')).toBeTruthy()
  })

  it('avance de l\'accueil vers la première étape affichable', async () => {
    renderLayout()
    await enterPlan()
    expect(screen.getByText('modules.crisis_plan.step_1_title')).toBeTruthy()
  })

  it('saute les étapes vides et renumérote la progression', async () => {
    renderLayout()
    await enterPlan()
    // step_2 n'a aucun item : l'étape suivante est step_3, affichée « 2 / 2 ».
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.getByText('modules.crisis_plan.step_3_title')).toBeTruthy()
    expect(screen.getByText('2 / 2')).toBeTruthy()
  })

  it('affiche les items du patient tels qu\'il les a écrits', async () => {
    renderLayout()
    await enterPlan()
    expect(screen.getByText('Je ne dors plus')).toBeTruthy()
  })

  it('mène aux ressources depuis la dernière étape, jamais dans un cul-de-sac', async () => {
    renderLayout()
    await enterPlan()
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.getByText('modules.crisis_plan.sequence_resources_title')).toBeTruthy()
  })

  it('affiche « ce qui est disponible » sur la dernière étape, pas « autre chose que j\'ai prévu »', async () => {
    renderLayout()
    await enterPlan()
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.getByText('modules.crisis_plan.sequence_advance_last')).toBeTruthy()
  })

  it('permet de revenir en arrière après un appui accidentel', async () => {
    renderLayout()
    await enterPlan()
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.getByText('modules.crisis_plan.step_3_title')).toBeTruthy()
    fireEvent.press(screen.getByTestId('safety-sequence-back'))
    expect(screen.getByText('modules.crisis_plan.step_1_title')).toBeTruthy()
  })

  it('n\'offre aucun retour arrière depuis l\'accueil', async () => {
    renderLayout()
    await screen.findByTestId('safety-sequence-home-follow')
    expect(screen.queryByTestId('safety-sequence-back')).toBeNull()
  })

  it('la sortie quitte le parcours sans confirmation, depuis n\'importe quel écran', async () => {
    const onExit = renderLayout()
    await enterPlan()
    fireEvent.press(screen.getByTestId('safety-sequence-stop'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('garde le bandeau d\'urgence présent sur tous les écrans', async () => {
    renderLayout()
    expect(await screen.findByTestId('emergency-stub')).toBeTruthy()
    await enterPlan()
    expect(screen.getByTestId('emergency-stub')).toBeTruthy()
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.getByTestId('emergency-stub')).toBeTruthy()
  })
})

describe('SafetySequenceLayout — écran d\'arrivée (P-6)', () => {
  it('propose le plan en action dominante, puis les entrées plus calmes', async () => {
    renderLayout()
    expect(await screen.findByText('modules.crisis_plan.sequence_home_follow')).toBeTruthy()
    expect(screen.getByText('modules.crisis_plan.sequence_home_shelter')).toBeTruthy()
    expect(screen.getByText('modules.crisis_plan.sequence_home_anchors')).toBeTruthy()
  })

  it('n\'expose en raccourci que les étapes que la config déclare', async () => {
    renderLayout()
    await screen.findByTestId('safety-sequence-home-follow')
    // step_3 porte `direct_access_label_code`, step_1 non.
    expect(screen.getByTestId('safety-sequence-home-step_3')).toBeTruthy()
    expect(screen.queryByTestId('safety-sequence-home-step_1')).toBeNull()
  })

  it('n\'expose pas le raccourci d\'une étape sans item', async () => {
    // step_3 déclare le raccourci mais n'a plus d'item : elle n'est pas affichable,
    // donc elle ne peut pas être proposée en raccourci.
    mockGetPlanItems.mockResolvedValue([planItem('i1', 'step_1', 'Je ne dors plus')])
    renderLayout()
    await screen.findByTestId('safety-sequence-home-follow')
    expect(screen.queryByTestId('safety-sequence-home-step_3')).toBeNull()
  })

  it('mène en un geste à l\'étape déclarée, sans traverser les précédentes', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('safety-sequence-home-step_3'))
    expect(screen.getByText('modules.crisis_plan.step_3_title')).toBeTruthy()
    expect(screen.queryByText('modules.crisis_plan.step_1_title')).toBeNull()
  })

  // Le retour doit ramener d'où l'on vient : après un raccourci, c'est l'accueil, et
  // surtout pas l'étape précédente, que le patient n'a jamais vue.
  it('ramène à l\'accueil au retour depuis une étape atteinte en raccourci', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('safety-sequence-home-step_3'))
    fireEvent.press(screen.getByTestId('safety-sequence-back'))
    expect(screen.getByTestId('safety-sequence-home-follow')).toBeTruthy()
    expect(screen.queryByText('modules.crisis_plan.step_1_title')).toBeNull()
  })

  it('mène en un geste à la clôture, et en revient à l\'accueil', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('safety-sequence-home-anchors'))
    expect(screen.getByText('modules.crisis_plan.sequence_closing_title')).toBeTruthy()
    fireEvent.press(screen.getByTestId('safety-sequence-back'))
    expect(screen.getByTestId('safety-sequence-home-follow')).toBeTruthy()
  })

  it('ne propose pas « autre chose que j\'ai prévu » sur l\'accueil', async () => {
    renderLayout()
    await screen.findByTestId('safety-sequence-home-follow')
    expect(screen.queryByTestId('safety-sequence-advance')).toBeNull()
  })

  it('affiche ce qui est disponible tout de suite quand le plan est vide, sans jamais le qualifier', async () => {
    mockGetPlanItems.mockResolvedValue([])
    renderLayout()
    expect(await screen.findByText('modules.crisis_plan.sequence_resources_title')).toBeTruthy()
    // Aucune entrée de plan, et surtout aucun mot sur ce qui manquerait.
    expect(screen.queryByTestId('safety-sequence-home-follow')).toBeNull()
    expect(screen.queryByTestId('safety-sequence-home-anchors')).toBeNull()
    // La sortie reste atteignable.
    expect(screen.getByTestId('safety-sequence-stop')).toBeTruthy()
  })
})

describe('SafetySequenceLayout — contenu d\'un écran d\'étape (P-7)', () => {
  it('affiche le sous-titre configuré sur l\'étape qui en porte un', async () => {
    renderLayout()
    await enterPlan()
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.getByText('modules.crisis_plan.step_3_subtitle')).toBeTruthy()
  })

  it('n\'affiche aucun sous-titre sur une étape qui n\'en configure pas', async () => {
    renderLayout()
    await enterPlan()
    expect(screen.getByText('modules.crisis_plan.step_1_title')).toBeTruthy()
    expect(screen.queryByText('modules.crisis_plan.step_3_subtitle')).toBeNull()
  })

  it('ne numérote QUE les écrans d\'étape : ni l\'accueil, ni les ressources', async () => {
    renderLayout()
    await screen.findByTestId('safety-sequence-home-follow')
    expect(screen.queryByText('1 / 2')).toBeNull()   // accueil
    await enterPlan()
    expect(screen.getByText('1 / 2')).toBeTruthy()   // étape 1
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    expect(screen.queryByText('2 / 2')).toBeNull()   // ressources
  })

  it('rend le retour en icône seule, avec son libellé d\'accessibilité', async () => {
    renderLayout()
    await enterPlan()
    const back = screen.getByTestId('safety-sequence-back')
    expect(back.props.accessibilityLabel).toBe('common.back')
    // Icône seule : aucun libellé visible ne concurrence l'action du bas.
    expect(screen.queryByText('common.back')).toBeNull()
  })
})

describe('SafetySequenceLayout — invariant MDR : zéro persistance', () => {
  it('ne déclenche AUCUNE écriture pendant une traversée complète', async () => {
    const onExit = renderLayout()
    await enterPlan()
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    fireEvent.press(screen.getByTestId('safety-sequence-advance'))
    fireEvent.press(screen.getByTestId('safety-sequence-back'))
    fireEvent.press(screen.getByTestId('safety-sequence-stop'))

    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(mockEnqueue).not.toHaveBeenCalled()
    expect(mockSavePlanItem).not.toHaveBeenCalled()
    expect(mockDeletePlanItem).not.toHaveBeenCalled()
  })

  it('ne lit le plan qu\'une fois, et ne réécrit jamais rien au fil du parcours', async () => {
    renderLayout()
    await enterPlan()
    expect(mockGetPlanItems).toHaveBeenCalledTimes(1)
    expect(mockGetPlanItems).toHaveBeenCalledWith('crisis_plan')
  })

  // Garde-fou statique : verrouille l'invariant contre une évolution future qui
  // importerait un service d'écriture. Le test runtime ci-dessus ne verrait pas un
  // appel placé derrière une branche non parcourue ; celui-ci le voit.
  it('n\'importe aucun service d\'écriture ni de synchronisation', () => {
    const source = readFileSync(join(__dirname, 'SafetySequenceLayout.tsx'), 'utf-8')
    const imports = source.match(/^import[\s\S]*?from\s+'[^']+'/gm) ?? []
    const joined = imports.join('\n')
    expect(joined).not.toMatch(/savePlanItem|deletePlanItem|syncUpsert|syncDelete|RemoteSyncService/)
    expect(joined).not.toMatch(/lib\/database/)
  })
})

describe('SafetySequenceLayout — garde-fous statiques du parcours (P-7)', () => {
  const source = readFileSync(join(__dirname, 'SafetySequenceLayout.tsx'), 'utf-8')

  // Le retour arrière est un bouton explicite, précisément PARCE QUE le balayage
  // rendrait un appui accidentel irrattrapable. Un geste réintroduit ici casserait
  // l'argument, sans qu'aucun test de parcours ne s'en aperçoive.
  it('n\'utilise aucun geste de balayage', () => {
    expect(source).not.toMatch(/PanResponder|Swipeable|react-native-gesture-handler|\bGesture\./)
  })

  // « Une seule couleur d'action sur tout le parcours » : les props de couleur et
  // d'icône par étape existent en base (elles servent aux vues Consultation et
  // Édition) et ne doivent jamais être lues ici.
  it('ne lit aucune couleur ni icône d\'étape', () => {
    expect(source).not.toMatch(/'bgColor'|'icon'|'step_number'/)
  })
})

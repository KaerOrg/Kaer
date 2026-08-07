jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { CrisisEmergencyCalls } from './CrisisEmergencyCalls'
import type { ContentField } from '@services/moduleService'

function field(over: Partial<ContentField>): ContentField {
  return {
    id: over.id ?? 'f',
    module_id: 'crisis_plan',
    section_id: null,
    parent_field_id: null,
    field_type: over.field_type ?? 'exercise_safety',
    text_code: over.text_code ?? null,
    sort_order: over.sort_order ?? 0,
    props: over.props ?? {},
    children: [],
  }
}

// Le jeu de référence : 3114 (parler), 15 (danger vital), 114 (le même secours, par
// écrit). Les trois entrées viennent de la config, jamais du rendu.
const RESSOURCES = [
  field({
    id: 'a', text_code: 'num.3114', sort_order: 130,
    props: {
      phone: '3114', action: 'tel', tone: 'primary',
      label_code: 'lbl.3114', action_label_code: 'act.3114', detail_label_code: 'det.3114',
    },
  }),
  field({
    id: 'b', text_code: 'num.15', sort_order: 140,
    props: {
      phone: '15', action: 'tel', tone: 'danger',
      label_code: 'lbl.15', action_label_code: 'act.15', detail_label_code: 'det.15',
    },
  }),
  field({
    id: 'c', text_code: 'num.114', sort_order: 150,
    props: {
      phone: '114', action: 'sms', tone: 'danger',
      label_code: 'lbl.114', action_label_code: 'act.114', detail_label_code: 'det.114',
    },
  }),
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
})

describe('CrisisEmergencyCalls', () => {
  it('ne rend rien sans field exercise_safety', () => {
    const { toJSON } = render(<CrisisEmergencyCalls fields={[field({ field_type: 'step_title' })]} />)
    expect(toJSON()).toBeNull()
  })

  it('rend une entrée par ressource, triée par sort_order', () => {
    render(<CrisisEmergencyCalls fields={[RESSOURCES[2], RESSOURCES[0], RESSOURCES[1]]} />)
    expect(screen.getByTestId('emergency-3114')).toBeTruthy()
    expect(screen.getByTestId('emergency-15')).toBeTruthy()
    expect(screen.getByTestId('emergency-114')).toBeTruthy()
  })

  it('compose le lien tel: au tap', () => {
    render(<CrisisEmergencyCalls fields={RESSOURCES} />)
    fireEvent.press(screen.getByTestId('emergency-15'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:15')
  })

  // Le point le plus important du composant : un `tel:114` appellerait vocalement le
  // service destiné aux personnes sourdes ou malentendantes, donc inutilisable.
  it('compose le lien sms: pour une ressource dont l\'action est sms', () => {
    render(<CrisisEmergencyCalls fields={RESSOURCES} />)
    fireEvent.press(screen.getByTestId('emergency-114'))
    expect(Linking.openURL).toHaveBeenCalledWith('sms:114')
  })

  it('nomme l\'action pour les lecteurs d\'écran, dans les deux densités', () => {
    const { rerender } = render(<CrisisEmergencyCalls fields={RESSOURCES} />)
    // « 114 » seul ne dit pas ce qu'un appui déclenche : c'est le verbe qui l'annonce.
    expect(screen.getByTestId('emergency-114').props.accessibilityLabel).toBe('act.114')
    rerender(<CrisisEmergencyCalls fields={RESSOURCES} density="full" />)
    expect(screen.getByTestId('emergency-114').props.accessibilityLabel).toBe('act.114')
  })

  it('affiche le numéro et son sous-libellé court en densité compact', () => {
    render(<CrisisEmergencyCalls fields={RESSOURCES} />)
    expect(screen.getByText('num.3114')).toBeTruthy()
    expect(screen.getByText('lbl.3114')).toBeTruthy()
    expect(screen.queryByText('act.3114')).toBeNull()
    expect(screen.queryByText('det.3114')).toBeNull()
  })

  it('affiche le verbe et le sous-libellé long en densité full', () => {
    render(<CrisisEmergencyCalls fields={RESSOURCES} density="full" />)
    expect(screen.getByText('act.3114')).toBeTruthy()
    expect(screen.getByText('det.3114')).toBeTruthy()
    expect(screen.queryByText('lbl.3114')).toBeNull()
  })

  // Les coordonnées viendront d'une configuration serveur : ni deux, ni quatre entrées
  // ne doivent casser le rendu.
  it('rend un jeu de deux ou de quatre ressources sans casser', () => {
    const { rerender } = render(<CrisisEmergencyCalls fields={RESSOURCES.slice(0, 2)} />)
    expect(screen.getAllByTestId(/^emergency-/)).toHaveLength(2)

    const quatre = [...RESSOURCES, field({
      id: 'd', text_code: 'num.116', sort_order: 160,
      props: { phone: '116117', action: 'tel', action_label_code: 'act.116' },
    })]
    rerender(<CrisisEmergencyCalls fields={quatre} />)
    expect(screen.getAllByTestId(/^emergency-/)).toHaveLength(4)
  })

  // Une ressource ajoutée en config sans `tone` ne doit pas s'annoncer comme un danger
  // vital : elle retombe sur la teinte neutre, et se rend malgré ses props absentes.
  it('rend une ressource sans tone ni sous-libellé, sans trou dans la mise en page', () => {
    render(<CrisisEmergencyCalls fields={[field({
      id: 'x', text_code: 'num.x', sort_order: 1, props: { phone: '111' },
    })]} />)
    const btn = screen.getByTestId('emergency-111')
    expect(btn).toBeTruthy()
    // Sans `action_label_code`, le libellé d'accessibilité retombe sur le text_code.
    expect(btn.props.accessibilityLabel).toBe('num.x')
  })

  it('ne compose aucun lien quand la ressource n\'a pas de numéro', () => {
    render(<CrisisEmergencyCalls fields={[field({
      id: 'y', text_code: 'num.y', sort_order: 1, props: { action_label_code: 'act.y' },
    })]} />)
    fireEvent.press(screen.getByTestId('emergency-'))
    expect(Linking.openURL).not.toHaveBeenCalled()
  })
})

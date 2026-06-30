jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../store/authStore', () => ({ useAuthStore: () => null }))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { FieldRenderer } from './FieldRenderer'
import type { ContentField } from '@services/moduleService'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

function f(overrides: Partial<ContentField>): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type: 'card_paragraph', text_code: null, sort_order: 0, props: {}, children: [],
    ...overrides,
  }
}

// ─── Cas nuls ─────────────────────────────────────────────────────────────────

describe('FieldRenderer — null cases', () => {
  it('retourne null pour coming_soon', () => {
    const { toJSON } = render(
      <FieldRenderer preview_kind="coming_soon" fields={[f({ text_code: 'test.text' })]} />,
    )
    expect(toJSON()).toBeNull()
  })

  it('retourne null quand fields est vide', () => {
    const { toJSON } = render(<FieldRenderer preview_kind="fields" fields={[]} />)
    expect(toJSON()).toBeNull()
  })

  it('retourne null pour un preview_kind inconnu', () => {
    const { toJSON } = render(
      <FieldRenderer preview_kind={'inconnu' as never} fields={[f({ text_code: 'test.text' })]} />,
    )
    expect(toJSON()).toBeNull()
  })
})

// ─── Filtrage ────────────────────────────────────────────────────────────────

describe('FieldRenderer — filtrage', () => {
  it('ne rend pas module_label ni module_description', () => {
    render(
      <FieldRenderer
        preview_kind="fields"
        fields={[
          f({ id: 'l1', field_type: 'module_label',       text_code: 'module.label' }),
          f({ id: 'd1', field_type: 'module_description', text_code: 'module.desc'  }),
          f({ id: 'r1', field_type: 'field_row',          text_code: 'row.label'    }),
        ]}
      />,
    )
    expect(screen.queryByText('module.label')).toBeNull()
    expect(screen.queryByText('module.desc')).toBeNull()
    expect(screen.getByText('row.label')).toBeTruthy()
  })
})

// ─── Layout : fields ──────────────────────────────────────────────────────────

describe('FieldRenderer — layout fields', () => {
  it('affiche les field_rows avec leur widget', () => {
    render(
      <FieldRenderer
        preview_kind="fields"
        fields={[f({ id: 'r1', field_type: 'field_row', text_code: 'row.label', props: { widget_type: 'info', detail_code: 'row.detail' } })]}
      />,
    )
    expect(screen.getByText('row.label')).toBeTruthy()
    expect(screen.getByText('row.detail')).toBeTruthy()
  })

  it('affiche le footer_note separement', () => {
    render(
      <FieldRenderer
        preview_kind="fields"
        fields={[
          f({ id: 'r1', field_type: 'field_row',   text_code: 'row.label'   }),
          f({ id: 'ft', field_type: 'footer_note', text_code: 'footer.text' }),
        ]}
      />,
    )
    expect(screen.getByText('footer.text')).toBeTruthy()
  })
})

// ─── Layout : steps ──────────────────────────────────────────────────────────

describe('FieldRenderer — layout steps', () => {
  it('affiche le titre et le numero de chaque etape', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[
          f({ id: 't1', field_type: 'step_title', text_code: 'step.title',
              section_id: 's1', props: { color: '#4F46E5', step_number: '1' } }),
        ]}
      />,
    )
    expect(screen.getByText('step.title')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('affiche le step_hint sous le titre', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[
          f({ id: 't1', field_type: 'step_title', text_code: 'step.title', section_id: 's1', props: { step_number: '1' } }),
          f({ id: 'h1', field_type: 'step_hint',  text_code: 'step.hint',  section_id: 's1' }),
        ]}
      />,
    )
    expect(screen.getByText('"step.hint"')).toBeTruthy()
  })

  it('ignore les sections sans step_title', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[f({ id: 'h1', field_type: 'step_hint', text_code: 'hint.text', section_id: 's1' })]}
      />,
    )
    expect(screen.queryByText('hint.text')).toBeNull()
  })

  it('ignore les fields sans section_id', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[f({ id: 't1', field_type: 'step_title', text_code: 'no.section' })]}
      />,
    )
    expect(screen.queryByText('no.section')).toBeNull()
  })
})

// ─── Layout : cards ──────────────────────────────────────────────────────────

describe('FieldRenderer — layout cards', () => {
  const titleField = f({ id: 'tit', field_type: 'card_title',     text_code: 'card.title', section_id: 'c1' })
  const bodyField  = f({ id: 'bod', field_type: 'card_paragraph', text_code: 'card.body',  section_id: 'c1' })

  it('affiche le titre, corps masque par defaut', () => {
    render(<FieldRenderer preview_kind="cards" fields={[titleField, bodyField]} />)
    expect(screen.getByText('card.title')).toBeTruthy()
    expect(screen.queryByText('card.body')).toBeNull()
  })

  it('developpe le corps au premier appui', () => {
    render(<FieldRenderer preview_kind="cards" fields={[titleField, bodyField]} />)
    fireEvent.press(screen.getByText('card.title'))
    expect(screen.getByText('card.body')).toBeTruthy()
  })

  it('referme la carte au deuxieme appui', () => {
    render(<FieldRenderer preview_kind="cards" fields={[titleField, bodyField]} />)
    fireEvent.press(screen.getByText('card.title'))
    fireEvent.press(screen.getByText('card.title'))
    expect(screen.queryByText('card.body')).toBeNull()
  })

  it('affiche le resume meme carte fermee', () => {
    const summaryField = f({ id: 'sum', field_type: 'card_summary', text_code: 'card.summary', section_id: 'c1' })
    render(<FieldRenderer preview_kind="cards" fields={[titleField, summaryField, bodyField]} />)
    expect(screen.getByText('card.summary')).toBeTruthy()
    expect(screen.queryByText('card.body')).toBeNull()
  })
})

// ─── Layout : patient_scenario ───────────────────────────────────────────────

// Utilise des text_codes fictifs (non présents dans les locales) pour que t() retourne la clé brute
const rimDisclaimer = f({ id: 'rim.disclaimer', field_type: 'rim_disclaimer', text_code: 'test.rim.disclaimer', sort_order: 10 })
const rimStep1      = f({ id: 'rim.step_1', field_type: 'rim_step', text_code: 'test.rim.step_1', sort_order: 20, props: { step_number: '1' } })
const rimStep2      = f({ id: 'rim.step_2', field_type: 'rim_step', text_code: 'test.rim.step_2', sort_order: 30, props: { step_number: '2' } })
const rimSoundRain  = f({ id: 'rim.sound_rain', field_type: 'ambient_sound', text_code: 'test.rim.sound_rain', sort_order: 70, props: { icon: 'weather-rainy', key: 'pluie', available: 'false' } })
const safetyTitle   = f({ id: 'rim.safety_title', field_type: 'exercise_safety_title', text_code: 'test.rim.safety_title', sort_order: 120 })
const safety3114    = f({ id: 'rim.safety_3114', field_type: 'exercise_safety', text_code: 'test.rim.safety_3114', sort_order: 130, props: { phone: '3114', icon: 'phone' } })
const safety15      = f({ id: 'rim.safety_15',  field_type: 'exercise_safety', text_code: 'test.rim.safety_15',  sort_order: 140, props: { phone: '15',   icon: 'ambulance' } })

const RIM_FIELDS = [rimDisclaimer, rimStep1, rimStep2, rimSoundRain, safetyTitle, safety3114, safety15]
const FULL_CONFIG = { alternative_scenario: 'Je marche dans un pré verdoyant.', original_scenario: 'Le couloir sombre.' }

describe('FieldRenderer — layout patient_scenario', () => {
  // ── État vide ──────────────────────────────────────────────────────────────

  it('affiche l\'état vide si patientConfig est null', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={null} />)
    expect(screen.getByText('Scénario non configuré')).toBeTruthy()
    expect(screen.getByText(/n'a pas encore renseigné/)).toBeTruthy()
  })

  it('affiche l\'état vide si alternative_scenario est absent', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={{}} />)
    expect(screen.getByText('Scénario non configuré')).toBeTruthy()
  })

  // ── Contenu principal ──────────────────────────────────────────────────────

  it('affiche le scénario alternatif', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.getByTestId('alternative-scenario-card')).toBeTruthy()
    expect(screen.getByText('Je marche dans un pré verdoyant.')).toBeTruthy()
  })

  it('affiche le disclaimer', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.getByTestId('rim-disclaimer')).toBeTruthy()
    expect(screen.getByText('test.rim.disclaimer')).toBeTruthy()
  })

  it('affiche les étapes du protocole avec leur numéro', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.getByTestId('protocol-steps')).toBeTruthy()
    expect(screen.getByText('test.rim.step_1')).toBeTruthy()
    expect(screen.getByText('test.rim.step_2')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  // ── Scénario initial ───────────────────────────────────────────────────────

  it('n\'affiche pas le scénario initial si absent de la config', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={{ alternative_scenario: FULL_CONFIG.alternative_scenario }} />)
    expect(screen.queryByText('Scénario initial (référence)')).toBeNull()
  })

  it('affiche le bouton scénario initial si présent', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.getByText('Scénario initial (référence)')).toBeTruthy()
    expect(screen.queryByTestId('original-scenario-card')).toBeNull()
  })

  it('développe le scénario initial au tap', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    fireEvent.press(screen.getByText('Scénario initial (référence)'))
    expect(screen.getByTestId('original-scenario-card')).toBeTruthy()
    expect(screen.getByText('Le couloir sombre.')).toBeTruthy()
  })

  it('referme le scénario initial au deuxième tap', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    fireEvent.press(screen.getByText('Scénario initial (référence)'))
    fireEvent.press(screen.getByText('Scénario initial (référence)'))
    expect(screen.queryByTestId('original-scenario-card')).toBeNull()
  })

  // ── Sons d'ambiance ────────────────────────────────────────────────────────

  it('affiche les sons d\'ambiance avec "coming soon"', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.getByText('test.rim.sound_rain')).toBeTruthy()
    expect(screen.getByText('Bientôt')).toBeTruthy()
  })

  // ── Section urgence ────────────────────────────────────────────────────────

  it('affiche la section urgence avec 3114 et 15', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.getByText('test.rim.safety_3114')).toBeTruthy()
    expect(screen.getByText('test.rim.safety_15')).toBeTruthy()
  })

  it('appelle Linking.openURL au tap sur le 3114', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    fireEvent.press(screen.getByText('test.rim.safety_3114'))
    expect(spy).toHaveBeenCalledWith('tel:3114')
    spy.mockRestore()
  })

  // ── Conformité MDR ─────────────────────────────────────────────────────────

  it('n\'affiche aucun score ou label interprétatif (conformité MDR)', () => {
    render(<FieldRenderer preview_kind="patient_scenario" fields={RIM_FIELDS} patientConfig={FULL_CONFIG} />)
    expect(screen.queryByText(/score/i)).toBeNull()
    expect(screen.queryByText(/sévère/i)).toBeNull()
    expect(screen.queryByText(/résultat/i)).toBeNull()
  })
})

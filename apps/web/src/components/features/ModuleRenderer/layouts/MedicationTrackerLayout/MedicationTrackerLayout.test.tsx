import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationTrackerLayout } from './MedicationTrackerLayout'
import type { ContentField } from '@services/moduleService'

const t = (k: string) => k

function field(o: Partial<ContentField>): ContentField {
  return {
    id: o.id ?? 'f', module_id: 'medication_adherence', section_id: null, parent_field_id: null,
    field_type: o.field_type ?? 'medication_tracker_config', text_code: o.text_code ?? null,
    sort_order: o.sort_order ?? 0, props: o.props ?? {}, children: [],
  }
}

const FIELDS: ContentField[] = [
  field({ id: 'cfg', field_type: 'medication_tracker_config', props: {
    tab_today_label: 'k.tab_today', tab_calendar_label: 'k.tab_calendar', tab_meds_label: 'k.tab_meds',
    today_label: 'k.today', question: 'k.question', reason_prompt: 'k.reason', per_molecule_label: 'k.permol',
    notes_label: 'k.notes', save_label: 'k.save', calendar_days_label: 'k.caldays',
    meds_title: 'k.medstitle', meds_add_label: 'k.medsadd',
    med_kind_maintenance: 'k.maint', med_kind_prn: 'k.prn',
  } }),
  field({ id: 'taken',   field_type: 'daily_status_option', sort_order: 30, text_code: 'Pris',          props: { value: 'taken', color: '#10B981', bg_color: '#ECFDF5' } }),
  field({ id: 'partial', field_type: 'daily_status_option', sort_order: 31, text_code: 'Partiellement', props: { value: 'partial', color: '#F59E0B', bg_color: '#FFFBEB' } }),
  field({ id: 'missed',  field_type: 'daily_status_option', sort_order: 32, text_code: 'Non pris',      props: { value: 'missed', color: '#6B7280', bg_color: '#F3F4F6' } }),
  field({ id: 'r1', field_type: 'medication_reason_option', sort_order: 40, text_code: 'Oubli',           props: { value: 'forgot' } }),
  field({ id: 'r2', field_type: 'medication_reason_option', sort_order: 41, text_code: 'Effet indésirable', props: { value: 'side_effect' } }),
]

function renderLayout() {
  return render(<MedicationTrackerLayout fields={FIELDS} footer={undefined} t={t} />)
}

describe('MedicationTrackerLayout (aperçu web)', () => {
  it('affiche les 3 onglets', () => {
    renderLayout()
    expect(screen.getByText('k.tab_today')).toBeTruthy()
    expect(screen.getByText('k.tab_calendar')).toBeTruthy()
    expect(screen.getByText('k.tab_meds')).toBeTruthy()
  })

  it('volet Aujourd\'hui : question, pastilles de statut et motifs', () => {
    renderLayout()
    expect(screen.getByText('k.question')).toBeTruthy()
    expect(screen.getByText('Pris')).toBeTruthy()
    expect(screen.getByText('Partiellement')).toBeTruthy()
    expect(screen.getByText('Non pris')).toBeTruthy()
    expect(screen.getByText('Oubli')).toBeTruthy()
  })

  it('volet Calendrier : streak + légende par statut', () => {
    renderLayout()
    fireEvent.click(screen.getByText('k.tab_calendar'))
    expect(screen.getByText('modules.medication_adherence.streak_plural')).toBeTruthy()
    // légende : un libellé par statut
    expect(screen.getByText('Pris')).toBeTruthy()
    expect(screen.getByText('Non pris')).toBeTruthy()
  })

  it('volet Mes médicaments : liste d\'exemple + bouton d\'ajout', () => {
    renderLayout()
    fireEvent.click(screen.getByText('k.tab_meds'))
    expect(screen.getByText('k.medsadd')).toBeTruthy()
    expect(screen.getByText('modules.medication_adherence.preview_med1_name')).toBeTruthy()
  })
})

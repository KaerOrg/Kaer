import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { render, screen } from '@testing-library/react'
import { SleepJournalLayout } from './SleepJournalLayout'
import type { ContentField } from '@services/moduleService'

// Le layout résout un libellé via t(configField.props[key]) : on mappe chaque clé
// de config vers un code, et t renvoie un texte lisible pour ce code.
const CONFIG_PROPS: Record<string, string> = {
  cta_title: 'c.cta',
  bilan_button_label: 'c.bilan',
  list_header: 'c.list',
  incomplete_label: 'c.incomplete',
  empty_day_label: 'c.empty',
  quality_label: 'c.quality',
  section_schedule_title: 'c.sched',
  in_bed_label: 'c.inbed',
  bedtime_label: 'c.bed',
  wake_time_label: 'c.wake',
  out_of_bed_label: 'c.out',
  onset_label: 'c.onset',
  efficiency_label: 'c.eff',
  efficiency_explanation: 'c.effexp',
  save_label: 'c.save',
}

const LABELS: Record<string, string> = {
  'c.cta': 'Saisir ma nuit d’hier',
  'c.bilan': 'Mon bilan',
  'c.eff': 'Efficacité du sommeil',
  'c.effexp': 'Temps endormi ÷ temps passé au lit',
  'c.sched': 'Horaires',
}
const t = (code: string) => LABELS[code] ?? code

const CONFIG_FIELD: ContentField = {
  id: 'sj.cfg', module_id: 'sleep_diary', section_id: null, parent_field_id: null,
  field_type: 'sleep_journal_config', text_code: null, sort_order: 0,
  props: CONFIG_PROPS, children: [],
}

describe('SleepJournalLayout (aperçu Vue patient, miroir mobile)', () => {
  it('affiche le CTA et le bouton « Mon bilan »', () => {
    render(<SleepJournalLayout fields={[CONFIG_FIELD]} t={t} />)
    expect(screen.getByText('Saisir ma nuit d’hier')).toBeInTheDocument()
    expect(screen.getByText('Mon bilan')).toBeInTheDocument()
  })

  it('rend les barres « fenêtre de sommeil » des nuits renseignées', () => {
    const { container } = render(<SleepJournalLayout fields={[CONFIG_FIELD]} t={t} />)
    // 2 nuits « filled » mock → 2 segments de fenêtre de sommeil
    expect(container.querySelectorAll('.sj-night__segment')).toHaveLength(2)
    expect(container.querySelectorAll('.sj-night--filled')).toHaveLength(2)
  })

  it('rend les 4 horaires CSD en grille 2×2', () => {
    const { container } = render(<SleepJournalLayout fields={[CONFIG_FIELD]} t={t} />)
    expect(container.querySelectorAll('.sj-time-cell')).toHaveLength(4)
  })

  it('affiche l’anneau d’efficacité avec explication', () => {
    render(<SleepJournalLayout fields={[CONFIG_FIELD]} t={t} />)
    expect(screen.getByText('88 %')).toBeInTheDocument()
    expect(screen.getByText('Efficacité du sommeil')).toBeInTheDocument()
    expect(screen.getByText('Temps endormi ÷ temps passé au lit')).toBeInTheDocument()
  })
})

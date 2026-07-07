import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ContentField } from '@services/moduleService'
import type { FormEntryRow } from '@services/engagementService'
import { buildColumnSpecs } from './columnFormData'
import { ColumnFormRecordDetail } from './ColumnFormRecordDetail'

function field(
  over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>,
): ContentField {
  return {
    module_id: 'beck_columns', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

const header = (id: string, key: string, sort: number, children: ContentField[], color = '#111111') =>
  field({ id, field_type: 'column_header', sort_order: sort, text_code: `modules.beck_columns.${key}`, props: { color }, children })
const text = (id: string, key: string, sort: number) =>
  field({ id, field_type: 'column_text_field', sort_order: sort, props: { key }, text_code: `modules.beck_columns.${key}` })
const slider = (id: string, key: string, sort: number, color: string) =>
  field({ id, field_type: 'column_slider_field', sort_order: sort, props: { key, color }, text_code: `modules.beck_columns.${key}` })

const columns = buildColumnSpecs([
  header('h1', 'entry_col_1_title', 10, [text('c1', 'situation', 11)]),
  header('h2', 'entry_col_2_title', 20, [text('c2', 'emotion', 21), slider('s2', 'emotion_intensity', 22, '#8B5CF6')]),
  header('h3', 'entry_col_3_title', 30, [text('c3', 'automatic_thought', 31), slider('s3', 'thought_belief', 32, '#EF4444')]),
  header('h5', 'entry_col_5_title', 50, [
    slider('s5i', 'outcome_intensity', 51, '#D97706'),
    text('c5', 'outcome_emotion', 52),
    slider('s5b', 'outcome_belief', 53, '#D97706'),
  ]),
])

const t = (k: string) => k

function renderDetail(entry: FormEntryRow, over: Partial<Parameters<typeof ColumnFormRecordDetail>[0]> = {}) {
  const props = {
    entry, columns, locale: 'fr-FR', t,
    onOlder: vi.fn(), onNewer: vi.fn(),
    olderDate: '2026-06-28T10:00:00Z' as string | null,
    newerDate: null as string | null,
    ...over,
  }
  return { props, ...render(<ColumnFormRecordDetail {...props} />) }
}

const fullEntry: FormEntryRow = {
  date: '2026-07-06T10:00:00Z',
  values: {
    situation: "Mon manager n'a pas répondu",
    emotion: 'Anxiété', emotion_intensity: 80,
    automatic_thought: 'Il est déçu de mon travail', thought_belief: 85,
    outcome_intensity: 40, outcome_emotion: 'soulagement', outcome_belief: 60,
  },
}

describe('ColumnFormRecordDetail', () => {
  it('affiche la date métier en toutes lettres (français, pas anglais)', () => {
    const { container } = renderDetail(fullEntry)
    const dateText = container.querySelector('.cfd-detail__date')?.textContent ?? ''
    expect(dateText.toLowerCase()).toContain('juillet')
    expect(dateText).not.toContain('July')
  })

  it('rend les deux cartes de mouvement avec avant / après bruts et le delta', () => {
    const { container } = renderDetail(fullEntry)
    const moves = container.querySelectorAll('.cfd-move')
    expect(moves.length).toBe(2)
    // Intensité 80 → 40 (delta -40), légende émotion en caption.
    expect(moves[0].textContent).toContain('80')
    expect(moves[0].textContent).toContain('40')
    expect(moves[0].textContent).toContain('-40')
    expect(moves[0].querySelector('.cfd-move__caption')?.textContent).toBe('Anxiété')
    // Croyance 85 → 60 (delta -25).
    expect(moves[1].textContent).toContain('85')
    expect(moves[1].textContent).toContain('60')
    expect(moves[1].textContent).toContain('-25')
  })

  it('restitue le texte intégral du patient par colonne et masque les curseurs résumés', () => {
    const { container } = renderDetail(fullEntry)
    const cols = container.querySelector('.cfd-cols')?.textContent ?? ''
    expect(cols).toContain("Mon manager n'a pas répondu")
    expect(cols).toContain('Il est déçu de mon travail')
    expect(cols).toContain('soulagement')
    // Les valeurs de curseur résumées ne sont pas répétées comme lignes de colonne.
    expect(container.querySelectorAll('.cfd-col__value-row').length).toBe(0)
  })

  it('n’affiche aucune carte de mouvement si la fiche ne porte aucun curseur', () => {
    const { container } = renderDetail({ date: '2026-07-06T10:00:00Z', values: { situation: 'texte seul' } })
    expect(container.querySelectorAll('.cfd-move').length).toBe(0)
    expect(container.querySelector('.cfd-cols')?.textContent).toContain('texte seul')
  })

  it('désactive la navigation selon les voisins disponibles et remonte les clics', () => {
    const { props, getByLabelText } = renderDetail(fullEntry)
    const older = getByLabelText('patient.beck_older') as HTMLButtonElement
    const newer = getByLabelText('patient.beck_newer') as HTMLButtonElement
    expect(older.disabled).toBe(false)
    expect(newer.disabled).toBe(true) // newerDate = null
    fireEvent.click(older)
    expect(props.onOlder).toHaveBeenCalledTimes(1)
  })

  it('conformité MDR : valeur brute restituée sans qualificatif de gravité', () => {
    const { container } = renderDetail({ date: '2026-07-06T10:00:00Z', values: { emotion_intensity: 95, outcome_intensity: 90 } })
    expect(container.textContent).toContain('95')
    for (const word of ['sévère', 'grave', 'élevé', 'severe', 'high', 'danger', 'amélior', 'dégrad']) {
      expect(container.textContent?.toLowerCase()).not.toContain(word)
    }
  })
})

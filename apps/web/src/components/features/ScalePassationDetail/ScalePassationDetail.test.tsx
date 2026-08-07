import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import type { ScalePassation } from '@services/engagementService'
import { ScalePassationDetail } from './ScalePassationDetail'

function field(
  over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>,
): ContentField {
  return {
    module_id: 'phq9', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

function option(id: string, value: string, sortOrder: number): ContentField {
  return field({
    id, field_type: 'scale_option', text_code: `opt_${value}`,
    sort_order: sortOrder, props: { value },
  })
}

const FIELDS: ContentField[] = [
  field({
    id: 'meta', field_type: 'scale_meta',
    props: {
      min_interpretable_change: '5',
      instrument_citation: 'PHQ-9, Kroenke, Spitzer & Williams, 2001',
    },
  }),
  field({ id: 'instr1', field_type: 'scale_instruction', text_code: 'instructions_1', sort_order: 0 }),
  field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
  field({ id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101 }),
  option('opt0', '0', 10),
  option('opt1', '1', 11),
  option('opt2', '2', 12),
  option('opt3', '3', 13),
  field({
    id: 'q3', field_type: 'scale_question', text_code: 'q3', sort_order: 102,
    props: { scored: 'false' },
    children: [
      field({ id: 'q3.o0', field_type: 'scale_option', text_code: 'q3_opt_0', sort_order: 1, props: { value: '0' } }),
      field({ id: 'q3.o1', field_type: 'scale_option', text_code: 'q3_opt_1', sort_order: 2, props: { value: '1' } }),
    ],
  }),
  field({ id: 'note', field_type: 'scale_practitioner_note', text_code: 'note_item2', sort_order: 990 }),
]

/** `t` de test : renvoie la clé, en y recollant les valeurs interpolées. */
const t = (key: string, options?: Record<string, string | number>): string =>
  options == null ? key : `${key}|${Object.values(options).join('|')}`

function passation(over: Partial<ScalePassation> = {}): ScalePassation {
  return {
    id: 'p1',
    date: '2026-07-28T21:12:00Z',
    answers: [2, 1, 1],
    totalScore: 3,
    ...over,
  }
}

function renderDetail(over: {
  passation?: ScalePassation
  previous?: ScalePassation | null
  fields?: ContentField[]
  nextDueIso?: string | null
} = {}) {
  return render(
    <ScalePassationDetail
      fields={over.fields ?? FIELDS}
      passation={over.passation ?? passation()}
      previous={over.previous ?? null}
      scaleLabel="PHQ-9"
      nextDueIso={over.nextDueIso ?? null}
      locale="fr-FR"
      t={t}
    />,
  )
}

describe('ScalePassationDetail', () => {
  it('rend une ligne par item posé, avec sa modalité et sa valeur', () => {
    const { container } = renderDetail()

    const rows = container.querySelectorAll('.spd-row')
    expect(rows).toHaveLength(3)
    expect(rows[0].textContent).toContain('q1')
    expect(rows[0].textContent).toContain('opt_2')
    expect(rows[2].textContent).toContain('q3_opt_1')
  })

  it('dérive le total maximal de la configuration, sans le coder en dur', () => {
    // 2 items cotés × 3 = 6 ; l'item hors score, borné à 1, n'y entre pas.
    expect(renderDetail().container.textContent).toContain('/ 6')
  })

  it('montre l\'écart avec la passation précédente, toujours accompagné de la mention', () => {
    const { container } = renderDetail({
      passation: passation({ totalScore: 18 }),
      previous: passation({ id: 'p0', date: '2026-07-14T09:00:00Z', totalScore: 22 }),
    })

    expect(container.textContent).toContain('scales.entry_detail.previous|22')
    expect(container.querySelector('.spd-total__delta')?.textContent).toBe('-4')
    expect(container.textContent).toContain('scales.entry_detail.min_change_note|5')
  })

  it('n\'affiche ni bloc « précédente » ni écart pour une première passation', () => {
    const { container } = renderDetail({ previous: null })

    expect(container.querySelector('.spd-total__previous')).toBeNull()
    expect(container.querySelector('.spd-total__delta')).toBeNull()
    expect(container.textContent).not.toContain('scales.entry_detail.min_change_note')
  })

  // ── Conformité MDR : le cœur du ticket ────────────────────────────────────

  it('la note du questionnaire est là MÊME quand la réponse vaut zéro', () => {
    // C'est LE test qui compte : une note visible seulement au-delà d'une valeur
    // serait une alerte déclenchée par une donnée patient.
    const zeros = renderDetail({ passation: passation({ answers: [0, 0, 0], totalScore: 0 }) })
    const maxima = renderDetail({ passation: passation({ answers: [3, 3, 1], totalScore: 6 }) })

    expect(zeros.container.querySelector('.spd-note')?.textContent).toContain('note_item2')
    expect(maxima.container.querySelector('.spd-note')?.textContent).toContain('note_item2')
  })

  it('aucun attribut de rendu ne dépend de la valeur d\'une réponse', () => {
    // Deux passations aux réponses opposées doivent produire le MÊME balisage de
    // lignes : mêmes classes, mêmes styles, mêmes attributs. Seul le texte change.
    const low = renderDetail({ passation: passation({ answers: [0, 0, 0], totalScore: 0 }) })
    const high = renderDetail({ passation: passation({ answers: [3, 3, 1], totalScore: 6 }) })

    const signature = (root: HTMLElement) =>
      [...root.querySelectorAll('.spd-row, .spd-row > *')].map(el => ({
        tag: el.tagName,
        className: el.className,
        style: el.getAttribute('style'),
      }))

    expect(signature(low.container)).toEqual(signature(high.container))
    // Et aucune couleur n'est posée en ligne nulle part dans la vue.
    expect(low.container.querySelector('[style*="color"]')).toBeNull()
    expect(high.container.querySelector('[style*="color"]')).toBeNull()
  })

  it('n\'affiche aucun adjectif de sévérité ni aucune tranche de score', () => {
    const { container } = renderDetail({ passation: passation({ answers: [3, 3, 1], totalScore: 6 }) })
    const text = (container.textContent ?? '').toLowerCase()

    for (const word of ['sévère', 'modéré', 'léger', 'grave', 'élevé', 'severe', 'moderate', 'mild', 'risque']) {
      expect(text).not.toContain(word)
    }
  })

  it('rend la mention de source indépendamment de la note du questionnaire', () => {
    const withoutNote = FIELDS.filter(f => f.field_type !== 'scale_practitioner_note')
    const { container } = renderDetail({ fields: withoutNote })

    expect(container.querySelector('.spd-note')).toBeNull()
    expect(container.querySelector('[data-testid="source-citation"]')?.textContent)
      .toContain('Kroenke')
  })

  // ── Rétrocompatibilité et cas limites ─────────────────────────────────────

  it('n\'affiche aucune ligne pour un item posé après la passation', () => {
    // Passation à 2 réponses sur un questionnaire qui en pose 3 désormais.
    const { container } = renderDetail({
      passation: passation({ answers: [2, 1], totalScore: 3 }),
    })

    expect(container.querySelectorAll('.spd-row')).toHaveLength(2)
    expect(container.querySelector('.spd-rows--unscored')).toBeNull()
    expect(container.textContent).not.toContain('q3')
  })

  it('affiche la prochaine échéance quand il y en a une, et rien sinon', () => {
    expect(renderDetail({ nextDueIso: '2026-08-11' }).container.textContent)
      .toContain('scales.entry_detail.next_due')
    expect(renderDetail({ nextDueIso: null }).container.textContent)
      .not.toContain('scales.entry_detail.next_due')
  })

  it('restitue la consigne telle que le patient l\'a lue', () => {
    expect(renderDetail().container.querySelector('.spd__instructions')?.textContent)
      .toBe('instructions_1')
  })
})

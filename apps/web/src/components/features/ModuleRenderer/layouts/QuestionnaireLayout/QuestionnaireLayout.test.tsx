import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import { QuestionnaireLayout } from './QuestionnaireLayout'

const t = (key: string, options?: Record<string, string | number>): string =>
  options == null ? key : `${key}|${Object.values(options).join('|')}`

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

/** Questionnaire du même moule que le PHQ-9 : 2 items cotés + 1 hors score. */
function fieldsWith(entryMode?: string): ContentField[] {
  return [
    field({
      id: 'meta', field_type: 'scale_meta',
      props: {
        instrument_citation: 'PHQ-9, Kroenke, Spitzer & Williams, 2001',
        ...(entryMode == null ? {} : { entry_mode: entryMode }),
      },
    }),
    field({ id: 'instr', field_type: 'scale_instruction', text_code: 'instructions_1', sort_order: 0 }),
    option('opt0', '0', 10),
    option('opt1', '1', 11),
    field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
    field({ id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101 }),
    field({
      id: 'q3', field_type: 'scale_question', text_code: 'q3', sort_order: 102,
      props: { scored: 'false' },
      children: [
        field({ id: 'q3.o0', field_type: 'scale_option', text_code: 'q3_opt_0', sort_order: 1, props: { value: '0' } }),
        field({ id: 'q3.o1', field_type: 'scale_option', text_code: 'q3_opt_1', sort_order: 2, props: { value: '1' } }),
      ],
    }),
  ]
}

function renderLayout(entryMode?: string) {
  return render(<QuestionnaireLayout fields={fieldsWith(entryMode)} footer={undefined} t={t} />)
}

describe('QuestionnaireLayout : le mode de saisie vient de la CONFIGURATION', () => {
  it('rend le storyboard un item par écran quand l\'échelle le déclare', () => {
    const { container } = renderLayout('one_per_screen')

    expect(container.querySelector('.preview-questionnaire--stepper')).not.toBeNull()
    expect(container.querySelectorAll('.preview-questionnaire__screen')).toHaveLength(3)
    expect(container.textContent).toContain('scales.preview.one_per_screen_note')
    // La progression que le patient voit, écran par écran.
    expect([...container.querySelectorAll('.preview-questionnaire__progress')].map(e => e.textContent))
      .toEqual([
        'scales.preview.step_progress|1|3',
        'scales.preview.step_progress|2|3',
        'scales.preview.step_progress|3|3',
      ])
  })

  it('rend la liste défilante quand l\'échelle ne déclare rien', () => {
    // Une configuration absente dégrade vers le comportement historique.
    const { container } = renderLayout(undefined)

    expect(container.querySelector('.preview-questionnaire--stepper')).toBeNull()
    expect(container.querySelectorAll('.preview-questionnaire__progress')).toHaveLength(0)
    // La légende commune n'a de sens que dans ce mode.
    expect(container.querySelector('.preview-questionnaire__legend')).not.toBeNull()
  })

  it('ne teste JAMAIS le module : deux échelles au même mode se rendent pareil', () => {
    // Le layout sert les neuf échelles. Un `if (moduleId === 'phq9')` y serait une
    // violation bloquante ; ce test le rend visible.
    const asPhq9 = renderLayout('one_per_screen').container.innerHTML
    const asOther = render(
      <QuestionnaireLayout
        fields={fieldsWith('one_per_screen').map(f => ({ ...f, module_id: 'gad7' }))}
        footer={undefined}
        t={t}
      />,
    ).container.innerHTML

    expect(asOther).toBe(asPhq9)
  })

  it('n\'annonce pas la légende commune en un item par écran', () => {
    // Chaque écran porte ses propres modalités : la légende ferait doublon.
    const { container } = renderLayout('one_per_screen')
    expect(container.querySelector('.preview-questionnaire__legend')).toBeNull()
  })
})

describe('QuestionnaireLayout : les items', () => {
  it('rend TOUS les items posés, dont celui qui est hors score (#410)', () => {
    const { container } = renderLayout('one_per_screen')

    const items = [...container.querySelectorAll('.preview-questionnaire__question')]
    expect(items).toHaveLength(3)
    expect(items[2].textContent).toContain('q3')
    expect(items[2].textContent).toContain('scales.preview.unscored')
  })

  it('n\'annonce « hors score » que sur l\'item concerné', () => {
    const { container } = renderLayout('one_per_screen')
    expect(container.querySelectorAll('.preview-questionnaire__unscored')).toHaveLength(1)
  })

  it('rend chaque item avec SES modalités, pas celles du questionnaire', () => {
    // Le défaut réparé : sans cette règle, l'item 10 du PHQ-9 s'affichait avec les
    // modalités de fréquence des items 1 à 9, que le patient n'a jamais vues.
    const { container } = renderLayout('one_per_screen')

    const labelsOf = (screen: Element) =>
      [...screen.querySelectorAll('.preview-questionnaire__pill-label')].map(e => e.textContent)

    const screens = [...container.querySelectorAll('.preview-questionnaire__item')]
    expect(labelsOf(screens[0])).toEqual(['opt_0', 'opt_1'])
    expect(labelsOf(screens[1])).toEqual(['opt_0', 'opt_1'])
    expect(labelsOf(screens[2])).toEqual(['q3_opt_0', 'q3_opt_1'])
  })

  it('numérote les items dans l\'ordre du questionnaire', () => {
    const { container } = renderLayout('one_per_screen')
    expect([...container.querySelectorAll('.preview-questionnaire__num')].map(e => e.textContent))
      .toEqual(['1.', '2.', '3.'])
  })
})

describe('QuestionnaireLayout : mentions dues', () => {
  it('porte la citation des auteurs : l\'aperçu diffuse les items (#417)', () => {
    // C'est l'oubli le plus facile à faire du lot, parce que l'écran n'est « qu'un
    // aperçu » : il n'en montre pas moins les libellés de l'instrument.
    const { container } = renderLayout('one_per_screen')
    expect(container.querySelector('[data-testid="source-citation"]')?.textContent)
      .toContain('Kroenke')
  })

  it('porte la citation dans les deux modes', () => {
    const { container } = renderLayout(undefined)
    expect(container.querySelector('[data-testid="source-citation"]')).not.toBeNull()
  })

  it('rend la consigne du questionnaire, telle qu\'elle est en base', () => {
    const { container } = renderLayout('one_per_screen')
    expect(container.querySelector('.preview-questionnaire__instruction')?.textContent)
      .toBe('instructions_1')
  })
})

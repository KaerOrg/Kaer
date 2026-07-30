import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EmotionNamingCrossTable, CROSSTAB_MIN_ENTRIES } from './EmotionNamingCrossTable'
import type { EmotionNamingEntry } from '../../../lib/emotionNamingData'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}))

const CONTEXTS = ['ctx.work', 'ctx.family', 'ctx.money']
const FAMILIES = ['fam.fear', 'fam.anger', 'fam.joy']

function entry(over: Partial<EmotionNamingEntry> = {}): EmotionNamingEntry {
  return {
    date: '2026-07-20T09:00:00Z',
    familyCode: 'fam.fear', nuanceCode: null, wordCode: null,
    intensity: null, context: ['ctx.work'], contextOther: null, notes: null,
    ...over,
  }
}

/** n saisies identiques : de quoi passer le seuil sans bruit. */
function fill(n: number, over: Partial<EmotionNamingEntry> = {}): EmotionNamingEntry[] {
  return Array.from({ length: n }, () => entry(over))
}

function renderTable(entries: EmotionNamingEntry[], rangeDays = 30) {
  return render(
    <EmotionNamingCrossTable
      entries={entries}
      contextCodes={CONTEXTS}
      familyCodes={FAMILIES}
      rangeDays={rangeDays}
    />
  )
}

describe('EmotionNamingCrossTable', () => {
  it('ne rend PAS la table sous le seuil, et dit pourquoi', () => {
    renderTable(fill(CROSSTAB_MIN_ENTRIES - 1))
    expect(screen.queryByTestId('crosstab')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByTestId('crosstab-too-few').textContent)
      .toContain(`"count":${CROSSTAB_MIN_ENTRIES - 1}`)
    expect(screen.getByTestId('crosstab-too-few').textContent).toContain('"days":30')
  })

  it('rend la table dès que le seuil est atteint', () => {
    renderTable(fill(CROSSTAB_MIN_ENTRIES))
    expect(screen.getByTestId('crosstab')).toBeInTheDocument()
    expect(screen.queryByTestId('crosstab-too-few')).not.toBeInTheDocument()
  })

  it('somme des cellules + « Sans mot » = total de la période', () => {
    const entries = [
      ...fill(6, { familyCode: 'fam.fear', context: ['ctx.work'] }),
      ...fill(4, { familyCode: 'fam.anger', context: ['ctx.family'] }),
      ...fill(2, { familyCode: 'fam.joy', context: [] }),
      ...fill(3, { familyCode: null, context: ['ctx.work'] }),
    ]
    renderTable(entries)
    const totals = screen.getByTestId('crosstab-column-totals')
    const cells = within(totals).getAllByRole('cell').map(td => Number(td.textContent))
    // Les 3 marges de colonne, puis le total de la table.
    expect(cells.slice(0, 3)).toEqual([6, 4, 2])
    expect(cells[3]).toBe(12)
    expect(screen.getByTestId('crosstab-recap').textContent).toContain('"total":15')
    expect(screen.getByTestId('crosstab-recap').textContent).toContain('"count":3')
  })

  it('laisse les saisies « Sans mot » hors table et les rappelle dessous', () => {
    renderTable([...fill(12, { familyCode: 'fam.fear' }), ...fill(2, { familyCode: null })])
    const recap = screen.getByTestId('crosstab-recap')
    expect(recap.textContent).toContain('crosstab_wordless_line')
    expect(recap.textContent).toContain('"count":2')
    // Aucune colonne « sans mot » n'a été inventée dans la table.
    const headers = screen.getAllByRole('columnheader').map(th => th.textContent)
    expect(headers).not.toContain('emotion_naming.wordless')
  })

  it('n\'annonce que le total quand aucune saisie n\'est « Sans mot »', () => {
    renderTable(fill(12))
    const recap = screen.getByTestId('crosstab-recap')
    expect(recap.textContent).toContain('crosstab_total_line')
    expect(recap.textContent).not.toContain('wordless')
  })

  it('laisse une case sans saisie entièrement vide', () => {
    renderTable(fill(12, { familyCode: 'fam.fear', context: ['ctx.work'] }))
    const row = screen.getByText('ctx.work').closest('tr')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    // Libellé, 3 familles, total : seule la première famille porte un chiffre.
    expect(cells[1].textContent).toBe('12')
    expect(cells[2].textContent).toBe('')
    expect(cells[3].textContent).toBe('')
    expect(cells[4].textContent).toBe('12')
  })

  it('ordonne les contextes du plus fourni au moins fourni, « Non renseigné » en dernier', () => {
    renderTable([
      ...fill(2, { context: ['ctx.work'] }),
      ...fill(7, { context: ['ctx.money'] }),
      ...fill(4, { context: [] }),
      ...fill(3, { context: ['ctx.family'] }),
    ])
    const labels = screen.getAllByRole('row')
      .slice(1)
      .map(tr => tr.querySelector('td')?.textContent)
      .filter(Boolean)
    expect(labels[0]).toBe('ctx.money')
    expect(labels[1]).toBe('ctx.family')
    expect(labels[2]).toBe('ctx.work')
    expect(labels[3]).toBe('emotion_naming.crosstab_none')
  })

  it('n\'affiche aucun pourcentage, aucune moyenne, aucun label de gravité', () => {
    const { container } = renderTable(fill(12))
    expect(container.textContent).not.toMatch(/%|moyenne|sévère|élevé|faible|alerte/i)
  })

  it('rend la légende de la rampe de densité', () => {
    renderTable(fill(12))
    expect(screen.getByLabelText('emotion_naming.crosstab_scale_label')).toBeInTheDocument()
    expect(screen.getByText('emotion_naming.crosstab_legend')).toBeInTheDocument()
  })
})

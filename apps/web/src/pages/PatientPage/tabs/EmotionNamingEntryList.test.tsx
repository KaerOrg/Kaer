import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EmotionNamingEntryList } from './EmotionNamingEntryList'
import type { EmotionNamingRow } from '@services/engagementService'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
  }),
}))

const COLORS = { 'fam.joy': '#EFC98A', 'fam.fear': '#AC9BDE' }

function row(over: Partial<EmotionNamingRow> = {}): EmotionNamingRow {
  return {
    date: '2026-07-20T09:36:00Z',
    familyCode: null, nuanceCode: null, wordCode: null,
    intensity: null, context: [], contextOther: null, notes: null,
    ...over,
  }
}

function renderList(entries: EmotionNamingRow[]) {
  return render(
    <EmotionNamingEntryList
      entries={entries}
      colorByFamily={COLORS}
      intensityMax={5}
      locale="fr"
    />
  )
}

describe('EmotionNamingEntryList', () => {
  it('montre la plus récente en haut', () => {
    renderList([
      row({ date: '2026-07-01T10:00:00Z', familyCode: 'fam.joy', nuanceCode: 'n.old' }),
      row({ date: '2026-07-20T10:00:00Z', familyCode: 'fam.fear', nuanceCode: 'n.recent' }),
    ])
    expect(within(screen.getByTestId('entry-row-0')).getByText('n.recent')).toBeInTheDocument()
  })

  it('affiche la note INTÉGRALEMENT, sans troncature', () => {
    const long = 'Réunion difficile. '.repeat(30)
    renderList([row({ familyCode: 'fam.joy', nuanceCode: 'n.a', notes: long })])
    const detail = screen.getByTestId('entry-detail')
    expect(detail.textContent).toContain(long.trim())
    expect(detail.textContent).not.toMatch(/voir plus|…$/)
  })

  it('une entrée « Sans mot » s\'ouvre normalement et n\'affiche aucun chemin d\'émotion', () => {
    renderList([row({ notes: 'réveil difficile' })])
    const path = screen.getByTestId('entry-path')
    expect(path.textContent).toBe('emotion_naming.wordless')
    // La note reste consultable : l'entrée n'est pas dégradée.
    expect(within(screen.getByTestId('entry-detail')).getByText('réveil difficile')).toBeInTheDocument()
  })

  it('une entrée sans intensité n\'affiche aucun cran, et surtout pas un zéro', () => {
    renderList([row({ familyCode: 'fam.joy', nuanceCode: 'n.a' })])
    expect(screen.queryByTestId('entry-intensity')).not.toBeInTheDocument()
    expect(screen.getByTestId('entry-detail').textContent).not.toMatch(/0 \/ 5/)
  })

  it('rend l\'intensité en chiffre brut, sans label interprétatif', () => {
    renderList([row({ familyCode: 'fam.joy', nuanceCode: 'n.a', intensity: 4 })])
    const intensity = screen.getByTestId('entry-intensity')
    expect(intensity.textContent).toContain('4 / 5')
    expect(intensity.textContent).not.toMatch(/fort|sévère|élevé|faible/i)
  })

  it('relie la liste au détail par aria-controls et aria-selected', () => {
    renderList([
      row({ familyCode: 'fam.joy', nuanceCode: 'n.a' }),
      row({ familyCode: 'fam.fear', nuanceCode: 'n.b' }),
    ])
    const first = screen.getByTestId('entry-row-0')
    expect(first).toHaveAttribute('aria-controls', 'enl-detail')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('entry-row-1')).toHaveAttribute('aria-selected', 'false')
  })

  it('change de fiche au clic sur une autre ligne', async () => {
    // Le service renvoie l'ordre chronologique croissant : la liste l'inverse.
    renderList([
      row({ date: '2026-07-01T10:00:00Z', familyCode: 'fam.fear', nuanceCode: 'n.old' }),
      row({ date: '2026-07-20T10:00:00Z', familyCode: 'fam.joy', nuanceCode: 'n.recent' }),
    ])
    expect(screen.getByTestId('entry-path').textContent).toContain('n.recent')
    await userEvent.click(screen.getByTestId('entry-row-1'))
    expect(screen.getByTestId('entry-path').textContent).toContain('n.old')
  })

  it('filtre sur les saisies portant une note écrite', async () => {
    renderList([
      row({ familyCode: 'fam.joy', nuanceCode: 'n.sans', notes: null }),
      row({ familyCode: 'fam.fear', nuanceCode: 'n.avec', notes: 'un texte' }),
    ])
    await userEvent.click(screen.getByText('emotion_naming.filter_with_notes:1'))
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByTestId('entry-path').textContent).toContain('n.avec')
  })

  it('affiche le contexte libre à côté des domaines déclarés', () => {
    renderList([row({
      familyCode: 'fam.joy', nuanceCode: 'n.a',
      context: ['ctx.work'], contextOther: 'trajet du matin',
    })])
    const detail = screen.getByTestId('entry-detail')
    expect(within(detail).getByText('ctx.work')).toBeInTheDocument()
    expect(within(detail).getByText('trajet du matin')).toBeInTheDocument()
  })

  it('ne rend rien quand il n\'y a aucune saisie', () => {
    const { container } = renderList([])
    expect(container).toBeEmptyDOMElement()
  })
})

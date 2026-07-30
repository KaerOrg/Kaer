import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EmotionNamingDataPanel } from './EmotionNamingDataPanel'
import type { EmotionNamingRow } from '@services/engagementService'

// `t` renvoie la clé : les codes i18n de la taxonomie restent lisibles dans les assertions.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

const FIELDS = {
  preview_kind: 'tree_selector',
  fields: [
    {
      id: 'ew.joy', module_id: 'emotion_wheel', section_id: null, parent_field_id: null,
      field_type: 'tree_node', text_code: 'fam.joy', sort_order: 100,
      props: { color: '#EFC98A' },
      children: [
        {
          id: 'ew.joy.love', module_id: 'emotion_wheel', section_id: null, parent_field_id: 'ew.joy',
          field_type: 'tree_node', text_code: 'n.joy.love', sort_order: 1, props: {},
          children: [
            {
              id: 'ew.joy.love.a', module_id: 'emotion_wheel', section_id: null,
              parent_field_id: 'ew.joy.love', field_type: 'tree_node', text_code: 'w.a',
              sort_order: 1, props: {}, children: [],
            },
          ],
        },
        {
          id: 'ew.joy.calm', module_id: 'emotion_wheel', section_id: null, parent_field_id: 'ew.joy',
          field_type: 'tree_node', text_code: 'n.joy.calm', sort_order: 2, props: {}, children: [],
        },
      ],
    },
    {
      id: 'ew.disgust', module_id: 'emotion_wheel', section_id: null, parent_field_id: null,
      field_type: 'tree_node', text_code: 'fam.disgust', sort_order: 140,
      props: { color: '#AFBE8B' },
      children: [
        {
          id: 'ew.disgust.rep', module_id: 'emotion_wheel', section_id: null,
          parent_field_id: 'ew.disgust', field_type: 'tree_node', text_code: 'n.disgust.rep',
          sort_order: 1, props: {}, children: [],
        },
      ],
    },
  ],
}

vi.mock('@services/moduleService', () => ({
  fetchModuleFields: () => Promise.resolve(FIELDS),
}))

function row(over: Partial<EmotionNamingRow> = {}): EmotionNamingRow {
  return {
    date: new Date().toISOString(),
    familyCode: null, nuanceCode: null, wordCode: null,
    intensity: null, context: [], contextOther: null, notes: null,
    ...over,
  }
}

function renderPanel(entries: EmotionNamingRow[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <EmotionNamingDataPanel entries={entries} moduleType="emotion_wheel" locale="fr" />
    </QueryClientProvider>
  )
}

describe('EmotionNamingDataPanel', () => {
  it('affiche toutes les familles, y compris celles jamais employées', async () => {
    renderPanel([row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' })])
    // La ligne Dégoût reste entière et vide : c'est voulu, c'est le propos de l'écran.
    expect(await screen.findByTestId('row-fam.disgust')).toBeInTheDocument()
    expect(screen.getByTestId('row-fam.joy')).toBeInTheDocument()
  })

  it('affiche toutes les nuances, employées ou non', async () => {
    renderPanel([row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' })])
    expect(await screen.findByTestId('cell-n.joy.love')).toBeInTheDocument()
    expect(screen.getByTestId('cell-n.joy.calm')).toBeInTheDocument()
    expect(screen.getByTestId('cell-n.disgust.rep')).toBeInTheDocument()
  })

  it('une nuance jamais employée n\'affiche aucun chiffre', async () => {
    renderPanel([row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' })])
    const unused = await screen.findByTestId('cell-n.joy.calm')
    expect(unused.className).toContain('enp__cell--unused')
    expect(unused.textContent).toBe('n.joy.calm')
  })

  it('affiche le compte brut d\'une nuance employée', async () => {
    renderPanel([
      row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
      row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
    ])
    const cell = await screen.findByTestId('cell-n.joy.love')
    expect(within(cell).getByText('2')).toBeInTheDocument()
  })

  it('bascule sur les mots précis', async () => {
    renderPanel([row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', wordCode: 'w.a' })])
    await screen.findByTestId('cell-n.joy.love')
    await userEvent.click(screen.getByText('emotion_naming.level_word'))
    expect(await screen.findByTestId('cell-w.a')).toBeInTheDocument()
    expect(screen.queryByTestId('cell-n.joy.love')).not.toBeInTheDocument()
  })

  it('compte les saisies sans mot dans la synthèse', async () => {
    renderPanel([row({ familyCode: 'fam.joy' }), row(), row()])
    expect(await screen.findByText('2 / 3')).toBeInTheDocument()
  })

  it('n\'affiche ni moyenne, ni tendance, ni pourcentage', async () => {
    const { container } = renderPanel([
      row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', intensity: 4 }),
      row({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', intensity: 2 }),
    ])
    await screen.findByTestId('repertoire-matrix')
    // Aucune moyenne d'intensité (3), aucun pourcentage, aucune flèche d'évolution.
    expect(container.textContent).not.toMatch(/%|moyenne|↑|↓|→/i)
  })

  it('supporte un patient sans aucune saisie dans la fenêtre', async () => {
    renderPanel([row({ date: '2020-01-01T10:00:00Z', familyCode: 'fam.joy' })])
    // La matrice reste affichée en entier : le vide est l'information.
    expect(await screen.findByTestId('row-fam.joy')).toBeInTheDocument()
    expect(screen.getByTestId('cell-n.joy.love').className).toContain('enp__cell--unused')
  })
})

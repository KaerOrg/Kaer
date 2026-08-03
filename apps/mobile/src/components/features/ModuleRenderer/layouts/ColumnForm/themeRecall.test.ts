import {
  normalizeTheme, readReassuranceConfig, distinctThemes,
  matchEntriesByTheme, buildRecallFields,
  type ThemeEntry, type RecallColumn,
} from './themeRecall'

// Fabrique de fiche minimale (compatible FormEntry) pour les tests purs.
function entry(id: string, theme: string, createdAt: string, extra: Record<string, string | number> = {}): ThemeEntry {
  return { id, created_at: createdAt, values: { situation_theme: theme, ...extra } }
}

describe('normalizeTheme', () => {
  it('trim, minuscules et compacte les espaces', () => {
    expect(normalizeTheme('  Réunions   Pro ')).toBe('réunions pro')
  })
  it('gère undefined / null / nombre', () => {
    expect(normalizeTheme(undefined)).toBe('')
    expect(normalizeTheme(null)).toBe('')
    expect(normalizeTheme(42)).toBe('42')
  })
})

describe('readReassuranceConfig', () => {
  it('retourne null sans theme_key (module sans réassurance)', () => {
    expect(readReassuranceConfig(undefined)).toBeNull()
    expect(readReassuranceConfig({ list_card_variant: 'narrative' })).toBeNull()
  })
  it('lit les libellés et les clés indexées reassurance_key_*', () => {
    const cfg = readReassuranceConfig({
      theme_key: 'situation_theme',
      theme_chips_label: 'modules.beck_columns.theme_chips_label',
      reassurance_title: 'modules.beck_columns.reassurance_title',
      reassurance_hint: 'modules.beck_columns.reassurance_hint',
      reassurance_key_1: 'evidence_against',
      reassurance_key_2: 'rational_response',
      reassurance_key_3: 'outcome_intensity',
    })
    expect(cfg).not.toBeNull()
    expect(cfg?.themeKey).toBe('situation_theme')
    expect(cfg?.recallKeys).toEqual(['evidence_against', 'rational_response', 'outcome_intensity'])
  })
})

describe('distinctThemes', () => {
  const entries: ThemeEntry[] = [
    entry('a', 'Réunions', '2026-03-03T10:00:00Z'),
    entry('b', 'réunions', '2026-02-02T10:00:00Z'), // doublon normalisé de 'a'
    entry('c', 'Conflit familial', '2026-01-01T10:00:00Z'),
    entry('d', '   ', '2025-12-01T10:00:00Z'),        // vide → ignoré
  ]
  it('dédup par forme normalisée, casse d’origine, plus récent d’abord', () => {
    expect(distinctThemes(entries, 'situation_theme')).toEqual(['Réunions', 'Conflit familial'])
  })
  it('respecte la limite', () => {
    expect(distinctThemes(entries, 'situation_theme', 1)).toEqual(['Réunions'])
  })
  it('retourne [] quand aucune fiche ne porte de thème', () => {
    expect(distinctThemes([entry('x', '', '2026-01-01T10:00:00Z')], 'situation_theme')).toEqual([])
  })
})

describe('matchEntriesByTheme', () => {
  const entries: ThemeEntry[] = [
    entry('a', 'Réunions', '2026-03-03T10:00:00Z'),
    entry('b', 'RÉUNIONS ', '2026-02-02T10:00:00Z'),
    entry('c', 'Autre', '2026-01-01T10:00:00Z'),
  ]
  it('retourne [] si le thème courant est vide (aucun rappel sans thème)', () => {
    expect(matchEntriesByTheme(entries, 'situation_theme', '   ')).toEqual([])
  })
  it('matche par égalité normalisée, ordre d’entrée préservé', () => {
    const res = matchEntriesByTheme(entries, 'situation_theme', 'réunions')
    expect(res.map(e => e.id)).toEqual(['a', 'b'])
  })
  it('exclut la fiche en cours d’édition', () => {
    const res = matchEntriesByTheme(entries, 'situation_theme', 'réunions', 'a')
    expect(res.map(e => e.id)).toEqual(['b'])
  })
})

describe('buildRecallFields', () => {
  const columns: RecallColumn[] = [
    {
      header: { text_code: 'modules.beck_columns.entry_col_evidence_against_title', props: { color: '#10B981' } },
      children: [{ field_type: 'column_text_field', text_code: 'ph.eva', props: { key: 'evidence_against' } }],
    },
    {
      header: { text_code: 'modules.beck_columns.entry_col_4_title', props: { color: '#6366F1' } },
      children: [{ field_type: 'column_text_field', text_code: 'ph.rat', props: { key: 'rational_response' } }],
    },
    {
      header: { text_code: 'modules.beck_columns.entry_col_5_title', props: { color: '#EC4899' } },
      children: [{ field_type: 'column_slider_field', text_code: 'modules.beck_columns.entry_col_5_intensity', props: { key: 'outcome_intensity', unit: '%' } }],
    },
  ]
  it('dérive libellé (header pour un texte, child pour un slider), couleur et unité', () => {
    const fields = buildRecallFields(columns, ['evidence_against', 'rational_response', 'outcome_intensity'])
    expect(fields).toEqual([
      { key: 'evidence_against', labelCode: 'modules.beck_columns.entry_col_evidence_against_title', color: '#10B981', unit: '' },
      { key: 'rational_response', labelCode: 'modules.beck_columns.entry_col_4_title', color: '#6366F1', unit: '' },
      { key: 'outcome_intensity', labelCode: 'modules.beck_columns.entry_col_5_intensity', color: '#EC4899', unit: '%' },
    ])
  })
  it('ignore les clés introuvables', () => {
    expect(buildRecallFields(columns, ['inconnue'])).toEqual([])
  })
})

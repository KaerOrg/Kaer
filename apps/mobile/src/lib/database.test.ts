import {
  computeSleepDuration,
  generateId,
  needsActivityRecordsRebuild,
  ACTIVITY_RECORDS_REBUILD_STATEMENTS,
  ACTIVITY_RECORDS_SCHEMA_V2,
} from './database'

describe('computeSleepDuration', () => {
  it('calcule une durée simple (même jour)', () => {
    expect(computeSleepDuration('22:00', '06:00')).toBe('8h00')
  })

  it('calcule une durée avec passage à minuit', () => {
    expect(computeSleepDuration('23:30', '07:00')).toBe('7h30')
  })

  it("soustrait le temps d'endormissement", () => {
    expect(computeSleepDuration('22:00', '06:00', 30)).toBe('7h30')
  })

  it('gère les minutes non nulles dans le résultat', () => {
    expect(computeSleepDuration('22:15', '06:30')).toBe('8h15')
  })

  it('retourne 0h00 si coucher == réveil', () => {
    expect(computeSleepDuration('08:00', '08:00')).toBe('0h00')
  })

  it('formate les minutes avec un zéro initial si < 10', () => {
    expect(computeSleepDuration('22:00', '05:05')).toBe('7h05')
  })
})

describe('generateId', () => {
  it('retourne une string non vide', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('génère des identifiants uniques', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('migration activity_records v2 (refonte prédire/faire/constater)', () => {
  it('needsActivityRecordsRebuild : vrai pour un schéma v1 (sans expected_pleasure)', () => {
    const v1 = ['id', 'date', 'label', 'pleasure', 'mastery', 'done', 'notes', 'created_at']
    expect(needsActivityRecordsRebuild(v1.map(name => ({ name })))).toBe(true)
  })

  it('needsActivityRecordsRebuild : faux pour un schéma v2 ou une table absente', () => {
    expect(needsActivityRecordsRebuild([{ name: 'id' }, { name: 'expected_pleasure' }])).toBe(false)
    // Table absente (PRAGMA vide) : pas de rebuild, le CREATE v2 suffit.
    expect(needsActivityRecordsRebuild([])).toBe(false)
  })

  it('le schéma v2 rend P/M nullables et ajoute les nouvelles colonnes', () => {
    expect(ACTIVITY_RECORDS_SCHEMA_V2).not.toMatch(/pleasure INTEGER NOT NULL/)
    for (const col of ['expected_pleasure', 'expected_mastery', 'planned_time', 'domain_id', 'config_activity_id']) {
      expect(ACTIVITY_RECORDS_SCHEMA_V2).toContain(col)
    }
  })

  it('le rebuild mappe le legacy : planifiée → attendus, réalisée → ressentis', () => {
    const insert = ACTIVITY_RECORDS_REBUILD_STATEMENTS[1]
    expect(insert).toContain('CASE WHEN done = 0 THEN pleasure ELSE NULL END')
    expect(insert).toContain('CASE WHEN done = 1 THEN pleasure ELSE NULL END')
    expect(insert).toContain('CASE WHEN done = 0 THEN mastery ELSE NULL END')
    expect(insert).toContain('CASE WHEN done = 1 THEN mastery ELSE NULL END')
    // La séquence se termine par le drop + rename (bascule atomique de la table).
    expect(ACTIVITY_RECORDS_REBUILD_STATEMENTS[2]).toBe('DROP TABLE activity_records')
    expect(ACTIVITY_RECORDS_REBUILD_STATEMENTS[3]).toBe('ALTER TABLE activity_records_v2 RENAME TO activity_records')
  })

  it('le CREATE du rebuild cible activity_records_v2 sans toucher la table source', () => {
    const create = ACTIVITY_RECORDS_REBUILD_STATEMENTS[0]
    expect(create).toContain('CREATE TABLE IF NOT EXISTS activity_records_v2')
  })
})

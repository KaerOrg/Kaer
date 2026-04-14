import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('psytool.db')
  }
  return db
}

// Initialise toutes les tables locales au premier lancement
export async function initDatabase(): Promise<void> {
  const database = getDb()
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS crisis_plan_items (
      id TEXT PRIMARY KEY,
      step_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sleep_diary_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      bedtime TEXT,
      wake_time TEXT,
      sleep_onset_minutes INTEGER DEFAULT 0,
      awakenings INTEGER DEFAULT 0,
      awakenings_duration_minutes INTEGER DEFAULT 0,
      quality INTEGER,
      nightmares INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await createDecisionalBalanceTable(database)
  await createBeckColumnsTable(database)
  // Migrations : ajouter les colonnes absentes des installations existantes
  const migrations = [
    `ALTER TABLE sleep_diary_entries ADD COLUMN nightmares INTEGER DEFAULT 0`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN awakenings_duration_minutes INTEGER DEFAULT 0`,
  ]
  for (const sql of migrations) {
    try { await database.execAsync(sql) } catch { /* colonne déjà présente */ }
  }
}

// --- Types Plan de Crise ---

export interface CrisisPlanItem {
  id: string
  step_number: number  // 1 à 6
  content: string
  position: number
  created_at: string
}

// --- Fonctions CRUD Plan de Crise ---

export async function getAllCrisisPlanItems(): Promise<CrisisPlanItem[]> {
  const database = getDb()
  return database.getAllAsync<CrisisPlanItem>(
    'SELECT * FROM crisis_plan_items ORDER BY step_number ASC, position ASC, created_at ASC'
  )
}

export async function saveCrisisPlanItem(item: Omit<CrisisPlanItem, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO crisis_plan_items (id, step_number, content, position)
     VALUES (?, ?, ?, ?)`,
    [item.id, item.step_number, item.content, item.position]
  )
}

export async function deleteCrisisPlanItem(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM crisis_plan_items WHERE id = ?', [id])
}

// --- Types ---

export interface SleepEntry {
  id: string
  date: string                          // YYYY-MM-DD : la nuit enregistrée
  bedtime: string | null                // HH:MM
  wake_time: string | null              // HH:MM
  sleep_onset_minutes: number           // temps pour s'endormir (minutes)
  awakenings: number                    // nombre de réveils nocturnes
  awakenings_duration_minutes: number   // durée totale des réveils (minutes)
  quality: number | null                // 1 à 5
  nightmares: number                    // 0 = non, 1 = oui
  notes: string | null
  created_at: string
}

// --- Fonctions CRUD agenda du sommeil ---

export async function getAllSleepEntries(): Promise<SleepEntry[]> {
  const database = getDb()
  return database.getAllAsync<SleepEntry>(
    'SELECT * FROM sleep_diary_entries ORDER BY date DESC'
  )
}

export async function getSleepEntry(date: string): Promise<SleepEntry | null> {
  const database = getDb()
  return database.getFirstAsync<SleepEntry>(
    'SELECT * FROM sleep_diary_entries WHERE date = ?',
    [date]
  )
}

export async function saveSleepEntry(entry: Omit<SleepEntry, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO sleep_diary_entries
      (id, date, bedtime, wake_time, sleep_onset_minutes, awakenings, awakenings_duration_minutes, quality, nightmares, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.bedtime,
      entry.wake_time,
      entry.sleep_onset_minutes,
      entry.awakenings,
      entry.awakenings_duration_minutes,
      entry.quality,
      entry.nightmares,
      entry.notes,
    ]
  )
}

// Récupère toutes les entrées d'un mois donné (YYYY-MM)
export async function getSleepEntriesForMonth(yearMonth: string): Promise<SleepEntry[]> {
  const database = getDb()
  return database.getAllAsync<SleepEntry>(
    `SELECT * FROM sleep_diary_entries WHERE date LIKE ? ORDER BY date ASC`,
    [`${yearMonth}-%`]
  )
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM sleep_diary_entries WHERE id = ?', [id])
}

// Calcule la durée de sommeil estimée à partir de l'heure de coucher et de lever
export function computeSleepDuration(
  bedtime: string,
  wakeTime: string,
  onsetMinutes = 0
): string {
  const [bH, bM] = bedtime.split(':').map(Number)
  const [wH, wM] = wakeTime.split(':').map(Number)
  let totalMinutes = wH * 60 + wM - (bH * 60 + bM) - onsetMinutes
  if (totalMinutes < 0) totalMinutes += 24 * 60 // passage minuit
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

/**
 * Calcule l'Efficacité du Sommeil (SE) en pourcentage.
 *
 * Formule clinique (TCC-I) :
 *   Temps Passé au Lit (TPL) = heure de lever − heure de coucher
 *   Temps de Sommeil Total (TST) = TPL − temps d'endormissement − durée totale des réveils
 *   SE (%) = (TST / TPL) × 100
 *
 * Seuils : ≥ 85 % = bon | ≥ 70 % = moyen | < 70 % = insuffisant
 *
 * Retourne null si les données sont insuffisantes (horaires manquants ou TPL ≤ 0).
 */
export function computeSleepEfficiency(
  bedtime: string,
  wakeTime: string,
  onsetMinutes = 0,
  awakeningsDurationMinutes = 0
): number | null {
  const [bH, bM] = bedtime.split(':').map(Number)
  const [wH, wM] = wakeTime.split(':').map(Number)
  const rawDiff = wH * 60 + wM - (bH * 60 + bM)
  // Horaires identiques = données invalides
  if (rawDiff === 0) return null
  // Passage minuit : lever avant coucher (ex: coucher 23h, lever 06h)
  const tpl = rawDiff < 0 ? rawDiff + 24 * 60 : rawDiff
  if (tpl <= 0) return null

  const tst = tpl - onsetMinutes - awakeningsDurationMinutes
  const se = Math.round((Math.max(0, tst) / tpl) * 100)
  return Math.min(100, se)
}

/** Classe la SE en catégorie clinique */
export function sleepEfficiencyLabel(se: number): 'bon' | 'moyen' | 'insuffisant' {
  if (se >= 85) return 'bon'
  if (se >= 70) return 'moyen'
  return 'insuffisant'
}

// Génère un identifiant unique simple
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

// ─── Types Balance Décisionnelle ─────────────────────────────────────────────

/** Un argument dans un quadrant de la balance, avec son poids d'importance (1-5) */
export interface BalanceArgument {
  id: string
  text: string
  weight: number // 1 à 5
}

/** Les 4 quadrants de la balance décisionnelle */
export type BalanceQuadrant = 'pros_change' | 'cons_change' | 'pros_status_quo' | 'cons_status_quo'

/** Enregistrement complet d'une balance décisionnelle */
export interface DecisionalBalance {
  id: string
  target_behavior: string
  pros_change: BalanceArgument[]
  cons_change: BalanceArgument[]
  pros_status_quo: BalanceArgument[]
  cons_status_quo: BalanceArgument[]
  updated_at: string
}

/** Scores calculés à partir des poids des arguments */
export interface BalanceScores {
  /** Somme des poids de pros_change + pros_status_quo du changement */
  changeScore: number
  /** Somme des poids de pros_status_quo + cons_change du statu quo */
  statusQuoScore: number
  /** changeScore / (changeScore + statusQuoScore) × 100, ou 50 si tout est vide */
  motivationPercent: number
}

// ─── Calcul des scores (pur, testable) ───────────────────────────────────────

/** Somme des poids d'une liste d'arguments */
function sumWeights(args: BalanceArgument[]): number {
  return args.reduce((acc, a) => acc + a.weight, 0)
}

/**
 * Calcule les scores de la balance décisionnelle.
 *
 * Score Changement  = Σ poids(pros_change)
 * Score Statu Quo   = Σ poids(pros_status_quo)
 * La jauge compare ces deux scores pour indiquer la motivation au changement.
 */
export function computeBalanceScores(balance: Pick<DecisionalBalance, 'pros_change' | 'cons_change' | 'pros_status_quo' | 'cons_status_quo'>): BalanceScores {
  const changeScore = sumWeights(balance.pros_change)
  const statusQuoScore = sumWeights(balance.pros_status_quo)
  const total = changeScore + statusQuoScore
  const motivationPercent = total === 0 ? 50 : Math.round((changeScore / total) * 100)
  return { changeScore, statusQuoScore, motivationPercent }
}

// ─── Fonctions SQLite Balance Décisionnelle ───────────────────────────────────

/** Crée la table si elle n'existe pas encore (appelée dans initDatabase) */
async function createDecisionalBalanceTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS decisional_balance (
      id TEXT PRIMARY KEY,
      target_behavior TEXT NOT NULL DEFAULT '',
      pros_change TEXT NOT NULL DEFAULT '[]',
      cons_change TEXT NOT NULL DEFAULT '[]',
      pros_status_quo TEXT NOT NULL DEFAULT '[]',
      cons_status_quo TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

function parseBalance(row: {
  id: string
  target_behavior: string
  pros_change: string
  cons_change: string
  pros_status_quo: string
  cons_status_quo: string
  updated_at: string
}): DecisionalBalance {
  return {
    id: row.id,
    target_behavior: row.target_behavior,
    pros_change: JSON.parse(row.pros_change) as BalanceArgument[],
    cons_change: JSON.parse(row.cons_change) as BalanceArgument[],
    pros_status_quo: JSON.parse(row.pros_status_quo) as BalanceArgument[],
    cons_status_quo: JSON.parse(row.cons_status_quo) as BalanceArgument[],
    updated_at: row.updated_at,
  }
}

/**
 * Récupère la balance décisionnelle du patient (une seule par patient).
 * Retourne null si aucune n'existe encore.
 */
export async function getDecisionalBalance(): Promise<DecisionalBalance | null> {
  const database = getDb()
  const row = await database.getFirstAsync<{
    id: string
    target_behavior: string
    pros_change: string
    cons_change: string
    pros_status_quo: string
    cons_status_quo: string
    updated_at: string
  }>('SELECT * FROM decisional_balance LIMIT 1')
  return row ? parseBalance(row) : null
}

/** Sauvegarde (insert ou replace) la balance décisionnelle */
export async function saveDecisionalBalance(balance: DecisionalBalance): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO decisional_balance
      (id, target_behavior, pros_change, cons_change, pros_status_quo, cons_status_quo, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      balance.id,
      balance.target_behavior,
      JSON.stringify(balance.pros_change),
      JSON.stringify(balance.cons_change),
      JSON.stringify(balance.pros_status_quo),
      JSON.stringify(balance.cons_status_quo),
      new Date().toISOString(),
    ]
  )
}

// ─── Types Colonnes de Beck ───────────────────────────────────────────────────

/**
 * Enregistrement de pensée dysfonctionnelle (DTR) — 5 colonnes de Beck.
 * Référence : Beck, Rush, Shaw & Emery (1979). Cognitive Therapy of Depression.
 *
 * Les valeurs d'intensité (0–100) sont des chiffres bruts saisis par le patient,
 * sans interprétation algorithmique — conformité MDR 2017/745.
 */
export interface ThoughtRecord {
  id: string
  date: string                  // ISO 8601
  // Colonne 1 : Situation
  situation: string
  // Colonne 2 : Émotion
  emotion: string
  emotion_intensity: number     // 0–100, brut
  // Colonne 3 : Pensée automatique
  automatic_thought: string
  thought_belief: number        // 0–100, conviction initiale, brut
  // Colonne 4 : Réponse rationnelle
  rational_response: string
  // Colonne 5 : Résultat
  outcome_emotion: string
  outcome_intensity: number     // 0–100, brut
  outcome_belief: number        // 0–100, conviction en la PA, brut
  created_at: string
}

// ─── SQLite Colonnes de Beck ──────────────────────────────────────────────────

export async function createBeckColumnsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS beck_thought_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      situation TEXT NOT NULL DEFAULT '',
      emotion TEXT NOT NULL DEFAULT '',
      emotion_intensity INTEGER NOT NULL DEFAULT 50,
      automatic_thought TEXT NOT NULL DEFAULT '',
      thought_belief INTEGER NOT NULL DEFAULT 50,
      rational_response TEXT NOT NULL DEFAULT '',
      outcome_emotion TEXT NOT NULL DEFAULT '',
      outcome_intensity INTEGER NOT NULL DEFAULT 50,
      outcome_belief INTEGER NOT NULL DEFAULT 50,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Récupère tous les enregistrements, du plus récent au plus ancien */
export async function getAllThoughtRecords(): Promise<ThoughtRecord[]> {
  const database = getDb()
  return database.getAllAsync<ThoughtRecord>(
    'SELECT * FROM beck_thought_records ORDER BY date DESC, created_at DESC'
  )
}

/** Récupère un enregistrement par son identifiant */
export async function getThoughtRecord(id: string): Promise<ThoughtRecord | null> {
  const database = getDb()
  return database.getFirstAsync<ThoughtRecord>(
    'SELECT * FROM beck_thought_records WHERE id = ?',
    [id]
  )
}

/** Sauvegarde (insert ou replace) un enregistrement */
export async function saveThoughtRecord(record: Omit<ThoughtRecord, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO beck_thought_records
      (id, date, situation, emotion, emotion_intensity,
       automatic_thought, thought_belief,
       rational_response,
       outcome_emotion, outcome_intensity, outcome_belief)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.date,
      record.situation,
      record.emotion,
      record.emotion_intensity,
      record.automatic_thought,
      record.thought_belief,
      record.rational_response,
      record.outcome_emotion,
      record.outcome_intensity,
      record.outcome_belief,
    ]
  )
}

/** Supprime un enregistrement */
export async function deleteThoughtRecord(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM beck_thought_records WHERE id = ?', [id])
}

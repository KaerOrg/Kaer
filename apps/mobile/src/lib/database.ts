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
  await createMoodTrackerTable(database)
  await createMedicationAdherenceTable(database)
  await createMedicationSideEffectsTable(database)
  await createFearThermometerTables(database)
  await createBehavioralActivationTable(database)
  await createBreathingSessionsTable(database)
  // Migrations : ajouter les colonnes absentes des installations existantes
  const migrations = [
    `ALTER TABLE sleep_diary_entries ADD COLUMN nightmares INTEGER DEFAULT 0`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN awakenings_duration_minutes INTEGER DEFAULT 0`,
    `ALTER TABLE mood_entries ADD COLUMN pleasure INTEGER NOT NULL DEFAULT 5`,
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

// ─── Types Thermomètre de l'Humeur ───────────────────────────────────────────
//
// Dimensions retenues (CANMAT 2018 / Basco & Rush 2005 / NIMH Life Chart) :
//   - mood       : humeur globale (1–10) — universel tous diagnostics
//   - energy     : énergie/vitalité (1–10) — distingue les polarités, prédit les rechutes
//   - anxiety    : anxiété (1–10) — comorbidité présente chez ~60 % des patients
//
// Les valeurs sont des chiffres bruts saisis par le patient.
// Aucune interprétation algorithmique — conformité MDR 2017/745.

export interface MoodEntry {
  id: string
  date: string          // YYYY-MM-DD — une saisie par jour
  mood: number          // 1–10, brut
  energy: number        // 1–10, brut
  anxiety: number       // 1–10, brut
  pleasure: number      // 1–10, brut — dimension anhédonique (SHAPS 1995)
  notes: string | null  // texte libre optionnel
  created_at: string
}

// ─── SQLite Thermomètre de l'Humeur ──────────────────────────────────────────

export async function createMoodTrackerTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      mood INTEGER NOT NULL DEFAULT 5,
      energy INTEGER NOT NULL DEFAULT 5,
      anxiety INTEGER NOT NULL DEFAULT 5,
      pleasure INTEGER NOT NULL DEFAULT 5,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Récupère toutes les entrées, de la plus récente à la plus ancienne */
export async function getAllMoodEntries(): Promise<MoodEntry[]> {
  const database = getDb()
  return database.getAllAsync<MoodEntry>(
    'SELECT * FROM mood_entries ORDER BY date DESC'
  )
}

/** Récupère les N dernières entrées (pour le graphique) */
export async function getRecentMoodEntries(limit = 30): Promise<MoodEntry[]> {
  const database = getDb()
  return database.getAllAsync<MoodEntry>(
    'SELECT * FROM mood_entries ORDER BY date DESC LIMIT ?',
    [limit]
  )
}

/** Récupère l'entrée du jour (YYYY-MM-DD), ou null si absente */
export async function getMoodEntryForDate(date: string): Promise<MoodEntry | null> {
  const database = getDb()
  return database.getFirstAsync<MoodEntry>(
    'SELECT * FROM mood_entries WHERE date = ?',
    [date]
  )
}

/** Sauvegarde (insert ou replace) une entrée */
export async function saveMoodEntry(entry: Omit<MoodEntry, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO mood_entries (id, date, mood, energy, anxiety, pleasure, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.date, entry.mood, entry.energy, entry.anxiety, entry.pleasure, entry.notes]
  )
}

/** Supprime une entrée */
export async function deleteMoodEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM mood_entries WHERE id = ?', [id])
}

// ─── Types Observance Médicamenteuse ─────────────────────────────────────────
//
// Le patient déclare lui-même le statut de prise de son traitement pour chaque jour.
// Aucune interprétation algorithmique — conformité MDR 2017/745.
// Le praticien lit ces données brutes en consultation.

/** Statut de prise déclaré par le patient */
export type AdherenceStatus = 'taken' | 'partial' | 'missed'

/** Entrée quotidienne d'observance */
export interface MedicationAdherenceEntry {
  id: string
  date: string                // YYYY-MM-DD — une saisie par jour
  status: AdherenceStatus     // 'taken' | 'partial' | 'missed' — déclaratif, brut
  notes: string | null        // texte libre optionnel
  created_at: string
}

// ─── SQLite Observance Médicamenteuse ─────────────────────────────────────────

export async function createMedicationAdherenceTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS medication_adherence_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'taken',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Récupère l'entrée d'un jour donné (YYYY-MM-DD), ou null si absente */
export async function getMedicationAdherenceEntry(date: string): Promise<MedicationAdherenceEntry | null> {
  const database = getDb()
  return database.getFirstAsync<MedicationAdherenceEntry>(
    'SELECT * FROM medication_adherence_entries WHERE date = ?',
    [date]
  )
}

/** Récupère les N dernières entrées, du plus récent au plus ancien */
export async function getAllMedicationAdherenceEntries(limit = 30): Promise<MedicationAdherenceEntry[]> {
  const database = getDb()
  return database.getAllAsync<MedicationAdherenceEntry>(
    'SELECT * FROM medication_adherence_entries ORDER BY date DESC LIMIT ?',
    [limit]
  )
}

/** Sauvegarde (insert ou replace) une entrée d'observance */
export async function saveMedicationAdherenceEntry(
  entry: Omit<MedicationAdherenceEntry, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO medication_adherence_entries (id, date, status, notes)
     VALUES (?, ?, ?, ?)`,
    [entry.id, entry.date, entry.status, entry.notes]
  )
}

/** Supprime une entrée d'observance */
export async function deleteMedicationAdherenceEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM medication_adherence_entries WHERE id = ?', [id])
}

// ─── Types Effets Secondaires Médicamenteux ───────────────────────────────────
//
// 6 effets secondaires couvrant les 3 classes majeures (antipsychotiques,
// thymorégulateurs, antidépresseurs) — inspiré UKU Side Effect Rating Scale
// (Lingjaerde et al., 1987).
//
// Échelle 0–3 : 0 = Absent · 1 = Léger · 2 = Modéré · 3 = Sévère
// Valeurs brutes déclarées par le patient, sans interprétation algorithmique.
// Conformité MDR 2017/745.

export interface SideEffectsEntry {
  id: string
  date: string                  // YYYY-MM-DD — une saisie par jour
  sedation: number              // 0–3
  akathisia: number             // 0–3
  tremors: number               // 0–3
  dry_mouth: number             // 0–3
  sleep_disturbance: number     // 0–3
  nausea: number                // 0–3
  notes: string | null
  created_at: string
}

// ─── SQLite Effets Secondaires ────────────────────────────────────────────────

export async function createMedicationSideEffectsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS side_effects_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      sedation INTEGER NOT NULL DEFAULT 0,
      akathisia INTEGER NOT NULL DEFAULT 0,
      tremors INTEGER NOT NULL DEFAULT 0,
      dry_mouth INTEGER NOT NULL DEFAULT 0,
      sleep_disturbance INTEGER NOT NULL DEFAULT 0,
      nausea INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Récupère l'entrée d'un jour donné, ou null */
export async function getSideEffectsEntry(date: string): Promise<SideEffectsEntry | null> {
  const database = getDb()
  return database.getFirstAsync<SideEffectsEntry>(
    'SELECT * FROM side_effects_entries WHERE date = ?',
    [date]
  )
}

/** Récupère les N dernières entrées */
export async function getAllSideEffectsEntries(limit = 30): Promise<SideEffectsEntry[]> {
  const database = getDb()
  return database.getAllAsync<SideEffectsEntry>(
    'SELECT * FROM side_effects_entries ORDER BY date DESC LIMIT ?',
    [limit]
  )
}

/** Sauvegarde (insert ou replace) une entrée */
export async function saveSideEffectsEntry(
  entry: Omit<SideEffectsEntry, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO side_effects_entries
      (id, date, sedation, akathisia, tremors, dry_mouth, sleep_disturbance, nausea, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.sedation,
      entry.akathisia,
      entry.tremors,
      entry.dry_mouth,
      entry.sleep_disturbance,
      entry.nausea,
      entry.notes,
    ]
  )
}

/** Supprime une entrée */
export async function deleteSideEffectsEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM side_effects_entries WHERE id = ?', [id])
}

// ─── Types Thermomètre de la Peur ────────────────────────────────────────────
//
// Référence : Wolpe (1969) Subjective Units of Distress Scale (SUDs).
// Protocoles : exposition graduée (Barlow 2014), PE/PTSD (Foa & Kozak 1986),
//              TOC (Foa & Franklin 2001), trouble panique (Clark 1986).
//
// Outil transversal : phobies, TOC, PTSD, dépression avec évitement, panique.
// La paire SUDs avant / après + stratégie = matière clinique pour la séance.
// Valeurs brutes 0–100, sans interprétation algorithmique — conformité MDR.

/** Stratégies de coping prédéfinies (TCC/ACT validées) */
export const COPING_STRATEGIES = [
  'Respiration lente',
  'Ancrage 5-4-3-2-1',
  'Marche / mouvement',
  'Rester dans la situation (exposition)',
  'Distraction cognitive',
  'Contact avec un proche',
] as const

export type CopingStrategy = typeof COPING_STRATEGIES[number]

/**
 * Situation déclenchante nommée par le patient.
 * Catalogue personnel réutilisable d'une saisie à l'autre.
 */
export interface FearSituation {
  id: string
  label: string       // ex : "Prendre le métro", "Parler en public"
  created_at: string
}

/**
 * Saisie SUDs : une situation + mesure avant / stratégies / mesure après.
 * Le champ `suds_after` est nullable — le patient peut remplir le "après"
 * plus tard ou ne pas le faire (signal clinique d'évitement).
 */
export interface FearEntry {
  id: string
  date: string                      // ISO 8601
  situation_id: string | null       // FK → fear_situations.id (null si texte libre)
  situation_label: string           // libellé affiché (copié au moment de la saisie)
  suds_before: number               // 0–100, brut
  strategies: string                // JSON stringifié : CopingStrategy[] + texte libre
  custom_strategy: string | null    // texte libre additionnel
  suds_after: number | null         // 0–100, brut — nullable (remplissage différé OK)
  notes: string | null
  created_at: string
}

// ─── Helpers sérialisation strategies ────────────────────────────────────────

export function serializeStrategies(strategies: CopingStrategy[], custom: string | null): string {
  return JSON.stringify({ selected: strategies, custom: custom ?? '' })
}

export function deserializeStrategies(raw: string): { selected: CopingStrategy[]; custom: string } {
  try {
    const parsed = JSON.parse(raw)
    return { selected: parsed.selected ?? [], custom: parsed.custom ?? '' }
  } catch {
    return { selected: [], custom: '' }
  }
}

// ─── SQLite Thermomètre de la Peur ────────────────────────────────────────────

export async function createFearThermometerTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fear_situations (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fear_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      situation_id TEXT,
      situation_label TEXT NOT NULL DEFAULT '',
      suds_before INTEGER NOT NULL DEFAULT 50,
      strategies TEXT NOT NULL DEFAULT '{"selected":[],"custom":""}',
      custom_strategy TEXT,
      suds_after INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// ── Situations ────────────────────────────────────────────────────────────────

export async function getAllFearSituations(): Promise<FearSituation[]> {
  const database = getDb()
  return database.getAllAsync<FearSituation>(
    'SELECT * FROM fear_situations ORDER BY created_at ASC'
  )
}

export async function saveFearSituation(situation: Omit<FearSituation, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    'INSERT OR REPLACE INTO fear_situations (id, label) VALUES (?, ?)',
    [situation.id, situation.label]
  )
}

export async function deleteFearSituation(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM fear_situations WHERE id = ?', [id])
}

// ── Saisies SUDs ──────────────────────────────────────────────────────────────

export async function getAllFearEntries(): Promise<FearEntry[]> {
  const database = getDb()
  return database.getAllAsync<FearEntry>(
    'SELECT * FROM fear_entries ORDER BY date DESC, created_at DESC'
  )
}

export async function getFearEntry(id: string): Promise<FearEntry | null> {
  const database = getDb()
  return database.getFirstAsync<FearEntry>(
    'SELECT * FROM fear_entries WHERE id = ?',
    [id]
  )
}

export async function saveFearEntry(entry: Omit<FearEntry, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO fear_entries
      (id, date, situation_id, situation_label, suds_before, strategies, custom_strategy, suds_after, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.situation_id,
      entry.situation_label,
      entry.suds_before,
      entry.strategies,
      entry.custom_strategy,
      entry.suds_after ?? null,
      entry.notes,
    ]
  )
}

export async function deleteFearEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM fear_entries WHERE id = ?', [id])
}

// ─── Types Activation Comportementale ────────────────────────────────────────
//
// Référence : Martell, Dimidjian & Herman-Dunn (2010). Behavioral Activation
// for Depression. Modèle BATD-R (Lejuez et al., 2011).
//
// Le patient planifie et évalue des activités sur deux dimensions :
//   - Plaisir (P) 0–10 : satisfaction retirée de l'activité
//   - Maîtrise (M) 0–10 : sentiment d'accomplissement
//
// Valeurs brutes saisies par le patient, sans interprétation algorithmique.
// Conformité MDR 2017/745.

export interface ActivityRecord {
  id: string
  date: string            // YYYY-MM-DD
  label: string           // Nom de l'activité (ex: "Marche 20 min")
  pleasure: number        // 0–10, brut
  mastery: number         // 0–10, brut
  done: number            // 0 = planifiée, 1 = réalisée
  notes: string | null
  created_at: string
}

// ─── SQLite Activation Comportementale ───────────────────────────────────────

export async function createBehavioralActivationTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      pleasure INTEGER NOT NULL DEFAULT 5,
      mastery INTEGER NOT NULL DEFAULT 5,
      done INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Récupère toutes les activités, de la plus récente à la plus ancienne */
export async function getAllActivityRecords(): Promise<ActivityRecord[]> {
  const database = getDb()
  return database.getAllAsync<ActivityRecord>(
    'SELECT * FROM activity_records ORDER BY date DESC, created_at DESC'
  )
}

/** Récupère une activité par son id */
export async function getActivityRecord(id: string): Promise<ActivityRecord | null> {
  const database = getDb()
  return database.getFirstAsync<ActivityRecord>(
    'SELECT * FROM activity_records WHERE id = ?',
    [id]
  )
}

/** Récupère toutes les activités d'une date donnée (YYYY-MM-DD) */
export async function getActivityRecordsForDate(date: string): Promise<ActivityRecord[]> {
  const database = getDb()
  return database.getAllAsync<ActivityRecord>(
    'SELECT * FROM activity_records WHERE date = ? ORDER BY created_at ASC',
    [date]
  )
}

/** Sauvegarde (insert ou replace) une activité */
export async function saveActivityRecord(record: Omit<ActivityRecord, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO activity_records (id, date, label, pleasure, mastery, done, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.date, record.label, record.pleasure, record.mastery, record.done, record.notes]
  )
}

/** Supprime une activité */
export async function deleteActivityRecord(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM activity_records WHERE id = ?', [id])
}

// ─── Types Sessions de Respiration ───────────────────────────────────────────
//
// Historique des sessions de respiration guidée complétées par le patient.
// Aucune donnée physiologique — le patient déclare simplement avoir complété
// un exercice à rythme fixe. Conformité MDR 2017/745.

export interface BreathingSession {
  id: string
  date: string              // YYYY-MM-DD
  technique_key: string     // clé dans BREATHING_TECHNIQUES (ex: 'coherence_cardiaque')
  duration_seconds: number  // durée effective de la session
  created_at: string
}

// ─── SQLite Sessions de Respiration ──────────────────────────────────────────

export async function createBreathingSessionsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS breathing_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      technique_key TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Enregistre une session complétée */
export async function saveBreathingSession(
  session: Omit<BreathingSession, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT INTO breathing_sessions (id, date, technique_key, duration_seconds)
     VALUES (?, ?, ?, ?)`,
    [session.id, session.date, session.technique_key, session.duration_seconds]
  )
}

/** Récupère les N dernières sessions, de la plus récente à la plus ancienne */
export async function getAllBreathingSessions(limit = 30): Promise<BreathingSession[]> {
  const database = getDb()
  return database.getAllAsync<BreathingSession>(
    'SELECT * FROM breathing_sessions ORDER BY created_at DESC LIMIT ?',
    [limit]
  )
}

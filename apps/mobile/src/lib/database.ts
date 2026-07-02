import * as SQLite from 'expo-sqlite'
import { getSyncOutboxStore } from './syncOutbox'
import { getRenderMismatchOutboxStore } from './renderMismatchOutbox'

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

  // Chaque création de table est indépendante : un échec isolé ne bloque pas les suivantes.
  const steps: Array<() => Promise<void>> = [
    () => database.execAsync(`
      CREATE TABLE IF NOT EXISTS crisis_plan_items (
        id TEXT PRIMARY KEY,
        step_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `),
    () => database.execAsync(`
      CREATE TABLE IF NOT EXISTS sleep_diary_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        in_bed_time TEXT,
        bedtime TEXT,
        wake_time TEXT,
        out_of_bed_time TEXT,
        sleep_onset_minutes INTEGER DEFAULT 0,
        awakenings INTEGER DEFAULT 0,
        awakenings_duration_minutes INTEGER DEFAULT 0,
        quality INTEGER,
        restedness INTEGER,
        nap_minutes INTEGER DEFAULT 0,
        sleep_aid INTEGER DEFAULT 0,
        nightmares INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `),
    () => createDecisionalBalanceTable(database),
    () => createBeckColumnsTable(database),
    () => createMoodTrackerTable(database),
    () => createMedicationAdherenceTable(database),
    () => createMedicationSideEffectsTable(database),
    () => createFearThermometerTables(database),
    () => createBehavioralActivationTable(database),
    () => createBreathingSessionsTable(database),
    () => createEmotionEntriesTable(database),
    () => createCognitiveSaturationTable(database),
    () => createPHQ9Table(database),
    () => createBSL23Table(database),
    () => createGAD7Table(database),
    () => createNSITable(database),
    () => createSNAPIVTable(database),
    () => createASRS6Table(database),
    () => createASRS18Table(database),
    () => createScaleEntriesTable(database),
    () => createMoodMarkersTable(database),
    () => createCustomDimensionsTable(database),
    () => createPlanItemsTable(database),
    () => createDailyEntriesTable(database),
    () => createMedicationIntakesTable(database),
    () => createFormEntriesTable(database),
    () => createTreeSelectionsTable(database),
    () => createModuleSettingsTable(database),
    () => createCrisisAnchorsTable(database),
    () => createEMRulersTable(database),
    () => createEMBalanceItemsTable(database),
    () => createEMValuesTable(database),
    () => getSyncOutboxStore(database).init(),
    () => getRenderMismatchOutboxStore(database).init(),
  ]
  for (const step of steps) {
    try { await step() } catch { /* table déjà présente ou erreur isolée — on continue */ }
  }
  // Migrations : ajouter les colonnes absentes des installations existantes
  const migrations = [
    `ALTER TABLE sleep_diary_entries ADD COLUMN nightmares INTEGER DEFAULT 0`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN awakenings_duration_minutes INTEGER DEFAULT 0`,
    // Refonte agenda du sommeil — alignement Consensus Sleep Diary (Carney 2012) :
    // horaires CSD précis (mise au lit / sortie du lit) + items psychiatrie.
    `ALTER TABLE sleep_diary_entries ADD COLUMN in_bed_time TEXT`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN out_of_bed_time TEXT`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN restedness INTEGER`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN nap_minutes INTEGER DEFAULT 0`,
    `ALTER TABLE sleep_diary_entries ADD COLUMN sleep_aid INTEGER DEFAULT 0`,
    `ALTER TABLE mood_entries ADD COLUMN pleasure INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE plan_items ADD COLUMN weight INTEGER`,
    // Repères temporels génériques : cloisonnement par module (rétro-compat mood_tracker)
    `ALTER TABLE mood_markers ADD COLUMN scale_id TEXT NOT NULL DEFAULT 'mood_tracker'`,
    // Motif déclaré sur la saisie quotidienne (medication_adherence : motif de non-prise)
    `ALTER TABLE daily_entries ADD COLUMN reason TEXT`,
    // Copie des entrées des tables dédiées vers scale_entries
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'phq9',answers,score,NULL,created_at FROM phq9_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'bsl23',answers,mean_score,NULL,created_at FROM bsl23_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'gad7',answers,score,NULL,created_at FROM gad7_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'snap_iv',answers,total_score,subscale_scores,created_at FROM snapiv_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'asrs6',answers,total_score,NULL,created_at FROM asrs6_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'asrs18',answers,total_score,sub_scores,created_at FROM asrs18_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'rcads',answers,total_score,subscale_scores,created_at FROM rcads25_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'medication_side_effects',json_array(sedation,akathisia,tremors,dry_mouth,sleep_disturbance,nausea),(sedation+akathisia+tremors+dry_mouth+sleep_disturbance+nausea),json_object('sedation',sedation,'akathisia',akathisia,'tremors',tremors,'dry_mouth',dry_mouth,'sleep',sleep_disturbance,'nausea',nausea),created_at FROM side_effects_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'nsi',answers,score,json_object('pct_recurrent',COALESCE(recurrent_pct,0),'theme_1',COALESCE(json_extract(themes,'$[0]'),''),'theme_2',COALESCE(json_extract(themes,'$[1]'),''),'theme_3',COALESCE(json_extract(themes,'$[2]'),'')),created_at FROM nsi_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'epds',answers,score,NULL,created_at FROM epds_entries`,
    `INSERT OR IGNORE INTO scale_entries (id,scale_id,answers,total_score,subscale_scores,created_at) SELECT id,'mood_tracker',json_array(mood,energy,anxiety,pleasure),ROUND(CAST(mood+energy+anxiety+pleasure AS REAL)/4),json_object('mood',mood,'energy',energy,'anxiety',anxiety,'pleasure',pleasure),created_at FROM mood_entries`,
    `INSERT OR IGNORE INTO plan_items (id,module_id,section_id,text,sort_order,created_at) SELECT id,'crisis_plan',CASE step_number WHEN 1 THEN 'step_1' WHEN 2 THEN 'step_2' WHEN 3 THEN 'step_3' WHEN 4 THEN 'step_4' WHEN 5 THEN 'step_5' WHEN 6 THEN 'step_6' ELSE 'step_1' END,content,position,COALESCE(created_at,CURRENT_TIMESTAMP) FROM crisis_plan_items`,
    // medication_adherence_entries → daily_entries
    `INSERT OR IGNORE INTO daily_entries (id,module_id,date,status,notes,created_at) SELECT id,'medication_adherence',date,status,notes,COALESCE(created_at,CURRENT_TIMESTAMP) FROM medication_adherence_entries`,
    // beck_thought_records → form_entries
    `INSERT OR IGNORE INTO form_entries (id,module_id,"values",created_at) SELECT id,'beck_columns',json_object('situation',situation,'emotion',emotion,'emotion_intensity',emotion_intensity,'automatic_thought',automatic_thought,'thought_belief',thought_belief,'rational_response',rational_response,'outcome_emotion',outcome_emotion,'outcome_intensity',outcome_intensity,'outcome_belief',outcome_belief),COALESCE(created_at,CURRENT_TIMESTAMP) FROM beck_thought_records`,
    // emotion_entries → tree_selections (labels conservés directement dans path_json)
    `INSERT OR IGNORE INTO tree_selections (id,module_id,selected_id,selected_label,path_json,intensity,notes,created_at) SELECT id,'emotion_wheel',specific_key,specific_label,json_array(json_object('id',primary_key,'label',primary_label),json_object('id',secondary_key,'label',secondary_label),json_object('id',specific_key,'label',specific_label)),intensity,notes,COALESCE(created_at,CURRENT_TIMESTAMP) FROM emotion_entries`,
    // Tag de contexte (refonte roue des émotions) : domaines déclarés, JSON array
    `ALTER TABLE tree_selections ADD COLUMN context_json TEXT`,
    // decisional_balance → plan_items (4 quadrants × N args avec weight) + module_settings (target_behavior)
    `INSERT OR IGNORE INTO plan_items (id,module_id,section_id,text,sort_order,weight,created_at) SELECT json_extract(arg.value,'$.id'),'decisional_balance','pros_change',json_extract(arg.value,'$.text'),arg.key,json_extract(arg.value,'$.weight'),COALESCE(decisional_balance.updated_at,CURRENT_TIMESTAMP) FROM decisional_balance, json_each(decisional_balance.pros_change) AS arg`,
    `INSERT OR IGNORE INTO plan_items (id,module_id,section_id,text,sort_order,weight,created_at) SELECT json_extract(arg.value,'$.id'),'decisional_balance','cons_change',json_extract(arg.value,'$.text'),arg.key,json_extract(arg.value,'$.weight'),COALESCE(decisional_balance.updated_at,CURRENT_TIMESTAMP) FROM decisional_balance, json_each(decisional_balance.cons_change) AS arg`,
    `INSERT OR IGNORE INTO plan_items (id,module_id,section_id,text,sort_order,weight,created_at) SELECT json_extract(arg.value,'$.id'),'decisional_balance','pros_status_quo',json_extract(arg.value,'$.text'),arg.key,json_extract(arg.value,'$.weight'),COALESCE(decisional_balance.updated_at,CURRENT_TIMESTAMP) FROM decisional_balance, json_each(decisional_balance.pros_status_quo) AS arg`,
    `INSERT OR IGNORE INTO plan_items (id,module_id,section_id,text,sort_order,weight,created_at) SELECT json_extract(arg.value,'$.id'),'decisional_balance','cons_status_quo',json_extract(arg.value,'$.text'),arg.key,json_extract(arg.value,'$.weight'),COALESCE(decisional_balance.updated_at,CURRENT_TIMESTAMP) FROM decisional_balance, json_each(decisional_balance.cons_status_quo) AS arg`,
    `INSERT OR IGNORE INTO module_settings (module_id,key,value,updated_at) SELECT 'decisional_balance','target_behavior',target_behavior,COALESCE(updated_at,CURRENT_TIMESTAMP) FROM decisional_balance WHERE target_behavior <> ''`,
  ]
  for (const sql of migrations) {
    try { await database.execAsync(sql) } catch { /* colonne déjà présente ou table absente */ }
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
  in_bed_time: string | null            // HH:MM — heure de mise au lit (CSD)
  bedtime: string | null                // HH:MM — heure d'essai de dormir (lumières éteintes, CSD)
  wake_time: string | null              // HH:MM — heure du dernier réveil (CSD)
  out_of_bed_time: string | null        // HH:MM — heure de sortie du lit (CSD)
  sleep_onset_minutes: number           // temps pour s'endormir (SOL, minutes)
  awakenings: number                    // nombre de réveils nocturnes
  awakenings_duration_minutes: number   // durée totale des réveils (WASO, minutes)
  quality: number | null                // qualité subjective 1 à 5
  restedness: number | null             // ressenti au réveil 1 à 5 (CSD étendu)
  nap_minutes: number                   // durée totale des siestes diurnes (minutes)
  sleep_aid: number                     // aide au sommeil prise : 0 = non, 1 = oui
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
      (id, date, in_bed_time, bedtime, wake_time, out_of_bed_time, sleep_onset_minutes,
       awakenings, awakenings_duration_minutes, quality, restedness, nap_minutes,
       sleep_aid, nightmares, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.in_bed_time,
      entry.bedtime,
      entry.wake_time,
      entry.out_of_bed_time,
      entry.sleep_onset_minutes,
      entry.awakenings,
      entry.awakenings_duration_minutes,
      entry.quality,
      entry.restedness,
      entry.nap_minutes,
      entry.sleep_aid,
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
 * Durée en minutes entre deux horaires HH:MM, en gérant le passage à minuit.
 * Retourne une valeur dans [0, 1440[. `null` si un horaire est mal formé.
 */
export function minutesBetween(start: string, end: string): number | null {
  const [sH, sM] = start.split(':').map(Number)
  const [eH, eM] = end.split(':').map(Number)
  if ([sH, sM, eH, eM].some(n => Number.isNaN(n))) return null
  const raw = eH * 60 + eM - (sH * 60 + sM)
  return raw < 0 ? raw + 24 * 60 : raw
}

/**
 * Calcule l'Efficacité du Sommeil (SE) en pourcentage, aligné Consensus Sleep
 * Diary (Carney 2012).
 *
 *   Fenêtre de sommeil = dernier réveil (`wakeTime`) − essai de dormir (`bedtime`)
 *   Temps de Sommeil Total (TST) = fenêtre − latence (SOL) − durée des réveils (WASO)
 *   Temps Passé au Lit (TPL) = sortie du lit (`outOfBedTime`) − mise au lit (`inBedTime`)
 *     si fournis, sinon la fenêtre de sommeil (rétro-compatibilité ancien modèle).
 *   SE (%) = (TST / TPL) × 100
 *
 * Seuils (interprétation praticien) : ≥ 85 % = bon | ≥ 70 % = moyen | < 70 % = insuffisant.
 * Retourne null si les données sont insuffisantes (horaires manquants ou TPL ≤ 0).
 */
export function computeSleepEfficiency(
  bedtime: string,
  wakeTime: string,
  onsetMinutes = 0,
  awakeningsDurationMinutes = 0,
  inBedTime?: string | null,
  outOfBedTime?: string | null,
): number | null {
  const sleepWindow = minutesBetween(bedtime, wakeTime)
  // Horaires identiques ou mal formés = données invalides
  if (sleepWindow === null || sleepWindow === 0) return null

  const tib = inBedTime && outOfBedTime ? minutesBetween(inBedTime, outOfBedTime) : sleepWindow
  if (tib === null || tib <= 0) return null

  const tst = sleepWindow - onsetMinutes - awakeningsDurationMinutes
  const se = Math.round((Math.max(0, tst) / tib) * 100)
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

// ─── Effacement RGPD local (#27) ─────────────────────────────────────────────
// Toutes les tables SQLite contenant des données patient, + la file de sync.
// Doit rester synchronisée avec les CREATE TABLE de ce fichier (un nouveau module
// = ajouter sa table ici, sinon l'effacement laisserait des données résiduelles).
const PATIENT_DATA_TABLES = [
  'activity_records', 'asrs18_entries', 'asrs6_entries', 'beck_thought_records',
  'breathing_sessions', 'bsl23_entries', 'cognitive_saturation_sessions',
  'crisis_anchors', 'crisis_plan_items', 'custom_dimensions', 'daily_entries',
  'decisional_balance', 'em_balance_items', 'em_rulers', 'em_values',
  'emotion_entries', 'exposure_hierarchies', 'fear_entries', 'fear_situations',
  'form_entries', 'gad7_entries', 'medication_adherence_entries', 'medication_intakes', 'module_settings',
  'mood_entries', 'mood_markers', 'nsi_entries', 'phq9_entries', 'plan_items',
  'scale_entries', 'side_effects_entries', 'sleep_diary_entries', 'snapiv_entries',
  'sync_outbox', 'tree_selections',
] as const

/**
 * Efface TOUTES les données patient stockées localement en SQLite (droit à l'oubli,
 * RGPD art. 17). Vide chaque table connue dans une transaction. La table peut être
 * absente sur une vieille installation → l'erreur est ignorée table par table.
 * La purge du serveur passe ailleurs (RPC + Edge Function) — cette fonction ne
 * touche que le stockage local de l'appareil.
 */
export async function purgeAllLocalData(): Promise<void> {
  const database = getDb()
  for (const table of PATIENT_DATA_TABLES) {
    try {
      await database.execAsync(`DELETE FROM ${table};`)
    } catch {
      /* table absente sur cette installation — rien à purger */
    }
  }
}

// ─── Table legacy decisional_balance ─────────────────────────────────────────
// Conservée comme source de migration : les anciennes installations ont leurs
// arguments stockés en JSON dans cette table monoligne. La migration au boot
// (cf. plus haut) les déplie vers plan_items + module_settings via json_each.
// Le module utilise désormais le moteur générique (preview_kind decision_grid).

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

// ─── SQLite Colonnes de Beck ──────────────────────────────────────────────────
// kept for migration source — données copiées vers form_entries lors du boot.

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

// ─── mood_entries — table source conservée pour migration unique vers scale_entries ──

async function createMoodTrackerTable(database: SQLite.SQLiteDatabase): Promise<void> {
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

// ─── SQLite Observance Médicamenteuse ─────────────────────────────────────────
// kept for migration source — données copiées vers daily_entries lors du boot.

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
  label: string                 // ex : "Prendre le métro", "Parler en public"
  hierarchy_id: string | null   // FK exposure_hierarchies.id ou null = catalogue global
  target_suds: number | null    // SUDs initial estimé (0-100) — optionnel pour fear_thermometer
  is_done: number               // 0/1 — coche neutre du patient (mode hiérarchie)
  created_at: string
}

/**
 * Hiérarchie d'exposition — groupe de situations partageant un même thème
 * (ex. « phobie sociale », « agoraphobie »). Multi-hiérarchies activé par
 * exposure_tracker_config.enable_hierarchies = '1'.
 */
export interface ExposureHierarchy {
  id: string
  module_id: string
  title: string
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
  suds_before: number               // 0–100, brut — angoisse anticipée / au début
  suds_peak: number | null          // 0–100, brut — pic d'angoisse PENDANT (nullable, hérité)
  strategies: string                // JSON stringifié : CopingStrategy[] + texte libre
  custom_strategy: string | null    // texte libre additionnel
  suds_after: number | null         // 0–100, brut — angoisse finale, nullable (remplissage différé OK)
  expectation_text: string | null   // « ce que je redoute » (texte libre, AVANT)
  outcome_text: string | null       // « ce qui s'est passé » (texte libre, APRÈS)
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

// ─── SQLite Thermomètre de la Peur + Hiérarchies d'exposition ────────────────
//
// Modèle :
//  - exposure_hierarchies : groupes de situations propres à un module
//    (multi-hiérarchies par patient — ex. « phobie sociale » et
//    « agoraphobie »). Optionnel : si vide, le layout retombe sur un
//    catalogue global (compatibilité fear_thermometer).
//  - fear_situations.hierarchy_id : nullable — null = catalogue global.
//
// Migration idempotente : on ajoute la colonne hierarchy_id à l'ancien
// schéma sans casser les données existantes.

export async function createFearThermometerTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS exposure_hierarchies (
      id         TEXT PRIMARY KEY,
      module_id  TEXT NOT NULL,
      title      TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_exposure_hierarchies_module
      ON exposure_hierarchies(module_id, created_at DESC);
  `)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fear_situations (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      hierarchy_id TEXT,
      target_suds INTEGER,
      is_done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  // Idempotent migrations — ajouter colonnes si absentes (anciennes BDDs)
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(fear_situations)'
  )
  const colNames = new Set(cols.map(c => c.name))
  if (!colNames.has('hierarchy_id')) {
    await database.execAsync('ALTER TABLE fear_situations ADD COLUMN hierarchy_id TEXT')
  }
  if (!colNames.has('target_suds')) {
    await database.execAsync('ALTER TABLE fear_situations ADD COLUMN target_suds INTEGER')
  }
  if (!colNames.has('is_done')) {
    await database.execAsync('ALTER TABLE fear_situations ADD COLUMN is_done INTEGER DEFAULT 0')
  }
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fear_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      situation_id TEXT,
      situation_label TEXT NOT NULL DEFAULT '',
      suds_before INTEGER NOT NULL DEFAULT 50,
      suds_peak INTEGER,
      strategies TEXT NOT NULL DEFAULT '{"selected":[],"custom":""}',
      custom_strategy TEXT,
      suds_after INTEGER,
      expectation_text TEXT,
      outcome_text TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  // Idempotent migrations — colonnes enrichies (parcours d'exposition unifié).
  // Anciennes BDDs créées avant la refonte : ajout sans perte de données.
  const entryCols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(fear_entries)'
  )
  const entryColNames = new Set(entryCols.map(c => c.name))
  if (!entryColNames.has('suds_peak')) {
    await database.execAsync('ALTER TABLE fear_entries ADD COLUMN suds_peak INTEGER')
  }
  if (!entryColNames.has('expectation_text')) {
    await database.execAsync('ALTER TABLE fear_entries ADD COLUMN expectation_text TEXT')
  }
  if (!entryColNames.has('outcome_text')) {
    await database.execAsync('ALTER TABLE fear_entries ADD COLUMN outcome_text TEXT')
  }
}

// ── Situations ────────────────────────────────────────────────────────────────

export async function getAllFearSituations(hierarchyId?: string | null): Promise<FearSituation[]> {
  const database = getDb()
  if (hierarchyId === undefined) {
    return database.getAllAsync<FearSituation>(
      'SELECT * FROM fear_situations ORDER BY target_suds ASC, created_at ASC'
    )
  }
  if (hierarchyId === null) {
    return database.getAllAsync<FearSituation>(
      'SELECT * FROM fear_situations WHERE hierarchy_id IS NULL ORDER BY target_suds ASC, created_at ASC'
    )
  }
  return database.getAllAsync<FearSituation>(
    'SELECT * FROM fear_situations WHERE hierarchy_id = ? ORDER BY target_suds ASC, created_at ASC',
    [hierarchyId]
  )
}

export async function saveFearSituation(
  situation: Omit<FearSituation, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO fear_situations
       (id, label, hierarchy_id, target_suds, is_done)
     VALUES (?, ?, ?, ?, ?)`,
    [
      situation.id,
      situation.label,
      situation.hierarchy_id,
      situation.target_suds,
      situation.is_done,
    ]
  )
}

export async function deleteFearSituation(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM fear_situations WHERE id = ?', [id])
}

// ── Hiérarchies d'exposition ─────────────────────────────────────────────────

export async function listExposureHierarchies(moduleId: string): Promise<ExposureHierarchy[]> {
  const database = getDb()
  return database.getAllAsync<ExposureHierarchy>(
    'SELECT * FROM exposure_hierarchies WHERE module_id = ? ORDER BY created_at ASC',
    [moduleId]
  )
}

export async function createExposureHierarchy(
  hierarchy: Omit<ExposureHierarchy, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    'INSERT OR REPLACE INTO exposure_hierarchies (id, module_id, title) VALUES (?, ?, ?)',
    [hierarchy.id, hierarchy.module_id, hierarchy.title]
  )
}

export async function deleteExposureHierarchy(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM exposure_hierarchies WHERE id = ?', [id])
  // Cascade : situations rattachées à cette hiérarchie sont également supprimées
  await database.runAsync('DELETE FROM fear_situations WHERE hierarchy_id = ?', [id])
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
      (id, date, situation_id, situation_label, suds_before, suds_peak, strategies, custom_strategy, suds_after, expectation_text, outcome_text, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.situation_id,
      entry.situation_label,
      entry.suds_before,
      entry.suds_peak ?? null,
      entry.strategies,
      entry.custom_strategy,
      entry.suds_after ?? null,
      entry.expectation_text ?? null,
      entry.outcome_text ?? null,
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
  date: string                       // YYYY-MM-DD — date métier de l'activité
  label: string                      // Nom de l'activité (ex: "Marche 20 min")
  expected_pleasure: number | null   // 0–10 attendu (prédiction), null = non renseigné
  expected_mastery: number | null    // 0–10 attendu, null = non renseigné
  pleasure: number | null            // 0–10 ressenti (après réalisation), null = non renseigné
  mastery: number | null             // 0–10 ressenti, null = non renseigné
  done: number                       // 0 = planifiée, 1 = réalisée
  notes: string | null
  planned_time: string | null        // HH:MM — heure prévue (préparation rappels)
  domain_id: string | null           // domaine de vie (field activity_log_domain)
  config_activity_id: string | null  // activité co-construite (config.ba_activities)
  created_at: string
}

// ─── SQLite Activation Comportementale ───────────────────────────────────────

// Migration v2 (refonte prédire/faire/constater) : P/M deviennent nullables et se
// dédoublent en attendus/ressentis. SQLite ne sait pas retirer un NOT NULL →
// rebuild de table avec mapping legacy : planifiée → P/M lus comme attendus,
// réalisée → P/M conservés en ressentis.
export const ACTIVITY_RECORDS_SCHEMA_V2 = `
    CREATE TABLE IF NOT EXISTS activity_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      expected_pleasure INTEGER,
      expected_mastery INTEGER,
      pleasure INTEGER,
      mastery INTEGER,
      done INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      planned_time TEXT,
      domain_id TEXT,
      config_activity_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`

export const ACTIVITY_RECORDS_REBUILD_STATEMENTS = [
  ACTIVITY_RECORDS_SCHEMA_V2.replace('activity_records', 'activity_records_v2'),
  `INSERT INTO activity_records_v2
     (id, date, label, expected_pleasure, expected_mastery, pleasure, mastery,
      done, notes, planned_time, domain_id, config_activity_id, created_at)
   SELECT id, date, label,
     CASE WHEN done = 0 THEN pleasure ELSE NULL END,
     CASE WHEN done = 0 THEN mastery ELSE NULL END,
     CASE WHEN done = 1 THEN pleasure ELSE NULL END,
     CASE WHEN done = 1 THEN mastery ELSE NULL END,
     done, notes, NULL, NULL, NULL, created_at
   FROM activity_records`,
  `DROP TABLE activity_records`,
  `ALTER TABLE activity_records_v2 RENAME TO activity_records`,
] as const

/** Le rebuild v2 est requis si la table existe encore au schéma v1 (sans expected_pleasure). */
export function needsActivityRecordsRebuild(columns: readonly { name: string }[]): boolean {
  return columns.length > 0 && !columns.some(c => c.name === 'expected_pleasure')
}

export async function createBehavioralActivationTable(database: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(activity_records)`
  )
  if (needsActivityRecordsRebuild(columns)) {
    for (const sql of ACTIVITY_RECORDS_REBUILD_STATEMENTS) {
      await database.execAsync(sql)
    }
    return
  }
  await database.execAsync(ACTIVITY_RECORDS_SCHEMA_V2)
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
    `INSERT OR REPLACE INTO activity_records
       (id, date, label, expected_pleasure, expected_mastery, pleasure, mastery,
        done, notes, planned_time, domain_id, config_activity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id, record.date, record.label,
      record.expected_pleasure, record.expected_mastery, record.pleasure, record.mastery,
      record.done, record.notes, record.planned_time, record.domain_id, record.config_activity_id,
    ]
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
  technique_key: string     // field_props.technique_key d'une technique (ex: 'coherence_cardiaque')
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

// ─── Types Roue des Émotions ──────────────────────────────────────────────────
//
// Entrée journalisée : émotion primaire + secondaire + spécifique + intensité brute.
// Valeurs brutes déclarées par le patient, sans label interprétatif (conformité MDR 2017/745).

export interface EmotionEntry {
  id: string
  created_at: string           // ISO 8601 — horodatage complet
  primary_key: string          // clé émotion primaire (ex: 'joy')
  primary_label: string        // libellé copié au moment de la saisie
  secondary_key: string        // clé émotion secondaire
  secondary_label: string
  specific_key: string         // clé émotion spécifique
  specific_label: string
  intensity: number            // 1–10, brut, sans interprétation
  notes: string | null
}

// ─── SQLite Roue des Émotions ─────────────────────────────────────────────────

export async function createEmotionEntriesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS emotion_entries (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      primary_key TEXT NOT NULL,
      primary_label TEXT NOT NULL,
      secondary_key TEXT NOT NULL,
      secondary_label TEXT NOT NULL,
      specific_key TEXT NOT NULL,
      specific_label TEXT NOT NULL,
      intensity INTEGER NOT NULL,
      notes TEXT
    );
  `)
}

/** Enregistre une nouvelle entrée d'émotion */
export async function saveEmotionEntry(
  entry: Omit<EmotionEntry, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT INTO emotion_entries
       (id, primary_key, primary_label, secondary_key, secondary_label,
        specific_key, specific_label, intensity, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.primary_key,
      entry.primary_label,
      entry.secondary_key,
      entry.secondary_label,
      entry.specific_key,
      entry.specific_label,
      entry.intensity,
      entry.notes,
    ]
  )
}

/** Récupère les N dernières entrées, de la plus récente à la plus ancienne */
export async function getAllEmotionEntries(limit = 50): Promise<EmotionEntry[]> {
  const database = getDb()
  return database.getAllAsync<EmotionEntry>(
    'SELECT * FROM emotion_entries ORDER BY created_at DESC LIMIT ?',
    [limit]
  )
}

/** Supprime une entrée d'émotion */
export async function deleteEmotionEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM emotion_entries WHERE id = ?', [id])
}

/** Récupère toutes les entrées d'un mois donné (format YYYY-MM) */
export async function getEmotionEntriesForMonth(yearMonth: string): Promise<EmotionEntry[]> {
  const database = getDb()
  return database.getAllAsync<EmotionEntry>(
    `SELECT * FROM emotion_entries WHERE created_at LIKE ? ORDER BY created_at ASC`,
    [`${yearMonth}%`]
  )
}

// ─── Types Saturation Cognitive ───────────────────────────────────────────────
//
// Technique de saturation sémantique (Hayes et al., 1999 — ACT, défusion cognitive).
// Le patient répète un mot/pensée rapidement jusqu'à ce qu'il perde sa charge
// émotionnelle. Aucun score interprété — conformité MDR 2017/745.

export interface CognitiveSaturationSession {
  id: string
  word: string            // mot ou courte pensée travaillée (max 40 chars)
  repetitions: number     // nombre de tapotements enregistrés
  duration_seconds: number // durée effective de l'exercice
  created_at: string
}

// ─── SQLite Saturation Cognitive ─────────────────────────────────────────────

export async function createCognitiveSaturationTable(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cognitive_saturation_sessions (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      repetitions INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

/** Enregistre une session terminée */
export async function saveCognitiveSaturationSession(
  session: Omit<CognitiveSaturationSession, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT INTO cognitive_saturation_sessions (id, word, repetitions, duration_seconds)
     VALUES (?, ?, ?, ?)`,
    [session.id, session.word, session.repetitions, session.duration_seconds]
  )
}

/** Récupère les N dernières sessions, de la plus récente à la plus ancienne */
export async function getAllCognitiveSaturationSessions(
  limit = 30
): Promise<CognitiveSaturationSession[]> {
  const database = getDb()
  return database.getAllAsync<CognitiveSaturationSession>(
    'SELECT * FROM cognitive_saturation_sessions ORDER BY created_at DESC LIMIT ?',
    [limit]
  )
}

/** Supprime une session */
export async function deleteCognitiveSaturationSession(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync(
    'DELETE FROM cognitive_saturation_sessions WHERE id = ?',
    [id]
  )
}

// ─── PHQ-9 / BSL-23 / GAD-7 legacy tables (migration source only) ─────────────

async function createPHQ9Table(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS phq9_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

async function createBSL23Table(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS bsl23_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      mean_score REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

async function createGAD7Table(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS gad7_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// ─── NSI — table source conservée pour migration unique vers scale_entries ────

async function createNSITable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS nsi_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      recurrent_pct INTEGER,
      themes TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// ─── SNAP-IV / ASRS-6 / ASRS-18 legacy tables (migration source only) ─────────

async function createSNAPIVTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS snapiv_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      subscale_scores TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

async function createASRS6Table(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS asrs6_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

async function createASRS18Table(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS asrs18_entries (
      id TEXT PRIMARY KEY,
      answers TEXT NOT NULL,
      sub_scores TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// ─── plan_items — table générique pour les plans éditables (crisis_plan…) ────

export interface PlanItem {
  id: string
  module_id: string
  section_id: string
  text: string
  sort_order: number
  /** Poids optionnel (1..N selon le layout). null pour les modules qui n'utilisent pas de pondération (ex. crisis_plan). */
  weight: number | null
  created_at: string
}

async function createPlanItemsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS plan_items (
      id         TEXT PRIMARY KEY,
      module_id  TEXT NOT NULL,
      section_id TEXT NOT NULL,
      text       TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      weight     INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_plan_items_module ON plan_items(module_id, section_id);
  `)
}

export async function getAllPlanItemsForModule(moduleId: string): Promise<PlanItem[]> {
  const database = getDb()
  await createPlanItemsTable(database).catch(() => {})
  return database.getAllAsync<PlanItem>(
    'SELECT * FROM plan_items WHERE module_id = ? ORDER BY section_id ASC, sort_order ASC, created_at ASC',
    [moduleId]
  )
}

export async function savePlanItem(item: Omit<PlanItem, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO plan_items (id, module_id, section_id, text, sort_order, weight) VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.module_id, item.section_id, item.text, item.sort_order, item.weight ?? null]
  )
}

export async function deletePlanItem(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM plan_items WHERE id = ?', [id])
}

// ─── module_settings — table générique pour les single-doc fields ────────────
// Stocke des paires clé/valeur scopées par module_id (ex. target_behavior d'une
// balance décisionnelle, etc.). Une seule valeur par (module_id, key).

async function createModuleSettingsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS module_settings (
      module_id  TEXT NOT NULL,
      key        TEXT NOT NULL,
      value      TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (module_id, key)
    );
  `)
}

export async function getModuleSetting(moduleId: string, key: string): Promise<string | null> {
  const database = getDb()
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM module_settings WHERE module_id = ? AND key = ?',
    [moduleId, key]
  )
  return row?.value ?? null
}

export async function setModuleSetting(moduleId: string, key: string, value: string): Promise<void> {
  const database = getDb()
  await createModuleSettingsTable(database).catch(() => {})
  await database.runAsync(
    `INSERT INTO module_settings (module_id, key, value, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(module_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [moduleId, key, value]
  )
}

// ─── crisis_anchors — photos et phrase d'ancrage du plan de crise ────────────
// URIs locaux (expo-file-system) + phrase libre. Max 3 photos par patient.

async function createCrisisAnchorsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS crisis_anchors (
      id         TEXT PRIMARY KEY,
      uri        TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export interface CrisisAnchor {
  id: string
  uri: string
  sort_order: number
  created_at: string
}

export async function getCrisisAnchors(): Promise<CrisisAnchor[]> {
  const database = getDb()
  return database.getAllAsync<CrisisAnchor>(
    'SELECT * FROM crisis_anchors ORDER BY sort_order ASC, created_at ASC'
  )
}

export async function saveCrisisAnchor(anchor: Omit<CrisisAnchor, 'created_at'>): Promise<void> {
  const database = getDb()
  await createCrisisAnchorsTable(database).catch(() => {})
  await database.runAsync(
    `INSERT OR REPLACE INTO crisis_anchors (id, uri, sort_order) VALUES (?, ?, ?)`,
    [anchor.id, anchor.uri, anchor.sort_order]
  )
}

export async function deleteCrisisAnchor(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM crisis_anchors WHERE id = ?', [id])
}

// ─── scale_entries — table générique pour tous les questionnaires cliniques ───

export async function createScaleEntriesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS scale_entries (
      id TEXT PRIMARY KEY,
      scale_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      total_score REAL NOT NULL,
      subscale_scores TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_scale_entries_scale_id ON scale_entries(scale_id);
  `)
}

export interface ScaleEntry {
  id: string
  scale_id: string
  answers: number[]
  total_score: number
  subscale_scores: Record<string, number | string> | null
  created_at: string
}

export async function getAllScaleEntries(scaleId: string): Promise<ScaleEntry[]> {
  const database = getDb()
  const rows = await database.getAllAsync<{
    id: string
    scale_id: string
    answers: string
    total_score: number
    subscale_scores: string | null
    created_at: string
  }>('SELECT * FROM scale_entries WHERE scale_id = ? ORDER BY created_at DESC', [scaleId])
  return rows.map(r => ({
    ...r,
    answers: JSON.parse(r.answers) as number[],
    subscale_scores: r.subscale_scores ? JSON.parse(r.subscale_scores) as Record<string, number | string> : null,
  }))
}

export async function getScaleEntryById(id: string): Promise<ScaleEntry | null> {
  const database = getDb()
  const row = await database.getFirstAsync<{
    id: string
    scale_id: string
    answers: string
    total_score: number
    subscale_scores: string | null
    created_at: string
  }>('SELECT * FROM scale_entries WHERE id = ?', [id])
  if (!row) return null
  return {
    ...row,
    answers: JSON.parse(row.answers) as number[],
    subscale_scores: row.subscale_scores ? JSON.parse(row.subscale_scores) as Record<string, number | string> : null,
  }
}

export async function getLatestScaleEntry(scaleId: string): Promise<ScaleEntry | null> {
  const database = getDb()
  const row = await database.getFirstAsync<{
    id: string; scale_id: string; answers: string
    total_score: number; subscale_scores: string | null; created_at: string
  }>('SELECT * FROM scale_entries WHERE scale_id = ? ORDER BY created_at DESC LIMIT 1', [scaleId])
  if (!row) return null
  return {
    ...row,
    answers: JSON.parse(row.answers) as number[],
    subscale_scores: row.subscale_scores ? JSON.parse(row.subscale_scores) as Record<string, number | string> : null,
  }
}

export async function saveScaleEntry(entry: ScaleEntry): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO scale_entries (id, scale_id, answers, total_score, subscale_scores, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.scale_id,
      JSON.stringify(entry.answers),
      entry.total_score,
      entry.subscale_scores ? JSON.stringify(entry.subscale_scores) : null,
      entry.created_at,
    ]
  )
}

export async function deleteScaleEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM scale_entries WHERE id = ?', [id])
}

// ─── mood_markers — repères temporels génériques (Life Chart Method) ──────────
// Contexte saisi par le patient (« début lithium », « passage à 150 mg »…) affiché
// comme trait vertical sur les courbes. Données brutes, aucune interprétation (MDR).
// Table partagée par tous les modules « tracker multi-dimensions » : la colonne
// `scale_id` cloisonne les repères par module (mood_tracker, medication_side_effects…).

export async function createMoodMarkersTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS mood_markers (
      id TEXT PRIMARY KEY,
      scale_id TEXT NOT NULL DEFAULT 'mood_tracker',
      date TEXT NOT NULL,
      label TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_mood_markers_date ON mood_markers(date);
    CREATE INDEX IF NOT EXISTS idx_mood_markers_scale_id ON mood_markers(scale_id);
  `)
}

export interface TimelineMarker {
  id: string
  scale_id: string
  date: string   // YYYY-MM-DD
  label: string
  created_at: string
}

export async function getAllTimelineMarkers(scaleId: string): Promise<TimelineMarker[]> {
  const database = getDb()
  return database.getAllAsync<TimelineMarker>(
    'SELECT * FROM mood_markers WHERE scale_id = ? ORDER BY date DESC',
    [scaleId]
  )
}

export async function saveTimelineMarker(marker: TimelineMarker): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO mood_markers (id, scale_id, date, label, created_at) VALUES (?, ?, ?, ?, ?)`,
    [marker.id, marker.scale_id, marker.date, marker.label, marker.created_at]
  )
}

export async function deleteTimelineMarker(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM mood_markers WHERE id = ?', [id])
}

// ─── Alias rétro-compatibles (mood_tracker) — délèguent au CRUD générique ─────
// MoodTrackerScreen reste inchangé tant qu'il n'est pas migré vers le composant
// générique : il manipule des MoodMarker sans scale_id, ajouté ici à 'mood_tracker'.
export interface MoodMarker {
  id: string
  date: string   // YYYY-MM-DD
  label: string
  created_at: string
}

export function getAllMoodMarkers(): Promise<MoodMarker[]> {
  return getAllTimelineMarkers('mood_tracker')
}

export function saveMoodMarker(marker: MoodMarker): Promise<void> {
  return saveTimelineMarker({ ...marker, scale_id: 'mood_tracker' })
}

export function deleteMoodMarker(id: string): Promise<void> {
  return deleteTimelineMarker(id)
}

// ─── custom_dimensions — dimensions personnalisées ajoutées par le patient ────
// Pour les modules tracker permettant l'ajout d'axes libres (ex. effets
// indésirables plus rares non listés). Le libellé est une donnée patient (texte
// libre, hors i18n) ; la couleur est décorative (aucun jugement clinique — MDR).

export async function createCustomDimensionsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS custom_dimensions (
      id TEXT PRIMARY KEY,
      scale_id TEXT NOT NULL,
      dim_key TEXT NOT NULL,
      label TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_custom_dimensions_scale_id ON custom_dimensions(scale_id);
  `)
}

export interface CustomDimension {
  id: string
  scale_id: string
  dim_key: string
  label: string
  color: string
  sort_order: number
  created_at: string
}

export async function getCustomDimensions(scaleId: string): Promise<CustomDimension[]> {
  const database = getDb()
  return database.getAllAsync<CustomDimension>(
    'SELECT * FROM custom_dimensions WHERE scale_id = ? ORDER BY sort_order ASC, created_at ASC',
    [scaleId]
  )
}

export async function saveCustomDimension(dim: CustomDimension): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO custom_dimensions (id, scale_id, dim_key, label, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [dim.id, dim.scale_id, dim.dim_key, dim.label, dim.color, dim.sort_order, dim.created_at]
  )
}

export async function deleteCustomDimension(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM custom_dimensions WHERE id = ?', [id])
}

// ─── daily_entries — table générique pour les saisies quotidiennes ───────────
// Pattern : 1 entrée par (module_id, date) — UPSERT sur la contrainte UNIQUE.
// Utilisée par les layouts daily_checkin (medication_adherence et autres modules
// futurs partageant la sémantique « 1 statut par jour »).

export async function createDailyEntriesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_entries (
      id         TEXT PRIMARY KEY,
      module_id  TEXT NOT NULL,
      date       TEXT NOT NULL,
      status     TEXT,
      reason     TEXT,
      notes      TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(module_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_daily_entries_module_date
      ON daily_entries(module_id, date);
  `)
}

export interface DailyEntry {
  id: string
  module_id: string
  date: string
  status: string | null
  reason: string | null   // motif déclaré (ex. non-prise : 'forgot' | 'side_effect' | …) — fait brut, jamais interprété
  notes: string | null
  created_at: string
}

export async function getDailyEntry(moduleId: string, date: string): Promise<DailyEntry | null> {
  const database = getDb()
  return database.getFirstAsync<DailyEntry>(
    'SELECT * FROM daily_entries WHERE module_id = ? AND date = ?',
    [moduleId, date]
  )
}

export async function getAllDailyEntries(moduleId: string, limit = 30): Promise<DailyEntry[]> {
  const database = getDb()
  return database.getAllAsync<DailyEntry>(
    'SELECT * FROM daily_entries WHERE module_id = ? ORDER BY date DESC LIMIT ?',
    [moduleId, limit]
  )
}

export async function saveDailyEntry(entry: Omit<DailyEntry, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT INTO daily_entries (id, module_id, date, status, reason, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(module_id, date) DO UPDATE SET
       status = excluded.status,
       reason = excluded.reason,
       notes  = excluded.notes`,
    [entry.id, entry.module_id, entry.date, entry.status, entry.reason, entry.notes]
  )
}

export async function deleteDailyEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM daily_entries WHERE id = ?', [id])
}

// ─── medication_intakes — détail optionnel par molécule (suivi hybride) ───────
// Pattern : N lignes par (module_id, date) — une par molécule renseignée ce jour.
// UPSERT sur (module_id, date, medication_id). Le `medication_id` référence une
// entrée de patient_modules.config.medications (liste co-éditée patient↔praticien).
// MDR : statut + motif sont des faits déclarés bruts, jamais interprétés.

export interface MedicationIntake {
  id: string
  module_id: string
  date: string
  medication_id: string
  status: string          // 'taken' | 'partial' | 'missed'
  reason: string | null   // motif de non-prise déclaré, optionnel
  created_at: string
}

export async function createMedicationIntakesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS medication_intakes (
      id            TEXT PRIMARY KEY,
      module_id     TEXT NOT NULL,
      date          TEXT NOT NULL,
      medication_id TEXT NOT NULL,
      status        TEXT NOT NULL,
      reason        TEXT,
      created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(module_id, date, medication_id)
    );
    CREATE INDEX IF NOT EXISTS idx_medication_intakes_module_date
      ON medication_intakes(module_id, date);
  `)
}

export async function getMedicationIntakes(moduleId: string, date: string): Promise<MedicationIntake[]> {
  const database = getDb()
  return database.getAllAsync<MedicationIntake>(
    'SELECT * FROM medication_intakes WHERE module_id = ? AND date = ?',
    [moduleId, date]
  )
}

export async function saveMedicationIntake(entry: Omit<MedicationIntake, 'created_at'>): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT INTO medication_intakes (id, module_id, date, medication_id, status, reason)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(module_id, date, medication_id) DO UPDATE SET
       status = excluded.status,
       reason = excluded.reason`,
    [entry.id, entry.module_id, entry.date, entry.medication_id, entry.status, entry.reason]
  )
}

export async function deleteMedicationIntake(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM medication_intakes WHERE id = ?', [id])
}

// ─── form_entries — table générique pour les formulaires multi-champs ────────
// Pattern : N enregistrements par module, chacun stockant un JSON de valeurs
// indexées par clé logique. Utilisée par le layout column_form (beck_columns
// et autres modules futurs partageant la sémantique « formulaire libre à
// champs hétérogènes »).

export async function createFormEntriesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS form_entries (
      id         TEXT PRIMARY KEY,
      module_id  TEXT NOT NULL,
      "values"   TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_form_entries_module ON form_entries(module_id, created_at DESC);
  `)
}

export interface FormEntry {
  id: string
  module_id: string
  values: Record<string, string | number>
  created_at: string
}

export async function getAllFormEntries(moduleId: string): Promise<FormEntry[]> {
  const database = getDb()
  const rows = await database.getAllAsync<{
    id: string
    module_id: string
    values: string
    created_at: string
  }>(
    'SELECT * FROM form_entries WHERE module_id = ? ORDER BY created_at DESC',
    [moduleId]
  )
  return rows.map(r => ({
    ...r,
    values: JSON.parse(r.values) as Record<string, string | number>,
  }))
}

export async function getFormEntry(id: string): Promise<FormEntry | null> {
  const database = getDb()
  const row = await database.getFirstAsync<{
    id: string
    module_id: string
    values: string
    created_at: string
  }>('SELECT * FROM form_entries WHERE id = ?', [id])
  if (!row) return null
  return { ...row, values: JSON.parse(row.values) as Record<string, string | number> }
}

export async function saveFormEntry(
  entry: Omit<FormEntry, 'created_at'> & { created_at?: string },
): Promise<void> {
  const database = getDb()
  // `created_at` fourni = saisie rétroactive (le patient choisit la date) ; sinon
  // valeur par défaut SQLite (CURRENT_TIMESTAMP).
  if (entry.created_at) {
    await database.runAsync(
      `INSERT OR REPLACE INTO form_entries (id, module_id, "values", created_at) VALUES (?, ?, ?, ?)`,
      [entry.id, entry.module_id, JSON.stringify(entry.values), entry.created_at]
    )
  } else {
    await database.runAsync(
      `INSERT OR REPLACE INTO form_entries (id, module_id, "values") VALUES (?, ?, ?)`,
      [entry.id, entry.module_id, JSON.stringify(entry.values)]
    )
  }
}

export async function deleteFormEntry(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM form_entries WHERE id = ?', [id])
}

// ─── tree_selections — table générique pour les sélecteurs d'arbre ──────────
// Pattern : N enregistrements par module, chacun stockant le chemin de
// sélection (path_json) plus une intensité brute et des notes optionnelles.
// Utilisée par le layout tree_selector (emotion_wheel et autres modules
// futurs partageant la sémantique « sélection hiérarchique guidée »).
//
// path_json est un tableau ordonné de noeuds — chaque entrée a un `id` et
// soit un `text_code` (clé i18n résolue à l'affichage), soit un `label`
// brut (cas des entrées migrées depuis emotion_entries). Les props
// d'affichage (color, icon) sont également capturées pour rendre l'historique
// indépendant du fait que les noeuds Supabase soient encore présents.

export interface TreeSelectionPathNode {
  id: string
  text_code?: string
  label?: string
  color?: string
  icon?: string
  emoji?: string
}

export interface TreeSelection {
  id: string
  module_id: string
  selected_id: string
  selected_label: string | null
  path: TreeSelectionPathNode[]
  intensity: number | null
  notes: string | null
  /** Domaines de contexte déclarés (clés i18n), optionnels. */
  context: string[]
  created_at: string
}

export async function createTreeSelectionsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tree_selections (
      id              TEXT PRIMARY KEY,
      module_id       TEXT NOT NULL,
      selected_id     TEXT NOT NULL,
      selected_label  TEXT,
      path_json       TEXT NOT NULL,
      intensity       INTEGER,
      notes           TEXT,
      context_json    TEXT,
      created_at      TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tree_selections_module ON tree_selections(module_id, created_at DESC);
  `)
}

interface TreeSelectionRow {
  id: string
  module_id: string
  selected_id: string
  selected_label: string | null
  path_json: string
  intensity: number | null
  notes: string | null
  context_json: string | null
  created_at: string
}

function parsePath(json: string): TreeSelectionPathNode[] {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed as TreeSelectionPathNode[]
  } catch {
    return []
  }
}

function parseContext(json: string | null): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

export async function getAllTreeSelections(moduleId: string, limit = 100): Promise<TreeSelection[]> {
  const database = getDb()
  const rows = await database.getAllAsync<TreeSelectionRow>(
    'SELECT * FROM tree_selections WHERE module_id = ? ORDER BY created_at DESC LIMIT ?',
    [moduleId, limit]
  )
  return rows.map(r => ({
    id: r.id,
    module_id: r.module_id,
    selected_id: r.selected_id,
    selected_label: r.selected_label,
    path: parsePath(r.path_json),
    intensity: r.intensity,
    notes: r.notes,
    context: parseContext(r.context_json),
    created_at: r.created_at,
  }))
}

export async function saveTreeSelection(
  entry: Omit<TreeSelection, 'created_at'>
): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO tree_selections
       (id, module_id, selected_id, selected_label, path_json, intensity, notes, context_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.module_id,
      entry.selected_id,
      entry.selected_label,
      JSON.stringify(entry.path),
      entry.intensity,
      entry.notes,
      JSON.stringify(entry.context ?? []),
    ]
  )
}

export async function deleteTreeSelection(id: string): Promise<void> {
  const database = getDb()
  await database.runAsync('DELETE FROM tree_selections WHERE id = ?', [id])
}

// ─── Entretien Motivationnel (EM) ────────────────────────────────────────────
// 3 tables : em_rulers (données par séance), em_balance_items (balance),
// em_values (valeurs sélectionnées — état persistant)

export interface EMRuler {
  id: string
  behavior_target: string | null   // comportement exploré
  stage: number | null             // stade Prochaska 1–6
  importance_score: number | null  // 0–10
  importance_why: string | null    // réponse "pourquoi ce score ?"
  confidence_score: number | null  // 0–10
  confidence_why: string | null    // réponse "qu'est-ce qui vous rendrait plus confiant ?"
  commitment_text: string | null   // phrase d'engagement de séance
  created_at: string
}

export interface EMBalanceItem {
  id: string
  behavior_target: string  // comportement auquel cet item se rapporte
  side: 'for' | 'against'  // Pour changer / Contre changer
  text: string
  weight: number           // 1–3
  sort_order: number
  created_at: string
}

export interface EMValue {
  id: string
  value_key: string  // clé i18n de la valeur (ex: 'family', 'health', 'freedom')
  sort_order: number
  created_at: string
}

export async function createEMRulersTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS em_rulers (
      id TEXT PRIMARY KEY,
      behavior_target TEXT,
      stage INTEGER,
      importance_score INTEGER,
      importance_why TEXT,
      confidence_score INTEGER,
      confidence_why TEXT,
      commitment_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export async function createEMBalanceItemsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS em_balance_items (
      id TEXT PRIMARY KEY,
      behavior_target TEXT NOT NULL DEFAULT '',
      side TEXT NOT NULL,
      text TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export async function createEMValuesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS em_values (
      id TEXT PRIMARY KEY,
      value_key TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

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
    CREATE TABLE IF NOT EXISTS sleep_diary_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      bedtime TEXT,
      wake_time TEXT,
      sleep_onset_minutes INTEGER DEFAULT 0,
      awakenings INTEGER DEFAULT 0,
      quality INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// --- Types ---

export interface SleepEntry {
  id: string
  date: string                   // YYYY-MM-DD : la nuit enregistrée
  bedtime: string | null         // HH:MM
  wake_time: string | null       // HH:MM
  sleep_onset_minutes: number    // temps pour s'endormir (minutes)
  awakenings: number             // nombre de réveils nocturnes
  quality: number | null         // 1 à 5
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
      (id, date, bedtime, wake_time, sleep_onset_minutes, awakenings, quality, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.bedtime,
      entry.wake_time,
      entry.sleep_onset_minutes,
      entry.awakenings,
      entry.quality,
      entry.notes,
    ]
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

// Génère un identifiant unique simple
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

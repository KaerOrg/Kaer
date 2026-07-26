import { shiftDate, todayIso, minutesToClock } from '@kaer/shared'
import {
  saveSleepEntry,
  deleteSleepEntry,
  type SleepEntry,
} from '@services/sleepDiaryService'
import { getAllSleepEntries } from '../../lib/database'
import { demoLocalId, type DemoGenerator } from './types'

// Une entrée de démo est une saisie de sommeil complète, sans `created_at`
// (posé par SQLite à l'écriture). Le générateur ne fabrique QUE des données
// brutes (heures, comptages, ressentis 1 à 5) : conformément au statut
// non-dispositif médical (MDR 2017/745), il n'ajoute AUCUN label ni score
// interprétatif — l'app affiche, elle ne conclut pas.
export type SleepDemoDraft = Omit<SleepEntry, 'created_at'>

/** Nombre de nuits générées (~2 mois d'utilisation continue). */
export const SLEEP_DEMO_DAYS = 60

// Générateur pseudo-aléatoire déterministe (mulberry32). Un seed fixe par nuit
// rend la démo REPRODUCTIBLE : mêmes valeurs à chaque génération, ce qui permet
// de tester `buildSleepDemoEntries` sur des assertions stables.
function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entier pseudo-aléatoire dans [min, max] inclus. */
function pick(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/**
 * Fabrique ~2 mois de nuits réalistes se terminant la veille de `today` (date
 * ISO locale). Pattern volontairement NON uniforme : nuits plus courtes en
 * semaine, récupération le week-end, insomnies ponctuelles, siestes de week-end,
 * légère amélioration au fil des semaines. Fonction pure et déterministe →
 * directement testable.
 */
export function buildSleepDemoEntries(today: string): SleepDemoDraft[] {
  const drafts: SleepDemoDraft[] = []

  for (let i = SLEEP_DEMO_DAYS; i >= 1; i -= 1) {
    const date = shiftDate(today, -i)
    // Semaine 0 la plus ancienne → 8 la plus récente : sert une amélioration douce.
    const week = Math.floor((SLEEP_DEMO_DAYS - i) / 7)
    // getDay() sur un Date ancré à midi local (pas de décalage de fuseau).
    const jsDay = new Date(`${date}T12:00:00`).getDay() // 0 = dimanche, 6 = samedi
    const isWeekend = jsDay === 0 || jsDay === 6

    const rng = makeRng(1000 + i)
    // Une nuit d'insomnie ponctuelle environ une fois par semaine.
    const insomnia = pick(rng, 0, 6) === 0

    // Coucher : plus tôt le week-end, se décale légèrement plus tôt avec les semaines.
    const bedBase = (isWeekend ? 22 * 60 + 40 : 23 * 60 + 20) - week * 4
    const bedtime = bedBase + pick(rng, -15, 25)
    const inBed = bedtime - pick(rng, 10, 20)

    // Endormissement : long les nuits d'insomnie, se raccourcit avec les semaines.
    const onset = insomnia ? pick(rng, 45, 75) : Math.max(6, pick(rng, 10, 35) - week)

    // Réveils nocturnes : plus nombreux les nuits d'insomnie.
    const awakenings = insomnia ? pick(rng, 2, 3) : pick(rng, 0, 1)
    const awakeningsDuration = awakenings === 0 ? 0 : pick(rng, 5, 15) * awakenings

    // Lever : plus tard le week-end.
    const wake = (isWeekend ? 8 * 60 + 15 : 6 * 60 + 55) + pick(rng, -20, 20)
    const outOfBed = wake + pick(rng, 5, 20)

    // Ressentis subjectifs bruts 1 à 5 : plus bas les nuits d'insomnie, remontent
    // doucement au fil des semaines (donnée saisie par le patient, jamais un score
    // calculé ni un jugement clinique).
    const quality = insomnia
      ? pick(rng, 1, 2)
      : Math.min(5, pick(rng, 2, 4) + (week >= 5 ? 1 : 0))
    const restedness = insomnia
      ? pick(rng, 1, 2)
      : Math.min(5, pick(rng, 2, 4) + (week >= 5 ? 1 : 0))

    drafts.push({
      id: demoLocalId(`sleep-${date}`),
      date,
      in_bed_time: minutesToClock(inBed),
      bedtime: minutesToClock(bedtime),
      wake_time: minutesToClock(wake),
      out_of_bed_time: minutesToClock(outOfBed),
      sleep_onset_minutes: onset,
      awakenings,
      awakenings_duration_minutes: awakeningsDuration,
      quality,
      restedness,
      nap_minutes: isWeekend && pick(rng, 0, 2) === 0 ? pick(rng, 20, 45) : 0,
      sleep_aid: insomnia && pick(rng, 0, 1) === 0 ? 1 : 0,
      nightmares: insomnia && pick(rng, 0, 3) === 0 ? 1 : 0,
      notes: null,
    })
  }

  return drafts
}

/**
 * Générateur de référence « agenda du sommeil ». Écrit chaque nuit via le
 * service réel `saveSleepEntry` (→ syncUpsert → SQLite + outbox → Supabase) et
 * supprime via `deleteSleepEntry` (→ syncDelete) : la démo emprunte exactement
 * le même pipeline qu'une vraie saisie patient, d'où la cohérence web ≡ mobile.
 * Le filtre de purge (`demo-`) est appliqué par l'infra, pas ici.
 */
export const sleepDiaryDemoGenerator: DemoGenerator = {
  module: 'sleep_diary',

  async generate(): Promise<number> {
    const drafts = buildSleepDemoEntries(todayIso())
    for (const draft of drafts) {
      await saveSleepEntry(draft)
    }
    return drafts.length
  },

  listEntryIds: async (): Promise<string[]> => {
    const all = await getAllSleepEntries()
    return all.map((entry) => entry.id)
  },

  deleteEntry: (id: string): Promise<void> => deleteSleepEntry(id),
}

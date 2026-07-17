import { queryOptions } from '@tanstack/react-query'
import {
  fetchScaleEvolution,
  fetchMoodEvolution,
  fetchMoodMarkers,
  fetchFearEvolution,
  fetchMedSideEffectsEvolution,
  fetchSleepEvolution,
  fetchAvailableScales,
  fetchModuleSummary,
  fetchChronoEntries,
  fetchFormEntries,
  fetchActivityEntries,
  type ScorePoint,
  type MoodPoint,
  type MoodMarkerRow,
  type FearPoint,
  type MedEffectPoint,
  type SleepPoint,
  type ModuleSummary,
  type FormEntryRow,
  type ActivityEntryPoint,
} from '@services/engagementService'
import type { RhythmEntry } from '@kaer/shared'

// Type d'écran de données pour un module donné (calculé par l'appelant).
export type ChartKind = 'scale' | 'mood' | 'fear' | 'med' | 'sleep' | 'form'

// Résultat agrégé du panneau « Données » d'un module (hors état de chargement,
// porté par la query elle-même).
export type ModuleDataResult =
  | { status: 'empty' }
  | { status: 'summary'; summary: ModuleSummary }
  | { status: 'scale'; points: ScorePoint[] }
  | { status: 'mood'; points: MoodPoint[] }
  | { status: 'fear'; points: FearPoint[] }
  | { status: 'med'; effects: string[]; points: MedEffectPoint[] }
  | { status: 'sleep'; points: SleepPoint[] }
  | { status: 'rhythmogram'; entries: RhythmEntry[] }
  | { status: 'form'; entries: FormEntryRow[] }
  | { status: 'activity'; entries: ActivityEntryPoint[] }

// Factories `queryOptions` des données d'évolution / engagement patient (lecture
// seule, alimente les graphiques). L'agrégat d'évolution regroupe en UNE query la
// résolution des échelles disponibles puis tous les fetches parallèles.
export const engagementQueries = {
  patientEvolution: (patientId: string) =>
    queryOptions({
      queryKey: ['engagement', 'evolution', patientId],
      queryFn: async () => {
        const available = await fetchAvailableScales(patientId)
        const [scaleResults, mood, fear, med, sleep, chronoEntries, beckEntries, activityEntries] = await Promise.all([
          Promise.all(available.map(mt => fetchScaleEvolution(patientId, mt))),
          fetchMoodEvolution(patientId),
          fetchFearEvolution(patientId),
          fetchMedSideEffectsEvolution(patientId),
          fetchSleepEvolution(patientId),
          fetchChronoEntries(patientId),
          // Colonnes de Beck : fiches complètes (mêmes données que l'onglet
          // « Données » du module) rendues en maître-détail dans l'onglet Évolution.
          fetchFormEntries(patientId, 'beck_columns'),
          fetchActivityEntries(patientId),
        ])
        const scaleData: Record<string, Awaited<ReturnType<typeof fetchScaleEvolution>>> = {}
        available.forEach((mt, i) => { scaleData[mt] = scaleResults[i] })
        return {
          scales: available,
          scaleData,
          moodData: mood,
          fearData: fear,
          medEffects: med.effects,
          medData: med.data,
          sleepData: sleep,
          chronoEntries,
          beckEntries,
          activityEntries,
        }
      },
    }),

  // Données du panneau d'une card module. `kind` (calculé par l'appelant depuis sa
  // config de graphiques) sélectionne le fetch ; le résultat porte son propre statut.
  moduleData: (patientId: string, moduleType: string, kind: ChartKind | null) =>
    queryOptions({
      queryKey: ['engagement', 'moduleData', patientId, moduleType],
      queryFn: async (): Promise<ModuleDataResult> => {
        if (kind === 'scale') {
          const points = await fetchScaleEvolution(patientId, moduleType)
          return points.length === 0 ? { status: 'empty' } : { status: 'scale', points }
        }
        if (kind === 'mood') {
          const points = await fetchMoodEvolution(patientId)
          return points.length === 0 ? { status: 'empty' } : { status: 'mood', points }
        }
        if (kind === 'fear') {
          const points = await fetchFearEvolution(patientId)
          return points.length === 0 ? { status: 'empty' } : { status: 'fear', points }
        }
        if (kind === 'med') {
          const res = await fetchMedSideEffectsEvolution(patientId)
          return res.data.length === 0 ? { status: 'empty' } : { status: 'med', effects: res.effects, points: res.data }
        }
        if (kind === 'sleep') {
          const points = await fetchSleepEvolution(patientId)
          return points.length === 0 ? { status: 'empty' } : { status: 'sleep', points }
        }
        if (kind === 'form') {
          const entries = await fetchFormEntries(patientId, moduleType)
          return entries.length === 0 ? { status: 'empty' } : { status: 'form', entries }
        }
        if (moduleType === 'chronobiology_tracker') {
          const entries = await fetchChronoEntries(patientId)
          return entries.length === 0
            ? { status: 'empty' }
            : { status: 'rhythmogram', entries }
        }
        if (moduleType === 'behavioral_activation') {
          const entries = await fetchActivityEntries(patientId)
          return entries.length === 0
            ? { status: 'empty' }
            : { status: 'activity', entries }
        }
        const summary = await fetchModuleSummary(patientId, moduleType)
        return summary.count === 0 ? { status: 'empty' } : { status: 'summary', summary }
      },
    }),

  // Repères temporels du mood_tracker posés par le patient (lecture seule).
  moodMarkers: (patientId: string) =>
    queryOptions({
      queryKey: ['engagement', 'moodMarkers', patientId],
      queryFn: (): Promise<MoodMarkerRow[]> => fetchMoodMarkers(patientId),
    }),

  // Préfixes de clés dérivées de `patient_entries` pour UN patient — à invalider
  // quand une entrée de ce patient change (Realtime #103). Prefix match : couvre
  // l'évolution ET toutes les cards `moduleData` (tous modules/kinds) du patient.
  patientDataKeys: (patientId: string): readonly (readonly string[])[] => [
    ['engagement', 'evolution', patientId],
    ['engagement', 'moduleData', patientId],
    ['engagement', 'moodMarkers', patientId],
  ],
}

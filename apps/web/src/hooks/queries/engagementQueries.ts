import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchScaleEvolution,
  fetchMoodEvolution,
  fetchMoodMarkers,
  fetchFearEvolution,
  fetchDefusionEvolution,
  fetchMedSideEffectsEvolution,
  fetchSleepEvolution,
  fetchAvailableScales,
  fetchModuleSummary,
  fetchModuleLastActivity,
  fetchChronoEntries,
  fetchFormEntries,
  fetchActivityEntries,
  fetchScalePassations,
  markPassationRead,
  type ScalePassation,
  type ScorePoint,
  type MoodPoint,
  type MoodMarkerRow,
  type FearPoint,
  type DefusionPoint,
  type MedEffectPoint,
  type SleepPoint,
  type ModuleSummary,
  type FormEntryRow,
  type ActivityEntryPoint,
  fetchEmotionNamingEntries,
  type EmotionNamingRow,
} from '@services/engagementService'
import type { RhythmEntry } from '@kaer/shared'

// Type d'écran de données pour un module donné (calculé par l'appelant).
export type ChartKind =
  | 'scale' | 'mood' | 'fear' | 'defusion' | 'med' | 'sleep' | 'form' | 'emotion_naming'

// Résultat agrégé du panneau « Données » d'un module (hors état de chargement,
// porté par la query elle-même).
export type ModuleDataResult =
  | { status: 'empty' }
  | { status: 'summary'; summary: ModuleSummary }
  | { status: 'scale'; points: ScorePoint[] }
  | { status: 'mood'; points: MoodPoint[] }
  | { status: 'fear'; points: FearPoint[] }
  | { status: 'defusion'; points: DefusionPoint[] }
  | { status: 'med'; effects: string[]; points: MedEffectPoint[] }
  | { status: 'sleep'; points: SleepPoint[] }
  | { status: 'rhythmogram'; entries: RhythmEntry[] }
  | { status: 'form'; entries: FormEntryRow[] }
  | { status: 'activity'; entries: ActivityEntryPoint[] }
  // « Nommer ce que je ressens » : des saisies brutes, pas une série. Les comptages
  // descriptifs sont calculés par `lib/emotionNamingData.ts` au rendu.
  | { status: 'emotion_naming'; entries: EmotionNamingRow[] }

// Factories `queryOptions` des données d'évolution / engagement patient (lecture
// seule, alimente les graphiques). L'agrégat d'évolution regroupe en UNE query la
// résolution des échelles disponibles puis tous les fetches parallèles.
export const engagementQueries = {
  patientEvolution: (patientId: string) =>
    queryOptions({
      queryKey: ['engagement', 'evolution', patientId],
      queryFn: async () => {
        const available = await fetchAvailableScales(patientId)
        const [scaleResults, mood, fear, defusion, med, sleep, chronoEntries, beckEntries, activityEntries, namingEntries] = await Promise.all([
          Promise.all(available.map(mt => fetchScaleEvolution(patientId, mt))),
          fetchMoodEvolution(patientId),
          fetchFearEvolution(patientId),
          fetchDefusionEvolution(patientId),
          fetchMedSideEffectsEvolution(patientId),
          fetchSleepEvolution(patientId),
          fetchChronoEntries(patientId),
          // Colonnes de Beck : fiches complètes (mêmes données que l'onglet
          // « Données » du module) rendues en maître-détail dans l'onglet Évolution.
          fetchFormEntries(patientId, 'beck_columns'),
          fetchActivityEntries(patientId),
          // « Nommer ce que je ressens » : saisies brutes. La section Évolution en
          // tire des comptages descriptifs, jamais une série ni une tendance.
          fetchEmotionNamingEntries(patientId),
        ])
        const scaleData: Record<string, Awaited<ReturnType<typeof fetchScaleEvolution>>> = {}
        available.forEach((mt, i) => { scaleData[mt] = scaleResults[i] })
        return {
          scales: available,
          scaleData,
          moodData: mood,
          fearData: fear,
          defusionData: defusion,
          medEffects: med.effects,
          medData: med.data,
          sleepData: sleep,
          chronoEntries,
          beckEntries,
          activityEntries,
          namingEntries,
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
        if (kind === 'defusion') {
          const points = await fetchDefusionEvolution(patientId)
          return points.length === 0 ? { status: 'empty' } : { status: 'defusion', points }
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
        if (kind === 'emotion_naming') {
          const entries = await fetchEmotionNamingEntries(patientId)
          return entries.length === 0 ? { status: 'empty' } : { status: 'emotion_naming', entries }
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

  // Dernière activité de chaque module du patient (map module_id → horodatage),
  // pour la colonne « Dernière activité » du tableau des modules (K-1). Dérivée de
  // `patient_entries` → invalidée par `patientDataKeys` (préfixe `['engagement']`).
  lastActivity: (patientId: string) =>
    queryOptions({
      queryKey: ['engagement', 'lastActivity', patientId],
      queryFn: (): Promise<Map<string, string>> => fetchModuleLastActivity(patientId),
    }),

  // Repères temporels du mood_tracker posés par le patient (lecture seule).
  moodMarkers: (patientId: string) =>
    queryOptions({
      queryKey: ['engagement', 'moodMarkers', patientId],
      queryFn: (): Promise<MoodMarkerRow[]> => fetchMoodMarkers(patientId),
    }),

  // Passations d'une échelle, réponse par réponse (#418). Distincte de `moduleData`,
  // qui n'en rapporte que le total : le détail n'est chargé que si le praticien
  // ouvre l'onglet Données d'une échelle, pas pour dessiner une courbe.
  scalePassations: (patientId: string, moduleType: string) =>
    queryOptions({
      queryKey: ['engagement', 'scalePassations', patientId, moduleType],
      queryFn: (): Promise<ScalePassation[]> => fetchScalePassations(patientId, moduleType),
    }),

  // Préfixes de clés dérivées de `patient_entries` pour UN patient — à invalider
  // quand une entrée de ce patient change (Realtime #103). Prefix match : couvre
  // l'évolution ET toutes les cards `moduleData` (tous modules/kinds) du patient.
  patientDataKeys: (patientId: string): readonly (readonly string[])[] => [
    ['engagement', 'evolution', patientId],
    ['engagement', 'moduleData', patientId],
    ['engagement', 'lastActivity', patientId],
    ['engagement', 'moodMarkers', patientId],
    ['engagement', 'scalePassations', patientId],
  ],
}

/**
 * Pose l'accusé de lecture d'une passation à l'ouverture de son détail (#419).
 *
 * Écriture déclenchée par une consultation, pas par un clic : la mutation est appelée
 * depuis un effet, sans bouton. Invalide la clé des passations pour que la ligne
 * « Ouverte le … » apparaisse dans la foulée, sans rechargement.
 *
 * `onError` est volontairement absent : le service reporte déjà l'échec à la
 * télémétrie, et un toast d'erreur ici parasiterait la lecture d'une passation pour
 * un accusé que le praticien n'a pas demandé.
 */
export function useMarkPassationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, localId, moduleId }: {
      patientId: string
      localId: string
      moduleId: string
    }) => markPassationRead(patientId, localId, moduleId),
    onSuccess: (_data, { patientId, moduleId }) => {
      qc.invalidateQueries({ queryKey: engagementQueries.scalePassations(patientId, moduleId).queryKey })
    },
  })
}

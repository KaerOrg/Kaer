// ─── Layout `safety_sequence` — la Séquence du plan de sécurité ──────────────
//
// Traversée guidée du plan, une chose à la fois : accueil → étapes → « ce qui est
// disponible tout de suite » → clôture. Construit sur le patron de
// `crisis_companion` : machine à états, logique pure isolée dans
// `@kaer/shared/services/safetySequence` (partagée avec l'aperçu web, une seule
// source), textes en base (config-first), ZÉRO persistance.
//
// Conformité MDR 2017/745, invariant fondateur : ce layout n'écrit RIEN. Aucun
// `syncUpsert`, aucun `dbSave`, aucun compteur d'ouverture, aucun horodatage. Ne
// jamais y importer un service d'écriture — le seul accès données autorisé est la
// LECTURE `getPlanItems`. Corollaire assumé : on ne saura pas si la séquence sert ;
// l'évaluation appartient à la consultation.
//
// Le saut des étapes vides est un routage STRUCTUREL (« existe-t-il quelque chose à
// afficher ? »), jamais une lecture du contenu — cf. le commentaire de doctrine de
// `sequenceLogic.ts` et celui de `initialPreviewKind.ts`.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import type { ContentField } from '@services/moduleService'
import { getPlanItems, type PlanItem } from '@services/planItemService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import {
  buildDisplayableSteps,
  advance,
  goBack,
  isLastStep,
  formatProgress,
  INITIAL_STATE,
  type SequenceState,
} from '@kaer/shared'
import { CrisisEmergencyCalls } from '../shared'
import { styles } from './styles'

export interface SafetySequenceLayoutProps {
  /** Étapes du plan regroupées par `section_id`, dans l'ordre de la config. */
  sections: Map<string, ContentField[]>
  /** Fields hors section : numéros d'urgence, ancres. */
  uiFields: ContentField[]
  /** Identifiant du module — clé de persistance et racine des clés i18n. */
  moduleId: string
  /** Sortie du parcours. Toujours disponible, jamais de confirmation. */
  onExit?: () => void
}

export function SafetySequenceLayout({ sections, uiFields, moduleId, onExit }: SafetySequenceLayoutProps) {
  const t = useModuleTranslation()
  // Clés dérivées du module porté par les fields : `safety_sequence` nomme un motif
  // d'écran réutilisable, jamais un module (config-first).
  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])

  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<SequenceState>(INITIAL_STATE)

  useEffect(() => {
    let active = true
    // Lecture seule, servie par SQLite : la Séquence doit fonctionner hors ligne (P-12).
    getPlanItems(moduleId)
      .then(data => { if (active) setItems(data) })
      .catch(() => { /* plan illisible : le parcours reste utilisable sur les ressources */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [moduleId])

  const itemsBySection = useMemo(() => {
    const map = new Map<string, PlanItem[]>()
    for (const item of items) {
      const list = map.get(item.section_id) ?? []
      list.push(item)
      map.set(item.section_id, list)
    }
    return map
  }, [items])

  // Présence seule : ce Set est le SEUL signal transmis au routage. Ne jamais y
  // substituer un comptage ni la liste des items (invariant MDR de sequenceLogic).
  const sectionsWithItems = useMemo(
    () => new Set([...itemsBySection.keys()].filter(id => (itemsBySection.get(id)?.length ?? 0) > 0)),
    [itemsBySection],
  )

  const steps = useMemo(
    () => buildDisplayableSteps([...sections.keys()], sectionsWithItems),
    [sections, sectionsWithItems],
  )

  const handleAdvance = useCallback(() => setState(prev => advance(prev, steps.length)), [steps.length])

  // Retour arrière discret : un appui accidentel ne doit jamais coûter une étape
  // définitivement (P-7). Depuis l'accueil, il n'y a plus de retour : on sort.
  const handleBack = useCallback(() => {
    setState(prev => goBack(prev, steps.length) ?? prev)
  }, [steps.length])

  const canGoBack = goBack(state, steps.length) != null

  // « Je m'arrête là » SORT du parcours, sans confirmation, depuis n'importe quel
  // écran. À ne pas confondre avec le retour arrière ci-dessus.
  const handleStop = useCallback(() => { onExit?.() }, [onExit])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  const currentStep = state.kind === 'step' ? steps[state.index] : undefined
  const stepFields = currentStep != null ? sections.get(currentStep.sectionId) ?? [] : []
  const stepTitle = stepFields.find(f => f.field_type === 'step_title')
  const stepItems = currentStep != null ? itemsBySection.get(currentStep.sectionId) ?? [] : []
  const onLastStep = state.kind === 'step' && isLastStep(state.index, steps.length)

  return (
    <View style={styles.container}>
      {/* Bandeau d'urgence permanent, sur TOUS les écrans du parcours. */}
      <View style={styles.emergencyBar}>
        <CrisisEmergencyCalls fields={uiFields} />
      </View>

      {canGoBack ? (
        <View style={styles.backRow}>
          <Button
            variant="ghost"
            size="sm"
            label={t('common.back')}
            onPress={handleBack}
            testID="safety-sequence-back"
          />
        </View>
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {state.kind === 'home' ? (
          <Text style={styles.screenTitle}>{lbl('sequence_home_title')}</Text>
        ) : null}

        {state.kind === 'step' && currentStep != null ? (
          <>
            <Text style={styles.stepLabel}>
              {lbl('step_label').replace('{{number}}', String(currentStep.position))}
            </Text>
            <Text style={styles.stepTitle}>{t(stepTitle?.text_code ?? '')}</Text>
            {stepItems.map(item => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            ))}
          </>
        ) : null}

        {state.kind === 'resources' ? (
          <Text style={styles.screenTitle}>{lbl('sequence_resources_title')}</Text>
        ) : null}

        {state.kind === 'closing' ? (
          <Text style={styles.screenTitle}>{lbl('sequence_closing_title')}</Text>
        ) : null}
      </ScrollView>

      {/* Actions ANCRÉES hors du flux défilant : les items peuvent défiler à taille de
          police maximale, l'action jamais (P-7). */}
      <View style={styles.actions}>
        {state.kind === 'step' ? (
          <Text style={styles.progress}>{formatProgress(state.index, steps.length)}</Text>
        ) : null}
        {state.kind !== 'closing' ? (
          <Button
            variant="primary"
            label={onLastStep ? lbl('sequence_advance_last') : lbl('sequence_advance')}
            onPress={handleAdvance}
            testID="safety-sequence-advance"
          />
        ) : null}
        <Button
          variant="ghost"
          label={lbl('sequence_stop')}
          onPress={handleStop}
          testID="safety-sequence-stop"
        />
      </View>
    </View>
  )
}

// ─── Layout `safety_sequence` — la Séquence du plan de sécurité ──────────────
//
// Traversée guidée du plan, une chose à la fois : accueil → étapes → « ce qui est
// disponible tout de suite » → clôture. Construit sur le patron de
// `crisis_companion` : machine à états, logique pure isolée dans
// `@kaer/shared/services/safetySequence` (partagée avec l'aperçu web, une seule
// source), textes en base (config-first), ZÉRO persistance.
//
// Conformité MDR 2017/745, invariant fondateur : ce layout n'écrit AUCUNE donnée
// patient. Aucun `syncUpsert`, aucun `dbSave`, aucun compteur d'ouverture, aucun
// horodatage de passage, rien côté praticien. Ne jamais y importer un service
// d'écriture — le seul accès aux données du plan est la LECTURE `getPlanItems`.
// Corollaire assumé : on ne saura pas si la séquence sert ; l'évaluation appartient
// à la consultation.
//
// Seule sortie autorisée : `reportFailedOperation`, télémétrie TECHNIQUE du système
// d'observabilité (#96). Elle ne transmet ni saisie, ni identifiant patient, ni fait
// clinique — uniquement le fait qu'une lecture locale a échoué. Hors périmètre MDR.
//
// Le saut des étapes vides est un routage STRUCTUREL (« existe-t-il quelque chose à
// afficher ? »), jamais une lecture du contenu — cf. le commentaire de doctrine de
// `sequenceLogic.ts` et celui de `initialPreviewKind.ts`.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import type { ContentField } from '@services/moduleService'
import { getPlanItems, type PlanItem } from '@services/planItemService'
import { reportFailedOperation } from '@services/errorReportingService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import {
  buildDisplayableSteps,
  advancePath,
  backPath,
  goTo,
  currentState,
  isLastStep,
  formatProgress,
  INITIAL_PATH,
  type SequencePath,
  type SequenceState,
} from '@kaer/shared'
import { CrisisEmergencyCalls } from '../shared'
import { SequenceEntryCard } from './SequenceEntryCard'
import { styles } from './styles'

// Retour discret, dessiné comme un chevron et non comme un bouton libellé : il doit
// être atteignable sans jamais concurrencer l'action du bas (P-7, maquette rail 4a).
const BACK_ICON = <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textMuted} />

// Destinations fixes des entrées de l'accueil, hors du rendu : elles ne dépendent
// d'aucune donnée et doivent rester stables pour la mémoïsation des cartes.
const FIRST_STEP: SequenceState = { kind: 'step', index: 0 }
const CLOSING: SequenceState = { kind: 'closing' }

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
  // Le chemin, pas l'état seul : depuis P-6 l'accueil ouvre des raccourcis, et le
  // retour doit ramener là d'où l'on vient, pas à l'écran précédent d'une ligne
  // théorique que le patient n'a pas suivie.
  const [path, setPath] = useState<SequencePath>(INITIAL_PATH)
  const state = currentState(path)

  useEffect(() => {
    let active = true
    // Lecture seule, servie par SQLite : la Séquence doit fonctionner hors ligne (P-12).
    getPlanItems(moduleId)
      .then(data => { if (active) setItems(data) })
      .catch((err: unknown) => {
        // Le parcours reste utilisable : sans items, il mène aux ressources. On
        // n'affiche AUCUN message d'erreur — en crise, un écran qui se plaint est
        // pire que rien. Mais l'échec ne doit pas être avalé pour autant : un plan
        // de sécurité illisible est anormal, donc reporté en télémétrie technique
        // (aucune donnée patient).
        reportFailedOperation(`module/${moduleId}/sequence`, 'plan items unreadable',
          err instanceof Error ? err.message : String(err))
      })
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
  // substituer un comptage ni la liste des items (invariant MDR de safetySequence).
  // `itemsBySection` ne contient que des sections non vides, par construction.
  const sectionsWithItems = useMemo(() => new Set(itemsBySection.keys()), [itemsBySection])

  const steps = useMemo(
    () => buildDisplayableSteps([...sections.keys()], sectionsWithItems),
    [sections, sectionsWithItems],
  )

  // Raccourcis de l'accueil : les étapes que la CONFIG déclare atteignables en un
  // geste (`direct_access_label_code` sur leur `step_title`). Rien n'est codé en dur
  // ici — le layout ne connaît aucun numéro d'étape, et une étape sans item n'y
  // figure pas puisqu'elle ne fait pas partie des étapes affichables.
  const directEntries = useMemo(
    () => steps.flatMap((step, index) => {
      const title = sections.get(step.sectionId)?.find(f => f.field_type === 'step_title')
      const labelCode = title?.props['direct_access_label_code']
      if (labelCode == null) return []
      // La cible est construite ICI, dans le mémo : passée en prop, elle doit rester
      // stable d'un rendu à l'autre, sinon la mémoïsation de la carte ne sert à rien.
      const target: SequenceState = { kind: 'step', index }
      return [{ sectionId: step.sectionId, target, labelCode, hintCode: title?.props['direct_access_hint_code'] }]
    }),
    [steps, sections],
  )

  const handleAdvance = useCallback(() => setPath(prev => advancePath(prev, steps.length)), [steps.length])

  // Retour arrière discret : un appui accidentel ne doit jamais coûter une étape
  // définitivement (P-7). Depuis l'accueil, il n'y a plus de retour.
  const handleBack = useCallback(() => {
    setPath(prev => backPath(prev) ?? prev)
  }, [])

  // Raccourci de l'accueil (P-6) : un seul callback, la destination vient de la carte.
  const handleGoTo = useCallback((target: SequenceState) => {
    setPath(prev => goTo(prev, target))
  }, [])

  const canGoBack = backPath(path) != null

  // « Je m'arrête là » SORT du parcours, sans confirmation, depuis n'importe quel
  // écran. À ne pas confondre avec le retour arrière ci-dessus.
  const handleStop = useCallback(() => { onExit?.() }, [onExit])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  const currentStep = state.kind === 'step' ? steps[state.index] : undefined
  const stepFields = currentStep != null ? sections.get(currentStep.sectionId) ?? [] : []
  const stepTitle = stepFields.find(f => f.field_type === 'step_title')
  // Sous-titre d'une ligne, porté par la config (`subtitle_code`) et présent sur les
  // seules étapes que rien d'autre ne distingue : « sans contacter personne » sépare
  // l'étape 2 de l'étape 3. Absent partout ailleurs, sans trou dans la mise en page.
  const stepSubtitleCode = stepTitle?.props['subtitle_code']
  const stepItems = currentStep != null ? itemsBySection.get(currentStep.sectionId) ?? [] : []
  const onLastStep = state.kind === 'step' && isLastStep(state.index, steps.length)
  // Progression affichée sur les seuls écrans d'étape : l'accueil, les ressources et
  // la clôture ne sont pas numérotés.
  const progress = state.kind === 'step' ? formatProgress(state.index, steps.length) : ''

  return (
    <View style={styles.container}>
      {/* Bandeau d'urgence permanent, sur TOUS les écrans du parcours. */}
      <View style={styles.emergencyBar}>
        <CrisisEmergencyCalls fields={uiFields} />
      </View>

      {/* Rangée de tête : retour à gauche, progression à droite. Les deux sont
          discrets et hors de la carte de contenu (maquette P-7). */}
      {canGoBack || progress !== '' ? (
        <View style={styles.topRow}>
          {canGoBack ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={BACK_ICON}
              onPress={handleBack}
              accessibilityLabel={t('common.back')}
              testID="safety-sequence-back"
            />
          ) : null}
          {progress !== '' ? <Text style={styles.progress}>{progress}</Text> : null}
        </View>
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Écran d'arrivée : l'action dominante est le plan, puis des entrées plus
            calmes, une par geste. L'ordre est FIXE : jamais reclassé, jamais dérivé
            d'une saisie. Plan jamais rempli : on affiche ce qui est disponible tout
            de suite, sans jamais qualifier le plan ni parler de ce qui manque. */}
        {state.kind === 'home' && steps.length === 0 ? (
          <>
            <Text style={styles.screenTitle}>{lbl('sequence_resources_title')}</Text>
            <CrisisEmergencyCalls fields={uiFields} density="full" />
          </>
        ) : null}

        {state.kind === 'home' && steps.length > 0 ? (
          <>
            <SequenceEntryCard
              lead
              target={FIRST_STEP}
              label={lbl('sequence_home_follow')}
              hint={lbl('sequence_home_follow_hint')}
              onPress={handleGoTo}
              testID="safety-sequence-home-follow"
            />
            {directEntries.map(entry => (
              <SequenceEntryCard
                key={entry.sectionId}
                target={entry.target}
                label={t(entry.labelCode)}
                hint={entry.hintCode != null ? t(entry.hintCode) : undefined}
                onPress={handleGoTo}
                testID={`safety-sequence-home-${entry.sectionId}`}
              />
            ))}
            <SequenceEntryCard
              target={CLOSING}
              label={lbl('sequence_home_anchors')}
              hint={lbl('sequence_home_anchors_hint')}
              onPress={handleGoTo}
              testID="safety-sequence-home-anchors"
            />
          </>
        ) : null}

        {state.kind === 'step' && currentStep != null ? (
          <Card>
            <Text style={styles.stepLabel}>
              {lbl('step_label').replace('{{number}}', String(currentStep.position))}
            </Text>
            <Text style={styles.stepTitle}>{t(stepTitle?.text_code ?? '')}</Text>
            {stepSubtitleCode != null ? (
              <Text style={styles.stepSubtitle}>{t(stepSubtitleCode)}</Text>
            ) : null}
            {stepItems.map((item, index) => (
              // Filet de séparation ENTRE les items seulement : un filet sous le
              // dernier doublerait la bordure de la carte.
              <View key={item.id} style={index < stepItems.length - 1 ? styles.item : styles.itemLast}>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            ))}
          </Card>
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
        {/* L'accueil porte ses propres entrées : y ajouter « Autre chose que j'ai
            prévu » ferait deux fois la même promesse, et concurrencerait l'action
            dominante. La clôture, elle, n'a plus d'écran suivant. */}
        {state.kind === 'step' || state.kind === 'resources' ? (
          <Button
            variant="primary"
            label={onLastStep ? lbl('sequence_advance_last') : lbl('sequence_advance')}
            onPress={handleAdvance}
            testID="safety-sequence-advance"
          />
        ) : null}
        <Button
          variant="ghost"
          label={state.kind === 'home' ? lbl('sequence_home_close') : lbl('sequence_stop')}
          onPress={handleStop}
          testID="safety-sequence-stop"
        />
      </View>
    </View>
  )
}

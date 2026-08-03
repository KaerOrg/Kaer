// ─── Onglet « Le plan » : l'éditeur des six étapes (PW-2, PW-3, PW-5) ───────
//
// Il remplace un champ unique. Jusqu'ici, `crisis_plan_configs` ne portait que
// `practitioner_message`, et « Plan personnalisé » s'affichait dès que trois mots y
// étaient écrits, sur un plan par ailleurs vide : **le praticien ne pouvait ni lire ni
// écrire une ligne du plan**. C'est ce que PW-1 a rendu possible, et ce panneau l'expose.
//
// L'onglet ne s'appelle plus Configuration : ce n'est pas un réglage, c'est le contenu
// du plan.
//
// ── Ce que ce fichier fait, et lui seul ────────────────────────────────────
//
// Il ORIENTE. L'en-tête d'état, la colonne des étapes, le tableau de l'étape ouverte,
// l'étape 6 et le message de soutien vivent chacun dans leur fichier. Ici : les données,
// les mutations, et le choix du panneau de droite.
//
// ── Interdits, tenus par ce panneau ────────────────────────────────────────
//
// **Aucun pourcentage de complétion.** « 5 étapes remplies sur 6 » est un décompte,
// « plan complété à 83 % » serait une évaluation.
// **Aucune bibliothèque de suggestions à cocher** : un item doit être dans les mots du
// patient, c'est la condition pour qu'il le retrouve en crise.
// **Aucune suppression sans annulation possible.**
// **Aucune valeur déduite du contenu** : `kind` n'est jamais inféré du texte.
// **Aucune date comparée à aujourd'hui** : ni alerte d'ancienneté, ni badge « à revoir ».

import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collectIndexed, type ContentField } from '@kaer/shared'
import { Banner } from '@ui/Banner'
import type { SegmentOption } from '@ui/SegmentedControl'
import { crisisQueries, moduleQueries } from '../../../hooks/queries'
import { useToast } from '../../../contexts/ToastContext'
import {
  saveSafetyPlanItem,
  deleteSafetyPlanItem,
  type PlanItemKind,
  type SafetyPlanItem,
  type SafetyPlanItemInput,
} from '@services/safetyPlanItemsService'
import { markPlanReviewedToday, saveCrisisPlanConfig } from '@services/crisisPlanService'
import type { NewMeasure } from '../../../components/features/SafetyMeasureEditor'
import {
  buildStepSummaries, countFilledSteps, groupBySection, nextSortOrder, reorderItems,
  stepColumnsOf, type PlanStep,
} from './safetyPlanEditorLogic'
import { PlanStateHeader } from './PlanStateHeader'
import { StepList } from './StepList'
import { StepDetailPanel } from './StepDetailPanel'
import { MeasureStepPanel } from './MeasureStepPanel'
import { SupportMessageSection } from './SupportMessageSection'
import type { PlanItemPatch } from './planItemPatch'
import type { NewPlanItem } from './AddPlanItemForm'
import './SafetyPlanEditorPanel.css'

interface Props {
  patientId: string
  /**
   * Module dont on édite le plan. Toutes les clés i18n en dérivent : aucun `module_id`
   * n'est écrit en dur, l'éditeur reste utilisable par un autre plan à six étapes.
   */
  moduleId: string
}

export function SafetyPlanEditorPanel({ patientId, moduleId }: Props) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [openSection, setOpenSection] = useState<string | null>(null)
  // Dernier item supprimé, gardé pour l'annulation : aucune suppression n'est définitive
  // sans que le praticien ait eu le moyen de revenir en arrière.
  const [undoable, setUndoable] = useState<SafetyPlanItem | null>(null)

  const fieldsQuery = useQuery(moduleQueries.fields(moduleId))
  const itemsQuery = useQuery(crisisQueries.planItems(patientId))
  const configQuery = useQuery(crisisQueries.planConfig(patientId))

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  // Les étapes viennent de la CONFIGURATION, dans son ordre, avec leurs `field_props` :
  // c'est de là que sortent les colonnes de chaque étape. Aucun numéro d'étape en dur.
  const steps = useMemo<PlanStep[]>(() => {
    const titles = (fieldsQuery.data?.fields ?? []).filter(isStepTitle)
    return [...titles]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(field => ({
        sectionId: field.section_id ?? '',
        label: field.text_code != null ? t(field.text_code) : '',
        props: field.props,
      }))
  }, [fieldsQuery.data, t])

  const summaries = useMemo(() => buildStepSummaries(steps, items), [steps, items])
  const filled = useMemo(() => countFilledSteps(summaries), [summaries])

  // L'étape ouverte suit la première étape déclarée tant que le praticien n'a rien
  // choisi : dérivée au rendu plutôt que synchronisée par un effet.
  const activeSection = openSection ?? steps[0]?.sectionId ?? ''
  const activeStep = useMemo(() => steps.find(s => s.sectionId === activeSection), [steps, activeSection])
  const columns = useMemo(() => stepColumnsOf(activeStep), [activeStep])
  // L'étape 6 se lit en phrases, pas en colonnes. Le choix vient de sa CONFIGURATION,
  // jamais de son numéro : une autre étape peut porter le drapeau sans rien changer ici.
  const isMeasureStep = activeStep?.props['measure_editor'] === 'true'
  const openItems = useMemo(
    () => groupBySection(items).get(activeSection) ?? [],
    [items, activeSection],
  )

  const invalidateItems = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: crisisQueries.planItems(patientId).queryKey })
  }, [queryClient, patientId])

  const onMutationError = useCallback(() => toast.error(t('common.save_error')), [toast, t])

  const saveMutation = useMutation({
    mutationFn: (item: SafetyPlanItemInput) => saveSafetyPlanItem(patientId, item),
    onSuccess: invalidateItems,
    onError: onMutationError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSafetyPlanItem(patientId, id),
    onSuccess: invalidateItems,
    onError: onMutationError,
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ item, direction }: { item: SafetyPlanItem; direction: 'up' | 'down' }) => {
      const byId = new Map(openItems.map(i => [i.id, i]))
      for (const patch of reorderItems(openItems, item.id, direction)) {
        const target = byId.get(patch.id)
        if (target) await saveSafetyPlanItem(patientId, toInput(target, { sort_order: patch.sort_order }))
      }
    },
    onSuccess: invalidateItems,
    onError: onMutationError,
  })

  // Le bouton reste indisponible tant que la config n'est pas lue : sans elle,
  // `created_with_at` partirait à `null` et la date de PREMIÈRE élaboration serait
  // réécrite avec celle du jour. Une revue ne doit jamais effacer une élaboration.
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const config = configQuery.data
      if (config == null) return
      const result = await markPlanReviewedToday(patientId, config)
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crisisQueries.planConfig(patientId).queryKey })
      toast.success(t('common.saved'))
    },
    onError: onMutationError,
  })

  const messageMutation = useMutation({
    mutationFn: async (practitionerMessage: string) => {
      const result = await saveCrisisPlanConfig(patientId, { practitionerMessage })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crisisQueries.planConfig(patientId).queryKey })
      toast.success(t('common.saved'))
    },
    onError: onMutationError,
  })

  // Le formulaire n'exige que le texte : un numéro, un rôle ou une note sont des
  // précisions, pas des conditions.
  const handleAdd = useCallback((draft: NewPlanItem) => {
    saveMutation.mutate({
      section_id: activeSection,
      text: draft.text,
      role: draft.role,
      phone: draft.phone,
      note: draft.note,
      sort_order: nextSortOrder(openItems),
    })
  }, [activeSection, openItems, saveMutation])

  const handlePatch = useCallback((item: SafetyPlanItem, patch: PlanItemPatch) => {
    saveMutation.mutate(toInput(item, patch))
  }, [saveMutation])

  const handleMove = useCallback((item: SafetyPlanItem, direction: 'up' | 'down') => {
    reorderMutation.mutate({ item, direction })
  }, [reorderMutation])

  const handleDelete = useCallback((item: SafetyPlanItem) => {
    setUndoable(item)
    deleteMutation.mutate(item.id)
  }, [deleteMutation])

  const handleDeleteById = useCallback((id: string) => {
    const item = openItems.find(i => i.id === id)
    if (item) handleDelete(item)
  }, [openItems, handleDelete])

  // L'annulation réécrit l'item tel qu'il était, son identifiant compris : ce n'est pas
  // un nouvel item, c'est celui qu'on remet.
  const handleUndo = useCallback(() => {
    if (undoable == null) return
    saveMutation.mutate(toInput(undoable, {}))
    setUndoable(null)
  }, [undoable, saveMutation])

  // Une mesure de l'étape 6 se range dans les mêmes colonnes que tout autre item :
  // `text` porte le verbe et l'objet, `role` qui s'en occupe, `note` l'échéance.
  const handleAddMeasure = useCallback((measure: NewMeasure) => {
    saveMutation.mutate({
      section_id: activeSection,
      text: `${measure.verb} ${measure.what}`.trim(),
      role: measure.who,
      note: measure.until,
      sort_order: nextSortOrder(openItems),
    })
  }, [activeSection, openItems, saveMutation])

  const handleReview = useCallback(() => reviewMutation.mutate(), [reviewMutation])
  const handleSaveMessage = useCallback(
    (message: string) => messageMutation.mutate(message),
    [messageMutation],
  )

  // ── Libellés : toutes les clés dérivent du module courant ─────────────────
  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])
  const formatDay = useCallback(
    (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(i18n.language, DAY_FORMAT),
    [i18n.language],
  )

  const kindOptions = useMemo<SegmentOption<PlanItemKind>[]>(() => [
    { value: 'person', label: lbl('item_kind_person') },
    { value: 'place', label: lbl('item_kind_place') },
  ], [lbl])

  const headerLabels = useMemo(() => ({
    title: lbl('plan_state_title'),
    createdWith: (date: string) => t(`modules.${moduleId}.plan_created_with`, { date }),
    reviewedWith: (date: string) => t(`modules.${moduleId}.plan_reviewed_with`, { date }),
    neverReviewed: lbl('plan_never_reviewed'),
    filled: (count: number, total: number) =>
      t(`modules.${moduleId}.plan_steps_filled`, { count, total }),
    reviewToday: lbl('plan_review_today'),
    readNotMeasured: lbl('plan_read_not_measured'),
  }), [lbl, t, moduleId])

  const columnLabels = useMemo(() => ({
    text: lbl('col_text'),
    kind: lbl('col_kind'),
    role: lbl('col_role'),
    phone: lbl('col_phone'),
    note: columns.kind ? lbl('col_note') : lbl('col_note_contact'),
    actions: lbl('col_actions'),
    noPhone: lbl('item_no_phone'),
    moveUp: lbl('item_move_up'),
    moveDown: lbl('item_move_down'),
    delete: t('common.delete'),
  }), [lbl, t, columns.kind])

  const formLabels = useMemo(() => ({
    title: lbl('add_item_title'),
    text: lbl('col_text'),
    role: lbl('col_role'),
    phone: lbl('col_phone'),
    note: columns.kind ? lbl('col_note') : lbl('col_note_contact'),
    optional: t('common.optional'),
    add: lbl('add_item'),
    cancel: t('common.cancel'),
    patientCanEdit: lbl('patient_can_edit'),
  }), [lbl, t, columns.kind])

  // Mêmes noms de clés que le mobile (P-13) : les deux écrans lisent le même vocabulaire.
  const measureLabels = useMemo(() => ({
    what: lbl('measure_what_label'),
    who: lbl('measure_who_label'),
    whoOptional: t('common.optional'),
    until: lbl('measure_until_label'),
    add: lbl('add_item'),
    cancel: t('common.cancel'),
    temporaryNote: lbl('measure_temporary_note'),
    delete: t('common.delete'),
  }), [lbl, t])

  const supportLabels = useMemo(() => ({
    title: lbl('support_message_title'),
    label: t('patient.crisis_msg_label'),
    placeholder: t('patient.crisis_msg_placeholder'),
    whereShown: lbl('support_message_where'),
    save: t('common.save'),
    anchorsTitle: lbl('anchors_title'),
    anchorsNote: lbl('anchors_local_only'),
  }), [lbl, t])

  const measureVerbs = useMemo(() => readMeasureVerbs(activeStep, t), [activeStep, t])
  // La proposition « Autre » ouvre la saisie libre du verbe. Sa clé dérive du module
  // courant, et c'est la même chaîne que côté mobile (P-13).
  const otherVerbCode = useMemo(() => `modules.${moduleId}.measure_verb_other`, [moduleId])

  const config = configQuery.data

  return (
    <div className="plan-editor">
      {/* Aucune suppression sans annulation possible : le bandeau porte l'action, via
          la prop du primitive plutôt qu'un bouton glissé dans son contenu. */}
      {undoable != null ? (
        <Banner variant="info" action={{ label: t('common.undo'), onClick: handleUndo }}>
          {lbl('item_deleted')}
        </Banner>
      ) : null}

      <PlanStateHeader
        createdWith={config?.createdWithAt != null ? formatDay(config.createdWithAt) : null}
        lastReviewed={config?.lastReviewedAt != null ? formatDay(config.lastReviewedAt) : null}
        filledSteps={filled.filled}
        totalSteps={filled.total}
        labels={headerLabels}
        reviewing={reviewMutation.isPending || config == null}
        onReviewToday={handleReview}
      />

      <div className="plan-editor__columns">
        <StepList
          summaries={summaries}
          openSection={activeSection}
          label={lbl('steps_column_title')}
          emptyLabel={lbl('step_empty_mark')}
          onOpen={setOpenSection}
        />

        {/* Rien tant que la configuration n'est pas là : le formulaire d'ajout écrirait
            un item sans étape. Une étape se choisit, elle ne se devine pas. */}
        {activeStep == null ? null : isMeasureStep ? (
          <MeasureStepPanel
            stepLabel={activeStep.label}
            items={openItems}
            verbs={measureVerbs}
            otherVerbCode={otherVerbCode}
            labels={measureLabels}
            onAdd={handleAddMeasure}
            onDelete={handleDeleteById}
          />
        ) : (
          <StepDetailPanel
            stepLabel={activeStep.label}
            columns={columns}
            items={openItems}
            kindOptions={kindOptions}
            columnLabels={columnLabels}
            formLabels={formLabels}
            emptyLabel={lbl('step_empty_hint')}
            tableLabel={lbl('items_table_label')}
            onPatch={handlePatch}
            onMove={handleMove}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </div>

      <SupportMessageSection
        message={config?.practitionerMessage ?? ''}
        labels={supportLabels}
        saving={messageMutation.isPending}
        onSave={handleSaveMessage}
      />
    </div>
  )
}

const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }

function isStepTitle(field: ContentField): boolean {
  return field.field_type === 'step_title' && field.section_id != null
}

/**
 * Un item complet, prêt pour l'upsert, avec un champ modifié.
 *
 * L'upsert réécrit la ligne entière : reprendre tous les champs évite qu'une correction
 * de numéro efface la note écrite juste avant.
 */
function toInput(item: SafetyPlanItem, patch: PlanItemPatch & { sort_order?: number }): SafetyPlanItemInput {
  return {
    id: item.id,
    section_id: item.section_id,
    text: item.text,
    kind: item.kind,
    role: item.role,
    note: item.note,
    phone: item.phone,
    sort_order: item.sort_order,
    ...patch,
  }
}

/**
 * Propositions de verbe de l'étape 6, lues en clés INDEXÉES (`measure_verb_1`…) sur les
 * `field_props` de l'étape. Le jeu est fixe et vient de la configuration, dans SON
 * ordre : jamais réordonné, filtré ni complété selon les saisies passées du patient.
 *
 * Le code d'une proposition EST sa clé i18n, comme côté mobile (P-13) : les deux écrans
 * désignent donc la même proposition par la même chaîne.
 */
function readMeasureVerbs(
  step: PlanStep | undefined,
  t: (key: string) => string,
): { code: string; label: string }[] {
  if (step == null) return []
  return collectIndexed(step.props, 'measure_verb').map(textCode => ({
    code: textCode,
    label: t(textCode),
  }))
}

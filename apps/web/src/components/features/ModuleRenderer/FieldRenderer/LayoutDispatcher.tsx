import { useTranslation } from 'react-i18next'
import { FIELDLESS_LAYOUTS } from '@kaer/shared'
import {
  ActivityLogLayout,
  CardsLayout,
  ChronoMonthLayout,
  ColumnFormLayout,
  CrisisCompanionLayout,
  DailyCheckinLayout,
  DecisionGridLayout,
  DualRulerLayout,
  ExposureTrackerLayout,
  FallbackLayout,
  FieldsLayout,
  GuidedExerciseLayout,
  MedicationTrackerLayout,
  PatientScenarioLayout,
  PsyEduLayout,
  PsyEduLibraryLayout,
  QuestionnaireLayout,
  SleepJournalLayout,
  SliderDashboardLayout,
  StageWheelLayout,
  StepsLayout,
  TabsLayout,
  TreeSelectorLayout,
  WeightedBalanceLayout,
} from '../layouts'
import { FieldText } from '../fields'
import { ExerciseSafetyField } from '../fields/ExerciseSafetyField'
import { CrisisAnchorsWidget } from '../fields/CrisisAnchorsWidget'
import { CrisisCopingCardsWidget } from '../fields/CrisisCopingCardsWidget'
import { CrisisCommitmentWidget } from '../fields/CrisisCommitmentWidget'
import { DisclaimerBanner } from './DisclaimerBanner'
import { FieldRenderer } from './FieldRenderer'
import { partitionBySection } from './partitionBySection'
import type { FieldRendererProps } from './types'

/**
 * Seule responsabilité : router un `preview_kind` vers son layout.
 * Aucune logique de layout ici — le groupement de fields vit dans
 * `partitionBySection`, le rendu dans les composants `layouts/*`.
 */
export function LayoutDispatcher({ preview_kind, fields, expandedCard, onToggleCard, moduleId }: FieldRendererProps) {
  const { t } = useTranslation()

  if (preview_kind === 'coming_soon') return null
  if (fields.length === 0 && !FIELDLESS_LAYOUTS.has(preview_kind)) return null

  const visibleFields = fields.filter(
    f => f.field_type !== 'module_label' && f.field_type !== 'module_description'
  )
  const footer = visibleFields.find(f => f.field_type === 'footer_note')
  const contentFields = visibleFields.filter(f => f.field_type !== 'footer_note')

  if (preview_kind === 'psyedu') return <PsyEduLayout moduleId={moduleId ?? ''} />
  if (preview_kind === 'psyedu_library') return <PsyEduLibraryLayout />
  if (preview_kind === 'chrono_month') return <ChronoMonthLayout />

  if (preview_kind === 'tabbed') {
    return (
      <TabsLayout
        fields={visibleFields}
        renderInner={(subKind, subFields) => (
          <FieldRenderer
            preview_kind={subKind}
            fields={subFields}
            expandedCard={expandedCard}
            onToggleCard={onToggleCard}
            moduleId={moduleId}
          />
        )}
      />
    )
  }

  if (preview_kind === 'steps' || preview_kind === 'cards') {
    const { sections } = partitionBySection(contentFields)
    if (preview_kind === 'steps') return <StepsLayout sections={sections} footer={footer} t={t} />
    return <CardsLayout sections={sections} expandedCard={expandedCard} onToggle={onToggleCard} t={t} />
  }

  // editable_steps : les fields hors section (footer_note, exercise_safety, widgets VHB-EF)
  // sont rendus APRÈS les étapes, triés par sort_order, pour respecter l'ordre de l'écran mobile.
  if (preview_kind === 'editable_steps') {
    const { sections, unsectioned } = partitionBySection(visibleFields)
    const sorted = [...unsectioned].sort((a, b) => a.sort_order - b.sort_order)
    return (
      <>
        <StepsLayout sections={sections} footer={undefined} t={t} />
        {sorted.map(f => {
          if (f.field_type === 'footer_note') return <FieldText key={f.id} field={f} t={t} />
          if (f.field_type === 'exercise_safety') return <ExerciseSafetyField key={f.id} field={f} />
          // Le praticien n'a pas de mode urgence (réservé au patient mobile) : on rend
          // l'entrée urgence en bandeau danger statique, via DisclaimerBanner (tone danger).
          if (f.field_type === 'crisis_urgency_entry') return <DisclaimerBanner key={f.id} field={f} moduleId={moduleId} />
          if (f.field_type === 'crisis_anchors_preview') return <CrisisAnchorsWidget key={f.id} />
          if (f.field_type === 'crisis_coping_cards_preview') return <CrisisCopingCardsWidget key={f.id} />
          if (f.field_type === 'crisis_commitment_preview') return <CrisisCommitmentWidget key={f.id} />
          return null
        })}
      </>
    )
  }

  if (preview_kind === 'fields') {
    const fieldRows = contentFields.filter(f => f.field_type === 'field_row')
    return <FieldsLayout fields={fieldRows} footer={footer} t={t} />
  }

  if (preview_kind === 'questionnaire') return <QuestionnaireLayout fields={contentFields} footer={footer} t={t} />
  if (preview_kind === 'slider_dashboard') return <SliderDashboardLayout fields={contentFields} footer={footer} t={t} />
  if (preview_kind === 'daily_checkin') return <DailyCheckinLayout fields={contentFields} footer={footer} t={t} />
  if (preview_kind === 'medication_tracker') return <MedicationTrackerLayout fields={contentFields} footer={footer} t={t} />
  if (preview_kind === 'sleep_journal') return <SleepJournalLayout fields={contentFields} t={t} />
  if (preview_kind === 'activity_log') return <ActivityLogLayout fields={contentFields} t={t} />
  if (preview_kind === 'decision_grid') return <DecisionGridLayout fields={contentFields} t={t} />
  if (preview_kind === 'exposure_tracker') return <ExposureTrackerLayout fields={contentFields} t={t} />
  if (preview_kind === 'tree_selector') return <TreeSelectorLayout fields={contentFields} footer={footer} t={t} />
  if (preview_kind === 'column_form') return <ColumnFormLayout fields={contentFields} t={t} />
  if (preview_kind === 'guided_exercise') return <GuidedExerciseLayout fields={contentFields} t={t} />
  if (preview_kind === 'crisis_companion') return <CrisisCompanionLayout fields={contentFields} t={t} moduleId={moduleId ?? ''} />
  if (preview_kind === 'patient_scenario') return <PatientScenarioLayout fields={contentFields} footer={footer} t={t} />
  if (preview_kind === 'stage_wheel') return <StageWheelLayout moduleId={moduleId ?? ''} t={t} />
  if (preview_kind === 'dual_ruler') return <DualRulerLayout moduleId={moduleId ?? ''} t={t} />
  if (preview_kind === 'weighted_balance') return <WeightedBalanceLayout fields={contentFields} moduleId={moduleId ?? ''} t={t} />

  return <FallbackLayout fields={contentFields} footer={footer} t={t} />
}

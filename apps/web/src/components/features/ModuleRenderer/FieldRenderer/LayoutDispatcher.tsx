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
  SafetyPlanLayout,
  SleepJournalLayout,
  SliderDashboardLayout,
  StageWheelLayout,
  StepsLayout,
  TabsLayout,
  TreeSelectorLayout,
  WeightedBalanceLayout,
} from '../layouts'
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

  // safety_plan : aperçu praticien de la vue de consultation « Je suis en crise »
  // (numéros d'urgence, plan de sécurité, « Mes raisons de tenir »). Reflète l'écran
  // patient mobile ; les réponses du patient sont privées → structure + placeholder.
  if (preview_kind === 'safety_plan') {
    const { sections, unsectioned } = partitionBySection(visibleFields)
    return <SafetyPlanLayout sections={sections} unsectioned={unsectioned} moduleId={moduleId} t={t} />
  }

  // `breathing_pacer` : côté patient mobile, un layout interactif (liste de
  // techniques + exercice animé). Côté praticien web, seul l'aperçu descriptif a
  // du sens — on rend les `field_row` comme le layout `fields`.
  if (preview_kind === 'fields' || preview_kind === 'breathing_pacer') {
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

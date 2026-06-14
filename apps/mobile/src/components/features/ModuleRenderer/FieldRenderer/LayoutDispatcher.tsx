// ─── LayoutDispatcher — routage preview_kind → layout ────────────────────────
//
// Seule responsabilité : router un `preview_kind` vers son composant de layout.
// Aucune logique de layout ici — le groupement de fields vit dans
// `partitionBySection`, le rendu dans les composants `layouts/*`.

import type { PreviewKind } from '../../../../services/moduleService'
import { ActivityLogLayout } from '../layouts/ActivityLog'
import { CardsLayout } from '../layouts/Cards'
import { ChronoMonthLayout } from '../layouts/ChronoMonth'
import { ColumnFormLayout } from '../layouts/ColumnForm'
import { CrisisCompanionLayout } from '../layouts/CrisisCompanion'
import { CrisisUrgencyLayout } from '../layouts/CrisisUrgency'
import { DailyCheckinLayout } from '../layouts/DailyCheckin'
import { DecisionGridLayout } from '../layouts/DecisionGrid'
import { EditableStepsLayout } from '../layouts/EditableSteps'
import { ExposureTrackerLayout } from '../layouts/ExposureTracker'
import { FieldsLayout } from '../layouts/Fields'
import { GuidedExerciseLayout } from '../layouts/GuidedExercise'
import { MedicationTrackerLayout } from '../layouts/MedicationTracker'
import { PatientScenarioLayout } from '../layouts/PatientScenario'
import { PsyEduLayout } from '../layouts/PsyEdu'
import { QuestionnaireLayout } from '../layouts/Questionnaire'
import { SleepJournalLayout } from '../layouts/SleepJournal'
import { StepsLayout } from '../layouts/Steps'
import { TabsLayout } from '../layouts/Tabs'
import { TreeSelectorLayout } from '../layouts/TreeSelector'
import { partitionBySection } from './partitionBySection'
import type { FieldRendererProps } from './types'

// Layouts dont le contenu provient d'une autre source que module_content_fields
// (ex. psyedu_topics/psyedu_blocks pour le layout 'psyedu') — peuvent rendre
// avec 0 fields.
const FIELDLESS_LAYOUTS = new Set<PreviewKind>(['psyedu', 'chrono_month'])

export function LayoutDispatcher({ preview_kind, fields, questionnaire, accentColor, patientConfig, moduleId }: FieldRendererProps) {
  if (preview_kind === 'coming_soon') return null
  if (fields.length === 0 && !FIELDLESS_LAYOUTS.has(preview_kind)) return null

  const visibleFields = fields.filter(
    f => f.field_type !== 'module_label' && f.field_type !== 'module_description'
  )
  const footer = visibleFields.find(f => f.field_type === 'footer_note')
  const contentFields = visibleFields.filter(f => f.field_type !== 'footer_note')

  if (preview_kind === 'questionnaire' || preview_kind === 'slider_dashboard') {
    if (questionnaire == null) return null
    return (
      <QuestionnaireLayout
        fields={visibleFields}
        answers={questionnaire.answers}
        onAnswer={questionnaire.onAnswer}
        textInputValues={questionnaire.textInputValues}
        onTextInput={questionnaire.onTextInput}
        accentColor={questionnaire.accentColor}
      />
    )
  }

  if (preview_kind === 'guided_exercise') {
    const { sections, unsectioned } = partitionBySection(contentFields)
    return (
      <GuidedExerciseLayout
        sections={sections}
        uiFields={unsectioned}
        footer={footer}
        accentColor={accentColor}
      />
    )
  }

  if (preview_kind === 'crisis_companion') {
    const { sections, unsectioned } = partitionBySection(contentFields)
    return (
      <CrisisCompanionLayout
        sections={sections}
        uiFields={unsectioned}
        moduleId={moduleId ?? ''}
        accentColor={accentColor}
      />
    )
  }

  if (preview_kind === 'steps' || preview_kind === 'cards') {
    const { sections } = partitionBySection(contentFields)
    if (preview_kind === 'steps') return <StepsLayout sections={sections} footer={footer} />
    return <CardsLayout sections={sections} />
  }

  if (preview_kind === 'fields') {
    const fieldRows = contentFields.filter(f => f.field_type === 'field_row')
    return <FieldsLayout fields={fieldRows} footer={footer} />
  }

  if (preview_kind === 'patient_scenario') {
    return <PatientScenarioLayout fields={visibleFields} footer={footer} patientConfig={patientConfig ?? null} />
  }

  if (preview_kind === 'editable_steps') {
    const { sections, unsectioned } = partitionBySection(contentFields)
    return <EditableStepsLayout sections={sections} uiFields={unsectioned} moduleId={moduleId ?? ''} />
  }

  if (preview_kind === 'daily_checkin') return <DailyCheckinLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  if (preview_kind === 'medication_tracker') return <MedicationTrackerLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  if (preview_kind === 'column_form') return <ColumnFormLayout fields={visibleFields} footer={footer} moduleId={moduleId ?? ''} />
  if (preview_kind === 'tree_selector') return <TreeSelectorLayout fields={visibleFields} footer={footer} moduleId={moduleId ?? ''} />
  if (preview_kind === 'sleep_journal') return <SleepJournalLayout fields={visibleFields} footer={footer} />
  if (preview_kind === 'activity_log') return <ActivityLogLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  if (preview_kind === 'exposure_tracker') return <ExposureTrackerLayout fields={visibleFields} footer={footer} moduleId={moduleId ?? ''} />
  if (preview_kind === 'decision_grid') return <DecisionGridLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  if (preview_kind === 'psyedu') return <PsyEduLayout moduleId={moduleId ?? ''} />
  if (preview_kind === 'tabbed') return <TabsLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  if (preview_kind === 'chrono_month') return <ChronoMonthLayout moduleId={moduleId ?? ''} />
  if (preview_kind === 'crisis_urgency') return <CrisisUrgencyLayout fields={visibleFields} />

  return null
}

import { useTranslation } from 'react-i18next'
import type { ContentField, PreviewKind } from '../../services/moduleService'
import {
  ActivityLogLayout,
  CardsLayout,
  ColumnFormLayout,
  DailyCheckinLayout,
  DecisionGridLayout,
  ExposureTrackerLayout,
  FallbackLayout,
  FieldsLayout,
  Grid2x2Layout,
  GuidedExerciseLayout,
  PatientScenarioLayout,
  PsyEduLayout,
  QuestionnaireLayout,
  SleepJournalLayout,
  StepsLayout,
  TabsLayout,
  TreeSelectorLayout,
} from './layouts'

// Layouts dont le contenu provient d'une autre source que module_content_fields
// (ex. psyedu_topics/psyedu_blocks pour 'psyedu') — peuvent rendre avec 0 fields.
const FIELDLESS_LAYOUTS = new Set<PreviewKind>(['psyedu'])

export interface FieldRendererProps {
  preview_kind: PreviewKind
  fields: ContentField[]
  expandedCard: string | null
  onToggleCard: (id: string) => void
}

export function FieldRenderer({ preview_kind, fields, expandedCard, onToggleCard }: FieldRendererProps) {
  const { t } = useTranslation()

  if (preview_kind === 'coming_soon') return null
  if (fields.length === 0 && !FIELDLESS_LAYOUTS.has(preview_kind)) return null

  if (preview_kind === 'psyedu') {
    return <PsyEduLayout t={t} />
  }

  if (preview_kind === 'tabbed') {
    return (
      <TabsLayout
        fields={visibleFields}
        t={t}
        renderInner={(subKind, subFields) => (
          <FieldRenderer
            preview_kind={subKind}
            fields={subFields}
            expandedCard={expandedCard}
            onToggleCard={onToggleCard}
          />
        )}
      />
    )
  }

  const visibleFields = fields.filter(
    f => f.field_type !== 'module_label' && f.field_type !== 'module_description'
  )
  const footer = visibleFields.find(f => f.field_type === 'footer_note')
  const contentFields = visibleFields.filter(f => f.field_type !== 'footer_note')

  if (preview_kind === 'steps' || preview_kind === 'editable_steps' || preview_kind === 'cards') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    if (preview_kind === 'steps' || preview_kind === 'editable_steps') return <StepsLayout sections={sections} footer={footer} t={t} />
    return (
      <CardsLayout
        sections={sections}
        expandedCard={expandedCard}
        onToggle={onToggleCard}
        t={t}
      />
    )
  }

  if (preview_kind === 'fields') {
    const fieldRows = contentFields.filter(f => f.field_type === 'field_row')
    return <FieldsLayout fields={fieldRows} footer={footer} t={t} />
  }

  if (preview_kind === 'grid2x2') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    return <Grid2x2Layout sections={sections} footer={footer} t={t} />
  }

  if (preview_kind === 'questionnaire') {
    return <QuestionnaireLayout fields={contentFields} footer={footer} t={t} />
  }

  if (preview_kind === 'daily_checkin') {
    return <DailyCheckinLayout fields={contentFields} footer={footer} t={t} />
  }

  if (preview_kind === 'sleep_journal') {
    return <SleepJournalLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'activity_log') {
    return <ActivityLogLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'decision_grid') {
    return <DecisionGridLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'exposure_tracker') {
    return <ExposureTrackerLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'tree_selector') {
    return <TreeSelectorLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'column_form') {
    return <ColumnFormLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'guided_exercise') {
    return <GuidedExerciseLayout fields={contentFields} t={t} />
  }

  if (preview_kind === 'patient_scenario') {
    return <PatientScenarioLayout fields={contentFields} t={t} />
  }

  // Fallback générique pour les preview_kinds restants (timed_tap_exercise…)
  return <FallbackLayout fields={contentFields} footer={footer} t={t} />
}

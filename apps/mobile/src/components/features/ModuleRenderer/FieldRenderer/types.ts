import type { ContentField, PreviewKind } from '../../../../services/moduleService'

/** Interaction passée au layout `questionnaire` en mode patient interactif. */
export interface QuestionnaireInteraction {
  answers: (number | null)[]
  onAnswer: (index: number, value: number) => void
  textInputValues?: Record<string, string>
  onTextInput?: (fieldId: string, value: string) => void
  accentColor?: string
}

export interface FieldRendererProps {
  preview_kind: PreviewKind
  fields: ContentField[]
  /** Provided only for questionnaire layout in patient-side interactive mode. */
  questionnaire?: QuestionnaireInteraction
  /** Accent color for teen mode or module-specific theming. */
  accentColor?: string
  /** Per-patient config from patient_modules.config — required for patient_scenario layout. */
  patientConfig?: Record<string, unknown> | null
  /** Module identifier — required for editable_steps layout to persist plan items. */
  moduleId?: string
}

import type { ContentField, PreviewKind } from '../../../../services/moduleService'

export interface FieldRendererProps {
  preview_kind: PreviewKind
  fields: ContentField[]
  expandedCard: string | null
  onToggleCard: (id: string) => void
  /** Optional: override module key used by disclaimer_banner field. */
  moduleId?: string
}

import type { ContentField } from '../../../services/moduleService'

export interface FieldProps {
  field: ContentField
  t: (key: string) => string
}

import type { ContentField } from '../../../lib/moduleService'

export interface FieldProps {
  field: ContentField
  t: (key: string) => string
}

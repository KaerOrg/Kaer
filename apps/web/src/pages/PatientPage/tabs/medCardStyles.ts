import type { CSSProperties } from 'react'

// Styles relocalisés depuis le branchement medication_side_effects de PatientModulesTab
// (extraction MedicationSideEffectsCard). Définis au niveau module → non recréés au render.
export const MED_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  cursor: 'pointer',
}

export const MED_EFFECT_LABEL_STYLE: CSSProperties = { fontSize: 13, color: '#111827' }

export function medDotStyle(color: string): CSSProperties {
  return { width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }
}

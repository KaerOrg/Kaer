import type { CSSProperties } from 'react'

// Styles de l'éditeur de liste de médicaments (carte praticien medication_adherence).
// Définis au niveau module → non recréés à chaque render (cf. medCardStyles.ts).

export const MED_LIST_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
}

export const MED_LIST_MAIN: CSSProperties = { flex: 1, minWidth: 0 }
export const MED_LIST_NAME: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#111827' }
export const MED_LIST_POSO: CSSProperties = { fontSize: 12, color: '#6B7280' }

export const MED_KIND_BADGE: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: '#6B7280',
  background: '#F3F4F6',
  border: '1px solid #E5E7EB',
  borderRadius: 999,
  padding: '2px 8px',
  flexShrink: 0,
}

export const MED_REMOVE_BTN: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#9CA3AF',
  padding: 4,
  display: 'flex',
}

export const MED_ADD_WRAP: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }
export const MED_ADD_INPUT: CSSProperties = { flex: 1, minWidth: 120, padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }
export const MED_ADD_KINDS: CSSProperties = { display: 'flex', gap: 6 }

export function medKindBtnStyle(active: boolean): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 600,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    border: active ? '1.5px solid #4F46E5' : '1px solid #D1D5DB',
    background: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#4F46E5' : '#6B7280',
  }
}

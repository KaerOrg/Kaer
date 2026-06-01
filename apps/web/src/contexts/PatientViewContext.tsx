import type { ReactNode } from 'react'
import { PatientViewContext } from './patientViewCtx'

export function PatientViewProvider({ patientId, children }: { patientId: string; children: ReactNode }) {
  return <PatientViewContext.Provider value={patientId}>{children}</PatientViewContext.Provider>
}

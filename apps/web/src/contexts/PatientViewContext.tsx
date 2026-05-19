import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

const PatientViewContext = createContext<string | null>(null)

export function PatientViewProvider({ patientId, children }: { patientId: string; children: ReactNode }) {
  return <PatientViewContext.Provider value={patientId}>{children}</PatientViewContext.Provider>
}

/** Retourne le patientId courant, ou null hors contexte. */
export function usePatientView(): string | null {
  return useContext(PatientViewContext)
}

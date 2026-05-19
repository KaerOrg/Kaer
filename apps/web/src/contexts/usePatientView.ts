import { useContext } from 'react'
import { PatientViewContext } from './patientViewCtx'

/** Retourne le patientId courant, ou null hors contexte. */
export function usePatientView(): string | null {
  return useContext(PatientViewContext)
}

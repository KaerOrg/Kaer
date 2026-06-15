import type { ComponentProps } from 'react'
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

// Métadonnées d'un statut de prise (pris / partiel / non pris) — pastilles neutres
// fournies par la base (MDR : faits déclarés, aucune gravité clinique encodée).
export interface StatusMeta {
  value: string
  label: string
  icon: IconName
  color: string
  bgColor: string
}

// Motif de non-prise déclaré. `linksModule` (optionnel) ouvre un autre module
// quand le motif l'implique (ex. 'side_effect' → medication_side_effects).
export interface ReasonMeta {
  value: string
  label: string
  icon: IconName
  linksModule: string | null
}

// État de prise d'une molécule pour le jour courant.
export interface IntakeState {
  id: string
  status: string
  reason: string | null
}

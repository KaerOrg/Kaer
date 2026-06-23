import React from 'react'
import { Radio, type RadioOption } from '@ui/Radio'

// Aperçu statique (preview praticien) d'un champ booléen : pilules [Non] [Oui]
// rendues via `ui/Radio variant="pills"` en lecture seule (`readonly`), « Non »
// figé actif. Zéro style pill ad hoc — le primitive du design system porte
// l'habillage. Labels FR en dur : vignette illustrative non patiente (comme les
// autres widgets d'aperçu, ex. RadioWidget « Pris »/« Partiel »).
const OPTIONS: readonly RadioOption[] = [
  { value: 'non', label: 'Non' },
  { value: 'oui', label: 'Oui' },
]

export function BooleanWidget() {
  return <Radio variant="pills" options={OPTIONS} value="non" readonly />
}

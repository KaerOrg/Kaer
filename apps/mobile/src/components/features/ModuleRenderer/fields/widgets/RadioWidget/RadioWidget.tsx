import React from 'react'
import { StatusBadge } from '../../../../../ui/StatusBadge'
import type { StatusBadgeVariant } from '../../../../../ui/StatusBadge'

type Variant = 'ok' | 'partial' | 'miss'

interface Config {
  label: string
  variant: StatusBadgeVariant
  icon: string
}

// Aperçu d'un champ radio (preview praticien) : pastille de statut rendue via le
// primitive `ui/StatusBadge` — couleurs issues des tokens du thème, zéro hex en dur.
const VARIANTS: Record<Variant, Config> = {
  ok:      { label: 'Pris',     variant: 'success', icon: '✓' },
  partial: { label: 'Partiel',  variant: 'warning', icon: '◐' },
  miss:    { label: 'Non pris', variant: 'danger',  icon: '✕' },
}

interface Props { variant: string }

function isVariant(v: string): v is Variant {
  return v in VARIANTS
}

export function RadioWidget({ variant }: Props) {
  const { label, variant: tone, icon } = isVariant(variant) ? VARIANTS[variant] : VARIANTS.ok
  return <StatusBadge variant={tone} label={label} icon={icon} />
}

import { Check, Minus, X } from 'lucide-react'

type Variant = 'ok' | 'partial' | 'miss'

interface Config {
  label: string
  className: string
  Icon: typeof Check
}

const VARIANTS: Record<Variant, Config> = {
  ok:      { label: 'Pris',     className: 'fw-radio--ok',      Icon: Check },
  partial: { label: 'Partiel',  className: 'fw-radio--partial', Icon: Minus },
  miss:    { label: 'Non pris', className: 'fw-radio--miss',    Icon: X     },
}

interface Props { variant: string }

export function RadioWidget({ variant }: Props) {
  const { label, className, Icon } = VARIANTS[(variant as Variant)] ?? VARIANTS.ok
  return (
    <span className={`fw-radio ${className}`}>
      <Icon size={10} />
      {label}
    </span>
  )
}

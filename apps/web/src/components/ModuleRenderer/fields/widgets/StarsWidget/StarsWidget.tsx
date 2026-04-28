import { Star } from 'lucide-react'

interface Props { spec: string }

export function StarsWidget({ spec }: Props) {
  const max = Number(spec.split(':')[1] ?? 5)
  const filled = Math.ceil(max / 2)
  return (
    <div className="fw-stars">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < filled ? 'fw-star--on' : 'fw-star--off'}
          fill={i < filled ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

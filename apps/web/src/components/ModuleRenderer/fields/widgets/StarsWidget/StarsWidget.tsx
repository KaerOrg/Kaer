import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props { spec: string }

export function StarsWidget({ spec }: Props) {
  const max = Number(spec.split(':')[1] ?? 5)
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(0)
  const filled = hovered || selected
  return (
    <div className="fw-stars">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < filled ? 'fw-star--on' : 'fw-star--off'}
          fill={i < filled ? 'currentColor' : 'none'}
          style={{ cursor: 'pointer' }}
          onClick={() => setSelected(i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
        />
      ))}
    </div>
  )
}

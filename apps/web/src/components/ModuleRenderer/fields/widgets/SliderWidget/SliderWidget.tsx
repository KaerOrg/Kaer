import { useState } from 'react'

interface Props { spec: string }

export function SliderWidget({ spec }: Props) {
  const [, rawMin, rawMax, unit] = spec.split(':')
  const min = Number(rawMin ?? 0)
  const max = Number(rawMax ?? 10)
  const mid = Math.round((min + max) / 2)
  const [value, setValue] = useState(mid)
  return (
    <div className="fw-slider">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="fw-slider__track"
      />
      <span className="fw-slider__val">{value}{unit ? ' ' + unit : ''}</span>
    </div>
  )
}

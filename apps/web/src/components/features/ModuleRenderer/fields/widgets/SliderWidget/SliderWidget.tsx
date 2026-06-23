import { useState } from 'react'

interface Props { min: number; max: number; unit?: string }

export function SliderWidget({ min, max, unit }: Props) {
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

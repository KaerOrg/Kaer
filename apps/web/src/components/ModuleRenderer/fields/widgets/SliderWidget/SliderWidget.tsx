interface Props { spec: string }

export function SliderWidget({ spec }: Props) {
  const [, rawMin, rawMax, unit] = spec.split(':')
  const min = Number(rawMin ?? 0)
  const max = Number(rawMax ?? 10)
  const mid = Math.round((min + max) / 2)
  return (
    <div className="fw-slider">
      <input type="range" min={min} max={max} defaultValue={mid} disabled className="fw-slider__track" />
      <span className="fw-slider__val">{mid}{unit ? ' ' + unit : ''}</span>
    </div>
  )
}

import { useState } from 'react'

export function CheckboxWidget() {
  const [checked, setChecked] = useState(false)
  return (
    <label className="fw-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => setChecked(e.target.checked)}
        className="fw-checkbox__input"
      />
      <span className="fw-checkbox__label">{checked ? 'Accompli' : 'Non accompli'}</span>
    </label>
  )
}

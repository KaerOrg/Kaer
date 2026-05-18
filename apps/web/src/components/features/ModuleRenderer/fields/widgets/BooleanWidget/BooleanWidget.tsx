import { useState } from 'react'

export function BooleanWidget() {
  const [value, setValue] = useState<boolean | null>(null)
  return (
    <div className="fw-boolean">
      <button
        type="button"
        className={`fw-boolean__option${value === false ? ' fw-boolean__option--active' : ''}`}
        onClick={() => setValue(false)}
      >
        Non
      </button>
      <button
        type="button"
        className={`fw-boolean__option${value === true ? ' fw-boolean__option--active' : ''}`}
        onClick={() => setValue(true)}
      >
        Oui
      </button>
    </div>
  )
}

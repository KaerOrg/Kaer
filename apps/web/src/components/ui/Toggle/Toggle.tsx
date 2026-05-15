import './Toggle.css'

interface ToggleProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const pill = (
    <span className={`toggle ${checked ? 'toggle--on' : ''}`} aria-hidden="true">
      <span className="toggle__knob" />
    </span>
  )

  if (label !== undefined) {
    return (
      <label className={`toggle-field ${disabled ? 'toggle-field--disabled' : ''}`}>
        <input
          type="checkbox"
          className="toggle-field__checkbox"
          checked={checked}
          onChange={e => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        {pill}
        <span className="toggle-field__label">{label}</span>
      </label>
    )
  }

  return pill
}

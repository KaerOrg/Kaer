import { forwardRef, useCallback, useRef, type ChangeEvent } from 'react'
import { Clock, X } from 'lucide-react'
import './TimePicker.css'
import type { TimePickerProps } from './TimePicker.types'

const DEFAULT_ACCENT = 'var(--color-primary)'

/**
 * Saisie d'une heure « HH:MM » — pendant web du `TimePicker` mobile. Enrobe un
 * `<input type="time">` natif (le navigateur fournit le picker) avec libellé, icône,
 * indice et croix d'effacement optionnelle.
 *
 * Supporte les deux modes : contrôlé (`value` + `onChange`, parité mobile) et non
 * contrôlé (`defaultValue` + `ref` lu au submit, conforme à la règle « input lu au
 * submit → useRef »). Le `ref` est transféré à l'`<input>`.
 */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
  { label, value, defaultValue, onChange, icon, clearable = false, clearLabel, accent = DEFAULT_ACCENT, hint, step, disabled = false, id, className, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement | null>(null)
  const testId = rest['data-testid']

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
    [onChange],
  )

  const handleClear = useCallback(() => {
    if (value === undefined && innerRef.current) innerRef.current.value = ''
    onChange?.('')
  }, [value, onChange])

  // En mode contrôlé une valeur existe si value est non vide ; sinon on s'appuie sur defaultValue.
  const hasValue = value !== undefined ? value.length > 0 : (defaultValue?.length ?? 0) > 0

  return (
    <div className={`time-picker${className ? ` ${className}` : ''}`}>
      {label != null || (clearable && hasValue) ? (
        <div className="time-picker__label-row">
          {label != null ? <span className="time-picker__label" id={id ? `${id}-label` : undefined}>{label}</span> : <span />}
          {clearable && hasValue && !disabled ? (
            <button
              type="button"
              className="time-picker__clear"
              onClick={handleClear}
              aria-label={clearLabel}
              data-testid={testId ? `${testId}-clear` : undefined}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="time-picker__field" style={{ color: hasValue ? accent : 'var(--color-text-muted)' }}>
        <span className="time-picker__icon" aria-hidden>{icon ?? <Clock size={18} />}</span>
        <input
          ref={setRefs}
          type="time"
          className="time-picker__input"
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          step={step}
          disabled={disabled}
          id={id}
          aria-labelledby={label != null && id ? `${id}-label` : undefined}
          {...rest}
        />
      </div>

      {hint ? <span className="time-picker__hint">{hint}</span> : null}
    </div>
  )
})

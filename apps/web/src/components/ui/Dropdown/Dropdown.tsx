import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { filterOptions, groupSections } from './dropdownFilter'
import type { DropdownProps } from './Dropdown.types'
import '../InputField/InputField.css'
import './Dropdown.css'

/**
 * Liste déroulante unique du design system : combobox à autocomplétion,
 * paramétrable `mode="single"` (une valeur, ferme à la sélection) ou
 * `mode="multiple"` (plusieurs valeurs, liste ouverte). Remplace l'ancien
 * `<select>` natif et `MultiSelectAutocomplete`.
 *
 * `searchable` (défaut `true`) active le filtre à la frappe (insensible
 * casse/accents via `lib/search`). En `mode="multiple"`, le composant n'affiche
 * pas les valeurs retenues : le parent rend ses propres `Chip onRemove`.
 */
export function Dropdown(props: DropdownProps) {
  const {
    options,
    label,
    ariaLabel,
    error,
    placeholder,
    emptyText,
    searchable = true,
    groupLabels,
    compact = false,
    disabled = false,
    id,
  } = props
  const isMultiple = props.mode === 'multiple'

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId)
  const listboxId = `${inputId}-listbox`

  // Filtrage à la frappe : seulement si `searchable` et liste ouverte. Sinon, toutes
  // les options (le `<select>` non recherchable se contente d'afficher la liste).
  const filtered = useMemo(
    () => (searchable && open ? filterOptions(options, query) : options.slice()),
    [searchable, open, options, query],
  )
  const sections = useMemo(() => groupSections(filtered, groupLabels), [filtered, groupLabels])
  // Options navigables au clavier (les `disabled` sont ignorées).
  const navigable = useMemo(() => filtered.filter(opt => !opt.disabled), [filtered])
  const activeValue =
    activeIndex >= 0 && activeIndex < navigable.length ? navigable[activeIndex].value : undefined

  // Libellé de la valeur sélectionnée (mode single), affiché quand la liste est fermée.
  const selectedLabel = useMemo(() => {
    if (isMultiple) return ''
    return options.find(opt => opt.value === props.value)?.label ?? ''
  }, [isMultiple, options, props])

  const closeList = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
    setQuery('')
  }, [])

  // Fermeture au clic en dehors du composant.
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeList()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open, closeList])

  const handleSelect = useCallback(
    (value: string) => {
      if (isMultiple) {
        props.onToggle(value)
        setQuery('')
        setActiveIndex(-1)
      } else {
        props.onChange(value)
        closeList()
      }
    },
    [isMultiple, props, closeList],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!open) setOpen(true)
        setActiveIndex(prev => (navigable.length === 0 ? -1 : (prev + 1) % navigable.length))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(prev =>
          navigable.length === 0 ? -1 : (prev - 1 + navigable.length) % navigable.length,
        )
      } else if (event.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < navigable.length) {
          event.preventDefault()
          handleSelect(navigable[activeIndex].value)
        }
      } else if (event.key === 'Escape') {
        closeList()
      }
    },
    [open, navigable, activeIndex, handleSelect, closeList],
  )

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setOpen(true)
    setActiveIndex(-1)
  }, [])

  // Champ recherchable : le focus ouvre la liste (affordance de saisie). Champ non
  // recherchable : on n'ouvre PAS au focus, sinon le focus (ouvre) puis le clic (bascule)
  // d'un même clic souris se neutralisent et la liste reste fermée.
  const handleFocus = useCallback(() => {
    if (!disabled && searchable) setOpen(true)
  }, [disabled, searchable])

  // Clic : recherchable → garantit l'ouverture (rouvre après une sélection) ; non
  // recherchable → bascule (seul moyen d'ouvrir, faute de saisie).
  const handleClick = useCallback(() => {
    if (disabled) return
    setOpen(prev => (searchable ? true : !prev))
  }, [disabled, searchable])

  // Texte affiché : la saisie quand on filtre (liste ouverte + recherchable), sinon le
  // libellé retenu en single (rien en multiple, où les chips vivent chez le parent).
  const inputValue = searchable && open ? query : isMultiple ? '' : selectedLabel

  // Vrai si l'option est retenue : cochée (multiple) ou égale à la valeur (single).
  const isOptionSelected = useCallback(
    (value: string) => (isMultiple ? props.selectedValues.has(value) : props.value === value),
    [isMultiple, props],
  )

  const inputClass = [
    'dropdown__input',
    compact ? 'dropdown__input--sm' : '',
    error ? 'dropdown__input--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="input-field">
      {label ? (
        <div className="input-field__label-row">
          <label className="input-field__label" htmlFor={inputId}>
            {label}
          </label>
        </div>
      ) : null}

      <div className="dropdown" ref={rootRef}>
        <div className="dropdown__field">
          <input
            id={inputId}
            type="text"
            role="combobox"
            className={inputClass}
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={!searchable}
            aria-label={label ? undefined : ariaLabel ?? placeholder}
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete={searchable ? 'list' : 'none'}
            onChange={handleChange}
            onFocus={handleFocus}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          />
          <ChevronDown
            size={16}
            className={`dropdown__chevron${open ? ' dropdown__chevron--open' : ''}`}
            aria-hidden="true"
          />
        </div>

        {open ? (
          <ul
            className="dropdown__list"
            id={listboxId}
            role="listbox"
            aria-multiselectable={isMultiple || undefined}
          >
            {filtered.length === 0 ? (
              <li className="dropdown__empty" role="presentation">
                {emptyText}
              </li>
            ) : (
              sections.map(section => (
                <li key={section.group} role="presentation">
                  {section.label ? (
                    <span className="dropdown__group-label">{section.label}</span>
                  ) : null}
                  <ul className="dropdown__group" role="presentation">
                    {section.options.map(option => {
                      const isSelected = isOptionSelected(option.value)
                      return (
                        <li
                          key={option.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled}
                          className={`dropdown__option${
                            option.value === activeValue ? ' dropdown__option--active' : ''
                          }${option.disabled ? ' dropdown__option--disabled' : ''}`}
                          onPointerDown={
                            option.disabled
                              ? undefined
                              : e => {
                                  e.preventDefault()
                                  handleSelect(option.value)
                                }
                          }
                        >
                          <span className="dropdown__check" aria-hidden="true">
                            {isSelected ? <Check size={14} /> : null}
                          </span>
                          {option.label}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  )
}

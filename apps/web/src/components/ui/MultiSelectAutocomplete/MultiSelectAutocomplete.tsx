import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { normalizeSearch } from '../../../lib/search'
import type { AutocompleteOption, MultiSelectAutocompleteProps } from './MultiSelectAutocomplete.types'
import './MultiSelectAutocomplete.css'

/** Une section de la liste : un en-tête de groupe + ses options filtrées. */
interface OptionSection {
  group: string
  label: string | null
  options: AutocompleteOption[]
}

/**
 * Combobox multi-sélection à autocomplétion (primitive du design system).
 * Présentationnelle : la liste des options, la sélection et la bascule sont
 * pilotées par le parent. L'utilisateur tape pour filtrer, clique (ou Entrée)
 * pour cocher/décocher ; la liste reste ouverte pour enchaîner les choix.
 *
 * Pour afficher les valeurs retenues, le parent rend ses propres puces
 * supprimables (`ui/Chip` avec `onRemove`) — ce composant ne gère que la saisie.
 */
export function MultiSelectAutocomplete({
  options,
  selectedValues,
  onToggle,
  placeholder,
  ariaLabel,
  groupLabels,
  emptyText,
}: MultiSelectAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  // Options filtrées par la saisie (insensible à la casse et aux accents),
  // aplaties dans l'ordre d'affichage pour la navigation clavier.
  const filtered = useMemo(() => {
    const needle = normalizeSearch(query)
    if (!needle) return options.slice()
    return options.filter(opt => normalizeSearch(opt.label).includes(needle))
  }, [options, query])

  // Regroupement des options filtrées par `group`, dans l'ordre d'apparition.
  const sections = useMemo<OptionSection[]>(() => {
    const byGroup = new Map<string, OptionSection>()
    const order: OptionSection[] = []
    for (const opt of filtered) {
      const group = opt.group ?? ''
      let section = byGroup.get(group)
      if (!section) {
        section = { group, label: groupLabels?.[group] ?? null, options: [] }
        byGroup.set(group, section)
        order.push(section)
      }
      section.options.push(opt)
    }
    return order
  }, [filtered, groupLabels])

  const closeList = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
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

  const handleToggle = useCallback(
    (value: string) => {
      onToggle(value)
      setQuery('')
      setActiveIndex(-1)
    },
    [onToggle],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!open) setOpen(true)
        setActiveIndex(prev => (filtered.length === 0 ? -1 : (prev + 1) % filtered.length))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(prev => (filtered.length === 0 ? -1 : (prev - 1 + filtered.length) % filtered.length))
      } else if (event.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          event.preventDefault()
          handleToggle(filtered[activeIndex].value)
        }
      } else if (event.key === 'Escape') {
        closeList()
      }
    },
    [open, filtered, activeIndex, handleToggle, closeList],
  )

  const activeValue = activeIndex >= 0 && activeIndex < filtered.length ? filtered[activeIndex].value : undefined

  return (
    <div className="ms-autocomplete" ref={rootRef}>
      <div className="ms-autocomplete__field">
        <input
          type="text"
          role="combobox"
          className="ms-autocomplete__input"
          value={query}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <ChevronDown size={16} className="ms-autocomplete__chevron" aria-hidden="true" />
      </div>

      {open ? (
        <ul className="ms-autocomplete__list" id={listboxId} role="listbox" aria-multiselectable="true">
          {filtered.length === 0 ? (
            <li className="ms-autocomplete__empty" role="presentation">{emptyText}</li>
          ) : (
            sections.map(section => (
              <li key={section.group} role="presentation">
                {section.label ? (
                  <span className="ms-autocomplete__group-label">{section.label}</span>
                ) : null}
                <ul className="ms-autocomplete__group" role="presentation">
                  {section.options.map(option => {
                    const isSelected = selectedValues.has(option.value)
                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        className={`ms-autocomplete__option${
                          option.value === activeValue ? ' ms-autocomplete__option--active' : ''
                        }`}
                        onPointerDown={e => { e.preventDefault(); handleToggle(option.value) }}
                      >
                        <span className="ms-autocomplete__check" aria-hidden="true">
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
  )
}

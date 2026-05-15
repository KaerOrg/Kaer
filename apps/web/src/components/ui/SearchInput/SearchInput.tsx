import { Search } from 'lucide-react'
import type { SearchInputProps } from './SearchInput.types'
import './SearchInput.css'

export function SearchInput({ value, onChange, placeholder, ariaLabel }: SearchInputProps) {
  return (
    <div className="search-input">
      <Search size={16} className="search-input__icon" aria-hidden="true" />
      <input
        type="search"
        className="search-input__input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  )
}

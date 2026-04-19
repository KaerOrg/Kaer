import { useEffect, useRef, useState } from 'react'
import { LogOut, UserPen } from 'lucide-react'
import './ProfileDropdown.css'
import type { ProfileDropdownProps } from './ProfileDropdown.types'

export function ProfileDropdown({ initials, name, email, professionalTitle, onEditProfile, onLogout }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="profile-dropdown" ref={ref}>
      <button className="profile-dropdown__avatar" onClick={() => setOpen(o => !o)} aria-label="Menu profil">
        {initials}
      </button>

      {open ? (
        <div className="profile-dropdown__menu">
          <div className="profile-dropdown__info">
            <div className="profile-dropdown__name">{name || '—'}</div>
            <div className="profile-dropdown__email">{email}</div>
            {professionalTitle ? <div className="profile-dropdown__title">{professionalTitle}</div> : null}
          </div>
          <div className="profile-dropdown__divider" />
          <button className="profile-dropdown__item" onClick={() => { setOpen(false); onEditProfile() }}>
            <UserPen size={15} />
            Modifier le profil
          </button>
          <button className="profile-dropdown__item profile-dropdown__item--danger" onClick={onLogout}>
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  )
}

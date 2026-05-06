import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, UserPen, Globe } from 'lucide-react'
import { SUPPORTED, LANG_LABELS, LANG_FLAGS, type SupportedLang } from '../../../i18n'
import { useAuthStore } from '../../../store/authStore'
import './ProfileDropdown.css'
import type { ProfileDropdownProps } from './ProfileDropdown.types'

export function ProfileDropdown({ initials, name, email, professionalTitle, onEditProfile, onLogout }: ProfileDropdownProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const updateLanguagePreference = useAuthStore(s => s.updateLanguagePreference)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLang = i18n.language.slice(0, 2) as SupportedLang

  return (
    <div className="profile-dropdown" ref={ref}>
      <button className="profile-dropdown__avatar" onClick={() => setOpen(o => !o)} aria-label={t('nav.profile_menu')}>
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

          <div className="profile-dropdown__lang">
            <span className="profile-dropdown__lang-label">
              <Globe size={13} />
              {t('nav.language')}
            </span>
            <select
              className="profile-dropdown__lang-select"
              value={currentLang}
              onChange={e => void updateLanguagePreference(e.target.value as SupportedLang)}
            >
              {(SUPPORTED as readonly SupportedLang[]).map(lang => (
                <option key={lang} value={lang}>
                  {LANG_FLAGS[lang]}  {LANG_LABELS[lang]}
                </option>
              ))}
            </select>
          </div>

          <div className="profile-dropdown__divider" />
          <button className="profile-dropdown__item" onClick={() => { setOpen(false); onEditProfile() }}>
            <UserPen size={15} />
            {t('nav.edit_profile')}
          </button>
          <button className="profile-dropdown__item profile-dropdown__item--danger" onClick={onLogout}>
            <LogOut size={15} />
            {t('nav.logout')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

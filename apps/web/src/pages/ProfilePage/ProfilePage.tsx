import { useState, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Mail, Briefcase, UserCircle2, MapPin, Phone } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../contexts/ToastContext'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Dropdown, type DropdownOption } from '../../components/ui/Dropdown'
import { getInitials } from '../../components/features/Layout/Layout.utils'
import { MfaSettingsCard } from '../../components/features/MfaSettingsCard'
import { uploadPractitionerAvatar, savePractitionerAvatarUrl } from '../../services/avatarService'
import { referenceQueries } from '../../hooks/queries'
import './ProfilePage.css'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { practitioner, updateProfile, updateAvatar } = useAuthStore()
  const toast = useToast()

  const [name, setName] = useState(practitioner?.name ?? '')
  const [title, setTitle] = useState(practitioner?.professional_title ?? '')
  const professionalTitlesQuery = useQuery(referenceQueries.professionalTitles())
  const professionalTitles = useMemo(
    () => professionalTitlesQuery.data ?? [],
    [professionalTitlesQuery.data]
  )

  const titleLangKey = i18n.language.startsWith('fr') ? 'label_fr' : 'label_en'
  const titleMatch = professionalTitles.find(pt => pt.code === practitioner?.professional_title)
  const titleLabel = titleMatch ? titleMatch[titleLangKey] : practitioner?.professional_title
  const titleOptions = useMemo<DropdownOption[]>(
    () => professionalTitles.map(pt => ({ value: pt.code, label: pt[titleLangKey] })),
    [professionalTitles, titleLangKey]
  )
  const [address, setAddress] = useState(practitioner?.address ?? '')
  const [phone, setPhone] = useState(practitioner?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const initials = getInitials(practitioner?.name || practitioner?.email || '?')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const err = await updateProfile(name, title, address, phone)
    setSaving(false)
    if (err) {
      toast.error(err)
    } else {
      toast.success(t('profile_modal.success'))
    }
  }

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !practitioner) return
    setAvatarUploading(true)
    try {
      const url = await uploadPractitionerAvatar(practitioner.id, file)
      await savePractitionerAvatarUrl(practitioner.id, url)
      updateAvatar(url)
    } catch {
      toast.error(t('profile_modal.avatar_error'))
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [practitioner, updateAvatar, t, toast])

  return (
    <Layout>
      <h1 className="profile-page__title">{t('profile_modal.title')}</h1>

      <div className="profile-page__grid">
        <div className="profile-page__card">
          <div
            className="profile-page__avatar-wrapper"
            onClick={handleAvatarClick}
            role="button"
            aria-label={t('profile_modal.avatar_change_label')}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleAvatarClick()}
          >
            {practitioner?.avatar_url ? (
              <img src={practitioner.avatar_url} alt="" className="profile-page__avatar-photo" />
            ) : (
              <div className="profile-page__avatar">{initials}</div>
            )}
            <div className="profile-page__avatar-badge">✎</div>
            {avatarUploading ? <div className="profile-page__avatar-overlay" /> : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div className="profile-page__info-rows">
            <div className="profile-page__info-row">
              <UserCircle2 size={16} className="profile-page__info-icon" />
              <span className="profile-page__info-value">{practitioner?.name || '—'}</span>
            </div>
            <div className="profile-page__info-row">
              <Mail size={16} className="profile-page__info-icon" />
              <span className="profile-page__info-value">{practitioner?.email}</span>
            </div>
            {titleLabel ? (
              <div className="profile-page__info-row">
                <Briefcase size={16} className="profile-page__info-icon" />
                <span className="profile-page__info-value">{titleLabel}</span>
              </div>
            ) : null}
            {practitioner?.phone ? (
              <div className="profile-page__info-row">
                <Phone size={16} className="profile-page__info-icon" />
                <span className="profile-page__info-value">{practitioner.phone}</span>
              </div>
            ) : null}
            {practitioner?.address ? (
              <div className="profile-page__info-row">
                <MapPin size={16} className="profile-page__info-icon" />
                <span className="profile-page__info-value">{practitioner.address}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="profile-page__form-card">
          <h2 className="profile-page__form-title">{t('profile_modal.edit_section')}</h2>
          <form onSubmit={handleSave} className="profile-page__form">
            <div className="profile-page__form-row">
              <InputField
                label={t('profile_modal.full_name_label')}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dr. Marie Dupont"
                required
              />
              <Dropdown
                clearable
                clearLabel={t('common.clear_selection')}
                label={t('profile_modal.title_label')}
                value={title}
                onChange={setTitle}
                options={titleOptions}
                placeholder={t('profile_modal.title_placeholder')}
              />
            </div>
            <div className="profile-page__form-row">
              <InputField
                label={t('profile_modal.phone_label')}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+33 6 00 00 00 00"
              />
              <InputField
                label={t('profile_modal.address_label')}
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="12 rue de la Paix, 75001 Paris"
              />
            </div>
            <div className="profile-page__actions">
              <Button type="submit" loading={saving}>{t('common.save')}</Button>
            </div>
          </form>
        </div>
      </div>

      <div className="profile-page__security">
        <MfaSettingsCard />
      </div>
    </Layout>
  )
}

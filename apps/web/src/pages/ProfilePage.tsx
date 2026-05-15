import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Briefcase, UserCircle2, MapPin, Phone } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../contexts/ToastContext'
import { Layout } from '../components/features/Layout'
import { Button } from '../components/ui/Button'
import { InputField } from '../components/ui/InputField'
import { SelectField } from '../components/ui/SelectField/SelectField'
import { getInitials } from '../components/features/Layout/Layout.utils'
import { uploadPractitionerAvatar, savePractitionerAvatarUrl } from '../services/avatarService'
import { fetchProfessionalTitles } from '../services/authService'
import type { ProfessionalTitle } from '../lib/database.types'
import './ProfilePage.css'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { practitioner, updateProfile, updateAvatar } = useAuthStore()
  const toast = useToast()

  const [name, setName] = useState(practitioner?.name ?? '')
  const [title, setTitle] = useState(practitioner?.professional_title ?? '')
  const [professionalTitles, setProfessionalTitles] = useState<ProfessionalTitle[]>([])

  useEffect(() => {
    void fetchProfessionalTitles().then(setProfessionalTitles)
  }, [])

  const titleLangKey = i18n.language.startsWith('fr') ? 'label_fr' : 'label_en'
  const titleMatch = professionalTitles.find(pt => pt.code === practitioner?.professional_title)
  const titleLabel = titleMatch ? titleMatch[titleLangKey] : practitioner?.professional_title
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
  }, [practitioner, updateAvatar, t])

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
              <SelectField
                label={t('profile_modal.title_label')}
                value={title}
                onChange={e => setTitle(e.target.value)}
              >
                <option value="">{t('profile_modal.title_placeholder')}</option>
                {professionalTitles.map(pt => (
                  <option key={pt.code} value={pt.code}>
                    {i18n.language.startsWith('fr') ? pt.label_fr : pt.label_en}
                  </option>
                ))}
              </SelectField>
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
    </Layout>
  )
}

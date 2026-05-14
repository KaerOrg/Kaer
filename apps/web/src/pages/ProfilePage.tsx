import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Briefcase, UserCircle2, MapPin, Phone } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { InputField } from '../components/InputField'
import { getInitials } from '../components/Layout/Layout.utils'
import './ProfilePage.css'

export function ProfilePage() {
  const { t } = useTranslation()
  const { practitioner, updateProfile } = useAuthStore()

  const [name, setName] = useState(practitioner?.name ?? '')
  const [title, setTitle] = useState(practitioner?.professional_title ?? '')
  const [address, setAddress] = useState(practitioner?.address ?? '')
  const [phone, setPhone] = useState(practitioner?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const initials = getInitials(practitioner?.name || practitioner?.email || '?')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const err = await updateProfile(name, title, address, phone)
    setSaving(false)
    if (err) { setError(err); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <Layout>
      <h1 className="profile-page__title">{t('profile_modal.title')}</h1>

      <div className="profile-page__grid">
        <div className="profile-page__card">
          <div className="profile-page__avatar">{initials}</div>
          <div className="profile-page__info-rows">
            <div className="profile-page__info-row">
              <UserCircle2 size={16} className="profile-page__info-icon" />
              <span className="profile-page__info-value">{practitioner?.name || '—'}</span>
            </div>
            <div className="profile-page__info-row">
              <Mail size={16} className="profile-page__info-icon" />
              <span className="profile-page__info-value">{practitioner?.email}</span>
            </div>
            {practitioner?.professional_title ? (
              <div className="profile-page__info-row">
                <Briefcase size={16} className="profile-page__info-icon" />
                <span className="profile-page__info-value">{practitioner.professional_title}</span>
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
              <InputField
                label={t('profile_modal.title_label')}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Infirmier en pratique avancée"
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
            {error ? <div className="profile-page__error">{error}</div> : null}
            {success ? <div className="profile-page__success">{t('profile_modal.success')}</div> : null}
            <div className="profile-page__actions">
              <Button type="submit" loading={saving}>{t('common.save')}</Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../Button'
import { InputField } from '../../InputField'
import './ProfileModal.css'
import type { ProfileModalProps } from './ProfileModal.types'

export function ProfileModal({ initialName, initialTitle, onSave, onClose }: ProfileModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)
  const [title, setTitle] = useState(initialTitle)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const err = await onSave(name, title)
    setSaving(false)
    if (err) { setError(err); return }
    setSuccess(true)
    setTimeout(() => { setSuccess(false); onClose() }, 1500)
  }

  return (
    <div className="profile-modal__overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <h2 className="profile-modal__title">{t('profile_modal.title')}</h2>
        <form onSubmit={handleSave} className="profile-modal__form">
          <InputField label={t('profile_modal.full_name_label')} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Marie Dupont" required />
          <InputField label={t('profile_modal.title_label')} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Infirmier en pratique avancée" />
          {error ? <div className="profile-modal__error">{error}</div> : null}
          {success ? <div className="profile-modal__success">{t('profile_modal.success')}</div> : null}
          <div className="profile-modal__actions">
            <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

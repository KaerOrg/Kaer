import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lightbulb } from 'lucide-react'
import { Button } from '../../ui/Button'
import { InputField } from '../../ui/InputField'
import { Modal } from '../../ui/Modal'
import { useToast } from '../../../contexts/ToastContext'
import { submitThemeSuggestion, THEME_SUGGESTION_MAX } from '../../../services/themeSuggestionService'
import './ThemeSuggestionButton.css'

/**
 * Bouton + modale permettant au praticien de suggérer un thème de fiche manquant.
 * Auto-suffisant : appelle le service (Edge Function send-theme-suggestion) et
 * notifie via toast. Logistique éditoriale, sans donnée patient (hors MDR).
 */
export function ThemeSuggestionButton() {
  const { t } = useTranslation()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const close = () => {
    if (saving) return
    setOpen(false)
    setText('')
  }

  const submit = async () => {
    const value = text.trim()
    if (!value) return
    setSaving(true)
    const { ok } = await submitThemeSuggestion(value)
    setSaving(false)
    if (ok) {
      toast.success(t('patient.psycho_suggest_success'))
      setOpen(false)
      setText('')
    } else {
      toast.error(t('patient.psycho_suggest_error'))
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Lightbulb size={14} />
        {t('patient.psycho_suggest_button')}
      </Button>

      {open ? (
        <Modal
          title={t('patient.psycho_suggest_title')}
          icon={<Lightbulb size={20} />}
          onClose={close}
          maxWidth={520}
        >
          <p className="theme-suggest__intro">{t('patient.psycho_suggest_intro')}</p>
          <InputField
            multiline
            label={t('patient.psycho_suggest_label')}
            rows={4}
            maxLength={THEME_SUGGESTION_MAX}
            placeholder={t('patient.psycho_suggest_placeholder')}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="theme-suggest__actions">
            <Button size="sm" loading={saving} disabled={!text.trim()} onClick={submit}>
              {t('patient.psycho_suggest_submit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              {t('common.cancel')}
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

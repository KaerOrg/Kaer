import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import type { useRimEditor } from '../hooks/useRimEditor'

type RimEditor = ReturnType<typeof useRimEditor>

interface Props {
  rim: RimEditor
  /** Ferme la modale d'actions — appelée après un enregistrement réussi ou une annulation. */
  onClose: () => void
}

/**
 * Onglet Configuration du module RIM. Le formulaire (scénario alternatif requis +
 * scénario d'origine) est aussi le geste de déverrouillage : en mode `unlock`, valider
 * crée le module ; en mode `edit`, met à jour la config. Ferme la modale au succès.
 */
export function RimConfigPanel({ rim, onClose }: Props) {
  const { t } = useTranslation()

  const handleConfirm = useCallback(async () => {
    const ok = await rim.confirm()
    if (ok) onClose()
  }, [rim, onClose])

  const isUnlock = rim.mode === 'unlock'

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">
        {isUnlock ? t('patient.rim_write_unlock') : t('patient.rim_write_edit')}
      </p>
      <div className="module-editor-fields module-editor-fields--tight">
        <InputField
          label={t('patient.rim_alt_label')}
          multiline
          required
          rows={5}
          placeholder={t('patient.rim_alt_placeholder')}
          value={rim.alternative}
          onChange={e => rim.setAlternative(e.target.value)}
        />
        <InputField
          label={t('patient.rim_orig_label')}
          multiline
          rows={3}
          placeholder={t('patient.rim_orig_placeholder')}
          value={rim.original}
          onChange={e => rim.setOriginal(e.target.value)}
        />
      </div>
      {rim.error && <p className="psycho-card-picker__error">{rim.error}</p>}
      <div className="psycho-card-picker__actions">
        <Button size="sm" loading={rim.saving} onClick={handleConfirm}>
          {isUnlock ? t('patient.rim_btn_unlock') : t('patient.rim_btn_save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}

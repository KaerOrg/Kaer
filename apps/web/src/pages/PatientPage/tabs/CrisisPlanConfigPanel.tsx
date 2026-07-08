import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import type { useCrisisPlanEditor } from '../hooks/useCrisisPlanEditor'

type CrisisEditor = ReturnType<typeof useCrisisPlanEditor>

interface Props {
  crisis: CrisisEditor
  /** Ferme la modale d'actions — appelée après un enregistrement réussi ou une annulation. */
  onClose: () => void
}

/**
 * Onglet Configuration du module Plan de crise : message du praticien affiché au
 * patient (« Mes raisons de tenir »). Édition en state local amorcée du serveur ;
 * « Enregistrer » persiste puis ferme la modale, « Annuler » ferme sans enregistrer.
 */
export function CrisisPlanConfigPanel({ crisis, onClose }: Props) {
  const { t } = useTranslation()

  const handleSave = useCallback(async () => {
    const ok = await crisis.saveEditor()
    if (ok) onClose()
  }, [crisis, onClose])

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('patient.crisis_editor_title')}</p>
      <div className="module-editor-fields">
        <InputField
          label={t('patient.crisis_msg_label')}
          multiline
          rows={3}
          placeholder={t('patient.crisis_msg_placeholder')}
          value={crisis.config.practitionerMessage}
          onChange={e => crisis.setConfig(prev => ({ ...prev, practitionerMessage: e.target.value }))}
        />
      </div>
      <div className="psycho-card-picker__actions">
        <Button size="sm" loading={crisis.saving} onClick={handleSave}>
          {t('patient.crisis_btn_save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}

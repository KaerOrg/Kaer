import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import type { useDefusionConfigEditor } from '../hooks/useDefusionConfigEditor'
import './DefusionConfigPanel.css'

type DefusionEditor = ReturnType<typeof useDefusionConfigEditor>

interface Props {
  defusionConfig: DefusionEditor
  onClose: () => void
}

/**
 * Onglet Configuration de « Décrocher d'une pensée » : un toggle par technique
 * proposée. Garde : au moins une technique active (le dernier toggle actif est
 * verrouillé). Enregistrement explicite (Annuler / Enregistrer).
 */
export function DefusionConfigPanel({ defusionConfig, onClose }: Props) {
  const { t } = useTranslation()
  const { enabled, saving, toggle, save } = defusionConfig

  const isWord = enabled.includes('word_repetition')
  const isDistancing = enabled.includes('linguistic_distancing')
  const onlyOne = enabled.length === 1

  const toggleWord = useCallback(() => toggle('word_repetition'), [toggle])
  const toggleDistancing = useCallback(() => toggle('linguistic_distancing'), [toggle])
  const handleSave = useCallback(async () => {
    if (await save()) onClose()
  }, [save, onClose])

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('modules.cognitive_saturation.config_title')}</p>
      <p className="med-config-hint">{t('modules.cognitive_saturation.config_hint')}</p>

      <div className="defusion-config__toggles">
        <Toggle
          label={t('modules.cognitive_saturation.technique_word_repetition_name')}
          checked={isWord}
          disabled={isWord && onlyOne}
          onChange={toggleWord}
        />
        <Toggle
          label={t('modules.cognitive_saturation.technique_linguistic_distancing_name')}
          checked={isDistancing}
          disabled={isDistancing && onlyOne}
          onChange={toggleDistancing}
        />
      </div>

      <div className="psycho-card-picker__actions">
        <Button variant="ghost" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
        <Button size="sm" loading={saving} onClick={handleSave}>{t('common.save')}</Button>
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { Tooltip } from '@ui/Tooltip'
import type { useBAActivitiesEditor } from '../hooks/useBAActivitiesEditor'
import { BAActivityAddForm } from './BAActivityAddForm'

type BAEditor = ReturnType<typeof useBAActivitiesEditor>

interface Props {
  baList: BAEditor
  /** Ferme la modale d'actions. L'enregistrement est implicite (à chaque ajout/retrait). */
  onClose: () => void
}

/**
 * Onglet Configuration du module Activation comportementale : activités co-construites
 * (domaine de vie + phrase « valeur » du patient, protocole BATD-R). Enregistrement
 * implicite ; « Terminé » ferme la modale.
 */
export function BAActivitiesConfigPanel({ baList, onClose }: Props) {
  const { t } = useTranslation()

  // Libellé i18n de chaque domaine, indexé par id de field (lookup O(1) dans la liste).
  const domainLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of baList.domains) map.set(d.id, t(d.textCode))
    return map
  }, [baList.domains, t])

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('modules.behavioral_activation.config_title')}</p>
      <p className="med-config-hint">{t('modules.behavioral_activation.config_hint')}</p>

      {baList.activities.length === 0 ? (
        <p className="med-empty">{t('modules.behavioral_activation.config_empty')}</p>
      ) : (
        <div className="med-list">
          {baList.activities.map(activity => (
            <div key={activity.id} className="med-row">
              <div className="med-row__main">
                <div className="med-row__name">{activity.label}</div>
                {activity.value_text ? <div className="med-row__poso">{activity.value_text}</div> : null}
              </div>
              <Chip
                label={domainLabelById.get(activity.domain_id) ?? activity.domain_id}
                tone="neutral"
                size="sm"
              />
              <Tooltip label={t('common.delete')}>
                <button
                  type="button"
                  className="med-row__remove"
                  aria-label={t('common.delete')}
                  onClick={() => baList.removeActivity(activity.id)}
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      <BAActivityAddForm domains={baList.domains} onAdd={baList.addActivity} />

      <div className="psycho-card-picker__actions med-actions">
        <Button size="sm" loading={baList.saving} onClick={onClose}>
          {t('common.done')}
        </Button>
      </div>
    </div>
  )
}

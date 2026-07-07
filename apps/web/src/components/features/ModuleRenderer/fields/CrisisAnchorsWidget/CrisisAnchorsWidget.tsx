import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Heart, ImageOff } from 'lucide-react'
import { usePatientView } from '../../../../../contexts/usePatientView'
import { crisisQueries } from '../../../../../hooks/queries'
import './CrisisAnchorsWidget.css'

export function CrisisAnchorsWidget() {
  const { t } = useTranslation()
  const patientId = usePatientView()
  const { data: config } = useQuery(crisisQueries.planConfig(patientId))
  const practitionerMessage = config?.practitionerMessage ?? ''

  return (
    <div className="crisis-anchors-widget">
      <div className="crisis-anchors-widget__header">
        <Heart size={16} className="crisis-anchors-widget__icon" />
        <span className="crisis-anchors-widget__title">{t('modules.crisis_plan.anchors_title')}</span>
      </div>
      <p className="crisis-anchors-widget__subtitle">{t('modules.crisis_plan.anchors_subtitle')}</p>

      {practitionerMessage && (
        <div className="crisis-anchors-widget__practitioner-msg">
          <span>{practitionerMessage}</span>
        </div>
      )}

      <div className="crisis-anchors-widget__photos">
        {[0, 1, 2].map(i => (
          <div key={i} className="crisis-anchors-widget__photo-slot">
            <ImageOff size={20} className="crisis-anchors-widget__photo-icon" />
          </div>
        ))}
      </div>
      <p className="crisis-anchors-widget__info">{t('modules.crisis_plan.anchors_preview_info')}</p>

      <div className="crisis-anchors-widget__phrase">
        <span className="crisis-anchors-widget__phrase-label">{t('modules.crisis_plan.anchor_phrase_label')}</span>
        <span className="crisis-anchors-widget__phrase-empty">{t('modules.crisis_plan.anchors_preview_info')}</span>
      </div>
    </div>
  )
}

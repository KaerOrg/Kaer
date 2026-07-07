import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Handshake } from 'lucide-react'
import { usePatientView } from '../../../../../contexts/usePatientView'
import { crisisQueries } from '../../../../../hooks/queries'
import './CrisisCommitmentWidget.css'

export function CrisisCommitmentWidget() {
  const { t } = useTranslation()
  const patientId = usePatientView()
  const { data: config } = useQuery(crisisQueries.planConfig(patientId))
  const commitmentPhrase = config?.commitmentPhrase ?? ''
  const phrase = commitmentPhrase || t('modules.crisis_plan.commitment_phrase_default')

  return (
    <div className="crisis-commitment-widget">
      <div className="crisis-commitment-widget__header">
        <Handshake size={16} className="crisis-commitment-widget__icon" />
        <span className="crisis-commitment-widget__title">{t('modules.crisis_plan.commitment_title')}</span>
      </div>
      <p className="crisis-commitment-widget__phrase">{phrase}</p>
      {!commitmentPhrase && (
        <p className="crisis-commitment-widget__info">{t('modules.crisis_plan.commitment_not_configured')}</p>
      )}
    </div>
  )
}

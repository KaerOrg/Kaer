import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { usePatientView } from '../../../../../contexts/usePatientView'
import { crisisQueries } from '../../../../../hooks/queries'
import './CrisisCopingCardsWidget.css'

export function CrisisCopingCardsWidget() {
  const { t } = useTranslation()
  const patientId = usePatientView()
  const { data: config } = useQuery(crisisQueries.planConfig(patientId))
  const cards = config?.copingCards ?? []

  return (
    <div className="crisis-coping-cards-widget">
      <div className="crisis-coping-cards-widget__header">
        <CreditCard size={16} className="crisis-coping-cards-widget__icon" />
        <span className="crisis-coping-cards-widget__title">{t('modules.crisis_plan.coping_cards_title')}</span>
      </div>
      <p className="crisis-coping-cards-widget__subtitle">{t('modules.crisis_plan.coping_cards_subtitle')}</p>

      {cards.length === 0 ? (
        <p className="crisis-coping-cards-widget__empty">{t('modules.crisis_plan.coping_cards_empty')}</p>
      ) : (
        <div className="crisis-coping-cards-widget__list">
          {cards.map(card => (
            <div key={card.id} className="crisis-coping-cards-widget__card">
              <div className="crisis-coping-cards-widget__row">
                <span className="crisis-coping-cards-widget__row-label">{t('modules.crisis_plan.coping_card_thought')}</span>
                <span className="crisis-coping-cards-widget__thought">{card.thought}</span>
              </div>
              <div className="crisis-coping-cards-widget__row">
                <span className="crisis-coping-cards-widget__row-label">{t('modules.crisis_plan.coping_card_response')}</span>
                <span className="crisis-coping-cards-widget__response">{card.response}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

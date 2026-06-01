import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'
import { usePatientView } from '../../../../../contexts/usePatientView'
import { fetchCrisisPlanConfig, type CrisisPlanCopingCard } from '../../../../../services/crisisPlanService'
import './CrisisCopingCardsWidget.css'

export function CrisisCopingCardsWidget() {
  const { t } = useTranslation()
  const patientId = usePatientView()
  const [cards, setCards] = useState<CrisisPlanCopingCard[]>([])

  useEffect(() => {
    if (!patientId) return
    fetchCrisisPlanConfig(patientId)
      .then(cfg => setCards(cfg.copingCards))
      .catch(() => {})
  }, [patientId])

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

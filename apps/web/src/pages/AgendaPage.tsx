import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
import { Layout } from '../components/Layout'
import './AgendaPage.css'

export function AgendaPage() {
  const { t } = useTranslation()

  return (
    <Layout>
      <div className="agenda-page">
        <div className="agenda-page__header">
          <h1 className="agenda-page__title">{t('agenda.title')}</h1>
          <p className="agenda-page__subtitle">{t('agenda.subtitle')}</p>
        </div>

        <div className="agenda-page__placeholder">
          <CalendarDays size={48} className="agenda-page__placeholder-icon" />
          <p className="agenda-page__placeholder-text">{t('agenda.coming_soon')}</p>
        </div>
      </div>
    </Layout>
  )
}

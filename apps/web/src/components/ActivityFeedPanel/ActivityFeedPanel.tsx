import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, BellOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getActivityFeed } from '../../services/notificationRoutineService'
import type { ActivityFeedEvent } from '../../lib/database.types'
import './ActivityFeedPanel.css'

interface Props {
  practitionerId: string
}

function formatRelativeTime(iso: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return t('notifications.feed_minutes').replace('{{n}}', String(minutes || 1))
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('notifications.feed_hours').replace('{{n}}', String(hours))
  const days = Math.floor(hours / 24)
  return t('notifications.feed_days').replace('{{n}}', String(days))
}

export function ActivityFeedPanel({ practitionerId }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<ActivityFeedEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastSeenRef = useRef<string | null>(null)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getActivityFeed(practitionerId)
      setEvents(data)
      if (data.length > 0 && data[0].created_at !== lastSeenRef.current) {
        setHasNew(true)
      }
    } finally {
      setLoading(false)
    }
  }, [practitionerId])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  const handleOpen = useCallback(() => {
    setOpen(prev => {
      if (!prev && events.length > 0) {
        lastSeenRef.current = events[0].created_at
        setHasNew(false)
      }
      return !prev
    })
  }, [events])

  // Ferme le panel en cliquant à l'extérieur
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="activity-feed" ref={panelRef}>
      <button
        type="button"
        className="activity-feed__btn"
        onClick={handleOpen}
        aria-label={t('notifications.activity_feed_label')}
      >
        <Bell size={18} />
        {hasNew && <span className="activity-feed__badge" />}
      </button>

      {open && (
        <div className="activity-feed__panel">
          <div className="activity-feed__header">
            <span className="activity-feed__header-title">{t('notifications.activity_feed_title')}</span>
            <button
              type="button"
              className="activity-feed__close"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
            >
              <X size={16} />
            </button>
          </div>

          <div className="activity-feed__body">
            {loading ? (
              <p className="activity-feed__empty">{t('common.loading')}</p>
            ) : events.length === 0 ? (
              <p className="activity-feed__empty">{t('notifications.feed_empty')}</p>
            ) : (
              <ul className="activity-feed__list">
                {events.map(event => (
                  <li key={event.id} className="activity-feed__item">
                    <BellOff size={14} className="activity-feed__item-icon" />
                    <div className="activity-feed__item-body">
                      <span className="activity-feed__item-text">
                        {t('notifications.feed_paused_event').replace(
                          '{{module}}',
                          String((event.metadata as { module_type?: string }).module_type ?? '')
                        )}
                      </span>
                      <span className="activity-feed__item-time">
                        {formatRelativeTime(event.created_at, t)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

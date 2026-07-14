import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { buildDayMarkers, minutesToClock } from '@kaer/shared'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS } from '../../../../../lib/chronoAnchors'
import { resolveChronoIcon } from '../../../../../lib/chronoIcons'
import './ChronoJournalPreview.css'

interface Props {
  /** Libellé du CTA « Noter mes repères du jour » (repris de la config column_form). */
  ctaLabel?: string
}

// Heure de base d'exemple par repère (minutes) + variation déterministe par jour →
// une frise réaliste pour l'aperçu praticien. AUCUNE donnée patient réelle.
// Aligné sur ChronoMonthLayout (web) pour un aperçu cohérent d'un module à l'autre.
const EXAMPLE_BASE: Record<string, number> = {
  wake_time: 420,
  first_meal: 480,
  main_activity: 630,
  light: 750,
  last_meal: 1170,
  bedtime: 1380,
}
const JITTER = [0, 20, -15] as const
const EXAMPLE_DAY_COUNT = 3
const HOUR_TICKS = [0, 6, 12, 18, 24] as const

/**
 * Aperçu praticien du Journal chronobiologique : reproduit la frise 24 h du mobile
 * (une carte par jour, un marqueur couleur + icône par repère posé à l'heure exacte)
 * sur des DONNÉES D'EXEMPLE. Couleurs et icônes viennent de la source unique
 * `CHRONO_ANCHORS` (parité web ≡ mobile). Conforme MDR 2017/745 : horaires bruts.
 */
export function ChronoJournalPreview({ ctaLabel }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const days = useMemo(() => {
    const now = new Date()
    return Array.from({ length: EXAMPLE_DAY_COUNT }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const values: Record<string, string> = {}
      for (const key of CHRONO_ANCHOR_KEYS) {
        values[key] = minutesToClock(EXAMPLE_BASE[key] + JITTER[i % JITTER.length])
      }
      const label = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })
      return { key: `day-${i}`, label, markers: buildDayMarkers(values) }
    })
  }, [locale])

  return (
    <div className="cj-preview">
      {/* Légende figée : pastille couleur + icône + libellé court par repère. */}
      <div className="cj-legend">
        {CHRONO_ANCHORS.map(anchor => {
          const Icon = resolveChronoIcon(anchor.iconName)
          return (
            <span key={anchor.key} className="cj-legend__item">
              <span className="cj-legend__pill" style={{ background: anchor.color }}>
                <Icon size={10} color="#fff" />
              </span>
              {t(anchor.labelCode)}
            </span>
          )
        })}
      </div>

      {days.map(day => (
        <Card key={day.key} header={{ title: day.label }} className="cj-day">
          <div className="cj-frise">
            <div className="cj-frise__rail" />
            {day.markers.map(m => {
              const Icon = resolveChronoIcon(m.iconName)
              return (
                <span
                  key={m.key}
                  className="cj-frise__marker"
                  style={{ left: `${m.leftPct}%`, background: m.color }}
                  title={`${t(m.labelCode)} · ${m.time}`}
                >
                  <Icon size={10} color="#fff" />
                </span>
              )
            })}
          </div>
          <div className="cj-frise__scale">
            {HOUR_TICKS.map(h => (
              <span key={h}>{`${h}h`}</span>
            ))}
          </div>
        </Card>
      ))}

      {ctaLabel ? (
        <Button type="button" variant="primary" fullWidth disabled icon={<Plus size={16} />}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  )
}

import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, LineChart } from '../../../ui/Chart'
import './MedicationSideEffectsPreview.css'

type TimeRange = '7J' | '1M' | '6M' | '1A'

interface Props {
  /** Couleur d'accent du module, injectée par le panneau parent. */
  accentColor?: string
}

const DEFAULT_ACCENT = '#8B5CF6'

const SYMPTOM_KEYS = ['sedation', 'akathisia', 'tremors', 'dry_mouth', 'sleep', 'nausea'] as const

// Palette catégorielle des séries du graphique de démonstration (une couleur
// distincte par symptôme) — donnée de data-viz, pas du theming.
const SYMPTOM_COLORS: Record<string, string> = {
  sedation:  '#8B5CF6',
  akathisia: '#EC4899',
  tremors:   '#F97316',
  dry_mouth: '#14B8A6',
  sleep:     '#3B82F6',
  nausea:    '#F59E0B',
}

const DEMO_DATA: Record<TimeRange, Record<string, (number | null)[]>> = {
  '7J': {
    sedation:  [3, 2, null, 2, 1, 1, 0],
    akathisia: [2, 2, 1, null, 1, 0, 0],
    tremors:   [1, 2, 2, 1, null, 1, 0],
    dry_mouth: [3, 3, 2, 2, 1, null, 0],
    sleep:     [2, 1, 2, null, 1, 1, 0],
    nausea:    [3, 2, null, 2, 1, 0, 1],
  },
  '1M': {
    sedation:  [1,1,2,1,null,1,1,0,1,1,null,1,1,1,0,1,null,1,0,1,1,1,null,0,1,1,null,1,0,1],
    akathisia: [0,1,1,0,null,1,0,1,1,null,0,1,0,1,0,null,0,0,1,0,null,1,0,0,1,null,0,0,0,1],
    tremors:   [1,2,1,1,null,0,1,1,1,null,1,1,0,1,1,null,0,0,1,0,1,null,0,1,0,null,0,1,0,0],
    dry_mouth: [2,1,1,2,null,1,1,1,0,1,null,1,0,1,1,null,0,1,0,1,null,1,0,0,1,null,0,0,1,0],
    sleep:     [1,2,1,2,null,2,1,1,null,1,1,2,1,1,null,1,0,1,0,0,0,null,1,0,0,null,0,0,0,1],
    nausea:    [1,0,1,null,1,1,0,1,null,0,0,1,0,null,0,1,0,0,null,0,1,0,null,0,0,null,0,0,0,1],
  },
  '6M': {
    sedation:  [3,3,2,3,2,2,3,2,2,1,2,1,2,1,1,2,1,0,1,1,0,0,1,0,0,0],
    akathisia: [2,2,2,1,2,1,1,2,1,1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,null,0],
    tremors:   [1,2,1,2,1,1,2,1,0,1,1,0,1,0,0,1,0,0,1,0,0,null,0,0,0,0],
    dry_mouth: [3,2,3,2,2,3,2,1,2,1,1,2,1,0,1,1,0,1,0,0,1,0,0,null,0,0],
    sleep:     [2,2,3,1,2,2,1,2,1,1,1,2,0,1,1,0,1,0,1,0,0,0,null,0,0,0],
    nausea:    [3,2,2,3,2,1,2,1,2,1,0,1,1,0,1,0,0,1,0,0,null,0,0,0,0,0],
  },
  '1A': {
    sedation:  [3,3,3,2,2,2,1,1,1,1,0,0],
    akathisia: [2,2,2,1,1,2,1,0,1,0,0,0],
    tremors:   [1,2,1,2,1,1,0,1,0,0,null,0],
    dry_mouth: [3,2,3,2,2,1,1,1,0,0,1,0],
    sleep:     [2,2,2,1,2,1,1,0,1,0,0,0],
    nausea:    [3,2,2,2,1,1,1,0,0,1,0,0],
  },
}

const DEMO_STREAK: Record<TimeRange, number> = { '7J': 5, '1M': 21, '6M': 21, '1A': 21 }

const RANGES: TimeRange[] = ['7J', '1M', '6M', '1A']

export function MedicationSideEffectsPreview({ accentColor = DEFAULT_ACCENT }: Props) {
  const { t } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1M')
  const [showAll, setShowAll] = useState(false)

  const visibleKeys = showAll ? SYMPTOM_KEYS : SYMPTOM_KEYS.slice(0, 3)
  const streak = DEMO_STREAK[range]
  const rootStyle = { '--mse-accent': accentColor } as CSSProperties

  return (
    <div className="mse-preview" style={rootStyle}>

      <div className="mse-preview__streak-row">
        <div className="mse-preview__streak-badge">
          <span className="mse-preview__streak-icon">🔥</span>
          <span className="mse-preview__streak-count">
            {streak} {t('modules.medication_side_effects.streak_days')}
          </span>
        </div>
        <span className="mse-preview__streak-hint">
          {t('modules.medication_side_effects.streak_hint')}
        </span>
      </div>

      <div className="mse-preview__ranges">
        {RANGES.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={r === range ? 'mse-preview__range mse-preview__range--active' : 'mse-preview__range'}
          >
            {r}
          </button>
        ))}
      </div>

      {visibleKeys.map(key => (
        <div key={key}>
          <div className="mse-preview__symptom-head">
            <span className="mse-preview__symptom-label">
              {t(`modules.medication_side_effects.effect_${key}_label`)}
            </span>
            <span className="mse-preview__symptom-scale">0 – 3</span>
          </div>
          {range === '7J'
            ? <BarChart data={DEMO_DATA[range][key]} color={SYMPTOM_COLORS[key]} />
            : <LineChart data={DEMO_DATA[range][key]} color={SYMPTOM_COLORS[key]} />
          }
        </div>
      ))}

      <button type="button" onClick={() => setShowAll(v => !v)} className="mse-preview__toggle">
        {showAll
          ? `↑ ${t('common.show_less')}`
          : `+ ${t('common.show_more')}`
        }
      </button>

      <div>
        <p className="mse-preview__events-title">
          {t('modules.medication_side_effects.events_section')}
        </p>
        <div className="mse-preview__event">
          <span className="mse-preview__event-date">14/04/2026</span>
          <span className="mse-preview__event-label">
            {t('modules.medication_side_effects.preview_event_label')}
          </span>
        </div>
      </div>

      <p className="mse-preview__demo-note">
        {t('modules.medication_side_effects.preview_demo_note')}
      </p>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, LineChart } from '../../../ui/Chart'

type TimeRange = '7J' | '1M' | '6M' | '1A'

const MODULE_COLOR = '#8B5CF6'

const SYMPTOM_KEYS = ['sedation', 'akathisia', 'tremors', 'dry_mouth', 'sleep', 'nausea'] as const

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

export function MedicationSideEffectsPreview() {
  const { t } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1M')
  const [showAll, setShowAll] = useState(false)

  const visibleKeys = showAll ? SYMPTOM_KEYS : SYMPTOM_KEYS.slice(0, 3)
  const streak = DEMO_STREAK[range]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: `${MODULE_COLOR}15`, borderRadius: 20,
          padding: '4px 10px', border: `1px solid ${MODULE_COLOR}30`,
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: MODULE_COLOR }}>
            {streak} {t('modules.medication_side_effects.streak_days')}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {t('modules.medication_side_effects.streak_hint')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {(['7J', '1M', '6M', '1A'] as TimeRange[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
              background: r === range ? MODULE_COLOR : 'transparent',
              color: r === range ? 'var(--color-surface)' : 'var(--color-text-muted)',
              border: `1px solid ${r === range ? MODULE_COLOR : 'var(--color-border)'}`,
              cursor: 'pointer',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {visibleKeys.map(key => {
        const color = SYMPTOM_COLORS[key]
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {t(`modules.medication_side_effects.effect_${key}_label`)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>0 – 3</span>
            </div>
            {range === '7J'
              ? <BarChart data={DEMO_DATA[range][key]} color={color} />
              : <LineChart data={DEMO_DATA[range][key]} color={color} />
            }
          </div>
        )
      })}

      <button
        onClick={() => setShowAll(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, color: MODULE_COLOR,
          padding: 0, alignSelf: 'flex-start',
        }}
      >
        {showAll
          ? `↑ ${t('common.show_less')}`
          : `+ ${t('common.show_more')}`
        }
      </button>

      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 6px' }}>
          {t('modules.medication_side_effects.events_section')}
        </p>
        <div style={{ borderLeft: `3px solid ${MODULE_COLOR}`, paddingLeft: 8, paddingTop: 2, paddingBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: MODULE_COLOR }}>14/04/2026</span>
          <span style={{ fontSize: 11, color: 'var(--color-text)', marginLeft: 6 }}>
            {t('modules.medication_side_effects.preview_event_label')}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
        {t('modules.medication_side_effects.preview_demo_note')}
      </p>
    </div>
  )
}

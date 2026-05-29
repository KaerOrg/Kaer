import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type TimeRange = '7J' | '1M' | '6M' | '1A'

const MODULE_COLOR = '#8B5CF6'

const ALL_SYMPTOMS = [
  { key: 'sedation',  label: 'Somnolence',        color: '#8B5CF6' },
  { key: 'akathisia', label: 'Akathisie',          color: '#EC4899' },
  { key: 'tremors',   label: 'Tremblements',       color: '#F97316' },
  { key: 'dry_mouth', label: 'Sécheresse buccale', color: '#14B8A6' },
  { key: 'sleep',     label: 'Sommeil',            color: '#3B82F6' },
  { key: 'nausea',    label: 'Nausées',            color: '#F59E0B' },
]

// Jeux de données démo par période — patterns intentionnellement différents
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
    // tendance à la baisse — traitement qui fait effet progressivement
    sedation:  [3,3,2,3,2,2,3,2,2,1,2,1,2,1,1,2,1,0,1,1,0,0,1,0,0,0],
    akathisia: [2,2,2,1,2,1,1,2,1,1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,null,0],
    tremors:   [1,2,1,2,1,1,2,1,0,1,1,0,1,0,0,1,0,0,1,0,0,null,0,0,0,0],
    dry_mouth: [3,2,3,2,2,3,2,1,2,1,1,2,1,0,1,1,0,1,0,0,1,0,0,null,0,0],
    sleep:     [2,2,3,1,2,2,1,2,1,1,1,2,0,1,1,0,1,0,1,0,0,0,null,0,0,0],
    nausea:    [3,2,2,3,2,1,2,1,2,1,0,1,1,0,1,0,0,1,0,0,null,0,0,0,0,0],
  },
  '1A': {
    // longue tendance à la baisse sur 12 mois
    sedation:  [3,3,3,2,2,2,1,1,1,1,0,0],
    akathisia: [2,2,2,1,1,2,1,0,1,0,0,0],
    tremors:   [1,2,1,2,1,1,0,1,0,0,null,0],
    dry_mouth: [3,2,3,2,2,1,1,1,0,0,1,0],
    sleep:     [2,2,2,1,2,1,1,0,1,0,0,0],
    nausea:    [3,2,2,2,1,1,1,0,0,1,0,0],
  },
}

const DEMO_STREAK: Record<TimeRange, number> = { '7J': 5, '1M': 21, '6M': 21, '1A': 21 }

// ── Bar chart (7J) ────────────────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: (number | null)[]; color: string }) {
  const MAX = 3
  const H = 48
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: H }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
        >
          <div style={{
            height: v !== null ? `${Math.max((v / MAX) * 100, v > 0 ? 10 : 4)}%` : '4%',
            background: v !== null && v > 0 ? color : '#E5E7EB',
            borderRadius: '3px 3px 1px 1px',
            opacity: v === null ? 0.2 : 1,
          }} />
        </div>
      ))}
    </div>
  )
}

// ── Line chart (1M / 6M / 1A) ────────────────────────────────────────────────

function MiniLineChart({ data, color }: { data: (number | null)[]; color: string }) {
  const W = 220
  const H = 48
  const MAX = 3

  const xScale = (i: number) => (i / (data.length - 1)) * W
  const yScale = (v: number) => H - (v / MAX) * H * 0.9 - 2

  const segments: string[][] = []
  let current: string[] = []
  data.forEach((v, i) => {
    if (v === null) {
      if (current.length >= 2) segments.push(current)
      current = []
    } else {
      current.push(`${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`)
    }
  })
  if (current.length >= 2) segments.push(current)

  const filled = data.map((v, i) => ({ v, i })).filter(d => d.v !== null) as { v: number; i: number }[]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
      {[1, 2, 3].map(v => (
        <line key={v} x1={0} y1={yScale(v)} x2={W} y2={yScale(v)} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {segments.map((pts, idx) => (
        <polyline
          key={idx}
          points={pts.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {filled.map(({ v, i }) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(v)}
          r={v === 0 ? 1.5 : 2.5}
          fill={v === 0 ? '#E5E7EB' : color}
          stroke={v === 0 ? color : 'none'}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}

// ── Preview component ─────────────────────────────────────────────────────────

export function MedicationSideEffectsPreview() {
  const { t } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1M')
  const [showAll, setShowAll] = useState(false)

  const visibleSymptoms = showAll ? ALL_SYMPTOMS : ALL_SYMPTOMS.slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Streak badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: MODULE_COLOR + '15', borderRadius: 20,
          padding: '4px 10px', border: `1px solid ${MODULE_COLOR}30`,
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: MODULE_COLOR }}>
            {DEMO_STREAK[range]} {t('modules.medication_side_effects.streak_days', { defaultValue: 'jours consécutifs' })}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
          {t('modules.medication_side_effects.streak_hint', { defaultValue: 'de saisies régulières' })}
        </span>
      </div>

      {/* Sélecteur de période interactif */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['7J', '1M', '6M', '1A'] as TimeRange[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
              background: r === range ? MODULE_COLOR : 'transparent',
              color: r === range ? '#fff' : '#9CA3AF',
              border: `1px solid ${r === range ? MODULE_COLOR : '#E5E7EB'}`,
              cursor: 'pointer',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Graphiques */}
      {visibleSymptoms.map(({ key, label, color }) => (
        <div key={key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {label}
            </span>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>0 – 3</span>
          </div>
          {range === '7J'
            ? <MiniBarChart data={DEMO_DATA[range][key]} color={color} />
            : <MiniLineChart data={DEMO_DATA[range][key]} color={color} />
          }
        </div>
      ))}

      {/* Voir plus / moins */}
      <button
        onClick={() => setShowAll(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, color: MODULE_COLOR,
          padding: 0, alignSelf: 'flex-start',
        }}
      >
        {showAll
          ? `↑ ${t('common.show_less', { defaultValue: 'Réduire' })}`
          : `+ ${t('common.show_more', { defaultValue: 'Voir les 3 autres symptômes' })}`
        }
      </button>

      {/* Jalon de traitement (exemple) */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 6px' }}>
          {t('modules.medication_side_effects.events_section')}
        </p>
        <div style={{ borderLeft: `3px solid ${MODULE_COLOR}`, paddingLeft: 8, paddingTop: 2, paddingBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: MODULE_COLOR }}>14/04/2026</span>
          <span style={{ fontSize: 11, color: '#374151', marginLeft: 6 }}>Changement de dose</span>
        </div>
      </div>

      <p style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
        {t('modules.medication_side_effects.preview_demo_note', { defaultValue: 'Données illustratives — chaque point correspond à une saisie patient.' })}
      </p>
    </div>
  )
}

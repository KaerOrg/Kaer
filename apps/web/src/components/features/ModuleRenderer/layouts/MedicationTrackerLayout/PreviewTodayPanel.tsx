import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Pill, CheckCircle2 } from 'lucide-react'
import { buildExampleMeds } from './previewExamples'
import type { PreviewStatus, PreviewReason } from './types'

interface Props {
  moduleId: string
  t: (key: string) => string
  lbl: (key: string) => string
  statuses: PreviewStatus[]
  reasons: PreviewReason[]
}

// Volet « Aujourd'hui » de l'aperçu : check global (pastilles), motifs de non-prise,
// détail par molécule, notes, bouton enregistrer. Purement passif (MDR 2017/745).
export function PreviewTodayPanel({ moduleId, t, lbl, statuses, reasons }: Props) {
  const { i18n } = useTranslation()
  const meds = useMemo(() => buildExampleMeds(moduleId, t, lbl), [moduleId, t, lbl])
  const todayLabel = lbl('today_label')
  const dateLabel = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mt-prev">
      {/* Date */}
      <div className="mt-prev-date">
        {todayLabel ? <span className="mt-prev-date__label">{todayLabel}</span> : null}
        <span className="mt-prev-date__value">{dateLabel}</span>
      </div>

      {/* Check global */}
      <p className="preview-daily__question">{lbl('question')}</p>
      <div className="preview-daily__statuses">
        {statuses.map((s, i) => (
          <span
            key={s.value}
            className="preview-daily__status"
            style={i === 0
              ? { backgroundColor: s.bgColor, color: s.color, borderColor: s.color }
              : { color: 'var(--color-text-secondary)' }}
          >
            {i === 0
              ? <Check size={13} />
              : <span className="preview-daily__status-dot" style={{ backgroundColor: s.color }} />}
            {s.label}
          </span>
        ))}
      </div>

      {/* Motifs de non-prise */}
      {reasons.length > 0 && (
        <div className="mt-prev-block">
          <span className="mt-prev-block__label">{lbl('reason_prompt')}</span>
          <div className="preview-daily__statuses">
            {reasons.map(r => <span key={r.value} className="preview-chip">{r.label}</span>)}
          </div>
        </div>
      )}

      {/* Détail par molécule */}
      <div className="mt-prev-block">
        <span className="mt-prev-block__label">
          <Pill size={13} className="mt-prev-block__icon" />
          {lbl('per_molecule_label')}
        </span>
        {meds.map((med, mi) => (
          <div key={med.name} className="mt-prev-mol">
            <div className="mt-prev-mol__main">
              <span className="mt-prev-mol__name">{med.name}</span>
              {med.poso ? <span className="mt-prev-mol__poso">{med.poso}</span> : null}
            </div>
            <span className={`mt-prev-mol__kind${med.prn ? ' mt-prev-mol__kind--prn' : ''}`}>{med.kindLabel}</span>
            <div className="mt-prev-mol__dots">
              {statuses.map((s, si) => (
                <span
                  key={s.value}
                  className="mt-prev-dot"
                  style={si === mi % statuses.length
                    ? { backgroundColor: s.bgColor, borderColor: s.color, color: s.color }
                    : { borderColor: 'var(--color-border)', color: 'var(--color-border)' }}
                >
                  {si === mi % statuses.length ? <CheckCircle2 size={13} /> : <span className="mt-prev-dot__hollow" />}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="preview-daily__notes">
        <span className="preview-daily__notes-label">{lbl('notes_label') || t('common.notes_optional')}</span>
        <span className="fw-textarea" aria-label={lbl('notes_placeholder')} />
      </div>

      {/* Enregistrer */}
      <div className="preview-daily__save">
        <span className="preview-daily__save-btn">{lbl('save_label') || t('common.save')}</span>
      </div>
    </div>
  )
}

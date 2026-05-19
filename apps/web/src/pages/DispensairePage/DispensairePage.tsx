import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader, Info } from 'lucide-react'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { fetchPatientOptions, type PatientOption } from '../../services/patientService'
import { proposeScale } from '../../services/moduleAssignmentService'
import {
  fetchScaleMeta,
  type ScaleMetaRow,
  SCALE_CATEGORIES,
  AGE_BADGE_CONFIG,
  AGE_ORDER,
  CATEGORY_KEY,
  type ScaleCategory,
} from '../../services/scaleService'
import { useAuthStore } from '../../store/authStore'
import './DispensairePage.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposalModal {
  scale: ScaleMetaRow
  patients: PatientOption[]
  loadingPatients: boolean
  sending: string | null
  sent: Set<string>
  error: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minAgeIndex(scale: ScaleMetaRow): number {
  return Math.min(...scale.targetAges.map(age => AGE_ORDER.indexOf(age)))
}

function sortByAge(scales: ScaleMetaRow[]): ScaleMetaRow[] {
  return [...scales].sort((a, b) => minAgeIndex(a) - minAgeIndex(b))
}

// ─── ScaleCard ────────────────────────────────────────────────────────────────

interface ScaleCardProps {
  scale: ScaleMetaRow
  onPropose: (scale: ScaleMetaRow) => void
}

const ScaleCard = memo(function ScaleCard({ scale, onPropose }: ScaleCardProps) {
  const { t } = useTranslation()
  const handlePropose = useCallback(() => onPropose(scale), [onPropose, scale])

  return (
    <div className="scale-card">
      <div className="scale-card__body">
        <div className="scale-card__name">{t(`modules.${scale.id}.label`)}</div>
        <div className="scale-card__full-title">{t(`scales.full_title.${scale.id}`)}</div>
        <p className="scale-card__description">{t(`scales.descriptions.${scale.id}`)}</p>
        <div className="scale-card__age-row">
          <div className="scale-card__badges">
            {scale.targetAges.map(age => {
              const cfg = AGE_BADGE_CONFIG[age]
              return (
                <span
                  key={age}
                  className="age-badge age-badge--sm"
                  style={{ backgroundColor: cfg.bg, color: cfg.text }}
                >
                  {t(`scales.age.${age}`)}
                </span>
              )
            })}
          </div>
          <span className="scale-card__age-range">{t('scales.validated_prefix')} : {scale.validatedAgeRange}</span>
        </div>
      </div>
      <div className="scale-card__footer">
        <Button size="sm" onClick={handlePropose}>
          {t('dispensaire.propose_btn')}
        </Button>
        <a
          href={scale.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="scale-card__ref-btn"
          title={scale.referenceLabel}
          aria-label={`${t('dispensaire.reference_aria')} : ${scale.referenceLabel}`}
        >
          <Info size={15} />
        </a>
      </div>
    </div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DispensairePage() {
  const { t } = useTranslation()
  const { practitioner } = useAuthStore()
  const [scaleMeta, setScaleMeta] = useState<ScaleMetaRow[]>([])
  const [activeCategory, setActiveCategory] = useState<ScaleCategory | null>(null)
  const [modal, setModal] = useState<ProposalModal | null>(null)

  useEffect(() => {
    fetchScaleMeta().then(setScaleMeta)
  }, [])

  const categoryCounts = useMemo<Record<ScaleCategory, number>>(
    () =>
      Object.fromEntries(
        SCALE_CATEGORIES.map(cat => [
          cat,
          scaleMeta.filter(s => s.category === cat).length,
        ])
      ) as Record<ScaleCategory, number>,
    [scaleMeta]
  )

  const filteredScales = useMemo(() => {
    const base = activeCategory
      ? scaleMeta.filter(s => s.category === activeCategory)
      : scaleMeta
    return sortByAge(base)
  }, [activeCategory, scaleMeta])

  // ── Ouvrir la modale + charger patients ──────────────────────────────────

  const openModal = useCallback(async (scale: ScaleMetaRow) => {
    if (!practitioner) return
    setModal({
      scale,
      patients: [],
      loadingPatients: true,
      sending: null,
      sent: new Set(),
      error: null,
    })

    const patients = await fetchPatientOptions(practitioner.id)

    setModal(prev =>
      prev ? { ...prev, patients, loadingPatients: false } : null
    )
  }, [practitioner])

  const closeModal = useCallback(() => setModal(null), [])

  // Fermer sur Escape
  useEffect(() => {
    if (!modal) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [modal, closeModal])

  // ── Envoyer le questionnaire à un patient ────────────────────────────────

  const sendToPatient = useCallback(async (patient: PatientOption) => {
    if (!modal || !practitioner) return

    setModal(prev => prev ? { ...prev, sending: patient.id, error: null } : null)

    const result = await proposeScale(patient.id, practitioner.id, modal.scale.id)

    if (!result.ok) {
      const msg = result.code === '23505'
        ? t('dispensaire.error_duplicate', { label: patient.label })
        : t('dispensaire.error_send')
      setModal(prev => prev ? { ...prev, sending: null, error: msg } : null)
      return
    }

    setModal(prev => {
      if (!prev) return null
      const sent = new Set(prev.sent)
      sent.add(patient.id)
      return { ...prev, sending: null, sent }
    })
  }, [modal, practitioner])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="dispensaire">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="dispensaire__sidebar">
          <p className="dispensaire__sidebar-title">{t('dispensaire.sidebar_title')}</p>
          <ul className="dispensaire__category-list">
            <li>
              <button
                className={`dispensaire__category-btn ${activeCategory === null ? 'dispensaire__category-btn--active' : ''}`}
                onClick={() => setActiveCategory(null)}
              >
                <span>{t('dispensaire.all_scales')}</span>
                <span className="dispensaire__category-count">{scaleMeta.length}</span>
              </button>
            </li>
            {SCALE_CATEGORIES.map(cat => (
              <li key={cat}>
                <button
                  className={`dispensaire__category-btn ${activeCategory === cat ? 'dispensaire__category-btn--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span>{t(`scales.category.${CATEGORY_KEY[cat]}`)}</span>
                  <span
                    className={`dispensaire__category-count ${categoryCounts[cat] === 0 ? 'dispensaire__category-count--empty' : ''}`}
                  >
                    {categoryCounts[cat]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <div className="dispensaire__main">
          <div className="dispensaire__header">
            <h1 className="dispensaire__title">{t('dispensaire.title')}</h1>
            <p className="dispensaire__subtitle">{t('dispensaire.subtitle')}</p>
          </div>

          {/* Légende */}
          <div className="dispensaire__legend">
            <span className="dispensaire__legend-label">{t('dispensaire.legend_ages')}</span>
            {Object.entries(AGE_BADGE_CONFIG).map(([age, cfg]) => (
              <span
                key={age}
                className="age-badge"
                style={{ backgroundColor: cfg.bg, color: cfg.text }}
              >
                {t(`scales.age.${age}`)}
              </span>
            ))}
          </div>

          {/* Grille */}
          {filteredScales.length === 0 ? (
            <div className="dispensaire__empty">
              {t('dispensaire.empty_category')}
              <br />
              {t('dispensaire.empty_soon')}
            </div>
          ) : (
            <div className="dispensaire__grid">
              {filteredScales.map(scale => (
                <ScaleCard key={scale.id} scale={scale} onPropose={openModal} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modale patient picker ───────────────────────────────────────────── */}
      {modal && (
        <Modal
          title={modal.scale.name}
          subtitle={t('dispensaire.modal_subtitle')}
          onClose={closeModal}
          maxWidth={420}
          noPadding
          footer={
            <Button variant="secondary" size="sm" onClick={closeModal}>
              {t('dispensaire.close')}
            </Button>
          }
        >
          {modal.loadingPatients ? (
            <div className="dp-modal__loading">
              <Loader size={20} className="dp-modal__spinner" />
              {t('dispensaire.loading_patients')}
            </div>
          ) : modal.patients.length === 0 ? (
            <div className="dp-modal__empty">
              {t('dispensaire.no_patients')}
            </div>
          ) : (
            <ul className="dp-modal__list">
              {modal.patients.map(patient => {
                const isSent = modal.sent.has(patient.id)
                const isSending = modal.sending === patient.id

                return (
                  <li key={patient.id} className="dp-modal__item">
                    <span className="dp-modal__patient-label">{patient.label}</span>
                    {isSent ? (
                      <span className="dp-modal__sent-badge">
                        <Check size={13} />
                        {t('dispensaire.sent')}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        loading={isSending}
                        onClick={() => sendToPatient(patient)}
                      >
                        {t('dispensaire.send')}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {modal.error && (
            <div className="dp-modal__error">{modal.error}</div>
          )}
        </Modal>
      )}
    </Layout>
  )
}

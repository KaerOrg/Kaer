import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import { Check, X, Loader } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  CLINICAL_SCALES,
  SCALE_CATEGORIES,
  AGE_BADGE_CONFIG,
  AGE_ORDER,
  type ScaleCategory,
  type ClinicalScale,
} from '../data/scales'
import './DispensairePage.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientOption {
  id: string
  label: string
}

interface ProposalModal {
  scale: ClinicalScale
  patients: PatientOption[]
  loadingPatients: boolean
  sending: string | null    // patient ID en cours d'envoi
  sent: Set<string>         // patient IDs déjà envoyés dans cette session
  error: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minAgeIndex(scale: ClinicalScale): number {
  return Math.min(...scale.targetAges.map(age => AGE_ORDER.indexOf(age)))
}

function sortByAge(scales: readonly ClinicalScale[]): ClinicalScale[] {
  return [...scales].sort((a, b) => minAgeIndex(a) - minAgeIndex(b))
}

// ─── ScaleCard ────────────────────────────────────────────────────────────────

interface ScaleCardProps {
  scale: ClinicalScale
  onPropose: (scale: ClinicalScale) => void
}

const ScaleCard = memo(function ScaleCard({ scale, onPropose }: ScaleCardProps) {
  const handlePropose = useCallback(() => onPropose(scale), [onPropose, scale])

  return (
    <div className="scale-card">
      <div className="scale-card__body">
        <div className="scale-card__name">{scale.name}</div>
        <div className="scale-card__full-title">{scale.fullTitle}</div>
        <p className="scale-card__description">{scale.description}</p>
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
                  {cfg.label}
                </span>
              )
            })}
          </div>
          <span className="scale-card__age-range">Validé : {scale.validatedAgeRange}</span>
        </div>
      </div>
      <div className="scale-card__footer">
        <Button size="sm" onClick={handlePropose}>
          Proposer à un patient
        </Button>
      </div>
    </div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DispensairePage() {
  const { practitioner } = useAuthStore()
  const [activeCategory, setActiveCategory] = useState<ScaleCategory | null>(null)
  const [modal, setModal] = useState<ProposalModal | null>(null)

  const categoryCounts = useMemo<Record<ScaleCategory, number>>(
    () =>
      Object.fromEntries(
        SCALE_CATEGORIES.map(cat => [
          cat,
          CLINICAL_SCALES.filter(s => s.category === cat).length,
        ])
      ) as Record<ScaleCategory, number>,
    []
  )

  const filteredScales = useMemo(() => {
    const base = activeCategory
      ? CLINICAL_SCALES.filter(s => s.category === activeCategory)
      : CLINICAL_SCALES
    return sortByAge(base)
  }, [activeCategory])

  // ── Ouvrir la modale + charger patients ──────────────────────────────────

  const openModal = useCallback(async (scale: ClinicalScale) => {
    if (!practitioner) return
    setModal({
      scale,
      patients: [],
      loadingPatients: true,
      sending: null,
      sent: new Set(),
      error: null,
    })

    const { data: relations } = await supabase
      .from('practitioner_patients')
      .select('patient_id, patient_alias, patients(email)')
      .eq('practitioner_id', practitioner.id)

    type RelRow = { patient_id: string; patient_alias: string | null; patients: { email: string } | { email: string }[] | null }
    const patients: PatientOption[] = ((relations ?? []) as unknown as RelRow[]).map(rel => {
      const p = Array.isArray(rel.patients) ? rel.patients[0] : rel.patients
      const email = (p as { email: string } | null)?.email ?? ''
      return {
        id: rel.patient_id,
        label: rel.patient_alias ?? email,
      }
    })

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

    const { error } = await (supabase.from('patient_modules') as unknown as {
      insert: (v: Record<string, unknown>) => Promise<{ error: { code: string; message: string } | null }>
    }).insert({
      patient_id: patient.id,
      practitioner_id: practitioner.id,
      module_type: modal.scale.id,
      config: {},
    })

    if (error) {
      const msg = error.code === '23505'
        ? `${patient.label} a déjà ce questionnaire.`
        : 'Erreur lors de l\'envoi. Réessayez.'
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
          <p className="dispensaire__sidebar-title">Thèmes cliniques</p>
          <ul className="dispensaire__category-list">
            <li>
              <button
                className={`dispensaire__category-btn ${activeCategory === null ? 'dispensaire__category-btn--active' : ''}`}
                onClick={() => setActiveCategory(null)}
              >
                <span>Toutes les échelles</span>
                <span className="dispensaire__category-count">{CLINICAL_SCALES.length}</span>
              </button>
            </li>
            {SCALE_CATEGORIES.map(cat => (
              <li key={cat}>
                <button
                  className={`dispensaire__category-btn ${activeCategory === cat ? 'dispensaire__category-btn--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span>{cat}</span>
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
            <h1 className="dispensaire__title">Dispensaire Clinique</h1>
            <p className="dispensaire__subtitle">
              Bibliothèque de questionnaires validés. Envoyez-les directement à vos patients.
            </p>
          </div>

          {/* Légende */}
          <div className="dispensaire__legend">
            <span className="dispensaire__legend-label">Tranches d'âge validées :</span>
            {Object.entries(AGE_BADGE_CONFIG).map(([age, cfg]) => (
              <span
                key={age}
                className="age-badge"
                style={{ backgroundColor: cfg.bg, color: cfg.text }}
              >
                {cfg.label}
              </span>
            ))}
          </div>

          {/* Grille */}
          {filteredScales.length === 0 ? (
            <div className="dispensaire__empty">
              Aucune échelle disponible dans cette catégorie pour le moment.
              <br />
              De nouveaux questionnaires seront ajoutés prochainement.
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
        <div className="dp-modal-overlay" onClick={closeModal}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal__header">
              <div>
                <div className="dp-modal__scale-name">{modal.scale.name}</div>
                <div className="dp-modal__title">Choisir un patient</div>
              </div>
              <button className="dp-modal__close" onClick={closeModal} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="dp-modal__body">
              {modal.loadingPatients ? (
                <div className="dp-modal__loading">
                  <Loader size={20} className="dp-modal__spinner" />
                  Chargement des patients…
                </div>
              ) : modal.patients.length === 0 ? (
                <div className="dp-modal__empty">
                  Aucun patient dans votre liste pour le moment.
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
                            Envoyé
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            loading={isSending}
                            onClick={() => sendToPatient(patient)}
                          >
                            Envoyer
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
            </div>

            <div className="dp-modal__footer">
              <Button variant="secondary" size="sm" onClick={closeModal}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

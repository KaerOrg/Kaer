import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ShieldAlert, Plus, Trash2, ChevronDown, ChevronUp,
  BookOpen, Info, ExternalLink,
} from 'lucide-react'
import {
  fetchCSSRSAssessments,
  saveCSSRSAssessment,
  deleteCSSRSAssessment,
  type CSSRSAssessment,
} from '../../services/cssrsService'
import {
  CSSRS_SECTIONS,
  CSSRS_IDEATION_COUNT,
  CSSRS_BEHAVIOR_COUNT,
  INTENSITE_DIMENSIONS,
  LETALITE_OBSERVEE_OPTIONS,
  LETALITE_POTENTIELLE_OPTIONS,
  isIdeationItemActive,
  computeIdeationLevel,
  computeBehaviorCount,
  computeIdeationCount,
} from '../../data/cssrs_screen'
import type { IntensiteDimension, LikertOption } from '../../data/cssrs_screen'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import { InputField } from '../ui/InputField'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Radio } from '../ui/Radio'
import type { RadioOption } from '../ui/Radio'
import './CSSRSScreenPanel.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemState {
  value: 0 | 1 | null
  description: string
}

interface IntensiteState {
  frequence: number | null
  duree: number | null
  maitrise: number | null
  dissuasifs: number | null
  causes: number | null
}

interface FormState {
  ideation: ItemState[]
  intensite: IntensiteState
  behavior: ItemState[]
  nssi: 0 | 1 | null
  nbTentativesAverees: string
  nbTentativesInterrompues: string
  nbTentativesAvortees: string
  comportementObserve: 0 | 1 | null
  suicideReussi: 0 | 1 | null
  dateTentativePlusLetale: string
  letaliteObservee: number | null
  letalitePotentielle: number | null
}

type Assessment = CSSRSAssessment

interface Props {
  patientId: string
  practitionerId: string
}

// ─── Constantes module-level ──────────────────────────────────────────────────

const SCORING_PDF_URL =
  'https://cssrs.columbia.edu/wp-content/uploads/ScoringandDataAnalysisGuide-for-Clinical-Trials-1.pdf'
const RISK_ID_URL =
  'https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/risk-identification/'

const INTENSITE_KEYS: Array<keyof IntensiteState> = [
  'frequence', 'duree', 'maitrise', 'dissuasifs', 'causes',
]

function makeInitFormState(): FormState {
  return {
    ideation: Array.from({ length: CSSRS_IDEATION_COUNT }, () => ({ value: null, description: '' })),
    intensite: { frequence: null, duree: null, maitrise: null, dissuasifs: null, causes: null },
    behavior: Array.from({ length: CSSRS_BEHAVIOR_COUNT }, () => ({ value: null, description: '' })),
    nssi: null,
    nbTentativesAverees: '',
    nbTentativesInterrompues: '',
    nbTentativesAvortees: '',
    comportementObserve: null,
    suicideReussi: null,
    dateTentativePlusLetale: '',
    letaliteObservee: null,
    letalitePotentielle: null,
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function parseCount(s: string): number | null {
  if (s.trim() === '') return null
  const n = parseInt(s, 10)
  return isNaN(n) || n < 0 ? null : n
}

// ─── Sous-composant : échelle de Likert ───────────────────────────────────────

interface LikertScaleProps {
  dimension: IntensiteDimension | { key: string; title: string; options: readonly LikertOption[] }
  value: number | null
  onChange: (v: number) => void
  /** Couleur d'accent de l'option sélectionnée (défaut : primaire ; létalité : danger). */
  accent?: string
}

// Échelle de Likert = choix exclusif à libellés riches → primitive `Radio` (variante `cards`).
function LikertScale({ dimension, value, onChange, accent }: LikertScaleProps) {
  const options = useMemo<RadioOption[]>(
    () => dimension.options.map(opt => ({
      value: String(opt.value),
      label: opt.label,
      sublabel: opt.detail,
      badge: String(opt.value),
    })),
    [dimension.options],
  )
  const handleChange = useCallback((v: string) => onChange(Number(v)), [onChange])

  return (
    <div className="cssrs-likert">
      <span className="cssrs-likert__title">{dimension.title}</span>
      <Radio
        variant="cards"
        options={options}
        value={value === null ? null : String(value)}
        onChange={handleChange}
        color={accent}
      />
    </div>
  )
}

// ─── Sous-composant : guide d'interprétation Columbia ────────────────────────

function InterpretationGuide() {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen(o => !o), [])

  return (
    <div className="cssrs-guide">
      <button className="cssrs-guide__toggle" onClick={toggle}>
        <Info size={13} />
        <span>Guide de lecture — Seuils Columbia</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="cssrs-guide__body">
          <p className="cssrs-guide__note">
            Aide à la lecture basée sur le{' '}
            <a href={SCORING_PDF_URL} target="_blank" rel="noreferrer" className="cssrs-guide__link">
              guide de scoring officiel Columbia
              <ExternalLink size={10} />
            </a>.{' '}
            L'interprétation clinique appartient exclusivement au praticien.
          </p>

          <table className="cssrs-guide__table">
            <thead>
              <tr>
                <th>Profil observé</th>
                <th>Niveau</th>
                <th>Orientation Columbia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Idéation passive uniquement</strong><br />
                  <span className="cssrs-guide__detail">Niveaux 1–2 seulement (sans méthode ni intention)</span>
                </td>
                <td><span className="cssrs-badge cssrs-badge--low">Faible</span></td>
                <td>Évaluation santé mentale approfondie · Élaborer un plan de sécurité</td>
              </tr>
              <tr>
                <td>
                  <strong>Idéation avec méthode (niveau 3)</strong><br />
                  <span className="cssrs-guide__detail"><em>ou</em> tout comportement positif (vie entière)</span>
                </td>
                <td><span className="cssrs-badge cssrs-badge--moderate">Modéré</span></td>
                <td>Évaluation approfondie obligatoire · Plan de sécurité formalisé</td>
              </tr>
              <tr>
                <td>
                  <strong>Idéation avec intention ou plan (niveaux 4–5)</strong><br />
                  <span className="cssrs-guide__detail"><em>ou</em> comportement récent (3 derniers mois)</span>
                </td>
                <td><span className="cssrs-badge cssrs-badge--high">Élevé</span></td>
                <td>
                  Intervention immédiate · Pas d'isolement · Sécurisation des moyens ·
                  Avis psychiatrique urgent · Envisager une hospitalisation
                </td>
              </tr>
            </tbody>
          </table>

          <p className="cssrs-guide__ref">
            Posner et al., <em>Am J Psychiatry</em> 2011 — seuil idéation ≥ 3 associé à un risque de décès × 4 à une semaine.{' '}
            <a href={RISK_ID_URL} target="_blank" rel="noreferrer" className="cssrs-guide__link">
              Risk Identification Framework Columbia <ExternalLink size={10} />
            </a>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Constantes labels idéation (pour détail historique) ─────────────────────

const IDEATION_LEVEL_LABELS = [
  'Désir d\'être mort(e)',
  'Idéation non spécifique',
  'Avec méthode (sans scénario, sans intention)',
  'Avec intention (sans scénario précis)',
  'Avec scénario précis et intention',
]

// ─── Sous-composant : détail complet d'une évaluation ────────────────────────

interface AssessmentDetailProps {
  assessment: Assessment
}

function AssessmentDetail({ assessment: a }: AssessmentDetailProps) {
  const ideationValues = a.ideation_answers.map(x => x.value as 0 | 1 | null)
  const ideationItems = CSSRS_SECTIONS[0].items
  const behaviorItems = CSSRS_SECTIONS[1].items

  return (
    <div className="cssrs-detail">

      {/* ── Idéation suicidaire ─────────────────────────────────────────── */}
      <div className="cssrs-detail__section">
        <div className="cssrs-detail__section-title">Idéation suicidaire</div>
        {ideationItems.map((item, idx) => {
          const active = isIdeationItemActive(idx, ideationValues)
          const ans = a.ideation_answers[idx]
          const val = active ? ans?.value : null

          return (
            <div key={idx} className={`cssrs-detail__row${!active ? ' cssrs-detail__row--skipped' : ''}`}>
              <span className="cssrs-detail__num">{idx + 1}.</span>
              <div className="cssrs-detail__content">
                <span className="cssrs-detail__label">{item.label}</span>
                <span className="cssrs-detail__question">{item.question}</span>
                {active && ans?.description && (
                  <span className="cssrs-detail__description">« {ans.description} »</span>
                )}
              </div>
              <span className={`cssrs-detail__answer${
                !active ? ' cssrs-detail__answer--na'
                  : val === 1 ? ' cssrs-detail__answer--oui'
                  : ' cssrs-detail__answer--non'
              }`}>
                {!active ? 'N.P.' : val === 1 ? 'Oui' : 'Non'}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Intensité de l'idéation ──────────────────────────────────────── */}
      {a.intensite_ideation !== null && (
        <div className="cssrs-detail__section">
          <div className="cssrs-detail__section-title">Intensité de l'idéation</div>

          {/* Type le plus grave */}
          <div className="cssrs-detail__intensite-type">
            <span className="cssrs-detail__intensite-type-label">Type le plus grave :</span>
            <span className="cssrs-detail__intensite-type-value">
              {a.ideation_level > 0
                ? `Niveau ${a.ideation_level} — ${IDEATION_LEVEL_LABELS[a.ideation_level - 1]}`
                : '—'}
            </span>
          </div>

          {INTENSITE_DIMENSIONS.map(dim => {
            const val = a.intensite_ideation![dim.key as keyof typeof a.intensite_ideation]
            const opt = val !== null && val !== undefined
              ? dim.options.find(o => o.value === val)
              : null
            return (
              <div key={dim.key} className="cssrs-detail__intensite-row">
                <span className="cssrs-detail__intensite-dim">{dim.title}</span>
                <span className="cssrs-detail__intensite-val">
                  {opt
                    ? <><strong>{opt.value} — {opt.label}</strong><span className="cssrs-detail__intensite-detail"> · {opt.detail}</span></>
                    : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Comportements suicidaires ────────────────────────────────────── */}
      <div className="cssrs-detail__section">
        <div className="cssrs-detail__section-title">Comportements suicidaires</div>
        {behaviorItems.map((item, idx) => {
          const ans = a.behavior_answers[idx]
          const val = ans?.value

          return (
            <div key={idx} className="cssrs-detail__row">
              <span className="cssrs-detail__num">{CSSRS_IDEATION_COUNT + idx + 1}.</span>
              <div className="cssrs-detail__content">
                <span className="cssrs-detail__label">{item.label}</span>
                <span className="cssrs-detail__question">{item.question}</span>
                {val === 1 && ans?.description && (
                  <span className="cssrs-detail__description">« {ans.description} »</span>
                )}
              </div>
              <span className={`cssrs-detail__answer${val === 1 ? ' cssrs-detail__answer--oui' : ' cssrs-detail__answer--non'}`}>
                {val === 1 ? 'Oui' : 'Non'}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Informations complémentaires ─────────────────────────────────── */}
      <div className="cssrs-detail__section cssrs-detail__section--extra">
        <div className="cssrs-detail__section-title">Informations complémentaires</div>
        <div className="cssrs-detail__extra-grid">
          <div className="cssrs-detail__extra-row">
            <span className="cssrs-detail__extra-label">Comportement auto-agressif non suicidaire (NSSI)</span>
            <span className={`cssrs-detail__answer${a.nssi === 1 ? ' cssrs-detail__answer--oui' : ' cssrs-detail__answer--non'}`}>
              {a.nssi === 1 ? 'Oui' : a.nssi === 0 ? 'Non' : '—'}
            </span>
          </div>

          {a.nb_tentatives_averees !== null && (
            <div className="cssrs-detail__extra-row">
              <span className="cssrs-detail__extra-label">Nombre total de tentatives avérées</span>
              <strong>{a.nb_tentatives_averees}</strong>
            </div>
          )}
          {a.nb_tentatives_interrompues !== null && (
            <div className="cssrs-detail__extra-row">
              <span className="cssrs-detail__extra-label">Nombre total de tentatives interrompues</span>
              <strong>{a.nb_tentatives_interrompues}</strong>
            </div>
          )}
          {a.nb_tentatives_avortees !== null && (
            <div className="cssrs-detail__extra-row">
              <span className="cssrs-detail__extra-label">Nombre total de tentatives avortées</span>
              <strong>{a.nb_tentatives_avortees}</strong>
            </div>
          )}

          <div className="cssrs-detail__extra-row">
            <span className="cssrs-detail__extra-label">Comportement suicidaire observé</span>
            <span className={`cssrs-detail__answer${a.comportement_observe === 1 ? ' cssrs-detail__answer--oui' : ' cssrs-detail__answer--non'}`}>
              {a.comportement_observe === 1 ? 'Oui' : a.comportement_observe === 0 ? 'Non' : '—'}
            </span>
          </div>

          <div className="cssrs-detail__extra-row">
            <span className="cssrs-detail__extra-label">Suicide réussi</span>
            <span className={`cssrs-detail__answer${a.suicide_reussi === 1 ? ' cssrs-detail__answer--critical' : ' cssrs-detail__answer--non'}`}>
              {a.suicide_reussi === 1 ? 'Oui' : a.suicide_reussi === 0 ? 'Non' : '—'}
            </span>
          </div>

          {a.date_tentative_plus_letale && (
            <div className="cssrs-detail__extra-row">
              <span className="cssrs-detail__extra-label">Date de la tentative la plus létale</span>
              <strong>{new Date(a.date_tentative_plus_letale).toLocaleDateString('fr-FR')}</strong>
            </div>
          )}

          {a.letalite_observee !== null && (() => {
            const opt = LETALITE_OBSERVEE_OPTIONS.find(o => o.value === a.letalite_observee)
            return (
              <div className="cssrs-detail__extra-row">
                <span className="cssrs-detail__extra-label">Létalité / Lésions médicales observées</span>
                <span>
                  <strong>{a.letalite_observee}</strong>
                  {opt && <span className="cssrs-detail__intensite-detail"> — {opt.detail}</span>}
                </span>
              </div>
            )
          })()}

          {a.letalite_potentielle !== null && (() => {
            const opt = LETALITE_POTENTIELLE_OPTIONS.find(o => o.value === a.letalite_potentielle)
            return (
              <div className="cssrs-detail__extra-row">
                <span className="cssrs-detail__extra-label">Létalité potentielle</span>
                <span>
                  <strong>{a.letalite_potentielle}</strong>
                  {opt && <span className="cssrs-detail__intensite-detail"> — {opt.detail}</span>}
                </span>
              </div>
            )
          })()}
        </div>
      </div>

    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CSSRSScreenPanel({ patientId, practitionerId }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(makeInitFormState)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  // ── Chargement ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setAssessments(await fetchCSSRSAssessments(patientId, practitionerId))
    setLoading(false)
  }, [patientId, practitionerId])

  useEffect(() => { void load() }, [load])

  // ── Dérivations ─────────────────────────────────────────────────────────────

  const ideationValues = useMemo(
    () => formState.ideation.map(i => i.value),
    [formState.ideation],
  )

  const showsIntensite = ideationValues[0] === 1 || ideationValues[1] === 1

  const activeIdeationIndices = useMemo(
    () => Array.from({ length: CSSRS_IDEATION_COUNT }, (_, i) => i)
      .filter(i => isIdeationItemActive(i, ideationValues)),
    [ideationValues],
  )

  const answeredIdeation = useMemo(
    () => activeIdeationIndices.filter(i => formState.ideation[i].value !== null).length,
    [activeIdeationIndices, formState.ideation],
  )

  const answeredIntensite = useMemo(() => {
    if (!showsIntensite) return 0
    return INTENSITE_KEYS.filter(k => formState.intensite[k] !== null).length
  }, [showsIntensite, formState.intensite])

  const answeredBehavior = formState.behavior.filter(i => i.value !== null).length

  const answeredExtra = [formState.nssi, formState.comportementObserve]
    .filter(v => v !== null).length

  const requiredIntensite = showsIntensite ? 5 : 0
  const totalAnswered = answeredIdeation + answeredIntensite + answeredBehavior + answeredExtra
  const totalRequired =
    activeIdeationIndices.length + requiredIntensite + CSSRS_BEHAVIOR_COUNT + 2
  const allAnswered = totalAnswered === totalRequired

  // ── Setters idéation ────────────────────────────────────────────────────────

  const setIdeationValue = useCallback((idx: number, val: 0 | 1) => {
    setFormState(prev => {
      const ideation = prev.ideation.map((item, i) => {
        if (i === idx) return { ...item, value: val }
        // Cascade : si Q2 ou Q3 passe à Non → réinitialiser les items suivants de l'idéation
        if (val === 0 && idx >= 1 && idx < CSSRS_IDEATION_COUNT - 1 && i > idx) {
          return { value: null as null, description: '' }
        }
        return item
      })
      return { ...prev, ideation }
    })
  }, [])

  const setIdeationDescription = useCallback((idx: number, text: string) => {
    setFormState(prev => {
      const ideation = prev.ideation.map((item, i) =>
        i === idx ? { ...item, description: text } : item,
      )
      return { ...prev, ideation }
    })
  }, [])

  // ── Setters intensité ───────────────────────────────────────────────────────

  const setIntensiteValue = useCallback((key: keyof IntensiteState, val: number) => {
    setFormState(prev => ({
      ...prev,
      intensite: { ...prev.intensite, [key]: val },
    }))
  }, [])

  // ── Setters comportements ───────────────────────────────────────────────────

  const setBehaviorValue = useCallback((idx: number, val: 0 | 1) => {
    setFormState(prev => {
      const behavior = prev.behavior.map((item, i) =>
        i === idx ? { ...item, value: val } : item,
      )
      return { ...prev, behavior }
    })
  }, [])

  const setBehaviorDescription = useCallback((idx: number, text: string) => {
    setFormState(prev => {
      const behavior = prev.behavior.map((item, i) =>
        i === idx ? { ...item, description: text } : item,
      )
      return { ...prev, behavior }
    })
  }, [])

  // ── Setters section finale ──────────────────────────────────────────────────

  const setNssi = useCallback((val: 0 | 1) => {
    setFormState(prev => ({ ...prev, nssi: val }))
  }, [])

  const setComportementObserve = useCallback((val: 0 | 1) => {
    setFormState(prev => ({ ...prev, comportementObserve: val }))
  }, [])

  const setSuicideReussi = useCallback((val: 0 | 1) => {
    setFormState(prev => ({ ...prev, suicideReussi: val }))
  }, [])

  const setNbTentativesAverees = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, nbTentativesAverees: e.target.value }))
  }, [])

  const setNbTentativesInterrompues = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, nbTentativesInterrompues: e.target.value }))
  }, [])

  const setNbTentativesAvortees = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, nbTentativesAvortees: e.target.value }))
  }, [])

  const setDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, dateTentativePlusLetale: e.target.value }))
  }, [])

  const setLetaliteObservee = useCallback((val: number) => {
    setFormState(prev => ({
      ...prev,
      letaliteObservee: val,
      letalitePotentielle: val !== 0 ? null : prev.letalitePotentielle,
    }))
  }, [])

  const setLetalitePotentielle = useCallback((val: number) => {
    setFormState(prev => ({ ...prev, letalitePotentielle: val }))
  }, [])

  // ── Soumission ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!allAnswered) return
    setSaving(true)
    setSaveError(null)

    const ideationAnswers = formState.ideation.map((item, idx) => ({
      value: isIdeationItemActive(idx, ideationValues) ? (item.value ?? 0) : 0,
      description: item.description,
    }))

    const flatIdeation = ideationAnswers.map(a => a.value)
    const flatBehavior = formState.behavior.map(b => b.value ?? 0)

    const result = await saveCSSRSAssessment({
      patientId,
      practitionerId,
      ideation_answers: ideationAnswers,
      intensite_ideation: showsIntensite ? formState.intensite : null,
      behavior_answers: formState.behavior.map(b => ({
        value: b.value ?? 0,
        description: b.description,
      })),
      nssi: formState.nssi,
      nb_tentatives_averees: parseCount(formState.nbTentativesAverees),
      nb_tentatives_interrompues: parseCount(formState.nbTentativesInterrompues),
      nb_tentatives_avortees: parseCount(formState.nbTentativesAvortees),
      comportement_observe: formState.comportementObserve,
      suicide_reussi: formState.suicideReussi,
      date_tentative_plus_letale: formState.dateTentativePlusLetale || null,
      letalite_observee: formState.letaliteObservee,
      letalite_potentielle:
        formState.letaliteObservee === 0 ? formState.letalitePotentielle : null,
      ideation_level: computeIdeationLevel([...flatIdeation, ...flatBehavior]),
      behavior_count: computeBehaviorCount([...flatIdeation, ...flatBehavior]),
    })

    if (!result.ok) {
      setSaveError(`Erreur lors de l'enregistrement : ${result.message ?? 'inconnue'}`)
      setSaving(false)
      return
    }

    setFormState(makeInitFormState())
    setFormOpen(false)
    await load()
    setSaving(false)
  }

  // ── Suppression ─────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => setPendingDeleteId(id)
  const handleCancelDelete = useCallback(() => setPendingDeleteId(null), [])

  const confirmDelete = async () => {
    const id = pendingDeleteId
    if (id == null) return
    setPendingDeleteId(null)
    setDeletingId(id)
    await deleteCSSRSAssessment(id)
    setAssessments(prev => prev.filter(a => a.id !== id))
    setDeletingId(null)
  }

  // ── Toggle formulaire ───────────────────────────────────────────────────────

  const handleToggleForm = useCallback(() => {
    setFormOpen(prev => !prev)
    setFormState(makeInitFormState())
  }, [])

  // ── Section idéation — items ────────────────────────────────────────────────

  const ideationItems = CSSRS_SECTIONS[0].items
  const behaviorItems = CSSRS_SECTIONS[1].items

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="cssrs-panel">

      {/* En-tête */}
      <div className="cssrs-panel__header">
        <div className="cssrs-panel__header-left">
          <span className="cssrs-panel__icon"><ShieldAlert size={18} /></span>
          <div>
            <span className="cssrs-panel__title">C-SSRS — Dépistage suicidaire</span>
            <span className="cssrs-panel__sub">
              Hétéro-évaluation praticien · Columbia University / NIMH · Version « Depuis la dernière visite »
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={formOpen ? <ChevronUp size={15} /> : <Plus size={15} />}
          onClick={handleToggleForm}
        >
          {formOpen ? 'Annuler' : 'Nouvelle évaluation'}
        </Button>
      </div>

      {/* Avertissement */}
      <div className="cssrs-panel__warning">
        <BookOpen size={13} />
        <span>
          Outil à administrer en présence du patient. Vos réponses sont enregistrées
          et associées au dossier de ce patient.
        </span>
      </div>

      {/* ── Formulaire ───────────────────────────────────────────────────────── */}
      {formOpen && (
        <div className="cssrs-panel__form">

          {/* ── A. IDÉATION SUICIDAIRE ─────────────────────────────────────── */}
          <div className="cssrs-form__section">
            <div className="cssrs-form__section-header">
              <span className="cssrs-form__section-title">
                {CSSRS_SECTIONS[0].title}
              </span>
              <span className="cssrs-form__section-period">
                {CSSRS_SECTIONS[0].period}
              </span>
            </div>

            {ideationItems.map((item, absIdx) => {
              const active = isIdeationItemActive(absIdx, ideationValues)
              const val = formState.ideation[absIdx].value
              const desc = formState.ideation[absIdx].description

              const isFirstInactive =
                !active &&
                (absIdx === 0 || isIdeationItemActive(absIdx - 1, ideationValues))

              return (
                <React.Fragment key={absIdx}>
                  {isFirstInactive && (
                    <div className="cssrs-form__skip-notice">
                      {CSSRS_IDEATION_COUNT - absIdx > 1
                        ? `Questions ${absIdx + 1} à 5 — non posées (réponse « Non » à la question précédente)`
                        : `Question ${absIdx + 1} — non posée (réponse « Non » à la question précédente)`}
                    </div>
                  )}

                  <div className={`cssrs-form__row${!active ? ' cssrs-form__row--skipped' : ''}`}>
                    <span className="cssrs-form__num">{absIdx + 1}.</span>
                    <div className="cssrs-form__question-wrap">
                      <span className="cssrs-form__label">{item.label}</span>
                      <span className={`cssrs-form__question${!active ? ' cssrs-form__question--na' : ''}`}>
                        {item.question}
                      </span>

                      {active && val === 1 && (
                        <InputField
                          multiline
                          aria-label="Si oui, décrivez"
                          placeholder="Si oui, décrivez…"
                          value={desc}
                          onChange={e => setIdeationDescription(absIdx, e.target.value)}
                          rows={2}
                        />
                      )}
                    </div>

                    {active ? (
                      <div className="cssrs-form__btns">
                        <button
                          className={`cssrs-form__btn cssrs-form__btn--non${val === 0 ? ' selected' : ''}`}
                          onClick={() => setIdeationValue(absIdx, 0)}
                        >Non</button>
                        <button
                          className={`cssrs-form__btn cssrs-form__btn--oui${val === 1 ? ' selected' : ''}`}
                          onClick={() => setIdeationValue(absIdx, 1)}
                        >Oui</button>
                      </div>
                    ) : (
                      <span className="cssrs-form__na-badge">N/A</span>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>

          {/* ── B. INTENSITÉ DE L'IDÉATION ────────────────────────────────── */}
          {showsIntensite && (
            <div className="cssrs-intensite-section">
              <div className="cssrs-intensite-section__header">
                <span className="cssrs-intensite-section__title">
                  Intensité de l'idéation
                </span>
                <span className="cssrs-intensite-section__note">
                  À coter pour le type d'idéation le plus grave endorsé ci-dessus
                </span>
              </div>

              {/* Type le plus grave — affiché automatiquement */}
              <div className="cssrs-intensite-type">
                <span className="cssrs-intensite-type__label">Type d'idéation le plus grave endorsé :</span>
                <span className="cssrs-intensite-type__value">
                  {(() => {
                    const level = computeIdeationLevel(ideationValues.map(v => v ?? 0))
                    if (level === 0) return 'Aucune idéation active'
                    const labels = ['Désir d\'être mort(e)', 'Idéation non spécifique', 'Avec méthode', 'Avec intention', 'Avec scénario précis et intention']
                    return `${level} — ${labels[level - 1]}`
                  })()}
                </span>
              </div>

              {INTENSITE_DIMENSIONS.map(dim => (
                <LikertScale
                  key={dim.key}
                  dimension={dim}
                  value={formState.intensite[dim.key]}
                  onChange={v => setIntensiteValue(dim.key, v)}
                />
              ))}
            </div>
          )}

          {/* ── C. COMPORTEMENTS SUICIDAIRES ─────────────────────────────── */}
          <div className="cssrs-form__section">
            <div className="cssrs-form__section-header">
              <span className="cssrs-form__section-title">
                {CSSRS_SECTIONS[1].title}
              </span>
              <span className="cssrs-form__section-period">
                {CSSRS_SECTIONS[1].period}
              </span>
            </div>

            {behaviorItems.map((item, bIdx) => {
              const val = formState.behavior[bIdx].value
              const desc = formState.behavior[bIdx].description
              const globalNum = CSSRS_IDEATION_COUNT + bIdx + 1

              return (
                <div key={bIdx} className="cssrs-form__row">
                  <span className="cssrs-form__num">{globalNum}.</span>
                  <div className="cssrs-form__question-wrap">
                    <span className="cssrs-form__label">{item.label}</span>
                    <span className="cssrs-form__question">{item.question}</span>
                    {val === 1 && (
                      <InputField
                        multiline
                        aria-label="Si oui, décrivez"
                        placeholder="Si oui, décrivez…"
                        value={desc}
                        onChange={e => setBehaviorDescription(bIdx, e.target.value)}
                        rows={2}
                      />
                    )}
                  </div>
                  <div className="cssrs-form__btns">
                    <button
                      className={`cssrs-form__btn cssrs-form__btn--non${val === 0 ? ' selected' : ''}`}
                      onClick={() => setBehaviorValue(bIdx, 0)}
                    >Non</button>
                    <button
                      className={`cssrs-form__btn cssrs-form__btn--oui${val === 1 ? ' selected' : ''}`}
                      onClick={() => setBehaviorValue(bIdx, 1)}
                    >Oui</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── D. SECTION COMPLÉMENTAIRE ─────────────────────────────────── */}
          <div className="cssrs-form__section">
            <div className="cssrs-form__section-header">
              <span className="cssrs-form__section-title">Informations complémentaires</span>
            </div>

            {/* Comportement auto-agressif non suicidaire */}
            <div className="cssrs-form__row">
              <span className="cssrs-form__num">—</span>
              <div className="cssrs-form__question-wrap">
                <span className="cssrs-form__label">Comportement auto-agressif non suicidaire</span>
                <span className="cssrs-form__question">
                  Le sujet a-t-il eu un comportement auto-agressif non suicidaire ?
                </span>
              </div>
              <div className="cssrs-form__btns">
                <button
                  className={`cssrs-form__btn cssrs-form__btn--non${formState.nssi === 0 ? ' selected' : ''}`}
                  onClick={() => setNssi(0)}
                >Non</button>
                <button
                  className={`cssrs-form__btn cssrs-form__btn--oui${formState.nssi === 1 ? ' selected' : ''}`}
                  onClick={() => setNssi(1)}
                >Oui</button>
              </div>
            </div>

            {/* Compteurs de tentatives */}
            <div className="cssrs-form__counts">
              <label className="cssrs-form__count-label">
                <span>Nombre total de tentatives avérées</span>
                <input
                  type="number"
                  min="0"
                  className="cssrs-form__count-input"
                  value={formState.nbTentativesAverees}
                  onChange={setNbTentativesAverees}
                  placeholder="—"
                />
              </label>
              <label className="cssrs-form__count-label">
                <span>Nombre total de tentatives interrompues</span>
                <input
                  type="number"
                  min="0"
                  className="cssrs-form__count-input"
                  value={formState.nbTentativesInterrompues}
                  onChange={setNbTentativesInterrompues}
                  placeholder="—"
                />
              </label>
              <label className="cssrs-form__count-label">
                <span>Nombre total de tentatives avortées</span>
                <input
                  type="number"
                  min="0"
                  className="cssrs-form__count-input"
                  value={formState.nbTentativesAvortees}
                  onChange={setNbTentativesAvortees}
                  placeholder="—"
                />
              </label>
            </div>

            {/* Comportement suicidaire observé */}
            <div className="cssrs-form__row">
              <span className="cssrs-form__num">—</span>
              <div className="cssrs-form__question-wrap">
                <span className="cssrs-form__label">Comportement suicidaire observé</span>
                <span className="cssrs-form__question">
                  Un comportement suicidaire a-t-il été observé par le clinicien ou signalé par d'autres ?
                </span>
              </div>
              <div className="cssrs-form__btns">
                <button
                  className={`cssrs-form__btn cssrs-form__btn--non${formState.comportementObserve === 0 ? ' selected' : ''}`}
                  onClick={() => setComportementObserve(0)}
                >Non</button>
                <button
                  className={`cssrs-form__btn cssrs-form__btn--oui${formState.comportementObserve === 1 ? ' selected' : ''}`}
                  onClick={() => setComportementObserve(1)}
                >Oui</button>
              </div>
            </div>

            {/* Suicide réussi */}
            <div className="cssrs-form__row">
              <span className="cssrs-form__num">—</span>
              <div className="cssrs-form__question-wrap">
                <span className="cssrs-form__label">Suicide réussi</span>
                <span className="cssrs-form__question">
                  Le patient a-t-il commis un suicide réussi depuis la dernière visite ?
                </span>
              </div>
              <div className="cssrs-form__btns">
                <button
                  className={`cssrs-form__btn cssrs-form__btn--non${formState.suicideReussi === 0 ? ' selected' : ''}`}
                  onClick={() => setSuicideReussi(0)}
                >Non</button>
                <button
                  className={`cssrs-form__btn cssrs-form__btn--oui${formState.suicideReussi === 1 ? ' selected' : ''}`}
                  onClick={() => setSuicideReussi(1)}
                >Oui</button>
              </div>
            </div>

            {/* Létalité — pour la tentative la plus létale */}
            <div className="cssrs-letalite">
              <div className="cssrs-letalite__header">
                <span className="cssrs-letalite__title">
                  Létalité — pour la tentative la plus létale
                </span>
              </div>

              {/* Date */}
              <label className="cssrs-letalite__date-label">
                <span>Date de la tentative la plus létale</span>
                <input
                  type="date"
                  className="cssrs-form__date-input"
                  value={formState.dateTentativePlusLetale}
                  onChange={setDate}
                />
              </label>

              {/* Létalité observée */}
              <LikertScale
                dimension={{
                  key: 'letalite_observee',
                  title: 'Létalité / Lésions médicales observées (0 = aucune lésion, 5 = décès)',
                  options: LETALITE_OBSERVEE_OPTIONS,
                }}
                value={formState.letaliteObservee}
                onChange={setLetaliteObservee}
                accent="var(--color-danger)"
              />

              {/* Létalité potentielle — uniquement si observée = 0 */}
              {formState.letaliteObservee === 0 && (
                <LikertScale
                  dimension={{
                    key: 'letalite_potentielle',
                    title: 'Létalité potentielle (uniquement si lésions observées = 0)',
                    options: LETALITE_POTENTIELLE_OPTIONS,
                  }}
                  value={formState.letalitePotentielle}
                  onChange={setLetalitePotentielle}
                  accent="var(--color-danger)"
                />
              )}
            </div>
          </div>

          {/* Erreur d'enregistrement */}
          {saveError !== null && (
            <div className="cssrs-form__error">{saveError}</div>
          )}

          {/* Pied de formulaire */}
          <div className="cssrs-form__footer">
            <span className="cssrs-form__progress">
              {totalAnswered} / {totalRequired} champs requis remplis
            </span>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!allAnswered}
              onClick={handleSubmit}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer l\'évaluation'}
            </Button>
          </div>
        </div>
      )}

      {/* Guide d'interprétation Columbia */}
      <InterpretationGuide />

      {/* Historique */}
      {!loading && assessments.length > 0 && (
        <ul className="cssrs-panel__list">
          {assessments.map(a => {
            const ideationCount = computeIdeationCount(a.ideation_answers.map(x => x.value))
            const isExpanded = expandedId === a.id
            return (
              <li key={a.id} className="cssrs-panel__item-wrap">
                {/* Ligne de résumé cliquable */}
                <div
                  className="cssrs-panel__item cssrs-panel__item--clickable"
                  onClick={() => toggleExpand(a.id)}
                >
                  <div className="cssrs-panel__item-info">
                    <span className="cssrs-panel__item-date">{formatDate(a.assessed_at)}</span>
                    <div className="cssrs-panel__chips">
                      <span className="cssrs-chip">
                        Idéation <strong>{ideationCount} / 5</strong>
                        {a.ideation_level > 0 && (
                          <em className="cssrs-chip__level"> · niveau {a.ideation_level}</em>
                        )}
                      </span>
                      <span className="cssrs-chip">
                        Comportements <strong>{a.behavior_count} / {CSSRS_BEHAVIOR_COUNT}</strong>
                      </span>
                      {a.intensite_ideation !== null && (
                        <span className="cssrs-chip">
                          Intensité <strong>évaluée</strong>
                        </span>
                      )}
                      {a.nssi === 1 && (
                        <span className="cssrs-chip cssrs-chip--nssi">NSSI +</span>
                      )}
                      {a.suicide_reussi === 1 && (
                        <span className="cssrs-chip cssrs-chip--critical">Suicide réussi</span>
                      )}
                    </div>
                  </div>
                  <div className="cssrs-panel__item-actions">
                    <span className="cssrs-panel__expand-icon">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                    <Tooltip label="Supprimer">
                      <Button
                        variant="ghost"
                        size="xs"
                        category="danger"
                        className="cssrs-panel__delete"
                        icon={<Trash2 size={14} />}
                        onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
                        disabled={deletingId === a.id}
                        aria-label="Supprimer"
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* Détail dépliable */}
                {isExpanded && <AssessmentDetail assessment={a} />}
              </li>
            )
          })}
        </ul>
      )}

      {!loading && assessments.length === 0 && !formOpen && (
        <p className="cssrs-panel__empty">Aucune évaluation pour ce patient.</p>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Supprimer cette évaluation ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  )
}

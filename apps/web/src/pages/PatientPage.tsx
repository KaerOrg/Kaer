import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import {
  MODULE_LABELS,
  MODULE_DESCRIPTIONS,
  PSYCHO_CARD_CATALOG,
  type ModuleType,
  type PatientModule,
  type PsychoeducationCardEntry,
} from '../lib/database.types'
import {
  MODULE_PREVIEW,
  markdownToHtml,
  type ModulePreview,
} from '../lib/modulePreviewContent'
import './PatientPage.css'

// ─── Structure en catégories ─────────────────────────────────────────────────

interface ModuleCategory {
  id: string
  label: string
  subtitle: string
  modules: ModuleType[]
}

const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: 'safety',
    label: 'Sécurité & Gestion de Crise',
    subtitle: 'Le bouclier vital',
    modules: ['crisis_plan', 'therapeutic_commitment', 'distress_tolerance'],
  },
  {
    id: 'iatrogenic',
    label: 'Surveillance Iatrogénique & Somatique',
    subtitle: 'Cœur de métier IPA',
    modules: ['medication_side_effects', 'medication_adherence', 'psychoeducation'],
  },
  {
    id: 'lifestyle',
    label: 'Hygiène de Vie & Rythmes Biologiques',
    subtitle: 'Le socle métabolique',
    modules: ['sleep_diary', 'diet_weight_psycho', 'chronobiology_tracker'],
  },
  {
    id: 'emotion',
    label: 'Régulation Émotionnelle & Humeur',
    subtitle: '',
    modules: ['mood_tracker', 'emotion_wheel', 'behavioral_activation'],
  },
  {
    id: 'cognitive',
    label: 'Restructuration Cognitive',
    subtitle: 'Le moteur de la TCC',
    modules: ['beck_columns', 'cognitive_distortions', 'grounding', 'rim'],
  },
  {
    id: 'anxiety',
    label: 'Anxiété, Phobies & TOC',
    subtitle: '',
    modules: ['fear_thermometer', 'exposure_hierarchy', 'breathing_techniques', 'cognitive_saturation'],
  },
  {
    id: 'addiction',
    label: 'Addictologie & Impulsivité',
    subtitle: 'Le module souvent oublié',
    modules: ['craving_journal', 'decisional_balance'],
  },
]

// ─── Helpers psychoéducation ─────────────────────────────────────────────────

function getPsychoCards(mod: PatientModule): PsychoeducationCardEntry[] {
  const config = mod.config as { unlocked_cards?: PsychoeducationCardEntry[] }
  return config?.unlocked_cards ?? []
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function PatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { practitioner } = useAuthStore()

  const [patientEmail, setPatientEmail] = useState('')
  const [patientAlias, setPatientAlias] = useState<string | null>(null)
  const [modules, setModules] = useState<PatientModule[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)

  // Accordéons ouverts — 'safety' ouvert par défaut
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['safety']))

  // Aperçu de module ouvert
  const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)
  const [expandedPreviewCard, setExpandedPreviewCard] = useState<string | null>(null)

  const togglePreview = useCallback((type: ModuleType) => {
    setPreviewModule(prev => (prev === type ? null : type))
    setExpandedPreviewCard(null)
  }, [])

  // État du sélecteur de cartes psychoéducation
  const [psychoPickerMode, setPsychoPickerMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [savingPsycho, setSavingPsycho] = useState(false)
  const [psychoError, setPsychoError] = useState<string | null>(null)

  // État de l'éditeur de scénarios RIM
  const [rimEditorMode, setRimEditorMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [rimAlternative, setRimAlternative] = useState('')
  const [rimOriginal, setRimOriginal] = useState('')
  const [savingRim, setSavingRim] = useState(false)
  const [rimError, setRimError] = useState<string | null>(null)

  useEffect(() => {
    loadPatient()
  }, [id])

  const loadPatient = async () => {
    if (!id || !practitioner) return
    setLoading(true)

    const { data: relation } = await supabase
      .from('practitioner_patients')
      .select('patient_alias, patients(email)')
      .eq('practitioner_id', practitioner.id)
      .eq('patient_id', id)
      .single()

    if (!relation) { navigate('/'); return }

    const patient = Array.isArray(relation.patients) ? relation.patients[0] : relation.patients
    setPatientEmail((patient as { email: string } | null)?.email ?? '')
    setPatientAlias(relation.patient_alias)

    const { data: mods } = await supabase
      .from('patient_modules')
      .select('*')
      .eq('patient_id', id)

    setModules(mods ?? [])
    setLoading(false)
  }

  // ── Module standard ──────────────────────────────────────────────────────

  const unlockModule = async (moduleType: ModuleType) => {
    if (!id || !practitioner) return
    setUnlockingModule(moduleType)
    const { error } = await supabase.from('patient_modules').insert({
      patient_id: id,
      practitioner_id: practitioner.id,
      module_type: moduleType,
      config: {},
    })
    if (!error) await loadPatient()
    setUnlockingModule(null)
  }

  const revokeModule = async (moduleId: string) => {
    await supabase.from('patient_modules').delete().eq('id', moduleId)
    await loadPatient()
  }

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  // ── Accordéons ──────────────────────────────────────────────────────────

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId)
      return next
    })
  }

  // ── Psychoéducation : sélecteur de cartes ────────────────────────────────

  const psychoModule = modules.find(m => m.module_type === 'psychoeducation')

  const openPsychoPicker = (mode: 'unlock' | 'edit') => {
    setPsychoError(null)
    // S'assurer que la catégorie Surveillance est ouverte
    setOpenCategories(prev => new Set([...prev, 'iatrogenic']))
    if (mode === 'edit' && psychoModule) {
      setSelectedCardIds(new Set(getPsychoCards(psychoModule).map(c => c.card_id)))
    } else {
      setSelectedCardIds(new Set(PSYCHO_CARD_CATALOG.map(c => c.id)))
    }
    setPsychoPickerMode(mode)
  }

  const toggleCard = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      next.has(cardId) ? next.delete(cardId) : next.add(cardId)
      return next
    })
  }

  const confirmPsycho = async () => {
    if (!id || !practitioner) return
    if (selectedCardIds.size === 0) {
      setPsychoError('Sélectionnez au moins une carte.')
      return
    }

    setSavingPsycho(true)
    setPsychoError(null)
    const now = new Date().toISOString()

    if (psychoPickerMode === 'unlock') {
      const cards: PsychoeducationCardEntry[] = [...selectedCardIds].map(card_id => ({
        card_id,
        is_read: false,
        unlocked_at: now,
      }))
      const { error } = await supabase.from('patient_modules').insert({
        patient_id: id,
        practitioner_id: practitioner.id,
        module_type: 'psychoeducation',
        config: { unlocked_cards: cards },
      })
      if (error) {
        setPsychoError("Erreur lors du déverrouillage. Réessayez.")
        setSavingPsycho(false)
        return
      }
    } else if (psychoPickerMode === 'edit' && psychoModule) {
      const existingById: Record<string, PsychoeducationCardEntry> = Object.fromEntries(
        getPsychoCards(psychoModule).map(c => [c.card_id, c])
      )
      const cards: PsychoeducationCardEntry[] = [...selectedCardIds].map(card_id =>
        existingById[card_id] ?? { card_id, is_read: false, unlocked_at: now }
      )
      const { error } = await supabase
        .from('patient_modules')
        .update({ config: { unlocked_cards: cards } })
        .eq('id', psychoModule.id)
      if (error) {
        setPsychoError("Erreur lors de la mise à jour. Réessayez.")
        setSavingPsycho(false)
        return
      }
    }

    setSavingPsycho(false)
    setPsychoPickerMode('off')
    await loadPatient()
  }

  const cancelPsychoPicker = () => {
    setPsychoPickerMode('off')
    setPsychoError(null)
  }

  // ── RIM : éditeur de scénarios ──────────────────────────────────────────

  const rimModule = modules.find(m => m.module_type === 'rim')

  const openRimEditor = (mode: 'unlock' | 'edit') => {
    setRimError(null)
    setOpenCategories(prev => new Set([...prev, 'cognitive']))
    if (mode === 'edit' && rimModule) {
      const cfg = rimModule.config as { alternative_scenario?: string; original_scenario?: string }
      setRimAlternative(cfg.alternative_scenario ?? '')
      setRimOriginal(cfg.original_scenario ?? '')
    } else {
      setRimAlternative('')
      setRimOriginal('')
    }
    setRimEditorMode(mode)
  }

  const cancelRimEditor = () => {
    setRimEditorMode('off')
    setRimError(null)
  }

  const confirmRim = async () => {
    if (!id || !practitioner) return
    if (!rimAlternative.trim()) {
      setRimError('Le scénario alternatif est obligatoire.')
      return
    }
    setSavingRim(true)
    setRimError(null)
    const alt = rimAlternative.trim()
    const orig = rimOriginal.trim()
    const rimCfg: Record<string, unknown> = { alternative_scenario: alt }
    if (orig) rimCfg['original_scenario'] = orig

    if (rimEditorMode === 'unlock') {
      const { error } = await supabase.from('patient_modules').insert({
        patient_id: id,
        practitioner_id: practitioner.id,
        module_type: 'rim',
        config: rimCfg,
      })
      if (error) { setRimError("Erreur lors du déverrouillage. Réessayez."); setSavingRim(false); return }
    } else if (rimEditorMode === 'edit' && rimModule) {
      const { error } = await supabase
        .from('patient_modules')
        .update({ config: rimCfg })
        .eq('id', rimModule.id)
      if (error) { setRimError("Erreur lors de la mise à jour. Réessayez."); setSavingRim(false); return }
    }
    setSavingRim(false)
    setRimEditorMode('off')
    await loadPatient()
  }

  // ── Radar ────────────────────────────────────────────────────────────────

  const unreadPsychoCards = psychoModule
    ? getPsychoCards(psychoModule).filter(c => !c.is_read).length
    : 0
  const totalPsychoCards = psychoModule ? getPsychoCards(psychoModule).length : 0

  // ── Rendu du panneau d'aperçu ────────────────────────────────────────────

  const renderPreviewPanel = (preview: ModulePreview) => {
    if (preview.kind === 'coming_soon') {
      return (
        <div className="preview-panel__coming-soon">
          Module en cours de développement — aperçu non disponible.
        </div>
      )
    }

    if (preview.kind === 'steps') {
      return (
        <>
          <ol className="preview-steps">
            {preview.steps.map(step => (
              <li key={step.number} className="preview-step">
                <span className="preview-step__num" style={{ backgroundColor: step.color }}>{step.number}</span>
                <div>
                  <div className="preview-step__title">{step.title}</div>
                  <div className="preview-step__hint">"{step.hint}"</div>
                </div>
              </li>
            ))}
          </ol>
          {preview.footer && <p className="preview-panel__footer">{preview.footer}</p>}
        </>
      )
    }

    if (preview.kind === 'fields') {
      return (
        <>
          <ul className="preview-fields">
            {preview.fields.map(field => (
              <li key={field.label} className="preview-field">
                <span className="preview-field__icon">{field.icon}</span>
                <span className="preview-field__label">{field.label}</span>
                {field.detail && <span className="preview-field__detail">{field.detail}</span>}
              </li>
            ))}
          </ul>
          {preview.footer && (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <p>{preview.footer}</p>
            </div>
          )}
        </>
      )
    }

    if (preview.kind === 'grid2x2') {
      return (
        <>
          <div className="preview-grid2x2">
            {preview.quadrants.map(q => (
              <div key={q.title} className="preview-quadrant" style={{ borderTopColor: q.color }}>
                <div className="preview-quadrant__title" style={{ color: q.color }}>{q.title}</div>
                <div className="preview-quadrant__subtitle">{q.subtitle}</div>
              </div>
            ))}
          </div>
          {preview.footer && <p className="preview-panel__footer">{preview.footer}</p>}
        </>
      )
    }

    if (preview.kind === 'cards') {
      return (
        <div className="preview-cards">
          {preview.cards.map(card => (
            <div key={card.id} className="preview-card">
              <button
                className="preview-card__header"
                onClick={() => setExpandedPreviewCard(prev => prev === card.id ? null : card.id)}
              >
                <div className="preview-card__meta">
                  <span className="preview-card__title">{card.title}</span>
                  <span className="preview-card__summary">{card.summary}</span>
                </div>
                <span className="preview-card__toggle">
                  {expandedPreviewCard === card.id ? '▲' : '▼'}
                </span>
              </button>
              {expandedPreviewCard === card.id && (
                <div
                  className="preview-card__body"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(card.content) }}
                />
              )}
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  // ── Rendu d'une carte module ─────────────────────────────────────────────

  const renderModuleCard = (moduleType: ModuleType) => {
    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod

    if (moduleType === 'psychoeducation') {
      const cards = mod ? getPsychoCards(mod) : []
      const readCount = cards.filter(c => c.is_read).length

      return (
        <div key="psychoeducation" className="module-card-wrapper module-card-wrapper-block">
          <div className={`module-card ${unlocked ? 'module-card--active module-card--psycho' : ''}`}>
            <div className="module-card__content">
              <div className="module-card__name">{MODULE_LABELS['psychoeducation']}</div>
              <div className="module-card__desc">{MODULE_DESCRIPTIONS['psychoeducation']}</div>
              {unlocked && mod && (
                <>
                  <div className="module-card__date">
                    Débloqué le {new Date(mod.unlocked_at).toLocaleDateString('fr-FR')}
                    {' · '}
                    <span className="psycho-observance-summary">
                      {readCount}/{cards.length} carte{cards.length > 1 ? 's' : ''} lue{readCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  {cards.length > 0 && (
                    <ul className="psycho-observance-list">
                      {cards.map(card => {
                        const meta = PSYCHO_CARD_CATALOG.find(c => c.id === card.card_id)
                        return (
                          <li key={card.card_id} className="psycho-observance-item">
                            <span className="psycho-observance-item__title">
                              {meta?.title ?? card.card_id}
                            </span>
                            {card.is_read ? (
                              <span className="psycho-observance-item__badge psycho-observance-item__badge--read">
                                ✓ Lu
                              </span>
                            ) : (
                              <span className="psycho-observance-item__badge psycho-observance-item__badge--unread">
                                Non lu
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
            <div className="module-card__actions">
              {MODULE_PREVIEW['psychoeducation'] && (
                <button
                  className={`preview-toggle-btn ${previewModule === 'psychoeducation' ? 'preview-toggle-btn--active' : ''}`}
                  onClick={() => togglePreview('psychoeducation')}
                  title="Aperçu du contenu patient"
                >
                  {previewModule === 'psychoeducation' ? <EyeOff size={14} /> : <Eye size={14} />}
                  Aperçu
                </button>
              )}
              {unlocked && mod ? (
                <>
                  <span className="module-card__badge"><Check size={14} /> Actif</span>
                  {psychoPickerMode !== 'edit' && (
                    <Button variant="ghost" size="sm" onClick={() => openPsychoPicker('edit')}>
                      Modifier les cartes
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="module-card__revoke"
                    onClick={() => { cancelPsychoPicker(); revokeModule(mod.id) }}
                  >
                    Révoquer
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    psychoPickerMode === 'unlock' ? cancelPsychoPicker() : openPsychoPicker('unlock')
                  }
                >
                  {psychoPickerMode === 'unlock' ? 'Annuler' : 'Débloquer'}
                </Button>
              )}
            </div>
          </div>

          {/* Panneau d'aperçu psychoéducation */}
          {previewModule === 'psychoeducation' && MODULE_PREVIEW['psychoeducation'] && (
            <div className="preview-panel">
              <div className="preview-panel__header">
                <Eye size={14} />
                Ce que verra votre patient
              </div>
              {renderPreviewPanel(MODULE_PREVIEW['psychoeducation'])}
            </div>
          )}

          {/* Sélecteur de cartes inline */}
          {(psychoPickerMode === 'unlock' || psychoPickerMode === 'edit') && (
            <div className={`psycho-card-picker ${psychoPickerMode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
              <p className="psycho-card-picker__label">
                {psychoPickerMode === 'unlock'
                  ? 'Choisissez les cartes à débloquer pour ce patient :'
                  : 'Modifier les cartes débloquées pour ce patient :'}
              </p>
              <ul className="psycho-card-picker__list">
                {PSYCHO_CARD_CATALOG.map(card => (
                  <li key={card.id} className="psycho-card-option">
                    <label className="psycho-card-option__label">
                      <input
                        type="checkbox"
                        className="psycho-card-option__checkbox"
                        checked={selectedCardIds.has(card.id)}
                        onChange={() => toggleCard(card.id)}
                      />
                      <div>
                        <div className="psycho-card-option__title">{card.title}</div>
                        <div className="psycho-card-option__desc">{card.description}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              {psychoError && <p className="psycho-card-picker__error">{psychoError}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={savingPsycho} onClick={confirmPsycho}>
                  {psychoPickerMode === 'unlock'
                    ? `Débloquer ${selectedCardIds.size} carte${selectedCardIds.size > 1 ? 's' : ''}`
                    : 'Enregistrer les modifications'}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelPsychoPicker}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (moduleType === 'rim') {
      const cfg = mod?.config as { alternative_scenario?: string; original_scenario?: string } | undefined
      return (
        <div key="rim" className="module-card-wrapper module-card-wrapper-block">
          <div className={`module-card ${unlocked ? 'module-card--active module-card--psycho' : ''}`}>
            <div className="module-card__content">
              <div className="module-card__name">{MODULE_LABELS['rim']}</div>
              <div className="module-card__desc">{MODULE_DESCRIPTIONS['rim']}</div>
              {unlocked && mod && (
                <div className="module-card__date">
                  Débloqué le {new Date(mod.unlocked_at).toLocaleDateString('fr-FR')}
                  {cfg?.alternative_scenario && (
                    <span className="psycho-observance-summary"> · Scénario configuré</span>
                  )}
                </div>
              )}
            </div>
            <div className="module-card__actions">
              {unlocked && mod ? (
                <>
                  <span className="module-card__badge"><Check size={14} /> Actif</span>
                  {rimEditorMode !== 'edit' && (
                    <Button variant="ghost" size="sm" onClick={() => openRimEditor('edit')}>
                      Modifier le scénario
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="module-card__revoke"
                    onClick={() => { cancelRimEditor(); revokeModule(mod.id) }}
                  >
                    Révoquer
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    rimEditorMode === 'unlock' ? cancelRimEditor() : openRimEditor('unlock')
                  }
                >
                  {rimEditorMode === 'unlock' ? 'Annuler' : 'Débloquer'}
                </Button>
              )}
            </div>
          </div>

          {/* Éditeur de scénarios RIM inline */}
          {(rimEditorMode === 'unlock' || rimEditorMode === 'edit') && (
            <div className="psycho-card-picker">
              <p className="psycho-card-picker__label">
                {rimEditorMode === 'unlock'
                  ? 'Rédigez le scénario alternatif pour ce patient :'
                  : 'Modifier le scénario alternatif :'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Scénario alternatif <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Décrivez ici le scénario positif de substitution au cauchemar..."
                    value={rimAlternative}
                    onChange={e => setRimAlternative(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Scénario initial (optionnel — référence)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Description du cauchemar original, pour référence..."
                    value={rimOriginal}
                    onChange={e => setRimOriginal(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {rimError && <p className="psycho-card-picker__error">{rimError}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={savingRim} onClick={confirmRim}>
                  {rimEditorMode === 'unlock' ? 'Débloquer avec ce scénario' : 'Enregistrer le scénario'}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelRimEditor}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    const preview = MODULE_PREVIEW[moduleType]

    return (
      <div key={moduleType} className="module-card-wrapper-block">
        <div className={`module-card ${unlocked ? 'module-card--active' : ''}`}>
          <div className="module-card__content">
            <div className="module-card__name">{MODULE_LABELS[moduleType]}</div>
            <div className="module-card__desc">{MODULE_DESCRIPTIONS[moduleType]}</div>
            {unlocked && mod && (
              <div className="module-card__date">
                Débloqué le {new Date(mod.unlocked_at).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
          <div className="module-card__actions">
            {preview && (
              <button
                className={`preview-toggle-btn ${previewModule === moduleType ? 'preview-toggle-btn--active' : ''}`}
                onClick={() => togglePreview(moduleType)}
                title="Aperçu du contenu patient"
              >
                {previewModule === moduleType ? <EyeOff size={14} /> : <Eye size={14} />}
                Aperçu
              </button>
            )}
            {unlocked && mod ? (
              <>
                <span className="module-card__badge"><Check size={14} /> Actif</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="module-card__revoke"
                  onClick={() => revokeModule(mod.id)}
                >
                  Révoquer
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                loading={unlockingModule === moduleType}
                onClick={() => unlockModule(moduleType)}
              >
                Débloquer
              </Button>
            )}
          </div>
        </div>

        {/* Panneau d'aperçu inline */}
        {previewModule === moduleType && preview && (
          <div className="preview-panel">
            <div className="preview-panel__header">
              <Eye size={14} />
              Ce que verra votre patient
            </div>
            {renderPreviewPanel(preview)}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────

  const displayName = patientAlias ?? patientEmail

  return (
    <Layout>
      <div className="patient-page">
        <button className="patient-page__back" onClick={() => navigate('/')}>
          ← Retour à mes patients
        </button>

        <div className="patient-page__header">
          <div className="patient-page__avatar">
            {displayName[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="patient-page__name">{displayName}</h1>
            <p className="patient-page__email">{patientEmail}</p>
          </div>
        </div>

        {loading ? (
          <div className="patient-page__loading">Chargement…</div>
        ) : (
          <>
            {/* ── Radar ─────────────────────────────────────────────────── */}
            <section className="radar">
              <h2 className="radar__title">
                Tableau de bord
                {modules.length > 0 && (
                  <span className="radar__count">
                    {modules.length} outil{modules.length > 1 ? 's' : ''} actif{modules.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>

              {modules.length === 0 ? (
                <div className="radar__empty">
                  Aucun outil débloqué — utilisez l'armoire thérapeutique ci-dessous.
                </div>
              ) : (
                <div className="radar__grid">
                  {isUnlocked('crisis_plan') && (
                    <div className="radar__alert radar__alert--info">
                      <div className="radar__alert-label">Plan de crise</div>
                      <div className="radar__alert-value">Actif</div>
                    </div>
                  )}
                  {psychoModule && (
                    <div className={`radar__alert ${unreadPsychoCards > 0 ? 'radar__alert--warning' : 'radar__alert--info'}`}>
                      <div className="radar__alert-label">Psychoéducation</div>
                      <div className="radar__alert-value">
                        {totalPsychoCards - unreadPsychoCards}/{totalPsychoCards} lues
                      </div>
                    </div>
                  )}
                  {isUnlocked('sleep_diary') && (
                    <div className="radar__alert radar__alert--info">
                      <div className="radar__alert-label">Agenda du sommeil</div>
                      <div className="radar__alert-value">Actif</div>
                    </div>
                  )}
                  {modules
                    .filter(m => !['crisis_plan', 'psychoeducation', 'sleep_diary'].includes(m.module_type))
                    .map(m => (
                      <div key={m.id} className="radar__alert radar__alert--info">
                        <div className="radar__alert-label">{MODULE_LABELS[m.module_type]}</div>
                        <div className="radar__alert-value">Actif</div>
                      </div>
                    ))}
                  <div className="radar__alert radar__alert--placeholder">
                    <div className="radar__alert-label">Données temps réel</div>
                    <div className="radar__alert-value">Bientôt disponible</div>
                  </div>
                </div>
              )}
            </section>

            {/* ── Armoire Thérapeutique ──────────────────────────────────── */}
            <section className="therapeutic-wardrobe">
              <h2 className="wardrobe__title">Armoire Thérapeutique</h2>
              <p className="wardrobe__desc">
                Cliquez sur une catégorie pour voir les outils disponibles et les débloquer pour ce patient.
              </p>

              <div className="category-list">
                {MODULE_CATEGORIES.map(category => {
                  const isOpen = openCategories.has(category.id)
                  const activeCount = category.modules.filter(m => isUnlocked(m)).length

                  return (
                    <div
                      key={category.id}
                      className={`category-accordion ${isOpen ? 'category-accordion--open' : ''}`}
                    >
                      <button
                        className="category-accordion__header"
                        onClick={() => toggleCategory(category.id)}
                        aria-expanded={isOpen}
                      >
                        <div className="category-accordion__heading">
                          <span className="category-accordion__label">{category.label}</span>
                        </div>
                        <div className="category-accordion__meta">
                          {activeCount > 0 && (
                            <span className="category-accordion__badge">
                              {activeCount} actif{activeCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {isOpen
                            ? <ChevronDown size={18} className="category-accordion__chevron" />
                            : <ChevronRight size={18} className="category-accordion__chevron" />
                          }
                        </div>
                      </button>

                      {isOpen && (
                        <div className="category-accordion__body">
                          {category.modules.map(renderModuleCard)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}

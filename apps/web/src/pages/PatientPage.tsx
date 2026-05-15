import React, { useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Eye, EyeOff, Bell, Search, LayoutDashboard, Package2, FileText, CalendarDays, Clock } from 'lucide-react'
import { LUCIDE_ICONS } from '../lib/lucideIcons'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Toggle } from '../components/Toggle/Toggle'
import { Accordion } from '../components/Accordion'
import { StatusBadge } from '../components/StatusBadge'
import {
  type ModuleType,
  type PatientModule,
  type PsychoeducationCardEntry,
} from '../lib/database.types'
import { CLINICAL_SCALES } from '../data/scales'
import { CSSRSScreenPanel } from '../components/CSSRSScreenPanel'
import { fetchPsychoCards, type PsychoCardInfo } from '../services/moduleService'
import { ModulePreviewPanel } from '../components/ModulePreviewPanel'
import {
  fetchModuleCategories,
  fetchComingSoonModuleIds,
  type ModuleCategory,
  type ModuleItem,
} from '../services/moduleCatalogService'
import { fetchPatientHeader, setTeenMode as updateTeenMode, saveGeneralNote } from '../services/patientService'
import {
  fetchNotes,
  saveNote,
  updateNote,
  deleteNote,
  type PractitionerNote,
} from '../services/noteService'
import {
  fetchPatientModules,
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
  unlockPsychoeducation,
  updatePsychoeducationCards,
  unlockRim,
  updateRim,
} from '../services/moduleAssignmentService'
import { fetchEnabledModules } from '../services/practitionerSettingsService'
import { NotificationRoutineModal } from '../components/NotificationRoutineModal/NotificationRoutineModal'
import { Tabs } from '../components/Tabs'
import { extractUniqueTags, extractTopTags } from '../services/noteService'
import { SpeechToTextButton } from '../components/SpeechToTextButton'

import './PatientPage.css'

const SCALE_IDS = new Set(CLINICAL_SCALES.map(s => s.id))

type PageData = {
  modules: PatientModule[]
  categories: ModuleCategory[]
  enabledModules: Set<ModuleType> | null
  psychoCards: PsychoCardInfo[]
  comingSoonIds: Set<string>
}

const PAGE_DATA_INITIAL: PageData = {
  modules: [],
  categories: [],
  enabledModules: null,
  psychoCards: [],
  comingSoonIds: new Set(),
}


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
  const { t, i18n } = useTranslation()

  const [patientEmail, setPatientEmail] = useState('')
  const [patientAlias, setPatientAlias] = useState<string | null>(null)
  const [patientFirstName, setPatientFirstName] = useState<string | null>(null)
  const [patientLastName, setPatientLastName] = useState<string | null>(null)
  const [patientEnrolledAt, setPatientEnrolledAt] = useState<string | null>(null)
  const [pageData, setPageData] = useState<PageData>(PAGE_DATA_INITIAL)
  const { modules, categories, enabledModules, psychoCards, comingSoonIds } = pageData
  const [loading, setLoading] = useState(true)
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)
  const [revokingModuleId, setRevokingModuleId] = useState<string | null>(null)
  const [teenMode, setTeenMode] = useState(false)
  const [togglingTeen, setTogglingTeen] = useState(false)

  const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)

  const togglePreview = useCallback((type: ModuleType) => {
    setPreviewModule(prev => (prev === type ? null : type))
  }, [])

  const [psychoPickerMode, setPsychoPickerMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [savingPsycho, setSavingPsycho] = useState(false)
  const [psychoError, setPsychoError] = useState<string | null>(null)

  const [rimEditorMode, setRimEditorMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [rimAlternative, setRimAlternative] = useState('')
  const [rimOriginal, setRimOriginal] = useState('')
  const [savingRim, setSavingRim] = useState(false)
  const [rimError, setRimError] = useState<string | null>(null)

  const [notifModal, setNotifModal] = useState<{ patientModuleId: string; moduleLabel: string; moduleIconName: string } | null>(null)

  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'notes' | 'rdv'>('overview')

  // ── Notes praticien ──────────────────────────────────────────────────────
  const [notes, setNotes] = useState<PractitionerNote[]>([])
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [editingTagInput, setEditingTagInput] = useState('')
  const [updatingNote, setUpdatingNote] = useState(false)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [newNoteTags, setNewNoteTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  const newNoteRef = useRef<HTMLTextAreaElement>(null)
  const streamingActiveRef = useRef(false)
  const [isRecording, setIsRecording] = useState(false)
  const [generalNote, setGeneralNote] = useState('')
  const [generalNoteSaving, setGeneralNoteSaving] = useState(false)
  const [generalNoteError, setGeneralNoteError] = useState<string | null>(null)

  const reloadModules = useCallback(async () => {
    if (!id) return
    const mods = await fetchPatientModules(id)
    setPageData(prev => ({ ...prev, modules: mods }))
  }, [id])

  const loadPatient = useCallback(async () => {
    if (!id || !practitioner) return
    setLoading(true)

    const header = await fetchPatientHeader(practitioner.id, id)
    if (!header) { navigate('/'); return }

    setPatientEmail(header.email)
    setPatientAlias(header.alias)
    setPatientFirstName(header.firstName)
    setPatientLastName(header.lastName)
    setTeenMode(header.teenMode)
    setPatientEnrolledAt(header.enrolledAt)
    setGeneralNote(header.generalNote ?? '')

    const [mods, enabled, cats, cards, comingSoon, fetchedNotes] = await Promise.all([
      fetchPatientModules(id),
      fetchEnabledModules(practitioner.id),
      fetchModuleCategories(),
      fetchPsychoCards(),
      fetchComingSoonModuleIds(),
      fetchNotes(practitioner.id, id),
    ])

    setPageData({
      modules: mods,
      categories: cats,
      enabledModules: enabled,
      psychoCards: cards,
      comingSoonIds: comingSoon,
    })
    setNotes(fetchedNotes)
    setLoading(false)
  }, [id, practitioner, navigate])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

  // ── Module standard ──────────────────────────────────────────────────────

  const unlockModule = async (moduleType: ModuleType) => {
    if (!id || !practitioner) return
    setUnlockingModule(moduleType)
    const result = await unlockStandardModule(id, practitioner.id, moduleType)
    if (result.ok) await reloadModules()
    setUnlockingModule(null)
  }

  const revokeModule = async (moduleId: string) => {
    await revokeModuleService(moduleId)
    await reloadModules()
  }

  const revokeScale = async (moduleId: string) => {
    setRevokingModuleId(moduleId)
    await revokeModuleService(moduleId)
    await reloadModules()
    setRevokingModuleId(null)
  }

  const activeScales = modules.filter(m => SCALE_IDS.has(m.module_type))
  const autoScales = activeScales.filter(
    m => CLINICAL_SCALES.find(s => s.id === m.module_type)?.evaluationType === 'auto'
  )
  const heteroScales = activeScales.filter(
    m => CLINICAL_SCALES.find(s => s.id === m.module_type)?.evaluationType === 'hetero'
  )

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  const toggleTeenMode = async () => {
    if (!id || !practitioner) return
    setTogglingTeen(true)
    const next = !teenMode
    const { ok } = await updateTeenMode(practitioner.id, id, next)
    if (ok) setTeenMode(next)
    setTogglingTeen(false)
  }

  // ── Psychoéducation : sélecteur de cartes ────────────────────────────────

  const psychoModule = modules.find(m => m.module_type === 'psychoeducation')

  const openPsychoPicker = (mode: 'unlock' | 'edit') => {
    setPsychoError(null)
    if (mode === 'edit' && psychoModule) {
      setSelectedCardIds(new Set(getPsychoCards(psychoModule).map(c => c.card_id)))
    } else {
      setSelectedCardIds(new Set(psychoCards.map(c => c.id)))
    }
    setPsychoPickerMode(mode)
  }

  const toggleCard = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) { next.delete(cardId) } else { next.add(cardId) }
      return next
    })
  }

  const confirmPsycho = async () => {
    if (!id || !practitioner) return
    if (selectedCardIds.size === 0) {
      setPsychoError(t('patient.psycho_pick_error'))
      return
    }

    setSavingPsycho(true)
    setPsychoError(null)

    if (psychoPickerMode === 'unlock') {
      const { ok } = await unlockPsychoeducation(id, practitioner.id, selectedCardIds)
      if (!ok) {
        setPsychoError(t('patient.psycho_error_unlock'))
        setSavingPsycho(false)
        return
      }
    } else if (psychoPickerMode === 'edit' && psychoModule) {
      const { ok } = await updatePsychoeducationCards(
        psychoModule.id,
        getPsychoCards(psychoModule),
        selectedCardIds
      )
      if (!ok) {
        setPsychoError(t('patient.psycho_error_update'))
        setSavingPsycho(false)
        return
      }
    }

    setSavingPsycho(false)
    setPsychoPickerMode('off')
    await reloadModules()
  }

  const cancelPsychoPicker = () => {
    setPsychoPickerMode('off')
    setPsychoError(null)
  }

  // ── RIM : éditeur de scénarios ──────────────────────────────────────────

  const rimModule = modules.find(m => m.module_type === 'rim')

  const openRimEditor = (mode: 'unlock' | 'edit') => {
    setRimError(null)
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
      setRimError(t('patient.rim_error_required'))
      return
    }
    setSavingRim(true)
    setRimError(null)
    const scenario = { alternative: rimAlternative.trim(), original: rimOriginal.trim() }

    if (rimEditorMode === 'unlock') {
      const { ok } = await unlockRim(id, practitioner.id, scenario)
      if (!ok) { setRimError(t('patient.rim_error_unlock')); setSavingRim(false); return }
    } else if (rimEditorMode === 'edit' && rimModule) {
      const { ok } = await updateRim(rimModule.id, scenario)
      if (!ok) { setRimError(t('patient.rim_error_update')); setSavingRim(false); return }
    }
    setSavingRim(false)
    setRimEditorMode('off')
    await reloadModules()
  }

  // ── Notes praticien ──────────────────────────────────────────────────────

  const addNewTag = () => {
    const tag = newTagInput.trim()
    if (tag && !newNoteTags.includes(tag)) {
      setNewNoteTags(prev => [...prev, tag])
    }
    setNewTagInput('')
  }

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addNewTag() }
  }

  const addEditingTag = () => {
    const tag = editingTagInput.trim()
    if (tag && !editingTags.includes(tag)) {
      setEditingTags(prev => [...prev, tag])
    }
    setEditingTagInput('')
  }

  const handleEditingTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addEditingTag() }
  }

  const handleRecordingChange = useCallback((recording: boolean) => {
    setIsRecording(recording)
  }, [])

  const handleStreamStart = useCallback(() => {
    streamingActiveRef.current = true
    if (!newNoteRef.current) return
    if (newNoteRef.current.value) newNoteRef.current.value += '\n'
  }, [])

  const handleTextChunk = useCallback((delta: string) => {
    if (!newNoteRef.current) return
    newNoteRef.current.value += delta
  }, [])

  const handleTranscription = useCallback((text: string) => {
    if (streamingActiveRef.current) {
      streamingActiveRef.current = false
      return
    }
    if (!newNoteRef.current) return
    const current = newNoteRef.current.value
    newNoteRef.current.value = current ? `${current}\n${text}` : text
  }, [])

  const handleSaveNote = async () => {
    if (!id || !practitioner) return
    const content = newNoteRef.current?.value ?? ''
    if (!content.trim()) { setNoteError(t('notes.error_empty')); return }
    setSavingNote(true)
    setNoteError(null)
    const result = await saveNote(practitioner.id, id, content, newNoteTags)
    if (result.ok && result.note) {
      setNotes(prev => [result.note!, ...prev])
      if (newNoteRef.current) newNoteRef.current.value = ''
      setNewNoteTags([])
      setNewTagInput('')
    } else {
      setNoteError(t('notes.error_save'))
    }
    setSavingNote(false)
  }

  const handleSaveGeneralNote = async () => {
    if (!id || !practitioner) return
    setGeneralNoteSaving(true)
    setGeneralNoteError(null)
    const { ok } = await saveGeneralNote(practitioner.id, id, generalNote)
    if (!ok) setGeneralNoteError(t('notes.error_save'))
    setGeneralNoteSaving(false)
  }

  const handleStartEditNote = (note: PractitionerNote) => {
    setEditingNoteId(note.id)
    setEditingContent(note.content)
    setEditingTags(note.tags)
    setEditingTagInput('')
    setNoteError(null)
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditingContent('')
    setEditingTags([])
    setEditingTagInput('')
    setNoteError(null)
  }

  const handleUpdateNote = async () => {
    if (!editingNoteId) return
    if (!editingContent.trim()) { setNoteError(t('notes.error_empty')); return }
    setUpdatingNote(true)
    setNoteError(null)
    const result = await updateNote(editingNoteId, editingContent, editingTags)
    if (result.ok) {
      setNotes(prev => prev.map(n =>
        n.id === editingNoteId
          ? { ...n, content: editingContent.trim(), tags: editingTags, updated_at: new Date().toISOString() }
          : n
      ))
      setEditingNoteId(null)
      setEditingContent('')
      setEditingTags([])
    } else {
      setNoteError(t('notes.error_update'))
    }
    setUpdatingNote(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId)
    const result = await deleteNote(noteId)
    if (result.ok) {
      setNotes(prev => prev.filter(n => n.id !== noteId))
    }
    setConfirmDeleteNoteId(null)
    setDeletingNoteId(null)
  }

  // ── Rendu d'une carte module ─────────────────────────────────────────────

  const moduleToggle = (on: boolean, loading: boolean, onToggle: () => void) => (
    <button
      className="module-toggle"
      onClick={onToggle}
      disabled={loading}
      aria-label={on ? t('patient.revoke_button') : t('patient.unlock_button')}
    >
      <Toggle checked={on} />
    </button>
  )

  const renderModuleCard = (modItem: ModuleItem) => {
    const moduleType = modItem.id as ModuleType
    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod
    const ModIcon = LUCIDE_ICONS[modItem.icon]
    const modIcon = ModIcon ? <ModIcon size={18} /> : undefined

    if (moduleType === 'psychoeducation') {
      const cards = mod ? getPsychoCards(mod) : []
      const readCount = cards.filter(c => c.is_read).length

      const handlePsychoToggle = () => {
        if (unlocked && mod) { cancelPsychoPicker(); revokeModule(mod.id) }
        else if (psychoPickerMode === 'unlock') cancelPsychoPicker()
        else openPsychoPicker('unlock')
      }

      return (
        <div key="psychoeducation" className={`module-card-wrapper module-card-wrapper-block ${psychoPickerMode !== 'off' || previewModule === 'psychoeducation' ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.psychoeducation.label'),
              subtitle: t('modules.psychoeducation.description'),
              right: moduleToggle(unlocked, false, handlePsychoToggle),
            }}
            actions={
              <>
                <button
                  className={`preview-toggle-btn ${previewModule === 'psychoeducation' ? 'preview-toggle-btn--active' : ''}`}
                  onClick={() => togglePreview('psychoeducation')}
                  title={t('patient.patient_view')}
                >
                  {previewModule === 'psychoeducation' ? <EyeOff size={14} /> : <Eye size={14} />}
                  {t('patient.preview_button')}
                </button>
                {unlocked && mod && psychoPickerMode !== 'edit' && (
                  <Button variant="ghost" size="sm" onClick={() => openPsychoPicker('edit')}>
                    {t('patient.psycho_edit_cards')}
                  </Button>
                )}
              </>
            }
          >
            {unlocked && mod && (
              <>
                <div className="module-card__date">
                  {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                  {' · '}
                  <span className="psycho-observance-summary">
                    {cards.length === 1
                      ? t('patient.psycho_read_count', { read: readCount, total: cards.length })
                      : t('patient.psycho_read_count_plural', { read: readCount, total: cards.length })}
                  </span>
                </div>
                {cards.length > 0 && (
                  <ul className="psycho-observance-list">
                    {cards.map(card => {
                      const meta = psychoCards.find(c => c.id === card.card_id)
                      return (
                        <li key={card.card_id} className="psycho-observance-item">
                          <span className="psycho-observance-item__title">
                            {meta ? t(meta.titleKey) : card.card_id}
                          </span>
                          {card.is_read
                            ? <StatusBadge variant="success" label="Lu" />
                            : <StatusBadge variant="neutral" label="Non lu" />
                          }
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </Card>

          {previewModule === 'psychoeducation' && (
            <ModulePreviewPanel moduleType="psychoeducation" color={modItem.color} />
          )}

          {(psychoPickerMode === 'unlock' || psychoPickerMode === 'edit') && (
            <div className={`psycho-card-picker ${psychoPickerMode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
              <p className="psycho-card-picker__label">
                {psychoPickerMode === 'unlock'
                  ? t('patient.psycho_pick_unlock')
                  : t('patient.psycho_pick_edit')}
              </p>
              <ul className="psycho-card-picker__list">
                {psychoCards.map(card => (
                  <li key={card.id} className="psycho-card-option">
                    <label className="psycho-card-option__label">
                      <input
                        type="checkbox"
                        className="psycho-card-option__checkbox"
                        checked={selectedCardIds.has(card.id)}
                        onChange={() => toggleCard(card.id)}
                      />
                      <div>
                        <div className="psycho-card-option__title">{t(card.titleKey)}</div>
                        <div className="psycho-card-option__desc">{t(card.summaryKey)}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              {psychoError && <p className="psycho-card-picker__error">{psychoError}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={savingPsycho} onClick={confirmPsycho}>
                  {psychoPickerMode === 'unlock'
                    ? (selectedCardIds.size === 1
                        ? t('patient.psycho_unlock_btn', { count: selectedCardIds.size })
                        : t('patient.psycho_unlock_btn_plural', { count: selectedCardIds.size }))
                    : t('patient.psycho_save_btn')}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelPsychoPicker}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (moduleType === 'rim') {
      const cfg = mod?.config as { alternative_scenario?: string; original_scenario?: string } | undefined

      const handleRimToggle = () => {
        if (unlocked && mod) { cancelRimEditor(); revokeModule(mod.id) }
        else if (rimEditorMode === 'unlock') cancelRimEditor()
        else openRimEditor('unlock')
      }

      return (
        <div key="rim" className={`module-card-wrapper module-card-wrapper-block ${rimEditorMode !== 'off' ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.rim.label'),
              subtitle: t('modules.rim.description'),
              right: moduleToggle(unlocked, false, handleRimToggle),
            }}
            actions={unlocked && mod && rimEditorMode !== 'edit' ? (
              <Button variant="ghost" size="sm" onClick={() => openRimEditor('edit')}>
                {t('patient.rim_edit_scenario')}
              </Button>
            ) : undefined}
          >
            {unlocked && mod && (
              <div className="module-card__date">
                {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                {cfg?.alternative_scenario && (
                  <span className="psycho-observance-summary"> · {t('patient.rim_scenario_configured')}</span>
                )}
              </div>
            )}
          </Card>

          {(rimEditorMode === 'unlock' || rimEditorMode === 'edit') && (
            <div className="psycho-card-picker">
              <p className="psycho-card-picker__label">
                {rimEditorMode === 'unlock'
                  ? t('patient.rim_write_unlock')
                  : t('patient.rim_write_edit')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('patient.rim_alt_label')} <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder={t('patient.rim_alt_placeholder')}
                    value={rimAlternative}
                    onChange={e => setRimAlternative(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('patient.rim_orig_label')}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t('patient.rim_orig_placeholder')}
                    value={rimOriginal}
                    onChange={e => setRimOriginal(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {rimError && <p className="psycho-card-picker__error">{rimError}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={savingRim} onClick={confirmRim}>
                  {rimEditorMode === 'unlock' ? t('patient.rim_btn_unlock') : t('patient.rim_btn_save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelRimEditor}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={moduleType} className={`module-card-wrapper-block ${previewModule === moduleType ? 'module-card-wrapper-block--wide' : ''}`}>
        <Card
          className={`module-card-item${unlocked ? ' module-card--unlocked' : ''}`}
          header={{
            icon: modIcon,
            title: t(`modules.${moduleType}.label`),
            subtitle: t(`modules.${moduleType}.description`),
            right: moduleToggle(unlocked, unlockingModule === moduleType, () => {
              if (unlocked && mod) revokeModule(mod.id)
              else unlockModule(moduleType)
            }),
          }}
          actions={
            <>
              {unlocked && mod && (
                <span className="module-card__date module-card__date--actions">
                  {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                </span>
              )}
              {unlocked && mod && (
                <button
                  type="button"
                  className="module-card__notif-btn"
                  title={t('notifications.configure_button')}
                  onClick={() => setNotifModal({ patientModuleId: mod.id, moduleLabel: t(`modules.${moduleType}.label`), moduleIconName: modItem.icon })}
                >
                  <Bell size={14} />
                </button>
              )}
              <button
                className={`preview-toggle-btn ${previewModule === moduleType ? 'preview-toggle-btn--active' : ''}`}
                onClick={() => togglePreview(moduleType)}
                title={t('patient.patient_view')}
              >
                {previewModule === moduleType ? <EyeOff size={14} /> : <Eye size={14} />}
                {t('patient.preview_button')}
              </button>
            </>
          }
        />

        {previewModule === moduleType && (
          <ModulePreviewPanel moduleType={moduleType} color={modItem.color} />
        )}
      </div>
    )
  }

  const renderScalesGroup = (type: 'auto' | 'hetero', extra?: ReactNode) => {
    const scales = type === 'auto' ? autoScales : heteroScales
    const label = type === 'auto' ? 'Auto-questionnaires' : 'Hétéro-questionnaires'
    const subtitle = scales.length > 0
      ? `${scales.length} questionnaire${scales.length > 1 ? 's' : ''} actif${scales.length > 1 ? 's' : ''}`
      : 'Aucun questionnaire actif pour ce patient'

    return (
      <div className={`scales-section scales-section--${type}`}>
        <div className="scales-section__header">
          <div className="scales-section__left">
            <span className="scales-section__icon">
              <BookOpen size={18} />
            </span>
            <div>
              <span className="scales-section__label">{label}</span>
              <span className="scales-section__sub">{subtitle}</span>
            </div>
          </div>
          <button className="scales-section__add-btn" onClick={() => navigate('/dispensaire')}>
            + Ajouter
          </button>
        </div>

        {scales.length > 0 && (
          <ul className="scales-section__list">
            {scales.map(mod => {
              const scale = CLINICAL_SCALES.find(s => s.id === mod.module_type)
              return (
                <li key={mod.id} className="scales-section__item">
                  <div className="scales-section__item-info">
                    <span className="scales-section__item-name">{scale?.name ?? mod.module_type}</span>
                    <span className="scales-section__item-date">
                      depuis le {new Date(mod.unlocked_at).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="module-card__revoke"
                    loading={revokingModuleId === mod.id}
                    onClick={() => revokeScale(mod.id)}
                  >
                    Révoquer
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        {extra !== undefined && (
          <div className="scales-section__extra">
            {extra}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────

  const fullName = [patientFirstName, patientLastName].filter(Boolean).join(' ')
  const displayName = patientAlias ?? (fullName || patientEmail)

  const allTags = extractUniqueTags(notes)
  const topTags = extractTopTags(notes, 7)
  const visibleTags = tagSearch
    ? allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).slice(0, 7)
    : topTags
  const filteredNotes = activeTagFilter
    ? notes.filter(n => n.tags.includes(activeTagFilter))
    : tagSearch
      ? notes.filter(n => n.tags.some(t => t.toLowerCase().includes(tagSearch.toLowerCase())))
      : notes

  const PATIENT_TABS = [
    { id: 'overview', label: t('patient.tab_overview'), icon: <LayoutDashboard size={16} /> },
    { id: 'modules',  label: t('patient.tab_modules'),  icon: <Package2 size={16} />,       badge: modules.length || undefined },
    { id: 'notes',    label: t('patient.tab_notes'),    icon: <FileText size={16} />,        badge: notes.length || undefined },
    { id: 'rdv',      label: t('patient.tab_rdv'),      icon: <CalendarDays size={16} />,    badge: 3 },
  ]

  const sidebar = (
    <Tabs
      variant="vertical"
      tabs={[...PATIENT_TABS]}
      activeTab={activeTab}
      onChange={id => setActiveTab(id as typeof activeTab)}
    />
  )

  return (
    <Layout sidebar={sidebar}>
      <div className="patient-page">
        <button className="patient-page__back" onClick={() => navigate('/')}>
          {t('patient.back')}
        </button>

        <div className="patient-page__header">
          <div className="patient-page__avatar">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="patient-page__header-info">
            <h1 className="patient-page__name">{displayName}</h1>
            <p className="patient-page__email">{patientEmail}</p>
          </div>
          <button
            className={`teen-mode-toggle ${teenMode ? 'teen-mode-toggle--active' : ''}`}
            onClick={toggleTeenMode}
            disabled={togglingTeen}
            title={teenMode ? t('patient.teen_mode_disable') : t('patient.teen_mode_enable')}
          >
            <span className="teen-mode-toggle__icon">🎨</span>
            <span className="teen-mode-toggle__label">{t('patient.teen_mode_label')}</span>
            <span className={`teen-mode-toggle__pill ${teenMode ? 'teen-mode-toggle__pill--on' : ''}`}>
              {teenMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="patient-page__loading">{t('common.loading')}</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <section className="patient-overview">
                <div className="patient-overview__stats">
                  <div className="patient-overview__stat">
                    <div className="patient-overview__stat-main">
                      <span className="patient-overview__stat-value">{modules.length}</span>
                      <Package2 size={20} className="patient-overview__stat-icon" />
                    </div>
                    <span className="patient-overview__stat-label">{t('patient.overview_active_modules')}</span>
                  </div>
                  <div className="patient-overview__stat">
                    <div className="patient-overview__stat-main">
                      <span className="patient-overview__stat-value">{notes.length}</span>
                      <FileText size={20} className="patient-overview__stat-icon" />
                    </div>
                    <span className="patient-overview__stat-label">{t('patient.tab_notes')}</span>
                  </div>
                  <div className="patient-overview__stat">
                    <div className="patient-overview__stat-main">
                      <span className="patient-overview__stat-value">0</span>
                      <CalendarDays size={20} className="patient-overview__stat-icon" />
                    </div>
                    <span className="patient-overview__stat-label">{t('patient.overview_rdv_done')}</span>
                  </div>
                  {patientEnrolledAt && (
                    <div className="patient-overview__stat">
                      <div className="patient-overview__stat-main">
                        <span className="patient-overview__stat-value patient-overview__stat-value--date">
                          {new Date(patientEnrolledAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <Clock size={20} className="patient-overview__stat-icon" />
                      </div>
                      <span className="patient-overview__stat-label">{t('patient.overview_enrolled_since')}</span>
                    </div>
                  )}
                </div>

                <div className="patient-overview__block">
                  <div className="patient-overview__block-header">
                    <h3 className="patient-overview__block-title">{t('patient.overview_add_note')}</h3>
                  </div>
                  <textarea
                    className="patient-notes__textarea"
                    placeholder={t('notes.placeholder')}
                    rows={4}
                    value={generalNote}
                    onChange={e => setGeneralNote(e.target.value)}
                  />
                  {generalNoteError && (
                    <p className="patient-notes__error">{generalNoteError}</p>
                  )}
                  <div className="patient-overview__note-form-actions">
                    <Button size="sm" loading={generalNoteSaving} onClick={handleSaveGeneralNote}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>

                <div className="patient-overview__row">
                  <div className="patient-overview__block">
                    <div className="patient-overview__block-header">
                      <h3 className="patient-overview__block-title">{t('patient.overview_active_modules')}</h3>
                      <button className="patient-overview__block-link" onClick={() => setActiveTab('modules')}>
                        + {t('patient.tab_modules')}
                      </button>
                    </div>
                    {modules.length === 0 ? (
                      <p className="patient-overview__empty">{t('patient.overview_no_modules')}</p>
                    ) : (
                      <ul className="patient-overview__module-list">
                        {modules.map(mod => {
                          const catModule = categories.flatMap(c => c.modules).find(m => m.id === mod.module_type)
                          const ModIcon = catModule ? LUCIDE_ICONS[catModule.icon] : undefined
                          return (
                            <li key={mod.id} className="patient-overview__module-item">
                              <span className="patient-overview__module-icon">
                                {ModIcon ? <ModIcon size={14} /> : null}
                              </span>
                              <span className="patient-overview__module-name">
                                {t(`modules.${mod.module_type}.label`)}
                              </span>
                              <span className="patient-overview__module-date">
                                {t('patient.overview_unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="patient-overview__block">
                    <div className="patient-overview__block-header">
                      <h3 className="patient-overview__block-title">{t('patient.overview_recent_notes')}</h3>
                    {notes.length > 3 && (
                      <button className="patient-overview__block-link" onClick={() => setActiveTab('notes')}>
                        {t('patient.overview_see_all_notes')}
                      </button>
                    )}
                  </div>
                  {notes.length === 0 ? (
                    <p className="patient-overview__empty">{t('patient.overview_no_notes')}</p>
                  ) : (
                    <ul className="patient-overview__notes-list">
                      {notes.slice(0, 3).map(note => (
                        <li key={note.id} className="patient-overview__note-item">
                          <p className="patient-overview__note-content">{note.content}</p>
                          <div className="patient-overview__note-meta">
                            {note.tags.length > 0 && (
                              <div className="patient-overview__note-tags">
                                {note.tags.map(tag => (
                                  <span key={tag} className="patient-notes__tag patient-notes__tag--readonly">{tag}</span>
                                ))}
                              </div>
                            )}
                            <span className="patient-overview__note-date">
                              {new Date(note.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'modules' && (
              <section className="therapeutic-wardrobe">
                <h2 className="wardrobe__title">{t('patient.wardrobe_title')}</h2>
                <p className="wardrobe__desc">{t('patient.wardrobe_desc')}</p>

                <div className="category-list">
                  {categories.map(category => {
                    const visibleModules = (enabledModules === null
                      ? category.modules
                      : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
                    ).filter(m => !comingSoonIds.has(m.id))
                    if (visibleModules.length === 0) return null
                    const activeCount = visibleModules.filter(m => isUnlocked(m.id as ModuleType)).length
                    const CatIcon = LUCIDE_ICONS[category.icon]
                    return (
                      <Accordion
                        key={category.id}
                        title={t(category.labelKey)}
                        icon={CatIcon ? <CatIcon size={16} /> : undefined}
                        badge={activeCount > 0 ? activeCount : undefined}
                        defaultOpen={false}
                      >
                        <div className="category-modules-grid">
                          {visibleModules.map(renderModuleCard)}
                        </div>
                      </Accordion>
                    )
                  })}

                  {renderScalesGroup('auto')}
                  {renderScalesGroup('hetero', (
                    <CSSRSScreenPanel
                      patientId={id!}
                      practitionerId={practitioner!.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'notes' && (
              <section className="patient-notes">
                {/* ── Formulaire nouvelle note ─────────────────────────── */}
                <div className="patient-notes__form">
                  <div className={`patient-notes__textarea-frame ${isRecording ? 'patient-notes__textarea-frame--recording' : ''}`}>
                    <textarea
                      ref={newNoteRef}
                      className="patient-notes__textarea"
                      placeholder={t('notes.placeholder')}
                      rows={3}
                    />
                  </div>

                  <div className="patient-notes__tag-row">
                    {newNoteTags.map(tag => (
                      <span key={tag} className="patient-notes__tag">
                        {tag}
                        <button
                          className="patient-notes__tag-remove"
                          onClick={() => setNewNoteTags(prev => prev.filter(t => t !== tag))}
                          aria-label={`Retirer ${tag}`}
                        >×</button>
                      </span>
                    ))}
                    <input
                      className="patient-notes__tag-input"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={handleNewTagKeyDown}
                      onBlur={addNewTag}
                      placeholder={t('notes.tag_placeholder')}
                    />
                  </div>

                  {noteError && !editingNoteId && (
                    <p className="patient-notes__error">{noteError}</p>
                  )}
                  <div className="patient-notes__form-actions">
                    <SpeechToTextButton
                      onTranscription={handleTranscription}
                      onStreamStart={handleStreamStart}
                      onTextChunk={handleTextChunk}
                      onRecordingChange={handleRecordingChange}
                      disabled={savingNote}
                    />
                    <Button size="sm" loading={savingNote} onClick={handleSaveNote}>
                      {t('notes.save_button')}
                    </Button>
                  </div>
                </div>

                {/* ── Filtre par tag ────────────────────────────────────── */}
                {allTags.length > 0 && (
                  <div className="patient-notes__filter-row">
                    <div className="patient-notes__filter-search-wrapper">
                      <Search size={13} className="patient-notes__filter-icon" />
                      <input
                        className="patient-notes__filter-search"
                        value={tagSearch}
                        onChange={e => {
                          const val = e.target.value
                          if (activeTagFilter && allTags.filter(t => !val || t.toLowerCase().includes(val.toLowerCase())).indexOf(activeTagFilter) === -1) {
                            setActiveTagFilter(null)
                          }
                          setTagSearch(val)
                        }}
                        placeholder={t('notes.tag_search_placeholder')}
                      />
                    </div>
                    <button
                      className={`patient-notes__filter-chip ${activeTagFilter === null ? 'patient-notes__filter-chip--active' : ''}`}
                      onClick={() => setActiveTagFilter(null)}
                    >
                      {t('notes.filter_clear')}
                    </button>
                    {visibleTags.map(tag => (
                      <button
                        key={tag}
                        className={`patient-notes__filter-chip ${activeTagFilter === tag ? 'patient-notes__filter-chip--active' : ''}`}
                        onClick={() => setActiveTagFilter(prev => prev === tag ? null : tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Liste de notes ────────────────────────────────────── */}
                {filteredNotes.length === 0 ? (
                  <p className="patient-notes__empty">
                    {activeTagFilter ? t('notes.empty_filtered') : t('notes.empty_state')}
                  </p>
                ) : (
                  <ul className="patient-notes__list">
                    {filteredNotes.map(note => (
                      <li key={note.id} className="patient-notes__item">
                        {editingNoteId === note.id ? (
                          <div className="patient-notes__edit-form">
                            <textarea
                              className="patient-notes__textarea"
                              value={editingContent}
                              onChange={e => setEditingContent(e.target.value)}
                              rows={3}
                              autoFocus
                            />
                            <div className="patient-notes__tag-row">
                              {editingTags.map(tag => (
                                <span key={tag} className="patient-notes__tag">
                                  {tag}
                                  <button
                                    className="patient-notes__tag-remove"
                                    onClick={() => setEditingTags(prev => prev.filter(t => t !== tag))}
                                    aria-label={`Retirer ${tag}`}
                                  >×</button>
                                </span>
                              ))}
                              <input
                                className="patient-notes__tag-input"
                                value={editingTagInput}
                                onChange={e => setEditingTagInput(e.target.value)}
                                onKeyDown={handleEditingTagKeyDown}
                                onBlur={addEditingTag}
                                placeholder={t('notes.tag_placeholder')}
                              />
                            </div>
                            {noteError && editingNoteId === note.id && (
                              <p className="patient-notes__error">{noteError}</p>
                            )}
                            <div className="patient-notes__item-actions">
                              <Button size="sm" loading={updatingNote} onClick={handleUpdateNote}>
                                {t('notes.save_button')}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEditNote}>
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="patient-notes__item-content">{note.content}</p>
                            {note.tags.length > 0 && (
                              <div className="patient-notes__tag-row patient-notes__tag-row--readonly">
                                {note.tags.map(tag => (
                                  <span key={tag} className="patient-notes__tag patient-notes__tag--readonly">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="patient-notes__item-meta">
                              <span className="patient-notes__item-date">
                                {new Date(note.created_at).toLocaleDateString(i18n.language, {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                              <div className="patient-notes__item-actions">
                                {confirmDeleteNoteId === note.id ? (
                                  <>
                                    <span className="patient-notes__confirm-label">
                                      {t('notes.confirm_delete')}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      loading={deletingNoteId === note.id}
                                      onClick={() => handleDeleteNote(note.id)}
                                    >
                                      {t('notes.confirm_yes')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setConfirmDeleteNoteId(null)}
                                    >
                                      {t('common.cancel')}
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleStartEditNote(note)}
                                    >
                                      {t('notes.edit_button')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="patient-notes__delete-btn"
                                      onClick={() => setConfirmDeleteNoteId(note.id)}
                                    >
                                      {t('notes.delete_button')}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {activeTab === 'rdv' && (
              <div className="patient-rdv-placeholder">
                <p>{t('patient.rdv_coming_soon')}</p>
              </div>
            )}
          </>
        )}
      </div>

      {notifModal && practitioner && id && (
        <NotificationRoutineModal
          patientModuleId={notifModal.patientModuleId}
          practitionerId={practitioner.id}
          patientId={id}
          moduleLabel={notifModal.moduleLabel}
          moduleIconName={notifModal.moduleIconName}
          onClose={() => setNotifModal(null)}
        />
      )}
    </Layout>
  )
}

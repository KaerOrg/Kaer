import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Package2, FileText, CalendarDays } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../contexts/ToastContext'
import { Layout } from '../../components/features/Layout'
import { Tabs } from '../../components/ui/Tabs'
import type { ModuleType, PatientModule } from '../../lib/database.types'
import { fetchPsychoCards, type PsychoCardInfo } from '../../services/moduleService'
import {
  fetchModuleCategories,
  fetchComingSoonModuleIds,
  type ModuleCategory,
} from '../../services/moduleCatalogService'
import { fetchPatientHeader, setTeenMode as updateTeenMode, saveGeneralNote } from '../../services/patientService'
import { fetchNotes, type PractitionerNote } from '../../services/noteService'
import { fetchPatientModules } from '../../services/moduleAssignmentService'
import { fetchEnabledModules } from '../../services/practitionerSettingsService'

import { PatientOverviewTab } from './tabs/PatientOverviewTab'
import { PatientModulesTab } from './tabs/PatientModulesTab'
import { PatientNotesTab } from './tabs/PatientNotesTab'
import { PatientRdvTab } from './tabs/PatientRdvTab'

import './PatientPage.css'

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

export function PatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { practitioner } = useAuthStore()
  const { t } = useTranslation()
  const toast = useToast()

  // ── Patient identity ─────────────────────────────────────────────────────
  const [patientEmail, setPatientEmail] = useState('')
  const [patientAlias, setPatientAlias] = useState<string | null>(null)
  const [patientFirstName, setPatientFirstName] = useState<string | null>(null)
  const [patientLastName, setPatientLastName] = useState<string | null>(null)
  const [patientEnrolledAt, setPatientEnrolledAt] = useState<string | null>(null)
  const [teenMode, setTeenMode] = useState(false)
  const [togglingTeen, setTogglingTeen] = useState(false)

  // ── Page data ─────────────────────────────────────────────────────────────
  const [pageData, setPageData] = useState<PageData>(PAGE_DATA_INITIAL)
  const { modules, categories, enabledModules, psychoCards, comingSoonIds } = pageData

  // ── Notes (lifted for badge + overview) ──────────────────────────────────
  const [notes, setNotes] = useState<PractitionerNote[]>([])

  // ── General note (overview) ───────────────────────────────────────────────
  const [generalNote, setGeneralNote] = useState('')
  const [generalNoteSaving, setGeneralNoteSaving] = useState(false)

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'notes' | 'rdv'>('overview')

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

    setPageData({ modules: mods, categories: cats, enabledModules: enabled, psychoCards: cards, comingSoonIds: comingSoon })
    setNotes(fetchedNotes)
    setLoading(false)
  }, [id, practitioner, navigate])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

  const toggleTeenMode = async () => {
    if (!id || !practitioner) return
    setTogglingTeen(true)
    const next = !teenMode
    const { ok } = await updateTeenMode(practitioner.id, id, next)
    if (ok) setTeenMode(next)
    setTogglingTeen(false)
  }

  const handleSaveGeneralNote = async () => {
    if (!id || !practitioner) return
    setGeneralNoteSaving(true)
    const { ok } = await saveGeneralNote(practitioner.id, id, generalNote)
    setGeneralNoteSaving(false)
    if (!ok) toast.error(t('notes.error_save'))
  }

  const fullName = [patientFirstName, patientLastName].filter(Boolean).join(' ')
  const displayName = patientAlias ?? (fullName || patientEmail)

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

        {activeTab === 'overview' && (
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
        )}

        {loading ? (
          <div className="patient-page__loading">{t('common.loading')}</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <PatientOverviewTab
                modules={modules}
                categories={categories}
                notes={notes}
                patientEnrolledAt={patientEnrolledAt}
                generalNote={generalNote}
                generalNoteSaving={generalNoteSaving}
                onGeneralNoteChange={setGeneralNote}
                onSaveGeneralNote={handleSaveGeneralNote}
                onNavigateToNotes={() => setActiveTab('notes')}
                onNavigateToModules={() => setActiveTab('modules')}
              />
            )}

            {activeTab === 'modules' && id && practitioner && (
              <PatientModulesTab
                patientId={id}
                practitionerId={practitioner.id}
                modules={modules}
                categories={categories}
                enabledModules={enabledModules}
                psychoCards={psychoCards}
                comingSoonIds={comingSoonIds}
                onReloadModules={reloadModules}
              />
            )}

            {activeTab === 'notes' && id && practitioner && (
              <PatientNotesTab
                patientId={id}
                practitionerId={practitioner.id}
                initialNotes={notes}
                onNotesChange={setNotes}
              />
            )}

            {activeTab === 'rdv' && id && practitioner && (
              <PatientRdvTab
                patientId={id}
                practitionerId={practitioner.id}
                practitionerName={practitioner.name ?? undefined}
                displayName={displayName}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

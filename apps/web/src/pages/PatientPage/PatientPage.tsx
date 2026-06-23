import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, Package2, FileText, CalendarDays, TrendingUp } from 'lucide-react'

import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../contexts/ToastContext'
import { Layout } from '../../components/features/Layout'
import { Tabs } from '../../components/ui/Tabs'
import { Tooltip } from '../../components/ui/Tooltip'
import type { PatientModule } from '../../lib/database.types'
import type { ModuleCategory } from '../../services/moduleCatalogService'
import type { PractitionerNote } from '../../services/noteService'
import type { LibraryTopic, PsyEduTheme } from '../../services/psyeduService'
import type { AppointmentWithPatient } from '../../lib/calendar.types'
import {
  patientQueries,
  catalogQueries,
  psyeduQueries,
  useSetTeenMode,
  useSaveGeneralNote,
} from '../../hooks/queries'

import { PatientOverviewTab } from './tabs/PatientOverviewTab'
import { PatientModulesTab } from './tabs/PatientModulesTab'
import { PatientNotesTab } from './tabs/PatientNotesTab'
import { PatientRdvTab } from './tabs/PatientRdvTab'
import { PatientEvolutionTab } from './tabs/PatientEvolutionTab'

import './PatientPage.css'

const GRAPHABLE_MODULE_TYPES = new Set([
  'phq9', 'gad7', 'bsl23', 'epds', 'rcads', 'asrs6', 'snap_iv', 'nsi',
  'mood_tracker', 'fear_thermometer', 'medication_side_effects',
])

// Snapshot d'identité dérivé de fetchPatientHeader : ces champs sont écrits au même
// instant et ne varient jamais l'un sans les autres → un seul objet.
type PatientIdentity = {
  email: string
  alias: string | null
  firstName: string | null
  lastName: string | null
  enrolledAt: string | null
  teenMode: boolean
}

const PATIENT_IDENTITY_INITIAL: PatientIdentity = {
  email: '',
  alias: null,
  firstName: null,
  lastName: null,
  enrolledAt: null,
  teenMode: false,
}

// Fallbacks stables (références constantes) pour ne pas recréer un tableau/Set à
// chaque rendu — préserve la mémoïsation des onglets enfants.
const EMPTY_MODULES: PatientModule[] = []
const EMPTY_CATEGORIES: ModuleCategory[] = []
const EMPTY_NOTES: PractitionerNote[] = []
const EMPTY_APPTS: AppointmentWithPatient[] = []
const EMPTY_IDS: Set<string> = new Set()
const EMPTY_TOPICS: LibraryTopic[] = []
const EMPTY_THEMES: PsyEduTheme[] = []

export function PatientPage() {
  // `ref` = identifiant public opaque exposé dans l'URL ; `id` = patient_id réel.
  const { ref } = useParams<{ ref: string }>()
  const navigate = useNavigate()
  const { practitioner } = useAuthStore()
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()

  // ── Résolution du token public → patient_id réel ─────────────────────────
  const resolveRefQuery = useQuery(patientQueries.resolveRef(ref))
  const id = resolveRefQuery.data ?? null

  // Token absent de l'URL → retour dashboard (la query reste désactivée).
  useEffect(() => {
    if (!ref) navigate('/')
  }, [ref, navigate])

  // Token résolu mais introuvable (ou relation d'un autre praticien filtrée par
  // la RLS) → retour dashboard.
  useEffect(() => {
    if (resolveRefQuery.isSuccess && resolveRefQuery.data == null) navigate('/')
  }, [resolveRefQuery.isSuccess, resolveRefQuery.data, navigate])

  // ── Données du dossier (parallélisées automatiquement par TanStack) ───────
  const headerQuery = useQuery(patientQueries.header(practitioner?.id, id))
  const modulesQuery = useQuery(patientQueries.modules(id))
  const notesQuery = useQuery(patientQueries.notes(practitioner?.id, id))
  const appointmentsQuery = useQuery(patientQueries.appointments(practitioner?.id, id))
  const categoriesQuery = useQuery(catalogQueries.categories())
  const comingSoonQuery = useQuery(catalogQueries.comingSoonIds())
  const enabledModulesQuery = useQuery(catalogQueries.enabledModules(practitioner?.id))
  const libraryTopicsQuery = useQuery(psyeduQueries.libraryTopics())
  const themesQuery = useQuery(psyeduQueries.themes())

  // Header introuvable → retour dashboard.
  useEffect(() => {
    if (headerQuery.isSuccess && headerQuery.data == null) navigate('/')
  }, [headerQuery.isSuccess, headerQuery.data, navigate])

  const header = headerQuery.data ?? null
  const identity: PatientIdentity = header
    ? {
        email: header.email,
        alias: header.alias,
        firstName: header.firstName,
        lastName: header.lastName,
        enrolledAt: header.enrolledAt,
        teenMode: header.teenMode,
      }
    : PATIENT_IDENTITY_INITIAL

  const modules = modulesQuery.data ?? EMPTY_MODULES
  const categories = categoriesQuery.data ?? EMPTY_CATEGORIES
  const enabledModules = enabledModulesQuery.data ?? null
  const comingSoonIds = comingSoonQuery.data ?? EMPTY_IDS
  const libraryTopics = libraryTopicsQuery.data ?? EMPTY_TOPICS
  const themes = themesQuery.data ?? EMPTY_THEMES
  const notes = notesQuery.data ?? EMPTY_NOTES
  const appointments = appointmentsQuery.data ?? EMPTY_APPTS

  // Note générale : éditable (textarea), amorcée UNE FOIS depuis le header.
  const [generalNote, setGeneralNote] = useState('')
  const noteSeededRef = useRef(false)
  useEffect(() => {
    if (noteSeededRef.current || !headerQuery.isSuccess || !header) return
    setGeneralNote(header.generalNote ?? '')
    noteSeededRef.current = true
  }, [headerQuery.isSuccess, header])

  const teenMutation = useSetTeenMode()
  const generalNoteMutation = useSaveGeneralNote()
  const togglingTeen = teenMutation.isPending
  const generalNoteSaving = generalNoteMutation.isPending

  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'notes' | 'rdv' | 'evolution'>('overview')

  // Prêt = patient résolu ET toutes les données chargées.
  const loading =
    id == null ||
    headerQuery.isLoading || modulesQuery.isLoading || notesQuery.isLoading ||
    appointmentsQuery.isLoading || categoriesQuery.isLoading || comingSoonQuery.isLoading ||
    enabledModulesQuery.isLoading ||
    libraryTopicsQuery.isLoading || themesQuery.isLoading

  // RDV « effectués » = passés et non annulés (statut factuel, sans action manuelle).
  const appointmentsDoneCount = useMemo(() => {
    const now = new Date().toISOString()
    return appointments.filter(
      a => a.starts_at <= now &&
        a.status !== 'cancelled_by_patient' &&
        a.status !== 'cancelled_by_practitioner',
    ).length
  }, [appointments])

  const reloadModules = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: patientQueries.modules(id).queryKey })
  }, [queryClient, id])

  // Les notes sont possédées par la page (badge + overview) : la modification
  // remontée par l'onglet met à jour le cache de la query.
  const handleNotesChange = useCallback((next: PractitionerNote[]) => {
    queryClient.setQueryData(patientQueries.notes(practitioner?.id, id).queryKey, next)
  }, [queryClient, practitioner?.id, id])

  const toggleTeenMode = useCallback(() => {
    if (!id || !practitioner) return
    teenMutation.mutate({ practitionerId: practitioner.id, patientId: id, value: !identity.teenMode })
  }, [id, practitioner, identity.teenMode, teenMutation])

  const handleSaveGeneralNote = useCallback(async () => {
    if (!id || !practitioner) return
    const { ok } = await generalNoteMutation.mutateAsync({
      practitionerId: practitioner.id,
      patientId: id,
      note: generalNote,
    })
    if (!ok) toast.error(t('notes.error_save'))
  }, [id, practitioner, generalNote, generalNoteMutation, toast, t])

  const fullName = [identity.firstName, identity.lastName].filter(Boolean).join(' ')
  const displayName = identity.alias ?? (fullName || identity.email)

  const hasEvolutionData = modules.some(m => GRAPHABLE_MODULE_TYPES.has(m.module_type))

  const PATIENT_TABS = [
    { id: 'overview',   label: t('patient.tab_overview'),   icon: <LayoutDashboard size={16} /> },
    { id: 'modules',    label: t('patient.tab_modules'),    icon: <Package2 size={16} />,       badge: modules.length || undefined },
    { id: 'notes',      label: t('patient.tab_notes'),      icon: <FileText size={16} />,        badge: notes.length || undefined },
    { id: 'rdv',        label: t('patient.tab_rdv'),        icon: <CalendarDays size={16} />,    badge: appointments.length || undefined },
    ...(hasEvolutionData ? [{ id: 'evolution', label: t('patient.tab_evolution'), icon: <TrendingUp size={16} /> }] : []),
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
              <p className="patient-page__email">{identity.email}</p>
            </div>
            <Tooltip label={identity.teenMode ? t('patient.teen_mode_disable') : t('patient.teen_mode_enable')}>
              <button
                className={`teen-mode-toggle ${identity.teenMode ? 'teen-mode-toggle--active' : ''}`}
                onClick={toggleTeenMode}
                disabled={togglingTeen}
              >
                <span className="teen-mode-toggle__icon">🎨</span>
                <span className="teen-mode-toggle__label">{t('patient.teen_mode_label')}</span>
                <span className={`teen-mode-toggle__pill ${identity.teenMode ? 'teen-mode-toggle__pill--on' : ''}`}>
                  {identity.teenMode ? 'ON' : 'OFF'}
                </span>
              </button>
            </Tooltip>
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
                appointmentsDoneCount={appointmentsDoneCount}
                patientEnrolledAt={identity.enrolledAt}
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
                libraryTopics={libraryTopics}
                themes={themes}
                comingSoonIds={comingSoonIds}
                onReloadModules={reloadModules}
              />
            )}

            {activeTab === 'notes' && id && practitioner && (
              <PatientNotesTab
                patientId={id}
                practitionerId={practitioner.id}
                initialNotes={notes}
                onNotesChange={handleNotesChange}
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

            {activeTab === 'evolution' && id && (
              <PatientEvolutionTab patientId={id} />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

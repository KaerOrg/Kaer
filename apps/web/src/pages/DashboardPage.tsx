import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { InputField } from '../components/InputField'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { StepBreadcrumb } from '../components/StepBreadcrumb/StepBreadcrumb'
import { Toggle } from '../components/Toggle/Toggle'
import { SelectField } from '../components/SelectField/SelectField'
import type { PatientSummary, ModuleType } from '../lib/database.types'
import { fetchInviteCategories, type ModuleCategory } from '../lib/moduleCategories'
import './DashboardPage.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface PendingInvitation {
  id: string
  patient_email: string
  patient_first_name: string | null
  patient_last_name: string | null
  expires_at: string
  created_at: string
}

export function DashboardPage() {
  const { practitioner } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteEmailError, setInviteEmailError] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteBirthDate, setInviteBirthDate] = useState('')
  const [inviteBirthDateError, setInviteBirthDateError] = useState('')
  const [inviteSex, setInviteSex] = useState('')
  const [inviteTeenMode, setInviteTeenMode] = useState(false)
  const [inviteStep, setInviteStep] = useState<1 | 2>(1)
  const [inviteModules, setInviteModules] = useState<Set<ModuleType>>(new Set())
  const [inviteCategories, setInviteCategories] = useState<ModuleCategory[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const { minBirthDate, maxBirthDate } = useMemo(() => {
    const today = new Date()
    const max = today.toISOString().split('T')[0]
    const min = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
      .toISOString().split('T')[0]
    return { minBirthDate: min, maxBirthDate: max }
  }, [])

  const loadPatients = useCallback(async () => {
    if (!practitioner) return

    interface RelationRow {
      patient_id: string
      patient_alias: string | null
      patient_first_name: string | null
      patient_last_name: string | null
      patient_birth_date: string | null
      patient_sex: string | null
      patients: { id: string; email: string } | { id: string; email: string }[] | null
    }
    const { data: relations } = await supabase
      .from('practitioner_patients')
      .select('patient_id, patient_alias, patient_first_name, patient_last_name, patient_birth_date, patient_sex, patients(id, email)')
      .eq('practitioner_id', practitioner.id) as { data: RelationRow[] | null }

    if (!relations) { setLoadingPatients(false); return }

    const patientIds = relations.map(r => r.patient_id)
    const { data: modules } = patientIds.length > 0
      ? await supabase.from('patient_modules').select('*').in('patient_id', patientIds)
      : { data: [] as import('../lib/database.types').PatientModule[] }

    const list: PatientSummary[] = relations.map(rel => {
      const patient = Array.isArray(rel.patients) ? rel.patients[0] : rel.patients
      return {
        id: rel.patient_id,
        email: (patient as { email: string } | null)?.email ?? '',
        patient_alias: rel.patient_alias ?? null,
        patient_first_name: rel.patient_first_name ?? null,
        patient_last_name: rel.patient_last_name ?? null,
        patient_birth_date: rel.patient_birth_date ?? null,
        patient_sex: rel.patient_sex ?? null,
        modules: (modules ?? []).filter(m => m.patient_id === rel.patient_id),
      }
    }).filter(p => p.id)

    setPatients(list)
    setLoadingPatients(false)
  }, [practitioner])

  const loadPendingInvitations = useCallback(async () => {
    if (!practitioner) return
    const { data } = await supabase
      .from('invitations')
      .select('id, patient_email, patient_first_name, patient_last_name, expires_at, created_at')
      .eq('practitioner_id', practitioner.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setPendingInvitations(data ?? [])
  }, [practitioner])

  useEffect(() => {
    loadPatients()
    loadPendingInvitations()
    fetchInviteCategories().then(cats => setInviteCategories(cats))
  }, [loadPatients, loadPendingInvitations])

  const handleEmailBlur = useCallback((value: string) => {
    setInviteEmailError(value && !EMAIL_RE.test(value.trim()) ? t('dashboard.invite_email_error') : '')
  }, [t])

  const handleBirthDateBlur = useCallback((value: string) => {
    if (!value) { setInviteBirthDateError(''); return }
    if (value < minBirthDate) setInviteBirthDateError(t('dashboard.invite_birth_date_error_old'))
    else if (value > maxBirthDate) setInviteBirthDateError(t('dashboard.invite_birth_date_error_future'))
    else setInviteBirthDateError('')
  }, [t, minBirthDate, maxBirthDate])

  const resetForm = useCallback(() => {
    setInviteEmail('')
    setInviteEmailError('')
    setInviteFirstName('')
    setInviteLastName('')
    setInviteBirthDate('')
    setInviteBirthDateError('')
    setInviteSex('')
    setInviteTeenMode(false)
    setInviteStep(1)
    setInviteModules(new Set())
  }, [])

  const toggleInviteModule = useCallback((moduleType: ModuleType) => {
    setInviteModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleType)) next.delete(moduleType)
      else next.add(moduleType)
      return next
    })
  }, [])

  const goToStep2 = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    handleEmailBlur(inviteEmail)
    if (!inviteEmail.trim() || !EMAIL_RE.test(inviteEmail.trim())) return
    if (inviteBirthDateError) return
    setInviteStep(2)
  }, [inviteEmail, inviteBirthDateError, handleEmailBlur])

  const sendInvitation = useCallback(async () => {
    if (!practitioner) return
    if (inviteEmailError || inviteBirthDateError) return
    setInviteLoading(true)
    setInviteError('')

    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: {
        practitioner_id: practitioner.id,
        patient_email: inviteEmail.toLowerCase().trim(),
        first_name: inviteFirstName.trim() || null,
        last_name: inviteLastName.trim() || null,
        birth_date: inviteBirthDate || null,
        sex: inviteSex || null,
        teen_mode: inviteTeenMode,
        modules: [...inviteModules],
      },
    })

    if (error) {
      let errorMessage = t('dashboard.invite_error_generic')
      try {
        interface FnError { context?: { json?: () => Promise<{ error?: string }> } }
        const body = await (error as FnError).context?.json?.()
        if (body?.error) {
          const knownCodes = ['patient_already_registered', 'invitation_already_pending'] as const
          const isKnown = (knownCodes as readonly string[]).includes(body.error)
          errorMessage = isKnown ? t(`dashboard.${body.error}`) : body.error
        }
      } catch { /* use default */ }
      setInviteError(errorMessage)
      setInviteLoading(false)
      return
    }

    if (!data?.success) {
      setInviteError(data?.error ?? t('dashboard.invite_error_generic'))
      setInviteLoading(false)
      return
    }

    setInviteSuccess(true)
    setInviteLoading(false)
    resetForm()
    loadPendingInvitations()
    setTimeout(() => {
      setInviteSuccess(false)
      setShowInviteForm(false)
    }, 3000)
  }, [
    practitioner, inviteEmail, inviteEmailError, inviteFirstName, inviteLastName,
    inviteBirthDate, inviteBirthDateError, inviteSex, inviteTeenMode, inviteModules,
    t, resetForm, loadPendingInvitations,
  ])

  const patientSubtitle = patients.length === 1
    ? t('dashboard.subtitle_one', { count: patients.length })
    : t('dashboard.subtitle_other', { count: patients.length })

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">{t('dashboard.title')}</h1>
            <p className="dashboard__subtitle">{patientSubtitle}</p>
          </div>
          <Button onClick={() => setShowInviteForm(true)}>
            {t('dashboard.invite_button')}
          </Button>
        </div>

        {showInviteForm && (
          <Card
            variant="outlined"
            header={{
              title: t('dashboard.invite_card_title'),
              subtitle: t('dashboard.invite_card_subtitle'),
            }}
          >
            {/* Status messages — shown regardless of step */}
            {inviteError && (
              <div className="invite-form__error">{inviteError}</div>
            )}
            {inviteSuccess && (
              <div className="invite-form__success">
                <Check size={14} /> {t('dashboard.invite_success', { email: inviteEmail || '…' })}
              </div>
            )}

            <StepBreadcrumb
              steps={[t('dashboard.invite_step_info'), t('dashboard.invite_step_modules')]}
              currentStep={inviteStep}
            />

            {/* Step 1 — Patient info */}
            {inviteStep === 1 && (
              <form onSubmit={goToStep2} className="invite-form">
                <InputField
                  label={t('dashboard.invite_email_label')}
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onBlur={e => handleEmailBlur(e.target.value)}
                  placeholder={t('dashboard.invite_email_placeholder')}
                  error={inviteEmailError}
                  required
                />
                <div className="invite-form__row">
                  <InputField
                    label={t('dashboard.invite_first_name_label')}
                    type="text"
                    value={inviteFirstName}
                    onChange={e => setInviteFirstName(e.target.value)}
                    placeholder={t('dashboard.invite_first_name_placeholder')}
                  />
                  <InputField
                    label={t('dashboard.invite_last_name_label')}
                    type="text"
                    value={inviteLastName}
                    onChange={e => setInviteLastName(e.target.value)}
                    placeholder={t('dashboard.invite_last_name_placeholder')}
                  />
                </div>
                <div className="invite-form__row">
                  <InputField
                    label={t('dashboard.invite_birth_date_label')}
                    type="date"
                    value={inviteBirthDate}
                    onChange={e => setInviteBirthDate(e.target.value)}
                    onBlur={e => handleBirthDateBlur(e.target.value)}
                    min={minBirthDate}
                    max={maxBirthDate}
                    error={inviteBirthDateError}
                  />
                  <SelectField
                    label={t('dashboard.invite_sex_label')}
                    id="invite-sex"
                    value={inviteSex}
                    onChange={e => setInviteSex(e.target.value)}
                  >
                    <option value="">{t('dashboard.invite_sex_placeholder')}</option>
                    <option value="M">{t('dashboard.invite_sex_m')}</option>
                    <option value="F">{t('dashboard.invite_sex_f')}</option>
                    <option value="O">{t('dashboard.invite_sex_o')}</option>
                  </SelectField>
                </div>
                <Toggle
                  checked={inviteTeenMode}
                  onChange={setInviteTeenMode}
                  label={t('patient.teen_mode_label')}
                />
                <div className="invite-form__actions">
                  <Button type="button" variant="secondary" onClick={() => { setShowInviteForm(false); resetForm() }}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('dashboard.invite_next_button')}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 — Module pre-selection */}
            {inviteStep === 2 && (
              <div className="invite-module-picker-container">
                <p className="invite-module-intro">{t('dashboard.invite_module_intro')}</p>

                <div className="invite-module-picker">
                  {inviteCategories.map(cat => (
                    <div key={cat.id} className="invite-module-category">
                      <div className="invite-module-category__title">{t(cat.labelKey)}</div>
                      <div className="invite-module-category__grid">
                        {cat.modules.map(mod => (
                          <label
                            key={mod.id}
                            className={`invite-module-option${inviteModules.has(mod.id) ? ' invite-module-option--selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={inviteModules.has(mod.id)}
                              onChange={() => toggleInviteModule(mod.id)}
                            />
                            <div className="invite-module-option__content">
                              <span className="invite-module-option__name">{t(`modules.${mod.id}.label`)}</span>
                              <span className="invite-module-option__desc">{t(`modules.${mod.id}.description`)}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="invite-module-config-note">{t('dashboard.invite_module_config_note')}</p>

                <div className="invite-form__actions">
                  <Button type="button" variant="secondary" onClick={() => setInviteStep(1)}>
                    ← {t('common.back')}
                  </Button>
                  <Button loading={inviteLoading} onClick={sendInvitation}>
                    {t('dashboard.send_invitation')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {pendingInvitations.length > 0 && (
          <div className="pending-invitations">
            <h2 className="pending-invitations__title">
              {t('dashboard.pending_title', { count: pendingInvitations.length })}
            </h2>
            <div className="pending-invitations__list">
              {pendingInvitations.map(inv => {
                const displayName = [inv.patient_first_name, inv.patient_last_name].filter(Boolean).join(' ')
                return (
                  <div key={inv.id} className="pending-invitation-row">
                    <div className="pending-invitation-row__info">
                      {displayName ? (
                        <span className="pending-invitation-row__name">{displayName}</span>
                      ) : null}
                      <span className="pending-invitation-row__email">{inv.patient_email}</span>
                    </div>
                    <span className="pending-invitation-row__expires">
                      {t('dashboard.pending_expires', {
                        date: new Date(inv.expires_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                      })}
                    </span>
                    <StatusBadge variant="warning" label={t('dashboard.pending_badge')} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loadingPatients ? (
          <div className="dashboard__loading">{t('dashboard.loading_patients')}</div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title={t('dashboard.empty_title')}
            description={t('dashboard.empty_description')}
          />
        ) : (
          <div className="patient-grid">
            {patients.map(patient => {
              const fullName = [patient.patient_first_name, patient.patient_last_name].filter(Boolean).join(' ')
              const displayName = fullName || patient.patient_alias || patient.email
              const avatarChar = displayName[0]?.toUpperCase() ?? '?'
              return (
                <button
                  key={patient.id}
                  className="patient-grid__item"
                  onClick={() => navigate(`/patient/${patient.id}`)}
                >
                  <Card variant="default" className="patient-card">
                    <div className="patient-card__avatar">{avatarChar}</div>
                    <div className="patient-card__info">
                      <div className="patient-card__name">{displayName}</div>
                      <div className="patient-card__email">{patient.email}</div>
                    </div>
                    <div className="patient-card__modules">
                      <span className="patient-card__module-count">
                        {patient.modules.length === 1
                          ? t('dashboard.module_count_one', { count: patient.modules.length })
                          : t('dashboard.module_count_other', { count: patient.modules.length })}
                      </span>
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

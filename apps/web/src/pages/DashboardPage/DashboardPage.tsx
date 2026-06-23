import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../contexts/ToastContext'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { StepBreadcrumb } from '../../components/ui/StepBreadcrumb/StepBreadcrumb'
import { Toggle } from '../../components/ui/Toggle/Toggle'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '@tanstack/react-query'
import { matchesAllTokens, tokenizeSearch } from '../../lib/search'
import type { ModuleType } from '../../lib/database.types'
import { dashboardQueries, useSendInvitation } from '../../hooks/queries'
import './DashboardPage.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DashboardPage() {
  const { practitioner } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const patientsQuery = useQuery(dashboardQueries.patients(practitioner?.id))
  const pendingInvitationsQuery = useQuery(dashboardQueries.pendingInvitations(practitioner?.id))
  const inviteCategoriesQuery = useQuery(dashboardQueries.inviteCategories())
  const sendInvitationMutation = useSendInvitation()
  const patients = patientsQuery.data ?? []
  const loadingPatients = patientsQuery.isLoading
  const pendingInvitations = pendingInvitationsQuery.data ?? []
  const inviteCategories = inviteCategoriesQuery.data ?? []
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
  const inviteLoading = sendInvitationMutation.isPending

  const { minBirthDate, maxBirthDate } = useMemo(() => {
    const today = new Date()
    const max = today.toISOString().split('T')[0]
    const min = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
      .toISOString().split('T')[0]
    return { minBirthDate: min, maxBirthDate: max }
  }, [])

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

  const openInviteForm = useCallback(() => setShowInviteForm(true), [])

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

  const submitInvitation = useCallback(async () => {
    if (!practitioner) return
    if (inviteEmailError || inviteBirthDateError) return

    // La mutation résout avec un SendInvitationResult (erreurs métier non levées) ;
    // son onSuccess invalide la liste des invitations en attente.
    const result = await sendInvitationMutation.mutateAsync({
      practitionerId: practitioner.id,
      email: inviteEmail,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      birthDate: inviteBirthDate || null,
      sex: inviteSex || null,
      teenMode: inviteTeenMode,
      modules: [...inviteModules],
    })

    if (!result.ok) {
      const message = result.errorCode
        ? t(`dashboard.${result.errorCode}`)
        : result.errorMessage ?? t('dashboard.invite_error_generic')
      toast.error(message)
      return
    }

    toast.success(t('dashboard.invite_success', { email: inviteEmail }))
    resetForm()
    setShowInviteForm(false)
  }, [
    practitioner, inviteEmail, inviteEmailError, inviteFirstName, inviteLastName,
    inviteBirthDate, inviteBirthDateError, inviteSex, inviteTeenMode, inviteModules,
    t, toast, resetForm, sendInvitationMutation,
  ])

  const patientSubtitle = patients.length === 1
    ? t('dashboard.subtitle_one', { count: patients.length })
    : t('dashboard.subtitle_other', { count: patients.length })

  const filteredPatients = useMemo(() => {
    const list = patientsQuery.data ?? []
    const tokens = tokenizeSearch(searchQuery)
    if (tokens.length === 0) return list
    return list.filter(p => {
      const haystack = [
        p.patient_first_name,
        p.patient_last_name,
        p.patient_alias,
        p.email,
      ].filter(Boolean).join(' ')
      return matchesAllTokens(haystack, tokens)
    })
  }, [patientsQuery.data, searchQuery])

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">{t('dashboard.title')}</h1>
            <p className="dashboard__subtitle">{patientSubtitle}</p>
          </div>
          <Button onClick={openInviteForm}>
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
                  <Dropdown
                    label={t('dashboard.invite_sex_label')}
                    id="invite-sex"
                    value={inviteSex}
                    onChange={e => setInviteSex(e.target.value)}
                  >
                    <option value="">{t('dashboard.invite_sex_placeholder')}</option>
                    <option value="M">{t('dashboard.invite_sex_m')}</option>
                    <option value="F">{t('dashboard.invite_sex_f')}</option>
                    <option value="O">{t('dashboard.invite_sex_o')}</option>
                  </Dropdown>
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
                  <Button loading={inviteLoading} onClick={submitInvitation}>
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
          <>
            <div className="dashboard__search">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('dashboard.search_placeholder')}
              />
            </div>
            {filteredPatients.length === 0 ? (
              <EmptyState
                icon={<Users size={48} />}
                title={t('dashboard.empty_search_title')}
                description={t('dashboard.empty_search_description')}
              />
            ) : (
              <div className="patient-grid">
                {filteredPatients.map(patient => {
                  const fullName = [patient.patient_first_name, patient.patient_last_name].filter(Boolean).join(' ')
                  const displayName = fullName || patient.patient_alias || patient.email
                  const avatarChar = displayName[0]?.toUpperCase() ?? '?'
                  return (
                    <button
                      key={patient.id}
                      className="patient-grid__item"
                      onClick={() => navigate(`/patient/${patient.public_ref}`)}
                    >
                      <Card variant="default" className="patient-card">
                        <div className="patient-card__row">
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
                        </div>
                      </Card>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

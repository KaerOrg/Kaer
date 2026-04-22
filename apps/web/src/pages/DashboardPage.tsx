import { useEffect, useState, useCallback } from 'react'
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
import type { PatientSummary } from '../lib/database.types'
import './DashboardPage.css'

interface PendingInvitation {
  id: string
  patient_email: string
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
  const [inviteAlias, setInviteAlias] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const loadPatients = useCallback(async () => {
    if (!practitioner) return

    interface RelationRow { patient_id: string; patient_alias: string | null; patients: { id: string; email: string } | { id: string; email: string }[] | null }
    const { data: relations } = await supabase
      .from('practitioner_patients')
      .select('patient_id, patient_alias, patients(id, email)')
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
      .select('id, patient_email, expires_at, created_at')
      .eq('practitioner_id', practitioner.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setPendingInvitations(data ?? [])
  }, [practitioner])

  useEffect(() => {
    loadPatients()
    loadPendingInvitations()
  }, [loadPatients, loadPendingInvitations])

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!practitioner) return
    setInviteLoading(true)
    setInviteError('')

    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: {
        practitioner_id: practitioner.id,
        patient_email: inviteEmail.toLowerCase().trim(),
        alias: inviteAlias.trim() || null,
      },
    })

    if (error) {
      let errorMessage = t('dashboard.invite_error_generic')
      try {
        interface FnError { context?: { json?: () => Promise<{ error?: string }> } }
        const body = await (error as FnError).context?.json?.()
        if (body?.error) errorMessage = body.error
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
    setInviteEmail('')
    setInviteAlias('')
    loadPendingInvitations()
    setTimeout(() => {
      setInviteSuccess(false)
      setShowInviteForm(false)
    }, 3000)
  }

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
            <form onSubmit={sendInvitation} className="invite-form">
              <InputField
                label={t('dashboard.invite_email_label')}
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder={t('dashboard.invite_email_placeholder')}
                required
              />
              <InputField
                label={t('dashboard.invite_alias_label')}
                type="text"
                value={inviteAlias}
                onChange={e => setInviteAlias(e.target.value)}
                placeholder={t('dashboard.invite_alias_placeholder')}
              />
              {inviteError && (
                <div className="invite-form__error">{inviteError}</div>
              )}
              {inviteSuccess && (
                <div className="invite-form__success">
                  <Check size={14} /> {t('dashboard.invite_success', { email: inviteEmail || '…' })}
                </div>
              )}
              <div className="invite-form__actions">
                <Button type="button" variant="secondary" onClick={() => setShowInviteForm(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={inviteLoading}>
                  {t('dashboard.send_invitation')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {pendingInvitations.length > 0 && (
          <div className="pending-invitations">
            <h2 className="pending-invitations__title">
              {t('dashboard.pending_title', { count: pendingInvitations.length })}
            </h2>
            <div className="pending-invitations__list">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="pending-invitation-row">
                  <span className="pending-invitation-row__email">{inv.patient_email}</span>
                  <span className="pending-invitation-row__expires">
                    {t('dashboard.pending_expires', {
                      date: new Date(inv.expires_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                    })}
                  </span>
                  <StatusBadge variant="warning" label={t('dashboard.pending_badge')} />
                </div>
              ))}
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
            {patients.map(patient => (
              <button
                key={patient.id}
                className="patient-grid__item"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <Card variant="default" className="patient-card">
                  <div className="patient-card__avatar">
                    {(patient.patient_alias || patient.email || '?')[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="patient-card__info">
                    <div className="patient-card__name">
                      {patient.patient_alias ?? patient.email}
                    </div>
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
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { InputField } from '../components/InputField'
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
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteAlias, setInviteAlias] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    loadPatients()
    loadPendingInvitations()
  }, [])

  const loadPatients = async () => {
    if (!practitioner) return
    setLoadingPatients(true)

    const { data: relations } = await supabase
      .from('practitioner_patients')
      .select('patient_id, patient_alias, patients(id, email)')
      .eq('practitioner_id', practitioner.id)

    if (!relations) { setLoadingPatients(false); return }

    const patientIds = relations.map(r => r.patient_id)
    const { data: modules } = patientIds.length > 0
      ? await supabase.from('patient_modules').select('*').in('patient_id', patientIds)
      : { data: [] }

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
  }

  const loadPendingInvitations = async () => {
    if (!practitioner) return
    const { data } = await supabase
      .from('invitations')
      .select('id, patient_email, expires_at, created_at')
      .eq('practitioner_id', practitioner.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setPendingInvitations(data ?? [])
  }

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
      // Extraire le vrai message d'erreur depuis la réponse HTTP
      let errorMessage = 'Erreur lors de l\'envoi.'
      try {
        const body = await (error as any).context?.json?.()
        if (body?.error) errorMessage = body.error
      } catch { /* utiliser le message par défaut */ }
      setInviteError(errorMessage)
      setInviteLoading(false)
      return
    }

    if (!data?.success) {
      setInviteError(data?.error ?? 'Erreur lors de l\'envoi.')
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

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Mes patients</h1>
            <p className="dashboard__subtitle">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} suivi{patients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowInviteForm(true)}>
            + Inviter un patient
          </Button>
        </div>

        {showInviteForm && (
          <div className="invite-card">
            <h2 className="invite-card__title">Inviter un nouveau patient</h2>
            <p className="invite-card__desc">
              Le patient recevra un lien par email pour créer son compte et accéder à l'application.
            </p>
            <form onSubmit={sendInvitation} className="invite-card__form">
              <InputField
                label="Email du patient"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="patient@exemple.fr"
                required
              />
              <InputField
                label="Alias / Pseudonyme (optionnel)"
                type="text"
                value={inviteAlias}
                onChange={e => setInviteAlias(e.target.value)}
                placeholder="Ex: Patient A, ou initiales"
              />
              {inviteError && (
                <div className="invite-card__error">{inviteError}</div>
              )}
              {inviteSuccess && (
                <div className="invite-card__success">
                  <Check size={14} /> Email d'invitation envoyé à {inviteEmail || 'votre patient'}.
                </div>
              )}
              <div className="invite-card__actions">
                <Button type="button" variant="secondary" onClick={() => setShowInviteForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={inviteLoading}>
                  Envoyer l'invitation
                </Button>
              </div>
            </form>
          </div>
        )}

        {pendingInvitations.length > 0 && (
          <div className="pending-invitations">
            <h2 className="pending-invitations__title">
              Invitations en attente ({pendingInvitations.length})
            </h2>
            <div className="pending-invitations__list">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="pending-invitation-row">
                  <span className="pending-invitation-row__email">{inv.patient_email}</span>
                  <span className="pending-invitation-row__expires">
                    Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="pending-invitation-row__badge">En attente</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingPatients ? (
          <div className="dashboard__loading">Chargement des patients…</div>
        ) : patients.length === 0 ? (
          <div className="dashboard__empty">
            <div className="dashboard__empty-icon"><Users size={48} /></div>
            <h3>Aucun patient pour l'instant</h3>
            <p>Commencez par inviter votre premier patient.</p>
          </div>
        ) : (
          <div className="patient-grid">
            {patients.map(patient => (
              <button
                key={patient.id}
                className="patient-card"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
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
                    {patient.modules.length} module{patient.modules.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

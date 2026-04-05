import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { InputField } from '../components/InputField'
import type { PatientSummary } from '../lib/database.types'
import './DashboardPage.css'

export function DashboardPage() {
  const { practitioner } = useAuthStore()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteAlias, setInviteAlias] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    loadPatients()
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
        patient_alias: rel.patient_alias,
        modules: (modules ?? []).filter(m => m.patient_id === rel.patient_id),
      }
    })

    setPatients(list)
    setLoadingPatients(false)
  }

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!practitioner) return
    setInviteLoading(true)
    setInviteError('')

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('invitations').insert({
      practitioner_id: practitioner.id,
      patient_email: inviteEmail.toLowerCase().trim(),
      token,
      expires_at: expiresAt,
    })

    if (error) {
      setInviteError('Erreur lors de l\'envoi. Vérifiez que cet email n\'a pas déjà été invité.')
      setInviteLoading(false)
      return
    }

    setInviteSuccess(true)
    setInviteLoading(false)
    setInviteEmail('')
    setInviteAlias('')
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
                  ✓ Invitation enregistrée. Le patient peut maintenant s'inscrire.
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

        {loadingPatients ? (
          <div className="dashboard__loading">Chargement des patients…</div>
        ) : patients.length === 0 ? (
          <div className="dashboard__empty">
            <div className="dashboard__empty-icon">👥</div>
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
                  {(patient.patient_alias ?? patient.email)[0].toUpperCase()}
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

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import {
  MODULE_LABELS,
  MODULE_DESCRIPTIONS,
  type ModuleType,
  type PatientModule,
} from '../lib/database.types'
import './PatientPage.css'

const ALL_MODULES: ModuleType[] = [
  'sleep_diary',
  'beck_columns',
  'fear_thermometer',
  'emotion_wheel',
  'crisis_plan',
  'rim',
  'cognitive_saturation',
]

export function PatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { practitioner } = useAuthStore()

  const [patientEmail, setPatientEmail] = useState('')
  const [patientAlias, setPatientAlias] = useState<string | null>(null)
  const [modules, setModules] = useState<PatientModule[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)

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

  const unlockModule = async (moduleType: ModuleType) => {
    if (!id || !practitioner) return
    setUnlockingModule(moduleType)

    const { error } = await supabase.from('patient_modules').insert({
      patient_id: id,
      practitioner_id: practitioner.id,
      module_type: moduleType,
      config: {},
    })

    if (!error) {
      await loadPatient()
    }
    setUnlockingModule(null)
  }

  const revokeModule = async (moduleId: string) => {
    await supabase.from('patient_modules').delete().eq('id', moduleId)
    await loadPatient()
  }

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

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
            <div className="modules-section">
              <h2 className="modules-section__title">
                Modules actifs
                <span className="modules-section__count">{modules.length}</span>
              </h2>
              {modules.length === 0 ? (
                <p className="modules-section__empty">
                  Aucun module débloqué. Déverrouillez des outils ci-dessous.
                </p>
              ) : (
                <div className="modules-active">
                  {modules.map(mod => (
                    <div key={mod.id} className="module-active-card">
                      <div className="module-active-card__info">
                        <div className="module-active-card__name">
                          {MODULE_LABELS[mod.module_type]}
                        </div>
                        <div className="module-active-card__date">
                          Débloqué le {new Date(mod.unlocked_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeModule(mod.id)}
                        className="module-active-card__revoke"
                      >
                        Révoquer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modules-section">
              <h2 className="modules-section__title">Bibliothèque de modules</h2>
              <p className="modules-section__desc">
                Cliquez sur un module pour le débloquer pour ce patient.
              </p>
              <div className="modules-library">
                {ALL_MODULES.map(type => {
                  const unlocked = isUnlocked(type)
                  return (
                    <div
                      key={type}
                      className={`module-card ${unlocked ? 'module-card--unlocked' : ''}`}
                    >
                      <div className="module-card__content">
                        <div className="module-card__name">{MODULE_LABELS[type]}</div>
                        <div className="module-card__desc">{MODULE_DESCRIPTIONS[type]}</div>
                      </div>
                      {unlocked ? (
                        <span className="module-card__badge"><Check size={14} /> Actif</span>
                      ) : (
                        <Button
                          size="sm"
                          loading={unlockingModule === type}
                          onClick={() => unlockModule(type)}
                        >
                          Débloquer
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

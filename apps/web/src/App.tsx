import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PatientPage } from './pages/PatientPage'
import { PatientRegisterPage } from './pages/PatientRegisterPage'

function App() {
  const { practitioner, loading, loadSession } = useAuthStore()
  const { t } = useTranslation()

  useEffect(() => {
    loadSession()
  }, [])

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '15px',
      }}>
        {t('common.loading')}
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<PatientRegisterPage />} />
        {practitioner ? (
          <>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patient/:id" element={<PatientPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App

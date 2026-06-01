import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './contexts/ToastProvider'
import { ToastContainer } from './components/ui/Toast'

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const PatientPage = lazy(() => import('./pages/PatientPage').then(m => ({ default: m.PatientPage })))
const PatientRegisterPage = lazy(() => import('./pages/PatientRegisterPage').then(m => ({ default: m.PatientRegisterPage })))
const ModuleCatalogPage = lazy(() => import('./pages/ModuleCatalogPage').then(m => ({ default: m.ModuleCatalogPage })))
const ModulePreviewPage = lazy(() => import('./pages/ModulePreviewPage').then(m => ({ default: m.ModulePreviewPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AgendaPage = lazy(() => import('./pages/AgendaPage').then(m => ({ default: m.AgendaPage })))

function App() {
  const { practitioner, loading, loadSession } = useAuthStore()
  const { t } = useTranslation()

  useEffect(() => {
    loadSession()
  }, [loadSession])

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
    <ToastProvider>
      <ToastContainer />
      <BrowserRouter>
        <Suspense fallback={
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
        }>
          <Routes>
            <Route path="/register" element={<PatientRegisterPage />} />
            {practitioner ? (
              <>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/patient/:id" element={<PatientPage />} />
                <Route path="/modules" element={<ModuleCatalogPage />} />
                <Route path="/modules/preview/:moduleType" element={<ModulePreviewPage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App

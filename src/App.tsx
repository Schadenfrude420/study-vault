import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AuthConfirmPage from './pages/AuthConfirmPage'
import BrowsePage from './pages/BrowsePage'
import UploadPage from './pages/UploadPage'
import MyUploadsPage from './pages/MyUploadsPage'
import AdminDashboard from './pages/AdminDashboard'
import AccountPage from './pages/AccountPage'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading…</div>
    </div>
  )
}

function AdminRoute() {
  const { role, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (role === null) return <LoadingScreen />
  return role === 'admin' ? <Outlet /> : <Navigate to="/browse" replace />
}

function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen pt-16 md:pt-0">
      <Navbar />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/confirm" element={<AuthConfirmPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/my-uploads" element={<MyUploadsPage />} />
            <Route path="/account" element={<AccountPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/browse" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
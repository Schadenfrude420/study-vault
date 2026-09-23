import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import BrowsePage from './pages/BrowsePage'
import UploadPage from './pages/UploadPage'
import MyUploadsPage from './pages/MyUploadsPage'
import AdminDashboard from './pages/AdminDashboard'
import AccountPage from './pages/AccountPage'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { role, loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>
  if (role === null) return <div className="p-8">Loading role...</div>
  return role === 'admin' ? <Outlet /> : <Navigate to="/browse" replace />
}

// Layout wrapper for authenticated pages
function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (No Sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected Routes (With Sidebar) */}
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
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Auth pages (public)
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// App pages (protected)
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import UploadPage from './pages/UploadPage'
import DocumentDetailPage from './pages/DocumentDetailPage'
import GraphPage from './pages/GraphPage'
import SearchPage from './pages/SearchPage'
import AIAssistantPage from './pages/AIAssistantPage'
import SearchHistoryPage from './pages/SearchHistoryPage'
import QAHistoryPage from './pages/QAHistoryPage'
import RelationshipsPage from './pages/RelationshipsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — wrapped in Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/upload" element={<UploadPage />} />
            <Route path="documents/:id" element={<DocumentDetailPage />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="assistant" element={<AIAssistantPage />} />
            <Route path="relationships" element={<RelationshipsPage />} />
            <Route path="search-history" element={<SearchHistoryPage />} />
            <Route path="qa-history" element={<QAHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2332',
              color: '#e2e8f0',
              border: '1px solid #2d3f55',
              borderRadius: '8px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}

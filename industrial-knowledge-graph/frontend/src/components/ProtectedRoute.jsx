import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0f1a', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '4px solid #3b82f6', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

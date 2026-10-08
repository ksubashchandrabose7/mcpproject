import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Cpu, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setForm({ email: 'admin@industrialkg.com', password: 'admin123' })
    setError('')
  }

  return (
    <div className="auth-page">
      {/* Background gradient orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Cpu className="auth-logo-svg" />
          </div>
          <div>
            <h1 className="auth-brand">IndustrialKG</h1>
            <p className="auth-brand-sub">AI Knowledge Graph Platform</p>
          </div>
        </div>

        <h2 className="auth-title">Sign in to your account</h2>
        <p className="auth-subtitle">Access your industrial knowledge graph</p>

        {error && (
          <div className="auth-error">
            <AlertCircle className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="you@company.com"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner" />
                Signing in...
              </span>
            ) : (
              <span className="auth-btn-content">
                <LogIn size={18} />
                Sign In
              </span>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <button onClick={fillDemo} className="auth-demo-btn" type="button">
          Use demo credentials
        </button>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-switch-link">Create account</Link>
        </p>
      </div>
    </div>
  )
}

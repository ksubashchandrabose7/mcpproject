import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, Cpu, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.email) return 'Email is required.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Too short', color: '#ef4444' }
    if (p.length < 8) return { label: 'Weak', color: '#f59e0b' }
    if (p.match(/[A-Z]/) && p.match(/[0-9]/)) return { label: 'Strong', color: '#10b981' }
    return { label: 'Medium', color: '#3b82f6' }
  }

  const strength = passwordStrength()

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Cpu className="auth-logo-svg" />
          </div>
          <div>
            <h1 className="auth-brand">IndustrialKG</h1>
            <p className="auth-brand-sub">AI Knowledge Graph Platform</p>
          </div>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Start building your industrial knowledge graph</p>

        {error && (
          <div className="auth-error">
            <AlertCircle className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className="auth-input"
              placeholder="John Smith"
              disabled={loading}
            />
          </div>

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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="Min. 6 characters"
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
            {strength && (
              <div className="auth-strength">
                <div className="auth-strength-bar" style={{ background: strength.color, width: strength.label === 'Too short' ? '25%' : strength.label === 'Weak' ? '40%' : strength.label === 'Medium' ? '65%' : '100%' }} />
                <span style={{ color: strength.color, fontSize: '0.75rem' }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrapper">
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirm}
                onChange={handleChange}
                className="auth-input"
                placeholder="Re-enter password"
                disabled={loading}
              />
              {form.confirm && (
                <span className="auth-match-icon">
                  {form.password === form.confirm
                    ? <CheckCircle size={16} style={{ color: '#10b981' }} />
                    : <AlertCircle size={16} style={{ color: '#ef4444' }} />
                  }
                </span>
              )}
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner" />
                Creating account...
              </span>
            ) : (
              <span className="auth-btn-content">
                <UserPlus size={18} />
                Create Account
              </span>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-switch-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

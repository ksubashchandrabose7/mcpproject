import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('kg_token'))
  const [loading, setLoading] = useState(true)

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('kg_token')
      if (stored) {
        try {
          const me = await authAPI.me()
          setUser(me)
        } catch {
          // Token invalid/expired
          localStorage.removeItem('kg_token')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password)
    localStorage.setItem('kg_token', res.access_token)
    setToken(res.access_token)
    setUser({ id: res.user_id, name: res.name, email: res.email, role: res.role })
    return res
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register(name, email, password)
    localStorage.setItem('kg_token', res.access_token)
    setToken(res.access_token)
    setUser({ id: res.user_id, name: res.name, email: res.email, role: res.role })
    return res
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('kg_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

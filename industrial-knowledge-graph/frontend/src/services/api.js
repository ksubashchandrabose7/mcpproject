import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for AI processing
})

// ── Request interceptor: attach JWT token ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kg_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: normalize errors ────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('kg_token')
        window.location.href = '/login'
      }
    }
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// ── Documents API ─────────────────────────────────────────────────────────────
export const documentAPI = {
  upload: (formData, onProgress) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    }),
  list: (skip = 0, limit = 20, status = '', search = '') => {
    const params = new URLSearchParams({ skip, limit })
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    return api.get(`/documents?${params}`)
  },
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
  process: (id) => api.post(`/documents/${id}/process`),
  status: (id) => api.get(`/documents/${id}/status`),
  getEntities: (id) => api.get(`/documents/${id}/entities`),
  getChunks: (id) => api.get(`/documents/${id}/chunks`),
  getPage: (id, pageNumber) => api.get(`/documents/${id}/page/${pageNumber}`),
  getFileUrl: (id, pageNumber = 1) => `${API_BASE}/documents/${id}/file#page=${pageNumber}`,
}

// ── Entity API ────────────────────────────────────────────────────────────────
export const entityAPI = {
  list: (type = '', skip = 0, limit = 100) =>
    api.get(`/entities?entity_type=${type}&skip=${skip}&limit=${limit}`),
  get: (id) => api.get(`/entities/${id}`),
  types: () => api.get('/entities/types'),
}

// ── Relationship API ──────────────────────────────────────────────────────────
export const relationshipAPI = {
  list: (type = '', skip = 0, limit = 100) =>
    api.get(`/relationships?relationship_type=${type}&skip=${skip}&limit=${limit}`),
  types: () => api.get('/relationships/types'),
  verify: (id, status) => api.post(`/relationships/${id}/verify`, { status }),
}

// ── Graph API ─────────────────────────────────────────────────────────────────
export const graphAPI = {
  getData: (nodeType = '') => api.get(`/graph${nodeType ? `?node_type=${nodeType}` : ''}`),
  getStats: () => api.get('/graph/stats'),
  getNode: (entityId) => api.get(`/graph/node/${entityId}`),
  getNeighbors: (entityId) => api.get(`/graph/node/${entityId}/neighbors`),
  search: (q) => api.get(`/graph/search?q=${encodeURIComponent(q)}`),
  export: () => api.get('/graph/export'),
}

// ── Search API ────────────────────────────────────────────────────────────────
export const searchAPI = {
  search: (query, limit = 10) => api.post('/search', { query, limit }),
  history: (skip = 0, limit = 20) => api.get(`/search-history?skip=${skip}&limit=${limit}`),
  clearHistory: () => api.delete('/search-history'),
}

// ── QA / AI API ───────────────────────────────────────────────────────────────
export const qaAPI = {
  ask: (question, sessionId = null, emergencyMode = false) => api.post('/ask', { question, session_id: sessionId, emergency_mode: emergencyMode }),
  history: (skip = 0, limit = 20) => api.get(`/qa-history?skip=${skip}&limit=${limit}`),
  clearHistory: () => api.delete('/qa-history'),
  deleteEntry: (id) => api.delete(`/qa-history/${id}`),
}

// ── Stats API ─────────────────────────────────────────────────────────────────
export const statsAPI = {
  get: () => api.get('/stats'),
}

// ── Analytics API ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getHealthScore: (machine = 'Pump P-101', temp = 75, vib = 2.1, press = 6.2, rpm = 3450) =>
    api.get(`/analytics/health-score?machine=${encodeURIComponent(machine)}&temperature=${temp}&vibration=${vib}&pressure=${press}&rpm=${rpm}`),
  simulateWhatIf: (machineName, temp, rpm, press) =>
    api.post('/analytics/what-if', { machine_name: machineName, temperature: temp, rpm, pressure: press }),
  detectAnomalies: (sensorValues) =>
    api.post('/analytics/anomaly-detection', { sensor_values: sensorValues }),
  getKnowledgeQuality: () =>
    api.get('/analytics/knowledge-quality'),
}

export default api

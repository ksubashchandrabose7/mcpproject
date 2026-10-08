import { useState } from 'react'
import { Settings, Database, Server, Trash2, Save, User as UserIcon, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchAPI, qaAPI, documentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()
  const [clearing, setClearing] = useState(false)

  const handleClearHistory = async (type) => {
    if (!window.confirm(`Are you sure you want to clear all ${type} history? This cannot be undone.`)) return
    
    setClearing(true)
    try {
      if (type === 'search') await searchAPI.clearHistory()
      if (type === 'qa') await qaAPI.clearHistory()
      toast.success(`${type} history cleared successfully`)
    } catch (error) {
      toast.error(`Failed to clear ${type} history`)
      console.error(error)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="text-blue-500" /> System Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your account and platform preferences</p>
      </div>

      {/* Account Settings */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <UserIcon size={18} className="text-gray-500" />
          <h2 className="font-semibold">Account Information</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex gap-8">
            <div className="flex flex-col gap-1 w-1/2">
              <span className="text-sm text-gray-500">Full Name</span>
              <span className="font-medium text-lg">{user?.name}</span>
            </div>
            <div className="flex flex-col gap-1 w-1/2">
              <span className="text-sm text-gray-500">Email Address</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
          <div className="flex gap-8 mt-2">
             <div className="flex flex-col gap-1 w-1/2">
              <span className="text-sm text-gray-500">Role</span>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={16} className={user?.role === 'admin' ? 'text-blue-500' : 'text-gray-500'} />
                <span className={`px-2 py-1 rounded text-xs font-semibold ${user?.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-600'}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Server size={18} className="text-gray-500" />
          <h2 className="font-semibold">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">API Backend</span>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> Online</span>
              </div>
              <div className="text-sm truncate" title={import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}>
                {import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}
              </div>
            </div>
            
             <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Knowledge Graph</span>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><div className="w-2 h-2 rounded-full bg-green-400"></div> Connected</span>
              </div>
              <div className="text-sm">Database: MySQL (Local)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card border-red-900/30">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Database size={18} className="text-red-400" />
          <h2 className="font-semibold text-red-100">Data Management</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-500">Manage your stored platform data. These actions cannot be undone.</p>
          
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div>
                <div className="font-medium">Clear Search History</div>
                <div className="text-xs text-gray-500">Remove all past semantic search queries</div>
              </div>
              <button 
                onClick={() => handleClearHistory('search')}
                disabled={clearing}
                className="btn btn-secondary border-gray-600 hover:border-red-500 hover:text-red-400 text-xs"
              >
                Clear Search Data
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div>
                <div className="font-medium">Clear QA History</div>
                <div className="text-xs text-gray-500">Remove all past AI assistant conversations</div>
              </div>
              <button 
                onClick={() => handleClearHistory('qa')}
                disabled={clearing}
                className="btn btn-secondary border-gray-600 hover:border-red-500 hover:text-red-400 text-xs"
              >
                Clear QA Data
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

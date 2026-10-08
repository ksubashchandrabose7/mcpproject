import { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Upload, Network, Search, Bot,
  Clock, MessageSquare, GitBranch, Settings, Menu, X,
  LogOut, User, ChevronDown, Cpu
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/documents',      label: 'Documents',        icon: FileText },
  { path: '/documents/upload', label: 'Upload',         icon: Upload },
  { path: '/graph',          label: 'Knowledge Graph',  icon: Network },
  { path: '/search',         label: 'Semantic Search',  icon: Search },
  { path: '/assistant',      label: 'AI Assistant',     icon: Bot },
  { path: '/relationships',  label: 'Relationships',    icon: GitBranch },
  { path: '/search-history', label: 'Search History',  icon: Clock },
  { path: '/qa-history',     label: 'QA History',       icon: MessageSquare },
  { path: '/settings',       label: 'Settings',         icon: Settings },
]

function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Cpu size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            IndustrialKG
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User profile footer */}
      <div className="shrink-0 border-t border-gray-200 p-3">
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 text-sm font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user?.role || 'user'}
            </div>
          </div>
          <ChevronDown size={14} className={`text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {userMenuOpen && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg animate-fade-in">
            <NavLink
              to="/settings"
              onClick={() => { setUserMenuOpen(false); if (onClose) onClose() }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={14} /> Profile & Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  const getPageTitle = () => {
    const match = navItems.find(i => {
      if (i.path === '/documents/upload') return location.pathname === i.path
      return location.pathname.startsWith(i.path) && i.path !== '/'
    })
    if (location.pathname.match(/\/documents\/\d+$/)) return 'Document Details'
    return match ? match.label : 'IndustrialKG'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setIsMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center h-16 px-6 border-b border-gray-200 bg-white/80 backdrop-blur-md shrink-0 z-10">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 mr-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md lg:hidden"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="max-w-7xl mx-auto animate-fade-in pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Network, Link as LinkIcon, Upload, Search, Bot, Activity, FileDigit, Cpu, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'
import { statsAPI, documentAPI } from '../services/api'
import StatCard from '../components/StatCard'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentDocs, setRecentDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        statsAPI.get().catch(() => ({ 
          total_documents: 0, total_entities: 0, total_relationships: 0, 
          graph_nodes: 0, graph_edges: 0, entity_types: {} 
        })),
        documentAPI.list(0, 5).catch(() => ({ items: [] }))
      ])
      
      setStats(statsRes)
      
      let docs = []
      if (Array.isArray(docsRes)) docs = docsRes
      else if (docsRes?.items) docs = docsRes.items
      else if (docsRes?.documents) docs = docsRes.documents
      
      setRecentDocs(docs)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'status-badge completed'
      case 'processing': return 'status-badge processing'
      case 'failed': return 'status-badge failed'
      default: return 'status-badge pending'
    }
  }

  // Format chart data
  const chartData = stats?.entity_types ? 
    Object.entries(stats.entity_types)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7) // Top 7
    : []

  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-white rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white rounded-xl"></div>
          <div className="h-96 bg-white rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Documents" value={stats?.total_documents} icon={FileText} color="blue" />
        <StatCard title="Total Entities" value={stats?.total_entities} icon={Activity} color="green" />
        <StatCard title="Relationships" value={stats?.total_relationships} icon={LinkIcon} color="purple" />
        <StatCard title="Graph Nodes" value={stats?.graph_nodes} icon={FileDigit} color="orange" />
        <StatCard title="Graph Edges" value={stats?.graph_edges} icon={Network} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Documents</h2>
            <Link to="/documents" className="text-sm text-blue-400 hover:text-blue-300">View All</Link>
          </div>
          
          {recentDocs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No documents found. Upload one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <td className="font-medium text-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="truncate max-w-[200px]">{doc.filename}</span>
                        </div>
                      </td>
                      <td>
                        <span className={getStatusClass(doc.status)}>
                          {doc.status || 'pending'}
                        </span>
                      </td>
                      <td className="text-gray-500">
                        {new Date(doc.created_at || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Entity Types</h2>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">No entity data available</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3f55" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a2332', borderColor: '#2d3f55', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Machine Knowledge Pipeline Flow Diagram (Requirement #10 & #11) */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 to-purple-950 text-white rounded-xl shadow-lg border border-purple-800/40">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-purple-300">
          <Activity className="w-5 h-5 text-purple-400" /> Complete Machine Knowledge & Troubleshooting Pipeline
        </h2>
        <p className="text-xs text-purple-200/80 mb-6">
          Multi-document technical ingestion, entity-relationship resolution, RAM context memory, and evidence-based diagnostic reasoning.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          {[
            { step: '1. Documents', desc: 'PDF / Text Specs', icon: FileText, color: 'bg-blue-600/30 border-blue-500 text-blue-300' },
            { step: '2. Entities', desc: 'Specs & Limits', icon: Activity, color: 'bg-emerald-600/30 border-emerald-500 text-emerald-300' },
            { step: '3. Relationships', desc: 'Cross-Doc Mapping', icon: LinkIcon, color: 'bg-cyan-600/30 border-cyan-500 text-cyan-300' },
            { step: '4. Components', desc: 'Machine Hierarchy', icon: Network, color: 'bg-amber-600/30 border-amber-500 text-amber-300' },
            { step: '5. Machine', desc: 'Unified Graph', icon: Cpu, color: 'bg-purple-600/30 border-purple-500 text-purple-300' },
            { step: '6. Failures', desc: 'Root Causes & Limits', icon: AlertTriangle, color: 'bg-red-600/30 border-red-500 text-red-300' },
            { step: '7. Troubleshooting', desc: 'Runability & SOP', icon: Bot, color: 'bg-indigo-600/30 border-indigo-500 text-indigo-300' }
          ].map((item, i) => (
            <div key={i} className={`p-3 rounded-lg border ${item.color} flex flex-col items-center justify-center space-y-1`}>
              <item.icon className="w-5 h-5 mb-1" />
              <div className="text-xs font-bold">{item.step}</div>
              <div className="text-[10px] opacity-80">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/documents/upload')} className="flex items-center justify-center gap-2 p-4 card hover:bg-gray-100 transition-colors text-gray-900 font-medium">
          <Upload className="w-5 h-5 text-blue-400" /> Upload Document
        </button>
        <button onClick={() => navigate('/graph')} className="flex items-center justify-center gap-2 p-4 card hover:bg-gray-100 transition-colors text-gray-900 font-medium">
          <Network className="w-5 h-5 text-cyan-400" /> View Graph
        </button>
        <button onClick={() => navigate('/search')} className="flex items-center justify-center gap-2 p-4 card hover:bg-gray-100 transition-colors text-gray-900 font-medium">
          <Search className="w-5 h-5 text-emerald-400" /> Semantic Search
        </button>
        <button onClick={() => navigate('/assistant')} className="flex items-center justify-center gap-2 p-4 card hover:bg-gray-100 transition-colors text-gray-900 font-medium">
          <Bot className="w-5 h-5 text-purple-400" /> Ask AI Assistant
        </button>
      </div>
    </div>
  )
}


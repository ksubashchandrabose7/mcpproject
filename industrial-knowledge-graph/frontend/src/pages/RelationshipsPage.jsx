import { useState, useEffect } from 'react'
import { GitBranch, Search, ChevronRight, FileText, Settings, Target, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { relationshipAPI, entityAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [relationshipTypes, setRelationshipTypes] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    fetchRelationships()
  }, [selectedType, page])

  const fetchTypes = async () => {
    try {
      const types = await relationshipAPI.types().catch(() => [])
      setRelationshipTypes(types)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchRelationships = async () => {
    setLoading(true)
    try {
      const res = await relationshipAPI.list(selectedType, page * limit, limit)
      setRelationships(res || [])
    } catch (error) {
      toast.error('Failed to load relationships')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRelationships = relationships.filter(r => {
    const search = searchTerm.toLowerCase()
    return (
      (r.source_entity_name || '').toLowerCase().includes(search) ||
      (r.target_entity_name || '').toLowerCase().includes(search) ||
      r.relationship_type.toLowerCase().includes(search)
    )
  })

  const handleVerify = async (id, status) => {
    try {
      await relationshipAPI.verify(id, status)
      setRelationships(prev => prev.map(r => r.id === id ? { ...r, is_verified: status } : r))
      toast.success(status === 1 ? 'Marked as Verified' : 'Marked as Rejected')
    } catch (err) {
      toast.error('Failed to update verification status')
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="text-blue-500" /> Document Relationship Explorer
          </h1>
          <p className="text-gray-500 mt-1">Explore how entities connect across your industrial documents</p>
        </div>
      </div>

      <div className="card p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search entities or relationships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input w-48"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          {relationshipTypes.map(rt => (
            <option key={rt.type} value={rt.type}>{rt.type} ({rt.count})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRelationships.length > 0 ? (
            filteredRelationships.map(rel => (
              <div key={rel.id} className="card p-4 hover:border-blue-500/50 transition-colors">
                <div className="flex flex-col gap-3">
                  
                  {/* Source Entity */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Settings size={16} className="text-blue-500" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium truncate" title={rel.source_entity_name}>
                        {rel.source_entity_name || 'Unknown Entity'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        Type: {rel.source_entity_type || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {/* Relationship */}
                  <div className="flex items-center justify-center relative py-2">
                    <div className="absolute w-full h-[1px] bg-gray-700"></div>
                    <div className="relative bg-white px-3 py-1 rounded-full border border-gray-200 flex items-center gap-1">
                      <ChevronRight size={14} className="text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600">
                        {rel.relationship_type}
                      </span>
                    </div>
                  </div>

                  {/* Target Entity */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Target size={16} className="text-purple-500" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium truncate" title={rel.target_entity_name}>
                        {rel.target_entity_name || 'Unknown Entity'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        Type: {rel.target_entity_type || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText size={12} /> Doc ID: {rel.document_id}
                    </div>
                    <div className="flex items-center gap-3">
                      <div>Conf: {(rel.confidence * 100).toFixed(0)}%</div>
                      <div className="flex gap-1 border-l pl-3 border-gray-300">
                        <button 
                          onClick={() => handleVerify(rel.id, 1)}
                          title="Verify"
                          className={`p-1 rounded hover:bg-green-100 ${rel.is_verified === 1 ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => handleVerify(rel.id, -1)}
                          title="Reject"
                          className={`p-1 rounded hover:bg-red-100 ${rel.is_verified === -1 ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No relationships found matching your criteria.
            </div>
          )}
        </div>
      )}
      
      {filteredRelationships.length === limit && (
        <div className="flex justify-center mt-4">
           <button onClick={() => setPage(p => p + 1)} className="btn btn-secondary">Load More</button>
        </div>
      )}
    </div>
  )
}

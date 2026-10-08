import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Trash2, Eye, Play, Search, Filter, AlertTriangle, FileUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentAPI } from '../services/api'
import { format } from 'date-fns'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await documentAPI.list(0, 100)
      let docs = []
      if (Array.isArray(response)) docs = response
      else if (response?.items) docs = response.items
      else if (response?.documents) docs = response.documents
      
      setDocuments(docs)
    } catch (error) {
      toast.error('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDelete = async () => {
    if (!docToDelete) return
    try {
      await documentAPI.delete(docToDelete.id)
      toast.success('Document deleted successfully')
      setDocuments(documents.filter(d => d.id !== docToDelete.id))
    } catch (error) {
      toast.error('Failed to delete document')
    } finally {
      setDeleteModalOpen(false)
      setDocToDelete(null)
    }
  }

  const handleProcess = async (id, e) => {
    e.stopPropagation()
    try {
      toast.success('Processing started...')
      // Optimistic update
      setDocuments(documents.map(d => d.id === id ? { ...d, status: 'processing' } : d))
      await documentAPI.process(id)
      toast.success('Processing complete!')
      fetchDocuments() // Refresh to get counts
    } catch (error) {
      toast.error('Processing failed')
      fetchDocuments() // Revert state
    }
  }

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'status-badge completed'
      case 'processing': return 'status-badge processing'
      case 'failed': return 'status-badge failed'
      default: return 'status-badge pending'
    }
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || doc.status?.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button onClick={() => navigate('/documents/upload')} className="btn btn-primary">
          <FileUp className="w-4 h-4 mr-2" /> Upload New
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search documents..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            className="input w-auto min-w-[150px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Document List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FileText className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-6">Upload some industrial manuals to get started.</p>
            <button onClick={() => navigate('/documents/upload')} className="btn btn-primary">Upload Document</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Entities</th>
                  <th>Relationships</th>
                  <th>Uploaded</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="cursor-pointer group" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <td className="font-medium text-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="truncate max-w-[250px]" title={doc.filename}>{doc.filename}</span>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusClass(doc.status)}>{doc.status || 'pending'}</span>
                    </td>
                    <td className="text-gray-600">{doc.entities_count || 0}</td>
                    <td className="text-gray-600">{doc.relationships_count || 0}</td>
                    <td className="text-gray-500">{doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : '-'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(doc.status === 'pending' || doc.status === 'failed') && (
                          <button 
                            onClick={(e) => handleProcess(doc.id, e)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                            title="Process Document"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`) }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); setDeleteModalOpen(true); }}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card p-6 max-w-md w-full mx-4 animate-slide-in border-red-500/30">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Delete Document</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{docToDelete?.filename}</span>? 
              This will also remove all extracted entities and relationships from the knowledge graph. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

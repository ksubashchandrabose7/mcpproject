import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, Play, Trash2, Database, Link as LinkIcon, FileJson, Clock, BookOpen, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentAPI } from '../services/api'
import EntityBadge from '../components/EntityBadge'
import DocumentViewerModal from '../components/DocumentViewerModal'
import { format } from 'date-fns'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const pageParam = searchParams.get('page')
  
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [processing, setProcessing] = useState(false)
  const [readerModalOpen, setReaderModalOpen] = useState(false)
  const [activePageNum, setActivePageNum] = useState(1)

  const fetchData = async () => {
    try {
      const docData = await documentAPI.get(id)
      setDoc(docData)
      
      if (docData.status === 'completed') {
        const entData = await documentAPI.getEntities(id).catch(() => [])
        setEntities(entData)
      }
    } catch (error) {
      toast.error('Failed to load document details')
      navigate('/documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (pageParam) {
      const p = Number(pageParam)
      if (p > 0) {
        setActivePageNum(p)
        setReaderModalOpen(true)
      }
    }
  }, [pageParam])

  const handleProcess = async () => {
    setProcessing(true)
    try {
      toast.success('Processing started...')
      await documentAPI.process(id)
      toast.success('Processing complete!')
      fetchData()
    } catch (error) {
      toast.error('Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentAPI.delete(id)
        toast.success('Document deleted')
        navigate('/documents')
      } catch (error) {
        toast.error('Failed to delete document')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!doc) return null

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'status-badge completed'
      case 'processing': return 'status-badge processing'
      case 'failed': return 'status-badge failed'
      default: return 'status-badge pending'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'entities', label: `Entities (${entities.length || doc.entity_count || 0})`, icon: Database },
    { id: 'relationships', label: `Relationships (${doc.relationship_count || 0})`, icon: LinkIcon },
    { id: 'text', label: 'Extracted Text', icon: FileJson },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-gray-500">
        <button onClick={() => navigate('/documents')} className="hover:text-gray-900 transition-colors flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2 break-all">{doc.original_filename || doc.filename}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className={getStatusClass(doc.status)}>{doc.status}</span>
                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'PPpp') : 'Unknown'}</span>
                <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActivePageNum(1)
                setReaderModalOpen(true)
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm shadow-xs"
            >
              <BookOpen className="w-4 h-4" /> Open Page Reader
            </button>

            <a
              href={`http://localhost:8000/api/documents/${doc.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-sm border border-gray-300"
            >
              <ExternalLink className="w-4 h-4" /> Raw File
            </a>

            {(doc.status === 'pending' || doc.status === 'failed') && (
              <button 
                onClick={handleProcess} 
                disabled={processing}
                className="btn btn-primary"
              >
                {processing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Play className="w-4 h-4 mr-2" />}
                {processing ? 'Processing...' : 'Process Document'}
              </button>
            )}
            <button onClick={handleDelete} className="btn btn-danger">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-white'}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 min-h-[400px] shadow-sm">
        
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Document Details & Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2 text-sm">
                  <span className="text-gray-500">Document ID</span>
                  <span className="font-mono font-bold text-gray-900">{doc.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2 text-sm">
                  <span className="text-gray-500">File Type</span>
                  <span className="font-semibold text-gray-900 uppercase">{doc.file_type || 'PDF'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2 text-sm">
                  <span className="text-gray-500">File Size</span>
                  <span className="text-gray-900 font-medium">{(doc.file_size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2 text-sm">
                  <span className="text-gray-500">Uploaded At</span>
                  <span className="text-gray-900 font-medium">{doc.uploaded_at ? format(new Date(doc.uploaded_at), 'PPpp') : '-'}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 text-sm">Knowledge Graph Summary</h4>
                <div className="flex justify-around text-center">
                  <div>
                    <div className="text-3xl font-extrabold text-blue-600">{entities.length || doc.entity_count || 0}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">Entities Extracted</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-purple-600">{doc.relationship_count || 0}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">Relationships</div>
                  </div>
                </div>
                {doc.status === 'completed' && (
                  <button 
                    onClick={() => navigate('/graph')} 
                    className="w-full mt-6 py-2.5 px-4 bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 font-semibold text-xs rounded-lg transition-colors shadow-2xs"
                  >
                    Explore in Interactive Knowledge Graph
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="p-6">
            {entities.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                {doc.status === 'completed' ? 'No entities were extracted from this document.' : 'Process the document first to extract entities.'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {entities.map((ent, i) => (
                  <EntityBadge key={i} type={ent.entity_type || ent.type} name={ent.entity_name || ent.name} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="p-6">
            {doc.extracted_text ? (
              <pre className="whitespace-pre-wrap font-mono text-gray-800 text-xs leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-[550px] overflow-y-auto custom-scrollbar select-text">
                {doc.extracted_text}
              </pre>
            ) : (
              <div className="text-center text-gray-400 py-12 text-sm">No text extracted yet.</div>
            )}
          </div>
        )}

      </div>

      {/* Reader Modal */}
      <DocumentViewerModal
        isOpen={readerModalOpen}
        onClose={() => setReaderModalOpen(false)}
        documentId={doc.id}
        documentName={doc.original_filename || doc.filename}
        initialPage={activePageNum}
      />
    </div>
  )
}

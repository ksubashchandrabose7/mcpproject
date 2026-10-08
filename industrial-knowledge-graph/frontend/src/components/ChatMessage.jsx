import { Bot, User, ChevronDown, ChevronUp, Copy, CheckCircle2, FileText, BookOpen, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import EntityBadge from './EntityBadge'
import DocumentViewerModal from './DocumentViewerModal'
import { format } from 'date-fns'

export default function ChatMessage({ message }) {
  const { role, content, sources, entities, timestamp } = message
  const isUser = role === 'user'
  
  const [sourcesOpen, setSourcesOpen] = useState(true) // Open by default for quick visibility
  const [copied, setCopied] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, documentId: null, documentName: '', pageNumber: 1 })

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenPageReader = (docId, docName, pageNum) => {
    setModalState({
      isOpen: true,
      documentId: docId,
      documentName: docName,
      pageNumber: pageNum || 1
    })
  }

  // Basic markdown formatting for bold text
  const formatText = (text) => {
    if (!text) return ''
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <>
      <div className={`flex w-full mb-6 animate-slide-in ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[90%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'ml-3 bg-blue-500/20 text-blue-400' : 'mr-3 bg-[#2d3f55] text-white'}`}>
            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>

          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div 
              className={`px-5 py-4 rounded-2xl ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' 
                  : 'bg-white card border border-gray-200 rounded-tl-sm text-gray-900 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-gray-900 text-sm">
                {formatText(content)}
              </div>

              {/* Source Quick Action Buttons */}
              {!isUser && sources && sources.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <button 
                      onClick={() => setSourcesOpen(!sourcesOpen)}
                      className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                    >
                      {sourcesOpen ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                      Cited Document Sources ({sources.length})
                    </button>
                  </div>
                  
                  {/* Quick-Jump Page Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sources.map((source, idx) => {
                      const docId = source.document_id || 1
                      const docName = source.document_name || source.filename || `Document ${idx+1}`
                      const pageNum = source.page_number || 1
                      return (
                        <button
                          key={idx}
                          onClick={() => handleOpenPageReader(docId, docName, pageNum)}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-medium transition-colors gap-1 shadow-2xs"
                          title={`Click to open ${docName} directly at Page ${pageNum}`}
                        >
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[140px]">{docName}</span>
                          <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                            Page {pageNum}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Expanded Source Details */}
                  {sourcesOpen && (
                    <div className="mt-2 space-y-2">
                      {sources.map((source, idx) => {
                        const docId = source.document_id || 1
                        const docName = source.document_name || source.filename || `Document ${idx+1}`
                        const pageNum = source.page_number || 1
                        return (
                          <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-gray-200 text-xs shadow-2xs">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="break-all">{docName}</span>
                                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                  Page {pageNum}
                                </span>
                              </div>

                              <button
                                onClick={() => handleOpenPageReader(docId, docName, pageNum)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1 text-[11px] shrink-0"
                              >
                                <BookOpen className="w-3 h-3" /> Open Page {pageNum}
                              </button>
                            </div>

                            <div className="text-gray-600 text-xs italic bg-white p-2.5 rounded-lg border border-gray-200/80 font-mono line-clamp-4">
                              "{source.chunk_text || source.content || source.text}"
                            </div>

                            {source.score && (
                              <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                                <span>Relevance Match: {(source.score * 100).toFixed(1)}%</span>
                                <a 
                                  href={`http://localhost:8000/api/documents/${docId}/file#page=${pageNum}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-500 hover:underline flex items-center gap-0.5"
                                >
                                  Raw PDF <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {!isUser && entities && entities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
                  {entities.map((entity, idx) => (
                    <EntityBadge key={idx} type={entity.type || entity.label} name={entity.name} />
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center mt-1 text-xs text-gray-500 px-2 gap-2">
              <span>{timestamp ? format(new Date(timestamp), 'h:mm a') : 'Just now'}</span>
              {!isUser && (
                <button onClick={handleCopy} className="hover:text-gray-600 transition-colors flex items-center" title="Copy message">
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Reader Modal */}
      <DocumentViewerModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, documentId: null, documentName: '', pageNumber: 1 })}
        documentId={modalState.documentId}
        documentName={modalState.documentName}
        initialPage={modalState.pageNumber}
      />
    </>
  )
}

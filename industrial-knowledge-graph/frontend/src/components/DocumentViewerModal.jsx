import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, FileText, Download, ExternalLink, BookOpen, FileCode, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentAPI } from '../services/api'

export default function DocumentViewerModal({ isOpen, onClose, documentId, documentName, initialPage = 1, highlightText = '' }) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('text') // 'text' or 'file'
  const [filterQuery, setFilterQuery] = useState('')

  useEffect(() => {
    if (initialPage) {
      setCurrentPage(Number(initialPage))
    }
  }, [initialPage])

  useEffect(() => {
    if (!isOpen || !documentId) return

    const fetchPage = async () => {
      setLoading(true)
      try {
        const data = await documentAPI.getPage(documentId, currentPage)
        setPageData(data)
      } catch (err) {
        console.error('Failed to fetch page content:', err)
        toast.error('Failed to load page content')
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [isOpen, documentId, currentPage])

  if (!isOpen) return null

  const totalPages = pageData?.total_pages || 1
  const isPdf = documentName?.toLowerCase().endswith?.('.pdf') || pageData?.file_type?.toLowerCase() === '.pdf'

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
  }

  const rawFileUrl = `http://localhost:8000/api/documents/${documentId}/file#page=${currentPage}`

  // Format text with matching highlights
  const renderHighlightedText = (text) => {
    if (!text) return <span className="text-gray-400 italic">No text content available on this page.</span>

    const term = filterQuery || highlightText
    if (!term || !term.trim()) {
      return text
    }

    try {
      const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
      return parts.map((part, i) => 
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-amber-900 font-semibold px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )
    } catch (e) {
      return text
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{documentName || pageData?.document_name || 'Document Page Reader'}</span>
                <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  Page {currentPage} of {totalPages}
                </span>
              </h2>
              <p className="text-xs text-gray-400">Read & inspect actual file page content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-gray-800 p-1 rounded-lg flex gap-1 border border-gray-700 text-xs">
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Text Reader
              </button>
              <button
                onClick={() => setViewMode('file')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'file' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> File Preview
              </button>
            </div>

            <a
              href={rawFileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="Open raw file in browser tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open Raw File</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Navigation Toolbar */}
        <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Page
            </button>
            
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (val >= 1 && val <= totalPages) setCurrentPage(val)
                }}
                className="w-14 text-center border border-gray-300 rounded-md py-1 font-bold text-gray-900 bg-white"
              />
              <span className="text-gray-500 font-medium">/ {totalPages}</span>
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 text-gray-700"
            >
              Next Page <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Highlight Filter */}
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Highlight text on page..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-1 pl-8 pr-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content View Area */}
        <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-xs">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Reading Page {currentPage}...</span>
              </div>
            </div>
          ) : viewMode === 'text' ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Extracted Page Content (Page {currentPage})
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {pageData?.page_text?.length || 0} Characters
                </span>
              </div>

              <div className="bg-slate-50 border border-gray-200 rounded-xl p-6 font-mono text-sm leading-relaxed text-gray-800 whitespace-pre-wrap select-text shadow-inner min-h-[300px]">
                {renderHighlightedText(pageData?.page_text)}
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[450px] border border-gray-200 rounded-xl overflow-hidden">
              <iframe
                src={rawFileUrl}
                title={`Page ${currentPage} File Viewer`}
                className="w-full h-full min-h-[500px]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Active File ID: {documentId} • Navigated to Page {currentPage}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>
  )
}

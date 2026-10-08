import { useState, useEffect } from 'react'
import { MessageSquare, Trash2, ChevronDown, ChevronUp, Bot, User, Download } from 'lucide-react'
import { qaAPI } from '../services/api'
import { format } from 'date-fns'

export default function QAHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await qaAPI.history(0, 50)
      setHistory(res.items || res || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-6 h-6 mr-3 text-purple-400" /> Q&A History
        </h1>
        <div className="flex gap-2">
          {history.length > 0 && (
            <button 
              onClick={() => {
                const token = localStorage.getItem('kg_token')
                fetch('http://localhost:8000/api/qa-history/export', {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.blob())
                .then(blob => {
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'qa_history.csv'
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                })
              }} 
              className="btn bg-green-500 hover:bg-green-600 text-white text-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          )}
          {history.length > 0 && (
            <button onClick={() => {if(window.confirm('Clear all?')) setHistory([])}} className="btn btn-secondary text-sm">
              <Trash2 className="w-4 h-4 mr-2" /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            No question & answer history found.
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} className="card overflow-hidden border border-gray-200 hover:border-gray-200 transition-colors">
              <button 
                onClick={() => setExpandedId(expandedId === i ? null : i)}
                className="w-full p-4 flex items-start justify-between text-left bg-white hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 pr-4">
                  <User className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-gray-900 font-medium text-lg leading-snug">"{item.question}"</h3>
                    <div className="text-xs text-gray-500 mt-2">
                      {item.created_at ? format(new Date(item.created_at), 'PPp') : 'Unknown date'}
                    </div>
                  </div>
                </div>
                {expandedId === i ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>

              {expandedId === i && (
                <div className="p-4 border-t border-gray-200 bg-gray-100">
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.answer}</div>
                      
                      {item.sources && item.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 block">Sources</span>
                          <div className="space-y-2">
                            {item.sources.map((src, sIdx) => (
                              <div key={sIdx} className="bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="text-sm font-medium text-blue-400">{src.document_name || src.filename}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

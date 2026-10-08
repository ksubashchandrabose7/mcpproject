import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Loader, FileText, ArrowRight, Clock } from 'lucide-react'
import { searchAPI } from '../services/api'
import EntityBadge from '../components/EntityBadge'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [history, setHistory] = useState([])

  const fetchHistory = async () => {
    try {
      const res = await searchAPI.history(0, 5)
      setHistory(res.items || res || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSearch = async (e, forceQuery = null) => {
    if (e) e.preventDefault()
    
    const searchQuery = forceQuery || query
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setLoading(true)
    setHasSearched(true)

    try {
      const res = await searchAPI.search(searchQuery, 10)
      setResults(res.results || res || [])
      fetchHistory() // refresh history
    } catch (error) {
      console.error(error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const exampleQueries = [
    "Pump P-101 maintenance",
    "Bearing failure cause",
    "Valve inspection procedure",
    "Motor vibration fault"
  ]

  const highlightText = (text, query) => {
    if (!text || !query) return text
    const words = query.split(' ').filter(w => w.length > 2)
    if (words.length === 0) return text
    
    let highlighted = text
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      highlighted = highlighted.replace(regex, '<span class="bg-blue-500/30 text-blue-300 rounded px-1">$1</span>')
    })
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Main Search Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Semantic Search</h1>
          <p className="text-gray-500 mb-6">Search through your industrial knowledge base using natural language.</p>
          
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'What are the symptoms of bearing failure?'"
              className="w-full bg-white border-2 border-gray-200 focus:border-blue-500 rounded-xl py-4 pl-4 pr-14 text-lg text-gray-900 shadow-lg transition-colors focus:outline-none"
            />
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </form>

          {!hasSearched && (
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-2 py-1">Try asking:</span>
              {exampleQueries.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(null, ex)}
                  className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 custom-scrollbar">
          {hasSearched && !loading && results.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try rephrasing your query or using different keywords.</p>
            </div>
          )}

          {results.map((result, i) => {
            const scoreVal = result.similarity_score ?? result.score ?? 0
            const textVal = result.chunk_text || result.text || result.content || ''
            const docName = result.document_name || result.filename || `Document ${result.document_id}`

            return (
              <div key={i} className="card p-5 hover:border-blue-500/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex justify-between items-start mb-3">
                  <Link to={`/documents/${result.document_id}`} className="flex items-center text-blue-400 hover:text-blue-300 font-medium text-lg">
                    <FileText className="w-5 h-5 mr-2" />
                    {docName}
                  </Link>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Relevance</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      scoreVal > 0.8 ? 'bg-green-500/20 text-green-400' : 
                      scoreVal > 0.4 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {(scoreVal * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-gray-600 text-sm mb-4 leading-relaxed bg-gray-100 p-4 rounded-lg border border-gray-200">
                  {highlightText(textVal, query)}
                </div>

                {result.entities && result.entities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-gray-500 py-1">Related Entities:</span>
                    {result.entities.slice(0, 5).map((e, idx) => (
                      <EntityBadge key={idx} type={e.type || e.label} name={e.name} />
                    ))}
                    {result.entities.length > 5 && (
                      <span className="text-xs text-gray-500 py-1">+{result.entities.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar - History */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div className="card p-4 flex-1">
          <h3 className="font-medium text-gray-600 mb-4 flex items-center border-b border-gray-200 pb-2">
            <Clock className="w-4 h-4 mr-2" /> Recent Searches
          </h3>
          
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No recent searches.</p>
            ) : (
              history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(null, item.query)}
                  className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors group flex items-start"
                >
                  <Search className="w-3 h-3 text-gray-500 mt-1 mr-2 group-hover:text-blue-400 shrink-0" />
                  <div>
                    <div className="text-sm text-gray-600 group-hover:text-gray-900 truncate" title={item.query}>{item.query}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link to="/search-history" className="text-sm text-blue-400 hover:text-blue-300 flex items-center">
              View full history <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

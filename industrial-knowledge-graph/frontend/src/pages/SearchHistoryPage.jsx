import { useState, useEffect } from 'react'
import { Clock, Search, RotateCcw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchAPI } from '../services/api'
import { format } from 'date-fns'

export default function SearchHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await searchAPI.history(0, 50)
      setHistory(res.items || res || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRerun = (query) => {
    // We would need to pass this via state or context in a real app, 
    // but for simplicity, we just navigate to search. The search page
    // could check query params or location state.
    navigate('/search', { state: { query } })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Clock className="w-6 h-6 mr-3 text-blue-400" /> Search History
        </h1>
        {history.length > 0 && (
          <button onClick={() => {if(window.confirm('Clear all?')) setHistory([])}} className="btn btn-secondary text-sm">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No search history found.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="w-1/2">Query</th>
                <th>Results Found</th>
                <th>Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => (
                <tr key={i} className="hover:bg-gray-100">
                  <td className="font-medium text-gray-200">
                    <div className="flex items-center">
                      <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                      <span className="break-all">"{item.query}"</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{item.results_count || 0}</td>
                  <td className="text-gray-500">{item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy HH:mm') : '-'}</td>
                  <td className="text-right">
                    <button 
                      onClick={() => handleRerun(item.query)}
                      className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors inline-flex items-center"
                      title="Run Search Again"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

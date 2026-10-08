import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Trash2, AlertTriangle, ShieldCheck, Cpu, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { qaAPI } from '../services/api'
import ChatMessage from '../components/ChatMessage'

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [activeRamEntities, setActiveRamEntities] = useState([])
  const [diagnosticQuestions, setDiagnosticQuestions] = useState([])
  const [lastRunability, setLastRunability] = useState(null)
  const [showRamDetails, setShowRamDetails] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e, forceText = null) => {
    if (e) e.preventDefault()
    const text = forceText || input
    if (!text.trim()) return

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await qaAPI.ask(text, sessionId, emergencyMode)
      if (res.session_id) setSessionId(res.session_id)
      if (res.active_ram_entities) setActiveRamEntities(res.active_ram_entities)
      if (res.diagnostic_questions) setDiagnosticQuestions(res.diagnostic_questions)
      if (res.runability) setLastRunability(res.runability)

      const astMsg = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        entities: res.entities,
        runability: res.runability,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, astMsg])
    } catch (error) {
      toast.error('Failed to get answer from AI')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while trying to answer your question.', timestamp: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (window.confirm('Clear diagnostic chat session memory?')) {
      setMessages([])
      setSessionId(null)
      setActiveRamEntities([])
      setDiagnosticQuestions([])
      setLastRunability(null)
    }
  }

  const exampleQuestions = [
    "The machine suddenly stopped while running with high motor temperature.",
    "Current bearing temp is 195°C. Can the pump continue running safely?",
    "Why did Pump P-101 fail and what is the root cause analysis?",
    "Is material Steel compatible with 200°C temperature requirement?"
  ]

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bot className="w-6 h-6 mr-2 text-purple-600" /> AI Diagnostic & Troubleshooting
          </h1>

          {lastRunability && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              lastRunability === 'UNSAFE' ? 'bg-red-100 text-red-700 border border-red-300' :
              lastRunability === 'OUTSIDE SPECIFICATION' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
              'bg-emerald-100 text-emerald-700 border border-emerald-300'
            }`}>
              {lastRunability === 'UNSAFE' ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              RUNABILITY: {lastRunability}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Emergency Mode Toggle */}
          <button
            type="button"
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              emergencyMode 
                ? 'bg-red-600 text-white shadow-md animate-pulse' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {emergencyMode ? 'EMERGENCY MODE ACTIVE' : 'Emergency Mode'}
          </button>

          {messages.length > 0 && (
            <button onClick={handleClear} className="text-gray-500 hover:text-red-500 flex items-center text-xs font-medium transition-colors">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Reset RAM Context
            </button>
          )}
        </div>
      </div>

      {/* RAM Context Bar */}
      {activeRamEntities.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-xs mb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-semibold text-purple-900">RAM Active Context:</span>
              <span className="text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded font-medium text-[11px]">
                {activeRamEntities.length} entities in memory
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRamDetails(!showRamDetails)}
              className="text-purple-700 hover:text-purple-900 font-semibold underline text-[11px]"
            >
              {showRamDetails ? 'Collapse Tags' : 'View Entity Tags'}
            </button>
          </div>

          {showRamDetails && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-purple-200/60 max-h-32 overflow-y-auto custom-scrollbar">
              {activeRamEntities.map((ent, idx) => (
                <span key={idx} className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-mono text-[11px]">
                  {ent}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-t-xl border-t border-l border-r border-gray-200 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Machine Troubleshooting & Diagnostic Engine</h2>
            <p className="text-sm text-gray-500 mb-6">Describe a machine incident or ask technical specification queries. The AI uses multi-document knowledge graphs, temporary RAM context memory, and limit verification.</p>
            
            <div className="w-full space-y-2.5">
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(null, q)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 rounded-lg text-left text-xs font-medium text-gray-700 transition-all flex items-center justify-between group"
                >
                  <span>"{q}"</span>
                  <Send className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {loading && (
              <div className="flex w-full mb-6 justify-start animate-fade-in">
                <div className="flex max-w-[85%] flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-purple-600 text-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-gray-100 border border-gray-200 rounded-tl-sm flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 mr-2 font-medium">Analyzing Knowledge Graph & RAM context...</span>
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Dynamic Diagnostic Follow-up Question Chips */}
      {diagnosticQuestions.length > 0 && (
        <div className="bg-purple-50/80 border-x border-t border-purple-200 p-3 shrink-0">
          <p className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Recommended Diagnostic Questions (Click to Answer):
          </p>
          <div className="flex flex-wrap gap-2">
            {diagnosticQuestions.map((dq, idx) => (
              <button
                key={idx}
                onClick={() => setInput(dq)}
                className="text-left text-xs bg-white border border-purple-300 hover:border-purple-500 hover:bg-purple-100 text-purple-900 px-2.5 py-1.5 rounded-md transition-colors"
              >
                {dq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-50 p-4 rounded-b-xl border border-gray-200 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={emergencyMode ? "EMERGENCY: Describe failure symptom or component..." : "Report a machine problem or ask technical specs..."}
            className={`w-full bg-white border focus:outline-none rounded-xl py-3 pl-4 pr-14 text-sm text-gray-900 resize-none max-h-32 custom-scrollbar ${
              emergencyMode ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
            }`}
            rows="1"
            style={{ minHeight: '52px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 bottom-2 p-2 text-white rounded-lg transition-colors ${
              emergencyMode ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'
            } disabled:bg-gray-400`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[11px] text-gray-400">Context Memory Active • Answers grounded in multi-document Knowledge Graph evidence</span>
        </div>
      </div>
    </div>
  )
}


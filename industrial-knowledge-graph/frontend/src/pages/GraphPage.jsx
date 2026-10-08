import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Info, FileText, Network } from 'lucide-react'
import toast from 'react-hot-toast'
import { graphAPI } from '../services/api'
import GraphViewer from '../components/GraphViewer'
import EntityBadge from '../components/EntityBadge'

export default function GraphPage() {
  const navigate = useNavigate()
  const [graphData, setGraphData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState([])

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const [gData, sData] = await Promise.all([
          graphAPI.getData(),
          graphAPI.getStats()
        ])
        setGraphData(gData)
        setStats(sData)
        
        // Calculate all entity types from stats or graphData
        const typesObj = sData?.entity_types || sData?.node_types
        if (typesObj && Object.keys(typesObj).length > 0) {
          setActiveFilters(Object.keys(typesObj))
        } else if (gData?.nodes) {
          const extractedTypes = new Set()
          gData.nodes.forEach(n => {
            const d = n.data || n
            const t = d.type || d.label || 'Unknown'
            if (t) extractedTypes.add(t)
          })
          setActiveFilters(Array.from(extractedTypes))
        }
      } catch (error) {
        console.error('Failed to load graph data:', error)
        toast.error('Failed to load graph data')
      } finally {
        setLoading(false)
      }
    }
    fetchGraph()
  }, [])

  // Consolidate entity types and counts
  const entityTypes = useMemo(() => {
    if (stats?.entity_types && Object.keys(stats.entity_types).length > 0) {
      return stats.entity_types
    }
    if (stats?.node_types && Object.keys(stats.node_types).length > 0) {
      return stats.node_types
    }
    if (!graphData?.nodes) return {}
    const counts = {}
    graphData.nodes.forEach(n => {
      const d = n.data || n
      const t = d.type || d.label || 'Unknown'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [stats, graphData])

  const handleNodeClick = (nodeData) => {
    setSelectedNode(nodeData)
  }

  const toggleFilter = (type) => {
    setActiveFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleSelectAll = () => {
    setActiveFilters(Object.keys(entityTypes))
  }

  const handleClearAll = () => {
    setActiveFilters([])
  }

  // Filter graph data safely before passing to viewer
  const filteredData = useMemo(() => {
    if (!graphData) return null

    // 1. Filter nodes based on active node type filters and search term
    const filteredNodes = (graphData.nodes || []).filter(n => {
      const d = n.data || n
      const nodeType = d.type || d.label || 'Unknown'
      const nodeName = d.label || d.name || String(d.id || '')
      
      const typeMatch = activeFilters.some(f => f.toLowerCase() === nodeType.toLowerCase())
      const searchMatch = !searchTerm || nodeName.toLowerCase().includes(searchTerm.toLowerCase())
      
      return typeMatch && searchMatch
    })

    // 2. Build set of kept node IDs
    const keptNodeIds = new Set(filteredNodes.map(n => String((n.data || n).id)))

    // 3. Filter edges to ONLY include edges connecting nodes that actually exist in keptNodeIds
    // This prevents Cytoscape from crashing on dangling edge references
    const filteredEdges = (graphData.edges || []).filter(e => {
      const d = e.data || e
      return keptNodeIds.has(String(d.source)) && keptNodeIds.has(String(d.target))
    })

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    }
  }, [graphData, activeFilters, searchTerm])

  const totalNodes = stats?.node_count ?? stats?.nodes ?? graphData?.nodes?.length ?? 0
  const totalEdges = stats?.edge_count ?? stats?.edges ?? graphData?.edges?.length ?? 0
  const currentNodesCount = filteredData?.nodes?.length ?? 0
  const currentEdgesCount = filteredData?.edges?.length ?? 0

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Network className="w-6 h-6 mr-3 text-blue-500" /> Knowledge Graph
        </h1>
        {stats && (
          <div className="flex gap-3 text-sm text-gray-600">
            <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Showing Nodes: <strong className="text-blue-600">{currentNodesCount}</strong> / {totalNodes}
            </span>
            <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Showing Edges: <strong className="text-purple-600">{currentEdgesCount}</strong> / {totalEdges}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
        
        {/* Left Panel - Controls & Info */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto shrink-0">
          
          {/* Search */}
          <div className="card p-4 shrink-0 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                className="input pl-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4 shrink-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-blue-500" /> Node Types
              </h3>
              <div className="flex gap-2 text-xs">
                <button 
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  All
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={handleClearAll}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
              {entityTypes && Object.entries(entityTypes).map(([type, count]) => {
                const isChecked = activeFilters.some(f => f.toLowerCase() === type.toLowerCase())
                return (
                  <label key={type} className="flex items-center justify-between cursor-pointer group hover:bg-gray-50 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 mr-2 h-4 w-4 cursor-pointer"
                        checked={isChecked}
                        onChange={() => toggleFilter(type)}
                      />
                      <EntityBadge type={type} />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-700">{count}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Selected Node Info */}
          <div className="card flex-1 flex flex-col overflow-hidden shadow-sm min-h-[180px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-gray-800 text-sm">Selected Node Details</h3>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {!selectedNode ? (
                <div className="text-center text-gray-400 text-sm mt-6">
                  Click on any node in the graph to inspect its details and connections.
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Name</div>
                    <div className="text-base font-bold text-gray-900 break-words">{selectedNode.label || selectedNode.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Entity Type</div>
                    <EntityBadge type={selectedNode.type} />
                  </div>

                  {selectedNode.document_id && (
                    <button 
                      onClick={() => navigate(`/documents/${selectedNode.document_id}`)}
                      className="w-full flex items-center justify-center p-2.5 mt-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 text-sm font-medium"
                    >
                      <FileText className="w-4 h-4 mr-2" /> View Source Document
                    </button>
                  )}

                  {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Properties</div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 max-h-40 overflow-y-auto">
                        {Object.entries(selectedNode.properties).map(([k, v]) => (
                          <div key={k} className="text-xs flex flex-col">
                            <span className="text-gray-500 font-medium">{k}:</span>
                            <span className="text-gray-900 font-mono break-all">{v?.toString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 relative min-h-[450px] shadow-sm overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-blue-600 font-semibold tracking-wider uppercase text-xs animate-pulse">Loading Knowledge Graph</div>
              </div>
            </div>
          ) : (
            <GraphViewer 
              graphData={filteredData} 
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}

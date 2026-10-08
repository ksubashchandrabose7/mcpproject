import { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { ZoomIn, ZoomOut, Maximize, RotateCcw, LayoutGrid, Circle, GitFork, Layers, Network } from 'lucide-react'

// Register dagre layout safely
try {
  cytoscape.use(dagre)
} catch (e) {
  // Extension already registered
}

export default function GraphViewer({ graphData, onNodeClick, selectedNodeId }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [currentLayout, setCurrentLayout] = useState('cose')

  // Entity color mapper
  const getColor = (type) => {
    const t = (type || '').toLowerCase()
    if (t.includes('equip')) return '#f97316' // Orange 500
    if (t.includes('component')) return '#14b8a6' // Teal 500
    if (t.includes('fault') || t.includes('error')) return '#ef4444' // Red 500
    if (t.includes('mainten') || t.includes('action')) return '#a855f7' // Purple 500
    if (t.includes('sensor')) return '#eab308' // Yellow 500
    if (t.includes('person') || t.includes('role')) return '#10b981' // Emerald 500
    if (t.includes('locat')) return '#6366f1' // Indigo 500
    if (t.includes('process')) return '#3b82f6' // Blue 500
    if (t.includes('spare') || t.includes('part')) return '#f59e0b' // Amber 500
    if (t.includes('safety')) return '#ec4899' // Pink 500
    return '#64748b' // Slate 500
  }

  // Layout configuration builder
  const getLayoutConfig = (layoutName) => {
    switch (layoutName) {
      case 'cose':
        return {
          name: 'cose',
          animate: false,
          componentSpacing: 50,
          nodeRepulsion: () => 400000,
          nodeOverlap: 20,
          idealEdgeLength: () => 40, // Short, compact edge lines
          edgeElasticity: () => 100,
          nestingFactor: 1.2,
          gravity: 1.5, // Keeps nodes clustered tightly
          numIter: 1000,
          initialTemp: 1000,
          coolingFactor: 0.99,
          minTemp: 1.0,
          padding: 40
        }
      case 'concentric':
        return {
          name: 'concentric',
          animate: false,
          padding: 40,
          minNodeSpacing: 40,
          concentric: node => node.degree(),
          levelWidth: () => 2
        }
      case 'dagre':
        return {
          name: 'dagre',
          rankDir: 'LR',
          padding: 40,
          nodeSep: 40,
          rankSep: 80
        }
      case 'circle':
        return {
          name: 'circle',
          animate: false,
          padding: 40
        }
      case 'grid':
        return {
          name: 'grid',
          animate: false,
          padding: 40
        }
      default:
        return { name: 'cose', animate: false, padding: 40 }
    }
  }

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes) return

    setLoading(true)

    // Build elements array for Cytoscape
    const elements = {
      nodes: graphData.nodes.map(n => {
        const d = n.data || n
        const nodeType = d.type || d.label || 'Unknown'
        const labelText = d.label || d.name || String(d.id)
        return {
          data: { 
            id: String(d.id), 
            label: labelText, 
            type: nodeType,
            color: d.color || getColor(nodeType),
            entity_id: d.entity_id || d.id,
            ...d 
          }
        }
      }),
      edges: graphData.edges.map(e => {
        const d = e.data || e
        return {
          data: { 
            id: String(d.id || `${d.source}-${d.target}`), 
            source: String(d.source), 
            target: String(d.target), 
            label: d.label || d.type || '' 
          }
        }
      })
    }

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: elements,
        style: [
          // Node styles - Prominent, readable pills with high contrast
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': 'data(color)',
              'color': '#ffffff',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '13px',
              'font-weight': '700',
              'font-family': 'Inter, system-ui, -apple-system, sans-serif',
              'border-width': 2,
              'border-color': '#ffffff',
              'shape': 'round-rectangle',
              'width': 'label',
              'height': 'label',
              'padding': '12px 18px',
              'min-width': '75px',
              'text-max-width': '160px',
              'text-wrap': 'ellipsis',
              'overlay-padding': '4px',
              'transition-property': 'background-color, border-color, width, height, opacity',
              'transition-duration': '0.2s'
            }
          },
          // Edge styles - Reduced thickness, subtle opacity, clean short lines
          {
            selector: 'edge',
            style: {
              'width': 1.2,
              'line-color': '#94a3b8',
              'line-opacity': 0.45,
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'arrow-scale': 0.8,
              'curve-style': 'bezier',
              'label': '', // Hide labels by default to prevent screen clutter
              'font-size': '10px',
              'color': '#334155',
              'text-background-opacity': 0.95,
              'text-background-color': '#ffffff',
              'text-background-padding': '3px',
              'text-background-shape': 'round-rectangle'
            }
          },
          // Selected & Hovered Node Styling
          {
            selector: 'node:selected, node.highlighted, node.hovered',
            style: {
              'border-color': '#1e293b',
              'border-width': 3.5,
              'shadow-blur': 12,
              'shadow-color': '#000000',
              'shadow-opacity': 0.3,
              'z-index': 999
            }
          },
          // Selected & Connected Edges Styling
          {
            selector: 'edge:selected, edge.highlighted',
            style: {
              'width': 2.5,
              'line-color': '#2563eb',
              'line-opacity': 0.95,
              'target-arrow-color': '#2563eb',
              'arrow-scale': 1.1,
              'label': 'data(label)',
              'z-index': 998
            }
          },
          // Dimmed elements when focusing on selection
          {
            selector: 'node.dimmed',
            style: {
              'opacity': 0.25
            }
          },
          {
            selector: 'edge.dimmed',
            style: {
              'opacity': 0.08
            }
          }
        ],
        layout: getLayoutConfig(currentLayout),
        wheelSensitivity: 0.2
      })

      // Click event
      cy.on('tap', 'node', (evt) => {
        const node = evt.target
        if (onNodeClick) {
          onNodeClick(node.data())
        }
      })

      // Hover events
      cy.on('mouseover', 'node', (evt) => {
        document.body.style.cursor = 'pointer'
        const node = evt.target
        node.addClass('hovered')
        node.connectedEdges().addClass('highlighted')
      })
      
      cy.on('mouseout', 'node', (evt) => {
        document.body.style.cursor = 'default'
        const node = evt.target
        node.removeClass('hovered')
        if (!selectedNodeId || String(selectedNodeId) !== String(node.id())) {
          node.connectedEdges().removeClass('highlighted')
        }
      })

      cyRef.current = cy
    } catch (err) {
      console.error('Cytoscape render error:', err)
    } finally {
      setLoading(false)
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [graphData, currentLayout])

  // Handle selected node highlighting
  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current

    cy.elements().removeClass('highlighted').removeClass('dimmed')
    cy.nodes().unselect()

    if (selectedNodeId) {
      const node = cy.getElementById(String(selectedNodeId))
      if (node && node.length > 0) {
        node.select()
        node.addClass('highlighted')
        
        const connectedEdges = node.connectedEdges()
        const connectedNodes = node.neighborhood().nodes()
        
        connectedEdges.addClass('highlighted')
        connectedNodes.addClass('highlighted')

        // Dim unrelated elements for clarity
        cy.elements().difference(node).difference(connectedEdges).difference(connectedNodes).addClass('dimmed')

        // Zoom fit to selected node neighborhood
        cy.animate({
          fit: { eles: node.union(connectedNodes), padding: 120 },
          duration: 400
        })
      }
    }
  }, [selectedNodeId])

  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25)
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() / 1.25)
  const handleFit = () => cyRef.current && cyRef.current.fit(cyRef.current.elements(), 40)
  const handleReLayout = (layoutName) => {
    setCurrentLayout(layoutName)
    if (cyRef.current) {
      cyRef.current.layout(getLayoutConfig(layoutName)).run()
    }
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <Network className="w-12 h-12 text-gray-400 mb-3 animate-bounce" />
        <h3 className="text-base font-semibold text-gray-700 mb-1">No Graph Nodes to Display</h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Try checking more Node Types in the left filter panel or clearing your search filter.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-50 border border-gray-200">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Updating Graph...</span>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full outline-none" />

      {/* Top Layout Selector Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-lg border border-gray-200 shadow-sm z-10 text-xs">
        <span className="text-gray-400 font-medium px-2 hidden sm:inline">Layout:</span>
        <button 
          onClick={() => handleReLayout('cose')} 
          className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${currentLayout === 'cose' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Force Directed (Compact Cluster)"
        >
          <Network className="w-3.5 h-3.5" /> Force
        </button>
        <button 
          onClick={() => handleReLayout('concentric')} 
          className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${currentLayout === 'concentric' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Concentric Circles"
        >
          <Layers className="w-3.5 h-3.5" /> Concentric
        </button>
        <button 
          onClick={() => handleReLayout('dagre')} 
          className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${currentLayout === 'dagre' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Hierarchical Tree"
        >
          <GitFork className="w-3.5 h-3.5" /> Tree
        </button>
        <button 
          onClick={() => handleReLayout('circle')} 
          className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${currentLayout === 'circle' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Circle"
        >
          <Circle className="w-3.5 h-3.5" /> Circle
        </button>
      </div>

      {/* Bottom Right Zoom & Control Buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        <button 
          onClick={handleZoomIn} 
          className="p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-700 shadow-sm transition-all hover:scale-105" 
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-700 shadow-sm transition-all hover:scale-105" 
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={handleFit} 
          className="p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-700 shadow-sm transition-all hover:scale-105" 
          title="Fit to Container"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleReLayout(currentLayout)} 
          className="p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-700 shadow-sm transition-all hover:scale-105" 
          title="Re-run Layout Physics"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

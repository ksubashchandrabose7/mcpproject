export default function EntityBadge({ type, name }) {
  const getColorClasses = (type) => {
    const t = (type || '').toLowerCase()
    if (t.includes('equip')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    if (t.includes('component')) return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    if (t.includes('fault') || t.includes('error')) return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (t.includes('mainten') || t.includes('action')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    if (t.includes('sensor')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    if (t.includes('person') || t.includes('role')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (t.includes('locat')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    if (t.includes('process')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (t.includes('spare') || t.includes('part')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (t.includes('safety')) return 'bg-pink-500/10 text-pink-400 border-pink-500/20'
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20' // Unknown/Default
  }

  const getDotColor = (type) => {
    const t = (type || '').toLowerCase()
    if (t.includes('equip')) return 'bg-orange-400'
    if (t.includes('component')) return 'bg-teal-400'
    if (t.includes('fault')) return 'bg-red-400'
    if (t.includes('mainten')) return 'bg-purple-400'
    if (t.includes('sensor')) return 'bg-yellow-400'
    if (t.includes('person')) return 'bg-emerald-400'
    if (t.includes('locat')) return 'bg-indigo-400'
    if (t.includes('process')) return 'bg-blue-400'
    if (t.includes('spare')) return 'bg-amber-400'
    if (t.includes('safety')) return 'bg-pink-400'
    return 'bg-gray-400'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColorClasses(type)}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor(type)}`}></span>
      {name ? (
        <span>
          <span className="opacity-70 mr-1">{type}:</span>
          {name}
        </span>
      ) : (
        type
      )}
    </span>
  )
}

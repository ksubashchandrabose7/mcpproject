export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px', padding: '24px'
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '4px solid #3b82f6', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</span>
    </div>
  )
}

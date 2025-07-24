// components/parent/dna-lab/LoadingSpinner.js
import { luxTheme } from '../../../utils/theme'

export default function LoadingSpinner() {
  return (
    <div style={{
      backgroundColor: luxTheme.background,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${luxTheme.primary}30`,
          borderTop: `3px solid ${luxTheme.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: luxTheme.textPrimary }}>Loading Family DNA Lab...</p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
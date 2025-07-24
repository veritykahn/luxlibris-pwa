// components/parent/dna-lab/ErrorDisplay.js
import { luxTheme } from '../../../utils/theme'

export default function ErrorDisplay({ error }) {
  return (
    <div style={{
      backgroundColor: luxTheme.background,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
        <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
        <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: luxTheme.primary,
            color: luxTheme.textPrimary,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
// components/parent/dna-lab/modals/ResearchModal.js
import { luxTheme } from '../../../../utils/theme'

export default function ResearchModal({ dnaType, onClose }) {
  if (!dnaType) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '90vw',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: luxTheme.textPrimary, fontSize: '20px' }}>🔬 Research Inspiration</h3>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: luxTheme.textSecondary,
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '16px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px', color: dnaType.color }}>{dnaType.emoji}</span>
            {dnaType.name}
          </h4>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            Research Theory:
          </h4>
          <div style={{
            backgroundColor: `${dnaType.color}15`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: luxTheme.textSecondary,
            lineHeight: '1.4'
          }}>
            <strong>{dnaType.keyResearch?.theory}</strong>
            <br />
            {dnaType.keyResearch?.principle}
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            Research Application:
          </h4>
          <p style={{ 
            fontSize: '13px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.4',
            backgroundColor: `${luxTheme.primary}10`,
            padding: '12px',
            borderRadius: '8px'
          }}>
            {dnaType.keyResearch?.application}
          </p>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            Research Evidence:
          </h4>
          <p style={{ 
            fontSize: '12px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.3',
            fontStyle: 'italic',
            backgroundColor: `${luxTheme.secondary}15`,
            padding: '10px',
            borderRadius: '6px'
          }}>
            {dnaType.keyResearch?.evidence}
          </p>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            How This Supports Your Children:
          </h4>
          <ul style={{
            fontSize: '13px',
            color: luxTheme.textSecondary,
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.4'
          }}>
            {dnaType.approaches?.map((approach, index) => (
              <li key={index} style={{ marginBottom: '6px' }}>{approach}</li>
            ))}
          </ul>
        </div>

        <div style={{
          backgroundColor: `${luxTheme.primary}15`,
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '11px', 
            color: luxTheme.textSecondary,
            margin: '0 0 6px 0',
            lineHeight: '1.3'
          }}>
            <strong>Research Context:</strong> This tool draws inspiration from established educational psychology research 
            but is designed for family insight and conversation - not diagnosis or clinical assessment.
          </p>
          <p style={{ 
            fontSize: '10px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.3',
            fontStyle: 'italic'
          }}>
            Trust your parent instincts above all - you know your family best! 💚
          </p>
        </div>
      </div>
    </div>
  )
}
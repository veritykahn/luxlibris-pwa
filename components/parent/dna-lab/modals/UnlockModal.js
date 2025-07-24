// components/parent/dna-lab/modals/UnlockModal.js
import { luxTheme } from '../../../../utils/theme'

export default function UnlockModal({ child, onUnlock, onClose }) {
  if (!child) return null

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
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔓</div>
          <h3 style={{ margin: '0 0 12px 0', color: luxTheme.textPrimary, fontSize: '20px' }}>
            Unlock Reading DNA Assessment
          </h3>
          <p style={{ 
            fontSize: '16px', 
            color: luxTheme.textSecondary,
            margin: '0 0 20px 0',
            lineHeight: '1.5'
          }}>
            Let {child.firstName} discover their unique reading personality and learning style!
          </p>
        </div>
        
        <div style={{
          backgroundColor: `${luxTheme.primary}15`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            🧬 What {child.firstName} will discover:
          </h4>
          <ul style={{
            fontSize: '13px',
            color: luxTheme.textSecondary,
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.4'
          }}>
            <li>Their unique reading motivation style</li>
            <li>Personalized book recommendations</li>
            <li>Reading strategies that work for them</li>
            <li>How they learn and grow best</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: `${luxTheme.secondary}15`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            💡 What you&apos;ll get:
          </h4>
          <ul style={{
            fontSize: '13px',
            color: luxTheme.textSecondary,
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.4'
          }}>
            <li>Specific strategies to support their reading</li>
            <li>Understanding of their learning preferences</li>
            <li>Family compatibility insights</li>
            <li>Helpful phrases and book recommendations</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onUnlock}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔓 Unlock Assessment
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: luxTheme.textSecondary,
              border: `2px solid ${luxTheme.textSecondary}40`,
              borderRadius: '12px',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
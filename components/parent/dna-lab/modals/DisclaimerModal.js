// components/parent/dna-lab/modals/DisclaimerModal.js
import { luxTheme } from '../../../../utils/theme'

export default function DisclaimerModal({ onClose }) {
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
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: luxTheme.textPrimary, fontSize: '18px' }}>⚠️ Important Information</h3>
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
        
        {/* Not Diagnostic */}
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '2px solid #FECACA',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: '#DC2626', fontSize: '14px', margin: '0 0 8px 0' }}>
            🏥 Not a Diagnostic Tool
          </h4>
          <p style={{ 
            fontSize: '13px', 
            color: '#7F1D1D',
            margin: 0,
            lineHeight: '1.4'
          }}>
            This assessment is <strong>not a medical, psychological, or educational diagnostic tool</strong>. 
            It does not diagnose learning disabilities, reading disorders, or any medical conditions. 
            For professional assessment, consult qualified educational or healthcare professionals.
          </p>
        </div>

        {/* For Insight Only */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            💡 Educational Insight Only
          </h4>
          <p style={{ 
            fontSize: '13px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.4'
          }}>
            This tool provides general insights about reading preferences and motivation styles. 
            Results are meant to spark conversation and offer gentle guidance - not replace professional judgment 
            or override your knowledge of your child&apos;s needs.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            🔬 Research-Inspired, Not Validated
          </h4>
          <p style={{ 
            fontSize: '13px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.4'
          }}>
            While inspired by established educational psychology research (like Self-Determination Theory), 
            this specific assessment and its categories have not undergone rigorous scientific validation. 
            Consider it a fun, thoughtful starting point for family reflection.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            👨‍👩‍👧‍👦 Trust Your Parent Instincts
          </h4>
          <p style={{ 
            fontSize: '13px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.4'
          }}>
            You know your children best. If any suggestions don&apos;t feel right for your family, 
            trust your instincts. Every child is unique, and what works varies greatly from family to family.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
            📚 Supplemental, Not Prescriptive
          </h4>
          <p style={{ 
            fontSize: '13px', 
            color: luxTheme.textSecondary,
            margin: 0,
            lineHeight: '1.4'
          }}>
            These insights supplement - never replace - professional educational guidance, 
            teacher recommendations, or clinical assessments. Use this as one perspective among many 
            when supporting your child&apos;s reading development.
          </p>
        </div>

        {/* Positive Note */}
        <div style={{
          backgroundColor: `${luxTheme.primary}15`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            color: luxTheme.textPrimary,
            margin: '0 0 8px 0',
            fontWeight: '600'
          }}>
            🌟 Our Goal
          </h4>
          <p style={{ 
            fontSize: '12px', 
            color: luxTheme.textPrimary,
            margin: 0,
            lineHeight: '1.4'
          }}>
            To spark joy, understanding, and meaningful conversations about reading in your family. 
            Every insight is offered with care, respect for your family&apos;s uniqueness, and hope for 
            wonderful reading adventures together! 📖✨
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✅ I Understand
          </button>
        </div>
      </div>
    </div>
  )
}
// components/parent/dna-lab/ParentAssessmentCard.js
import { luxTheme } from '../../../utils/theme'

export default function ParentAssessmentCard({ linkedStudentCount, onStartAssessment }) {
  return (
    <div style={{
      backgroundColor: luxTheme.surface,
      borderRadius: '20px',
      padding: '32px',
      textAlign: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      border: `2px solid ${luxTheme.primary}30`
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔬</div>
      
      <h3 style={{
        fontSize: '22px',
        fontWeight: 'bold',
        color: luxTheme.textPrimary,
        marginBottom: '12px'
      }}>
        Take Your Parent Reading Assessment
      </h3>
      
      <p style={{
        fontSize: '16px',
        color: luxTheme.textSecondary,
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        Discover your parenting reading style and get personalized guidance for supporting each of your {linkedStudentCount} children.
      </p>

      {/* Assessment Disclaimer */}
      <div style={{
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '20px',
        textAlign: 'left'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#7F1D1D',
          lineHeight: '1.4',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px'
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong>Important:</strong> This is an insight tool for family reflection, not a diagnostic assessment. 
            Results provide general guidance and conversation starters about reading preferences.
          </div>
        </div>
      </div>

      <button
        onClick={onStartAssessment}
        style={{
          backgroundColor: luxTheme.primary,
          color: luxTheme.textPrimary,
          border: 'none',
          borderRadius: '16px',
          padding: '16px 32px',
          fontSize: '18px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        🧬 Start Assessment
      </button>

      <p style={{
        fontSize: '12px',
        color: luxTheme.textSecondary,
        marginTop: '16px',
        lineHeight: '1.4'
      }}>
        Takes about 4 minutes • 12 thoughtful questions
      </p>
    </div>
  )
}
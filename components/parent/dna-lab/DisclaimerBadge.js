// components/parent/dna-lab/DisclaimerBadge.js
import { useState } from 'react'
import { luxTheme } from '../../../utils/theme'
import DisclaimerModal from './modals/DisclaimerModal'

export default function DisclaimerBadge() {
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)

  return (
    <>
      {/* Compact Header */}
      <div style={{
        background: `linear-gradient(135deg, ${luxTheme.secondary}, ${luxTheme.primary})`,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: `0 6px 20px ${luxTheme.primary}30`,
        color: luxTheme.textPrimary,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧬</div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Didot, serif',
          margin: '0 0 8px 0'
        }}>
          Family Reading DNA Lab
        </h2>
        <p style={{
          fontSize: '14px',
          margin: '0',
          opacity: 0.9,
          lineHeight: '1.4'
        }}>
          Smart insights for supporting each child&apos;s unique reading journey
        </p>
      </div>

      {/* Enhanced Disclaimer Badge */}
      <div style={{
        backgroundColor: `${luxTheme.primary}15`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        border: `1px solid ${luxTheme.primary}40`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔬</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: luxTheme.textPrimary }}>
            Research-Inspired Insight Tool
          </span>
          <button
            onClick={() => setShowDisclaimerModal(true)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: luxTheme.primary,
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: 'auto'
            }}
          >
            Important Info
          </button>
        </div>
        <p style={{ fontSize: '11px', color: luxTheme.textSecondary, margin: '0 0 8px 0', lineHeight: '1.4' }}>
          Based on Self-Determination Theory and reading motivation research. This tool provides personalized insights to help support your family&apos;s reading journey.
        </p>
        <div style={{
          backgroundColor: `${luxTheme.secondary}20`,
          borderRadius: '8px',
          padding: '8px',
          fontSize: '10px',
          color: luxTheme.textSecondary,
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          <strong>Note:</strong> This is not a diagnostic tool. Results are for educational insight and family guidance only.
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimerModal && (
        <DisclaimerModal onClose={() => setShowDisclaimerModal(false)} />
      )}
    </>
  )
}
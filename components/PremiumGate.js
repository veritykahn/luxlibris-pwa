// components/PremiumGate.js - Gate component for premium features
import { useState } from 'react'
import { usePremiumFeatures } from '../hooks/usePremiumFeatures'

export default function PremiumGate({ 
  feature, 
  children, 
  fallback = null, 
  showUpgradeButton = true,
  customMessage = null 
}) {
  const { hasFeature, requiresPremium, getPremiumMessage, getUpgradeInfo, isPilotPhase } = usePremiumFeatures()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // If user has access, render children
  if (hasFeature(feature)) {
    return (
      <div style={{ position: 'relative' }}>
        {children}
        
        {/* Pilot Badge for Premium Features */}
        {isPilotPhase && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '600',
            zIndex: 100,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            PILOT FREE
          </div>
        )}
      </div>
    )
  }

  // If fallback provided, show it instead of upgrade prompt
  if (fallback) {
    return fallback
  }

  // Show upgrade prompt
  const upgradeInfo = getUpgradeInfo()
  const message = customMessage || getPremiumMessage(feature)

  return (
    <div style={{
      backgroundColor: '#F3F4F6',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
      border: '2px dashed #D1D5DB',
      position: 'relative'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {isPilotPhase ? '🎉' : '✨'}
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 8px 0'
      }}>
        {upgradeInfo.title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        margin: '0 0 16px 0',
        lineHeight: '1.5'
      }}>
        {message}
      </p>

      {!isPilotPhase && upgradeInfo.price && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #DBEAFE',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          display: 'inline-block'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1D4ED8'
          }}>
            {upgradeInfo.price}
          </span>
        </div>
      )}

      {showUpgradeButton && !isPilotPhase && (
        <button
          onClick={() => setShowUpgradeModal(true)}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Upgrade to Premium
        </button>
      )}

      {isPilotPhase && (
        <div style={{
          backgroundColor: '#10B981',
          color: 'white',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-block'
        }}>
          🚀 Free during pilot program
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  )
}

// Simple upgrade modal component
function UpgradeModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✨</div>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1F2937',
          margin: '0 0 16px 0'
        }}>
          Premium Features
        </h2>
        
        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
            ✅ Personal reading habit tracking
          </div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
            ✅ Family reading competitions
          </div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
            ✅ Advanced progress analytics
          </div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
            ✅ Custom family reading goals
          </div>
        </div>

        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #DBEAFE',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1D4ED8',
            marginBottom: '4px'
          }}>
            $10.00/year
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Less than $1 per month
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              // TODO: Implement upgrade flow
              alert('Upgrade flow coming soon!')
              onClose()
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}
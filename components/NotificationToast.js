// components/NotificationToast.js - Toast notifications for unlock requests
import React from 'react'
import { useRouter } from 'next/router'

const NotificationToast = ({ 
  toast, 
  onClose, 
  onNavigate = null,
  theme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE', 
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }
}) => {
  const router = useRouter()

  const handleClick = () => {
    // Mark as seen and navigate to child progress
    onClose(toast.id)
    
    if (onNavigate) {
      onNavigate()
    } else {
      router.push('/parent/child-progress')
    }
  }

  const getToastIcon = () => {
    switch (toast.type) {
      case 'leaderboard':
        return '🏆'
      case 'quiz':
        return '📝'
      default:
        return '🔓'
    }
  }

  const getToastColor = () => {
    switch (toast.type) {
      case 'leaderboard':
        return '#F59E0B'
      case 'quiz':
        return '#2196F3'
      default:
        return theme.primary
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        backgroundColor: theme.surface,
        borderRadius: '12px',
        padding: '16px',
        margin: '8px 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        border: `2px solid ${getToastColor()}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        maxWidth: '350px',
        minWidth: '300px',
        transform: 'translateX(0)',
        animation: 'slideInRight 0.3s ease-out'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
      }}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(toast.id)
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          cursor: 'pointer',
          color: theme.textSecondary,
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        ✕
      </button>

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: `${getToastColor()}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0
        }}>
          {getToastIcon()}
        </div>

        {/* Message */}
        <div style={{ flex: 1, paddingRight: '20px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '4px',
            lineHeight: '1.3'
          }}>
            New Unlock Request
          </div>
          
          <div style={{
            fontSize: '13px',
            color: theme.textSecondary,
            lineHeight: '1.4',
            marginBottom: '8px'
          }}>
            {toast.message}
          </div>

          {/* Action hint */}
          <div style={{
            fontSize: '11px',
            color: getToastColor(),
            fontWeight: '600',
            opacity: 0.8
          }}>
            Click to review & approve →
          </div>
        </div>
      </div>

      {/* Progress bar (auto-dismiss) */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '3px',
        backgroundColor: `${getToastColor()}20`,
        borderRadius: '0 0 10px 10px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: getToastColor(),
          width: '100%',
          animation: 'progressShrink 5s linear forwards'
        }} />
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progressShrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

// Toast Container Component
export const NotificationToastContainer = ({ 
  toasts, 
  onRemoveToast, 
  onNavigateToUnlocks,
  theme 
}) => {
  if (!toasts || toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div style={{ pointerEvents: 'auto' }}>
        {toasts.map(toast => (
          <NotificationToast
            key={toast.id}
            toast={toast}
            onClose={onRemoveToast}
            onNavigate={onNavigateToUnlocks}
            theme={theme}
          />
        ))}
      </div>
    </div>
  )
}

export default NotificationToast
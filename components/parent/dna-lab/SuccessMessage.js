// components/parent/dna-lab/SuccessMessage.js
import { useEffect } from 'react'
import { luxTheme } from '../../../utils/theme'

export default function SuccessMessage({ message, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000) // Auto-close after 4 seconds
      
      return () => clearTimeout(timer)
    }
  }, [message, onClose])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: luxTheme.primary,
      color: luxTheme.textPrimary,
      padding: '12px 24px',
      borderRadius: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 1001,
      fontSize: 'clamp(12px, 3.5vw, 14px)',
      fontWeight: '600',
      maxWidth: '90vw',
      textAlign: 'center',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {message}
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
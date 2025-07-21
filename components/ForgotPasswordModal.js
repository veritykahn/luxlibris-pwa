// components/ForgotPasswordModal.js - Simple Password Reset Modal

import { useState } from 'react'
import { parentPasswordReset, teacherPasswordReset } from '../lib/accountRecovery'

export function ForgotPasswordModal({ accountType, email, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const handleForgotPassword = async () => {
    if (!email?.trim()) {
      setMessage('Please enter your email address first')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      let result
      if (accountType === 'parent') {
        result = await parentPasswordReset.sendResetEmail(email)
      } else if (accountType === 'teacher' || accountType === 'educator') {
        result = await teacherPasswordReset.sendResetEmail(email)
      }
      
      if (result.success) {
        setMessage('Password reset email sent! Check your inbox.')
        if (onSuccess) onSuccess()
      } else {
        setMessage(result.error)
      }
    } catch (error) {
      setMessage('Failed to send reset email. Please try again.')
    }
    
    setLoading(false)
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ 
          marginBottom: '1rem',
          color: '#223848',
          fontSize: '1.25rem'
        }}>
          Reset Password
        </h3>
        
        <p style={{ 
          marginBottom: '1.5rem', 
          color: '#6b7280',
          lineHeight: '1.4' 
        }}>
          We'll send a password reset link to <strong>{email}</strong>
        </p>
        
        {message && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            backgroundColor: message.includes('sent') ? '#f0fdf4' : '#fef2f2',
            color: message.includes('sent') ? '#166534' : '#dc2626',
            fontSize: '0.875rem'
          }}>
            {message}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleForgotPassword}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#ADD4EA',
              color: '#223848',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

console.log('✅ Forgot Password Modal component loaded')
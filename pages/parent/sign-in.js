// pages/parent/sign-in.js - Updated with Lux Libris styling and mobile optimization
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'

export default function ParentSignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // UPDATED: Lux Libris Classic Theme (same as student dashboard)
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // Handle URL parameters if coming from account creation
  useEffect(() => {
    const { email, newAccount } = router.query
    if (email) {
      setFormData(prev => ({
        ...prev,
        email: email
      }))
    }
  }, [router.query])

  const handleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Please enter your email and password')
        setLoading(false)
        return
      }

      console.log('🔐 Starting parent sign-in process...')
      console.log('📧 Email:', formData.email)

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      )
      
      console.log('✅ Firebase sign-in successful:', userCredential.user.uid)
      
      // Let AuthContext handle the rest - just redirect to dashboard
      router.push('/parent/dashboard')

    } catch (error) {
      console.error('❌ Sign-in error:', error)
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address. Please check your email or create a new account.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.')
          break
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a moment and try again.')
          break
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.')
          break
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please check your credentials and try again.')
          break
        default:
          setError('Failed to sign in. Please try again or contact support.')
      }
    }

    setLoading(false)
  }

  const handleBack = () => {
    router.push('/role-selector')
  }

  const handleCreateAccount = () => {
    router.push('/parent/account-creation')
  }

  const handleForgotPassword = () => {
    // TODO: Implement password reset
    setError('Password reset feature coming soon! Please contact support at families@luxlibris.org')
  }

  return (
    <>
      <Head>
        <title>Parent Sign In - Lux Libris</title>
        <meta name="description" content="Parent sign in to access your family dashboard" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${luxTheme.background} 0%, ${luxTheme.primary} 30%, ${luxTheme.secondary} 100%)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '28rem',
          width: '100%',
          background: luxTheme.surface,
          borderRadius: '1.5rem',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.75rem'
            }}>
              👨‍👩‍👧‍👦
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: luxTheme.textPrimary,
              margin: '0 0 0.5rem 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Parent Sign In
            </h1>
            <p style={{
              color: luxTheme.textSecondary,
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Welcome back! Sign in to access your family dashboard
            </p>
          </div>

          {/* Sign In Form */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                fontWeight: '600',
                color: luxTheme.textSecondary,
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  email: e.target.value 
                }))}
                placeholder="parent@example.com"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: `2px solid ${luxTheme.primary}40`,
                  borderRadius: '0.75rem',
                  fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  color: luxTheme.textPrimary,
                  backgroundColor: luxTheme.surface,
                  minHeight: '48px'
                }}
                onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                fontWeight: '600',
                color: luxTheme.textSecondary,
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  password: e.target.value 
                }))}
                placeholder="Your password"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: `2px solid ${luxTheme.primary}40`,
                  borderRadius: '0.75rem',
                  fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  color: luxTheme.textPrimary,
                  backgroundColor: luxTheme.surface,
                  minHeight: '48px'
                }}
                onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && formData.email.trim() && formData.password.trim()) {
                    handleSignIn()
                  }
                }}
              />
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <button
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: luxTheme.primary,
                  fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  touchAction: 'manipulation'
                }}
              >
                Forgot password?
              </button>
            </div>

            <div style={{
              background: `rgba(173, 212, 234, 0.1)`,
              border: `1px solid rgba(173, 212, 234, 0.3)`,
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                color: luxTheme.textPrimary,
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                margin: 0,
                lineHeight: '1.4'
              }}>
                ⌂ <strong>Family Dashboard:</strong> Track your children&apos;s reading progress, approve quiz codes, and participate in family reading battles!
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                color: '#dc2626',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleBack}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.875rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                minHeight: '48px',
                minWidth: '100px',
                touchAction: 'manipulation'
              }}
            >
              Back
            </button>
            
            <button
              onClick={handleSignIn}
              disabled={
                loading || 
                !formData.email.trim() || 
                !formData.password.trim()
              }
              style={{
                flex: 2,
                padding: '0.875rem 1.5rem',
                background: loading 
                  ? '#d1d5db' 
                  : `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                color: luxTheme.textPrimary,
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                fontWeight: '600',
                cursor: (
                  loading || 
                  !formData.email.trim() || 
                  !formData.password.trim()
                ) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '48px',
                minWidth: '120px',
                opacity: (
                  loading || 
                  !formData.email.trim() || 
                  !formData.password.trim()
                ) ? 0.7 : 1,
                touchAction: 'manipulation'
              }}
            >
              {loading && (
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: `2px solid ${luxTheme.textPrimary}`,
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              )}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          {/* Help Text */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${luxTheme.primary}20`
          }}>
            <p style={{
              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
              color: luxTheme.textSecondary,
              margin: '0 0 0.5rem 0',
              lineHeight: '1.4'
            }}>
              Need help? Contact us at families@luxlibris.org
            </p>
            <button
              onClick={handleCreateAccount}
              style={{
                background: 'none',
                border: 'none',
                color: luxTheme.primary,
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: '600',
                touchAction: 'manipulation'
              }}
            >
              Don&apos;t have an account? Create one here
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        button {
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          touch-action: manipulation;
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        @media (max-width: 768px) {
          input {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </>
  )
}
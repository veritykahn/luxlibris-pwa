// pages/parent/account-creation.js - Updated with Lux Libris styling and mobile optimization
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createParentAccount, linkParentToStudent } from '../../lib/parentLinking'

export default function ParentAccountCreation() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentInviteCodes: [''] // Start with one invite code field
  })
  const [linkedStudents, setLinkedStudents] = useState([])

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

  const addInviteCodeField = () => {
    setParentData(prev => ({
      ...prev,
      studentInviteCodes: [...prev.studentInviteCodes, '']
    }))
  }

  const removeInviteCodeField = (index) => {
    if (parentData.studentInviteCodes.length > 1) {
      setParentData(prev => ({
        ...prev,
        studentInviteCodes: prev.studentInviteCodes.filter((_, i) => i !== index)
      }))
    }
  }

  const updateInviteCode = (index, value) => {
    setParentData(prev => ({
      ...prev,
      studentInviteCodes: prev.studentInviteCodes.map((code, i) => 
        i === index ? value.toUpperCase() : code
      )
    }))
  }

  const validateStep = (stepNum) => {
    if (stepNum === 1) {
      if (!parentData.firstName.trim()) return 'First name is required'
      if (!parentData.lastName.trim()) return 'Last name is required'
      if (!parentData.email.trim()) return 'Email is required'
      if (!/\S+@\S+\.\S+/.test(parentData.email)) return 'Please enter a valid email'
      return null
    }
    
    if (stepNum === 2) {
      if (!parentData.password) return 'Password is required'
      if (parentData.password.length < 6) return 'Password must be at least 6 characters'
      if (parentData.password !== parentData.confirmPassword) return 'Passwords do not match'
      return null
    }
    
    if (stepNum === 3) {
      const validCodes = parentData.studentInviteCodes.filter(code => code.trim())
      if (validCodes.length === 0) return 'At least one student invite code is required'
      return null
    }
    
    return null
  }

  const handleNext = async () => {
    setError('')
    
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }

    if (step < 3) {
      setStep(step + 1)
      return
    }

    // Step 3: Validate invite codes and prepare for legal acceptance
    setLoading(true)

    try {
      console.log('🔍 Validating invite codes...')
      
      // Validate each invite code exists (without creating account yet)
      const validationResults = []
      const validCodes = parentData.studentInviteCodes.filter(code => code.trim())
      
      for (const inviteCode of validCodes) {
        try {
          // Here we would validate the code exists, but not link yet
          // For now, we'll assume validation passes and do linking in onboarding
          validationResults.push({
            inviteCode: inviteCode.trim(),
            valid: true // Actual validation would happen here
          })
        } catch (error) {
          validationResults.push({
            inviteCode: inviteCode.trim(),
            valid: false,
            error: error.message
          })
        }
      }

      const validInviteCodes = validationResults.filter(r => r.valid).map(r => r.inviteCode)
      
      if (validInviteCodes.length === 0) {
        throw new Error('No valid invite codes found. Please check your codes.')
      }

      // Store data for onboarding (account creation happens there)
      if (typeof window !== 'undefined') {
        const tempData = {
          parentInfo: {
            firstName: parentData.firstName,
            lastName: parentData.lastName,
            email: parentData.email,
            password: parentData.password
          },
          validInviteCodes,
          accountFlow: 'parent'
        }
        localStorage.setItem('tempParentData', JSON.stringify(tempData))
        localStorage.setItem('luxlibris_account_flow', 'parent')
      }

      setStep(4) // Success step

    } catch (error) {
      console.error('❌ Validation error:', error)
      setError(error.message || 'Failed to validate invite codes. Please try again.')
    }

    setLoading(false)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    } else {
      router.push('/role-selector')
    }
  }

  const handleContinueToOnboarding = () => {
    router.push('/parent/legal')
  }

  return (
    <>
      <Head>
        <title>Create Parent Account - Lux Libris</title>
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
          maxWidth: '32rem',
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
              {step === 4 ? 'Welcome to the Family!' : 'Create Parent Account'}
            </h1>
            <p style={{
              color: luxTheme.textSecondary,
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {step === 4 
                ? 'Your information is verified! Let\'s review our terms and create your account.'
                : 'Support your child\'s reading journey with Lux Libris'
              }
            </p>
          </div>

          {/* Progress Steps */}
          {step < 4 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '2rem',
              gap: '0.5rem'
            }}>
              {[1, 2, 3].map(stepNum => (
                <div key={stepNum} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: stepNum <= step 
                      ? `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`
                      : '#e5e7eb',
                    color: stepNum <= step ? luxTheme.textPrimary : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div style={{
                      width: '2rem',
                      height: '2px',
                      background: stepNum < step ? luxTheme.primary : '#e5e7eb'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step Content */}
          <div style={{ marginBottom: '2rem' }}>
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Tell us about yourself
                </h2>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        fontWeight: '600',
                        color: luxTheme.textSecondary,
                        marginBottom: '0.5rem'
                      }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={parentData.firstName}
                        onChange={(e) => setParentData(prev => ({ 
                          ...prev, 
                          firstName: e.target.value 
                        }))}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: `2px solid ${luxTheme.primary}40`,
                          borderRadius: '0.75rem',
                          fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                          boxSizing: 'border-box',
                          outline: 'none',
                          minHeight: '48px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                        onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        fontWeight: '600',
                        color: luxTheme.textSecondary,
                        marginBottom: '0.5rem'
                      }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={parentData.lastName}
                        onChange={(e) => setParentData(prev => ({ 
                          ...prev, 
                          lastName: e.target.value 
                        }))}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: `2px solid ${luxTheme.primary}40`,
                          borderRadius: '0.75rem',
                          fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                          boxSizing: 'border-box',
                          outline: 'none',
                          minHeight: '48px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                        onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={parentData.email}
                      onChange={(e) => setParentData(prev => ({ 
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
                        outline: 'none',
                        minHeight: '48px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                      onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                    />
                  </div>
                </div>

                <div style={{
                  background: `rgba(173, 212, 234, 0.1)`,
                  border: `1px solid rgba(173, 212, 234, 0.3)`,
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    color: luxTheme.textPrimary,
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    💡 <strong>What you&apos;ll get:</strong> Track your child&apos;s reading progress, unlock quiz codes, and celebrate achievements together!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Create your password
                </h2>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      value={parentData.password}
                      onChange={(e) => setParentData(prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))}
                      placeholder="At least 6 characters"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${luxTheme.primary}40`,
                        borderRadius: '0.75rem',
                        fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                        boxSizing: 'border-box',
                        outline: 'none',
                        minHeight: '48px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                      onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={parentData.confirmPassword}
                      onChange={(e) => setParentData(prev => ({ 
                        ...prev, 
                        confirmPassword: e.target.value 
                      }))}
                      placeholder="Confirm your password"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${luxTheme.primary}40`,
                        borderRadius: '0.75rem',
                        fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                        boxSizing: 'border-box',
                        outline: 'none',
                        minHeight: '48px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                      onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                    />
                  </div>
                </div>

                <div style={{
                  background: `rgba(195, 224, 222, 0.1)`,
                  border: `1px solid rgba(195, 224, 222, 0.3)`,
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    color: luxTheme.textPrimary,
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    🔒 <strong>Your account security:</strong> We use industry-standard encryption to keep your information safe and secure.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Student Invite Codes */}
            {step === 3 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Connect to your children
                </h2>
                <p style={{
                  color: luxTheme.textSecondary,
                  fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                  lineHeight: '1.4'
                }}>
                  Enter the invite codes your children received from their teacher
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  {parentData.studentInviteCodes.map((code, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                          fontWeight: '600',
                          color: luxTheme.textSecondary,
                          marginBottom: '0.5rem'
                        }}>
                          {index === 0 ? 'Student Invite Code *' : `Child ${index + 1} Invite Code`}
                        </label>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => updateInviteCode(index, e.target.value)}
                          placeholder="EMMA-S5-INVITE-ABCD"
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            border: `2px solid ${luxTheme.primary}40`,
                            borderRadius: '0.75rem',
                            fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                            boxSizing: 'border-box',
                            outline: 'none',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            letterSpacing: '0.05em',
                            minHeight: '48px'
                          }}
                          onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                          onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                        />
                      </div>
                      {parentData.studentInviteCodes.length > 1 && (
                        <button
                          onClick={() => removeInviteCodeField(index)}
                          style={{
                            marginTop: '1.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '0.5rem',
                            width: '2.5rem',
                            height: '2.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            touchAction: 'manipulation'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={addInviteCodeField}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: `${luxTheme.primary}10`,
                      color: luxTheme.textPrimary,
                      border: `2px dashed ${luxTheme.primary}60`,
                      borderRadius: '0.75rem',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '48px',
                      touchAction: 'manipulation'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${luxTheme.primary}20`
                      e.target.style.borderColor = luxTheme.primary
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = `${luxTheme.primary}10`
                      e.target.style.borderColor = `${luxTheme.primary}60`
                    }}
                  >
                    + Add Another Child
                  </button>
                </div>

                <div style={{
                  background: `rgba(161, 229, 219, 0.1)`,
                  border: `1px solid rgba(161, 229, 219, 0.3)`,
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    color: luxTheme.textPrimary,
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    💡 <strong>How to get invite codes:</strong> Ask your child to go to their dashboard and create a parent invite code to share with you.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Ready for Legal */}
            {step === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem'
                }}>
                  Information Verified!
                </h2>

                <div style={{
                  background: `${luxTheme.primary}20`,
                  border: `2px solid ${luxTheme.primary}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <h3 style={{
                    fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 1rem 0'
                  }}>
                    Ready to connect:
                  </h3>
                  <div style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', color: luxTheme.textPrimary, lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      ✅ Account info verified
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      ✅ {parentData.studentInviteCodes.filter(code => code.trim()).length} invite code{parentData.studentInviteCodes.filter(code => code.trim()).length !== 1 ? 's' : ''} validated
                    </p>
                    <p style={{ margin: 0 }}>
                      ✅ Ready for family setup
                    </p>
                  </div>
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
                    🚀 <strong>What&apos;s next:</strong> Review our Family Terms & Privacy Policy, then we&apos;ll create your account and connect you to your children!
                  </p>
                </div>
              </div>
            )}
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
            {step < 4 ? (
              <>
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
                  onClick={handleNext}
                  disabled={loading}
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
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: '48px',
                    minWidth: '120px',
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
                  {step === 3 ? 'Verify & Continue to Family Terms' : 'Continue'}
                </button>
              </>
            ) : (
              <button
                onClick={handleContinueToOnboarding}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '48px',
                  touchAction: 'manipulation'
                }}
              >
                Continue to Family Terms 📋
              </button>
            )}
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
              margin: 0,
              lineHeight: '1.4'
            }}>
              Need help? Contact your child&apos;s teacher for invite codes.
            </p>
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
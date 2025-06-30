import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { authHelpers, dbHelpers } from '../lib/firebase'

export default function StudentAccountCreation() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastInitial: '',
    schoolJoinCode: ''
  })
  const [schoolData, setSchoolData] = useState(null)

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      if (step === 1) {
        // Validate basic info
        if (!studentData.firstName.trim()) {
          setError('Please enter your first name')
          setLoading(false)
          return
        }
        if (!studentData.lastInitial.trim()) {
          setError('Please enter your last initial')
          setLoading(false)
          return
        }
        setStep(2)
      } else if (step === 2) {
        // Verify school join code
        if (!studentData.schoolJoinCode.trim()) {
          setError('Please enter your school join code')
          setLoading(false)
          return
        }

        const verification = await dbHelpers.verifySchoolJoinCode(studentData.schoolJoinCode.toUpperCase())
        
        if (!verification.valid) {
          setError(verification.error)
          setLoading(false)
          return
        }

        setSchoolData(verification.school)
        setStep(3)
      } else if (step === 3) {
        // Create account
        try {
          // Create Firebase Auth account
          const authResult = await authHelpers.createStudentAccount(
            studentData.firstName,
            studentData.lastInitial,
            studentData.schoolJoinCode.toUpperCase()
          )

          // Create student profile in database
          const studentProfile = await dbHelpers.createStudentProfile(
            authResult.uid,
            studentData,
            schoolData
          )

          // Store session data for onboarding
          if (typeof window !== 'undefined') {
            localStorage.setItem('luxlibris_student_profile', JSON.stringify({
              ...studentProfile,
              uid: authResult.uid
            }))
            localStorage.setItem('luxlibris_account_created', 'true')
          }

          // Redirect to legal acceptance first
          router.push('/legal?flow=student-onboarding')
          
        } catch (error) {
          console.error('Account creation error:', error)
          setError('Error creating account. Please try again.')
        }
      }
    } catch (error) {
      console.error('Step error:', error)
      setError('Something went wrong. Please try again.')
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

  return (
    <>
      <Head>
        <title>Create Student Account - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #ADD4EA 50%, #C3E0DE 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '28rem',
          width: '100%',
          background: 'white',
          borderRadius: '1.5rem',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.75rem'
            }}>
              🎓
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Georgia, serif'
            }}>
              Create Student Account
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Join your school&apos;s Lux Libris reading program
            </p>
          </div>

          {/* Progress Steps */}
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
                    ? 'linear-gradient(135deg, #ADD4EA, #C3E0DE)'
                    : '#e5e7eb',
                  color: stepNum <= step ? '#223848' : '#9ca3af',
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
                    background: stepNum < step ? '#ADD4EA' : '#e5e7eb'
                  }}></div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div style={{ marginBottom: '2rem' }}>
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  Tell us about yourself
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={studentData.firstName}
                    onChange={(e) => setStudentData(prev => ({ 
                      ...prev, 
                      firstName: e.target.value 
                    }))}
                    placeholder="Emma"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Last Initial *
                  </label>
                  <input
                    type="text"
                    maxLength="1"
                    value={studentData.lastInitial}
                    onChange={(e) => setStudentData(prev => ({ 
  ...prev, 
  lastInitial: e.target.value.slice(0, 1).toUpperCase() 
}))}
                    placeholder="K"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0.5rem 0 0 0'
                  }}>
                    We only need your last initial for privacy
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: School Join Code */}
            {step === 2 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Connect to your school
                </h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                  lineHeight: '1.4'
                }}>
                  Enter the school join code provided by your teacher or librarian
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    School Join Code *
                  </label>
                  <input
                    type="text"
                    value={studentData.schoolJoinCode}
                    onChange={(e) => setStudentData(prev => ({ 
                      ...prev, 
                      schoolJoinCode: e.target.value.toUpperCase() 
                    }))}
                    placeholder="HFCS2025"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      letterSpacing: '0.1em'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0.5rem 0 0 0'
                  }}>
                    Ask your teacher if you don&apos;t have this code
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && schoolData && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Confirm your account
                </h2>

                <div style={{
                  background: '#f8fafc',
                  border: '2px solid #ADD4EA',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#223848',
                    margin: '0 0 1rem 0'
                  }}>
                    Account Details:
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Name:</strong> {studentData.firstName} {studentData.lastInitial}.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>School:</strong> {schoolData.name}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Location:</strong> {schoolData.city}, {schoolData.state}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Join Code:</strong> {studentData.schoolJoinCode}
                    </p>
                  </div>
                </div>

                <div style={{
                  background: '#fef3cd',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#92400e',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    <strong>📧 Parent/Guardian:</strong> After creating your account, you&apos;ll get a special link to share with your parent or guardian so they can track your reading progress!
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
                fontSize: '0.875rem',
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
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                minHeight: '48px',
                minWidth: '100px'
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
                  : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                color: '#223848',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '48px',
                minWidth: '120px'
              }}
            >
              {loading && (
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #223848',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              )}
              {step === 3 ? 'Create Account' : 'Next'}
            </button>
          </div>

          {/* Help Text */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Need help? Ask your teacher or librarian for assistance with your school join code.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
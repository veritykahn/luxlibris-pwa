import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { dbHelpers } from '../lib/firebase'

export default function StudentAccountCreation() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [studentData, setStudentData] = useState({
    schoolJoinCode: ''
  })
  const [schoolData, setSchoolData] = useState(null)

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      if (step === 1) {
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
        setStep(2)
      } else if (step === 2) {
        // Just store school data for onboarding to use - NO ACCOUNT CREATION HERE
        try {
          console.log('💾 Saving school data for onboarding...');
          console.log('🏫 School ID:', schoolData.id);
          console.log('🏫 School Name:', schoolData.name);
          console.log('🔑 Join Code:', studentData.schoolJoinCode);
          
          // Store school data for onboarding to use
          if (typeof window !== 'undefined') {
            const tempData = {
              schoolId: schoolData.id,  // This should be the Firebase document ID like "uyEwDKbGELvBROhjrMIn"
              schoolName: schoolData.name,
              schoolCity: schoolData.city,
              schoolState: schoolData.state,
              schoolJoinCode: studentData.schoolJoinCode.toUpperCase()
            };
            
            localStorage.setItem('tempSchoolData', JSON.stringify(tempData));
            localStorage.setItem('luxlibris_account_flow', 'student');
            
            console.log('✅ Temp school data saved:', tempData);
          }

          // Redirect to legal acceptance first, then onboarding will create the actual account
          router.push('/legal?flow=student-onboarding');
          
        } catch (error) {
          console.error('Data storage error:', error)
          setError('Error saving school information. Please try again.')
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
        <title>Join Your School - Lux Libris</title>
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
              🏫
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Georgia, serif'
            }}>
              Join Your School
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Connect to your school&apos;s Lux Libris reading program
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
            {[1, 2].map(stepNum => (
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
                {stepNum < 2 && (
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
            
            {/* Step 1: School Join Code */}
            {step === 1 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Enter your school code
                </h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                  lineHeight: '1.4'
                }}>
                  Your teacher or librarian will have given you a special code to join your school
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
                    margin: '0.5rem 0 0 0',
                    textAlign: 'center'
                  }}>
                    Ask your teacher if you don&apos;t have this code
                  </p>
                </div>

                <div style={{
                  background: 'rgba(173, 212, 234, 0.1)',
                  border: '1px solid rgba(173, 212, 234, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{
                    color: '#223848',
                    fontSize: '0.875rem',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    💡 <strong>What&apos;s next:</strong> After we verify your school, you&apos;ll set up your profile with your name, grade, and reading preferences!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Confirmation */}
            {step === 2 && schoolData && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  School found! 🎉
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
                    You&apos;re joining:
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>📚 School:</strong> {schoolData.name}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>📍 Location:</strong> {schoolData.city}, {schoolData.state}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>🔑 Join Code:</strong> {studentData.schoolJoinCode}
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#065f46',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    <strong>🚀 Ready to start!</strong> Click continue to set up your personal reading profile and start collecting saint achievements!
                  </p>
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
                    <strong>👨‍👩‍👧‍👦 For parents:</strong> After setup, your child will get a special link to share with you so you can track their reading progress!
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
              {step === 2 ? 'Continue to Setup' : 'Verify School'}
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
              Need help? Ask your teacher or librarian for your school&apos;s join code.
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
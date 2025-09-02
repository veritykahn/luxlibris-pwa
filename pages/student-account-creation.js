// pages/student-account-creation.js - FIXED: Teacher Code Input Validation + Existing User Warning
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export default function StudentAccountCreation() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [studentData, setStudentData] = useState({
    teacherJoinCode: ''
  })
  const [teacherData, setTeacherData] = useState(null)
  const [schoolData, setSchoolData] = useState(null)

  // Find teacher by studentJoinCode across all entities/schools
  const findTeacherByStudentCode = async (studentJoinCode) => {
    try {
      console.log('🔍 Searching for teacher with student code:', studentJoinCode);
      
      // Search all entities
      const entitiesRef = collection(db, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id;
        
        try {
          // Search all schools in this entity
          const schoolsRef = collection(db, `entities/${entityId}/schools`);
          const schoolsSnapshot = await getDocs(schoolsRef);
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolId = schoolDoc.id;
            const schoolData = schoolDoc.data();
            
            try {
              // Search all teachers in this school
              const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
              const teachersSnapshot = await getDocs(teachersRef);
              
              for (const teacherDoc of teachersSnapshot.docs) {
                const teacherData = teacherDoc.data();
                
                if (teacherData.studentJoinCode === studentJoinCode) {
                  console.log('✅ Found teacher:', teacherData.firstName, teacherData.lastName);
                  return {
                    teacher: {
                      id: teacherDoc.id,
                      ...teacherData
                    },
                    school: {
                      id: schoolId,
                      entityId: entityId,
                      ...schoolData
                    }
                  };
                }
              }
            } catch (teacherError) {
              console.log('No teachers found in school:', schoolId);
            }
          }
        } catch (schoolError) {
          console.log('No schools found in entity:', entityId);
        }
      }
      
      console.log('❌ No teacher found with student code:', studentJoinCode);
      return null;
    } catch (error) {
      console.error('❌ Error searching for teacher:', error);
      return null;
    }
  };

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      if (step === 1) {
        // Verify teacher join code
        if (!studentData.teacherJoinCode.trim()) {
          setError('Please enter your teacher code')
          setLoading(false)
          return
        }

        const result = await findTeacherByStudentCode(studentData.teacherJoinCode.toUpperCase())
        if (!result) {
          setError('Invalid teacher code. Please check with your teacher.')
          setLoading(false)
          return
        }

        setTeacherData(result.teacher)
        setSchoolData(result.school)
        setStep(2)
      } else if (step === 2) {
        // Store teacher and school data for onboarding
        try {
          console.log('💾 Saving teacher and school data for onboarding...');
          console.log('👩‍🏫 Teacher:', teacherData.firstName, teacherData.lastName);
          console.log('🏫 School:', schoolData.name);
          console.log('🔑 Teacher Code:', studentData.teacherJoinCode);
          
          if (typeof window !== 'undefined') {
            const tempData = {
              // Teacher information
              teacherId: teacherData.id,
              teacherName: `${teacherData.firstName} ${teacherData.lastName}`,
              teacherJoinCode: studentData.teacherJoinCode.toUpperCase(),
              
              // School information  
              schoolId: schoolData.id,
              entityId: schoolData.entityId,
              schoolName: schoolData.name,
              schoolCity: schoolData.city,
              schoolState: schoolData.state
            };
            
            localStorage.setItem('tempTeacherData', JSON.stringify(tempData));
            localStorage.setItem('luxlibris_account_flow', 'student');
            
            console.log('✅ Temp teacher data saved:', tempData);
          }

          // Redirect to legal acceptance first, then onboarding will create the actual account
          router.push('/legal?flow=student-onboarding');
          
        } catch (error) {
          console.error('Data storage error:', error)
          setError('Error saving teacher information. Please try again.')
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

  // Handle teacher code input - only allow letters, numbers, and hyphens (no spaces)
  const handleTeacherCodeChange = (e) => {
    // Remove spaces and convert to uppercase
    const value = e.target.value.replace(/\s/g, '').toUpperCase();
    
    // Only allow letters, numbers, and hyphens
    const sanitizedValue = value.replace(/[^A-Z0-9-]/g, '');
    
    setStudentData(prev => ({ 
      ...prev, 
      teacherJoinCode: sanitizedValue
    }));
  };

  // Handle key press to prevent spaces
  const handleKeyPress = (e) => {
    // Prevent space key
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  // Handle sign-in redirect
  const handleSignInRedirect = () => {
    window.location.href = 'https://www.luxlibris.org/sign-in';
  };

  return (
    <>
      <Head>
        <title>Join Your Teacher - Lux Libris</title>
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
              👩‍🏫
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Georgia, serif'
            }}>
              Join Your Teacher
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Enter the teacher code to connect to your reading program
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
            
            {/* Step 1: Teacher Join Code */}
            {step === 1 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Enter your teacher code
                </h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                  lineHeight: '1.4'
                }}>
                  Your teacher will have given you a special code that connects you to their reading program
                </p>

                {/* EXISTING USER WARNING */}
                <div style={{
                  background: 'linear-gradient(135deg, #fef3cd, #fed7aa)',
                  border: '2px solid #f59e0b',
                  borderRadius: '0.5rem',
                  padding: '0.875rem',
                  marginBottom: '1.25rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#92400e',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.3'
                  }}>
                    ⚠️ <strong>Already have an account?</strong> Don&apos;t create another one! Ask your teacher or librarian if you need your login details.
                  </p>
                  <button
                    onClick={handleSignInRedirect}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      transition: 'transform 0.2s',
                      textDecoration: 'none'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    🔑 Go to Sign-In
                  </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Teacher Code *
                  </label>
                  <input
                    type="text"
                    value={studentData.teacherJoinCode}
                    onChange={handleTeacherCodeChange}
                    onKeyPress={handleKeyPress}
                    placeholder="LUXLIB-SCHOOL-SMITH25-STUDENT"
                    maxLength="50"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                      fontFamily: 'monospace',
                      color: '#223848',
                      backgroundColor: '#ffffff',
                      textTransform: 'uppercase'  // Force visual uppercase
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
                  <p style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    margin: '0.25rem 0 0 0',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}>
                    No spaces allowed • Letters will be capitalized automatically
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
                    💡 <strong>What&apos;s next:</strong> After we verify your teacher, you&apos;ll set up your profile with your name, grade, and reading preferences!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Confirmation */}
            {step === 2 && teacherData && schoolData && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Teacher found! 🎉
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
                      <strong>👩‍🏫 Teacher:</strong> {teacherData.firstName} {teacherData.lastName}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>📚 School:</strong> {schoolData.name}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>📍 Location:</strong> {schoolData.city}, {schoolData.state}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>🔑 Teacher Code:</strong> {studentData.teacherJoinCode}
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
              {step === 2 ? 'Continue to Setup' : 'Verify Teacher Code'}
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
              Need help? Ask your teacher for your teacher code.
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
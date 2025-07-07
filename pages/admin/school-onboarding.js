// pages/admin/school-onboarding.js - UPDATED VERSION - Parent Code Removed
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import { db, auth } from '../../lib/firebase'
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where } from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'

export default function TeacherOnboarding() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading, initialized } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nominees, setNominees] = useState([])
  const [createdUser, setCreatedUser] = useState(null)
  const [createdProfile, setCreatedProfile] = useState(null)

  // Account creation data
  const [accountData, setAccountData] = useState({
    teacherJoinCode: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })

  // School and program data
  const [schoolData, setSchoolData] = useState(null)
  // CHANGE 1: Removed parentCode from teacherCodes state
  const [teacherCodes, setTeacherCodes] = useState({
    studentCode: ''
    // parentCode removed
  })

  // Onboarding data
  const [onboardingData, setOnboardingData] = useState({
    selectedNominees: [],
    achievementTiers: [],
    submissionOptions: {
      quiz: true,
      presentToTeacher: false,
      submitReview: false,
      createStoryboard: false,
      bookReport: false,
      discussWithLibrarian: false,
      actOutScene: false
    }
  })

  // Auto-populate teacher join code from URL
  useEffect(() => {
    if (router.query.code) {
      setAccountData(prev => ({ ...prev, teacherJoinCode: router.query.code.toUpperCase() }))
    }
  }, [router.query.code])

  // Check for existing authenticated teachers on load only
  useEffect(() => {
    if (!authLoading && initialized && user && userProfile) {
      // Only redirect existing teachers who haven't just been created
      if (userProfile.accountType === 'teacher' && !createdUser && userProfile.onboardingCompleted) {
        // Existing teacher with completed onboarding - go to dashboard
        window.location.href = '/admin/school-dashboard'
        return
      }
    }
  }, [authLoading, initialized, user, userProfile, createdUser])

  // Load nominees when we reach program selection
  useEffect(() => {
    if (currentStep >= 3) {
      fetchNominees()
    }
  }, [currentStep, fetchNominees])

  // Recalculate achievement tiers when nominees change
  useEffect(() => {
    if (onboardingData.selectedNominees.length > 0) {
      const dynamicTiers = calculateAchievementTiers(onboardingData.selectedNominees.length)
      setOnboardingData(prev => ({
        ...prev,
        achievementTiers: dynamicTiers
      }))
    }
  }, [onboardingData.selectedNominees])

  // Find school by teacher join code
  const findSchoolByTeacherJoinCode = async (joinCode) => {
    try {
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolData = schoolDoc.data()
            if (schoolData.teacherJoinCode === joinCode) {
              return {
                id: schoolDoc.id,
                dioceseId: entityDoc.id,
                ...schoolData
              }
            }
          }
        } catch (subError) {
          // No schools in this entity
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding school:', error)
      return null
    }
  }

  // Generate teacher codes (only student code now)
  const generateTeacherCodes = (school, teacherInfo) => {
    const schoolIdentifier = school.schoolAccessCode ? 
      school.schoolAccessCode.split('-').slice(0, 2).join('-') : 
      school.accessCode ? 
        school.accessCode.split('-').slice(0, 2).join('-') : 
        'LUXLIB-SCHOOL'
    
    const teacherLastName = teacherInfo.lastName.toUpperCase().replace(/[^A-Z]/g, '')
    const suffix = Date.now().toString().slice(-2)
    
    const codes = {
      studentCode: `${schoolIdentifier}-${teacherLastName}${suffix}-STUDENT`
      // parentCode removed
    }
    
    console.log('✅ Generated codes:', codes)
    return codes
  }

  // STEP 0: Verify Teacher Join Code
  const handleVerifyJoinCode = async () => {
    if (!accountData.teacherJoinCode.trim()) {
      setError('Please enter your teacher join code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const school = await findSchoolByTeacherJoinCode(accountData.teacherJoinCode.toUpperCase())
      
      if (!school) {
        setError('Invalid teacher join code. Please check with your school administrator.')
        setLoading(false)
        return
      }

      setSchoolData(school)
      setCurrentStep(1)
      
    } catch (error) {
      console.error('Error verifying join code:', error)
      setError('Error verifying join code. Please try again.')
    }
    
    setLoading(false)
  }

  // Check if teacher email already exists
  const checkExistingTeacher = async (school, email) => {
    try {
      const teachersRef = collection(db, `entities/${school.dioceseId}/schools/${school.id}/teachers`)
      const teacherQuery = query(teachersRef, where('email', '==', email))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      return !teacherSnapshot.empty
    } catch (error) {
      console.error('Error checking existing teacher:', error)
      return false
    }
  }

  // STEP 1: Create Teacher Account
  const handleCreateAccount = async () => {
    // Validation
    if (!accountData.email || !accountData.password || !accountData.firstName || !accountData.lastName) {
      setError('Please fill in all required fields')
      return
    }

    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (accountData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('👨‍🏫 Creating teacher account...')
      
      // Check if teacher email already exists in this school
      const existingTeacher = await checkExistingTeacher(schoolData, accountData.email)
      if (existingTeacher) {
        setError('An account with this email already exists for this school')
        setLoading(false)
        return
      }
      
      // Create Firebase Auth account
      const authResult = await createUserWithEmailAndPassword(auth, accountData.email, accountData.password)
      
      // Generate unique teacher codes (only student code)
      const codes = generateTeacherCodes(schoolData, accountData)
      setTeacherCodes(codes)
      
      // Create teacher profile
      const teacherProfile = {
        uid: authResult.user.uid,
        email: accountData.email,
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        role: 'teacher',
        accountType: 'teacher',
        schoolId: schoolData.id,
        schoolName: schoolData.name,
        dioceseId: schoolData.dioceseId,
        joinedWithCode: accountData.teacherJoinCode,
        managementType: 'school_reading_program',
        studentJoinCode: codes.studentCode,
        status: 'active',
        createdAt: new Date(),
        lastModified: new Date(),
        permissions: ['manage_school_program', 'view_all_students', 'configure_nominees', 'generate_reports'],
        
        // Initialize empty program configuration
        selectedNominees: [],
        achievementTiers: [],
        submissionOptions: {
          quiz: true,
          presentToTeacher: false,
          submitReview: false,
          createStoryboard: false,
          bookReport: false,
          discussWithLibrarian: false,
          actOutScene: false
        },
        onboardingCompleted: false
      }
      
      // Save to nested teachers collection
      const teacherDocRef = await addDoc(
        collection(db, `entities/${schoolData.dioceseId}/schools/${schoolData.id}/teachers`), 
        teacherProfile
      )
      
      console.log('✅ Teacher account created successfully')
      
      // Store created user data separately to avoid race conditions
      setCreatedUser(authResult.user)
      setCreatedProfile({ id: teacherDocRef.id, ...teacherProfile })
      
      // Sign in the new teacher (this will trigger auth context updates)
      await signInWithEmailAndPassword(auth, accountData.email, accountData.password)
      
      // Move to step 2 immediately, don't wait for auth context
      setCurrentStep(2)
      
    } catch (error) {
      console.error('❌ Error creating teacher account:', error)
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in instead.')
      } else {
        setError(error.message || 'Error creating account. Please try again.')
      }
    }
    
    setLoading(false)
  }

  // Calculate achievement tiers
  const calculateAchievementTiers = (bookCount) => {
    if (bookCount === 0) return []
    
    const tier1 = Math.max(1, Math.ceil(bookCount * 0.25))
    const tier2 = Math.max(2, Math.ceil(bookCount * 0.50))
    const tier3 = Math.max(3, Math.ceil(bookCount * 0.75))
    const tier4 = bookCount
    const lifetimeGoal = Math.max(25, Math.ceil(bookCount * 5))
    
    return [
      { books: tier1, reward: 'Recognition at Mass', type: 'basic' },
      { books: tier2, reward: 'Certificate', type: 'basic' },
      { books: tier3, reward: 'Party', type: 'basic' },
      { books: tier4, reward: 'Medal', type: 'annual' },
      { books: lifetimeGoal, reward: 'Plaque', type: 'lifetime' }
    ]
  }

  // Fetch nominees
  const fetchNominees = async () => {
    try {
      const nomineesRef = collection(db, 'masterNominees')
      const snapshot = await getDocs(nomineesRef)
      const nomineesData = []
      
      snapshot.forEach((doc) => {
        nomineesData.push({
          id: doc.id,
          ...doc.data(),
          selected: true
        })
      })
      
      setNominees(nomineesData)
      
      // Only auto-select all if no previous selection
      if (onboardingData.selectedNominees.length === 0) {
        setOnboardingData(prev => ({
          ...prev,
          selectedNominees: nomineesData.map(n => n.id)
        }))
      }
    } catch (error) {
      console.error('Error fetching nominees:', error)
    }
  }

  // Toggle nominee selection
  const toggleNominee = (nomineeId) => {
    setOnboardingData(prev => ({
      ...prev,
      selectedNominees: prev.selectedNominees.includes(nomineeId)
        ? prev.selectedNominees.filter(id => id !== nomineeId)
        : [...prev.selectedNominees, nomineeId]
    }))
  }

  // Update achievement tier
  const updateAchievementTier = (index, field, value) => {
    setOnboardingData(prev => ({
      ...prev,
      achievementTiers: prev.achievementTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }))
  }

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Use only createdProfile data - no hook calls in event handler
      if (!createdUser || !createdProfile) {
        setError('Session expired. Please refresh and try again.')
        setLoading(false)
        return
      }

      // Find the teacher document to update using stored profile data
      const teachersRef = collection(db, `entities/${createdProfile.dioceseId}/schools/${createdProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', createdUser.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        setError('Teacher profile not found. Please contact support.')
        setLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      
      // Save program configuration to teacher document
      await updateDoc(teacherDoc.ref, {
        selectedNominees: onboardingData.selectedNominees,
        achievementTiers: onboardingData.achievementTiers,
        submissionOptions: onboardingData.submissionOptions,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        lastModified: new Date()
      })

      // Redirect immediately to dashboard - no splash page needed
      window.location.href = '/admin/school-dashboard'

    } catch (error) {
      console.error('Error completing onboarding:', error)
      setError(`Error saving configuration: ${error.message}. Please try again.`)
      setLoading(false)
    }
  }

  // Navigation
  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  // Show loading during auth initialization
  if (authLoading || !initialized) {
    return (
      <>
        <Head>
          <title>Teacher Setup - Lux Libris</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '4px solid #C3E0DE',
              borderTop: '4px solid #223848',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#223848', fontSize: '1.1rem' }}>
              Loading...
            </p>
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

  return (
    <>
      <Head>
        <title>Teacher Setup - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '1rem 0',
          borderBottom: '1px solid rgba(195, 224, 222, 0.3)'
        }}>
          <div style={{
            maxWidth: '60rem',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '200px' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0
              }}>
                👩‍🏫
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                  fontWeight: '300',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, Georgia, serif',
                  letterSpacing: '1.2px'
                }}>
                  {currentStep === 0 ? 'Join Your School' :
                   currentStep === 1 ? 'Create Account' :
                   currentStep === 2 ? '🎉 Welcome!' :
                   currentStep === 3 ? 'Select Books' :
                   currentStep === 4 ? 'Achievement Rewards' :
                   currentStep === 5 ? 'Completion Options' :
                   'Review & Launch'}
                </h1>
                <p style={{
                  color: '#A1E5DB',
                  fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                  margin: 0,
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}>
                  Set up your reading program
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {[0, 1, 2, 3, 4, 5].map(step => (
                <div
                  key={step}
                  style={{
                    width: 'clamp(1.5rem, 5vw, 2rem)',
                    height: 'clamp(1.5rem, 5vw, 2rem)',
                    borderRadius: '50%',
                    background: currentStep >= step 
                      ? 'linear-gradient(135deg, #C3E0DE, #A1E5DB)' 
                      : '#e5e7eb',
                    color: currentStep >= step ? 'white' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    fontWeight: 'bold'
                  }}
                >
                  {step + 1}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '60rem',
          margin: '0 auto',
          padding: 'clamp(1rem, 5vw, 3rem) clamp(1rem, 5vw, 1.5rem)'
        }}>
          
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: 'clamp(1rem, 5vw, 2rem)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(195, 224, 222, 0.4)',
            overflow: 'hidden'
          }}>
            
            {/* STEP 0: Teacher Join Code */}
            {currentStep === 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', marginBottom: '1rem' }}>🏫</div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  Join Your School
                </h2>
                <p style={{
                  fontSize: 'clamp(1rem, 4vw, 1.125rem)',
                  color: '#A1E5DB',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Enter the teacher join code provided by your school administrator.
                </p>
                
                <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Teacher Join Code *
                    </label>
                    <input
                      type="text"
                      value={accountData.teacherJoinCode}
                      onChange={(e) => setAccountData(prev => ({ 
                        ...prev, 
                        teacherJoinCode: e.target.value.toUpperCase() 
                      }))}
                      placeholder="TXTEST-DEMO-TEACHER-2025"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em'
                      }}
                    />
                  </div>

                  <div style={{ 
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <ActionButton onClick={handleVerifyJoinCode} primary loading={loading}>
                      {loading ? 'Verifying...' : 'Verify Join Code'}
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Account Creation */}
            {currentStep === 1 && schoolData && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  fontWeight: '300',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Didot, Georgia, serif',
                  letterSpacing: '1.2px'
                }}>
                  Create Your Teacher Account
                </h2>

                {/* School confirmation */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFFCF5, #C3E0DE)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(195, 224, 222, 0.4)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    color: '#223848', 
                    marginBottom: '0.5rem', 
                    fontFamily: 'Didot, Georgia, serif',
                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                    letterSpacing: '1.2px'
                  }}>
                    ✅ Joining {schoolData.name}
                  </h3>
                  <p style={{ color: '#374151', margin: 0 }}>
                    {schoolData.city}, {schoolData.state}
                  </p>
                </div>

                {/* Account form */}
                <div style={{ 
                  maxWidth: '500px', 
                  margin: '0 auto',
                  textAlign: 'left'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
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
                        value={accountData.firstName}
                        onChange={(e) => setAccountData(prev => ({ 
                          ...prev, 
                          firstName: e.target.value 
                        }))}
                        placeholder="Jane"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={accountData.lastName}
                        onChange={(e) => setAccountData(prev => ({ 
                          ...prev, 
                          lastName: e.target.value 
                        }))}
                        placeholder="Smith"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))}
                      placeholder="jane.smith@school.edu"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        value={accountData.password}
                        onChange={(e) => setAccountData(prev => ({ 
                          ...prev, 
                          password: e.target.value 
                        }))}
                        placeholder="Create password"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData(prev => ({ 
                          ...prev, 
                          confirmPassword: e.target.value 
                        }))}
                        placeholder="Confirm password"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ 
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <ActionButton onClick={handleCreateAccount} primary loading={loading}>
                      {loading ? 'Creating Account...' : 'Create Teacher Account'}
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Welcome & Codes Display */}
            {currentStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  fontWeight: '300',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Didot, Georgia, serif',
                  letterSpacing: '1.2px'
                }}>
                  Welcome, {accountData.firstName || createdProfile?.firstName}!
                </h2>
                <p style={{ 
                  color: '#ADD4EA', 
                  marginBottom: '2rem',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                  fontFamily: 'Avenir'
                }}>
                  Your account has been created! Here is your unique student code.
                </p>
                
                {/* Display generated code */}
                <div style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    color: 'white', 
                    marginBottom: '1rem', 
                    fontFamily: 'Avenir',
                    fontSize: 'clamp(1rem, 4vw, 1.125rem)',
                    letterSpacing: '1.2px'
                  }}>
                    🔑 Your Student Code
                  </h3>
                  
                  <div style={{ 
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        marginBottom: '0.5rem', 
                        fontFamily: 'Avenir' 
                      }}>
                        Student Join Code:
                      </div>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                        fontFamily: 'Avenir',
                        wordBreak: 'break-all'
                      }}>
                        {teacherCodes.studentCode || 'GENERATING...'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#065f46',
                    margin: 0,
                    lineHeight: '1.4',
                    fontFamily: 'Avenir'
                  }}>
                    <strong>🎯 Next:</strong> Let&apos;s configure your book selection and achievement rewards!
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Book Selection */}
            {currentStep === 3 && (
              <NomineeSelectionStep 
                nominees={nominees}
                selectedNominees={onboardingData.selectedNominees}
                onToggleNominee={toggleNominee}
                calculateAchievementTiers={calculateAchievementTiers}
              />
            )}

            {/* STEP 4: Achievement Tiers - CHANGE 2: Removed parentTestCode parameter */}
            {currentStep === 4 && (
              <AchievementTiersStep 
                achievementTiers={onboardingData.achievementTiers}
                selectedCount={onboardingData.selectedNominees.length}
                onUpdateTier={updateAchievementTier}
                studentJoinCode={teacherCodes.studentCode}
              />
            )}

            {/* STEP 5: Submission Options */}
            {currentStep === 5 && (
              <SubmissionOptionsStep 
                submissionOptions={onboardingData.submissionOptions}
                onUpdateOption={(key, value) => 
                  setOnboardingData(prev => ({
                    ...prev,
                    submissionOptions: { ...prev.submissionOptions, [key]: value }
                  }))
                }
                onComplete={handleCompleteOnboarding}
                loading={loading}
                schoolName={schoolData?.name}
                teacherName={`${accountData.firstName || createdProfile?.firstName} ${accountData.lastName || createdProfile?.lastName}`}
              />
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginTop: '1.5rem'
              }}>
                <p style={{
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir'
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Navigation */}
            {currentStep > 0 && currentStep < 5 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start',
                  alignItems: 'center'
                }}>
                  <ActionButton
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    secondary
                  >
                    ← Back
                  </ActionButton>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>
                  <ActionButton
                    onClick={handleNext}
                    disabled={currentStep === 3 && onboardingData.selectedNominees.length === 0}
                    primary
                  >
                    Continue →
                  </ActionButton>
                </div>
              </div>
            )}
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

// Supporting Components
function NomineeSelectionStep({ nominees, selectedNominees, onToggleNominee, calculateAchievementTiers }) {
  return (
    <div>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '1rem',
        fontFamily: 'Georgia, serif'
      }}>
        📚 Select Your Nominees
      </h2>
      <p style={{ 
        color: '#ADD4EA', 
        marginBottom: '1rem',
        fontSize: 'clamp(0.875rem, 3vw, 1rem)'
      }}>
        Choose which books from the 2025-26 master list your students can read.
      </p>
      
      {/* Dynamic Achievement Preview */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFCF5, #ADD4EA)',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1rem',
        border: '1px solid #ADD4EA'
      }}>
        <p style={{ 
          color: '#223848', 
          fontSize: 'clamp(0.875rem, 3vw, 1rem)', 
          margin: '0 0 0.5rem 0',
          fontWeight: '600'
        }}>
          📊 Selected: {selectedNominees.length} of {nominees.length} books
        </p>
        {selectedNominees.length > 0 && (
          <p style={{ 
            color: '#223848', 
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
            margin: 0,
            fontStyle: 'italic'
          }}>
            🎯 Achievement tiers will be: {
              calculateAchievementTiers(selectedNominees.length)
                .filter(tier => tier.type !== 'lifetime')
                .map(tier => tier.books)
                .join(', ')
            } books
          </p>
        )}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: '0.75rem',
        maxHeight: '50vh',
        overflowY: 'auto',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '0.5rem'
      }}>
        {nominees.map(book => (
          <BookCard 
            key={book.id}
            book={book}
            isSelected={selectedNominees.includes(book.id)}
            onToggle={() => onToggleNominee(book.id)}
          />
        ))}
      </div>
    </div>
  )
}

// CHANGE 2: Removed parentTestCode parameter from AchievementTiersStep
function AchievementTiersStep({ achievementTiers, selectedCount, onUpdateTier, studentJoinCode }) {
  return (
    <div>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '1rem',
        fontFamily: 'Georgia, serif'
      }}>
        🏆 Dynamic Achievement Rewards
      </h2>
      <p style={{ 
        color: '#ADD4EA', 
        marginBottom: '1rem',
        fontSize: 'clamp(0.875rem, 3vw, 1rem)'
      }}>
        Achievement tiers automatically calculated based on your {selectedCount} selected books.
      </p>
      
      <div style={{ marginBottom: '2rem' }}>
        {achievementTiers.map((tier, index) => (
          <AchievementTierCard 
            key={index}
            tier={tier}
            index={index}
            onUpdate={(field, value) => onUpdateTier(index, field, value)}
          />
        ))}
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #FFFCF5, #ADD4EA)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid #ADD4EA',
        textAlign: 'center'
      }}>
        <h4 style={{ 
          color: '#223848', 
          marginBottom: '0.5rem',
          fontSize: 'clamp(1rem, 3vw, 1.125rem)'
        }}>
          🔐 Your Access Code
        </h4>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#374151', 
          lineHeight: '1.6',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          {/* CHANGE 3: Removed parent code display from JSX */}
          <p style={{ margin: 0 }}>
            <strong>Student Access Code:</strong><br />
            <span style={{ 
              fontFamily: 'monospace', 
              background: 'rgba(255,255,255,0.7)', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.25rem',
              fontSize: '0.8rem',
              wordBreak: 'break-all'
            }}>
              {studentJoinCode || 'LOADING...'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function SubmissionOptionsStep({ submissionOptions, onUpdateOption, onComplete, loading, schoolName, teacherName }) {
  const options = [
    { key: 'quiz', label: '📝 Take Quiz', description: 'Parent code required, auto-graded', disabled: true },
    { key: 'presentToTeacher', label: '🗣️ Present to Teacher', description: 'Oral presentation or discussion' },
    { key: 'submitReview', label: '✍️ Submit Written Review', description: 'Written book review or summary' },
    { key: 'createStoryboard', label: '🎨 Create Storyboard', description: 'Visual art or comic strip' },
    { key: 'bookReport', label: '📚 Traditional Book Report', description: 'Formal written report' },
    { key: 'discussWithLibrarian', label: '💬 Discussion with Librarian', description: 'One-on-one book discussion' },
    { key: 'actOutScene', label: '🎭 Act Out Scene', description: 'Performance or dramatic reading' }
  ]

  return (
    <div>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '1rem',
        fontFamily: 'Georgia, serif'
      }}>
        📝 Book Completion Options
      </h2>
      <p style={{ 
        color: '#ADD4EA', 
        marginBottom: '2rem',
        fontSize: 'clamp(0.875rem, 3vw, 1rem)'
      }}>
        When students finish a book, what options should they have? Quizzes are always available.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {options.map(option => (
          <SubmissionOptionCard 
            key={option.key}
            option={option}
            isChecked={submissionOptions[option.key] || false}
            onChange={(checked) => onUpdateOption(option.key, checked)}
          />
        ))}
      </div>

      {/* Complete Setup */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFCF5, #C3E0DE)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        textAlign: 'center',
        border: '1px solid #C3E0DE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h3 style={{ 
          color: '#223848', 
          marginBottom: '1rem',
          fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
          textAlign: 'center'
        }}>
          🎉 Ready to Launch {schoolName}?
        </h3>
        <p style={{ 
          color: '#223848', 
          marginBottom: '1.5rem',
          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          Complete setup by {teacherName} is ready to go!
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '100%' 
        }}>
          <ActionButton onClick={onComplete} primary loading={loading}>
            {loading ? '🚀 Saving Configuration...' : '🎊 Launch Program!'}
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function BookCard({ book, isSelected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        border: isSelected ? '2px solid #C3E0DE' : '2px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: isSelected ? 1 : 0.7,
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: isSelected ? '#C3E0DE' : '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSelected ? '#223848' : 'white',
          fontSize: '10px',
          flexShrink: 0
        }}>
          {isSelected ? '✓' : ''}
        </div>
        
        {book.coverImageUrl && (
          <Image
            src={book.coverImageUrl}
            alt={`Cover of ${book.title}`}
            width={40}
            height={60}
            style={{
              objectFit: 'cover',
              borderRadius: '0.25rem',
              flexShrink: 0
            }}
          />
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 0.25rem 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {book.title}
          </h4>
          <p style={{
            fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
            color: '#6b7280',
            margin: '0 0 0.25rem 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            by {book.authors}
          </p>
          {book.genres && (
            <p style={{
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              color: '#A1E5DB',
              margin: 0,
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {book.genres}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function AchievementTierCard({ tier, index, onUpdate }) {
  const tierTypeColors = {
    basic: '#C3E0DE',
    annual: '#A1E5DB', 
    lifetime: '#ADD4EA'
  }
  
  const tierTypeLabels = {
    basic: '📚',
    annual: '🏆',
    lifetime: '🌟'
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '1rem',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '1rem',
      background: '#f9fafb',
      borderRadius: '0.5rem',
      border: `2px solid ${tierTypeColors[tier.type] || '#e5e7eb'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          width: 'clamp(1.5rem, 5vw, 2rem)',
          height: 'clamp(1.5rem, 5vw, 2rem)',
          background: `linear-gradient(135deg, ${tierTypeColors[tier.type]}, #A1E5DB)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 'clamp(0.75rem, 2.5vw, 1rem)'
        }}>
          {tier.books}
        </span>
        <div>
          <div style={{ 
            fontWeight: '600', 
            color: '#1f2937',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
          }}>
            {tierTypeLabels[tier.type]} {tier.books} book{tier.books > 1 ? 's' : ''}
          </div>
          {tier.type === 'lifetime' && (
            <div style={{
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Multi-year goal
            </div>
          )}
        </div>
      </div>
      <input
        type="text"
        value={tier.reward}
        onChange={(e) => onUpdate('reward', e.target.value)}
        style={{
          padding: 'clamp(0.5rem, 2vw, 0.75rem)',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
          width: '100%',
          background: 'white',
          color: 'inherit',
          boxSizing: 'border-box'
        }}
        placeholder="Enter reward description"
      />
    </div>
  )
}

function SubmissionOptionCard({ option, isChecked, onChange }) {
  const handleChange = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!option.disabled) {
      onChange(e.target.checked)
    }
  }

  const handleLabelClick = (e) => {
    if (e.target.type === 'checkbox') {
      return
    }
    
    if (!option.disabled) {
      onChange(!isChecked)
    }
  }

  return (
    <div style={{
      padding: '1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      background: option.disabled ? '#f9fafb' : 'white',
      opacity: option.disabled ? 0.7 : 1
    }}>
      <label 
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          cursor: option.disabled ? 'not-allowed' : 'pointer'
        }}
        onClick={handleLabelClick}
      >
        <input
          type="checkbox"
          checked={isChecked}
          disabled={option.disabled}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: '0.25rem',
            cursor: option.disabled ? 'not-allowed' : 'pointer',
            minWidth: '16px',
            minHeight: '16px'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            fontWeight: '600',
            color: '#223848',
            marginBottom: '0.25rem',
            userSelect: 'none'
          }}>
            {option.label} {option.disabled && '(Always Available)'}
          </div>
          <div style={{
            fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
            color: '#6b7280',
            lineHeight: '1.3',
            userSelect: 'none'
          }}>
            {option.description}
          </div>
        </div>
      </label>
    </div>
  )
}

function ActionButton({ children, onClick, primary, secondary, disabled, loading }) {
  const baseStyle = {
    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    minWidth: 'fit-content',
    whiteSpace: 'nowrap',
    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
    letterSpacing: '1.2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }

  const primaryStyle = {
    ...baseStyle,
    background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
    color: '#223848'
  }

  const secondaryStyle = {
    ...baseStyle,
    background: 'white',
    color: '#A1E5DB',
    border: '1px solid #A1E5DB'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={primary ? primaryStyle : secondaryStyle}
    >
      {loading && (
        <div style={{
          width: '1rem',
          height: '1rem',
          border: '2px solid currentColor',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      )}
      {children}
    </button>
  )
}
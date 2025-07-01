// pages/admin/school-onboarding.js - UPDATED to connect to God Mode diocese structure
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { db, authHelpers } from '../../lib/firebase'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'

export default function SchoolAdminOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nominees, setNominees] = useState([])
  
  // School data will be loaded from God Mode diocese structure
  const [schoolData, setSchoolData] = useState({
    id: '',
    dioceseId: '',
    name: '',
    city: '',
    state: '',
    email: '',
    adminEmail: '',
    adminPassword: '',
    studentAccessCode: '',
    parentQuizCode: '',
    selectedNominees: [],
    achievementTiers: [],
    submissionOptions: {
      quiz: true, // Always enabled
      presentToTeacher: false,
      submitReview: false,
      createStoryboard: false,
      bookReport: false,
      discussWithLibrarian: false,
      actOutScene: false
    }
  })

  // Authentication state
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    schoolCode: '',
    isAuthenticated: false
  })

  // Fetch nominees on load
  useEffect(() => {
    fetchNominees()
  }, [])

  // Recalculate achievement tiers when nominees selection changes
  useEffect(() => {
    if (schoolData.selectedNominees.length > 0) {
      const dynamicTiers = calculateAchievementTiers(schoolData.selectedNominees.length)
      setSchoolData(prev => ({
        ...prev,
        achievementTiers: dynamicTiers
      }))
    }
  }, [schoolData.selectedNominees])

  const calculateAchievementTiers = (bookCount) => {
    if (bookCount === 0) return []
    
    const tier1 = Math.max(1, Math.ceil(bookCount * 0.25))  // 25%
    const tier2 = Math.max(2, Math.ceil(bookCount * 0.50))  // 50%
    const tier3 = Math.max(3, Math.ceil(bookCount * 0.75))  // 75%
    const tier4 = bookCount                                 // 100%
    
    // Lifetime goal: 5x multiplier for 5-year program
    const lifetimeGoal = Math.max(25, Math.ceil(bookCount * 5))
    
    return [
      { books: tier1, reward: 'Recognition at Mass', type: 'basic' },
      { books: tier2, reward: 'Certificate', type: 'basic' },
      { books: tier3, reward: 'Party', type: 'basic' },
      { books: tier4, reward: 'Medal', type: 'annual' },
      { books: lifetimeGoal, reward: 'Plaque', type: 'lifetime' }
    ]
  }

  const fetchNominees = async () => {
    try {
      const nomineesRef = collection(db, 'masterNominees')
      const snapshot = await getDocs(nomineesRef)
      const nomineesData = []
      
      snapshot.forEach((doc) => {
        nomineesData.push({
          id: doc.id,
          ...doc.data(),
          selected: true // Default all selected
        })
      })
      
      setNominees(nomineesData)
      setSchoolData(prev => ({
        ...prev,
        selectedNominees: nomineesData.map(n => n.id)
      }))
    } catch (error) {
      console.error('Error fetching nominees:', error)
    }
  }

  // NEW: Admin authentication step
  const handleAdminAuth = async () => {
    setError('')
    setLoading(true)

    try {
      if (!authData.email || !authData.password || !authData.schoolCode) {
        setError('Please enter your email, password, and school code')
        setLoading(false)
        return
      }

      console.log('🔐 Authenticating admin...')
      console.log('📧 Email:', authData.email)
      console.log('🏫 School Code:', authData.schoolCode)

      // Find the school in the diocese structure
      const school = await findSchoolByStudentAccessCode(authData.schoolCode.toUpperCase())
      if (!school) {
        setError('School not found with that code')
        setLoading(false)
        return
      }

      // Verify this email is the admin for this school
      if (school.adminEmail !== authData.email) {
        setError('Email does not match the admin for this school')
        setLoading(false)
        return
      }

      // Verify password by attempting to sign in
      try {
        await authHelpers.signIn(authData.email, authData.password)
        console.log('✅ Admin authenticated successfully')
      } catch (error) {
        setError('Incorrect password')
        setLoading(false)
        return
      }

      // Load the school data
      setSchoolData({
        id: school.id,
        dioceseId: school.dioceseId,
        name: school.name,
        city: school.city,
        state: school.state,
        email: school.email,
        adminEmail: school.adminEmail,
        adminPassword: authData.password,
        studentAccessCode: school.studentAccessCode,
        parentQuizCode: school.parentQuizCode,
        selectedNominees: school.selectedNominees || nominees.map(n => n.id),
        achievementTiers: school.achievementTiers || [],
        submissionOptions: school.submissionOptions || {
          quiz: true,
          presentToTeacher: false,
          submitReview: false,
          createStoryboard: false,
          bookReport: false,
          discussWithLibrarian: false,
          actOutScene: false
        }
      })

      setAuthData(prev => ({ ...prev, isAuthenticated: true }))
      setCurrentStep(2) // Skip to step 2 since basic info is already loaded

    } catch (error) {
      console.error('Admin auth error:', error)
      setError('Authentication failed. Please check your credentials.')
    }

    setLoading(false)
  }

  // Helper function to find school by student access code
  const findSchoolByStudentAccessCode = async (studentAccessCode) => {
    try {
      // Search all dioceses for schools with this student access code
      const diocesesRef = collection(db, 'dioceses')
      const diocesesSnapshot = await getDocs(diocesesRef)
      
      for (const dioceseDoc of diocesesSnapshot.docs) {
        const dioceseId = dioceseDoc.id
        const schoolsRef = collection(db, `dioceses/${dioceseId}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolDataDoc = schoolDoc.data()
          if (schoolDataDoc.studentAccessCode === studentAccessCode) {
            return {
              id: schoolDoc.id,
              dioceseId: dioceseId,
              ...schoolDataDoc
            }
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding school:', error)
      return null
    }
  }

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Update the school in the diocese structure with the onboarding data
      const schoolRef = doc(db, `dioceses/${schoolData.dioceseId}/schools`, schoolData.id)
      
      await updateDoc(schoolRef, {
        selectedNominees: schoolData.selectedNominees,
        achievementTiers: schoolData.achievementTiers,
        submissionOptions: schoolData.submissionOptions,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date()
      })

      console.log('✅ School onboarding completed and saved to diocese structure')

      // Navigate to admin dashboard
      router.push('/admin/school-dashboard')

    } catch (error) {
      console.error('Error completing onboarding:', error)
      setError('Error saving configuration. Please try again.')
    }
    setLoading(false)
  }

  const toggleNominee = (nomineeId) => {
    setSchoolData(prev => ({
      ...prev,
      selectedNominees: prev.selectedNominees.includes(nomineeId)
        ? prev.selectedNominees.filter(id => id !== nomineeId)
        : [...prev.selectedNominees, nomineeId]
    }))
  }

  const updateAchievementTier = (index, field, value) => {
    setSchoolData(prev => ({
      ...prev,
      achievementTiers: prev.achievementTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }))
  }

  return (
    <>
      <Head>
        <title>School Admin Setup - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
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
                fontSize: '1.5rem'
              }}>
                🏫
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  School Admin Setup
                </h1>
                <p style={{
                  color: '#A1E5DB',
                  fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                  margin: 0
                }}>
                  Configure your Lux Libris reading program
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            {authData.isAuthenticated && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {[1, 2, 3, 4, 5, 6].map(step => (
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
                    {step}
                  </div>
                ))}
              </div>
            )}
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
            
            {/* Step 1: Admin Authentication */}
            {!authData.isAuthenticated && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', marginBottom: '1rem' }}>🔐</div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  Admin Authentication
                </h2>
                <p style={{
                  fontSize: 'clamp(1rem, 4vw, 1.125rem)',
                  color: '#A1E5DB',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Sign in with your admin credentials to configure your school&apos;s reading program.
                </p>
                
                <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={authData.email}
                      onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="admin@testschool.edu"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={authData.password}
                      onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Your chosen password"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
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
                      School Code
                    </label>
                    <input
                      type="text"
                      value={authData.schoolCode}
                      onChange={(e) => setAuthData(prev => ({ ...prev, schoolCode: e.target.value.toUpperCase() }))}
                      placeholder="DEMO-STUDENT-2025"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em'
                      }}
                    />
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: '0.5rem 0 0 0',
                      textAlign: 'center'
                    }}>
                      Your school&apos;s student access code
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{
                      color: '#223848',
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      👑 <strong>Admin Access:</strong> These credentials were provided when your school was created via God Mode.
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <ActionButton onClick={handleAdminAuth} primary loading={loading}>
                      {loading ? 'Authenticating...' : 'Sign In & Configure'}
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}

            {/* Authenticated Steps */}
            {authData.isAuthenticated && (
              <>
                {/* Step 2: School Information Display */}
                {currentStep === 2 && (
                  <div>
                    <h2 style={{
                      fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                      fontWeight: 'bold',
                      color: '#223848',
                      marginBottom: '1rem',
                      fontFamily: 'Georgia, serif'
                    }}>
                      ✅ School Information Confirmed
                    </h2>
                    <p style={{ 
                      color: '#A1E5DB', 
                      marginBottom: '2rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}>
                      Your school information has been loaded from the diocese configuration.
                    </p>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #FFFCF5, #C3E0DE)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      marginBottom: '2rem',
                      border: '1px solid rgba(195, 224, 222, 0.4)'
                    }}>
                      <h3 style={{ 
                        color: '#223848', 
                        marginBottom: '1rem', 
                        fontFamily: 'Georgia, serif',
                        fontSize: 'clamp(1rem, 4vw, 1.25rem)'
                      }}>
                        🏫 Your School Details:
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}>
                          <strong>School:</strong> {schoolData.name}
                        </p>
                        <p style={{ margin: '0 0 0.5rem 0' }}>
                          <strong>Location:</strong> {schoolData.city}, {schoolData.state}
                        </p>
                        <p style={{ margin: '0 0 0.5rem 0' }}>
                          <strong>Student Access Code:</strong> {schoolData.studentAccessCode}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Parent Quiz Code:</strong> {schoolData.parentQuizCode}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#065f46',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        <strong>🎯 Next:</strong> Configure your book selection and achievement rewards for your students!
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Nominee Selection */}
                {currentStep === 3 && (
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
                        📊 Selected: {schoolData.selectedNominees.length} of {nominees.length} books
                      </p>
                      {schoolData.selectedNominees.length > 0 && (
                        <p style={{ 
                          color: '#223848', 
                          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
                          margin: 0,
                          fontStyle: 'italic'
                        }}>
                          🎯 Achievement tiers will be: {
                            calculateAchievementTiers(schoolData.selectedNominees.length)
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
                          isSelected={schoolData.selectedNominees.includes(book.id)}
                          onToggle={() => toggleNominee(book.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps 4-6: Keep existing implementation */}
                {currentStep === 4 && (
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
                      Achievement tiers automatically calculated based on your {schoolData.selectedNominees.length} selected books.
                    </p>
                    
                    <div style={{ marginBottom: '2rem' }}>
                      {schoolData.achievementTiers.map((tier, index) => (
                        <AchievementTierCard 
                          key={index}
                          tier={tier}
                          index={index}
                          onUpdate={(field, value) => updateAchievementTier(index, field, value)}
                        />
                      ))}
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #FFFCF5, #ADD4EA)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      border: '1px solid #ADD4EA'
                    }}>
                      <h4 style={{ 
                        color: '#223848', 
                        marginBottom: '0.5rem',
                        fontSize: 'clamp(1rem, 3vw, 1.125rem)'
                      }}>
                        🔐 Access Codes (Auto-Generated)
                      </h4>
                      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}>
                          <strong>Student Access Code:</strong> {schoolData.studentAccessCode}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Parent Quiz Code:</strong> {schoolData.parentQuizCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Submission Options */}
                {currentStep === 5 && (
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
                      {[
                        { key: 'quiz', label: '📝 Take Quiz', description: 'Parent code required, auto-graded', disabled: true },
                        { key: 'presentToTeacher', label: '🗣️ Present to Teacher', description: 'Oral presentation or discussion' },
                        { key: 'submitReview', label: '✍️ Submit Written Review', description: 'Written book review or summary' },
                        { key: 'createStoryboard', label: '🎨 Create Storyboard', description: 'Visual art or comic strip' },
                        { key: 'bookReport', label: '📚 Traditional Book Report', description: 'Formal written report' },
                        { key: 'discussWithLibrarian', label: '💬 Discussion with Librarian', description: 'One-on-one book discussion' },
                        { key: 'actOutScene', label: '🎭 Act Out Scene', description: 'Performance or dramatic reading' }
                      ].map(option => (
                        <SubmissionOptionCard 
                          key={option.key}
                          option={option}
                          isChecked={schoolData.submissionOptions[option.key]}
                          onChange={(checked) => setSchoolData(prev => ({
                            ...prev,
                            submissionOptions: {
                              ...prev.submissionOptions,
                              [option.key]: checked
                            }
                          }))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                  <div>
                    <h2 style={{
                      fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                      fontWeight: 'bold',
                      color: '#223848',
                      marginBottom: '1rem',
                      fontFamily: 'Georgia, serif'
                    }}>
                      ✅ Review & Launch
                    </h2>
                    <p style={{ 
                      color: '#ADD4EA', 
                      marginBottom: '2rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}>
                      Everything looks great! Review your configuration and launch your program.
                    </p>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      <ReviewCard
                        title="🏫 School Details"
                        items={[
                          `Name: ${schoolData.name}`,
                          `Location: ${schoolData.city}, ${schoolData.state}`,
                          `Student Code: ${schoolData.studentAccessCode}`,
                          `Parent Code: ${schoolData.parentQuizCode}`
                        ]}
                      />
                      <ReviewCard
                        title="📚 Book Selection"
                        items={[
                          `${schoolData.selectedNominees.length} of ${nominees.length} nominees selected`,
                          'Students can read any selected book',
                          'Progress tracked automatically'
                        ]}
                      />
                      <ReviewCard
                        title="🏆 Achievement Tiers"
                        items={[
                          ...schoolData.achievementTiers
                            .filter(tier => tier.type !== 'lifetime')
                            .map(tier => `${tier.books} books: ${tier.reward}`),
                          `🌟 Lifetime (${schoolData.achievementTiers.find(t => t.type === 'lifetime')?.books} books): Jesus Unlock!`
                        ]}
                      />
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #FFFCF5, #C3E0DE)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      marginTop: '2rem',
                      textAlign: 'center',
                      border: '1px solid #C3E0DE'
                    }}>
                      <h3 style={{ 
                        color: '#223848', 
                        marginBottom: '1rem',
                        fontSize: 'clamp(1.25rem, 4vw, 1.5rem)'
                      }}>
                        🎉 Ready to Launch {schoolData.name}?
                      </h3>
                      <p style={{ 
                        color: '#223848', 
                        marginBottom: '1.5rem',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                      }}>
                        Your students can now join using code: <strong>{schoolData.studentAccessCode}</strong>
                      </p>
                      <ActionButton onClick={handleSubmit} primary loading={loading}>
                        {loading ? '🚀 Saving Configuration...' : '🎊 Launch Program!'}
                      </ActionButton>
                    </div>
                  </div>
                )}
              </>
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
                  margin: 0
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Navigation - Only show for authenticated users */}
            {authData.isAuthenticated && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <ActionButton 
                  onClick={handleBack} 
                  disabled={currentStep === 2}
                  secondary
                >
                  ← Back
                </ActionButton>
                
                {currentStep < 6 && (
                  <ActionButton 
                    onClick={handleNext}
                    disabled={
                      (currentStep === 3 && schoolData.selectedNominees.length === 0)
                    }
                    primary
                  >
                    Continue →
                  </ActionButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

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
        
        {/* Cover Image */}
        {book.coverImageUrl && (
          <img 
            src={book.coverImageUrl}
            alt={`Cover of ${book.title}`}
            style={{
              width: '40px',
              height: '60px',
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
          {/* Genres */}
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
  return (
    <div style={{
      padding: '1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      background: option.disabled ? '#f9fafb' : 'white',
      opacity: option.disabled ? 0.7 : 1
    }}>
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        cursor: option.disabled ? 'not-allowed' : 'pointer'
      }}>
        <input
          type="checkbox"
          checked={isChecked}
          disabled={option.disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            marginTop: '0.25rem',
            cursor: option.disabled ? 'not-allowed' : 'pointer'
          }}
        />
        <div>
          <div style={{
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            fontWeight: '600',
            color: '#223848',
            marginBottom: '0.25rem'
          }}>
            {option.label} {option.disabled && '(Always Available)'}
          </div>
          <div style={{
            fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
            color: '#6b7280',
            lineHeight: '1.3'
          }}>
            {option.description}
          </div>
        </div>
      </label>
    </div>
  )
}

function ReviewCard({ title, items }) {
  return (
    <div style={{
      background: '#f9fafb',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{
        fontSize: 'clamp(1rem, 3vw, 1.125rem)',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '0.75rem'
      }}>
        {title}
      </h4>
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0
      }}>
        {items.map((item, index) => (
          <li key={index} style={{
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            • {item}
          </li>
        ))}
      </ul>
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
    whiteSpace: 'nowrap'
  }

  const primaryStyle = {
    ...baseStyle,
    background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
    color: 'white'
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
      {children}
    </button>
  )
}
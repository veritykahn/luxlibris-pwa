// pages/teacher/settings.js - NEW Teacher Settings Page with Year-Over-Year Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { dbHelpers, getCurrentAcademicYear } from '../../lib/firebase'

export default function TeacherSettings() {
  const router = useRouter()
  const { 
    user, 
    userProfile, 
    loading: authLoading, 
    isAuthenticated, 
    isSessionExpired, 
    signOut,
    updateLastActivity
  } = useAuth()

  const [loading, setLoading] = useState(true)
  const [phaseStatus, setPhaseStatus] = useState(null)
  const [yearOverYearStatus, setYearOverYearStatus] = useState(null)
  const [releaseStatus, setReleaseStatus] = useState(null)
  const [availableNominees, setAvailableNominees] = useState([])
  const [selectedBooksWithDetails, setSelectedBooksWithDetails] = useState([])
  const [currentConfig, setCurrentConfig] = useState({
    selectedNominees: [],
    achievementTiers: [],
    submissionOptions: {}
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return

      if (!isAuthenticated) {
        router.push('/sign-in')
        return
      }

      if (userProfile && !['teacher', 'admin'].includes(userProfile.accountType)) {
        router.push('/role-selector')
        return
      }

      if (userProfile?.accountType && ['teacher', 'admin'].includes(userProfile.accountType) && isSessionExpired()) {
        await signOut({ redirectTo: '/sign-in?reason=session-expired' })
        return
      }

      if (userProfile) {
        loadSettingsData()
      }
    }

    checkAuth()
  }, [authLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

  // Load phase status
  const loadPhaseStatus = async () => {
    try {
      const config = await dbHelpers.getSystemConfig()
      setPhaseStatus({
        currentPhase: config.programPhase || 'ACTIVE',
        academicYear: getCurrentAcademicYear()
      })
    } catch (error) {
      console.error('Error loading phase status:', error)
    }
  }

  // Load selected books details
  const loadSelectedBooksDetails = async (selectedNominees) => {
    if (!selectedNominees || selectedNominees.length === 0) {
      setSelectedBooksWithDetails([])
      return
    }

    try {
      console.log('📚 Loading details for selected books:', selectedNominees)
      
      // Use the existing dbHelpers pattern to get all available nominees
      const allNominees = await dbHelpers.getAvailableNomineesForYear()
      console.log('📖 Found', allNominees.length, 'total books from dbHelpers')
      
      // Get details for selected books
      const selectedBooksDetails = selectedNominees.map(nomineeId => {
        const book = allNominees.find(b => b.id === nomineeId)
        if (book) {
          return book
        } else {
          console.warn('Book not found for ID:', nomineeId)
          return { 
            id: nomineeId, 
            title: 'Book Not Found', 
            authors: 'Unknown',
            coverImageUrl: null 
          }
        }
      })
      
      console.log('✅ Loaded details for', selectedBooksDetails.length, 'selected books')
      setSelectedBooksWithDetails(selectedBooksDetails)
      
    } catch (error) {
      console.error('❌ Error loading book details:', error)
      setSelectedBooksWithDetails([])
    }
  }

  // Load all settings data
  const loadSettingsData = async () => {
    try {
      console.log('⚙️ Loading teacher settings...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing teacher profile data')
        setLoading(false)
        return
      }

      // Get current phase status
      await loadPhaseStatus()

      // Check year-over-year status
      const yoyStatus = await dbHelpers.checkTeacherYearOverYearStatus(
        userProfile.entityId, 
        userProfile.schoolId, 
        userProfile.uid
      )
      setYearOverYearStatus(yoyStatus)

      // Check release status
      const releaseInfo = await dbHelpers.checkTeacherReleaseStatus(
        userProfile.entityId,
        userProfile.schoolId,
        userProfile.uid
      )
      setReleaseStatus(releaseInfo)

      // Load current teacher configuration
      setCurrentConfig({
        selectedNominees: yoyStatus.teacherData.selectedNominees || [],
        achievementTiers: yoyStatus.teacherData.achievementTiers || [],
        submissionOptions: yoyStatus.teacherData.submissionOptions || {}
      })

      // Load selected books details
      await loadSelectedBooksDetails(yoyStatus.teacherData.selectedNominees || [])

      // If in TEACHER_SELECTION phase, load available nominees
      if (yoyStatus.needsYearOverYearSetup) {
        const nominees = await dbHelpers.getAvailableNomineesForYear()
        setAvailableNominees(nominees)
      }

      console.log('✅ Settings data loaded')

    } catch (error) {
      console.error('❌ Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle nominee selection
  const toggleNominee = (nomineeId) => {
    setCurrentConfig(prev => ({
      ...prev,
      selectedNominees: prev.selectedNominees.includes(nomineeId)
        ? prev.selectedNominees.filter(id => id !== nomineeId)
        : [...prev.selectedNominees, nomineeId]
    }))
  }

  // Update submission option
  const updateSubmissionOption = (key, value) => {
    setCurrentConfig(prev => ({
      ...prev,
      submissionOptions: { ...prev.submissionOptions, [key]: value }
    }))
  }

  // Update achievement tier
  const updateAchievementTier = (index, field, value) => {
    setCurrentConfig(prev => ({
      ...prev,
      achievementTiers: prev.achievementTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }))
  }

  // Calculate achievement tiers based on selected books
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

  // Auto-update achievement tiers when nominees change
  useEffect(() => {
    if (currentConfig.selectedNominees.length > 0) {
      const dynamicTiers = calculateAchievementTiers(currentConfig.selectedNominees.length)
      setCurrentConfig(prev => ({
        ...prev,
        achievementTiers: dynamicTiers
      }))
    }
  }, [currentConfig.selectedNominees])

  // Save year-over-year configuration
  const saveYearOverYearConfig = async () => {
    setIsProcessing(true)
    try {
      await dbHelpers.saveTeacherYearOverYearSelection(
        userProfile.entityId,
        userProfile.schoolId,
        userProfile.uid,
        currentConfig
      )

      setShowSuccess('✅ Configuration saved for new academic year!')
      setTimeout(() => setShowSuccess(''), 3000)

      // Reload data to reflect changes
      await loadSettingsData()

    } catch (error) {
      console.error('❌ Error saving configuration:', error)
      setShowSuccess('❌ Error saving configuration. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
    setIsProcessing(false)
  }

  // Release books to students
  const releaseToStudents = async () => {
    setIsProcessing(true)
    try {
      const result = await dbHelpers.releaseTeacherBooksToStudents(
        userProfile.entityId,
        userProfile.schoolId,
        userProfile.uid
      )

      setShowSuccess(`🚀 Books released to students! ${result.booksReleased} books now available.`)
      setTimeout(() => setShowSuccess(''), 5000)

      // Reload data to reflect changes
      await loadSettingsData()

    } catch (error) {
      console.error('❌ Error releasing to students:', error)
      setShowSuccess('❌ Error releasing to students. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
    setIsProcessing(false)
  }

  // Show loading
  if (authLoading || loading || !userProfile) {
    return (
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
            Loading settings...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile || !['teacher', 'admin'].includes(userProfile.accountType)) {
    return null
  }

  return (
    <>
      <Head>
        <title>Settings - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '80px'
      }}>

        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(195, 224, 222, 0.3)',
          padding: '1rem 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem'
            }}>
              <button
                onClick={() => router.push('/admin/school-dashboard')}
                style={{
                  backgroundColor: 'rgba(195, 224, 222, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#223848'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  Settings
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Manage your reading program
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(173, 212, 234, 0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#223848'
              }}>
                <span>{userProfile.firstName || 'Teacher'}</span>
              </div>
              <button 
                onClick={() => signOut()}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem'
        }}>

          {/* Enhanced Phase Status Display with Configuration Summary */}
          {phaseStatus && (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '2px solid #E5E7EB'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Program Status
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* Academic Year */}
                <div style={{
                  background: 'linear-gradient(135deg, #ADD4EA15, #ADD4EA25)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #ADD4EA',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#223848',
                    marginBottom: '0.25rem'
                  }}>
                    {phaseStatus.academicYear}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Academic Year
                  </div>
                </div>

                {/* Current Phase */}
                <div style={{
                  background: 'linear-gradient(135deg, #C3E0DE15, #C3E0DE25)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #C3E0DE',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {phaseStatus.currentPhase === 'ACTIVE' ? '📚' : 
                     phaseStatus.currentPhase === 'VOTING' ? '🗳️' : 
                     phaseStatus.currentPhase === 'RESULTS' ? '🏆' : 
                     phaseStatus.currentPhase === 'TEACHER_SELECTION' ? '👩‍🏫' : '📋'}
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#223848',
                    marginBottom: '0.25rem'
                  }}>
                    {phaseStatus.currentPhase === 'ACTIVE' ? 'Active Reading' : 
                     phaseStatus.currentPhase === 'VOTING' ? 'Voting Period' : 
                     phaseStatus.currentPhase === 'RESULTS' ? 'Results Available' : 
                     phaseStatus.currentPhase === 'TEACHER_SELECTION' ? 'Book Selection' : 'Setup'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Current Phase
                  </div>
                </div>
              </div>

              {/* Configuration Summary */}
              <div style={{
                background: 'linear-gradient(135deg, #EDF2F7, #E2E8F0)',
                border: '1px solid #CBD5E0',
                borderRadius: '0.75rem',
                padding: '1.25rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#2D3748',
                  margin: '0 0 0.75rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📊 Configuration Summary
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: '#4A5568'
                }}>
                  <div>
                    <strong>Books Available:</strong> {selectedBooksWithDetails.length}
                  </div>
                  <div>
                    <strong>Completion Methods:</strong> {(() => {
                      // Count enabled teacher options (excluding quiz which is always available)
                      const enabledTeacherOptions = Object.keys(currentConfig.submissionOptions || {})
                        .filter(key => key !== 'quiz' && currentConfig.submissionOptions[key]).length
                      // Add 1 for quiz (always available)
                      return enabledTeacherOptions + 1
                    })()}
                  </div>
                  <div>
                    <strong>Achievement Tiers:</strong> {currentConfig.achievementTiers?.length || 0}
                  </div>
                  <div>
                    <strong>Status:</strong> <span style={{ color: '#38A169', fontWeight: '600' }}>
                      {yearOverYearStatus?.hasCompletedThisYear ? 'Active' : 'Setup Needed'}
                    </span>
                  </div>
                </div>
                {phaseStatus.currentPhase !== 'TEACHER_SELECTION' && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#718096',
                    fontStyle: 'italic'
                  }}>
                    💡 This configuration will remain active until the Teacher Selection phase begins on May 24th. 
                    Students can read and submit books using the options above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Year-Over-Year Book Selection (during TEACHER_SELECTION phase) */}
          {yearOverYearStatus?.needsYearOverYearSetup && (
            <YearOverYearBookSelection 
              availableNominees={availableNominees}
              currentConfig={currentConfig}
              yearOverYearStatus={yearOverYearStatus}
              onToggleNominee={toggleNominee}
              onUpdateSubmissionOption={updateSubmissionOption}
              onUpdateAchievementTier={updateAchievementTier}
              onSave={saveYearOverYearConfig}
              isProcessing={isProcessing}
            />
          )}

          {/* Current Configuration Display (when not in setup) */}
          {!yearOverYearStatus?.needsYearOverYearSetup && yearOverYearStatus && (
            <CurrentConfigurationDisplay 
              config={currentConfig}
              yearOverYearStatus={yearOverYearStatus}
              releaseStatus={releaseStatus}
              onReleaseToStudents={releaseToStudents}
              isProcessing={isProcessing}
              selectedBooksWithDetails={selectedBooksWithDetails}
              teacherSubmissionOptions={currentConfig.submissionOptions}
              phaseStatus={phaseStatus}
            />
          )}

        </div>

        {/* Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '8px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard', active: false },
            { id: 'students', icon: '👥', label: 'Students', active: false },
            { id: 'submissions', icon: '📋', label: 'Submissions', active: false },
            { id: 'achievements', icon: '🏆', label: 'Achievements', active: false },
            { id: 'settings', icon: '⚙️', label: 'Settings', active: true }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'dashboard') router.push('/admin/school-dashboard')
                else router.push(`/teacher/${tab.id}`)
              }}
              style={{
                background: tab.active 
                  ? `linear-gradient(135deg, #ADD4EA15, #ADD4EA25)`
                  : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                color: tab.active ? '#ADD4EA' : '#6b7280',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <span style={{ 
                fontSize: '20px',
                filter: tab.active ? 'none' : 'opacity(0.7)'
              }}>
                {tab.icon}
              </span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: tab.active ? '600' : '500'
              }}>
                {tab.label}
              </span>
              {tab.active && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#ADD4EA',
                  borderRadius: '50%'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '85vw',
            textAlign: 'center'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}

// Year-Over-Year Book Selection Component
function YearOverYearBookSelection({ 
  availableNominees, 
  currentConfig, 
  yearOverYearStatus, 
  onToggleNominee, 
  onUpdateSubmissionOption,
  onUpdateAchievementTier,
  onSave, 
  isProcessing 
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '2px solid #10b981'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 1rem 0',
        fontFamily: 'Georgia, serif'
      }}>
        📚 Select Books for {yearOverYearStatus.currentYear}
      </h2>
      
      <div style={{
        background: '#ecfdf5',
        border: '1px solid #10b981',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <p style={{ color: '#065f46', margin: 0, fontWeight: '600' }}>
          🎯 Your program limit: {yearOverYearStatus.teacherData.selectedNominees?.length || 0} books maximum
        </p>
        <p style={{ color: '#047857', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          You can select up to this many books from the {availableNominees.length} books available for {yearOverYearStatus.currentYear}.
        </p>
      </div>

      {/* Book Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: '0 0 1rem 0'
        }}>
          📚 Select Books ({currentConfig.selectedNominees.length}/{yearOverYearStatus.teacherData.selectedNominees?.length || 0} selected)
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.75rem',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          {availableNominees.map(book => (
            <BookSelectionCard 
              key={book.id}
              book={book}
              isSelected={currentConfig.selectedNominees.includes(book.id)}
              onToggle={() => onToggleNominee(book.id)}
              disabled={
                !currentConfig.selectedNominees.includes(book.id) && 
                currentConfig.selectedNominees.length >= (yearOverYearStatus.teacherData.selectedNominees?.length || 0)
              }
            />
          ))}
        </div>
      </div>

      {/* Submission Options */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: '0 0 1rem 0'
        }}>
          📝 Book Completion Options
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
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
            <div key={option.key} style={{
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
                  checked={currentConfig.submissionOptions[option.key] || false}
                  disabled={option.disabled}
                  onChange={(e) => !option.disabled && onUpdateSubmissionOption(option.key, e.target.checked)}
                  style={{
                    marginTop: '0.25rem',
                    cursor: option.disabled ? 'not-allowed' : 'pointer'
                  }}
                />
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#223848',
                    marginBottom: '0.25rem'
                  }}>
                    {option.label} {option.disabled && '(Always Available)'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    lineHeight: '1.3'
                  }}>
                    {option.description}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Tiers */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: '0 0 1rem 0'
        }}>
          🏆 Achievement Rewards
        </h3>
        
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {currentConfig.achievementTiers.map((tier, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '1rem',
              alignItems: 'center',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  {tier.books}
                </span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                    {tier.books} book{tier.books > 1 ? 's' : ''}
                  </div>
                  {tier.type === 'lifetime' && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Multi-year goal
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={tier.reward}
                onChange={(e) => onUpdateAchievementTier(index, 'reward', e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  width: '100%',
                  background: 'white'
                }}
                placeholder="Enter reward description"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Configuration Button */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button
          onClick={onSave}
          disabled={isProcessing || currentConfig.selectedNominees.length === 0}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: (isProcessing || currentConfig.selectedNominees.length === 0) ? 0.7 : 1,
            marginRight: '1rem'
          }}
        >
          {isProcessing ? '💾 Saving...' : '💾 Save Configuration'}
        </button>
      </div>

      {/* Release to Students Button */}
      {yearOverYearStatus.hasCompletedThisYear && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #10b981',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#065f46',
            margin: '0 0 0.5rem 0'
          }}>
            🎉 Configuration Complete!
          </h4>
          <p style={{
            color: '#047857',
            margin: '0 0 1rem 0',
            fontSize: '0.875rem'
          }}>
            Your book selection and settings are saved. Go to the main Settings page to release to students.
          </p>
        </div>
      )}
    </div>
  )
}

// Enhanced Current Configuration Display Component
function CurrentConfigurationDisplay({ config, yearOverYearStatus, releaseStatus, onReleaseToStudents, isProcessing, selectedBooksWithDetails, teacherSubmissionOptions, phaseStatus }) {
  
  // Get enabled submission options with descriptions
  const getSubmissionOptionsDisplay = () => {
    const options = [
      { key: 'quiz', label: '📝 Take Quiz', description: 'Parent code required, auto-graded', enabled: true, note: 'Always Available' },
      { key: 'presentToTeacher', label: '🗣️ Present to Teacher', description: 'Oral presentation or discussion' },
      { key: 'submitReview', label: '✍️ Submit Written Review', description: 'Written book review or summary' },
      { key: 'createStoryboard', label: '🎨 Create Storyboard', description: 'Visual art or comic strip' },
      { key: 'bookReport', label: '📚 Traditional Book Report', description: 'Formal written report' },
      { key: 'discussWithLibrarian', label: '💬 Discussion with Librarian', description: 'One-on-one book discussion' },
      { key: 'actOutScene', label: '🎭 Act Out Scene', description: 'Performance or dramatic reading' }
    ];

    return options.filter(option => 
      option.enabled || teacherSubmissionOptions?.[option.key]
    );
  };

  const enabledSubmissionOptions = getSubmissionOptionsDisplay();

  // Check if we're in a "locked" phase (not TEACHER_SELECTION)
  const isConfigurationLocked = phaseStatus?.currentPhase !== 'TEACHER_SELECTION';

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: 0,
          fontFamily: 'Georgia, serif'
        }}>
          {isConfigurationLocked ? '📋 Current Year Configuration' : '⚙️ Current Configuration'}
        </h2>
        
        {isConfigurationLocked && (
          <div style={{
            background: '#E5E7EB',
            color: '#374151',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🔒 Read Only
          </div>
        )}
      </div>

      {isConfigurationLocked ? (
        // ENHANCED READ-ONLY DISPLAY for ACTIVE/VOTING/RESULTS phases
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Phase Status Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #C3E0DE20, #A1E5DB20)',
            border: '2px solid #C3E0DE60',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#223848',
              margin: '0 0 0.5rem 0'
            }}>
              📅 Academic Year {yearOverYearStatus?.currentYear || '2025-26'}
            </h3>
            <p style={{
              color: '#6B7280',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Configuration is active and cannot be changed until Teacher Selection phase (May 24th)
            </p>
          </div>

          {/* Selected Books Display */}
          <div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#223848',
              margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📚 Selected Books ({selectedBooksWithDetails.length})
            </h3>
            
            {selectedBooksWithDetails.length === 0 ? (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <p style={{ color: '#DC2626', margin: 0 }}>
                  No books configured for this year
                </p>
              </div>
            ) : (
              <div style={{
                background: '#F9FAFB',
                borderRadius: '0.75rem',
                padding: '1rem',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {selectedBooksWithDetails.map((book, index) => (
                    <div
                      key={book.id}
                      style={{
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '60px',
                        background: '#F3F4F6',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {book.coverImageUrl ? (
                          <img
                            src={book.coverImageUrl}
                            alt={book.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '0.25rem'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span>📚</span>
                        )}
                        <span style={{ display: book.coverImageUrl ? 'none' : 'block' }}>📚</span>
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          color: '#1F2937',
                          margin: '0 0 0.25rem 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {book.title}
                        </h4>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          margin: '0 0 0.25rem 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          by {book.authors}
                        </p>
                        {book.genres && (
                          <p style={{
                            fontSize: '0.6875rem',
                            color: '#9CA3AF',
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
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Options Display */}
          <div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#223848',
              margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📝 Book Completion Options ({enabledSubmissionOptions.length})
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.75rem'
            }}>
              {enabledSubmissionOptions.map(option => (
                <div key={option.key} style={{
                  padding: '1rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: option.note ? '#F0FDF4' : 'white',
                  opacity: 1
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      flexShrink: 0,
                      marginTop: '0.125rem'
                    }}>
                      ✓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#223848',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {option.label} 
                        {option.note && (
                          <span style={{
                            fontSize: '0.6875rem',
                            background: '#E5E7EB',
                            color: '#374151',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem'
                          }}>
                            {option.note}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        lineHeight: '1.3'
                      }}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Tiers Display */}
          {config.achievementTiers && config.achievementTiers.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#223848',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏆 Achievement Rewards ({config.achievementTiers.length})
              </h3>
              
              <div style={{
                background: '#F9FAFB',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {config.achievementTiers.map((tier, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.125rem'
                        }}>
                          {tier.books}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '0.875rem' }}>
                            {tier.books} book{tier.books > 1 ? 's' : ''}
                          </div>
                          {tier.type === 'lifetime' && (
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic' }}>
                              Multi-year goal
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{
                        padding: '0.75rem',
                        background: '#F8FAFC',
                        borderRadius: '0.5rem',
                        border: '1px solid #E2E8F0'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {tier.reward}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // EXISTING INTERACTIVE DISPLAY for TEACHER_SELECTION phase
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Configuration Status */}
          <div style={{
            background: yearOverYearStatus?.hasCompletedThisYear ? '#ecfdf5' : '#fef3c7',
            border: `1px solid ${yearOverYearStatus?.hasCompletedThisYear ? '#10b981' : '#f59e0b'}`,
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{ 
              color: yearOverYearStatus?.hasCompletedThisYear ? '#065f46' : '#92400e', 
              margin: 0, 
              fontWeight: '600' 
            }}>
              {yearOverYearStatus?.hasCompletedThisYear ? 
                `✅ Configuration complete for ${yearOverYearStatus.currentYear}` :
                `⏳ Configuration not yet set for ${yearOverYearStatus.currentYear}`
              }
            </p>
          </div>

          {/* Release Status and Button */}
          {yearOverYearStatus?.hasCompletedThisYear && releaseStatus && (
            <div style={{
              background: releaseStatus.hasReleased ? '#ecfdf5' : '#fef3c7',
              border: `1px solid ${releaseStatus.hasReleased ? '#10b981' : '#f59e0b'}`,
              borderRadius: '0.5rem',
              padding: '1.5rem'
            }}>
              {releaseStatus.hasReleased ? (
                // Already Released
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#065f46',
                    margin: '0 0 0.5rem 0'
                  }}>
                    🎉 Books Released to Students!
                  </h4>
                  <p style={{
                    color: '#047857',
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem'
                  }}>
                    {releaseStatus.booksCount} books are now available to your students for {releaseStatus.academicYear}.
                  </p>
                  {releaseStatus.releaseDate && (
                    <p style={{
                      color: '#065f46',
                      margin: 0,
                      fontSize: '0.75rem',
                      fontStyle: 'italic'
                    }}>
                      Released on: {new Date(releaseStatus.releaseDate.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : releaseStatus.canRelease ? (
                // Can Release
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#92400e',
                    margin: '0 0 0.5rem 0'
                  }}>
                    📚 Ready to Release Books?
                  </h4>
                  <p style={{
                    color: '#b45309',
                    margin: '0 0 1rem 0',
                    fontSize: '0.875rem'
                  }}>
                    Your {releaseStatus.booksCount} selected books are ready. Release them to make them available to your students.
                  </p>
                  <button
                    onClick={onReleaseToStudents}
                    disabled={isProcessing}
                    style={{
                      padding: '1rem 2rem',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: isProcessing ? 0.7 : 1
                    }}
                  >
                    {isProcessing ? '🚀 Releasing...' : '🚀 Release to Students'}
                  </button>
                </div>
              ) : (
                // Cannot Release
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#92400e',
                    margin: '0 0 0.5rem 0'
                  }}>
                    ⏳ Configuration Needed
                  </h4>
                  <p style={{
                    color: '#b45309',
                    margin: 0,
                    fontSize: '0.875rem'
                  }}>
                    Complete your book selection and configuration before releasing to students.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Book Selection Card Component
function BookSelectionCard({ book, isSelected, onToggle, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        border: isSelected ? '2px solid #10b981' : '2px solid #e5e7eb',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : (isSelected ? 1 : 0.7)
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: isSelected ? '#10b981' : (disabled ? '#d1d5db' : '#e5e7eb'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSelected ? 'white' : '#6b7280',
          fontSize: '10px',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          {isSelected ? '✓' : ''}
        </div>
        
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
            fontSize: '0.875rem',
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
            fontSize: '0.75rem',
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
              fontSize: '0.75rem',
              color: '#A1E5DB',
              margin: '0',
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
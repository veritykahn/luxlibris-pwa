// pages/god-mode/phases.js - PHASE MANAGEMENT
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db, dbHelpers } from '../../lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

export default function PhasesManagement() {
  const [phaseData, setPhaseData] = useState({
    currentPhase: 'SETUP',
    academicYear: '2025-26',
    teachersSelected: 0,
    totalTeachers: 0,
    teachersReleased: 0,
    studentsActive: 0,
    lastUpdated: null
  })
  const [phaseLoading, setPhaseLoading] = useState(false)

  // Load current phase data and teacher stats
  const loadPhaseData = async () => {
    try {
      setPhaseLoading(true)
      
      // Get system config
      const config = await dbHelpers.getSystemConfig()
      const currentYear = dbHelpers.getCurrentAcademicYear()
      
      // Count teacher progress across all entities
      let totalTeachers = 0
      let teachersSelected = 0
      let teachersReleased = 0
      let studentsActive = 0
      
      // Check entities collection (dioceses/ISDs)
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            try {
              const teachersRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/teachers`)
              const teachersSnapshot = await getDocs(teachersRef)
              
              teachersSnapshot.forEach(teacherDoc => {
                const teacherData = teacherDoc.data()
                
                // Only count teachers for current academic year
                if (teacherData.academicYear === currentYear || teacherData.onboardingAcademicYear === currentYear) {
                  totalTeachers++
                  
                  // Check if teacher has selected books
                  if (teacherData.selectedNominees && teacherData.selectedNominees.length > 0) {
                    teachersSelected++
                  }
                  
                  // Check if teacher has released to students
                  if (teacherData.releasedToStudents) {
                    teachersReleased++
                  }
                }
              })
              
              // Count students in this school
              const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`)
              const studentsSnapshot = await getDocs(studentsRef)
              studentsActive += studentsSnapshot.size
              
            } catch (teacherError) {
              console.log('No teachers in school:', schoolDoc.id)
            }
          }
        } catch (schoolError) {
          console.log('No schools in entity:', entityDoc.id)
        }
      }
      
      // Also check direct schools collection (single schools)
      const directSchoolsRef = collection(db, 'schools')
      const directSchoolsSnapshot = await getDocs(directSchoolsRef)
      
      for (const schoolDoc of directSchoolsSnapshot.docs) {
        const schoolData = schoolDoc.data()
        if (schoolData.type === 'single_school') {
          // For single schools, count the school itself as having 1 "teacher" (principal)
          totalTeachers++
          if (schoolData.selectedNominees && schoolData.selectedNominees.length > 0) {
            teachersSelected++
          }
          if (schoolData.releasedToStudents) {
            teachersReleased++
          }
          studentsActive += schoolData.studentCount || 0
        }
      }
      
      setPhaseData({
        currentPhase: config.programPhase || 'SETUP',
        academicYear: currentYear,
        teachersSelected,
        totalTeachers,
        teachersReleased,
        studentsActive,
        lastUpdated: new Date()
      })
      
      console.log('✅ Phase data loaded:', {
        phase: config.programPhase,
        year: currentYear,
        teachers: `${teachersSelected}/${totalTeachers}`,
        released: teachersReleased,
        students: studentsActive
      })
      
    } catch (error) {
      console.error('❌ Error loading phase data:', error)
      alert('Error loading phase data: ' + error.message)
    }
    setPhaseLoading(false)
  }

  // Check phases now function
  const checkPhasesNow = async () => {
    setPhaseLoading(true)
    try {
      console.log('🔍 Manually checking phases...')
      
      // Run the automatic phase checking function
      const result = await dbHelpers.checkAndUpdatePhasesWithClearing()
      
      if (result.updated) {
        alert(`✅ PHASE AUTOMATICALLY UPDATED!\n🔄 Phase changed: ${result.oldPhase} → ${result.newPhase}\n📅 Based on current date and system rules\n🎯 System is now synchronized`)
      } else {
        alert(`✅ PHASES CHECKED - NO CHANGES NEEDED\n📊 Current phase: ${result.currentPhase}\n📅 System is already synchronized with current dates\n🎯 No automatic transitions required at this time\n${result.error ? `⚠️ Note: ${result.error}` : ''}`)
      }
      
      // Reload phase data to reflect any changes
      await loadPhaseData()
      
    } catch (error) {
      console.error('❌ Error checking phases:', error)
      alert('Error checking phases: ' + error.message)
    }
    setPhaseLoading(false)
  }

  // Release nominees to teachers (SETUP → TEACHER_SELECTION)
  const releaseNomineesToTeachers = async () => {
    const confirmed = window.confirm(`🚀 RELEASE NOMINEES TO TEACHERS?\n\nThis will:\n• Change program phase to TEACHER_SELECTION\n• Allow ALL teachers to see and select ${dbHelpers.getCurrentAcademicYear()} books\n• Send notification to teachers that new books are available\n\nTeachers can then select their books and release to students individually.\n\nContinue?`)

    if (!confirmed) return

    try {
      setPhaseLoading(true)
      
      // Update system phase
      await dbHelpers.updateProgramPhase('TEACHER_SELECTION')
      
      // Reload phase data
      await loadPhaseData()
      
      alert(`✅ SUCCESS!\n\n📚 Nominees released to teachers for ${dbHelpers.getCurrentAcademicYear()}\n🎯 Phase: TEACHER_SELECTION\n👩‍🏫 ${phaseData.totalTeachers} teachers can now select books\n\nNext steps:\n1. Teachers select their books for this year\n2. Teachers individually release to their students\n3. Program becomes ACTIVE when students start reading`)
      
    } catch (error) {
      console.error('❌ Error releasing nominees:', error)
      alert('Error releasing nominees: ' + error.message)
    }
    setPhaseLoading(false)
  }

  // Force start voting period (ACTIVE → VOTING)
  const forceStartVoting = async () => {
    const confirmed = window.confirm(`🗳️ START VOTING PERIOD?\n\nThis will:\n• End the reading period (no new book submissions)\n• Start the voting period for students\n• Change phase to VOTING\n\nNormally this happens automatically on March 31st.\n\nContinue?`)

    if (!confirmed) return

    try {
      setPhaseLoading(true)
      
      await dbHelpers.updateProgramPhase('VOTING')
      await loadPhaseData()
      
      alert(`✅ VOTING PERIOD STARTED!\n\n🗳️ Students can now vote for their favorite books\n📅 Voting ends April 14th\n🏆 Results will be announced April 15th`)
      
    } catch (error) {
      console.error('❌ Error starting voting:', error)
      alert('Error starting voting: ' + error.message)
    }
    setPhaseLoading(false)
  }

  // Start new academic year and start new setup
  const startNewAcademicYear = async () => {
    const nextYear = getNextAcademicYear()
    
    const confirmed = window.confirm(`📅 START NEW ACADEMIC YEAR?\n\nThis will:\n• End current year (${phaseData.academicYear})\n• Start new year (${nextYear})\n• Change phase to SETUP\n• Reset teacher selections for new year\n\nThis should only be done in June when new nominees are ready.\n\nContinue?`)

    if (!confirmed) return

    try {
      setPhaseLoading(true)
      
      // Update system to new academic year
      await dbHelpers.updateProgramPhase('SETUP')
      
      // Update academic year in system config
      const systemConfigRef = doc(db, 'systemConfig', 'current')
      await updateDoc(systemConfigRef, {
        currentAcademicYear: nextYear,
        programPhase: 'SETUP',
        lastModified: new Date()
      })
      
      await loadPhaseData()
      
      alert(`✅ NEW ACADEMIC YEAR STARTED!\n\n📅 Academic Year: ${nextYear}\n📝 Phase: SETUP\n🎯 Ready for new masterNominees upload\n\nNext steps:\n1. Upload new masterNominees for ${nextYear}\n2. Release nominees to teachers\n3. Teachers select and release to students`)
      
    } catch (error) {
      console.error('❌ Error starting new year:', error)
      alert('Error starting new academic year: ' + error.message)
    }
    setPhaseLoading(false)
  }

  // Release new academic year to teachers with student data reset
  const releaseNewYearToTeachers = async () => {
    const confirmed = window.confirm(`🚀 RELEASE NEW ACADEMIC YEAR TO TEACHERS?\n\nThis will:\n• Change phase: RESULTS → SETUP → TEACHER_SELECTION\n• 📚 CLEAR all manual student book data to 0 during SETUP\n• Allow teachers to select their books for ${getNextAcademicYear()}\n• Teachers can modify submission options and achievements\n• Teachers can deactivate students who left school\n\nPrerequisites:\n✅ New masterNominees uploaded for ${getNextAcademicYear()}\n✅ Quizzes and content ready\n✅ System currently in RESULTS phase\n\n⚠️ Manual student data will be cleared during SETUP phase!\n\nContinue?`)

    if (!confirmed) return

    try {
      setPhaseLoading(true)
      
      // Use the enhanced function that includes student data reset
      const result = await dbHelpers.releaseNewYearToTeachersWithReset()
      
      // Reload phase data
      await loadPhaseData()
      
      alert(`✅ SUCCESS! New academic year released to teachers!\n\n🎯 Phase: TEACHER_SELECTION\n📅 Academic Year: ${getNextAcademicYear()}\n👩‍🏫 Teachers can now select their books (limited to original count)\n📚 Manual student data cleared during SETUP: ${result.studentsReset} students reset\n\nProcess completed:\n1. ✅ RESULTS → SETUP (student data cleared)\n2. ✅ SETUP → TEACHER_SELECTION (teachers can select)\n\nTeacher Selection Period: May 24 - June 1\n• Teachers select new nominees (within their limit)\n• Teachers can modify submission options\n• Teachers can adjust achievement rewards\n• Teachers can deactivate students who left\n• Manual students start with 0 books for new year\n\nSystem will auto-switch to ACTIVE on June 1st.`)
      
    } catch (error) {
      console.error('❌ Error releasing new year:', error)
      alert(`❌ Error: ${error.message}`)
    }
    setPhaseLoading(false)
  }

  // Helper function to get next academic year
  const getNextAcademicYear = () => {
    const current = dbHelpers.getCurrentAcademicYear()
    const [startYear] = current.split('-')
    const nextStart = parseInt(startYear) + 1
    const nextEnd = (nextStart + 1).toString().slice(-2)
    return `${nextStart}-${nextEnd}`
  }

  // Get phase display info
  const getPhaseInfo = (phase) => {
    const phases = {
      SETUP: {
        icon: '📝',
        name: 'Setup',
        description: 'Nominees uploaded, waiting to release to teachers',
        color: '#f59e0b',
        actions: ['Release nominees to teachers', 'Upload new book nominees'],
        nextPhase: 'TEACHER_SELECTION'
      },
      TEACHER_SELECTION: {
        icon: '👩‍🏫',
        name: 'Teacher Selection',
        description: 'Teachers selecting books for their students',
        color: '#3b82f6',
        actions: ['Monitor teacher progress', 'Send reminders to teachers'],
        nextPhase: 'ACTIVE'
      },
      ACTIVE: {
        icon: '📚',
        name: 'Active Reading',
        description: 'Students reading and submitting books',
        color: '#10b981',
        actions: ['Monitor student activity', 'View reading statistics'],
        nextPhase: 'VOTING'
      },
      VOTING: {
        icon: '🗳️',
        name: 'Voting Period',
        description: 'Students voting for favorite books (Mar 31 - Apr 14)',
        color: '#8b5cf6',
        actions: ['View voting results', 'Announce winners'],
        nextPhase: 'RESULTS'
      },
      RESULTS: {
        icon: '🏆',
        name: 'Results',
        description: 'Winners announced, preparing for next year',
        color: '#f59e0b',
        actions: ['Generate reports', 'Prepare for next year'],
        nextPhase: 'SETUP'
      },
      CLOSED: {
        icon: '❄️',
        name: 'Closed',
        description: 'Between academic years',
        color: '#6b7280',
        actions: ['Maintenance mode'],
        nextPhase: 'SETUP'
      }
    }
    
    return phases[phase] || phases.SETUP
  }

  // Initialize on mount
  useEffect(() => {
    loadPhaseData()
  }, [])

  return (
    <GodModeAuth pageName="Phase Management">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Phase Management - God Mode</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Phase Control"
              icon="🎯"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Main Phase Status Card */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(16, 185, 129, 0.5)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    fontFamily: 'Georgia, serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🎯 Academic Year Control Center
                  </h2>
                  <button
                    onClick={loadPhaseData}
                    disabled={phaseLoading}
                    style={{
                      background: phaseLoading ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: phaseLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {phaseLoading ? '⏳ Loading...' : '🔄 Refresh Data'}
                  </button>
                </div>

                {/* Current Status Display */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  {/* Current Phase */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: `2px solid ${getPhaseInfo(phaseData.currentPhase).color}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {getPhaseInfo(phaseData.currentPhase).icon}
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {getPhaseInfo(phaseData.currentPhase).name}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#c084fc'
                    }}>
                      {getPhaseInfo(phaseData.currentPhase).description}
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '2px solid #3b82f6',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {phaseData.academicYear}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#c084fc'
                    }}>
                      Current Academic Year
                    </div>
                  </div>

                  {/* Teacher Progress */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '2px solid #8b5cf6',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👩‍🏫</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {phaseData.teachersSelected}/{phaseData.totalTeachers}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#c084fc'
                    }}>
                      Teachers Selected Books
                    </div>
                  </div>

                  {/* Student Activity */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '2px solid #f59e0b',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {phaseData.studentsActive}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#c084fc'
                    }}>
                      Active Students
                    </div>
                  </div>
                </div>

                {/* Phase Control Buttons */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '1rem',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🎛️ Phase Controls
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    
                    {/* Release to Teachers Button */}
                    {phaseData.currentPhase === 'SETUP' && (
                      <button
                        onClick={releaseNomineesToTeachers}
                        disabled={phaseLoading}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: phaseLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}
                      >
                        🚀 Release Nominees to Teachers
                      </button>
                    )}

                    {/* Force Start Voting Button */}
                    {phaseData.currentPhase === 'ACTIVE' && (
                      <button
                        onClick={forceStartVoting}
                        disabled={phaseLoading}
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: phaseLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}
                      >
                        🗳️ Force Start Voting Period
                      </button>
                    )}

                    {/* Clear Student Data and Move to Teacher Selection */}
                    {phaseData.currentPhase === 'RESULTS' && (
                      <button
                        onClick={async () => {
                          const confirmed = window.confirm(`🗑️ CLEAR ALL STUDENT DATA & START TEACHER SELECTION?\n\nThis will:\n- Clear all student bookshelves, badges, and votes\n- Preserve saints, streaks, and lifetime XP\n- Move phase to TEACHER_SELECTION\n- Allow teachers to select new books\n\n⚠️ Student data will be cleared for ALL students!\nBragging rights certificates will no longer be available.\n\nContinue?`)
                          
                          if (!confirmed) return
                          
                          try {
                            setPhaseLoading(true)
                            
                            // Import the function
                            const { transitionToTeacherSelectionWithClearing } = await import('../../lib/firebase')
                            
                            // Clear student data and transition phase
                            const result = await transitionToTeacherSelectionWithClearing()
                            
                            // Reload phase data
                            await loadPhaseData()
                            
                            alert(`✅ SUCCESS!\n\n🗑️ Student data cleared for ${result.studentsCleared} students\n🎯 Phase: TEACHER_SELECTION\n👩‍🏫 Teachers can now select books for new academic year\n\nNext steps:\n1. Teachers select their books (May 24 - June 1)\n2. System auto-switches to ACTIVE on June 1st\n3. Students start fresh with clean slate`)
                            
                          } catch (error) {
                            console.error('❌ Error clearing student data:', error)
                            alert('Error clearing student data: ' + error.message)
                          }
                          setPhaseLoading(false)
                        }}
                        disabled={phaseLoading}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: phaseLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}
                      >
                        🗑️ Clear Student Data & Start Teacher Selection
                      </button>
                    )}

                    {/* Start New Academic Year Button (fallback) */}
                    {phaseData.currentPhase === 'CLOSED' && (
                      <button
                        onClick={startNewAcademicYear}
                        disabled={phaseLoading}
                        style={{
                          background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: phaseLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}
                      >
                        📅 Manual Start New Year
                      </button>
                    )}

                    {/* Check Phases Now Button */}
                    <button
                      onClick={checkPhasesNow}
                      disabled={phaseLoading}
                      style={{
                        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: phaseLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}
                    >
                      🔍 Check Phases Now
                    </button>

                    {/* Always Available: Generate Report */}
                    <button
                      onClick={() => alert('📊 Annual report generation coming soon!')}
                      disabled={phaseLoading}
                      style={{
                        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: phaseLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}
                    >
                      📊 Generate Annual Report
                    </button>
                  </div>

                  {/* Phase Information */}
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.5rem'
                    }}>
                      ℹ️ Current Phase: {getPhaseInfo(phaseData.currentPhase).name}
                    </h4>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#c084fc',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {getPhaseInfo(phaseData.currentPhase).description}
                      {phaseData.lastUpdated && (
                        <span style={{ display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          Last updated: {phaseData.lastUpdated.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phase Timeline */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  📅 Academic Year Timeline
                </h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  padding: '2rem 1rem',
                  overflowX: 'auto'
                }}>
                  {/* Timeline Line */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '2rem',
                    right: '2rem',
                    height: '2px',
                    background: 'linear-gradient(90deg, #f59e0b, #3b82f6, #10b981, #8b5cf6, #f59e0b)',
                    zIndex: 0
                  }} />
                  
                  {/* Phase Nodes */}
                  {['SETUP', 'TEACHER_SELECTION', 'ACTIVE', 'VOTING', 'RESULTS'].map((phase, index) => {
                    const phaseInfo = getPhaseInfo(phase)
                    const isCurrentPhase = phase === phaseData.currentPhase
                    
                    return (
                      <div
                        key={phase}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                          zIndex: 1,
                          minWidth: '120px'
                        }}
                      >
                        <div style={{
                          width: isCurrentPhase ? '3rem' : '2rem',
                          height: isCurrentPhase ? '3rem' : '2rem',
                          background: isCurrentPhase 
                            ? `linear-gradient(135deg, ${phaseInfo.color}, ${phaseInfo.color}dd)`
                            : 'rgba(0, 0, 0, 0.7)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isCurrentPhase ? '1.5rem' : '1rem',
                          border: isCurrentPhase 
                            ? `3px solid ${phaseInfo.color}`
                            : '2px solid rgba(168, 85, 247, 0.3)',
                          marginBottom: '0.5rem',
                          animation: isCurrentPhase ? 'pulse 2s infinite' : 'none'
                        }}>
                          {phaseInfo.icon}
                        </div>
                        <div style={{
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          color: isCurrentPhase ? phaseInfo.color : '#a78bfa',
                          fontWeight: isCurrentPhase ? 'bold' : 'normal'
                        }}>
                          {phaseInfo.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Phase Dates */}
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(168, 85, 247, 0.2)'
                }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '0.5rem'
                  }}>
                    📅 Key Dates for {phaseData.academicYear}
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#c084fc'
                  }}>
                    <div>• <strong>June 1:</strong> Program Starts (ACTIVE)</div>
                    <div>• <strong>March 31:</strong> Reading Ends, Voting Begins</div>
                    <div>• <strong>April 14:</strong> Voting Ends</div>
                    <div>• <strong>April 15:</strong> Winners Announced</div>
                    <div>• <strong>May 24-June 1:</strong> Teacher Selection</div>
                  </div>
                </div>
              </div>

              {/* Available Actions */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  ⚡ Available Actions for {getPhaseInfo(phaseData.currentPhase).name} Phase
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {getPhaseInfo(phaseData.currentPhase).actions.map((action, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'rgba(168, 85, 247, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '1px solid rgba(168, 85, 247, 0.3)'
                      }}
                    >
                      <div style={{
                        color: getPhaseInfo(phaseData.currentPhase).color,
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        ✓ {action}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#fcd34d'
                  }}>
                    ➡️ Next Phase: <strong>{getPhaseInfo(phaseData.currentPhase).nextPhase}</strong>
                  </span>
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.1);
                  opacity: 0.8;
                }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  )
}
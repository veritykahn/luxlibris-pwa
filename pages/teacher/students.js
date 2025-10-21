// pages/teacher/students.js - Streamlined Students Hub with Tab Navigation
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePhaseAccess } from '../../hooks/usePhaseAccess'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

// Import tab components
import OverviewTab from '../../components/teacher/OverviewTab'
import GradeTab from '../../components/teacher/GradeTab'
import HistoricalTab from '../../components/teacher/HistoricalTab'
import VotingTab from '../../components/teacher/VotingTab'

export default function TeacherStudents() {
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

  const { 
    phaseData, 
    permissions, 
    hasAccess, 
    getPhaseMessage, 
    getPhaseInfo,
    refreshPhase,
    isLoading: phaseLoading 
  } = usePhaseAccess(userProfile)

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'app', 'manual'
  const [searchTerm, setSearchTerm] = useState('')
  
  // Student data
  const [appStudents, setAppStudents] = useState([])
  const [manualStudents, setManualStudents] = useState([])
  const [teacherNominees, setTeacherNominees] = useState([])
  const [teacherSubmissionOptions, setTeacherSubmissionOptions] = useState({})
  
  // Stats
  const [statsData, setStatsData] = useState({
    totalAppStudents: 0,
    totalManualStudents: 0,
    totalBooks: 0,
    activeStudents: 0,
    byGrade: {}
  })

  // Submission count for badge
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0)

  // Session timeout
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading || phaseLoading) return

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
        loadTeacherConfiguration()
        loadStudentsData()
        loadPendingSubmissions()
      }
    }

    checkAuth()
  }, [authLoading, phaseLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

  // Load pending submissions count
  const loadPendingSubmissions = async () => {
    try {
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        return
      }

      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) return

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherId = teacherDoc.id

      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsQuery = query(appStudentsRef, where('currentTeacherId', '==', teacherId))
      const appStudentsSnapshot = await getDocs(appStudentsQuery)
      
      let count = 0
      appStudentsSnapshot.forEach(studentDoc => {
        const studentData = studentDoc.data()
        if (studentData.bookshelf && Array.isArray(studentData.bookshelf)) {
          studentData.bookshelf.forEach(book => {
            if (book.status === 'pending_approval') {
              count++
            }
          })
        }
      })

      setPendingSubmissionsCount(count)
    } catch (error) {
      console.error('Error loading pending submissions:', error)
    }
  }

  // Load teacher configuration
  const loadTeacherConfiguration = async () => {
    try {
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('Missing teacher profile data')
        return
      }

      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        console.error('Teacher document not found')
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherData = teacherDoc.data()
      
      const selectedNomineeIds = teacherData.selectedNominees || []
      
      if (selectedNomineeIds.length > 0) {
        const masterNomineesRef = collection(db, 'masterNominees')
        const masterNomineesSnapshot = await getDocs(masterNomineesRef)
        
        const nominees = []
        masterNomineesSnapshot.forEach(doc => {
          const bookData = doc.data()
          if (selectedNomineeIds.includes(bookData.id)) {
            nominees.push({
              id: bookData.id,
              ...bookData
            })
          }
        })
        
        setTeacherNominees(nominees)
      }

      const submissionOptions = teacherData.submissionOptions || {}
      setTeacherSubmissionOptions(submissionOptions)

    } catch (error) {
      console.error('Error loading teacher configuration:', error)
    }
  }

  // Load students data
  const loadStudentsData = async () => {
    try {
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        setLoading(false)
        return
      }

      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        setLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherId = teacherDoc.id

      // Load app students
      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsQuery = query(appStudentsRef, where('currentTeacherId', '==', teacherId))
      const appStudentsSnapshot = await getDocs(appStudentsQuery)
      
      const appStudentsData = []
      appStudentsSnapshot.forEach(doc => {
        const studentData = { id: doc.id, ...doc.data() }
        if (studentData.status !== 'deleted') {
          appStudentsData.push(studentData)
        }
      })
      appStudentsData.sort((a, b) => a.firstName.localeCompare(b.firstName))

      // Load manual students
      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      let manualStudentsSnapshot = { docs: [] }
      
      try {
        manualStudentsSnapshot = await getDocs(manualStudentsRef)
      } catch (error) {
        console.log('No manual students collection yet')
      }

      const manualStudentsData = []
      manualStudentsSnapshot.forEach(doc => {
        manualStudentsData.push({ id: doc.id, ...doc.data() })
      })
      manualStudentsData.sort((a, b) => a.firstName.localeCompare(b.firstName))

      // Calculate stats
      const byGrade = {}
      for (let grade = 4; grade <= 8; grade++) {
        const gradeApp = appStudentsData.filter(s => parseInt(s.grade) === grade)
        const gradeManual = manualStudentsData.filter(s => parseInt(s.grade) === grade)
        byGrade[grade] = {
          app: gradeApp.length,
          manual: gradeManual.length,
          total: gradeApp.length + gradeManual.length,
          books: gradeApp.reduce((sum, s) => sum + (s.booksSubmittedThisYear || 0), 0) +
                 gradeManual.reduce((sum, s) => sum + (s.totalBooksThisYear || 0), 0)
        }
      }

      const totalBooks = appStudentsData.reduce((sum, student) => 
        sum + (student.booksSubmittedThisYear || 0), 0
      ) + manualStudentsData.reduce((sum, student) => 
        sum + (student.totalBooksThisYear || 0), 0
      )

      const activeAppStudents = appStudentsData.filter(s => s.status !== 'inactive').length
      const activeManualStudents = manualStudentsData.filter(s => s.status !== 'inactive').length

      setAppStudents(appStudentsData)
      setManualStudents(manualStudentsData)
      setStatsData({
        totalAppStudents: appStudentsData.length,
        totalManualStudents: manualStudentsData.length,
        totalBooks,
        activeStudents: activeAppStudents + activeManualStudents,
        byGrade
      })

    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Session management
  useEffect(() => {
    if (!userProfile?.accountType || !['teacher', 'admin'].includes(userProfile.accountType)) return

    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        signOut({ redirectTo: '/sign-in?reason=session-expired' })
      } else {
        const warningTime = 55 * 60 * 1000
        const timeLeft = warningTime - (Date.now() - (parseInt(localStorage.getItem('luxlibris_last_activity')) || Date.now()))
        
        if (timeLeft <= 0 && timeLeft > -60000) {
          setShowTimeoutWarning(true)
        }
      }
    }, 60000)

    return () => clearInterval(sessionCheckInterval)
  }, [userProfile, isSessionExpired, signOut])

  const handleUserActivity = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  useEffect(() => {
    document.addEventListener('click', handleUserActivity)
    document.addEventListener('keypress', handleUserActivity)

    return () => {
      document.removeEventListener('click', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [])

  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
  }

  // Loading state
  if (authLoading || loading || phaseLoading || !userProfile) {
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
          <p style={{ 
            color: '#223848', 
            fontSize: '1.1rem',
            fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
          }}>
            Loading students...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile || !['teacher', 'admin'].includes(userProfile.accountType)) {
    return null
  }

  // Tab configuration - ALL GRADES ALWAYS VISIBLE
  const tabs = [
    { id: 'overview', label: '📊 Overview', show: true },
    { id: 'grade4', label: '4️⃣ Grade 4', show: true },
    { id: 'grade5', label: '5️⃣ Grade 5', show: true },
    { id: 'grade6', label: '6️⃣ Grade 6', show: true },
    { id: 'grade7', label: '7️⃣ Grade 7', show: true },
    { id: 'grade8', label: '8️⃣ Grade 8', show: true },
    { id: 'historical', label: '🏆 Historical', show: true },
    { id: 'voting', label: '🗳️ Voting', show: permissions.currentPhase === 'VOTING' }
  ].filter(tab => tab.show)

  return (
    <>
      <Head>
        <title>My Students - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        paddingBottom: '80px'
      }}>

        {/* Session Timeout Warning Modal */}
        {showTimeoutWarning && (
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
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏰</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Session Expiring Soon
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.4',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                Your session will expire in a few minutes for security. Continue working?
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleTimeoutSignOut}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  Sign Out
                </button>
                <button
                  onClick={extendSession}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  Continue Working
                </button>
              </div>
            </div>
          </div>
        )}

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
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  My Students
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}>
                  {statsData.totalAppStudents + statsData.totalManualStudents} students • {statsData.totalBooks} books
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
                color: '#223848',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
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
                  cursor: 'pointer',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Phase Status Bar */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 0',
          position: 'sticky',
          top: '73px',
          zIndex: 99
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
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>{getPhaseInfo().icon}</span>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#223848',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {getPhaseInfo().name} Mode
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                • {getPhaseMessage()}
              </span>
            </div>
            <button
              onClick={refreshPhase}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: '123px',
          zIndex: 98,
          overflowX: 'auto'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            gap: '0.25rem',
            paddingTop: '0.5rem'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #ADD4EA, #C3E0DE)' : 'transparent',
                  color: activeTab === tab.id ? '#223848' : '#6b7280',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #223848' : '2px solid transparent',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderRadius: '0.5rem 0.5rem 0 0',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar - only show for non-overview tabs */}
        {activeTab !== 'overview' && (
          <div style={{
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: '1rem 0',
            position: 'sticky',
            top: '171px',
            zIndex: 97
          }}>
            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '0 1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              />
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                backgroundColor: '#F3F4F6',
                borderRadius: '0.5rem',
                padding: '0.25rem'
              }}>
                <button
                  onClick={() => setFilterType('all')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: filterType === 'all' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: filterType === 'all' ? '600' : '400',
                    color: filterType === 'all' ? '#223848' : '#6B7280',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('app')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: filterType === 'app' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: filterType === 'app' ? '600' : '400',
                    color: filterType === 'app' ? '#223848' : '#6B7280',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  📱 App
                </button>
                <button
                  onClick={() => setFilterType('manual')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: filterType === 'manual' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: filterType === 'manual' ? '600' : '400',
                    color: filterType === 'manual' ? '#223848' : '#6B7280',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  📝 Manual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem'
        }}>
          {activeTab === 'overview' && (
            <OverviewTab
              statsData={statsData}
              appStudents={appStudents}
              manualStudents={manualStudents}
              searchTerm=""
              filterType="all"
              userProfile={userProfile}
              onGradeClick={(grade) => setActiveTab(`grade${grade}`)}
            />
          )}
          
          {activeTab.startsWith('grade') && (
            <GradeTab
              grade={parseInt(activeTab.replace('grade', ''))}
              appStudents={appStudents.filter(s => parseInt(s.grade) === parseInt(activeTab.replace('grade', '')))}
              manualStudents={manualStudents.filter(s => parseInt(s.grade) === parseInt(activeTab.replace('grade', '')))}
              searchTerm={searchTerm}
              filterType={filterType}
              userProfile={userProfile}
              teacherNominees={teacherNominees}
              teacherSubmissionOptions={teacherSubmissionOptions}
              onStudentUpdate={() => {
                loadStudentsData()
                loadPendingSubmissions()
              }}
            />
          )}
          
          {activeTab === 'historical' && (
            <HistoricalTab
              appStudents={appStudents}
              manualStudents={manualStudents}
              userProfile={userProfile}
              onStudentUpdate={() => loadStudentsData()}
            />
          )}
          
          {activeTab === 'voting' && (
            <VotingTab
              manualStudents={manualStudents}
              teacherNominees={teacherNominees}
              userProfile={userProfile}
              onStudentUpdate={() => loadStudentsData()}
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
            { id: 'students', icon: '👥', label: 'Students', active: true },
            { id: 'submissions', icon: '📋', label: 'Submissions', active: false, badge: pendingSubmissionsCount },
            { id: 'achievements', icon: '🏆', label: 'Achievements', active: false },
            { id: 'settings', icon: '⚙️', label: 'Settings', active: false }
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
                position: 'relative',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
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
              {tab.badge > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '8px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold'
                }}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </div>
              )}
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
            backgroundColor: showSuccess.includes('❌') ? '#EF4444' : '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 10002,
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '85vw',
            textAlign: 'center',
            animation: 'slideUp 0.3s ease-out',
            fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideUp {
            from {
              transform: translate(-50%, 20px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </>
  )
}
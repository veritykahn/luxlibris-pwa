// pages/admin/school-dashboard.js - Teacher Dashboard with Join Codes
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, getDoc } from 'firebase/firestore'

export default function TeacherDashboard() {
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
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalAppStudents: 0,
    totalManualStudents: 0,
    totalBooksRead: 0,
    pendingSubmissions: 0,
    schoolProgress: 0,
    activeStreaks: 0
  })
  
  const [recentActivity, setRecentActivity] = useState([])
  const [topReaders, setTopReaders] = useState([])
  const [urgentActions, setUrgentActions] = useState([])
  const [quickStats, setQuickStats] = useState({})
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  
  // New state for join codes
  const [studentJoinCode, setStudentJoinCode] = useState('')
  const [parentQuizCode, setParentQuizCode] = useState('')
  const [codesLoading, setCodesLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState('')

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
        loadDashboardData()
        loadJoinCodes()
      }
    }

    checkAuth()
  }, [authLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

  // Session timeout checking
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

  // Activity tracking
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

  // Generate parent quiz code
  const generateParentQuizCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Load join codes from teacher profile
  const loadJoinCodes = async () => {
    try {
      console.log('🔑 Loading join codes...')
      console.log('🔍 UserProfile:', {
        entityId: userProfile?.entityId,
        schoolId: userProfile?.schoolId,
        uid: userProfile?.uid,
        accountType: userProfile?.accountType
      })
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing entity, school, or teacher ID', {
          entityId: userProfile?.entityId,
          schoolId: userProfile?.schoolId,
          uid: userProfile?.uid
        })
        setCodesLoading(false)
        return
      }

      // Query for teacher document by UID (since teachers use auto-generated document IDs)
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      console.log('📄 Teacher query path:', `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      console.log('🔍 Querying for UID:', userProfile.uid)
      
      if (teacherSnapshot.empty) {
        console.error('❌ Teacher document not found for UID:', userProfile.uid)
        setCodesLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherData = teacherDoc.data()
      console.log('📋 Teacher data loaded:', {
        documentId: teacherDoc.id,
        studentJoinCode: teacherData.studentJoinCode,
        parentQuizCode: teacherData.parentQuizCode,
        parentQuizCodeCreated: teacherData.parentQuizCodeCreated
      })
      
      // Get student join code (should already exist)
      const studentCode = teacherData.studentJoinCode || ''
      setStudentJoinCode(studentCode)
      
      // Get or generate parent quiz code
      let parentCode = teacherData.parentQuizCode || ''
      let needsUpdate = false
      
      // Check if parent quiz code exists and is still valid (within 1 year)
      if (!parentCode || !teacherData.parentQuizCodeCreated) {
        // Generate new parent quiz code
        parentCode = generateParentQuizCode()
        needsUpdate = true
        console.log('✨ Generated new parent quiz code:', parentCode)
      } else {
        // Check if code is older than 1 year
        const codeAge = Date.now() - teacherData.parentQuizCodeCreated.toDate().getTime()
        const oneYear = 365 * 24 * 60 * 60 * 1000
        
        if (codeAge > oneYear) {
          // Generate new code as old one expired
          parentCode = generateParentQuizCode()
          needsUpdate = true
          console.log('🔄 Parent quiz code expired, generated new one:', parentCode)
        }
      }
      
      setParentQuizCode(parentCode)
      
      // Update teacher document if needed
      if (needsUpdate) {
        await updateDoc(teacherDoc.ref, {
          parentQuizCode: parentCode,
          parentQuizCodeCreated: new Date(),
          lastModified: new Date()
        })
        console.log('💾 Saved parent quiz code to teacher document:', teacherDoc.id)
      }
      
      console.log('✅ Join codes loaded successfully')
      
    } catch (error) {
      console.error('❌ Error loading join codes:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
    } finally {
      console.log('🏁 Setting codesLoading to false')
      setCodesLoading(false)
    }
  }

  // Copy to clipboard function
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }

  // Load dashboard overview data
  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading teacher dashboard overview...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId) {
        console.error('❌ Missing entity or school ID')
        setLoading(false)
        return
      }

      // Load app students
      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsSnapshot = await getDocs(appStudentsRef)
      
      // Load manual students  
      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${userProfile.uid}/manualStudents`)
      let manualStudentsSnapshot = { size: 0, docs: [] }
      try {
        manualStudentsSnapshot = await getDocs(manualStudentsRef)
      } catch (error) {
        console.log('No manual students collection yet')
      }

      let totalBooksRead = 0
      let pendingSubmissions = 0
      let activeStreaks = 0
      let schoolGoalTotal = 0
      const recentActivities = []
      const topReadersList = []

      // Process app students
      for (const studentDoc of appStudentsSnapshot.docs) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() }
        
        const booksThisYear = studentData.booksSubmittedThisYear || 0
        totalBooksRead += booksThisYear
        schoolGoalTotal += (studentData.personalGoal || 10)
        
        if (studentData.readingStreaks?.current > 0) {
          activeStreaks++
        }

        // Check for pending submissions in bookshelf
        if (studentData.bookshelf) {
          const pending = studentData.bookshelf.filter(book => 
            book.status === 'pending_approval' || book.status === 'pending_admin_approval'
          ).length
          pendingSubmissions += pending
        }

        // Add to top readers if they have books
        if (booksThisYear > 0) {
          topReadersList.push({
            id: studentData.id,
            name: `${studentData.firstName} ${studentData.lastInitial}.`,
            books: booksThisYear,
            type: 'app'
          })
        }

        // Add recent activity
        if (studentData.lastModified) {
          const lastActivity = studentData.lastModified.toDate ? studentData.lastModified.toDate() : new Date(studentData.lastModified)
          if (Date.now() - lastActivity.getTime() < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
            recentActivities.push({
              id: `${studentData.id}-activity`,
              type: 'student_activity',
              studentName: `${studentData.firstName} ${studentData.lastInitial}.`,
              action: 'Updated progress',
              timestamp: lastActivity,
              studentType: 'app'
            })
          }
        }
      }

      // Process manual students
      for (const studentDoc of manualStudentsSnapshot.docs) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() }
        
        const booksThisYear = studentData.booksCompleted || 0
        totalBooksRead += booksThisYear
        schoolGoalTotal += (studentData.personalGoal || 10)

        // Add to top readers
        if (booksThisYear > 0) {
          topReadersList.push({
            id: studentData.id,
            name: `${studentData.firstName} ${studentData.lastInitial}.`,
            books: booksThisYear,
            type: 'manual'
          })
        }
      }

      // Sort top readers
      topReadersList.sort((a, b) => b.books - a.books)

      // Sort recent activity by timestamp
      recentActivities.sort((a, b) => b.timestamp - a.timestamp)

      // Generate urgent actions
      const urgent = []
      if (pendingSubmissions > 0) {
        urgent.push({
          id: 'pending-submissions',
          type: 'submissions',
          title: `${pendingSubmissions} book${pendingSubmissions !== 1 ? 's' : ''} awaiting approval`,
          action: 'Review submissions',
          priority: 'high'
        })
      }

      const studentsWithoutGoals = (appStudentsSnapshot.size + manualStudentsSnapshot.size) - Math.floor(schoolGoalTotal / 10)
      if (studentsWithoutGoals > 0) {
        urgent.push({
          id: 'missing-goals',
          type: 'students',
          title: `${studentsWithoutGoals} student${studentsWithoutGoals !== 1 ? 's' : ''} need reading goals`,
          action: 'Set goals',
          priority: 'medium'
        })
      }

      // Calculate school progress
      const schoolProgress = schoolGoalTotal > 0 ? Math.round((totalBooksRead / schoolGoalTotal) * 100) : 0

      setDashboardData({
        totalStudents: appStudentsSnapshot.size + manualStudentsSnapshot.size,
        totalAppStudents: appStudentsSnapshot.size,
        totalManualStudents: manualStudentsSnapshot.size,
        totalBooksRead,
        pendingSubmissions,
        schoolProgress,
        activeStreaks
      })

      setRecentActivity(recentActivities.slice(0, 5))
      setTopReaders(topReadersList.slice(0, 5))
      setUrgentActions(urgent)

      console.log(`✅ Dashboard loaded: ${appStudentsSnapshot.size + manualStudentsSnapshot.size} students, ${totalBooksRead} books`)

    } catch (error) {
      console.error('❌ Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation handlers
  const handleNavigation = (page) => {
    switch (page) {
      case 'dashboard':
        // Already here
        break
      case 'students':
        router.push('/teacher/students')
        break
      case 'submissions':
        router.push('/teacher/submissions')
        break
      case 'achievements':
        router.push('/teacher/achievements')
        break
      case 'settings':
        router.push('/teacher/settings')
        break
      default:
        console.log(`Navigation to ${page} not implemented yet`)
    }
  }

  // Session extension
  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
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
            Loading dashboard...
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
        <title>Teacher Dashboard - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
                marginBottom: '1rem'
              }}>
                Session Expiring Soon
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.4'
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
                    fontSize: '0.875rem'
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
                    fontWeight: '600'
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
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                👩‍🏫
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  {userProfile?.schoolName || 'Reading Program'}
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Teacher Dashboard
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
          
          {/* Welcome Section */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Georgia, serif'
            }}>
              Welcome back, {userProfile.firstName}! 👋
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              margin: 0
            }}>
              Here&apos;s what&apos;s happening with your reading program today.
            </p>
          </div>

          {/* Join Codes Section - DEBUG VERSION */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '2px solid #C3E0DE'
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
              🔑 Access Codes
            </h3>
            
            {codesLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  border: '3px solid #C3E0DE',
                  borderTop: '3px solid #223848',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ color: '#6b7280' }}>Loading codes...</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {/* Student Join Code */}
                <div style={{
                  background: 'linear-gradient(135deg, #ADD4EA15, #ADD4EA25)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #ADD4EA'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>👥</span>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#223848',
                      margin: 0
                    }}>
                      Student Join Code
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0 0 0.75rem 0',
                    lineHeight: '1.4'
                  }}>
                    Students use this code to join your class in the app
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      background: 'white',
                      border: '2px solid #ADD4EA',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#223848',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      {studentJoinCode || 'Not Available'}
                    </div>
                    <button
                      onClick={() => copyToClipboard(studentJoinCode, 'student')}
                      disabled={!studentJoinCode}
                      style={{
                        padding: '0.75rem',
                        background: copySuccess === 'student' 
                          ? 'linear-gradient(135deg, #10B981, #059669)' 
                          : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                        color: copySuccess === 'student' ? 'white' : '#223848',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: studentJoinCode ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        opacity: studentJoinCode ? 1 : 0.5,
                        minWidth: '80px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copySuccess === 'student' ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                {/* Parent Quiz Code */}
                <div style={{
                  background: 'linear-gradient(135deg, #C3E0DE15, #C3E0DE25)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #C3E0DE'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>👨‍👩‍👧‍👦</span>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#223848',
                      margin: 0
                    }}>
                      Parent Quiz Code
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0 0 0.75rem 0',
                    lineHeight: '1.4'
                  }}>
                    Share with parents for book quiz access
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      background: 'white',
                      border: '2px solid #C3E0DE',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#223848',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      {parentQuizCode || 'Generating...'}
                    </div>
                    <button
                      onClick={() => copyToClipboard(parentQuizCode, 'parent')}
                      disabled={!parentQuizCode}
                      style={{
                        padding: '0.75rem',
                        background: copySuccess === 'parent' 
                          ? 'linear-gradient(135deg, #10B981, #059669)' 
                          : 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                        color: copySuccess === 'parent' ? 'white' : '#223848',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: parentQuizCode ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        opacity: parentQuizCode ? 1 : 0.5,
                        minWidth: '80px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copySuccess === 'parent' ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <QuickStatCard
              icon="👥"
              title="Total Students"
              value={dashboardData.totalStudents}
              subtitle={`${dashboardData.totalAppStudents} app + ${dashboardData.totalManualStudents} manual`}
              color="#ADD4EA"
            />
            <QuickStatCard
              icon="📚"
              title="Books Read"
              value={dashboardData.totalBooksRead}
              subtitle="This school year"
              color="#C3E0DE"
            />
            <QuickStatCard
              icon="📋"
              title="Pending"
              value={dashboardData.pendingSubmissions}
              subtitle="Need your review"
              color="#A1E5DB"
              alert={dashboardData.pendingSubmissions > 0}
            />
            <QuickStatCard
              icon="🎯"
              title="Progress"
              value={`${dashboardData.schoolProgress}%`}
              subtitle="Toward goals"
              color="#B6DFEB"
            />
            <QuickStatCard
              icon="🔥"
              title="Active Streaks"
              value={dashboardData.activeStreaks}
              subtitle="Students reading daily"
              color="#FFB366"
            />
          </div>

          {/* Urgent Actions */}
          {urgentActions.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '2px solid #FEF3C7'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#92400e',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚡ Action Required
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {urgentActions.map(action => (
                  <div key={action.id} style={{
                    padding: '1rem',
                    background: '#FEF3C7',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#92400e'
                      }}>
                        {action.title}
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigation(action.type)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#D97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {action.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Readers & Recent Activity */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Top Readers */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
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
                🏆 Top Readers
              </h3>
              {topReaders.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  No books completed yet this year.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {topReaders.map((reader, index) => (
                    <div key={reader.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: index === 0 ? '#FEF3C7' : '#f8fafc'
                    }}>
                      <span style={{
                        fontSize: '1.25rem'
                      }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📖'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#223848'
                        }}>
                          {reader.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {reader.books} book{reader.books !== 1 ? 's' : ''} • {reader.type === 'app' ? 'App' : 'Manual'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
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
                📈 Recent Activity
              </h3>
              {recentActivity.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  No recent activity to show.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {recentActivity.map(activity => (
                    <div key={activity.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: '#f8fafc'
                    }}>
                      <span style={{ fontSize: '1rem' }}>
                        {activity.studentType === 'app' ? '📱' : '📝'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#223848'
                        }}>
                          {activity.studentName} {activity.action}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {activity.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '6rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 1rem 0'
            }}>
              🚀 Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <QuickActionButton
                icon="👥"
                title="Add Student"
                description="Add new app or manual student"
                onClick={() => handleNavigation('students')}
              />
              <QuickActionButton
                icon="📋"
                title="Review Submissions"
                description="Approve pending book completions"
                onClick={() => handleNavigation('submissions')}
                badge={dashboardData.pendingSubmissions > 0 ? dashboardData.pendingSubmissions : null}
              />
              <QuickActionButton
                icon="🏆"
                title="View Achievements"
                description="See who earned rewards"
                onClick={() => handleNavigation('achievements')}
              />
              <QuickActionButton
                icon="⚙️"
                title="Settings"
                description="Manage school configuration"
                onClick={() => handleNavigation('settings')}
              />
            </div>
          </div>
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
            { id: 'dashboard', icon: '📊', label: 'Dashboard', active: true },
            { id: 'students', icon: '👥', label: 'Students', active: false },
            { id: 'submissions', icon: '📋', label: 'Submissions', active: false, badge: dashboardData.pendingSubmissions },
            { id: 'achievements', icon: '🏆', label: 'Achievements', active: false },
            { id: 'settings', icon: '⚙️', label: 'Settings', active: false }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavigation(tab.id)}
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
              {tab.badge && tab.badge > 0 && (
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

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .grid-responsive {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}

// Supporting Components
function QuickStatCard({ icon, title, value, subtitle, color, alert = false }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: alert ? '2px solid #FEF3C7' : `1px solid ${color}20`,
      position: 'relative'
    }}>
      {alert && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          backgroundColor: '#EF4444',
          borderRadius: '50%'
        }} />
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <div style={{
          width: '2rem',
          height: '2rem',
          background: `${color}15`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '60%',
            height: '60%',
            background: color,
            borderRadius: '50%'
          }}></div>
        </div>
      </div>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 0.25rem 0'
      }}>
        {value}
      </h3>
      <p style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        margin: 0,
        fontWeight: '600'
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '0.65rem',
        color: '#9ca3af',
        margin: '0.125rem 0 0 0'
      }}>
        {subtitle}
      </p>
    </div>
  )
}

function QuickActionButton({ icon, title, description, onClick, badge = null }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '1rem',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #ADD4EA20, #C3E0DE20)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {badge && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: '#EF4444',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          {badge > 9 ? '9+' : badge}
        </div>
      )}
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        {icon}
      </div>
      <h4 style={{
        fontSize: '1rem',
        fontWeight: '600',
        color: '#223848',
        margin: '0 0 0.25rem 0'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        margin: 0,
        lineHeight: '1.4'
      }}>
        {description}
      </p>
    </button>
  )
}
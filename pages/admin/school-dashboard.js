// pages/admin/school-dashboard.js - Enhanced Teacher Dashboard with Nested Status & Real Email Data
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePhaseAccess } from '../../hooks/usePhaseAccess'
import { db, dbHelpers, getCurrentAcademicYear } from '../../lib/firebase'
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, getDoc } from 'firebase/firestore'
import TeacherResultsInterface from '../../components/TeacherResultsInterface'
import { emailTemplates, getCurrentEmailTemplate, fillEmailTemplate } from '../../lib/templates/emailTemplates'

// Enhanced Phase Details Section Component
function PhaseDetailsSection({ currentPhase, router, userProfile, onClearManualStudents }) {
  const getPhaseDetails = (phase) => {
    switch (phase) {
      case 'ACTIVE':
        return {
          title: 'Active Reading Period',
          description: 'Students are actively reading and submitting books for approval.',
          status: 'success',
          statusText: 'Program Running Smoothly',
          timeline: 'Sept 1 - March 31',
          actions: [
            { text: 'Review Student Submissions', route: '/teacher/submissions', icon: '📋' },
            { text: 'Manage Students', route: '/teacher/students', icon: '👥' },
            { text: 'View Achievements', route: '/teacher/achievements', icon: '🏆' }
          ],
          nextPhase: 'Voting begins March 31st - students will vote for their favorite books!'
        }
      
      case 'VOTING':
        return {
          title: 'Student Voting Period',
          description: 'Students are voting for their favorite books. Manual student voting is available.',
          status: 'voting',
          statusText: 'Voting Active',
          timeline: 'April 1 - April 14',
          actions: [
            { text: 'Vote for Manual Students', route: '/teacher/students', icon: '🗳️', highlight: true },
            { text: 'View Student Progress', route: '/teacher/students', icon: '👥' },
            { text: 'Monitor Voting Activity', route: '/teacher/achievements', icon: '📊' }
          ],
          nextPhase: 'Results will be announced April 15th!'
        }
      
      case 'RESULTS':
        return {
          title: 'Results Available',
          description: 'Voting results are now available. Students can see the winners!',
          status: 'results',
          statusText: 'Results Published',
          timeline: 'April 15 - May 23',
          actions: [
            { text: 'View Voting Results', route: '#results', icon: '🏆', highlight: true },
            { text: 'Review Class Votes', route: '/teacher/students', icon: '🗳️' },
            { text: 'Download Reports', route: '/teacher/achievements', icon: '📊' },
            { text: 'Clear Manual Students Data', action: 'clearManualStudents', icon: '🗑️', 
              style: 'warning', description: 'Prepare for next year' }
          ],
          nextPhase: 'Teacher book selection starts May 24th for next year!'
        }
      
      case 'TEACHER_SELECTION':
        return {
          title: 'Teacher Book Selection',
          description: 'Select books and configure settings for the next academic year.',
          status: 'setup',
          statusText: 'Setup Required',
          timeline: 'May 24 - June 1',
          actions: [
            { text: 'Select Books for Next Year', route: '/teacher/settings', icon: '📚', highlight: true },
            { text: 'Configure Achievement Tiers', route: '/teacher/settings', icon: '🎯' },
            { text: 'Set Submission Options', route: '/teacher/settings', icon: '⚙️' },
            { text: 'Clear Manual Students Data', action: 'clearManualStudents', icon: '🗑️', 
              style: 'warning', description: 'Reset for new year' }
          ],
          nextPhase: 'New academic year begins June 1st with fresh student data!'
        }
      
      case 'SETUP':
        return {
          title: 'Program Setup',
          description: 'Initial program configuration is being completed.',
          status: 'setup',
          statusText: 'Setup in Progress',
          timeline: 'Administrative Period',
          actions: [
            { text: 'Complete Setup', route: '/teacher/settings', icon: '⚙️', highlight: true },
            { text: 'Review Configuration', route: '/teacher/settings', icon: '📋' }
          ],
          nextPhase: 'Active reading period will begin once setup is complete.'
        }
      
      default:
        return {
          title: 'Unknown Phase',
          description: 'Phase information not available.',
          status: 'neutral',
          statusText: 'Status Unknown',
          timeline: 'Unknown',
          actions: [],
          nextPhase: 'Please contact support if this persists.'
        }
    }
  }

  const phaseInfo = getPhaseDetails(currentPhase)
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return { bg: '#F0FDF4', border: '#16A34A', text: '#166534' }
      case 'voting': return { bg: '#FEF3C7', border: '#D97706', text: '#92400E' }
      case 'results': return { bg: '#F3E8FF', border: '#9333EA', text: '#6B21A8' }
      case 'setup': return { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' }
      default: return { bg: '#F8FAFC', border: '#64748B', text: '#475569' }
    }
  }

  const colors = getStatusColor(phaseInfo.status)

  return (
    <div style={{
      border: `2px solid ${colors.border}30`,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      marginTop: '1rem'
    }}>
      {/* Header */}
      <div style={{
        background: colors.bg,
        padding: '1rem 1.25rem',
        borderBottom: `1px solid ${colors.border}20`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem'
        }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: colors.text,
            margin: 0,
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            {phaseInfo.title}
          </h4>
          <div style={{
            background: colors.border,
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {phaseInfo.statusText}
          </div>
        </div>
        <p style={{
          color: colors.text,
          fontSize: '0.875rem',
          margin: '0 0 0.75rem 0',
          lineHeight: '1.4',
          fontFamily: 'Avenir, system-ui, sans-serif'
        }}>
          {phaseInfo.description}
        </p>
        <div style={{
          fontSize: '0.75rem',
          color: `${colors.text}CC`,
          fontWeight: '600'
        }}>
          📅 Timeline: {phaseInfo.timeline}
        </div>
      </div>

      {/* Actions */}
      {phaseInfo.actions.length > 0 && (
        <div style={{
          padding: '1.25rem',
          background: 'white'
        }}>
          <h5 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 0.75rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'Avenir, system-ui, sans-serif'
          }}>
            Available Actions
          </h5>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {phaseInfo.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.route === '#results') {
                    const resultsElement = document.getElementById('results-section')
                    if (resultsElement) {
                      resultsElement.scrollIntoView({ behavior: 'smooth' })
                    }
                  } else if (action.action === 'clearManualStudents') {
                    onClearManualStudents()
                  } else {
                    router.push(action.route)
                  }
                }}
                style={{
                  background: action.highlight 
                    ? `linear-gradient(135deg, ${colors.border}20, ${colors.border}30)`
                    : action.style === 'warning'
                    ? 'linear-gradient(135deg, #FEF3C720, #F59E0B20)'
                    : 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                  border: action.highlight 
                    ? `2px solid ${colors.border}60`
                    : action.style === 'warning'
                    ? '2px solid #F59E0B60'
                    : '1px solid #E2E8F0',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: action.highlight ? colors.text 
                        : action.style === 'warning' ? '#92400E' 
                        : '#374151',
                  fontFamily: 'Avenir, system-ui, sans-serif'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.125rem' }}>{action.icon}</span>
                  {action.text}
                </div>
                {action.description && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#6B7280',
                    fontWeight: '400'
                  }}>
                    {action.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next Phase Info */}
      <div style={{
        background: '#F8FAFC',
        padding: '1rem 1.25rem',
        borderTop: '1px solid #E2E8F0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>🔮</span>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              fontFamily: 'Avenir, system-ui, sans-serif'
            }}>
              What&apos;s Next
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: '1.4',
              fontFamily: 'Avenir, system-ui, sans-serif'
            }}>
              {phaseInfo.nextPhase}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  
  // Join codes state
  const [studentJoinCode, setStudentJoinCode] = useState('')
  const [parentQuizCode, setParentQuizCode] = useState('')
  const [codesLoading, setCodesLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState('')
  const [totalBooks, setTotalBooks] = useState(0)

  // Email templates state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null)
  const [copiedEmail, setCopiedEmail] = useState(false)

  // Collapsible sections state
  const [showProgramStatus, setShowProgramStatus] = useState(false)
  const [showAccessCodes, setShowAccessCodes] = useState(false)
  const [showTopReadersActivity, setShowTopReadersActivity] = useState(false)

  // Manual student clearing state
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)
  const [clearingInProgress, setClearingInProgress] = useState(false)
  const [clearingResult, setClearingResult] = useState(null)

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

  // Clear teacher's manual students data
  const clearTeacherManualStudents = async () => {
    setClearingInProgress(true)
    try {
      console.log('🗑️ Clearing manual students for teacher...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        throw new Error('Missing teacher profile data')
      }

      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        throw new Error('Teacher document not found')
      }

      const teacherId = teacherSnapshot.docs[0].id
      const currentYear = getCurrentAcademicYear()

      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      const manualStudentsSnapshot = await getDocs(manualStudentsRef)
      
      let studentsCleared = 0

      for (const studentDoc of manualStudentsSnapshot.docs) {
        const studentData = studentDoc.data()
        await dbHelpers.clearIndividualManualStudentData(studentDoc.ref, studentData, currentYear)
        studentsCleared++
      }

      setClearingResult({
        success: true,
        studentsCleared,
        academicYear: currentYear
      })

      console.log(`✅ Cleared data for ${studentsCleared} manual students`)
      await loadDashboardData()

    } catch (error) {
      console.error('❌ Error clearing manual students:', error)
      setClearingResult({
        success: false,
        error: error.message
      })
    }
    setClearingInProgress(false)
  }

  const handleClearManualStudents = () => {
    setShowClearConfirmation(true)
  }

  const handleConfirmClearing = () => {
    setShowClearConfirmation(false)
    setShowFinalConfirmation(true)
  }

  const handleFinalConfirm = async () => {
    setShowFinalConfirmation(false)
    await clearTeacherManualStudents()
  }

  const closeClearingResult = () => {
    setClearingResult(null)
  }

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
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing entity, school, or teacher ID')
        setCodesLoading(false)
        return
      }

      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        console.error('❌ Teacher document not found for UID:', userProfile.uid)
        setCodesLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherData = teacherDoc.data()
      
      const studentCode = teacherData.studentJoinCode || ''
      setStudentJoinCode(studentCode)
      
      // Get total books count
      const booksCount = teacherData.selectedNominees?.length || 0
      setTotalBooks(booksCount)
      
      let parentCode = teacherData.parentQuizCode || ''
      let needsUpdate = false
      
      if (!parentCode || !teacherData.parentQuizCodeCreated) {
        parentCode = generateParentQuizCode()
        needsUpdate = true
      } else {
        const codeAge = Date.now() - teacherData.parentQuizCodeCreated.toDate().getTime()
        const oneYear = 365 * 24 * 60 * 60 * 1000
        
        if (codeAge > oneYear) {
          parentCode = generateParentQuizCode()
          needsUpdate = true
        }
      }
      
      setParentQuizCode(parentCode)
      
      if (needsUpdate) {
        await updateDoc(teacherDoc.ref, {
          parentQuizCode: parentCode,
          parentQuizCodeCreated: new Date(),
          lastModified: new Date()
        })
      }
      
    } catch (error) {
      console.error('❌ Error loading join codes:', error)
    } finally {
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

  // Email template handlers with real data
  const handleEmailTemplateSelect = (templateKey) => {
    setSelectedEmailTemplate(templateKey)
    setCopiedEmail(false)
  }
  
  const copyEmailToClipboard = () => {
    const template = emailTemplates[selectedEmailTemplate]
    
    // Build userData object with real data
    const userData = {
      TEACHER_FIRST_NAME: userProfile.firstName || 'Teacher',
      TEACHER_LAST_NAME: userProfile.lastName || '',
      SCHOOL_NAME: userProfile.schoolName || 'Your School',
      STUDENT_JOIN_CODE: studentJoinCode || 'PENDING',
      PARENT_QUIZ_CODE: parentQuizCode || 'PENDING',
      TOTAL_BOOKS: totalBooks.toString() || '50',
      WEBSITE_URL: 'luxlibris.org/role-selector'
    }
    
    // Fill template with real data
    const filledEmail = fillEmailTemplate(template, userData)
    const emailContent = `Subject: ${filledEmail.subject}\n\n${filledEmail.body}`
    
    navigator.clipboard.writeText(emailContent)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 3000)
  }
  
  const openEmailModal = () => {
    const currentTemplate = getCurrentEmailTemplate()
    setSelectedEmailTemplate(currentTemplate)
    setShowEmailModal(true)
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

      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsSnapshot = await getDocs(appStudentsRef)
      
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

      for (const studentDoc of appStudentsSnapshot.docs) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() }
        
        const booksThisYear = studentData.booksSubmittedThisYear || 0
        totalBooksRead += booksThisYear
        schoolGoalTotal += (studentData.personalGoal || 10)
        
        if (studentData.readingStreaks?.current > 0) {
          activeStreaks++
        }

        if (studentData.bookshelf) {
          const pending = studentData.bookshelf.filter(book => 
            book.status === 'pending_approval' || book.status === 'pending_admin_approval'
          ).length
          pendingSubmissions += pending
        }

        if (booksThisYear > 0) {
          topReadersList.push({
            id: studentData.id,
            name: `${studentData.firstName} ${studentData.lastInitial}.`,
            books: booksThisYear,
            type: 'app'
          })
        }

        if (studentData.lastModified) {
          const lastActivity = studentData.lastModified.toDate ? studentData.lastModified.toDate() : new Date(studentData.lastModified)
          if (Date.now() - lastActivity.getTime() < 7 * 24 * 60 * 60 * 1000) {
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

      for (const studentDoc of manualStudentsSnapshot.docs) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() }
        
        const booksThisYear = studentData.booksCompleted || 0
        totalBooksRead += booksThisYear
        schoolGoalTotal += (studentData.personalGoal || 10)

        if (booksThisYear > 0) {
          topReadersList.push({
            id: studentData.id,
            name: `${studentData.firstName} ${studentData.lastInitial}.`,
            books: booksThisYear,
            type: 'manual'
          })
        }
      }

      topReadersList.sort((a, b) => b.books - a.books)
      recentActivities.sort((a, b) => b.timestamp - a.timestamp)

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

  const handleNavigation = (page) => {
    switch (page) {
      case 'dashboard':
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

  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
  }

  // Get filled email template for display
  const getFilledEmailTemplate = (templateKey) => {
    const template = emailTemplates[templateKey]
    
    const userData = {
      TEACHER_FIRST_NAME: userProfile.firstName || 'Teacher',
      TEACHER_LAST_NAME: userProfile.lastName || '',
      SCHOOL_NAME: userProfile.schoolName || 'Your School',
      STUDENT_JOIN_CODE: studentJoinCode || 'PENDING',
      PARENT_QUIZ_CODE: parentQuizCode || 'PENDING',
      TOTAL_BOOKS: totalBooks.toString() || '50',
      WEBSITE_URL: 'luxlibris.org/role-selector'
    }
    
    return fillEmailTemplate(template, userData)
  }

  // Show loading
  if (authLoading || loading || !userProfile || phaseLoading) {
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
            fontFamily: 'Avenir, system-ui, sans-serif'
          }}>
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
        <link rel="icon" href="/images/lux_libris_logo.png" />
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
                    fontSize: '0.875rem',
                    fontFamily: 'Avenir, system-ui, sans-serif'
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
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}
                >
                  Continue Working
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Student Clearing Modals */}
        {showClearConfirmation && (
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
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '0.5rem',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Clear Manual Students Data?
                </h3>
              </div>
              
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ 
                  color: '#92400E', 
                  margin: '0 0 0.75rem 0', 
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ This will clear reading data for ALL your manual students:
                </p>
                <ul style={{ 
                  color: '#B45309', 
                  margin: 0,
                  paddingLeft: '1.5rem',
                  fontSize: '0.875rem'
                }}>
                  <li>All completed books will be reset</li>
                  <li>Book counts will be set to 0</li>
                  <li>Voting data will be cleared</li>
                  <li>Student names and grades will be preserved</li>
                </ul>
              </div>

              <div style={{
                background: '#E5E7EB',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ 
                  color: '#374151', 
                  margin: 0, 
                  fontSize: '0.875rem',
                  fontStyle: 'italic'
                }}>
                  💡 <strong>Note:</strong> This normally happens automatically on May 24th when the new academic year begins. Only use this if you need to reset data early.
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {showFinalConfirmation && (
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
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#DC2626',
                marginBottom: '1rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Final Confirmation
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.4'
              }}>
                Are you absolutely sure? This will clear reading data for <strong>{dashboardData.totalManualStudents} manual students</strong> and cannot be undone.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowFinalConfirmation(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalConfirm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}
                >
                  Yes, Clear Data
                </button>
              </div>
            </div>
          </div>
        )}

        {clearingInProgress && (
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
              <div style={{
                width: '3rem',
                height: '3rem',
                border: '4px solid #F59E0B',
                borderTop: '4px solid #DC2626',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Clearing Student Data...
              </h3>
              <p style={{
                color: '#6b7280',
                margin: 0
              }}>
                Please wait while we reset your manual students&apos; reading data.
              </p>
            </div>
          </div>
        )}

        {clearingResult && (
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
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: clearingResult.success ? '#10B981' : '#DC2626'
              }}>
                {clearingResult.success ? '✅' : '❌'}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                {clearingResult.success ? 'Data Cleared Successfully!' : 'Clearing Failed'}
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.4'
              }}>
                {clearingResult.success 
                  ? `Successfully cleared reading data for ${clearingResult.studentsCleared} manual students for academic year ${clearingResult.academicYear}.`
                  : `Error: ${clearingResult.error}`
                }
              </p>
              <button
                onClick={closeClearingResult}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: clearingResult.success 
                    ? 'linear-gradient(135deg, #10B981, #059669)' 
                    : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                  color: clearingResult.success ? 'white' : '#223848',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  fontFamily: 'Avenir, system-ui, sans-serif'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Email Templates Modal with Real Data */}
        {showEmailModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '2rem',
            overflowY: 'auto'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              marginTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  ✉️ Parent Email Templates
                </h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {Object.entries(emailTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleEmailTemplateSelect(key)}
                    style={{
                      padding: '1rem',
                      border: selectedEmailTemplate === key ? '2px solid #3B82F6' : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      background: selectedEmailTemplate === key ? '#EFF6FF' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}
                  >
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.25rem'
                    }}>
                      {template.title}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {template.sendTime}
                    </div>
                  </button>
                ))}
              </div>

              {selectedEmailTemplate && (
                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  background: '#f9fafb'
                }}>
                  <div style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>
                      EMAIL SUBJECT:
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#223848',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}>
                      {getFilledEmailTemplate(selectedEmailTemplate).subject}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>
                    EMAIL BODY:
                  </div>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    color: '#374151',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}>
                    {getFilledEmailTemplate(selectedEmailTemplate).body}
                  </div>

                  <div style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={copyEmailToClipboard}
                      style={{
                        padding: '0.75rem 2rem',
                        background: copiedEmail 
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      {copiedEmail ? '✓ Copied to Clipboard!' : '📋 Copy Email'}
                    </button>
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#FEF3C7',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#92400E',
                    textAlign: 'center'
                  }}>
                    💡 Tip: This email has been filled with your actual school data. Just copy and paste into your school&apos;s email system!
                  </div>
                </div>
              )}
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
              <img 
                src="/images/lux_libris_logo.png" 
                alt="Lux Libris"
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  objectFit: 'contain'
                }}
              />
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  {userProfile?.schoolName || 'Reading Program'}
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir, system-ui, sans-serif'
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
                  cursor: 'pointer',
                  fontFamily: 'Avenir, system-ui, sans-serif'
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
          
          {/* Welcome Section with Nested Program Status */}
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
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Welcome back, {userProfile.firstName}! 👋
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              margin: '0 0 1rem 0',
              fontFamily: 'Avenir, system-ui, sans-serif'
            }}>
              Here&apos;s what&apos;s happening with your reading program today.
            </p>

            {/* Program Status Collapsible Section */}
            <button
              onClick={() => setShowProgramStatus(!showProgramStatus)}
              style={{
                width: '100%',
                padding: '1rem',
                background: showProgramStatus ? '#F3F4F620' : '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                fontFamily: 'Avenir, system-ui, sans-serif'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #ADD4EA15, #ADD4EA25)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    {getPhaseInfo().icon}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848'
                    }}>
                      {getPhaseInfo().name} • {phaseData?.academicYear}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      Click to view program details
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    refreshPhase()
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'transparent',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}
                  title="Refresh phase status"
                >
                  🔄
                </button>
              </div>
              <span style={{
                fontSize: '1rem',
                color: '#223848',
                transition: 'transform 0.2s',
                transform: showProgramStatus ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </button>
            
            {showProgramStatus && (
              <PhaseDetailsSection 
                currentPhase={phaseData?.currentPhase} 
                router={router}
                userProfile={userProfile}
                onClearManualStudents={handleClearManualStudents}
              />
            )}
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 1rem 0',
              fontFamily: 'Didot, "Times New Roman", serif'
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
                gap: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
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
                        color: '#92400e',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}>
                        {action.title}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (action.type === 'submissions') {
                          router.push('/teacher/submissions')
                        } else {
                          handleNavigation(action.type)
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#D97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      {action.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Collapsible Access Codes & Email Templates Section */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '2px solid #C3E0DE',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowAccessCodes(!showAccessCodes)}
              style={{
                width: '100%',
                padding: '1.5rem',
                background: showAccessCodes ? '#C3E0DE20' : 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s'
              }}
            >
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                🔑 Access Codes & Parent Emails
              </h3>
              <span style={{
                fontSize: '1.25rem',
                color: '#223848',
                transition: 'transform 0.2s',
                transform: showAccessCodes ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </button>
            
            {showAccessCodes && (
              <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
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
                    <p style={{ color: '#6b7280', fontFamily: 'Avenir, system-ui, sans-serif' }}>Loading codes...</p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem'
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
                            margin: 0,
                            fontFamily: 'Avenir, system-ui, sans-serif'
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
                              transition: 'all 0.2s ease',
                              fontFamily: 'Avenir, system-ui, sans-serif'
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
                            margin: 0,
                            fontFamily: 'Avenir, system-ui, sans-serif'
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
                              transition: 'all 0.2s ease',
                              fontFamily: 'Avenir, system-ui, sans-serif'
                            }}
                          >
                            {copySuccess === 'parent' ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Email Templates Button */}
                    <button
                      onClick={openEmailModal}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      ✉️ View Parent Email Templates
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Teacher Results Interface */}
          {phaseData && phaseData.currentPhase === 'RESULTS' && (
            <div id="results-section">
              <TeacherResultsInterface 
                userProfile={userProfile} 
                currentTheme={{
                  surface: 'white',
                  textPrimary: '#223848',
                  textSecondary: '#6b7280',
                  primary: '#ADD4EA',
                  accent: '#A1E5DB'
                }}
              />
            </div>
          )}

          {/* Collapsible Top Readers & Recent Activity */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            marginBottom: '6rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowTopReadersActivity(!showTopReadersActivity)}
              style={{
                width: '100%',
                padding: '1.5rem',
                background: showTopReadersActivity ? '#F3F4F620' : 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s'
              }}
            >
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                🏆 Top Readers & Recent Activity
              </h3>
              <span style={{
                fontSize: '1.25rem',
                color: '#223848',
                transition: 'transform 0.2s',
                transform: showTopReadersActivity ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </button>
            
            {showTopReadersActivity && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                gap: '1.5rem',
                padding: '0 1.5rem 1.5rem 1.5rem'
              }}>
                {/* Top Readers */}
                <div>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#223848',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}>
                    🏆 Top Readers
                  </h4>
                  {topReaders.length === 0 ? (
                    <p style={{ 
                      color: '#6b7280', 
                      fontStyle: 'italic',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}>
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
                          <span style={{ fontSize: '1.25rem' }}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📖'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#223848',
                              fontFamily: 'Avenir, system-ui, sans-serif'
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
                <div>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#223848',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}>
                    📈 Recent Activity
                  </h4>
                  {recentActivity.length === 0 ? (
                    <p style={{ 
                      color: '#6b7280', 
                      fontStyle: 'italic',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}>
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
                              color: '#223848',
                              fontFamily: 'Avenir, system-ui, sans-serif'
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
            )}
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
                position: 'relative',
                fontFamily: 'Avenir, system-ui, sans-serif'
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
        margin: '0 0 0.25rem 0',
        fontFamily: 'Avenir, system-ui, sans-serif'
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
        position: 'relative',
        fontFamily: 'Avenir, system-ui, sans-serif'
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
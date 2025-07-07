// pages/teacher/students.js - Complete Student Management System
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore'

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

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('app') // 'app' or 'manual'
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  
  // Student data
  const [appStudents, setAppStudents] = useState([])
  const [manualStudents, setManualStudents] = useState([])
  const [statsData, setStatsData] = useState({
    totalAppStudents: 0,
    totalManualStudents: 0,
    totalBooks: 0,
    activeStudents: 0
  })

  // UI states
  const [showAddManualModal, setShowAddManualModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBookSubmissionModal, setShowBookSubmissionModal] = useState(false)
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  // Form data
  const [newManualStudent, setNewManualStudent] = useState({
    firstName: '',
    lastInitial: '',
    grade: 4,
    personalGoal: 10
  })

  const [bookSubmission, setBookSubmission] = useState({
    bookTitle: '',
    submissionType: 'book_report',
    submissionDate: new Date().toISOString().split('T')[0]
  })

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
        loadStudentsData()
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

  // Load students data
  const loadStudentsData = async () => {
    try {
      console.log('📊 Loading students data...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing teacher profile data')
        setLoading(false)
        return
      }

      // Find teacher document by UID to get document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        console.error('❌ Teacher document not found')
        setLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherId = teacherDoc.id

      // Load app students (where currentTeacherId === teacherId)
      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsQuery = query(
        appStudentsRef, 
        where('currentTeacherId', '==', teacherId)
        // Note: Removed orderBy to avoid composite index requirement - will sort in JavaScript
      )
      const appStudentsSnapshot = await getDocs(appStudentsQuery)
      
      const appStudentsData = []
      appStudentsSnapshot.forEach(doc => {
        const studentData = { id: doc.id, ...doc.data() }
        if (studentData.status !== 'deleted') {
          appStudentsData.push(studentData)
        }
      })
      
      // Sort by firstName in JavaScript (avoids composite index requirement)
      appStudentsData.sort((a, b) => a.firstName.localeCompare(b.firstName))

      // Load manual students
      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      let manualStudentsSnapshot = { docs: [] }
      try {
        // Note: Removed orderBy to avoid index requirement - will sort in JavaScript
        manualStudentsSnapshot = await getDocs(manualStudentsRef)
      } catch (error) {
        console.log('No manual students collection yet')
      }

      const manualStudentsData = []
      manualStudentsSnapshot.forEach(doc => {
        manualStudentsData.push({ id: doc.id, ...doc.data() })
      })
      
      // Sort by firstName in JavaScript
      manualStudentsData.sort((a, b) => a.firstName.localeCompare(b.firstName))

      // Calculate stats
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
        activeStudents: activeAppStudents + activeManualStudents
      })

      console.log(`✅ Loaded ${appStudentsData.length} app students, ${manualStudentsData.length} manual students`)

    } catch (error) {
      console.error('❌ Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle app student status
  const toggleAppStudentStatus = async (student) => {
    setIsProcessing(true)
    try {
      const newStatus = student.status === 'inactive' ? 'active' : 'inactive'
      
      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id)
      await updateDoc(studentRef, {
        status: newStatus,
        lastModified: new Date()
      })

      setAppStudents(prev => 
        prev.map(s => 
          s.id === student.id 
            ? { ...s, status: newStatus }
            : s
        )
      )

      setShowSuccess(`📱 ${student.firstName} ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error updating student status:', error)
      setShowSuccess('❌ Error updating status. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add manual student
  const addManualStudent = async () => {
    if (!newManualStudent.firstName || !newManualStudent.lastInitial) {
      setShowSuccess('❌ Please fill in all required fields')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    setIsProcessing(true)
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const studentData = {
        ...newManualStudent,
        booksSubmitted: [],
        totalBooksThisYear: 0,
        status: 'active',
        createdAt: new Date(),
        lastModified: new Date()
      }

      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      const docRef = await addDoc(manualStudentsRef, studentData)

      const newStudent = { id: docRef.id, ...studentData }
      setManualStudents(prev => [...prev, newStudent])
      
      setNewManualStudent({
        firstName: '',
        lastInitial: '',
        grade: 4,
        personalGoal: 10
      })
      setShowAddManualModal(false)
      setShowSuccess(`✅ ${newManualStudent.firstName} added successfully!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error adding manual student:', error)
      setShowSuccess('❌ Error adding student. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add book submission for manual student
  const addBookSubmission = async () => {
    if (!bookSubmission.bookTitle) {
      setShowSuccess('❌ Please enter book title')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    setIsProcessing(true)
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const submission = {
        ...bookSubmission,
        submittedDate: new Date(bookSubmission.submissionDate),
        approved: true // Auto-approve manual submissions
      }

      const updatedStudent = {
        ...selectedStudent,
        booksSubmitted: [...(selectedStudent.booksSubmitted || []), submission],
        totalBooksThisYear: (selectedStudent.totalBooksThisYear || 0) + 1,
        lastModified: new Date()
      }

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, selectedStudent.id)
      await updateDoc(studentRef, {
        booksSubmitted: updatedStudent.booksSubmitted,
        totalBooksThisYear: updatedStudent.totalBooksThisYear,
        lastModified: updatedStudent.lastModified
      })

      setManualStudents(prev => 
        prev.map(s => 
          s.id === selectedStudent.id ? updatedStudent : s
        )
      )

      setBookSubmission({
        bookTitle: '',
        submissionType: 'book_report',
        submissionDate: new Date().toISOString().split('T')[0]
      })
      setShowBookSubmissionModal(false)
      setShowSuccess(`📚 Book added for ${selectedStudent.firstName}!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error adding book submission:', error)
      setShowSuccess('❌ Error adding book. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete manual student
  const deleteManualStudent = async (student) => {
    if (!confirm(`Are you sure you want to delete ${student.firstName} ${student.lastInitial}? This cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id)
      await deleteDoc(studentRef)

      setManualStudents(prev => prev.filter(s => s.id !== student.id))
      setShowSuccess(`🗑️ ${student.firstName} deleted successfully`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error deleting student:', error)
      setShowSuccess('❌ Error deleting student. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter students
  const filterStudents = (students) => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastInitial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.displayUsername && student.displayUsername.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesGrade = gradeFilter === 'all' || student.grade.toString() === gradeFilter
      
      return matchesSearch && matchesGrade
    })
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
            Loading students...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile || !['teacher', 'admin'].includes(userProfile.accountType)) {
    return null
  }

  const filteredAppStudents = filterStudents(appStudents)
  const filteredManualStudents = filterStudents(manualStudents)

  return (
    <>
      <Head>
        <title>My Students - Lux Libris</title>
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
                  My Students
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Manage your reading program students
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

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <StatCard
              icon="📱"
              title="App Students"
              value={statsData.totalAppStudents}
              subtitle="Self-registered students"
              color="#ADD4EA"
            />
            <StatCard
              icon="📝"
              title="Manual Students"
              value={statsData.totalManualStudents}
              subtitle="Teacher-managed"
              color="#C3E0DE"
            />
            <StatCard
              icon="📚"
              title="Total Books"
              value={statsData.totalBooks}
              subtitle="Books completed this year"
              color="#A1E5DB"
            />
            <StatCard
              icon="✅"
              title="Active Students"
              value={statsData.activeStudents}
              subtitle="Currently participating"
              color="#B6DFEB"
            />
          </div>

          {/* Search and Filter */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr auto',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search students by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  minWidth: '120px'
                }}
              >
                <option value="all">All Grades</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '0',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setActiveTab('app')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: activeTab === 'app' ? '#ADD4EA' : 'transparent',
                  color: activeTab === 'app' ? '#223848' : '#6b7280',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                📱 App Students ({filteredAppStudents.length})
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: activeTab === 'manual' ? '#C3E0DE' : 'transparent',
                  color: activeTab === 'manual' ? '#223848' : '#6b7280',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                📝 Manual Students ({filteredManualStudents.length})
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'app' ? (
            <AppStudentsSection 
              students={filteredAppStudents}
              onToggleStatus={toggleAppStudentStatus}
              onViewDetails={(student) => {
                setSelectedStudent(student)
                setShowStudentDetailModal(true)
              }}
              isProcessing={isProcessing}
            />
          ) : (
            <ManualStudentsSection 
              students={filteredManualStudents}
              onAddStudent={() => setShowAddManualModal(true)}
              onEditStudent={(student) => {
                setSelectedStudent(student)
                setShowEditModal(true)
              }}
              onDeleteStudent={deleteManualStudent}
              onAddBookSubmission={(student) => {
                setSelectedStudent(student)
                setShowBookSubmissionModal(true)
              }}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Add Manual Student Modal */}
        {showAddManualModal && (
          <Modal
            title="➕ Add Manual Student"
            onClose={() => setShowAddManualModal(false)}
          >
            <div style={{ display: 'grid', gap: '1rem' }}>
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
                  value={newManualStudent.firstName}
                  onChange={(e) => setNewManualStudent(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
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
                  Last Initial *
                </label>
                <input
                  type="text"
                  value={newManualStudent.lastInitial}
                  onChange={(e) => setNewManualStudent(prev => ({ 
                    ...prev, 
                    lastInitial: e.target.value.toUpperCase().slice(0, 1) 
                  }))}
                  placeholder="Enter last initial"
                  maxLength={1}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Grade
                  </label>
                  <select
                    value={newManualStudent.grade}
                    onChange={(e) => setNewManualStudent(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={4}>4th Grade</option>
                    <option value={5}>5th Grade</option>
                    <option value={6}>6th Grade</option>
                    <option value={7}>7th Grade</option>
                    <option value={8}>8th Grade</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Reading Goal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newManualStudent.personalGoal}
                    onChange={(e) => setNewManualStudent(prev => ({ ...prev, personalGoal: parseInt(e.target.value) }))}
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
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}>
                <button
                  onClick={() => setShowAddManualModal(false)}
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
                  Cancel
                </button>
                <button
                  onClick={addManualStudent}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Book Submission Modal */}
        {showBookSubmissionModal && selectedStudent && (
          <Modal
            title={`📚 Add Book for ${selectedStudent.firstName}`}
            onClose={() => setShowBookSubmissionModal(false)}
          >
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Book Title *
                </label>
                <input
                  type="text"
                  value={bookSubmission.bookTitle}
                  onChange={(e) => setBookSubmission(prev => ({ ...prev, bookTitle: e.target.value }))}
                  placeholder="Enter book title"
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
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Submission Type
                  </label>
                  <select
                    value={bookSubmission.submissionType}
                    onChange={(e) => setBookSubmission(prev => ({ ...prev, submissionType: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="book_report">Book Report</option>
                    <option value="presentation">Presentation</option>
                    <option value="discussion">Discussion</option>
                    <option value="review">Written Review</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={bookSubmission.submissionDate}
                    onChange={(e) => setBookSubmission(prev => ({ ...prev, submissionDate: e.target.value }))}
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
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}>
                <button
                  onClick={() => setShowBookSubmissionModal(false)}
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
                  Cancel
                </button>
                <button
                  onClick={addBookSubmission}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? 'Adding...' : 'Add Book'}
                </button>
              </div>
            </div>
          </Modal>
        )}

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
            { id: 'submissions', icon: '📋', label: 'Submissions', active: false },
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

// Supporting Components
function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${color}20`,
      position: 'relative'
    }}>
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

function AppStudentsSection({ students, onToggleStatus, onViewDetails, isProcessing }) {
  if (students.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          marginBottom: '0.5rem'
        }}>
          No App Students Yet
        </h3>
        <p style={{
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          Students will appear here when they sign up using your student join code.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'grid',
        gap: '1rem'
      }}>
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            type="app"
            onToggleStatus={() => onToggleStatus(student)}
            onViewDetails={() => onViewDetails(student)}
            isProcessing={isProcessing}
          />
        ))}
      </div>
    </div>
  )
}

function ManualStudentsSection({ students, onAddStudent, onEditStudent, onDeleteStudent, onAddBookSubmission, isProcessing }) {
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
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: 0
        }}>
          Manual Students
        </h3>
        <button
          onClick={onAddStudent}
          style={{
            background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
            color: '#223848',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ➕ Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
          <p>No manual students yet. Add students who don't use the app!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              type="manual"
              onEditStudent={() => onEditStudent(student)}
              onDeleteStudent={() => onDeleteStudent(student)}
              onAddBookSubmission={() => onAddBookSubmission(student)}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentCard({ student, type, onToggleStatus, onViewDetails, onEditStudent, onDeleteStudent, onAddBookSubmission, isProcessing }) {
  const isActive = student.status !== 'inactive'
  
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1rem',
      backgroundColor: isActive ? 'white' : '#f9fafb',
      opacity: isActive ? 1 : 0.7
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#223848',
              margin: 0
            }}>
              {student.firstName} {student.lastInitial}.
            </h4>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: type === 'app' ? '#ADD4EA' : '#C3E0DE',
              color: '#223848',
              borderRadius: '0.25rem',
              fontWeight: '600'
            }}>
              {type === 'app' ? 'APP' : 'MANUAL'}
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <div>Grade: {student.grade}</div>
            <div>Goal: {student.personalGoal} books</div>
            {type === 'app' && student.displayUsername && (
              <div>Username: {student.displayUsername}</div>
            )}
            <div>
              Books: {type === 'app' ? (student.booksSubmittedThisYear || 0) : (student.totalBooksThisYear || 0)}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'flex-end'
        }}>
          {type === 'app' ? (
            <>
              <button
                onClick={onToggleStatus}
                disabled={isProcessing}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: isActive ? '#f87171' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={onViewDetails}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#ADD4EA',
                  color: '#223848',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
              >
                View Details
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onAddBookSubmission}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
              >
                📚 Add Book
              </button>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={onEditStudent}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#C3E0DE',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={onDeleteStudent}
                  disabled={isProcessing}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f87171',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  🗑️
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
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
        padding: '1.5rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: 0
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem',
              borderRadius: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
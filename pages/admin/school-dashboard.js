import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext' // ADDED: Authentication
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'

export default function SchoolAdminDashboard() {
  const router = useRouter()
  
  // ADDED: Authentication with session timeout checking
  const { 
    user, 
    userProfile, 
    loading: authLoading, 
    isAuthenticated, 
    isSessionExpired, 
    signOut,
    updateLastActivity // Update activity on interactions
  } = useAuth()

  const [activeTab, setActiveTab] = useState('students')
  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState(null)
  const [students, setStudents] = useState([])
  const [pendingSubmissions, setPendingSubmissions] = useState([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastInitial: '',
    grade: '4th Grade',
    goal: 10,
    historicalBooks: {}
  })

  // ADDED: Session timeout warning state
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  // ADDED: Authentication and session checking
  useEffect(() => {
    const checkAuthAndSession = async () => {
      if (authLoading) return // Wait for auth to load

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('❌ Admin not authenticated, redirecting to sign-in')
        router.push('/sign-in')
        return
      }

      // Check if user is admin
      if (userProfile && userProfile.accountType !== 'admin') {
        console.log('❌ User is not admin, redirecting to appropriate dashboard')
        router.push('/role-selector')
        return
      }

      // Check session expiry for admins
      if (userProfile?.accountType === 'admin' && isSessionExpired()) {
        console.log('⏰ Admin session expired, signing out')
        await signOut({ redirectTo: '/sign-in?reason=session-expired' })
        return
      }

      // If we get here, admin is authenticated and session is valid
      if (userProfile) {
        loadSchoolData()
      }
    }

    checkAuthAndSession()
  }, [authLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

  // ADDED: Periodic session checking while on page
  useEffect(() => {
    if (!userProfile?.accountType === 'admin') return

    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        console.log('⏰ Admin session expired during use, signing out')
        signOut({ redirectTo: '/sign-in?reason=session-expired' })
      } else {
        // Check if close to expiry (55 minutes = 55 * 60 * 1000)
        const warningTime = 55 * 60 * 1000
        const timeLeft = warningTime - (Date.now() - (parseInt(localStorage.getItem('luxlibris_last_activity')) || Date.now()))
        
        if (timeLeft <= 0 && timeLeft > -60000) { // Show warning in last 5 minutes
          setShowTimeoutWarning(true)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(sessionCheckInterval)
  }, [userProfile, isSessionExpired, signOut])

  // ADDED: Update activity on user interactions
  const handleUserActivity = () => {
    updateLastActivity()
    setShowTimeoutWarning(false) // Hide warning if user is active
  }

  // ADDED: Set up activity tracking for this page
  useEffect(() => {
    // Add click listeners to update activity
    document.addEventListener('click', handleUserActivity)
    document.addEventListener('keypress', handleUserActivity)

    return () => {
      document.removeEventListener('click', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [])

  const loadSchoolData = async () => {
    try {
      // TODO: Get school ID from auth/session - for now using Holy Family
      const schoolId = 'holy-family-austin'
      
      // Load school info
      const schoolsRef = collection(db, 'schools')
      const schoolSnapshot = await getDocs(schoolsRef)
      
      // Find Holy Family or use first school
      let schoolData = null
      schoolSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.name?.includes('Holy Family') || !schoolData) {
          schoolData = { id: doc.id, ...data }
        }
      })
      
      if (schoolData) {
        setSchool(schoolData)
      }

      // Load students (mock data for now since we don't have real students yet)
      const mockStudents = [
        {
          id: 'student1',
          firstName: 'Emma',
          lastInitial: 'K',
          grade: '5th Grade',
          goal: 15,
          booksReadThisYear: 6,
          totalBooksRead: 41,
          saintCount: 8,
          readingStreak: 7,
          schoolId: schoolId,
          achievements: ['5-book-milestone', 'first-saint'],
          currentBooks: ['Wonder', 'Hatchet']
        },
        {
          id: 'student2', 
          firstName: 'Jack',
          lastInitial: 'M',
          grade: '4th Grade',
          goal: 10,
          booksReadThisYear: 3,
          totalBooksRead: 23,
          saintCount: 4,
          readingStreak: 2,
          schoolId: schoolId,
          achievements: ['first-book'],
          currentBooks: ['The Wild Robot']
        },
        {
          id: 'student3',
          firstName: 'Sophia',
          lastInitial: 'L',
          grade: '6th Grade', 
          goal: 20,
          booksReadThisYear: 12,
          totalBooksRead: 67,
          saintCount: 15,
          readingStreak: 14,
          schoolId: schoolId,
          achievements: ['10-book-milestone', 'reading-streak-10'],
          currentBooks: ['The Giver', 'Bridge to Terabithia']
        }
      ]
      setStudents(mockStudents)

      // Load pending submissions
      setPendingSubmissions([
        { 
          id: 1, 
          studentId: 'student1',
          studentName: 'Emma K.', 
          book: 'Wonder', 
          submittedAt: '2 hours ago',
          status: 'pending'
        },
        { 
          id: 2, 
          studentId: 'student2',
          studentName: 'Jack M.', 
          book: 'Hatchet', 
          submittedAt: '1 day ago',
          status: 'pending'  
        },
      ])

    } catch (error) {
      console.error('Error loading school data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastInitial) return
    
    try {
      const studentId = `${newStudent.firstName.toLowerCase()}-${newStudent.lastInitial.toLowerCase()}-${Date.now()}`
      const studentData = {
        id: studentId,
        ...newStudent,
        schoolId: school?.id || 'holy-family-austin',
        createdAt: new Date(),
        booksReadThisYear: 0,
        totalBooksRead: Object.values(newStudent.historicalBooks).reduce((sum, books) => sum + books, 0),
        saintCount: 0,
        readingStreak: 0,
        achievements: [],
        currentBooks: []
      }
      
      // Add to local state immediately for demo
      setStudents(prev => [...prev, studentData])
      
      // TODO: Add to Firebase when students collection is set up
      // await addDoc(collection(db, 'students'), studentData)
      
      setNewStudent({ firstName: '', lastInitial: '', grade: '4th Grade', goal: 10, historicalBooks: {} })
      setShowAddStudent(false)
    } catch (error) {
      console.error('Error adding student:', error)
    }
  }

  const approveSubmission = async (submissionId) => {
    setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId))
    // TODO: Update in Firebase and award saint achievement
  }

  // ADDED: Handle session extension
  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  // ADDED: Handle sign out from timeout warning
  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
  }

  // Show loading while checking authentication OR loading data
  if (authLoading || (isAuthenticated && !userProfile) || loading) {
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
            {authLoading ? 'Checking authentication...' : 'Loading your dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !userProfile || userProfile.accountType !== 'admin') {
    return null
  }

  return (
    <>
      <Head>
        <title>School Admin Dashboard - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* ADDED: Session Timeout Warning Modal */}
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
                Your admin session will expire in a few minutes for security. Would you like to continue working?
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
        
        {/* Header - Mobile Optimized */}
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
            padding: '0 1rem', // Reduced for mobile
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              minWidth: 0, // Allow shrinking
              flex: 1
            }}>
              <div style={{
                width: '2.5rem', // Smaller on mobile
                height: '2.5rem',
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                🏫
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', // Responsive font
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {school?.name || 'School Admin'}
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  margin: 0,
                  display: window.innerWidth > 480 ? 'block' : 'none' // Hide subtitle on very small screens
                }}>
                  Manage your Lux Libris reading program
                </p>
              </div>
            </div>
            
            {/* ADDED: Sign out button */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                  flexShrink: 0,
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                🚪 Sign Out
              </button>
              <button style={{
                padding: '0.5rem 0.75rem',
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                color: '#223848',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                minHeight: '36px', // Touch target
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                ⚙️ Settings
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem' // Reduced padding for mobile
        }}>
          
          {/* Quick Stats - Mobile Optimized Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', // Smaller minimum for mobile
            gap: '0.75rem', // Reduced gap
            marginBottom: '1.5rem'
          }}>
            <StatCard
              icon="🧑‍🎓"
              title="Students"
              value={students.length}
              subtitle="Active readers"
              color="#ADD4EA"
            />
            <StatCard
              icon="📚"
              title="Books Read"
              value={students.reduce((sum, s) => sum + (s.booksReadThisYear || 0), 0)}
              subtitle="This year"
              color="#C3E0DE"
            />
            <StatCard
              icon="⏳"
              title="Pending"
              value={pendingSubmissions.length}
              subtitle="Need approval"
              color="#A1E5DB"
            />
            <StatCard
              icon="🏆"
              title="Progress"
              value={`${Math.round((students.reduce((sum, s) => sum + (s.booksReadThisYear || 0), 0) / students.reduce((sum, s) => sum + (s.goal || 10), 0)) * 100)}%`}
              subtitle="School avg"
              color="#B6DFEB"
            />
          </div>

          {/* Navigation Tabs - Mobile Optimized */}
          <div style={{
            background: 'white',
            borderRadius: '1rem 1rem 0 0',
            padding: '0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              overflowX: 'auto', // Allow horizontal scroll on mobile
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none' // IE
            }}>
              {[
                { id: 'students', label: '👥 Students', shortLabel: 'Students', count: students.length },
                { id: 'submissions', label: '📋 Submissions', shortLabel: 'Pending', count: pendingSubmissions.length },
                { id: 'reports', label: '📊 Reports', shortLabel: 'Reports', count: null },
                { id: 'settings', label: '⚙️ Settings', shortLabel: 'Settings', count: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: activeTab === tab.id ? '#ADD4EA' : 'transparent',
                    color: activeTab === tab.id ? '#223848' : '#6b7280',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    borderRadius: activeTab === tab.id ? '0.5rem 0.5rem 0 0' : '0',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minHeight: '44px' // Touch target
                  }}
                >
                  {/* Show short label on small screens */}
                  <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>
                    {tab.label}
                  </span>
                  <span style={{ display: window.innerWidth <= 480 ? 'inline' : 'none' }}>
                    {tab.shortLabel}
                  </span>
                  {tab.count !== null && (
                    <span style={{
                      background: activeTab === tab.id ? '#223848' : '#C3E0DE',
                      color: activeTab === tab.id ? 'white' : '#223848',
                      borderRadius: '50%',
                      width: '1.125rem',
                      height: '1.125rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.625rem',
                      fontWeight: 'bold'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content - REST STAYS THE SAME */}
          <div style={{
            background: 'white',
            borderRadius: '0 0 1rem 1rem',
            padding: 'clamp(1rem, 4vw, 2rem)', // Responsive padding
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            minHeight: '20rem' // Reduced for mobile
          }}>
            
            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                    fontWeight: 'bold',
                    color: '#223848',
                    margin: 0,
                    fontFamily: 'Georgia, serif'
                  }}>
                    Student Management
                  </h2>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                      color: '#223848',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      minHeight: '44px', // Touch target
                      flexShrink: 0
                    }}
                  >
                    ➕ Add Student
                  </button>
                </div>

                {/* Add Student Modal - Mobile Optimized */}
                {showAddStudent && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem' // Add padding for mobile
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '1rem',
                      padding: 'clamp(1rem, 4vw, 2rem)',
                      maxWidth: '28rem',
                      width: '100%',
                      maxHeight: '90vh', // More space on mobile
                      overflowY: 'auto'
                    }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#223848',
                        marginBottom: '1rem'
                      }}>
                        Add New Student
                      </h3>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          First Name
                        </label>
                        <input
                          type="text"
                          value={newStudent.firstName}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            minHeight: '44px' // Touch target
                          }}
                          placeholder="Emma"
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
                          Last Initial
                        </label>
                        <input
                          type="text"
                          maxLength="1"
                          value={newStudent.lastInitial}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, lastInitial: e.target.value.toUpperCase() }))}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            minHeight: '44px'
                          }}
                          placeholder="K"
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
                          Grade
                        </label>
                        <select
                          value={newStudent.grade}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, grade: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            minHeight: '44px'
                          }}
                        >
                          <option>4th Grade</option>
                          <option>5th Grade</option>
                          <option>6th Grade</option>
                          <option>7th Grade</option>
                          <option>8th Grade</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Reading Goal (1-20 books)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={newStudent.goal}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, goal: parseInt(e.target.value) || 10 }))}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            minHeight: '44px'
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => setShowAddStudent(false)}
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minHeight: '44px',
                            flex: '1',
                            minWidth: '100px'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addStudent}
                          disabled={!newStudent.firstName || !newStudent.lastInitial}
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: newStudent.firstName && newStudent.lastInitial 
                              ? 'linear-gradient(135deg, #ADD4EA, #C3E0DE)' 
                              : '#d1d5db',
                            color: '#223848',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: newStudent.firstName && newStudent.lastInitial ? 'pointer' : 'not-allowed',
                            minHeight: '44px',
                            flex: '1',
                            minWidth: '120px'
                          }}
                        >
                          Add Student
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Students List - Mobile Optimized */}
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {students.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: '#6b7280'
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
                      <h3 style={{ color: '#223848', marginBottom: '0.5rem' }}>No students yet</h3>
                      <p>Add your first student to get started!</p>
                    </div>
                  ) : (
                    students.map(student => (
                      <StudentCard key={student.id} student={student} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1.5rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  Pending Book Submissions
                </h2>

                {pendingSubmissions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ color: '#223848', marginBottom: '0.5rem' }}>All caught up!</h3>
                    <p>No pending submissions to review.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {pendingSubmissions.map(submission => (
                      <div key={submission.id} style={{
                        padding: '1.25rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#223848',
                            margin: '0 0 0.25rem 0',
                            lineHeight: '1.3'
                          }}>
                            {submission.studentName} completed &quot;{submission.book}&quot;
                          </h4>
                          <p style={{
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            margin: 0
                          }}>
                            Submitted {submission.submittedAt}
                          </p>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end'
                        }}>
                          <button
                            onClick={() => approveSubmission(submission.id)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'linear-gradient(135deg, #34d399, #10b981)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              minHeight: '36px'
                            }}
                          >
                            ✅ Approve
                          </button>
                          <button style={{
                            padding: '0.5rem 0.75rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            minHeight: '36px'
                          }}>
                            👁️ Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1.5rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  School Reports & Analytics
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <ReportCard
                    title="📊 Reading Progress Report"
                    description="Detailed breakdown of student progress, goals, and achievements"
                    buttonText="Generate Report"
                    comingSoon={true}
                  />
                  <ReportCard
                    title="🏆 Achievement Summary"
                    description="Saints earned, milestones reached, and celebration planning"
                    buttonText="View Achievements"
                    comingSoon={true}
                  />
                  <ReportCard
                    title="📈 Class Analytics"
                    description="Grade-level insights and reading trends across your school"
                    buttonText="View Analytics"
                    comingSoon={true}
                  />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1.5rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  School Settings
                </h2>
                
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  <SettingsCard
                    title="🏫 School Information"
                    description="Update school name, contact info, and program details"
                    buttonText="Edit School Info"
                    comingSoon={true}
                  />
                  <SettingsCard
                    title="📚 Book Selection"
                    description="Modify your selected nominees and achievement tiers"
                    buttonText="Manage Books"
                    comingSoon={true}
                  />
                  <SettingsCard
                    title="🔐 Parent Access Codes"
                    description="Update quiz codes and parent permissions"
                    buttonText="Manage Access"
                    comingSoon={true}
                  />
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
        
        /* Hide scrollbar for tab navigation */
        .tab-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}

function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: 'clamp(0.75rem, 3vw, 1.25rem)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${color}20`,
      minHeight: '100px' // Ensure consistent height
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span style={{ 
          fontSize: 'clamp(1rem, 3vw, 1.25rem)' 
        }}>
          {icon}
        </span>
        <div style={{
          width: 'clamp(2rem, 6vw, 2.5rem)',
          height: 'clamp(2rem, 6vw, 2.5rem)',
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
        fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 0.125rem 0',
        lineHeight: '1.1'
      }}>
        {value}
      </h3>
      <p style={{
        fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)',
        color: '#6b7280',
        margin: 0,
        fontWeight: '600'
      }}>
        {title}
      </p>
      <p style={{
        fontSize: 'clamp(0.55rem, 2vw, 0.65rem)',
        color: '#9ca3af',
        margin: '0.125rem 0 0 0'
      }}>
        {subtitle}
      </p>
    </div>
  )
}

function StudentCard({ student }) {
  const progressPercent = student.goal ? Math.round((student.booksReadThisYear / student.goal) * 100) : 0

  return (
    <div style={{
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 'clamp(0.75rem, 3vw, 1.5rem)',
      alignItems: 'center',
      '@media (max-width: 640px)': {
        gridTemplateColumns: '1fr',
        gap: '1rem'
      }
    }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            flexShrink: 0
          }}>
            👤
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{
              fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
              fontWeight: '600',
              color: '#223848',
              margin: '0 0 0.125rem 0'
            }}>
              {student.firstName} {student.lastInitial}.
            </h4>
            <p style={{
              fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
              color: '#6b7280',
              margin: 0
            }}>
              {student.grade} • Goal: {student.goal} books
            </p>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                fontSize: '0.625rem',
                color: '#6b7280'
              }}>
                Progress
              </span>
              <span style={{
                fontSize: '0.625rem',
                fontWeight: '600',
                color: '#223848'
              }}>
                {student.booksReadThisYear || 0} / {student.goal}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '0.5rem',
              background: '#e5e7eb',
              borderRadius: '0.25rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(progressPercent, 100)}%`,
                height: '100%',
                background: progressPercent >= 100 
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #ADD4EA, #C3E0DE)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.625rem',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontWeight: '600', 
                color: '#223848',
                fontSize: '0.75rem'
              }}>
                {student.saintCount || 0}
              </div>
              <div>Saints</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontWeight: '600', 
                color: '#223848',
                fontSize: '0.75rem'
              }}>
                {student.readingStreak || 0}
              </div>
              <div>Streak</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '0.375rem',
        flexWrap: 'wrap',
        justifyContent: 'flex-end'
      }}>
        <button style={{
          padding: '0.5rem 0.75rem',
          background: '#f3f4f6',
          color: '#374151',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          cursor: 'pointer',
          minHeight: '36px'
        }}>
          📊 View
        </button>
        <button style={{
          padding: '0.5rem 0.75rem',
          background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
          color: '#223848',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          cursor: 'pointer',
          minHeight: '36px'
        }}>
          ✏️ Edit
        </button>
      </div>
    </div>
  )
}

function ReportCard({ title, description, buttonText, comingSoon }) {
  return (
    <div style={{
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      background: 'white'
    }}>
      <h3 style={{
        fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
        fontWeight: '600',
        color: '#223848',
        margin: '0 0 0.5rem 0'
      }}>
        {title}
      </h3>
      <p style={{
        color: '#6b7280',
        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
        margin: '0 0 1rem 0',
        lineHeight: '1.4'
      }}>
        {description}
      </p>
      <button style={{
        padding: '0.5rem 1rem',
        background: comingSoon ? '#f3f4f6' : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
        color: comingSoon ? '#9ca3af' : '#223848',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        minHeight: '36px'
      }}>
        {comingSoon ? 'Coming Soon' : buttonText}
      </button>
    </div>
  )
}

function SettingsCard({ title, description, buttonText, comingSoon }) {
  return (
    <div style={{
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      background: 'white',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '1rem',
      alignItems: 'center',
      '@media (max-width: 640px)': {
        gridTemplateColumns: '1fr',
        gap: '0.75rem'
      }
    }}>
      <div>
        <h3 style={{
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          fontWeight: '600',
          color: '#223848',
          margin: '0 0 0.5rem 0'
        }}>
          {title}
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
          margin: 0,
          lineHeight: '1.4'
        }}>
          {description}
        </p>
      </div>
      <button style={{
        padding: '0.5rem 1rem',
        background: comingSoon ? '#f3f4f6' : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
        color: comingSoon ? '#9ca3af' : '#223848',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        minHeight: '36px',
        justifySelf: 'end'
      }}>
        {comingSoon ? 'Coming Soon' : buttonText}
      </button>
    </div>
  )
}
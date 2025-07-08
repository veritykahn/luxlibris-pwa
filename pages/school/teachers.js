// pages/school/teachers.js - DEDICATED TEACHER MANAGEMENT PAGE (FIXED)
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { db } from '../../lib/firebase'
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore'

export default function SchoolTeachers() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  // Auth and School Data (matching dashboard pattern)
  const [authData, setAuthData] = useState({
    schoolCode: '',
    email: '',
    isAuthenticated: false
  })
  const [schoolData, setSchoolData] = useState(null)
  const [parentEntity, setParentEntity] = useState(null)
  
  // Teacher Management Data
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  
  // Search and Filter State
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('')
  const [teacherFilterStatus, setTeacherFilterStatus] = useState('all')

  // Session timeout (2 hours = 7200000 ms)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // Load session data on mount (matching dashboard pattern)
  useEffect(() => {
    const savedSession = localStorage.getItem('schoolSession')
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        const now = Date.now()
        const timePassed = now - sessionData.lastActivity
        
        if (timePassed < SESSION_TIMEOUT && sessionData.schoolData) {
          setAuthData({ 
            schoolCode: sessionData.schoolCode || '',
            email: sessionData.email || '',
            isAuthenticated: true 
          })
          setSchoolData(sessionData.schoolData)
          setLastActivity(sessionData.lastActivity)
          setIsAuthenticated(true)
          loadSchoolData(sessionData.schoolData)
        } else {
          localStorage.removeItem('schoolSession')
          router.push('/school/dashboard')
        }
      } catch (error) {
        console.error('Error loading session:', error)
        router.push('/school/dashboard')
      }
    } else {
      router.push('/school/dashboard')
    }
  }, [router, SESSION_TIMEOUT])

  // Update activity tracking (matching dashboard pattern)
  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      if (schoolData) {
        localStorage.setItem('schoolSession', JSON.stringify({
          authenticated: true,
          schoolCode: authData.schoolCode,
          email: authData.email,
          schoolData: schoolData,
          lastActivity: newActivity
        }))
      }
    }
    
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    events.forEach(event => 
      document.addEventListener(event, updateActivity, true)
    )

    return () => {
      events.forEach(event => 
        document.removeEventListener(event, updateActivity, true)
      )
    }
  }, [isAuthenticated, schoolData, authData.email, authData.schoolCode])

  // Load school data
  const loadSchoolData = async (school) => {
    try {
      setLoading(true)
      console.log('📊 Loading school data for teacher management...')
      
      const dioceseId = school.dioceseId || school.parentEntityId
      const schoolId = school.id
      
      if (!dioceseId || !schoolId) {
        console.error('Missing dioceseId or schoolId in school data')
        return
      }

      // Load parent entity data
      if (dioceseId) {
        try {
          const parentEntityRef = doc(db, 'entities', dioceseId)
          const parentEntityDoc = await getDoc(parentEntityRef)
          
          if (parentEntityDoc.exists()) {
            setParentEntity({ id: parentEntityDoc.id, ...parentEntityDoc.data() })
          }
        } catch (parentError) {
          console.log('Could not load parent entity:', parentError)
        }
      }

      // Load students first (needed for teacher student counts)
      const studentsRef = collection(db, `entities/${dioceseId}/schools/${schoolId}/students`)
      const studentsSnapshot = await getDocs(studentsRef)
      const studentsData = []
      studentsSnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() })
      })
      setStudents(studentsData)

      // Load teachers
      const teachersRef = collection(db, `entities/${dioceseId}/schools/${schoolId}/teachers`)
      const teachersSnapshot = await getDocs(teachersRef)
      const teachersData = []
      teachersSnapshot.forEach((doc) => {
        teachersData.push({ id: doc.id, ...doc.data() })
      })
      
      // Calculate student counts for each teacher
      const teachersWithStudentCounts = teachersData.map((teacher) => {
        // Count students where currentTeacherId matches this teacher's ID
        const studentCount = studentsData.filter(student => 
          student.currentTeacherId === teacher.id
        ).length
        
        return {
          ...teacher,
          studentCount,
          // Set grade to "All Grades" for reading program teachers
          grade: teacher.grade || 'All Grades'
        }
      })
      
      setTeachers(teachersWithStudentCounts)
      console.log('📚 Loaded teachers with student counts:', teachersWithStudentCounts.length)
      
      console.log('✅ School data loaded successfully')
      
    } catch (error) {
      console.error('Error loading school data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Remove teacher function
  const handleRemoveTeacher = async (teacherId, teacherEmail, teacherName) => {
    const confirmed = window.confirm(`Remove Teacher?

👨‍🏫 ${teacherName}
📧 ${teacherEmail}

This will remove their access to the reading program immediately and remove all their students.

Continue?`)
    
    if (confirmed) {
      try {
        setLoading(true)
        
        const dioceseId = schoolData.dioceseId || schoolData.parentEntityId
        const schoolId = schoolData.id
        
        await deleteDoc(doc(db, `entities/${dioceseId}/schools/${schoolId}/teachers`, teacherId))
        
        console.log('✅ Teacher removed successfully')
        alert(`Teacher "${teacherName}" has been removed.`)
        
        // Reload school data
        await loadSchoolData(schoolData)
      } catch (error) {
        console.error('❌ Error removing teacher:', error)
        alert('Error removing teacher: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Filter teachers for search/filter functionality
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacherSearchTerm === '' || 
      teacher.firstName?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(teacherSearchTerm.toLowerCase())
    
    const matchesStatus = teacherFilterStatus === 'all' || teacher.status === teacherFilterStatus
    
    return matchesSearch && matchesStatus
  })

  // Show loading if not authenticated yet
  if (!isAuthenticated || !schoolData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFCF5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #A1E5DB',
            borderTop: '4px solid #065F46',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#065F46', fontSize: '1.1rem', fontFamily: 'Avenir' }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Teacher Management - {schoolData?.name || 'School Dashboard'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: '#FFFCF5',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #A1E5DB',
          padding: '1rem 0',
          boxShadow: '0 2px 10px rgba(161, 229, 219, 0.1)'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/school/dashboard" style={{
                color: '#065F46',
                fontSize: '1.5rem',
                textDecoration: 'none',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'background 0.2s'
              }}>
                ← 
              </Link>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #065F46, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                👨‍🏫
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                  fontWeight: '300',
                  color: '#065F46',
                  margin: 0,
                  fontFamily: 'Didot, Georgia, serif',
                  letterSpacing: '1.2px'
                }}>
                  Teacher Management
                </h1>
                <p style={{
                  color: '#A1E5DB',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}>
                  {schoolData?.name} • {teachers.length} Teachers
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link href="/school/dashboard" style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #A1E5DB, #68D391)',
                color: '#065F46',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                🏫 Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1.5rem'
        }}>

          {/* Teacher Stats Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard 
              title="Total Teachers" 
              value={teachers.length} 
              subtitle="Registered educators"
              icon="👨‍🏫" 
              color="#065F46"
            />
            <StatCard 
              title="Active Teachers" 
              value={teachers.filter(t => t.status === 'active').length} 
              subtitle="Currently teaching"
              icon="✅" 
              color="#68D391"
            />
            <StatCard 
              title="Total Students" 
              value={students.length} 
              subtitle="Across all teachers"
              icon="🎓" 
              color="#A1E5DB"
            />
            <StatCard 
              title="Recent Joins" 
              value={teachers.filter(t => {
                if (!t.createdAt || !t.createdAt.seconds) return false
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(t.createdAt.seconds * 1000) > weekAgo
              }).length} 
              subtitle="This week"
              icon="🆕" 
              color="#10B981"
            />
          </div>

          {/* Search and Filter Controls */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              alignItems: 'end'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#065F46',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Search Teachers
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #A1E5DB',
                    background: '#FFFCF5',
                    color: '#065F46',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Avenir'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: '#065F46',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Filter by Status
                </label>
                <select
                  value={teacherFilterStatus}
                  onChange={(e) => setTeacherFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #A1E5DB',
                    background: 'white',
                    color: '#065F46',
                    fontSize: '1rem',
                    fontFamily: 'Avenir'
                  }}
                >
                  <option value="all">All Teachers</option>
                  <option value="active">Active Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setTeacherSearchTerm('')
                    setTeacherFilterStatus('all')
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#A1E5DB',
                    color: '#065F46',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  🔄 Reset
                </button>
                <button
                  onClick={() => loadSchoolData(schoolData)}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: loading ? '#D1FAE5' : '#68D391',
                    color: '#065F46',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  {loading ? '⏳' : '🔄'} Refresh
                </button>
              </div>
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#A1E5DB',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#065F46',
              fontFamily: 'Avenir'
            }}>
              📊 Showing {filteredTeachers.length} of {teachers.length} teachers
              {parentEntity && (
                <span> • Program provided by {parentEntity.name}</span>
              )}
            </div>
          </div>

          {/* Teachers List */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              color: '#065F46',
              marginBottom: '1.5rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              All Teachers ({filteredTeachers.length})
            </h2>

            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#A1E5DB',
                borderRadius: '0.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  border: '3px solid #065F46',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ margin: 0, color: '#065F46', fontFamily: 'Avenir' }}>
                  Loading teachers...
                </p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#A1E5DB',
                borderRadius: '0.5rem'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🏫</div>
                <h3 style={{
                  color: '#065F46',
                  fontSize: '1.25rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  {teachers.length === 0 ? 'No Teachers Yet' : 'No Teachers Match Your Search'}
                </h3>
                <p style={{ 
                  margin: 0, 
                  color: '#065F46', 
                  fontSize: '1rem', 
                  fontFamily: 'Avenir' 
                }}>
                  {teachers.length === 0 
                    ? 'Teachers will appear here after they sign up using your teacher join code.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {teachers.length === 0 && (
                  <Link href="/school/dashboard" style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#68D391',
                    color: '#065F46',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir'
                  }}>
                    📋 View Teacher Join Code
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredTeachers.map(teacher => (
                  <TeacherCard 
                    key={teacher.id} 
                    teacher={teacher} 
                    onRemove={() => handleRemoveTeacher(teacher.id, teacher.email, `${teacher.firstName} ${teacher.lastName}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Teacher Join Code Quick Reference */}
          {schoolData?.teacherJoinCode && (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginTop: '2rem',
              border: '1px solid #A1E5DB',
              boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#065F46',
                marginBottom: '1rem',
                fontFamily: 'Avenir'
              }}>
                Teacher Join Code
              </h3>
              <div style={{
                background: '#A1E5DB',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#065F46',
                  marginBottom: '0.25rem',
                  letterSpacing: '0.1em',
                  fontFamily: 'Avenir'
                }}>
                  {schoolData.teacherJoinCode}
                </div>
                <div style={{
                  color: '#065F46',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir'
                }}>
                  Share this code with new teachers
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(schoolData.teacherJoinCode)
                  alert('Teacher join code copied to clipboard!')
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#68D391',
                  color: '#065F46',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Avenir'
                }}
              >
                📋 Copy Code
              </button>
            </div>
          )}
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
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid #A1E5DB',
      boxShadow: '0 2px 8px rgba(161, 229, 219, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#065F46',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#065F46',
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#A1E5DB',
        fontFamily: 'Avenir'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

function TeacherCard({ teacher, onRemove }) {
  return (
    <div style={{
      background: '#FFFCF5',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      border: '1px solid #A1E5DB'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#065F46',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'Avenir'
          }}>
            👨‍🏫 {teacher.firstName} {teacher.lastName}
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#A1E5DB', lineHeight: '1.5', fontFamily: 'Avenir' }}>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              📧 {teacher.email}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              🎓 Grade: {teacher.grade}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              👥 Students: {teacher.studentCount}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              📅 Joined: {teacher.createdAt && teacher.createdAt.seconds 
                ? new Date(teacher.createdAt.seconds * 1000).toLocaleDateString() 
                : 'Recently'}
            </p>
            {teacher.lastLogin && teacher.lastLogin.seconds && (
              <p style={{ margin: '0 0 0.25rem 0' }}>
                🔄 Last Login: {new Date(teacher.lastLogin.seconds * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: teacher.status === 'active' 
              ? '#68D391' 
              : teacher.status === 'pending'
              ? '#F6AD55'
              : '#FED7D7',
            color: '#065F46',
            fontFamily: 'Avenir'
          }}>
            {teacher.status === 'active' ? '✅ Active' : 
             teacher.status === 'pending' ? '⏳ Pending' : '❌ Inactive'}
          </span>
          
          <button
            onClick={onRemove}
            style={{
              background: 'rgba(229, 62, 62, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              fontFamily: 'Avenir'
            }}
            title="Remove Teacher"
          >
            🗑️ Remove
          </button>
        </div>
      </div>
    </div>
  )
}
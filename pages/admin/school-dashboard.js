import { useState, useEffect } from 'react'
import Head from 'next/head'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'

export default function SchoolAdminDashboard() {
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

  useEffect(() => {
    loadSchoolData()
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

      // Load students (mock data for now since we don&apos;t have real students yet)
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

  if (loading) {
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
          <p style={{ color: '#223848', fontSize: '1.1rem' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>School Admin Dashboard - Lux Libris</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(195, 224, 222, 0.3)',
          padding: '1rem 0'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  {school?.name || 'School Admin'} Dashboard
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Manage your Lux Libris reading program
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                color: '#223848',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
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
          padding: '2rem 1.5rem'
        }}>
          
          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard
              icon="🧑‍🎓"
              title="Total Students"
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
              title="Pending Reviews"
              value={pendingSubmissions.length}
              subtitle="Need approval"
              color="#A1E5DB"
            />
            <StatCard
              icon="🏆"
              title="Goal Progress"
              value={`${Math.round((students.reduce((sum, s) => sum + (s.booksReadThisYear || 0), 0) / students.reduce((sum, s) => sum + (s.goal || 10), 0)) * 100)}%`}
              subtitle="School average"
              color="#B6DFEB"
            />
          </div>

          {/* Navigation Tabs */}
          <div style={{
            background: 'white',
            borderRadius: '1rem 1rem 0 0',
            padding: '0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {[
                { id: 'students', label: '👥 Students', count: students.length },
                { id: 'submissions', label: '📋 Submissions', count: pendingSubmissions.length },
                { id: 'reports', label: '📊 Reports', count: null },
                { id: 'settings', label: '⚙️ Settings', count: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: activeTab === tab.id ? '#ADD4EA' : 'transparent',
                    color: activeTab === tab.id ? '#223848' : '#6b7280',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    borderRadius: activeTab === tab.id ? '0.5rem 0.5rem 0 0' : '0',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span style={{
                      background: activeTab === tab.id ? '#223848' : '#C3E0DE',
                      color: activeTab === tab.id ? 'white' : '#223848',
                      borderRadius: '50%',
                      width: '1.25rem',
                      height: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{
            background: 'white',
            borderRadius: '0 0 1rem 1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            minHeight: '24rem'
          }}>
            
            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
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
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                      color: '#223848',
                      border: 'none',
                      borderRadius: '0.5rem',
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

                {/* Add Student Modal */}
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
                    zIndex: 1000
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '1rem',
                      padding: '2rem',
                      maxWidth: '28rem',
                      width: '90%',
                      maxHeight: '80vh',
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
                            boxSizing: 'border-box'
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
                            boxSizing: 'border-box'
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
                            boxSizing: 'border-box'
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
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => setShowAddStudent(false)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addStudent}
                          disabled={!newStudent.firstName || !newStudent.lastInitial}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: newStudent.firstName && newStudent.lastInitial 
                              ? 'linear-gradient(135deg, #ADD4EA, #C3E0DE)' 
                              : '#d1d5db',
                            color: '#223848',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: newStudent.firstName && newStudent.lastInitial ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Add Student
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Students List */}
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {students.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: '#6b7280'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
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
                  fontSize: '1.5rem',
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
                    padding: '3rem',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ color: '#223848', marginBottom: '0.5rem' }}>All caught up!</h3>
                    <p>No pending submissions to review.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {pendingSubmissions.map(submission => (
                      <div key={submission.id} style={{
                        padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#223848',
                            margin: '0 0 0.25rem 0'
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
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            onClick={() => approveSubmission(submission.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'linear-gradient(135deg, #34d399, #10b981)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Approve
                          </button>
                          <button style={{
                            padding: '0.5rem 1rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer'
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
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1.5rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  School Reports & Analytics
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
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
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1.5rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  School Settings
                </h2>
                
                <div style={{
                  display: 'grid',
                  gap: '1.5rem'
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
      `}</style>
    </>
  )
}

function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${color}20`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <div style={{
          width: '3rem',
          height: '3rem',
          background: `${color}15`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            background: color,
            borderRadius: '50%'
          }}></div>
        </div>
      </div>
      <h3 style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 0.25rem 0'
      }}>
        {value}
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        margin: 0
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '0.75rem',
        color: '#9ca3af',
        margin: '0.25rem 0 0 0'
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
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '1.5rem',
      alignItems: 'center'
    }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            👤
          </div>
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#223848',
              margin: '0 0 0.25rem 0'
            }}>
              {student.firstName} {student.lastInitial}.
            </h4>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              {student.grade} • Goal: {student.goal} books
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Progress
              </span>
              <span style={{
                fontSize: '0.75rem',
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
            gap: '1rem',
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#223848' }}>
                {student.saintCount || 0}
              </div>
              <div>Saints</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#223848' }}>
                {student.readingStreak || 0}
              </div>
              <div>Streak</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button style={{
          padding: '0.5rem 1rem',
          background: '#f3f4f6',
          color: '#374151',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          📊 View
        </button>
        <button style={{
          padding: '0.5rem 1rem',
          background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
          color: '#223848',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer'
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
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      background: 'white'
    }}>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#223848',
        margin: '0 0 0.5rem 0'
      }}>
        {title}
      </h3>
      <p style={{
        color: '#6b7280',
        fontSize: '0.875rem',
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
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: comingSoon ? 'not-allowed' : 'pointer'
      }}>
        {comingSoon ? 'Coming Soon' : buttonText}
      </button>
    </div>
  )
}

function SettingsCard({ title, description, buttonText, comingSoon }) {
  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      background: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#223848',
          margin: '0 0 0.5rem 0'
        }}>
          {title}
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
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
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap'
      }}>
        {comingSoon ? 'Coming Soon' : buttonText}
      </button>
    </div>
  )
}
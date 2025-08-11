// pages/god-mode/xp-tools.js - XP DIAGNOSTICS & TOOLS (FIXED)
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import AdminXPTools from '../../components/AdminXPTools'
import { db } from '../../lib/firebase'
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore'

export default function XPToolsManagement() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [schoolStudents, setSchoolStudents] = useState([]) // For dropdown
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('') // For dropdown selection
  const [entities, setEntities] = useState([])
  const [schools, setSchools] = useState([])
  const [singleSchools, setSingleSchools] = useState([]) // For single schools not in entities
  const [xpStats, setXpStats] = useState({
    totalStudents: 0,
    avgXP: 0,
    topXP: 0,
    totalXP: 0
  })

  // Load entities and single schools for filtering
  const loadEntitiesAndSchools = async () => {
    try {
      // Load entities (dioceses/ISDs)
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      const entitiesData = []
      
      entitiesSnapshot.forEach(doc => {
        entitiesData.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setEntities(entitiesData)
      
      // Load single schools
      const schoolsRef = collection(db, 'schools')
      const schoolsSnapshot = await getDocs(schoolsRef)
      const singleSchoolsData = []
      
      schoolsSnapshot.forEach(doc => {
        const schoolData = doc.data()
        if (schoolData.type === 'single_school') {
          singleSchoolsData.push({
            id: doc.id,
            ...schoolData
          })
        }
      })
      
      setSingleSchools(singleSchoolsData)
      
    } catch (error) {
      console.error('Error loading entities and schools:', error)
    }
  }

  // Load schools based on selected entity
  const loadSchools = async (entityId) => {
    try {
      const schoolsRef = collection(db, `entities/${entityId}/schools`)
      const schoolsSnapshot = await getDocs(schoolsRef)
      const schoolsData = []
      
      schoolsSnapshot.forEach(doc => {
        schoolsData.push({
          id: doc.id,
          entityId: entityId,
          ...doc.data()
        })
      })
      
      setSchools(schoolsData)
    } catch (error) {
      console.error('Error loading schools:', error)
    }
  }

  // Load students for dropdown when school is selected
  const loadStudentsForSchool = async () => {
    if (!selectedSchool) return
    
    setLoading(true)
    try {
      const studentsData = []
      let studentsRef
      
      if (selectedEntity) {
        // Students in entity school
        studentsRef = collection(db, `entities/${selectedEntity}/schools/${selectedSchool}/students`)
      } else {
        // Students in single school
        studentsRef = collection(db, `schools/${selectedSchool}/students`)
      }
      
      const studentsSnapshot = await getDocs(studentsRef)
      
      studentsSnapshot.forEach(doc => {
        const studentData = doc.data()
        studentsData.push({
          id: doc.id,
          displayName: studentData.displayName || `${studentData.firstName || ''} ${studentData.lastInitial || ''}`.trim() || 'Unknown Student',
          email: studentData.authEmail || studentData.email || 'No email',
          grade: studentData.grade || 'N/A',
          totalXP: studentData.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
          level: studentData.level || 1,
          academicYear: studentData.academicYear || '2025-26',
          booksSubmittedThisYear: studentData.booksSubmittedThisYear || 0
        })
      })
      
      // Sort by name
      studentsData.sort((a, b) => a.displayName.localeCompare(b.displayName))
      
      setSchoolStudents(studentsData)
      
    } catch (error) {
      console.error('Error loading students for school:', error)
    }
    setLoading(false)
  }

  // Load specific student data
  const loadStudentData = async (studentId) => {
    if (!studentId || !selectedSchool) return
    
    setLoading(true)
    try {
      let studentPath
      
      if (selectedEntity) {
        // Student in entity school
        studentPath = `entities/${selectedEntity}/schools/${selectedSchool}/students/${studentId}`
      } else {
        // Student in single school
        studentPath = `schools/${selectedSchool}/students/${studentId}`
      }
      
      const studentRef = doc(db, studentPath)
      const studentDoc = await getDoc(studentRef)
      
      if (studentDoc.exists()) {
        const data = studentDoc.data()
        setSelectedStudent({
          id: studentDoc.id,
          path: studentPath,
          ...data,
          // Ensure display name
          displayName: data.displayName || `${data.firstName || ''} ${data.lastInitial || ''}`.trim() || 'Unknown Student'
        })
        
        // Update XP stats for single student
        setXpStats({
          totalStudents: 1,
          avgXP: data.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
          topXP: data.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
          totalXP: data.totalXP || 0  // FIXED: Changed from lifetimeXP to totalXP
        })
      } else {
        alert('Student not found')
      }
    } catch (error) {
      console.error('Error loading student:', error)
      alert('Error loading student: ' + error.message)
    }
    setLoading(false)
  }

  // Search for students globally
  const searchStudents = async () => {
    if (!searchTerm) {
      alert('Please enter a search term')
      return
    }
    
    setLoading(true)
    try {
      const studentsData = []
      let totalXPSum = 0
      let maxXP = 0
      
      // Search across all entities and schools
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`)
            const studentsSnapshot = await getDocs(studentsRef)
            
            studentsSnapshot.forEach(studentDoc => {
              const studentData = studentDoc.data()
              const displayName = studentData.displayName || `${studentData.firstName || ''} ${studentData.lastInitial || ''}`.trim() || 'Unknown'
              
              if (displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  studentData.authEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  studentData.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
                studentsData.push({
                  id: studentDoc.id,
                  path: `entities/${entityDoc.id}/schools/${schoolDoc.id}/students/${studentDoc.id}`,
                  entityName: entityDoc.data().name,
                  schoolName: schoolDoc.data().name,
                  displayName: displayName,
                  email: studentData.authEmail || studentData.email || 'No email',
                  totalXP: studentData.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
                  level: studentData.level || 1,
                  ...studentData
                })
                totalXPSum += studentData.totalXP || 0  // FIXED: Changed from lifetimeXP to totalXP
                maxXP = Math.max(maxXP, studentData.totalXP || 0)  // FIXED: Changed from lifetimeXP to totalXP
              }
            })
          }
        } catch (error) {
          console.log('Error searching school:', error)
        }
      }
      
      // Also search single schools
      const schoolsRef = collection(db, 'schools')
      const schoolsSnapshot = await getDocs(schoolsRef)
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        if (schoolDoc.data().type === 'single_school') {
          try {
            const studentsRef = collection(db, `schools/${schoolDoc.id}/students`)
            const studentsSnapshot = await getDocs(studentsRef)
            
            studentsSnapshot.forEach(studentDoc => {
              const studentData = studentDoc.data()
              const displayName = studentData.displayName || `${studentData.firstName || ''} ${studentData.lastInitial || ''}`.trim() || 'Unknown'
              
              if (displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  studentData.authEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  studentData.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
                studentsData.push({
                  id: studentDoc.id,
                  path: `schools/${schoolDoc.id}/students/${studentDoc.id}`,
                  schoolName: schoolDoc.data().name,
                  displayName: displayName,
                  email: studentData.authEmail || studentData.email || 'No email',
                  totalXP: studentData.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
                  level: studentData.level || 1,
                  ...studentData
                })
                totalXPSum += studentData.totalXP || 0  // FIXED: Changed from lifetimeXP to totalXP
                maxXP = Math.max(maxXP, studentData.totalXP || 0)  // FIXED: Changed from lifetimeXP to totalXP
              }
            })
          } catch (error) {
            console.log('Error searching single school:', error)
          }
        }
      }
      
      // Sort by XP
      studentsData.sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0))  // FIXED: Changed from lifetimeXP to totalXP
      
      setStudents(studentsData)
      setXpStats({
        totalStudents: studentsData.length,
        avgXP: studentsData.length > 0 ? Math.round(totalXPSum / studentsData.length) : 0,
        topXP: maxXP,
        totalXP: totalXPSum
      })
      
    } catch (error) {
      console.error('Error searching students:', error)
      alert('Error searching students: ' + error.message)
    }
    setLoading(false)
  }

  // Initialize on mount
  useEffect(() => {
    loadEntitiesAndSchools()
  }, [])

  // Load schools when entity changes
  useEffect(() => {
    if (selectedEntity) {
      loadSchools(selectedEntity)
      setSelectedSchool('') // Reset school selection
      setSchoolStudents([]) // Clear students
      setSelectedStudentId('') // Clear student selection
    } else {
      setSchools([])
    }
  }, [selectedEntity])

  // Load students when school changes
  useEffect(() => {
    if (selectedSchool) {
      loadStudentsForSchool()
      setSelectedStudentId('') // Clear student selection
      setSelectedStudent(null) // Clear selected student data
    } else {
      setSchoolStudents([])
    }
  }, [selectedSchool])

  // Load student data when selection changes
  useEffect(() => {
    if (selectedStudentId) {
      loadStudentData(selectedStudentId)
    }
  }, [selectedStudentId])

  return (
    <GodModeAuth pageName="XP Diagnostics">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>XP Diagnostics - God Mode</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="XP Diagnostics"
              icon="🔧"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Search/Select Section */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(6, 182, 212, 0.5)'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔍 Find Student
                </h2>

                {/* Method Toggle */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <button
                    onClick={() => {
                      setSelectedEntity('')
                      setSelectedSchool('')
                      setSchoolStudents([])
                      setSelectedStudentId('')
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: !selectedEntity && !selectedSchool ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(0, 0, 0, 0.3)',
                      color: 'white',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    🔍 Global Search
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStudents([])
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedEntity || selectedSchool ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(0, 0, 0, 0.3)',
                      color: 'white',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    🏫 Browse by School
                  </button>
                </div>
                
                {/* Browse by School Section */}
                {(selectedEntity !== '' || selectedSchool !== '' || (!searchTerm && students.length === 0)) && (
                  <div>
                    <h3 style={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      📍 Browse by Location
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      {/* Entity/School Selector */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'white',
                          marginBottom: '0.25rem'
                        }}>
                          Select Organization
                        </label>
                        <select
                          value={selectedEntity || selectedSchool}
                          onChange={(e) => {
                            const value = e.target.value
                            // Check if it's a single school
                            if (value.startsWith('school:')) {
                              setSelectedEntity('')
                              setSelectedSchool(value.replace('school:', ''))
                            } else {
                              setSelectedEntity(value)
                              setSelectedSchool('')
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        >
                          <option value="">Select an organization...</option>
                          
                          {entities.length > 0 && (
                            <optgroup label="Dioceses & ISDs">
                              {entities.map(entity => (
                                <option key={entity.id} value={entity.id}>
                                  {entity.type === 'diocese' ? '⛪' : '🏫'} {entity.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          
                          {singleSchools.length > 0 && (
                            <optgroup label="Single Schools">
                              {singleSchools.map(school => (
                                <option key={school.id} value={`school:${school.id}`}>
                                  🎓 {school.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      
                      {/* School Selector (for entities) */}
                      {selectedEntity && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            marginBottom: '0.25rem'
                          }}>
                            Select School
                          </label>
                          <select
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: 'white'
                            }}
                          >
                            <option value="">Select a school...</option>
                            {schools.map(school => (
                              <option key={school.id} value={school.id}>
                                {school.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* Student Dropdown */}
                      {selectedSchool && schoolStudents.length > 0 && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            marginBottom: '0.25rem'
                          }}>
                            Select Student ({schoolStudents.length} total)
                          </label>
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: 'white'
                            }}
                            disabled={loading}
                          >
                            <option value="">Select a student...</option>
                            {schoolStudents.map(student => (
                              <option key={student.id} value={student.id}>
                                {student.displayName} | Grade {student.grade} | {student.totalXP} XP | {student.booksSubmittedThisYear} books
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* School Stats */}
                    {selectedSchool && schoolStudents.length > 0 && (
                      <div style={{
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        marginTop: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '2rem',
                          fontSize: '0.875rem',
                          color: '#67e8f9'
                        }}>
                          <span>📊 Total Students: <strong>{schoolStudents.length}</strong></span>
                          <span>📚 Avg Books: <strong>{Math.round(schoolStudents.reduce((sum, s) => sum + s.booksSubmittedThisYear, 0) / schoolStudents.length)}</strong></span>
                          <span>⭐ Avg XP: <strong>{Math.round(schoolStudents.reduce((sum, s) => sum + s.totalXP, 0) / schoolStudents.length)}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Global Search Section */}
                {!selectedEntity && !selectedSchool && (
                  <div>
                    <h3 style={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      🌍 Global Search
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr',
                      gap: '1rem'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'white',
                          marginBottom: '0.25rem'
                        }}>
                          Search by Name or Email
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Enter student name or email..."
                          onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'transparent',
                          marginBottom: '0.25rem'
                        }}>
                          Action
                        </label>
                        <button
                          onClick={searchStudents}
                          disabled={loading || !searchTerm}
                          style={{
                            width: '100%',
                            background: loading || !searchTerm
                              ? '#6b7280'
                              : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: loading || !searchTerm ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? '⏳ Searching...' : '🔍 Search'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Search Results Stats */}
                {students.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {xpStats.totalStudents}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#67e8f9' }}>
                        Students Found
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {xpStats.avgXP}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#67e8f9' }}>
                        Average XP
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {xpStats.topXP}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#67e8f9' }}>
                        Highest XP
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {xpStats.totalXP.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#67e8f9' }}>
                        Total XP
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Results List */}
              {students.length > 0 && (
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
                    🎓 Search Results ({students.length})
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gap: '0.5rem',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {students.map((student, index) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student)
                          setXpStats({
                            totalStudents: 1,
                            avgXP: student.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
                            topXP: student.totalXP || 0,  // FIXED: Changed from lifetimeXP to totalXP
                            totalXP: student.totalXP || 0  // FIXED: Changed from lifetimeXP to totalXP
                          })
                        }}
                        style={{
                          background: selectedStudent?.id === student.id 
                            ? 'rgba(6, 182, 212, 0.2)'
                            : 'rgba(168, 85, 247, 0.1)',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          border: selectedStudent?.id === student.id
                            ? '2px solid rgba(6, 182, 212, 0.5)'
                            : '1px solid rgba(168, 85, 247, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedStudent?.id !== student.id) {
                            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStudent?.id !== student.id) {
                            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'
                          }
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              color: 'white',
                              fontWeight: '600',
                              marginBottom: '0.25rem'
                            }}>
                              #{index + 1} - {student.displayName}
                            </div>
                            <div style={{
                              color: '#c084fc',
                              fontSize: '0.875rem'
                            }}>
                              {student.email} 
                              {student.schoolName && ` • ${student.schoolName}`}
                              {student.entityName && ` • ${student.entityName}`}
                            </div>
                          </div>
                          <div style={{
                            textAlign: 'right'
                          }}>
                            <div style={{
                              color: '#06b6d4',
                              fontSize: '1.25rem',
                              fontWeight: 'bold'
                            }}>
                              {student.totalXP || 0} XP
                            </div>
                            <div style={{
                              color: '#67e8f9',
                              fontSize: '0.75rem'
                            }}>
                              Level {student.level || 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* XP Tools Section */}
              {selectedStudent && (
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
                    🔧 XP Diagnostics for {selectedStudent.displayName}
                  </h3>
                  
                  {/* Student Info */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#67e8f9'
                    }}>
                      <div>📧 Email: <span style={{ color: 'white' }}>{selectedStudent.authEmail || selectedStudent.email || 'N/A'}</span></div>
                      <div>🎓 Grade: <span style={{ color: 'white' }}>{selectedStudent.grade || 'N/A'}</span></div>
                      <div>📅 Academic Year: <span style={{ color: 'white' }}>{selectedStudent.academicYear || '2025-26'}</span></div>
                      <div>📚 Books This Year: <span style={{ color: 'white' }}>{selectedStudent.booksSubmittedThisYear || 0}</span></div>
                      <div>⭐ Level: <span style={{ color: 'white' }}>{selectedStudent.level || 1}</span></div>
                      <div>💰 Total XP: <span style={{ color: 'white' }}>{selectedStudent.totalXP || 0}</span></div>
                    </div>
                  </div>
                  
                  <AdminXPTools 
                    studentData={selectedStudent}
                    onUpdate={(newData) => {
                      setSelectedStudent(newData)
                      // Update in students list too
                      setStudents(prev => prev.map(s => 
                        s.id === newData.id ? { ...s, ...newData } : s
                      ))
                      // Update in school students dropdown
                      setSchoolStudents(prev => prev.map(s =>
                        s.id === newData.id ? { ...s, ...newData } : s
                      ))
                    }}
                  />
                </div>
              )}

              {/* Instructions */}
              {!selectedStudent && students.length === 0 && schoolStudents.length === 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  textAlign: 'center',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '1rem',
                    fontFamily: 'Georgia, serif'
                  }}>
                    XP Diagnostic Tools
                  </h3>
                  <p style={{
                    color: '#c084fc',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}>
                    Two ways to find students:
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}>
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(6, 182, 212, 0.1)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                      <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Global Search</h4>
                      <p style={{ color: '#a78bfa', fontSize: '0.875rem' }}>
                        Search across all schools by name or email
                      </p>
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏫</div>
                      <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Browse by School</h4>
                      <p style={{ color: '#a78bfa', fontSize: '0.875rem' }}>
                        Select organization and school, then pick from dropdown
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </GodModeAuth>
  )
}
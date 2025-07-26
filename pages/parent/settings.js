// pages/parent/settings.js - Updated with hamburger menu and student login credentials
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function ParentSettings() {
  const router = useRouter()
  const { user, userProfile, signOut, isAuthenticated, loading: authLoading, signingOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [parentData, setParentData] = useState(null)
  const [familyData, setFamilyData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [teacherQuizCodes, setTeacherQuizCodes] = useState([])
  const [isEditing, setIsEditing] = useState({})
  const [editedData, setEditedData] = useState({})
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)
  
  // Student credentials state
  const [expandedStudentCredentials, setExpandedStudentCredentials] = useState(null)

  // Lux Libris Classic Theme
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // Navigation menu items (same as dashboard)
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family DNA Lab', path: '/parent/dna-lab', icon: '🧬' },
    { name: 'Quiz Unlock Center', path: '/parent/quiz-unlock', icon: '▦' },
    { name: 'Family Celebrations', path: '/parent/celebrations', icon: '♔' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙', current: true }
  ], [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadSettingsData()
    } else if (!authLoading && !isAuthenticated && !signingOut) {
  router.push('/')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile, signingOut])

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false)
      }
    }

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu])

  const loadSettingsData = async () => {
    try {
      console.log('⚙️ Loading parent settings data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)
      console.log('✅ Parent profile loaded')

      // Load family profile
      const familyRef = doc(db, 'families', user.uid)
      const familyDoc = await getDoc(familyRef)
      
      if (familyDoc.exists()) {
        setFamilyData(familyDoc.data())
        console.log('✅ Family profile loaded')
      }

      // Load linked students and their teachers' quiz codes
      await loadLinkedStudentsAndTeachers(parentProfile.linkedStudents || [])

    } catch (error) {
      console.error('❌ Error loading settings:', error)
      setError('Failed to load settings. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsAndTeachers = async (linkedStudentIds) => {
    try {
      const students = []
      const quizCodes = []
      
      // Search all entities/schools for linked students
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsRef = collection(db, `entities/${entityId}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`)
          const studentsSnapshot = await getDocs(studentsRef)
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              }
              students.push(studentData)
              
              // Load teacher's quiz code for this student
              if (studentData.currentTeacherId) {
                const teacherRef = doc(db, `entities/${entityId}/schools/${schoolId}/teachers`, studentData.currentTeacherId)
                const teacherDoc = await getDoc(teacherRef)
                
                if (teacherDoc.exists()) {
                  const teacherData = teacherDoc.data()
                  const existingCode = quizCodes.find(code => code.teacherId === studentData.currentTeacherId)
                  
                  if (!existingCode && teacherData.parentQuizCode) {
                    quizCodes.push({
                      teacherId: studentData.currentTeacherId,
                      teacherName: `${teacherData.firstName} ${teacherData.lastName}`,
                      schoolName: schoolData.name,
                      parentQuizCode: teacherData.parentQuizCode,
                      parentQuizCodeCreated: teacherData.parentQuizCodeCreated,
                      students: [studentData.firstName]
                    })
                  } else if (existingCode) {
                    // Add student to existing teacher's list
                    existingCode.students.push(studentData.firstName)
                  }
                }
              }
            }
          }
        }
      }
      
      setLinkedStudents(students)
      setTeacherQuizCodes(quizCodes)
      console.log('✅ Loaded', students.length, 'students and', quizCodes.length, 'teacher quiz codes')
      
    } catch (error) {
      console.error('❌ Error loading linked students and teachers:', error)
    }
  }

  const handleEdit = (section) => {
    setIsEditing(prev => ({ ...prev, [section]: true }))
    
    // Initialize edit data based on section
    if (section === 'profile') {
      setEditedData(prev => ({
        ...prev,
        firstName: parentData.firstName,
        lastName: parentData.lastName
      }))
    } else if (section === 'family') {
      setEditedData(prev => ({
        ...prev,
        familyName: familyData?.familyName || ''
      }))
    }
  }

  const handleSave = async (section) => {
    try {
      setError('')
      setSuccess('')
      
      if (section === 'profile') {
        const parentRef = doc(db, 'parents', user.uid)
        await updateDoc(parentRef, {
          firstName: editedData.firstName,
          lastName: editedData.lastName
        })
        
        setParentData(prev => ({
          ...prev,
          firstName: editedData.firstName,
          lastName: editedData.lastName
        }))
        
        setSuccess('Profile updated successfully!')
        
      } else if (section === 'family') {
        const familyRef = doc(db, 'families', user.uid)
        await updateDoc(familyRef, {
          familyName: editedData.familyName
        })
        
        setFamilyData(prev => ({
          ...prev,
          familyName: editedData.familyName
        }))
        
        setSuccess('Family name updated successfully!')
      }
      
      setIsEditing(prev => ({ ...prev, [section]: false }))
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error saving:', error)
      setError('Failed to save changes. Please try again.')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleCancel = (section) => {
    setIsEditing(prev => ({ ...prev, [section]: false }))
    setEditedData({})
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('Copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setError('Failed to copy. Please copy manually.')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleSignOut = async () => {
  try {
    await signOut({ redirectTo: '/' })  // ✅ FIXED: Use signOut with redirect parameter
    // ❌ REMOVE: Don't manually push to router after signOut
  } catch (error) {
    console.error('❌ Error signing out:', error)
    setError('Failed to sign out. Please try again.')
  }
}

  const handleTabClick = (tabName) => {
    if (tabName === 'Settings') {
      setSuccess('You\'re already here! ⚙')
      setTimeout(() => setSuccess(''), 1500)
    } else if (tabName === 'Family Dashboard') {
      router.push('/parent/dashboard')
    } else if (tabName === 'Book Nominees') {
      router.push('/parent/nominees')
    } else {
      setSuccess(`${tabName} is coming soon! 🚧`)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleStudentCredentialsTap = (studentId) => {
    setExpandedStudentCredentials(expandedStudentCredentials === studentId ? null : studentId)
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Settings - Lux Libris</title>
        <meta name="description" content="Manage your family account settings and preferences" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header - Updated to keep back button and hamburger menu */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/parent/dashboard')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: luxTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              position: 'absolute',
              left: '20px'
            }}
          >
            ←
          </button>

          {/* Centered Title */}
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center'
          }}>
            Settings
          </h1>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {/* Dropdown Menu */}
            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: luxTheme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowNavMenu(false)
                      
                      if (item.current) return
                      
                      setTimeout(() => {
                        // Navigate to actual pages for unlocked items
                        if (item.path === '/parent/settings' || item.path === '/parent/nominees' || item.path === '/parent/dashboard') {
                          router.push(item.path)
                        } else {
                          handleTabClick(item.name)
                        }
                      }, 100)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '20px', 
          maxWidth: '600px', 
          margin: '0 auto',
          paddingBottom: '100px'
        }}>
          
          {/* Success/Error Messages */}
          {success && (
            <div style={{
              background: `${luxTheme.primary}20`,
              border: `1px solid ${luxTheme.primary}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#065f46',
              fontSize: 'clamp(12px, 3.5vw, 14px)'
            }}>
              ✅ {success}
            </div>
          )}
          
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: 'clamp(12px, 3.5vw, 14px)'
            }}>
              ❌ {error}
            </div>
          )}

          {/* Parent Quiz Codes Section */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${luxTheme.primary}30`
          }}>
            <h3 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ▦ Parent Quiz Codes
            </h3>
            
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              These codes are provided by your children&apos;s teachers. Use them when approving quiz access requests.
            </p>

            {teacherQuizCodes.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {teacherQuizCodes.map((teacher, index) => (
                  <div 
                    key={teacher.teacherId}
                    style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${luxTheme.primary}30`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '4px'
                        }}>
                          {teacher.teacherName}
                        </div>
                        <div style={{
                          fontSize: 'clamp(10px, 3vw, 12px)',
                          color: luxTheme.textSecondary,
                          marginBottom: '4px',
                          wordBreak: 'break-word'
                        }}>
                          {teacher.schoolName}
                        </div>
                        <div style={{
                          fontSize: 'clamp(10px, 3vw, 12px)',
                          color: luxTheme.textSecondary,
                          wordBreak: 'break-word'
                        }}>
                          Students: {teacher.students.join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '8px',
                      padding: '12px',
                      border: `1px solid ${luxTheme.primary}50`
                    }}>
                      <div style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: 'clamp(16px, 4.5vw, 18px)',
                        fontWeight: 'bold',
                        color: luxTheme.textPrimary,
                        letterSpacing: '2px',
                        textAlign: 'center',
                        wordBreak: 'break-all'
                      }}>
                        {teacher.parentQuizCode}
                      </div>
                      <button
                        onClick={() => copyToClipboard(teacher.parentQuizCode)}
                        style={{
                          backgroundColor: luxTheme.primary,
                          color: luxTheme.textPrimary,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: 'clamp(10px, 3vw, 12px)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          minHeight: '36px',
                          touchAction: 'manipulation'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = luxTheme.secondary}
                        onMouseLeave={(e) => e.target.style.backgroundColor = luxTheme.primary}
                      >
                        Copy
                      </button>
                    </div>
                    
                    {teacher.parentQuizCodeCreated && (
                      <div style={{
                        fontSize: 'clamp(8px, 2.5vw, 10px)',
                        color: luxTheme.textSecondary,
                        textAlign: 'center',
                        marginTop: '8px'
                      }}>
                        Generated: {new Date(teacher.parentQuizCodeCreated.toDate()).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: luxTheme.textSecondary,
                backgroundColor: `${luxTheme.primary}05`,
                borderRadius: '8px',
                border: `1px dashed ${luxTheme.primary}40`
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
                <p style={{ 
                  margin: 0, 
                  fontSize: 'clamp(12px, 3.5vw, 14px)' 
                }}>
                  No quiz codes available yet. Contact your children&apos;s teachers if needed.
                </p>
              </div>
            )}

            <div style={{
              backgroundColor: '#E6FFFA',
              border: '1px solid #81E6D9',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <p style={{
                margin: 0,
                fontSize: 'clamp(10px, 3vw, 12px)',
                color: '#065F46',
                lineHeight: '1.4'
              }}>
                💡 <strong>How to use:</strong> When your child completes a book and requests quiz access, enter the appropriate teacher&apos;s code to approve their quiz.
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px'
            }}>
              <h3 style={{
                fontSize: 'clamp(16px, 4vw, 18px)',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1
              }}>
                👤 Profile Information
              </h3>
              {!isEditing.profile && (
                <button
                  onClick={() => handleEdit('profile')}
                  style={{
                    backgroundColor: `${luxTheme.primary}20`,
                    color: luxTheme.primary,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flexShrink: 0,
                    minHeight: '32px',
                    touchAction: 'manipulation'
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing.profile ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '4px'
                    }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editedData.firstName || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${luxTheme.primary}40`,
                        borderRadius: '6px',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        boxSizing: 'border-box',
                        minHeight: '40px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '4px'
                    }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editedData.lastName || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${luxTheme.primary}40`,
                        borderRadius: '6px',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        boxSizing: 'border-box',
                        minHeight: '40px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleCancel('profile')}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '36px',
                      touchAction: 'manipulation'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave('profile')}
                    style={{
                      backgroundColor: luxTheme.primary,
                      color: luxTheme.textPrimary,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '36px',
                      touchAction: 'manipulation'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    color: luxTheme.textSecondary,
                    flexShrink: 0
                  }}>Name:</span>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    color: luxTheme.textPrimary, 
                    fontWeight: '500',
                    textAlign: 'right',
                    wordBreak: 'break-word'
                  }}>
                    {parentData?.firstName} {parentData?.lastName}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    color: luxTheme.textSecondary,
                    flexShrink: 0
                  }}>Email:</span>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    color: luxTheme.textPrimary, 
                    fontWeight: '500',
                    textAlign: 'right',
                    wordBreak: 'break-word'
                  }}>
                    {parentData?.email}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    color: luxTheme.textSecondary,
                    flexShrink: 0
                  }}>Account Type:</span>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    color: luxTheme.textPrimary, 
                    fontWeight: '500'
                  }}>
                    Parent Account
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Family Settings */}
          {familyData && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px'
              }}>
                <h3 style={{
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1
                }}>
                  ⌂ Family Settings
                </h3>
                {!isEditing.family && (
                  <button
                    onClick={() => handleEdit('family')}
                    style={{
                      backgroundColor: `${luxTheme.primary}20`,
                      color: luxTheme.primary,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flexShrink: 0,
                      minHeight: '32px',
                      touchAction: 'manipulation'
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditing.family ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '4px'
                    }}>
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={editedData.familyName || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, familyName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${luxTheme.primary}40`,
                        borderRadius: '6px',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        boxSizing: 'border-box',
                        minHeight: '40px'
                      }}
                    />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handleCancel('family')}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '36px',
                        touchAction: 'manipulation'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave('family')}
                      style={{
                        backgroundColor: luxTheme.primary,
                        color: luxTheme.textPrimary,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '36px',
                        touchAction: 'manipulation'
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ 
                      fontSize: 'clamp(12px, 3.5vw, 14px)', 
                      color: luxTheme.textSecondary,
                      flexShrink: 0
                    }}>Family Name:</span>
                    <span style={{ 
                      fontSize: 'clamp(12px, 3.5vw, 14px)', 
                      color: luxTheme.textPrimary, 
                      fontWeight: '500',
                      textAlign: 'right',
                      wordBreak: 'break-word'
                    }}>
                      {familyData.familyName}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ 
                      fontSize: 'clamp(12px, 3.5vw, 14px)', 
                      color: luxTheme.textSecondary,
                      flexShrink: 0
                    }}>Connected Children:</span>
                    <span style={{ 
                      fontSize: 'clamp(12px, 3.5vw, 14px)', 
                      color: luxTheme.textPrimary, 
                      fontWeight: '500'
                    }}>
                      {linkedStudents.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linked Children - Updated with tap to view credentials */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👨‍👩‍👧‍👦 Linked Children
            </h3>
            
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              Tap any child to view their login details for the app.
            </p>
            
            {linkedStudents.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {linkedStudents.map((student, index) => (
                  <div key={student.id}>
                    <div 
                      style={{
                        backgroundColor: `${luxTheme.primary}10`,
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${luxTheme.primary}30`
                      }}
                      onClick={() => handleStudentCredentialsTap(student.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${luxTheme.primary}20`
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '2px'
                        }}>
                          {student.firstName} {student.lastInitial}.
                        </div>
                        <div style={{
                          fontSize: 'clamp(10px, 3vw, 12px)',
                          color: luxTheme.textSecondary,
                          wordBreak: 'break-word'
                        }}>
                          Grade {student.grade} • {student.schoolName}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          fontSize: 'clamp(10px, 3vw, 12px)',
                          color: luxTheme.textSecondary,
                          textAlign: 'right',
                          flexShrink: 0
                        }}>
                          {student.booksSubmittedThisYear || 0} books
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: luxTheme.textSecondary,
                          transform: expandedStudentCredentials === student.id ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0
                        }}>
                          ▶
                        </div>
                      </div>
                    </div>
                    
                    {/* Student Credentials Expanded View */}
                    {expandedStudentCredentials === student.id && (
                      <div style={{
                        backgroundColor: `${luxTheme.secondary}15`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginTop: '8px',
                        border: `1px solid ${luxTheme.secondary}40`
                      }}>
                        <h4 style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          margin: '0 0 12px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🔐 {student.firstName}&apos;s Login Details
                        </h4>
                        
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {/* Username */}
                          <div style={{
                            backgroundColor: luxTheme.surface,
                            borderRadius: '8px',
                            padding: '12px',
                            border: `1px solid ${luxTheme.primary}30`
                          }}>
                            <div style={{
                              fontSize: 'clamp(10px, 3vw, 12px)',
                              fontWeight: '600',
                              color: luxTheme.textSecondary,
                              marginBottom: '4px'
                            }}>
                              Username:
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                fontFamily: 'monospace',
                                fontSize: 'clamp(14px, 4vw, 16px)',
                                fontWeight: 'bold',
                                color: luxTheme.textPrimary,
                                flex: 1
                              }}>
                                {student.displayUsername || 'Not set'}
                              </div>
                              <button
                                onClick={() => copyToClipboard(student.displayUsername || '')}
                                style={{
                                  backgroundColor: luxTheme.primary,
                                  color: luxTheme.textPrimary,
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: 'clamp(8px, 2.5vw, 10px)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          
                          {/* Teacher Code */}
                          <div style={{
                            backgroundColor: luxTheme.surface,
                            borderRadius: '8px',
                            padding: '12px',
                            border: `1px solid ${luxTheme.primary}30`
                          }}>
                            <div style={{
                              fontSize: 'clamp(10px, 3vw, 12px)',
                              fontWeight: '600',
                              color: luxTheme.textSecondary,
                              marginBottom: '4px'
                            }}>
                              Teacher Code:
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                fontFamily: 'monospace',
                                fontSize: 'clamp(14px, 4vw, 16px)',
                                fontWeight: 'bold',
                                color: luxTheme.textPrimary,
                                flex: 1
                              }}>
                                {student.signInCode || 'Not available'}
                              </div>
                              <button
                                onClick={() => copyToClipboard(student.signInCode || '')}
                                style={{
                                  backgroundColor: luxTheme.primary,
                                  color: luxTheme.textPrimary,
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: 'clamp(8px, 2.5vw, 10px)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          
                          {/* Password */}
                          <div style={{
                            backgroundColor: luxTheme.surface,
                            borderRadius: '8px',
                            padding: '12px',
                            border: `1px solid ${luxTheme.primary}30`
                          }}>
                            <div style={{
                              fontSize: 'clamp(10px, 3vw, 12px)',
                              fontWeight: '600',
                              color: luxTheme.textSecondary,
                              marginBottom: '4px'
                            }}>
                              Password:
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                fontFamily: 'monospace',
                                fontSize: 'clamp(14px, 4vw, 16px)',
                                fontWeight: 'bold',
                                color: luxTheme.textPrimary,
                                flex: 1
                              }}>
                                {student.personalPassword || 'Not set'}
                              </div>
                              <button
                                onClick={() => copyToClipboard(student.personalPassword || '')}
                                style={{
                                  backgroundColor: luxTheme.primary,
                                  color: luxTheme.textPrimary,
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: 'clamp(8px, 2.5vw, 10px)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          backgroundColor: '#E6FFFA',
                          border: '1px solid #81E6D9',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '12px'
                        }}>
                          <p style={{
                            margin: 0,
                            fontSize: 'clamp(10px, 3vw, 12px)',
                            color: '#065F46',
                            lineHeight: '1.4'
                          }}>
                            💡 <strong>How to use:</strong> Your child needs these credentials to sign into the Lux Libris app on their device.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: luxTheme.textSecondary
              }}>
                No children linked yet.
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '40px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚙ Account Actions
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#f59e0b',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  minHeight: '48px',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#fde68a'
                  e.target.style.borderColor = '#f59e0b'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fef3c7'
                  e.target.style.borderColor = '#fbbf24'
                }}
              >
                🚪 Sign Out
              </button>

              <button
                onClick={() => router.push('/parent/account-deletion')}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  minHeight: '48px',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#fecaca'
                  e.target.style.borderColor = '#f87171'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fee2e2'
                  e.target.style.borderColor = '#fca5a5'
                }}
              >
                📦 Export & Delete Account
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          @media (max-width: 768px) {
            input {
              font-size: 16px !important; /* Prevents zoom on iOS */
            }
            
            .nav-menu-container > div {
              right: 10px !important;
              minWidth: 180px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}
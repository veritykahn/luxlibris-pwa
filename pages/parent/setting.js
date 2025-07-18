// pages/parent/settings.js - Updated with Account Deletion
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, dbHelpers } from '../../lib/firebase'
import DataExportComponent from '../../components/DataExportComponent'

export default function ParentSettings() {
  const router = useRouter()
  const { user, userProfile, signOut, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [parentData, setParentData] = useState(null)
  const [familyData, setFamilyData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [teacherQuizCodes, setTeacherQuizCodes] = useState([])
  const [isEditing, setIsEditing] = useState({})
  const [editedData, setEditedData] = useState({})

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

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

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadSettingsData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

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
              if (studentData.teacherId) {
                const teacherRef = doc(db, `entities/${entityId}/schools/${schoolId}/teachers`, studentData.teacherId)
                const teacherDoc = await getDoc(teacherRef)
                
                if (teacherDoc.exists()) {
                  const teacherData = teacherDoc.data()
                  const existingCode = quizCodes.find(code => code.teacherId === studentData.teacherId)
                  
                  if (!existingCode && teacherData.parentQuizCode) {
                    quizCodes.push({
                      teacherId: studentData.teacherId,
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
      setSuccess('Code copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setError('Failed to copy code. Please copy manually.')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/role-selector')
    } catch (error) {
      console.error('❌ Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  // Account deletion functionality with audit logging
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" exactly to confirm.')
      setTimeout(() => setError(''), 3000)
      return
    }

    setIsDeleting(true)
    try {
      console.log('🗑️ Starting parent account deletion with audit logging...')
      
      // Get linked student IDs for the deletion process
      const linkedStudentIds = parentData.linkedStudents || []
      
      // Use enhanced deletion with export and audit logging
      await dbHelpers.deleteParentAccountWithExport(
        user.uid, 
        linkedStudentIds,
        false // Don't auto-export since user can export manually
      )
      
      console.log('✅ Parent account deleted successfully with audit trail')
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
      
      // Redirect to homepage
      window.location.href = '/'
      
    } catch (error) {
      console.error('❌ Error deleting account:', error)
      setError('Failed to delete account. Please try again or contact support.')
      setTimeout(() => setError(''), 5000)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const handleBack = () => {
    router.push('/parent/dashboard')
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
        <title>Family Settings - Lux Libris</title>
        <meta name="description" content="Manage your family account settings and preferences" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={handleBack}
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
              touchAction: 'manipulation'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            Family Settings
          </h1>
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

          {/* Linked Children */}
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
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👨‍👩‍👧‍👦 Linked Children
            </h3>
            
            {linkedStudents.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {linkedStudents.map((student, index) => (
                  <div 
                    key={student.id}
                    style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
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
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: luxTheme.textSecondary,
                      textAlign: 'right',
                      flexShrink: 0
                    }}>
                      {student.booksSubmittedThisYear || 0} books
                    </div>
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

          {/* Data Export Section */}
          <DataExportComponent 
            accountType="parent"
            parentData={parentData}
            theme={luxTheme}
            onExportComplete={(result) => {
              setSuccess('📦 Data exported successfully!');
              setTimeout(() => setSuccess(''), 3000);
            }}
          />

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
                onClick={() => setShowDeleteConfirm(true)}
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
                🗑️ Delete Account & Data
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#dc2626',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                🗑️ Delete Family Account
              </h3>
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4',
                  fontWeight: '600'
                }}>
                  ⚠️ This action cannot be undone!
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Deleting your family account will permanently remove:
                </p>
                <ul style={{
                  fontSize: '13px',
                  color: '#dc2626',
                  margin: '8px 0 0 16px',
                  lineHeight: '1.4'
                }}>
                  <li>Your parent profile and family settings</li>
                  <li>Connection to your children&apos;s accounts</li>
                  <li>Access to quiz approval requests</li>
                  <li>All saved teacher quiz codes</li>
                </ul>
                
                {linkedStudents.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#fca5a5',
                    borderRadius: '6px'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      color: '#7f1d1d',
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      📋 Note: Your {linkedStudents.length} linked {linkedStudents.length === 1 ? 'child' : 'children'} will lose parent connection but keep their reading progress.
                    </p>
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '6px'
                }}>
                  Type "DELETE MY ACCOUNT" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `2px solid ${deleteConfirmText === 'DELETE MY ACCOUNT' ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    backgroundColor: luxTheme.background
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${luxTheme.primary}50`,
                    color: luxTheme.textPrimary,
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isDeleting ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 0.5 : 1
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}

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
          }
        `}</style>
      </div>
    </>
  )
}
// pages/parent/settings.js - Enhanced with Time-Aware Colors
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { linkParentToStudent } from '../../lib/parentLinking'

export default function ParentSettings() {
  const router = useRouter()
  const { user, userProfile, signOut, isAuthenticated, loading: authLoading, signingOut } = useAuth()
  const { hasFeature, requiresPremium, getPremiumMessage, getUpgradeInfo, isPilotPhase } = usePremiumFeatures()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [parentData, setParentData] = useState(null)
  const [familyData, setFamilyData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [teacherQuizCodes, setTeacherQuizCodes] = useState([])
  const [isEditing, setIsEditing] = useState({})
  const [editedData, setEditedData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  
  // New timer settings state
  const [timerDuration, setTimerDuration] = useState(20)
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)
  
  // Student credentials state
  const [expandedStudentCredentials, setExpandedStudentCredentials] = useState(null)
  
  // Premium features state
  const [expandedPremiumFeatures, setExpandedPremiumFeatures] = useState(false)
  
  // Add child modal state
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  
  // Add child form state
  const [addChildForm, setAddChildForm] = useState({
    inviteCode: '',
    loading: false,
    error: '',
    success: ''
  })

  // Get time-based theme with smoother transitions
  const timeTheme = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        name: 'morning',
        gradient: 'linear-gradient(135deg, #F5C99B, #F0B88A, #EBAD7A)',
        backgroundGradient: 'linear-gradient(to bottom, #FDF4E7, #FAE8D4, #F5DCC1)',
        overlay: 'rgba(245, 201, 155, 0.1)',
        glow: '#F5C99B'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        name: 'afternoon',
        gradient: 'linear-gradient(135deg, #6BB6E3, #7AC5EA, #89D0EE)',
        backgroundGradient: 'linear-gradient(to bottom, #E8F4FD, #D1E9FB, #B8DDF8)',
        overlay: 'rgba(107, 182, 227, 0.1)',
        glow: '#6BB6E3'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #FFB347, #FF8C42, #FF6B35)',
        backgroundGradient: 'linear-gradient(to bottom, #FFF0E6, #FFE4D1, #FFD7BC)',
        overlay: 'rgba(255, 140, 66, 0.1)',
        glow: '#FF8C42'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #4B0082, #6A0DAD, #7B68EE)',
        backgroundGradient: 'linear-gradient(to bottom, #2D1B4E, #3D2B5E, #4D3B6E)',
        overlay: 'rgba(75, 0, 130, 0.1)',
        glow: '#7B68EE'
      };
    }
  }, [Math.floor(new Date().getHours() / 6)]);

  // Lux Libris Classic Theme - adapted for time-based backgrounds
  const luxTheme = useMemo(() => {
    const isNight = timeTheme.name === 'night';
    return {
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: timeTheme.backgroundGradient, // Now uses time-based gradient
      surface: isNight ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF', // Slightly transparent for night mode
      textPrimary: isNight ? '#1F2937' : '#223848', // Darker for night mode contrast
      textSecondary: isNight ? '#374151' : '#556B7A',
      timeOverlay: timeTheme.overlay,
      timeGlow: timeTheme.glow
    }
  }, [timeTheme]);

  // Updated Navigation menu items (matching healthy habits page)
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
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
      if (showAddChildModal && !event.target.closest('.add-child-modal-content')) {
        setShowAddChildModal(false)
        setAddChildForm({ inviteCode: '', loading: false, error: '', success: '' })
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showNavMenu) setShowNavMenu(false)
        if (showAddChildModal) {
          setShowAddChildModal(false)
          setAddChildForm({ inviteCode: '', loading: false, error: '', success: '' })
        }
      }
    }

    if (showNavMenu || showAddChildModal) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu, showAddChildModal])

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
      
      // Set timer duration from parent settings
      setTimerDuration(parentProfile.readingSettings?.defaultTimerDuration || 20)
      
      console.log('✅ Parent profile loaded')

      // Load family profile - search for family containing this parent
const familiesRef = collection(db, 'families')
const familyQuery = query(familiesRef, where('parents', 'array-contains', user.uid))
const familySnapshot = await getDocs(familyQuery)

if (!familySnapshot.empty) {
  const familyDoc = familySnapshot.docs[0]
  setFamilyData({ ...familyDoc.data(), id: familyDoc.id })
  console.log('✅ Family profile loaded:', familyDoc.id)
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
  const familyRef = doc(db, 'families', familyData.id)  // Use familyData.id instead of user.uid
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

  // NEW: Save timer settings
  const saveTimerChange = async () => {
    if (timerDuration === (parentData.readingSettings?.defaultTimerDuration || 20)) return
    
    setIsSaving(true)
    try {
      const updatedReadingSettings = {
        ...parentData.readingSettings,
        defaultTimerDuration: timerDuration
      }
      
      const parentRef = doc(db, 'parents', user.uid)
      await updateDoc(parentRef, {
        readingSettings: updatedReadingSettings
      })
      
      const updatedData = { 
        ...parentData, 
        readingSettings: updatedReadingSettings 
      }
      setParentData(updatedData)
      
      setSuccess(`⏱️ Reading timer updated to ${timerDuration} minutes!`)
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error saving timer:', error)
      setError('Failed to save timer settings. Please try again.')
      setTimeout(() => setError(''), 3000)
    }
    setIsSaving(false)
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
      console.log('🚪 Parent signing out...')
      setIsSaving(true)
      
      // Use the same approach as student sign-out
      await signOut() // Don't need redirectTo since it defaults to '/'
      
    } catch (error) {
      console.error('❌ Sign out error:', error)
      
      // Fallback: If signOut fails, force redirect to homepage
      if (typeof window !== 'undefined') {
        console.log('🏠 Force redirect to homepage')
        window.location.replace('/')
      }
      
      setIsSaving(false)
    }
  }

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  const handleStudentCredentialsTap = (studentId) => {
    setExpandedStudentCredentials(expandedStudentCredentials === studentId ? null : studentId)
  }

  // Handle adding a new child
  const handleAddChild = async () => {
    if (!addChildForm.inviteCode.trim()) {
      setAddChildForm(prev => ({ ...prev, error: 'Please enter an invite code' }))
      return
    }

    setAddChildForm(prev => ({ ...prev, loading: true, error: '', success: '' }))

    try {
      console.log('🔗 Linking parent to student with invite code:', addChildForm.inviteCode)
      
      // Call the linkParentToStudent function
      const linkResult = await linkParentToStudent(user.uid, addChildForm.inviteCode.trim().toUpperCase())
      
      console.log('✅ Successfully linked to student:', linkResult)
      
      // Update family document if needed
      if (familyData && linkResult.studentId) {
        const familyRef = doc(db, 'families', user.uid)
        await updateDoc(familyRef, {
          linkedStudents: arrayUnion({
            studentId: linkResult.studentId,
            studentName: linkResult.studentName,
            schoolName: linkResult.schoolName,
            entityId: linkResult.entityId,
            schoolId: linkResult.schoolId,
            grade: linkResult.grade
          }),
          lastUpdated: new Date()
        })
      }
      
      // Show success message
      setAddChildForm(prev => ({ 
        ...prev, 
        loading: false, 
        success: `Successfully connected to ${linkResult.studentName}!`,
        inviteCode: ''
      }))
      
      // Reload the settings data to show the new child
      setTimeout(async () => {
        await loadSettingsData()
        setAddChildForm(prev => ({ ...prev, success: '' }))
        setShowAddChildModal(false)
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error linking to student:', error)
      setAddChildForm(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to connect to child. Please check the invite code and try again.'
      }))
    }
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        background: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Time-based overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: luxTheme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
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
        background: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative'
      }}>
        {/* Time-based overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: luxTheme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Header - Updated with time-aware gradient */}
        <div style={{
          background: timeTheme.gradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 40px ${luxTheme.timeGlow}30`,
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
              color: timeTheme.name === 'night' ? 'white' : luxTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              position: 'absolute',
              left: '20px',
              transition: 'all 0.2s ease'
            }}
          >
            ←
          </button>

          {/* Centered Title */}
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: timeTheme.name === 'night' ? 'white' : luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center',
            textShadow: timeTheme.name === 'night' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
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
                color: timeTheme.name === 'night' ? 'white' : luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease'
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
                zIndex: 9999,
                animation: 'slideInDown 0.3s ease-out'
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNavigation(item)
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
          paddingBottom: '100px',
          position: 'relative',
          zIndex: 10
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
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              animation: 'slideInDown 0.3s ease-out'
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
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              animation: 'slideInDown 0.3s ease-out'
            }}>
              ❌ {error}
            </div>
          )}

          {/* NEW: Premium Features Section */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
            border: `2px solid ${luxTheme.primary}30`,
            position: 'relative',
            animation: 'slideInUp 0.5s ease-out'
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
              ✨ Premium Features
            </h3>
            
            {isPilotPhase ? (
              <div>
                <button
                  onClick={() => setExpandedPremiumFeatures(!expandedPremiumFeatures)}
                  style={{
                    width: '100%',
                    background: `linear-gradient(135deg, #10B981, #059669)`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    color: 'white',
                    textAlign: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    touchAction: 'manipulation',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'bounce 2s infinite' }}>🎉</div>
                    <h4 style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: 'bold',
                      margin: '0 0 8px 0'
                    }}>
                      All Premium Features Unlocked!
                    </h4>
                    <p style={{
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      margin: 0,
                      opacity: 0.9,
                      lineHeight: '1.4'
                    }}>
                      You&apos;re part of our pilot program - all premium features are free during the trial period!
                    </p>
                  </div>
                  <div style={{
                    fontSize: '20px',
                    color: 'rgba(255,255,255,0.8)',
                    transform: expandedPremiumFeatures ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    flexShrink: 0
                  }}>
                    ▶
                  </div>
                </button>

                {/* Expanded Premium Features */}
                {expandedPremiumFeatures && (
                  <div style={{
                    backgroundColor: `${luxTheme.primary}10`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    <h4 style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 12px 0',
                      textAlign: 'center'
                    }}>
                      🔓 Unlocked Premium Pages
                    </h4>
                    
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {[
                        { 
                          feature: 'healthyHabits', 
                          icon: '⏱️', 
                          name: 'Reading Habits Timer', 
                          desc: 'Track your personal reading time and lead by example',
                          path: '/parent/healthy-habits'
                        },
                        { 
                          feature: 'familyBattle', 
                          icon: '⚔️', 
                          name: 'Family Battles', 
                          desc: 'Compete in weekly reading challenges with your children',
                          path: '/parent/family-battle'
                        },
                        { 
                          feature: 'dnaLab', 
                          icon: '🧬', 
                          name: 'Reading DNA Lab', 
                          desc: 'Deep analytics and insights into reading patterns',
                          path: '/parent/dna-lab'
                        },
                        { 
                          feature: 'advancedAnalytics', 
                          icon: '📊', 
                          name: 'Advanced Analytics', 
                          desc: 'Detailed insights into family reading patterns',
                          path: '/parent/child-progress'
                        },
                        { 
                          feature: 'customGoals', 
                          icon: '🎯', 
                          name: 'Custom Reading Goals', 
                          desc: 'Set personalized targets for your family',
                          path: '/parent/family-battle'
                        }
                      ].map((item, index) => (
                        <button
                          key={item.feature}
                          onClick={() => router.push(item.path)}
                          style={{
                            backgroundColor: luxTheme.surface,
                            borderRadius: '8px',
                            padding: '12px',
                            border: `1px solid ${luxTheme.primary}30`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            touchAction: 'manipulation',
                            transition: 'all 0.2s ease',
                            animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${luxTheme.primary}20`
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = luxTheme.surface
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 'clamp(12px, 3.5vw, 14px)',
                              fontWeight: '600',
                              color: luxTheme.textPrimary,
                              marginBottom: '2px'
                            }}>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: 'clamp(10px, 3vw, 12px)',
                              color: luxTheme.textSecondary,
                              lineHeight: '1.3'
                            }}>
                              {item.desc}
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: '#10B981',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            FREE
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: luxTheme.textSecondary,
                            marginLeft: '4px'
                          }}>
                            →
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: '#F3F4F6',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center',
                border: '2px dashed #D1D5DB'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💎</div>
                <h4 style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>
                  Upgrade to Premium
                </h4>
                <p style={{
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: '#6B7280',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4'
                }}>
                  Unlock advanced family reading features for just $10/year
                </p>
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '12px',
                  display: 'inline-block'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1D4ED8'
                  }}>
                    $10.00/year
                  </span>
                </div>

                {/* Show locked features when not in pilot */}
                <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                  {[
                    { 
                      feature: 'healthyHabits', 
                      icon: '⏱️', 
                      name: 'Reading Habits Timer', 
                      desc: 'Track your personal reading time and lead by example' 
                    },
                    { 
                      feature: 'familyBattle', 
                      icon: '⚔️', 
                      name: 'Family Battles', 
                      desc: 'Compete in weekly reading challenges with your children' 
                    },
                    { 
                      feature: 'dnaLab', 
                      icon: '🧬', 
                      name: 'Reading DNA Lab', 
                      desc: 'Deep analytics and insights into reading patterns' 
                    }
                  ].map((item, index) => (
                    <div 
                      key={item.feature}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        position: 'relative',
                        opacity: 0.7
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '2px'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: 'clamp(10px, 3vw, 12px)',
                          color: luxTheme.textSecondary,
                          lineHeight: '1.3'
                        }}>
                          {item.desc}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#9CA3AF',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        LOCKED
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* NEW: Personal Reading Timer Section */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
            border: `2px solid ${luxTheme.primary}30`,
            animation: 'slideInUp 0.6s ease-out'
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
              ⏱️ Your Reading Timer
            </h3>
            
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              Set your default reading session length for the Healthy Habits timer.
            </p>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setTimerDuration(Math.max(10, timerDuration - 5))}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  −
                </button>
                <div style={{
                  padding: '12px 16px',
                  border: `2px solid ${luxTheme.primary}50`,
                  borderRadius: '8px',
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: 'bold',
                  minWidth: '100px',
                  textAlign: 'center',
                  backgroundColor: luxTheme.background,
                  color: luxTheme.textPrimary,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  {timerDuration} min
                </div>
                <button
                  onClick={() => setTimerDuration(Math.min(60, timerDuration + 5))}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  +
                </button>
              </div>
            </div>
            
            <div style={{
              backgroundColor: `${luxTheme.primary}20`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: luxTheme.textSecondary,
                marginBottom: '4px'
              }}>
                {timerDuration <= 20 ? '📚 Perfect for busy parents' : 
                 timerDuration <= 35 ? '⚡ Extended session' : 
                 '🎯 Deep focus session'}
              </div>
              <div style={{
                backgroundColor: luxTheme.primary,
                height: '4px',
                borderRadius: '2px',
                width: `${((timerDuration - 10) / 50) * 100}%`,
                margin: '0 auto',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {timerDuration !== (parentData?.readingSettings?.defaultTimerDuration || 20) && (
              <button
                onClick={saveTimerChange}
                disabled={isSaving}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  width: '100%',
                  minHeight: '48px',
                  touchAction: 'manipulation',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  animation: 'pulseGlow 2s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.target.style.transform = 'scale(1.02)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {isSaving ? 'Saving...' : `Save Timer Setting (${timerDuration} min)`}
              </button>
            )}

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
                💡 <strong>Parent tip:</strong> Research shows that children are 6x more likely to read when they see their parents reading regularly!
              </p>
            </div>
          </div>

          {/* Parent Quiz Codes Section - Compact version */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
            border: `2px solid ${luxTheme.primary}30`,
            animation: 'slideInUp 0.7s ease-out'
          }}>
            <h3 style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ▦ Quiz Codes & Leaderboard
            </h3>
            
            <p style={{
              fontSize: 'clamp(10px, 3vw, 12px)',
              color: luxTheme.textSecondary,
              margin: '0 0 12px 0',
              lineHeight: '1.4'
            }}>
              Teacher codes unlock quizzes and leaderboard access. Approve requests in-app or use codes here.
            </p>

            {teacherQuizCodes.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {teacherQuizCodes.map((teacher, index) => (
                  <div 
                    key={teacher.teacherId}
                    style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      borderRadius: '8px',
                      padding: '12px',
                      border: `1px solid ${luxTheme.primary}30`,
                      animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      gap: '8px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '2px'
                        }}>
                          {teacher.teacherName}
                        </div>
                        <div style={{
                          fontSize: 'clamp(9px, 2.5vw, 10px)',
                          color: luxTheme.textSecondary,
                          wordBreak: 'break-word'
                        }}>
                          {teacher.schoolName} • {teacher.students.join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '6px',
                      padding: '8px',
                      border: `1px solid ${luxTheme.primary}50`
                    }}>
                      <div style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: 'bold',
                        color: luxTheme.textPrimary,
                        letterSpacing: '1px',
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
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: 'clamp(9px, 2.5vw, 10px)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          flexShrink: 0,
                          minHeight: '28px',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = luxTheme.accent}
                        onMouseLeave={(e) => e.target.style.backgroundColor = luxTheme.primary}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '12px',
                color: luxTheme.textSecondary,
                backgroundColor: `${luxTheme.primary}05`,
                borderRadius: '6px',
                border: `1px dashed ${luxTheme.primary}40`
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔒</div>
                <p style={{ 
                  margin: 0, 
                  fontSize: 'clamp(10px, 3vw, 12px)' 
                }}>
                  No quiz codes available yet.
                </p>
              </div>
            )}

            <div style={{
              backgroundColor: '#E6FFFA',
              border: '1px solid #81E6D9',
              borderRadius: '6px',
              padding: '8px',
              marginTop: '12px'
            }}>
              <p style={{
                margin: 0,
                fontSize: 'clamp(9px, 2.5vw, 11px)',
                color: '#065F46',
                lineHeight: '1.3'
              }}>
                💡 <strong>Quick tip:</strong> Quiz requests appear in-app notifications, or use these codes when your child asks for quiz access.
              </p>
            </div>
          </div>

          {/* Profile Information - EXISTING (keeping as-is) */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
            animation: 'slideInUp 0.8s ease-out'
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
                    touchAction: 'manipulation',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = `${luxTheme.primary}30`}
                  onMouseLeave={(e) => e.target.style.backgroundColor = `${luxTheme.primary}20`}
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
    minHeight: '40px',
    color: luxTheme.textPrimary,  // ADD THIS LINE
    backgroundColor: luxTheme.surface  // OPTIONALLY ADD THIS TOO
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
    minHeight: '40px',
    color: luxTheme.textPrimary,  // ADD THIS LINE
    backgroundColor: luxTheme.surface  // ADD THIS LINE
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

          {/* Family Settings - EXISTING (keeping as-is) */}
          {familyData && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
              animation: 'slideInUp 0.9s ease-out'
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
                      touchAction: 'manipulation',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = `${luxTheme.primary}30`}
                    onMouseLeave={(e) => e.target.style.backgroundColor = `${luxTheme.primary}20`}
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
    minHeight: '40px',
    color: luxTheme.textPrimary,  // ADD THIS LINE
    backgroundColor: luxTheme.surface  // ADD THIS LINE
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

          {/* Linked Children - UPDATED with Add Another Child functionality */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
            animation: 'slideInUp 1s ease-out'
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
              <div>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
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
                          border: `1px solid ${luxTheme.primary}30`,
                          animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`
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
                          border: `1px solid ${luxTheme.secondary}40`,
                          animation: 'slideIn 0.3s ease-out'
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

                {/* Add Another Child Button */}
                <div style={{
                  borderTop: `1px solid ${luxTheme.primary}30`,
                  paddingTop: '16px'
                }}>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: `2px dashed ${luxTheme.primary}60`,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: luxTheme.primary,
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${luxTheme.primary}10`
                      e.target.style.borderColor = luxTheme.primary
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.borderColor = `${luxTheme.primary}60`
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>➕</span>
                    <span>Add Another Child</span>
                  </button>
                  
                  <p style={{
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    color: luxTheme.textSecondary,
                    textAlign: 'center',
                    margin: '8px 0 0 0',
                    lineHeight: '1.4'
                  }}>
                    Get invite codes from your child&apos;s teacher or generate them in the student app
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: luxTheme.textSecondary
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
                <h4 style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  No children linked yet
                </h4>
                <p style={{
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: luxTheme.textSecondary,
                  margin: '0 0 20px 0',
                  lineHeight: '1.4'
                }}>
                  Connect with your children to track their reading progress and unlock quizzes
                </p>
                
                <button
                  onClick={() => setShowAddChildModal(true)}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    touchAction: 'manipulation'
                  }}
                >
                  <span>➕</span>
                  <span>Add Your First Child</span>
                </button>
              </div>
            )}
          </div>

          {/* Account Actions - EXISTING (keeping as-is) */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '40px',
            boxShadow: `0 2px 8px rgba(0,0,0,0.1), 0 0 20px ${luxTheme.timeGlow}15`,
            animation: 'slideInUp 1.1s ease-out'
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

        {/* Add Child Modal */}
        {showAddChildModal && (
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
            zIndex: 10000,
            padding: '20px'
          }}>
            <div 
              className="add-child-modal-content"
              style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                animation: 'slideInUp 0.3s ease-out'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowAddChildModal(false)
                  setAddChildForm({ inviteCode: '', loading: false, error: '', success: '' })
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: luxTheme.textSecondary,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `${luxTheme.primary}20`
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                }}
              >
                ×
              </button>

              {/* Modal Content */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: `${luxTheme.primary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '36px',
                  animation: 'bounce 2s infinite'
                }}>
                  👨‍👩‍👧‍👦
                </div>
                
                <h2 style={{
                  fontSize: 'clamp(20px, 5vw, 24px)',
                  fontWeight: 'bold',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Add Another Child
                </h2>
                
                <p style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Enter the invite code from your child&apos;s Lux Libris app
                </p>
              </div>

              {/* Success/Error Messages */}
              {addChildForm.success && (
                <div style={{
                  background: `${luxTheme.primary}20`,
                  border: `1px solid ${luxTheme.primary}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  color: '#065f46',
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  textAlign: 'center',
                  animation: 'slideInDown 0.3s ease-out'
                }}>
                  ✅ {addChildForm.success}
                </div>
              )}
              
              {addChildForm.error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  color: '#dc2626',
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  textAlign: 'center',
                  animation: 'slideInDown 0.3s ease-out'
                }}>
                  ❌ {addChildForm.error}
                </div>
              )}

              {/* Invite Code Form */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  Student Invite Code
                </label>
                
                <input
                  type="text"
                  value={addChildForm.inviteCode}
                  onChange={(e) => setAddChildForm(prev => ({ 
                    ...prev, 
                    inviteCode: e.target.value.toUpperCase(),
                    error: '',
                    success: ''
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && addChildForm.inviteCode.trim() && !addChildForm.loading) {
                      handleAddChild()
                    }
                  }}
                  placeholder="UKSCOTLA-DQGKYZR"
                  disabled={addChildForm.loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: `2px solid ${luxTheme.primary}40`,
                    borderRadius: '12px',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    letterSpacing: '1px',
                    minHeight: '56px',
                    backgroundColor: addChildForm.loading ? '#f3f4f6' : luxTheme.surface,
                    color: luxTheme.textPrimary
                  }}
                  onFocus={(e) => !addChildForm.loading && (e.target.style.borderColor = luxTheme.primary)}
                  onBlur={(e) => !addChildForm.loading && (e.target.style.borderColor = `${luxTheme.primary}40`)}
                />
                
                <p style={{
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: luxTheme.textSecondary,
                  textAlign: 'center',
                  margin: '8px 0 0 0',
                  lineHeight: '1.4'
                }}>
                  Find this code in your child&apos;s app: Settings → &quot;Invite Parents&quot; • Press Enter to submit
                </p>
              </div>

              {/* Submit Button */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <button
                  onClick={handleAddChild}
                  disabled={addChildForm.loading || !addChildForm.inviteCode.trim()}
                  style={{
                    backgroundColor: addChildForm.loading || !addChildForm.inviteCode.trim() 
                      ? '#d1d5db' 
                      : luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: '600',
                    cursor: addChildForm.loading || !addChildForm.inviteCode.trim() ? 'not-allowed' : 'pointer',
                    touchAction: 'manipulation',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    margin: '0 auto',
                    minHeight: '56px',
                    minWidth: '160px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!addChildForm.loading && addChildForm.inviteCode.trim()) {
                      e.target.style.transform = 'scale(1.02)'
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {addChildForm.loading && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${luxTheme.textPrimary}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {addChildForm.loading ? 'Connecting...' : 'Connect Child'}
                </button>
              </div>

              {/* Help Instructions */}
              <div style={{
                backgroundColor: `${luxTheme.accent}10`,
                border: `1px solid ${luxTheme.accent}30`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 12px 0'
                }}>
                  How to get the invite code:
                </h4>
                
                <div style={{
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: luxTheme.textSecondary,
                  lineHeight: '1.5'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>1.</strong> Have your child open the Lux Libris app
                  </p>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>2.</strong> Go to Settings → &quot;Invite Parents&quot;
                  </p>
                  <p style={{ margin: '0' }}>
                    <strong>3.</strong> Copy the invite code and enter it above
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideIn {
            from { 
              opacity: 0; 
              transform: translateY(-10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInDown {
            from { 
              opacity: 0; 
              transform: translateY(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInLeft {
            from { 
              opacity: 0; 
              transform: translateX(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
            }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-8px);
            }
            60% {
              transform: translateY(-4px);
            }
          }
          
          @keyframes pulseGlow {
            0%, 100% {
              opacity: 1;
              filter: brightness(1);
            }
            50% {
              opacity: 0.8;
              filter: brightness(1.2);
            }
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
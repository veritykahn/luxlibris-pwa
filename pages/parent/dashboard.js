// pages/parent/dashboard.js - Updated with Book Nominees and unlocked Settings
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function ParentDashboard() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [familyData, setFamilyData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [familyBattleData, setFamilyBattleData] = useState(null)
  const [pendingQuizApprovals, setPendingQuizApprovals] = useState([])
  const [recentAchievements, setRecentAchievements] = useState([])
  const [showComingSoon, setShowComingSoon] = useState('')
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)

  // Family dashboard cards state
  const [expandedChild, setExpandedChild] = useState(null)

  // UPDATED: Lux Libris Classic Theme (same as student dashboard)
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // UPDATED: Navigation menu items with Book Nominees and unlocked Settings
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂', current: true },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family DNA Lab', path: '/parent/dna-lab', icon: '🧬' },
    { name: 'Quiz Unlock Center', path: '/parent/quiz-unlock', icon: '▦' },
    { name: 'Family Celebrations', path: '/parent/celebrations', icon: '♔' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadFamilyDashboardData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

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

  const loadFamilyDashboardData = async () => {
    try {
      console.log('🏠 Loading family dashboard data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentData = parentDoc.data()
      console.log('✅ Parent data loaded:', parentData.firstName)

      // Load family profile
      const familyRef = doc(db, 'families', user.uid)
      const familyDoc = await getDoc(familyRef)
      
      if (familyDoc.exists()) {
        setFamilyData(familyDoc.data())
        console.log('✅ Family data loaded:', familyDoc.data().familyName)
      }

      // Load linked students data
      await loadLinkedStudentsData(parentData.linkedStudents || [])
      
      // Load family battle data
      await loadFamilyBattleData()
      
      // Load pending quiz approvals
      await loadPendingQuizApprovals(parentData.linkedStudents || [])
      
      // Load recent achievements
      await loadRecentAchievements(parentData.linkedStudents || [])

    } catch (error) {
      console.error('❌ Error loading family dashboard:', error)
      setError('Failed to load family data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsData = async (linkedStudentIds) => {
    try {
      const students = []
      
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
            }
          }
        }
      }
      
      setLinkedStudents(students)
      console.log('✅ Linked students loaded:', students.length)
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
    }
  }

  const loadFamilyBattleData = async () => {
    try {
      // Calculate family reading minutes for this week
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const weekStr = startOfWeek.toISOString().split('T')[0]
      
      // This would aggregate from all family members' reading sessions
      // For now, using mock data
      setFamilyBattleData({
        weeklyGoal: 300, // minutes
        parentMinutes: 45,
        childrenMinutes: 156,
        totalMinutes: 201,
        weekStarting: weekStr,
        streakDays: 3
      })
      
    } catch (error) {
      console.error('❌ Error loading family battle data:', error)
    }
  }

  const loadPendingQuizApprovals = async (linkedStudentIds) => {
    try {
      const pendingApprovals = []
      
      // This would check each student's bookshelf for books needing quiz approval
      // For now, using mock data
      if (linkedStudents.length > 0) {
        pendingApprovals.push({
          studentId: linkedStudents[0]?.id,
          studentName: linkedStudents[0]?.firstName,
          bookTitle: "Harry Potter and the Sorcerer's Stone",
          bookId: "sample-book-1",
          requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        })
      }
      
      setPendingQuizApprovals(pendingApprovals)
      
    } catch (error) {
      console.error('❌ Error loading pending quiz approvals:', error)
    }
  }

  const loadRecentAchievements = async (linkedStudentIds) => {
    try {
      const achievements = []
      
      // This would load recent saint unlocks and book completions
      // For now, using mock data
      if (linkedStudents.length > 0) {
        achievements.push({
          type: 'saint_unlock',
          studentName: linkedStudents[0]?.firstName,
          saintName: 'St. Joan of Arc',
          unlockedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          icon: '⚔️'
        })
        
        if (linkedStudents.length > 1) {
          achievements.push({
            type: 'book_completion',
            studentName: linkedStudents[1]?.firstName,
            bookTitle: 'The Lion, the Witch and the Wardrobe',
            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            icon: '📚'
          })
        }
      }
      
      setRecentAchievements(achievements)
      
    } catch (error) {
      console.error('❌ Error loading recent achievements:', error)
    }
  }

  const handleApproveQuiz = async (approval) => {
    try {
      console.log('✅ Approving quiz for:', approval.bookTitle)
      
      // This would update the student's book status to allow quiz taking
      // For now, just remove from pending
      setPendingQuizApprovals(prev => prev.filter(p => p.bookId !== approval.bookId))
      
      setShowComingSoon(`✅ Quiz approved for "${approval.bookTitle}"!`)
      setTimeout(() => setShowComingSoon(''), 3000)
      
    } catch (error) {
      console.error('❌ Error approving quiz:', error)
      setShowComingSoon('❌ Failed to approve quiz. Please try again.')
      setTimeout(() => setShowComingSoon(''), 3000)
    }
  }

  // UPDATED: Handle tab navigation with unlocked Settings and Book Nominees
  const handleTabClick = (tabName) => {
    if (tabName === 'Family Dashboard') {
      setShowComingSoon('You\'re already here! ⌂')
      setTimeout(() => setShowComingSoon(''), 1500)
    } else if (tabName === 'Settings') {
      // Navigate to settings - it's unlocked!
      router.push('/parent/settings')
    } else if (tabName === 'Book Nominees') {
      // Navigate to nominees - it's unlocked!
      router.push('/parent/nominees')
    } else {
      setShowComingSoon(`${tabName} is coming soon! 🚧`)
      setTimeout(() => setShowComingSoon(''), 3000)
    }
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    const familyName = familyData?.familyName || 'Family'
    
    if (hour < 6) return `Good morning, ${familyName}!`
    if (hour < 12) return `Good morning, ${familyName}!`
    if (hour < 17) return `Good afternoon, ${familyName}!`
    if (hour < 21) return `Good evening, ${familyName}!`
    return `Good evening, ${familyName}!`
  }

  const getMotivationalMessage = () => {
    const totalChildren = linkedStudents.length
    const totalMinutes = familyBattleData?.totalMinutes || 0
    const weeklyGoal = familyBattleData?.weeklyGoal || 300
    
    if (totalMinutes >= weeklyGoal) {
      return `🎉 Weekly goal achieved! Your family read ${totalMinutes} minutes together!`
    }
    
    if (totalMinutes >= weeklyGoal * 0.8) {
      return `⚡ So close! Just ${weeklyGoal - totalMinutes} more minutes to reach your family goal!`
    }
    
    if (pendingQuizApprovals.length > 0) {
      return `▦ ${pendingQuizApprovals.length} quiz${pendingQuizApprovals.length > 1 ? 'es' : ''} waiting for your approval!`
    }
    
    if (totalChildren === 1) {
      return `📚 Support ${linkedStudents[0]?.firstName}'s reading journey together!`
    }
    
    return `🏆 Keep up the great family reading habits!`
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
          <p style={{ color: luxTheme.textPrimary }}>Loading your family dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Family Dashboard - Lux Libris</title>
        <meta name="description" content="Track your family's reading progress, approve quiz codes, and celebrate achievements together" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '80px'
      }}>
        
        {/* Header */}
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
            Family Dashboard
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

            {/* UPDATED Dropdown Menu with Book Nominees and unlocked Settings */}
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
                        if (item.path === '/parent/settings' || item.path === '/parent/nominees') {
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

        {/* Welcome Section */}
        <div style={{ padding: '20px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px ${luxTheme.primary}30`,
            marginBottom: '16px',
            color: luxTheme.textPrimary
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              {getTimeBasedGreeting()}
            </h2>
            
            <p style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              margin: '0 0 12px 0',
              opacity: 0.9
            }}>
              {getMotivationalMessage()}
            </p>

            {/* Family Reading Battle Progress */}
            {familyBattleData && (
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>🏆</span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Family Battle: {familyBattleData.totalMinutes} / {familyBattleData.weeklyGoal} minutes
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    height: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'white',
                      height: '100%',
                      width: `${Math.min((familyBattleData.totalMinutes / familyBattleData.weeklyGoal) * 100, 100)}%`,
                      transition: 'width 1s ease'
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 12px)',
                  textAlign: 'center',
                  minWidth: '60px'
                }}>
                  {Math.round((familyBattleData.totalMinutes / familyBattleData.weeklyGoal) * 100)}%
                </div>
              </div>
            )}
          </div>

          {/* Your Reading Family Card */}
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
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👨‍👩‍👧‍👦 Your Reading Family
            </h3>
            
            {linkedStudents.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {linkedStudents.map((student, index) => (
                  <div 
                    key={student.id}
                    style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: `1px solid ${luxTheme.primary}30`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setExpandedChild(expandedChild === student.id ? null : student.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${luxTheme.primary}20`
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: luxTheme.textPrimary,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {student.firstName?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {student.firstName} {student.lastInitial}.
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: luxTheme.textSecondary,
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span>Grade {student.grade}</span>
                        <span>•</span>
                        <span style={{ wordBreak: 'break-word' }}>{student.schoolName}</span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}>
                      <div style={{
                        fontSize: 'clamp(18px, 5vw, 20px)',
                        fontWeight: 'bold',
                        color: luxTheme.primary
                      }}>
                        {student.booksSubmittedThisYear || 0}
                      </div>
                      <div style={{
                        fontSize: 'clamp(8px, 2.5vw, 10px)',
                        color: luxTheme.textSecondary,
                        textAlign: 'center'
                      }}>
                        books
                      </div>
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: luxTheme.textSecondary,
                      transform: expandedChild === student.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}>
                      ▶
                    </div>
                  </div>
                ))}
                
                {/* Parent Reading Row */}
                <div style={{
                  backgroundColor: `${luxTheme.secondary}15`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: `1px solid ${luxTheme.secondary}40`
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${luxTheme.secondary}, ${luxTheme.primary})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: luxTheme.textPrimary,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {userProfile.firstName?.charAt(0) || 'P'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      {userProfile.firstName} (Parent)
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: luxTheme.textSecondary
                    }}>
                      Leading by example
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: 'clamp(18px, 5vw, 20px)',
                      fontWeight: 'bold',
                      color: luxTheme.secondary
                    }}>
                      {Math.floor((familyBattleData?.parentMinutes || 0) / 20)} {/* Rough books estimate */}
                    </div>
                    <div style={{
                      fontSize: 'clamp(8px, 2.5vw, 10px)',
                      color: luxTheme.textSecondary,
                      textAlign: 'center'
                    }}>
                      books
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: luxTheme.textSecondary
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
                <p>No children linked yet. Check your account setup!</p>
              </div>
            )}
          </div>

          {/* Pending Quiz Approvals */}
          {pendingQuizApprovals.length > 0 && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid #F59E0B30`
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
                ▦ Quiz Approvals Needed
              </h3>
              
              {pendingQuizApprovals.map((approval, index) => (
                <div 
                  key={approval.bookId}
                  style={{
                    backgroundColor: '#FEF3CD',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: index < pendingQuizApprovals.length - 1 ? '12px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid #F59E0B50'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#F59E0B20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    📝
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: '#92400E',
                      marginBottom: '4px'
                    }}>
                      {approval.studentName} wants to take a quiz
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: '#A16207',
                      wordBreak: 'break-word'
                    }}>
                      &quot;{approval.bookTitle}&quot;
                    </div>
                  </div>
                  <button
                    onClick={() => handleApproveQuiz(approval)}
                    style={{
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '44px',
                      flexShrink: 0,
                      touchAction: 'manipulation'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Family Achievements */}
          {recentAchievements.length > 0 && (
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
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎉 Recent Family Achievements
              </h3>
              
              {recentAchievements.map((achievement, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: `${luxTheme.primary}10`,
                    borderRadius: '8px',
                    marginBottom: index < recentAchievements.length - 1 ? '8px' : '0'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: luxTheme.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '2px'
                    }}>
                      {achievement.type === 'saint_unlock' ? 
                        `${achievement.studentName} unlocked ${achievement.saintName}!` :
                        `${achievement.studentName} completed "${achievement.bookTitle}"!`
                      }
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: luxTheme.textSecondary
                    }}>
                      {achievement.type === 'saint_unlock' ? 
                        new Date(achievement.unlockedAt).toLocaleDateString() :
                        new Date(achievement.completedAt).toLocaleDateString()
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '100px'
          }}>
            <QuickActionButton
              icon="▦"
              label="Quiz Center"
              onClick={() => handleTabClick('Quiz Unlock Center')}
              theme={luxTheme}
            />
            <QuickActionButton
              icon="♔"
              label="Celebrations"
              onClick={() => handleTabClick('Family Celebrations')}
              theme={luxTheme}
            />
          </div>
        </div>

        {/* Coming Soon Message */}
        {showComingSoon && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: luxTheme.primary,
            color: luxTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1001,
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showComingSoon}
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

// Quick Action Button Component
function QuickActionButton({ icon, label, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.primary}30`,
        borderRadius: '12px',
        padding: '16px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        transform: 'translateY(0)',
        width: '100%',
        minHeight: '60px',
        touchAction: 'manipulation'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = `${theme.primary}20`
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
        e.currentTarget.style.borderColor = theme.primary
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = theme.surface
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `${theme.primary}30`
      }}
    >
      <span style={{ 
        fontSize: 'clamp(20px, 6vw, 24px)',
        transition: 'transform 0.3s ease'
      }}>{icon}</span>
      <span style={{
        fontSize: 'clamp(10px, 3vw, 12px)',
        fontWeight: '600',
        color: theme.textPrimary,
        textAlign: 'center'
      }}>
        {label}
      </span>
    </button>
  )
}
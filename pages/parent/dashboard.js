// pages/parent/dashboard.js - Updated with two parents support and notifications
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import useUnlockNotifications from '../../hooks/useUnlockNotifications'
import { NotificationToastContainer } from '../../components/NotificationToast'

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
  
  // Add these state declarations after other state
  const [familyParents, setFamilyParents] = useState([])
  const [parentReadingData, setParentReadingData] = useState({})
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)

  // Family dashboard cards state
  const [expandedChild, setExpandedChild] = useState(null)

  // 🆕 NEW: Real-time unlock notifications
  const {
    notifications,
    toastQueue,
    markNotificationsAsSeen,
    removeToast,
    hasNotifications,
    hasNewNotifications,
    totalCount,
    newCount,
    loading: notificationsLoading
  } = useUnlockNotifications()

  // 🆕 NEW: Handle navigation to child progress from notifications
  const handleNavigateToUnlocks = () => {
    markNotificationsAsSeen() // Mark as seen when navigating
    router.push('/parent/child-progress')
  }

  // Get time-based theme - memoized with hour dependency
const timeTheme = useMemo(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      name: 'morning',
      gradient: 'linear-gradient(135deg, #F5C99B, #F0B88A, #EBAD7A)',
      overlay: 'rgba(245, 201, 155, 0.1)'
    };
    } else if (hour >= 12 && hour < 17) {
    return {
      name: 'afternoon',
      gradient: 'linear-gradient(135deg, #6BB6E3, #7AC5EA, #89D0EE)',
      overlay: 'rgba(107, 182, 227, 0.1)'
    };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #FFB347, #FF8C42, #FF6B35)',
        overlay: 'rgba(255, 140, 66, 0.1)'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #4B0082, #6A0DAD, #7B68EE)',
        overlay: 'rgba(75, 0, 130, 0.1)'
      };
    }
  }, [Math.floor(new Date().getHours() / 6)]); // Only recalc every 6 hours

  // UPDATED: Lux Libris Classic Theme with time-based adjustments
  const luxTheme = useMemo(() => ({
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A',
    timeOverlay: timeTheme.overlay
  }), [timeTheme]);

  // UPDATED: Navigation menu items with notification badge
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂', current: true },
    { 
      name: 'Child Progress', 
      path: '/parent/child-progress', 
      icon: '◐',
      badge: totalCount > 0 ? totalCount : null, // Show total pending count
      badgeColor: newCount > 0 ? '#F59E0B' : '#6B7280' // Orange for new, gray for total
    },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [totalCount, newCount])

  // UPDATED: Bottom navigation items with notification badge
  const bottomNavItems = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 400;
    
    return [
      { name: isMobile ? 'Home' : 'Dashboard', path: '/parent/dashboard', icon: '⌂', current: true },
      { 
        name: 'Progress', 
        path: '/parent/child-progress', 
        icon: '◐',
        badge: totalCount > 0 ? totalCount : null,
        badgeColor: newCount > 0 ? '#F59E0B' : '#6B7280'
      },
      { name: 'Books', path: '/parent/nominees', icon: '□' },
      { name: 'Habits', path: '/parent/healthy-habits', icon: '◉' },
      { name: 'Battle', path: '/parent/family-battle', icon: '⚔️' },
      { name: 'DNA', path: '/parent/dna-lab', icon: '⬢' }
    ];
  }, [totalCount, newCount])

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

  // Update loadFamilyDashboardData to load all parents in family
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

      // Load family profile - check both old and new patterns
      let familyDoc = null
      let familyId = parentData.familyId || user.uid
      
      // Try new familyId first, then fall back to user.uid
      if (parentData.familyId) {
        const familyRef = doc(db, 'families', parentData.familyId)
        familyDoc = await getDoc(familyRef)
      }
      
      if (!familyDoc || !familyDoc.exists()) {
        const familyRef = doc(db, 'families', user.uid)
        familyDoc = await getDoc(familyRef)
        familyId = user.uid
      }
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data()
        setFamilyData(familyData)
        console.log('✅ Family data loaded:', familyData.familyName)
        
        // Load all parents in the family
        await loadFamilyParents(familyData, familyId)
      }

      // Load linked students data
      await loadLinkedStudentsData(parentData.linkedStudents || [])
      
      // Load family battle data with parent-specific tracking
      await loadFamilyBattleData(familyId)
      
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

  // New function to load all parents in the family
  const loadFamilyParents = async (familyData, familyId) => {
    try {
      const parents = []
      const parentIds = familyData.parents || [familyId] // Fall back to familyId if no parents array
      
      for (const parentId of parentIds) {
        const parentRef = doc(db, 'parents', parentId)
        const parentDoc = await getDoc(parentRef)
        
        if (parentDoc.exists()) {
          const parentData = parentDoc.data()
          parents.push({
            id: parentId,
            ...parentData,
            isCurrentUser: parentId === user.uid
          })
        }
      }
      
      setFamilyParents(parents)
      console.log('✅ Family parents loaded:', parents.length)
      
    } catch (error) {
      console.error('❌ Error loading family parents:', error)
    }
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

  // Update loadFamilyBattleData to track parent reading separately
  const loadFamilyBattleData = async (familyId) => {
    try {
      // Calculate family reading minutes for this week
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const weekStr = startOfWeek.toISOString().split('T')[0]
      
      // Load reading data for each parent
      const parentMinutesMap = {}
      let totalParentMinutes = 0
      
      // For now, using mock data - in real app would query reading sessions
      if (familyParents.length > 0) {
        familyParents.forEach((parent, index) => {
          const minutes = index === 0 ? 45 : 25 // Mock data
          parentMinutesMap[parent.id] = {
            name: parent.firstName,
            minutes: minutes,
            sessions: index === 0 ? 3 : 2
          }
          totalParentMinutes += minutes
        })
      }
      
      setParentReadingData(parentMinutesMap)
      
      setFamilyBattleData({
        weeklyGoal: 300, // minutes
        parentMinutes: totalParentMinutes,
        childrenMinutes: 156,
        totalMinutes: totalParentMinutes + 156,
        weekStarting: weekStr,
        streakDays: 3,
        parentBreakdown: parentMinutesMap
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

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
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
      paddingBottom: '80px',
      position: 'relative'
    }}>
      {/* Time-based overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: timeTheme.overlay,
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Header */}
<div style={{
  background: timeTheme.gradient,
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

            {/* UPDATED: Dropdown Menu with notification badges */}
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
                      
                      // Mark notifications as seen when clicking Child Progress
                      if (item.path === '/parent/child-progress' && hasNewNotifications) {
                        markNotificationsAsSeen()
                      }
                      
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
                      position: 'relative',
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
                    <span style={{ flex: 1 }}>{item.name}</span>
                    
                    {/* 🆕 NEW: Notification badge */}
                    {item.badge && (
                      <div style={{
                        backgroundColor: item.badgeColor,
                        color: 'white',
                        borderRadius: '10px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        marginLeft: '4px'
                      }}>
                        {item.badge}
                      </div>
                    )}
                    
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
    background: timeTheme.gradient,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    marginBottom: '16px',
    color: 'white',
    position: 'relative'
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

            {/* Updated Family Battle Progress to show parent breakdown */}
            {familyBattleData && (
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setShowComingSoon('🏆 Detailed family battle view coming soon!')
                setTimeout(() => setShowComingSoon(''), 3000)
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
                  {/* Show parent vs kids breakdown */}
                  {familyParents.length > 0 && (
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      marginTop: '4px',
                      opacity: 0.9
                    }}>
                      Parents: {familyBattleData.parentMinutes}min • Kids: {familyBattleData.childrenMinutes}min
                    </div>
                  )}
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

          {/* Updated Your Reading Family Card */}
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
            
            {(linkedStudents.length > 0 || familyParents.length > 0) ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                
                {/* Children Section */}
                {linkedStudents.length > 0 && (
                  <>
                    <div style={{
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginTop: '8px',
                      marginBottom: '4px'
                    }}>
                      Children ({linkedStudents.length})
                    </div>
                    
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
                  </>
                )}
                
                {/* Parents Section */}
                {familyParents.length > 0 && (
                  <>
                    <div style={{
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginTop: '8px',
                      marginBottom: '4px'
                    }}>
                      Parents ({familyParents.length})
                    </div>
                    
                    {familyParents.map((parent, index) => (
                      <div 
                        key={parent.id}
                        style={{
                          backgroundColor: parent.isCurrentUser 
                            ? `${luxTheme.secondary}25` 
                            : `${luxTheme.secondary}15`,
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          border: parent.isCurrentUser 
                            ? `2px solid ${luxTheme.secondary}` 
                            : `1px solid ${luxTheme.secondary}40`
                        }}
                      >
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
                          {parent.firstName?.charAt(0) || 'P'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 'clamp(14px, 4vw, 16px)',
                            fontWeight: '600',
                            color: luxTheme.textPrimary,
                            marginBottom: '4px'
                          }}>
                            {parent.firstName} {parent.lastName}
                            {parent.isCurrentUser && ' (You)'}
                          </div>
                          <div style={{
                            fontSize: 'clamp(10px, 3vw, 12px)',
                            color: luxTheme.textSecondary
                          }}>
                            {parent.isCurrentUser ? 'Leading by example' : 'Reading together'}
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
                            {familyBattleData?.parentBreakdown?.[parent.id]?.minutes || 0}
                          </div>
                          <div style={{
                            fontSize: 'clamp(8px, 2.5vw, 10px)',
                            color: luxTheme.textSecondary,
                            textAlign: 'center'
                          }}>
                            min/week
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Second Parent Button - only show if less than 2 parents */}
                    {familyParents.length < 2 && (
                      <button
                        onClick={() => {
                          setShowComingSoon('📧 Share an invite code with your partner to add them to the family!')
                          setTimeout(() => setShowComingSoon(''), 4000)
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: `2px dashed ${luxTheme.secondary}60`,
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          color: luxTheme.textSecondary,
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = luxTheme.secondary
                          e.currentTarget.style.backgroundColor = `${luxTheme.secondary}10`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${luxTheme.secondary}60`
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>➕</span>
                        Add Second Parent
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: luxTheme.textSecondary
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
                <p>No family members linked yet. Check your account setup!</p>
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
              icon="◐"
              label="Child Progress"
              onClick={() => {
                setShowComingSoon('🚧 Child Progress is coming soon!')
                setTimeout(() => setShowComingSoon(''), 3000)
              }}
              theme={luxTheme}
            />
            <QuickActionButton
              icon="⚔️"
              label="Family Battle"
              onClick={() => {
                setShowComingSoon('🚧 Family Battle is coming soon!')
                setTimeout(() => setShowComingSoon(''), 3000)
              }}
              theme={luxTheme}
            />
          </div>
        </div>

        {/* 🆕 NEW: Real-time notification toasts */}
        <NotificationToastContainer
          toasts={toastQueue}
          onRemoveToast={removeToast}
          onNavigateToUnlocks={handleNavigateToUnlocks}
          theme={luxTheme}
        />

        {/* UPDATED: Bottom Navigation Bar with notification badges */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: luxTheme.surface,
          borderTop: `1px solid ${luxTheme.primary}30`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          zIndex: 999
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '8px 0',
            maxWidth: '100%',
            margin: '0 auto',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {bottomNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  if (!item.current) {
                    // Mark notifications as seen when clicking Child Progress
                    if (item.path === '/parent/child-progress' && hasNewNotifications) {
                      markNotificationsAsSeen()
                    }
                    router.push(item.path)
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '8px',
                  minWidth: '60px',
                  flex: '1 0 auto',
                  cursor: item.current ? 'default' : 'pointer',
                  color: item.current ? luxTheme.primary : luxTheme.textSecondary,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <span style={{
                    fontSize: '18px',
                    transform: item.current ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    display: 'block'
                  }}>
                    {item.icon}
                  </span>
                  
                  {/* 🆕 NEW: Notification badge */}
                  {item.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: item.badgeColor,
                      color: 'white',
                      borderRadius: '10px',
                      minWidth: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      border: '1.5px solid white'
                    }}>
                      {item.badge}
                    </div>
                  )}
                </div>
                
                <span style={{
                  fontSize: '9px',
                  fontWeight: item.current ? '600' : '500',
                  whiteSpace: 'nowrap'
                }}>
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Coming Soon Message */}
        {showComingSoon && (
          <div style={{
            position: 'fixed',
            bottom: '90px',
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
          
          /* Hide scrollbar for bottom nav but keep it scrollable */
          div::-webkit-scrollbar {
            display: none;
          }
          
          /* For Firefox */
          div {
            scrollbar-width: none;
          }
          
          /* Ensure bottom nav items stay visible on very small screens */
          @media (max-width: 375px) {
            button span {
              font-size: 8px !important;
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
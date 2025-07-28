// pages/parent/family-battle.js - MERGED: Premium Gate + Real Data + Engagement Features
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import PremiumGate from '../../components/PremiumGate'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, query, where, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Celebration Animation Component
function CelebrationAnimation({ milestone, isVisible, onComplete }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.5s ease'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '350px',
        width: '90%',
        animation: 'bounceIn 0.8s ease'
      }}>
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          animation: 'pulse 1s infinite'
        }}>
          🔥🎉🔥
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#FF6B35',
          marginBottom: '12px'
        }}>
          {milestone === 7 ? 'One Week Streak!' :
           milestone === 14 ? 'Two Week Streak!' :
           milestone === 30 ? 'One Month Streak!' :
           milestone === 100 ? 'One Hundred Days!' :
           'Reading Streak Milestone!'}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '20px'
        }}>
          Your family has been reading together for {milestone} days straight! 
          Keep the fire burning! 🔥
        </p>
        <div style={{
          fontSize: '14px',
          color: '#999',
          fontStyle: 'italic'
        }}>
          "Don't break the chain!"
        </div>
      </div>
    </div>
  )
}

// Family Streak Tracker Component
function FamilyStreakTracker({ streakDays, theme, onStreakClick }) {
  const getStreakColor = (days) => {
    if (days >= 30) return '#FF4444' // Fire red for 30+ days
    if (days >= 14) return '#FF6B35' // Orange for 2+ weeks  
    if (days >= 7) return '#FFA500'  // Yellow-orange for 1+ week
    if (days >= 3) return '#FFD700'  // Gold for 3+ days
    return '#87CEEB' // Light blue for starting out
  }

  const getStreakEmoji = (days) => {
    if (days >= 30) return '🔥'
    if (days >= 14) return '🔥'
    if (days >= 7) return '🔥'
    if (days >= 3) return '⭐'
    return '📚'
  }

  const getStreakMessage = (days) => {
    if (days >= 100) return "LEGENDARY!"
    if (days >= 30) return "On Fire!"
    if (days >= 14) return "Hot Streak!"
    if (days >= 7) return "One Week!"
    if (days >= 3) return "Building!"
    if (days >= 1) return "Started!"
    return "Start Streak!"
  }

  return (
    <div 
      onClick={onStreakClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: getStreakColor(streakDays),
        borderRadius: '50px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: streakDays >= 7 ? 'pulse 2s infinite' : 'none',
        zIndex: 200,
        border: '2px solid #FFFFFF'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <span style={{ 
        fontSize: '20px',
        animation: streakDays >= 7 ? 'bounce 1s infinite' : 'none'
      }}>
        {getStreakEmoji(streakDays)}
      </span>
      <div style={{ color: '#FFFFFF' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          {streakDays} {streakDays === 1 ? 'day' : 'days'}
        </div>
        <div style={{
          fontSize: '10px',
          opacity: 0.9,
          lineHeight: '1'
        }}>
          {getStreakMessage(streakDays)}
        </div>
      </div>
    </div>
  )
}

// Challenge Card Component
function ChallengeCard({ challenge, theme, onAcceptChallenge }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${theme.accent}20, ${theme.secondary}15)`,
      borderRadius: '16px',
      padding: '16px',
      border: `2px solid ${theme.accent}`,
      marginBottom: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '24px' }}>{challenge.icon}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: 'clamp(13px, 3.5vw, 14px)',
            fontWeight: '600',
            color: theme.textPrimary,
            margin: '0 0 4px 0'
          }}>
            {challenge.title}
          </h4>
          <p style={{
            fontSize: 'clamp(11px, 3vw, 12px)',
            color: theme.textSecondary,
            margin: 0
          }}>
            {challenge.description}
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: 'clamp(10px, 2.5vw, 11px)',
          color: theme.accent,
          fontWeight: '600'
        }}>
          Reward: {challenge.reward}
        </div>
        <button
          onClick={() => onAcceptChallenge(challenge)}
          style={{
            backgroundColor: theme.accent,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: 'clamp(10px, 2.5vw, 11px)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default function ParentFamilyBattle() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const { hasFeature, isPilotPhase } = usePremiumFeatures()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [familyBattleData, setFamilyBattleData] = useState(null)
  const [familyStreakData, setFamilyStreakData] = useState({ streakDays: 0, lastReadingDate: null })
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMilestone, setCelebrationMilestone] = useState(0)

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

  // Updated Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️', current: true },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  // Weekly Challenges
  const weeklyChallenge = useMemo(() => [
    {
      id: 'family_time',
      icon: '👨‍👩‍👧‍👦',
      title: 'Family Reading Time',
      description: 'Read together for 30 minutes this week',
      reward: '50 Family XP',
      target: 30,
      progress: 15
    },
    {
      id: 'parent_motivation',
      icon: '🎯',
      title: 'Parent Power Hour',
      description: 'Parents read 60 minutes to motivate kids',
      reward: 'Unlock Family Achievement',
      target: 60,
      progress: 25
    },
    {
      id: 'streak_defender',
      icon: '🔥',
      title: 'Streak Defender',
      description: 'Keep family streak alive for 7 more days',
      reward: 'Streak Milestone Badge',
      target: 7,
      progress: 3
    }
  ], [])

  // Utility function for local date
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Load family battle data (aggregate parent + student minutes)
  const loadFamilyBattleData = useCallback(async () => {
    try {
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const weekStr = getLocalDateString(startOfWeek)
      
      // Get parent minutes this week
      const parentSessionsRef = collection(db, `parents/${user.uid}/readingSessions`)
      const parentWeekQuery = query(
        parentSessionsRef,
        where('date', '>=', weekStr)
      )
      const parentWeekSnapshot = await getDocs(parentWeekQuery)
      let parentMinutes = 0
      
      parentWeekSnapshot.forEach(docSnap => {
        const session = docSnap.data()
        parentMinutes += session.duration
      })

      // Get children's minutes this week
      let childrenMinutes = 0
      const childrenDetails = []
      
      for (const student of linkedStudents) {
        const studentSessionsRef = collection(db, `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}/readingSessions`)
        const studentWeekQuery = query(
          studentSessionsRef,
          where('date', '>=', weekStr)
        )
        const studentWeekSnapshot = await getDocs(studentWeekQuery)
        
        let studentMinutes = 0
        studentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data()
          studentMinutes += session.duration
          childrenMinutes += session.duration
        })
        
        childrenDetails.push({
          name: student.firstName,
          minutes: studentMinutes,
          grade: student.grade
        })
      }

      const battleData = {
        weekStarting: weekStr,
        parentMinutes,
        childrenMinutes,
        childrenDetails,
        totalMinutes: parentMinutes + childrenMinutes,
        winner: parentMinutes > childrenMinutes ? 'parents' : 'children',
        lead: Math.abs(parentMinutes - childrenMinutes),
        weekNumber: getWeekNumber(new Date())
      }

      setFamilyBattleData(battleData)
      
      // Load family streak data
      await loadFamilyStreakData()
      
    } catch (error) {
      console.error('Error loading family battle data:', error)
    }
  }, [linkedStudents, user?.uid])

  // Load family reading streak data
  const loadFamilyStreakData = async () => {
    try {
      // Get family document
      const familyRef = doc(db, 'families', user.uid)
      const familyDoc = await getDoc(familyRef)
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data()
        const streakData = familyData.familyStreakData || { streakDays: 12, lastReadingDate: null } // Mock 12-day streak
        setFamilyStreakData(streakData)
        
        // Check for milestone celebrations
        const milestones = [7, 14, 30, 50, 100]
        const currentStreak = streakData.streakDays
        
        if (milestones.includes(currentStreak)) {
          setCelebrationMilestone(currentStreak)
          setTimeout(() => setShowCelebration(true), 1000)
        }
      }
    } catch (error) {
      console.error('Error loading family streak data:', error)
    }
  }

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  // Load initial data with premium check
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      if (hasFeature('familyBattle')) {
        loadInitialData()
      } else {
        setLoading(false)
      }
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile, hasFeature])

  const loadInitialData = async () => {
    try {
      console.log('🏆 Loading family battle data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)
      
      // Load linked students
      await loadLinkedStudentsData(parentProfile.linkedStudents || [])
      
    } catch (error) {
      console.error('❌ Error loading family battle data:', error)
      setError('Failed to load family battle data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsData = async (linkedStudentIds) => {
    try {
      const students = []
      const entitiesSnapshot = await getDocs(collection(db, 'entities'))
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools`))
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools/${schoolId}/students`))
          
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
      
      // Load battle data once students are loaded
      if (students.length > 0) {
        await loadFamilyBattleData()
      }
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
    }
  }

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

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  const handleAcceptChallenge = (challenge) => {
    console.log('🎯 Challenge accepted:', challenge.title)
    setShowSuccess(`Challenge "${challenge.title}" accepted! Good luck! 🚀`)
    setTimeout(() => setShowSuccess(''), 3000)
  }

  const handleStreakClick = () => {
    setShowStreakModal(true)
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <>
        <Head>
          <title>Family Battle - Lux Libris Parent</title>
          <meta name="description" content="Compete with your children in weekly family reading challenges" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        </Head>
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
            <p style={{ color: luxTheme.textPrimary }}>Loading family battle...</p>
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

  if (error) {
    return (
      <>
        <Head>
          <title>Family Battle - Lux Libris Parent</title>
          <meta name="description" content="Compete with your children in weekly family reading challenges" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        </Head>
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
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris Parent</title>
        <meta name="description" content="Compete with your children in weekly family reading challenges" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px',
        position: 'relative'
      }}>
        
        {/* Family Streak Tracker - Fixed Position */}
        <FamilyStreakTracker
          streakDays={familyStreakData.streakDays}
          theme={luxTheme}
          onStreakClick={handleStreakClick}
        />
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, #FF6B6B40, #4ECDC440)`,
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
              position: 'absolute',
              left: '20px',
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
            ←
          </button>

          {/* Centered Title with Premium Badge */}
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>⚔️</div>
            <h1 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0',
              letterSpacing: '1px',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Family Battle
            </h1>
            <p style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: luxTheme.textSecondary,
              margin: '4px 0 0 0'
            }}>
              Parents vs Kids Reading Challenge
            </p>
            {isPilotPhase && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-16px',
                backgroundColor: '#10B981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                PILOT
              </div>
            )}
          </div>

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

        {/* Main Content - Wrapped in Premium Gate */}
        <PremiumGate 
          feature="familyBattle"
          customMessage={isPilotPhase ? 
            "🏆 Premium Family Battle unlocked for pilot users!" :
            "Compete with your children in weekly reading challenges and motivate each other!"
          }
        >
          {/* Pilot Notice Banner */}
          {isPilotPhase && (
            <div style={{
              background: `linear-gradient(135deg, #10B981, #059669)`,
              borderRadius: '16px',
              padding: '16px',
              margin: '20px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 0 8px 0'
              }}>
                Premium Family Battle Unlocked!
              </h3>
              <p style={{
                fontSize: '12px',
                margin: 0,
                opacity: 0.9
              }}>
                You&apos;re part of our pilot - premium family reading competition is free during the trial!
              </p>
            </div>
          )}

          <div style={{ 
            padding: '20px', 
            maxWidth: '600px', 
            margin: '0 auto',
            paddingTop: '80px' // Extra space for streak tracker
          }}>

            {/* Family Battle Dashboard - Full Feature */}
            {familyBattleData ? (
              <>
                {/* Enhanced Header Card with Battle Visuals */}
                <div style={{
                  background: `linear-gradient(135deg, #FF6B6B, #4ECDC4)`,
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '20px',
                  boxShadow: `0 8px 24px rgba(255, 107, 107, 0.3)`,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {/* Winning crown animation */}
                  {familyBattleData.winner !== 'tied' && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '40px',
                      animation: 'bounce 2s infinite'
                    }}>
                      👑
                    </div>
                  )}

                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚔️</div>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    fontFamily: 'Didot, serif',
                    margin: '0 0 8px 0'
                  }}>
                    Weekly Family Reading Battle
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    margin: '0 0 16px 0',
                    opacity: 0.9,
                    lineHeight: '1.4'
                  }}>
                    Week {familyBattleData.weekNumber} • {new Date(familyBattleData.weekStarting).toLocaleDateString()}
                  </p>

                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    animation: familyBattleData.winner !== 'tied' ? 'pulse 2s infinite' : 'none'
                  }}>
                    {familyBattleData.winner === 'parents' ? '👨‍👩 Parents are leading!' :
                     familyBattleData.winner === 'children' ? '👧👦 Kids are winning!' :
                     '🤝 Perfect tie - great teamwork!'}
                    {familyBattleData.lead > 0 && ` (+${familyBattleData.lead} min)`}
                  </div>
                </div>

                {/* Enhanced Battle Teams with Visual Improvements */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {/* Parents Team */}
                  <div style={{
                    background: familyBattleData.winner === 'parents' 
                      ? `linear-gradient(145deg, #FF6B6B20, #FF6B6B10, #FFFFFF)`
                      : `linear-gradient(145deg, ${luxTheme.surface}, #FF6B6B05, #FFFFFF)`,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    border: familyBattleData.winner === 'parents' ? '3px solid #FF6B6B' : '2px solid #E5E7EB',
                    boxShadow: familyBattleData.winner === 'parents' 
                      ? '0 8px 25px rgba(255, 107, 107, 0.4), 0 0 20px rgba(255, 107, 107, 0.2)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    transform: familyBattleData.winner === 'parents' ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}>
                    {familyBattleData.winner === 'parents' && (
                      <div style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '30px',
                        animation: 'bounce 2s infinite'
                      }}>
                        👑
                      </div>
                    )}
                    
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>👨‍👩</div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      Parents
                    </h3>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#FF6B6B',
                      marginBottom: '4px'
                    }}>
                      {familyBattleData.parentMinutes}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      minutes this week
                    </div>
                    
                    {/* Battle cry */}
                    <div style={{
                      marginTop: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#FF6B6B',
                      fontStyle: 'italic'
                    }}>
                      {familyBattleData.winner === 'parents' ? "Leading by example! 🚀" : "Show them how it's done! ⚡"}
                    </div>
                  </div>
                  
                  {/* Children Team */}
                  <div style={{
                    background: familyBattleData.winner === 'children' 
                      ? `linear-gradient(145deg, #4ECDC420, #4ECDC410, #FFFFFF)`
                      : `linear-gradient(145deg, ${luxTheme.surface}, #4ECDC405, #FFFFFF)`,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    border: familyBattleData.winner === 'children' ? '3px solid #4ECDC4' : '2px solid #E5E7EB',
                    boxShadow: familyBattleData.winner === 'children' 
                      ? '0 8px 25px rgba(78, 205, 196, 0.4), 0 0 20px rgba(78, 205, 196, 0.2)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    transform: familyBattleData.winner === 'children' ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}>
                    {familyBattleData.winner === 'children' && (
                      <div style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '30px',
                        animation: 'bounce 2s infinite'
                      }}>
                        👑
                      </div>
                    )}
                    
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>👧👦</div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      Children
                    </h3>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#4ECDC4',
                      marginBottom: '4px'
                    }}>
                      {familyBattleData.childrenMinutes}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      minutes this week
                    </div>

                    {/* Battle cry */}
                    <div style={{
                      marginTop: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#4ECDC4',
                      fontStyle: 'italic'
                    }}>
                      {familyBattleData.winner === 'children' ? "Kids are on fire! 🔥" : "Beat the parents! 📚"}
                    </div>
                  </div>
                </div>

                {/* Individual Children Breakdown */}
                {familyBattleData.childrenDetails && familyBattleData.childrenDetails.length > 0 && (
                  <div style={{
                    backgroundColor: luxTheme.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 16px 0'
                    }}>
                      👧👦 Individual Progress
                    </h3>
                    
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {familyBattleData.childrenDetails.map((child, index) => (
                        <div key={index} style={{
                          backgroundColor: `#4ECDC410`,
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: luxTheme.textPrimary
                            }}>
                              {child.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: luxTheme.textSecondary
                            }}>
                              Grade {child.grade}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: '#4ECDC4'
                            }}>
                              {child.minutes}
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: luxTheme.textSecondary
                            }}>
                              minutes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Family Total & Motivation */}
                <div style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${luxTheme.primary}30`,
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    📊 Family Reading Total
                  </h3>
                  
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: luxTheme.primary,
                    marginBottom: '8px'
                  }}>
                    {familyBattleData.totalMinutes} minutes
                  </div>
                  
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textSecondary,
                    margin: '0 0 16px 0'
                  }}>
                    Your family read together this week!
                  </p>

                  <div style={{
                    backgroundColor: `${luxTheme.primary}15`,
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    fontWeight: '500',
                    lineHeight: '1.4'
                  }}>
                    {familyBattleData.winner === 'parents' 
                      ? "🏆 Amazing leadership! You're showing your children how valuable reading is!"
                      : familyBattleData.winner === 'children'
                        ? "📚 The kids are motivating you! Time to read more and catch up!"
                        : "🤝 Perfect tie! You're all equally dedicated to reading!"
                    }
                  </div>
                </div>

                {/* Weekly Challenges Section */}
                <div style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{
                    fontSize: 'clamp(16px, 4.5vw, 18px)',
                    fontWeight: 'bold',
                    color: luxTheme.textPrimary,
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🎯 Weekly Family Challenges
                  </h3>
                  
                  {weeklyChallenge.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      theme={luxTheme}
                      onAcceptChallenge={handleAcceptChallenge}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* No Data Yet - Welcome Message */
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.primary}40`
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚⚔️</div>
                
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px'
                }}>
                  Family Battle Ready!
                </h2>
                
                <p style={{
                  fontSize: '16px',
                  color: luxTheme.textSecondary,
                  marginBottom: '24px',
                  lineHeight: '1.5'
                }}>
                  Start reading sessions to see your family&apos;s weekly competition unfold! Both parents and children contribute to their team&apos;s total.
                </p>

                <div style={{
                  backgroundColor: `${luxTheme.primary}15`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    📊 How It Works:
                  </h4>
                  <ul style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary,
                    margin: 0,
                    paddingLeft: '20px',
                    textAlign: 'left',
                    lineHeight: '1.4'
                  }}>
                    <li>Parents compete against children each week</li>
                    <li>All reading minutes count toward your team</li>
                    <li>Competition resets every Monday</li>
                    <li>Motivate each other to read more!</li>
                    <li>Family streak keeps everyone engaged daily</li>
                  </ul>
                </div>

                <button
                  onClick={() => router.push('/parent/healthy-habits')}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  📚 Start Reading Session
                </button>
              </div>
            )}
          </div>

        </PremiumGate>

        {/* Streak Detail Modal */}
        {showStreakModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowStreakModal(false)}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔥</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                marginBottom: '12px'
              }}>
                {familyStreakData.streakDays} Day Family Streak!
              </h2>
              <p style={{
                fontSize: '16px',
                color: luxTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                Your family has been reading together for <strong>{familyStreakData.streakDays} consecutive days</strong>. 
                Keep the fire burning by reading every day!
              </p>
              <div style={{
                backgroundColor: `${luxTheme.accent}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  "Don't Break the Chain!"
                </div>
                <div style={{
                  fontSize: '12px',
                  color: luxTheme.textSecondary
                }}>
                  Every day your family reads together strengthens your streak. 
                  Miss a day and the streak resets to zero!
                </div>
              </div>
              <button
                onClick={() => setShowStreakModal(false)}
                style={{
                  backgroundColor: luxTheme.accent,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Keep Reading! 📚
              </button>
            </div>
          </div>
        )}

        {/* Celebration Animation */}
        <CelebrationAnimation
          milestone={celebrationMilestone}
          isVisible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />

        {/* Success Message */}
        {showSuccess && (
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
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
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
              min-width: 180px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}
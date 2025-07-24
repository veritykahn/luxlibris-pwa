// pages/parent/healthy-habits.js - Integrated with Premium Gate (No Family Battle Unlock Requirements)
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { useTimer } from '../../contexts/TimerContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import PremiumGate from '../../components/PremiumGate'
import Head from 'next/head'
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function ParentHealthyHabits() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const { hasFeature, isPilotPhase } = usePremiumFeatures()
  
  // USE TIMER CONTEXT (same as student page)
  const {
    timerDuration,
    timeRemaining,
    isTimerActive,
    isTimerPaused,
    wakeLock,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateTimerDuration,
    setTimerCompleteCallback,
    getTimerProgress,
    getMinutesRead,
    formatTime
  } = useTimer()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [currentBookTitle, setCurrentBookTitle] = useState('')
  
  // Progress states (same pattern as student)
  const [todaysSessions, setTodaysSessions] = useState([])
  const [todaysMinutes, setTodaysMinutes] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [streakCalendar, setStreakCalendar] = useState([])
  const [parentReadingLevel, setParentReadingLevel] = useState({ 
    name: 'Reading Mentor', 
    emoji: '👩‍🏫', 
    color: '#8B5CF6',
    textColor: '#FFFFFF' 
  })
  const [totalXP, setTotalXP] = useState(0)

  // UI states
  const [showSuccess, setShowSuccess] = useState('')
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [showXPReward, setShowXPReward] = useState(false)
  const [xpReward, setXPReward] = useState({ amount: 0, reason: '', total: 0 })
  const [showNavMenu, setShowNavMenu] = useState(false)

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
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉', current: true },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  // Utility function for local date
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Smart streak calculation (same logic as student)
  const calculateSmartStreak = useCallback((completedSessionsByDate, todayStr) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)

    let streakCount = 0
    let checkDate

    if (completedSessionsByDate[todayStr]) {
      checkDate = new Date(today)
    } else if (completedSessionsByDate[yesterdayStr]) {
      checkDate = new Date(yesterday)
    } else {
      return 0
    }

    while (streakCount < 365) {
      const dateStr = getLocalDateString(checkDate)
      if (completedSessionsByDate[dateStr]) {
        streakCount++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return streakCount
  }, [])

  // Parent reading level calculation
  const calculateParentReadingLevel = useCallback(async (parentId) => {
    try {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const sessionsRef = collection(db, `parents/${parentId}/readingSessions`)
      const recentQuery = query(
        sessionsRef,
        where('date', '>=', getLocalDateString(fourteenDaysAgo))
      )
      const recentSnapshot = await getDocs(recentQuery)
      const dailyMinutes = {}

      recentSnapshot.forEach(docSnap => {
        const session = docSnap.data()
        if (!dailyMinutes[session.date]) {
          dailyMinutes[session.date] = 0
        }
        dailyMinutes[session.date] += session.duration
      })

      // Calculate average for last 7 days
      const lastSevenDays = []
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = getLocalDateString(date)
        lastSevenDays.push(dailyMinutes[dateStr] || 0)
      }

      const averageMinutesPerDay = lastSevenDays.reduce((sum, minutes) => sum + minutes, 0) / 7

      // Parent-specific reading levels
      const levels = {
        reading_mentor: { min: 0, max: 15, name: 'Reading Mentor', emoji: '👩‍🏫', color: '#8B5CF6', textColor: '#FFFFFF' },
        family_champion: { min: 16, max: 30, name: 'Family Champion', emoji: '🏆', color: '#F59E0B', textColor: '#FFFFFF' },
        wisdom_keeper: { min: 31, max: 45, name: 'Wisdom Keeper', emoji: '📚', color: '#10B981', textColor: '#FFFFFF' },
        legendary_leader: { min: 46, max: Infinity, name: 'Legendary Leader', emoji: '👑', color: '#DC2626', textColor: '#FFFFFF' }
      }

      let newLevel = 'reading_mentor'
      if (averageMinutesPerDay >= 46) newLevel = 'legendary_leader'
      else if (averageMinutesPerDay >= 31) newLevel = 'wisdom_keeper'
      else if (averageMinutesPerDay >= 16) newLevel = 'family_champion'

      setParentReadingLevel(levels[newLevel])
    } catch (error) {
      console.error('Error calculating parent reading level:', error)
      setParentReadingLevel({ name: 'Reading Mentor', emoji: '👩‍🏫', color: '#8B5CF6', textColor: '#FFFFFF' })
    }
  }, [])

  // Load streak data (same pattern as student)
  const loadStreakData = useCallback(async (parentId) => {
    try {
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
      const sessionsRef = collection(db, `parents/${parentId}/readingSessions`)
      const recentQuery = query(
        sessionsRef,
        where('date', '>=', getLocalDateString(sixWeeksAgo))
      )
      const recentSnapshot = await getDocs(recentQuery)
      const completedSessionsByDate = {}

      recentSnapshot.forEach(docSnap => {
        const session = docSnap.data()
        if (session.completed === true) {
          completedSessionsByDate[session.date] = true
        }
      })

      const today = new Date()
      const todayStr = getLocalDateString(today)
      const streakCount = calculateSmartStreak(completedSessionsByDate, todayStr)

      // Build timeline calendar
      const timelineCalendar = []
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 14)

      for (let i = 0; i < 21; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        const dateStr = getLocalDateString(date)
        timelineCalendar.push({
          date: dateStr,
          hasReading: !!completedSessionsByDate[dateStr],
          dayName: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()],
          dayNumber: date.getDate(),
          isToday: dateStr === todayStr,
          isFuture: date > today,
          isRecent: Math.abs(date - today) <= 7 * 24 * 60 * 60 * 1000
        })
      }

      setStreakCalendar(timelineCalendar)
      setCurrentStreak(streakCount)
    } catch (error) {
      console.error('Error loading parent streak data:', error)
      setCurrentStreak(0)
    }
  }, [calculateSmartStreak])

  // Load parent reading data
  const loadParentReadingData = useCallback(async () => {
    try {
      const today = getLocalDateString(new Date())
      const sessionsRef = collection(db, `parents/${user.uid}/readingSessions`)
      const todayQuery = query(
        sessionsRef,
        where('date', '==', today)
      )
      const todaySnapshot = await getDocs(todayQuery)
      const sessions = []
      let minutesToday = 0
      let totalXPEver = 0

      // Get all sessions to calculate total XP
      const allSessionsSnapshot = await getDocs(sessionsRef)
      allSessionsSnapshot.forEach(docSnap => {
        const session = docSnap.data()
        totalXPEver += session.xpEarned || session.duration || 0
      })

      // Process today's sessions
      const sessionData = []
      todaySnapshot.forEach(docSnap => {
        const data = docSnap.data()
        sessionData.push({ id: docSnap.id, ...data })
      })

      sessionData.sort((a, b) => {
        const timeA = a.startTime?.toDate?.() || new Date(a.startTime)
        const timeB = b.startTime?.toDate?.() || new Date(b.startTime)
        return timeB - timeA
      })

      sessionData.forEach(session => {
        sessions.push(session)
        if (session.date === today) {
          minutesToday += session.duration
        }
      })

      setTodaysSessions(sessions)
      setTodaysMinutes(minutesToday)
      setTotalXP(totalXPEver)

      await loadStreakData(user.uid)
      await calculateParentReadingLevel(user.uid)
    } catch (error) {
      console.error('Error loading parent reading data:', error)
    }
  }, [user?.uid, loadStreakData, calculateParentReadingLevel])

  // Save reading session (adapted from student pattern)
  const saveReadingSession = useCallback(async (duration, completed) => {
    try {
      if (!user?.uid) return

      const today = getLocalDateString(new Date())
      const sessionXP = duration // 1 XP per minute

      const sessionData = {
        date: today,
        startTime: new Date(),
        duration: duration,
        targetDuration: Math.floor(timerDuration / 60),
        completed: completed,
        bookTitle: currentBookTitle || 'Reading Session',
        xpEarned: sessionXP,
        isWithChildren: false // TODO: Add toggle for this
      }

      const sessionsRef = collection(db, `parents/${user.uid}/readingSessions`)
      const docRef = await addDoc(sessionsRef, sessionData)
      const newSession = { id: docRef.id, ...sessionData }

      setTodaysSessions(prev => [newSession, ...prev])
      setTodaysMinutes(prev => prev + duration)

      const newTotalXP = totalXP + sessionXP
      setTotalXP(newTotalXP)

      // Show XP reward
      setXPReward({
        amount: sessionXP,
        reason: completed ? `${duration} minute session completed!` : `${duration} minutes of reading!`,
        total: newTotalXP
      })
      setShowXPReward(true)
      setTimeout(() => setShowXPReward(false), 4000)

      // Update streaks and level if completed
      if (completed) {
        await loadStreakData(user.uid)
        await calculateParentReadingLevel(user.uid)
      }

      setShowSuccess(completed ? 
        `🎉 Reading session completed! +${sessionXP} XP earned!` : 
        `📖 Progress saved! +${sessionXP} XP earned!`
      )
      setTimeout(() => setShowSuccess(''), 3000)

      // Reload to check stats
      await loadParentReadingData()
    } catch (error) {
      console.error('Error saving parent reading session:', error)
      setShowSuccess('❌ Error saving session. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }, [user?.uid, timerDuration, currentBookTitle, totalXP, loadStreakData, calculateParentReadingLevel, loadParentReadingData])

  // Check authentication and premium access
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      // Check if they have access to healthy habits feature
      if (hasFeature('healthyHabits')) {
        loadInitialData()
      } else {
        setLoading(false) // Don't load data if no access
      }
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile, hasFeature])

  const loadInitialData = async () => {
    try {
      console.log('🏠 Loading parent healthy habits data...')
      
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
      
      // Set default timer duration for parents (25 minutes)
      updateTimerDuration(25)

      await loadParentReadingData()
      
    } catch (error) {
      console.error('❌ Error loading parent healthy habits:', error)
      setError('Failed to load reading data. Please try again.')
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

  // Timer completion handler
  const handleTimerComplete = useCallback(async () => {
    // Notification effects (simplified for parent)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const createTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = frequency
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1)
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration)
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }
      createTone(600, audioContext.currentTime, 0.4)
      createTone(800, audioContext.currentTime + 0.5, 0.4)
    } catch (err) {
      console.log('Audio notification not supported')
    }

    await saveReadingSession(Math.floor(timerDuration / 60), true)
    setShowCompletionCelebration(true)
    setTimeout(() => setShowCompletionCelebration(false), 3000)
  }, [timerDuration, saveReadingSession])

  // Set up timer completion callback
  useEffect(() => {
    setTimerCompleteCallback(handleTimerComplete)
    
    return () => {
      setTimerCompleteCallback(null)
    }
  }, [handleTimerComplete, setTimerCompleteCallback])

  // Timer control handlers
  const handleStartTimer = () => {
    startTimer()
  }

  const handlePauseTimer = () => {
    pauseTimer()
  }

  const handleResumeTimer = () => {
    resumeTimer()
  }

  // Handle banking session
  const handleBankSession = async () => {
    const minutesRead = getMinutesRead()
    
    if (minutesRead < 5) {
      setShowSuccess('⏱️ Read for at least 5 minutes to bank progress')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    resetTimer()
    const isCompleted = minutesRead >= 20
    await saveReadingSession(minutesRead, isCompleted)

    setShowSuccess(isCompleted ?
      `🎉 Session banked! +${minutesRead} XP + streak earned!` :
      `📖 ${minutesRead} minutes banked! +${minutesRead} XP earned`
    )
    setTimeout(() => setShowSuccess(''), 4000)
  }

  // Get timer status display
  const getTimerStatus = () => {
    if (!isTimerActive) return 'READY TO READ'
    if (isTimerPaused) return 'PAUSED'
    return 'READING'
  }

  const getSvgSize = () => {
    if (typeof window !== 'undefined') {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
      return Math.min(200, vw * 0.7)
    }
    return 200
  }

  const svgSize = getSvgSize()

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
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
          <p style={{ color: luxTheme.textPrimary }}>Loading your reading habits...</p>
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
        <title>Reading Habits - Lux Libris Parent</title>
        <meta name="description" content="Build healthy reading habits and lead by example for your children" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px'
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
            <h1 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: '400',
              color: luxTheme.textPrimary,
              margin: '0',
              letterSpacing: '1px',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Reading Habits
            </h1>
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
          feature="healthyHabits"
          customMessage={isPilotPhase ? 
            "🎉 Premium reading habits feature unlocked for pilot users!" :
            "Track your personal reading habits and lead by example for your children!"
          }
        >
          <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>

            {/* Pilot Notice Banner */}
            {isPilotPhase && (
              <div style={{
                background: `linear-gradient(135deg, #10B981, #059669)`,
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  Premium Features Unlocked!
                </h3>
                <p style={{
                  fontSize: '12px',
                  margin: 0,
                  opacity: 0.9
                }}>
                  You&apos;re part of our pilot program - premium reading habits tracking is free during the trial!
                </p>
              </div>
            )}

            {/* Parent Motivation Card */}
            <div style={{
              background: `linear-gradient(135deg, ${luxTheme.secondary}, ${luxTheme.primary})`,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: `0 8px 24px ${luxTheme.primary}30`,
              color: luxTheme.textPrimary,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚👨‍👩‍👧‍👦</div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'Didot, serif',
                margin: '0 0 8px 0'
              }}>
                Lead by Example
              </h2>
              <p style={{
                fontSize: '14px',
                margin: 0,
                opacity: 0.9,
                lineHeight: '1.4'
              }}>
                Children who see parents reading are 6x more likely to become lifelong readers themselves!
              </p>
            </div>

            {/* Current Book Input */}
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`
            }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                📖 What are you reading?
              </label>
              <input
                type="text"
                value={currentBookTitle}
                onChange={(e) => setCurrentBookTitle(e.target.value)}
                placeholder="Enter book title (optional)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${luxTheme.primary}40`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: luxTheme.background,
                  color: luxTheme.textPrimary,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Timer Section */}
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '30px 20px',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              {/* Circular Timer */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <svg
                  width={svgSize}
                  height={svgSize}
                  viewBox="0 0 200 200"
                  style={{ transform: 'rotate(-90deg)', maxWidth: '200px', maxHeight: '200px' }}
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={`${luxTheme.primary}30`}
                    strokeWidth="8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={luxTheme.primary}
                    strokeWidth="8"
                    strokeDasharray={`${(getTimerProgress() / 100) * (2 * Math.PI * 85)} ${2 * Math.PI * 85}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(28px, 8vw, 36px)',
                    fontWeight: 'bold',
                    color: luxTheme.textPrimary,
                    fontFamily: 'system-ui, monospace',
                    marginBottom: '4px'
                  }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    color: luxTheme.textSecondary,
                    fontWeight: '500'
                  }}>
                    {getTimerStatus()}
                  </div>
                  {wakeLock && (
                    <div style={{
                      fontSize: 'clamp(8px, 2.5vw, 10px)',
                      color: luxTheme.primary,
                      fontWeight: '600',
                      marginTop: '2px'
                    }}>
                      📱 Screen staying on
                    </div>
                  )}
                </div>
              </div>

              {/* Timer Controls */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                {!isTimerActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handleStartTimer}
                      style={{
                        backgroundColor: luxTheme.primary,
                        color: luxTheme.textPrimary,
                        border: 'none',
                        borderRadius: '20px',
                        padding: '14px 28px',
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minHeight: '48px',
                        minWidth: '140px',
                        justifyContent: 'center'
                      }}
                    >
                      ▶️ Start Reading
                    </button>
                    <p style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary,
                      margin: 0,
                      textAlign: 'center'
                    }}>
                      Default: 25 minutes (perfect for busy parents!)
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={isTimerPaused ? handleResumeTimer : handlePauseTimer}
                      style={{
                        backgroundColor: luxTheme.secondary,
                        color: luxTheme.textPrimary,
                        border: 'none',
                        borderRadius: '16px',
                        padding: '12px 20px',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '48px',
                        minWidth: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isTimerPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                    {isTimerPaused && (
                      <button
                        onClick={handleBankSession}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '12px 20px',
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minHeight: '48px',
                          minWidth: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                        }}
                      >
                        💾 Bank Session
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Today's Progress */}
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
                📈 Your Reading Progress
              </h3>

              {/* Parent Reading Level */}
              <div style={{
                backgroundColor: parentReadingLevel.color,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {parentReadingLevel.emoji}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: parentReadingLevel.textColor,
                  marginBottom: '4px'
                }}>
                  {parentReadingLevel.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: parentReadingLevel.textColor,
                  opacity: 0.9
                }}>
                  {parentReadingLevel.name === 'Legendary Leader' && 'Your reading leadership inspires the whole family!'}
                  {parentReadingLevel.name === 'Wisdom Keeper' && 'You are building a treasure trove of knowledge!'}
                  {parentReadingLevel.name === 'Family Champion' && 'You are setting an amazing example!'}
                  {parentReadingLevel.name === 'Reading Mentor' && 'Every page you read teaches your children!'}
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: `${luxTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: luxTheme.textPrimary
                  }}>
                    {todaysMinutes}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: luxTheme.textSecondary
                  }}>
                    min today
                  </div>
                </div>
                <div style={{
                  backgroundColor: `${luxTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: luxTheme.textPrimary
                  }}>
                    {currentStreak}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: luxTheme.textSecondary
                  }}>
                    day streak
                  </div>
                </div>
                <div style={{
                  backgroundColor: `${luxTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: luxTheme.textPrimary
                  }}>
                    {totalXP}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: luxTheme.textSecondary
                  }}>
                    total XP
                  </div>
                </div>
              </div>
            </div>

            {/* Family Battle Card - Premium Gated */}
            <PremiumGate 
              feature="familyBattle"
              fallback={
                <div 
                  onClick={() => {
                    setShowSuccess('🔒 Family Battle requires premium access!')
                    setTimeout(() => setShowSuccess(''), 3000)
                  }}
                  style={{
                    backgroundColor: luxTheme.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `2px solid ${luxTheme.primary}40`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: 0.7
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 8px 0'
                    }}>
                      Family Battle (Premium Feature)
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: luxTheme.textSecondary,
                      margin: 0
                    }}>
                      Upgrade to compete with your family in reading challenges!
                    </p>
                  </div>
                </div>
              }
            >
              <div 
                onClick={() => router.push('/parent/family-battle')}
                style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${luxTheme.primary}40`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Premium badge for family battle */}
                {isPilotPhase && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    zIndex: 100
                  }}>
                    PREMIUM
                  </div>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    Family Reading Battle
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textSecondary,
                    margin: '0 0 12px 0',
                    lineHeight: '1.4'
                  }}>
                    See how your family competes in weekly reading challenges and motivate each other!
                  </p>
                  <div style={{
                    backgroundColor: `${luxTheme.primary}20`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'inline-block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: luxTheme.primary
                  }}>
                    Tap to view battle dashboard →
                  </div>
                </div>
              </div>
            </PremiumGate>

            {/* Reading Tips for Parents */}
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
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 Reading Tips for Parents
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  backgroundColor: `${luxTheme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  borderLeft: `4px solid ${luxTheme.primary}`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '4px'
                  }}>
                    📚 Read Where Kids Can See You
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary,
                    lineHeight: '1.4'
                  }}>
                    Children model what they observe. Reading openly shows them it&apos;s valuable and enjoyable.
                  </div>
                </div>

                <div style={{
                  backgroundColor: `${luxTheme.secondary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  borderLeft: `4px solid ${luxTheme.secondary}`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '4px'
                  }}>
                    👨‍👩‍👧‍👦 Share What You&apos;re Reading
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary,
                    lineHeight: '1.4'
                  }}>
                    Talk about your books at dinner. Ask about theirs. Create a family book culture.
                  </div>
                </div>

                <div style={{
                  backgroundColor: `${luxTheme.accent}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  borderLeft: `4px solid ${luxTheme.accent}`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '4px'
                  }}>
                    ⏰ Establish Reading Time
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary,
                    lineHeight: '1.4'
                  }}>
                    Even 15-20 minutes of parent reading time creates powerful modeling for children.
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Calendar */}
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
                🔥 Your Reading Streak
              </h3>

              {/* Timeline Calendar */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                padding: '8px 4px',
                marginBottom: '12px',
                scrollSnapType: 'x mandatory'
              }}>
                {streakCalendar.map((day, index) => (
                  <div
                    key={index}
                    style={{
                      minWidth: '32px',
                      height: '48px',
                      borderRadius: '10px',
                      backgroundColor: day.isFuture ?
                        `${luxTheme.primary}10` :
                        day.hasReading ? luxTheme.primary : `${luxTheme.primary}20`,
                      border: day.isToday ? `3px solid ${luxTheme.primary}` :
                        day.isRecent ? `1px solid ${luxTheme.primary}60` : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      opacity: day.isFuture ? 0.4 : 1,
                      transform: day.isToday ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                      scrollSnapAlign: 'center',
                      boxShadow: day.isToday ? `0 4px 12px ${luxTheme.primary}40` : 'none'
                    }}
                  >
                    <div style={{
                      fontSize: '8px',
                      fontWeight: '600',
                      color: day.hasReading && !day.isFuture ? 'white' : luxTheme.textSecondary
                    }}>
                      {day.dayName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: day.hasReading && !day.isFuture ? 'white' : luxTheme.textPrimary
                    }}>
                      {day.dayNumber}
                    </div>
                    {day.hasReading && (
                      <div style={{
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        backgroundColor: 'white'
                      }} />
                    )}
                  </div>
                ))}
              </div>

              <p style={{
                fontSize: '13px',
                color: luxTheme.textSecondary,
                textAlign: 'center',
                margin: 0,
                fontWeight: '500'
              }}>
                {currentStreak >= 7 
                  ? `🏆 ${currentStreak} days strong! You're showing incredible leadership!` 
                  : currentStreak >= 1 
                    ? `💪 Great start! ${currentStreak} day${currentStreak > 1 ? 's' : ''} of modeling good habits!`
                    : "Start your reading journey to inspire your children!"
                }
              </p>
            </div>
          </div>
        </PremiumGate>

        {/* XP Reward Popup */}
        {showXPReward && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: luxTheme.surface,
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1001,
            textAlign: 'center',
            border: `3px solid ${luxTheme.primary}`,
            minWidth: '280px',
            maxWidth: '90vw'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              ⚡
            </div>
            
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: luxTheme.primary,
              marginBottom: '8px'
            }}>
              +{xpReward.amount} XP!
            </div>
            
            <div style={{
              fontSize: '14px',
              color: luxTheme.textPrimary,
              marginBottom: '8px'
            }}>
              {xpReward.reason}
            </div>
            
            <div style={{
              fontSize: '12px',
              color: luxTheme.textSecondary,
              marginBottom: '16px'
            }}>
              Total XP: {xpReward.total}
            </div>
            
            <button
              onClick={() => setShowXPReward(false)}
              style={{
                backgroundColor: luxTheme.primary,
                color: luxTheme.textPrimary,
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Great! 🎯
            </button>
          </div>
        )}

        {/* Completion Celebration */}
        {showCompletionCelebration && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '320px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                margin: '0 0 8px 0'
              }}>
                Reading Session Complete!
              </h2>
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                margin: 0,
                lineHeight: '1.4'
              }}>
                Excellent work leading by example! Your children are learning from your dedication.
              </p>
            </div>
          </div>
        )}

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
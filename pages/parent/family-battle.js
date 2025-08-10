// pages/parent/family-battle.js - FIXED VERSION with localStorage for Sunday Results Modal
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import PremiumGate from '../../components/PremiumGate'
import ParentFamilyBattleManager from '../../components/ParentFamilyBattleManager'
import FamilyBattleVictoryModal from '../../components/FamilyBattleVictoryModal'
import FamilyBattleResultsModal from '../../components/FamilyBattleResultsModal'
import { getParentVictories } from '../../lib/family-battle-updates'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, query, where, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { 
  calculateFamilyBattleData,
  getFamilyBattleStats
} from '../../lib/family-battle-system'

// Sunday Results Button Component
function SundayResultsButton({ onClick, winner, margin }) {
  const getResultText = () => {
    if (winner === 'children') {
      return `Kids Won +${margin}`;
    } else if (winner === 'parents') {
      return `Parents Won +${margin}`;
    } else {
      return 'Tie Battle';
    }
  };

  const getResultEmoji = () => {
    if (winner === 'children') return '😭';
    if (winner === 'parents') return '🏆';
    return '🤝';
  };

  return (
    <div 
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#FFD700',
        borderRadius: '50px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(255, 215, 0, 0.5)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: 'pulse 2s infinite',
        zIndex: 200,
        border: '2px solid #FFC700'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.7)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.5)'
      }}
    >
      <span style={{ 
        fontSize: '20px',
        animation: 'bounce 1s infinite'
      }}>
        {getResultEmoji()}
      </span>
      <div style={{ color: '#000000' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          RESULTS
        </div>
        <div style={{
          fontSize: '10px',
          opacity: 0.8,
          lineHeight: '1'
        }}>
          {getResultText()}
        </div>
      </div>
    </div>
  )
}

// Regular Streak Tracker Component (Mon-Sat)
function FamilyStreakTracker({ streakDays, theme, onStreakClick, currentStreak }) {
  const getStreakColor = (days) => {
    if (days >= 30) return '#FF4444'
    if (days >= 14) return '#FF6B35'
    if (days >= 7) return '#FFA500'
    if (days >= 3) return '#FFD700'
    return '#87CEEB'
  }

  const getStreakEmoji = (days) => {
    if (days >= 30) return '🔥'
    if (days >= 14) return '🔥'
    if (days >= 7) return '🔥'
    if (days >= 3) return '⚔️'
    return '⚔️'
  }

  const getStreakMessage = (days) => {
    if (days >= 100) return "LEGENDARY WARRIOR!"
    if (days >= 30) return "Battle Master!"
    if (days >= 14) return "Battle Veteran!"
    if (days >= 7) return "Week Warrior!"
    if (days >= 3) return "In the Fight!"
    if (days >= 1) return "Battle On!"
    return "Join Battle!"
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
      
      {currentStreak?.team && currentStreak.weeks >= 2 && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          backgroundColor: '#FFD700',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          animation: 'bounce 1s infinite'
        }}>
          👑
        </div>
      )}
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
  const [familyStats, setFamilyStats] = useState(null)
  const [parentStreakDays, setParentStreakDays] = useState(0)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [parentVictories, setParentVictories] = useState([])
  
  // FIXED: Use localStorage to persist which week's results have been shown
  const [sundayBattleData, setSundayBattleData] = useState(null)
  
  // Add loading flag to prevent concurrent loads
  const isLoadingBattleData = useRef(false)
  const hasLoadedInitialData = useRef(false)

  // Check if it's Sunday
  const isSunday = new Date().getDay() === 0;

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️', current: true },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

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
  }, [Math.floor(new Date().getHours() / 6)])

  // Lux Libris Classic Theme with time-based adjustments
  const luxTheme = useMemo(() => ({
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A',
    timeOverlay: timeTheme.overlay
  }), [timeTheme])

  // Utility function for local date
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Smart streak calculation (same as healthy habits)
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

  // Load parent's reading streak
  const loadParentStreak = useCallback(async () => {
    if (!user?.uid) return
    
    try {
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
      const sessionsRef = collection(db, `parents/${user.uid}/readingSessions`)
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

      const todayStr = getLocalDateString(new Date())
      const streakCount = calculateSmartStreak(completedSessionsByDate, todayStr)
      
      setParentStreakDays(streakCount)
      console.log('📊 Parent battle streak loaded:', streakCount, 'days')
    } catch (error) {
      console.error('Error loading parent streak:', error)
      setParentStreakDays(0)
    }
  }, [user?.uid, calculateSmartStreak])

  // Helper function to load linked students data
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
      
      return students
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
      return []
    }
  }

  // Load family battle data - UPDATED VERSION
  const loadFamilyBattleData = useCallback(async () => {
    if (!user?.uid || !linkedStudents.length || !parentData?.familyId) return;
    if (isLoadingBattleData.current) return;
    
    isLoadingBattleData.current = true;
    
    try {
      // Get current battle data using family ID
      const battleData = await calculateFamilyBattleData(parentData.familyId, linkedStudents);
      
      // FIXED: On Sunday, check if we have stored completed week data
      if (isSunday) {
        // Try to get the stored completed week data from Firebase
        const familyRef = doc(db, 'families', parentData.familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          const lastCompletedWeek = familyData.familyBattleSettings?.lastCompletedWeek;
          
          // Use the completed week data if available and has actual data
          if (lastCompletedWeek && (lastCompletedWeek.parentMinutes > 0 || lastCompletedWeek.childrenMinutes > 0)) {
            console.log('📊 Using stored Sunday Results Data:', lastCompletedWeek);
            setSundayBattleData(lastCompletedWeek);
            setFamilyBattleData(null); // Clear regular battle data on Sunday
          } else if (battleData && (battleData.parentMinutes > 0 || battleData.childrenMinutes > 0)) {
            // Use calculated data if it has values
            console.log('📊 Using calculated Sunday Results Data:', battleData);
            setSundayBattleData(battleData);
            setFamilyBattleData(null);
          } else {
            // No data for Sunday - show empty state
            console.log('📊 No battle data for Sunday');
            setSundayBattleData(battleData);
            setFamilyBattleData(null);
          }
        }
      } else {
        // Not Sunday - set as regular battle data
        setFamilyBattleData(battleData);
        setSundayBattleData(null);
      }
      
      // Get family statistics
      const stats = await getFamilyBattleStats(parentData.familyId);
      setFamilyStats(stats);
      
    } catch (error) {
      console.error('❌ Error loading family battle data:', error);
    } finally {
      isLoadingBattleData.current = false;
    }
  }, [user?.uid, linkedStudents.length, parentData?.familyId, isSunday])

  // Load parent victories for the victory modal
  const loadParentVictories = useCallback(async () => {
    if (!parentData?.familyId) return;
    
    try {
      const victories = await getParentVictories(parentData.familyId);
      setParentVictories(victories);
    } catch (error) {
      console.error('Error loading parent victories:', error);
    }
  }, [parentData?.familyId])

  // Load initial data - only once
  const loadInitialData = useCallback(async () => {
    if (hasLoadedInitialData.current) return; // Prevent multiple loads
    hasLoadedInitialData.current = true;
    
    try {
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)
      
      // Load linked students
      const students = await loadLinkedStudentsData(parentProfile.linkedStudents || [])
      setLinkedStudents(students)
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error)
      setError('Failed to load family battle data. Please try again.')
    }
    
    setLoading(false)
  }, [user?.uid])

  // Load family battle data when students are loaded
  useEffect(() => {
    if (linkedStudents.length > 0 && parentData?.familyBattleSettings?.enabled && parentData?.familyId) {
      loadFamilyBattleData();
    }
  }, [linkedStudents.length, parentData?.familyBattleSettings?.enabled, parentData?.familyId, loadFamilyBattleData])

  // Load parent victories when family data is loaded
  useEffect(() => {
    if (parentData?.familyId && familyStats) {
      loadParentVictories();
    }
  }, [parentData?.familyId, familyStats, loadParentVictories])

  // Load parent's reading streak when component mounts
  useEffect(() => {
    if (user?.uid && !authLoading) {
      loadParentStreak()
    }
  }, [user?.uid, authLoading, loadParentStreak])

  // FIXED: Auto-show results modal on Sunday - only once per week using localStorage
  useEffect(() => {
    // Only show if:
    // 1. It's Sunday
    // 2. We have Sunday battle data with a winner
    // 3. We haven't shown it for this week yet (check localStorage)
    if (isSunday && 
        sundayBattleData && 
        sundayBattleData.winner && 
        sundayBattleData.winner !== 'ongoing' &&
        sundayBattleData.weekNumber) {
      
      // Check localStorage for shown week
      const localStorageKey = `familyBattleResultsShown_parent_${user?.uid}`;
      const shownWeek = localStorage.getItem(localStorageKey);
      const currentWeek = sundayBattleData.weekNumber.toString();
      
      if (shownWeek !== currentWeek) {
        console.log('📊 Auto-showing results modal for week:', currentWeek);
        setShowResultsModal(true);
        // Store in localStorage that we've shown this week's results
        localStorage.setItem(localStorageKey, currentWeek);
      } else {
        console.log('📊 Results already shown for week:', currentWeek);
      }
    }
  }, [isSunday, sundayBattleData, user?.uid])

  // Load initial data with premium check
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadInitialData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user?.uid, userProfile?.accountType, router, loadInitialData])

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

  const handleStreakClick = () => {
    setShowStreakModal(true)
  }

  const handleResultsClick = () => {
    setShowResultsModal(true)
  }

  const handleDataUpdate = () => {
    // Reload all data when family battle manager updates something
    loadFamilyBattleData();
    loadParentStreak(); // Also refresh the parent's streak
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <>
        <Head>
          <title>Family Battle - Lux Libris Parent</title>
          <meta name="description" content="Compete with your children in weekly family reading battles" />
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
          <meta name="description" content="Compete with your children in weekly family reading battles" />
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

  // Determine which battle data to show
  const displayBattleData = isSunday ? sundayBattleData : familyBattleData;

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris Parent</title>
        <meta name="description" content="Compete with your children in weekly family reading battles" />
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
        
        {/* FIXED: Show Results button on Sunday, Streak tracker on other days */}
        {isSunday && sundayBattleData ? (
          <SundayResultsButton
            onClick={handleResultsClick}
            winner={sundayBattleData.winner}
            margin={sundayBattleData.margin}
          />
        ) : (
          <FamilyStreakTracker
            streakDays={parentStreakDays}
            theme={luxTheme}
            onStreakClick={handleStreakClick}
            currentStreak={familyStats?.currentStreak}
          />
        )}
        
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

          {/* Centered Title */}
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
              {isSunday ? '✨ Sunday Day of Rest ✨' : 'WWE for Reading Champions'}
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

        {/* Main Content - Family Battle Manager */}
        <PremiumGate 
          feature="familyBattle"
          customMessage={isPilotPhase ? 
            "🏆 Premium Family Battle unlocked for pilot users!" :
            "Compete with your children in weekly reading battles!"
          }
        >
          <div style={{ 
            padding: '20px', 
            maxWidth: '600px', 
            margin: '0 auto',
            paddingTop: '80px' // Extra space for streak tracker
          }}>

            {/* Success Message */}
            {showSuccess && (
              <div style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {showSuccess}
              </div>
            )}

            {/* Sunday Message */}
            {isSunday && (
              <div style={{
                backgroundColor: '#FFD70020',
                border: '2px solid #FFD700',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  🙏 Sunday Day of Rest 🙏
                </div>
                <div style={{
                  fontSize: '14px',
                  color: luxTheme.textSecondary
                }}>
                  Reflect on this week&apos;s reading journey. The battle resumes tomorrow!
                </div>
              </div>
            )}

            {/* Main Family Battle Manager Component - Pass Sunday data on Sunday */}
            <ParentFamilyBattleManager
              theme={luxTheme}
              parentData={parentData}
              linkedStudents={linkedStudents}
              onUpdate={handleDataUpdate}
              battleData={displayBattleData} // Pass the appropriate battle data
              isSunday={isSunday}
            />
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
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚔️</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                marginBottom: '12px'
              }}>
                {parentStreakDays} Day Battle Streak!
              </h2>
              <p style={{
                fontSize: '16px',
                color: luxTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                You&apos;ve been fighting in the family reading battle for <strong>{parentStreakDays} consecutive days</strong>! 
                Every day you read, you&apos;re contributing to your team&apos;s victory and setting an amazing example!
              </p>
              
              {/* Championship Status */}
              {familyStats?.currentStreak?.team && (
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
                    👑 {familyStats.currentStreak.team === 'children' ? 'Kids' : 'Parents'} are the reigning champions!
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary
                  }}>
                    {familyStats.currentStreak.weeks} week winning streak in family battles
                  </div>
                </div>
              )}
              
              {/* Motivational message based on streak length */}
              {parentStreakDays >= 30 && (
                <div style={{
                  backgroundColor: '#FF444420',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏆</div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary
                  }}>
                    BATTLE MASTER STATUS!
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary
                  }}>
                    Your dedication is legendary! Keep leading the charge!
                  </div>
                </div>
              )}
              
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
                Continue the Battle! 🔥
              </button>
            </div>
          </div>
        )}

        {/* Victory Modal */}
        <FamilyBattleVictoryModal
          show={showVictoryModal}
          onClose={() => setShowVictoryModal(false)}
          victories={parentVictories}
          theme={luxTheme}
        />

        {/* FIXED: Family Battle Results Modal - use Sunday data on Sunday */}
        <FamilyBattleResultsModal
          show={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            // Also update localStorage when manually closed
            if (sundayBattleData?.weekNumber) {
              const localStorageKey = `familyBattleResultsShown_parent_${user?.uid}`;
              localStorage.setItem(localStorageKey, sundayBattleData.weekNumber.toString());
            }
            // If parents won, optionally show victory archive
            if (sundayBattleData?.winner === 'parents') {
              setTimeout(() => setShowVictoryModal(true), 500);
            }
          }}
          battleData={sundayBattleData || displayBattleData} // Use Sunday data if available
          isStudent={false}
          currentUserId={user?.uid}
          theme={luxTheme}
        />

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
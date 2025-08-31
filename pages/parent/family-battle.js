// pages/parent/family-battle.js - COMPLETE FIXED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import PremiumGate from '../../components/PremiumGate'
import FamilyBattleDisplay from '../../components/FamilyBattleDisplay'
import FamilyBattleVictoryModal from '../../components/FamilyBattleVictoryModal'
import FamilyBattleResultsModal from '../../components/FamilyBattleResultsModal'
import JaneAustenHelper from '../../components/JaneAustenHelper'
import Head from 'next/head'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Import from master file only
import { 
  syncFamilyBattle,
  getBattleData,
  initializeFamilyBattle,
  enableFamilyBattleForStudents,
  getParentVictories
} from '../../lib/family-battle-master'

// Helper to load linked students data
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
    console.error('Error loading linked students:', error)
    return []
  }
}

export default function ParentFamilyBattle() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const { hasFeature, isPilotPhase, loading: premiumLoading } = usePremiumFeatures()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [battleData, setBattleData] = useState(null)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showJaneAusten, setShowJaneAusten] = useState(true)
  const [parentVictories, setParentVictories] = useState([])

  // Track current hour for theme updates
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  // Update hour every minute to ensure theme changes
  useEffect(() => {
    const checkTimeUpdate = () => {
      const newHour = new Date().getHours()
      if (newHour !== currentHour) {
        setCurrentHour(newHour)
      }
    }

    // Check immediately
    checkTimeUpdate()

    // Then check every minute
    const interval = setInterval(checkTimeUpdate, 60000)

    return () => clearInterval(interval)
  }, [currentHour])

  // Get time-based theme with smoother transitions
  const timeTheme = useMemo(() => {
    const hour = currentHour;
    if (hour >= 5 && hour < 12) {
      return {
        name: 'morning',
        gradient: 'linear-gradient(135deg, #F5C99B, #F0B88A, #EBAD7A)',
        backgroundGradient: 'linear-gradient(to bottom, #FDF4E7, #FAE8D4, #F5DCC1)',
        overlay: 'rgba(245, 201, 155, 0.1)',
        glow: '#F5C99B',
        emoji: '🌅',
        greeting: 'Good Morning Champion!'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        name: 'afternoon',
        gradient: 'linear-gradient(135deg, #6BB6E3, #7AC5EA, #89D0EE)',
        backgroundGradient: 'linear-gradient(to bottom, #E8F4FD, #D1E9FB, #B8DDF8)',
        overlay: 'rgba(107, 182, 227, 0.1)',
        glow: '#6BB6E3',
        emoji: '☀️',
        greeting: 'Afternoon Battle Time!'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #FFB347, #FF8C42, #FF6B35)',
        backgroundGradient: 'linear-gradient(to bottom, #FFF0E6, #FFE4D1, #FFD7BC)',
        overlay: 'rgba(255, 140, 66, 0.1)',
        glow: '#FF8C42',
        emoji: '🌅',
        greeting: 'Evening Reading Battle!'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #4B0082, #6A0DAD, #7B68EE)',
        backgroundGradient: 'linear-gradient(to bottom, #2D1B4E, #3D2B5E, #4D3B6E)',
        overlay: 'rgba(75, 0, 130, 0.1)',
        glow: '#7B68EE',
        emoji: '🌙',
        greeting: 'Nighttime Champions!'
      };
    }
  }, [currentHour]);

  // Enhanced theme with time-based elements
  const theme = useMemo(() => {
    const isNight = timeTheme.name === 'night';
    return {
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: timeTheme.backgroundGradient,
      surface: isNight ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
      textPrimary: isNight ? '#1F2937' : '#223848',
      textSecondary: isNight ? '#374151' : '#556B7A',
      timeOverlay: timeTheme.overlay,
      timeGlow: timeTheme.glow,
      headerGradient: timeTheme.gradient
    }
  }, [timeTheme]);

  // Check if it's Sunday
  const isSunday = new Date().getDay() === 0

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

  // Load battle data
  const loadBattleData = useCallback(async () => {
    if (!parentData?.familyId || !linkedStudents.length) return
    
    try {
      // Sync and get battle data
      await syncFamilyBattle(parentData.familyId, linkedStudents)
      const data = await getBattleData(parentData.familyId)
      setBattleData(data)
      
      // Load parent victories if they have wins
      if (data?.history?.parentWins > 0) {
        const victories = await getParentVictories(parentData.familyId)
        setParentVictories(victories)
      }
    } catch (error) {
      console.error('Error loading battle data:', error)
      setError('Failed to load battle data')
    }
  }, [parentData?.familyId, linkedStudents])

  // Initialize family battle
const handleInitializeBattle = async () => {
  // NEW: Wait for premium status to load completely
  if (premiumLoading) {
    alert('Please wait for premium features to load...')
    return
  }
  
  if (!hasFeature('familyBattle')) {
    alert('Family Battle requires premium features!')
    return
  }
  
  if (!parentData?.familyId) {
    alert('No family ID found. Please ensure your family is set up correctly.')
    return
  }
  
  try {
    setLoading(true)
    
    // Initialize battle
    await initializeFamilyBattle(parentData.familyId, user.uid)
    
    // Enable for all linked students
    if (linkedStudents.length > 0) {
      await enableFamilyBattleForStudents(parentData.familyId, linkedStudents)
    }
    
    setShowSuccess('🏆 Family Battle arena opened! Let the games begin! ⚔️')
    setTimeout(() => setShowSuccess(''), 4000)
    
    await loadBattleData()
  } catch (error) {
    console.error('Error initializing family battle:', error)
    alert('Error setting up Family Battle. Please try again.')
  } finally {
    setLoading(false)
  }
}

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.uid) return
      
      try {
        // Load parent profile
        const parentRef = doc(db, 'parents', user.uid)
        const parentDoc = await getDoc(parentRef)
        
        if (!parentDoc.exists()) {
          router.push('/parent/dashboard')
          return
        }

        const data = parentDoc.data()
        setParentData(data)
        
        // Load linked students
        if (data.linkedStudents?.length > 0) {
          const students = await loadLinkedStudentsData(data.linkedStudents)
          setLinkedStudents(students)
        }
        
        // Check if battle is enabled
        if (data.familyId) {
          const familyRef = doc(db, 'families', data.familyId)
          const familyDoc = await getDoc(familyRef)
          
          if (familyDoc.exists() && familyDoc.data().familyBattle?.enabled) {
            // Battle data will be loaded by the effect below
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setError('Failed to load family data')
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadInitialData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user?.uid, userProfile?.accountType, router])

  // Load battle data when students are loaded
  useEffect(() => {
    if (parentData?.familyId && linkedStudents.length > 0) {
      loadBattleData()
    }
  }, [parentData?.familyId, linkedStudents.length, loadBattleData])

  // Auto-show results modal on Sunday
  useEffect(() => {
    if (isSunday && battleData?.isResultsDay && battleData?.winner && battleData?.number) {
      const localStorageKey = `familyBattleResultsShown_parent_${user?.uid}_week_${battleData.number}`
      const hasSeenResults = localStorage.getItem(localStorageKey) === 'true'
      
      if (!hasSeenResults) {
        setShowResultsModal(true)
        localStorage.setItem(localStorageKey, 'true')
      }
    }
  }, [isSunday, battleData, user?.uid])

  // Auto-refresh every 30 seconds (except Sunday)
  useEffect(() => {
    if (!isSunday && battleData?.enabled && parentData?.familyId && linkedStudents.length > 0) {
      const interval = setInterval(() => {
        loadBattleData()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isSunday, battleData?.enabled, parentData?.familyId, linkedStudents.length, loadBattleData])

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNavMenu])

  if (authLoading || loading) {
    return (
      <div style={{
        background: theme.background,
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
          background: theme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.primary}30`,
            borderTop: `3px solid ${theme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: theme.textPrimary }}>Loading family battle...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris Parent</title>
        <meta name="description" content="Compete with your children in weekly family reading battles" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        background: theme.background,
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
          background: theme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Header with time-based gradient */}
        <div style={{
          background: theme.headerGradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          borderRadius: '0 0 25px 25px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 40px ${theme.timeGlow}30`,
          position: 'relative',
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
              color: timeTheme.name === 'night' || timeTheme.name === 'evening' ? 'white' : theme.textPrimary,
              backdropFilter: 'blur(10px)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          {/* Title with Time-Based Greeting */}
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '4px',
              filter: `drop-shadow(0 0 10px ${theme.timeGlow}50)`
            }}>
              {timeTheme.emoji} ⚔️
            </div>
            <h1 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: '600',
              color: timeTheme.name === 'night' || timeTheme.name === 'evening' ? 'white' : theme.textPrimary,
              margin: '0',
              fontFamily: 'Didot, "Times New Roman", serif',
              letterSpacing: '1px'
            }}>
              Family Battle
            </h1>
            <p style={{
              fontSize: '14px',
              color: timeTheme.name === 'night' || timeTheme.name === 'evening' ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
              margin: '4px 0 0 0'
            }}>
              {isSunday ? '✨ Sunday Day of Rest ✨' : timeTheme.greeting}
            </p>
            {isPilotPhase && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-40px',
                backgroundColor: '#10B981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '600',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
              }}>
                PILOT
              </div>
            )}
          </div>

          {/* Menu */}
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
                color: timeTheme.name === 'night' || timeTheme.name === 'evening' ? 'white' : theme.textPrimary,
                backdropFilter: 'blur(10px)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: theme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${theme.primary}60`,
                overflow: 'hidden',
                zIndex: 1000
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowNavMenu(false)
                      if (!item.current) router.push(item.path)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${theme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${theme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: theme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${theme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && <span style={{ marginLeft: 'auto', color: theme.primary }}>●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
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
            position: 'relative',
            zIndex: 10
          }}>
            
            {/* Time-Based Battle Announcement */}
            {!isSunday && battleData?.enabled && (
              <div style={{
                background: `linear-gradient(135deg, ${theme.timeGlow}30, ${theme.timeGlow}10)`,
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                border: `2px solid ${theme.timeGlow}60`,
                textAlign: 'center',
                boxShadow: `0 4px 16px ${theme.timeGlow}20`
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {timeTheme.emoji} {timeTheme.greeting}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.textSecondary
                }}>
                  {timeTheme.name === 'morning' && 'Start the day strong! Every morning minute counts double in spirit!'}
                  {timeTheme.name === 'afternoon' && 'Peak battle hours! Show your kids the power of consistency!'}
                  {timeTheme.name === 'evening' && 'Golden hour reading! End the day with victory in sight!'}
                  {timeTheme.name === 'night' && 'Night owl warriors unite! Silent reading brings loud victories!'}
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {showSuccess && (
              <div style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}>
                {showSuccess}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#f44336',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
              }}>
                {error}
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
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(255, 215, 0, 0.2)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '8px'
                }}>
                  🙏 Sunday Day of Rest 🙏
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  Reflect on this week&apos;s reading journey. The battle resumes tomorrow!
                </div>
              </div>
            )}

            {/* Battle Display or Initialize Button */}
            {battleData?.enabled ? (
              <FamilyBattleDisplay
                battleData={battleData}
                isStudent={false}
                theme={theme}
                onRefresh={loadBattleData}
                onShowResults={() => setShowResultsModal(true)}
                onShowVictoryArchive={() => {
                  if (parentVictories.length === 0 && battleData?.history?.parentWins > 0) {
                    // Load victories first if not loaded
                    getParentVictories(parentData.familyId).then(victories => {
                      setParentVictories(victories)
                      setShowVictoryModal(true)
                    })
                  } else {
                    setShowVictoryModal(true)
                  }
                }}
              />
            ) : (
              <div style={{
                backgroundColor: theme.surface,
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                boxShadow: `0 4px 12px rgba(0,0,0,0.1), 0 0 20px ${theme.timeGlow}20`,
                border: `2px solid ${theme.timeGlow}40`
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '16px',
                  filter: `drop-shadow(0 0 10px ${theme.timeGlow}50)`
                }}>
                  ⚔️
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '12px'
                }}>
                  Ready for Family Battle?
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  marginBottom: '24px'
                }}>
                  Challenge your children to epic weekly reading battles!
                </p>
                <button
  onClick={handleInitializeBattle}
  disabled={loading || !parentData?.familyId || !hasFeature('familyBattle') || premiumLoading}
  style={{
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
    color: theme.textPrimary,
    border: 'none',
    borderRadius: '12px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: (loading || !parentData?.familyId || premiumLoading) ? 'not-allowed' : 'pointer',
    opacity: (loading || !parentData?.familyId || premiumLoading) ? 0.7 : 1,
    boxShadow: `0 4px 16px ${theme.primary}40`,
    transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => {
    if (!loading && parentData?.familyId && !premiumLoading) {
      e.target.style.transform = 'translateY(-2px)'
      e.target.style.boxShadow = `0 6px 20px ${theme.primary}50`
    }
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)'
    e.target.style.boxShadow = `0 4px 16px ${theme.primary}40`
  }}
>
  {premiumLoading ? '⏳ Loading Premium...' : 
   loading ? '⏳ Opening Arena...' : 
   '🚀 Start Family Battle!'}
</button>
              </div>
            )}
          </div>
        </PremiumGate>

        {/* Jane Austen Helper */}
        <JaneAustenHelper
          show={battleData?.enabled && showJaneAusten}
          battleState={battleData?.leader}
          winner={battleData?.winner}
          onClose={() => setShowJaneAusten(false)}
          currentTheme={theme}
          familyBattleData={battleData}
        />

        {/* Victory Modal */}
        <FamilyBattleVictoryModal
          show={showVictoryModal}
          onClose={() => setShowVictoryModal(false)}
          victories={parentVictories}
          theme={theme}
        />

        {/* Results Modal */}
        <FamilyBattleResultsModal
          show={showResultsModal}
          onClose={() => {
            setShowResultsModal(false)
            if (battleData?.winner === 'parents' && parentVictories.length > 0) {
              setTimeout(() => setShowVictoryModal(true), 500)
            }
          }}
          battleData={battleData}
          isStudent={false}
          theme={theme}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
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
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px ${theme.timeGlow}40; }
          50% { box-shadow: 0 0 20px ${theme.timeGlow}60; }
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
            font-size: 16px !important;
          }
          
          .nav-menu-container > div {
            right: 10px !important;
            minWidth: 180px !important;
          }
        }
      `}</style>
    </>
  )
}
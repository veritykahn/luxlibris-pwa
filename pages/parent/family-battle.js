// pages/parent/family-battle.js - SIMPLIFIED: No Challenges, Just Battle
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import PremiumGate from '../../components/PremiumGate'
import ParentFamilyBattleManager from '../../components/ParentFamilyBattleManager'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, query, where, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { 
  calculateFamilyBattleData,
  getFamilyBattleStats
} from '../../lib/family-battle-system'

// Family Streak Tracker Component
function FamilyStreakTracker({ streakDays, theme, onStreakClick, currentStreak }) {
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
      
      {/* Championship Indicator */}
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
  const [familyStreakData, setFamilyStreakData] = useState({ streakDays: 0, lastReadingDate: null })
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showStreakModal, setShowStreakModal] = useState(false)

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

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️', current: true },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  // Load family battle data
  const loadFamilyBattleData = useCallback(async () => {
    if (!user?.uid || !linkedStudents.length) return;
    
    try {
      console.log('🏆 Loading family battle data...')
      
      // Get current battle data
      const battleData = await calculateFamilyBattleData(user.uid, linkedStudents);
      setFamilyBattleData(battleData);
      
      // Get family statistics
      const stats = await getFamilyBattleStats(user.uid);
      setFamilyStats(stats);
      
      // Calculate streak
      const familyRef = doc(db, 'families', user.uid);
      const familyDoc = await getDoc(familyRef);
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        
        // Simple streak calculation
        const today = new Date();
        const lastRead = familyData.lastFamilyReadingDate ? new Date(familyData.lastFamilyReadingDate) : null;
        let streakDays = 0;
        
        if (lastRead) {
          const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 1) {
            streakDays = (familyData.familyStreakDays || 0) + (daysDiff === 1 ? 1 : 0);
          }
        }
        
        setFamilyStreakData({ 
          streakDays: streakDays,
          lastReadingDate: lastRead 
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading family battle data:', error);
    }
  }, [user?.uid, linkedStudents]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      console.log('🏆 Loading initial family battle data...')
      
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
      
      console.log('✅ Linked students loaded:', students.length)
      return students
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
      return []
    }
  }

  // Load family battle data when students are loaded
  useEffect(() => {
    if (linkedStudents.length > 0 && parentData?.familyBattleSettings?.enabled) {
      loadFamilyBattleData();
    }
  }, [linkedStudents, parentData, loadFamilyBattleData]);

  // Load initial data with premium check
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadInitialData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile, loadInitialData])

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

  const handleDataUpdate = () => {
    // Reload all data when family battle manager updates something
    loadInitialData();
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
        
        {/* Family Streak Tracker - Fixed Position */}
        <FamilyStreakTracker
          streakDays={familyStreakData.streakDays}
          theme={luxTheme}
          onStreakClick={handleStreakClick}
          currentStreak={familyStats?.currentStreak}
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
              WWE for Reading Champions
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

            {/* Main Family Battle Manager Component */}
            <ParentFamilyBattleManager
              theme={luxTheme}
              parentData={parentData}
              linkedStudents={linkedStudents}
              onUpdate={handleDataUpdate}
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
                Keep the championship spirit alive by reading every day!
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
                Keep the Battle Going! ⚔️
              </button>
            </div>
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
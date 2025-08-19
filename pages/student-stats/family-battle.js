// pages/student/family-battle.js - FIXED VERSION with proper z-index hierarchy
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import FamilyBattleDisplay from '../../components/FamilyBattleDisplay'
import FamilyBattleResultsModal from '../../components/FamilyBattleResultsModal'
import Head from 'next/head'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Import from master file
import { 
  syncFamilyBattle,
  getBattleData,
  getStudentFamilyBattleStatus
} from '../../lib/family-battle-master'

export default function StudentFamilyBattle() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentData, setStudentData] = useState(null)
  const [battleData, setBattleData] = useState(null)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [familyId, setFamilyId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Track current hour for theme updates
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  // Update hour every minute
  useEffect(() => {
    const checkTimeUpdate = () => {
      const newHour = new Date().getHours()
      if (newHour !== currentHour) {
        setCurrentHour(newHour)
      }
    }
    checkTimeUpdate()
    const interval = setInterval(checkTimeUpdate, 60000)
    return () => clearInterval(interval)
  }, [currentHour])

  // Get time-based theme
  const timeTheme = useMemo(() => {
    const hour = currentHour;
    if (hour >= 5 && hour < 12) {
      return {
        name: 'morning',
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        backgroundGradient: 'linear-gradient(to bottom, #E8E3F5, #D8D1E8)',
        overlay: 'rgba(102, 126, 234, 0.05)',
        glow: '#667eea',
        emoji: '🌅',
        greeting: 'Morning Battle Mode!'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        name: 'afternoon',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        backgroundGradient: 'linear-gradient(to bottom, #FCE4EC, #F8BBD0)',
        overlay: 'rgba(240, 147, 251, 0.05)',
        glow: '#f093fb',
        emoji: '☀️',
        greeting: 'Afternoon Showdown!'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
        backgroundGradient: 'linear-gradient(to bottom, #FFF0E6, #FFE4D1)',
        overlay: 'rgba(250, 112, 154, 0.05)',
        glow: '#fa709a',
        emoji: '🌅',
        greeting: 'Evening Battle Time!'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #30cfd0, #330867)',
        backgroundGradient: 'linear-gradient(to bottom, #1a1a2e, #16213e)',
        overlay: 'rgba(48, 207, 208, 0.05)',
        glow: '#30cfd0',
        emoji: '🌙',
        greeting: 'Night Warriors Unite!'
      };
    }
  }, [currentHour]);

  // Theme
  const theme = useMemo(() => {
    const isNight = timeTheme.name === 'night';
    return {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: timeTheme.backgroundGradient,
      surface: isNight ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
      textPrimary: isNight ? '#1F2937' : '#2D3748',
      textSecondary: isNight ? '#4A5568' : '#718096',
      timeOverlay: timeTheme.overlay,
      timeGlow: timeTheme.glow,
      headerGradient: timeTheme.gradient
    }
  }, [timeTheme]);

  // Check if it's Sunday
  const isSunday = new Date().getDay() === 0

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '🏠' },
    { name: 'Reading Timer', path: '/student/reading-timer', icon: '⏱️' },
    { name: 'My Books', path: '/student/my-books', icon: '📚' },
    { name: 'Family Battle', path: '/student/family-battle', icon: '⚔️', current: true },
    { name: 'Reading Streak', path: '/student/streak', icon: '🔥' },
    { name: 'Achievements', path: '/student/achievements', icon: '🏆' },
    { name: 'Settings', path: '/student/settings', icon: '⚙️' }
  ], [])

  // Load battle data
  const loadBattleData = useCallback(async () => {
    if (!familyId) return
    
    try {
      setRefreshing(true)
      // Sync and get battle data
      const data = await syncFamilyBattle(familyId)
      setBattleData(data)
    } catch (error) {
      console.error('Error loading battle data:', error)
      setError('Failed to load battle data')
    } finally {
      setRefreshing(false)
    }
  }, [familyId])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.uid || !userProfile) return
      
      try {
        // Get student data from userProfile
        const studentInfo = {
          entityId: userProfile.entityId,
          schoolId: userProfile.schoolId,
          studentId: userProfile.studentId || user.uid,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          ...userProfile
        }
        
        setStudentData(studentInfo)
        
        // Check if family battle is enabled
        const battleStatus = await getStudentFamilyBattleStatus(studentInfo)
        
        if (battleStatus.enabled) {
          setFamilyId(battleStatus.familyId)
        } else {
          console.log('Family battle not enabled:', battleStatus.reason)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setError('Failed to load student data')
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'student') {
      loadInitialData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'student') {
      router.push('/parent/dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile, router])

  // Load battle data when family ID is set
  useEffect(() => {
    if (familyId) {
      loadBattleData()
    }
  }, [familyId, loadBattleData])

  // Auto-show results modal on Sunday
  useEffect(() => {
    if (isSunday && battleData?.isResultsDay && battleData?.winner && battleData?.number) {
      const localStorageKey = `familyBattleResultsShown_student_${user?.uid}_week_${battleData.number}`
      const hasSeenResults = localStorage.getItem(localStorageKey) === 'true'
      
      if (!hasSeenResults) {
        setShowResultsModal(true)
        localStorage.setItem(localStorageKey, 'true')
      }
    }
  }, [isSunday, battleData, user?.uid])

  // Auto-refresh every 30 seconds (except Sunday)
  useEffect(() => {
    if (!isSunday && battleData?.enabled && familyId) {
      const interval = setInterval(() => {
        loadBattleData()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isSunday, battleData?.enabled, familyId, loadBattleData])

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
          <p style={{ color: theme.textPrimary }}>Loading epic battle...</p>
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
        <title>Family Battle - Lux Libris Student</title>
        <meta name="description" content="Compete with your parents in weekly family reading battles" />
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
        
        {/* Header with PROPER Z-INDEX */}
        <div style={{
          background: theme.headerGradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          borderRadius: '0 0 25px 25px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 40px ${theme.timeGlow}30`,
          position: 'relative',
          zIndex: 100, // HIGH Z-INDEX FOR HEADER
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/student-dashboard')}
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
              color: 'white',
              backdropFilter: 'blur(10px)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              zIndex: 101 // Ensure button is above header
            }}
          >
            ←
          </button>

          {/* Title */}
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
              color: 'white',
              margin: '0',
              fontFamily: 'Didot, "Times New Roman", serif',
              letterSpacing: '1px'
            }}>
              Family Battle
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              margin: '4px 0 0 0'
            }}>
              {isSunday ? '✨ Sunday Day of Rest ✨' : timeTheme.greeting}
            </p>
          </div>

          {/* Menu Container with PROPER Z-INDEX */}
          <div className="nav-menu-container" style={{ 
            position: 'absolute', 
            right: '20px',
            zIndex: 200 // HIGHER than header to ensure dropdown works
          }}>
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
                color: 'white',
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
                zIndex: 1000 // VERY HIGH Z-INDEX FOR DROPDOWN MENU
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

        {/* Main Content with LOW Z-INDEX */}
        <div style={{ 
          padding: '20px', 
          maxWidth: '600px', 
          margin: '0 auto',
          position: 'relative',
          zIndex: 10 // LOW Z-INDEX for main content
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
              boxShadow: `0 4px 16px ${theme.timeGlow}20`,
              position: 'relative',
              zIndex: 1 // Keep low
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
                {timeTheme.name === 'morning' && 'Rise and read! Show your parents who rules the morning!'}
                {timeTheme.name === 'afternoon' && 'Power hour! Every page turns the tide of battle!'}
                {timeTheme.name === 'evening' && 'Evening warriors unite! Time to secure your victory!'}
                {timeTheme.name === 'night' && 'Night owls have the advantage! Silent reading, loud victories!'}
              </div>
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
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              position: 'relative',
              zIndex: 1
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
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.2)',
              position: 'relative',
              zIndex: 1
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

          {/* Battle Display or Not Available Message */}
          {battleData?.enabled ? (
            <FamilyBattleDisplay
              battleData={battleData}
              isStudent={true}
              theme={theme}
              studentName={studentData?.firstName}
              refreshing={refreshing}
              onRefresh={loadBattleData}
              onShowResults={() => setShowResultsModal(true)}
            />
          ) : familyId ? (
            <div style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.textPrimary,
                marginBottom: '12px'
              }}>
                Loading Battle Arena...
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.textSecondary
              }}>
                Getting the latest battle data...
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: `0 4px 12px rgba(0,0,0,0.1), 0 0 20px ${theme.timeGlow}20`,
              border: `2px solid ${theme.timeGlow}40`,
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                filter: `drop-shadow(0 0 10px ${theme.timeGlow}50)`
              }}>
                🔒
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.textPrimary,
                marginBottom: '12px'
              }}>
                Family Battle Not Available
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.textSecondary,
                marginBottom: '8px'
              }}>
                Ask your parent to enable Family Battle to start competing!
              </p>
              <p style={{
                fontSize: '12px',
                color: theme.textSecondary,
                fontStyle: 'italic'
              }}>
                Once enabled, you&apos;ll battle for reading supremacy every week! ⚔️
              </p>
            </div>
          )}

          {/* Refresh button for students */}
          {battleData?.enabled && !isSunday && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <button
                onClick={loadBattleData}
                disabled={refreshing}
                style={{
                  backgroundColor: refreshing ? theme.secondary : theme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.backgroundColor = theme.secondary;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.backgroundColor = theme.primary;
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {refreshing ? '⏳ Updating...' : '🔄 Refresh Battle'}
              </button>
              <div style={{
                fontSize: '11px',
                color: theme.textSecondary,
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                Auto-refreshes every 30 seconds
              </div>
            </div>
          )}
        </div>

        {/* Results Modal */}
        <FamilyBattleResultsModal
          show={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          battleData={battleData}
          isStudent={true}
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
          .nav-menu-container > div {
            right: 10px !important;
            minWidth: 180px !important;
          }
        }
      `}</style>
    </>
  )
}
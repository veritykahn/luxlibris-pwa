// pages/parent/family-battle.js - FIXED VERSION WITH TIME-SENSITIVE THEMES
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
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [parentVictories, setParentVictories] = useState([])
  const [sundayBattleData, setSundayBattleData] = useState(null)
  
  // Add loading flag to prevent concurrent loads
  const isLoadingBattleData = useRef(false)
  const hasLoadedInitialData = useRef(false)
  const lastLoadTime = useRef(0) // Track last load time to prevent rapid refreshes

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

  // Get time-based theme with smoother transitions - UPDATED TO MATCH DASHBOARD
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
  }, [Math.floor(new Date().getHours() / 6)])

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
  }, [timeTheme])

  // Utility function for local date
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

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

  // Load family battle data - FIXED with throttling
  const loadFamilyBattleData = useCallback(async () => {
    if (!user?.uid || !linkedStudents.length || !parentData?.familyId) return;
    
    // Prevent rapid refreshes - minimum 5 seconds between loads
    const now = Date.now();
    if (now - lastLoadTime.current < 5000) {
      console.log('🚫 Throttling battle data load - too soon');
      return;
    }
    
    if (isLoadingBattleData.current) return;
    
    isLoadingBattleData.current = true;
    lastLoadTime.current = now;
    
    try {
      // Get current battle data using family ID
      const battleData = await calculateFamilyBattleData(parentData.familyId, linkedStudents);
      
      // Handle Sunday vs weekday data
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
            setFamilyBattleData(null);
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
  }, [user?.uid, linkedStudents, parentData?.familyId, isSunday])

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
    if (hasLoadedInitialData.current) return;
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

  // Load family battle data when students are loaded - FIXED dependencies
  useEffect(() => {
    if (linkedStudents.length > 0 && parentData?.familyBattleSettings?.enabled && parentData?.familyId) {
      loadFamilyBattleData();
    }
  }, [linkedStudents.length, parentData?.familyBattleSettings?.enabled, parentData?.familyId])

  // Load parent victories when family data is loaded - FIXED to not trigger loops
  useEffect(() => {
    if (parentData?.familyId && familyStats && !parentVictories.length) {
      loadParentVictories();
    }
  }, [parentData?.familyId, familyStats])

  // Auto-show results modal on Sunday - only once per week using localStorage
  useEffect(() => {
    if (isSunday && 
        sundayBattleData && 
        sundayBattleData.winner && 
        sundayBattleData.winner !== 'ongoing' &&
        sundayBattleData.weekNumber) {
      
      const localStorageKey = `familyBattleResultsShown_parent_${user?.uid}`;
      const shownWeek = localStorage.getItem(localStorageKey);
      const currentWeek = sundayBattleData.weekNumber.toString();
      
      if (shownWeek !== currentWeek) {
        console.log('📊 Auto-showing results modal for week:', currentWeek);
        setShowResultsModal(true);
        localStorage.setItem(localStorageKey, currentWeek);
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

  const handleResultsClick = () => {
    setShowResultsModal(true)
  }

  const handleDataUpdate = () => {
    // Reload all data when family battle manager updates something
    loadFamilyBattleData();
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
          background: luxTheme.background,
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
          background: luxTheme.background,
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
        background: luxTheme.background,
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
          background: luxTheme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* ONLY show Results button on Sunday, NOTHING on other days */}
        {isSunday && sundayBattleData && (
          <SundayResultsButton
            onClick={handleResultsClick}
            winner={sundayBattleData.winner}
            margin={sundayBattleData.margin}
          />
        )}
        
        {/* Header */}
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
              color: timeTheme.name === 'night' ? 'white' : luxTheme.textPrimary,
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
              color: timeTheme.name === 'night' ? 'white' : luxTheme.textPrimary,
              margin: '0',
              letterSpacing: '1px',
              fontFamily: 'Didot, "Times New Roman", serif',
              textShadow: timeTheme.name === 'night' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
            }}>
              Family Battle
            </h1>
            <p style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: timeTheme.name === 'night' ? 'rgba(255,255,255,0.8)' : luxTheme.textSecondary,
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
                color: timeTheme.name === 'night' ? 'white' : luxTheme.textPrimary,
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
            paddingTop: '20px',
            position: 'relative',
            zIndex: 10
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
                textAlign: 'center',
                boxShadow: `0 4px 12px ${luxTheme.timeGlow}20`
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

            {/* Main Family Battle Manager Component */}
            <ParentFamilyBattleManager
              theme={luxTheme}
              parentData={parentData}
              linkedStudents={linkedStudents}
              onUpdate={handleDataUpdate}
              battleData={displayBattleData}
              isSunday={isSunday}
            />
          </div>
        </PremiumGate>

        {/* Victory Modal */}
        <FamilyBattleVictoryModal
          show={showVictoryModal}
          onClose={() => setShowVictoryModal(false)}
          victories={parentVictories}
          theme={luxTheme}
        />

        {/* Family Battle Results Modal */}
        <FamilyBattleResultsModal
          show={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            // Update localStorage when manually closed
            if (sundayBattleData?.weekNumber) {
              const localStorageKey = `familyBattleResultsShown_parent_${user?.uid}`;
              localStorage.setItem(localStorageKey, sundayBattleData.weekNumber.toString());
            }
            // If parents won, optionally show victory archive
            if (sundayBattleData?.winner === 'parents') {
              setTimeout(() => setShowVictoryModal(true), 500);
            }
          }}
          battleData={sundayBattleData || displayBattleData}
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
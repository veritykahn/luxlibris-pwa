// pages/student-stats/family-battle.js - FIXED VERSION with Grade Stats styling
// Family Battle runs continuously all year through all 6 phases:
// SETUP, TEACHER_SELECTION, ACTIVE, VOTING, RESULTS, CLOSED
// Shows phase-aware messaging during special phases only (not during ACTIVE)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usePhaseAccess } from '../../hooks/usePhaseAccess';
import { getStudentDataEntities } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

// Import shared components
import FamilyBattleDisplay from '../../components/FamilyBattleDisplay';
import FamilyBattleResultsModal from '../../components/FamilyBattleResultsModal';
import JaneAustenHelper from '../../components/JaneAustenHelper';

// Import theme system
import { getTheme, getSeasonalThemeAnnouncement } from '../../lib/themes';

// Import from master file only
import {
  syncFamilyBattle,
  getBattleData,
  getStudentFamilyBattleStatus
} from '../../lib/family-battle-master';

export default function StudentFamilyBattle() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess, getPhaseInfo, getPhaseMessage } = usePhaseAccess();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState('');
  
  // Battle states
  const [battleData, setBattleData] = useState(null);
  const [familyBattleUnlocked, setFamilyBattleUnlocked] = useState(false);
  
  // UI states
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showJaneAusten, setShowJaneAusten] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [seasonalThemeAlert, setSeasonalThemeAlert] = useState(null);

  // Check if it's Sunday
  const isSunday = new Date().getDay() === 0;
  
  // Get phase information
  const phaseInfo = getPhaseInfo();

  // Navigation menu items with phase-aware locking
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { 
      name: 'Nominees', 
      path: '/student-nominees', 
      icon: '□', 
      locked: !hasAccess('nomineesBrowsing'),
      lockReason: phaseData.currentPhase === 'VOTING' ? 'Nominees locked during voting' : 
                 phaseData.currentPhase === 'RESULTS' ? 'Nominees locked during results' :
                 phaseData.currentPhase === 'TEACHER_SELECTION' ? 'New amazing nominees coming this week!' : 'Nominees not available'
    },
    { 
      name: 'Bookshelf', 
      path: '/student-bookshelf', 
      icon: '⚏', 
      locked: !hasAccess('bookshelfViewing'),
      lockReason: phaseData.currentPhase === 'RESULTS' ? 'Bookshelf locked during results' :
                 phaseData.currentPhase === 'TEACHER_SELECTION' ? 'Stats refreshing - new bookshelf coming!' : 'Bookshelf not available'
    },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△', current: true },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], [hasAccess, phaseData.currentPhase]);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
    { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '⛪', description: 'Coming soon!', disabled: true },
    { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
    { 
      name: 'Lux DNA Lab', 
      path: '/student-stats/lux-dna-lab', 
      icon: '🧬', 
      description: phaseData.currentPhase === 'RESULTS' ? 'Nominees DNA locked for year' : 'Discover your reading personality',
      phaseNote: phaseData.currentPhase === 'RESULTS' ? 'Nominees DNA analysis is closed for this academic year' : null
    },
    { name: 'Family Battle', path: '/student-stats/family-battle', icon: '🥊', description: 'WWE-style reading showdown!', current: true }
  ], [phaseData.currentPhase]);

  // Handle stats navigation with phase awareness
  const handleStatsNavigation = (option) => {
    setShowStatsDropdown(false);
    
    if (option.disabled) {
      alert(`${option.name} is coming soon! 🚧`);
      return;
    }
    
    if (option.current) {
      return; // Already on current page
    }
    
    // Allow navigation to all pages - phaseNote is just informational
    router.push(option.path);
  };

  // Load battle data
  const loadBattleData = useCallback(async () => {
    if (!studentData) return;
    
    try {
      const status = await getStudentFamilyBattleStatus(studentData);
      
      if (status.enabled && status.familyId) {
        setFamilyBattleUnlocked(true);
        
        // Sync and get battle data
        await syncFamilyBattle(status.familyId);
        const data = await getBattleData(status.familyId);
        setBattleData(data);
        
        // Check if XP was already awarded on Sunday
        if (isSunday && data?.winner === 'children' && data?.weekNumber) {
          const xpKey = `familyBattleWeek${data.weekNumber}XPAwarded`;
          if (studentData[xpKey]) {
            setShowSuccess(`🎉 You earned XP for Week ${data.weekNumber} victory!`);
            setTimeout(() => setShowSuccess(''), 4000);
          }
        }
      } else {
        setFamilyBattleUnlocked(false);
        setError(status.reason || 'Family battle not available');
      }
    } catch (error) {
      console.error('Error loading battle data:', error);
      setError('Failed to load family battle data');
    }
  }, [studentData, isSunday]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.uid) return;
      
      try {
        const firebaseStudentData = await getStudentDataEntities(user.uid);
        
        if (!firebaseStudentData) {
          router.push('/student-onboarding');
          return;
        }
        
        // Log phase information
        console.log('🎮 Family Battle Phase:', {
          currentPhase: phaseData.currentPhase,
          academicYear: phaseData.academicYear,
          source: phaseData.source || 'unknown'
        });
        
        // Use the actual document ID from firebaseStudentData
        const studentDocId = firebaseStudentData.id;
        const studentPath = `entities/${firebaseStudentData.entityId}/schools/${firebaseStudentData.schoolId}/students/${studentDocId}`;
        
        // Get fresh student data using the correct document ID
        const studentRef = doc(db, studentPath);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const completeData = {
            ...firebaseStudentData,
            ...studentDoc.data(),
            id: studentDocId,
            studentId: studentDocId,
            uid: user.uid
          };
          setStudentData(completeData);
          
          // Set theme
          const selectedThemeKey = completeData.selectedTheme || 'classic_lux';
          const selectedTheme = getTheme(selectedThemeKey);
          setCurrentTheme(selectedTheme);
          
          // Check for seasonal themes
          const seasonalAnnouncements = getSeasonalThemeAnnouncement();
          if (seasonalAnnouncements.length > 0 && !completeData.selectedTheme) {
            setSeasonalThemeAlert(seasonalAnnouncements[0]);
            setTimeout(() => setSeasonalThemeAlert(null), 8000);
          }
        } else {
          // If document doesn't exist with that ID, use data directly from getStudentDataEntities
          const completeData = {
            ...firebaseStudentData,
            id: studentDocId,
            studentId: studentDocId,
            uid: user.uid
          };
          setStudentData(completeData);
          
          // Set theme
          const selectedThemeKey = completeData.selectedTheme || 'classic_lux';
          const selectedTheme = getTheme(selectedThemeKey);
          setCurrentTheme(selectedTheme);
          
          // Check for seasonal themes
          const seasonalAnnouncements = getSeasonalThemeAnnouncement();
          if (seasonalAnnouncements.length > 0 && !completeData.selectedTheme) {
            setSeasonalThemeAlert(seasonalAnnouncements[0]);
            setTimeout(() => setSeasonalThemeAlert(null), 8000);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load student data');
      }
      
      setIsLoading(false);
    };
    
    if (!loading && isAuthenticated && user) {
      loadInitialData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user?.uid, router]);

  // Load battle data when student data is ready
  useEffect(() => {
    if (studentData) {
      loadBattleData();
    }
  }, [studentData, loadBattleData]);

  // Auto-show results modal on Sunday
  useEffect(() => {
    if (isSunday && battleData?.isResultsDay && battleData?.winner && battleData?.weekNumber) {
      const localStorageKey = `familyBattleResultsShown_student_${user?.uid}_week_${battleData.weekNumber}`;
      const hasSeenResults = localStorage.getItem(localStorageKey) === 'true';
      
      if (!hasSeenResults) {
        setShowResultsModal(true);
        localStorage.setItem(localStorageKey, 'true');
      }
    }
  }, [isSunday, battleData, user?.uid]);

  // Auto-refresh every 30 seconds (except Sunday)
  useEffect(() => {
    if (!isSunday && familyBattleUnlocked && battleData?.enabled) {
      const interval = setInterval(() => {
        loadBattleData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isSunday, familyBattleUnlocked, battleData?.enabled, loadBattleData]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false);
      }
      if (showStatsDropdown && !event.target.closest('.stats-dropdown-container')) {
        setShowStatsDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNavMenu(false);
        setShowStatsDropdown(false);
      }
    };

    if (showNavMenu || showStatsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown]);

  if (loading || isLoading || !studentData || !currentTheme) {
    return (
      <div style={{
        backgroundColor: '#FFFCF5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #ADD4EA30',
            borderTop: '3px solid #ADD4EA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading battle arena...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris</title>
        <meta name="description" content="Challenge your parents in epic reading battles" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* Success message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {showSuccess}
          </div>
        )}
        
        {/* Seasonal theme alert */}
        {seasonalThemeAlert && (
          <div 
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: currentTheme.primary,
              color: 'white',
              padding: '14px 24px',
              borderRadius: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              zIndex: 1002,
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              animation: 'slideInDown 0.6s ease-out'
            }}
            onClick={() => {
              router.push('/student-settings');
              setSeasonalThemeAlert(null);
            }}
          >
            <span style={{ fontSize: '20px' }}>{seasonalThemeAlert.icon}</span>
            <span>{seasonalThemeAlert.message} Tap to use!</span>
          </div>
        )}
        
        {/* HEADER WITH DROPDOWN NAVIGATION - Matching Grade Stats */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 1000,  // Higher z-index for the fix
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.push('/student-stats')}
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
              color: currentTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          {/* STATS DROPDOWN */}
          <div className="stats-dropdown-container" style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowStatsDropdown(!showStatsDropdown)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                fontSize: '16px',
                fontWeight: '500',
                minHeight: '40px',
                margin: '0 auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>🥊</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Family Battle</span>
              <span style={{ fontSize: '12px', transform: showStatsDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {showStatsDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: currentTheme.surface,
                borderRadius: '16px',
                minWidth: '280px',
                maxWidth: '320px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 10001  // Higher z-index for the fix
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: `${currentTheme.primary}20`,
                  borderBottom: `1px solid ${currentTheme.primary}40`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    textAlign: 'center'
                  }}>
                    📊 Stats Explorer
                  </div>
                </div>
                
                {statsNavOptions.map((option, index) => (
                  <button
                    key={option.name}
                    onClick={() => handleStatsNavigation(option)}
                    disabled={option.disabled}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: option.current ? `${currentTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < statsNavOptions.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: option.disabled ? 'not-allowed' : option.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: option.disabled ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: option.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      opacity: option.disabled ? 0.6 : 1,
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!option.disabled && !option.current) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.disabled && !option.current) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{option.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '2px'
                      }}>
                        {option.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: option.phaseNote ? '#FF9800' : currentTheme.textSecondary,
                        opacity: 0.8
                      }}>
                        {option.phaseNote || option.description}
                      </div>
                    </div>
                    {option.current && (
                      <span style={{ fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                    {option.disabled && (
                      <span style={{
                        fontSize: '9px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        SOON
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger Menu with Phase-Aware Locking */}
          <div className="nav-menu-container" style={{ position: 'relative' }}>
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
                color: currentTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
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
                backgroundColor: currentTheme.surface,
                borderRadius: '12px',
                minWidth: '180px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 10001  // Higher z-index for the fix
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowNavMenu(false);
                      if (item.locked) {
                        alert(`🔒 ${item.lockReason}`);
                        return;
                      }
                      if (!item.current) {
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${currentTheme.primary}30` : 
                                      item.locked ? `${currentTheme.textSecondary}10` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: item.locked ? 'not-allowed' : (item.current ? 'default' : 'pointer'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: item.locked ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      opacity: item.locked ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current && !item.locked) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current && !item.locked) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={item.locked ? item.lockReason : undefined}
                  >
                    <span style={{ 
                      fontSize: '16px',
                      filter: item.locked ? 'grayscale(1)' : 'none'
                    }}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                    {item.locked && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.textSecondary }}>🔒</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase-Specific Alert Banner - Only show for special phases, not ACTIVE */}
        {phaseData.currentPhase && phaseData.currentPhase !== 'ACTIVE' && !phaseData.loading && (
          <div className="phase-alert-banner" style={{
            background: `linear-gradient(135deg, ${phaseInfo.color}, ${phaseInfo.color}dd)`,
            color: 'white',
            padding: '12px 16px',
            margin: '0 16px 16px 16px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'slideInDown 0.6s ease-out'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {phaseInfo.icon}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '6px',
              lineHeight: '1.3'
            }}>
              {phaseData.currentPhase === 'VOTING' ? 'Voting Time - Battle Continues!' :
               phaseData.currentPhase === 'RESULTS' ? 'Results Are In - Keep Battling!' :
               phaseData.currentPhase === 'TEACHER_SELECTION' ? 'Teachers Selecting - Battle On!' :
               phaseData.currentPhase === 'SETUP' ? 'New Year Setup - Battle Available!' :
               phaseData.currentPhase === 'CLOSED' ? 'Winter Break - Keep Reading!' :
               'Family Battle Arena Open!'}
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '400',
              lineHeight: '1.4',
              opacity: 0.95
            }}>
              {phaseData.currentPhase === 'VOTING' ? 
                "🗳️ While you vote for your favorite books, the family battle rages on! Keep reading to help your team dominate!" :
               phaseData.currentPhase === 'RESULTS' ? 
                "🏆 Celebrate the year's winners while your family battle continues! Your reading minutes still count for XP and victories!" :
               phaseData.currentPhase === 'TEACHER_SELECTION' ? 
                "👩‍🏫 Teachers are selecting amazing new books! Meanwhile, keep your family battle streak alive - every minute counts!" :
               phaseData.currentPhase === 'SETUP' ? 
                "📝 While we set up the new academic year, Family Battle is ready! Challenge your parents and start earning XP!" :
               phaseData.currentPhase === 'CLOSED' ? 
                "❄️ School may be on break, but Family Battle never stops! Keep your reading habits strong and dominate!" :
                "⚔️ Family Battle is always available! Keep reading to help your team win!"}
            </div>
          </div>
        )}

        {/* MAIN CONTENT - Matching Grade Stats responsive layout */}
        <div className="stats-main-content" style={{ 
          padding: 'clamp(16px, 5vw, 20px)', 
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          
          {/* Error state */}
          {error && !familyBattleUnlocked ? (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '40px 20px',
              marginTop: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>😞</div>
              <h2 style={{ 
                color: currentTheme.textPrimary, 
                marginBottom: '16px',
                fontSize: '24px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Battle Arena Closed!
              </h2>
              <p style={{ 
                color: currentTheme.textSecondary, 
                marginBottom: '24px',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                {error}
                {phaseData.currentPhase === 'VOTING' && 
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '14px' }}>
                    Family Battle continues during voting - try refreshing!
                  </span>
                }
                {phaseData.currentPhase === 'RESULTS' && 
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '14px' }}>
                    Family Battle is available during results week!
                  </span>
                }
                {phaseData.currentPhase === 'TEACHER_SELECTION' && 
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '14px' }}>
                    Family Battle runs all year round - let&apos;s get you back in!
                  </span>
                }
                {phaseData.currentPhase === 'SETUP' && 
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '14px' }}>
                    Family Battle is ready for the new year - try again!
                  </span>
                }
                {phaseData.currentPhase === 'CLOSED' && 
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '14px' }}>
                    Family Battle stays open during breaks - refresh to continue!
                  </span>
                }
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: currentTheme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                🔄 Try Again
              </button>
            </div>
          ) : battleData?.enabled ? (
            <>
              {/* Battle Display */}
              <FamilyBattleDisplay
                battleData={battleData}
                isStudent={true}
                theme={currentTheme}
                studentName={studentData.firstName}
                onRefresh={loadBattleData}
                onShowResults={() => setShowResultsModal(true)}
              />
              
              {/* Motivational Section */}
              <div style={{
                backgroundColor: currentTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginTop: '20px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${currentTheme.accent}60`
              }}>
                {isSunday ? (
                  <>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      🙏 Sunday Day of Rest 🙏
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: currentTheme.textSecondary,
                      marginBottom: '16px'
                    }}>
                      Reflect on this week&apos;s reading journey. The battle resumes tomorrow!
                      {phaseData.currentPhase === 'VOTING' && " Don't forget to vote for your favorite books!"}
                      {phaseData.currentPhase === 'RESULTS' && " Check out the winning books in the Results page!"}
                      {phaseData.currentPhase === 'TEACHER_SELECTION' && " New amazing books coming next week!"}
                      {phaseData.currentPhase === 'SETUP' && " The new academic year is being prepared!"}
                      {phaseData.currentPhase === 'CLOSED' && " Enjoy your break and keep reading!"}
                    </p>
                    <button
                      onClick={() => router.push('/student-saints')}
                      style={{
                        backgroundColor: currentTheme.accent,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ♔ Visit Saints for Inspiration
                    </button>
                  </>
                ) : (
                  <>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      Time to Read & Conquer!
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: currentTheme.textSecondary,
                      marginBottom: '16px'
                    }}>
                      Every minute helps your team dominate!
                      {phaseData.currentPhase === 'VOTING' && " Battle while voting continues!"}
                      {phaseData.currentPhase === 'RESULTS' && " Keep battling during results week!"}
                      {phaseData.currentPhase === 'TEACHER_SELECTION' && " Your battle continues all year!"}
                      {phaseData.currentPhase === 'SETUP' && " Start the new year strong!"}
                      {phaseData.currentPhase === 'CLOSED' && " Winter battles are the best!"}
                    </p>
                    <button
                      onClick={() => router.push('/student-healthy-habits')}
                      style={{
                        backgroundColor: currentTheme.accent,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🤼 Enter the Reading Ring
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Family Battle Locked */
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '40px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚔️</div>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                marginBottom: '12px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Battle Arena Awaits!
              </div>
              <div style={{
                fontSize: '16px',
                color: currentTheme.textSecondary,
                lineHeight: '1.5'
              }}>
                Ask your parent to enable Family Battle, then you can challenge them!
                {phaseData.currentPhase === 'VOTING' && 
                  <div style={{ marginTop: '12px', fontSize: '14px' }}>
                    💡 Family Battles continue during voting - get your parent to enable it!
                  </div>
                }
                {phaseData.currentPhase === 'RESULTS' && 
                  <div style={{ marginTop: '12px', fontSize: '14px' }}>
                    🏆 Even during results week, Family Battle keeps going!
                  </div>
                }
                {phaseData.currentPhase === 'TEACHER_SELECTION' && 
                  <div style={{ marginTop: '12px', fontSize: '14px' }}>
                    👩‍🏫 Family Battle runs all year - including while teachers select new books!
                  </div>
                }
                {phaseData.currentPhase === 'SETUP' && 
                  <div style={{ marginTop: '12px', fontSize: '14px' }}>
                    📝 Family Battle is ready for the new academic year - get started!
                  </div>
                }
                {phaseData.currentPhase === 'CLOSED' && 
                  <div style={{ marginTop: '12px', fontSize: '14px' }}>
                    ❄️ Family Battle never takes a break - perfect for winter reading!
                  </div>
                }
              </div>
            </div>
          )}
        </div>

        {/* Jane Austen Helper */}
        <JaneAustenHelper
          show={showJaneAusten && familyBattleUnlocked && battleData?.enabled}
          battleState={battleData?.leader}
          winner={battleData?.winner}
          onClose={() => setShowJaneAusten(false)}
          currentTheme={currentTheme}
          familyBattleData={battleData}
        />

        {/* Results Modal */}
        <FamilyBattleResultsModal
          show={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            if (battleData?.weekNumber) {
              const localStorageKey = `familyBattleResultsShown_student_${user?.uid}_week_${battleData.weekNumber}`;
              localStorage.setItem(localStorageKey, 'true');
            }
          }}
          battleData={battleData}
          isStudent={true}
          theme={currentTheme}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        }

        /* Phase alert banner styling */
        .phase-alert-banner {
          animation: slideInDown 0.6s ease-out;
        }

        /* Adaptive CSS for tablet/iPad layouts - Matching Grade Stats */
        @media screen and (min-width: 768px) and (max-width: 1024px) {
          .stats-main-content {
            max-width: 600px !important;
            padding: 24px !important;
          }
          
          .phase-alert-banner {
            margin: 0 24px 20px 24px !important;
            padding: 16px 20px !important;
          }
        }

        /* Additional responsive styles for larger screens */
        @media screen and (min-width: 1025px) {
          .stats-main-content {
            max-width: 600px !important;
          }
        }
      `}</style>
    </>
  );
}
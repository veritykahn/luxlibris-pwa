// pages/student-stats/family-battle.js - FIXED VERSION
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
  const { phaseData, hasAccess } = usePhaseAccess();
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

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { 
      name: 'Nominees', 
      path: '/student-nominees', 
      icon: '□', 
      locked: !hasAccess('nomineesBrowsing')
    },
    { 
      name: 'Bookshelf', 
      path: '/student-bookshelf', 
      icon: '⚏', 
      locked: !hasAccess('bookshelfViewing')
    },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], [hasAccess]);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫' },
    { name: 'Family Battle', path: '/student-stats/family-battle', icon: '🥊', current: true }
  ], []);

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
            setTimeout(() => setSeasonalThemeAlert(null), 5000);
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
            setTimeout(() => setSeasonalThemeAlert(null), 5000);
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

    if (showNavMenu || showStatsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
              padding: '12px 24px',
              borderRadius: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 1002,
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
            onClick={() => router.push('/student-settings')}
          >
            {seasonalThemeAlert.icon} {seasonalThemeAlert.message} Tap to use!
          </div>
        )}
        
        {/* Header - FIXED Z-INDEX */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          position: 'relative',  // Added
          zIndex: 1000,  // Changed from 100
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Back button */}
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
              color: currentTheme.textPrimary
            }}
          >
            ←
          </button>

          {/* Stats dropdown */}
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
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 auto'
              }}
            >
              <span>🥊</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Family Battle</span>
              <span style={{ fontSize: '12px', transform: showStatsDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
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
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 10001  // Changed from 9999
              }}>
                {statsNavOptions.map((option, index) => (
                  <button
                    key={option.name}
                    onClick={() => {
                      setShowStatsDropdown(false);
                      if (!option.current) router.push(option.path);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: option.current ? `${currentTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < statsNavOptions.length - 1 ? '1px solid #E5E7EB' : 'none',
                      cursor: option.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: currentTheme.textPrimary,
                      fontWeight: option.current ? '600' : '500',
                      textAlign: 'left'
                    }}
                  >
                    <span>{option.icon}</span>
                    <span>{option.name}</span>
                    {option.current && <span style={{ marginLeft: 'auto' }}>●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger menu */}
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
                color: currentTheme.textPrimary
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
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 10001  // Changed from 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowNavMenu(false);
                      if (item.locked) {
                        alert(`🔒 ${item.name} is locked`);
                      } else {
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                      cursor: item.locked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: item.locked ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: '500',
                      textAlign: 'left',
                      opacity: item.locked ? 0.5 : 1
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.locked && <span style={{ marginLeft: 'auto' }}>🔒</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          padding: '20px', 
          maxWidth: '800px',
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
    </>
  );
}
// pages/student-stats/index.js - Enhanced Stats Dashboard with Certificate Generation Removed

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities } from '../../lib/firebase';
import { getCurrentWeekBadge, getBadgeProgress, getEarnedBadges, getLevelProgress } from '../../lib/badge-system';
import { calculateReadingPersonality, shouldShowFirstBookCelebration, unlockCertificate } from '../../lib/reading-personality';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

export default function StudentStatsMain() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showFirstBookCelebration, setShowFirstBookCelebration] = useState(false);
  const [quickStats, setQuickStats] = useState(null);
  const [readingPersonality, setReadingPersonality] = useState(null);
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [levelProgress, setLevelProgress] = useState(null);
  const [currentWeekBadge, setCurrentWeekBadge] = useState(null);

  // Theme definitions
  const themes = useMemo(() => ({
    classic_lux: {
      name: 'Lux Libris Classic',
      assetPrefix: 'classic_lux',
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: '#FFFCF5',
      surface: '#FFFFFF',
      textPrimary: '#223848',
      textSecondary: '#556B7A'
    },
    darkwood_sports: {
      name: 'Athletic Champion',
      assetPrefix: 'darkwood_sports',
      primary: '#2F5F5F',
      secondary: '#8B2635',
      accent: '#F5DEB3',
      background: '#F5F5DC',
      surface: '#FFF8DC',
      textPrimary: '#2F1B14',
      textSecondary: '#5D4037'
    },
    lavender_space: {
      name: 'Cosmic Explorer',
      assetPrefix: 'lavender_space',
      primary: '#9C88C4',
      secondary: '#B19CD9',
      accent: '#E1D5F7',
      background: '#2A1B3D',
      surface: '#3D2B54',
      textPrimary: '#E1D5F7',
      textSecondary: '#B19CD9'
    },
    mint_music: {
      name: 'Musical Harmony',
      assetPrefix: 'mint_music',
      primary: '#B8E6B8',
      secondary: '#FFB3BA',
      accent: '#FFCCCB',
      background: '#FEFEFE',
      surface: '#F8FDF8',
      textPrimary: '#2E4739',
      textSecondary: '#4A6B57'
    },
    pink_plushies: {
      name: 'Kawaii Dreams',
      assetPrefix: 'pink_plushies',
      primary: '#FFB6C1',
      secondary: '#FFC0CB',
      accent: '#FFE4E1',
      background: '#FFF0F5',
      surface: '#FFE4E6',
      textPrimary: '#4A2C2A',
      textSecondary: '#8B4B5C'
    },
    teal_anime: {
      name: 'Otaku Paradise',
      assetPrefix: 'teal_anime',
      primary: '#20B2AA',
      secondary: '#48D1CC',
      accent: '#7FFFD4',
      background: '#E0FFFF',
      surface: '#AFEEEE',
      textPrimary: '#2F4F4F',
      textSecondary: '#5F9EA0'
    },
    white_nature: {
      name: 'Pure Serenity',
      assetPrefix: 'white_nature',
      primary: '#6B8E6B',
      secondary: '#D2B48C',
      accent: '#F5F5DC',
      background: '#FFFEF8',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F',
      textSecondary: '#556B2F'
    },
    little_luminaries: {
      name: 'Luxlings™',
      assetPrefix: 'little_luminaries',
      primary: '#666666',
      secondary: '#000000',
      accent: '#E8E8E8',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      textPrimary: '#B8860B',
      textSecondary: '#AAAAAA'
    }
  }), []);

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { name: 'Nominees', path: '/student-nominees', icon: '□' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△', current: true },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], []);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Main overview', current: true },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal reading progress' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
    { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '🌍', description: 'Coming soon!', disabled: true },
    { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
    { name: 'Lux DNA Lab', path: '/student-stats/lux-dna-lab', icon: '🧬', description: 'Coming soon!', disabled: true },
    { name: 'Family Battle', path: '/student-stats/family-battle', icon: '👨‍👩‍👧‍👦', description: 'Coming soon!', disabled: true }
  ], []);

  // Close nav menus when clicking outside
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
        setShowFirstBookCelebration(false);
      }
    };

    if (showNavMenu || showStatsDropdown || showFirstBookCelebration) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown, showFirstBookCelebration]);

  // Calculate quick stats for dashboard overview
  const calculateQuickStats = useCallback(async (studentData) => {
    try {
      // Get reading sessions for streak calculation
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      let totalReadingMinutes = 0;
      let completedSessions = 0;
      const completedSessionsByDate = {};
      
      sessionsSnapshot.forEach(doc => {
        const session = doc.data();
        totalReadingMinutes += session.duration || 0;
        if (session.completed) {
          completedSessions++;
          completedSessionsByDate[session.date] = true;
        }
      });

      // Calculate current streak (simplified logic)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let currentStreak = 0;
      let checkDate = completedSessionsByDate[todayStr] ? new Date(today) : new Date(yesterday);
      
      while (currentStreak < 365) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedSessionsByDate[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate progress toward goal
      const booksThisYear = studentData.booksSubmittedThisYear || 0;
      const personalGoal = studentData.personalGoal || 15;
      const goalProgress = Math.min(100, Math.round((booksThisYear / personalGoal) * 100));

      // Get achievement tiers
      const achievementTiers = studentData.achievementTiers || [];
      const nextTier = achievementTiers.find(tier => booksThisYear < tier.books);
      
      // Calculate badge and level stats
      const badges = getEarnedBadges(studentData);
      const badgeStats = getBadgeProgress(studentData);
      const levelInfo = getLevelProgress(studentData.totalXP || 0);

      setEarnedBadges(badges);
      setBadgeProgress(badgeStats);
      setLevelProgress(levelInfo);
      
      setQuickStats({
        booksThisYear,
        personalGoal,
        goalProgress,
        currentStreak,
        totalReadingMinutes,
        readingHours: Math.round(totalReadingMinutes / 60),
        saintsUnlocked: (studentData.unlockedSaints || []).length,
        completedSessions,
        nextTier,
        currentReadingLevel: studentData.currentReadingLevel || 'faithful_flame',
        averageSessionLength: completedSessions > 0 ? Math.round(totalReadingMinutes / completedSessions) : 0,
        totalXP: studentData.totalXP || 0
      });
      
    } catch (error) {
      console.error('Error calculating quick stats:', error);
      setQuickStats({
        booksThisYear: studentData.booksSubmittedThisYear || 0,
        personalGoal: studentData.personalGoal || 15,
        goalProgress: 0,
        currentStreak: 0,
        totalReadingMinutes: 0,
        readingHours: 0,
        saintsUnlocked: 0,
        completedSessions: 0,
        nextTier: null,
        currentReadingLevel: 'faithful_flame',
        averageSessionLength: 0,
        totalXP: studentData.totalXP || 0
      });
    }
  }, []);

  // Load student data and calculate stats
  const loadStatsData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = themes[selectedThemeKey];
      setCurrentTheme(selectedTheme);
      
      // Load current week's badge challenge
      const weekBadge = getCurrentWeekBadge();
      setCurrentWeekBadge(weekBadge);
      
      // Calculate quick stats for overview
      await calculateQuickStats(firebaseStudentData);
      
      // Calculate reading personality
      const personality = await calculateReadingPersonality(firebaseStudentData);
      setReadingPersonality(personality);
      
      // Check for first book celebration
      if (shouldShowFirstBookCelebration(firebaseStudentData)) {
        setShowFirstBookCelebration(true);
      }
      
    } catch (error) {
      console.error('Error loading stats data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, calculateQuickStats]);

  // Load initial data
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadStatsData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadStatsData]);

  // Handle stats navigation
  const handleStatsNavigation = (option) => {
    setShowStatsDropdown(false);
    
    if (option.disabled) {
      alert(`${option.name} is coming soon! 🚧`);
      return;
    }
    
    if (option.current) {
      return; // Already on current page
    }
    
    router.push(option.path);
  };

  // Handle first book celebration completion
  const handleFirstBookCelebration = async () => {
    setShowFirstBookCelebration(false);
    
    try {
      await unlockCertificate(studentData);
      alert('🎉 Congratulations! Keep reading to unlock more achievements!');
      
      // Refresh student data to reflect the unlock
      await loadStatsData();
    } catch (error) {
      console.error('Error handling first book celebration:', error);
    }
  };

  // Show loading
  if (loading || isLoading || !studentData || !currentTheme || !quickStats) {
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your stats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Stats Dashboard - Lux Libris</title>
        <meta name="description" content="Your complete reading stats dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* HEADER WITH DROPDOWN NAVIGATION */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.push('/student-dashboard')}
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
              <span style={{ fontSize: '18px' }}>📊</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Stats Dashboard</span>
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
                zIndex: 9999
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
                        color: currentTheme.textSecondary,
                        opacity: 0.8
                      }}>
                        {option.description}
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

          {/* Hamburger Menu */}
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
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowNavMenu(false);
                      if (!item.current) {
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${currentTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT - UPDATED LAYOUT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* THIS WEEK'S CHALLENGE + XP (PROMINENT AT TOP) */}
          {currentWeekBadge && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                marginBottom: '16px'
              }}>
                {currentWeekBadge.week === 0 ? '🚀 Coming Soon' : '🎯 This Week\'s Challenge'}
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: 'clamp(32px, 10vw, 40px)', marginBottom: '12px' }}>
                  {currentWeekBadge.emoji}
                </div>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  {currentWeekBadge.name}
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  marginBottom: currentWeekBadge.week === 0 ? '0' : '12px'
                }}>
                  {currentWeekBadge.description}
                </div>
                
                {currentWeekBadge.week > 0 && (
                  <div style={{
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: '600',
                    color: currentTheme.primary
                  }}>
                    🏆 {currentWeekBadge.xp} XP Reward
                  </div>
                )}
              </div>
              
              {/* PROMINENT XP DISPLAY */}
              <div style={{
                backgroundColor: currentTheme.surface,
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
                border: `2px solid ${currentTheme.primary}60`
              }}>
                <div style={{
                  fontSize: 'clamp(28px, 10vw, 36px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  ⚡ {quickStats.totalXP || 0} XP
                </div>
                
                {levelProgress && (
                  <>
                    <div style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '12px',
                      fontFamily: 'Didot, "Times New Roman", serif'
                    }}>
                      Level {levelProgress.level}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary
                      }}>
                        {levelProgress.progress} XP
                      </div>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary
                      }}>
                        {levelProgress.toNext} XP to Level {levelProgress.level + 1}
                      </div>
                    </div>
                    
                    <div style={{
                      height: '8px',
                      backgroundColor: '#E0E0E0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${levelProgress.percentage}%`,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </>
                )}
              </div>
              
              {currentWeekBadge.week === 0 ? (
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  The 39-week badge challenge starts with the new school year!
                </div>
              ) : (
                <button
                  onClick={() => router.push('/student-healthy-habits')}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: 'clamp(10px, 3vw, 12px) clamp(16px, 5vw, 20px)',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  📖 Start Reading Session
                </button>
              )}
            </div>
          )}
          
          {/* OVERVIEW CARDS */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              marginBottom: '16px'
            }}>
              📚 Your Reading Overview
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {quickStats.booksThisYear}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  Books Read
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {quickStats.currentStreak}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  Day Streak
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {quickStats.saintsUnlocked}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  Saints
                </div>
              </div>
            </div>

            {/* Goal Progress */}
            <div style={{
              backgroundColor: `${currentTheme.primary}20`,
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary,
                marginBottom: '8px'
              }}>
                Goal Progress: {quickStats.booksThisYear}/{quickStats.personalGoal}
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#E0E0E0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${quickStats.goalProgress}%`,
                  backgroundColor: currentTheme.primary,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              {quickStats.goalProgress >= 100 && (
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: '#4CAF50',
                  fontWeight: '600',
                  marginTop: '8px'
                }}>
                  🎉 Goal achieved!
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {quickStats.readingHours}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  Hours Read
                </div>
              </div>
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {quickStats.averageSessionLength}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  Avg Minutes
                </div>
              </div>
            </div>

            {/* Next Goal */}
            {quickStats.nextTier && (
              <div style={{
                backgroundColor: `${currentTheme.accent}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  marginBottom: '4px'
                }}>
                  Next Goal: {quickStats.nextTier.books - quickStats.booksThisYear} more books
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 13px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary
                }}>
                  🎯 {quickStats.nextTier.reward}
                </div>
              </div>
            )}
          </div>

          {/* CALL TO ACTION */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              marginBottom: '12px'
            }}>
              📈 Dive Deeper Into Your Stats
            </div>
            <div style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: currentTheme.textSecondary,
              marginBottom: '16px'
            }}>
              Explore detailed analytics, compare with classmates, and discover your reading personality!
            </div>
            <div style={{
              fontSize: 'clamp(11px, 3vw, 12px)',
              color: currentTheme.textSecondary,
              opacity: 0.8
            }}>
              Use the stats dropdown menu above to explore different sections
            </div>
          </div>
        </div>

        {/* FIRST BOOK CELEBRATION MODAL */}
        {showFirstBookCelebration && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '380px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                padding: '30px 20px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Congratulations!
                </h2>
                <p style={{
                  fontSize: '16px',
                  opacity: 0.9,
                  margin: '0'
                }}>
                  You completed your first book!
                </p>
              </div>

              <div style={{ padding: '30px 20px' }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '12px'
                  }}>
                    🏆 Achievement Unlocked!
                  </div>
                  
                  <div style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      📖 Reading Journey Milestone
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textSecondary
                    }}>
                      Keep reading to unlock more achievements and saints!
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFirstBookCelebration}
                  style={{
                    width: '100%',
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  🚀 Continue Reading Journey
                </button>
              </div>
            </div>
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
          }
          
          @media screen and (max-width: 480px) {
            input, textarea, select, button {
              font-size: 16px !important;
            }
          }
          
          /* Smooth scrolling for PWA */
          * {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </>
  );
}
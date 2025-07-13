// pages/student-stats/school-stats.js - Enhanced School-Wide Stats with Real Achievement Tiers
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

export default function SchoolStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  
  // School stats data
  const [schoolOverview, setSchoolOverview] = useState(null);
  const [gradeComparison, setGradeComparison] = useState(null);
  const [readingCulture, setReadingCulture] = useState(null);
  const [schoolRealRewards, setSchoolRealRewards] = useState(null); // NEW!
  const [readingHabits, setReadingHabits] = useState(null);

  // Theme definitions (consistent)
  const themes = useMemo(() => ({
    classic_lux: {
      name: 'Lux Libris Classic',
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
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Main overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal reading progress' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress', current: true },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
    { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '🌍', description: 'Coming soon!', disabled: true },
    { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
    { name: 'Lux DNA Lab', path: '/student-stats/lux-dna-lab', icon: '🧬', description: 'Discover your reading personality' },
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

  // NEW: Calculate School-Wide Real Rewards Tracker (PRIVACY-FIRST)
  const calculateSchoolRealRewards = useCallback(async (studentData) => {
    try {
      const entityId = studentData.entityId;
      const schoolId = studentData.schoolId;
      
      // Get all students in the school
      const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const schoolSnapshot = await getDocs(studentsRef);
      
      // Get all teachers to collect achievement tier definitions
      const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
      const teachersSnapshot = await getDocs(teachersRef);
      
      // Collect all unique achievement tiers across teachers
      const allAchievementTiers = new Map();
      
      teachersSnapshot.forEach(teacherDoc => {
        const teacherData = teacherDoc.data();
        if (teacherData.achievementTiers && Array.isArray(teacherData.achievementTiers)) {
          teacherData.achievementTiers.forEach(tier => {
            const key = `${tier.books}-${tier.reward}`;
            if (!allAchievementTiers.has(key)) {
              allAchievementTiers.set(key, {
                books: tier.books,
                reward: tier.reward,
                type: tier.type || 'basic',
                count: 0,
                percentage: 0,
                gradeBreakdown: {}
              });
            }
          });
        }
      });
      
      // Count how many students school-wide have reached each tier
      let totalSchoolStudents = 0;
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      let studentEarnedTiers = [];
      
      schoolSnapshot.forEach(studentDoc => {
        const student = studentDoc.data();
        totalSchoolStudents++;
        const studentBooksCount = student.booksSubmittedThisYear || 0;
        const studentGrade = student.grade || 'Unknown';
        
        // Check which tiers this student has achieved
        allAchievementTiers.forEach((tier, key) => {
          if (studentBooksCount >= tier.books) {
            tier.count++;
            
            // Track grade breakdown
            if (!tier.gradeBreakdown[studentGrade]) {
              tier.gradeBreakdown[studentGrade] = 0;
            }
            tier.gradeBreakdown[studentGrade]++;
            
            // Track what the current student has earned
            if (student.uid === studentData.uid) {
              studentEarnedTiers.push({
                books: tier.books,
                reward: tier.reward,
                type: tier.type
              });
            }
          }
        });
      });
      
      // Calculate percentages and sort by book count
      const tierArray = Array.from(allAchievementTiers.values())
        .map(tier => ({
          ...tier,
          percentage: totalSchoolStudents > 0 ? Math.round((tier.count / totalSchoolStudents) * 100) : 0
        }))
        .sort((a, b) => a.books - b.books);
      
      // Sort student's earned tiers
      studentEarnedTiers.sort((a, b) => a.books - b.books);
      
      setSchoolRealRewards({
        schoolTiers: tierArray,
        totalSchoolStudents,
        studentEarnedTiers,
        studentBooks,
        encouragingMessage: studentEarnedTiers.length > 0 ? 
          `You've earned ${studentEarnedTiers.length} real reward${studentEarnedTiers.length !== 1 ? 's' : ''} this year! 🎉` :
          `Keep reading to earn your first real reward! Our school offers amazing prizes! 🎯`
      });
      
    } catch (error) {
      console.error('Error calculating school real rewards:', error);
    }
  }, []);

  // Calculate comprehensive school statistics
  const calculateSchoolStats = useCallback(async (studentData) => {
    try {
      const entityId = studentData.entityId;
      const schoolId = studentData.schoolId;
      
      // Get all students in the school (anonymized)
      const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const schoolSnapshot = await getDocs(studentsRef);
      
      // Aggregate anonymous statistics
      let totalStudents = 0;
      let totalBooksCompleted = 0;
      let totalReadingMinutes = 0;
      let studentsWithRatings = 0;
      let studentsWithNotes = 0;
      let studentsTrackingProgress = 0;
      let studentsWithStreaks = 0;
      const gradeBreakdown = {};
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRatings = 0;
      let totalRatingSum = 0;
      let readingLevelDistribution = {};
      
      // Process each student anonymously
      schoolSnapshot.forEach(doc => {
        const student = doc.data();
        const grade = student.grade;
        
        if (!gradeBreakdown[grade]) {
          gradeBreakdown[grade] = { 
            students: 0, 
            totalBooks: 0, 
            averageBooks: 0,
            activeReaders: 0
          };
        }
        
        totalStudents++;
        gradeBreakdown[grade].students++;
        
        // Books completed
        const studentBooks = student.booksSubmittedThisYear || 0;
        totalBooksCompleted += studentBooks;
        gradeBreakdown[grade].totalBooks += studentBooks;
        
        // Reading level distribution
        const readingLevel = student.currentReadingLevel || 'faithful_flame';
        readingLevelDistribution[readingLevel] = (readingLevelDistribution[readingLevel] || 0) + 1;
        
        // Reading engagement metrics
        const bookshelf = student.bookshelf || [];
        const hasRatings = bookshelf.some(book => book.rating > 0);
        const hasNotes = bookshelf.some(book => book.notes?.trim());
        const tracksProgress = bookshelf.some(book => book.currentProgress > 0);
        
        if (hasRatings) studentsWithRatings++;
        if (hasNotes) studentsWithNotes++;
        if (tracksProgress) studentsTrackingProgress++;
        
        // Collect ratings for distribution
        bookshelf.forEach(book => {
          if (book.rating && book.rating >= 1 && book.rating <= 5) {
            ratingDistribution[book.rating]++;
            totalRatings++;
            totalRatingSum += book.rating;
          }
        });
        
        // Reading streaks
        const currentStreak = student.currentStreak || 0;
        if (currentStreak >= 3) {
          studentsWithStreaks++;
          gradeBreakdown[grade].activeReaders++;
        }
      });
      
      // Calculate averages for each grade
      Object.keys(gradeBreakdown).forEach(grade => {
        gradeBreakdown[grade].averageBooks = 
          gradeBreakdown[grade].students > 0 ? 
          Math.round((gradeBreakdown[grade].totalBooks / gradeBreakdown[grade].students) * 10) / 10 : 0;
      });
      
      const schoolAverage = totalStudents > 0 ? Math.round((totalBooksCompleted / totalStudents) * 10) / 10 : 0;
      const averageRating = totalRatings > 0 ? Math.round((totalRatingSum / totalRatings) * 10) / 10 : 0;
      
      setSchoolOverview({
        totalStudents,
        totalBooksCompleted,
        schoolAverage,
        totalReadingMinutes,
        schoolName: studentData.schoolName || 'Your School'
      });
      
      setGradeComparison({
        gradeBreakdown: Object.entries(gradeBreakdown)
          .map(([grade, data]) => ({ grade: parseInt(grade), ...data }))
          .sort((a, b) => a.grade - b.grade)
      });
      
      setReadingCulture({
        ratingParticipation: Math.round((studentsWithRatings / totalStudents) * 100),
        notesParticipation: Math.round((studentsWithNotes / totalStudents) * 100),
        progressTracking: Math.round((studentsTrackingProgress / totalStudents) * 100),
        activeReaders: Math.round((studentsWithStreaks / totalStudents) * 100),
        averageRating,
        ratingDistribution,
        readingLevelDistribution
      });
      
      // Calculate reading habits patterns
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      // Get recent sessions data for habit analysis
      const sessionsPromises = [];
      schoolSnapshot.forEach(doc => {
        const student = doc.data();
        const sessionsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students/${student.id || doc.id}/readingSessions`);
        sessionsPromises.push(getDocs(sessionsRef));
      });
      
      try {
        const allSessionsSnapshots = await Promise.all(sessionsPromises);
        let totalSessions = 0;
        let completedSessions = 0;
        let totalMinutesLogged = 0;
        const timeOfDayPattern = { morning: 0, afternoon: 0, evening: 0 };
        
        allSessionsSnapshots.forEach(sessionsSnapshot => {
          sessionsSnapshot.forEach(sessionDoc => {
            const session = sessionDoc.data();
            totalSessions++;
            totalMinutesLogged += session.duration || 0;
            
            if (session.completed) completedSessions++;
            
            // Analyze time patterns (simplified)
            const sessionDate = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
            if (sessionDate) {
              const hour = sessionDate.getHours();
              if (hour >= 6 && hour < 12) timeOfDayPattern.morning++;
              else if (hour >= 12 && hour < 17) timeOfDayPattern.afternoon++;
              else timeOfDayPattern.evening++;
            }
          });
        });
        
        setReadingHabits({
          totalSessions,
          completedSessions,
          completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
          averageSessionLength: totalSessions > 0 ? Math.round(totalMinutesLogged / totalSessions) : 0,
          timeOfDayPattern,
          totalMinutesLogged
        });
      } catch (sessionError) {
        console.log('Could not load detailed session data:', sessionError);
        setReadingHabits({
          totalSessions: 0,
          completedSessions: 0,
          completionRate: 0,
          averageSessionLength: 0,
          timeOfDayPattern: { morning: 0, afternoon: 0, evening: 0 },
          totalMinutesLogged: 0
        });
      }
      
    } catch (error) {
      console.error('Error calculating school stats:', error);
    }
  }, []);

  // Load student data and calculate school stats
  const loadData = useCallback(async () => {
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
      
      // Calculate school statistics
      await calculateSchoolStats(firebaseStudentData);
      
      // NEW: Calculate school-wide real rewards
      await calculateSchoolRealRewards(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, calculateSchoolStats, calculateSchoolRealRewards]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadData]);

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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading school-wide stats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>School Stats - Lux Libris</title>
        <meta name="description" content="School-wide reading progress and culture analytics" />
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
              <span style={{ fontSize: '18px' }}>🏫</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>School Stats</span>
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

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* SCHOOL CELEBRATION */}
          {schoolOverview && (
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
                🏫 {schoolOverview.schoolName} is Amazing!
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(48px, 15vw, 64px)',
                  marginBottom: '12px'
                }}>
                  🎉
                </div>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  {schoolOverview.totalBooksCompleted}
                </div>
                <div style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  Books Read Together This Year!
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary
                }}>
                  What an incredible reading community! 📚✨
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div style={{
                  backgroundColor: `${currentTheme.secondary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(20px, 6vw, 24px)',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {schoolOverview.totalStudents}
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: currentTheme.textSecondary
                  }}>
                    Amazing Readers
                  </div>
                </div>
                <div style={{
                  backgroundColor: `${currentTheme.secondary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(20px, 6vw, 24px)',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {schoolOverview.schoolAverage}
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: currentTheme.textSecondary
                  }}>
                    Books Each on Average!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NEW: SCHOOL-WIDE REAL REWARDS TRACKER */}
          {schoolRealRewards && schoolRealRewards.schoolTiers.length > 0 && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 16px 0'
              }}>
                🎯 School-Wide Real Rewards Tracker
              </h3>
              
              <div style={{
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textPrimary,
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  {schoolRealRewards.encouragingMessage}
                </div>
              </div>
              
              {schoolRealRewards.schoolTiers.map((tier, index) => {
                const isStudentEarned = schoolRealRewards.studentEarnedTiers.some(earned => 
                  earned.books === tier.books && earned.reward === tier.reward
                );
                
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: isStudentEarned ? 
                        `${currentTheme.primary}30` : 
                        tier.count > 0 ? `${currentTheme.primary}20` : `${currentTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: index < schoolRealRewards.schoolTiers.length - 1 ? '8px' : '0',
                      border: isStudentEarned ? `2px solid ${currentTheme.primary}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        color: currentTheme.textPrimary,
                        marginBottom: '2px'
                      }}>
                        {tier.reward}
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: currentTheme.textSecondary,
                        marginBottom: '4px'
                      }}>
                        {tier.books} books to unlock
                        {isStudentEarned && (
                          <span style={{
                            color: currentTheme.primary,
                            fontWeight: '600',
                            marginLeft: '8px'
                          }}>
                            - YOU EARNED THIS! 🎉
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        fontWeight: '600',
                        color: tier.count > 0 ? '#4CAF50' : currentTheme.textSecondary
                      }}>
                        🎯 {tier.count} of {schoolRealRewards.totalSchoolStudents} students earned this ({tier.percentage}%)
                      </div>
                    </div>
                    
                    <div style={{
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(20px, 6vw, 24px)'
                      }}>
                        {isStudentEarned ? '🏆' : tier.count > 0 ? '🎯' : '⭕'}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  These are the REAL rewards your teachers give out across our entire school! 🌟
                </div>
              </div>
            </div>
          )}

          {/* GRADE SUPERSTARS */}
          {gradeComparison && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 16px 0'
              }}>
                🌟 Every Grade is Fantastic!
              </h3>
              
              {gradeComparison.gradeBreakdown.map((grade, index) => {
                // Find something positive to highlight about each grade
                let gradeHighlight = '';
                let gradeEmoji = '';
                
                if (grade.averageBooks >= Math.max(...gradeComparison.gradeBreakdown.map(g => g.averageBooks))) {
                  gradeHighlight = 'Most books per student!';
                  gradeEmoji = '📚';
                } else if (grade.activeReaders >= Math.max(...gradeComparison.gradeBreakdown.map(g => g.activeReaders))) {
                  gradeHighlight = 'Amazing daily readers!';
                  gradeEmoji = '🔥';
                } else if (grade.totalBooks >= Math.max(...gradeComparison.gradeBreakdown.map(g => g.totalBooks))) {
                  gradeHighlight = 'Most total books read!';
                  gradeEmoji = '🏆';
                } else if (grade.students >= Math.max(...gradeComparison.gradeBreakdown.map(g => g.students))) {
                  gradeHighlight = 'Largest reading community!';
                  gradeEmoji = '👥';
                } else {
                  gradeHighlight = 'Incredible readers!';
                  gradeEmoji = '⭐';
                }
                
                return (
                  <div
                    key={grade.grade}
                    style={{
                      backgroundColor: grade.grade === studentData.grade ? 
                        `${currentTheme.primary}30` : `${currentTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: index < gradeComparison.gradeBreakdown.length - 1 ? '8px' : '0',
                      border: grade.grade === studentData.grade ? 
                        `2px solid ${currentTheme.primary}` : 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: '600',
                        color: currentTheme.textPrimary
                      }}>
                        Grade {grade.grade} {gradeEmoji}
                        {grade.grade === studentData.grade && (
                          <span style={{
                            fontSize: 'clamp(10px, 3vw, 11px)',
                            color: currentTheme.primary,
                            fontWeight: '600',
                            marginLeft: '8px'
                          }}>
                            (YOUR GRADE!)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.primary,
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      {gradeHighlight}
                    </div>
                    
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: currentTheme.textSecondary
                    }}>
                      {grade.students} students • {grade.totalBooks} total books • {grade.averageBooks} average each
                    </div>
                  </div>
                );
              })}
              
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  Every grade brings something special to our reading community! 🌈
                </div>
              </div>
            </div>
          )}

          {/* SCHOOL READING SUPERPOWERS - DYNAMIC! */}
          {readingCulture && readingCulture.superpowers && readingCulture.superpowers.length > 0 && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 16px 0'
              }}>
                ⭐ Our School's Reading Superpowers!
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: readingCulture.superpowers.length === 1 ? '1fr' : '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {readingCulture.superpowers.map((superpower, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: `${currentTheme.primary}20`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      fontSize: 'clamp(20px, 6vw, 24px)',
                      marginBottom: '4px'
                    }}>
                      {superpower.name.split(' ')[0]} {/* Extract emoji */}
                    </div>
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.textPrimary,
                      fontWeight: '600',
                      marginBottom: '2px'
                    }}>
                      {superpower.name.substring(2)} {/* Remove emoji and space */}
                    </div>
                    <div style={{
                      fontSize: 'clamp(9px, 2.5vw, 10px)',
                      color: currentTheme.textSecondary,
                      marginBottom: superpower.hasIt ? '4px' : '0'
                    }}>
                      {superpower.description}
                    </div>
                    {superpower.hasIt && (
                      <div style={{
                        fontSize: 'clamp(8px, 2.5vw, 9px)',
                        color: currentTheme.primary,
                        fontWeight: '600'
                      }}>
                        YOU TOO! {superpower.name.split(' ')[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.primary}10`,
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  fontStyle: 'italic'
                }}>
                  Our school has incredible reading superpowers! Keep building our reading community! 🌟
                </div>
              </div>
            </div>
          )}

          {/* SCHOOL'S FAVORITE BOOK */}
          {readingCulture && readingCulture.schoolFavoriteBook && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 16px 0'
              }}>
                📚 Our School's Favorite Book
              </h3>
              
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '80px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {readingCulture.schoolFavoriteBook.coverImageUrl ? (
                    <img 
                      src={readingCulture.schoolFavoriteBook.coverImageUrl} 
                      alt={readingCulture.schoolFavoriteBook.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '24px' }}>📚</span>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '4px',
                    lineHeight: '1.2'
                  }}>
                    {readingCulture.schoolFavoriteBook.title}
                  </div>
                  <div style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    color: currentTheme.textSecondary,
                    marginBottom: '8px',
                    fontStyle: 'italic'
                  }}>
                    by {readingCulture.schoolFavoriteBook.authors}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>⭐</span>
                    <span style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary
                    }}>
                      {readingCulture.schoolFavoriteBook.averageRating}/5.0
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: currentTheme.textSecondary
                  }}>
                    from {readingCulture.schoolFavoriteBook.ratingCount} students
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QUICK LINKS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => router.push('/student-stats/my-stats')}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.textPrimary,
                border: 'none',
                borderRadius: '16px',
                padding: '14px 16px',
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              📈 My Personal Stats
            </button>
            
            <button
              onClick={() => router.push('/student-stats/grade-stats')}
              style={{
                backgroundColor: currentTheme.secondary,
                color: currentTheme.textPrimary,
                border: 'none',
                borderRadius: '16px',
                padding: '14px 16px',
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              🎓 Grade Stats
            </button>
          </div>
        </div>

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
        `}</style>
      </div>
    </>
  );
}
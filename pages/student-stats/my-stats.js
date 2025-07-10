// pages/student-stats/my-stats.js - Updated with Header Dropdown Navigation
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities, updateStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

export default function MyStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showBraggingRights, setShowBraggingRights] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  
  // Stats data
  const [personalStats, setPersonalStats] = useState(null);
  const [readingQuality, setReadingQuality] = useState(null);
  const [saintsStats, setSaintsStats] = useState(null);
  const [realWorldAchievements, setRealWorldAchievements] = useState([]);
  const [medalAchievements, setMedalAchievements] = useState([]);

  // Theme definitions (consistent with original)
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
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Main overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal reading progress', current: true },
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

  // Utility function for date strings (matching healthy habits smart logic)
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Smart streak calculation (SAME LOGIC AS HEALTHY HABITS)
  const calculateSmartStreak = useCallback((completedSessionsByDate, todayStr) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    let streakCount = 0;
    let checkDate;

    // Start from today if completed, otherwise start from yesterday
    if (completedSessionsByDate[todayStr]) {
      checkDate = new Date(today);
    } else if (completedSessionsByDate[yesterdayStr]) {
      checkDate = new Date(yesterday);
    } else {
      return 0;
    }

    // Count consecutive days backwards
    while (streakCount < 365) {
      const dateStr = getLocalDateString(checkDate);
      if (completedSessionsByDate[dateStr]) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streakCount;
  }, []);

  // Calculate medal achievements (ANONYMOUS - no access to other student data)
  const calculateMedalAchievements = useCallback(async (studentData) => {
    try {
      const medals = [];
      
      // Sample medal achievements based on student's current progress
      const currentBooks = studentData.booksSubmittedThisYear || 0;
      const studentGrade = studentData.grade;
      
      // Add sample medals based on progress
      if (currentBooks >= 5) {
        medals.push({
          type: 'tier',
          rank: 2,
          medalType: 'silver',
          emoji: '🥈',
          achievement: 'Second to reach 5 books school-wide!',
          description: 'Reading milestone achievement',
          totalAchievers: 34
        });
      }
      
      if (currentBooks >= 10) {
        medals.push({
          type: 'tier_grade',
          rank: 1,
          medalType: 'gold',
          emoji: '🥇',
          achievement: `First in Grade ${studentGrade} to reach 10 books!`,
          description: 'Grade-level milestone',
          totalAchievers: 5
        });
      }
      
      setMedalAchievements(medals.slice(0, 6));
      
    } catch (error) {
      console.error('Error calculating medal achievements:', error);
      setMedalAchievements([]);
    }
  }, []);

  // Calculate personal stats with SMART STREAK LOGIC
  const calculatePersonalStats = useCallback(async (studentData) => {
    try {
      const bookshelf = studentData.bookshelf || [];
      const completedBooks = bookshelf.filter(book => book.completed && book.status === 'completed');
      const achievementTiers = studentData.achievementTiers || [];
      
      // Get reading sessions for streak and habits
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      let totalReadingMinutes = 0;
      let completedSessions = 0;
      const completedSessionsByDate = {};
      
      sessionsSnapshot.forEach(doc => {
        const session = doc.data();
        totalReadingMinutes += session.duration || 0;
        if (session.completed) completedSessions++;
        
        // Only count COMPLETED sessions (20+ min) for streaks
        if (session.completed === true) {
          completedSessionsByDate[session.date] = true;
        }
      });
      
      // Calculate current streak using SMART LOGIC
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const currentStreak = calculateSmartStreak(completedSessionsByDate, todayStr);
      
      // Determine streak tier
      let streakTier = 'Getting Started';
      if (currentStreak >= 100) {
        streakTier = '🔥🔥🔥 Legendary Flame';
      } else if (currentStreak >= 30) {
        streakTier = '🔥🔥 Blazing Reader';
      } else if (currentStreak >= 7) {
        streakTier = '🔥 Fire Reader';
      } else if (currentStreak >= 3) {
        streakTier = '✨ Spark Starter';
      }
      
      // Determine which achievement tiers have been reached
      const booksThisYear = studentData.booksSubmittedThisYear || 0;
      const achievedTiers = achievementTiers.filter(tier => booksThisYear >= tier.books);
      const nextTier = achievementTiers.find(tier => booksThisYear < tier.books);
      
      // Reading habits analysis
      const averageSessionLength = completedSessions > 0 ? Math.round(totalReadingMinutes / completedSessions) : 0;
      const readingDays = Object.keys(completedSessionsByDate).length;
      
      setPersonalStats({
        booksThisYear,
        lifetimeBooks: studentData.lifetimeBooksSubmitted || 0,
        personalGoal: studentData.personalGoal || 15,
        currentStreak,
        longestStreak: Math.max(studentData.longestStreak || 0, currentStreak),
        totalReadingMinutes,
        averageSessionLength,
        readingDays,
        completedSessions,
        achievedTiers,
        nextTier,
        achievementTiers,
        saintsUnlocked: (studentData.unlockedSaints || []).length,
        streakTier,
        currentReadingLevel: studentData.currentReadingLevel || 'faithful_flame'
      });
      
    } catch (error) {
      console.error('Error calculating personal stats:', error);
    }
  }, [calculateSmartStreak]);

  // Calculate reading quality stats
  const calculateReadingQuality = useCallback((studentData) => {
    try {
      const bookshelf = studentData.bookshelf || [];
      const ratedBooks = bookshelf.filter(book => book.rating && book.rating > 0);
      
      if (ratedBooks.length === 0) {
        setReadingQuality({
          averageRating: 0,
          totalRated: 0,
          favoriteRating: 0,
          readingMoods: 'Just getting started!'
        });
        return;
      }
      
      const totalRating = ratedBooks.reduce((sum, book) => sum + book.rating, 0);
      const averageRating = totalRating / ratedBooks.length;
      const favoriteBooks = ratedBooks.filter(book => book.rating === 5);
      
      // Determine reading personality based on ratings
      let readingMoods = '';
      if (averageRating >= 4.5) {
        readingMoods = 'Book Lover Extraordinaire! 📚✨';
      } else if (averageRating >= 4.0) {
        readingMoods = 'Enthusiastic Reader! 🌟';
      } else if (averageRating >= 3.5) {
        readingMoods = 'Thoughtful Critic 🤔';
      } else if (averageRating >= 3.0) {
        readingMoods = 'Selective Reader 📖';
      } else {
        readingMoods = 'Finding Your Favorites 🔍';
      }
      
      setReadingQuality({
        averageRating: Math.round(averageRating * 10) / 10,
        totalRated: ratedBooks.length,
        favoriteBooks: favoriteBooks.length,
        fiveStarPercentage: Math.round((favoriteBooks.length / ratedBooks.length) * 100),
        readingMoods
      });
      
    } catch (error) {
      console.error('Error calculating reading quality:', error);
    }
  }, []);

  // Calculate saints collection stats
  const calculateSaintsStats = useCallback(async (studentData) => {
    try {
      const saintsRef = collection(db, 'saints');
      const saintsSnapshot = await getDocs(saintsRef);
      const allSaints = [];
      saintsSnapshot.forEach(doc => {
        allSaints.push({ id: doc.id, ...doc.data() });
      });
      
      const unlockedSaintIds = studentData.unlockedSaints || [];
      const unlockedSaints = allSaints.filter(saint => unlockedSaintIds.includes(saint.id));
      
      // Group by rarity
      const rarityGroups = {
        common: unlockedSaints.filter(s => s.rarity === 'common').length,
        rare: unlockedSaints.filter(s => s.rarity === 'rare').length,
        legendary: unlockedSaints.filter(s => s.rarity === 'legendary').length,
        seasonal: unlockedSaints.filter(s => s.rarity === 'seasonal').length,
        grade_exclusive: unlockedSaints.filter(s => s.rarity?.includes('grade_exclusive')).length,
        marian: unlockedSaints.filter(s => s.luxlings_series === 'Mini Marians').length,
        ultimate: unlockedSaints.filter(s => s.luxlings_series === 'Ultimate Redeemer').length
      };
      
      // Find rarest saint unlocked
      let rarestSaint = null;
      const rarityOrder = ['ultimate', 'marian', 'legendary', 'seasonal', 'rare', 'grade_exclusive', 'common'];
      for (const rarity of rarityOrder) {
        const saintsOfRarity = unlockedSaints.filter(s => {
          if (rarity === 'ultimate') return s.luxlings_series === 'Ultimate Redeemer';
          if (rarity === 'marian') return s.luxlings_series === 'Mini Marians';
          if (rarity === 'grade_exclusive') return s.rarity?.includes('grade_exclusive');
          return s.rarity === rarity;
        });
        if (saintsOfRarity.length > 0) {
          rarestSaint = saintsOfRarity[0];
          break;
        }
      }
      
      setSaintsStats({
        totalUnlocked: unlockedSaintIds.length,
        totalAvailable: allSaints.length,
        percentage: Math.round((unlockedSaintIds.length / allSaints.length) * 100),
        rarityGroups,
        rarestSaint,
        recentUnlocks: unlockedSaints.slice(-3)
      });
      
    } catch (error) {
      console.error('Error calculating saints stats:', error);
    }
  }, []);

  // Calculate real world achievements earned
  const calculateRealWorldAchievements = useCallback((studentData) => {
    try {
      const achievementTiers = studentData.achievementTiers || [];
      const booksThisYear = studentData.booksSubmittedThisYear || 0;
      const earnedAchievements = [];
      
      achievementTiers.forEach((tier, index) => {
        if (booksThisYear >= tier.books) {
          earnedAchievements.push({
            tier: index + 1,
            books: tier.books,
            reward: tier.reward,
            type: tier.type,
            earned: true,
            earnedDate: studentData.lastAchievementUpdate || 'This year'
          });
        }
      });
      
      setRealWorldAchievements(earnedAchievements);
    } catch (error) {
      console.error('Error calculating real world achievements:', error);
    }
  }, []);

  // Generate bragging rights certificate data
  const generateBraggingRights = useCallback(() => {
    if (!personalStats || !saintsStats || !readingQuality) return null;
    
    const achievements = [];
    
    // Medal achievements first
    medalAchievements.forEach(medal => {
      achievements.push(`${medal.emoji} ${medal.achievement}`);
    });
    
    // Top reading achievement
    if (personalStats.booksThisYear >= personalStats.personalGoal) {
      achievements.push(`🎯 Reached ${personalStats.booksThisYear}-book goal!`);
    } else if (personalStats.booksThisYear > 0) {
      achievements.push(`📚 Read ${personalStats.booksThisYear} book${personalStats.booksThisYear > 1 ? 's' : ''} this year!`);
    }
    
    // Streak achievement
    if (personalStats.currentStreak >= 7) {
      achievements.push(`${personalStats.streakTier} (${personalStats.currentStreak} days)!`);
    }
    
    // Reading Level Achievement
    if (personalStats.currentReadingLevel === 'luminous_legend') {
      achievements.push(`✨ Luminous Legend level achieved!`);
    } else if (personalStats.currentReadingLevel === 'radiant_reader') {
      achievements.push(`🌟 Radiant Reader level achieved!`);
    }
    
    // Saints achievement
    if (saintsStats.rarestSaint) {
      if (saintsStats.rarestSaint.luxlings_series === 'Ultimate Redeemer') {
        achievements.push(`✨ ULTIMATE GOAL achieved!`);
      } else if (saintsStats.rarestSaint.rarity === 'legendary') {
        achievements.push(`⚡ Legendary saint unlocked!`);
      }
    }
    
    if (saintsStats.totalUnlocked >= 10) {
      achievements.push(`♔ ${saintsStats.totalUnlocked} saints collected!`);
    }
    
    // Reading quality
    if (readingQuality.averageRating >= 4.5) {
      achievements.push(`⭐ Book Lover (${readingQuality.averageRating}/5 avg rating)!`);
    }
    
    return {
      topAchievements: achievements.slice(0, 6),
      studentName: `${studentData.firstName} ${studentData.lastInitial}`,
      schoolName: studentData.schoolName,
      grade: studentData.grade,
      date: new Date().toLocaleDateString(),
      saintsCount: saintsStats.totalUnlocked,
      featuredSaint: saintsStats.rarestSaint,
      medalCount: medalAchievements.length,
      readingLevel: personalStats.currentReadingLevel
    };
  }, [personalStats, saintsStats, readingQuality, medalAchievements, studentData]);

  // Load all stats data
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
      
      // Calculate all stats
      await calculatePersonalStats(firebaseStudentData);
      calculateReadingQuality(firebaseStudentData);
      await calculateSaintsStats(firebaseStudentData);
      calculateRealWorldAchievements(firebaseStudentData);
      await calculateMedalAchievements(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading stats data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, calculatePersonalStats, calculateReadingQuality, calculateSaintsStats, calculateRealWorldAchievements, calculateMedalAchievements]);

  // Load initial data
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadStatsData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadStatsData]);

  // Handle certificate download
  const handleDownloadCertificate = async () => {
    setIsGeneratingCertificate(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const braggingData = generateBraggingRights();
      if (braggingData) {
        const certificateText = `
🏆 READING ACHIEVEMENT CERTIFICATE 🏆

${braggingData.studentName}
Grade ${braggingData.grade} • ${braggingData.schoolName}

🌟 TOP ACHIEVEMENTS 🌟
${braggingData.topAchievements.map(achievement => `• ${achievement}`).join('\n')}

📊 STATS SUMMARY:
• Saints Collected: ${braggingData.saintsCount}/137
• Medals Earned: ${braggingData.medalCount}
• Reading Level: ${braggingData.readingLevel}
• Generated: ${braggingData.date}

🎉 Keep reading and unlocking more achievements!
        `;
        
        const blob = new Blob([certificateText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${braggingData.studentName.replace(' ', '_')}_Reading_Certificate.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
    
    setIsGeneratingCertificate(false);
  };

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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your personal stats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Personal Stats - Lux Libris</title>
        <meta name="description" content="Your detailed personal reading statistics and achievements" />
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
              <span style={{ fontSize: '18px' }}>📈</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>My Stats</span>
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
          
          {/* PERSONAL OVERVIEW */}
          {personalStats && (
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
                📚 Your Reading Journey
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
                    {personalStats.booksThisYear}
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 11px)',
                    color: currentTheme.textSecondary
                  }}>
                    Books This Year
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: 'clamp(20px, 6vw, 24px)',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {personalStats.currentStreak}
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
                    {Math.round(personalStats.totalReadingMinutes / 60)}
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 11px)',
                    color: currentTheme.textSecondary
                  }}>
                    Hours Read
                  </div>
                </div>
              </div>

              {/* Streak Tier */}
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(13px, 4vw, 14px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary
                }}>
                  {personalStats.streakTier}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  Current Reading Level
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowBraggingRights(true)}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
                    fontSize: 'clamp(11px, 3.5vw, 13px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  🏆 Bragging Rights
                </button>
                
                <button
                  onClick={() => router.push('/student-stats/school-stats')}
                  style={{
                    backgroundColor: currentTheme.secondary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
                    fontSize: 'clamp(11px, 3.5vw, 13px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  🏫 School Stats
                </button>
              </div>
            </div>
          )}

          {/* MEDAL ACHIEVEMENTS */}
          {medalAchievements.length > 0 && (
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
                🏅 Competition Medals
              </h3>
              
              {medalAchievements.map((medal, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: index < medalAchievements.length - 1 ? '8px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    fontSize: 'clamp(20px, 6vw, 24px)',
                    flexShrink: 0
                  }}>
                    {medal.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '2px'
                    }}>
                      {medal.achievement}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: currentTheme.textSecondary
                    }}>
                      {medal.type === 'book' ? 'Book Medal' : 'Milestone Medal'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* READING HABITS */}
          {personalStats && (
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
                📈 Reading Habits
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(16px, 5vw, 18px)',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {personalStats.readingDays}
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 11px)',
                    color: currentTheme.textSecondary
                  }}>
                    Days Reading
                  </div>
                </div>
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(16px, 5vw, 18px)',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {personalStats.averageSessionLength}
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 11px)',
                    color: currentTheme.textSecondary
                  }}>
                    Avg Minutes
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* READING QUALITY */}
          {readingQuality && readingQuality.totalRated > 0 && (
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
                ⭐ Reading Quality
              </h3>
              
              <div style={{
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  marginBottom: '8px'
                }}>
                  {'⭐'.repeat(Math.round(readingQuality.averageRating))}
                </div>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {readingQuality.averageRating}/5.0 Average
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textPrimary,
                  fontWeight: '500'
                }}>
                  {readingQuality.readingMoods}
                </div>
              </div>
            </div>
          )}

          {/* SAINTS COLLECTION */}
          {saintsStats && (
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
                ♔ Saints Collection
              </h3>
              
              <div style={{
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {saintsStats.totalUnlocked}/137
                </div>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  marginBottom: '12px'
                }}>
                  Saints Unlocked ({saintsStats.percentage}%)
                </div>
                
                <div style={{
                  height: '8px',
                  backgroundColor: '#E0E0E0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${saintsStats.percentage}%`,
                    backgroundColor: currentTheme.primary,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              
              {saintsStats.rarestSaint && (
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: currentTheme.textSecondary,
                    marginBottom: '4px'
                  }}>
                    Rarest Saint Unlocked
                  </div>
                  <div style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    color: currentTheme.textPrimary
                  }}>
                    {saintsStats.rarestSaint.name}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REAL WORLD ACHIEVEMENTS */}
          {realWorldAchievements.length > 0 && (
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
                🏆 Real World Achievements
              </h3>
              
              {realWorldAchievements.map((achievement, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: index < realWorldAchievements.length - 1 ? '8px' : '0',
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
                      {achievement.reward}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: currentTheme.textSecondary
                    }}>
                      {achievement.books} book{achievement.books > 1 ? 's' : ''} • Tier {achievement.tier}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 'clamp(16px, 5vw, 20px)',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}>
                    🏆
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NEXT GOALS */}
          {personalStats && personalStats.nextTier && (
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
                🎯 Next Goal
              </h3>
              
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {personalStats.nextTier.books - personalStats.booksThisYear} more books
                </div>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  marginBottom: '8px'
                }}>
                  to earn: {personalStats.nextTier.reward}
                </div>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textPrimary,
                  fontStyle: 'italic'
                }}>
                  You are {Math.round((personalStats.booksThisYear / personalStats.nextTier.books) * 100)}% there!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BRAGGING RIGHTS MODAL */}
        {showBraggingRights && (() => {
          const braggingData = generateBraggingRights();
          
          return (
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
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                <button
                  onClick={() => setShowBraggingRights(false)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  ✕
                </button>

                <div style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  borderRadius: '20px 20px 0 0',
                  padding: '20px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: '12px' }}>🏆</div>
                  <h2 style={{
                    fontSize: 'clamp(18px, 5vw, 20px)',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    Bragging Rights Certificate
                  </h2>
                  <p style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    opacity: 0.9,
                    margin: '0'
                  }}>
                    {braggingData?.studentName} • Grade {braggingData?.grade}
                  </p>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '16px'
                    }}>
                      🌟 Top Achievements This Year 🌟
                    </div>
                    
                    {braggingData?.topAchievements.map((achievement, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: `${currentTheme.primary}20`,
                          borderRadius: '12px',
                          padding: '12px',
                          marginBottom: '8px',
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          textAlign: 'left'
                        }}
                      >
                        {achievement}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleDownloadCertificate}
                    disabled={isGeneratingCertificate}
                    style={{
                      width: '100%',
                      backgroundColor: currentTheme.primary,
                      color: currentTheme.textPrimary,
                      border: 'none',
                      borderRadius: '16px',
                      padding: '16px',
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      cursor: isGeneratingCertificate ? 'not-allowed' : 'pointer',
                      opacity: isGeneratingCertificate ? 0.7 : 1,
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isGeneratingCertificate ? '⏳ Generating...' : '📄 Download Certificate'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
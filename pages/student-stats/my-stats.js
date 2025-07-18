// pages/student-stats/my-stats.js - Updated with Phase Awareness and Enhanced Bragging Rights

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usePhaseAccess } from '../../hooks/usePhaseAccess'; // ADDED PHASE ACCESS
import { getStudentDataEntities, updateStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import { getGradeLeaderboard } from '../../lib/leaderboard-system';
import { calculateReadingPersonality } from '../../lib/reading-personality';
import { getCurrentWeekBadge, getBadgeProgress, getEarnedBadges, getLevelProgress, BADGE_CALENDAR } from '../../lib/badge-system';
import EnhancedBraggingRightsModal from '../../components/EnhancedBraggingRightsModal';

export default function MyStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess(); // ADDED PHASE ACCESS
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showBraggingRights, setShowBraggingRights] = useState(false);
  
  // Enhanced features for personal deep dive
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardUnlocked, setLeaderboardUnlocked] = useState(false);
  const [parentCode, setParentCode] = useState('');
  const [showParentCodeInput, setShowParentCodeInput] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [readingPersonality, setReadingPersonality] = useState(null);
  const [levelProgress, setLevelProgress] = useState(null);
  const [currentWeekBadge, setCurrentWeekBadge] = useState(null);
  
  // Badge Modal
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  
  // Bird Fact Modal states
  const [showBirdFactModal, setShowBirdFactModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Stats data
  const [personalStats, setPersonalStats] = useState(null);
  const [readingQuality, setReadingQuality] = useState(null);
  const [saintsStats, setSaintsStats] = useState(null);
  const [realWorldAchievements, setRealWorldAchievements] = useState([]);
  const [medalAchievements, setMedalAchievements] = useState([]);
  const [expandedAchievements, setExpandedAchievements] = useState(false);

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

  // UPDATED: Navigation menu items with phase-aware locking
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

  // UPDATED: Stats navigation options with phase-aware Lux DNA messaging
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive', current: true },
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
    { name: 'Family Battle', path: '/student-stats/family-battle', icon: '👨‍👩‍👧‍👦', description: 'Coming soon!', disabled: true }
  ], [phaseData.currentPhase]);

  // Handle badge click function
  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setShowBirdFactModal(true);
  };

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
        setShowBadgeModal(false);
        setShowBirdFactModal(false);
        setShowBraggingRights(false);
        setShowLeaderboard(false);
      }
    };

    if (showNavMenu || showStatsDropdown || showBadgeModal || showBirdFactModal || showBraggingRights || showLeaderboard) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown, showBadgeModal, showBirdFactModal, showBraggingRights, showLeaderboard]);

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

  // Load real leaderboard data
  const loadLeaderboardData = useCallback(async () => {
    if (!studentData || !leaderboardUnlocked) return;
    
    setIsLoadingLeaderboard(true);
    try {
      const rankings = await getGradeLeaderboard(studentData);
      setLeaderboardData(rankings);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboardData([]);
    }
    setIsLoadingLeaderboard(false);
  }, [studentData, leaderboardUnlocked]);

  // Handle leaderboard unlock
  const handleLeaderboardUnlock = async () => {
    try {
      // Get the teacher's parent quiz code (this is the correct one to check)
      const teacherParentCode = studentData.parentQuizCode; // This comes from teacher data
      
      const validCodes = [
        'parent123', // Demo code for testing
        teacherParentCode, // Teacher's actual parent quiz code
        'lux2025' // Global backup code
      ].filter(Boolean);
      
      console.log('Checking parent code:', parentCode);
      console.log('Valid codes:', validCodes);
      
      if (validCodes.includes(parentCode.toUpperCase()) || validCodes.includes(parentCode.toLowerCase())) {
        await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
          leaderboardUnlocked: true,
          leaderboardUnlockedDate: new Date()
        });
        
        setLeaderboardUnlocked(true);
        setShowParentCodeInput(false);
        setParentCode('');
        
        // Load leaderboard data immediately
        const rankings = await getGradeLeaderboard(studentData);
        setLeaderboardData(rankings);
        
        alert('🏆 Leaderboard unlocked! You can now see anonymous grade rankings.');
      } else {
        alert(`❌ Incorrect parent code. Please ask your parent for the code. (Valid: ${teacherParentCode})`);
      }
    } catch (error) {
      console.error('Error unlocking leaderboard:', error);
      alert('❌ Error unlocking leaderboard. Please try again.');
    }
  };

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

  // Calculate real world achievements earned with EXPANDABLE view
  const calculateRealWorldAchievements = useCallback((studentData) => {
    try {
      const achievementTiers = studentData.achievementTiers || [];
      const booksThisYear = studentData.booksSubmittedThisYear || 0;
      const allAchievements = [];
      
      achievementTiers.forEach((tier, index) => {
        const isEarned = booksThisYear >= tier.books;
        const booksNeeded = isEarned ? 0 : tier.books - booksThisYear;
        
        allAchievements.push({
          tier: index + 1,
          books: tier.books,
          reward: tier.reward,
          type: tier.type,
          earned: isEarned,
          booksNeeded,
          earnedDate: isEarned ? (studentData.lastAchievementUpdate || 'This year') : null
        });
      });
      
      setRealWorldAchievements(allAchievements);
    } catch (error) {
      console.error('Error calculating real world achievements:', error);
    }
  }, []);

  // Load leaderboard when unlocked
  useEffect(() => {
    if (leaderboardUnlocked && studentData) {
      loadLeaderboardData();
    }
  }, [leaderboardUnlocked, loadLeaderboardData]);

  // UPDATED: Get phase-specific messaging for the dashboard
  const getPhaseSpecificMessage = () => {
    switch (phaseData.currentPhase) {
      case 'VOTING':
        return "🗳️ This year's reading program is complete! Check out your achievement certificate in Bragging Rights, keep building XP and earning badges, and discover your Lux DNA! Time to vote for your favorites!";
      case 'RESULTS':
        return "🏆 Congratulations on an amazing reading year! Check out your achievement certificate in Bragging Rights, keep building XP and earning badges! Nominees DNA in Lux Lab is now closed for the year.";
      case 'TEACHER_SELECTION':
        return "📊 Your stats will be refreshed for the new program, but don't worry - you'll keep your reading streaks, XP, and Luxlings™! Keep your reading habits strong this week while we prepare amazing new books for you! 📚✨";
      default:
        return null;
    }
  };

  // Load all stats data
  const loadStatsData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      setLeaderboardUnlocked(firebaseStudentData.leaderboardUnlocked || false);
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = themes[selectedThemeKey];
      setCurrentTheme(selectedTheme);
      
      // Load current week's badge challenge
      const weekBadge = getCurrentWeekBadge();
      setCurrentWeekBadge(weekBadge);
      
      // Get earned badges, badge progress, and level progress
      const badges = getEarnedBadges(firebaseStudentData);
      const badgeStats = getBadgeProgress(firebaseStudentData);
      const levelInfo = getLevelProgress(firebaseStudentData.totalXP || 0);
      
      setEarnedBadges(badges);
      setBadgeProgress(badgeStats);
      setLevelProgress(levelInfo);
      
      // Calculate all stats
      await calculatePersonalStats(firebaseStudentData);
      calculateReadingQuality(firebaseStudentData);
      await calculateSaintsStats(firebaseStudentData);
      calculateRealWorldAchievements(firebaseStudentData);
      await calculateMedalAchievements(firebaseStudentData);
      
      // Calculate reading personality
      const personality = await calculateReadingPersonality(firebaseStudentData);
      setReadingPersonality(personality);
      
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
        
        {/* HEADER WITH REORDERED DROPDOWN NAVIGATION */}
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
                    {option.phaseNote && option.name !== 'Lux DNA Lab' && (
                      <span style={{
                        fontSize: '9px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        CLOSED
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* UPDATED: Hamburger Menu with Phase-Aware Locking */}
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

        {/* TEACHER_SELECTION: Show only messaging box */}
        {phaseData.currentPhase === 'TEACHER_SELECTION' ? (
          <div style={{ padding: 'clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              padding: '40px 24px',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚧</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '12px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                New Program Starting Soon!
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '1.5',
                opacity: 0.95
              }}>
                📊 Your stats will be refreshed for the new program, but don&apos;t worry - you&apos;ll keep your reading streaks, XP, and saints! Keep your reading habits strong this week while we prepare amazing new books for you! 📚✨
              </div>
              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => router.push('/student-healthy-habits')}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                >
                  ○ Healthy Habits
                </button>
                <button
                  onClick={() => router.push('/student-saints')}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                >
                  ♔ Saints
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ALL OTHER PHASES: Show normal stats dashboard */
          <>
            {/* NEW: Compact but Beautiful Phase-Specific Alert Banner */}
            {getPhaseSpecificMessage() && (
              <div style={{
                background: phaseData.currentPhase === 'VOTING' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 
                           phaseData.currentPhase === 'RESULTS' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 
                           'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                padding: '12px 16px',
                margin: '0 16px 16px 16px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                animation: 'slideInDown 0.6s ease-out'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {phaseData.currentPhase === 'VOTING' ? '🗳️' : 
                   phaseData.currentPhase === 'RESULTS' ? '🏆' : '🚧'}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {phaseData.currentPhase === 'VOTING' ? 'Voting Time!' :
                   phaseData.currentPhase === 'RESULTS' ? 'Amazing Reading Year!' :
                   'New Program Starting Soon!'}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '400',
                  lineHeight: '1.4',
                  opacity: 0.95
                }}>
                  {getPhaseSpecificMessage()}
                </div>
              </div>
            )}

            {/* MAIN CONTENT */}
            <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
              
              {/* LARGE BADGE PROGRAM SECTION WITH XP & LEVEL */}
              {levelProgress && badgeProgress && (
                <div style={{
                  backgroundColor: currentTheme.surface,
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '20px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '20px'
                  }}>
                    🏆 Badge Program & Level Progress
                  </div>
                  
                  {/* PROMINENT XP & LEVEL DISPLAY */}
                  <div style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: `2px solid ${currentTheme.primary}60`
                  }}>
                    <div style={{
                      fontSize: 'clamp(32px, 10vw, 40px)',
                      fontWeight: 'bold',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      ⚡ {(studentData.totalXP || 0).toLocaleString()} XP
                    </div>
                    
                    <div style={{
                      fontSize: 'clamp(18px, 5vw, 20px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '16px',
                      fontFamily: 'Didot, "Times New Roman", serif'
                    }}>
                      Level {levelProgress.level}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(12px, 3vw, 13px)',
                        color: currentTheme.textSecondary
                      }}>
                        Level {levelProgress.level}
                      </div>
                      <div style={{
                        fontSize: 'clamp(12px, 3vw, 13px)',
                        color: currentTheme.textSecondary
                      }}>
                        Level {levelProgress.level + 1}
                      </div>
                    </div>
                    
                    <div style={{
                      height: '12px',
                      backgroundColor: '#E0E0E0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${levelProgress.percentage}%`,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                        borderRadius: '6px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.textSecondary
                    }}>
                      {levelProgress.toNext} XP to next level
                    </div>
                  </div>

                  {/* BADGE COLLECTION OVERVIEW */}
                  <div style={{
                    backgroundColor: `${currentTheme.secondary}20`,
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(24px, 8vw, 32px)',
                      fontWeight: 'bold',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      {badgeProgress.earned}/{badgeProgress.total}
                    </div>
                    <div style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      color: currentTheme.textPrimary,
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      Badges Collected
                    </div>
                    
                    <div style={{
                      height: '8px',
                      backgroundColor: '#E0E0E0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${badgeProgress.percentage}%`,
                        backgroundColor: currentTheme.secondary,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.textSecondary
                    }}>
                      {badgeProgress.percentage}% complete
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => setShowBadgeModal(true)}
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '14px',
                        padding: 'clamp(10px, 3vw, 12px)',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      🏅 View Badges
                    </button>
                    
                    {/* UPDATED: ENHANCED BRAGGING RIGHTS BUTTON WITH PHASE AWARENESS AND ANIMATIONS */}
                    <button
                      onClick={() => setShowBraggingRights(true)}
                      disabled={!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE'}
                      style={{
                        backgroundColor: (!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 
                          `${currentTheme.textSecondary}30` : currentTheme.secondary,
                        color: (!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 
                          currentTheme.textSecondary : currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '14px',
                        padding: 'clamp(10px, 3vw, 12px)',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: (!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 
                          'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        animation: (hasAccess('votingInterface') || hasAccess('votingResults')) ? 
                          'braggingRightsUnlock 0.8s ease-out 0.6s both, bounce 2s ease-in-out infinite 1.4s' : 
                          'none',
                        position: 'relative',
                        overflow: 'hidden',
                        transform: 'translateY(0)',
                        transition: 'all 0.3s ease',
                        opacity: (!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (hasAccess('votingInterface') || hasAccess('votingResults') || phaseData.currentPhase !== 'ACTIVE') {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {/* SPARKLES FOR UNLOCKED STATE! ✨⭐ */}
                      {(hasAccess('votingInterface') || hasAccess('votingResults')) && (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            fontSize: '8px',
                            animation: 'sparkle 1.5s ease-in-out infinite',
                            pointerEvents: 'none'
                          }}>
                            ✨
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            fontSize: '6px',
                            animation: 'sparkle 1.5s ease-in-out infinite 0.5s',
                            pointerEvents: 'none'
                          }}>
                            ⭐
                          </div>
                        </>
                      )}
                      
                      <span style={{
                        animation: (hasAccess('votingInterface') || hasAccess('votingResults')) ? 
                          'bounce 2s ease-in-out infinite' : 'none'
                      }}>
                        {(!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? '🔒' : '🏆'}
                      </span>
                      {(!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 
                        'Locked' :
                       (hasAccess('votingInterface') || hasAccess('votingResults')) ? 
                        'UNLOCKED!' :
                       'Certificate'}
                    </button>
                    
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      style={{
                        backgroundColor: currentTheme.textPrimary,
                        color: currentTheme.surface,
                        border: 'none',
                        borderRadius: '14px',
                        padding: 'clamp(10px, 3vw, 12px)',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      📊 Rankings
                    </button>
                  </div>
                </div>
              )}

              {/* EXPANDABLE REAL WORLD ACHIEVEMENTS */}
              {realWorldAchievements.length > 0 && (
                <div style={{
                  backgroundColor: currentTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div 
                    onClick={() => setExpandedAchievements(!expandedAchievements)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${currentTheme.primary}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h3 style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      margin: 0,
                      pointerEvents: 'none'
                    }}>
                      🎯 Real World Achievements
                    </h3>
                    <div style={{
                      color: currentTheme.primary,
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      fontWeight: '600',
                      pointerEvents: 'none'
                    }}>
                      {expandedAchievements ? '▼ Show Less' : '▶ Show All'}
                    </div>
                  </div>
                  
                  {(() => {
                    const earnedAchievements = realWorldAchievements.filter(a => a.earned);
                    const unearnedAchievements = realWorldAchievements.filter(a => !a.earned);
                    
                    // Find the next achievement (lowest book requirement among unearned)
                    const nextAchievement = unearnedAchievements.length > 0 
                      ? unearnedAchievements.reduce((next, current) => 
                          current.books < next.books ? current : next
                        )
                      : null;
                    
                    const displayedAchievements = expandedAchievements 
                      ? realWorldAchievements 
                      : earnedAchievements.slice(0, 3);
                    
                    return (
                      <>
                        {displayedAchievements.map((achievement, index) => (
                          <div key={index} style={{
                            backgroundColor: achievement.earned ? 
                              `${currentTheme.primary}30` : `${currentTheme.primary}10`,
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: index < displayedAchievements.length - 1 ? '8px' : '0',
                            border: achievement.earned ? `2px solid ${currentTheme.primary}` : `1px dashed ${currentTheme.primary}60`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
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
                                color: currentTheme.textSecondary,
                                marginBottom: '4px'
                              }}>
                                {achievement.books} books • Tier {achievement.tier}
                              </div>
                              {!achievement.earned && (
                                <div style={{
                                  fontSize: 'clamp(11px, 3vw, 12px)',
                                  fontWeight: '600',
                                  color: '#FF6B35'
                                }}>
                                  📚 Need {achievement.booksNeeded} more book{achievement.booksNeeded !== 1 ? 's' : ''}
                                </div>
                              )}
                              {achievement.earned && (
                                <div style={{
                                  fontSize: 'clamp(11px, 3vw, 12px)',
                                  fontWeight: '600',
                                  color: '#4CAF50'
                                }}>
                                  ✅ Earned! 🎉
                                </div>
                              )}
                            </div>
                            <div style={{
                              fontSize: 'clamp(20px, 6vw, 24px)',
                              flexShrink: 0,
                              marginLeft: '8px'
                            }}>
                              {achievement.earned ? '🏆' : '🎯'}
                            </div>
                          </div>
                        ))}
                        
                        {/* SMART STATUS MESSAGE */}
                        {!expandedAchievements && (
                          <div style={{
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            color: currentTheme.textSecondary,
                            textAlign: 'center',
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: `${currentTheme.primary}10`,
                            borderRadius: '8px'
                          }}>
                            {nextAchievement ? (
                              <>
                                📖 <strong>{nextAchievement.booksNeeded} more book{nextAchievement.booksNeeded !== 1 ? 's' : ''}</strong> needed for next achievement: <strong>{nextAchievement.reward}</strong>
                              </>
                            ) : (
                              <>
                                🎉 <strong>All achievements unlocked!</strong> You&apos;re a reading champion! 🏆
                              </>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* READING PERSONALITY SECTION */}
              {readingPersonality && (
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
                    📖 Your Reading Personality
                  </div>
                  
                  <div style={{
                    backgroundColor: readingPersonality.color + '20',
                    borderRadius: '16px',
                    padding: '16px',
                    border: `2px solid ${readingPersonality.color}60`
                  }}>
                    <div style={{ fontSize: 'clamp(36px, 12vw, 44px)', marginBottom: '12px' }}>
                      {readingPersonality.emoji}
                    </div>
                    <div style={{
                      fontSize: 'clamp(16px, 5vw, 18px)',
                      fontWeight: 'bold',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px',
                      fontFamily: 'Didot, "Times New Roman", serif'
                    }}>
                      You&apos;re {['A', 'E', 'I', 'O', 'U'].includes(readingPersonality.name[0]) ? 'an' : 'a'} {readingPersonality.name}!
                    </div>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      color: currentTheme.textSecondary,
                      marginBottom: '8px'
                    }}>
                      {readingPersonality.description}
                    </div>
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.textSecondary,
                      opacity: 0.8
                    }}>
                      {readingPersonality.percentage}% of your reading happens {readingPersonality.timeRange}
                    </div>
                  </div>
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

                  {/* Streak Display */}
                  <div style={{
                    backgroundColor: `${currentTheme.secondary}20`,
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center'
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
                      {saintsStats.totalUnlocked}/234
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
            </div>
          </>
        )}

        {/* BADGE MODAL WITH CLICKABLE BADGES */}
        {showBadgeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  margin: 0
                }}>
                  🏅 Your Bird Badge Collection
                </h3>
                
                <button
                  onClick={() => setShowBadgeModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: currentTheme.textSecondary
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  {earnedBadges.length} of {Object.keys(BADGE_CALENDAR).length} Lux Libris badges earned ({Math.round((earnedBadges.length / Object.keys(BADGE_CALENDAR).length) * 100)}%)
                </div>
                <div style={{
                  fontSize: '11px',
                  color: currentTheme.textSecondary,
                  marginTop: '4px',
                  opacity: 0.8
                }}>
                  Click any badge to see the bird fact! 🐦
                </div>
              </div>
              
              {earnedBadges.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  {earnedBadges.map((badge, index) => (
                    <div
                      key={index}
                      onClick={() => handleBadgeClick(badge)}
                      style={{
                        backgroundColor: `${currentTheme.primary}15`,
                        borderRadius: '12px',
                        padding: '12px',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `2px solid transparent`,
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = `${currentTheme.primary}25`;
                        e.target.style.borderColor = `${currentTheme.primary}60`;
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = `${currentTheme.primary}15`;
                        e.target.style.borderColor = 'transparent';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: `${currentTheme.primary}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        padding: '8px',
                        position: 'relative'
                      }}>
                        <img 
                          src={`/badges/${badge.pngName}`}
                          alt={badge.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            e.target.src = '/badges/hummingbird.png';
                          }}
                        />
                        {/* Click indicator */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: currentTheme.primary,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          ?
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '2px'
                        }}>
                          {badge.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: currentTheme.textSecondary,
                          marginBottom: '4px'
                        }}>
                          {badge.description}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: currentTheme.primary,
                          fontWeight: '600'
                        }}>
                          Week {badge.week} • {badge.xp} XP • Click for bird fact! 🐦
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏅</div>
                  <div style={{
                    fontSize: '14px',
                    color: currentTheme.textPrimary,
                    marginBottom: '8px'
                  }}>
                    No Lux Libris badges earned yet
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme.textSecondary
                  }}>
                    Complete reading challenges to earn your first bird badge!
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowBadgeModal(false)}
                style={{
                  width: '100%',
                  backgroundColor: currentTheme.primary,
                  color: currentTheme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* BIRD FACT MODAL */}
        {showBirdFactModal && selectedBadge && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowBirdFactModal(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: currentTheme.textSecondary
                }}
              >
                ✕
              </button>

              {/* Large Badge Image */}
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                backgroundColor: `${currentTheme.primary}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                border: `3px solid ${currentTheme.primary}60`
              }}>
                <img 
                  src={`/badges/${selectedBadge.pngName}`}
                  alt={selectedBadge.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.src = '/badges/hummingbird.png';
                  }}
                />
              </div>

              {/* Badge Info */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 8px 0',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                {selectedBadge.name}
              </h3>

              <div style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                marginBottom: '20px'
              }}>
                {selectedBadge.description}
              </div>

              <div style={{
                fontSize: '12px',
                color: currentTheme.primary,
                fontWeight: '600',
                marginBottom: '20px'
              }}>
                Week {selectedBadge.week} • {selectedBadge.xp} XP
              </div>

              {/* Bird Fact */}
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                border: `2px solid ${currentTheme.secondary}60`
              }}>
                <div style={{
                  fontSize: '16px',
                  marginBottom: '12px'
                }}>
                  🐦 Amazing Bird Fact!
                </div>
                <div style={{
                  fontSize: '14px',
                  color: currentTheme.textPrimary,
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  {selectedBadge.birdFact}
                </div>
              </div>

              <button
                onClick={() => setShowBirdFactModal(false)}
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
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Awesome! 🎉
              </button>
            </div>
          </div>
        )}

        {/* LEADERBOARD MODAL */}
        {showLeaderboard && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  margin: 0
                }}>
                  📊 Grade {studentData?.grade} Rankings
                </h3>
                
                <button
                  onClick={() => setShowLeaderboard(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: currentTheme.textSecondary
                  }}
                >
                  ✕
                </button>
              </div>

              {!leaderboardUnlocked ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                    <div style={{
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      Parent Permission Required
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textSecondary
                    }}>
                      Ask your parent for the unlock code to see anonymous grade rankings
                    </div>
                  </div>
                  
                  {!showParentCodeInput ? (
                    <button
                      onClick={() => setShowParentCodeInput(true)}
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🔓 Enter Parent Code
                    </button>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={parentCode}
                        onChange={(e) => setParentCode(e.target.value)}
                        placeholder="Enter parent code"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: `2px solid ${currentTheme.primary}60`,
                          fontSize: '16px',
                          marginBottom: '16px',
                          textAlign: 'center',
                          backgroundColor: '#FFFFFF',
                          color: '#000000'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setShowParentCodeInput(false);
                            setParentCode('');
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: currentTheme.secondary,
                            color: currentTheme.textPrimary,
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleLeaderboardUnlock}
                          style={{
                            flex: 1,
                            backgroundColor: currentTheme.primary,
                            color: currentTheme.textPrimary,
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textSecondary
                    }}>
                      📊 Total XP • All names anonymous • {leaderboardData.length} students
                    </div>
                  </div>
                  
                  {isLoadingLeaderboard ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        border: '3px solid #E0E0E0',
                        borderTop: '3px solid ' + currentTheme.primary,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 12px'
                      }} />
                      <div style={{
                        fontSize: '12px',
                        color: currentTheme.textSecondary
                      }}>
                        Loading rankings...
                      </div>
                    </div>
                  ) : leaderboardData.length > 0 ? (
                    <div style={{ marginBottom: '16px' }}>
                      {leaderboardData.slice(0, 10).map((student, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: student.isCurrentUser ? `${currentTheme.primary}30` : `${currentTheme.primary}10`,
                            borderRadius: '12px',
                            marginBottom: '8px',
                            border: student.isCurrentUser ? `2px solid ${currentTheme.primary}` : 'none'
                          }}
                        >
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: currentTheme.textPrimary,
                            minWidth: '30px'
                          }}>
                            {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`}
                          </div>
                          
                          <div style={{ flex: 1, marginLeft: '12px' }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: student.isCurrentUser ? '600' : '500',
                              color: currentTheme.textPrimary
                            }}>
                              {student.displayName}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: currentTheme.textSecondary
                            }}>
                              {student.totalXP} XP • 🏆 {student.badgesEarned} badges
                            </div>
                          </div>
                          
                          {student.isCurrentUser && (
                            <div style={{
                              fontSize: '12px',
                              backgroundColor: currentTheme.primary,
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}>
                              YOU
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                      <div style={{
                        fontSize: '14px',
                        color: currentTheme.textPrimary,
                        marginBottom: '8px'
                      }}>
                        No classmates yet
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: currentTheme.textSecondary
                      }}>
                        Rankings will appear when more students in your grade join
                      </div>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={loadLeaderboardData}
                      disabled={isLoadingLeaderboard}
                      style={{
                        flex: 1,
                        backgroundColor: currentTheme.secondary,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: isLoadingLeaderboard ? 'not-allowed' : 'pointer',
                        opacity: isLoadingLeaderboard ? 0.7 : 1
                      }}
                    >
                      {isLoadingLeaderboard ? '⏳' : '🔄'} Refresh
                    </button>
                    
                    <button
                      onClick={() => setShowLeaderboard(false)}
                      style={{
                        flex: 1,
                        backgroundColor: currentTheme.primary,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                  
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme.textSecondary,
                    textAlign: 'center',
                    marginTop: '12px'
                  }}>
                    Rankings update in real-time • All names anonymous
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ENHANCED BRAGGING RIGHTS MODAL */}
        <EnhancedBraggingRightsModal
          show={showBraggingRights}
          onClose={() => setShowBraggingRights(false)}
          studentData={studentData}
          earnedBadges={earnedBadges}
          levelProgress={levelProgress}
          readingPersonality={readingPersonality}
          currentTheme={currentTheme}
        />

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
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-8px);
            }
            60% {
              transform: translateY(-4px);
            }
          }
          
          @keyframes sparkle {
            0%, 100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
            25% {
              opacity: 0.7;
              transform: scale(1.2) rotate(90deg);
            }
            50% {
              opacity: 0.4;
              transform: scale(0.8) rotate(180deg);
            }
            75% {
              opacity: 0.7;
              transform: scale(1.1) rotate(270deg);
            }
          }
          
          @keyframes braggingRightsUnlock {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
              background-color: ${currentTheme.textSecondary}30;
            }
            50% {
              opacity: 0.8;
              transform: scale(1.1) translateY(-5px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              background-color: ${currentTheme.secondary};
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
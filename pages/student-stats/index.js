// pages/student-stats/index.js - Enhanced Stats Dashboard with Dynamic Celebrations

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities } from '../../lib/firebase';
import { getCurrentWeekBadge, getBadgeProgress, getEarnedBadges, getLevelProgress } from '../../lib/badge-system';
import { calculateReadingPersonality, shouldShowFirstBookCelebration, unlockCertificate } from '../../lib/reading-personality';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  const [showBraggingRights, setShowBraggingRights] = useState(false);
  
  // Light overview data
  const [quickStats, setQuickStats] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [levelProgress, setLevelProgress] = useState(null);
  const [currentWeekBadge, setCurrentWeekBadge] = useState(null);
  const [funTidbits, setFunTidbits] = useState([]);
  const [weeklyXP, setWeeklyXP] = useState(0);

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

  // REORDERED Stats navigation options
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview', current: true },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
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
        setShowFirstBookCelebration(false);
        setShowBraggingRights(false);
      }
    };

    if (showNavMenu || showStatsDropdown || showFirstBookCelebration || showBraggingRights) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown, showFirstBookCelebration, showBraggingRights]);

  // Generate dynamic celebration messages based on performance
  const generateCelebrationMessages = useCallback((stats) => {
    const messages = {
      books: '',
      streak: '',
      saints: '',
      readingTime: ''
    };

    // Books celebration
    // Books celebration
const books = stats.booksThisYear;
if (books >= 10) {
  messages.books = 'Books CONQUERED!';
} else if (books >= 5) {
  messages.books = 'Books MASTERED!';
} else if (books >= 1) {
  messages.books = `${books === 1 ? 'Book' : 'Books'} DISCOVERED!`;
} else {
  messages.books = 'Ready to Read!';
}

    // Streak celebration  
    const streak = stats.currentStreak;
    if (streak >= 30) {
      messages.streak = 'LEGENDARY Streak!';
    } else if (streak >= 14) {
      messages.streak = 'AMAZING Streak!';
    } else if (streak >= 7) {
      messages.streak = 'Great Streak!';
    } else if (streak >= 3) {
      messages.streak = 'Building Momentum!';
    } else {
      messages.streak = 'Day Streak';
    }

    // Saints celebration
    const saints = stats.saintsUnlocked;
    if (saints >= 20) {
      messages.saints = 'Saint Master!';
    } else if (saints >= 10) {
      messages.saints = 'Saint Collector!';
    } else if (saints >= 5) {
      messages.saints = 'Saint Seeker!';
    } else {
      messages.saints = 'Saints';
    }

    // Reading time fun facts
    const minutes = stats.totalReadingMinutes;
    if (minutes >= 300) {
      messages.readingTime = `${stats.readingHours} hours = Your brain built thousands of new connections! 🧠`;
    } else if (minutes >= 120) {
      messages.readingTime = `${Math.round(minutes)} minutes = Like a full brain workout session! 💪`;
    } else if (minutes >= 60) {
      messages.readingTime = `${Math.round(minutes)} minutes = Your vocabulary grew stronger! 📚`;
    } else if (minutes >= 20) {
      messages.readingTime = `${Math.round(minutes)} minutes = That's how long it takes your brain to create new pathways! ⚡`;
    } else if (minutes > 0) {
      messages.readingTime = `${Math.round(minutes)} minutes = Great start building reading muscles! 🌱`;
    } else {
      messages.readingTime = 'Ready to start your reading adventure!';
    }

    return messages;
  }, []);

  // Determine which stat should be the "hero" (most impressive)
  const getHeroStat = useCallback((stats) => {
    const scores = {
      books: stats.booksThisYear >= 10 ? 100 : stats.booksThisYear >= 5 ? 80 : stats.booksThisYear >= 1 ? 60 : 20,
      streak: stats.currentStreak >= 30 ? 95 : stats.currentStreak >= 14 ? 85 : stats.currentStreak >= 7 ? 70 : stats.currentStreak >= 3 ? 50 : 20,
      saints: stats.saintsUnlocked >= 20 ? 90 : stats.saintsUnlocked >= 10 ? 75 : stats.saintsUnlocked >= 5 ? 55 : 30
    };

    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  }, []);

  // Generate enhanced fun tidbits with brain science and achievements
  const generateFunTidbits = useCallback(async (studentData) => {
    try {
      const tidbits = [];
      const entityId = studentData.entityId;
      const schoolId = studentData.schoolId;
      const currentGrade = studentData.grade;
      
      // Get grade data for tidbits
      const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const gradeQuery = query(studentsRef, where('grade', '==', currentGrade));
      const gradeSnapshot = await getDocs(gradeQuery);
      
      let gradeStudents = 0;
      let gradeTotalBooks = 0;
      let studentRankInGrade = 1;
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      
      gradeSnapshot.forEach(doc => {
        const student = doc.data();
        gradeStudents++;
        gradeTotalBooks += student.booksSubmittedThisYear || 0;
        
        if ((student.booksSubmittedThisYear || 0) > studentBooks) {
          studentRankInGrade++;
        }
      });
      
      // Enhanced grade ranking with celebration
      if (studentRankInGrade <= 3 && gradeStudents > 3) {
        tidbits.push(`🏆 SUPERSTAR ALERT! You're #${studentRankInGrade} in Grade ${currentGrade}!`);
      } else if (studentBooks > 0) {
        tidbits.push(`🌟 Amazing! Grade ${currentGrade} has powered through ${gradeTotalBooks} ${gradeTotalBooks === 1 ? 'book' : 'books'} together!`);
      }
      
      // Brain science facts based on reading
      const readingMinutes = quickStats?.totalReadingMinutes || 0;
      if (readingMinutes >= 200) {
        tidbits.push(`🧠 Science fact: You've strengthened your brain like an athlete trains muscles!`);
      } else if (readingMinutes >= 100) {
        tidbits.push(`⚡ Your brain created new neural pathways with every reading session!`);
      } else if (readingMinutes >= 30) {
        tidbits.push(`🌱 Reading grows your brain's vocabulary center every day!`);
      }
      
      // Enhanced badge celebration
      if (earnedBadges.length >= 5) {
        const latestBadge = earnedBadges[earnedBadges.length - 1];
        tidbits.push(`🎯 Badge Champion! Latest: ${latestBadge.emoji} ${latestBadge.name}!`);
      } else if (earnedBadges.length > 0) {
        const latestBadge = earnedBadges[earnedBadges.length - 1];
        tidbits.push(`🏅 Achievement unlocked: ${latestBadge.emoji} ${latestBadge.name}!`);
      }
      
      // School community impact
      const schoolSnapshot = await getDocs(studentsRef);
      let schoolTotalBooks = 0;
      let schoolStudents = 0;
      
      schoolSnapshot.forEach(doc => {
        const student = doc.data();
        schoolStudents++;
        schoolTotalBooks += student.booksSubmittedThisYear || 0;
      });
      
      if (schoolTotalBooks >= 100) {
        tidbits.push(`🚀 WOW! ${studentData.schoolName} has CRUSHED ${schoolTotalBooks} books this year!`);
      } else if (schoolTotalBooks > 0) {
        tidbits.push(`📚 ${studentData.schoolName} is building an amazing reading community with ${schoolTotalBooks} ${schoolTotalBooks === 1 ? 'book' : 'books'}!`);
      }
      
      // Streak momentum with celebration
      const currentStreak = quickStats?.currentStreak || 0;
      if (currentStreak >= 14) {
        tidbits.push(`🔥 You're ON FIRE! ${currentStreak} days of reading excellence!`);
      } else if (currentStreak >= 7) {
        tidbits.push(`⚡ Incredible! ${currentStreak}-day streak building your reading superpowers!`);
      } else if (currentStreak >= 3) {
        tidbits.push(`🌟 Awesome momentum with your ${currentStreak}-day streak!`);
      }
      
      // Level achievement with power language
      if (levelProgress && levelProgress.level >= 5) {
        tidbits.push(`⭐ POWER READER Level ${levelProgress.level} with ${levelProgress.progress + levelProgress.currentThreshold} XP!`);
      } else if (levelProgress && levelProgress.level >= 2) {
        tidbits.push(`📈 Rising star! Level ${levelProgress.level} reader gaining strength!`);
      }
      
      // Saints collection with adventure language
      const saintsCount = (studentData.unlockedSaints || []).length;
      if (saintsCount >= 15) {
        tidbits.push(`♔ LEGENDARY collection: ${saintsCount} saints in your spiritual army!`);
      } else if (saintsCount >= 8) {
        tidbits.push(`⚔️ Mighty collection: ${saintsCount} saints by your side!`);
      } else if (saintsCount >= 3) {
        tidbits.push(`🛡️ Building your saint squad: ${saintsCount} holy heroes unlocked!`);
      }
      
      // Motivational fallbacks with energy
      if (tidbits.length === 0) {
        tidbits.push(`🚀 You're building INCREDIBLE reading habits!`);
        tidbits.push(`💪 Every page makes your brain stronger!`);
        tidbits.push(`🌟 You're part of an AMAZING reading community!`);
      }
      
      // Select the most exciting tidbits
      const selectedTidbits = tidbits.slice(0, Math.min(4, tidbits.length));
      setFunTidbits(selectedTidbits);
      
    } catch (error) {
      console.error('Error generating fun tidbits:', error);
      setFunTidbits(['🚀 Keep building those reading superpowers!', '💪 Every book makes you stronger!']);
    }
  }, [earnedBadges, levelProgress, quickStats]);

  // Calculate light overview stats
  const calculateQuickStats = useCallback(async (studentData) => {
    try {
      // Get reading sessions for basic stats
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      let totalReadingMinutes = 0;
      let completedSessions = 0;
      const completedSessionsByDate = {};
      let thisWeekXP = 0;
      
      // Calculate this week's XP (simplified)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      sessionsSnapshot.forEach(doc => {
        const session = doc.data();
        totalReadingMinutes += session.duration || 0;
        if (session.completed) {
          completedSessions++;
          completedSessionsByDate[session.date] = true;
          
          // Calculate weekly XP
          const sessionDate = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
          if (sessionDate && sessionDate >= oneWeekAgo) {
            thisWeekXP += Math.max(1, Math.floor(session.duration || 0));
          }
        }
      });

      // Calculate current streak (simplified)
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

      const booksThisYear = studentData.booksSubmittedThisYear || 0;
      const personalGoal = studentData.personalGoal || 15;
      const goalProgress = Math.min(100, Math.round((booksThisYear / personalGoal) * 100));

      setQuickStats({
        booksThisYear,
        personalGoal,
        goalProgress,
        currentStreak,
        totalReadingMinutes,
        readingHours: Math.round(totalReadingMinutes / 60),
        saintsUnlocked: (studentData.unlockedSaints || []).length,
        totalXP: studentData.totalXP || 0
      });
      
      setWeeklyXP(thisWeekXP);
      
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
        totalXP: studentData.totalXP || 0
      });
      setWeeklyXP(0);
    }
  }, []);

  // Generate bragging rights data (simplified for this page)
  const generateBraggingRights = useCallback(() => {
    const achievements = [];
    
    // Badge achievements
    if (earnedBadges.length >= 10) {
      achievements.push(`🏆 Badge Hunter - ${earnedBadges.length} badges earned!`);
    } else if (earnedBadges.length >= 5) {
      achievements.push(`🏅 Badge Starter - ${earnedBadges.length} badges collected!`);
    }
    
    // Reading achievements
    if (quickStats) {
      if (quickStats.booksThisYear >= quickStats.personalGoal) {
        achievements.push(`🎯 Goal Crusher - ${quickStats.booksThisYear}/${quickStats.personalGoal} books!`);
      } else if (quickStats.booksThisYear >= 5) {
        achievements.push(`📚 Active Reader - ${quickStats.booksThisYear} books completed!`);
      }
      
      if (quickStats.currentStreak >= 14) {
        achievements.push(`🔥 ${quickStats.currentStreak}-Day Reading Streak!`);
      } else if (quickStats.currentStreak >= 7) {
        achievements.push(`✨ ${quickStats.currentStreak}-Day Streak Keeper!`);
      }
    }
    
    // XP achievements
    if (levelProgress && levelProgress.level >= 5) {
      achievements.push(`⭐ Level ${levelProgress.level} Reader!`);
    }
    
    // Saints achievements
    if (quickStats && quickStats.saintsUnlocked >= 20) {
      achievements.push(`♔ Saint Collector - ${quickStats.saintsUnlocked} saints!`);
    } else if (quickStats && quickStats.saintsUnlocked >= 10) {
      achievements.push(`♔ Saint Seeker - ${quickStats.saintsUnlocked} saints!`);
    }
    
    // Ensure we have some achievements
    if (achievements.length < 3) {
      achievements.push(`🌟 Active Reader this year!`);
      achievements.push(`📚 Building great reading habits!`);
      if (earnedBadges.length > 0) {
        achievements.push(`🏆 Badge earner - ${earnedBadges.length} collected!`);
      }
    }
    
    return {
      topAchievements: achievements.slice(0, 6),
      studentName: `${studentData.firstName} ${studentData.lastInitial}`,
      grade: studentData.grade,
      totalXP: quickStats?.totalXP || 0,
      level: levelProgress?.level || 1,
      badgesEarned: earnedBadges.length,
      featuredBadge: earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null,
      specialBadges: earnedBadges.filter(badge => badge.xp >= 100).slice(0, 3)
    };
  }, [studentData, earnedBadges, quickStats, levelProgress]);

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
      
      // Get earned badges and level progress
      const badges = getEarnedBadges(firebaseStudentData);
      const levelInfo = getLevelProgress(firebaseStudentData.totalXP || 0);
      
      setEarnedBadges(badges);
      setLevelProgress(levelInfo);
      
      // Calculate quick stats for overview
      await calculateQuickStats(firebaseStudentData);
      
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

  // Generate fun tidbits after data loads
  useEffect(() => {
    if (studentData && quickStats && earnedBadges && levelProgress) {
      generateFunTidbits(studentData);
    }
  }, [studentData, quickStats, earnedBadges, levelProgress, generateFunTidbits]);

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
        <meta name="description" content="Your fun reading stats overview" />
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

          {/* STATS DROPDOWN - REORDERED */}
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

        {/* MAIN CONTENT - ENHANCED WITH CELEBRATIONS */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* SMALL PILL: THIS WEEK'S CHALLENGE */}
          {currentWeekBadge && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '50px',
              padding: '12px 20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>{currentWeekBadge.emoji}</span>
              <div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary
                }}>
                  {currentWeekBadge.week === 0 ? 'Challenge Starting Soon!' : 'This Week\'s Challenge'}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 11px)',
                  color: currentTheme.textSecondary
                }}>
                  {currentWeekBadge.name}
                </div>
              </div>
            </div>
          )}
          
          {/* ENHANCED READING JOURNEY WITH DYNAMIC MESSAGING */}
          {(() => {
            const celebrationMessages = generateCelebrationMessages(quickStats);
            const heroStat = getHeroStat(quickStats);
            
            return (
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
                  🚀 Your Reading Adventure
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  {/* Books Stat */}
                  <div style={{
                    transform: heroStat === 'books' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                    animation: 'statsSlideIn 0.6s ease-out 0.1s both'
                  }}>
                    <div style={{
                      fontSize: heroStat === 'books' ? 'clamp(24px, 7vw, 28px)' : 'clamp(20px, 6vw, 24px)',
                      fontWeight: 'bold',
                      color: heroStat === 'books' ? currentTheme.primary : currentTheme.textPrimary,
                      transition: 'all 0.3s ease',
                      textShadow: heroStat === 'books' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}>
                      {quickStats.booksThisYear}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: heroStat === 'books' ? currentTheme.primary : currentTheme.textSecondary,
                      fontWeight: heroStat === 'books' ? '600' : '500'
                    }}>
                      {celebrationMessages.books}
                    </div>
                  </div>
                  
                  {/* Streak Stat */}
                  <div style={{
                    transform: heroStat === 'streak' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                    animation: 'statsSlideIn 0.6s ease-out 0.2s both'
                  }}>
                    <div style={{
                      fontSize: heroStat === 'streak' ? 'clamp(24px, 7vw, 28px)' : 'clamp(20px, 6vw, 24px)',
                      fontWeight: 'bold',
                      color: heroStat === 'streak' ? currentTheme.primary : currentTheme.textPrimary,
                      transition: 'all 0.3s ease',
                      textShadow: heroStat === 'streak' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}>
                      {quickStats.currentStreak}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: heroStat === 'streak' ? currentTheme.primary : currentTheme.textSecondary,
                      fontWeight: heroStat === 'streak' ? '600' : '500'
                    }}>
                      {celebrationMessages.streak}
                    </div>
                  </div>
                  
                  {/* Saints Stat */}
                  <div style={{
                    transform: heroStat === 'saints' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                    animation: 'statsSlideIn 0.6s ease-out 0.3s both'
                  }}>
                    <div style={{
                      fontSize: heroStat === 'saints' ? 'clamp(24px, 7vw, 28px)' : 'clamp(20px, 6vw, 24px)',
                      fontWeight: 'bold',
                      color: heroStat === 'saints' ? currentTheme.primary : currentTheme.textPrimary,
                      transition: 'all 0.3s ease',
                      textShadow: heroStat === 'saints' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}>
                      {quickStats.saintsUnlocked}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: heroStat === 'saints' ? currentTheme.primary : currentTheme.textSecondary,
                      fontWeight: heroStat === 'saints' ? '600' : '500'
                    }}>
                      {celebrationMessages.saints}
                    </div>
                  </div>
                </div>
                
                {/* Reading Time Celebration */}
                <div style={{
                  backgroundColor: `${currentTheme.secondary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textPrimary,
                  fontWeight: '500',
                  animation: 'statsSlideIn 0.6s ease-out 0.4s both'
                }}>
                  {celebrationMessages.readingTime}
                </div>

                {/* ENHANCED XP DISPLAY WITH CELEBRATION */}
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'statsSlideIn 0.6s ease-out 0.5s both'
                }}>
                  <div>
                    <div style={{
                      fontSize: 'clamp(16px, 5vw, 18px)',
                      fontWeight: 'bold',
                      color: currentTheme.textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontSize: 'clamp(18px, 5.5vw, 20px)',
                        animation: weeklyXP > 50 ? 'bounce 2s infinite' : 'none'
                      }}>⚡</span>
                      {quickStats.totalXP} XP
                      {quickStats.totalXP >= 500 && (
                        <span style={{
                          fontSize: '12px',
                          marginLeft: '4px',
                          animation: 'sparkle 1.5s ease-in-out infinite'
                        }}>✨</span>
                      )}
                    </div>
                    {levelProgress && (
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary
                      }}>
                        {levelProgress.level >= 5 ? `POWER Level ${levelProgress.level}!` : `Level ${levelProgress.level}`}
                      </div>
                    )}
                  </div>
                  {weeklyXP > 0 && (
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.primary,
                      fontWeight: '600',
                      animation: 'pulseGlow 2s ease-in-out infinite'
                    }}>
                      {weeklyXP >= 100 ? `🔥 +${weeklyXP} XP this week!` : 
                       weeklyXP >= 50 ? `⚡ +${weeklyXP} XP this week!` : 
                       `+${weeklyXP} XP this week`}
                    </div>
                  )}
                </div>

                {/* ENHANCED BRAGGING RIGHTS BUTTON */}
                <button
                  onClick={() => setShowBraggingRights(true)}
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
                    WebkitTapHighlightColor: 'transparent',
                    animation: 'statsSlideIn 0.6s ease-out 0.6s both',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <span style={{
                    fontSize: 'clamp(16px, 4vw, 18px)',
                    animation: earnedBadges.length >= 5 ? 'bounce 2s ease-in-out infinite' : 'none'
                  }}>🏆</span>
                  {earnedBadges.length >= 10 ? 'CHAMPION Bragging Rights!' :
                   earnedBadges.length >= 5 ? 'SUPERSTAR Bragging Rights!' :
                   'Bragging Rights'}
                </button>
              </div>
            );
          })()}

          {/* ENHANCED FUN TIDBITS SECTION */}
          {funTidbits.length > 0 && (
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
                ✨ Exciting Updates
              </h3>
              
              {funTidbits.map((tidbit, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: `${currentTheme.primary}15`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: index < funTidbits.length - 1 ? '8px' : '0',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    color: currentTheme.textPrimary,
                    fontWeight: '500',
                    animation: `statsSlideIn 0.6s ease-out ${0.7 + (index * 0.1)}s both`
                  }}
                >
                  {tidbit}
                </div>
              ))}
            </div>
          )}

          {/* EXPLORE MORE FOOTER */}
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

                {/* Header */}
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
                    Reading Achievement Certificate
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
                  {/* Stats Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: `2px solid ${currentTheme.primary}`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(16px, 5vw, 18px)',
                        fontWeight: 'bold',
                        color: '#000000'
                      }}>
                        {braggingData?.level || 1}
                      </div>
                      <div style={{
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        color: '#666666'
                      }}>
                        Level
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: `2px solid ${currentTheme.primary}`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(16px, 5vw, 18px)',
                        fontWeight: 'bold',
                        color: '#000000'
                      }}>
                        {braggingData?.totalXP || 0}
                      </div>
                      <div style={{
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        color: '#666666'
                      }}>
                        XP
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: `2px solid ${currentTheme.primary}`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(16px, 5vw, 18px)',
                        fontWeight: 'bold',
                        color: '#000000'
                      }}>
                        {braggingData?.badgesEarned || 0}
                      </div>
                      <div style={{
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        color: '#666666'
                      }}>
                        Badges
                      </div>
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {braggingData?.featuredBadge && (
                    <div style={{
                      backgroundColor: `${currentTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '16px',
                      textAlign: 'center',
                      border: `2px solid ${currentTheme.primary}60`
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                        {braggingData.featuredBadge.emoji}
                      </div>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary,
                        marginBottom: '4px'
                      }}>
                        Latest Badge
                      </div>
                      <div style={{
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        color: currentTheme.textPrimary
                      }}>
                        {braggingData.featuredBadge.name}
                      </div>
                    </div>
                  )}

                  {/* Top Achievements */}
                  <div style={{
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      🌟 Your Amazing Achievements 🌟
                    </div>
                    
                    {braggingData?.topAchievements.map((achievement, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: `1px solid ${currentTheme.primary}60`,
                          borderRadius: '12px',
                          padding: '10px',
                          marginBottom: '6px',
                          fontSize: 'clamp(11px, 3vw, 12px)',
                          fontWeight: '500',
                          color: '#000000',
                          textAlign: 'left'
                        }}
                      >
                        {achievement}
                      </div>
                    ))}
                  </div>

                  {/* Special Badges - with emojis only */}
                  {braggingData?.specialBadges && braggingData.specialBadges.length > 0 && (
                    <div style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary,
                        marginBottom: '8px'
                      }}>
                        ⚡ Special Badges Earned
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        {braggingData.specialBadges.map((badge, index) => (
                          <div key={index} style={{
                            fontSize: '20px',
                            padding: '4px'
                          }}>
                            {badge.emoji}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screenshot hint */}
                  <div style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    marginTop: '16px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      📸 Want to share this?
                    </div>
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.textSecondary
                    }}>
                      Take a screenshot to share your achievements with family and friends!
                    </div>
                  </div>
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
          
          @keyframes statsSlideIn {
            from { 
              opacity: 0; 
              transform: translateY(20px); 
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
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.2);
            }
          }
          
          @keyframes pulseGlow {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
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
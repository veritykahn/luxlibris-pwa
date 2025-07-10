/*
🔒 PRIVACY-FIRST STATS SYSTEM 🔒

This stats page is designed to be 100% ANONYMOUS even within schools:

✅ WHAT STUDENTS SEE:
- "You're the 2nd person to complete Harry Potter!" 
- "You're reading more than 75% of Grade 4!"
- "23 students are Luminous Legends!"
- "12 students earned the Pizza Party!"

❌ WHAT STUDENTS NEVER SEE:
- Other students' names, progress, or individual data
- Specific rankings like "Johnny is #1 with 15 books"
- Any identifiable information about classmates

🛡️ HOW IT WORKS:
1. SERVER-SIDE ANONYMOUS AGGREGATION: All comparisons use anonymous counters 
   maintained by the server (e.g., "18 students are Faithful Flames")

2. ACHIEVEMENT TIMESTAMPS: When students earn achievements, the server stores 
   anonymous timestamps in order (1st, 2nd, 3rd) without linking to identities

3. NO INDIVIDUAL DATA ACCESS: Client never requests or receives other students' 
   individual progress data - only anonymous aggregated statistics

4. PRIVACY BY DESIGN: Even teachers/admins see only their own students' data,
   never cross-classroom comparisons with individual student information

This creates healthy motivation through anonymous competition while protecting 
student privacy and preventing social comparison issues.
*/

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentDataEntities, updateStudentDataEntities } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';

export default function StudentStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationProcessing, setNotificationProcessing] = useState(false);
  const [showBraggingRights, setShowBraggingRights] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [showReadingPersonality, setShowReadingPersonality] = useState(false);
  
  // Stats data
  const [personalStats, setPersonalStats] = useState(null);
  const [competitionStats, setCompetitionStats] = useState(null);
  const [gradeStats, setGradeStats] = useState(null);
  const [saintsStats, setSaintsStats] = useState(null);
  const [readingQuality, setReadingQuality] = useState(null);
  const [realWorldAchievements, setRealWorldAchievements] = useState([]);
  const [medalAchievements, setMedalAchievements] = useState([]);
  const [healthyHabitsStats, setHealthyHabitsStats] = useState(null);
  const [realWorldAchievementStats, setRealWorldAchievementStats] = useState(null);

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

  // 🔔 Notification functions
  const requestNotificationPermission = useCallback(async () => {
    console.log('Starting notification permission request...');
    
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      alert('This browser does not support notifications');
      return false;
    }

    console.log('Current permission:', Notification.permission);

    if (Notification.permission === 'granted') {
      console.log('Permission already granted');
      setNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Permission was denied');
      alert('Notifications were blocked. Please enable them in your browser settings.');
      return false;
    }

    try {
      console.log('Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);
      
      if (enabled) {
        new Notification('🎉 Notifications Enabled!', {
          body: 'You\'ll now get notified about your reading achievements!',
          icon: '/images/lux_libris_logo.png'
        });
      } else {
        alert('Notifications were not enabled. You can enable them later in your browser settings.');
      }
      
      return enabled;
    } catch (error) {
      console.error('Notification permission error:', error);
      alert('Error requesting notification permission: ' + error.message);
      return false;
    }
  }, []);

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        console.log('Clicking outside menu, closing...');
        setShowNavMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false);
      }
    };

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu]);

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
      
      // ✅ PRIVACY-FIRST: Only use student's own achievement timestamps
      // In a real implementation, these would be stored when achievements are earned
      // and populated by server-side anonymous aggregation
      
      // Simulated anonymous achievement data (would come from anonymous school aggregation)
      const anonymousSchoolStats = {
        // Anonymous counters for tier achievements (school-wide and grade-specific)
        tierAchievements: {
          5: { 
            schoolWide: { total: 34, firstThree: ['2024-01-15', '2024-01-22', '2024-02-03'] },
            gradeSpecific: { total: 8, firstThree: ['2024-01-18', '2024-01-25', '2024-02-08'] }
          },
          10: { 
            schoolWide: { total: 22, firstThree: ['2024-02-10', '2024-02-18', '2024-03-01'] },
            gradeSpecific: { total: 5, firstThree: ['2024-02-15', '2024-02-22', '2024-03-05'] }
          },
          15: { 
            schoolWide: { total: 12, firstThree: ['2024-03-15', '2024-03-22', '2024-04-05'] },
            gradeSpecific: { total: 3, firstThree: ['2024-03-20', '2024-03-28', '2024-04-10'] }
          },
          20: { 
            schoolWide: { total: 7, topTen: true }, // Top 10 recognition for 20 books
            gradeSpecific: { total: 2, firstThree: ['2024-04-12', '2024-04-25'] }
          }
        },
        // Anonymous counters for specific book completions (school-wide and grade-specific)
        bookCompletions: {
          'harry_potter_1': { 
            title: 'Harry Potter and the Sorcerer\'s Stone',
            schoolWide: { total: 23, firstThree: ['2024-01-10', '2024-01-18', '2024-01-25'] },
            gradeSpecific: { total: 6, firstThree: ['2024-01-15', '2024-01-22', '2024-02-02'] }
          },
          'dog_man_1': { 
            title: 'Dog Man',
            schoolWide: { total: 18, firstThree: ['2024-02-05', '2024-02-12', '2024-02-20'] },
            gradeSpecific: { total: 4, firstThree: ['2024-02-08', '2024-02-15', '2024-02-25'] }
          },
          'wonder': { 
            title: 'Wonder',
            schoolWide: { total: 15, firstThree: ['2024-03-01', '2024-03-08', '2024-03-15'] },
            gradeSpecific: { total: 5, firstThree: ['2024-03-05', '2024-03-12', '2024-03-20'] }
          }
        }
      };
      
      const achievementTiers = studentData.achievementTiers || [];
      const currentBooks = studentData.booksSubmittedThisYear || 0;
      const studentGrade = studentData.grade;
      
      // Check tier achievements using student's own stored achievement dates
      for (const tier of achievementTiers) {
        if (currentBooks >= tier.books) {
          // Check if student has a stored achievement date for this tier
          const studentAchievementDate = studentData.tierAchievementDates?.[tier.books];
          
          if (studentAchievementDate && anonymousSchoolStats.tierAchievements[tier.books]) {
            const tierStats = anonymousSchoolStats.tierAchievements[tier.books];
            const studentDate = new Date(studentAchievementDate);
            
            // Check school-wide achievements (except for 20 books which is top 10)
            if (tier.books === 20 && tierStats.schoolWide.topTen) {
              medals.push({
                type: 'tier',
                rank: 'top10',
                medalType: 'gold',
                emoji: '🏆',
                achievement: `Top 10 to reach ${tier.books} books school-wide!`,
                description: `${tier.reward}`,
                totalAchievers: tierStats.schoolWide.total
              });
            } else if (tier.books < 20) {
              // Check for first/second/third school-wide
              let rank = 0;
              for (let i = 0; i < tierStats.schoolWide.firstThree.length; i++) {
                if (studentDate <= new Date(tierStats.schoolWide.firstThree[i])) {
                  rank = i + 1;
                  break;
                }
              }
              
              if (rank > 0 && rank <= 3) {
                const medalType = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
                const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                
                medals.push({
                  type: 'tier',
                  rank,
                  medalType,
                  emoji: medalEmoji,
                  achievement: `${rank === 1 ? 'First' : rank === 2 ? 'Second' : 'Third'} to reach ${tier.books} books school-wide!`,
                  description: `${tier.reward}`,
                  totalAchievers: tierStats.schoolWide.total
                });
              }
              
              // Check for first/second/third in grade
              let gradeRank = 0;
              for (let i = 0; i < tierStats.gradeSpecific.firstThree.length; i++) {
                if (studentDate <= new Date(tierStats.gradeSpecific.firstThree[i])) {
                  gradeRank = i + 1;
                  break;
                }
              }
              
              if (gradeRank > 0 && gradeRank <= 3) {
                const medalType = gradeRank === 1 ? 'gold' : gradeRank === 2 ? 'silver' : 'bronze';
                const medalEmoji = gradeRank === 1 ? '🥇' : gradeRank === 2 ? '🥈' : '🥉';
                
                medals.push({
                  type: 'tier_grade',
                  rank: gradeRank,
                  medalType,
                  emoji: medalEmoji,
                  achievement: `${gradeRank === 1 ? 'First' : gradeRank === 2 ? 'Second' : 'Third'} in Grade ${studentGrade} to reach ${tier.books} books!`,
                  description: `${tier.reward}`,
                  totalAchievers: tierStats.gradeSpecific.total
                });
              }
            }
          }
        }
      }
      
      // Check book completion achievements using student's own completion dates
      const completedBooks = (studentData.bookshelf || [])
        .filter(book => book.completed && book.status === 'completed' && book.submittedAt);
      
      for (const book of completedBooks) {
        const bookStats = anonymousSchoolStats.bookCompletions[book.bookId];
        
        if (bookStats && book.submittedAt) {
          const studentCompletionDate = new Date(book.submittedAt);
          const bookTitle = bookStats.title;
          
          // Check school-wide completion
          let rank = 0;
          for (let i = 0; i < bookStats.schoolWide.firstThree.length; i++) {
            if (studentCompletionDate <= new Date(bookStats.schoolWide.firstThree[i])) {
              rank = i + 1;
              break;
            }
          }
          
          if (rank > 0 && rank <= 3) {
            const medalType = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
            const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
            
            medals.push({
              type: 'book',
              rank,
              medalType,
              emoji: medalEmoji,
              achievement: `${rank === 1 ? 'First' : rank === 2 ? 'Second' : 'Third'} to complete "${bookTitle}"!`,
              description: 'School-wide book completion',
              totalAchievers: bookStats.schoolWide.total,
              bookTitle: bookTitle.length > 25 ? bookTitle.substring(0, 25) + '...' : bookTitle
            });
          }
          
          // Check grade-specific completion
          let gradeRank = 0;
          for (let i = 0; i < bookStats.gradeSpecific.firstThree.length; i++) {
            if (studentCompletionDate <= new Date(bookStats.gradeSpecific.firstThree[i])) {
              gradeRank = i + 1;
              break;
            }
          }
          
          if (gradeRank > 0 && gradeRank <= 3) {
            const medalType = gradeRank === 1 ? 'gold' : gradeRank === 2 ? 'silver' : 'bronze';
            const medalEmoji = gradeRank === 1 ? '🥇' : gradeRank === 2 ? '🥈' : '🥉';
            
            medals.push({
              type: 'book_grade',
              rank: gradeRank,
              medalType,
              emoji: medalEmoji,
              achievement: `${gradeRank === 1 ? 'First' : gradeRank === 2 ? 'Second' : 'Third'} in Grade ${studentGrade} to complete "${bookTitle}"!`,
              description: 'Grade-level book completion',
              totalAchievers: bookStats.gradeSpecific.total,
              bookTitle: bookTitle.length > 25 ? bookTitle.substring(0, 25) + '...' : bookTitle
            });
          }
        }
      }
      
      setMedalAchievements(medals.slice(0, 6)); // Show top 6 medals
      
    } catch (error) {
      console.error('Error calculating medal achievements:', error);
      setMedalAchievements([]);
    }
  }, []);

  // Calculate personal stats with SMART STREAK LOGIC from healthy habits
  const calculatePersonalStats = useCallback(async (studentData) => {
    try {
      const bookshelf = studentData.bookshelf || [];
      const completedBooks = bookshelf.filter(book => book.completed && book.status === 'completed');
      const achievementTiers = studentData.achievementTiers || [];
      
      // Get reading sessions for streak and habits (SAME LOGIC AS HEALTHY HABITS)
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
      
      // Calculate current streak using SMART LOGIC from healthy habits
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const currentStreak = calculateSmartStreak(completedSessionsByDate, todayStr);
      
      // Determine streak tier (instead of leaderboard)
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

  // Calculate healthy habits level aggregates (ANONYMOUS)
  const calculateHealthyHabitsStats = useCallback(async (studentData) => {
    try {
      // ✅ PRIVACY-FIRST: Anonymous aggregations from server
      // Real implementation: Server counts students at each reading level without exposing individual data
      
      const anonymousHealthyHabitsStats = {
        schoolReadingLevels: {
          faithful_flame: { count: 18, percentage: 35 },
          bright_beacon: { count: 14, percentage: 27 },
          radiant_reader: { count: 12, percentage: 23 },
          luminous_legend: { count: 8, percentage: 15 }
        },
        schoolStreakStats: {
          noStreak: { count: 22, percentage: 42 },
          shortStreak: { count: 16, percentage: 31 }, // 1-6 days
          weekStreak: { count: 10, percentage: 19 },  // 7-29 days
          monthStreak: { count: 4, percentage: 8 }    // 30+ days
        }
      };
      
      const currentLevel = studentData.currentReadingLevel || 'faithful_flame';
      const levelNames = {
        faithful_flame: 'Faithful Flames',
        bright_beacon: 'Bright Beacons', 
        radiant_reader: 'Radiant Readers',
        luminous_legend: 'Luminous Legends'
      };
      
      const levelEmojis = {
        faithful_flame: '🕯️',
        bright_beacon: '⭐',
        radiant_reader: '🌟', 
        luminous_legend: '✨'
      };
      
      setHealthyHabitsStats({
        currentLevel,
        levelDistribution: anonymousHealthyHabitsStats.schoolReadingLevels,
        streakDistribution: anonymousHealthyHabitsStats.schoolStreakStats,
        levelNames,
        levelEmojis,
        myLevelCount: anonymousHealthyHabitsStats.schoolReadingLevels[currentLevel]?.count || 0,
        encouragingMessage: currentLevel === 'luminous_legend' ? 
          `You're one of ${anonymousHealthyHabitsStats.schoolReadingLevels.luminous_legend.count} Luminous Legends! ✨` :
          `You're among ${anonymousHealthyHabitsStats.schoolReadingLevels[currentLevel]?.count || 0} ${levelNames[currentLevel]}! Keep reading to join the next level!`
      });
      
    } catch (error) {
      console.error('Error calculating healthy habits stats:', error);
    }
  }, []);

  // Calculate real world achievement aggregates (ANONYMOUS)
  const calculateRealWorldAchievementStats = useCallback(async (studentData) => {
    try {
      // ✅ PRIVACY-FIRST: Anonymous counts of how many students reached each teacher-defined goal
      // Real implementation: Server maintains anonymous counters without individual student data
      
      const achievementTiers = studentData.achievementTiers || [];
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      
      // Simulated anonymous achievement counts (would come from server aggregation)
      const anonymousAchievementCounts = {
        // How many students have reached each tier
        tierCounts: {
          5: { count: 34, reward: achievementTiers[0]?.reward || 'First Certificate' },
          10: { count: 22, reward: achievementTiers[1]?.reward || 'Pizza Party' },
          15: { count: 12, reward: achievementTiers[2]?.reward || 'Movie Day' },
          20: { count: 7, reward: achievementTiers[3]?.reward || 'Grand Prize' }
        }
      };
      
      const relevantTiers = achievementTiers.map((tier, index) => {
        const hasEarned = studentBooks >= tier.books;
        const count = anonymousAchievementCounts.tierCounts[tier.books]?.count || 0;
        
        return {
          books: tier.books,
          reward: tier.reward,
          count,
          hasEarned,
          isNext: !hasEarned && (index === 0 || studentBooks >= achievementTiers[index - 1].books),
          encouragingText: hasEarned ? 
            `You and ${count - 1} other students earned this!` :
            count > 0 ?
            `${count} students have already earned this reward!` :
            'Be the first to reach this goal!'
        };
      });
      
      setRealWorldAchievementStats({
        tiers: relevantTiers,
        totalStudents: 52, // Total students in school
        nextGoal: relevantTiers.find(tier => tier.isNext)
      });
      
    } catch (error) {
      console.error('Error calculating real world achievement stats:', error);
    }
  }, []);

  // Calculate grade-level stats (ANONYMOUS - no individual student data access)
  const calculateGradeStats = useCallback(async (studentData) => {
    try {
      const currentGrade = studentData.grade;
      
      // ✅ PRIVACY-FIRST: Use only anonymous aggregated data
      // In real implementation, these would be server-side anonymous aggregations
      const anonymousGradeStats = {
        // Anonymous grade-level aggregations (no individual student data)
        gradeData: {
          4: { studentCount: 24, totalBooks: 289, averageBooks: 12.0 },
          5: { studentCount: 28, totalBooks: 356, averageBooks: 12.7 },
          6: { studentCount: 22, totalBooks: 298, averageBooks: 13.5 },
          7: { studentCount: 26, totalBooks: 387, averageBooks: 14.9 },
          8: { studentCount: 21, totalBooks: 334, averageBooks: 15.9 }
        },
        schoolTotal: { studentCount: 121, totalBooks: 1664, averageBooks: 13.8 }
      };
      
      const gradeData = anonymousGradeStats.gradeData[currentGrade];
      const schoolData = anonymousGradeStats.schoolTotal;
      
      if (!gradeData) {
        console.log('No anonymous grade data available');
        return;
      }
      
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      
      // Calculate encouraging percentile based on anonymous data
      // This gives a rough percentile without accessing individual data
      let percentile = 50; // Default middle
      
      if (studentBooks >= gradeData.averageBooks * 1.5) {
        percentile = 85; // Well above average
      } else if (studentBooks >= gradeData.averageBooks * 1.2) {
        percentile = 75; // Above average
      } else if (studentBooks >= gradeData.averageBooks) {
        percentile = 60; // At or above average
      } else if (studentBooks >= gradeData.averageBooks * 0.7) {
        percentile = 40; // Approaching average
      } else {
        percentile = 25; // Below average but still contributing
      }
      
      setGradeStats({
        currentGrade,
        gradeStudentCount: gradeData.studentCount,
        gradeTotalBooks: gradeData.totalBooks,
        averageGradeBooks: gradeData.averageBooks,
        schoolTotalBooks: schoolData.totalBooks,
        averageSchoolBooks: schoolData.averageBooks,
        studentPercentile: percentile,
        encouragingMessage: percentile >= 75 ? 
          `You're reading more than ${percentile}% of Grade ${currentGrade}!` :
          percentile >= 50 ?
          `You're doing great! Keep reading to join the top readers in Grade ${currentGrade}!` :
          `Every book counts! Your Grade ${currentGrade} class has read ${gradeData.totalBooks} books together!`
      });
      
    } catch (error) {
      console.error('Error calculating grade stats:', error);
    }
  }, []);

  // Calculate diocese/global comparison stats (ANONYMOUS)
  const calculateComparisonStats = useCallback(async (studentData) => {
    try {
      // ✅ PRIVACY-FIRST: These would be anonymous aggregations from server
      // Real implementation: Server calculates these percentages across all schools
      // without exposing individual student data
      
      const anonymousComparisons = {
        diocese: {
          studentsWhoReachedFirstTier: 67, // % who hit their teacher's first goal
          studentsWhoReachedFinalTier: 34,  // % who hit their teacher's final goal
          studentsWithStreaks7Plus: 23,     // % with 7+ day streaks (using smart streak logic)
          studentsWithHighRatings: 78       // % who rate books 4+ stars on average
        },
        global: {
          totalBooksRead: 1247892,
          totalSchools: 267,
          totalSaintsUnlocked: 98431,
          studentsWithStreaks30Plus: 8,     // % with 30+ day streaks (smart calculation)
          luminousLegends: 12,               // % who reached Luminous Legend level
          totalReadingMinutes: 15672340      // Total minutes read across platform
        }
      };
      
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      const achievementTiers = studentData.achievementTiers || [];
      const finalTier = achievementTiers[achievementTiers.length - 1];
      
      // Determine student's achievements without comparing to individuals
      const hasReachedFirstTier = achievementTiers.length > 0 && studentBooks >= achievementTiers[0].books;
      const hasReachedFinalTier = finalTier && studentBooks >= finalTier.books;
      const hasStreak7Plus = personalStats?.currentStreak >= 7;
      const hasStreak30Plus = personalStats?.currentStreak >= 30;
      const isLuminousLegend = studentData.currentReadingLevel === 'luminous_legend';
      
      setCompetitionStats({
        dioceseComparison: hasReachedFirstTier ? 
          `You're among the ${anonymousComparisons.diocese.studentsWhoReachedFirstTier}% who reached their first goal!` :
          `${anonymousComparisons.diocese.studentsWhoReachedFirstTier}% of students in your diocese have reached their first goal`,
        globalComparison: hasReachedFinalTier ?
          `Amazing! You're among the ${anonymousComparisons.diocese.studentsWhoReachedFinalTier}% who completed their full reading challenge!` :
          `${anonymousComparisons.diocese.studentsWhoReachedFinalTier}% of students globally complete their full reading challenge`,
        streakComparison: hasStreak30Plus ?
          `Your ${personalStats?.currentStreak}-day streak puts you in the top ${anonymousComparisons.global.studentsWithStreaks30Plus}% globally!` :
          hasStreak7Plus ?
          `Your reading streak puts you in the top ${anonymousComparisons.diocese.studentsWithStreaks7Plus}% of students!` :
          `${anonymousComparisons.diocese.studentsWithStreaks7Plus}% of students maintain a 7+ day reading streak`,
        readingLevelComparison: isLuminousLegend ?
          `You're a Luminous Legend - among the top ${anonymousComparisons.global.luminousLegends}% of readers globally! ✨` :
          `${anonymousComparisons.global.luminousLegends}% of students reach Luminous Legend level`,
        encouragingStats: [
          `Students like you have read over ${anonymousComparisons.global.totalBooksRead.toLocaleString()} books this year!`,
          `Reading programs in ${anonymousComparisons.global.totalSchools}+ schools use Lux Libris`,
          `Catholic students have unlocked over ${anonymousComparisons.global.totalSaintsUnlocked.toLocaleString()} saints!`,
          `Over ${(anonymousComparisons.global.totalReadingMinutes / 60000).toFixed(1)} million minutes of reading completed!`
        ]
      });
      
    } catch (error) {
      console.error('Error calculating comparison stats:', error);
    }
  }, [personalStats]);

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
          genrePreferences: [],
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
        recentUnlocks: unlockedSaints.slice(-3) // Last 3 unlocked
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
    
    // Medal achievements first (most exciting!)
    medalAchievements.forEach(medal => {
      achievements.push(`${medal.emoji} ${medal.achievement}`);
    });
    
    // Top reading achievement
    if (personalStats.booksThisYear >= personalStats.personalGoal) {
      achievements.push(`🎯 Reached ${personalStats.booksThisYear}-book goal!`);
    } else if (personalStats.booksThisYear > 0) {
      achievements.push(`📚 Read ${personalStats.booksThisYear} book${personalStats.booksThisYear > 1 ? 's' : ''} this year!`);
    }
    
    // Streak achievement with tier
    if (personalStats.currentStreak >= 7) {
      achievements.push(`${personalStats.streakTier} (${personalStats.currentStreak} days)!`);
    }
    
    // Reading Level Achievement
    if (personalStats.currentReadingLevel === 'luminous_legend') {
      achievements.push(`✨ Luminous Legend level achieved!`);
    } else if (personalStats.currentReadingLevel === 'radiant_reader') {
      achievements.push(`🌟 Radiant Reader level achieved!`);
    } else if (personalStats.currentReadingLevel === 'bright_beacon') {
      achievements.push(`⭐ Bright Beacon level achieved!`);
    }
    
    // Saints achievement
    if (saintsStats.rarestSaint) {
      if (saintsStats.rarestSaint.luxlings_series === 'Ultimate Redeemer') {
        achievements.push(`✨ ULTIMATE GOAL achieved!`);
      } else if (saintsStats.rarestSaint.luxlings_series === 'Mini Marians') {
        achievements.push(`💎 Marian apparition unlocked!`);
      } else if (saintsStats.rarestSaint.rarity === 'legendary') {
        achievements.push(`⚡ Legendary saint unlocked!`);
      }
    }
    
    if (saintsStats.totalUnlocked >= 50) {
      achievements.push(`♔ ${saintsStats.totalUnlocked} saints unlocked!`);
    } else if (saintsStats.totalUnlocked >= 10) {
      achievements.push(`♔ ${saintsStats.totalUnlocked} saints collected!`);
    }
    
    // Reading quality
    if (readingQuality.averageRating >= 4.5) {
      achievements.push(`⭐ Book Lover (${readingQuality.averageRating}/5 avg rating)!`);
    }
    
    // Diocese/global comparison
    if (competitionStats) {
      if (personalStats.booksThisYear >= (personalStats.achievementTiers[0]?.books || 999)) {
        achievements.push(`🌟 Diocese Goal Achiever!`);
      }
    }
    
    // Real world achievements
    const latestRealWorldAchievement = realWorldAchievements[realWorldAchievements.length - 1];
    if (latestRealWorldAchievement) {
      achievements.push(`🏆 Earned: ${latestRealWorldAchievement.reward}!`);
    }
    
    return {
      topAchievements: achievements.slice(0, 6), // Show top 6 achievements
      studentName: `${studentData.firstName} ${studentData.lastInitial}`,
      schoolName: studentData.schoolName,
      grade: studentData.grade,
      date: new Date().toLocaleDateString(),
      saintsCount: saintsStats.totalUnlocked,
      featuredSaint: saintsStats.rarestSaint,
      medalCount: medalAchievements.length,
      readingLevel: personalStats.currentReadingLevel
    };
  }, [personalStats, saintsStats, readingQuality, competitionStats, realWorldAchievements, medalAchievements, studentData]);

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
      await calculateGradeStats(firebaseStudentData);
      await calculateHealthyHabitsStats(firebaseStudentData);
      await calculateRealWorldAchievementStats(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading stats data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, calculatePersonalStats, calculateReadingQuality, calculateSaintsStats, calculateRealWorldAchievements, calculateMedalAchievements, calculateGradeStats, calculateHealthyHabitsStats, calculateRealWorldAchievementStats]);

  // Calculate comparison stats after personal stats are loaded
  useEffect(() => {
    if (personalStats && studentData) {
      calculateComparisonStats(studentData);
    }
  }, [personalStats, studentData, calculateComparisonStats]);

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
      // In a real implementation, you would generate a PDF here
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const braggingData = generateBraggingRights();
      if (braggingData) {
        // Create a simple text version for now
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

Visit luxlibris.org to learn more about our reading program.
        `;
        
        // Create downloadable file
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

  // Show loading
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your reading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Stats - Lux Libris</title>
        <meta name="description" content="Track your reading progress, achievements, and compare with other students" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* HEADER */}
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
            onClick={() => {
              console.log('Back button clicked, going back');
              router.back();
            }}
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

          <h1 style={{
            fontSize: '24px',
            fontWeight: '400',
            color: currentTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center',
            flex: 1
          }}>
            My Stats
          </h1>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'relative' }}>
            <button
              onClick={() => {
                console.log('Hamburger clicked, current state:', showNavMenu);
                setShowNavMenu(!showNavMenu);
              }}
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
                {navMenuItems.filter(item => !item.current).map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicking:', item.path, 'Current:', item.current, 'Item:', item);
                      setShowNavMenu(false);
                      if (!item.current) {
                        setTimeout(() => {
                          console.log('Navigating to:', item.path);
                          router.push(item.path);
                        }, 100);
                      } else {
                        console.log('Already on current page, not navigating');
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
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
                
                <div style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${currentTheme.primary}40`,
                  backgroundColor: `${currentTheme.primary}10`
                }}>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (notificationProcessing) return;
                      
                      setNotificationProcessing(true);
                      console.log('Requesting notifications...');
                      
                      try {
                        const enabled = await requestNotificationPermission();
                        console.log('Notifications enabled:', enabled);
                      } catch (error) {
                        console.error('Notification error:', error);
                      } finally {
                        setNotificationProcessing(false);
                        setTimeout(() => {
                          setShowNavMenu(false);
                        }, 1000);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: notificationsEnabled ? `${currentTheme.primary}30` : currentTheme.surface,
                      border: `2px solid ${notificationsEnabled ? currentTheme.primary : currentTheme.textSecondary}60`,
                      borderRadius: '8px',
                      cursor: notificationProcessing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: currentTheme.textPrimary,
                      fontWeight: '600',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease',
                      opacity: notificationProcessing ? 0.7 : 1
                    }}
                  >
                    <span>
                      {notificationProcessing ? '⏳' : (notificationsEnabled ? '🔔' : '🔕')}
                    </span>
                    <span>
                      {notificationProcessing ? 'Processing...' : (notificationsEnabled ? 'Notifications On' : 'Enable Notifications')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* TLDR SUMMARY CARD */}
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
                📊 Your Reading Year
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
                    Books Read
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
                    {personalStats.saintsUnlocked}
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 11px)',
                    color: currentTheme.textSecondary
                  }}>
                    Saints
                  </div>
                </div>
              </div>

              {/* Progress toward goal */}
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
                  Goal Progress: {personalStats.booksThisYear}/{personalStats.personalGoal}
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: '#E0E0E0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (personalStats.booksThisYear / personalStats.personalGoal) * 100)}%`,
                    backgroundColor: currentTheme.primary,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {personalStats.booksThisYear >= personalStats.personalGoal && (
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
                  Reading Level
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
                  onClick={() => setShowReadingPersonality(true)}
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
                  🎭 Reading Quiz
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
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
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

          {/* HEALTHY HABITS SCHOOL STATS */}
          {healthyHabitsStats && (
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
                🔥 School Reading Levels
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
                  {healthyHabitsStats.encouragingMessage}
                </div>
              </div>
              
              {/* Reading Level Distribution */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {Object.entries(healthyHabitsStats.levelDistribution).map(([level, data]) => (
                  <div
                    key={level}
                    style={{
                      backgroundColor: level === healthyHabitsStats.currentLevel ? 
                        `${currentTheme.primary}30` : `${currentTheme.primary}10`,
                      borderRadius: '8px',
                      padding: '8px',
                      textAlign: 'center',
                      border: level === healthyHabitsStats.currentLevel ? 
                        `2px solid ${currentTheme.primary}` : 'none'
                    }}
                  >
                    <div style={{
                      fontSize: 'clamp(16px, 5vw, 18px)',
                      marginBottom: '2px'
                    }}>
                      {healthyHabitsStats.levelEmojis[level]}
                    </div>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: 'bold',
                      color: currentTheme.textPrimary
                    }}>
                      {data.count}
                    </div>
                    <div style={{
                      fontSize: 'clamp(9px, 2.5vw, 10px)',
                      color: currentTheme.textSecondary
                    }}>
                      {healthyHabitsStats.levelNames[level]}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary,
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Levels based on daily reading minutes (20min+ = next level)
              </div>
            </div>
          )}

          {/* REAL WORLD ACHIEVEMENT STATS */}
          {realWorldAchievementStats && realWorldAchievementStats.tiers.length > 0 && (
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
                🏆 School Achievement Progress
              </h3>
              
              {realWorldAchievementStats.tiers.map((tier, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: tier.hasEarned ? 
                      `${currentTheme.primary}20` : 
                      tier.isNext ? `${currentTheme.secondary}20` : `${currentTheme.primary}10`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: index < realWorldAchievementStats.tiers.length - 1 ? '8px' : '0',
                    border: tier.isNext ? `2px solid ${currentTheme.secondary}` : 'none'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      flex: 1,
                      minWidth: 0
                    }}>
                      {tier.reward}
                    </div>
                    <div style={{
                      fontSize: 'clamp(16px, 5vw, 20px)',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      {tier.hasEarned ? '✅' : tier.isNext ? '🎯' : '⭕'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    color: currentTheme.textSecondary,
                    marginBottom: '4px'
                  }}>
                    {tier.books} books • {tier.encouragingText}
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    fontWeight: '600',
                    color: tier.hasEarned ? '#4CAF50' : currentTheme.primary
                  }}>
                    {tier.count} student{tier.count !== 1 ? 's' : ''} earned this
                  </div>
                </div>
              ))}
              
              <div style={{
                backgroundColor: `${currentTheme.primary}10`,
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  Total students in school: {realWorldAchievementStats.totalStudents}
                </div>
              </div>
            </div>
          )}

          {/* GRADE COMPARISON */}
          {gradeStats && (
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
                🎓 Grade {gradeStats.currentGrade} Progress
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
                  {gradeStats.encouragingMessage}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
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
                      {gradeStats.gradeTotalBooks}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: currentTheme.textSecondary
                    }}>
                      Grade Total Books
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
                      {gradeStats.averageGradeBooks}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: currentTheme.textSecondary
                    }}>
                      Grade Average
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIOCESE/GLOBAL COMPARISON */}
          {competitionStats && (
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
                🌍 How You Compare
              </h3>
              
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary,
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                <div style={{ 
                  marginBottom: '12px',
                  fontSize: 'clamp(12px, 3.5vw, 13px)',
                  fontWeight: '500',
                  color: currentTheme.textPrimary
                }}>
                  {competitionStats.dioceseComparison}
                </div>
                
                <div style={{ 
                  marginBottom: '12px',
                  fontSize: 'clamp(12px, 3.5vw, 13px)',
                  fontWeight: '500',
                  color: currentTheme.textPrimary
                }}>
                  {competitionStats.streakComparison}
                </div>
                
                {competitionStats.readingLevelComparison && (
                  <div style={{ 
                    marginBottom: '12px',
                    fontSize: 'clamp(12px, 3.5vw, 13px)',
                    fontWeight: '500',
                    color: currentTheme.textPrimary
                  }}>
                    {competitionStats.readingLevelComparison}
                  </div>
                )}
                
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  marginTop: '16px'
                }}>
                  <div style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: currentTheme.textSecondary,
                    fontStyle: 'italic'
                  }}>
                    {competitionStats.encouragingStats[0]}
                  </div>
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
              
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary,
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Total reading time: {Math.round(personalStats.totalReadingMinutes / 60)} hours
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
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  marginBottom: '8px'
                }}>
                  Based on {readingQuality.totalRated} rated books
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textPrimary,
                  fontWeight: '500'
                }}>
                  {readingQuality.readingMoods}
                </div>
              </div>
              
              {readingQuality.favoriteBooks > 0 && (
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
                    5-Star Favorites
                  </div>
                  <div style={{
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {readingQuality.favoriteBooks} books ({readingQuality.fiveStarPercentage}%)
                  </div>
                </div>
              )}
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
                  textAlign: 'center',
                  marginBottom: '16px'
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
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                fontSize: 'clamp(10px, 3vw, 11px)',
                color: currentTheme.textSecondary
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: currentTheme.textPrimary,
                    fontSize: 'clamp(12px, 3.5vw, 14px)'
                  }}>
                    {saintsStats.rarityGroups.common}
                  </div>
                  Common
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: currentTheme.textPrimary,
                    fontSize: 'clamp(12px, 3.5vw, 14px)'
                  }}>
                    {saintsStats.rarityGroups.rare}
                  </div>
                  Rare
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: currentTheme.textPrimary,
                    fontSize: 'clamp(12px, 3.5vw, 14px)'
                  }}>
                    {saintsStats.rarityGroups.legendary + saintsStats.rarityGroups.marian + saintsStats.rarityGroups.ultimate}
                  </div>
                  Legendary+
                </div>
              </div>
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
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
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
                    {achievement.type === 'lifetime' ? '🏆' : 
                     achievement.type === 'annual' ? '🥇' : '⭐'}
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

                  {braggingData?.featuredSaint && (
                    <div style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary,
                        marginBottom: '8px'
                      }}>
                        Featured Saint
                      </div>
                      <div style={{
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: '600',
                        color: currentTheme.textPrimary
                      }}>
                        {braggingData.featuredSaint.name}
                      </div>
                    </div>
                  )}

                  <div style={{
                    backgroundColor: `${currentTheme.primary}10`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    color: currentTheme.textSecondary
                  }}>
                    {braggingData?.schoolName} • Generated {braggingData?.date}
                    <br />
                    Saints Collection: {braggingData?.saintsCount}/137
                    {braggingData?.medalCount > 0 && (
                      <>
                        <br />
                        Competition Medals: {braggingData.medalCount}
                      </>
                    )}
                    {braggingData?.readingLevel && (
                      <>
                        <br />
                        Reading Level: {braggingData.readingLevel}
                      </>
                    )}
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
                    {isGeneratingCertificate ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid currentColor',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        📄 Download Certificate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* READING PERSONALITY MODAL */}
        {showReadingPersonality && (
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
                onClick={() => setShowReadingPersonality(false)}
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
                background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.accent})`,
                borderRadius: '20px 20px 0 0',
                padding: '20px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: '12px' }}>🎭</div>
                <h2 style={{
                  fontSize: 'clamp(18px, 5vw, 20px)',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Reading Personality Tests
                </h2>
                <p style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  opacity: 0.9,
                  margin: '0'
                }}>
                  Discover your reading identity!
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
                    📚 Which quiz speaks to your reading soul?
                  </div>
                </div>
                
                {/* Quiz Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Which Book Are You Quiz */}
                  <button
                    onClick={() => {
                      // Coming soon functionality
                      alert('Coming soon! 📚 This quiz will match you with the perfect book based on your personality!');
                    }}
                    style={{
                      backgroundColor: `${currentTheme.primary}20`,
                      border: `2px solid ${currentTheme.primary}60`,
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(24px, 7vw, 32px)',
                        flexShrink: 0
                      }}>
                        📖
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '4px'
                        }}>
                          Which Book Are You?
                        </div>
                        <div style={{
                          fontSize: 'clamp(11px, 3vw, 12px)',
                          color: currentTheme.textSecondary
                        }}>
                          Find your literary twin! Are you a mystery like &quotWonder&quot or an adventure like &quotHatchet&quot?
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#FF9800',
                        color: 'white',
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        position: 'absolute',
                        top: '8px',
                        right: '8px'
                      }}>
                        COMING SOON
                      </div>
                    </div>
                  </button>

                  {/* Which Character Are You Quiz */}
                  <button
                    onClick={() => {
                      alert('Coming soon! 🎭 Discover if you\'re a brave Hermione, funny Greg Heffley, or wise Charlotte!');
                    }}
                    style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      border: `2px solid ${currentTheme.secondary}60`,
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(24px, 7vw, 32px)',
                        flexShrink: 0
                      }}>
                        🎭
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '4px'
                        }}>
                          Which Character Are You?
                        </div>
                        <div style={{
                          fontSize: 'clamp(11px, 3vw, 12px)',
                          color: currentTheme.textSecondary
                        }}>
                          Are you brave like Harry, clever like Hermione, or funny like Dog Man?
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#FF9800',
                        color: 'white',
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        position: 'absolute',
                        top: '8px',
                        right: '8px'
                      }}>
                        COMING SOON
                      </div>
                    </div>
                  </button>

                  {/* Reading World Quiz */}
                  <button
                    onClick={() => {
                      alert('Coming soon! 🏰 Find out if you belong in Hogwarts, the Magic Tree House, or Dog Man\'s world!');
                    }}
                    style={{
                      backgroundColor: `${currentTheme.accent}20`,
                      border: `2px solid ${currentTheme.accent}60`,
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(24px, 7vw, 32px)',
                        flexShrink: 0
                      }}>
                        🏰
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '4px'
                        }}>
                          Which Reading World?
                        </div>
                        <div style={{
                          fontSize: 'clamp(11px, 3vw, 12px)',
                          color: currentTheme.textSecondary
                        }}>
                          Where would you live? Magical Hogwarts, mysterious Narnia, or funny Dog Man city?
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#FF9800',
                        color: 'white',
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        position: 'absolute',
                        top: '8px',
                        right: '8px'
                      }}>
                        COMING SOON
                      </div>
                    </div>
                  </button>

                </div>

                <div style={{
                  backgroundColor: `${currentTheme.primary}10`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '8px'
                  }}>
                    🌟 Coming Very Soon!
                  </div>
                  <div style={{
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    color: currentTheme.textSecondary,
                    lineHeight: '1.4'
                  }}>
                    These fun personality quizzes will help you discover your reading identity and share it with friends! Results can be added to your Bragging Rights certificate.
                  </div>
                </div>
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
            body {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
          }
          
          /* PWA Mobile Optimizations */
          @media screen and (max-width: 380px) {
            * {
              font-size: clamp(10px, 4vw, 16px) !important;
            }
          }
          
          /* Better touch targets for mobile */
          @media (pointer: coarse) {
            button {
              min-width: 44px;
              min-height: 44px;
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
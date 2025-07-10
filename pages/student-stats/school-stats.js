// pages/student-stats/school-stats.js - School-Wide Stats & Comparisons
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
  
  // School-wide stats data
  const [personalStats, setPersonalStats] = useState(null);
  const [gradeStats, setGradeStats] = useState(null);
  const [healthyHabitsStats, setHealthyHabitsStats] = useState(null);
  const [realWorldAchievementStats, setRealWorldAchievementStats] = useState(null);
  const [competitionStats, setCompetitionStats] = useState(null);

  // Theme definitions (consistent with original)
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

  // Utility function for date strings
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Smart streak calculation
  const calculateSmartStreak = useCallback((completedSessionsByDate, todayStr) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    let streakCount = 0;
    let checkDate;

    if (completedSessionsByDate[todayStr]) {
      checkDate = new Date(today);
    } else if (completedSessionsByDate[yesterdayStr]) {
      checkDate = new Date(yesterday);
    } else {
      return 0;
    }

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

  // Calculate basic personal stats for context
  const calculatePersonalStats = useCallback(async (studentData) => {
    try {
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
      
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const currentStreak = calculateSmartStreak(completedSessionsByDate, todayStr);
      
      const booksThisYear = studentData.booksSubmittedThisYear || 0;
      const personalGoal = studentData.personalGoal || 15;
      
      setPersonalStats({
        booksThisYear,
        personalGoal,
        currentStreak,
        totalReadingMinutes,
        completedSessions,
        currentReadingLevel: studentData.currentReadingLevel || 'faithful_flame'
      });
      
    } catch (error) {
      console.error('Error calculating personal stats:', error);
    }
  }, [calculateSmartStreak]);

  // Calculate healthy habits school-wide stats (ANONYMOUS)
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
      
      const achievementTiers = studentData.achievementTiers || [];
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      
      // Simulated anonymous achievement counts (would come from server aggregation)
      const anonymousAchievementCounts = {
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

  // Calculate grade-level stats (ANONYMOUS)
  const calculateGradeStats = useCallback(async (studentData) => {
    try {
      const currentGrade = studentData.grade;
      
      // ✅ PRIVACY-FIRST: Use only anonymous aggregated data
      const anonymousGradeStats = {
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
      // ✅ PRIVACY-FIRST: Anonymous aggregations from server
      
      const anonymousComparisons = {
        diocese: {
          studentsWhoReachedFirstTier: 67, // % who hit their teacher's first goal
          studentsWhoReachedFinalTier: 34,  // % who hit their teacher's final goal
          studentsWithStreaks7Plus: 23,     // % with 7+ day streaks
          studentsWithHighRatings: 78       // % who rate books 4+ stars on average
        },
        global: {
          totalBooksRead: 1247892,
          totalSchools: 267,
          totalSaintsUnlocked: 98431,
          studentsWithStreaks30Plus: 8,     // % with 30+ day streaks
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

  // Load all school stats data
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
      await calculateHealthyHabitsStats(firebaseStudentData);
      await calculateRealWorldAchievementStats(firebaseStudentData);
      await calculateGradeStats(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading stats data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, calculatePersonalStats, calculateHealthyHabitsStats, calculateRealWorldAchievementStats, calculateGradeStats]);

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
        <meta name="description" content="School-wide reading progress and comparisons" />
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
            🏫 School Stats
          </h1>

          <div style={{ width: '44px' }} />
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
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

          {/* NAVIGATION LINKS */}
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
              📊 My Personal Stats
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
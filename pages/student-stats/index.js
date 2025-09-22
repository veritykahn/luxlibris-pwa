// pages/student-stats/index.js - COMPLETE FIXED VERSION with Badge System, Notifications & Responsive Layout
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usePhaseAccess } from '../../hooks/usePhaseAccess';
import { getStudentDataEntities, updateStudentDataEntities } from '../../lib/firebase';
import { awardBadgeXP } from '../../lib/xp-management'; // ADD THIS LINE
import { getCurrentWeekBadge, getBadgeProgress, getEarnedBadges, getLevelProgress, BADGE_CALENDAR } from '../../lib/badge-system';
import { calculateReadingPersonality, shouldShowFirstBookCelebration, unlockCertificate } from '../../lib/reading-personality';
import { getTheme, getSeasonalThemeAnnouncement } from '../../lib/themes';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import EnhancedBraggingRightsModal from '../../components/EnhancedBraggingRightsModal';
export default function StudentStatsMain() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showFirstBookCelebration, setShowFirstBookCelebration] = useState(false);
  const [showBraggingRights, setShowBraggingRights] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  // BADGE CHALLENGE STATE VARIABLES
  const [showBadgeChallenge, setShowBadgeChallenge] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(null);
  // BADGE NOTIFICATION SYSTEM
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [badgeNotificationData, setBadgeNotificationData] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  // Light overview data
  const [quickStats, setQuickStats] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [levelProgress, setLevelProgress] = useState(null);
  const [currentWeekBadge, setCurrentWeekBadge] = useState(null);
  const [funTidbits, setFunTidbits] = useState([]);
 const [weeklyXP, setWeeklyXP] = useState(0);
  const [seasonalThemeAlert, setSeasonalThemeAlert] = useState(null);
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
const statsNavOptions = useMemo(() => [
  { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview', current: true },
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
  { name: 'Family Battle', path: '/student-stats/family-battle', icon: '🥊', description: 'WWE-style reading showdown!', disabled: false }
], [phaseData.currentPhase]);
  // BADGE NOTIFICATION SYSTEM
  const badgeUnlockFeedback = useCallback(() => {
    // Vibration
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
    } catch (err) {
      console.log('Vibration not supported');
    }
    
    // Sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const createTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Badge unlock melody
      createTone(523, audioContext.currentTime, 0.3); // C
      createTone(659, audioContext.currentTime + 0.2, 0.3); // E
      createTone(784, audioContext.currentTime + 0.4, 0.5); // G
    } catch (err) {
      console.log('Audio notification not supported');
    }
  }, []);
  const sendBadgeNotification = useCallback((badgeName, xpEarned) => {
    // Browser notification
    if (notificationsEnabled && Notification.permission === 'granted') {
      try {
        new Notification('🏆 New Badge Unlocked!', {
          body: `You've earned ${badgeName}! +${xpEarned} XP gained!`,
          icon: '/images/lux_libris_logo.png',
          badge: '/images/lux_libris_logo.png',
          tag: 'badge-unlock',
          requireInteraction: false,
          silent: false
        });
      } catch (error) {
        console.log('Badge notification failed:', error);
      }
    }
    
    // In-app notification
    setBadgeNotificationData({
      name: badgeName,
      xp: xpEarned
    });
    setShowBadgeNotification(true);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowBadgeNotification(false);
    }, 4000);
  }, [notificationsEnabled]);
  
  // CHECK FOR NEW CONTENT BADGES FUNCTION
const checkForNewContentBadges = useCallback(async () => {
  if (!studentData) return;
  
  const contentBadgeWeeks = [1, 6, 16, 24, 33, 43, 44];
  const newBadges = [];
  
  for (const week of contentBadgeWeeks) {
    const badge = BADGE_CALENDAR[week]; // Get badge for specific week
    if (badge && studentData[`badgeEarnedWeek${week}`]) {
      // Check if this badge was earned recently (within last hour)
      const lastBadgeEarned = studentData.lastBadgeEarned?.toDate?.() || 
                             studentData.lastBadgeEarned ? new Date(studentData.lastBadgeEarned) : null;
      
      if (lastBadgeEarned) {
        const hoursSince = (new Date() - lastBadgeEarned) / (1000 * 60 * 60);
        
        if (hoursSince < 1 && (badge.type === 'content' || badge.type === 'voting')) {
          newBadges.push({ ...badge, week });
        }
      }
    }
  }
    
    // Show notification for new badges
    if (newBadges.length > 0) {
      const latestBadge = newBadges[newBadges.length - 1];
      badgeUnlockFeedback();
      sendBadgeNotification(latestBadge.name, latestBadge.xp);
      
      // Update earned badges list
      const updatedBadges = getEarnedBadges(studentData);
      setEarnedBadges(updatedBadges);
    }
  }, [studentData, badgeUnlockFeedback, sendBadgeNotification]);
  
  // FIXED BADGE AWARD LOGIC with XP management system
  const awardBadgeIfComplete = async (progress, weekBadge) => {
    if (!progress || !progress.completed || !weekBadge || !studentData) return false;
    
    // Check if already earned using the flag
    if (studentData[`badgeEarnedWeek${weekBadge.week}`]) return false;
    
    try {
      // Use the new XP management system
      const result = await awardBadgeXP(studentData, weekBadge.week, 'stats-dashboard');
      
      if (result.success) {
        // Update local state
        setStudentData(prev => ({
          ...prev,
          [`badgeEarnedWeek${weekBadge.week}`]: true,
          totalXP: result.newTotal
        }));
        
        // Trigger notifications
        badgeUnlockFeedback();
        sendBadgeNotification(weekBadge.name, weekBadge.xp);
        
        // Show success message
        setShowSuccess(`🏆 ${weekBadge.name} badge earned! +${result.xpAwarded} XP!`);
        setTimeout(() => setShowSuccess(''), 4000);
        
        // Reload badge data
        const badges = getEarnedBadges({...studentData, [`badgeEarnedWeek${weekBadge.week}`]: true});
        setEarnedBadges(badges);
        
        return true;
      } else if (result.duplicate) {
        console.log('Badge already awarded - race condition prevented');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  };
  // BADGE CHALLENGE FUNCTIONS
  const calculateChallengeProgress = useCallback(async (studentData, weekBadge) => {
    if (!weekBadge || !studentData) return null;
    
    try {
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      
      // Get current week's sessions (aligned with badge week system)
      const today = new Date();
      const currentYear = today.getFullYear();
      const june1 = new Date(currentYear, 5, 1); // June 1st this year

      // Calculate days since June 1st
      let daysSinceJune1;
      if (today < june1) {
        const previousJune1 = new Date(currentYear - 1, 5, 1);
        daysSinceJune1 = Math.floor((today.getTime() - previousJune1.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysSinceJune1 = Math.floor((today.getTime() - june1.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Calculate the start of the current badge week
      const weekNumber = Math.floor(daysSinceJune1 / 7);
      const weekStartDays = weekNumber * 7;

      const weekStart = new Date(today < june1 ? new Date(currentYear - 1, 5, 1) : june1);
      weekStart.setDate(weekStart.getDate() + weekStartDays);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Format dates for Firestore query
      const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = getLocalDateString(weekStart);
      const endDateStr = getLocalDateString(weekEnd);
      
      // Get this week's sessions
      const weekQuery = query(
        sessionsRef,
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );
      const weekSnapshot = await getDocs(weekQuery);
      
      const sessions = [];
      const dailySessions = {};
      const dailyMinutes = {};
      let totalMinutes = 0;
      let completedSessions = 0;
      let longSessions30 = 0;
      let longSessions45 = 0;
      let longSessions60 = 0;
      let longSessions90 = 0;
      let morningSessions = 0;
      let eveningSessions = 0;
      let weekendSessions = 0;
      
      weekSnapshot.forEach(doc => {
        const session = doc.data();
        sessions.push(session);
        totalMinutes += session.duration || 0;
        
        if (session.completed) {
          completedSessions++;
          dailySessions[session.date] = true;
          
          // Track daily minutes
          if (!dailyMinutes[session.date]) {
            dailyMinutes[session.date] = 0;
          }
          dailyMinutes[session.date] += session.duration || 0;
          
          // Track long sessions
          if (session.duration >= 30) longSessions30++;
          if (session.duration >= 45) longSessions45++;
          if (session.duration >= 60) longSessions60++;
          if (session.duration >= 90) longSessions90++;
          
          // Track time-based sessions
          const sessionHour = new Date(session.startTime).getHours();
          if (sessionHour < 9) morningSessions++;
          if (sessionHour >= 19) eveningSessions++;
          
          // Track weekend sessions
// Parse date string as local time, not UTC
const [year, month, day] = session.date.split('-').map(Number);
const sessionDate = new Date(year, month - 1, day); // month is 0-indexed
const sessionDay = sessionDate.getDay();
if (sessionDay === 0 || sessionDay === 6) weekendSessions++;
        }
      });
      
      const daysWithReading = Object.keys(dailySessions).length;
      const todayStr = getLocalDateString(today);
      const hasReadToday = dailySessions[todayStr] || false;
      
      // Check if all days have 20+ or 30+ minutes
let daysWithMin20 = 0;
let daysWithMin30 = 0;
let daysWithMin15 = 0;
Object.values(dailyMinutes).forEach(minutes => {
  if (minutes >= 15) daysWithMin15++;
  if (minutes >= 20) daysWithMin20++;
  if (minutes >= 30) daysWithMin30++;
});
      
      // Calculate progress based on badge type and requirements
      let progress = null;
      
      switch (weekBadge.name) {
        // CONTENT BADGES (shouldn't be in timer progress)
        case "Hummingbird Herald":
case "Peacock Pride":
case "Woodpecker Wisdom":
case "Raven Ratings":
case "Spoonbill Scholar":
case "Gannet Sprint":
case "Cormorant Democracy":
  // Check if content badge has been earned
  const isContentBadgeEarned = studentData[`badgeEarnedWeek${weekBadge.week}`] || false;
  progress = {
    type: 'content_badge',
    current: isContentBadgeEarned ? 1 : 0,
    target: 1,
    percentage: isContentBadgeEarned ? 100 : 0,
    description: 'Complete the required action to earn this content badge',
    completed: isContentBadgeEarned
  };
  break;
        
        // FIRST SESSION BADGES
        case "Kingfisher Kickoff":
        case "Pigeon Starter":
          progress = {
            type: 'first_session',
            current: completedSessions,
            target: 1,
            percentage: Math.min(100, (completedSessions / 1) * 100),
            description: 'Complete any reading session',
            completed: completedSessions >= 1
          };
          break;
        
        // 30+ MINUTE SESSION BADGES
        case "Cardinal Courage":
          progress = {
            type: 'long_session_30',
            current: longSessions30,
            target: 1,
            percentage: Math.min(100, (longSessions30 / 1) * 100),
            description: 'Complete a 30+ minute session',
            completed: longSessions30 >= 1
          };
          break;
        
        // 45+ MINUTE SESSION BADGES
        case "Toucan Triumph":
        case "Ostrich Odyssey":
          progress = {
            type: 'long_session_45',
            current: longSessions45,
            target: 1,
            percentage: Math.min(100, (longSessions45 / 1) * 100),
            description: 'Complete a 45+ minute session',
            completed: longSessions45 >= 1
          };
          break;
        
        // 60+ MINUTE SESSION BADGES
        case "Bird of Paradise Performance":
          progress = {
            type: 'long_session_60',
            current: longSessions60,
            target: 1,
            percentage: Math.min(100, (longSessions60 / 1) * 100),
            description: 'Complete a 60+ minute session',
            completed: longSessions60 >= 1
          };
          break;
          
        // 90+ MINUTE SESSION BADGES
        case "Horned Owl Summit":
          progress = {
            type: 'long_session_90',
            current: longSessions90,
            target: 1,
            percentage: Math.min(100, (longSessions90 / 1) * 100),
            description: 'Complete a 90+ minute session',
            completed: longSessions90 >= 1
          };
          break;
        
        // WEEKEND READING BADGES
        case "Puffin Power":
          progress = {
            type: 'weekend_reading',
            current: weekendSessions,
            target: 1,
            percentage: Math.min(100, (weekendSessions / 1) * 100),
            description: 'Read on Saturday or Sunday',
            completed: weekendSessions >= 1
          };
          break;
          
        case "Secretary Bird Weekend":
  progress = {
    type: 'both_weekend_days',
    current: weekendSessions,
    target: 2,
    percentage: Math.min(100, (weekendSessions / 2) * 100),
    description: 'Complete 2 reading sessions on weekend days', // Changed description
    completed: weekendSessions >= 2
  };
  break;
        
        // MORNING SESSION BADGES
        case "Macaw Motivation":
        case "Pheasant Focus":
          progress = {
            type: 'morning_sessions',
            current: morningSessions,
            target: 2,
            percentage: Math.min(100, (morningSessions / 2) * 100),
            description: 'Complete 2 morning sessions (before 9am)',
            completed: morningSessions >= 2
          };
          break;
          
        case "Booby Morning":
          progress = {
            type: 'morning_sessions',
            current: morningSessions,
            target: 4,
            percentage: Math.min(100, (morningSessions / 4) * 100),
            description: 'Complete 4 morning sessions',
            completed: morningSessions >= 4
          };
          break;
        
        // EVENING SESSION BADGES
        case "Barn Owl Night Reader":
          progress = {
            type: 'evening_sessions',
            current: eveningSessions,
            target: 2,
            percentage: Math.min(100, (eveningSessions / 2) * 100),
            description: 'Complete 2 evening sessions (after 7pm)',
            completed: eveningSessions >= 2
          };
          break;
        
        // DAYS WITH READING BADGES
        case "Flamingo Focus":
          progress = {
            type: 'reading_days',
            current: daysWithReading,
            target: 4,
            percentage: Math.min(100, (daysWithReading / 4) * 100),
            description: 'Read on 4 different days',
            completed: daysWithReading >= 4
          };
          break;
        
        case "Heron Habits":
          case "Bee-eater Brilliance": 
          progress = {
            type: 'consecutive_20min_days',
            current: daysWithMin20,
            target: 5,
            percentage: Math.min(100, (daysWithMin20 / 5) * 100),
            description: 'Read 20+ min for 5 days',
            completed: daysWithMin20 >= 5
          };
          break;
        
        case "Duck Dedication":
        case "Oystercatcher Streak":
        case "Grebe Streak":
        case "Kiwi Consistency":
          progress = {
            type: 'daily_reading',
            current: daysWithReading,
            target: 7,
            percentage: Math.min(100, (daysWithReading / 7) * 100),
            description: 'Read every day this week',
            completed: daysWithReading >= 7
          };
          break;
          
        case "Lyre Bird Perfection":
        case "Hornbill Champion":
          progress = {
            type: 'daily_30min',
            current: daysWithMin30,
            target: 7,
            percentage: Math.min(100, (daysWithMin30 / 7) * 100),
            description: 'Read 30+ min every day',
            completed: daysWithMin30 >= 7
          };
          break;

          case "Shoebill Strength":
  progress = {
    type: 'daily_15min',
    current: daysWithMin15,
    target: 7,
    percentage: Math.min(100, (daysWithMin15 / 7) * 100),
    description: 'Read 15+ min every day (7 days)',
    completed: daysWithMin15 >= 7
  };
  break;
        
        // TOTAL MINUTES BADGES
        case "Pelican Persistence":
        case "Cassowary Challenge":
        case "Sandgrouse Summer":
          progress = {
            type: 'total_minutes_180',
            current: totalMinutes,
            target: 180,
            percentage: Math.min(100, (totalMinutes / 180) * 100),
            description: 'Read 180+ minutes total (3 hours)',
            completed: totalMinutes >= 180
          };
          break;
        
        case "Bald Eagle Excellence":
        case "Crow Marathon":
          progress = {
            type: 'total_minutes_240',
            current: totalMinutes,
            target: 240,
            percentage: Math.min(100, (totalMinutes / 240) * 100),
            description: 'Read 240+ minutes total (4 hours)',
            completed: totalMinutes >= 240
          };
          break;
        
        // SPECIAL SESSION REQUIREMENTS
        case "Albatross Adventure":
          progress = {
            type: 'sessions_with_total',
            current: completedSessions,
            target: 3,
            percentage: Math.min(100, (completedSessions / 3) * 100),
            description: 'Complete 3 sessions (60+ min total)',
            completed: completedSessions >= 3 && totalMinutes >= 60
          };
          break;
          
        case "Frigate Lightning":
          const sessions30Plus = sessions.filter(s => s.duration >= 30 && s.completed).length;
          progress = {
            type: 'multiple_30min_sessions',
            current: sessions30Plus,
            target: 3,
            percentage: Math.min(100, (sessions30Plus / 3) * 100),
            description: 'Complete 3 sessions of 30+ minutes',
            completed: sessions30Plus >= 3
          };
          break;
          
        case "Roadrunner Speed":
          progress = {
            type: 'multiple_45min_sessions',
            current: longSessions45,
            target: 3,
            percentage: Math.min(100, (longSessions45 / 3) * 100),
            description: 'Complete 3 sessions of 45+ minutes',
            completed: longSessions45 >= 3
          };
          break;
        
        // SEASONAL/HOLIDAY BADGES - Just need any session
        case "Quetzal Quest":
        case "Vulture Victory":
        case "Penguin Thanksgiving":
        case "Swan Serenity":
        case "Snowy Owl Scholar":
        case "Ibis Inspiration":
        case "Seagull Sweetheart":
        case "Hoopoe Luck":
        case "Jacana Journey":
        case "Loon Library":
          progress = {
            type: 'seasonal',
            current: completedSessions,
            target: 1,
            percentage: Math.min(100, (completedSessions / 1) * 100),
            description: 'Complete any reading session this week',
            completed: completedSessions >= 1
          };
          break;
        
        // IMPROVEMENT BADGES (need special logic)
       case "Goose Goals":
  // Calculate last week vs this week minutes
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  
  // Get last week's sessions (both completed AND banked sessions count)
  let lastWeekMinutes = 0;
  sessions.forEach(session => {
    const sessionDate = new Date(session.date + 'T00:00:00');
    if (sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd) {
      lastWeekMinutes += session.duration || 0;
    }
  });
  
  const thisWeekMinutes = totalMinutes;
  
  // If last week was 0, any reading this week counts as improvement
  let targetMinutes, hasImprovement;
  if (lastWeekMinutes === 0) {
    targetMinutes = 1; // Just need 1 minute to show improvement from 0
    hasImprovement = thisWeekMinutes >= 1;
  } else {
    targetMinutes = Math.ceil(lastWeekMinutes * 1.2); // 20% more
    hasImprovement = thisWeekMinutes >= targetMinutes;
  }
  
  progress = {
    type: 'weekly_improvement',
    current: thisWeekMinutes,
    target: targetMinutes,
    percentage: Math.min(100, Math.round((thisWeekMinutes / targetMinutes) * 100)),
    description: lastWeekMinutes === 0 ? 
      'Read 1+ minutes this week (improvement from 0 last week)' :
      `Read ${targetMinutes} minutes (20% more than last week's ${lastWeekMinutes})`,
    completed: hasImprovement,
    lastWeekMinutes: lastWeekMinutes,
    thisWeekMinutes: thisWeekMinutes
  };
  break;

case "Roller Progress":
case "Avocet Achievement":
case "Turnstone Variety":
  // These need comparison with previous week or special calculations
  progress = {
    type: 'special',
    current: 0,
    target: 1,
    percentage: 0,
    description: 'Special requirements - check badge description',
    completed: false
  };
  break;
        
        default:
          console.warn(`Unknown badge in progress calculation: ${weekBadge.name}`);
          progress = {
            type: 'unknown',
            current: 0,
            target: 1,
            percentage: 0,
            description: 'Unknown badge type',
            completed: false
          };
          break;
      }
      
      return {
        ...progress,
        sessionsThisWeek: sessions.length,
        daysWithReading,
        totalMinutes,
        hasReadToday,
        weekStart: weekStart.toLocaleDateString(),
        weekEnd: weekEnd.toLocaleDateString()
      };
      
    } catch (error) {
      console.error('Error calculating challenge progress:', error);
      return null;
    }
  }, []);
  // ENHANCED BADGE CHALLENGE CLICK HANDLER
  const handleBadgeChallengeClick = async () => {
    if (currentWeekBadge && studentData) {
      const progress = await calculateChallengeProgress(studentData, currentWeekBadge);
      setChallengeProgress(progress);
      setShowBadgeChallenge(true);
      
      // Check if badge should be awarded
      if (progress && progress.completed) {
        await awardBadgeIfComplete(progress, currentWeekBadge);
      }
    }
  };
  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);
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
        setShowBadgeChallenge(false);
        setShowSuccess('');
        setShowBadgeNotification(false);
        setSeasonalThemeAlert(null); // ADD THIS LINE
      }
    };
    if (showNavMenu || showStatsDropdown || showFirstBookCelebration || showBraggingRights || showBadgeChallenge || showBadgeNotification) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown, showFirstBookCelebration, showBraggingRights, showBadgeChallenge, showBadgeNotification]);
  // Generate dynamic celebration messages with phase awareness
  const generateCelebrationMessages = useCallback((stats) => {
    const messages = {
      books: '',
      streak: '',
      saints: '',
      readingTime: ''
    };
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
  // Generate enhanced fun tidbits with phase awareness
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
        tidbits.push(`🎯 Badge Champion! Latest: ${latestBadge.name}!`);
      } else if (earnedBadges.length > 0) {
        const latestBadge = earnedBadges[earnedBadges.length - 1];
        tidbits.push(`🏅 Achievement unlocked: ${latestBadge.name}!`);
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
      
      // Phase-aware motivational messages
      if (phaseData.currentPhase === 'VOTING') {
        tidbits.push(`🗳️ Amazing job this year! Time to vote for your favorites!`);
      } else if (phaseData.currentPhase === 'RESULTS') {
        tidbits.push(`🏆 Congratulations on a fantastic reading year!`);
      } else if (phaseData.currentPhase === 'TEACHER_SELECTION') {
        tidbits.push(`📚 Keep reading strong - your streaks, XP & saints are safe!`);
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
  }, [earnedBadges, levelProgress, quickStats, phaseData.currentPhase]);
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
  // Load student data and calculate stats
  const loadStatsData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      // UPDATED: Use getTheme instead of themes object
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const theme = getTheme(selectedThemeKey);
      setCurrentTheme(theme);
      
      // ADD: Check for seasonal themes
      const seasonalAnnouncements = getSeasonalThemeAnnouncement();
      if (seasonalAnnouncements.length > 0 && !firebaseStudentData.selectedTheme) {
        // Show seasonal theme notification if user hasn't selected a theme
        setSeasonalThemeAlert(seasonalAnnouncements[0]);
        setTimeout(() => setSeasonalThemeAlert(null), 5000);
      }
      
      // Load current week's badge challenge
      const weekBadge = getCurrentWeekBadge();
      setCurrentWeekBadge(weekBadge);
      
      // Get earned badges, badge progress, and level progress
      const badges = getEarnedBadges(firebaseStudentData);
      const badgeStats = getBadgeProgress(firebaseStudentData);
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
  }, [user, router, calculateQuickStats]);
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
  
  // Check for new content badges after data loads
  useEffect(() => {
    if (studentData && !isLoading) {
      checkForNewContentBadges();
    }
  }, [studentData, isLoading, checkForNewContentBadges]);
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
  // Get phase-specific messaging for the dashboard
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
  // Badge notification popup component
  const BadgeNotificationPopup = ({ show, badgeData }) => {
    if (!show || !badgeData) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#10B981',
        color: 'white',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '320px',
        animation: 'slideInRight 0.5s ease-out, fadeOut 0.5s ease-in 3.5s forwards',
        transform: 'translateX(0)'
      }}>
        <div style={{
          fontSize: '32px',
          animation: 'bounce 1s infinite'
        }}>
          🏆
        </div>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            New Badge Unlocked!
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.9
          }}>
            {badgeData.name} • +{badgeData.xp} XP
          </div>
        </div>
      </div>
    );
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
        
        {/* SUCCESS MESSAGE DISPLAY */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
            maxWidth: '90vw',
            animation: 'slideInDown 0.3s ease-out'
          }}>
            {showSuccess}
          </div>
        )}
        
        {/* SEASONAL THEME NOTIFICATION */}    {/* <-- ADD THIS ENTIRE BLOCK HERE */}
        {seasonalThemeAlert && (
          <div style={{
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
            cursor: 'pointer',
            animation: 'slideInDown 0.3s ease-out'
          }}
          onClick={() => router.push('/student-settings')}
          >
            {seasonalThemeAlert.icon} {seasonalThemeAlert.message} Tap to use!
          </div>
        )}
        
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
          {/* HAMBURGER MENU WITH PHASE-AWARE LOCKING */}
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
            {/* PHASE-SPECIFIC ALERT BANNER */}
            {getPhaseSpecificMessage() && (
              <div className="phase-alert-banner" style={{
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
            <div className="stats-main-content" style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '500px', margin: '0 auto' }}>
          
              {/* BADGE CHALLENGE PILL */}
              {hasAccess('achievements') && currentWeekBadge && (
                <button
                  className="badge-challenge-pill"
                  onClick={handleBadgeChallengeClick}
                  style={{
                    backgroundColor: currentTheme.surface,
                    borderRadius: '50px',
                    padding: '12px 20px',
                    marginBottom: '20px',
                    boxShadow: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    border: `1px solid ${currentTheme.primary}20`,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    outline: 'none',
                    textShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.backgroundColor = `${currentTheme.primary}05`;
                    e.currentTarget.style.borderColor = `${currentTheme.primary}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = currentTheme.surface;
                    e.currentTarget.style.borderColor = `${currentTheme.primary}20`;
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img 
                      src={`/badges/${currentWeekBadge.pngName}`}
                      alt={currentWeekBadge.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.src = '/badges/hummingbird.png';
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      textShadow: 'none',
                      textDecoration: 'none'
                    }}>
                      {currentWeekBadge.week === 0 ? 'Challenge Starting Soon!' : 'This Week\'s Challenge'}
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 11px)',
                      color: currentTheme.textSecondary,
                      textShadow: 'none',
                      textDecoration: 'none'
                    }}>
                      {currentWeekBadge.name} • Click for details
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme.primary,
                    fontWeight: '600',
                    textShadow: 'none'
                  }}>
                    📋
                  </div>
                </button>
              )}
          
              {/* ENHANCED READING JOURNEY WITH DYNAMIC MESSAGING */}
              {(() => {
                const celebrationMessages = generateCelebrationMessages(quickStats);
                const heroStat = getHeroStat(quickStats);
                
                return (
                  <div className="reading-journey-card" style={{
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
                    
                    <div className="stats-grid" style={{
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
                    {/* ENHANCED XP DISPLAY */}
                    <div className="xp-display-card" style={{
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
                      onClick={() => {
                        if (!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') {
                          // Show click message for locked state
                          setShowSuccess('🗓️ Bragging Rights unlocks March 31st when voting begins! Keep reading nominees, making submissions, and earning XP until then! 🏆');
                          setTimeout(() => setShowSuccess(''), 4000);
                        } else {
                          setShowBraggingRights(true);
                        }
                      }}
                      className="bragging-rights-button"
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
                        animation: (hasAccess('votingInterface') || hasAccess('votingResults')) ? 
                          'braggingRightsUnlock 0.8s ease-out 0.6s both, bounce 2s ease-in-out infinite 1.4s' : 
                          'statsSlideIn 0.6s ease-out 0.6s both',
                        position: 'relative',
                        overflow: 'hidden',
                        transform: 'translateY(0)',
                        transition: 'all 0.3s ease',
                        opacity: (!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 0.8 : 1
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
                      {/* SPARKLES FOR UNLOCKED STATE */}
                      {(hasAccess('votingInterface') || hasAccess('votingResults')) && (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            fontSize: '12px',
                            animation: 'sparkle 1.5s ease-in-out infinite',
                            pointerEvents: 'none'
                          }}>
                            ✨
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            fontSize: '10px',
                            animation: 'sparkle 1.5s ease-in-out infinite 0.5s',
                            pointerEvents: 'none'
                          }}>
                            ⭐
                          </div>
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '8px',
                            fontSize: '8px',
                            animation: 'sparkle 1.5s ease-in-out infinite 1s',
                            pointerEvents: 'none'
                          }}>
                            ✨
                          </div>
                          <div style={{
                            position: 'absolute',
                            top: '20%',
                            right: '20%',
                            fontSize: '6px',
                            animation: 'sparkle 1.5s ease-in-out infinite 1.2s',
                            pointerEvents: 'none'
                          }}>
                            ⭐
                          </div>
                        </>
                      )}
                      
                      <span style={{
                        fontSize: 'clamp(16px, 4vw, 18px)',
                        animation: (hasAccess('votingInterface') || hasAccess('votingResults')) ? 
                          'bounce 2s ease-in-out infinite' : 
                          (earnedBadges.length >= 5 ? 'bounce 2s ease-in-out infinite' : 'none')
                      }}>
                        {(!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? '🔒' : '🏆'}
                      </span>
                      {(!hasAccess('votingInterface') && !hasAccess('votingResults') && phaseData.currentPhase === 'ACTIVE') ? 
                        'Bragging Rights Locked' :
                       (hasAccess('votingInterface') || hasAccess('votingResults')) ? 
                        'UNLOCKED! Bragging Rights!' :
                       earnedBadges.length >= 10 ? 'CHAMPION Bragging Rights!' :
                       earnedBadges.length >= 5 ? 'SUPERSTAR Bragging Rights!' :
                       'Bragging Rights'}
                    </button>
                  </div>
                );
              })()}
              {/* ENHANCED FUN TIDBITS SECTION */}
              {funTidbits.length > 0 && (
                <div className="fun-tidbits-section" style={{
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
                  
                  <div className="tidbits-grid">
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
          </>
        )}
        {/* ENHANCED BRAGGING RIGHTS MODAL */}
        <EnhancedBraggingRightsModal
          show={showBraggingRights}
          onClose={() => setShowBraggingRights(false)}
          studentData={studentData}
          earnedBadges={earnedBadges}
          levelProgress={levelProgress}
          readingPersonality={null}
          currentTheme={currentTheme}
        />
        {/* FIXED BADGE CHALLENGE MODAL WITH COMPLETION STATE */}
        {showBadgeChallenge && currentWeekBadge && (
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
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={() => setShowBadgeChallenge(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: 'white',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                ✕
              </button>
              {/* Header */}
              <div style={{
                background: challengeProgress?.completed 
                  ? 'linear-gradient(135deg, #10B981, #059669)' 
                  : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                borderRadius: '20px 20px 0 0',
                padding: '24px',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* COMPLETION SPARKLES */}
                {challengeProgress?.completed && (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '20px',
                      fontSize: '20px',
                      animation: 'sparkle 1.5s ease-in-out infinite'
                    }}>✨</div>
                    <div style={{
                      position: 'absolute',
                      top: '30px',
                      right: '30px',
                      fontSize: '16px',
                      animation: 'sparkle 1.5s ease-in-out infinite 0.5s'
                    }}>⭐</div>
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '40px',
                      fontSize: '12px',
                      animation: 'sparkle 1.5s ease-in-out infinite 1s'
                    }}>✨</div>
                  </>
                )}
                
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: challengeProgress?.completed ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s ease'
                }}>
                  <img 
                    src={`/badges/${currentWeekBadge.pngName}`}
                    alt={currentWeekBadge.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'contain',
                      filter: challengeProgress?.completed ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none'
                    }}
                    onError={(e) => {
                      e.target.src = '/badges/hummingbird.png';
                    }}
                  />
                </div>
                
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  {currentWeekBadge.name}
                </h2>
                
                {challengeProgress?.completed ? (
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    animation: 'bounce 2s infinite'
                  }}>
                    🎉 CHALLENGE COMPLETED! 🎉
                  </div>
                ) : (
                  <div style={{
                    fontSize: '14px',
                    opacity: 0.9,
                    marginBottom: '8px'
                  }}>
                    Week {currentWeekBadge.week} Challenge • {currentWeekBadge.xp} XP
                  </div>
                )}
                
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  {challengeProgress?.weekStart} - {challengeProgress?.weekEnd}
                </div>
              </div>
              <div style={{ padding: '24px' }}>
                {/* COMPLETED STATE */}
                {challengeProgress?.completed ? (
                  <>
                    <div style={{
                      backgroundColor: '#10B98120',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: '2px solid #10B98160',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '12px'
                      }}>🏆</div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#10B981',
                        marginBottom: '8px'
                      }}>
                        Well Done!
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: currentTheme.textPrimary,
                        marginBottom: '12px'
                      }}>
                        You&apos;ve successfully completed this week&apos;s reading challenge and earned the {currentWeekBadge.name} badge!
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#10B981'
                      }}>
                        +{currentWeekBadge.xp} XP Earned! ⚡
                      </div>
                    </div>
                    
                    {/* View All Badges Button */}
                    <button
                      onClick={() => {
                        setShowBadgeChallenge(false);
                        router.push('/student-stats/my-stats');
                      }}
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
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      🏅 View All Your Badges
                    </button>
                  </>
                ) : (
                  <>
                    {/* PROGRESS STATE */}
                    <div style={{
                      backgroundColor: `${currentTheme.primary}15`,
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: `2px solid ${currentTheme.primary}30`
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: currentTheme.textPrimary,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🎯 The Challenge
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: currentTheme.textPrimary,
                        lineHeight: '1.4'
                      }}>
                        {currentWeekBadge.description}
                      </div>
                    </div>
                    {/* Progress Tracking */}
{challengeProgress && (
  <div style={{
    backgroundColor: `${currentTheme.secondary}15`,
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
    border: `2px solid ${currentTheme.secondary}30`
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        // FIX: Use dark text for lavender space theme
        color: currentTheme.assetPrefix === 'lavender_space' ? '#2A1B3D' : currentTheme.textPrimary,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        📊 Progress: {challengeProgress.current}/{challengeProgress.target}
      </div>
      <div style={{
        fontSize: '13px',
        // FIX: Use dark text for lavender space theme
        color: challengeProgress.completed ? '#4CAF50' : (currentTheme.assetPrefix === 'lavender_space' ? '#4A148C' : currentTheme.textSecondary),
        fontWeight: '600'
      }}>
        {challengeProgress.completed ? '✅ Complete!' : `${Math.round(challengeProgress.percentage)}%`}
      </div>
    </div>
                        
                        <div style={{
                          height: '8px',
                          backgroundColor: '#E0E0E0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginBottom: '6px'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${challengeProgress.percentage}%`,
                            background: challengeProgress.completed 
                              ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
                              : `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        
                        <div style={{
  fontSize: '11px',
  // FIX: Use dark text for lavender space theme
  color: currentTheme.assetPrefix === 'lavender_space' ? '#6A4C93' : currentTheme.textSecondary,
  marginBottom: '6px'
}}>
  {challengeProgress.description}
</div>
                        
                        <div style={{
  padding: '6px 8px',
  backgroundColor: 'rgba(255,255,255,0.5)',
  borderRadius: '6px',
  fontSize: '10px',
  // FIX: Use dark text for lavender space theme
  color: currentTheme.assetPrefix === 'lavender_space' ? '#6A4C93' : currentTheme.textSecondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '4px'
}}>
  <span>📈 {challengeProgress.sessionsThisWeek} sessions • {challengeProgress.daysWithReading} days • {challengeProgress.totalMinutes}min</span>
                          {challengeProgress.hasReadToday && <span style={{ color: '#4CAF50', fontWeight: '600' }}>✅ Read today!</span>}
                        </div>
                      </div>
                    )}
                    {/* Action Buttons */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px'
                    }}>
                      <button
                        onClick={() => {
                          setShowBadgeChallenge(false);
                          router.push('/student-healthy-habits');
                        }}
                        style={{
                          backgroundColor: currentTheme.primary,
                          color: currentTheme.textPrimary,
                          border: 'none',
                          borderRadius: '16px',
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minHeight: '44px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        📖 Start Reading
                      </button>
                      
                      <button
                        onClick={() => setShowBadgeChallenge(false)}
                        style={{
                          backgroundColor: currentTheme.textSecondary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minHeight: '44px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
                {/* Bird Fact */}
                <div style={{
                  backgroundColor: `${currentTheme.accent || currentTheme.primary}15`,
                  borderRadius: '16px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🐦 Amazing Bird Fact!
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: currentTheme.textPrimary,
                    lineHeight: '1.5'
                  }}>
                    {currentWeekBadge.birdFact}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* BADGE NOTIFICATION POPUP */}
        <BadgeNotificationPopup 
          show={showBadgeNotification}
          badgeData={badgeNotificationData}
        />
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
          
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes fadeOut {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100%);
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
          
          @keyframes pulseGlow {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
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
              background-color: ${currentTheme.primary};
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
          /* ENHANCED DESKTOP RESPONSIVE LAYOUT */
          @media screen and (min-width: 768px) and (max-width: 1024px) {
            .stats-main-content {
              max-width: 600px !important;
              padding: 24px !important;
            }
            
            .phase-alert-banner {
              margin: 0 24px 20px 24px !important;
              padding: 16px 20px !important;
            }
            
            .badge-challenge-pill {
              padding: 16px 24px !important;
              gap: 16px !important;
            }
            
            .stats-grid {
              grid-template-columns: 1fr 1fr 1fr !important;
              gap: 32px !important;
              padding: 0 20px !important;
              margin-bottom: 24px !important;
            }
            
            .reading-journey-card {
              padding: 28px !important;
            }
            
            .fun-tidbits-section {
              padding: 24px !important;
            }
            
            .tidbits-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
            
            .xp-display-card {
              padding: 16px 20px !important;
            }
            
            .bragging-rights-button {
              padding: 16px 24px !important;
              max-width: 300px !important;
              margin: 0 auto !important;
            }
          }
          /* LARGE DESKTOP LAYOUT */
          @media screen and (min-width: 1024px) {
            .stats-main-content {
              max-width: 800px !important;
              padding: 32px !important;
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 32px !important;
              align-items: start !important;
            }
            
            .phase-alert-banner {
              grid-column: 1 / -1 !important;
              max-width: 600px !important;
              margin: 0 auto 32px auto !important;
            }
            
            .badge-challenge-pill {
              grid-column: 1 / -1 !important;
              max-width: 500px !important;
              margin: 0 auto 20px auto !important;
            }
            
            .reading-journey-card {
              grid-column: 1 / -1 !important;
              max-width: 700px !important;
              margin: 0 auto 20px auto !important;
              padding: 32px !important;
            }
            
            .fun-tidbits-section {
              grid-column: 1 / -1 !important;
              max-width: 600px !important;
              margin: 0 auto !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
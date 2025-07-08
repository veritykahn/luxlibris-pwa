import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentDataEntities, updateStudentDataEntities } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';

export default function StudentHealthyHabits() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Timer states
  const [timerDuration, setTimerDuration] = useState(20 * 60); // seconds
  const [timeRemaining, setTimeRemaining] = useState(20 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const timerRef = useRef(null);
  
  // Progress states
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [todaysMinutes, setTodaysMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakCalendar, setStreakCalendar] = useState([]);
  const [readingLevel, setReadingLevel] = useState({ name: 'Faithful Flame', emoji: '🕯️', color: '#D84315' });
  const [streakStats, setStreakStats] = useState({ weeks: 0, months: 0 });
  
  // UI states
  const [showSuccess, setShowSuccess] = useState('');
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [showBookProgressModal, setShowBookProgressModal] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(null);
  const [currentBookTitle, setCurrentBookTitle] = useState('');
  
  // Wake lock state
  const [wakeLock, setWakeLock] = useState(null);

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

  // Utility function to get local date string with consistent timezone handling
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Smart streak calculation - counts from today OR yesterday
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

  // Notification functions
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      }
    } catch (err) {
      console.log('Wake lock not supported on this device');
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const createTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      createTone(600, audioContext.currentTime, 0.4);
      createTone(800, audioContext.currentTime + 0.5, 0.4);
      
    } catch (err) {
      console.log('Audio notification not supported');
    }
  };

  const vibrateNotification = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (err) {
      console.log('Vibration not supported');
    }
  };

  const showBrowserNotification = () => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reading Timer Complete! 🎉', {
          body: 'Congratulations on completing your reading session!',
          icon: '/images/lux_libris_logo.png',
          badge: '/images/lux_libris_logo.png',
          silent: false
        });
      }
    } catch (err) {
      console.log('Browser notifications not supported');
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load streak data with smart calculation and timeline calendar
  const loadStreakData = useCallback(async (studentData) => {
    try {
      // Get sessions from last 6 weeks for thorough streak calculation
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
      
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      
      const recentQuery = query(
        sessionsRef,
        where('date', '>=', getLocalDateString(sixWeeksAgo))
      );
      
      const recentSnapshot = await getDocs(recentQuery);
      const completedSessionsByDate = {};
      
      // Only count COMPLETED sessions (20+ min) for streaks
      recentSnapshot.forEach(doc => {
        const session = doc.data();
        if (session.completed === true) {
          completedSessionsByDate[session.date] = true;
        }
      });
      
      const today = new Date();
      const todayStr = getLocalDateString(today);
      
      // Calculate smart streak
      const streakCount = calculateSmartStreak(completedSessionsByDate, todayStr);
      
      // Build timeline calendar (21 days: 2 weeks past + today + 1 week future)
      const timelineCalendar = [];
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 14); // Start 2 weeks ago
      
      for (let i = 0; i < 21; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = getLocalDateString(date);
        
        timelineCalendar.push({
          date: dateStr,
          hasReading: !!completedSessionsByDate[dateStr],
          dayName: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()],
          dayNumber: date.getDate(),
          isToday: dateStr === todayStr,
          isFuture: date > today,
          isRecent: Math.abs(date - today) <= 7 * 24 * 60 * 60 * 1000
        });
      }
      
      // Calculate stats
      const totalCompletedDays = Object.keys(completedSessionsByDate).length;
      const weeksCompleted = Math.floor(totalCompletedDays / 7);
      const monthsCompleted = Math.floor(totalCompletedDays / 30);
      
      setStreakCalendar(timelineCalendar);
      setCurrentStreak(streakCount);
      setStreakStats({ weeks: weeksCompleted, months: monthsCompleted });
      
    } catch (error) {
      console.error('Error loading streak data:', error);
      setCurrentStreak(0);
      setStreakStats({ weeks: 0, months: 0 });
    }
  }, [calculateSmartStreak]);

  // Progressive reading level calculation
  const calculateReadingLevel = useCallback(async (studentData) => {
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const recentQuery = query(
        sessionsRef,
        where('date', '>=', getLocalDateString(fourteenDaysAgo))
      );
      
      const recentSnapshot = await getDocs(recentQuery);
      const dailyMinutes = {};
      
      recentSnapshot.forEach(doc => {
        const session = doc.data();
        if (!dailyMinutes[session.date]) {
          dailyMinutes[session.date] = 0;
        }
        dailyMinutes[session.date] += session.duration;
      });
      
      const currentLevel = studentData.currentReadingLevel || 'faithful_flame';
      const daysAtCurrentLevel = studentData.daysAtCurrentLevel || 0;
      const daysBelowThresholdCount = studentData.daysBelowThresholdCount || 0;
      
      // Calculate average for last 7 days
      const lastSevenDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateString(date);
        lastSevenDays.push(dailyMinutes[dateStr] || 0);
      }
      
      const averageMinutesPerDay = lastSevenDays.reduce((sum, minutes) => sum + minutes, 0) / 7;
      
      const levels = {
        faithful_flame: { min: 0, max: 20, name: 'Faithful Flame', emoji: '🕯️', color: '#D84315', textColor: '#FFFFFF' },
        bright_beacon: { min: 21, max: 35, name: 'Bright Beacon', emoji: '⭐', color: '#FFF8E1', textColor: '#D84315' },
        radiant_reader: { min: 36, max: 50, name: 'Radiant Reader', emoji: '🌟', color: '#FFF9C4', textColor: '#E65100' },
        luminous_legend: { min: 51, max: Infinity, name: 'Luminous Legend', emoji: '✨', color: '#E3F2FD', textColor: '#0D47A1' }
      };
      
      let targetLevel = 'faithful_flame';
      if (averageMinutesPerDay >= 51) targetLevel = 'luminous_legend';
      else if (averageMinutesPerDay >= 36) targetLevel = 'radiant_reader';
      else if (averageMinutesPerDay >= 21) targetLevel = 'bright_beacon';
      
      let newLevel = currentLevel;
      let newDaysAtLevel = daysAtCurrentLevel + 1;
      let newDaysBelowCount = daysBelowThresholdCount;
      
      const currentLevelData = levels[currentLevel];
      const todayMinutes = dailyMinutes[getLocalDateString(new Date())] || 0;
      
      if (todayMinutes >= currentLevelData.min && todayMinutes <= currentLevelData.max) {
        newDaysBelowCount = 0;
      } else if (todayMinutes < currentLevelData.min) {
        newDaysBelowCount++;
        
        if (newDaysBelowCount >= 4 && currentLevel !== 'faithful_flame') {
          const levelOrder = ['faithful_flame', 'bright_beacon', 'radiant_reader', 'luminous_legend'];
          const currentIndex = levelOrder.indexOf(currentLevel);
          newLevel = levelOrder[currentIndex - 1];
          newDaysAtLevel = 1;
          newDaysBelowCount = 0;
        }
      } else {
        newDaysBelowCount = 0;
        
        if (newDaysAtLevel >= 7) {
          const levelOrder = ['faithful_flame', 'bright_beacon', 'radiant_reader', 'luminous_legend'];
          const currentIndex = levelOrder.indexOf(currentLevel);
          const nextLevel = levelOrder[currentIndex + 1];
          
          if (nextLevel && targetLevel === nextLevel) {
            newLevel = nextLevel;
            newDaysAtLevel = 1;
          }
        }
      }
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        currentReadingLevel: newLevel,
        daysAtCurrentLevel: newDaysAtLevel,
        daysBelowThresholdCount: newDaysBelowCount
      });
      
      setReadingLevel(levels[newLevel]);
      
    } catch (error) {
      console.error('Error calculating reading level:', error);
      setReadingLevel({ name: 'Faithful Flame', emoji: '🕯️', color: '#D84315', textColor: '#FFFFFF' });
    }
  }, []);

  // Load reading data for today
  const loadReadingData = useCallback(async (studentData) => {
    try {
      const today = getLocalDateString(new Date());
      
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      
      const todayQuery = query(
        sessionsRef,
        where('date', '==', today)
      );
      
      const todaySnapshot = await getDocs(todayQuery);
      const sessions = [];
      let minutesToday = 0;
      
      const sessionData = [];
      todaySnapshot.forEach(doc => {
        const data = doc.data();
        sessionData.push({ id: doc.id, ...data });
      });
      
      sessionData.sort((a, b) => {
        const timeA = a.startTime?.toDate?.() || new Date(a.startTime);
        const timeB = b.startTime?.toDate?.() || new Date(b.startTime);
        return timeB - timeA;
      });
      
      sessionData.forEach(session => {
        sessions.push(session);
        if (session.date === today) {
          minutesToday += session.duration;
        }
      });
      
      setTodaysSessions(sessions);
      setTodaysMinutes(minutesToday);
      
      await loadStreakData(studentData);
      await calculateReadingLevel(studentData);
      
    } catch (error) {
      console.error('Error loading reading data:', error);
    }
  }, [loadStreakData, calculateReadingLevel]);

  const updateStreakData = useCallback(async () => {
    try {
      if (studentData) {
        await loadStreakData(studentData);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [studentData, loadStreakData]);

  const saveReadingSession = useCallback(async (duration, completed) => {
    try {
      if (!studentData) return;
      
      const today = getLocalDateString(new Date());
      const sessionData = {
        date: today,
        startTime: new Date(),
        duration: duration,
        targetDuration: Math.floor(timerDuration / 60),
        completed: completed,
        bookId: currentBookId || null
      };
      
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const docRef = await addDoc(sessionsRef, sessionData);
      
      const newSession = { id: docRef.id, ...sessionData };
      setTodaysSessions(prev => [newSession, ...prev]);
      
      setTodaysMinutes(prev => prev + duration);
      
      if (completed && todaysSessions.filter(s => s.completed && s.date === today).length === 0) {
        await updateStreakData();
        await calculateReadingLevel(studentData);
      }
      
      setShowSuccess(completed ? '🎉 Reading session completed!' : '📖 Progress saved!');
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error saving reading session:', error);
      setShowSuccess('❌ Error saving session. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  }, [studentData, timerDuration, todaysSessions, calculateReadingLevel, updateStreakData, currentBookId]);

  const loadHealthyHabitsData = useCallback(async () => {
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
      
      const defaultDuration = firebaseStudentData.readingSettings?.defaultTimerDuration || 20;
      setTimerDuration(defaultDuration * 60);
      setTimeRemaining(defaultDuration * 60);
      
      await loadReadingData(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading healthy habits data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, loadReadingData]);

  // Load student data and reading data
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = urlParams.get('bookId');
      const bookTitle = urlParams.get('bookTitle');
      
      if (bookId && bookTitle) {
        setCurrentBookId(bookId);
        setCurrentBookTitle(decodeURIComponent(bookTitle));
      }
      
      loadHealthyHabitsData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, router, loadHealthyHabitsData]);

  const handleTimerComplete = useCallback(async () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    
    releaseWakeLock();
    
    playNotificationSound();
    vibrateNotification();
    showBrowserNotification();
    
    await saveReadingSession(Math.floor(timerDuration / 60), true);
    
    setShowCompletionCelebration(true);
    setTimeout(() => {
      setShowCompletionCelebration(false);
      if (currentBookId && currentBookTitle) {
        setShowBookProgressModal(true);
      }
    }, 3000);
    
    setTimeRemaining(timerDuration);
  }, [timerDuration, saveReadingSession, currentBookId, currentBookTitle]);

  // Handle page visibility for proper timer pause/resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerActive && !isTimerPaused) {
        setIsTimerPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerActive, isTimerPaused, timeRemaining]);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && !isTimerPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isTimerActive, isTimerPaused, timeRemaining, handleTimerComplete]);

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [wakeLock]);

  const handleStartTimer = () => {
    setIsTimerActive(true);
    setIsTimerPaused(false);
    requestWakeLock();
  };

  const handlePauseTimer = () => {
    setIsTimerPaused(true);
    releaseWakeLock();
  };

  const handleResumeTimer = () => {
    setIsTimerPaused(false);
    requestWakeLock();
  };

  const handleBankSession = async () => {
    const minutesRead = Math.floor((timerDuration - timeRemaining) / 60);
    
    if (minutesRead < 1) {
      setShowSuccess('⏱️ Read for at least 1 minute to bank progress');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    setIsTimerActive(false);
    setIsTimerPaused(false);
    releaseWakeLock();
    
    const isCompleted = minutesRead >= 20;
    await saveReadingSession(minutesRead, isCompleted);
    
    if (currentBookId && currentBookTitle) {
      setShowBookProgressModal(true);
    }
    
    setTimeRemaining(timerDuration);
    
    setShowSuccess(isCompleted ? 
      '🎉 Session banked and streak earned!' : 
      `📖 ${minutesRead} minutes banked! Read 20+ minutes for streak credit`
    );
    setTimeout(() => setShowSuccess(''), 4000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerProgress = () => {
    return ((timerDuration - timeRemaining) / timerDuration) * 100;
  };

  const getSvgSize = () => {
    if (typeof window !== 'undefined') {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      return Math.min(200, vw * 0.7);
    }
    return 200;
  };

  const svgSize = getSvgSize();

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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your reading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Healthy Habits - Lux Libris</title>
        <meta name="description" content="Build healthy daily reading habits with timer tracking and streak celebrations" />
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
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              color: currentTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0
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
            Healthy Habits
          </h1>

          <button
            onClick={() => router.push('/student-saints')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              color: currentTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0
            }}
          >
            ♔
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* TIMER SECTION */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '20px',
            padding: '30px 20px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {/* Circular Timer */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
              <svg 
                width={svgSize}
                height={svgSize}
                viewBox="0 0 200 200"
                style={{ transform: 'rotate(-90deg)', maxWidth: '200px', maxHeight: '200px' }}
              >
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={`${currentTheme.primary}30`}
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={currentTheme.primary}
                  strokeWidth="8"
                  strokeDasharray={`${(getTimerProgress() / 100) * (2 * Math.PI * 85)} ${2 * Math.PI * 85}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              
              {/* Timer display */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(28px, 8vw, 36px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  fontFamily: 'system-ui, monospace',
                  marginBottom: '4px'
                }}>
                  {formatTime(timeRemaining)}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  fontWeight: '500'
                }}>
                  {isTimerActive ? (isTimerPaused ? 'PAUSED' : 'READING') : 'READY'}
                </div>
                {wakeLock && (
                  <div style={{
                    fontSize: 'clamp(8px, 2.5vw, 10px)',
                    color: currentTheme.primary,
                    fontWeight: '600',
                    marginTop: '2px'
                  }}>
                    📱 Screen staying on
                  </div>
                )}
              </div>
            </div>

            {/* Timer Controls */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center', 
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              {!isTimerActive ? (
                <button
                  onClick={handleStartTimer}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '20px',
                    padding: '14px 28px',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '48px',
                    minWidth: '140px',
                    justifyContent: 'center'
                  }}
                >
                  ▶️ Start Session
                </button>
              ) : (
                <>
                  <button
                    onClick={isTimerPaused ? handleResumeTimer : handlePauseTimer}
                    style={{
                      backgroundColor: currentTheme.secondary,
                      color: currentTheme.textPrimary,
                      border: 'none',
                      borderRadius: '16px',
                      padding: '12px 20px',
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '48px',
                      minWidth: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isTimerPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  
                  {isTimerPaused ? (
                    <button
                      onClick={handleBankSession}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '12px 20px',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '48px',
                        minWidth: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      💾 Bank Session
                    </button>
                  ) : null}
                </>
              )}
            </div>

            <button
              onClick={() => router.push('/student-settings')}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Timer length can be adjusted in settings →
            </button>
          </div>

          {/* TODAY'S PROGRESS */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              margin: '0 0 16px 0'
            }}>
              📈 Today&apos;s Progress
            </h3>
            
            <div style={{
              backgroundColor: readingLevel.color,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {readingLevel.emoji}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: readingLevel.textColor,
                marginBottom: '4px'
              }}>
                {readingLevel.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: readingLevel.textColor,
                opacity: 0.9
              }}>
                {readingLevel.name === 'Luminous Legend' && 'Your dedication will illuminate the world!'}
                {readingLevel.name === 'Radiant Reader' && 'You are shining bright with wisdom!'}
                {readingLevel.name === 'Bright Beacon' && 'Your light guides others to great books!'}
                {readingLevel.name === 'Faithful Flame' && 'You keep the flame of learning burning bright!'}
              </div>
            </div>

            {/* Today's minutes and current streak */}
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
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {todaysMinutes}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  minutes today
                </div>
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {currentStreak}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  day streak
                </div>
              </div>
            </div>
          </div>

          {/* STREAK CALENDAR - Timeline Style */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                🔥 Reading Streak
              </h3>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: `${currentTheme.primary}15`,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '13px',
                color: currentTheme.textPrimary,
                fontWeight: '500'
              }}>
                📅 {streakStats.weeks} weeks
              </div>
              <div style={{
                fontSize: '13px',
                color: currentTheme.textPrimary,
                fontWeight: '500'
              }}>
                🗓️ {streakStats.months} months
              </div>
            </div>

            {/* Timeline Calendar */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              padding: '8px 4px',
              marginBottom: '12px',
              scrollSnapType: 'x mandatory'
            }}>
              {streakCalendar.map((day, index) => (
                <div
                  key={index}
                  style={{
                    minWidth: '32px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: day.isFuture ? 
                      `${currentTheme.primary}10` : 
                      day.hasReading ? currentTheme.primary : `${currentTheme.primary}20`,
                    border: day.isToday ? `3px solid ${currentTheme.primary}` : 
                           day.isRecent ? `1px solid ${currentTheme.primary}60` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    opacity: day.isFuture ? 0.4 : 1,
                    transform: day.isToday ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    scrollSnapAlign: 'center',
                    boxShadow: day.isToday ? `0 4px 12px ${currentTheme.primary}40` : 'none'
                  }}
                >
                  <div style={{
                    fontSize: '8px',
                    fontWeight: '600',
                    color: day.hasReading && !day.isFuture ? 'white' : currentTheme.textSecondary
                  }}>
                    {day.dayName}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: day.hasReading && !day.isFuture ? 'white' : currentTheme.textPrimary
                  }}>
                    {day.dayNumber}
                  </div>
                  {day.hasReading && (
                    <div style={{
                      width: '3px',
                      height: '3px',
                      borderRadius: '50%',
                      backgroundColor: 'white'
                    }} />
                  )}
                </div>
              ))}
            </div>

            <p style={{
              fontSize: '13px',
              color: currentTheme.textSecondary,
              textAlign: 'center',
              margin: 0,
              fontWeight: '500'
            }}>
              {currentStreak >= 30 ? "🏆 30-day streak! Rare saints unlocked!" : 
               currentStreak >= 7 ? "Amazing! Keep the fire burning! 🔥" : 
               currentStreak >= 1 ? `Great start! ${currentStreak} day${currentStreak > 1 ? 's' : ''} strong! 💪` :
               "Read every day to build a healthy habit!"}
            </p>
          </div>
        </div>

        {/* COMPLETION CELEBRATION */}
        {showCompletionCelebration && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: 'clamp(30px, 8vw, 40px)',
              textAlign: 'center',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '320px'
            }}>
              <div style={{ fontSize: 'clamp(48px, 15vw, 64px)', marginBottom: '16px' }}>🎉</div>
              <h2 style={{
                fontSize: 'clamp(20px, 6vw, 24px)',
                fontWeight: 'bold',
                color: currentTheme.textPrimary,
                margin: '0 0 8px 0'
              }}>
                Session Complete!
              </h2>
              <p style={{
                fontSize: 'clamp(12px, 4vw, 14px)',
                color: currentTheme.textSecondary,
                margin: 0,
                lineHeight: '1.4'
              }}>
                Great job building your healthy reading habit!
              </p>
            </div>
          </div>
        )}

        {/* Book Progress Modal */}
        {showBookProgressModal && currentBookTitle && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: 'clamp(20px, 6vw, 30px)',
              textAlign: 'center',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '350px'
            }}>
              <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: '16px' }}>📖</div>
              <h2 style={{
                fontSize: 'clamp(18px, 5vw, 20px)',
                fontWeight: 'bold',
                color: currentTheme.textPrimary,
                margin: '0 0 8px 0'
              }}>
                Update Reading Progress?
              </h2>
              <p style={{
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: currentTheme.textSecondary,
                margin: '0 0 20px 0',
                lineHeight: '1.4'
              }}>
                You were reading <strong style={{ color: currentTheme.textPrimary }}>{currentBookTitle}</strong>. 
                Would you like to mark your progress?
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center', 
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    setShowBookProgressModal(false);
                    router.push(`/student-bookshelf?updateProgress=${currentBookId}&title=${encodeURIComponent(currentBookTitle)}`);
                  }}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px',
                    minWidth: '120px',
                    flex: '1 1 auto'
                  }}
                >
                  📝 Update Progress
                </button>
                
                <button
                  onClick={() => setShowBookProgressModal(false)}
                  style={{
                    backgroundColor: currentTheme.textSecondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px',
                    minWidth: '120px',
                    flex: '1 1 auto'
                  }}
                >
                  ⏭️ Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: currentTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '85vw',
            textAlign: 'center'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.8; 
              transform: scale(1.02);
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
            
            body {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}
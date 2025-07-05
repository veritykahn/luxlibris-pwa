import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, updateStudentData } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
  const [readingLevel, setReadingLevel] = useState({ name: 'Faithful Flame', emoji: '🕯️', color: '#FFA726' });
  
  // UI states
  const [showSuccess, setShowSuccess] = useState('');
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  
  // Wake lock state
  const [wakeLock, setWakeLock] = useState(null);

  // Theme definitions - moved to useMemo to prevent recreation on every render
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

  // Notification functions
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('✅ Screen will stay on during reading');
        
        // Listen for wake lock release
        lock.addEventListener('release', () => {
          console.log('📱 Screen wake lock released');
          setWakeLock(null);
        });
      }
    } catch (err) {
      console.log('⚠️ Wake lock not supported on this device');
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
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a pleasant notification sound (two-tone chime)
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
      
      // Play two pleasant tones
      createTone(600, audioContext.currentTime, 0.4);
      createTone(800, audioContext.currentTime + 0.5, 0.4);
      
    } catch (err) {
      console.log('⚠️ Audio notification not supported');
    }
  };

  const vibrateNotification = () => {
    try {
      if ('vibrate' in navigator) {
        // Celebratory vibration pattern
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (err) {
      console.log('⚠️ Vibration not supported');
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
      console.log('⚠️ Browser notifications not supported');
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        }
      });
    }
  }, []);

  const loadStreakData = useCallback(async (studentData) => {
    try {
      // Get last 30 days of reading sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sessionsRef = collection(db, `dioceses/${studentData.dioceseId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const recentQuery = query(
        sessionsRef,
        where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );
      
      const recentSnapshot = await getDocs(recentQuery);
      const sessionsByDate = {};
      
      recentSnapshot.forEach(doc => {
        const session = doc.data();
        if (session.completed) {
          sessionsByDate[session.date] = true;
        }
      });
      
      // Build calendar array (last 30 days)
      const calendar = [];
      let streakCount = 0;
      let streakBroken = false;
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const hasReading = !!sessionsByDate[dateStr];
        
        calendar.unshift({
          date: dateStr,
          hasReading,
          dayName: date.toLocaleDateString('en', { weekday: 'short' }).charAt(0)
        });
        
        // Calculate current streak (from today backwards)
        if (i === 0 && hasReading) {
          streakCount = 1;
        } else if (streakCount > 0 && hasReading && !streakBroken) {
          streakCount++;
        } else if (streakCount > 0 && !hasReading && !streakBroken) {
          streakBroken = true;
        }
      }
      
      setStreakCalendar(calendar);
      setCurrentStreak(streakCount);
      
    } catch (error) {
      console.error('❌ Error loading streak data:', error);
    }
  }, []);

  const calculateReadingLevel = useCallback((minutesToday) => {
    // Based on average daily minutes over last 7 days (simplified to today for now)
    const avgMinutes = minutesToday; // TODO: Calculate 7-day average
    
    if (avgMinutes >= 51) {
      setReadingLevel({ name: 'Luminous Legend', emoji: '✨', color: '#E3F2FD' });
    } else if (avgMinutes >= 36) {
      setReadingLevel({ name: 'Radiant Reader', emoji: '🌟', color: '#FFF9C4' });
    } else if (avgMinutes >= 21) {
      setReadingLevel({ name: 'Bright Beacon', emoji: '⭐', color: '#FFF8E1' });
    } else {
      setReadingLevel({ name: 'Faithful Flame', emoji: '🕯️', color: '#FFE0B2' });
    }
  }, []);

  const loadReadingData = useCallback(async (studentData) => {
    try {
      // Get today's sessions
      const today = new Date().toISOString().split('T')[0];
      const sessionsRef = collection(db, `dioceses/${studentData.dioceseId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      const todayQuery = query(
        sessionsRef,
        where('date', '==', today),
        orderBy('startTime', 'desc')
      );
      
      const todaySnapshot = await getDocs(todayQuery);
      const sessions = [];
      let minutesToday = 0;
      
      todaySnapshot.forEach(doc => {
        const session = { id: doc.id, ...doc.data() };
        sessions.push(session);
        if (session.completed) {
          minutesToday += session.duration;
        }
      });
      
      setTodaysSessions(sessions);
      setTodaysMinutes(minutesToday);
      
      // Load streak data and calendar
      await loadStreakData(studentData);
      
      // Calculate reading level
      calculateReadingLevel(minutesToday);
      
    } catch (error) {
      console.error('❌ Error loading reading data:', error);
    }
  }, [loadStreakData, calculateReadingLevel]);

  const updateStreakData = useCallback(async () => {
    try {
      // Recalculate streak
      if (studentData) {
        await loadStreakData(studentData);
      }
    } catch (error) {
      console.error('❌ Error updating streak:', error);
    }
  }, [studentData, loadStreakData]);

  const saveReadingSession = useCallback(async (duration, completed) => {
    try {
      if (!studentData) return;
      
      const today = new Date().toISOString().split('T')[0];
      const sessionData = {
        date: today,
        startTime: new Date(),
        duration: duration,
        targetDuration: Math.floor(timerDuration / 60),
        completed: completed,
        bookId: null // Can be set if started from specific book
      };
      
      const sessionsRef = collection(db, `dioceses/${studentData.dioceseId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      await addDoc(sessionsRef, sessionData);
      
      // Update today's data
      setTodaysSessions(prev => [sessionData, ...prev]);
      if (completed) {
        setTodaysMinutes(prev => {
          const newMinutes = prev + duration;
          calculateReadingLevel(newMinutes);
          return newMinutes;
        });
      }
      
      // Update streak if this is first session today
      if (completed && todaysSessions.filter(s => s.completed).length === 0) {
        await updateStreakData();
      }
      
      setShowSuccess(completed ? '🎉 Reading session completed!' : '📖 Progress saved!');
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error saving reading session:', error);
      setShowSuccess('❌ Error saving session. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  }, [studentData, timerDuration, todaysSessions, calculateReadingLevel, updateStreakData]);

  const loadHealthyHabitsData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentData(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = themes[selectedThemeKey];
      setCurrentTheme(selectedTheme);
      
      // Set timer duration from settings
      const defaultDuration = firebaseStudentData.readingSettings?.defaultTimerDuration || 20;
      setTimerDuration(defaultDuration * 60);
      setTimeRemaining(defaultDuration * 60);
      
      // Load reading sessions and streak data
      await loadReadingData(firebaseStudentData);
      
    } catch (error) {
      console.error('❌ Error loading healthy habits data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, loadReadingData]);

  // Load student data and reading data
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadHealthyHabitsData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, router, loadHealthyHabitsData]);

  const handleTimerComplete = useCallback(async () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    
    // Release wake lock first
    releaseWakeLock();
    
    // Multi-sensory notifications
    playNotificationSound();
    vibrateNotification();
    showBrowserNotification();
    
    // Save completed session to Firebase
    await saveReadingSession(Math.floor(timerDuration / 60), true);
    
    // Show celebration
    setShowCompletionCelebration(true);
    setTimeout(() => setShowCompletionCelebration(false), 3000);
    
    // Reset timer
    setTimeRemaining(timerDuration);
  }, [timerDuration, saveReadingSession]);

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
    requestWakeLock(); // Keep screen on during reading
  };

  const handlePauseTimer = () => {
    setIsTimerPaused(true);
  };

  const handleResumeTimer = () => {
    setIsTimerPaused(false);
  };

  const handleStopTimer = () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setTimeRemaining(timerDuration);
    releaseWakeLock(); // Allow screen to turn off
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerProgress = () => {
    return ((timerDuration - timeRemaining) / timerDuration) * 100;
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
                width="min(200px, 70vw)" 
                height="min(200px, 70vw)" 
                viewBox="0 0 200 200"
                style={{ transform: 'rotate(-90deg)', maxWidth: '200px', maxHeight: '200px' }}
              >
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={`${currentTheme.primary}30`}
                  strokeWidth="8"
                />
                {/* Progress circle */}
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
                  
                  <button
                    onClick={handleStopTimer}
                    style={{
                      backgroundColor: currentTheme.textSecondary,
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
                      justifyContent: 'center'
                    }}
                  >
                    ⏹️ Stop
                  </button>
                </>
              )}
            </div>

            {/* Settings link */}
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
            
            {/* Feature info */}
            <p style={{
              fontSize: '10px',
              color: currentTheme.textSecondary,
              margin: '8px 0 0 0',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              📱 Screen stays on • 🔊 Audio alerts • 📳 Vibration
            </p>
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
                color: currentTheme.textPrimary,
                marginBottom: '4px'
              }}>
                {readingLevel.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: currentTheme.textSecondary
              }}>
                {readingLevel.name === 'Luminous Legend' && 'Your dedication illuminates the world!'}
                {readingLevel.name === 'Radiant Reader' && 'You&apos;re shining bright with wisdom!'}
                {readingLevel.name === 'Bright Beacon' && 'Your light guides others to great books!'}
                {readingLevel.name === 'Faithful Flame' && 'You keep the flame of learning burning bright!'}
              </div>
            </div>

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
                  {todaysSessions.filter(s => s.completed).length}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  sessions completed
                </div>
              </div>
            </div>
          </div>

          {/* STREAK CALENDAR */}
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
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                🔥 Reading Streak
              </h3>
              
              <div style={{
                backgroundColor: currentStreak >= 7 ? '#FF6B35' : `${currentTheme.primary}30`,
                color: currentStreak >= 7 ? 'white' : currentTheme.textPrimary,
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {currentStreak} days
              </div>
            </div>

            {/* Calendar Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 'clamp(2px, 1vw, 4px)',
              marginBottom: '12px',
              justifyItems: 'center'
            }}>
              {streakCalendar.slice(-21).map((day, index) => (
                <div
                  key={day.date}
                  style={{
                    width: 'clamp(28px, 8vw, 32px)',
                    height: 'clamp(28px, 8vw, 32px)',
                    borderRadius: '6px',
                    backgroundColor: day.hasReading ? currentTheme.primary : `${currentTheme.primary}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(8px, 2.5vw, 10px)',
                    fontWeight: '600',
                    color: day.hasReading ? 'white' : currentTheme.textSecondary
                  }}
                >
                  {day.dayName}
                </div>
              ))}
            </div>

            <p style={{
              fontSize: '12px',
              color: currentTheme.textSecondary,
              textAlign: 'center',
              margin: 0
            }}>
              {currentStreak >= 7 ? "Amazing! Keep the fire burning! 🔥" : "Read every day to build your streak!"}
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
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
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
          
          @media (max-width: 375px) {
            .timer-container {
              padding: 20px 15px;
            }
          }
        `}</style>
      </div>
    </>
  );
}
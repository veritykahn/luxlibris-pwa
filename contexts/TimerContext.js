// contexts/TimerContext.js - UPDATED to support both student AND parent healthy habits pages
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const router = useRouter();
  
  // Timer state
  const [timerDuration, setTimerDuration] = useState(20 * 60);
  const [timeRemaining, setTimeRemaining] = useState(20 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [currentBookId, setCurrentBookId] = useState(null);
  const [currentBookTitle, setCurrentBookTitle] = useState('');
  const [isOnHealthyHabitsPage, setIsOnHealthyHabitsPage] = useState(false);
  
  const timerRef = useRef(null);
  const lastActiveTimeRef = useRef(Date.now());
  // NEW: Use ref instead of state for callback (safer)
  const onTimerCompleteRef = useRef(null);

  // Wake lock functions
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && isOnHealthyHabitsPage) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      }
    } catch (err) {
      console.log('Wake lock not supported');
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
  };

  // UPDATED: Track which page we're on - now supports BOTH student AND parent pages
  useEffect(() => {
    const handleRouteChange = (url) => {
      // FIXED: Check for BOTH student and parent healthy habits pages
      const onHealthyHabits = url === '/student-healthy-habits' || url === '/parent/healthy-habits';
      setIsOnHealthyHabitsPage(onHealthyHabits);
      
      // If timer is active and we're leaving the healthy habits page, pause it
      if (isTimerActive && !isTimerPaused && !onHealthyHabits) {
        setIsTimerPaused(true);
        releaseWakeLock();
        console.log('Timer paused - navigated away from healthy habits page');
      }
      
      // If timer is active and we're returning to healthy habits page, we can resume
      // (but don't auto-resume, let user decide)
      if (isTimerActive && isTimerPaused && onHealthyHabits) {
        console.log('Returned to healthy habits page - timer still paused');
        // Note: We don't auto-resume here, user needs to click resume
      }
    };

    // FIXED: Set initial state - check for BOTH pages
    const currentPath = router.pathname;
    setIsOnHealthyHabitsPage(currentPath === '/student-healthy-habits' || currentPath === '/parent/healthy-habits');
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, isTimerActive, isTimerPaused]);

  // Handle page visibility changes (background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerActive && !isTimerPaused && isOnHealthyHabitsPage) {
        setIsTimerPaused(true);
        releaseWakeLock();
        console.log('Timer paused - app went to background');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerActive, isTimerPaused, isOnHealthyHabitsPage]);

  // Main timer effect - UPDATED with callback
  useEffect(() => {
    if (isTimerActive && !isTimerPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // FIXED: Call callback using ref (much safer)
            if (onTimerCompleteRef.current) {
              console.log('🎯 Timer completed - calling completion callback');
              onTimerCompleteRef.current();
            }
            
            // Timer completed
            setIsTimerActive(false);
            setIsTimerPaused(false);
            releaseWakeLock();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isTimerActive, isTimerPaused, timeRemaining]); // No dependency on callback needed with ref

  // Timer control functions
  const startTimer = () => {
    setIsTimerActive(true);
    setIsTimerPaused(false);
    lastActiveTimeRef.current = Date.now();
    if (isOnHealthyHabitsPage) {
      requestWakeLock();
    }
  };

  const pauseTimer = () => {
    setIsTimerPaused(true);
    releaseWakeLock();
  };

  const resumeTimer = () => {
    setIsTimerPaused(false);
    if (isOnHealthyHabitsPage) {
      requestWakeLock();
    }
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setTimeRemaining(timerDuration);
    releaseWakeLock();
    clearInterval(timerRef.current);
  };

  const updateTimerDuration = (newDuration) => {
    const newDurationSeconds = newDuration * 60;
    setTimerDuration(newDurationSeconds);
    
    // If timer isn't active, reset the remaining time
    if (!isTimerActive) {
      setTimeRemaining(newDurationSeconds);
    }
  };

  // NEW: Simple function to set callback using ref (much safer)
  const setTimerCompleteCallback = (callback) => {
    onTimerCompleteRef.current = callback;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const value = {
    // State
    timerDuration,
    timeRemaining,
    isTimerActive,
    isTimerPaused,
    wakeLock,
    currentBookId,
    currentBookTitle,
    isOnHealthyHabitsPage,
    
    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateTimerDuration,
    setCurrentBookId,
    setCurrentBookTitle,
    setTimerCompleteCallback, // SAFE: Simple ref assignment
    
    // Utilities
    getTimerProgress: () => ((timerDuration - timeRemaining) / timerDuration) * 100,
    getMinutesRead: () => Math.floor((timerDuration - timeRemaining) / 60),
    formatTime: (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
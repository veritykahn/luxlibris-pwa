// contexts/TimerContext.js
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

  // Track which page we're on
  useEffect(() => {
    const handleRouteChange = (url) => {
      const onHealthyHabits = url === '/student-healthy-habits';
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

    // Set initial state
    setIsOnHealthyHabitsPage(router.pathname === '/student-healthy-habits');
    
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

  // Main timer effect
  useEffect(() => {
    if (isTimerActive && !isTimerPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
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
  }, [isTimerActive, isTimerPaused, timeRemaining]);

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
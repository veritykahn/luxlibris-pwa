import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentDataEntities, updateStudentDataEntities } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';

export default function StudentSaints() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saints, setSaints] = useState([]);
  const [unlockedSaints, setUnlockedSaints] = useState(new Set());
  const [selectedSaint, setSelectedSaint] = useState(null);
  const [showSaintModal, setShowSaintModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  const [newlyUnlockedSaints, setNewlyUnlockedSaints] = useState(new Set());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todaysMinutes, setTodaysMinutes] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSeriesExpanded, setIsSeriesExpanded] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationProcessing, setNotificationProcessing] = useState(false);

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
    { name: 'Saints Collection', path: '/student-saints', icon: '♔', current: true },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Nominees', path: '/student-nominees', icon: '□' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
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
        // Test notification
        new Notification('🎉 Notifications Enabled!', {
          body: 'You\'ll now get notified when you unlock new saints!',
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

  const sendSaintUnlockNotification = useCallback((saintName) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    try {
      new Notification('🎉 New Saint Unlocked!', {
        body: `You've unlocked ${saintName}! Check your collection.`,
        icon: '/images/lux_libris_logo.png',
        badge: '/images/lux_libris_logo.png',
        tag: 'saint-unlock',
        requireInteraction: false,
        silent: false
      });
    } catch (error) {
      console.log('Notification failed:', error);
    }
  }, [notificationsEnabled]);

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // 🌈 FIXED: Luxlings series color mapping with HIGH CONTRAST
  const seriesColors = useMemo(() => ({
    'Ultimate Redeemer': { bg: '#FFD700', text: '#2F1B14', border: '#FFA500', modalText: '#FFFFFF' },
    'Mini Marians': { bg: '#4169E1', text: '#FFFFFF', border: '#1E3A8A', modalText: '#FFFFFF' },
    'Sacred Circle': { bg: '#DAA520', text: '#2F1B14', border: '#B8860B', modalText: '#FFFFFF' },
    'Faithful Families': { bg: '#9370DB', text: '#FFFFFF', border: '#7B68EE', modalText: '#FFFFFF' },
    'Halo Hatchlings': { bg: '#BDB76B', text: '#2F1B14', border: '#8B864E', modalText: '#FFFFFF' },
    'Apostolic All-Stars': { bg: '#DC143C', text: '#FFFFFF', border: '#B22222', modalText: '#FFFFFF' },
    'Cherub Chibis': { bg: '#6A5ACD', text: '#FFFFFF', border: '#4B0082', modalText: '#FFFFFF' },
    'Contemplative Cuties': { bg: '#9932CC', text: '#FFFFFF', border: '#8B008B', modalText: '#FFFFFF' },
    'Founder Flames': { bg: '#FF6347', text: '#FFFFFF', border: '#DC143C', modalText: '#FFFFFF' },
    'Desert Disciples': { bg: '#D2691E', text: '#FFFFFF', border: '#8B4513', modalText: '#FFFFFF' },
    'Regal Royals': { bg: '#8A2BE2', text: '#FFFFFF', border: '#9370DB', modalText: '#FFFFFF' },
    'Culture Carriers': { bg: '#228B22', text: '#FFFFFF', border: '#006400', modalText: '#FFFFFF' },
    'Learning Legends': { bg: '#008B8B', text: '#FFFFFF', border: '#20B2AA', modalText: '#FFFFFF' },
    'Super Sancti': { bg: '#FF4500', text: '#FFFFFF', border: '#FF0000', modalText: '#FFFFFF' },
    'Heavenly Helpers': { bg: '#FFD700', text: '#2F1B14', border: '#FFA500', modalText: '#FFFFFF' },
    'Pocket Patrons': { bg: '#32CD32', text: '#FFFFFF', border: '#228B22', modalText: '#FFFFFF' },
    'Virtue Vignettes': { bg: '#CD5C5C', text: '#FFFFFF', border: '#8B1A1A', modalText: '#FFFFFF' }
  }), []);

  // Utility function to get local date string
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🔥 Smart streak calculation
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

  // 🔓 Check if saint should be unlocked
  const checkSaintUnlock = useCallback((saint, studentData, calculatedStreak) => {
    if (!studentData) return false;

    const condition = saint.unlockCondition;
    const booksSubmitted = studentData.booksSubmittedThisYear || 0;
    const lifetimeBooks = studentData.lifetimeBooksSubmitted || 0;
    const grade = studentData.grade || 4;

    switch (condition) {
      case 'streak_7_days':
        return calculatedStreak >= 7;
      case 'streak_30_days':
        return calculatedStreak >= 30;
      case 'streak_90_days':
        return calculatedStreak >= 90;
      case 'milestone_20_books':
        return lifetimeBooks >= 20;
      case 'milestone_100_books':
        return lifetimeBooks >= 100;
      case 'first_book_grade_4':
        return grade === 4 && booksSubmitted >= 1;
      case 'first_book_grade_5':
        return grade === 5 && booksSubmitted >= 1;
      case 'first_book_grade_6':
        return grade === 6 && booksSubmitted >= 1;
      case 'first_book_grade_7':
        return grade === 7 && booksSubmitted >= 1;
      case 'first_book_grade_8':
        return grade === 8 && booksSubmitted >= 1;
      case 'seasonal_feast_day':
        const today = new Date();
        const month = today.getMonth() + 1;
        if (saint.id === 'saint_030' && month === 3) return true;
        return false;
      default:
        return false;
    }
  }, []);

  // 🎵 Play unlock sound
  const playUnlockSound = useCallback((saint) => {
    try {
      let soundFile;
      if (saint.rarity === 'common' || saint.rarity?.includes('grade_exclusive')) {
        soundFile = '/sounds/unlock_common.mp3';
      } else if (saint.rarity === 'rare' || saint.rarity === 'legendary' || saint.rarity === 'seasonal') {
        soundFile = '/sounds/unlock_legendary.mp3';
      } else if (saint.luxlings_series === 'Mini Marians' || saint.luxlings_series === 'Ultimate Redeemer') {
        soundFile = '/sounds/unlock_jesus.mp3';
      } else {
        soundFile = '/sounds/unlock_common.mp3';
      }
      const audio = new Audio(soundFile);
      audio.volume = 0.7;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (error) {
      console.log('Sound not available:', error);
    }
  }, []);

  // 🔥 Load streak data
  const loadStreakData = useCallback(async (studentData) => {
    try {
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
      
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      
      const recentQuery = query(
        sessionsRef,
        where('date', '>=', getLocalDateString(sixWeeksAgo))
      );
      
      const recentSnapshot = await getDocs(recentQuery);
      const completedSessionsByDate = {};
      let todayMinutes = 0;
      const todayStr = getLocalDateString(new Date());
      
      recentSnapshot.forEach(doc => {
        const session = doc.data();
        if (session.completed === true) {
          completedSessionsByDate[session.date] = true;
        }
        if (session.date === todayStr) {
          todayMinutes += session.duration || 0;
        }
      });
      
      const streakCount = calculateSmartStreak(completedSessionsByDate, todayStr);
      
      setCurrentStreak(streakCount);
      setTodaysMinutes(todayMinutes);
      
      return streakCount;
      
    } catch (error) {
      console.error('Error loading streak data:', error);
      setCurrentStreak(0);
      setTodaysMinutes(0);
      return 0;
    }
  }, [calculateSmartStreak]);

  // 🏗️ SIMPLIFIED: Clean shelf organization matching bookshelf style
  const organizeSaintsIntoShelves = useCallback((saints, unlockedSaints, studentData, calculatedStreak) => {
    // Group saints by rarity/type
    const saintsByType = {
      jesus: saints.filter(s => s.luxlings_series === 'Ultimate Redeemer'),
      marian: saints.filter(s => s.luxlings_series === 'Mini Marians'),
      grade: saints.filter(s => s.rarity?.includes('grade_exclusive') || 
                                  (s.unlockCondition && s.unlockCondition.includes('first_book_grade'))),
      seasonal: saints.filter(s => s.rarity === 'seasonal'),
      legendary: saints.filter(s => s.rarity === 'legendary'),
      rare: saints.filter(s => s.rarity === 'rare'),
      common: saints.filter(s => s.rarity === 'common')
    };

    // 🌈 Dynamic glow based on theme brightness
    const isLightTheme = currentTheme?.background?.includes('#FFF') || 
                        currentTheme?.background === '#FFFFFF' ||
                        currentTheme?.background === '#FFFCF5' ||
                        currentTheme?.background === '#FEFEFE' ||
                        currentTheme?.background === '#FFF0F5' ||
                        currentTheme?.background === '#E0FFFF' ||
                        currentTheme?.background === '#FFFEF8';
    
    const getGlow = (intensity) => {
      if (isLightTheme) {
        return `0 0 ${intensity}px rgba(0,0,0,0.4), 0 0 ${intensity * 1.5}px ${currentTheme.primary}60`;
      } else {
        return `0 0 ${intensity}px rgba(255,255,255,0.7), 0 0 ${intensity * 1.5}px rgba(255,255,255,0.3)`;
      }
    };

    // Fixed shelf configs with correct counts
    const shelfConfigs = [
      { 
        type: 'jesus', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(20),
        capacity: 1,
        label: '✨ Ultimate Goal ✨'
      },
      { 
        type: 'marian', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(16),
        capacity: 5,
        label: '💎 Marian Apparitions 💎'
      },
      { 
        type: 'grade', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(14),
        capacity: 5,
        label: '🎓 Grade Saint 🎓'
      },
      { 
        type: 'seasonal', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(12),
        capacity: 5,
        label: '🍀 Seasonal Saints 🍀'
      },
      { 
        type: 'legendary', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(10),
        capacity: 5,
        label: '⚡ Legendary Saints ⚡'
      },
      { 
        type: 'rare', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(8),
        capacity: 5,
        label: '🌟 Rare Saints 🌟'
      },
      { 
        type: 'common', 
        shelfColor: currentTheme?.primary || '#ADD4EA',
        textColor: currentTheme?.textPrimary || '#223848',
        glow: getGlow(6),
        capacity: 5,
        label: '🔥 Common Saints 🔥'
      }
    ];

    // Generate all shelves - always show for visual progression
    const shelves = [];
    
    shelfConfigs.forEach(config => {
      const typeSaints = saintsByType[config.type] || [];
      
      // Always create shelf (show progression goals)
      shelves.push({
        ...config,
        saints: typeSaints.slice(0, config.capacity),
        totalSaints: typeSaints.length
      });
    });

    return shelves;
  }, [currentTheme]);

  // Helper function to check if saint glow should persist (24 hours)
  const shouldShowNewGlow = useCallback((saintId, studentData) => {
    if (!studentData?.newlyUnlockedSaintsWithTimestamp) return false;
    
    const unlockData = studentData.newlyUnlockedSaintsWithTimestamp[saintId];
    if (!unlockData) return false;
    
    const unlockTime = new Date(unlockData.timestamp);
    const now = new Date();
    const hoursDiff = (now - unlockTime) / (1000 * 60 * 60);
    
    return hoursDiff < 24; // Show glow for 24 hours
  }, []);

  // Load saints data
  const loadSaintsData = useCallback(async () => {
    try {
      const saintsRef = collection(db, 'saints');
      const saintsSnapshot = await getDocs(saintsRef);
      const saintsData = [];
      
      saintsSnapshot.forEach(doc => {
        saintsData.push({ id: doc.id, ...doc.data() });
      });

      setSaints(saintsData);
      const calculatedStreak = await loadStreakData(studentData);

      const currentlyUnlocked = new Set();
      const previouslyUnlocked = new Set(studentData.unlockedSaints || []);
      const newUnlocks = new Set();
      const persistentGlowSaints = new Set();

      saintsData.forEach(saint => {
        if (checkSaintUnlock(saint, studentData, calculatedStreak)) {
          currentlyUnlocked.add(saint.id);
          
          // Check if this is a new unlock
          if (!previouslyUnlocked.has(saint.id)) {
            newUnlocks.add(saint.id);
            playUnlockSound(saint);
          }
          
          // Check if should show persistent glow
          if (shouldShowNewGlow(saint.id, studentData)) {
            persistentGlowSaints.add(saint.id);
          }
        }
      });

      setUnlockedSaints(currentlyUnlocked);
      
      // Combine new unlocks with persistent glow saints
      const allGlowingSaints = new Set([...newUnlocks, ...persistentGlowSaints]);
      setNewlyUnlockedSaints(allGlowingSaints);

      if (newUnlocks.size > 0) {
        try {
          // Prepare timestamp data for newly unlocked saints
          const existingTimestamps = studentData.newlyUnlockedSaintsWithTimestamp || {};
          const newTimestamps = { ...existingTimestamps };
          
          const now = new Date().toISOString();
          newUnlocks.forEach(saintId => {
            newTimestamps[saintId] = {
              timestamp: now,
              name: saintsData.find(s => s.id === saintId)?.name || 'Unknown Saint'
            };
          });

          // Clean up old timestamps (older than 25 hours to be safe)
          Object.keys(newTimestamps).forEach(saintId => {
            const unlockTime = new Date(newTimestamps[saintId].timestamp);
            const hoursDiff = (new Date() - unlockTime) / (1000 * 60 * 60);
            if (hoursDiff > 25) {
              delete newTimestamps[saintId];
            }
          });

          await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
            unlockedSaints: Array.from(currentlyUnlocked),
            newlyUnlockedSaintsWithTimestamp: newTimestamps
          });

          const newUnlockNames = saintsData
            .filter(s => newUnlocks.has(s.id))
            .map(s => s.name.replace('St. ', '').replace('Our Lady of ', '').replace('Bl. ', ''))
            .join(', ');

          // 🔔 Send browser notifications for new unlocks
          if (notificationsEnabled) {
            saintsData
              .filter(s => newUnlocks.has(s.id))
              .forEach(saint => {
                sendSaintUnlockNotification(saint.name);
              });
          }

          setShowSuccess(`🎉 New saint${newUnlocks.size > 1 ? 's' : ''} unlocked: ${newUnlockNames}!`);
          setTimeout(() => setShowSuccess(''), 4000);
        } catch (error) {
          console.error('Error updating unlocked saints:', error);
        }
      }

    } catch (error) {
      console.error('Error loading saints data:', error);
    }
  }, [studentData, checkSaintUnlock, playUnlockSound, loadStreakData, shouldShowNewGlow]);

  // Load initial data
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const loadData = async () => {
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
          
        } catch (error) {
          console.error('Error loading data:', error);
          router.push('/student-dashboard');
        }
        
        setIsLoading(false);
      };

      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, router, themes]);

  // Load saints when student data is available
  useEffect(() => {
    if (studentData && currentTheme) {
      loadSaintsData();
    }
  }, [studentData, currentTheme, loadSaintsData]);

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

  const openSaintModal = (saint) => {
    setSelectedSaint(saint);
    setShowSaintModal(true);
  };

  const closeSaintModal = () => {
    setShowSaintModal(false);
    setSelectedSaint(null);
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your saints collection...</p>
        </div>
      </div>
    );
  }

  const decorativeOverlay = `/trophy_cases/${studentData.selectedTheme || 'classic_lux'}.jpg`;
  const shelves = organizeSaintsIntoShelves(saints, unlockedSaints, studentData, currentStreak);

  return (
    <>
      <Head>
        <title>Saints Collection - Lux Libris</title>
        <meta name="description" content="Discover and unlock Catholic saints through your reading journey" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        position: 'relative',
        backgroundImage: `url(${decorativeOverlay})`,
        backgroundSize: '400px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
        backgroundColor: currentTheme.background
      }}>
        
        {/* Tiled background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: currentTheme.background,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
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
              console.log('Back button clicked, going to dashboard');
              router.push('/student-dashboard');
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
            Saints Collection
          </h1>

          {/* 🍔 Hamburger Menu */}
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

            {/* Dropdown Menu */}
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
                
                {/* 🔔 Notification Toggle */}
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

        {/* PROGRESS SUMMARY */}
        <div style={{
          padding: '15px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {unlockedSaints.size}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Saints Unlocked
                </div>
              </div>
              <div>
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
                  Day Streak
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {studentData.lifetimeBooksSubmitted || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Books Read
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📚 MOBILE-OPTIMIZED SAINTS SHELVES */}
        <div className="saints-container" style={{
          padding: '0 10px 20px', // Much less bottom padding
          position: 'relative',
          zIndex: 10,
          maxWidth: '350px', // Reduced since all shelves are now 5 max capacity
          margin: '0 auto'
        }}>
          {shelves.map((shelf, shelfIndex) => (
            <div key={shelf.type} style={{ 
              marginBottom: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Saints Collection Area - FIXED: More room for saints */}
              <div style={{
                height: '90px', // Slightly smaller for mobile
                marginBottom: '1px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'end',
                gap: shelf.capacity === 1 ? '0' : '1px', // Much closer together on shelf
                width: '100%',
                maxWidth: shelf.capacity === 1 ? '75px' : '330px', // All other shelves are now 5 capacity
                overflow: 'visible'
              }}>
                {Array.from({ length: shelf.capacity }).map((_, slotIndex) => {
                  const saint = shelf.saints[slotIndex];
                  
                  if (saint) {
                    const isUnlocked = unlockedSaints.has(saint.id);
                    const isNewlyUnlocked = newlyUnlockedSaints.has(saint.id);
                    
                    return (
                      <button
                        key={saint.id}
                        onClick={() => isUnlocked && openSaintModal(saint)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isUnlocked ? 'pointer' : 'default',
                          position: 'relative',
                          padding: 0,
                          flexShrink: 0,
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          minWidth: '44px',
                          minHeight: '44px'
                        }}
                      >
                        <div style={{
                          width: shelf.capacity === 1 ? '75px' : '65px', // Mobile-optimized sizes
                          height: shelf.capacity === 1 ? '88px' : '80px', // Mobile-optimized sizes
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          transition: 'transform 0.2s ease',
                          transformOrigin: 'center bottom'
                        }}
                        onTouchStart={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.transform = 'scale(1.05) translateZ(0)';
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                          }
                        }}
                        >
                          {isUnlocked ? (
                            <img 
                              src={saint.icon_asset?.replace('assets/', '/') || `/saints/${saint.id}.png`} 
                              alt={saint.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}>
                              <div style={{
                                width: '38px', // Mobile-optimized placeholder
                                height: '54px',
                                background: 'linear-gradient(180deg, rgba(40, 40, 40, 0.85), rgba(20, 20, 20, 0.85))',
                                borderRadius: '50% 50% 40% 40%',
                                position: 'relative',
                                opacity: 0.85
                              }}>
                                <div style={{
                                  width: '34px',
                                  height: '9px',
                                  border: '2px solid rgba(60, 60, 60, 0.85)',
                                  borderRadius: '50%',
                                  position: 'absolute',
                                  top: '-5px',
                                  left: '50%',
                                  transform: 'translateX(-50%)'
                                }} />
                                {/* Removed the bottom base piece */}
                              </div>
                              <div style={{
                                position: 'absolute',
                                color: 'rgba(60, 60, 60, 0.85)',
                                fontSize: '20px', // Mobile-appropriate size
                                fontWeight: 'bold'
                              }}>
                                ?
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback icon */}
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '30px',
                            color: '#999'
                          }}>
                            ♔
                          </div>

                          {/* Enhanced newly unlocked sparkle */}
                          {isNewlyUnlocked && (
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              fontSize: '14px',
                              animation: 'sparkle 1.5s infinite',
                              textShadow: '0 0 8px rgba(255,255,255,1)'
                            }}>
                              ✨
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  } else {
                    return (
                      <div
                        key={`empty-${shelf.type}-${slotIndex}`}
                        style={{
                          width: shelf.capacity === 1 ? '75px' : '65px', // Match mobile-optimized sizes
                          height: shelf.capacity === 1 ? '88px' : '80px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{
                          width: '38px', // Match mobile-optimized placeholder
                          height: '54px',
                          background: 'linear-gradient(180deg, rgba(40, 40, 40, 0.85), rgba(20, 20, 20, 0.85))',
                          borderRadius: '50% 50% 40% 40%',
                          position: 'relative',
                          opacity: 0.85
                        }}>
                          <div style={{
                            width: '34px',
                            height: '9px',
                            border: '2px solid rgba(60, 60, 60, 0.85)',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }} />
                          {/* Removed the bottom base piece */}
                        </div>
                        <div style={{
                          position: 'absolute',
                          color: 'rgba(60, 60, 60, 0.85)',
                          fontSize: '20px', // Match mobile-appropriate size
                          fontWeight: 'bold'
                        }}>
                          ?
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* VISIBLE SHELF */}
              <div style={{
                width: shelf.capacity === 1 ? '75px' : '85%', // All other shelves are now 5 capacity
                height: '10px',
                backgroundColor: shelf.shelfColor,
                borderRadius: '3px',
                boxShadow: `0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.2), ${shelf.glow}`,
                marginBottom: '2px'
              }} />

              {/* SHELF LABEL */}
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '20px',
                padding: '4px 8px',
                backdropFilter: 'blur(8px)',
                letterSpacing: '0.5px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'inline-block'
              }}>
                {shelf.label}
              </div>
            </div>
          ))}

        </div>

        {/* 📋 Simple Info Card - Properly Centered */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: '0 20px',
          marginTop: '15px'
        }}>
          <button
            onClick={() => setShowInfoModal(true)}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.surface}F5, ${currentTheme.background}F0)`,
              borderRadius: '14px',
              padding: '12px',
              boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 1px 3px ${currentTheme.primary}20`,
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              width: '280px',
              border: `1px solid ${currentTheme.primary}30`,
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: currentTheme.textPrimary,
              marginBottom: '8px'
            }}>
              Unlock your Luxlings™ Saints
            </div>
            <div style={{
              fontSize: '12px',
              color: currentTheme.textSecondary,
              lineHeight: '1.5'
            }}>
              Keep building healthy habits every day to unlock more inspirational saints
            </div>
            <div style={{
              fontSize: '11px',
              color: currentTheme.primary,
              marginTop: '8px',
              fontWeight: '600'
            }}>
              Tap for collection guide 📖
            </div>
          </button>
        </div>

        {/* SAINT MODAL - FIXED WITH SERIES COLORS */}
        {showSaintModal && selectedSaint && (() => {
          const seriesColor = seriesColors[selectedSaint.luxlings_series] || seriesColors['Pocket Patrons'];
          
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
                maxWidth: '360px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <button
                  onClick={closeSaintModal}
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

                {/* LARGE SAINT IMAGE - TRANSPARENT BACKGROUND */}
                <div style={{
                  width: '300px',
                  height: '360px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '40px' // Space for close button
                }}>
                  <img 
                    src={selectedSaint.icon_asset?.replace('assets/', '/') || `/saints/${selectedSaint.id}.png`} 
                    alt={selectedSaint.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.3)) drop-shadow(0 0 40px rgba(255,255,255,0.2))'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback icon */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '80px',
                    color: 'rgba(255,255,255,0.8)',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.3)) drop-shadow(0 0 40px rgba(255,255,255,0.2))'
                  }}>
                    ♔
                  </div>
                </div>

                {/* COMPACT INFO CARD - SERIES BACKGROUND COLOR */}
                <div style={{
                  backgroundColor: seriesColor.bg,
                  borderRadius: '14px',
                  padding: '16px',
                  width: '90%',
                  maxWidth: '320px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  textAlign: 'center'
                }}>
                  {/* Saint Name */}
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: seriesColor.modalText,
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    {selectedSaint.name}
                  </h2>

                  {/* Series Pill - Fixed for better contrast */}
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#2F1B14',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    display: 'inline-block',
                    marginBottom: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {selectedSaint.luxlings_series}
                  </div>

                  {/* Feast Day */}
                  <div style={{
                    fontSize: '12px',
                    color: seriesColor.modalText,
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    🗓️ <strong>Feast Day:</strong> {selectedSaint.feast_day}
                  </div>

                  {/* Patron of */}
                  <div style={{
                    fontSize: '12px',
                    color: seriesColor.modalText,
                    marginBottom: '10px',
                    fontWeight: '500'
                  }}>
                    🙏 <strong>Patron of:</strong> {selectedSaint.patronage}
                  </div>

                  {/* Their Story */}
                  <div style={{
                    fontSize: '11px',
                    color: seriesColor.modalText,
                    lineHeight: '1.4',
                    marginBottom: selectedSaint.extra_fact ? '10px' : '0',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: seriesColor.modalText
                    }}>
                      📖 Their Story
                    </div>
                    {selectedSaint.short_blurb}
                  </div>

                  {/* Did You Know */}
                  {selectedSaint.extra_fact && (
                    <div style={{
                      fontSize: '11px',
                      color: seriesColor.modalText,
                      lineHeight: '1.4',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: seriesColor.modalText
                      }}>
                        ✨ Did You Know?
                      </div>
                      <div style={{ fontStyle: 'italic' }}>
                        {selectedSaint.extra_fact}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* INFO MODAL */}
        {showInfoModal && (
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
                onClick={() => setShowInfoModal(false)}
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
                padding: '20px 20px 10px',
                textAlign: 'center',
                backgroundColor: currentTheme.primary,
                borderRadius: '20px 20px 0 0'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  margin: '0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Luxlings™ Saints Collection Guide
                </h2>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 20px 20px'
              }}>
                {/* Unlock Requirements */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '12px',
                  border: `1px solid ${currentTheme.primary}30`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '10px',
                    textAlign: 'center'
                  }}>
                    🏆 How to Unlock Saints:
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme.textSecondary,
                    lineHeight: '1.6',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '4px' }}>🔥 7-day streak → Common saints</div>
                    <div style={{ marginBottom: '4px' }}>🎓 First book → Grade saint</div>
                    <div style={{ marginBottom: '4px' }}>🌟 30-day streak → Rare saints</div>
                    <div style={{ marginBottom: '4px' }}>⚡ 90-day streak → Legendary saints</div>
                    <div style={{ marginBottom: '4px' }}>📖 20 books → Marian apparitions</div>
                    <div>🏆 100 books → Ultimate goal!</div>
                  </div>
                </div>

                {/* Luxlings Series Info - Collapsible */}
                <button
                  onClick={() => setIsSeriesExpanded(!isSeriesExpanded)}
                  style={{
                    width: '100%',
                    background: `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.secondary}20)`,
                    border: `1px solid ${currentTheme.primary}40`,
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.3s ease',
                    marginBottom: isSeriesExpanded ? '16px' : '0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary
                    }}>
                      ✨ Series Collection Guide
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textPrimary,
                      transform: isSeriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      position: 'absolute',
                      right: '0'
                    }}>
                      ▼
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme.textSecondary,
                    marginTop: '4px',
                    textAlign: 'center'
                  }}>
                    {isSeriesExpanded ? 'Tap to hide' : 'Tap to view all 17 series'}
                  </div>
                </button>

                {isSeriesExpanded && (
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme.textSecondary,
                    lineHeight: '1.5',
                    animation: 'fadeIn 0.3s ease',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Ultimate Goal</strong><br />
                      <em>The heart of our collection and the center of all faith</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Mini Marians</strong><br />
                      <em>Collect all the beloved appearances and titles of Our Lady from around the world</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Sacred Circle</strong><br />
                      <em>Jesus' chosen twelve disciples plus Mary Magdalene - the original followers who changed everything</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Faithful Families</strong><br />
                      <em>Canonized saint families who prayed, served, and were sanctified together</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Halo Hatchlings</strong><br />
                      <em>Young saints who lived holy lives and inspired others before reaching adulthood</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Apostolic All-Stars</strong><br />
                      <em>The great teachers, doctors, and early Church fathers who shaped our faith</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Cherub Chibis</strong><br />
                      <em>The mighty archangels - heaven's warrior messengers in adorable form</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Contemplative Cuties</strong><br />
                      <em>Mystics and visionaries who experienced God's love in extraordinary ways</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Founder Flames</strong><br />
                      <em>Bold saints who started religious orders and lit fires of faith across the world</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Desert Disciples</strong><br />
                      <em>Holy hermits and monks who found God in silence, solitude, and prayer</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Regal Royals</strong><br />
                      <em>Kings, queens, and nobles who used their crowns to serve God and their people</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Culture Carriers</strong><br />
                      <em>Beloved patron saints of countries - collect your homeland's heavenly protector</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Learning Legends</strong><br />
                      <em>Saints who dedicated their lives to education, schools, and spreading knowledge</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Super Sancti</strong><br />
                      <em>Heroic martyrs, missionaries, and miracle-workers who changed the world</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Heavenly Helpers</strong><br />
                      <em>Powerful intercessors known for answering prayers and working miracles</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Pocket Patrons</strong><br />
                      <em>Your everyday protectors for life's daily needs and challenges</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: currentTheme.textPrimary }}>Virtue Vignettes</strong><br />
                      <em>Saints who perfectly modeled specific virtues we can imitate in our own lives</em>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
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
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes saintGlow {
            0%, 100% { 
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            }
            50% { 
              box-shadow: 0 4px 20px rgba(255,215,0,0.6);
            }
          }
          
          @keyframes sparkle {
            0%, 100% { 
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
            25% { 
              opacity: 0.7;
              transform: scale(1.1) rotate(90deg);
            }
            50% { 
              opacity: 0.5;
              transform: scale(1.2) rotate(180deg);
            }
            75% { 
              opacity: 0.7;
              transform: scale(1.1) rotate(270deg);
            }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
          }
          
          /* PWA Mobile Optimizations */
          @media screen and (max-width: 480px) {
            input, textarea, select {
              font-size: 16px !important;
            }
          }
          
          /* Extra small screens */
          @media screen and (max-width: 380px) {
            .saints-container {
              padding: 0 8px !important;
              max-width: 330px !important;
            }
          }
          
          /* Prevent zoom on input focus for PWA */
          @media screen and (max-device-width: 480px) {
            select, input, textarea {
              font-size: 16px !important;
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
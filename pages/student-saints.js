import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { usePhaseAccess } from '../hooks/usePhaseAccess';
import { getStudentDataEntities, updateStudentDataEntities } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getTheme, getSeasonalThemeAnnouncement } from '../lib/themes'; // ADD THIS LINE
import Head from 'next/head';

export default function StudentSaints() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess(userProfile);
  
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
const [seasonalThemeAlert, setSeasonalThemeAlert] = useState(null); // ADD THIS LINE

  // 🍔 NAVIGATION MENU ITEMS WITH PHASE AWARENESS
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { name: 'Nominees', path: '/student-nominees', icon: '□', access: 'nomineesBrowsing' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏', access: 'bookshelfViewing' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔', current: true },
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
    'Pocket Patrons': { bg: '#708090', text: '#FFFFFF', border: '#2F4F4F', modalText: '#FFFFFF' },
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
  const grade = studentData.grade || 4;
  
  // Grade 4: Christmas Season (December) - St. Nicholas
  if (saint.id === 'saint_028' && grade === 4 && month === 12) {
    return true;
  }
  
  // Grade 5: Lent/Easter Prep (February-March) - St. George
  if (saint.id === 'saint_088' && grade === 5 && (month === 2 || month === 3)) {
    return true;
  }
  
  // Grade 6: Rosary Month (October) - Our Lady of the Rosary
  if (saint.id === 'saint_136' && grade === 6 && month === 10) {
    return true;
  }
  
  // Grade 7: Holiday Travel Season (November) - St. Christopher
  if (saint.id === 'saint_109' && grade === 7 && month === 11) {
    return true;
  }
  
  // Grade 8: Start of School/Senior Year (September) - St. Michael
  if (saint.id === 'saint_011' && grade === 8 && month === 9) {
    return true;
  }
  
  return false;
    }
  }, []);

  // 🎵 Play unlock sound
  const playUnlockSound = useCallback((saint) => {
  try {
    let soundFile;
    
    // Determine which sound to play based on saint type
    if (saint.rarity === 'common') {
      soundFile = '/sounds/unlock_saint.mp3'; // Common saints
    } else if (saint.rarity === 'marian' || saint.unlockCondition === 'collected_all_marians') {
      soundFile = '/sounds/unlock_jesus.mp3'; // Marian saints and Ultimate Redeemer
    } else {
      soundFile = '/sounds/unlock_achievement.mp3'; // Rare, legendary, seasonal, grade-specific
    }
    
    const audio = new Audio(soundFile);
    audio.volume = 0.3;
    audio.play().catch(error => {
      console.log('Audio play failed:', error);
    });
  } catch (error) {
    console.log('Sound loading failed:', error);
  }
}, []);

  // 🔥 Load streak data
  const loadStreakData = useCallback(async (studentData) => {
    try {
      // ✅ NEW: No query needed - just read the Firebase field!
      const currentStreak = studentData.currentStreak || 0;
      const longestStreak = studentData.longestStreak || 0;
      const totalDaysRead = studentData.totalDaysRead || 0;
      
      // Still need to query for today's minutes
      const todayStr = getLocalDateString(new Date());
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      
      const todayQuery = query(
        sessionsRef,
        where('date', '==', todayStr)
      );
      
      const todaySnapshot = await getDocs(todayQuery);
      let todayMinutes = 0;
      
      todaySnapshot.forEach(doc => {
        const session = doc.data();
        todayMinutes += session.duration || 0;
      });
      
      setCurrentStreak(currentStreak);
      setTodaysMinutes(todayMinutes);
      
      console.log(`🔥 Saints page - Streak: ${currentStreak}, Today's minutes: ${todayMinutes}`);
      
      return currentStreak;
      
    } catch (error) {
      console.error('Error loading streak data:', error);
      setCurrentStreak(0);
      setTodaysMinutes(0);
      return 0;
    }
  }, []);

// 🏗️ DYNAMIC: Smart shelf organization with auto-building
const organizeSaintsIntoShelves = useCallback((saints, unlockedSaints, studentData, calculatedStreak) => {
  // Group saints by rarity/type (MUTUALLY EXCLUSIVE - priority order matters!)
  const jesusArray = saints.filter(s => s.luxlings_series === 'Ultimate Redeemer');
  
  // FIXED: Exclude Our Lady of the Rosary (saint_136) from Marian shelf - it belongs on seasonal
  const marianArray = saints.filter(s => 
    s.luxlings_series === 'Mini Marians' && s.id !== 'saint_136'
  );
  
  const gradeArray = saints.filter(s => 
    !jesusArray.includes(s) && 
    !marianArray.includes(s) && 
    s.id !== 'saint_136' && // Also exclude from grade array
    (s.rarity?.includes('grade_exclusive') || (s.unlockCondition && s.unlockCondition.includes('first_book_grade')))
  );
  
  // FIXED: Include Our Lady of the Rosary (saint_136) in seasonal array regardless of its series
  const seasonalArray = saints.filter(s => 
    !jesusArray.includes(s) && 
    !marianArray.includes(s) && 
    !gradeArray.includes(s) && 
    (s.rarity === 'seasonal' || s.id === 'saint_136') // Special case for Our Lady of the Rosary
  );
  
  const legendaryArray = saints.filter(s => 
    !jesusArray.includes(s) && 
    !marianArray.includes(s) && 
    !gradeArray.includes(s) && 
    !seasonalArray.includes(s) && 
    s.rarity === 'legendary'
  );
  
  const rareArray = saints.filter(s => 
    !jesusArray.includes(s) && 
    !marianArray.includes(s) && 
    !gradeArray.includes(s) && 
    !seasonalArray.includes(s) && 
    !legendaryArray.includes(s) && 
    s.rarity === 'rare'
  );
  
  const commonArray = saints.filter(s => 
    !jesusArray.includes(s) && 
    !marianArray.includes(s) && 
    !gradeArray.includes(s) && 
    !seasonalArray.includes(s) && 
    !legendaryArray.includes(s) && 
    !rareArray.includes(s) && 
    s.rarity === 'common'
  );

  const saintsByType = {
    jesus: jesusArray,
    marian: marianArray,
    grade: gradeArray,
    seasonal: seasonalArray,
    legendary: legendaryArray,
    rare: rareArray,
    common: commonArray
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

  // 📚 START BUILDING SHELVES
  const shelves = [];

  // 🏆 FIXED SHELVES (Always show these)
  const fixedShelfConfigs = [
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
      capacity: 5, // Perfect for the 5 April Marian saints (excluding Our Lady of Rosary)
      label: '💎 Marian Apparitions 💎'
    },
    { 
      type: 'grade', 
      shelfColor: currentTheme?.primary || '#ADD4EA',
      textColor: currentTheme?.textPrimary || '#223848',
      glow: getGlow(14),
      capacity: 5,
      label: '🎓 Grade Saints 🎓'
    },
    { 
      type: 'seasonal', 
      shelfColor: currentTheme?.primary || '#ADD4EA',
      textColor: currentTheme?.textPrimary || '#223848',
      glow: getGlow(12),
      capacity: 5,
      label: '🍀 Seasonal Saints 🍀'
    }
  ];

  // Add fixed shelves
  fixedShelfConfigs.forEach(config => {
    const typeSaints = saintsByType[config.type] || [];
    shelves.push({
      ...config,
      saints: typeSaints.slice(0, config.capacity),
      totalSaints: typeSaints.length
    });
  });

  // 🔥 DYNAMIC SHELVES - Only for types with many saints
  
  // Helper function to create dynamic shelves
  const createDynamicShelves = (type, saintsArray, baseLabel, glow, shelfColor) => {
    // Only show unlocked saints for dynamic shelves
    const unlockedSaintsOfType = saintsArray.filter(saint => unlockedSaints.has(saint.id));
    
    if (unlockedSaintsOfType.length === 0) return; // Don't create empty shelves
    
    const shelvesNeeded = Math.ceil(unlockedSaintsOfType.length / 5);
    
    for (let i = 0; i < shelvesNeeded; i++) {
      const startIndex = i * 5;
      const endIndex = Math.min(startIndex + 5, unlockedSaintsOfType.length);
      const shelfSaints = unlockedSaintsOfType.slice(startIndex, endIndex);
      
      shelves.push({
        type: `${type}_${i + 1}`,
        shelfColor: shelfColor,
        textColor: currentTheme?.textPrimary || '#223848',
        glow: glow,
        capacity: 5,
        label: shelvesNeeded === 1 ? baseLabel : `${baseLabel} ${i + 1}`,
        saints: shelfSaints,
        totalSaints: unlockedSaintsOfType.length,
        isUnlockedOnly: true // Flag to show these are only unlocked saints
      });
    }
  };

  // 🔥 Create dynamic shelves for each type
  createDynamicShelves(
    'legendary', 
    saintsByType.legendary, 
    '⚡ Legendary Saints ⚡', 
    getGlow(10),
    currentTheme?.primary || '#ADD4EA'
  );

  createDynamicShelves(
    'rare', 
    saintsByType.rare, 
    '🌟 Rare Saints 🌟', 
    getGlow(8),
    currentTheme?.primary || '#ADD4EA'
  );

  createDynamicShelves(
    'common', 
    saintsByType.common, 
    '🔥 Common Saints 🔥', 
    getGlow(6),
    currentTheme?.primary || '#ADD4EA'
  );

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

  // Replace your existing loadSaintsData function with this version
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

    // 📊 CALCULATE ALL MILESTONES EARNED
    const commonMilestonesEarned = Math.floor(calculatedStreak / 14);   // Every 14 days
    const rareMilestonesEarned = Math.floor(calculatedStreak / 30);     // Every 30 days  
    const legendaryMilestonesEarned = Math.floor(calculatedStreak / 90); // Every 90 days
    
    const lifetimeBooks = studentData.lifetimeBooksSubmitted || 0;
    const booksThisYear = studentData.booksSubmittedThisYear || 0;
    const studentGrade = studentData.grade || 4;
    
    // 🌸 NEW: April and month checking
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const isApril = currentMonth === 4;

    console.log('📈 All Milestones:', {
      currentStreak: calculatedStreak,
      commonEarned: commonMilestonesEarned,
      rareEarned: rareMilestonesEarned,
      legendaryEarned: legendaryMilestonesEarned,
      lifetimeBooks,
      booksThisYear,
      grade: studentGrade,
      currentMonth,
      isApril
    });

    // 🗂️ GROUP SAINTS BY UNLOCK TYPE
    const saintsByType = {
      // Streak-based saints (progressive)
      common: saintsData.filter(s => 
        s.rarity === 'common' && 
        (s.unlockCondition === 'streak_7_days' || s.unlockCondition === 'streak_14_days')
      ).sort((a, b) => a.id.localeCompare(b.id)),
      
      rare: saintsData.filter(s => 
        s.rarity === 'rare' && s.unlockCondition === 'streak_30_days'
      ).sort((a, b) => a.id.localeCompare(b.id)),
      
      legendary: saintsData.filter(s => 
        s.rarity === 'legendary' && s.unlockCondition === 'streak_90_days'
      ).sort((a, b) => a.id.localeCompare(b.id)),
      
      // 🌸 April Marian Saints (Monthly + Grade) - YOUR EXACT SAINTS
      april_marians: saintsData.filter(s => 
        s.unlockCondition && s.unlockCondition.startsWith('april_grade_')
      ).sort((a, b) => a.id.localeCompare(b.id)),
      
      // 🏆 Ultimate Redeemer - YOUR EXACT SAINT
      ultimate_redeemer: saintsData.filter(s => 
        s.unlockCondition === 'collected_all_marians'
      ),
      
      // Grade-specific first book saints
      grade_first_book: saintsData.filter(s => 
        s.unlockCondition && s.unlockCondition.includes('first_book_grade')
      ).sort((a, b) => a.id.localeCompare(b.id)),
      
      // Seasonal saints (including Our Lady of the Rosary)
      seasonal: saintsData.filter(s => 
        s.unlockCondition === 'seasonal_feast_day'
      ).sort((a, b) => a.id.localeCompare(b.id))
    };

    console.log('🏷️ Saints by type:', {
      common: saintsByType.common.length,
      rare: saintsByType.rare.length,
      legendary: saintsByType.legendary.length,
      april_marians: saintsByType.april_marians.length,
      ultimate_redeemer: saintsByType.ultimate_redeemer.length,
      grade_first_book: saintsByType.grade_first_book.length,
      seasonal: saintsByType.seasonal.length
    });

    // 🔓 GET CURRENTLY UNLOCKED SAINTS
    const currentlyUnlocked = new Set(studentData.unlockedSaints || []);
    const newUnlocks = new Set();
    const persistentGlowSaints = new Set();

    // 🔥 PROGRESSIVE UNLOCKING LOGIC

    // 1️⃣ STREAK-BASED PROGRESSIVE UNLOCKING
    
    // Common Saints (Every 14 days = 1 saint)
    const unlockedCommonCount = Array.from(currentlyUnlocked).filter(id => 
      saintsByType.common.find(s => s.id === id)
    ).length;
    
    for (let i = unlockedCommonCount; i < Math.min(commonMilestonesEarned, saintsByType.common.length); i++) {
      const saint = saintsByType.common[i];
      if (!currentlyUnlocked.has(saint.id)) {
        currentlyUnlocked.add(saint.id);
        newUnlocks.add(saint.id);
        console.log(`🔥 Unlocked common saint ${i + 1}/${commonMilestonesEarned}:`, saint.name);
      }
    }

    // Rare Saints (Every 30 days = 1 saint)
    const unlockedRareCount = Array.from(currentlyUnlocked).filter(id => 
      saintsByType.rare.find(s => s.id === id)
    ).length;
    
    for (let i = unlockedRareCount; i < Math.min(rareMilestonesEarned, saintsByType.rare.length); i++) {
      const saint = saintsByType.rare[i];
      if (!currentlyUnlocked.has(saint.id)) {
        currentlyUnlocked.add(saint.id);
        newUnlocks.add(saint.id);
        console.log(`⭐ Unlocked rare saint ${i + 1}/${rareMilestonesEarned}:`, saint.name);
      }
    }

    // Legendary Saints (Every 90 days = 1 saint)
    const unlockedLegendaryCount = Array.from(currentlyUnlocked).filter(id => 
      saintsByType.legendary.find(s => s.id === id)
    ).length;
    
    for (let i = unlockedLegendaryCount; i < Math.min(legendaryMilestonesEarned, saintsByType.legendary.length); i++) {
      const saint = saintsByType.legendary[i];
      if (!currentlyUnlocked.has(saint.id)) {
        currentlyUnlocked.add(saint.id);
        newUnlocks.add(saint.id);
        console.log(`✨ Unlocked legendary saint ${i + 1}/${legendaryMilestonesEarned}:`, saint.name);
      }
    }

    // 2️⃣ 🌸 APRIL MARIAN SAINTS (Monthly + Grade Check)
    
    if (isApril) {
      const currentGradeMarianSaint = saintsByType.april_marians.find(s => 
        s.unlockCondition === `april_grade_${studentGrade}`
      );
      
      if (currentGradeMarianSaint && !currentlyUnlocked.has(currentGradeMarianSaint.id)) {
        currentlyUnlocked.add(currentGradeMarianSaint.id);
        newUnlocks.add(currentGradeMarianSaint.id);
        console.log(`🌸 Unlocked April Grade ${studentGrade} Marian:`, currentGradeMarianSaint.name);
      }
    }

    // 3️⃣ 🏆 ULTIMATE REDEEMER (Requires All 5 April Marian Saints)
    
    // YOUR EXACT MARIAN SAINT IDS
    const allAprilMarianIds = [
      "saint_134", // Our Lady of Guadalupe (Grade 4)
      "saint_132", // Our Lady of Lourdes (Grade 5)  
      "saint_133", // Our Lady of Fatima (Grade 6)
      "saint_135", // Our Lady of Sorrows (Grade 7)
      "saint_173"  // Our Lady of Grace (Grade 8)
    ];
    
    const unlockedAprilMarianIds = Array.from(currentlyUnlocked).filter(id => allAprilMarianIds.includes(id));
    const hasAllAprilMarians = allAprilMarianIds.every(id => currentlyUnlocked.has(id));
    
    console.log('👑 April Marian Collection Status:', {
      required: allAprilMarianIds,
      unlocked: unlockedAprilMarianIds,
      hasAll: hasAllAprilMarians,
      progress: `${unlockedAprilMarianIds.length}/${allAprilMarianIds.length}`
    });

    if (hasAllAprilMarians) {
      const ultimateRedeemer = saintsByType.ultimate_redeemer.find(s => 
        s.unlockCondition === "collected_all_marians"
      );
      
      if (ultimateRedeemer && !currentlyUnlocked.has(ultimateRedeemer.id)) {
        currentlyUnlocked.add(ultimateRedeemer.id);
        newUnlocks.add(ultimateRedeemer.id);
        console.log('🏆 ULTIMATE ACHIEVEMENT! Unlocked Ultimate Redeemer:', ultimateRedeemer.name);
      }
    }

    // 4️⃣ GRADE-SPECIFIC FIRST BOOK SAINTS
    if (booksThisYear >= 1) {
      const gradeFirstBookSaint = saintsByType.grade_first_book.find(s => 
        s.unlockCondition === `first_book_grade_${studentGrade}`
      );
      
      if (gradeFirstBookSaint && !currentlyUnlocked.has(gradeFirstBookSaint.id)) {
        currentlyUnlocked.add(gradeFirstBookSaint.id);
        newUnlocks.add(gradeFirstBookSaint.id);
        console.log(`🎓 Unlocked Grade ${studentGrade} first book saint:`, gradeFirstBookSaint.name);
      }
    }

    // 5️⃣ SEASONAL SAINTS (Including Our Lady of the Rosary)
    const seasonalSaintsToUnlock = saintsByType.seasonal.filter(saint => {
      // Our Lady of the Rosary (saint_136) - October for Grade 6
      if (saint.id === 'saint_136' && studentGrade === 6 && currentMonth === 10) {
        return true;
      }
      
      // Add other seasonal conditions here if you have them
      // Grade 4: Christmas Season (December) - St. Nicholas
      if (saint.id === 'saint_028' && studentGrade === 4 && currentMonth === 12) {
        return true;
      }
      
      // Grade 5: Lent/Easter Prep (February-March) - St. George  
      if (saint.id === 'saint_088' && studentGrade === 5 && (currentMonth === 2 || currentMonth === 3)) {
        return true;
      }
      
      // Grade 7: Holiday Travel Season (November) - St. Christopher
      if (saint.id === 'saint_109' && studentGrade === 7 && currentMonth === 11) {
        return true;
      }
      
      // Grade 8: Start of School/Senior Year (September) - St. Michael
      if (saint.id === 'saint_011' && studentGrade === 8 && currentMonth === 9) {
        return true;
      }
      
      return false;
    });
    
    seasonalSaintsToUnlock.forEach(saint => {
      if (!currentlyUnlocked.has(saint.id)) {
        currentlyUnlocked.add(saint.id);
        newUnlocks.add(saint.id);
        console.log(`🍀 Unlocked seasonal saint for Grade ${studentGrade}, Month ${currentMonth}:`, saint.name);
      }
    });

    // 6️⃣ CHECK FOR PERSISTENT GLOW (24-hour new saint indicator)
    saintsData.forEach(saint => {
      if (shouldShowNewGlow(saint.id, studentData)) {
        persistentGlowSaints.add(saint.id);
      }
    });

    // 7️⃣ PLAY UNLOCK SOUNDS & NOTIFICATIONS
    newUnlocks.forEach(saintId => {
      const saint = saintsData.find(s => s.id === saintId);
      if (saint) {
        playUnlockSound(saint);
        if (notificationsEnabled) {
          sendSaintUnlockNotification(saint.name);
        }
      }
    });

    // 8️⃣ UPDATE STATE
    setUnlockedSaints(currentlyUnlocked);
    
    // Combine new unlocks with persistent glow saints
    const allGlowingSaints = new Set([...newUnlocks, ...persistentGlowSaints]);
    setNewlyUnlockedSaints(allGlowingSaints);

    // 9️⃣ SAVE TO DATABASE (if there are new unlocks)
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

        // Clean up old timestamps (older than 25 hours)
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

        setShowSuccess(`🎉 New saint${newUnlocks.size > 1 ? 's' : ''} unlocked: ${newUnlockNames}!`);
        setTimeout(() => setShowSuccess(''), 4000);

        console.log('✅ Successfully saved', newUnlocks.size, 'new saint unlocks to database');
      } catch (error) {
        console.error('❌ Error updating unlocked saints:', error);
      }
    }

    console.log('📊 Final unlock summary:', {
      totalUnlocked: currentlyUnlocked.size,
      newlyUnlocked: newUnlocks.size,
      breakdown: {
        common: Array.from(currentlyUnlocked).filter(id => saintsByType.common.find(s => s.id === id)).length,
        rare: Array.from(currentlyUnlocked).filter(id => saintsByType.rare.find(s => s.id === id)).length,
        legendary: Array.from(currentlyUnlocked).filter(id => saintsByType.legendary.find(s => s.id === id)).length,
        aprilMarians: Array.from(currentlyUnlocked).filter(id => saintsByType.april_marians.find(s => s.id === id)).length,
        ultimateRedeemer: Array.from(currentlyUnlocked).filter(id => saintsByType.ultimate_redeemer.find(s => s.id === id)).length,
        gradeFirstBook: Array.from(currentlyUnlocked).filter(id => saintsByType.grade_first_book.find(s => s.id === id)).length,
        seasonal: Array.from(currentlyUnlocked).filter(id => saintsByType.seasonal.find(s => s.id === id)).length
      }
    });

  } catch (error) {
    console.error('❌ Error loading saints data:', error);
  }
}, [studentData, playUnlockSound, loadStreakData, shouldShowNewGlow, notificationsEnabled, sendSaintUnlockNotification]);

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
        
        // UPDATED: Use getTheme from lib/themes.js
        const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
        const theme = getTheme(selectedThemeKey);
        setCurrentTheme(theme);
        
        // ADD: Check for seasonal themes (optional but nice!)
        const seasonalAnnouncements = getSeasonalThemeAnnouncement();
        if (seasonalAnnouncements.length > 0 && !firebaseStudentData.selectedTheme) {
          // Show seasonal theme notification if user hasn't selected a theme
          setSeasonalThemeAlert(seasonalAnnouncements[0]);
          setTimeout(() => setSeasonalThemeAlert(null), 5000);
        }
        
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
}, [loading, isAuthenticated, user, router]); 

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

  // GET PHASE-AWARE MESSAGING
  const getPhaseAwareMessage = () => {
    const currentPhase = phaseData.currentPhase;
    
    switch (currentPhase) {
      case 'TEACHER_SELECTION':
        return {
          icon: '🚀',
          title: 'New Adventure Almost Here!',
          message: 'The new reading program launches in just 1 week! Keep building those amazing reading streaks and unlocking incredible saints while you wait. Your collection will give you a huge head start on next year\'s journey!',
          color: '#3B82F6',
          bgGradient: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)'
        };
      
      case 'VOTING':
        return {
          icon: '🎯',
          title: 'Keep Collecting Your Luxlings™!',
          message: 'This year\'s program is wrapping up, but your saint-collecting adventure never stops! Keep building those reading streaks, earning XP, and discovering amazing stories about these magnificent saints who changed the world!',
          color: '#8B5CF6',
          bgGradient: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)'
        };
      
      case 'RESULTS':
        return {
          icon: '⭐',
          title: 'Your Luxlings™ Journey Continues!',
          message: 'What an incredible reading year! While we celebrate the winners, keep growing your saint collection and learning about these amazing holy heroes. Every day of reading brings new saints and new inspiration!',
          color: '#F59E0B',
          bgGradient: 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
        };
      
      case 'CLOSED':
        return {
          icon: '❄️',
          title: 'Saints Never Take a Break!',
          message: 'School year might be over, but your Luxlings™ collection keeps growing! These amazing saints are here all year round, ready to inspire your reading adventures and help you discover incredible stories of faith and courage!',
          color: '#6B7280',
          bgGradient: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)'
        };
      
      default:
        return null;
    }
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
  const phaseMessage = getPhaseAwareMessage();

  // ADD THESE TWO LINES - Fix text colors for dark themes
  const isLavenderSpace = currentTheme.assetPrefix === 'lavender_space';
  const fixedTextColor = isLavenderSpace ? '#2A1B3D' : currentTheme.textPrimary;
  const fixedTextSecondary = isLavenderSpace ? '#4A3B5C' : currentTheme.textSecondary;

  return (
    <>
      <Head>
        <title>Saints - Lux Libris</title>
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
            Saints
          </h1>

          {/* 🍔 Hamburger Menu with Phase Awareness */}
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

            {/* Dropdown Menu with Phase Awareness */}
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
                {navMenuItems.map((item, index) => {
                  const isAccessible = !item.access || hasAccess(item.access);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowNavMenu(false);
                        
                        if (item.current) {
                          return;
                        }
                        
                        if (!isAccessible) {
                          // Show appropriate locked message based on phase
                          const currentPhase = phaseData.currentPhase;
                          let message = `${item.name} isn't available right now`;
                          
                          if (currentPhase === 'TEACHER_SELECTION') {
                            message = `${item.name} will be available when the new program starts!`;
                          } else if (currentPhase === 'VOTING') {
                            message = `${item.name} is locked - focus on voting and collecting saints!`;
                          } else if (currentPhase === 'RESULTS') {
                            message = `${item.name} is locked - keep building those saint collections!`;
                          }
                          
                          setShowSuccess(message);
                          setTimeout(() => setShowSuccess(''), 3000);
                          return;
                        }
                        
                        setTimeout(() => {
                          router.push(item.path);
                        }, 100);
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
                        color: !isAccessible ? currentTheme.textSecondary : currentTheme.textPrimary,
                        fontWeight: item.current ? '600' : '500',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'background-color 0.2s ease',
                        opacity: !isAccessible ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!item.current && isAccessible) {
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
                      {!isAccessible && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px' }}>🔒</span>
                      )}
                      {item.current && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                      )}
                    </button>
                  );
                })}
                
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

{/* ADD: Seasonal theme notification */}
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
          animation: 'fadeIn 0.5s ease'
        }}
        onClick={() => {
          router.push('/student-settings');
          setSeasonalThemeAlert(null);
        }}
        >
          {seasonalThemeAlert.icon} {seasonalThemeAlert.message} Tap to use!
        </div>
      )}

        {/* PROGRESS SUMMARY */}
        <div className="saints-progress-section" style={{
          padding: '15px',
          position: 'relative',
          zIndex: 10
        }}>
          <div className="progress-summary-card" style={{
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
                  color: fixedTextColor  // FIXED
                }}>
                  {unlockedSaints.size}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: fixedTextSecondary  // FIXED
                }}>
                  Saints Unlocked
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: fixedTextColor  // FIXED
                }}>
                  {currentStreak}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: fixedTextSecondary  // FIXED
                }}>
                  Day Streak
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: fixedTextColor  // FIXED
                }}>
                  {studentData.lifetimeBooksSubmitted || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: fixedTextSecondary  // FIXED
                }}>
                  Books Read
                </div>
              </div>
            </div>
          </div>

          {/* SMALLER PHASE-AWARE MESSAGE - Show when not in ACTIVE phase */}
          {phaseMessage && (
            <div className="phase-message-card" style={{
              background: phaseMessage.bgGradient,
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px',
              border: `1px solid ${phaseMessage.color}60`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {phaseMessage.icon}
              </div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: phaseMessage.color,
                marginBottom: '6px'
              }}>
                {phaseMessage.title}
              </h3>
              <p style={{
                fontSize: '11px',
                color: phaseMessage.color,
                margin: 0,
                lineHeight: '1.4'
              }}>
                {phaseMessage.message}
              </p>
            </div>
          )}
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
            <div key={shelf.type} className="saint-shelf-row" style={{ 
              marginBottom: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Saints Collection Area - FIXED: More room for saints */}
              <div className="saints-collection-area" style={{
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
                        className="saint-button"
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
                        <div className="saint-icon-container" style={{
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
                            <div className="saint-placeholder-container" style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}>
                              <div className="saint-placeholder-silhouette" style={{
                                width: '38px', // Mobile-optimized placeholder
                                height: '54px',
                                background: 'linear-gradient(180deg, rgba(40, 40, 40, 0.85), rgba(20, 20, 20, 0.85))',
                                borderRadius: '50% 50% 40% 40%',
                                position: 'relative',
                                opacity: 0.85
                              }}>
                                <div className="saint-placeholder-halo" style={{
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
                              <div className="saint-placeholder-question" style={{
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
                        <div className="saint-placeholder-silhouette" style={{
                          width: '38px', // Match mobile-optimized placeholder
                          height: '54px',
                          background: 'linear-gradient(180deg, rgba(40, 40, 40, 0.85), rgba(20, 20, 20, 0.85))',
                          borderRadius: '50% 50% 40% 40%',
                          position: 'relative',
                          opacity: 0.85
                        }}>
                          <div className="saint-placeholder-halo" style={{
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
                        <div className="saint-placeholder-question" style={{
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
              <div className="shelf-board" style={{
                width: shelf.capacity === 1 ? '75px' : '85%', // All other shelves are now 5 capacity
                height: '10px',
                backgroundColor: shelf.shelfColor,
                borderRadius: '3px',
                boxShadow: `0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.2), ${shelf.glow}`,
                marginBottom: '2px'
              }} />

              {/* SHELF LABEL */}
              <div className="shelf-label" style={{
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
        <div className="info-guide-section" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: '0 20px',
          marginTop: '15px'
        }}>
          <button
            onClick={() => setShowInfoModal(true)}
            className="info-guide-button"
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
              transition: 'all 0.3s ease',
              backgroundColor: isLavenderSpace ? 'rgba(255,255,255,0.95)' : 'transparent'  // ADD THIS
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
              <div className="saint-modal-container" style={{
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
                  className="saint-modal-close"
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
                <div className="saint-modal-image-container" style={{
  width: '300px',
  height: '360px',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '40px',
  position: 'relative'
}}>
  <div style={{
    position: 'absolute',
    inset: '20px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(8px)',
    zIndex: 0
  }} />
                  <img 
                    src={selectedSaint.icon_asset?.replace('assets/', '/') || `/saints/${selectedSaint.id}.png`} 
                    alt={selectedSaint.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
borderRadius: '12px'
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
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                  }}>
                    ♔
                  </div>
                </div>

                {/* COMPACT INFO CARD - SERIES BACKGROUND COLOR */}
                <div className="saint-modal-info-card" style={{
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
            <div className="info-modal-container" style={{
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
                className="info-modal-close"
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
                    color: fixedTextColor,  // FIXED
                    marginBottom: '10px',
                    textAlign: 'center'
                  }}>
                    🏆 How to Unlock Saints:
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: fixedTextSecondary,  // FIXED
                    lineHeight: '1.6',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '4px' }}>🔥 14-day streak → Common saints</div>
                    <div style={{ marginBottom: '4px' }}>🎓 First book → Grade saint</div>
                    <div style={{ marginBottom: '4px' }}>🌟 30-day streak → Rare saints</div>
                    <div style={{ marginBottom: '4px' }}>⚡ 90-day streak → Legendary saints</div>
                    <div style={{ marginBottom: '4px' }}>📖 End of Program → Marian apparitions</div>
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
                      color: fixedTextColor  // FIXED
                    }}>
                      ✨ Series Collection Guide
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: fixedTextColor,  // FIXED
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
                    color: fixedTextSecondary,
                    marginTop: '4px',
                    textAlign: 'center'
                  }}>
                    {isSeriesExpanded ? 'Tap to hide' : 'Tap to view all 17 series'}
                  </div>
                </button>

                {isSeriesExpanded && (
                  <div style={{
                    fontSize: '12px',
                    color: fixedTextSecondary,
                    lineHeight: '1.5',
                    animation: 'fadeIn 0.3s ease',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Ultimate Goal</strong><br />
                      <em>The heart of our collection and the center of all faith</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Mini Marians</strong><br />
                      <em>Collect all the beloved appearances and titles of Our Lady from around the world</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Sacred Circle</strong><br />
                      <em>Jesus&apos; chosen twelve disciples plus Mary Magdalene - the original followers who changed everything</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Faithful Families</strong><br />
                      <em>Canonized saint families who prayed, served, and were sanctified together</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Halo Hatchlings</strong><br />
                      <em>Young saints who lived holy lives and inspired others before reaching adulthood</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Apostolic All-Stars</strong><br />
                      <em>The great teachers, doctors, and early Church fathers who shaped our faith</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Cherub Chibis</strong><br />
                      <em>The mighty archangels - heaven&apos;s warrior messengers in adorable form</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Contemplative Cuties</strong><br />
                      <em>Mystics and visionaries who experienced God&apos;s love in extraordinary ways</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Founder Flames</strong><br />
                      <em>Bold saints who started religious orders and lit fires of faith across the world</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Desert Disciples</strong><br />
                      <em>Holy hermits and monks who found God in silence, solitude, and prayer</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Regal Royals</strong><br />
                      <em>Kings, queens, and nobles who used their crowns to serve God and their people</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Culture Carriers</strong><br />
                      <em>Beloved patron saints of countries - collect your homeland&apos;s heavenly protector</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Learning Legends</strong><br />
                      <em>Saints who dedicated their lives to education, schools, and spreading knowledge</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Super Sancti</strong><br />
                      <em>Heroic martyrs, missionaries, and miracle-workers who changed the world</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Heavenly Helpers</strong><br />
                      <em>Powerful intercessors known for answering prayers and working miracles</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Pocket Patrons</strong><br />
                      <em>Your everyday protectors for life&aposs daily needs and challenges</em>
                    </div>
                    
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <strong style={{ color: fixedTextColor }}>Virtue Vignettes</strong><br />
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
          
          /* Tablet scaling for iPad-sized devices */
          @media screen and (min-width: 768px) and (max-width: 1024px) {
            .saints-progress-section {
              padding: 21px !important; /* 15px * 1.4 */
            }
            
            .progress-summary-card {
              border-radius: 22px !important; /* 16px * 1.4 */
              padding: 22px !important; /* 16px * 1.4 */
              margin-bottom: 28px !important; /* 20px * 1.4 */
            }
            
            .phase-message-card {
              border-radius: 17px !important; /* 12px * 1.4 */
              padding: 17px !important; /* 12px * 1.4 */
              margin-bottom: 22px !important; /* 16px * 1.4 */
            }
            
            .saints-container {
              padding: 0 14px 28px !important; /* 0 10px 20px * 1.4 */
              max-width: 490px !important; /* 350px * 1.4 */
            }
            
            .saint-shelf-row {
              margin-bottom: 6px !important; /* 4px * 1.4 */
            }
            
            .saints-collection-area {
              height: 126px !important; /* 90px * 1.4 */
              margin-bottom: 1px !important; /* Keep at 1px */
              max-width: 105px !important; /* 75px * 1.4 for single items */
            }
            
            .saints-collection-area:not(:has(.saint-icon-container[style*="75px"])) {
              max-width: 462px !important; /* 330px * 1.4 for multi items */
            }
            
            .saint-icon-container {
              width: 105px !important; /* 75px * 1.4 for single */
              height: 123px !important; /* 88px * 1.4 for single */
            }
            
            .saint-icon-container:not([style*="75px"]) {
              width: 91px !important; /* 65px * 1.4 for multi */
              height: 112px !important; /* 80px * 1.4 for multi */
            }
            
            .saint-placeholder-silhouette {
              width: 53px !important; /* 38px * 1.4 */
              height: 76px !important; /* 54px * 1.4 */
            }
            
            .saint-placeholder-halo {
              width: 48px !important; /* 34px * 1.4 */
              height: 13px !important; /* 9px * 1.4 */
              top: -7px !important; /* -5px * 1.4 */
            }
            
            .saint-placeholder-question {
              font-size: 28px !important; /* 20px * 1.4 */
            }
            
            .shelf-board {
              width: 105px !important; /* 75px * 1.4 for single shelf */
              height: 14px !important; /* 10px * 1.4 */
              border-radius: 4px !important; /* 3px * 1.4 */
              margin-bottom: 3px !important; /* 2px * 1.4 */
            }
            
            .shelf-board:not([style*="75px"]) {
              width: 85% !important; /* Keep percentage for multi shelves */
            }
            
            .shelf-label {
              font-size: 17px !important; /* 12px * 1.4 */
              border-radius: 28px !important; /* 20px * 1.4 */
              padding: 6px 11px !important; /* 4px 8px * 1.4 */
            }
            
            .info-guide-section {
              padding: 0 28px !important; /* 0 20px * 1.4 */
              margin-top: 21px !important; /* 15px * 1.4 */
            }
            
            .info-guide-button {
              border-radius: 20px !important; /* 14px * 1.4 */
              padding: 17px !important; /* 12px * 1.4 */
              width: 392px !important; /* 280px * 1.4 */
            }
            
            .saint-modal-container {
              max-width: 504px !important; /* 360px * 1.4 */
            }
            
            .saint-modal-close {
              top: 17px !important; /* 12px * 1.4 */
              right: 17px !important; /* 12px * 1.4 */
              width: 50px !important; /* 36px * 1.4 */
              height: 50px !important; /* 36px * 1.4 */
              font-size: 22px !important; /* 16px * 1.4 */
            }
            
            .saint-modal-image-container {
              width: 420px !important; /* 300px * 1.4 */
              height: 504px !important; /* 360px * 1.4 */
              margin-bottom: 22px !important; /* 16px * 1.4 */
              margin-top: 56px !important; /* 40px * 1.4 */
            }
            
            .saint-modal-info-card {
              border-radius: 20px !important; /* 14px * 1.4 */
              padding: 22px !important; /* 16px * 1.4 */
              max-width: 448px !important; /* 320px * 1.4 */
            }
            
            .info-modal-container {
              border-radius: 28px !important; /* 20px * 1.4 */
              max-width: 532px !important; /* 380px * 1.4 */
            }
            
            .info-modal-close {
              top: 17px !important; /* 12px * 1.4 */
              right: 17px !important; /* 12px * 1.4 */
              width: 50px !important; /* 36px * 1.4 */
              height: 50px !important; /* 36px * 1.4 */
              font-size: 22px !important; /* 16px * 1.4 */
            }
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
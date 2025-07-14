// pages/student-dashboard.js - FULLY UPDATED with all code changes and fixes
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentDataEntities, getSchoolNomineesEntities } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState('');
  
  // 🍔 HAMBURGER MENU STATE VARIABLES
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationProcessing, setNotificationProcessing] = useState(false);

  // Enhanced dashboard data
  const [achievementTiers, setAchievementTiers] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [nextAchievement, setNextAchievement] = useState(null);
  const [smartRecommendations, setSmartRecommendations] = useState([]);
  const [latestSaintUnlock, setLatestSaintUnlock] = useState(null);
  const [readingStats, setReadingStats] = useState({ streak: 0, todayMinutes: 0 });

  // NEW: Expandable action items
  const [showAllActionItems, setShowAllActionItems] = useState(false);
  
  // NEW: Currently Reading state from first document
  const [showAllCurrentlyReading, setShowAllCurrentlyReading] = useState(false);

  // NEW: Grade progression state
  const [showGradeUpdate, setShowGradeUpdate] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);

  // Real dashboard data from Firebase
  const [dashboardData, setDashboardData] = useState({
    booksReadThisYear: 0,
    totalBooksRead: 0,
    saintCount: 0,
    currentYearGoal: 10, // Default goal
    lifetimeGoal: 100    // Default lifetime goal
  });

  // 🍔 NAVIGATION MENU ITEMS (Dashboard page is current, now includes Settings)
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂', current: true },
    { name: 'Nominees', path: '/student-nominees', icon: '□' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], []);

  // NEW: Book state management functions (copied from bookshelf)
  const getBookState = (book) => {
    const now = new Date();
    
    // Check if completed
    if (book.completed && book.status === 'completed') {
      return 'completed';
    }
    
    // Check for pending states
    if (book.status === 'pending_approval' || book.status === 'pending_admin_approval') {
      return 'pending_admin_approval';
    }
    
    if (book.status === 'pending_parent_quiz_unlock') {
      return 'pending_parent_quiz_unlock';
    }
    
    // Check for failed quiz with cooldown
    if (book.status === 'quiz_failed' && book.failedAt) {
      // Handle Firebase Timestamp properly
      const failedTime = book.failedAt?.toDate ? book.failedAt.toDate() : new Date(book.failedAt);
      const cooldownEnd = new Date(failedTime.getTime() + 24 * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        return 'quiz_cooldown';
      } else {
        return 'quiz_ready'; // Cooldown complete
      }
    }
    
    // Check for admin rejection with cooldown
    if (book.status === 'admin_rejected' && book.rejectedAt) {
      // Handle Firebase Timestamp properly
      const rejectedTime = book.rejectedAt?.toDate ? book.rejectedAt.toDate() : new Date(book.rejectedAt);
      const cooldownEnd = new Date(rejectedTime.getTime() + 24 * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        return 'admin_cooldown';
      }
    }
    
    return 'in_progress';
  };

  // 🔔 NOTIFICATION FUNCTIONS
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

  // Theme definitions
  const themes = {
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
  };

  // 🍔 useEFFECTS for hamburger menu
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

  // Get school's achievement tiers configuration
  const getSchoolAchievementTiers = async (entityId, schoolId) => {
    try {
      console.log(`🎯 Loading achievement tiers for school ${schoolId}`);
      
      const schoolRef = doc(db, 'entities', entityId, 'schools', schoolId);
      const schoolDoc = await getDoc(schoolRef);
      
      if (schoolDoc.exists()) {
        const schoolData = schoolDoc.data();
        return schoolData.achievementTiers || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error loading achievement tiers:', error);
      return [];
    }
  };

  // UPDATED: Generate smart action items based on actual book states - REMOVE continue_reading duplication
  const generateActionItems = (bookshelf = [], nominees = []) => {
    const actions = [];
    const now = new Date();
    
    if (!Array.isArray(bookshelf)) {
      console.warn('📚 Bookshelf is not an array, returning empty actions');
      return actions;
    }
    
    console.log('🔍 Generating action items for', bookshelf.length, 'books');
    
    // 1. Teacher approvals (highest priority celebration)
    const teacherApproved = bookshelf.filter(book => {
      const state = getBookState(book);
      return state === 'completed' && book.submissionType !== 'quiz' && 
             book.status === 'completed' && book.submittedAt;
    });
    
    teacherApproved.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      actions.push({
        type: 'teacher_approved',
        bookId: book.bookId,
        priority: 1,
        emoji: '🎉',
        title: `"${nominee?.title || 'Book'}" Approved!`,
        subtitle: 'Your teacher approved your submission! 🏆'
      });
    });
    
    // 2. Books ready to submit (completed, not submitted)
    const readyToSubmit = bookshelf.filter(book => {
      const state = getBookState(book);
      const total = book.format === 'audiobook' ? 
        (nominees.find(n => n.id === book.bookId)?.totalMinutes || book.totalMinutes) : 
        (nominees.find(n => n.id === book.bookId)?.pages || nominees.find(n => n.id === book.bookId)?.pageCount || book.totalPages);
      
      return !book.completed && !book.submitted && book.currentProgress >= total && total > 0 && state === 'in_progress';
    });
    
    readyToSubmit.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      actions.push({
        type: 'ready_submit',
        bookId: book.bookId,
        priority: 1,
        emoji: '🎉',
        title: `Submit "${nominee?.title || 'Unknown Book'}"`,
        subtitle: 'Book completed - ready for teacher review!'
      });
    });
    
    // 3. Quizzes available to take (including retry after cooldown)
    const quizReady = bookshelf.filter(book => {
      const state = getBookState(book);
      return state === 'pending_parent_quiz_unlock' || state === 'quiz_available' || state === 'quiz_ready';
    });
    
    quizReady.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      const state = getBookState(book);
      const isRetry = state === 'quiz_ready';
      
      actions.push({
        type: isRetry ? 'retry_quiz' : 'take_quiz',
        bookId: book.bookId,
        priority: 1,
        emoji: isRetry ? '🔄' : '📝',
        title: `${isRetry ? 'Retry' : 'Take'} quiz for "${nominee?.title || 'Unknown Book'}"`,
        subtitle: isRetry ? 'Cooldown complete - you can try again!' : 'Quiz unlocked - complete it to submit your book!'
      });
    });
    
    // 4. REMOVED: continue_reading - now handled by CurrentlyReadingSection
    
    // 5. Quiz failures with cooldown (show time remaining)
    const quizCooldown = bookshelf.filter(book => {
      const state = getBookState(book);
      return state === 'quiz_cooldown';
    });
    
    quizCooldown.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      const failedAt = book.failedAt ? (book.failedAt?.toDate ? book.failedAt.toDate() : new Date(book.failedAt)) : now;
      const cooldownEnd = new Date(failedAt.getTime() + 24 * 60 * 60 * 1000);
      const hoursRemaining = Math.max(0, Math.ceil((cooldownEnd - now) / (1000 * 60 * 60)));
      
      actions.push({
        type: 'quiz_cooldown',
        bookId: book.bookId,
        priority: 3,
        emoji: '⏰',
        title: `Quiz available in ${hoursRemaining}h`,
        subtitle: `"${nominee?.title || 'Unknown Book'}" - Try again soon`
      });
    });
    
    // 6. Waiting for approvals (lower priority)
    const pendingAdmin = bookshelf.filter(book => {
      const state = getBookState(book);
      return state === 'pending_admin_approval';
    });
    
    pendingAdmin.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      actions.push({
        type: 'pending_admin',
        bookId: book.bookId,
        priority: 4,
        emoji: '👩‍🏫',
        title: 'Waiting for teacher approval',
        subtitle: `"${nominee?.title || 'Unknown Book'}" - your teacher is reviewing`
      });
    });
    
    const pendingParent = bookshelf.filter(book => {
      const state = getBookState(book);
      return state === 'pending_parent_quiz_unlock';
    });
    
    pendingParent.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      actions.push({
        type: 'waiting_parent',
        bookId: book.bookId,
        priority: 4,
        emoji: '👨‍👩‍👧‍👦',
        title: 'Waiting for parent approval',
        subtitle: `"${nominee?.title || 'Unknown Book'}" - ask your parent to unlock the quiz`
      });
    });
    
    // Sort by priority
    actions.sort((a, b) => a.priority - b.priority);
    
    console.log(`✨ Generated ${actions.length} action items:`, actions.map(a => a.type));
    return actions;
  };

  // Calculate next achievement based on current books and tiers
  const getNextAchievement = (currentBooks, achievementTiers) => {
    if (!Array.isArray(achievementTiers) || achievementTiers.length === 0) {
      return null;
    }
    
    const nextTier = achievementTiers.find(tier => currentBooks < tier.books);
    
    if (!nextTier) {
      return null;
    }
    
    const booksNeeded = nextTier.books - currentBooks;
    const progress = currentBooks > 0 ? (currentBooks / nextTier.books) * 100 : 0;
    
    return {
      books: nextTier.books,
      reward: nextTier.reward,
      booksNeeded,
      progress: Math.min(progress, 100)
    };
  };

  // UPDATED: Calculate days until actual competition end (not hardcoded)
  const getDaysUntilCompetitionEnd = () => {
    // This should be configurable from school settings, but for now using March 31st, 2026
    // FIXED: Use 2026 since it's July 2025 now
    const competitionEnd = new Date('2026-03-31T23:59:59');
    const now = new Date();
    const timeDiff = competitionEnd.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  };

  // UPDATED: Load reading stats properly
  const loadReadingStats = async (studentData) => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
      
      // Get today's sessions for minutes
      const todayQuery = query(sessionsRef, where('date', '==', todayStr));
      const todaySnapshot = await getDocs(todayQuery);
      
      let todayMinutes = 0;
      todaySnapshot.forEach(doc => {
        const session = doc.data();
        todayMinutes += session.duration || 0;
      });
      
      // Get recent sessions for streak calculation
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(today.getDate() - 42);
      const sixWeeksAgoStr = `${sixWeeksAgo.getFullYear()}-${String(sixWeeksAgo.getMonth() + 1).padStart(2, '0')}-${String(sixWeeksAgo.getDate()).padStart(2, '0')}`;
      
      const recentQuery = query(sessionsRef, where('date', '>=', sixWeeksAgoStr));
      const recentSnapshot = await getDocs(recentQuery);
      
      const completedSessionsByDate = {};
      recentSnapshot.forEach(doc => {
        const session = doc.data();
        if (session.completed === true) {
          completedSessionsByDate[session.date] = true;
        }
      });
      
      // Calculate smart streak
      let streakCount = 0;
      let checkDate = new Date(today);
      const yesterdayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() - 1).padStart(2, '0')}`;
      
      // Start from today if completed, otherwise start from yesterday
      if (!completedSessionsByDate[todayStr] && completedSessionsByDate[yesterdayStr]) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Count consecutive days backwards
      while (streakCount < 365) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (completedSessionsByDate[dateStr]) {
          streakCount++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      setReadingStats({
        streak: streakCount,
        todayMinutes: todayMinutes
      });
      
    } catch (error) {
      console.error('❌ Error loading reading stats:', error);
      setReadingStats({ streak: 0, todayMinutes: 0 });
    }
  };

  // FIXED: Load latest saint unlock with full saint data (no time restriction)
  const loadLatestSaintUnlock = async (studentData) => {
    try {
      if (!studentData.unlockedSaints || studentData.unlockedSaints.length === 0) {
        setLatestSaintUnlock(null);
        return;
      }
      
      // Get the latest saint from the timestamps
      const timestamps = studentData.newlyUnlockedSaintsWithTimestamp || {};
      let latestSaintId = null;
      let latestTime = 0;
      
      Object.keys(timestamps).forEach(saintId => {
        const timestamp = new Date(timestamps[saintId].timestamp).getTime();
        if (timestamp > latestTime) {
          latestTime = timestamp;
          latestSaintId = saintId;
        }
      });
      
      // Show the most recent saint unlock (no time restriction)
      if (latestSaintId) {
        // 🔧 FIX: Fetch the full saint data from Firebase
        const saintRef = doc(db, 'saints', latestSaintId);
        const saintDoc = await getDoc(saintRef);
        
        if (saintDoc.exists()) {
          const fullSaintData = { id: saintDoc.id, ...saintDoc.data() };
          setLatestSaintUnlock(fullSaintData);
        } else {
          console.warn(`Saint ${latestSaintId} not found in saints collection`);
          setLatestSaintUnlock(null);
        }
      } else {
        setLatestSaintUnlock(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading latest saint unlock:', error);
      setLatestSaintUnlock(null);
    }
  };

  // UPDATED: Random single-book recommendations that avoid bookshelf duplicates
  const generateSmartRecommendations = (nominees, studentData) => {
    if (!nominees.length) return [];
    
    const bookshelf = studentData.bookshelf || [];
    const inBookshelf = bookshelf.map(book => book.bookId);
    
    // Get available books (not already in bookshelf)
    const availableBooks = nominees.filter(book => !inBookshelf.includes(book.id));
    
    console.log(`📚 Recommendations: ${availableBooks.length} books available (${inBookshelf.length} already in bookshelf)`);
    
    if (availableBooks.length === 0) {
      return [{
        type: 'completed',
        title: 'Amazing Achievement!',
        books: [],
        message: 'You\'ve explored every book in your teacher\'s collection! 🎉📚'
      }];
    }
    
    const recommendations = [];
    
    // Helper function to get book page count
    const getPageCount = (book) => book.pages || book.pageCount || 0;
    
    // Helper function to check if book matches grade
    const matchesGrade = (book, grade) => {
      const gradeLevels = book.gradeLevels || '';
      return gradeLevels.includes(grade?.toString());
    };
    
    // 1. Quick Victory (under 150 pages) - 1 book
    const quickReads = availableBooks
      .filter(book => {
        const pages = getPageCount(book);
        return pages > 0 && pages <= 150;
      })
      .sort((a, b) => getPageCount(a) - getPageCount(b));
    
    if (quickReads.length > 0) {
      recommendations.push({
        type: 'quick',
        title: 'Quick Victory',
        books: [quickReads[0]], // Just 1 book
        subtitle: 'A short & sweet read'
      });
    }
    
    // 2. Perfect for Your Grade - 1 book
    const gradeBooks = availableBooks
      .filter(book => matchesGrade(book, studentData.grade));
    
    if (gradeBooks.length > 0) {
      recommendations.push({
        type: 'grade',
        title: `Perfect for Grade ${studentData.grade}`,
        books: [gradeBooks[0]], // Just 1 book
        subtitle: 'Just right for you'
      });
    }
    
    // 3. Epic Adventure (over 300 pages) - 1 book
    const longBooks = availableBooks
      .filter(book => {
        const pages = getPageCount(book);
        return pages > 300;
      })
      .sort((a, b) => getPageCount(b) - getPageCount(a));
    
    if (longBooks.length > 0) {
      recommendations.push({
        type: 'long',
        title: 'Epic Adventure',
        books: [longBooks[0]], // Just 1 book
        subtitle: 'Dive deep into a great story'
      });
    }
    
    // 4. Catholic/Faith-based books - 1 book
    const catholicBooks = availableBooks.filter(book =>
      book.displayCategory?.includes('Catholic') || book.internalCategory?.includes('Catholic')
    );
    
    if (catholicBooks.length > 0) {
      recommendations.push({
        type: 'catholic',
        title: 'Faith & Inspiration',
        books: [catholicBooks[0]], // Just 1 book
        subtitle: 'Strengthen your faith'
      });
    }
    
    // 5. Graphic novels - 1 book
    const graphicBooks = availableBooks.filter(book =>
      book.displayCategory?.includes('Graphic') || book.internalCategory?.includes('Graphic')
    );
    
    if (graphicBooks.length > 0) {
      recommendations.push({
        type: 'graphic',
        title: 'Visual Adventure',
        books: [graphicBooks[0]], // Just 1 book
        subtitle: 'Stories through art'
      });
    }
    
    // 6. Chapter books - 1 book
    const chapterBooks = availableBooks.filter(book =>
      book.displayCategory?.includes('Chapter') || book.internalCategory?.includes('Chapter')
    );
    
    if (chapterBooks.length > 0) {
      recommendations.push({
        type: 'chapter',
        title: 'Chapter Adventure',
        books: [chapterBooks[0]], // Just 1 book
        subtitle: 'Dive into chapters'
      });
    }
    
    // 7. If they've completed books, recommend similar categories - 1 book
    const completedBooks = bookshelf.filter(book => book.completed);
    if (completedBooks.length > 0) {
      const completedCategories = completedBooks.map(book => {
        const nominee = nominees.find(n => n.id === book.bookId);
        return nominee?.displayCategory || nominee?.internalCategory;
      }).filter(Boolean);
      
      const categoryMatches = availableBooks.filter(book => 
        completedCategories.some(cat => 
          book.displayCategory?.includes(cat) || book.internalCategory?.includes(cat)
        )
      );
      
      if (categoryMatches.length > 0) {
        recommendations.push({
          type: 'similar',
          title: 'More Like Your Favorites',
          books: [categoryMatches[0]], // Just 1 book
          subtitle: 'Based on what you\'ve read'
        });
      }
    }
    
    // 8. Random discovery - 1 book
    if (availableBooks.length > 0) {
      const randomBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
      recommendations.push({
        type: 'discovery',
        title: 'Random Discovery',
        books: [randomBook], // Just 1 book
        subtitle: 'Something new to explore'
      });
    }
    
    // 🎲 RANDOM SELECTION: Pick one recommendation type that has books
    const availableRecommendations = recommendations.filter(rec => rec.books.length > 0);
    
    if (availableRecommendations.length === 0) {
      return [{
        type: 'completed',
        title: 'Amazing Achievement!',
        books: [],
        message: 'You\'ve explored every book in your teacher\'s collection! 🎉📚'
      }];
    }
    
    // Randomly pick one recommendation to show
    const randomIndex = Math.floor(Math.random() * availableRecommendations.length);
    const selectedRecommendation = availableRecommendations[randomIndex];
    
    console.log(`🎲 Randomly selected "${selectedRecommendation.title}" from ${availableRecommendations.length} options`);
    
    return [selectedRecommendation];
  };

  // NEW: Currently Reading Section Component from first document
  const CurrentlyReadingSection = ({ bookshelf, nominees, router, currentTheme }) => {
    const getCurrentlyReadingBooks = (bookshelf, nominees) => {
      const inProgressBooks = bookshelf.filter(book => {
        const state = getBookState(book);
        const nominee = nominees.find(n => n.id === book.bookId);
        const total = book.format === 'audiobook' ? 
          (nominee?.totalMinutes || book.totalMinutes) : 
          (nominee?.pages || nominee?.pageCount || book.totalPages);
        
        return state === 'in_progress' && 
               book.currentProgress > 0 && 
               book.currentProgress < total && 
               !book.completed;
      });
      
      // Sort by lastUpdated (most recent first)
      return inProgressBooks.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    };

    const currentlyReadingBooks = getCurrentlyReadingBooks(bookshelf, nominees);
    
    // Get available books (not in bookshelf)
    const inBookshelf = bookshelf.map(book => book.bookId);
    const availableBooks = nominees.filter(book => !inBookshelf.includes(book.id));
    const completedBooks = bookshelf.filter(book => book.completed);
    
    // Determine what to show
    if (currentlyReadingBooks.length === 0) {
      if (availableBooks.length === 0) {
        // All books are complete - show completion message
        return (
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center',
            border: `2px solid ${currentTheme.primary}30`,
            animation: 'slideInUp 0.8s ease-out 0.8s both'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              margin: '0 0 8px 0'
            }}>
              Incredible Achievement!
            </h3>
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              margin: '0 0 16px 0'
            }}>
              You&apos;ve completed all {completedBooks.length} books in your teacher&apos;s collection! 
              You&apos;re officially a reading champion! 🏆
            </p>
            <button
              onClick={() => router.push('/student-stats')}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.textPrimary,
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              View Your Stats
            </button>
          </div>
        );
      } else {
        // Has available books but none in progress - encourage to start
        return (
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: `2px solid ${currentTheme.primary}30`,
            animation: 'slideInUp 0.8s ease-out 0.8s both'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px' }}>🚀</span>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                Ready for Your Next Adventure?
              </h3>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              margin: '0 0 16px 0'
            }}>
              Great job on your progress! You have {availableBooks.length} more books waiting to be explored.
            </p>
            
            <button
              onClick={() => router.push('/student-nominees')}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.textPrimary,
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Browse Books
            </button>
          </div>
        );
      }
    }
    
    // Show currently reading books
    const booksToShow = showAllCurrentlyReading ? currentlyReadingBooks : currentlyReadingBooks.slice(0, 1);
    
    return (
      <div style={{
        backgroundColor: currentTheme.surface,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        border: `1px solid ${currentTheme.primary}30`,
        animation: 'slideInUp 0.8s ease-out 1.2s both'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>📖</span>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              margin: 0
            }}>
              Currently Reading
            </h3>
          </div>
          
          {currentlyReadingBooks.length > 1 && (
            <button
              onClick={() => setShowAllCurrentlyReading(!showAllCurrentlyReading)}
              style={{
                backgroundColor: `${currentTheme.primary}20`,
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: currentTheme.textPrimary,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {showAllCurrentlyReading ? 'Show Less' : `+${currentlyReadingBooks.length - 1} More`}
            </button>
          )}
        </div>
        
        {booksToShow.map((book, index) => {
          const nominee = nominees.find(n => n.id === book.bookId);
          const total = book.format === 'audiobook' ? 
            (nominee?.totalMinutes || book.totalMinutes) : 
            (nominee?.pages || nominee?.pageCount || book.totalPages);
          const progressPercent = total > 0 ? Math.round((book.currentProgress / total) * 100) : 0;
          
          return (
            <button
              key={book.bookId}
              onClick={() => router.push('/student-bookshelf')}
              style={{
                width: '100%',
                backgroundColor: `${currentTheme.primary}20`,
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: index < booksToShow.length - 1 ? '8px' : '0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '60px',
                backgroundColor: `${currentTheme.primary}50`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                overflow: 'hidden'
              }}>
                {nominee?.coverImageUrl ? (
                  <img 
                    src={nominee.coverImageUrl} 
                    alt={nominee.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '20px' }}>📚</span>
                )}
                <span style={{ 
                  fontSize: '20px',
                  display: 'none'
                }}>📚</span>
              </div>
              
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  margin: '0 0 4px 0'
                }}>
                  {nominee?.title || 'Unknown Book'}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary,
                  margin: 0
                }}>
                  {progressPercent}% complete • {book.format}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: `${currentTheme.primary}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary
                }}>
                  {progressPercent}%
                </div>
                <span style={{ 
                  color: currentTheme.primary, 
                  fontSize: '16px'
                }}>→</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadEnhancedDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    // Clean up any leftover localStorage flags from previous splash implementation
    localStorage.removeItem('luxlibris_account_created');
    localStorage.removeItem('luxlibris_account_flow');
  }, []);

  const loadEnhancedDashboardData = async () => {
    try {
      console.log('📚 Loading enhanced dashboard data...');
      
      // Get student data
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        console.log('❌ No student data found, redirecting to onboarding');
        router.push('/student-onboarding');
        return;
      }
      
      console.log('✅ Student data loaded:', firebaseStudentData.firstName);
      
      // NEW: Check for grade progression after loading student data
      const { checkGradeProgression } = await import('../lib/firebase');
      const progressionCheck = await checkGradeProgression(firebaseStudentData);
      firebaseStudentData.needsGradeUpdate = progressionCheck.needsUpdate;
      firebaseStudentData.suggestedGrade = progressionCheck.suggestedGrade;
      firebaseStudentData.shouldBeAlumni = progressionCheck.shouldBeAlumni;

      if (progressionCheck.needsUpdate) {
        setShowGradeUpdate(true);
        setSelectedGrade(progressionCheck.suggestedGrade); // Pre-select suggested grade
      }
      
      setStudentData(firebaseStudentData);
      
      // Set theme
      const selectedTheme = firebaseStudentData.selectedTheme || 'classic_lux';
      setCurrentTheme(themes[selectedTheme]);
      
      // Load school nominees and stats
      if (firebaseStudentData.entityId && firebaseStudentData.schoolId) {
        console.log('📖 Loading school nominees and stats...');
        
        // Load nominees
        const schoolNominees = await getSchoolNomineesEntities(
          firebaseStudentData.entityId, 
          firebaseStudentData.schoolId
        );
        setNominees(schoolNominees);
        
        // Generate smart recommendations
        const recommendations = generateSmartRecommendations(
          schoolNominees, 
          firebaseStudentData
        );
        setSmartRecommendations(recommendations);
        
        // Load achievement tiers
        const tiers = await getSchoolAchievementTiers(
          firebaseStudentData.entityId,
          firebaseStudentData.schoolId
        );
        setAchievementTiers(tiers);
        
        // Calculate next achievement
        const currentBooks = firebaseStudentData.booksSubmittedThisYear || 0;
        const nextGoal = getNextAchievement(currentBooks, tiers);
        setNextAchievement(nextGoal);
        
        // Generate action items
        const actions = generateActionItems(
          firebaseStudentData.bookshelf || [],
          schoolNominees
        );
        setActionItems(actions);
        
        // Load reading stats
        await loadReadingStats(firebaseStudentData);
        
        // Load latest saint unlock
        await loadLatestSaintUnlock(firebaseStudentData);
        
        console.log('🎯 All dashboard data loaded successfully!');
      }
      
      // UPDATED: Calculate dashboard data with proper goals based on teacher's nominees
      const bookshelf = firebaseStudentData.bookshelf || [];
      const completedBooks = bookshelf.filter(book => book.completed);
      
      // Calculate goals based on teacher's selected nominees
      const teacherNomineesCount = firebaseStudentData.teacherNominees?.length || 0;
      const studentPersonalGoal = firebaseStudentData.personalGoal || firebaseStudentData.currentYearGoal || 10;
      
      // Current year goal: student's personal goal, but capped at teacher's nominees count
      const currentYearGoal = Math.min(studentPersonalGoal, teacherNomineesCount || 10);
      
      // Lifetime goal: 5x teacher's nominees count (or fallback if no teacher data)
      const lifetimeGoal = teacherNomineesCount > 0 ? teacherNomineesCount * 5 : 100;
      
      console.log('📊 Dashboard Goals Calculated:', {
        teacherNomineesCount,
        studentPersonalGoal,
        currentYearGoal,
        lifetimeGoal
      });
      
      setDashboardData({
        booksReadThisYear: firebaseStudentData.booksSubmittedThisYear || 0,
        totalBooksRead: firebaseStudentData.lifetimeBooksSubmitted || 0,
        saintCount: firebaseStudentData.unlockedSaints?.length || 0,
        currentYearGoal: currentYearGoal,
        lifetimeGoal: lifetimeGoal
      });

    } catch (error) {
      console.error('❌ Error loading enhanced dashboard:', error);
      router.push('/student-onboarding');
    }
    
    setIsLoading(false);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const firstName = studentData?.firstName || 'Reader';
    
    if (hour < 6) return `Up early, ${firstName}!`;
    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    if (hour < 21) return `Good evening, ${firstName}!`;
    return `Night owl, ${firstName}!`;
  };

  // UPDATED: Better motivational messages
  const getMotivationalMessage = () => {
    const { booksReadThisYear, currentYearGoal } = dashboardData;
    const { streak } = readingStats;
    const daysUntilEnd = getDaysUntilCompetitionEnd();

    if (daysUntilEnd <= 30) {
      return `📅 ${daysUntilEnd} days left in the reading challenge!`;
    }
    if (booksReadThisYear >= currentYearGoal) {
      return '🎉 Goal conquered! You\'re officially a reading champion!';
    }
    if (booksReadThisYear >= currentYearGoal * 0.9) {
      return '⚡ SO close to your goal! One more book might do it!';
    }
    if (streak >= 14) {
      return '🔥 Two week streak! You\'re absolutely unstoppable!';
    }
    if (streak >= 7) {
      return '🔥 One week streak! The reading force is strong with you!';
    }
    if (actionItems.some(item => item.type === 'ready_submit')) {
      return '🎉 You have books ready to submit! Let\'s celebrate!';
    }
    return '📚 Ready for your next reading adventure?';
  };

  // NEW: Handle grade update
  const handleGradeUpdate = async () => {
    if (!selectedGrade || !studentData) return;
    
    setIsUpdatingGrade(true);
    try {
      const { updateStudentGrade } = await import('../lib/firebase');
      
      const result = await updateStudentGrade(
        studentData.id,
        studentData.entityId, 
        studentData.schoolId,
        selectedGrade
      );
      
      if (result.success) {
        // Refresh student data
        await loadEnhancedDashboardData();
        setShowGradeUpdate(false);
        
        if (result.isAlumni) {
          setShowComingSoon('🎓 Congratulations! You\'ve graduated to Alumni status!');
        } else {
          setShowComingSoon(`📈 Welcome to Grade ${result.newGrade}! Ready for a new year of reading!`);
        }
        
        setTimeout(() => setShowComingSoon(''), 4000);
      }
      
    } catch (error) {
      console.error('Error updating grade:', error);
      setShowComingSoon('❌ Error updating grade. Please try again.');
      setTimeout(() => setShowComingSoon(''), 3000);
    }
    
    setIsUpdatingGrade(false);
  };
  
  const handleTabClick = (tabName) => {
    if (tabName === 'Dashboard') {
      setShowComingSoon('You\'re already here! 📍');
      setTimeout(() => setShowComingSoon(''), 1500);
    } else if (tabName === 'Nominees') {
      router.push('/student-nominees');
    } else if (tabName === 'Bookshelf') {
      router.push('/student-bookshelf');
    } else if (tabName === 'Habits') {
      router.push('/student-healthy-habits');
    } else if (tabName === 'Saints') {
      router.push('/student-saints');
    } else if (tabName === 'Stats') {
      router.push('/student-stats');
    }
  };

  // UPDATED: Better action item handling
  const handleActionItemClick = (action) => {
    switch (action.type) {
      case 'teacher_approved':
        setShowComingSoon('🎉 Congratulations! Your hard work paid off!');
        setTimeout(() => setShowComingSoon(''), 4000);
        break;
      case 'ready_submit':
      case 'retry_quiz':
      case 'take_quiz':
        router.push(`/student-bookshelf?book=${action.bookId}`);
        break;
      case 'waiting_parent':
        setShowComingSoon('Check with your parent for quiz approval! 👨‍👩‍👧‍👦');
        setTimeout(() => setShowComingSoon(''), 3000);
        break;
      case 'pending_admin':
        setShowComingSoon('Your teacher is reviewing your submission! 👩‍🏫');
        setTimeout(() => setShowComingSoon(''), 3000);
        break;
      case 'quiz_cooldown':
        setShowComingSoon('Quiz cooldown active - please wait before retrying! ⏰');
        setTimeout(() => setShowComingSoon(''), 3000);
        break;
      default:
        break;
    }
  };

  // UPDATED: Handle recommendation clicks
  const handleRecommendationClick = (book) => {
    // Navigate to nominees page with the specific book
    router.push(`/student-nominees?book=${book.id}`);
  };

  // Show loading while data loads
  if (authLoading || isLoading || !studentData || !currentTheme) {
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
          <p style={{ color: '#223848' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const studentDisplayName = studentData.lastInitial 
    ? `${studentData.firstName} ${studentData.lastInitial}.`
    : studentData.firstName;

  return (
    <>
      <Head>
        <title>Student Dashboard - Lux Libris</title>
        <meta name="description" content="Track your reading progress, compete with classmates, and achieve your goals" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '80px'
      }}>
        
        {/* UPDATED HEADER - Settings removed, only hamburger menu */}
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
          justifyContent: 'center'
        }}>
          {/* CENTERED TITLE */}
          <h1 style={{
            fontSize: '24px',
            fontWeight: '400',
            color: currentTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center'
          }}>
            Dashboard
          </h1>

          {/* 🍔 Hamburger Menu - now includes Settings */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
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

        {/* WELCOME SECTION */}
        <div style={{ padding: '20px' }}>
          {/* Welcome Card with Competition Countdown */}
          <div style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}CC)`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px ${currentTheme.primary}30`,
            marginBottom: '16px',
            animation: 'slideInDown 0.8s ease-out'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              {getTimeBasedGreeting()}
            </h2>
            <p style={{
              fontSize: '16px',
              color: `${currentTheme.textPrimary}E6`,
              margin: '0 0 12px 0'
            }}>
              {getMotivationalMessage()}
            </p>
            
            {/* Competition Countdown */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideInUp 0.6s ease-out 0.3s both'
            }}>
              <span style={{ 
                fontSize: '16px',
                animation: 'bounce 2s infinite'
              }}>🏆</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: currentTheme.textPrimary 
                }}>
                  Lux Libris Award ends in {getDaysUntilCompetitionEnd()} days!
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: `${currentTheme.textPrimary}CC`
                }}>
                  March 31st • Then voting begins for the Luminous Champion!
                </div>
              </div>
            </div>
          </div>

          {/* MOVED TO TOP: Progress Wheels with ANIMATIONS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ animation: 'slideInLeft 0.8s ease-out 0.4s both' }}>
              <ProgressWheel
                title="This Year"
                current={dashboardData.booksReadThisYear}
                goal={dashboardData.currentYearGoal}
                color={currentTheme.primary}
                emoji="📖"
              />
            </div>
            <div style={{ animation: 'slideInRight 0.8s ease-out 0.5s both' }}>
              <ProgressWheel
                title="Lifetime Journey"
                current={dashboardData.totalBooksRead}
                goal={dashboardData.lifetimeGoal}
                color={currentTheme.accent}
                emoji="🏆"
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '0 20px 20px' }}>
          
          {/* UPDATED: Action Items - Expandable with ANIMATIONS */}
          {actionItems.length > 0 && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${currentTheme.primary}30`,
              animation: 'slideInUp 0.8s ease-out 0.6s both'
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
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ✨ What should I do next?
                </h3>
                {actionItems.length > 1 && (
                  <button
                    onClick={() => setShowAllActionItems(!showAllActionItems)}
                    style={{
                      backgroundColor: `${currentTheme.primary}20`,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: currentTheme.textPrimary,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {showAllActionItems ? 'Show Less' : `+${actionItems.length - 1} More`}
                  </button>
                )}
              </div>
              
              {/* Show first action item or all if expanded with staggered animations */}
              {(showAllActionItems ? actionItems : actionItems.slice(0, 1)).map((action, index) => (
                <div 
                  key={index}
                  onClick={() => handleActionItemClick(action)}
                  style={{
                    backgroundColor: action.priority === 1 ? `${currentTheme.primary}20` : `${currentTheme.accent}10`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: index < (showAllActionItems ? actionItems.length - 1 : 0) ? '8px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: action.priority === 1 ? `2px solid ${currentTheme.primary}` : 'none',
                    transition: 'all 0.3s ease',
                    animation: `slideInUp 0.6s ease-out ${0.8 + (index * 0.1)}s both`
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = action.priority === 1 ? 'scale(1.03)' : 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ 
                    fontSize: '20px',
                    animation: 'pulseGlow 2s ease-in-out infinite'
                  }}>{action.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary
                    }}>
                      {action.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textSecondary
                    }}>
                      {action.subtitle}
                    </div>
                  </div>
                  <span style={{ 
                    color: currentTheme.primary, 
                    fontSize: '16px'
                  }}>→</span>
                </div>
              ))}
            </div>
          )}

          {/* FIXED: Currently Reading with separate button - inline calculation */}
{(() => {
  // Calculate currently reading books inline
  const currentlyReadingBooks = (studentData.bookshelf || []).filter(book => {
    const state = getBookState(book);
    const nominee = nominees.find(n => n.id === book.bookId);
    const total = book.format === 'audiobook' ? 
      (nominee?.totalMinutes || book.totalMinutes) : 
      (nominee?.pages || nominee?.pageCount || book.totalPages);
    
    return state === 'in_progress' && 
           book.currentProgress > 0 && 
           book.currentProgress < total && 
           !book.completed;
  }).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

  const currentlyReading = currentlyReadingBooks[0]; // Get the most recent
  
  // Get available books (not in bookshelf)
  const inBookshelf = (studentData.bookshelf || []).map(book => book.bookId);
  const availableBooks = nominees.filter(book => !inBookshelf.includes(book.id));
  const completedBooks = (studentData.bookshelf || []).filter(book => book.completed);
  
  // If no book in progress, show empty states
  if (!currentlyReading) {
    if (availableBooks.length === 0) {
      // All books complete
      return (
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          border: `2px solid ${currentTheme.primary}30`,
          animation: 'slideInUp 0.8s ease-out 1.2s both'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: currentTheme.textPrimary,
            margin: '0 0 8px 0'
          }}>
            Incredible Achievement!
          </h3>
          <p style={{
            fontSize: '14px',
            color: currentTheme.textSecondary,
            margin: '0 0 16px 0'
          }}>
            You&apos;ve completed all {completedBooks.length} books! 🏆
          </p>
          <button
            onClick={() => router.push('/student-stats')}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Your Stats
          </button>
        </div>
      );
    } else {
      // Has available books but none in progress
      return (
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          border: `2px solid ${currentTheme.primary}30`,
          animation: 'slideInUp 0.8s ease-out 1.2s both'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              margin: 0
            }}>
              Ready for Your Next Adventure?
            </h3>
          </div>
          <p style={{
            fontSize: '14px',
            color: currentTheme.textSecondary,
            margin: '0 0 16px 0'
          }}>
            You have {availableBooks.length} more books waiting!
          </p>
          <button
            onClick={() => router.push('/student-nominees')}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Browse Books
          </button>
        </div>
      );
    }
  }

  // Show currently reading book with separate button
  const nominee = nominees.find(n => n.id === currentlyReading.bookId);
  const total = currentlyReading.format === 'audiobook' ? 
    (nominee?.totalMinutes || currentlyReading.totalMinutes) : 
    (nominee?.pages || nominee?.pageCount || currentlyReading.totalPages);
  const progressPercent = total > 0 ? Math.round((currentlyReading.currentProgress / total) * 100) : 0;

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      border: `1px solid ${currentTheme.primary}30`,
      animation: 'slideInUp 0.8s ease-out 1.2s both'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>📖</span>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: currentTheme.textPrimary,
          margin: 0
        }}>
          Currently Reading
        </h3>
      </div>
      
      {/* NON-CLICKABLE book display */}
      <div style={{
        width: '100%',
        backgroundColor: `${currentTheme.primary}20`,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '60px',
          backgroundColor: `${currentTheme.primary}50`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          overflow: 'hidden'
        }}>
          {nominee?.coverImageUrl ? (
            <img 
              src={nominee.coverImageUrl} 
              alt={nominee.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '4px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
          ) : (
            <span style={{ fontSize: '20px' }}>📚</span>
          )}
          <span style={{ 
            fontSize: '20px',
            display: 'none'
          }}>📚</span>
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            margin: '0 0 4px 0'
          }}>
            {nominee?.title || 'Unknown Book'}
          </p>
          <p style={{
            fontSize: '12px',
            color: currentTheme.textSecondary,
            margin: 0
          }}>
            {progressPercent}% complete
          </p>
        </div>
        <div style={{
          fontSize: '24px',
          color: currentTheme.primary,
          opacity: 0.6
        }}>
          📖
        </div>
      </div>
      
      {/* SEPARATE BUTTON */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔗 Continue Reading clicked for:', currentlyReading.bookId);
          router.push('/student-bookshelf');
        }}
        style={{
          width: '100%',
          backgroundColor: currentTheme.primary,
          color: currentTheme.textPrimary,
          border: 'none',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Continue Reading
      </button>
    </div>
  );
})()}

          {/* UPDATED: Smart Book Recommendations with ANIMATIONS */}
          {smartRecommendations.length > 0 && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              animation: 'slideInUp 0.8s ease-out 1.0s both'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎯</span>
                Recommended for You
              </h3>
              
              {smartRecommendations.map((rec, recIndex) => (
                <div key={recIndex} style={{ 
                  marginBottom: recIndex < smartRecommendations.length - 1 ? '16px' : '0'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    margin: '0 0 4px 0'
                  }}>
                    {rec.title}
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: currentTheme.textSecondary,
                    margin: '0 0 12px 0'
                  }}>
                    {rec.subtitle || rec.message}
                  </p>
                  
                  {rec.books.length > 0 ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      {rec.books.map((book, bookIndex) => (
                        <button
                          key={bookIndex}
                          onClick={() => handleRecommendationClick(book)}
                          style={{
                            backgroundColor: currentTheme.surface,
                            border: `2px solid ${currentTheme.primary}`,
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'center',
                            maxWidth: '200px',
                            width: '100%'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '120px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: `${currentTheme.primary}10`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px'
                          }}>
                            {book.coverImageUrl ? (
                              <img 
                                src={book.coverImageUrl} 
                                alt={book.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                              />
                            ) : (
                              <span style={{ 
                                fontSize: '36px'
                              }}>📚</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: currentTheme.textPrimary,
                            lineHeight: '1.3',
                            marginBottom: '4px'
                          }}>
                            {book.title}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: currentTheme.textSecondary,
                            fontStyle: 'italic'
                          }}>
                            by {book.authors}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px',
                      color: currentTheme.textPrimary,
                      fontSize: '14px',
                      backgroundColor: `${currentTheme.primary}10`,
                      borderRadius: '12px',
                      border: `2px solid ${currentTheme.primary}30`
                    }}>
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px'
                      }}>🎉</div>
                      {rec.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Achievement Progress with ANIMATIONS */}
          {nextAchievement && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              animation: 'slideInUp 0.8s ease-out 1.2s both'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Next Achievement Goal
              </h3>
              
              <div style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}20)`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary
                  }}>
                    {nextAchievement.reward}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: currentTheme.textSecondary
                  }}>
                    {nextAchievement.booksNeeded} more books
                  </span>
                </div>
                
                <div style={{
                  backgroundColor: `${currentTheme.primary}30`,
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    backgroundColor: currentTheme.primary,
                    height: '100%',
                    width: `${Math.min(nextAchievement.progress, 100)}%`,
                    transition: 'width 2s ease'
                  }} />
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary,
                  marginTop: '4px',
                  textAlign: 'center'
                }}>
                  {dashboardData.booksReadThisYear} of {nextAchievement.books} books complete
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Buttons - Fixed centering */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
            animation: 'slideInUp 0.8s ease-out 1.4s both'
          }}>
            <div style={{ 
              animation: 'slideInLeft 0.6s ease-out 1.5s both',
              flex: '1',
              maxWidth: '200px'
            }}>
              <QuickActionButton
                emoji="🎴"
                label="Browse Books"
                onClick={() => router.push('/student-nominees')}
                theme={currentTheme}
              />
            </div>
            <div style={{ 
              animation: 'slideInRight 0.6s ease-out 1.6s both',
              flex: '1',
              maxWidth: '200px'
            }}>
              <QuickActionButton
                emoji="📂"
                label="My Bookshelf"
                onClick={() => router.push('/student-bookshelf')}
                theme={currentTheme}
              />
            </div>
          </div>

          {/* UPDATED: Reading Habits with SPARKLING saint unlock! */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '100px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            animation: 'slideInUp 0.8s ease-out 1.8s both'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔥 Reading Habits
            </h3>
            
            <div style={{
              background: readingStats.streak >= 7 
                ? 'linear-gradient(135deg, #FF6B35, #F7931E)'
                : `linear-gradient(135deg, ${currentTheme.accent}80, ${currentTheme.primary}80)`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '32px'
              }}>
                {readingStats.streak >= 7 ? '🔥' : '📖'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {readingStats.streak > 0 ? `${readingStats.streak} Day Streak!` : 'Start Your Streak'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: `${currentTheme.textPrimary}CC`
                }}>
                  {readingStats.streak >= 7 
                    ? '🎉 Amazing! Keep the fire burning!' 
                    : 'Read daily to unlock saints!'}
                </div>
              </div>
              <button 
                onClick={() => router.push('/student-healthy-habits')}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: currentTheme.textPrimary,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: 'pulseGlow 2s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
              >
                Start Session
              </button>
            </div>

            {/* Today's Progress + Latest Saint with SPARKLES! */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: latestSaintUnlock ? '1fr 1fr 1fr' : '1fr 1fr',
              gap: '8px'
            }}>
              {/* Today's Minutes - Now Clickable */}
              <button
                onClick={() => router.push('/student-healthy-habits')}
                style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  border: `2px solid ${currentTheme.primary}60`,
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = `${currentTheme.primary}30`;
                  e.currentTarget.style.borderColor = currentTheme.primary;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = `${currentTheme.primary}20`;
                  e.currentTarget.style.borderColor = `${currentTheme.primary}60`;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {readingStats.todayMinutes}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: currentTheme.textSecondary
                }}>
                  minutes today
                </div>
              </button>
              
              {/* Saints Count - Clickable */}
              <button
                onClick={() => router.push('/student-saints')}
                style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  border: `2px solid ${currentTheme.primary}60`,
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = `${currentTheme.primary}30`;
                  e.currentTarget.style.borderColor = currentTheme.primary;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = `${currentTheme.primary}20`;
                  e.currentTarget.style.borderColor = `${currentTheme.primary}60`;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {dashboardData.saintCount}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: currentTheme.textSecondary
                }}>
                  saints unlocked
                </div>
              </button>
              
              {/* ✨🌟 SPARKLING SAINT UNLOCK! 🌟✨ */}
              {latestSaintUnlock && (
                <button
                  onClick={() => router.push('/student-saints')}
                  style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    border: `2px solid ${currentTheme.primary}60`,
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = `${currentTheme.primary}30`;
                    e.currentTarget.style.borderColor = currentTheme.primary;
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = `${currentTheme.primary}20`;
                    e.currentTarget.style.borderColor = `${currentTheme.primary}60`;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* SPARKLING MAGIC! ✨⭐ */}
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    fontSize: '12px',
                    animation: 'sparkle 1.5s ease-in-out infinite',
                    pointerEvents: 'none'
                  }}>
                    ✨
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    fontSize: '8px',
                    animation: 'sparkle 1.5s ease-in-out infinite 0.5s',
                    pointerEvents: 'none'
                  }}>
                    ⭐
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '2px',
                    fontSize: '6px',
                    animation: 'sparkle 1.5s ease-in-out infinite 1s',
                    pointerEvents: 'none'
                  }}>
                    ✨
                  </div>
                  
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary,
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '20px'
                  }}>
                    <img 
                      src={latestSaintUnlock.icon_asset?.replace('assets/', '/') || `/saints/${latestSaintUnlock.id}.png`}
                      alt={latestSaintUnlock.name}
                      style={{
                        width: '20px',
                        height: '20px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <span style={{ 
                      fontSize: '16px',
                      display: 'none'
                    }}>
                      {latestSaintUnlock.name.replace('St. ', '').replace('Our Lady of ', '').replace('Bl. ', '').split(' ')[0]}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: currentTheme.textSecondary
                  }}>
                    recently unlocked
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation - KEEP AS-IS */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: currentTheme.surface,
          borderTop: `1px solid ${currentTheme.primary}20`,
          padding: '12px 0 8px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {[
            { icon: '▦', label: 'Dashboard', active: true, route: 'Dashboard' },
            { icon: '▢', label: 'Nominees', active: false, route: 'Nominees' },
            { icon: '▥', label: 'Bookshelf', active: false, route: 'Bookshelf' },
            { icon: '◉', label: 'Habits', active: false, route: 'Habits' },
            { icon: '♔', label: 'Saints', active: false, route: 'Saints' },
            { icon: '▲', label: 'Stats', active: false, route: 'Stats' }
          ].map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab.route)}
              style={{
                background: tab.active 
                  ? `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}25)`
                  : 'none',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 4px 8px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: tab.active ? currentTheme.primary : currentTheme.textSecondary,
                transition: 'all 0.2s ease',
                margin: '0 2px'
              }}
            >
              <span style={{ 
                fontSize: '20px',
                fontWeight: tab.active ? '600' : '400',
                filter: tab.active ? 'none' : 'opacity(0.7)'
              }}>
                {tab.icon}
              </span>
              <span style={{ 
                fontSize: '9px', 
                fontWeight: tab.active ? '600' : '500',
                letterSpacing: '0.1px'
              }}>
                {tab.label}
              </span>
              {tab.active && (
                <div style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: currentTheme.primary,
                  borderRadius: '50%',
                  marginTop: '1px'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Grade Update Modal */}
        {showGradeUpdate && studentData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
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
              padding: '30px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: `2px solid ${currentTheme.primary}`
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎒</div>
              
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                marginBottom: '10px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Welcome Back, {studentData.firstName}!
              </h2>
              
              <p style={{
                fontSize: '16px',
                color: currentTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                It&apos;s a new school year! What grade are you in now?
              </p>
              
              <div style={{
                background: `${currentTheme.primary}20`,
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '20px',
                border: `1px solid ${currentTheme.primary}40`
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: currentTheme.textPrimary,
                  margin: '0 0 10px 0',
                  fontWeight: '600'
                }}>
                  Last year: Grade {studentData.grade}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: currentTheme.textSecondary,
                  margin: 0
                }}>
                  Suggested: Grade {studentData.suggestedGrade}
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '10px'
                }}>
                  Select your current grade:
                </label>
                
                <select
                  value={selectedGrade || ''}
                  onChange={(e) => setSelectedGrade(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${currentTheme.primary}`,
                    fontSize: '16px',
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.textPrimary
                  }}
                >
                  <option value="">Choose your grade...</option>
                  {[4, 5, 6, 7, 8].map(grade => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                      {grade === studentData.suggestedGrade && ' (Suggested)'}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleGradeUpdate}
                disabled={!selectedGrade || isUpdatingGrade}
                style={{
                  width: '100%',
                  backgroundColor: selectedGrade ? currentTheme.primary : '#E0E0E0',
                  color: selectedGrade ? currentTheme.textPrimary : '#999',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: selectedGrade ? 'pointer' : 'not-allowed',
                  marginBottom: '10px'
                }}
              >
                {isUpdatingGrade ? '⏳ Updating...' : '🚀 Start New School Year!'}
              </button>
              
              <p style={{
                fontSize: '12px',
                color: currentTheme.textSecondary,
                margin: 0,
                fontStyle: 'italic'
              }}>
                Your reading progress and saints will be preserved!
              </p>
            </div>
          </div>
        )}

        {/* Coming Soon Message */}
        {showComingSoon && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: currentTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showComingSoon}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
          
          @keyframes slideInUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInLeft {
            from { 
              opacity: 0; 
              transform: translateX(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
            }
          }
          
          @keyframes slideInRight {
            from { 
              opacity: 0; 
              transform: translateX(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
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
              filter: brightness(1);
            }
            50% {
              opacity: 0.8;
              filter: brightness(1.2);
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
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </>
  );
}

// Progress Wheel Component - UPDATED with proper goals
function ProgressWheel({ title, current, goal, color, emoji }) {
  const progress = goal > 0 ? Math.min(current / goal, 1.0) : 0;
  const circumference = 2 * Math.PI * 35;
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <p style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#556B7A',
        margin: '0 0 16px 0'
      }}>
        {title}
      </p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={`${color}30`}
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dasharray 2s ease-in-out'
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '16px', 
            marginBottom: '2px'
          }}>
            {emoji}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#223848'
          }}>
            {current}
          </div>
        </div>
      </div>
      
      <p style={{
        fontSize: '12px',
        color: '#556B7A',
        margin: '8px 0 0 0'
      }}>
        of {goal}
      </p>
    </div>
  );
}

// Quick Action Button Component - ENHANCED with full width
function QuickActionButton({ emoji, label, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.primary}30`,
        borderRadius: '12px',
        padding: '16px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        transform: 'translateY(0)',
        width: '100%'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = `${theme.primary}20`;
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
        e.currentTarget.style.borderColor = theme.primary;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = theme.surface;
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = `${theme.primary}30`;
      }}
    >
      <span style={{ 
        fontSize: '24px',
        transition: 'transform 0.3s ease'
      }}>{emoji}</span>
      <span style={{
        fontSize: '12px',
        fontWeight: '600',
        color: theme.textPrimary
      }}>
        {label}
      </span>
    </button>
  );
}
// pages/student-dashboard.js - UPDATED with hamburger menu
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
  const [gradeStats, setGradeStats] = useState(null);
  const [schoolStats, setSchoolStats] = useState(null);
  const [achievementTiers, setAchievementTiers] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [todayReadingStats, setTodayReadingStats] = useState(null);
  const [nextAchievement, setNextAchievement] = useState(null);
  const [smartRecommendations, setSmartRecommendations] = useState([]);

  // Real dashboard data from Firebase
  const [dashboardData, setDashboardData] = useState({
    booksReadThisYear: 0,
    totalBooksRead: 0,
    saintCount: 0,
    readingStreak: 0,
    currentlyReading: null,
    recentlyCompleted: []
  });

  // 🍔 NAVIGATION MENU ITEMS (Dashboard page is current, but we don't hide it since we have bottom nav too)
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂', current: true },
    { name: 'Nominees', path: '/student-nominees', icon: '□' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' }
    // Note: Settings removed from hamburger menu since Dashboard has dedicated settings button
  ], []);

  // 🍔 NOTIFICATION FUNCTIONS
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

  // INTEGRATED HELPER FUNCTIONS (keeping all existing functions...)
  
  // Get aggregated grade stats for social competition
  const getGradeStats = async (entityId, schoolId, grade) => {
    try {
      console.log(`📊 Loading grade ${grade} stats for school ${schoolId}`);
      
      const studentsRef = collection(db, 'entities', entityId, 'schools', schoolId, 'students');
      const gradeQuery = query(studentsRef, where('grade', '==', grade));
      const gradeSnapshot = await getDocs(gradeQuery);
      
      let totalBooksSubmitted = 0;
      let studentsWhoCompletedFirst5 = 0;
      let totalStudents = gradeSnapshot.size;
      
      gradeSnapshot.forEach(doc => {
        const studentData = doc.data();
        const booksThisYear = studentData.booksSubmittedThisYear || 0;
        totalBooksSubmitted += booksThisYear;
        
        if (booksThisYear >= 5) {
          studentsWhoCompletedFirst5++;
        }
      });
      
      const averageBooksPerStudent = totalStudents > 0 
        ? Math.round((totalBooksSubmitted / totalStudents) * 10) / 10
        : 0;
      
      return {
        grade,
        totalStudents,
        totalBooksSubmitted,
        studentsWhoCompletedFirst5,
        averageBooksPerStudent
      };
    } catch (error) {
      console.error('❌ Error loading grade stats:', error);
      return null;
    }
  };

  // Get aggregated school stats for school pride
  const getSchoolStats = async (entityId, schoolId) => {
    try {
      console.log(`🏫 Loading school stats for ${schoolId}`);
      
      const studentsRef = collection(db, 'entities', entityId, 'schools', schoolId, 'students');
      const studentsSnapshot = await getDocs(studentsRef);
      
      let totalBooksSubmitted = 0;
      let totalStudents = studentsSnapshot.size;
      let gradeStats = {};
      
      studentsSnapshot.forEach(doc => {
        const studentData = doc.data();
        const booksThisYear = studentData.booksSubmittedThisYear || 0;
        const grade = studentData.grade;
        
        totalBooksSubmitted += booksThisYear;
        
        if (!gradeStats[grade]) {
          gradeStats[grade] = { books: 0, students: 0 };
        }
        gradeStats[grade].books += booksThisYear;
        gradeStats[grade].students++;
      });
      
      // Find top performing grade
      let topGrade = { grade: 'N/A', books: 0 };
      for (const grade in gradeStats) {
        if (gradeStats[grade].books > topGrade.books) {
          topGrade = { grade: grade, books: gradeStats[grade].books };
        }
      }
      
      return {
        totalStudents,
        totalBooksSubmitted,
        topGrade,
        gradeBreakdown: gradeStats
      };
    } catch (error) {
      console.error('❌ Error loading school stats:', error);
      return null;
    }
  };

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

  // Generate smart action items based on bookshelf status
  const generateActionItems = (bookshelf = [], nominees = []) => {
    const actions = [];
    const now = new Date();
    
    if (!Array.isArray(bookshelf)) {
      console.warn('📚 Bookshelf is not an array, returning empty actions');
      return actions;
    }
    
    // 1. Books ready to submit (highest priority)
    const readyToSubmit = bookshelf.filter(book => 
      book.status === 'completed' && !book.submitted
    );
    
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
    
    // 2. Quizzes available to take
    const quizReady = bookshelf.filter(book => 
      book.status === 'pending_parent_quiz_unlock' || 
      book.status === 'quiz_available'
    );
    
    quizReady.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      actions.push({
        type: 'take_quiz',
        bookId: book.bookId,
        priority: 1,
        emoji: '📝',
        title: `Take quiz for "${nominee?.title || 'Unknown Book'}"`,
        subtitle: 'Quiz unlocked - complete it to submit your book!'
      });
    });
    
    // 3. Books in progress (medium priority)
    const inProgress = bookshelf.filter(book => 
      book.status === 'in_progress' && book.currentProgress > 0
    );
    
    inProgress.slice(0, 2).forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      const progressPercent = Math.round((book.currentProgress / (book.totalPages || book.totalMinutes || 1)) * 100);
      
      actions.push({
        type: 'continue_reading',
        bookId: book.bookId,
        priority: 2,
        emoji: '📖',
        title: `Continue reading "${nominee?.title || 'Unknown Book'}"`,
        subtitle: `${progressPercent}% complete - keep going!`
      });
    });
    
    // 4. Quiz failures with cooldown
    const quizCooldown = bookshelf.filter(book => 
      book.status === 'quiz_failed' || book.status === 'quiz_cooldown'
    );
    
    quizCooldown.forEach(book => {
      const nominee = nominees.find(n => n.id === book.bookId);
      const failedAt = book.failedAt ? new Date(book.failedAt) : now;
      const cooldownEnd = new Date(failedAt.getTime() + 24 * 60 * 60 * 1000);
      const hoursRemaining = Math.max(0, Math.ceil((cooldownEnd - now) / (1000 * 60 * 60)));
      
      if (hoursRemaining > 0) {
        actions.push({
          type: 'quiz_cooldown',
          bookId: book.bookId,
          priority: 3,
          emoji: '⏰',
          title: `Quiz available in ${hoursRemaining}h`,
          subtitle: `"${nominee?.title || 'Unknown Book'}" - Try again soon`
        });
      } else {
        actions.push({
          type: 'retry_quiz',
          bookId: book.bookId,
          priority: 1,
          emoji: '🔄',
          title: `Retry quiz for "${nominee?.title || 'Unknown Book'}"`,
          subtitle: 'Cooldown complete - you can try again!'
        });
      }
    });
    
    // 5. Waiting for approvals
    const pendingAdmin = bookshelf.filter(book => 
      book.status === 'pending_admin_approval'
    );
    
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
    
    const pendingParent = bookshelf.filter(book => 
      book.status === 'pending_parent_approval'
    );
    
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
    
    console.log(`✨ Generated ${actions.length} action items`);
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

  // Calculate days until competition ends (March 31st, 2025)
  const getDaysUntilCompetitionEnd = () => {
    const competitionEnd = new Date('2025-03-31T23:59:59');
    const now = new Date();
    const timeDiff = competitionEnd.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  };

  // Get today's reading session stats
  const getTodayReadingStats = async (entityId, schoolId, studentId) => {
    try {
      // TODO: Integrate with actual reading sessions collection
      return {
        sessionsCompleted: 1,
        minutesToday: 25,
        goalMinutes: 30,
        streakDays: 5
      };
    } catch (error) {
      console.error('❌ Error loading today reading stats:', error);
      return {
        sessionsCompleted: 0,
        minutesToday: 0,
        goalMinutes: 30,
        streakDays: 0
      };
    }
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
        
        // Load grade stats
        const gradeData = await getGradeStats(
          firebaseStudentData.entityId,
          firebaseStudentData.schoolId,
          firebaseStudentData.grade
        );
        setGradeStats(gradeData);
        
        // Load school stats
        const schoolData = await getSchoolStats(
          firebaseStudentData.entityId,
          firebaseStudentData.schoolId
        );
        setSchoolStats(schoolData);
        
        // Generate action items
        const actions = generateActionItems(
          firebaseStudentData.bookshelf || [],
          schoolNominees
        );
        setActionItems(actions);
        
        // Load today's reading stats
        const todayStats = await getTodayReadingStats(
          firebaseStudentData.entityId,
          firebaseStudentData.schoolId,
          firebaseStudentData.id
        );
        setTodayReadingStats(todayStats);
        
        console.log('🎯 All dashboard data loaded successfully!');
      }
      
      // Calculate dashboard data
      const bookshelf = firebaseStudentData.bookshelf || [];
      const completedBooks = bookshelf.filter(book => book.completed);
      const inProgressBooks = bookshelf.filter(book => !book.completed && book.currentProgress > 0);
      
      setDashboardData({
        booksReadThisYear: firebaseStudentData.booksSubmittedThisYear || 0,
        totalBooksRead: firebaseStudentData.lifetimeBooksSubmitted || 0,
        saintCount: firebaseStudentData.saintUnlocks?.length || 0,
        readingStreak: firebaseStudentData.readingStreaks?.current || 0,
        currentlyReading: inProgressBooks.length > 0 ? inProgressBooks[0] : null,
        recentlyCompleted: completedBooks.slice(-3).reverse()
      });

    } catch (error) {
      console.error('❌ Error loading enhanced dashboard:', error);
      router.push('/student-onboarding');
    }
    
    setIsLoading(false);
  };

  // Generate smart book recommendations
  const generateSmartRecommendations = (nominees, studentData) => {
    if (!nominees.length) return [];
    
    const bookshelf = studentData.bookshelf || [];
    const completedBooks = bookshelf.filter(book => book.completed);
    const inBookshelf = bookshelf.map(book => book.bookId);
    
    // Get available books (not in bookshelf)
    const availableBooks = nominees.filter(book => !inBookshelf.includes(book.id));
    
    if (availableBooks.length === 0) return [];
    
    // Smart recommendation logic
    const recommendations = [];
    
    // 1. If they've completed books, recommend similar categories
    if (completedBooks.length > 0) {
      const completedCategories = completedBooks.map(book => {
        const nominee = nominees.find(n => n.id === book.bookId);
        return nominee?.displayCategory || nominee?.internalCategory;
      }).filter(Boolean);
      
      // Find books in same categories
      const categoryMatches = availableBooks.filter(book => 
        completedCategories.some(cat => 
          book.displayCategory?.includes(cat) || book.internalCategory?.includes(cat)
        )
      );
      
      if (categoryMatches.length > 0) {
        recommendations.push({
          type: 'similar',
          title: 'More like what you\'ve read',
          books: categoryMatches.slice(0, 3)
        });
      }
    }
    
    // 2. Grade-appropriate recommendations
    const gradeBooks = availableBooks.filter(book => {
      const gradeLevels = book.gradeLevels || '';
      return gradeLevels.includes(studentData.grade?.toString());
    });
    
    if (gradeBooks.length > 0) {
      recommendations.push({
        type: 'grade',
        title: `Perfect for ${studentData.grade}th graders`,
        books: gradeBooks.slice(0, 3)
      });
    }
    
    // 3. Quick reads (shorter books)
    const quickReads = availableBooks.filter(book => {
      const pages = book.pages || book.pageCount || 0;
      return pages > 0 && pages <= 200;
    }).sort((a, b) => (a.pages || a.pageCount || 0) - (b.pages || b.pageCount || 0));
    
    if (quickReads.length > 0) {
      recommendations.push({
        type: 'quick',
        title: 'Quick victories',
        books: quickReads.slice(0, 3)
      });
    }
    
    // 4. If no specific recommendations, show popular categories
    if (recommendations.length === 0) {
      const categoryOrder = [
        'Chapter Books',
        'Picture Books', 
        'Graphic',
        'Catholic',
        'Classic'
      ];
      
      for (const category of categoryOrder) {
        const categoryBooks = availableBooks.filter(book =>
          book.displayCategory?.includes(category) || book.internalCategory?.includes(category)
        );
        
        if (categoryBooks.length > 0) {
          recommendations.push({
            type: 'category',
            title: `Explore ${category.toLowerCase()}`,
            books: categoryBooks.slice(0, 3)
          });
          break;
        }
      }
    }
    
    return recommendations.slice(0, 2); // Max 2 recommendation sections
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

  const getMotivationalMessage = () => {
    const { booksReadThisYear, readingStreak } = dashboardData;
    const { currentYearGoal } = studentData || {};
    const daysUntilEnd = getDaysUntilCompetitionEnd();

    if (daysUntilEnd <= 7) {
      return '🏆 Final week! Every book counts for the championship!';
    }
    if (booksReadThisYear >= currentYearGoal) {
      return '🎉 Goal conquered! You\'re officially a reading champion!';
    }
    if (booksReadThisYear >= currentYearGoal * 0.9) {
      return '⚡ SO close to your goal! One more book might do it!';
    }
    if (readingStreak >= 14) {
      return '🔥 Two week streak! You\'re absolutely unstoppable!';
    }
    if (readingStreak >= 7) {
      return '🔥 One week streak! The reading force is strong with you!';
    }
    if (actionItems.some(item => item.type === 'ready_submit')) {
      return '🎉 You have books ready to submit! Let\'s celebrate!';
    }
    return '📚 Ready for your next reading adventure?';
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

  const handleActionItemClick = (action) => {
    switch (action.type) {
      case 'ready_submit':
      case 'retry_quiz':
      case 'continue_reading':
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
      default:
        break;
    }
  };

  const getCurrentlyReadingTitle = () => {
    if (!dashboardData.currentlyReading) return null;
    const book = nominees.find(n => n.id === dashboardData.currentlyReading.bookId);
    return book ? book.title : 'Unknown Book';
  };

  const getDaysUntilEnd = getDaysUntilCompetitionEnd();

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
        
        {/* 🍔 UPDATED HEADER WITH HAMBURGER MENU */}
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
          {/* Settings Button - moved to left side */}
<button
  onClick={() => router.push('/student-settings')}
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
  ⚙️
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
  Dashboard
</h1>

{/* 🍔 Hamburger Menu - now alone on the right */}
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
        </div>

        {/* WELCOME SECTION - Fixed spacing */}
<div style={{ padding: '10px 20px 20px' }}>
          {/* Welcome Card with Competition Countdown */}
          <div style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}CC)`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px ${currentTheme.primary}30`,
            marginBottom: '16px'
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
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>🏆</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: currentTheme.textPrimary 
                }}>
                  Lux Libris Challenge ends in {getDaysUntilEnd} days!
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
        </div>

        {/* CONTENT - keeping all existing content sections... */}
        <div style={{ padding: '0 20px 20px' }}>
          
          {/* Action Items - What Should I Do Next? */}
          {actionItems.length > 0 && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${currentTheme.primary}30`
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
                ✨ What should I do next?
              </h3>
              
              {actionItems.slice(0, 3).map((action, index) => (
                <div 
                  key={index}
                  onClick={() => handleActionItemClick(action)}
                  style={{
                    backgroundColor: action.priority === 1 ? `${currentTheme.primary}20` : `${currentTheme.accent}10`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: index < 2 ? '8px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: action.priority === 1 ? `2px solid ${currentTheme.primary}` : 'none',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '20px' }}>{action.emoji}</span>
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
                  <span style={{ color: currentTheme.primary, fontSize: '16px' }}>→</span>
                </div>
              ))}
            </div>
          )}

          {/* Currently Reading - Smart Link to Bookshelf */}
          {dashboardData.currentlyReading && (
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
              border: `1px solid ${currentTheme.primary}30`
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
              
              <button
                onClick={() => router.push(`/student-bookshelf?book=${dashboardData.currentlyReading.bookId}`)}
                style={{
                  width: '100%',
                  backgroundColor: `${currentTheme.primary}20`,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
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
                  fontSize: '20px'
                }}>
                  📚
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    margin: '0 0 4px 0'
                  }}>
                    {getCurrentlyReadingTitle()}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: currentTheme.textSecondary,
                    margin: 0
                  }}>
                    {Math.round((dashboardData.currentlyReading.currentProgress / (dashboardData.currentlyReading.totalPages || dashboardData.currentlyReading.totalMinutes || 1)) * 100)}% complete - Tap to continue
                  </p>
                </div>
                <span style={{ color: currentTheme.primary, fontSize: '16px' }}>→</span>
              </button>
            </div>
          )}

          {/* Smart Book Recommendations */}
          {smartRecommendations.length > 0 && (
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
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 Recommended for You
                </h3>
                <button
                  onClick={() => router.push('/student-nominees')}
                  style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: currentTheme.textPrimary,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View All
                </button>
              </div>
              
              {smartRecommendations.map((rec, recIndex) => (
                <div key={recIndex} style={{ marginBottom: recIndex < smartRecommendations.length - 1 ? '16px' : '0' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    {rec.title}
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px'
                  }}>
                    {rec.books.map((book, bookIndex) => (
                      <button
                        key={bookIndex}
                        onClick={() => router.push('/student-nominees')}
                        style={{
                          flexShrink: 0,
                          width: '60px',
                          height: '90px',
                          borderRadius: '6px',
                          border: `2px solid ${currentTheme.primary}40`,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          backgroundColor: currentTheme.surface,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {book.coverImageUrl ? (
                          <img 
                            src={book.coverImageUrl} 
                            alt={book.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          '📚'
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Achievement Progress */}
          {nextAchievement && (
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
                    transition: 'width 1s ease'
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

          {/* Progress Wheels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <ProgressWheel
              title="This Year"
              current={dashboardData.booksReadThisYear}
              goal={studentData.currentYearGoal}
              color={currentTheme.primary}
              emoji="📖"
            />
            <ProgressWheel
              title="Lifetime Journey"
              current={dashboardData.totalBooksRead}
              goal={100}
              color={currentTheme.accent}
              emoji="🏆"
            />
          </div>

          {/* Grade Competition */}
          {gradeStats && (
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
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🥇 Your {studentData.grade}th Grade Stats
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <StatChip 
                  emoji="📚" 
                  value={gradeStats.totalBooksSubmitted}
                  label="books read"
                  color={currentTheme.primary}
                />
                <StatChip 
                  emoji="👥" 
                  value={`${gradeStats.studentsWhoCompletedFirst5}/${gradeStats.totalStudents}`}
                  label="earned certificates"
                  color={currentTheme.accent}
                />
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.primary}10`,
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: currentTheme.textPrimary,
                  fontWeight: '500'
                }}>
                  🔥 Your grade averages {gradeStats.averageBooksPerStudent} books per student!
                </span>
              </div>
            </div>
          )}

          {/* School Pride */}
          {schoolStats && (
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
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🏫 School Pride
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <StatChip 
                  emoji="📖" 
                  value={schoolStats.totalBooksSubmitted}
                  label="total books"
                  color={currentTheme.secondary}
                />
                <StatChip 
                  emoji="👥" 
                  value={schoolStats.totalStudents}
                  label="students"
                  color={currentTheme.accent}
                />
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: currentTheme.textPrimary,
                  fontWeight: '500'
                }}>
                  🎉 {schoolStats.topGrade.grade}th grade is leading with {schoolStats.topGrade.books} books!
                </span>
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <QuickActionButton
              emoji="🎴"
              label="Browse Books"
              onClick={() => router.push('/student-nominees')}
              theme={currentTheme}
            />
            <QuickActionButton
              emoji="📚"
              label="My Bookshelf"
              onClick={() => router.push('/student-bookshelf')}
              theme={currentTheme}
            />
          </div>

          {/* Reading Streak with Today's Stats */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '100px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
              background: dashboardData.readingStreak >= 7 
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
                fontSize: '32px',
                animation: dashboardData.readingStreak >= 7 ? 'pulse 1.5s infinite' : 'none'
              }}>
                {dashboardData.readingStreak >= 7 ? '🔥' : '📖'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {dashboardData.readingStreak > 0 ? `${dashboardData.readingStreak} Day Streak!` : 'Start Your Streak'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: `${currentTheme.textPrimary}CC`
                }}>
                  {dashboardData.readingStreak >= 7 
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
                  cursor: 'pointer'
                }}
              >
                Start Session
              </button>
            </div>

            {/* Today's Progress */}
            {todayReadingStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {todayReadingStats.sessionsCompleted}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: currentTheme.textSecondary
                  }}>
                    sessions today
                  </div>
                </div>
                <div style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: currentTheme.textPrimary
                  }}>
                    {todayReadingStats.minutesToday}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: currentTheme.textSecondary
                  }}>
                    minutes today
                  </div>
                </div>
              </div>
            )}
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

        {/* Success/Coming Soon Message */}
        {showComingSoon && (
          <div style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: currentTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {showComingSoon}
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
        `}</style>
    </>
  );
}

// Progress Wheel Component - KEEP AS-IS
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
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
            style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '2px' }}>{emoji}</div>
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

// Quick Action Button Component - KEEP AS-IS
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
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = `${theme.primary}20`;
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = theme.surface;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '24px' }}>{emoji}</span>
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

// Stat Chip Component - KEEP AS-IS
function StatChip({ emoji, value, label, color }) {
  return (
    <div style={{
      backgroundColor: `${color}20`,
      borderRadius: '8px',
      padding: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{emoji}</div>
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '2px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '9px',
        color: '#556B7A'
      }}>
        {label}
      </div>
    </div>
  );
}
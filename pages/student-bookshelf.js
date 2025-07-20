import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { usePhaseAccess } from '../hooks/usePhaseAccess';
import { getStudentDataEntities, getSchoolNomineesEntities, updateStudentDataEntities, getCurrentAcademicYear } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getQuizByBookId } from '../book-quizzes-manager';
import Head from 'next/head';

export default function StudentBookshelf() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [tempRating, setTempRating] = useState(0);
  const [tempNotes, setTempNotes] = useState('');
  const [textareaHeight, setTextareaHeight] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  
  // Phase access control
  const { hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess();
  
  // 🍔 HAMBURGER MENU STATE VARIABLES
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationProcessing, setNotificationProcessing] = useState(false);
  
  // Separate states for each screen
  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
  const [showParentPermission, setShowParentPermission] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [parentCode, setParentCode] = useState('');
  
  // Quiz timer states
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  // 🍔 NAVIGATION MENU ITEMS (Bookshelf page is current) - UPDATED with phase locking
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { 
      name: 'Nominees', 
      path: '/student-nominees', 
      icon: '□',
      locked: !hasAccess('nomineesBrowsing'),
      lockReason: 'Nominees are locked during voting and results periods'
    },
    { 
      name: 'Bookshelf', 
      path: '/student-bookshelf', 
      icon: '⚏', 
      current: true,
      locked: !hasAccess('bookshelfViewing'),
      lockReason: 'Bookshelf is locked during results and teacher selection periods'
    },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], [hasAccess]); // Add hasAccess as dependency

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
          body: 'You\'ll now get notified about book approvals and quiz unlocks!',
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

  // 📚 BOOKSHELF-SPECIFIC NOTIFICATIONS
  const sendTeacherApprovalNotification = useCallback((bookTitle) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    try {
      new Notification('🎉 Book Approved!', {
        body: `Your submission for "${bookTitle}" has been approved by your teacher!`,
        icon: '/images/lux_libris_logo.png',
        badge: '/images/lux_libris_logo.png',
        tag: 'teacher-approval',
        requireInteraction: true,
        silent: false
      });
    } catch (error) {
      console.log('Teacher approval notification failed:', error);
    }
  }, [notificationsEnabled]);

  const sendQuizUnlockNotification = useCallback((bookTitle) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    try {
      new Notification('🔓 Quiz Unlocked!', {
        body: `Your parent has unlocked the quiz for "${bookTitle}". You can take it now!`,
        icon: '/images/lux_libris_logo.png',
        badge: '/images/lux_libris_logo.png',
        tag: 'quiz-unlock',
        requireInteraction: true,
        silent: false
      });
    } catch (error) {
      console.log('Quiz unlock notification failed:', error);
    }
  }, [notificationsEnabled]);

  const sendRevisionRequestNotification = useCallback((bookTitle) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    try {
      new Notification('📝 Revisions Requested', {
        body: `Your teacher has provided feedback on "${bookTitle}". Check your bookshelf to see what to revise!`,
        icon: '/images/lux_libris_logo.png',
        badge: '/images/lux_libris_logo.png',
        tag: 'revision-request',
        requireInteraction: true,
        silent: false
      });
    } catch (error) {
      console.log('Revision request notification failed:', error);
    }
  }, [notificationsEnabled]);

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

  // Quiz timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setTimerActive(false);
            handleQuizComplete(quizAnswers);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, quizAnswers]);

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

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // UPDATED: Book state management functions with revision handling
  const getBookState = (book) => {
    const now = new Date();
    
    // Check if completed
    if (book.completed && book.status === 'completed') {
      return 'completed';
    }
    
    // Check for pending states
    if (book.status === 'pending_approval') {
      return 'pending_admin_approval';
    }
    
    if (book.status === 'pending_parent_quiz_unlock') {
      return 'pending_parent_quiz_unlock';
    }
    
    // NEW: Check for revision requested with cooldown
    if (book.status === 'revision_requested' && book.revisionRequestedAt) {
      const revisionTime = book.revisionRequestedAt?.toDate ? book.revisionRequestedAt.toDate() : new Date(book.revisionRequestedAt);
      const cooldownEnd = new Date(revisionTime.getTime() + 24 * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        return 'revision_cooldown';
      } else {
        // Cooldown expired, student can resubmit
        return 'revision_ready';
      }
    }
    
    // Check for failed quiz with cooldown
    if (book.status === 'quiz_failed' && book.failedAt) {
      const failedTime = book.failedAt?.toDate ? book.failedAt.toDate() : new Date(book.failedAt);
      const cooldownEnd = new Date(failedTime.getTime() + 24 * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        return 'quiz_cooldown';
      }
    }
    
    // Check for admin rejection with cooldown
    if (book.status === 'admin_rejected' && book.rejectedAt) {
      const rejectedTime = book.rejectedAt?.toDate ? book.rejectedAt.toDate() : new Date(book.rejectedAt);
      const cooldownEnd = new Date(rejectedTime.getTime() + 24 * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        return 'admin_cooldown';
      }
    }
    
    return 'in_progress';
  };

  const getBookStateMessage = (book) => {
    const state = getBookState(book);
    const now = new Date();
    
    switch (state) {
      case 'completed':
        return { 
          message: book.teacherNotes 
            ? `🎉 Approved! ${book.teacherNotes}` 
            : '🎉 Book completed!', 
          color: '#4CAF50' 
        };
      
      case 'pending_admin_approval':
        return { message: '⏳ Waiting for teacher approval', color: '#FF9800' };
      
      case 'pending_parent_quiz_unlock':
        return { message: '🔒 Waiting for parent to unlock quiz', color: '#2196F3' };
      
      case 'revision_cooldown':
        if (book.revisionRequestedAt) {
          const revisionTime = book.revisionRequestedAt?.toDate ? book.revisionRequestedAt.toDate() : new Date(book.revisionRequestedAt);
          const cooldownEnd = new Date(revisionTime.getTime() + 24 * 60 * 60 * 1000);
          const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
          const baseMessage = `📝 Revisions requested - try again in ${hoursLeft} hours`;
          return { 
            message: book.teacherNotes ? `${baseMessage}: ${book.teacherNotes}` : baseMessage, 
            color: '#FF9800' 
          };
        }
        break;
      
      case 'revision_ready':
        const baseMessage = '✏️ Ready to resubmit - revisions requested';
        return { 
          message: book.teacherNotes ? `${baseMessage}: ${book.teacherNotes}` : baseMessage, 
          color: '#2196F3' 
        };
      
      case 'quiz_cooldown':
        if (book.failedAt) {
          const failedTime = book.failedAt?.toDate ? book.failedAt.toDate() : new Date(book.failedAt);
          const cooldownEnd = new Date(failedTime.getTime() + 24 * 60 * 60 * 1000);
          const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
          return { message: `❌ Quiz failed - try again in ${hoursLeft} hours`, color: '#F44336' };
        }
        break;
      
      case 'admin_cooldown':
        if (book.rejectedAt) {
          const rejectedTime = book.rejectedAt?.toDate ? book.rejectedAt.toDate() : new Date(book.rejectedAt);
          const cooldownEnd = new Date(rejectedTime.getTime() + 24 * 60 * 60 * 1000);
          const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
          return { message: `⏳ Resubmit in ${hoursLeft} hours`, color: '#FF5722' };
        }
        break;
      
      default:
        return null;
    }
  };

  const isBookLocked = (book) => {
    const state = getBookState(book);
    return ['pending_admin_approval', 'pending_parent_quiz_unlock', 'quiz_cooldown', 'admin_cooldown', 'revision_cooldown', 'completed'].includes(state);
  };

  const shouldShowReadingButton = (book) => {
    const state = getBookState(book);
    return !['completed'].includes(state);
  };

  const shouldShowRemoveButton = (book) => {
    const state = getBookState(book);
    return !['completed'].includes(state);
  };
useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadBookshelfData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user]);

  // NEW: Handle return from timer with progress update
  useEffect(() => {
    const handleTimerReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const updateProgressId = urlParams.get('updateProgress');
      const bookTitle = urlParams.get('title');
      
      if (updateProgressId && bookTitle && studentData) {
        // Find the book in the bookshelf
        const bookToUpdate = studentData.bookshelf.find(book => book.bookId === updateProgressId);
        if (bookToUpdate) {
          // Auto-open the book modal for progress update
          openBookModal(bookToUpdate);
          setShowSuccess(`📖 Welcome back! Update your progress for "${decodeURIComponent(bookTitle)}"`);
          setTimeout(() => setShowSuccess(''), 4000);
        }
        
        // Clean up URL parameters
        router.replace('/student-bookshelf', undefined, { shallow: true });
      }
    };

    if (studentData && nominees.length > 0) {
      handleTimerReturn();
    }
  }, [studentData, nominees, router]);

  // Enhanced getBookDetails function - Add this improved version
  const getBookDetails = useCallback((bookId) => {
    if (!nominees || nominees.length === 0) {
      console.warn(`📚 No nominees loaded yet for book ID: ${bookId}`);
      return null;
    }
    
    const bookDetails = nominees.find(book => book.id === bookId);
    if (!bookDetails) {
      console.warn(`📚 Book details not found for ID: ${bookId} in ${nominees.length} nominees`);
    }
    
    return bookDetails;
  }, [nominees]);

  // 🔔 CHECK FOR STATUS CHANGES AND SEND NOTIFICATIONS - FIXED
  useEffect(() => {
    const checkForStatusChanges = () => {
      if (!studentData || !studentData.bookshelf || !notificationsEnabled) return;

      // Get previous bookshelf state from localStorage
      const previousBookshelfKey = `bookshelf_${studentData.id}`;
      const previousBookshelfJson = localStorage.getItem(previousBookshelfKey);
      
      if (previousBookshelfJson) {
        try {
          const previousBookshelf = JSON.parse(previousBookshelfJson);
          
          // Check each book for status changes
          studentData.bookshelf.forEach(currentBook => {
            const previousBook = previousBookshelf.find(book => book.bookId === currentBook.bookId);
            
            if (previousBook) {
              // 🔧 FIX: Get book title with better fallback logic
              let bookTitle = 'Your Book'; // Default fallback
              
              // Try to get book details from nominees
              const bookDetails = getBookDetails(currentBook.bookId);
              if (bookDetails?.title) {
                bookTitle = bookDetails.title;
              } else {
                // Fallback: try to get title from the book object itself or stored data
                bookTitle = currentBook.title || 
                           currentBook.bookTitle || 
                           previousBook.title || 
                           previousBook.bookTitle || 
                           'Your Book';
              }
              
              console.log(`📚 Checking notifications for: ${bookTitle} (ID: ${currentBook.bookId})`);
              
              // Check for teacher approval (pending_approval -> completed)
              if (previousBook.status === 'pending_approval' && currentBook.status === 'completed') {
                console.log(`🎉 Sending approval notification for: ${bookTitle}`);
                sendTeacherApprovalNotification(bookTitle);
              }
              
              // Check for parent quiz unlock (pending_parent_quiz_unlock -> anything else)
              if (previousBook.status === 'pending_parent_quiz_unlock' && 
                  currentBook.status !== 'pending_parent_quiz_unlock') {
                console.log(`🔓 Sending quiz unlock notification for: ${bookTitle}`);
                sendQuizUnlockNotification(bookTitle);
              }
              
              // Check for revision requests (pending_approval -> revision_requested)
              if (previousBook.status === 'pending_approval' && currentBook.status === 'revision_requested') {
                console.log(`📝 Sending revision request notification for: ${bookTitle}`);
                sendRevisionRequestNotification(bookTitle);
              }
            }
          });
        } catch (error) {
          console.log('Error checking status changes:', error);
        }
      }

      // Save current bookshelf state
      localStorage.setItem(previousBookshelfKey, JSON.stringify(studentData.bookshelf));
    };

    // Only check for changes if we have nominees loaded (to ensure getBookDetails works)
    if (nominees.length > 0) {
      checkForStatusChanges();
    }
  }, [studentData, nominees, notificationsEnabled, sendTeacherApprovalNotification, sendQuizUnlockNotification, sendRevisionRequestNotification]);

  const loadBookshelfData = async () => {
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
      
      if (firebaseStudentData.entityId && firebaseStudentData.schoolId) {
        const allNominees = await getSchoolNomineesEntities(
          firebaseStudentData.entityId, 
          firebaseStudentData.schoolId
        );
        
        // Filter by current academic year and active status
        const currentYear = getCurrentAcademicYear();
        console.log(`📚 Filtering nominees for academic year: ${currentYear}`);
        
        const schoolNominees = allNominees.filter(book => {
          // Include books for current year with active status, or legacy books without academic year
          return (book.academicYear === currentYear && book.status === 'active') || 
                 (!book.academicYear && !book.status); // Legacy books
        });
        
        console.log(`📚 Found ${schoolNominees.length} active nominees for ${currentYear}`);
        setNominees(schoolNominees);
      }
        
    } catch (error) {
      console.error('❌ Error loading bookshelf:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  };

const getBookTotal = (bookshelfBook) => {
    const bookDetails = getBookDetails(bookshelfBook.bookId);
    if (!bookDetails) return 0;
    
    if (bookshelfBook.format === 'audiobook') {
      return bookDetails.totalMinutes || 0;
    } else {
      return bookDetails.pages || bookDetails.pageCount || 0;
    }
  };

  const getCategoryColorPalette = (book) => {
    const category = book.displayCategory || book.internalCategory || '';
    
    if (category.includes('Graphic')) {
      return {
        primary: '#FF6B35',
        background: '#FFF4E6',
        surface: '#FFFFFF',
        textPrimary: '#8B2500',
        textSecondary: '#B8491C'
      };
    }
    
    if (category.includes('Chapter Books') || category.includes('Stick With You')) {
      return {
        primary: '#F4D03F',
        background: '#FFFEF7',
        surface: '#FFFFFF',
        textPrimary: '#7D6608',
        textSecondary: '#A57C00'
      };
    }
    
    if (category.includes('Picture')) {
      return {
        primary: '#48CAE4',
        background: '#F0FDFF',
        surface: '#FFFFFF',
        textPrimary: '#023047',
        textSecondary: '#0077B6'
      };
    }
    
    if (category.includes('Classic')) {
      return {
        primary: '#3F51B5',
        background: '#F3F4FF',
        surface: '#FFFFFF',
        textPrimary: '#1A237E',
        textSecondary: '#283593'
      };
    }
    
    if (category.includes('Catholic')) {
      return {
        primary: '#64B5F6',
        background: '#F8FCFF',
        surface: '#FFFFFF',
        textPrimary: '#0D47A1',
        textSecondary: '#1565C0'
      };
    }
    
    if (category.includes('Hidden') || category.includes('Treasure')) {
      return {
        primary: '#D32F2F',
        background: '#FFF8F8',
        surface: '#FFFFFF',
        textPrimary: '#8B1538',
        textSecondary: '#B71C1C'
      };
    }
    
    return {
      primary: currentTheme.primary,
      background: currentTheme.surface,
      surface: currentTheme.surface,
      textPrimary: currentTheme.textPrimary,
      textSecondary: currentTheme.textSecondary
    };
  };

  const getProgressColor = (progress, total) => {
    if (total === 0) return currentTheme.textSecondary;
    const percentage = (progress / total) * 100;
    if (percentage === 0) return '#E0E0E0';
    if (percentage < 25) return '#FF6B6B';
    if (percentage < 50) return '#FFA726';
    if (percentage < 75) return '#FFEE58';
    if (percentage < 100) return '#66BB6A';
    return '#4CAF50';
  };

  const getProgressPercentage = (book) => {
    const total = getBookTotal(book);
    if (total === 0) return 0;
    return Math.round((book.currentProgress / total) * 100);
  };

  const openBookModal = (bookshelfBook) => {
    const bookDetails = getBookDetails(bookshelfBook.bookId);
    if (!bookDetails) return;
    
    setSelectedBook({ ...bookshelfBook, details: bookDetails });
    setTempProgress(bookshelfBook.currentProgress);
    setTempRating(bookshelfBook.rating || 0);
    setTempNotes(bookshelfBook.notes || '');
    setShowBookModal(true);
  };

  const closeBookModal = () => {
    setShowBookModal(false);
    setSelectedBook(null);
  };

  const handleTextareaChange = (e) => {
    const textarea = e.target;
    setTempNotes(textarea.value);
    
    // Reset height to auto to get the scrollHeight
    textarea.style.height = 'auto';
    
    // Set height based on content, with min 50px and max 120px
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 50), 120);
    textarea.style.height = newHeight + 'px';
    setTextareaHeight(newHeight);
  };

  // NEW: Navigate to timer with book context
  const startReadingSession = (book) => {
    const bookDetails = getBookDetails(book.bookId);
    if (!bookDetails) return;
    
    closeBookModal();
    const bookTitle = encodeURIComponent(bookDetails.title);
    router.push(`/student-healthy-habits?bookId=${book.bookId}&bookTitle=${bookTitle}`);
  };

  // UPDATED: Save book progress with revision handling
  const saveBookProgress = async () => {
    if (!selectedBook || !studentData) return;
    
    setIsSaving(true);
    try {
      const total = getBookTotal(selectedBook);
      const isNowCompleted = tempProgress >= total && total > 0;
      const wasAlreadyCompleted = selectedBook.completed;
      
      const currentBookInShelf = studentData.bookshelf.find(book => book.bookId === selectedBook.bookId);
      const currentBookState = currentBookInShelf ? getBookState(currentBookInShelf) : 'in_progress';
      const isCurrentlyLocked = ['pending_admin_approval', 'pending_parent_quiz_unlock', 'quiz_cooldown', 'admin_cooldown', 'revision_cooldown', 'completed'].includes(currentBookState);
      
      // Allow resubmission if in revision_ready state
      const canResubmit = currentBookState === 'revision_ready';
      
      const isOnlyRatingNotesUpdate = tempProgress === selectedBook.currentProgress;
      
      // Allow rating and notes updates even when locked
      if (isOnlyRatingNotesUpdate) {
        console.log('📝 Saving rating/notes update only');
        
        const updatedBookshelf = studentData.bookshelf.map(book => {
          if (book.bookId === selectedBook.bookId) {
            return {
              ...book,
              rating: tempRating,
              notes: tempNotes
            };
          }
          return book;
        });
        
        await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
          bookshelf: updatedBookshelf
        });
        
        setStudentData({ ...studentData, bookshelf: updatedBookshelf });
        setShowSuccess('⭐ Rating and notes saved!');
        
        closeBookModal();
        setTimeout(() => setShowSuccess(''), 3000);
        setIsSaving(false);
        return;
      }
      
      // Block progress changes that would trigger completion when locked (unless ready for resubmission)
      if (isNowCompleted && isCurrentlyLocked && !canResubmit) {
        const stateMessage = getBookStateMessage(currentBookInShelf);
        setShowSuccess(stateMessage ? `🚫 ${stateMessage.message}` : '🚫 Cannot submit while book is locked');
        setTimeout(() => setShowSuccess(''), 3000);
        setIsSaving(false);
        return;
      }
      
      // NEW completion (hitting 100% for first time) OR resubmission after revisions
      if (isNowCompleted && (!wasAlreadyCompleted || canResubmit)) {
        const updatedBookshelf = studentData.bookshelf.map(book => {
          if (book.bookId === selectedBook.bookId) {
            return {
              ...book,
              currentProgress: tempProgress,
              rating: tempRating,
              notes: tempNotes,
              completed: false,  // Keep as incomplete until submission
              // Clear previous revision/rejection data when resubmitting
              ...(canResubmit && {
                status: 'in_progress',
                revisionRequestedAt: null,
                teacherNotes: null
              })
            };
          }
          return book;
        });
        
        await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
          bookshelf: updatedBookshelf
        });
        
        setStudentData({ ...studentData, bookshelf: updatedBookshelf });
        setShowSubmissionPopup(true);
        setIsSaving(false);
        return;
      }
      
      // Regular progress save (not at 100% or already completed)
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedBook.bookId) {
          return {
            ...book,
            currentProgress: tempProgress,
            rating: tempRating,
            notes: tempNotes,
            completed: book.completed
          };
        }
        return book;
      });
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      setShowSuccess('📚 Progress saved!');
      
      closeBookModal();
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      setShowSuccess('❌ Error saving. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    
    setIsSaving(false);
  };

  const deleteBook = async (bookId) => {
    if (!studentData) return;
    
    setIsSaving(true);
    try {
      const updatedBookshelf = studentData.bookshelf.filter(book => book.bookId !== bookId);
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      setShowSuccess('🗑️ Book removed from bookshelf');
      
      closeBookModal();
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error deleting book:', error);
      setShowSuccess('❌ Error removing book. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    
    setIsSaving(false);
  };

  const handleQuizSubmission = async () => {
    if (!selectedBook) return;
    
    setShowSubmissionPopup(false);
    setShowParentPermission(true);
  };

  const handleParentCodeSubmit = async () => {
    if (!selectedBook) {
      setShowSuccess('❌ No book selected.');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const requiredParentCode = studentData.parentQuizCode || '';
      
      if (!parentCode.trim()) {
        setShowSuccess('❌ Please enter parent code.');
        setTimeout(() => setShowSuccess(''), 3000);
        setIsSaving(false);
        return;
      }
      
      if (parentCode.trim() !== requiredParentCode) {
        setShowSuccess('❌ Incorrect parent code. Please try again.');
        setTimeout(() => setShowSuccess(''), 3000);
        setIsSaving(false);
        return;
      }

      // Get current academic year
      const currentYear = getCurrentAcademicYear();
      console.log(`🎯 Looking for quiz for book ${selectedBook.bookId} in academic year ${currentYear}`);

      // NEW SAFE LINKING: Quiz links to book through ID + academic year + status
      const quizData = await getQuizByBookId(selectedBook.bookId, currentYear);

      if (!quizData) {
        console.log('🔄 Quiz not found with academic year linking, trying legacy method...');
        
        // FALLBACK: Legacy quiz lookup for backward compatibility
        const legacyQuizRef = doc(db, 'quizzes', selectedBook.bookId);
        const legacyQuizDoc = await getDoc(legacyQuizRef);
        
        if (!legacyQuizDoc.exists()) {
          setShowSuccess('❌ Quiz not available for this book yet.');
          setTimeout(() => setShowSuccess(''), 3000);
          setIsSaving(false);
          return;
        }
        
        const legacyQuizData = legacyQuizDoc.data();
        console.log('📚 Using legacy quiz format');
        
        // Process legacy quiz
        let allQuestions = [];
        if (legacyQuizData.questions && Array.isArray(legacyQuizData.questions)) {
          allQuestions = legacyQuizData.questions;
        }

        if (allQuestions.length === 0) {
          setShowSuccess('❌ No quiz questions found for this book.');
          setTimeout(() => setShowSuccess(''), 3000);
          setIsSaving(false);
          return;
        }

        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, Math.min(10, allQuestions.length));

        setQuizQuestions(selectedQuestions);
        setCurrentQuestionIndex(0);
        setQuizAnswers([]);
        setTimeRemaining(30 * 60);
        setTimerActive(false);
        setShowParentPermission(false);
        setShowQuizModal(true);
        setIsSaving(false);
        return;
      }

      // NEW: Process academic year-aware quiz
      console.log(`✅ Found quiz for book ${selectedBook.bookId} with academic year linking:`, quizData);
      
      let allQuestions = [];
      if (quizData.questions && Array.isArray(quizData.questions)) {
        allQuestions = quizData.questions;
      }

      if (allQuestions.length === 0) {
        setShowSuccess('❌ No quiz questions found for this book.');
        setTimeout(() => setShowSuccess(''), 3000);
        setIsSaving(false);
        return;
      }

      // Shuffle and select questions
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(10, allQuestions.length));

      setQuizQuestions(selectedQuestions);
      setCurrentQuestionIndex(0);
      setQuizAnswers([]);
      setTimeRemaining(30 * 60);
      setTimerActive(false);
      setShowParentPermission(false);
      setShowQuizModal(true);
      setIsSaving(false);
      
    } catch (error) {
      console.error('❌ Error loading quiz:', error);
      setShowSuccess('❌ Error loading quiz. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
      setIsSaving(false);
    }
  };

  const handleRequestParentApproval = async () => {
    if (!selectedBook || !studentData) return;
    
    setIsSaving(true);
    try {
      // 🔧 FIX: Actually lock the book with pending parent approval status
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedBook.bookId) {
          return {
            ...book,
            currentProgress: tempProgress,
            rating: tempRating,
            notes: tempNotes,
            status: 'pending_parent_quiz_unlock',
            requestedAt: new Date()
          };
        }
        return book;
      });
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      setShowParentPermission(false);
      closeBookModal(); // Close modal so user sees locked state
      setShowSuccess('📧 Parent approval request sent! Book locked until parent approves.');
      setTimeout(() => setShowSuccess(''), 4000);
      
    } catch (error) {
      console.error('❌ Error sending parent request:', error);
      setShowSuccess('❌ Error sending request. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    
    setIsSaving(false);
  };

  const handleBookSubmission = async (submissionType) => {
    if (!selectedBook || !studentData) return;
    
    setIsSaving(true);
    try {
      const submission = {
        bookId: selectedBook.bookId,
        bookTitle: selectedBook.details.title,
        studentId: studentData.id,
        studentName: `${studentData.firstName} ${studentData.lastInitial || ''}`,
        submissionType: submissionType,
        submittedAt: new Date(),
        status: 'pending',
        progress: tempProgress,
        rating: tempRating,
        notes: tempNotes
      };
      
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedBook.bookId) {
          return {
            ...book,
            currentProgress: tempProgress,
            rating: tempRating,
            notes: tempNotes,
            completed: true,
            submissionType: submissionType,
            submittedAt: new Date(),
            status: 'pending_approval'
          };
        }
        return book;
      });
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      setShowSubmissionPopup(false);
      setShowSuccess(`📤 Book submitted for ${submissionType} approval!`);
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error submitting book:', error);
      setShowSuccess('❌ Error submitting book. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    
    setIsSaving(false);
  };

  const handleQuizAnswer = (questionIndex, answer) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answer;
    setQuizAnswers(newAnswers);
    
    if (!timerActive && questionIndex === 0) {
      setTimerActive(true);
      setQuizStartTime(new Date());
    }
  };

  const handleQuizComplete = async (answers) => {
    if (!selectedBook || !quizQuestions.length) return;
    
    setIsSaving(true);
    setTimerActive(false);
    
    try {
      let correctAnswers = 0;
      quizQuestions.forEach((question, index) => {
        if (answers[index] === question.answer) {
          correctAnswers++;
        }
      });
      
      const passed = correctAnswers >= 7;
      
      if (passed) {
        const updatedBookshelf = studentData.bookshelf.map(book => {
          if (book.bookId === selectedBook.bookId) {
            return {
              ...book,
              currentProgress: tempProgress,
              rating: tempRating,
              notes: tempNotes,
              completed: true,
              submissionType: 'quiz',
              submittedAt: new Date(),
              status: 'completed',
              quizScore: `${correctAnswers}/10`
            };
          }
          return book;
        });
        
        await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
          bookshelf: updatedBookshelf,
          booksSubmittedThisYear: (studentData.booksSubmittedThisYear || 0) + 1,
          lifetimeBooksSubmitted: (studentData.lifetimeBooksSubmitted || 0) + 1
        });
        
        setStudentData({ 
          ...studentData, 
          bookshelf: updatedBookshelf,
          booksSubmittedThisYear: (studentData.booksSubmittedThisYear || 0) + 1,
          lifetimeBooksSubmitted: (studentData.lifetimeBooksSubmitted || 0) + 1
        });
        
        setShowQuizModal(false);
        closeBookModal(); // 🔒 COOLDOWN FIX: Close modal so user sees updated state
        setShowSuccess(`🎉 Quiz passed! ${correctAnswers}/10 correct. Book completed!`);
        
      } else {
        // Update book with failed status
        const updatedBookshelf = studentData.bookshelf.map(book => {
          if (book.bookId === selectedBook.bookId) {
            return {
              ...book,
              status: 'quiz_failed',
              failedAt: new Date(),
              lastQuizScore: `${correctAnswers}/10`
            };
          }
          return book;
        });
        
        await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
          bookshelf: updatedBookshelf
        });
        
        setStudentData({ ...studentData, bookshelf: updatedBookshelf });
        setShowQuizModal(false);
        closeBookModal(); // 🔒 COOLDOWN FIX: Close modal so user sees cooldown state
        setShowSuccess(`❌ Quiz failed. ${correctAnswers}/10 correct. Need 7+ to pass. Try again in 24 hours.`);
      }
      
      setParentCode('');
      setQuizQuestions([]);
      setQuizAnswers([]);
      setCurrentQuestionIndex(0);
      
      setTimeout(() => setShowSuccess(''), 4000);
      
    } catch (error) {
      console.error('❌ Error completing quiz:', error);
      setShowSuccess('❌ Error processing quiz. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    
    setIsSaving(false);
  };

  // Show loading first
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your bookshelf...</p>
        </div>
      </div>
    );
  }

  // CHECK FOR LOCKED BOOKSHELF (RESULTS phase)
  if (!hasAccess('bookshelfViewing')) {
    const phaseInfo = getPhaseInfo();
    
    return (
      <>
        <Head>
          <title>My Bookshelf - Lux Libris</title>
          <meta name="description" content="Track your reading progress and manage your personal book collection" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
        </Head>
        
        <div style={{
          minHeight: '100vh',
          fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
          backgroundColor: currentTheme.background
        }}>
          
          {/* 🍔 HEADER WITH HAMBURGER MENU - KEEP DURING LOCKED PHASES */}
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
              onClick={() => router.back()}
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
              My Bookshelf
            </h1>

            {/* 🍔 Hamburger Menu - KEEP AVAILABLE */}
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

              {/* Dropdown Menu - UPDATED with phase locking */}
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
                        
                        // Handle locked items
                        if (item.locked) {
                          console.log('Item is locked:', item.name);
                          return;
                        }
                        
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
                  
                  {/* 🔔 Notification Toggle - keep same */}
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

          {/* LOCKED BOOKSHELF MESSAGE - UPDATED with phase-specific messaging */}
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '40px 30px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              border: `3px solid ${phaseInfo.color || currentTheme.primary}`
            }}>
              <div style={{ 
                fontSize: '80px', 
                marginBottom: '24px',
                opacity: 0.8
              }}>
                {phaseInfo.icon}
              </div>
              
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                marginBottom: '16px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                {phaseInfo.name === 'Voting Period' ? 'Voting Time!' : 
                 phaseInfo.name === 'Results' ? 'Happy Reading!' : 
                 phaseInfo.name === 'Teacher Selection' ? 'Getting Ready!' :
                 'Bookshelf Closed'}
              </h2>
              
              <p style={{
                fontSize: '16px',
                color: currentTheme.textSecondary,
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                {phaseInfo.name === 'Voting Period' ? 
                  "Bookshelf editing is paused during voting. Focus on choosing your favorite from the books you've already read!" :
                 phaseInfo.name === 'Results' ?
                  "Keep the reading adventure going! Explore your bookshelf, hit up the library, and collect XP and Luxlings™ while we cook up next year's awesome nominees! 📖⭐" :
                 phaseInfo.name === 'Teacher Selection' ?
                  "📝 Teachers are selecting amazing books for you! Your bookshelf will be available once the nominees are ready. Keep up those healthy reading habits!" :
                  getPhaseMessage()}
              </p>
              
              {/* Action buttons based on phase */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center'
              }}>
                {phaseInfo.name === 'Voting Period' && (
                  <button
                    onClick={() => router.push('/student-dashboard')}
                    style={{
                      backgroundColor: phaseInfo.color || currentTheme.primary,
                      color: 'white',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🗳️ Go Vote Now
                  </button>
                )}
                
                {phaseInfo.name === 'Results' && (
                  <>
                    <button
                      onClick={() => router.push('/student-dashboard')}
                      style={{
                        backgroundColor: phaseInfo.color || currentTheme.primary,
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      🏆 See Results
                    </button>
                    
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => router.push('/student-healthy-habits')}
                        style={{
                          backgroundColor: 'transparent',
                          color: currentTheme.textPrimary,
                          border: `2px solid ${currentTheme.primary}`,
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        ○ Healthy Habits
                      </button>
                      
                      <button
                        onClick={() => router.push('/student-saints')}
                        style={{
                          backgroundColor: 'transparent',
                          color: currentTheme.textPrimary,
                          border: `2px solid ${currentTheme.primary}`,
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        ♔ Saints
                      </button>
                    </div>
                  </>
                )}
                
                {phaseInfo.name === 'Teacher Selection' && (
                  <>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <button
                        onClick={() => router.push('/student-healthy-habits')}
                        style={{
                          backgroundColor: currentTheme.primary,
                          color: 'white',
                          border: 'none',
                          padding: '14px 24px',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        ○ Keep Reading Habits
                      </button>
                      
                      <button
                        onClick={() => router.push('/student-saints')}
                        style={{
                          backgroundColor: 'transparent',
                          color: currentTheme.textPrimary,
                          border: `2px solid ${currentTheme.primary}`,
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        ♔ Explore Saints
                      </button>
                    </div>
                  </>
                )}
                
                <button
                  onClick={() => router.push('/student-dashboard')}
                  style={{
                    backgroundColor: 'transparent',
                    color: currentTheme.textSecondary,
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* CSS animations */}
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
    );
  }

  const bookshelf = studentData.bookshelf || [];
  const totalBooks = bookshelf.length;
  
  const booksPerShelf = 4;
  const shelves = [];
  for (let i = 0; i < bookshelf.length; i += booksPerShelf) {
    shelves.push(bookshelf.slice(i, i + booksPerShelf));
  }
  if (bookshelf.length > 0) {
    while (shelves.length < 5) {
      shelves.push([]);
    }
  }

  const decorativeOverlay = `/bookshelves/${studentData.selectedTheme || 'classic_lux'}.jpg`;

  return (
    <>
      <Head>
        <title>My Bookshelf - Lux Libris</title>
        <meta name="description" content="Track your reading progress and manage your personal book collection" />
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
        
        {/* 🍔 HEADER WITH HAMBURGER MENU */}
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
            My Bookshelf
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

            {/* Dropdown Menu - UPDATED with phase locking */}
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
                      
                      // Handle locked items
                      if (item.locked) {
                        console.log('Item is locked:', item.name);
                        return;
                      }
                      
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

        {/* MAIN CONTENT */}
        <div className="bookshelf-container" style={{
          padding: '15px',
          minHeight: 'calc(100vh - 120px)',
          position: 'relative',
          zIndex: 10
        }}>
          {bookshelf.length === 0 ? (
            <div className="empty-bookshelf" style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: currentTheme.textSecondary,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '20px',
              margin: '20px auto',
              maxWidth: '300px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '400',
                color: currentTheme.textPrimary,
                marginBottom: '8px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Your bookshelf is empty
              </h2>
              <p style={{ 
                fontSize: '13px',
                marginBottom: '20px',
                fontFamily: 'Avenir, system-ui, sans-serif',
                letterSpacing: '0.5px',
                lineHeight: '1.4'
              }}>
                Add books from the nominees page!
              </p>
              <button
                onClick={() => router.push('/student-nominees')}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: currentTheme.textPrimary,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minHeight: '44px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.3px'
                }}
              >
                Browse Books
              </button>
            </div>
          ) : (
            <div className="bookshelf-grid" style={{
              maxWidth: '350px',
              margin: '0 auto'
            }}>
              {shelves.map((shelf, shelfIndex) => (
                <div key={shelfIndex} className="shelf-row" style={{ 
                  position: 'relative',
                  marginBottom: '12px'
                }}>
                  <div className="books-container" style={{
                    height: '98px',
                    padding: '0 15px',
                    marginBottom: '6px',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${booksPerShelf}, 1fr)`,
                    gap: '6px',
                    alignItems: 'end'
                  }}>
                    {shelf.map((book, bookIndex) => {
                      const bookDetails = getBookDetails(book.bookId);
                      if (!bookDetails) return null;
                      
                      const progressPercent = getProgressPercentage(book);
                      const total = getBookTotal(book);
                      const progressColor = getProgressColor(book.currentProgress, total);
                      const bookState = getBookState(book);
                      
                      return (
                        <button
                          key={book.bookId}
                          onClick={() => openBookModal(book)}
                          className="book-button"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            padding: 0
                          }}
                        >
                          <div className="book-cover" style={{
                            width: '100%',
                            maxWidth: '68px',
                            height: '88px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            backgroundColor: '#F5F5F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                            transition: 'transform 0.2s ease',
                            transform: 'translateZ(0)',
                            margin: '0 auto'
                          }}
                          onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1) translateZ(0)';
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1) translateZ(0)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                          }}
                          >
                            {bookDetails.coverImageUrl ? (
                              <img 
                                src={bookDetails.coverImageUrl} 
                                alt={bookDetails.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '20px' }}>📚</span>
                            )}
                            
                            <div className="progress-bar" style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '5px',
                              backgroundColor: 'rgba(0,0,0,0.5)'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${progressPercent}%`,
                                backgroundColor: progressColor,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            
                            {/* Audio Badge */}
                            {book.format === 'audiobook' && (
                              <div className="audio-badge" style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '14px',
                                height: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '7px'
                              }}>
                                🎧
                              </div>
                            )}
                            
                            {/* Revision Requested Icon */}
                            {(bookState === 'revision_cooldown' || bookState === 'revision_ready') && (
                              <div className="revision-badge" style={{
                                position: 'absolute',
                                top: '2px',
                                right: book.format === 'audiobook' ? '18px' : '2px',
                                backgroundColor: bookState === 'revision_ready' ? 'rgba(33,150,243,0.9)' : 'rgba(255,152,0,0.9)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '14px',
                                height: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '7px',
                                animation: bookState === 'revision_ready' ? 'pulse 2s infinite' : 'none'
                              }}>
                                📝
                              </div>
                            )}
                            
                            {/* Sand Timer for Pending/Cooldown States */}
                            {(bookState === 'pending_admin_approval' || 
                              bookState === 'pending_parent_quiz_unlock' || 
                              bookState === 'quiz_cooldown' || 
                              bookState === 'admin_cooldown') && (
                              <div className="pending-badge" style={{
                                position: 'absolute',
                                top: '2px',
                                right: book.format === 'audiobook' ? '18px' : '2px',
                                backgroundColor: 'rgba(255,152,0,0.9)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '14px',
                                height: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '7px',
                                animation: bookState.includes('cooldown') ? 'pulse 2s infinite' : 'none'
                              }}>
                                ⏳
                              </div>
                            )}
                            
                            {/* Completion Badge */}
                            {bookState === 'completed' && (
                              <div className="completion-badge" style={{
                                position: 'absolute',
                                top: '2px',
                                left: '2px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                borderRadius: '50%',
                                width: '14px',
                                height: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '7px',
                                fontWeight: 'bold'
                              }}>
                                ✓
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    
                    {Array(booksPerShelf - shelf.length).fill(null).map((_, emptyIndex) => (
                      <div
                        key={`empty-${shelfIndex}-${emptyIndex}`}
                        className="empty-book-slot"
                        style={{
                          width: '100%',
                          maxWidth: '68px',
                          height: '88px',
                          margin: '0 auto'
                        }}
                      />
                    ))}
                  </div>

                  <div className="shelf-board" style={{
                    height: '6px',
                    margin: '0 10px',
                    backgroundColor: currentTheme.primary,
                    borderRadius: '2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 2px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 5
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>
{/* BOOK MODAL - UPDATED WITH READ-ONLY FUNCTIONALITY */}
        {showBookModal && selectedBook && (() => {
          const colorPalette = getCategoryColorPalette(selectedBook.details);
          const total = getBookTotal(selectedBook);
          const bookState = getBookState(selectedBook);
          const stateMessage = getBookStateMessage(selectedBook);
          const locked = isBookLocked(selectedBook);
          
          // NEW: Check if editing is allowed by phase system
          const canEdit = hasAccess('bookshelfEditing');
          const phaseInfo = getPhaseInfo();
          
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
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                maxWidth: '340px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                {/* Header - show phase indicator if read-only */}
                <div style={{
                  position: 'relative',
                  padding: '15px 15px 10px',
                  backgroundColor: canEdit ? '#FFFFFF' : `${phaseInfo.color || currentTheme.primary}10`,
                  borderRadius: '20px 20px 0 0',
                  textAlign: 'center',
                  borderBottom: canEdit ? 'none' : `2px solid ${phaseInfo.color || currentTheme.primary}40`
                }}>
                  {/* Phase indicator for read-only mode */}
                  {!canEdit && (
                    <div style={{
                      backgroundColor: phaseInfo.color || currentTheme.primary,
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {phaseInfo.icon} {phaseInfo.name} - View Only
                    </div>
                  )}

                  <button
                    onClick={closeBookModal}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: colorPalette.textPrimary,
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>

                  {/* Book cover and completion status */}
                  <div style={{
                    width: '120px',
                    height: '160px',
                    margin: '0 auto',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    border: '2px solid white',
                    position: 'relative'
                  }}>
                    {selectedBook.details.coverImageUrl ? (
                      <img 
                        src={selectedBook.details.coverImageUrl} 
                        alt={selectedBook.details.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '40px' }}>📚</span>
                    )}
                    
                    {/* Completion badge */}
                    {bookState === 'completed' && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        🎉
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  backgroundColor: colorPalette.background,
                  padding: '15px',
                  borderRadius: '0 0 20px 20px',
                  border: `2px solid ${colorPalette.primary}20`,
                  borderTop: 'none'
                }}>
                  {/* Book title and author */}
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '400',
                      color: colorPalette.textPrimary,
                      margin: '0 0 4px 0',
                      lineHeight: '1.2',
                      fontFamily: 'Didot, "Times New Roman", serif'
                    }}>
                      {selectedBook.details.title}
                    </h2>
                    <p style={{
                      fontSize: '12px',
                      color: colorPalette.textSecondary,
                      margin: '0 0 12px 0',
                      fontStyle: 'italic',
                      fontFamily: 'Avenir, system-ui, sans-serif',
                      letterSpacing: '0.3px'
                    }}>
                      by {selectedBook.details.authors}
                    </p>

                    {/* Status message */}
                    {stateMessage && (
                      <div style={{
                        backgroundColor: stateMessage.color,
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        margin: '0 0 12px 0',
                        fontFamily: 'Avenir, system-ui, sans-serif',
                        lineHeight: '1.4',
                        maxHeight: '80px',
                        overflowY: 'auto'
                      }}>
                        {stateMessage.message}
                      </div>
                    )}

                    {/* Read-only message during phase locks */}
                    {!canEdit && (
                      <div style={{
                        backgroundColor: `${phaseInfo.color || currentTheme.primary}20`,
                        color: phaseInfo.color || currentTheme.primary,
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        border: `1px solid ${phaseInfo.color || currentTheme.primary}40`
                      }}>
                        📖 Viewing only - {phaseInfo.name.toLowerCase()} mode active
                      </div>
                    )}

                    {/* Start Reading Session Button - DISABLED during phase locks */}
                    {shouldShowReadingButton(selectedBook) && (
                      <button
                        onClick={() => canEdit ? startReadingSession(selectedBook) : null}
                        disabled={locked || !canEdit}
                        style={{
                          backgroundColor: (locked || !canEdit) ? '#E0E0E0' : colorPalette.primary,
                          color: (locked || !canEdit) ? '#999' : colorPalette.textPrimary,
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: (locked || !canEdit) ? 'not-allowed' : 'pointer',
                          width: '100%',
                          minHeight: '44px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          opacity: (locked || !canEdit) ? 0.6 : 1,
                          marginBottom: '12px'
                        }}
                      >
                        {!canEdit ? '📖 Reading sessions paused' : '📖 Start Reading Session'}
                      </button>
                    )}
                  </div>

                  {/* Progress section - READ ONLY during phase locks */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: colorPalette.textPrimary,
                      display: 'block',
                      marginBottom: '6px',
                      fontFamily: 'Avenir, system-ui, sans-serif',
                      letterSpacing: '0.3px'
                    }}>
                      {selectedBook.format === 'audiobook' ? 'Minutes' : 'Pages'}: {tempProgress}/{total}
                      {!canEdit && <span style={{ color: colorPalette.textSecondary, fontStyle: 'italic' }}> (view only)</span>}
                    </label>
                    
                    <input
                      type="range"
                      min="0"
                      max={total}
                      value={tempProgress}
                      onChange={canEdit ? (e) => setTempProgress(parseInt(e.target.value)) : undefined}
                      disabled={!canEdit}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: `linear-gradient(to right, ${colorPalette.primary} 0%, ${colorPalette.primary} ${(tempProgress/total)*100}%, #E0E0E0 ${(tempProgress/total)*100}%, #E0E0E0 100%)`,
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        cursor: canEdit ? 'pointer' : 'not-allowed',
                        opacity: canEdit ? 1 : 0.6
                      }}
                    />
                  </div>

                  {/* Rating section - READ ONLY during phase locks */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: colorPalette.textPrimary,
                      display: 'block',
                      marginBottom: '6px',
                      fontFamily: 'Avenir, system-ui, sans-serif',
                      letterSpacing: '0.3px'
                    }}>
                      Rating {!canEdit && <span style={{ color: colorPalette.textSecondary, fontStyle: 'italic' }}>(view only)</span>}
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      gap: '3px', 
                      justifyContent: 'center'
                    }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={canEdit ? () => setTempRating(star) : undefined}
                          disabled={!canEdit}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: canEdit ? 'pointer' : 'not-allowed',
                            color: star <= tempRating ? '#FFD700' : '#E0E0E0',
                            padding: '1px',
                            minHeight: '44px',
                            minWidth: '44px',
                            opacity: canEdit ? 1 : 0.7
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes section - READ ONLY during phase locks */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: colorPalette.textPrimary,
                      display: 'block',
                      marginBottom: '6px'
                    }}>
                      Notes {!canEdit && <span style={{ color: colorPalette.textSecondary, fontStyle: 'italic' }}>(view only)</span>}
                    </label>
                    <textarea
                      value={tempNotes}
                      onChange={canEdit ? handleTextareaChange : undefined}
                      placeholder={canEdit ? "Notes..." : "No notes added"}
                      readOnly={!canEdit}
                      style={{
                        width: '100%',
                        height: `${textareaHeight}px`,
                        minHeight: '50px',
                        maxHeight: '120px',
                        padding: '8px',
                        border: `1px solid ${colorPalette.primary}40`,
                        borderRadius: '6px',
                        fontSize: '16px',
                        backgroundColor: canEdit ? '#FFFFFF' : '#F5F5F5',
                        color: colorPalette.textPrimary,
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        transition: 'height 0.1s ease',
                        cursor: canEdit ? 'text' : 'default'
                      }}
                      onInput={(e) => {
                        if (e.target.scrollHeight > 120) {
                          e.target.style.overflow = 'auto';
                        } else {
                          e.target.style.overflow = 'hidden';
                        }
                      }}
                    />
                  </div>

                  {/* Action buttons - CONDITIONAL based on phase */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {canEdit ? (
                      // EDITING ALLOWED - Show normal buttons
                      <>
                        <button
                          onClick={saveBookProgress}
                          disabled={isSaving}
                          style={{
                            backgroundColor: colorPalette.primary,
                            color: colorPalette.textPrimary,
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            opacity: isSaving ? 0.7 : 1,
                            minHeight: '44px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          {isSaving ? 'Saving...' : '💾 Save'}
                        </button>
                        
                        {shouldShowRemoveButton(selectedBook) && (
                          <button
                            onClick={() => deleteBook(selectedBook.bookId)}
                            disabled={isSaving || locked}
                            style={{
                              backgroundColor: locked ? '#E0E0E0' : colorPalette.textSecondary,
                              color: locked ? '#999' : 'white',
                              border: 'none',
                              padding: '10px 16px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              cursor: locked ? 'not-allowed' : 'pointer',
                              opacity: isSaving ? 0.7 : (locked ? 0.6 : 1),
                              minHeight: '44px',
                              fontWeight: '500',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </>
                    ) : (
                      // READ-ONLY MODE - Show view-only message and close button
                      <>
                        <div style={{
                          backgroundColor: `${phaseInfo.color || currentTheme.primary}10`,
                          border: `2px solid ${phaseInfo.color || currentTheme.primary}40`,
                          borderRadius: '12px',
                          padding: '12px',
                          textAlign: 'center'
                        }}>
                          <p style={{
                            fontSize: '12px',
                            color: colorPalette.textPrimary,
                            margin: '0 0 4px 0',
                            fontWeight: '600'
                          }}>
                            📖 View Only Mode
                          </p>
                          <p style={{
                            fontSize: '11px',
                            color: colorPalette.textSecondary,
                            margin: 0,
                            lineHeight: '1.3'
                          }}>
                            {phaseInfo.name === 'Voting Period' ? 
                              'Book editing is paused during voting. Focus on choosing your favorite!' :
                             phaseInfo.name === 'Results' ?
                              'Book editing is paused while we celebrate the winners!' :
                              'Book editing is temporarily unavailable'}
                          </p>
                        </div>
                        
                        <button
                          onClick={closeBookModal}
                          style={{
                            backgroundColor: colorPalette.textSecondary,
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            minHeight: '44px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          ✓ Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SUBMISSION POPUP */}
        {showSubmissionPopup && selectedBook && (() => {
          const colorPalette = currentTheme;
          
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                maxWidth: '360px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                
                <div style={{
                  background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`,
                  borderRadius: '20px 20px 0 0',
                  padding: '20px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <button
                    onClick={() => setShowSubmissionPopup(false)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colorPalette.textPrimary
                    }}
                  >
                    ✕
                  </button>

                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'white',
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    Book Complete!
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.9)',
                    margin: '0',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}>
                    How would you like to show you have read &ldquo;{selectedBook.details.title}&rdquo;?
                  </p>
                </div>

                <div style={{ padding: '20px' }}>
                  
                  <button
                    onClick={handleQuizSubmission}
                    style={{
                      width: '100%',
                      backgroundColor: colorPalette.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minHeight: '60px',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>📝</span>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Take Quiz</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        Parent code required • 10 questions • 7 correct to pass
                      </div>
                    </div>
                  </button>

                  {studentData.schoolSubmissionOptions?.presentToTeacher && (
                    <button
                      onClick={() => handleBookSubmission('presentToTeacher')}
                      style={{
                        width: '100%',
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.textPrimary,
                        border: `2px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '60px',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>🗣️</span>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Present to Teacher</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Oral presentation or discussion
                        </div>
                      </div>
                    </button>
                  )}

                  {studentData.schoolSubmissionOptions?.submitReview && (
                    <button
                      onClick={() => handleBookSubmission('submitReview')}
                      style={{
                        width: '100%',
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.textPrimary,
                        border: `2px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '60px',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>✍️</span>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Submit Written Review</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Written book review or summary
                        </div>
                      </div>
                    </button>
                  )}

                  {studentData.schoolSubmissionOptions?.createStoryboard && (
                    <button
                      onClick={() => handleBookSubmission('createStoryboard')}
                      style={{
                        width: '100%',
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.textPrimary,
                        border: `2px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '60px',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>🎨</span>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Create Storyboard</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Visual art or comic strip
                        </div>
                      </div>
                    </button>
                  )}

                  {studentData.schoolSubmissionOptions?.bookReport && (
                    <button
                      onClick={() => handleBookSubmission('bookReport')}
                      style={{
                        width: '100%',
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.textPrimary,
                        border: `2px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '60px',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>📚</span>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Traditional Book Report</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Formal written report
                        </div>
                      </div>
                    </button>
                  )}

                  {studentData.schoolSubmissionOptions?.discussWithLibrarian && (
                    <button
                      onClick={() => handleBookSubmission('discussWithLibrarian')}
                      style={{
                        width: '100%',
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.textPrimary,
                        border: `2px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '60px',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>💬</span>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Discussion with Librarian</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          One-on-one book discussion
                        </div>
                      </div>
                    </button>
                  )}

                  {studentData.schoolSubmissionOptions?.actOutScene && (
                    <button
                      onClick={() => handleBookSubmission('actOutScene')}
                      style={{
                        width: '100%',
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.textPrimary,
                        border: `2px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '60px',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>🎭</span>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Act Out Scene</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Performance or dramatic reading
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setShowSubmissionPopup(false)}
                    style={{
                      width: '100%',
                      backgroundColor: '#F5F5F5',
                      color: '#666',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PARENT PERMISSION SCREEN */}
        {showParentPermission && selectedBook && (() => {
          const colorPalette = currentTheme;
          
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              zIndex: 1002,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
              }}>
                
                <div style={{
                  background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`,
                  borderRadius: '20px 20px 0 0',
                  padding: '24px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    Parent Permission Required
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    opacity: 0.9,
                    margin: '0',
                    fontFamily: 'Avenir, system-ui, sans-serif'
                  }}>
                    To take the quiz for &ldquo;{selectedBook.details.title}&rdquo;
                  </p>
                </div>

                <div style={{ padding: '24px' }}>
                  
                  <div style={{
                    marginBottom: '20px',
                    padding: '20px',
                    backgroundColor: colorPalette.background,
                    borderRadius: '16px',
                    border: `2px solid ${colorPalette.primary}30`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <span style={{ fontSize: '24px' }}>⚡</span>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colorPalette.textPrimary,
                          margin: '0 0 4px 0',
                          fontFamily: 'Avenir, system-ui, sans-serif'
                        }}>
                          Start Quiz Now
                        </h4>
                        <p style={{
                          fontSize: '12px',
                          color: colorPalette.textSecondary,
                          margin: '0',
                          fontFamily: 'Avenir, system-ui, sans-serif'
                        }}>
                          If your parent is available
                        </p>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      value={parentCode}
                      onChange={(e) => {
                        const newCode = e.target.value.toUpperCase();
                        setParentCode(newCode);
                      }}
                      placeholder="Ask parent to enter quiz code"
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: `2px solid ${colorPalette.primary}`,
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontWeight: '600',
                        letterSpacing: '0.1em',
                        color: '#000000',
                        backgroundColor: '#FFFFFF',
                        marginBottom: '12px'
                      }}
                      maxLength={8}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                    />
                    
                    <button
                      onClick={handleParentCodeSubmit}
                      disabled={!parentCode.trim() || isSaving}
                      style={{
                        width: '100%',
                        backgroundColor: (parentCode.trim() && !isSaving) ? colorPalette.primary : '#E0E0E0',
                        color: (parentCode.trim() && !isSaving) ? 'white' : '#999',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: (parentCode.trim() && !isSaving) ? 'pointer' : 'not-allowed',
                        fontFamily: 'Avenir, system-ui, sans-serif',
                        opacity: isSaving ? 0.7 : 1,
                        minHeight: '44px'
                      }}
                    >
                      {isSaving ? '🔄 Loading Quiz...' : '🚀 Start Quiz'}
                    </button>
                  </div>

                  <div style={{
                    marginBottom: '20px',
                    padding: '20px',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '16px',
                    border: '2px solid #E9ECEF'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <span style={{ fontSize: '24px' }}>📧</span>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#495057',
                          margin: '0 0 4px 0',
                          fontFamily: 'Avenir, system-ui, sans-serif'
                        }}>
                          Request Later
                        </h4>
                        <p style={{
                          fontSize: '12px',
                          color: '#6C757D',
                          margin: '0',
                          fontFamily: 'Avenir, system-ui, sans-serif'
                        }}>
                          If your parent is not available now
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleRequestParentApproval}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        backgroundColor: '#6C757D',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '14px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'Avenir, system-ui, sans-serif',
                        opacity: isSaving ? 0.7 : 1,
                        minHeight: '44px'
                      }}
                    >
                      {isSaving ? 'Sending...' : '📮 Send Request to Parent'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowParentPermission(false);
                      setParentCode('');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: '#999',
                      border: 'none',
                      padding: '16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* QUIZ MODAL */}
        {showQuizModal && (() => {
          const colorPalette = currentTheme;
          const currentQuestion = quizQuestions[currentQuestionIndex];
          const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
          
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.95)',
              zIndex: 1003,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                maxWidth: '420px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
              }}>
                
                <div style={{
                  background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`,
                  borderRadius: '20px 20px 0 0',
                  padding: '20px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      opacity: 0.9,
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}>
                      Question {currentQuestionIndex + 1} of {quizQuestions.length}
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      backgroundColor: timerActive ? (timeRemaining < 300 ? '#FF4757' : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.2)',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontFamily: 'system-ui, monospace'
                    }}>
                      {timerActive ? formatTime(timeRemaining) : '30:00'}
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    height: '6px',
                    margin: '0 auto 16px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      height: '100%',
                      width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    📝 Quiz: {selectedBook.details.title}
                  </h3>
                </div>

                <div style={{ padding: '24px' }}>
                  
                  {currentQuestion && (
                    <>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colorPalette.textPrimary,
                        marginBottom: '24px',
                        lineHeight: '1.5',
                        fontFamily: 'Avenir, system-ui, sans-serif'
                      }}>
                        {currentQuestion.question}
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        {currentQuestion.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleQuizAnswer(currentQuestionIndex, option)}
                            style={{
                              width: '100%',
                              backgroundColor: quizAnswers[currentQuestionIndex] === option 
                                ? colorPalette.primary 
                                : '#F8F8F8',
                              color: quizAnswers[currentQuestionIndex] === option 
                                ? 'white' 
                                : colorPalette.textPrimary,
                              border: quizAnswers[currentQuestionIndex] === option 
                                ? `2px solid ${colorPalette.primary}` 
                                : '2px solid #E0E0E0',
                              borderRadius: '12px',
                              padding: '16px',
                              marginBottom: '12px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              fontFamily: 'Avenir, system-ui, sans-serif',
                              lineHeight: '1.4',
                              minHeight: '44px'
                            }}
                          >
                            <span style={{ 
                              fontWeight: '600', 
                              marginRight: '8px',
                              opacity: 0.8
                            }}>
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        gap: '12px',
                        justifyContent: 'space-between'
                      }}>
                        {currentQuestionIndex > 0 && (
                          <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                            style={{
                              backgroundColor: '#F5F5F5',
                              color: '#666',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '12px 20px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              fontFamily: 'Avenir, system-ui, sans-serif',
                              minHeight: '44px'
                            }}
                          >
                            ← Previous
                          </button>
                        )}

                        {!isLastQuestion ? (
                          <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                            disabled={!quizAnswers[currentQuestionIndex]}
                            style={{
                              backgroundColor: quizAnswers[currentQuestionIndex] 
                                ? colorPalette.primary 
                                : '#E0E0E0',
                              color: quizAnswers[currentQuestionIndex] 
                                ? 'white' 
                                : '#999',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '12px 20px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: quizAnswers[currentQuestionIndex] ? 'pointer' : 'not-allowed',
                              marginLeft: 'auto',
                              fontFamily: 'Avenir, system-ui, sans-serif',
                              minHeight: '44px'
                            }}
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuizComplete(quizAnswers)}
                            disabled={!quizAnswers[currentQuestionIndex] || isSaving}
                            style={{
                              backgroundColor: quizAnswers[currentQuestionIndex] && !isSaving
                                ? '#4CAF50' 
                                : '#E0E0E0',
                              color: quizAnswers[currentQuestionIndex] && !isSaving
                                ? 'white' 
                                : '#999',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '12px 20px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: quizAnswers[currentQuestionIndex] && !isSaving 
                                ? 'pointer' 
                                : 'not-allowed',
                              marginLeft: 'auto',
                              fontFamily: 'Avenir, system-ui, sans-serif',
                              minHeight: '44px'
                            }}
                          >
                            {isSaving ? 'Submitting...' : '✓ Submit Quiz'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ 
                  padding: '0 24px 24px',
                  borderTop: '1px solid #F0F0F0'
                }}>
                  <button
                    onClick={() => {
                      setShowQuizModal(false);
                      setCurrentQuestionIndex(0);
                      setQuizAnswers([]);
                      setParentCode('');
                      setTimerActive(false);
                      setTimeRemaining(30 * 60);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: '#999',
                      border: 'none',
                      padding: '16px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}
                  >
                    Exit Quiz
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* SUCCESS MESSAGE */}
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
            textAlign: 'center',
            fontFamily: 'Avenir, system-ui, sans-serif',
            letterSpacing: '0.3px'
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
            50% { opacity: 0.5; }
          }
          
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #555555;
            border: 1px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
          }
          
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #555555;
            border: 1px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
          }
          
          /* Tablet scaling for iPad-sized devices */
          @media screen and (min-width: 768px) and (max-width: 1024px) {
            .bookshelf-container {
              padding: 21px !important; /* 15px * 1.4 */
            }
            
            .bookshelf-grid {
              max-width: 490px !important; /* 350px * 1.4 */
            }
            
            .shelf-row {
              margin-bottom: 17px !important; /* 12px * 1.4 */
            }
            
            .books-container {
              height: 137px !important; /* 98px * 1.4 */
              padding: 0 21px !important; /* 0 15px * 1.4 */
              margin-bottom: 8px !important; /* 6px * 1.4 */
              gap: 8px !important; /* 6px * 1.4 */
            }
            
            .book-cover {
              max-width: 95px !important; /* 68px * 1.4 */
              height: 123px !important; /* 88px * 1.4 */
              border-radius: 4px !important; /* 3px * 1.4 */
            }
            
            .book-cover span {
              font-size: 28px !important; /* 20px * 1.4 */
            }
            
            .progress-bar {
              height: 7px !important; /* 5px * 1.4 */
            }
            
            .audio-badge, .revision-badge, .pending-badge, .completion-badge {
              width: 20px !important; /* 14px * 1.4 */
              height: 20px !important; /* 14px * 1.4 */
              font-size: 10px !important; /* 7px * 1.4 */
            }
            
            .audio-badge {
              top: 3px !important; /* 2px * 1.4 */
              right: 3px !important; /* 2px * 1.4 */
            }
            
            .revision-badge, .pending-badge {
              top: 3px !important; /* 2px * 1.4 */
              right: 3px !important; /* Default 2px * 1.4 */
            }
            
            .completion-badge {
              top: 3px !important; /* 2px * 1.4 */
              left: 3px !important; /* 2px * 1.4 */
            }
            
            .empty-book-slot {
              max-width: 95px !important; /* 68px * 1.4 */
              height: 123px !important; /* 88px * 1.4 */
            }
            
            .shelf-board {
              height: 8px !important; /* 6px * 1.4 */
              margin: 0 14px !important; /* 0 10px * 1.4 */
              border-radius: 3px !important; /* 2px * 1.4 */
            }
            
            .empty-bookshelf {
              padding: 84px 28px !important; /* 60px 20px * 1.4 */
              border-radius: 28px !important; /* 20px * 1.4 */
              margin: 28px auto !important; /* 20px auto * 1.4 */
              max-width: 420px !important; /* 300px * 1.4 */
            }
            
            .empty-bookshelf div:first-child {
              font-size: 67px !important; /* 48px * 1.4 */
              margin-bottom: 22px !important; /* 16px * 1.4 */
            }
            
            .empty-bookshelf h2 {
              font-size: 22px !important; /* 16px * 1.4 */
              margin-bottom: 11px !important; /* 8px * 1.4 */
            }
            
            .empty-bookshelf p {
              font-size: 18px !important; /* 13px * 1.4 */
              margin-bottom: 28px !important; /* 20px * 1.4 */
            }
            
            .empty-bookshelf button {
              padding: 14px 28px !important; /* 10px 20px * 1.4 */
              border-radius: 17px !important; /* 12px * 1.4 */
              font-size: 18px !important; /* 13px * 1.4 */
              min-height: 62px !important; /* 44px * 1.4 */
            }
          }
          
          /* Keep mobile optimizations for smaller screens */
          @media screen and (max-width: 480px) {
            input, textarea, select {
              font-size: 16px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
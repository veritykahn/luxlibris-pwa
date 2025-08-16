// pages/student-stats/grade-stats.js - Enhanced with Phase Awareness and Dynamic Celebrations

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usePhaseAccess } from '../../hooks/usePhaseAccess'; // ADDED PHASE ACCESS
import { getStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getTheme, getSeasonalThemeAnnouncement } from '../../lib/themes'; // ADD THIS LINE
import Head from 'next/head';

export default function GradeStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess(); // ADDED PHASE ACCESS
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  
  // Grade stats data
  const [gradeStats, setGradeStats] = useState(null);
  const [personalComparison, setPersonalComparison] = useState(null);
  const [gradeEngagement, setGradeEngagement] = useState(null);
  const [realRewardsTracker, setRealRewardsTracker] = useState(null);
  
  // NEW: Expandable state for real rewards
  const [expandedRealRewards, setExpandedRealRewards] = useState(false);
  
  // ADD: State for seasonal theme notification
  const [seasonalThemeAlert, setSeasonalThemeAlert] = useState(null);

  // UPDATED: Navigation menu items with phase-aware locking
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

  // UPDATED: Stats navigation options with phase-aware Lux DNA messaging
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates', current: true  },
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
        setExpandedRealRewards(false);
      }
    };

    if (showNavMenu || showStatsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown]);

  // Handle stats navigation with phase awareness
  const handleStatsNavigation = (option) => {
    setShowStatsDropdown(false);
    
    if (option.disabled) {
      alert(`${option.name} is coming soon! 🚧`);
      return;
    }
    
    if (option.current) {
      return; // Already on current page
    }
    
    // Allow navigation to all pages - phaseNote is just informational
    router.push(option.path);
  };

  // NEW: Calculate Real Rewards Tracker for Grade (PRIVACY-FIRST)
  const calculateRealRewardsTracker = useCallback(async (studentData) => {
    try {
      const currentGrade = studentData.grade;
      const entityId = studentData.entityId;
      const schoolId = studentData.schoolId;
      
      // Get all students in the same grade
      const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const gradeQuery = query(studentsRef, where('grade', '==', currentGrade));
      const gradeSnapshot = await getDocs(gradeQuery);
      
      // Get all teachers to collect achievement tier definitions
      const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
      const teachersSnapshot = await getDocs(teachersRef);
      
      // Collect all unique achievement tiers across teachers
      const allAchievementTiers = new Map();
      
      teachersSnapshot.forEach(teacherDoc => {
        const teacherData = teacherDoc.data();
        if (teacherData.achievementTiers && Array.isArray(teacherData.achievementTiers)) {
          teacherData.achievementTiers.forEach(tier => {
            const key = `${tier.books}-${tier.reward}`;
            if (!allAchievementTiers.has(key)) {
              allAchievementTiers.set(key, {
                books: tier.books,
                reward: tier.reward,
                type: tier.type || 'basic',
                count: 0,
                percentage: 0
              });
            }
          });
        }
      });
      
      // Find the highest book requirement (this is the lifetime achievement)
const maxBookRequirement = Math.max(...Array.from(allAchievementTiers.values()).map(tier => tier.books));

// Count how many students in this grade have reached each tier
let totalGradeStudents = 0;
const studentBooksThisYear = studentData.booksSubmittedThisYear || 0;
const studentBooksLifetime = studentData.lifetimeBooksSubmitted || 0;
const studentBooks = studentBooksThisYear; // Keep for display
let studentEarnedTiers = [];

gradeSnapshot.forEach(studentDoc => {
  const student = studentDoc.data();
  totalGradeStudents++;
  const studentBooksThisYear = student.booksSubmittedThisYear || 0;
  const studentBooksLifetime = student.lifetimeBooksSubmitted || 0;
  
  // Check which tiers this student has achieved
  allAchievementTiers.forEach((tier, key) => {
    // Use lifetime books ONLY for the highest tier
    const booksToCheck = tier.books === maxBookRequirement ? studentBooksLifetime : studentBooksThisYear;
    
    if (booksToCheck >= tier.books) {
            tier.count++;
            
            // Track what the current student has earned
            if (student.uid === studentData.uid) {
              studentEarnedTiers.push({
                books: tier.books,
                reward: tier.reward,
                type: tier.type
              });
            }
          }
        });
      });
      
      // Calculate percentages and sort by book count
      const tierArray = Array.from(allAchievementTiers.values())
        .map(tier => ({
          ...tier,
          percentage: totalGradeStudents > 0 ? Math.round((tier.count / totalGradeStudents) * 100) : 0,
          isStudentEarned: studentEarnedTiers.some(earned => 
            earned.books === tier.books && earned.reward === tier.reward
          ),
          hasClassmatesEarned: tier.count > 0
        }))
        .sort((a, b) => a.books - b.books);
      
      // Sort student's earned tiers
      studentEarnedTiers.sort((a, b) => a.books - b.books);
      
      setRealRewardsTracker({
        gradeTiers: tierArray,
        totalGradeStudents,
        studentEarnedTiers,
        studentBooks,
        encouragingMessage: studentEarnedTiers.length > 0 ? 
          `You've earned ${studentEarnedTiers.length} real reward${studentEarnedTiers.length !== 1 ? 's' : ''} this year! 🎉` :
          `Keep reading to earn your first real reward! Your Grade ${currentGrade} classmates are earning amazing prizes! 🎯`
      });
      
    } catch (error) {
      console.error('Error calculating real rewards tracker:', error);
    }
  }, []);

  // Calculate grade-level statistics with SMART SUPERPOWERS + FAVORITE BOOKS (PRIVACY-FIRST)
  const calculateGradeStats = useCallback(async (studentData) => {
    try {
      const currentGrade = studentData.grade;
      const entityId = studentData.entityId;
      const schoolId = studentData.schoolId;
      
      // Get all students in the same grade (anonymized)
      const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const gradeQuery = query(studentsRef, where('grade', '==', currentGrade));
      const gradeSnapshot = await getDocs(gradeQuery);
      
      // Get all nominees for favorite book calculation
      const nomineesRef = collection(db, 'masterNominees');
      const nomineesSnapshot = await getDocs(nomineesRef);
      const allNominees = {};
      nomineesSnapshot.forEach(doc => {
        allNominees[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      // Aggregate anonymous statistics
      let totalStudents = 0;
      let totalBooksCompleted = 0;
      let totalReadingMinutes = 0;
      
      // NEW: Smart Superpower Tracking
      let studentsWithRatings = 0;
      let studentsWithNotes = 0;
      let studentsTrackingProgress = 0;
      let studentsWithStreaks = 0;
      let studentsWithAudiobooks = 0;
      let studentsWhoSpeedRead = 0;
      let studentsExploringGenres = 0;
      let studentsDiscussing = 0;
      let studentsCollecting = 0;
      let studentsFiveStars = 0;
      
      // NEW: Favorite Books Tracking
      const bookRatings = {}; // bookId -> { totalRating: X, count: Y, book: data }
      
      // Student's personal engagement for "YOU TOO!" messages
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      const studentBookshelf = studentData.bookshelf || [];
      const studentHasRated = studentBookshelf.some(book => book.rating > 0);
      const studentHasNotes = studentBookshelf.some(book => book.notes?.trim());
      const studentTracksProgress = studentBookshelf.some(book => book.currentProgress > 0);
      const studentCurrentStreak = studentData.currentStreak || 0;
      const studentUsesAudiobooks = studentBookshelf.some(book => book.format === 'audiobook');
      const studentGenres = new Set(studentBookshelf.map(book => allNominees[book.bookId]?.displayCategory).filter(Boolean));
      const studentIsCollecting = studentBookshelf.filter(book => !book.completed).length >= 3;
      const studentGivesFiveStars = studentBookshelf.some(book => book.rating === 5);
      
      gradeSnapshot.forEach(doc => {
        const student = doc.data();
        totalStudents++;
        
        // Books completed
        const studentBooksCompleted = student.booksSubmittedThisYear || 0;
        totalBooksCompleted += studentBooksCompleted;
        
        // Analyze bookshelf for superpowers
        const bookshelf = student.bookshelf || [];
        
        // ⭐ Book Rating Stars
        const hasRatings = bookshelf.some(book => book.rating > 0);
        if (hasRatings) studentsWithRatings++;
        
        // 📝 Thoughtful Notes
        const hasNotes = bookshelf.some(book => book.notes?.trim());
        if (hasNotes) studentsWithNotes++;
        
        // 📊 Progress Tracking
        const tracksProgress = bookshelf.some(book => book.currentProgress > 0);
        if (tracksProgress) studentsTrackingProgress++;
        
        // 🔥 Daily Reading Fire (7+ day streak)
        const currentStreak = student.currentStreak || 0;
        if (currentStreak >= 7) studentsWithStreaks++;
        
        // 🎧 Audiobook Champions
        const usesAudiobooks = bookshelf.some(book => book.format === 'audiobook');
        if (usesAudiobooks) studentsWithAudiobooks++;
        
        // 🏃‍♂️ Speed Readers (completed book in <7 days)
        const speedReads = bookshelf.some(book => {
          if (!book.completed || !book.addedAt || !book.submittedAt) return false;
          const addedDate = book.addedAt?.toDate ? book.addedAt.toDate() : new Date(book.addedAt);
          const submittedDate = book.submittedAt?.toDate ? book.submittedAt.toDate() : new Date(book.submittedAt);
          const daysDiff = (submittedDate - addedDate) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        });
        if (speedReads) studentsWhoSpeedRead++;
        
        // 🌈 Genre Explorers (3+ different categories)
        const studentGenres = new Set();
        bookshelf.forEach(book => {
          const bookData = allNominees[book.bookId];
          if (bookData?.displayCategory) {
            studentGenres.add(bookData.displayCategory);
          }
        });
        if (studentGenres.size >= 3) studentsExploringGenres++;
        
        // 🗣️ Discussion Masters (uses presentation/discussion submissions)
        const discusses = bookshelf.some(book => 
          book.submissionType && ['presentToTeacher', 'discussWithLibrarian'].includes(book.submissionType)
        );
        if (discusses) studentsDiscussing++;
        
        // 📚 Book Collectors (3+ books in progress)
        const booksInProgress = bookshelf.filter(book => !book.completed).length;
        if (booksInProgress >= 3) studentsCollecting++;
        
        // ⭐ Five-Star Finders (gives 5-star ratings)
        const givesFiveStars = bookshelf.some(book => book.rating === 5);
        if (givesFiveStars) studentsFiveStars++;
        
        // Collect ratings for favorite books calculation
        bookshelf.forEach(book => {
          if (book.rating && book.rating >= 1 && book.rating <= 5) {
            const bookData = allNominees[book.bookId];
            if (bookData) {
              if (!bookRatings[book.bookId]) {
                bookRatings[book.bookId] = { 
                  totalRating: 0, 
                  count: 0, 
                  book: bookData 
                };
              }
              bookRatings[book.bookId].totalRating += book.rating;
              bookRatings[book.bookId].count++;
            }
          }
        });
      });
      
      const averageBooks = totalStudents > 0 ? (totalBooksCompleted / totalStudents) : 0;
      
      // Calculate student's percentile
      let studentsWithFewerBooks = 0;
      gradeSnapshot.forEach(doc => {
        const student = doc.data();
        const studentBooksCount = student.booksSubmittedThisYear || 0;
        if (studentBooksCount < studentBooks) {
          studentsWithFewerBooks++;
        }
      });
      
      const percentile = totalStudents > 1 ? Math.round((studentsWithFewerBooks / (totalStudents - 1)) * 100) : 50;
      
      // NEW: Calculate Grade's Favorite Book (min 3 ratings)
      let gradeFavoriteBook = null;
      let highestRating = 0;
      
      Object.values(bookRatings).forEach(bookData => {
        if (bookData.count >= 3) {
          const averageRating = bookData.totalRating / bookData.count;
          if (averageRating > highestRating) {
            highestRating = averageRating;
            gradeFavoriteBook = {
              ...bookData.book,
              averageRating: Math.round(averageRating * 10) / 10,
              ratingCount: bookData.count
            };
          }
        }
      });
      
      // NEW: Smart Superpowers (30% threshold for grades)
      const superpowers = [];
      const threshold = 0.30; // 30% for grades
      
      if ((studentsWithRatings / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "⭐ Book Rating Stars!", 
          description: "We love sharing opinions!", 
          hasIt: studentHasRated 
        });
      }
      
      if ((studentsWithNotes / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "📝 Thoughtful Note Writers!", 
          description: "We capture our thoughts!", 
          hasIt: studentHasNotes 
        });
      }
      
      if ((studentsTrackingProgress / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "📊 Progress Trackers!", 
          description: "We love seeing growth!", 
          hasIt: studentTracksProgress 
        });
      }
      
      if ((studentsWithStreaks / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "🔥 Daily Reading Fire!", 
          description: "We read every day!", 
          hasIt: studentCurrentStreak >= 7 
        });
      }
      
      if ((studentsWithAudiobooks / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "🎧 Audiobook Champions!", 
          description: "We love listening to stories!", 
          hasIt: studentUsesAudiobooks 
        });
      }
      
      if ((studentsWhoSpeedRead / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "🏃‍♂️ Speed Readers!", 
          description: "We devour books quickly!", 
          hasIt: false // TODO: calculate for student
        });
      }
      
      if ((studentsExploringGenres / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "🌈 Genre Explorers!", 
          description: "We read everything!", 
          hasIt: studentGenres.size >= 3 
        });
      }
      
      if ((studentsDiscussing / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "🗣️ Discussion Masters!", 
          description: "We love talking about books!", 
          hasIt: false // TODO: check student submission types
        });
      }
      
      if ((studentsCollecting / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "📚 Book Collectors!", 
          description: "We always have books going!", 
          hasIt: studentIsCollecting 
        });
      }
      
      if ((studentsFiveStars / totalStudents) >= threshold) {
        superpowers.push({ 
          name: "⭐ Five-Star Finders!", 
          description: "We find amazing books!", 
          hasIt: studentGivesFiveStars 
        });
      }
      
      setGradeStats({
        totalStudents,
        averageBooks: Math.round(averageBooks * 10) / 10,
        totalBooksCompleted,
        grade: currentGrade
      });
      
      setPersonalComparison({
        studentBooks,
        percentile,
        aboveAverage: studentBooks > averageBooks,
        booksAboveAverage: Math.round((studentBooks - averageBooks) * 10) / 10
      });
      
      setGradeEngagement({
        superpowers,
        gradeFavoriteBook,
        totalStudents
      });
      
    } catch (error) {
      console.error('Error calculating grade stats:', error);
    }
  }, []);

  // Load student data and calculate grade stats
  const loadData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      // UPDATED: Use getTheme instead of themes object
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const theme = getTheme(selectedThemeKey);  // NEW WAY
      setCurrentTheme(theme);
      
      // ADD: Check for seasonal themes (optional)
      const seasonalAnnouncements = getSeasonalThemeAnnouncement();
      if (seasonalAnnouncements.length > 0 && !firebaseStudentData.selectedTheme) {
        // Show seasonal theme notification if user hasn't selected a theme
        setSeasonalThemeAlert(seasonalAnnouncements[0]);
        setTimeout(() => setSeasonalThemeAlert(null), 8000);
      }
      
      // Calculate grade statistics
      await calculateGradeStats(firebaseStudentData);
      
      // NEW: Calculate real rewards tracker
      await calculateRealRewardsTracker(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, calculateGradeStats, calculateRealRewardsTracker]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadData]);

  // UPDATED: Get phase-specific messaging for the dashboard
  const getPhaseSpecificMessage = () => {
    switch (phaseData.currentPhase) {
      case 'VOTING':
        return "🗳️ This year's reading program is complete! Check out your final grade stats below, keep building XP and earning badges, and discover your Lux DNA! Time to vote for your favorites!";
      case 'RESULTS':
        return "🏆 Congratulations on an amazing reading year! Check out your final grade stats below, keep building XP and earning badges! Nominees DNA in Lux Lab is now closed for the year.";
      case 'TEACHER_SELECTION':
        return "📊 Your stats will be refreshed for the new program, but don't worry - you'll keep your reading streaks, XP, and Luxlings™! Keep your reading habits strong this week while we prepare amazing new books for you! 📚✨";
      default:
        return null;
    }
  };
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading grade comparisons...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Grade {studentData.grade} Stats - Lux Libris</title>
        <meta name="description" content="Compare your reading progress with your grade level" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* ADD: Seasonal theme notification */}
        {seasonalThemeAlert && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: 'white',
            padding: '14px 24px',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 1002,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            animation: 'slideInDown 0.6s ease-out'
          }}
          onClick={() => {
            router.push('/student-settings');
            setSeasonalThemeAlert(null);
          }}
          >
            <span style={{ fontSize: '20px' }}>{seasonalThemeAlert.icon}</span>
            <span>{seasonalThemeAlert.message} Tap to use!</span>
          </div>
        )}
        
        {/* HEADER WITH DROPDOWN NAVIGATION */}
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
            onClick={() => router.push('/student-stats')}
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
              <span style={{ fontSize: '18px' }}>🎓</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Grade {studentData.grade} Stats</span>
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* UPDATED: Hamburger Menu with Phase-Aware Locking */}
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
          /* ALL OTHER PHASES: Show normal grade stats */
          <>
            {/* NEW: Compact Phase-Specific Alert Banner */}
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
            <div className="stats-main-content" style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
              
              {/* GRADE CELEBRATION */}
              {gradeStats && (
                <div className="grade-celebration grade-stats-card" style={{
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
                    🎉 Grade {gradeStats.grade} is Amazing!
                  </div>
                  
                  <div style={{
                    backgroundColor: `${currentTheme.primary}20`,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(32px, 10vw, 40px)',
                      marginBottom: '12px'
                    }}>
                      🌟
                    </div>
                    <div style={{
                      fontSize: 'clamp(16px, 5vw, 18px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      Together you&apos;ve read {gradeStats.totalBooksCompleted} books this year!
                    </div>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      color: currentTheme.textSecondary
                    }}>
                      What an incredible reading community you&apos;ve built! 📚✨
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px'
                  }}>
                    <div style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(18px, 5vw, 20px)',
                        fontWeight: 'bold',
                        color: currentTheme.textPrimary
                      }}>
                        {gradeStats.totalStudents}
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 11px)',
                        color: currentTheme.textSecondary
                      }}>
                        Reading Friends
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(18px, 5vw, 20px)',
                        fontWeight: 'bold',
                        color: currentTheme.textPrimary
                      }}>
                        {gradeStats.averageBooks}
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 11px)',
                        color: currentTheme.textSecondary
                      }}>
                        Books Each!
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(18px, 5vw, 20px)',
                        fontWeight: 'bold',
                        color: currentTheme.textPrimary
                      }}>
                        {personalComparison?.studentBooks || 0}
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 11px)',
                        color: currentTheme.textSecondary
                      }}>
                        You&apos;ve Read!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EXPANDABLE REAL REWARDS TRACKER FOR GRADE */}
              {realRewardsTracker && realRewardsTracker.gradeTiers.length > 0 && (
                <div className="grade-stats-card" style={{
                  backgroundColor: currentTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div 
                    onClick={() => setExpandedRealRewards(!expandedRealRewards)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${currentTheme.primary}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h3 style={{
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      margin: 0,
                      pointerEvents: 'none'
                    }}>
                      🎯 Grade {gradeStats?.grade} Real Rewards
                    </h3>
                    <div style={{
                      color: currentTheme.primary,
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      fontWeight: '600',
                      pointerEvents: 'none'
                    }}>
                      {expandedRealRewards ? '▼ Show Less' : '▶ Show All'}
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      color: currentTheme.textPrimary,
                      fontWeight: '500',
                      marginBottom: '12px'
                    }}>
                      {realRewardsTracker.encouragingMessage}
                    </div>
                  </div>

                  {(() => {
                    const earnedTiers = realRewardsTracker.gradeTiers.filter(tier => tier.hasClassmatesEarned);
                    const unearnedTiers = realRewardsTracker.gradeTiers.filter(tier => !tier.hasClassmatesEarned);
                    
                    // Find the next tier (lowest book requirement among unearned)
                    const nextTier = unearnedTiers.length > 0 
                      ? unearnedTiers.reduce((next, current) => 
                          current.books < next.books ? current : next
                        )
                      : null;
                    
                    const displayedTiers = expandedRealRewards 
                      ? realRewardsTracker.gradeTiers 
                      : earnedTiers.slice(0, 3);
                    
                    return (
                      <>
                        <div className="real-rewards-grid">
                          {displayedTiers.map((tier, index) => (
                            <div
                              key={index}
                              style={{
                                backgroundColor: tier.isStudentEarned ? 
                                  `${currentTheme.primary}30` : 
                                  tier.hasClassmatesEarned ? `${currentTheme.primary}20` : `${currentTheme.primary}10`,
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: index < displayedTiers.length - 1 ? '8px' : '0',
                                border: tier.isStudentEarned ? 
                                  `2px solid ${currentTheme.primary}` : 
                                  tier.hasClassmatesEarned ? 'none' : `1px dashed ${currentTheme.primary}60`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                                  fontWeight: '600',
                                  color: currentTheme.textPrimary,
                                  marginBottom: '2px'
                                }}>
                                  {tier.reward}
                                </div>
                                <div style={{
                                  fontSize: 'clamp(10px, 3vw, 12px)',
                                  color: currentTheme.textSecondary,
                                  marginBottom: '4px'
                                }}>
                                  {tier.books} books to unlock
                                  {tier.isStudentEarned && (
                                    <span style={{
                                      color: currentTheme.primary,
                                      fontWeight: '600',
                                      marginLeft: '8px'
                                    }}>
                                      - YOU EARNED THIS! 🎉
                                    </span>
                                  )}
                                </div>
                                <div style={{
                                  fontSize: 'clamp(11px, 3vw, 12px)',
                                  fontWeight: '600',
                                  color: tier.count > 0 ? '#4CAF50' : currentTheme.textSecondary
                                }}>
                                  {tier.count > 0 ? '🎯' : '⭕'} {tier.count} of {realRewardsTracker.totalGradeStudents} classmates earned this ({tier.percentage}%)
                                </div>
                              </div>
                              
                              <div style={{
                                minWidth: '40px',
                                textAlign: 'center'
                              }}>
                                <div style={{
                                  fontSize: 'clamp(20px, 6vw, 24px)'
                                }}>
                                  {tier.isStudentEarned ? '🏆' : tier.count > 0 ? '🎯' : '⭕'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* SMART STATUS MESSAGE */}
                        {!expandedRealRewards && (
                          <div style={{
                            fontSize: 'clamp(11px, 3vw, 12px)',
                            color: currentTheme.textSecondary,
                            textAlign: 'center',
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: `${currentTheme.primary}10`,
                            borderRadius: '8px'
                          }}>
                            {nextTier ? (
                              <>
                                📚 Next grade milestone: <strong>{nextTier.books} books for {nextTier.reward}</strong>
                              </>
                            ) : earnedTiers.length > 0 ? (
                              <>
                                🎉 <strong>Your grade has earned all available rewards!</strong> What an amazing reading community! 🏆
                              </>
                            ) : (
                              <>
                                🌟 <strong>Your grade is just getting started!</strong> Work together to earn your first rewards! 📖
                              </>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* GRADE SUPERPOWERS - DYNAMIC! */}
              {gradeEngagement && gradeEngagement.superpowers && gradeEngagement.superpowers.length > 0 && (
                <div className="grade-stats-card" style={{
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
                    ⭐ Grade {gradeStats?.grade} Superpowers
                  </h3>
                  
                  <div className="superpowers-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: gradeEngagement.superpowers.length === 1 ? '1fr' : '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    {gradeEngagement.superpowers.map((superpower, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: `${currentTheme.primary}20`,
                          borderRadius: '12px',
                          padding: '12px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{
                          fontSize: 'clamp(20px, 6vw, 24px)',
                          marginBottom: '4px'
                        }}>
                          {superpower.name.split(' ')[0]} {/* Extract emoji */}
                        </div>
                        <div style={{
                          fontSize: 'clamp(11px, 3vw, 12px)',
                          color: currentTheme.textPrimary,
                          fontWeight: '600',
                          marginBottom: '2px'
                        }}>
                          {superpower.name.substring(2)} {/* Remove emoji and space */}
                        </div>
                        <div style={{
                          fontSize: 'clamp(9px, 2.5vw, 10px)',
                          color: currentTheme.textSecondary,
                          marginBottom: superpower.hasIt ? '4px' : '0'
                        }}>
                          {superpower.description}
                        </div>
                        {superpower.hasIt && (
                          <div style={{
                            fontSize: 'clamp(8px, 2.5vw, 9px)',
                            color: currentTheme.primary,
                            fontWeight: '600'
                          }}>
                            YOU TOO! {superpower.name.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div style={{
                    backgroundColor: `${currentTheme.primary}10`,
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      color: currentTheme.textSecondary,
                      fontStyle: 'italic'
                    }}>
                      Your grade has incredible reading superpowers! Keep up the amazing work! 🌟
                    </div>
                  </div>
                </div>
              )}

              {/* GRADE'S FAVORITE BOOK */}
              {gradeEngagement && gradeEngagement.gradeFavoriteBook && (
                <div className="grade-stats-card" style={{
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
                    📚 Grade {gradeStats?.grade}&apos;s Favorite Book
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '80px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: '#F5F5F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      {gradeEngagement.gradeFavoriteBook.coverImageUrl ? (
                        <img 
                          src={gradeEngagement.gradeFavoriteBook.coverImageUrl} 
                          alt={gradeEngagement.gradeFavoriteBook.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '24px' }}>📚</span>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: '600',
                        color: currentTheme.textPrimary,
                        marginBottom: '4px',
                        lineHeight: '1.2'
                      }}>
                        {gradeEngagement.gradeFavoriteBook.title}
                      </div>
                      <div style={{
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        color: currentTheme.textSecondary,
                        marginBottom: '8px',
                        fontStyle: 'italic'
                      }}>
                        by {gradeEngagement.gradeFavoriteBook.authors}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>⭐</span>
                        <span style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: '600',
                          color: currentTheme.textPrimary
                        }}>
                          {gradeEngagement.gradeFavoriteBook.averageRating}/5.0
                        </span>
                      </div>
                      <div style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: currentTheme.textSecondary
                      }}>
                        from {gradeEngagement.gradeFavoriteBook.ratingCount} classmates
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QUICK LINKS */}
              <div className="button-group" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => router.push('/student-stats/my-stats')}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  📈 My Personal Stats
                </button>
                
                <button
                  onClick={() => router.push('/student-stats/school-stats')}
                  style={{
                    backgroundColor: currentTheme.secondary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  🏫 School Stats
                </button>
              </div>
            </div>
          </>
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

          /* ADDED: Adaptive CSS for tablet/iPad layouts */
          @media screen and (min-width: 768px) and (max-width: 1024px) {
            .stats-main-content {
              max-width: 600px !important; /* Wider container */
              padding: 24px !important; /* More breathing room */
            }
            
            .phase-alert-banner {
              margin: 0 24px 20px 24px !important;
              padding: 16px 20px !important;
            }
            
            /* Grade celebration gets more space */
            .grade-celebration {
              padding: 28px !important;
            }
            
            /* Real rewards in 2 columns when expanded */
            .real-rewards-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
            
            /* Superpowers always in 2 columns on iPad */
            .superpowers-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 16px !important;
            }
            
            /* Grade stats cards get more padding */
            .grade-stats-card {
              padding: 24px !important;
            }
            
            /* Button groups get more space */
            .button-group {
              gap: 16px !important;
              max-width: 400px !important;
              margin: 0 auto !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
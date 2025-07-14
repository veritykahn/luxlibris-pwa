// pages/student-stats/grade-stats.js - Enhanced with Real Achievement Tiers
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

export default function GradeStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  
  // Grade stats data
  const [gradeStats, setGradeStats] = useState(null);
  const [personalComparison, setPersonalComparison] = useState(null);
  const [gradeEngagement, setGradeEngagement] = useState(null);
  const [realRewardsTracker, setRealRewardsTracker] = useState(null); // NEW!

  // Theme definitions (same as before)
  const themes = useMemo(() => ({
    classic_lux: {
      name: 'Lux Libris Classic',
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
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { name: 'Nominees', path: '/student-nominees', icon: '□' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△', current: true },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], []);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
  { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
  { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
  { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates', current: true  },
  { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
  { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '🌍', description: 'Coming soon!', disabled: true },
  { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
  { name: 'Lux DNA Lab', path: '/student-stats/lux-dna-lab', icon: '🧬', description: 'Discover your reading personality' },
  { name: 'Family Battle', path: '/student-stats/family-battle', icon: '👨‍👩‍👧‍👦', description: 'Coming soon!', disabled: true }
], []);

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

  // Handle stats navigation
  const handleStatsNavigation = (option) => {
    setShowStatsDropdown(false);
    
    if (option.disabled) {
      alert(`${option.name} is coming soon! 🚧`);
      return;
    }
    
    if (option.current) {
      return; // Already on current page
    }
    
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
      
      // Count how many students in this grade have reached each tier
      let totalGradeStudents = 0;
      const studentBooks = studentData.booksSubmittedThisYear || 0;
      let studentEarnedTiers = [];
      
      gradeSnapshot.forEach(studentDoc => {
        const student = studentDoc.data();
        totalGradeStudents++;
        const studentBooksCount = student.booksSubmittedThisYear || 0;
        
        // Check which tiers this student has achieved
        allAchievementTiers.forEach((tier, key) => {
          if (studentBooksCount >= tier.books) {
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
          percentage: totalGradeStudents > 0 ? Math.round((tier.count / totalGradeStudents) * 100) : 0
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
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = themes[selectedThemeKey];
      setCurrentTheme(selectedTheme);
      
      // Calculate grade statistics
      await calculateGradeStats(firebaseStudentData);
      
      // NEW: Calculate real rewards tracker
      await calculateRealRewardsTracker(firebaseStudentData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, calculateGradeStats, calculateRealRewardsTracker]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadData]);

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
                        color: currentTheme.textSecondary,
                        opacity: 0.8
                      }}>
                        {option.description}
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

          {/* Hamburger Menu */}
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
                      if (!item.current) {
                        router.push(item.path);
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
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* GRADE CELEBRATION */}
          {gradeStats && (
            <div style={{
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

          {/* NEW: REAL REWARDS TRACKER FOR GRADE */}
          {realRewardsTracker && realRewardsTracker.gradeTiers.length > 0 && (
            <div style={{
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
                🎯 Grade {gradeStats?.grade} Real Rewards Progress
              </h3>
              
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
              
              {realRewardsTracker.gradeTiers.map((tier, index) => {
                const isStudentEarned = realRewardsTracker.studentEarnedTiers.some(earned => 
                  earned.books === tier.books && earned.reward === tier.reward
                );
                
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: isStudentEarned ? 
                        `${currentTheme.primary}30` : 
                        tier.count > 0 ? `${currentTheme.primary}20` : `${currentTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: index < realRewardsTracker.gradeTiers.length - 1 ? '8px' : '0',
                      border: isStudentEarned ? `2px solid ${currentTheme.primary}` : 'none',
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
                        {isStudentEarned && (
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
                        🎯 {tier.count} of {realRewardsTracker.totalGradeStudents} classmates earned this ({tier.percentage}%)
                      </div>
                    </div>
                    
                    <div style={{
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 'clamp(20px, 6vw, 24px)'
                      }}>
                        {isStudentEarned ? '🏆' : tier.count > 0 ? '🎯' : '⭕'}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  These are the REAL rewards your teachers give out! Keep reading! 🌟
                </div>
              </div>
            </div>
          )}

          {/* GRADE SUPERPOWERS - DYNAMIC! */}
          {gradeEngagement && gradeEngagement.superpowers && gradeEngagement.superpowers.length > 0 && (
            <div style={{
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
              
              <div style={{
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
            <div style={{
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
          <div style={{
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

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
        `}</style>
      </div>
    </>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, getSchoolNominees, updateStudentData } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  // 🔥 ADD THESE NEW STATE VARIABLES
const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
const [showQuizModal, setShowQuizModal] = useState(false);
const [quizQuestions, setQuizQuestions] = useState([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [quizAnswers, setQuizAnswers] = useState([]);
const [parentCode, setParentCode] = useState('');

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
    primary: '#2F5F5F',        // Deep teal (your preferred)
    secondary: '#8B2635',      // Burnt subdued red (your preferred)
    accent: '#F5DEB3',         // Warm wheat/cream (your preferred)
    background: '#F5F5DC',
    surface: '#FFF8DC',        // Cream surface (your preferred)
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
    primary: '#B8E6B8',        // Soft pastel green (new)
    secondary: '#FFB3BA',      // Soft coral (new)
    accent: '#FFCCCB',         // Pastel coral (new)
    background: '#FEFEFE',     // Pure white
    surface: '#F8FDF8',        // Very subtle green tint
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
    primary: '#6B8E6B',        // Forest green (your preferred)
    secondary: '#D2B48C',      // Warm tan/khaki (your preferred)
    accent: '#F5F5DC',         // Beige accent (your preferred)
    background: '#FFFEF8',     // Warm white (your preferred)
    surface: '#FFFFFF',
    textPrimary: '#2F4F2F',
    textSecondary: '#556B2F'
  },
  little_luminaries: {
    name: 'Luxlings™',
    assetPrefix: 'little_luminaries',
 primary: '#666666', // Medium grey (for buttons/elements)
 secondary: '#000000', // Black (for striking accents)
 accent: '#E8E8E8', // Light grey accent
 background: '#FFFFFF', // Pure white background
 surface: '#FAFAFA', // Very light grey surface
 textPrimary: '#B8860B', // Deep rich gold (readable on light backgrounds)
 textSecondary: '#AAAAAA' // grey text (for dark backgrounds)
}
};

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadBookshelfData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user]);

 const loadBookshelfData = async () => {
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
    
    if (firebaseStudentData.dioceseId && firebaseStudentData.schoolId) {
      const schoolNominees = await getSchoolNominees(
        firebaseStudentData.dioceseId, 
        firebaseStudentData.schoolId
      );
      setNominees(schoolNominees);
      
      // 🔥 NEW: Load school submission options
      const schoolDoc = await getDoc(doc(db, `dioceses/${firebaseStudentData.dioceseId}/schools`, firebaseStudentData.schoolId));
      if (schoolDoc.exists()) {
        const schoolData = schoolDoc.data();
        firebaseStudentData.schoolSubmissionOptions = schoolData.submissionOptions || {};
        firebaseStudentData.parentQuizCode = schoolData.parentQuizCode || '';
        setStudentData(firebaseStudentData); // Update with school options
      }
    }
    
  } catch (error) {
    console.error('❌ Error loading bookshelf:', error);
    router.push('/student-dashboard');
  }
  
  setIsLoading(false);
};

  const getBookDetails = (bookId) => {
    return nominees.find(book => book.id === bookId);
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

  const saveBookProgress = async () => {
  if (!selectedBook || !studentData) return;
  
  setIsSaving(true);
  try {
    const total = getBookTotal(selectedBook);
    const isNowCompleted = tempProgress >= total && total > 0;
    const wasAlreadyCompleted = selectedBook.completed;
    
    // 🎯 NEW: Check if this is a new completion (hitting 100% for first time)
    if (isNowCompleted && !wasAlreadyCompleted) {
      // Save the progress first
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedBook.bookId) {
          return {
            ...book,
            currentProgress: tempProgress,
            rating: tempRating,
            notes: tempNotes,
            completed: false  // ← Keep as incomplete until submission
          };
        }
        return book;
      });
      
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      
      // 🔥 NEW: Show submission popup instead of just saving
      closeBookModal();
      setShowSubmissionPopup(true);  // ← This triggers the submission workflow
      setIsSaving(false);
      return; // Exit early - don't show regular success message
    }
    
    // Regular progress save (not at 100% or already completed)
    const updatedBookshelf = studentData.bookshelf.map(book => {
      if (book.bookId === selectedBook.bookId) {
        return {
          ...book,
          currentProgress: tempProgress,
          rating: tempRating,
          notes: tempNotes,
          completed: book.completed  // Keep existing completion status
        };
      }
      return book;
    });
    
    await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
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
      
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
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
// 🔥 NEW: Handle quiz submission path
const handleQuizSubmission = async () => {
  if (!selectedBook) return;
  
  try {
    // Check if parent code is required and valid
    const requiredParentCode = studentData.parentQuizCode || '';
    
    if (!parentCode) {
      // Show parent code input - quiz modal will handle this
      setShowQuizModal(true);
      setShowSubmissionPopup(false);
      return;
    }
    
    if (parentCode !== requiredParentCode) {
      setShowSuccess('❌ Incorrect parent code. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }
    
    // Load quiz questions for this book
    const quizRef = doc(db, 'quizzes', selectedBook.bookId);
    const quizDoc = await getDoc(quizRef);
    
    if (!quizDoc.exists()) {
      setShowSuccess('❌ Quiz not available for this book yet.');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }
    
    const quizData = quizDoc.data();
    const allQuestions = quizData.questions || [];
    
    // Select 10 random questions from 20
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 10);
    
    setQuizQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setQuizAnswers([]);
    setShowQuizModal(true);
    setShowSubmissionPopup(false);
    
  } catch (error) {
    console.error('❌ Error loading quiz:', error);
    setShowSuccess('❌ Error loading quiz. Please try again.');
    setTimeout(() => setShowSuccess(''), 3000);
  }
};

// 🔥 NEW: Handle admin approval submission path
const handleBookSubmission = async (submissionType) => {
  if (!selectedBook || !studentData) return;
  
  setIsSaving(true);
  try {
    // Create submission record for admin approval
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
    
    // Add to admin approval queue (you can implement this collection)
    // For now, we will mark the book as submitted in student data
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
    
    await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
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

// 🔥 NEW: Handle quiz completion and grading
const handleQuizComplete = async (answers) => {
  if (!selectedBook || !quizQuestions.length) return;
  
  setIsSaving(true);
  try {
    // Grade the quiz
    let correctAnswers = 0;
    quizQuestions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });
    
    const passed = correctAnswers >= 7; // 7 out of 10 to pass
    
    if (passed) {
      // Mark book as completed via quiz
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
      
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
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
      setShowSuccess(`🎉 Quiz passed! ${correctAnswers}/10 correct. Book completed!`);
      
      // TODO: Trigger saint unlock logic here
      
    } else {
      setShowQuizModal(false);
      setShowSuccess(`❌ Quiz failed. ${correctAnswers}/10 correct. Need 7+ to pass. Try again in 24 hours.`);
    }
    
    setTimeout(() => setShowSuccess(''), 4000);
    
  } catch (error) {
    console.error('❌ Error completing quiz:', error);
    setShowSuccess('❌ Error processing quiz. Please try again.');
    setTimeout(() => setShowSuccess(''), 3000);
  }
  
  setIsSaving(false);
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading your bookshelf...</p>
        </div>
      </div>
    );
  }

  const bookshelf = studentData.bookshelf || [];
  const totalBooks = bookshelf.length;
  
  // Always 4 books per shelf
  const booksPerShelf = 4;
  const shelves = [];
  for (let i = 0; i < bookshelf.length; i += booksPerShelf) {
    shelves.push(bookshelf.slice(i, i + booksPerShelf));
  }
  // Add empty shelves only if we have books
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
        // REFINED TILING - sweet spot for mobile
        backgroundImage: `url(${decorativeOverlay})`,
        backgroundSize: '400px', // Perfect balance for mobile
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
        backgroundColor: currentTheme.background
      }}>
        
        {/* SUBTLE OVERLAY to reduce wallpaper intensity */}
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
        
        {/* EXTRA SLIM HEADER */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px', // Even slimmer
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Back Arrow */}
          <button
            onClick={() => router.push('/student-dashboard')}
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

          {/* CENTERED TITLE - SMALLER FONT */}
          <h1 style={{
            fontSize: '24px',     // Smaller title font
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

          {/* Settings Icon */}
          <button
            onClick={() => router.push('/student-settings')}
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
            ⚙️
          </button>
        </div>

        {/* MAIN CONTENT - PHONE SCREEN OPTIMIZED */}
        <div style={{
          padding: '15px',
          minHeight: 'calc(100vh - 120px)',
          position: 'relative',
          zIndex: 10 // Above overlay
        }}>
          {bookshelf.length === 0 ? (
            // Empty Bookshelf
            <div style={{
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
                fontSize: '16px',   // Smaller heading
                fontWeight: '400',
                color: currentTheme.textPrimary,
                marginBottom: '8px',
                fontFamily: 'Didot, "Times New Roman", serif' // Didot for headings
              }}>
                Your bookshelf is empty
              </h2>
              <p style={{ 
                fontSize: '13px',   // Smaller body text
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
                  padding: '10px 20px',  // Slightly smaller button
                  borderRadius: '12px',
                  fontSize: '13px',      // Smaller button text
                  fontWeight: '500',
                  cursor: 'pointer',
                  minHeight: '40px',     // Smaller button height
                  fontFamily: 'system-ui, -apple-system, sans-serif', // System fonts for UI
                  letterSpacing: '0.3px'
                }}
              >
                Browse Books
              </button>
            </div>
          ) : (
            // CLOSE SHELVES - FIT ON PHONE SCREEN
            <div style={{
              maxWidth: '350px',
              margin: '0 auto'
            }}>
              {shelves.map((shelf, shelfIndex) => (
                <div key={shelfIndex} style={{ 
                  position: 'relative',
                  marginBottom: '12px' // SUPER close spacing
                }}>
                  {/* SMALL BOOKS */}
                  <div style={{
                    height: '98px', // Accommodate slightly larger books
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
                      
                      return (
                        <button
                          key={book.bookId}
                          onClick={() => openBookModal(book)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            padding: 0
                          }}
                        >
                          {/* SLIGHTLY LARGER BOOK COVER */}
                          <div style={{
                            width: '100%',
                            maxWidth: '68px', // Slightly larger books
                            height: '88px',   // Proportionally taller
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
                            
                            {/* Progress bar */}
                            <div style={{
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
                            
                            {/* KEEP Audio Badge */}
                            {book.format === 'audiobook' && (
                              <div style={{
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
                            
                            {/* Completion Badge */}
                            {book.completed && (
                              <div style={{
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
                    
                    {/* Empty slots */}
                    {Array(booksPerShelf - shelf.length).fill(null).map((_, emptyIndex) => (
                      <div
                        key={`empty-${shelfIndex}-${emptyIndex}`}
                        style={{
                          width: '100%',
                          maxWidth: '68px',  // Match new book size
                          height: '88px',    // Match new book height
                          margin: '0 auto'
                        }}
                      />
                    ))}
                  </div>

                  {/* THICKER CSS SHELF WITH INSET SHADOW */}
                  <div style={{
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

        {/* Modal and other components */}
        {showBookModal && selectedBook && (() => {
          const colorPalette = getCategoryColorPalette(selectedBook.details);
          const total = getBookTotal(selectedBook);
          
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
                {/* Book modal content */}
                <div style={{
                  position: 'relative',
                  padding: '15px 15px 10px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px 20px 0 0',
                  textAlign: 'center'
                }}>
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
                    border: '2px solid white'
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
                  </div>
                </div>

                <div style={{
                  backgroundColor: colorPalette.background,
                  padding: '15px',
                  borderRadius: '0 0 20px 20px',
                  border: `2px solid ${colorPalette.primary}20`,
                  borderTop: 'none'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '400',
                      color: colorPalette.textPrimary,
                      margin: '0 0 4px 0',
                      lineHeight: '1.2',
                      fontFamily: 'Didot, "Times New Roman", serif' // Didot for book titles
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

                    <button
                      onClick={() => {
                        closeBookModal();
                        router.push('/healthy-habits');
                      }}
                      style={{
                        backgroundColor: colorPalette.primary,
                        color: colorPalette.textPrimary,
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        width: '100%',
                        minHeight: '36px',
                        fontFamily: 'system-ui, -apple-system, sans-serif' // System fonts for buttons
                      }}
                    >
                      📖 Start Reading
                    </button>
                  </div>

                  {/* Progress section */}
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
                    </label>
                    
                    <input
                      type="range"
                      min="0"
                      max={total}
                      value={tempProgress}
                      onChange={(e) => setTempProgress(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: `linear-gradient(to right, ${colorPalette.primary} 0%, ${colorPalette.primary} ${(tempProgress/total)*100}%, #E0E0E0 ${(tempProgress/total)*100}%, #E0E0E0 100%)`,
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

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
                      Rating
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      gap: '3px', 
                      justifyContent: 'center'
                    }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setTempRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: star <= tempRating ? '#FFD700' : '#E0E0E0',
                            padding: '1px',
                            minHeight: '28px',
                            minWidth: '28px'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Notes..."
                      style={{
                        width: '100%',
                        height: '50px',
                        padding: '8px',
                        border: `1px solid ${colorPalette.primary}40`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        backgroundColor: '#FFFFFF',
                        color: colorPalette.textPrimary,
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        minHeight: '36px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      {isSaving ? 'Saving...' : '💾 Save'}
                    </button>
                    <button
                      onClick={() => deleteBook(selectedBook.bookId)}
                      disabled={isSaving}
                      style={{
                        backgroundColor: colorPalette.textSecondary,
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                        minHeight: '36px',
                        fontWeight: '500',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 🎯 SUBMISSION POPUP - Choose how to complete book */}
        {showSubmissionPopup && selectedBook && (() => {
          const colorPalette = getCategoryColorPalette(selectedBook.details);
          
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
    
    {/* Header */}
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
        How would you like to show you have read "{selectedBook.details.title}"?
      </p>
    </div>

    {/* Submission Options */}
    <div style={{ padding: '20px' }}>
      
      {/* Quiz Option - Always Available */}
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

      {/* Admin-defined submission options */}
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

      {/* Cancel Button */}
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
{/* 🧠 QUIZ MODAL - 10 random questions from 20 */}
{showQuizModal && quizQuestions.length > 0 && (() => {
  const colorPalette = getCategoryColorPalette(selectedBook.details);
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
  
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
        
        {/* Quiz Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`,
          borderRadius: '20px 20px 0 0',
          padding: '20px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ 
            fontSize: '14px', 
            opacity: 0.9,
            marginBottom: '8px',
            fontFamily: 'Avenir, system-ui, sans-serif'
          }}>
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
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

        {/* Quiz Content */}
        <div style={{ padding: '24px' }}>
          
          {/* Parent Code Input - Show on first question only */}
          {currentQuestionIndex === 0 && !parentCode && (
            <div style={{ 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: colorPalette.background,
              borderRadius: '12px',
              border: `2px solid ${colorPalette.primary}30`
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colorPalette.textPrimary,
                display: 'block',
                marginBottom: '8px',
                fontFamily: 'Avenir, system-ui, sans-serif'
              }}>
                🔐 Parent Code Required
              </label>
              <input
                type="text"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value.toUpperCase())}
                placeholder="Enter parent quiz code"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colorPalette.primary}40`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em'
                }}
                maxLength={20}
              />
              <p style={{
                fontSize: '12px',
                color: colorPalette.textSecondary,
                margin: '8px 0 0 0',
                textAlign: 'center',
                fontFamily: 'Avenir, system-ui, sans-serif'
              }}>
                Ask your parent for the quiz code
              </p>
            </div>
          )}

          {/* Question */}
          {(parentCode || currentQuestionIndex > 0) && (
            <>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colorPalette.textPrimary,
                marginBottom: '20px',
                lineHeight: '1.4',
                fontFamily: 'Avenir, system-ui, sans-serif'
              }}>
                {currentQuestion.question}
              </div>

              {/* Answer Options */}
              <div style={{ marginBottom: '24px' }}>
                {currentQuestion.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => {
                      const newAnswers = [...quizAnswers];
                      newAnswers[currentQuestionIndex] = option;
                      setQuizAnswers(newAnswers);
                    }}
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
                      lineHeight: '1.3'
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

              {/* Navigation Buttons */}
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
                      fontFamily: 'Avenir, system-ui, sans-serif'
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
                      fontFamily: 'Avenir, system-ui, sans-serif'
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
                      fontFamily: 'Avenir, system-ui, sans-serif'
                    }}
                  >
                    {isSaving ? 'Submitting...' : '✓ Finish Quiz'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cancel Quiz Button */}
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
            Cancel Quiz
          </button>
        </div>
      </div>
    </div>
  );
})()}
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
            zIndex: 1001, // Above everything
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
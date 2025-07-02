// pages/student-bookshelf.js - PERFECT CSS SHELVES + DECORATIVE OVERLAYS
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, getSchoolNominees, updateStudentData } from '../lib/firebase';
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
  
  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false);

  // Theme definitions - NOW WITH LITTLE LUMINARIES! ✨
  const themes = {
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
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#FF8C00',
      background: '#F5F5DC',
      surface: '#FFE4B5',
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
      primary: '#66CDAA',
      secondary: '#98FB98',
      accent: '#AFEEEE',
      background: '#F0FFF0',
      surface: '#E0FFE0',
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
      primary: '#90EE90',
      secondary: '#F0FFF0',
      accent: '#98FB98',
      background: '#FFFFF0',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F',
      textSecondary: '#556B2F'
    },
    little_luminaries: {
      name: 'Little Luminaries',
      primary: '#FFD700',
      secondary: '#C0C0C0',
      accent: '#F8F8FF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      textPrimary: '#FFD700',
      textSecondary: '#C0C0C0'
    }
  };

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadBookshelfData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user]);

  const loadBookshelfData = async () => {
    try {
      console.log('📚 Loading bookshelf data...');
      
      const firebaseStudentData = await getStudentData(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      const selectedTheme = firebaseStudentData.selectedTheme || 'classic_lux';
      setCurrentTheme(themes[selectedTheme]);
      
      if (firebaseStudentData.dioceseId && firebaseStudentData.schoolId) {
        const schoolNominees = await getSchoolNominees(
          firebaseStudentData.dioceseId, 
          firebaseStudentData.schoolId
        );
        setNominees(schoolNominees);
        console.log('✅ Loaded nominees for bookshelf display');
      }
      
    } catch (error) {
      console.error('❌ Error loading bookshelf:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  };

  // Get book details from nominees
  const getBookDetails = (bookId) => {
    return nominees.find(book => book.id === bookId);
  };

  // Get proper total pages/minutes from nominee data
  const getBookTotal = (bookshelfBook) => {
    const bookDetails = getBookDetails(bookshelfBook.bookId);
    if (!bookDetails) return 0;
    
    if (bookshelfBook.format === 'audiobook') {
      return bookDetails.totalMinutes || 0;
    } else {
      return bookDetails.pages || bookDetails.pageCount || 0;
    }
  };

  // Category colors for containers
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
    
    // Default to theme colors
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
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedBook.bookId) {
          const total = getBookTotal(book);
          const isNowCompleted = tempProgress >= total && total > 0;
          
          return {
            ...book,
            currentProgress: tempProgress,
            rating: tempRating,
            notes: tempNotes,
            completed: isNowCompleted
          };
        }
        return book;
      });
      
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      
      const total = getBookTotal(selectedBook);
      const isCompleted = tempProgress >= total && total > 0;
      
      if (isCompleted && !selectedBook.completed) {
        setShowSuccess(`🎉 ${selectedBook.details.title} completed!`);
      } else {
        setShowSuccess('📚 Progress saved!');
      }
      
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
          <p style={{ color: '#223848' }}>Loading your bookshelf...</p>
        </div>
      </div>
    );
  }

  const bookshelf = studentData.bookshelf || [];
  const booksPerShelf = isMobile ? 3 : 4;
  const shelves = [];
  for (let i = 0; i < bookshelf.length; i += booksPerShelf) {
    shelves.push(bookshelf.slice(i, i + booksPerShelf));
  }
  while (shelves.length < 5) {
    shelves.push([]);
  }

  // Get decorative overlay path
  const decorativeOverlay = `/bookshelves/${studentData.selectedTheme || 'classic_lux'}.png`;

  return (
    <>
      <Head>
        <title>My Bookshelf - Lux Libris</title>
        <meta name="description" content="Track your reading progress and manage your personal book collection" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative'
      }}>
        {/* BACK ARROW */}
        <button
          onClick={() => router.push('/student-dashboard')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 20,
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            color: currentTheme.textPrimary
          }}
        >
          ←
        </button>

        {/* MY BOOKSHELF HEADER */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 20px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <h1 style={{ 
            color: currentTheme.textPrimary, 
            fontSize: '18px',
            margin: 0,
            fontWeight: '600'
          }}>
            📚 My Bookshelf
          </h1>
        </div>

        {/* BOOKSHELF CONTAINER WITH WALLPAPER BACKGROUND */}
        <div style={{
          position: 'relative',
          minHeight: '100vh',
          padding: '80px 20px 20px',
          backgroundImage: `url(${decorativeOverlay})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}>
          {bookshelf.length === 0 ? (
            // Empty Bookshelf
            <div style={{
              textAlign: 'center',
              padding: '120px 20px',
              color: currentTheme.textSecondary,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '20px',
              margin: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
              <h2 style={{
                fontSize: '20px',
                marginBottom: '8px',
                color: currentTheme.textPrimary
              }}>
                Your bookshelf is empty
              </h2>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                Add books from the nominees page to start reading!
              </p>
              <button
                onClick={() => router.push('/student-nominees')}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: currentTheme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Browse Books
              </button>
            </div>
          ) : (
            // CSS SHELVES WITH BOOKS
            <div style={{
              position: 'relative',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {/* CSS SHELVES CONTAINER */}
              <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'calc(100vh - 100px)',
                justifyContent: 'space-evenly'
              }}>
                {shelves.map((shelf, shelfIndex) => (
                  <div key={shelfIndex} style={{ position: 'relative' }}>
                    {/* SHELF SPACE FOR BOOKS */}
                    <div style={{
                      height: '180px',
                      padding: '0 30px',
                      marginBottom: '8px',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${booksPerShelf}, 1fr)`,
                      gap: isMobile ? '8px' : '12px',
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
                            {/* CLEAN BOOK COVER - NO MORE UGLY TRANSPARENT OVERLAY! */}
                            <div style={{
                              width: '100%',
                              height: '160px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#F5F5F5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                              transition: 'transform 0.2s ease',
                              transform: 'translateZ(0)'
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05) translateZ(0)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05) translateZ(0)';
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
                                    objectFit: 'contain'
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: '32px' }}>📚</span>
                              )}
                              
                              {/* Progress bar */}
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '6px',
                                backgroundColor: 'rgba(0,0,0,0.5)'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${progressPercent}%`,
                                  backgroundColor: progressColor,
                                  transition: 'width 0.3s ease',
                                  boxShadow: progressPercent > 0 ? '0 0 4px rgba(255,255,255,0.5)' : 'none'
                                }} />
                              </div>
                              
                              {/* Format Badge */}
                              {book.format === 'audiobook' && (
                                <div style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px'
                                }}>
                                  🎧
                                </div>
                              )}
                              
                              {/* Completion Badge */}
                              {book.completed && (
                                <div style={{
                                  position: 'absolute',
                                  top: '4px',
                                  left: '4px',
                                  backgroundColor: '#4CAF50',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
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
                            height: '160px'
                          }}
                        />
                      ))}
                    </div>

                    {/* SIMPLE CSS SHELF */}
                    <div style={{
                      height: '8px',
                      margin: '0 20px',
                      backgroundColor: currentTheme.primary,
                      borderRadius: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      position: 'relative',
                      zIndex: 5
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PERFECT BOOK DETAIL MODAL - Same as before */}
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
                maxWidth: '380px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                {/* LARGE CENTERED BOOK COVER */}
                <div style={{
                  position: 'relative',
                  padding: '30px 30px 20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px 20px 0 0',
                  textAlign: 'center'
                }}>
                  {/* Close X */}
                  <button
                    onClick={closeBookModal}
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      backgroundColor: '#FF4444',
                      color: 'white',
                      border: '3px solid white',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>

                  {/* ENLARGED BOOK COVER */}
                  <div style={{
                    width: '200px',
                    height: '300px',
                    margin: '0 auto',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                    border: '4px solid white'
                  }}>
                    {selectedBook.details.coverImageUrl ? (
                      <img 
                        src={selectedBook.details.coverImageUrl} 
                        alt={selectedBook.details.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '80px' }}>📚</span>
                    )}
                  </div>
                </div>

                {/* COLOR CONTAINER WITH ALL INFO */}
                <div style={{
                  backgroundColor: colorPalette.background,
                  padding: '30px',
                  borderRadius: '0 0 20px 20px',
                  border: `3px solid ${colorPalette.primary}20`,
                  borderTop: 'none'
                }}>
                  {/* Title and Author */}
                  <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <h2 style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: colorPalette.textPrimary,
                      margin: '0 0 8px 0',
                      lineHeight: '1.2'
                    }}>
                      {selectedBook.details.title}
                    </h2>
                    <p style={{
                      fontSize: '16px',
                      color: colorPalette.textSecondary,
                      margin: '0 0 20px 0',
                      fontStyle: 'italic'
                    }}>
                      by {selectedBook.details.authors}
                    </p>

                    {/* Start Reading Button */}
                    <button
                      onClick={() => {
                        closeBookModal();
                        router.push('/healthy-habits');
                      }}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '25px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        minHeight: '50px',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                      }}
                    >
                      📖 Start Reading Session
                    </button>
                  </div>

                  {/* Progress Slider */}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colorPalette.textPrimary,
                      display: 'block',
                      marginBottom: '12px'
                    }}>
                      {selectedBook.format === 'audiobook' ? 'Minutes Listened' : 'Pages Read'}
                    </label>
                    
                    <input
                      type="range"
                      min="0"
                      max={total}
                      value={tempProgress}
                      onChange={(e) => setTempProgress(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        height: '10px',
                        borderRadius: '5px',
                        background: `linear-gradient(to right, ${colorPalette.primary} 0%, ${colorPalette.primary} ${(tempProgress/total)*100}%, #E0E0E0 ${(tempProgress/total)*100}%, #E0E0E0 100%)`,
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        cursor: 'pointer',
                        marginBottom: '8px'
                      }}
                    />
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: colorPalette.textSecondary
                    }}>
                      <span><strong>{tempProgress}</strong> current</span>
                      <span><strong>{total}</strong> total {selectedBook.format === 'audiobook' ? 'minutes' : 'pages'}</span>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colorPalette.textPrimary,
                      display: 'block',
                      marginBottom: '12px'
                    }}>
                      Your Rating
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      justifyContent: 'center'
                    }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setTempRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '32px',
                            cursor: 'pointer',
                            color: star <= tempRating ? '#FFD700' : '#E0E0E0',
                            padding: '4px',
                            minHeight: '44px',
                            minWidth: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colorPalette.textPrimary,
                      display: 'block',
                      marginBottom: '12px'
                    }}>
                      Notes &amp; Thoughts
                    </label>
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="What did you think about this book?"
                      style={{
                        width: '100%',
                        height: '80px',
                        padding: '15px',
                        border: `3px solid ${colorPalette.primary}40`,
                        borderRadius: '12px',
                        fontSize: '16px',
                        backgroundColor: '#FFFFFF',
                        color: colorPalette.textPrimary,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <button
                      onClick={saveBookProgress}
                      disabled={isSaving}
                      style={{
                        backgroundColor: colorPalette.primary,
                        color: colorPalette.textPrimary,
                        border: 'none',
                        padding: '16px 24px',
                        borderRadius: '25px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                        minHeight: '50px',
                        boxShadow: `0 4px 12px ${colorPalette.primary}40`
                      }}
                    >
                      {isSaving ? 'Saving...' : '💾 Save Progress'}
                    </button>
                    <button
                      onClick={() => deleteBook(selectedBook.bookId)}
                      disabled={isSaving}
                      style={{
                        backgroundColor: '#FF6B6B',
                        color: 'white',
                        border: 'none',
                        padding: '16px 24px',
                        borderRadius: '25px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                        minHeight: '50px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)'
                      }}
                    >
                      🗑️ Remove from Bookshelf
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Success Messages */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: currentTheme.textPrimary,
            padding: '15px 30px',
            borderRadius: '25px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            zIndex: 1001,
            fontSize: '16px',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showSuccess}
          </div>
        )}

        {/* Custom Styles */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Perfect slider styling */
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${currentTheme?.primary || '#ADD4EA'};
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          }
          
          input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${currentTheme?.primary || '#ADD4EA'};
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
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
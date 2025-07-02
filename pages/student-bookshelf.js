// pages/student-bookshelf.js - Complete bookshelf with themed backgrounds and interactive features
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
  const [showComingSoon, setShowComingSoon] = useState('');

  // Theme definitions (same as other pages)
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
      console.log('📚 Loading bookshelf data...');
      
      // Get student data with bookshelf
      const firebaseStudentData = await getStudentData(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      // Set theme
      const selectedTheme = firebaseStudentData.selectedTheme || 'classic_lux';
      setCurrentTheme(themes[selectedTheme]);
      
      // Load school nominees to get book details
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

  const getBookDetails = (bookId) => {
    return nominees.find(book => book.id === bookId);
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
    const total = book.format === 'audiobook' ? book.totalMinutes : book.totalPages;
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
      // Find the book in the bookshelf array
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedBook.bookId) {
          const total = book.format === 'audiobook' ? book.totalMinutes : book.totalPages;
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
      
      // Update Firebase
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      // Update local state
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      
      // Check if book is now complete for submission
      const total = selectedBook.format === 'audiobook' ? selectedBook.totalMinutes : selectedBook.totalPages;
      const isCompleted = tempProgress >= total && total > 0;
      
      if (isCompleted && !selectedBook.completed) {
        setShowSuccess(`🎉 ${selectedBook.details.title} completed! Ready to submit!`);
      } else {
        setShowSuccess('📚 Progress saved!');
      }
      
      setTimeout(() => setShowSuccess(''), 3000);
      closeBookModal();
      
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
      setTimeout(() => setShowSuccess(''), 3000);
      closeBookModal();
      
    } catch (error) {
      console.error('❌ Error deleting book:', error);
      setShowSuccess('❌ Error removing book. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    
    setIsSaving(false);
  };

  // Updated handleTabClick function
  const handleTabClick = (tabName) => {
    if (tabName === 'Dashboard') {
      router.push('/student-dashboard');
    } else if (tabName === 'Nominees') {
      router.push('/student-nominees');
    } else if (tabName === 'Bookshelf') {
      // Already on bookshelf, maybe add a subtle feedback
      setShowComingSoon('You\'re already here! 📍');
      setTimeout(() => setShowComingSoon(''), 1500);
    } else {
      setShowComingSoon(`${tabName} coming soon! 🚀`);
      setTimeout(() => setShowComingSoon(''), 3000);
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
        <div className="bottom-nav" style={{ textAlign: 'center' }}>
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

  // Organize books into shelves (4 books per shelf)
  const shelves = [];
  for (let i = 0; i < bookshelf.length; i += 4) {
    shelves.push(bookshelf.slice(i, i + 4));
  }

  // Fill up to 5 shelves (empty shelves for visual consistency)
  while (shelves.length < 5) {
    shelves.push([]);
  }

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
        paddingBottom: '100px' // Space for bottom navigation
      }}>
        {/* Bookshelf Display */}
        <div style={{
          position: 'relative',
          minHeight: '100vh',
          backgroundImage: `url(/bookshelves/${studentData.selectedTheme || 'classic_lux'}.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          {/* Books on Shelves */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            padding: '40px 20px'
          }}>
            {bookshelf.length === 0 ? (
              // Empty Bookshelf
              <div className="modal-content" style={{
                textAlign: 'center',
                padding: '120px 20px',
                color: currentTheme.textSecondary
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
                    cursor: 'pointer'
                  }}
                >
                  Browse Books
                </button>
              </div>
            ) : (
              // Books Display with proper shelf positioning
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                justifyContent: 'space-evenly',
                paddingTop: '60px'
              }}>
                {shelves.map((shelf, shelfIndex) => (
                  <div
                    key={shelfIndex}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      padding: '0 40px',
                      height: '120px',
                      alignItems: 'end'
                    }}
                  >
                    {shelf.map((book, bookIndex) => {
                      const bookDetails = getBookDetails(book.bookId);
                      if (!bookDetails) return null;
                      
                      const progressPercent = getProgressPercentage(book);
                      const progressColor = getProgressColor(book.currentProgress, 
                        book.format === 'audiobook' ? book.totalMinutes : book.totalPages);
                      
                      return (
                        <button
                          key={book.bookId}
                          onClick={() => openBookModal(book)}
                          className="book-cover interactive"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            padding: 0
                          }}
                        >
                          {/* Book Cover */}
                          <div style={{
                            width: '100%',
                            height: '90px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: `${currentTheme.primary}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            transition: 'transform 0.2s ease'
                          }}
                          onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
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
                            
                            {/* Progress Overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '4px',
                              backgroundColor: 'rgba(0,0,0,0.3)'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${progressPercent}%`,
                                backgroundColor: progressColor,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            
                            {/* Format Badge */}
                            {book.format === 'audiobook' && (
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px'
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
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px'
                              }}>
                                ✓
                              </div>
                            )}
                          </div>
                          
                          {/* Book Title */}
                          <div style={{
                            fontSize: '9px',
                            color: currentTheme.textPrimary,
                            marginTop: '4px',
                            textAlign: 'center',
                            lineHeight: '1.1',
                            maxHeight: '20px',
                            overflow: 'hidden'
                          }}>
                            {bookDetails.title}
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Empty slots */}
                    {Array(4 - shelf.length).fill(null).map((_, emptyIndex) => (
                      <div
                        key={`empty-${shelfIndex}-${emptyIndex}`}
                        style={{
                          width: '100%',
                          height: '90px'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Book Detail Modal */}
        {showBookModal && selectedBook && (
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
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: 'clamp(20px, 5vw, 28px)',
              maxWidth: '450px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: 'clamp(18px, 4vw, 20px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  margin: 0,
                  lineHeight: '1.2',
                  flex: 1,
                  paddingRight: '12px'
                }}>
                  {selectedBook.details.title}
                </h2>
                <button
                  onClick={closeBookModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: currentTheme.textSecondary,
                    cursor: 'pointer',
                    padding: '8px',
                    minHeight: '44px',
                    minWidth: '44px',
                    touchAction: 'manipulation',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Book Cover - Larger */}
              <div style={{
                width: 'clamp(140px, 35vw, 160px)',
                height: 'clamp(210px, 52.5vw, 240px)',
                margin: '0 auto 24px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: `${currentTheme.primary}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                  <span style={{ fontSize: 'clamp(48px, 12vw, 64px)' }}>📚</span>
                )}
              </div>

              {/* Start Reading Session Button */}
              <button
                onClick={() => {
                  closeBookModal();
                  router.push('/healthy-habits');
                }}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '24px',
                  minHeight: '44px',
                  touchAction: 'manipulation'
                }}
              >
                📖 Start Reading Session
              </button>

              {/* Progress Slider */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  {selectedBook.format === 'audiobook' ? 'Minutes Listened' : 'Pages Read'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="range"
                    min="0"
                    max={selectedBook.format === 'audiobook' ? selectedBook.totalMinutes : selectedBook.totalPages}
                    value={tempProgress}
                    onChange={(e) => {
                      e.preventDefault();
                      setTempProgress(parseInt(e.target.value));
                    }}
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: '#E0E0E0',
                      outline: 'none',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: currentTheme.textSecondary,
                  marginTop: '8px'
                }}>
                  <span>{tempProgress}</span>
                  <span>
                    {selectedBook.format === 'audiobook' ? 
                      `${selectedBook.totalMinutes} minutes` : 
                      `${selectedBook.totalPages} pages`
                    }
                  </span>
                </div>
              </div>

              {/* Star Rating */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Your Rating
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={(e) => {
                        e.preventDefault();
                        setTempRating(star);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 'clamp(28px, 7vw, 36px)',
                        cursor: 'pointer',
                        color: star <= tempRating ? '#FFD700' : '#E0E0E0',
                        padding: '4px',
                        minHeight: '48px',
                        minWidth: '48px',
                        touchAction: 'manipulation',
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
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Notes &amp; Thoughts
                </label>
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="What did you think about this book?"
                  style={{
                    width: '100%',
                    height: 'clamp(80px, 20vw, 100px)',
                    padding: '12px',
                    border: `2px solid ${currentTheme.primary}50`,
                    borderRadius: '8px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    backgroundColor: currentTheme.background,
                    color: currentTheme.textPrimary,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    touchAction: 'manipulation',
                    boxSizing: 'border-box'
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
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    minHeight: '48px',
                    touchAction: 'manipulation'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Progress'}
                </button>
                <button
                  onClick={() => deleteBook(selectedBook.bookId)}
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#FF6B6B',
                    color: 'white',
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    minHeight: '48px',
                    touchAction: 'manipulation',
                    fontWeight: '600'
                  }}
                >
                  🗑️ Remove Book
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
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
            { icon: '▦', label: 'Dashboard', active: false, route: 'Dashboard' },
            { icon: '▢', label: 'Nominees', active: false, route: 'Nominees' },
            { icon: '▥', label: 'Bookshelf', active: true, route: 'Bookshelf' },
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
              onTouchStart={(e) => {
                if (!tab.active) {
                  e.target.style.backgroundColor = `${currentTheme.primary}10`;
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onTouchEnd={(e) => {
                if (!tab.active) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
              onMouseOver={(e) => {
                if (!tab.active) {
                  e.target.style.backgroundColor = `${currentTheme.primary}10`;
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!tab.active) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }
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

        {/* Success/Coming Soon Messages */}
        {(showSuccess || showComingSoon) && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: currentTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showSuccess || showComingSoon}
          </div>
        )}

        {/* Loading Animation CSS */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Custom slider styling - Mobile optimized */
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            cursor: pointer;
            background: transparent;
          }
          
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: clamp(24px, 6vw, 28px);
            height: clamp(24px, 6vw, 28px);
            border-radius: 50%;
            background: ${currentTheme.primary};
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            touch-action: manipulation;
          }
          
          input[type="range"]::-moz-range-thumb {
            width: clamp(24px, 6vw, 28px);
            height: clamp(24px, 6vw, 28px);
            border-radius: 50%;
            background: ${currentTheme.primary};
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            touch-action: manipulation;
            -moz-appearance: none;
          }
          
          input[type="range"]::-webkit-slider-track {
            background: #E0E0E0;
            height: 8px;
            border-radius: 4px;
          }
          
          input[type="range"]::-moz-range-track {
            background: #E0E0E0;
            height: 8px;
            border-radius: 4px;
            border: none;
          }
          
          /* Enhanced mobile touch optimizations */
          button {
            min-height: 44px !important;
            min-width: 44px !important;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Prevent zoom on inputs - iOS Safari fix */
          @media screen and (max-width: 480px) {
            input, textarea, select {
              font-size: 16px !important;
              -webkit-appearance: none;
              border-radius: 0;
            }
          }
          
          /* Safe area handling for devices with notches */
          @supports (padding: max(0px)) {
            .bottom-nav {
              padding-bottom: max(8px, env(safe-area-inset-bottom));
            }
          }
          
          /* Smooth scrolling and momentum */
          * {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Better touch feedback */
          button:active {
            transform: scale(0.98);
          }
          
          /* Modal optimizations */
          @media (max-height: 600px) {
            .modal-content {
              padding: 16px !important;
            }
          }
          
          /* Disable text selection on interactive elements */
          button, .interactive {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Performance optimizations */
          .book-cover {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            will-change: transform;
          }
        `}</style>
      </div>
    </>
  );
}
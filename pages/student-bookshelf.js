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
    setTempRating(bookshelfBook.rating);
    setTempNotes(bookshelfBook.notes);
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
        // TODO: Show submission options modal
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
  const totalBooks = bookshelf.length;
  const completedBooks = bookshelf.filter(book => book.completed).length;

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
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '20px'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.secondary}CC)`,
          padding: '20px 24px',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={() => router.back()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentTheme.textPrimary,
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ←
              </button>
              <h1 style={{
                fontFamily: 'Didot, serif',
                fontSize: '20px',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                My Bookshelf
              </h1>
            </div>
            <div style={{
              fontSize: '14px',
              color: currentTheme.textPrimary,
              backgroundColor: `${currentTheme.primary}30`,
              padding: '4px 12px',
              borderRadius: '12px'
            }}>
              {totalBooks} books
            </div>
          </div>
        </div>

        {/* Bookshelf Stats */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: currentTheme.primary
                }}>
                  {totalBooks}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Total Books
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#4CAF50'
                }}>
                  {completedBooks}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Completed
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#FF9800'
                }}>
                  {totalBooks - completedBooks}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  In Progress
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookshelf Display */}
        <div style={{
          position: 'relative',
          minHeight: '400px',
          margin: '0 20px'
        }}>
          {/* Themed Background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(/bookshelves/${studentData.selectedTheme || 'classic_lux'}.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '20px',
            opacity: 0.9
          }} />

          {/* Books on Shelves */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            padding: '20px'
          }}>
            {totalBooks === 0 ? (
              // Empty Bookshelf
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
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
              // Books Display (5 shelves, 4 books each)
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '40px'
              }}>
                {shelves.map((shelf, shelfIndex) => (
                  <div
                    key={shelfIndex}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '12px',
                      minHeight: '120px',
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
                            height: '100px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: `${currentTheme.primary}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            transition: 'transform 0.2s ease'
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
                              <span style={{ fontSize: '24px' }}>📚</span>
                            )}
                            
                            {/* Progress Overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '6px',
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
                                fontSize: '10px'
                              }}>
                                ✓
                              </div>
                            )}
                          </div>
                          
                          {/* Book Title */}
                          <div style={{
                            fontSize: '10px',
                            color: currentTheme.textPrimary,
                            marginTop: '4px',
                            textAlign: 'center',
                            lineHeight: '1.2',
                            maxHeight: '24px',
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
                          height: '100px'
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
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: 'clamp(16px, 4vw, 24px)',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  fontSize: 'clamp(16px, 4vw, 18px)',
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

              {/* Book Cover */}
              <div style={{
                width: 'clamp(100px, 25vw, 120px)',
                height: 'clamp(150px, 37.5vw, 180px)',
                margin: '0 auto 20px',
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
                  <span style={{ fontSize: 'clamp(32px, 8vw, 48px)' }}>📚</span>
                )}
              </div>

              {/* Progress Slider */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  {selectedBook.format === 'audiobook' ? 'Minutes Listened' : 'Pages Read'}
                </label>
                <input
                  type="range"
                  min="0"
                  max={selectedBook.format === 'audiobook' ? selectedBook.totalMinutes : selectedBook.totalPages}
                  value={tempProgress}
                  onChange={(e) => setTempProgress(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#E0E0E0',
                    outline: 'none',
                    marginBottom: '8px',
                    touchAction: 'manipulation'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: currentTheme.textSecondary
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Your Rating
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  marginBottom: '8px',
                  justifyContent: 'center'
                }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setTempRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 'clamp(24px, 6vw, 32px)',
                        cursor: 'pointer',
                        color: star <= tempRating ? '#FFD700' : '#E0E0E0',
                        padding: '4px',
                        minHeight: '44px',
                        minWidth: '44px',
                        touchAction: 'manipulation',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
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
                    touchAction: 'manipulation'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="action-buttons" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={saveBookProgress}
                  disabled={isSaving}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.textPrimary,
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: '8px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    flex: '1'
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
                    padding: '14px 16px',
                    borderRadius: '8px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    minHeight: '44px',
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

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
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
            {showSuccess}
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
          }
          
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: clamp(20px, 5vw, 24px);
            height: clamp(20px, 5vw, 24px);
            border-radius: 50%;
            background: ${currentTheme.primary};
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            touch-action: manipulation;
          }
          
          input[type="range"]::-moz-range-thumb {
            width: clamp(20px, 5vw, 24px);
            height: clamp(20px, 5vw, 24px);
            border-radius: 50%;
            background: ${currentTheme.primary};
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            touch-action: manipulation;
          }
          
          /* Mobile touch optimizations */
          @media (max-width: 480px) {
            button {
              min-height: 44px !important;
              min-width: 44px !important;
            }
            
            /* Stack action buttons vertically on small screens */
            .action-buttons {
              flex-direction: column !important;
            }
            
            /* Increase touch targets on mobile */
            input[type="range"]::-webkit-slider-thumb {
              width: 28px;
              height: 28px;
            }
            
            input[type="range"]::-moz-range-thumb {
              width: 28px;
              height: 28px;
            }
          }
          
          @media (min-width: 481px) {
            /* Horizontal layout on larger screens */
            .action-buttons {
              flex-direction: row !important;
            }
          }
          
          /* Prevent zoom on inputs */
          @media screen and (max-width: 480px) {
            input, textarea, select {
              font-size: 16px !important;
            }
          }
          
          /* Smooth scrolling for better mobile experience */
          * {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </div>
    </>
  );
}
// pages/student-bookshelf.js - FIXED: Beautiful CSS bookshelf with working slider and navigation
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

  // Theme definitions
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
      
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
        bookshelf: updatedBookshelf
      });
      
      setStudentData({ ...studentData, bookshelf: updatedBookshelf });
      
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

  // FIXED: Simplified navigation handler
  const handleNavigation = (route) => {
    console.log('Navigating to:', route);
    
    switch(route) {
      case 'Dashboard':
        router.push('/student-dashboard');
        break;
      case 'Nominees':
        router.push('/student-nominees');
        break;
      case 'Bookshelf':
        setShowComingSoon('You\'re already here! 📍');
        setTimeout(() => setShowComingSoon(''), 1500);
        break;
      case 'Habits':
        router.push('/healthy-habits');
        break;
      default:
        setShowComingSoon(`${route} coming soon! 🚀`);
        setTimeout(() => setShowComingSoon(''), 3000);
    }
  };

  // FIXED: Custom Slider Component
  const CustomSlider = ({ value, onChange, min, max, label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    
    const handleSliderClick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newValue = Math.round((clickX / rect.width) * max);
      onChange(Math.max(min, Math.min(max, newValue)));
    };

    const handleSliderTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const newValue = Math.round((touchX / rect.width) * max);
      onChange(Math.max(min, Math.min(max, newValue)));
    };

    return (
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: currentTheme.textPrimary,
          display: 'block',
          marginBottom: '12px'
        }}>
          {label}
        </label>
        
        <div 
          style={{
            position: 'relative',
            height: '40px',
            cursor: 'pointer',
            padding: '16px 0'
          }}
          onClick={handleSliderClick}
          onTouchStart={handleSliderTouch}
          onTouchMove={handleSliderTouch}
        >
          {/* Slider Track */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#E0E0E0',
            borderRadius: '4px',
            transform: 'translateY(-50%)'
          }}>
            {/* Progress Fill */}
            <div style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: currentTheme.primary,
              borderRadius: '4px',
              transition: 'width 0.2s ease'
            }} />
          </div>
          
          {/* Slider Thumb */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${percentage}%`,
            width: '28px',
            height: '28px',
            backgroundColor: currentTheme.primary,
            border: '3px solid white',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }} />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: currentTheme.textSecondary,
          marginTop: '8px'
        }}>
          <span>{value}</span>
          <span>{max} {label.includes('Minutes') ? 'minutes' : 'pages'}</span>
        </div>
      </div>
    );
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

  // Organize books into shelves (4 books per shelf)
  const shelves = [];
  for (let i = 0; i < bookshelf.length; i += 4) {
    shelves.push(bookshelf.slice(i, i + 4));
  }

  // Fill up to 5 shelves for visual consistency
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
        paddingBottom: '100px'
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
          // FIXED: Beautiful CSS Bookshelf
          <div style={{
            padding: '40px 20px',
            minHeight: '100vh'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              📚 My Bookshelf
            </h1>
            
            {/* CSS Bookshelf */}
            <div className="bookshelf-container">
              {shelves.map((shelf, shelfIndex) => (
                <div key={shelfIndex} className="bookshelf-shelf">
                  {/* Shelf Wood */}
                  <div className="shelf-wood"></div>
                  
                  {/* Books on Shelf */}
                  <div className="shelf-books">
                    {shelf.map((book, bookIndex) => {
                      const bookDetails = getBookDetails(book.bookId);
                      if (!bookDetails) return null;
                      
                      const progressPercent = getProgressPercentage(book);
                      const progressColor = getProgressColor(book.currentProgress, 
                        book.format === 'audiobook' ? book.totalMinutes : book.totalPages);
                      
                      return (
                        <div
                          key={book.bookId}
                          className="book-spine"
                          onClick={() => openBookModal(book)}
                          style={{
                            backgroundImage: bookDetails.coverImageUrl ? `url(${bookDetails.coverImageUrl})` : 'none',
                            backgroundColor: bookDetails.coverImageUrl ? 'transparent' : currentTheme.primary
                          }}
                        >
                          {!bookDetails.coverImageUrl && (
                            <span style={{ fontSize: '24px' }}>📚</span>
                          )}
                          
                          {/* Progress indicator */}
                          <div className="book-progress" style={{ backgroundColor: progressColor, width: `${progressPercent}%` }}></div>
                          
                          {/* Format badge */}
                          {book.format === 'audiobook' && (
                            <div className="format-badge">🎧</div>
                          )}
                          
                          {/* Completion badge */}
                          {book.completed && (
                            <div className="completion-badge">✓</div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Empty book slots */}
                    {Array(4 - shelf.length).fill(null).map((_, emptyIndex) => (
                      <div key={`empty-${shelfIndex}-${emptyIndex}`} className="book-slot-empty"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FIXED: Book Detail Modal with working custom slider */}
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
              padding: '28px',
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
                  fontSize: '20px',
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
                width: '160px',
                height: '240px',
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
                  <span style={{ fontSize: '64px' }}>📚</span>
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
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '24px',
                  minHeight: '44px'
                }}
              >
                📖 Start Reading Session
              </button>

              {/* FIXED: Custom Progress Slider */}
              <CustomSlider
                value={tempProgress}
                onChange={setTempProgress}
                min={0}
                max={selectedBook.format === 'audiobook' ? selectedBook.totalMinutes : selectedBook.totalPages}
                label={selectedBook.format === 'audiobook' ? 'Minutes Listened' : 'Pages Read'}
              />

              {/* Star Rating */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '16px',
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
                      onClick={() => setTempRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '36px',
                        cursor: 'pointer',
                        color: star <= tempRating ? '#FFD700' : '#E0E0E0',
                        padding: '4px',
                        minHeight: '48px',
                        minWidth: '48px',
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
                  fontSize: '16px',
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
                    height: '100px',
                    padding: '12px',
                    border: `2px solid ${currentTheme.primary}50`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: currentTheme.background,
                    color: currentTheme.textPrimary,
                    resize: 'vertical',
                    fontFamily: 'inherit',
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
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    minHeight: '48px'
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
                    fontSize: '16px',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    minHeight: '48px',
                    fontWeight: '600'
                  }}
                >
                  🗑️ Remove Book
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Bottom Navigation */}
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
              onClick={() => handleNavigation(tab.route)}
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
                margin: '0 2px',
                minHeight: '60px',
                touchAction: 'manipulation'
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

        {/* FIXED: Enhanced CSS */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .bookshelf-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .bookshelf-shelf {
            position: relative;
            margin-bottom: 60px;
            height: 200px;
          }
          
          .shelf-wood {
            position: absolute;
            bottom: 0;
            left: -20px;
            right: -20px;
            height: 20px;
            background: linear-gradient(to bottom, 
              ${currentTheme.secondary || '#D2691E'} 0%,
              ${currentTheme.primary || '#8B4513'} 50%,
              ${(currentTheme.textSecondary || '#5D4037') + '80'} 100%);
            border-radius: 0 0 10px 10px;
            box-shadow: 
              0 4px 8px rgba(0,0,0,0.3),
              inset 0 2px 4px rgba(255,255,255,0.2);
            z-index: 1;
          }
          
          .shelf-books {
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            height: 180px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            padding: 0 20px;
            z-index: 2;
          }
          
          .book-spine {
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            transition: all 0.3s ease;
            box-shadow: 
              0 4px 8px rgba(0,0,0,0.2),
              0 0 0 2px rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transform: perspective(200px) rotateY(-5deg);
          }
          
          .book-spine:hover {
            transform: perspective(200px) rotateY(0deg) scale(1.05);
            box-shadow: 
              0 8px 16px rgba(0,0,0,0.3),
              0 0 0 3px rgba(255,255,255,0.2);
            z-index: 10;
          }
          
          .book-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 6px;
            background-color: #4CAF50;
            transition: width 0.3s ease;
            border-radius: 0 0 8px 8px;
          }
          
          .format-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.8);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }
          
          .completion-badge {
            position: absolute;
            top: 8px;
            left: 8px;
            background: #4CAF50;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          
          .book-slot-empty {
            width: 100%;
            height: 100%;
          }
          
          /* Enhanced mobile optimizations */
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
          }
          
          @media screen and (max-width: 480px) {
            input, textarea, select {
              font-size: 16px !important;
            }
            
            .bookshelf-container {
              padding: 10px;
            }
            
            .shelf-books {
              gap: 10px;
              padding: 0 10px;
            }
            
            .bookshelf-shelf {
              margin-bottom: 40px;
              height: 160px;
            }
            
            .shelf-books {
              height: 140px;
            }
          }
          
          button:active {
            transform: scale(0.98);
          }
        `}</style>
      </div>
    </>
  );
}
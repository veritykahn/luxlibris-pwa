// pages/student-nominees.js - FIXED version with smart format switching and prominent navigation
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, getSchoolNominees, addBookToBookshelf, removeBookFromBookshelf } from '../lib/firebase';
import Head from 'next/head';

export default function StudentNominees() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAddMessage, setShowAddMessage] = useState('');
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showFormatSwitchDialog, setShowFormatSwitchDialog] = useState(null);

  // Theme definitions (same as before)
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
      name: 'Little Luminaries™',
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

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadNomineesData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user]);

  // Keyboard navigation only (no touch/swipe)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      } else if (e.key === 'ArrowRight' && currentCardIndex < nominees.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCardIndex, nominees.length]);

  const loadNomineesData = async () => {
    try {
      console.log('📚 Loading nominees data...');
      
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
        console.log('✅ Loaded', schoolNominees.length, 'nominee books');
      }
      
    } catch (error) {
      console.error('❌ Error loading nominees:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  };

  // Check if book is already in bookshelf (any format)
  const getBookInBookshelf = useCallback((bookId) => {
    if (!studentData?.bookshelf) return null;
    return studentData.bookshelf.find(book => book.bookId === bookId);
  }, [studentData?.bookshelf]);

  // Check if specific format is in bookshelf
  const isBookFormatInBookshelf = useCallback((bookId, format) => {
    if (!studentData?.bookshelf) return false;
    return studentData.bookshelf.some(book => 
      book.bookId === bookId && book.format === format
    );
  }, [studentData?.bookshelf]);

  // Smart format switching logic
  const handleAddToBookshelf = useCallback(async (format) => {
    if (isAddingBook || !nominees.length) return;
    
    const currentBook = nominees[currentCardIndex];
    if (!currentBook) return;
    
    console.log('📖 Current card index:', currentCardIndex);
    console.log('📖 Current book:', currentBook.title);
    console.log('📖 Adding format:', format);
    
    // Check if this exact format is already in bookshelf
    if (isBookFormatInBookshelf(currentBook.id, format)) {
      const message = format === 'audiobook' 
        ? `🎧 ${currentBook.title} is already in your bookshelf as an audiobook!`
        : `📖 ${currentBook.title} is already in your bookshelf!`;
      
      setShowAddMessage(message);
      setTimeout(() => setShowAddMessage(''), 3000);
      return;
    }
    
    // Check if book exists in any other format
    const existingBookEntry = getBookInBookshelf(currentBook.id);
    if (existingBookEntry && existingBookEntry.format !== format) {
      // Show format switch dialog
      setShowFormatSwitchDialog({
        book: currentBook,
        existingFormat: existingBookEntry.format,
        newFormat: format
      });
      return;
    }
    
    // No conflicts, add the book
    await addBookToBookshelfInternal(currentBook, format);
    
  }, [nominees, currentCardIndex, studentData, isAddingBook, isBookFormatInBookshelf, getBookInBookshelf]);

  // Internal function to actually add book
  const addBookToBookshelfInternal = async (book, format) => {
    setIsAddingBook(true);
    
    try {
      console.log('📖 Adding book to bookshelf:', book.title, format);
      
      const newBookProgress = await addBookToBookshelf(
        studentData.id,
        studentData.dioceseId,
        studentData.schoolId,
        book.id,
        format
      );
      
      // Update local state to reflect the addition
      setStudentData(prev => ({
        ...prev,
        bookshelf: [...(prev.bookshelf || []), newBookProgress]
      }));
      
      const message = format === 'audiobook' 
        ? `🎧 ${book.title} added as audiobook!`
        : `📖 ${book.title} added to bookshelf!`;
      
      setShowAddMessage(message);
      setTimeout(() => setShowAddMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Error adding book:', error);
      
      let errorMessage = '❌ Error adding book. Please try again.';
      if (error.message && error.message.includes('already in your bookshelf')) {
        errorMessage = `📚 ${book.title} is already in your bookshelf!`;
      }
      
      setShowAddMessage(errorMessage);
      setTimeout(() => setShowAddMessage(''), 3000);
    }
    
    setIsAddingBook(false);
  };

  // Handle format switching confirmation
  const handleFormatSwitch = async (confirm) => {
    if (!showFormatSwitchDialog) return;
    
    const { book, existingFormat, newFormat } = showFormatSwitchDialog;
    
    if (confirm) {
      setIsAddingBook(true);
      
      try {
        // Remove old format
        await removeBookFromBookshelf(
          studentData.id,
          studentData.dioceseId,
          studentData.schoolId,
          book.id,
          existingFormat
        );
        
        // Add new format
        const newBookProgress = await addBookToBookshelf(
          studentData.id,
          studentData.dioceseId,
          studentData.schoolId,
          book.id,
          newFormat
        );
        
        // Update local state
        setStudentData(prev => {
          const updatedBookshelf = prev.bookshelf.filter(b => 
            !(b.bookId === book.id && b.format === existingFormat)
          );
          return {
            ...prev,
            bookshelf: [...updatedBookshelf, newBookProgress]
          };
        });
        
        const message = newFormat === 'audiobook' 
          ? `🔄 Switched to audiobook version of ${book.title}!`
          : `🔄 Switched to book version of ${book.title}!`;
        
        setShowAddMessage(message);
        setTimeout(() => setShowAddMessage(''), 3000);
        
      } catch (error) {
        console.error('❌ Error switching format:', error);
        setShowAddMessage('❌ Error switching format. Please try again.');
        setTimeout(() => setShowAddMessage(''), 3000);
      }
      
      setIsAddingBook(false);
    }
    
    setShowFormatSwitchDialog(null);
  };

  const goToCard = (index) => {
    setCurrentCardIndex(index);
  };

  const goToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < nominees.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
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
          <p style={{ color: '#223848' }}>Loading your books...</p>
        </div>
      </div>
    );
  }

  if (nominees.length === 0) {
    return (
      <>
        <Head>
          <title>Book Nominees - Lux Libris</title>
          <meta name="description" content="Browse and select books from your school's curated reading collection" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
        </Head>
        
        <div style={{
          backgroundColor: currentTheme.background,
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* BOOKSHELF-STYLE HEADER */}
          <div style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
            backdropFilter: 'blur(20px)',
            padding: '30px 20px 12px',
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

            {/* Title */}
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
              Nominees
            </h1>

            {/* Bookshelf Arrow */}
            <button
              onClick={() => router.push('/student-bookshelf')}
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
              ▥
            </button>
          </div>
          
          <div style={{
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
            <h2 style={{
              fontSize: '24px',
              color: currentTheme.textPrimary,
              marginBottom: '12px'
            }}>
              No Books Available
            </h2>
            <p style={{
              fontSize: '16px',
              color: currentTheme.textSecondary,
              marginBottom: '24px'
            }}>
              Your school hasn&apos;t selected their book nominees yet.
            </p>
            <button
              onClick={() => router.push('/student-dashboard')}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.textPrimary,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentBook = nominees[currentCardIndex];

  return (
    <>
      <Head>
        <title>Book Nominees - Lux Libris</title>
        <meta name="description" content="Browse and select books from your school's curated reading collection" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* BOOKSHELF-STYLE HEADER */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
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

          {/* Title */}
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
            Nominees
          </h1>

          {/* Bookshelf Arrow */}
          <button
            onClick={() => router.push('/student-bookshelf')}
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
            ▥
          </button>
        </div>

        {/* MAIN CONTENT - NO TOUCH HANDLERS */}
        <div style={{
          padding: '20px 20px 0 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 'calc(100vh - 120px)',
          paddingTop: '20px',
          position: 'relative'
        }}>
          {/* PROMINENT CIRCULAR NAVIGATION ARROWS */}
          {currentCardIndex > 0 && (
            <button
              onClick={goToPrevCard}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: currentTheme.primary,
                border: `3px solid ${currentTheme.secondary}`,
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                zIndex: 100,
                transition: 'all 0.3s ease',
                userSelect: 'none',
                boxShadow: `0 4px 12px ${currentTheme.primary}40, 0 2px 8px rgba(0,0,0,0.2)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              ←
            </button>
          )}

          {currentCardIndex < nominees.length - 1 && (
            <button
              onClick={goToNextCard}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: currentTheme.primary,
                border: `3px solid ${currentTheme.secondary}`,
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                zIndex: 100,
                transition: 'all 0.3s ease',
                userSelect: 'none',
                boxShadow: `0 4px 12px ${currentTheme.primary}40, 0 2px 8px rgba(0,0,0,0.2)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              →
            </button>
          )}

          {/* Main Card */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            marginBottom: '20px'
          }}>
            <BookCard 
              book={currentBook} 
              theme={currentTheme}
              onAddBook={handleAddToBookshelf}
              isAddingBook={isAddingBook}
              getBookInBookshelf={getBookInBookshelf}
              isBookFormatInBookshelf={isBookFormatInBookshelf}
              currentCardIndex={currentCardIndex}
            />
          </div>

          {/* Navigation Hint */}
          <div style={{
            fontSize: '12px',
            color: currentTheme.textSecondary,
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            ← Use arrows to browse books →
          </div>

          {/* Quick Browse */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            marginBottom: '40px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              Quick Browse
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '8px 0 40px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {nominees.map((book, index) => (
                <button
                  key={book.id}
                  onClick={() => goToCard(index)}
                  className="quick-browse-item"
                  style={{
                    flexShrink: 0,
                    width: '64px',
                    height: '96px',
                    borderRadius: '8px',
                    border: index === currentCardIndex 
                      ? `3px solid ${currentTheme.primary}` 
                      : `2px solid ${currentTheme.primary}40`,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    backgroundColor: currentTheme.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    transition: 'all 0.2s ease',
                    transform: index === currentCardIndex ? 'scale(1.1)' : 'scale(1)',
                    touchAction: 'manipulation'
                  }}
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
                    '▥'
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Format Switch Confirmation Dialog */}
        {showFormatSwitchDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{
                fontSize: '18px',
                color: currentTheme.textPrimary,
                marginBottom: '16px'
              }}>
                Switch Format?
              </h3>
              <p style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.4'
              }}>
                You already have <strong>{showFormatSwitchDialog.book.title}</strong> as a{' '}
                {showFormatSwitchDialog.existingFormat === 'audiobook' ? 'n audiobook' : ' book'}. 
                Switch to {showFormatSwitchDialog.newFormat === 'audiobook' ? 'audiobook' : 'book'} instead?
              </p>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => handleFormatSwitch(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: `2px solid ${currentTheme.primary}`,
                    borderRadius: '12px',
                    color: currentTheme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFormatSwitch(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: currentTheme.primary,
                    border: 'none',
                    borderRadius: '12px',
                    color: currentTheme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Switch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showAddMessage && (
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
            {showAddMessage}
          </div>
        )}

        {/* CSS */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          ::-webkit-scrollbar {
            display: none;
          }
          
          @media (max-width: 480px) {
            .cover-stats-container {
              flex-direction: column !important;
              align-items: center !important;
            }
            
            .book-cover {
              width: 120px !important;
              height: 180px !important;
              margin-bottom: 12px;
            }
            
            .quick-browse-item {
              width: 56px !important;
              height: 84px !important;
            }
          }
          
          @media (max-width: 350px) {
            .action-buttons {
              flex-direction: column !important;
            }
            
            .action-buttons button {
              width: 100% !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

// BookCard component with updated logic for smart format switching
function BookCard({ book, theme, onAddBook, isAddingBook, getBookInBookshelf, isBookFormatInBookshelf, currentCardIndex }) {
  
  const getCategoryColorPalette = (book) => {
    const category = book.displayCategory || book.internalCategory || '';
    
    if (category.includes('Graphic')) {
      return {
        primary: '#FF6B35',
        secondary: '#FF8C42',   
        accent: '#FFB563',
        background: '#FFF4E6',
        surface: '#FFFFFF',
        cardBg: 'linear-gradient(145deg, #FFF4E6, #FFE5CC, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
        textPrimary: '#8B2500',
        textSecondary: '#B8491C'
      };
    }
    
    if (category.includes('Chapter Books') || category.includes('Stick With You')) {
      return {
        primary: '#F4D03F',
        secondary: '#F7DC6F',
        accent: '#FCF3CF',
        background: '#FFFEF7',
        surface: '#FFFFFF',
        cardBg: 'linear-gradient(145deg, #FFFEF7, #FCF3CF, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #F4D03F, #F7DC6F)',
        textPrimary: '#7D6608',
        textSecondary: '#A57C00'
      };
    }
    
    if (category.includes('Picture')) {
      return {
        primary: '#48CAE4',
        secondary: '#00B4D8',
        accent: '#90E0EF',
        background: '#F0FDFF',
        surface: '#FFFFFF',
        cardBg: 'linear-gradient(145deg, #F0FDFF, #CAF0F8, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #48CAE4, #00B4D8)',
        textPrimary: '#023047',
        textSecondary: '#0077B6'
      };
    }
    
    if (category.includes('Classic')) {
      return {
        primary: '#3F51B5',
        secondary: '#5C6BC0',
        accent: '#9FA8DA',
        background: '#F3F4FF',
        surface: '#FFFFFF',
        cardBg: 'linear-gradient(145deg, #F3F4FF, #E8EAF6, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #3F51B5, #5C6BC0)',
        textPrimary: '#1A237E',
        textSecondary: '#283593'
      };
    }
    
    if (category.includes('Catholic')) {
      return {
        primary: '#64B5F6',
        secondary: '#90CAF9',
        accent: '#BBDEFB',
        background: '#F8FCFF',
        surface: '#FFFFFF',
        cardBg: 'linear-gradient(145deg, #F8FCFF, #E3F2FD, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #64B5F6, #90CAF9)',
        textPrimary: '#0D47A1',
        textSecondary: '#1565C0'
      };
    }
    
    if (category.includes('Hidden') || category.includes('Treasure')) {
      return {
        primary: '#D32F2F',
        secondary: '#F44336',
        accent: '#FFCDD2',
        background: '#FFF8F8',
        surface: '#FFFFFF',
        cardBg: 'linear-gradient(145deg, #FFF8F8, #FFEBEE, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #D32F2F, #8D4E3C)',
        textPrimary: '#8B1538',
        textSecondary: '#B71C1C'
      };
    }
    
    return {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      background: theme.surface,
      surface: theme.surface,
      cardBg: `linear-gradient(145deg, ${theme.surface}, ${theme.background}, #FFFFFF)`,
      headerBg: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary
    };
  };

  const colorPalette = getCategoryColorPalette(book);

  const parseStringToArray = (str, separator = ',') => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    return str.split(separator).map(item => item.trim());
  };

  const formatAuthors = (authorsString) => {
    if (!authorsString) return 'Unknown Author';
    
    if (Array.isArray(authorsString)) {
      if (authorsString.length === 0) return 'Unknown Author';
      if (authorsString.length === 1) return authorsString[0];
      if (authorsString.length === 2) return `${authorsString[0]} & ${authorsString[1]}`;
      return `${authorsString[0]} & ${authorsString.length - 1} more`;
    }
    
    const authors = authorsString.split(';').map(author => {
      return author.replace(/\s*\([^)]*\)\s*$/, '').trim();
    }).filter(author => author.length > 0);
    
    if (authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    return `${authors[0]} & ${authors.length - 1} more`;
  };

  const getGradeDisplay = (gradeLevelsString) => {
    if (!gradeLevelsString) return 'All Grades';
    
    if (Array.isArray(gradeLevelsString)) {
      if (gradeLevelsString.length === 0) return 'All Grades';
      const gradeText = gradeLevelsString[0];
      return gradeText ? gradeText.replace('Grades ', '') : 'All Grades';
    }
    
    return gradeLevelsString.replace('Grades ', '');
  };

  const getGenreDisplay = (genresString) => {
    if (!genresString) return '';
    
    if (Array.isArray(genresString)) {
      if (genresString.length === 0) return '';
      const primaryGenre = genresString[0];
      return primaryGenre.length > 25 ? primaryGenre.substring(0, 25) + '...' : primaryGenre;
    }
    
    const genres = genresString.split(',').map(g => g.trim());
    const primaryGenre = genres[0];
    return primaryGenre.length > 25 ? primaryGenre.substring(0, 25) + '...' : primaryGenre;
  };

  const getLengthDisplay = (book) => {
    const pages = book.pages || book.pageCount || 0;
    const minutes = book.totalMinutes || 0;
    
    if (book.isAudiobook && minutes > 0 && pages > 0) {
      return `${pages} pages • ${minutes} min audio`;
    } else if (book.isAudiobook && minutes > 0) {
      return `${minutes} minutes`;
    } else if (pages > 0) {
      return `${pages} pages`;
    } else {
      return 'Length unknown';
    }
  };

  const getShortCategory = (book) => {
    const category = book.displayCategory || book.internalCategory || 'Fiction';
    return category.replace(/📖\s*/, '').replace(/🎨\s*/, '').replace(/📚\s*/, '');
  };

  // Check book status for button rendering
  const existingBookEntry = getBookInBookshelf(book.id);
  const bookFormatExists = isBookFormatInBookshelf(book.id, 'book');
  const audiobookFormatExists = isBookFormatInBookshelf(book.id, 'audiobook');

  return (
    <div style={{
      background: colorPalette.cardBg,
      borderRadius: '20px',
      boxShadow: `
        0 20px 40px rgba(0,0,0,0.15),
        0 8px 16px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.8)
      `,
      overflow: 'hidden',
      border: '4px solid #FFFFFF',
      position: 'relative',
      transform: 'translateY(-4px)',
      transition: 'all 0.3s ease'
    }}>
      {/* Pokemon Card Header */}
      <div style={{
        background: colorPalette.headerBg,
        padding: '16px 20px 12px',
        color: '#FFFFFF',
        position: 'relative',
        borderBottom: '3px solid #FFFFFF',
        textAlign: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: colorPalette.textPrimary,
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '6px 16px',
          borderRadius: '16px',
          letterSpacing: '0.5px',
          display: 'inline-block',
          marginBottom: '12px',
          textTransform: 'uppercase',
          border: '2px solid #FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {getShortCategory(book)}
        </div>
        
        <div>
          <h2 style={{
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            lineHeight: '1.2',
            fontFamily: 'Didot, serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            color: '#FFFFFF'
          }}>
            {book.title}
          </h2>
          
          <p style={{
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            margin: '0 0 10px 0',
            opacity: 0.95,
            fontWeight: '500',
            color: '#FFFFFF'
          }}>
            by {formatAuthors(book.authors)}
          </p>

          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              fontSize: '9px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)',
              lineHeight: '1.2',
              maxWidth: '140px',
              textAlign: 'center'
            }}>
              {getGenreDisplay(book.genres)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        padding: '20px',
        background: `linear-gradient(180deg, ${colorPalette.surface}, ${colorPalette.background})`
      }}>
        {/* Cover and Stats Section */}
        <div className="cover-stats-container" style={{
          display: 'flex',
          gap: 'clamp(12px, 4vw, 16px)',
          marginBottom: '16px'
        }}>
          <div className="book-cover" style={{
            width: '100px',
            height: '150px',
            flexShrink: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: `${theme.primary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            border: '3px solid #FFFFFF',
            position: 'relative'
          }}>
            {book.coverImageUrl ? (
              <>
                <img 
                  src={book.coverImageUrl} 
                  alt={book.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, transparent 30%, ${colorPalette.primary}20 50%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              </>
            ) : (
              <span style={{ fontSize: '40px' }}>📚</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: `${theme.primary}15`,
              borderRadius: '12px',
              padding: '12px',
              border: `2px solid ${theme.primary}30`
            }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  fontSize: '11px',
                  color: theme.textSecondary,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📊 Book Stats
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Grades:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {getGradeDisplay(book.gradeLevels)}
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Length:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {getLengthDisplay(book)}
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Published:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {book.publicationDate ? new Date(book.publicationDate).getFullYear() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Genre:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {getGenreDisplay(book.genres)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Section */}
        {book.luxLibrisReview && (
          <div style={{
            backgroundColor: colorPalette.background,
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '2px solid #FFFFFF',
            position: 'relative',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: colorPalette.textSecondary,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⭐ Lux Libris Review
            </div>
            <p style={{
              fontSize: '13px',
              lineHeight: '1.4',
              color: colorPalette.textPrimary,
              margin: 0,
              fontStyle: 'italic',
              fontWeight: '500'
            }}>
              &quot;{book.luxLibrisReview}&quot;
            </p>
          </div>
        )}

        {book.isAudiobook && book.platforms && (
          <div style={{
            backgroundColor: colorPalette.background,
            padding: '10px 12px',
            borderRadius: '10px',
            marginBottom: '12px',
            fontSize: '11px',
            border: '2px solid #FFFFFF'
          }}>
            <span style={{ color: colorPalette.textSecondary, fontWeight: '600' }}>Available on: </span>
            <span style={{ color: colorPalette.textPrimary, fontWeight: 'bold' }}>
              {Array.isArray(book.platforms) ? book.platforms.join(', ') : book.platforms}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '12px 20px 20px',
        background: `linear-gradient(180deg, ${colorPalette.background}, ${colorPalette.surface})`
      }}>
        <div className="action-buttons" style={{
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => onAddBook('book')}
            disabled={isAddingBook || bookFormatExists}
            style={{
              flex: 1,
              background: bookFormatExists 
                ? 'linear-gradient(145deg, #E0E0E0, #C0C0C0)'
                : `linear-gradient(145deg, ${colorPalette.surface}, ${colorPalette.background})`,
              color: bookFormatExists ? '#666666' : colorPalette.textPrimary,
              border: '3px solid #FFFFFF',
              padding: '18px 20px',
              borderRadius: '16px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: bookFormatExists ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isAddingBook ? 0.7 : 1,
              transition: 'all 0.3s ease',
              boxShadow: `
                0 8px 16px rgba(0,0,0,0.1),
                0 4px 8px ${colorPalette.primary}40,
                inset 0 1px 0 rgba(255,255,255,0.8)
              `,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minHeight: '56px',
              touchAction: 'manipulation',
              transform: 'translateY(-2px)'
            }}
          >
            {bookFormatExists ? '✓ Added' : 
             existingBookEntry && existingBookEntry.format === 'audiobook' ? '📖 Switch to Book' : 
             '📖 Add Book'}
          </button>
          
          {book.isAudiobook && (
            <button
              onClick={() => onAddBook('audiobook')}
              disabled={isAddingBook || audiobookFormatExists}
              style={{
                flex: 1,
                background: audiobookFormatExists
                  ? 'linear-gradient(145deg, #E0E0E0, #C0C0C0)'
                  : `linear-gradient(145deg, ${colorPalette.textPrimary}, ${colorPalette.textSecondary})`,
                color: audiobookFormatExists ? '#666666' : '#FFFFFF',
                border: '3px solid #FFFFFF',
                padding: '18px 20px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: audiobookFormatExists ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isAddingBook ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: `
                  0 8px 16px rgba(0,0,0,0.2),
                  0 4px 8px ${colorPalette.primary}40,
                  inset 0 1px 0 rgba(255,255,255,0.2)
                `,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                minHeight: '56px',
                touchAction: 'manipulation',
                transform: 'translateY(-2px)'
              }}
            >
              {audiobookFormatExists ? '✓ Added' : 
               existingBookEntry && existingBookEntry.format === 'book' ? '🎧 Switch to Audio' : 
               '🎧 Add Audio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
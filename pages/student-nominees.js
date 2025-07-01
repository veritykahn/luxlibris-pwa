// pages/student-nominees.js - FIXED Pokemon-style trading cards
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, getSchoolNominees, addBookToBookshelf } from '../lib/firebase';

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
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Theme definitions (same as dashboard)
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
      loadNomineesData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user]);

  const loadNomineesData = async () => {
    try {
      console.log('📚 Loading nominees data...');
      
      // Get student data first
      const firebaseStudentData = await getStudentData(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      // Set theme
      const selectedTheme = firebaseStudentData.selectedTheme || 'classic_lux';
      setCurrentTheme(themes[selectedTheme]);
      
      // Load school nominees
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

  const handleAddToBookshelf = async (book, format) => {
    if (isAddingBook) return; // Prevent double-clicks
    
    setIsAddingBook(true);
    
    try {
      console.log('📖 Adding book to bookshelf:', book.title, format);
      
      await addBookToBookshelf(
        studentData.id,
        studentData.dioceseId,
        studentData.schoolId,
        book.id,
        format
      );
      
      const message = format === 'audiobook' 
        ? `🎧 ${book.title} added as audiobook!`
        : `📖 ${book.title} added to bookshelf!`;
      
      setShowAddMessage(message);
      setTimeout(() => setShowAddMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Error adding book:', error);
      setShowAddMessage('❌ Error adding book. Please try again.');
      setTimeout(() => setShowAddMessage(''), 3000);
    }
    
    setIsAddingBook(false);
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentCardIndex < nominees.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
    if (isRightSwipe && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToCard = (index) => {
    setCurrentCardIndex(index);
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
      <div style={{
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.secondary}CC)`,
          padding: '20px 24px',
          borderRadius: '0 0 20px 20px'
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
              Book Nominees
            </h1>
          </div>
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
    );
  }

  const currentBook = nominees[currentCardIndex];

  return (
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
              Book Nominees
            </h1>
          </div>
          <div style={{
            fontSize: '14px',
            color: currentTheme.textPrimary,
            backgroundColor: `${currentTheme.primary}30`,
            padding: '4px 12px',
            borderRadius: '12px'
          }}>
            {currentCardIndex + 1} of {nominees.length}
          </div>
        </div>
      </div>

      {/* Swipeable Card Display */}
      <div 
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Card with Pokemon styling */}
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
          />
        </div>

        {/* Swipe Hint */}
        <div style={{
          fontSize: '12px',
          color: currentTheme.textSecondary,
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          👈 Swipe left/right to browse books 👉
        </div>

        {/* Quick Browse - Horizontal Scrollable */}
        <div style={{
          width: '100%',
          maxWidth: '400px'
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
            padding: '8px 0',
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
                  '📚'
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showAddMessage && (
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
          {showAddMessage}
        </div>
      )}

      {/* Loading Animation CSS */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Hide scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          display: none;
        }
        
        /* Mobile optimizations */
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
  );
}

// FIXED Book Card Component - Real Pokemon Trading Card Style
function BookCard({ book, theme, onAddBook, isAddingBook }) {
  // FIXED: Handle string data from Firebase instead of arrays
  const parseStringToArray = (str, separator = ',') => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    return str.split(separator).map(item => item.trim());
  };

  // FIXED: Parse authors from string format "Author1; Author2 (role)"
  const formatAuthors = (authorsString) => {
    if (!authorsString) return 'Unknown Author';
    
    // Handle array format (legacy)
    if (Array.isArray(authorsString)) {
      if (authorsString.length === 0) return 'Unknown Author';
      if (authorsString.length === 1) return authorsString[0];
      if (authorsString.length === 2) return `${authorsString[0]} & ${authorsString[1]}`;
      return `${authorsString[0]} & ${authorsString.length - 1} more`;
    }
    
    // Handle string format from Firebase
    const authors = authorsString.split(';').map(author => {
      // Remove illustrator/role info in parentheses for display
      return author.replace(/\s*\([^)]*\)\s*$/, '').trim();
    }).filter(author => author.length > 0);
    
    if (authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    return `${authors[0]} & ${authors.length - 1} more`;
  };

  // FIXED: Parse grade levels from string format "Grades 4–7"
  const getGradeDisplay = (gradeLevelsString) => {
    if (!gradeLevelsString) return 'All Grades';
    
    // Handle array format (legacy)
    if (Array.isArray(gradeLevelsString)) {
      if (gradeLevelsString.length === 0) return 'All Grades';
      const gradeText = gradeLevelsString[0];
      return gradeText ? gradeText.replace('Grades ', '') : 'All Grades';
    }
    
    // Handle string format from Firebase "Grades 4–7"
    return gradeLevelsString.replace('Grades ', '');
  };

  // FIXED: Parse genres from string format "Genre1, Genre2"
  const getGenreDisplay = (genresString) => {
    if (!genresString) return '';
    
    // Handle array format (legacy)
    if (Array.isArray(genresString)) {
      if (genresString.length === 0) return '';
      const primaryGenre = genresString[0];
      return primaryGenre.length > 15 ? primaryGenre.substring(0, 15) + '...' : primaryGenre;
    }
    
    // Handle string format from Firebase "Mythology, Adventure"
    const genres = genresString.split(',').map(g => g.trim());
    const primaryGenre = genres[0];
    return primaryGenre.length > 15 ? primaryGenre.substring(0, 15) + '...' : primaryGenre;
  };

  const getAllGenres = (genresString) => {
    if (!genresString) return 'Various';
    
    if (Array.isArray(genresString)) {
      return genresString.join(', ');
    }
    
    return genresString; // Already a string from Firebase
  };

  const getGradeBadgeColor = (gradeLevelsString) => {
    const gradeText = gradeLevelsString || '';
    
    if (gradeText.includes('4') || gradeText.includes('5')) return '#4CAF50'; // Green for younger
    if (gradeText.includes('6') || gradeText.includes('7')) return '#FF9800'; // Orange for middle
    if (gradeText.includes('8') || gradeText.includes('9')) return '#9C27B0'; // Purple for older
    return theme.primary;
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

  const getRarityColor = (book) => {
    // Determine "rarity" based on various factors for Pokemon-style feel
    const pages = book.pages || 0;
    const hasAudio = book.isAudiobook;
    const hasReview = book.luxLibrisReview;
    
    if (hasAudio && hasReview && pages > 200) return '#FFD700'; // Gold - "Legendary"
    if (hasAudio || (hasReview && pages > 150)) return '#C0C0C0'; // Silver - "Rare"
    return '#CD7F32'; // Bronze - "Common"
  };

  const getRarityName = (book) => {
    const color = getRarityColor(book);
    if (color === '#FFD700') return 'LEGENDARY';
    if (color === '#C0C0C0') return 'RARE';
    return 'COMMON';
  };

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '20px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      border: `4px solid ${getRarityColor(book)}`,
      position: 'relative',
      transform: 'translateZ(0)',
      transition: 'all 0.3s ease',
      background: `linear-gradient(145deg, ${theme.surface}, ${theme.surface}F0)`
    }}>
      {/* Pokemon Card Header */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        padding: '16px 20px 12px',
        color: theme.textPrimary,
        position: 'relative',
        borderBottom: `2px solid ${getRarityColor(book)}`
      }}>
        {/* Rarity Badge - Top Right */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          backgroundColor: getRarityColor(book),
          color: 'white',
          fontSize: '8px',
          fontWeight: 'bold',
          padding: '3px 6px',
          borderRadius: '8px',
          letterSpacing: '0.5px'
        }}>
          {getRarityName(book)}
        </div>
        
        {/* Grade Level - Top Left */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '16px',
          backgroundColor: getGradeBadgeColor(book.gradeLevels),
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {getGradeDisplay(book.gradeLevels)}
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h2 style={{
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            lineHeight: '1.2',
            fontFamily: 'Didot, serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {book.title}
          </h2>
          
          <p style={{
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            margin: '0 0 10px 0',
            opacity: 0.9,
            fontWeight: '500'
          }}>
            by {formatAuthors(book.authors)}
          </p>

          {/* Stats Bar - Pokemon Style */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              {getGenreDisplay(book.genres)}
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              {book.displayCategory?.replace('📖 ', '') || book.internalCategory}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        padding: '20px',
        background: `linear-gradient(180deg, ${theme.surface}, ${theme.surface}F5)`
      }}>
        {/* Cover and Stats Section */}
        <div className="cover-stats-container" style={{
          display: 'flex',
          gap: 'clamp(12px, 4vw, 16px)',
          marginBottom: '16px'
        }}>
          {/* Enhanced Cover Image */}
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
            border: `3px solid ${getRarityColor(book)}40`,
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
                {/* Holographic effect overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, transparent 30%, ${getRarityColor(book)}20 50%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              </>
            ) : (
              <span style={{ fontSize: '40px' }}>📚</span>
            )}
          </div>

          {/* Pokemon-Style Stats */}
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
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Genres:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: '11px' }}>
                    {getAllGenres(book.genres)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Section - Always Visible */}
        {book.luxLibrisReview && (
          <div style={{
            backgroundColor: `${theme.accent}25`,
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: `2px solid ${theme.accent}40`,
            position: 'relative'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: theme.textSecondary,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⭐ Lux Libris Review
            </div>
            <p style={{
              fontSize: '13px',
              lineHeight: '1.4',
              color: theme.textPrimary,
              margin: 0,
              fontStyle: 'italic',
              fontWeight: '500'
            }}>
              &quot;{book.luxLibrisReview}&quot;
            </p>
          </div>
        )}

        {/* Platform Info */}
        {book.platforms && (
          <div style={{
            backgroundColor: `${theme.secondary}20`,
            padding: '10px 12px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '11px'
          }}>
            <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Available on: </span>
            <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
              {Array.isArray(book.platforms) ? book.platforms.join(', ') : book.platforms}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons - Pokemon Card Style */}
      <div style={{
        padding: '16px 20px 20px',
        background: `linear-gradient(180deg, ${theme.surface}F5, ${theme.surface})`
      }}>
        <div className="action-buttons" style={{
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => onAddBook(book, 'book')}
            disabled={isAddingBook}
            style={{
              flex: 1,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.textPrimary,
              border: `2px solid ${getRarityColor(book)}`,
              padding: '18px 20px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isAddingBook ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minHeight: '56px',
              touchAction: 'manipulation'
            }}
          >
            📖 Add Book
          </button>
          
          {book.isAudiobook && (
            <button
              onClick={() => onAddBook(book, 'audiobook')}
              disabled={isAddingBook}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${theme.textPrimary}, #444)`,
                color: theme.surface,
                border: `2px solid ${getRarityColor(book)}`,
                padding: '18px 20px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isAddingBook ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                minHeight: '56px',
                touchAction: 'manipulation'
              }}
            >
              🎧 Add Audio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// pages/student-nominees.js - Pokemon-style trading cards for school nominees
import { useState, useEffect } from 'react';
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

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % nominees.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + nominees.length) % nominees.length);
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

      {/* Card Stack Display */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Main Card */}
        <div style={{
          position: 'relative',
          width: '320px',
          maxWidth: '90vw',
          marginBottom: '20px'
        }}>
          <BookCard 
            book={currentBook} 
            theme={currentTheme}
            onAddBook={handleAddToBookshelf}
            isAddingBook={isAddingBook}
          />
        </div>

        {/* Navigation Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <button
            onClick={prevCard}
            disabled={nominees.length <= 1}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.textPrimary,
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: nominees.length <= 1 ? 0.5 : 1
            }}
          >
            ←
          </button>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {nominees.map((_, index) => (
              <button
                key={index}
                onClick={() => goToCard(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: index === currentCardIndex 
                    ? currentTheme.primary 
                    : `${currentTheme.primary}40`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
          
          <button
            onClick={nextCard}
            disabled={nominees.length <= 1}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.textPrimary,
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: nominees.length <= 1 ? 0.5 : 1
            }}
          >
            →
          </button>
        </div>

        {/* Quick Browse */}
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
                style={{
                  flexShrink: 0,
                  width: '60px',
                  height: '90px',
                  borderRadius: '8px',
                  border: index === currentCardIndex 
                    ? `3px solid ${currentTheme.primary}` 
                    : '1px solid #ddd',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  backgroundColor: currentTheme.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  transition: 'all 0.2s ease'
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
      `}</style>
    </div>
  );
}

// Book Card Component - Pokemon Trading Card Style
function BookCard({ book, theme, onAddBook, isAddingBook }) {
  const [showDetails, setShowDetails] = useState(false);

  const getGradeBadgeColor = (gradeLevels) => {
    if (gradeLevels?.includes('Grades 4-5')) return '#4CAF50';
    if (gradeLevels?.includes('Grades 6-7')) return '#FF9800';
    if (gradeLevels?.includes('Grades 8+')) return '#9C27B0';
    return theme.primary;
  };

  const formatGenres = (genres) => {
    if (!genres || !Array.isArray(genres)) return 'Fiction';
    return genres.slice(0, 2).join(', ');
  };

  const formatAuthors = (authors) => {
    if (!authors || !Array.isArray(authors)) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(' & ');
    return `${authors[0]} & ${authors.length - 1} others`;
  };

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      border: `2px solid ${theme.primary}30`,
      position: 'relative',
      transform: 'translateZ(0)', // GPU acceleration
      transition: 'all 0.3s ease'
    }}>
      {/* Card Header */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        padding: '16px',
        color: theme.textPrimary
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <div style={{
            backgroundColor: getGradeBadgeColor(book.gradeLevels),
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            {book.gradeLevels?.[0] || 'All Grades'}
          </div>
          <div style={{
            display: 'flex',
            gap: '4px'
          }}>
            {book.isAudiobook && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                fontSize: '10px',
                padding: '4px 6px',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}>
                🎧 AUDIO
              </div>
            )}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              fontSize: '10px',
              padding: '4px 6px',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              {formatGenres(book.genres)}
            </div>
          </div>
        </div>
        
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 4px 0',
          lineHeight: '1.2',
          fontFamily: 'Didot, serif'
        }}>
          {book.title}
        </h2>
        
        <p style={{
          fontSize: '12px',
          margin: 0,
          opacity: 0.9
        }}>
          by {formatAuthors(book.authors)}
        </p>
      </div>

      {/* Book Cover and Info */}
      <div style={{
        padding: '20px',
        display: 'flex',
        gap: '16px'
      }}>
        {/* Cover Image */}
        <div style={{
          width: '80px',
          height: '120px',
          flexShrink: 0,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: `${theme.primary}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
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
            <span style={{ fontSize: '32px' }}>📚</span>
          )}
        </div>

        {/* Book Details */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary,
              marginBottom: '4px'
            }}>
              Length
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: theme.textPrimary
            }}>
              {book.isAudiobook 
                ? `${book.totalMinutes || 0} minutes`
                : `${book.pages || book.pageCount || 0} pages`
              }
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary,
              marginBottom: '4px'
            }}>
              Category
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: theme.textPrimary
            }}>
              {book.displayCategory || book.internalCategory || 'Fiction'}
            </div>
          </div>

          {/* Quick Review */}
          {book.luxLibrisReview && (
            <div style={{
              backgroundColor: `${theme.accent}30`,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '11px',
              lineHeight: '1.3',
              color: theme.textPrimary
            }}>
              &quot;{book.luxLibrisReview.length > 80 
                ? book.luxLibrisReview.substring(0, 80) + '...'
                : book.luxLibrisReview
              }&quot;
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '16px 20px 20px',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => onAddBook(book, 'book')}
          disabled={isAddingBook}
          style={{
            flex: 1,
            backgroundColor: theme.primary,
            color: theme.textPrimary,
            border: 'none',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: isAddingBook ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (!isAddingBook) {
              e.target.style.transform = 'scale(1.02)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
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
              backgroundColor: theme.accent,
              color: theme.textPrimary,
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: isAddingBook ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isAddingBook) {
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            🎧 Add Audio
          </button>
        )}
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          backgroundColor: `${theme.primary}20`,
          border: 'none',
          padding: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: theme.textPrimary,
          cursor: 'pointer',
          borderTop: `1px solid ${theme.primary}30`
        }}
      >
        {showDetails ? '▲ Hide Details' : '▼ Show More Details'}
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: `${theme.primary}10`,
          borderTop: `1px solid ${theme.primary}30`
        }}>
          {book.luxLibrisReview && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: theme.textSecondary,
                marginBottom: '4px'
              }}>
                Lux Libris Review:
              </div>
              <p style={{
                fontSize: '12px',
                lineHeight: '1.4',
                color: theme.textPrimary,
                margin: 0,
                fontStyle: 'italic'
              }}>
                &quot;{book.luxLibrisReview}&quot;
              </p>
            </div>
          )}
          
          {book.platforms && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: theme.textSecondary,
                marginBottom: '4px'
              }}>
                Available on:
              </div>
              <div style={{
                fontSize: '11px',
                color: theme.textPrimary
              }}>
                {Array.isArray(book.platforms) ? book.platforms.join(', ') : book.platforms}
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '11px'
          }}>
            <div>
              <span style={{ color: theme.textSecondary }}>Publication:</span><br/>
              <span style={{ color: theme.textPrimary }}>
                {book.publicationDate || 'Unknown'}
              </span>
            </div>
            <div>
              <span style={{ color: theme.textSecondary }}>Grades:</span><br/>
              <span style={{ color: theme.textPrimary }}>
                {Array.isArray(book.gradeLevels) ? book.gradeLevels.join(', ') : book.gradeLevels}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
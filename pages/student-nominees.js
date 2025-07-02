// pages/student-nominees.js - FIXED Pokemon-style trading cards
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, getSchoolNominees, addBookToBookshelf } from '../lib/firebase';
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

  // Updated handleTabClick function for nominees page
  const handleTabClick = (tabName) => {
    if (tabName === 'Dashboard') {
      router.push('/student-dashboard');
    } else if (tabName === 'Nominees') {
      // Already on nominees, maybe add subtle feedback
      setShowAddMessage('You\'re browsing books! 📚');
      setTimeout(() => setShowAddMessage(''), 1500);
    } else if (tabName === 'Bookshelf') {
      router.push('/student-bookshelf');
    } else {
      setShowAddMessage(`${tabName} coming soon! 🚀`);
      setTimeout(() => setShowAddMessage(''), 3000);
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px' // Extra space for bottom nav
      }}>
        {/* Full-screen content - no header, no counter */}
        <div 
          style={{
            padding: '20px 20px 0 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 'calc(100vh - 100px)', // Account for bottom nav
            paddingTop: '20px' // Reduced top spacing
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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

          {/* Quick Browse - Horizontal Scrollable with proper spacing */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            marginBottom: '40px' // Extra space above bottom nav
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
              padding: '8px 0 40px 0', // Extra bottom padding to clear nav
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

        {/* Bottom Navigation - Fixed positioning with higher z-index */}
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
          backdropFilter: 'blur(10px)',
          zIndex: 1000 // Higher z-index to ensure clickability
        }}>
          {[
            { icon: '▦', label: 'Dashboard', active: false, route: 'Dashboard' },
            { icon: '▢', label: 'Nominees', active: true, route: 'Nominees' },
            { icon: '▥', label: 'Bookshelf', active: false, route: 'Bookshelf' },
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
                margin: '0 2px',
                touchAction: 'manipulation', // Better touch handling
                userSelect: 'none' // Prevent text selection
              }}
              onTouchStart={(e) => {
                e.preventDefault(); // Prevent default touch behavior
                if (!tab.active) {
                  e.target.style.backgroundColor = `${currentTheme.primary}10`;
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                if (!tab.active) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }
                // Trigger the click after a short delay
                setTimeout(() => handleTabClick(tab.route), 50);
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

        {/* Success/Add Message - Positioned above bottom nav */}
        {showAddMessage && (
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
            zIndex: 1001, // Higher than nav bar
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
    </>
  );
}

// FIXED Book Card Component - Real Pokemon Trading Card Style
function BookCard({ book, theme, onAddBook, isAddingBook }) {
  
  const getCategoryColorPalette = (book) => {
    const category = book.displayCategory || book.internalCategory || '';
    
    // Graphic novels - Burnt and bright oranges
    if (category.includes('Graphic')) {
      return {
        primary: '#FF6B35',     // Bright orange
        secondary: '#FF8C42',   // Medium orange  
        accent: '#FFB563',      // Light orange
        background: '#FFF4E6',  // Very light orange
        surface: '#FFFFFF',     // White
        cardBg: 'linear-gradient(145deg, #FFF4E6, #FFE5CC, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
        textPrimary: '#8B2500',  // Dark orange-brown
        textSecondary: '#B8491C'
      };
    }
    
    // Chapter Books - Buttery and pastel yellows
    if (category.includes('Chapter Books') || category.includes('Stick With You')) {
      return {
        primary: '#F4D03F',     // Buttery yellow
        secondary: '#F7DC6F',   // Light yellow
        accent: '#FCF3CF',      // Pale yellow
        background: '#FFFEF7',  // Cream
        surface: '#FFFFFF',     // White
        cardBg: 'linear-gradient(145deg, #FFFEF7, #FCF3CF, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #F4D03F, #F7DC6F)',
        textPrimary: '#7D6608',  // Dark yellow-brown
        textSecondary: '#A57C00'
      };
    }
    
    // Picture Books - Teals and mints
    if (category.includes('Picture')) {
      return {
        primary: '#48CAE4',     // Bright teal
        secondary: '#00B4D8',   // Deep teal
        accent: '#90E0EF',      // Light teal
        background: '#F0FDFF',  // Very light mint
        surface: '#FFFFFF',     // White
        cardBg: 'linear-gradient(145deg, #F0FDFF, #CAF0F8, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #48CAE4, #00B4D8)',
        textPrimary: '#023047',  // Dark teal
        textSecondary: '#0077B6'
      };
    }
    
    // Classic - Royal blues
    if (category.includes('Classic')) {
      return {
        primary: '#3F51B5',     // Royal blue
        secondary: '#5C6BC0',   // Medium blue
        accent: '#9FA8DA',      // Light blue
        background: '#F3F4FF',  // Very light blue
        surface: '#FFFFFF',     // White
        cardBg: 'linear-gradient(145deg, #F3F4FF, #E8EAF6, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #3F51B5, #5C6BC0)',
        textPrimary: '#1A237E',  // Dark blue
        textSecondary: '#283593'
      };
    }
    
    // Catholic Books - Pastel blues
    if (category.includes('Catholic')) {
      return {
        primary: '#64B5F6',     // Soft blue
        secondary: '#90CAF9',   // Light blue
        accent: '#BBDEFB',      // Pale blue
        background: '#F8FCFF',  // Very light blue
        surface: '#FFFFFF',     // White
        cardBg: 'linear-gradient(145deg, #F8FCFF, #E3F2FD, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #64B5F6, #90CAF9)',
        textPrimary: '#0D47A1',  // Dark blue
        textSecondary: '#1565C0'
      };
    }
    
    // Hidden Treasures - Reds and browns
    if (category.includes('Hidden') || category.includes('Treasure')) {
      return {
        primary: '#D32F2F',     // Rich red
        secondary: '#F44336',   // Bright red
        accent: '#FFCDD2',      // Light red
        background: '#FFF8F8',  // Very light red
        surface: '#FFFFFF',     // White
        cardBg: 'linear-gradient(145deg, #FFF8F8, #FFEBEE, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #D32F2F, #8D4E3C)',
        textPrimary: '#8B1538',  // Dark red-brown
        textSecondary: '#B71C1C'
      };
    }
    
    // Default - Use theme colors
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

  // Get the color palette for this book's category
  const colorPalette = getCategoryColorPalette(book);

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
      // Increased limit and made it responsive
      return primaryGenre.length > 25 ? primaryGenre.substring(0, 25) + '...' : primaryGenre;
    }
    
    // Handle string format from Firebase "Mythology, Adventure"
    const genres = genresString.split(',').map(g => g.trim());
    const primaryGenre = genres[0];
    // Increased limit and made it responsive
    return primaryGenre.length > 25 ? primaryGenre.substring(0, 25) + '...' : primaryGenre;
  };

  const getAllGenres = (genresString) => {
    if (!genresString) return 'Various';
    
    if (Array.isArray(genresString)) {
      return genresString.join(', ');
    }
    
    return genresString; // Already a string from Firebase
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
    // Remove emoji and shorten for display
    return category.replace(/📖\s*/, '').replace(/🎨\s*/, '').replace(/📚\s*/, '');
  };

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
        {/* Category Badge - Centered at Top */}
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

          {/* Genre - Small and subtle */}
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
                {/* Holographic effect overlay */}
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

        {/* Review Section - Always Visible */}
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

        {/* Platform Info - Only show if audiobook */}
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

      {/* Action Buttons - 3D Floating Card Style */}
      <div style={{
        padding: '12px 20px 20px',
        background: `linear-gradient(180deg, ${colorPalette.background}, ${colorPalette.surface})`
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
              background: `linear-gradient(145deg, ${colorPalette.surface}, ${colorPalette.background})`,
              color: colorPalette.textPrimary,
              border: '3px solid #FFFFFF',
              padding: '18px 20px',
              borderRadius: '16px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
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
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = `
                0 12px 24px rgba(0,0,0,0.15),
                0 6px 12px ${colorPalette.primary}50,
                inset 0 1px 0 rgba(255,255,255,0.9)
              `;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `
                0 8px 16px rgba(0,0,0,0.1),
                0 4px 8px ${colorPalette.primary}40,
                inset 0 1px 0 rgba(255,255,255,0.8)
              `;
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
                background: `linear-gradient(145deg, ${colorPalette.textPrimary}, ${colorPalette.textSecondary})`,
                color: '#FFFFFF',
                border: '3px solid #FFFFFF',
                padding: '18px 20px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
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
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = `
                  0 12px 24px rgba(0,0,0,0.25),
                  0 6px 12px ${colorPalette.primary}50,
                  inset 0 1px 0 rgba(255,255,255,0.3)
                `;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `
                  0 8px 16px rgba(0,0,0,0.2),
                  0 4px 8px ${colorPalette.primary}40,
                  inset 0 1px 0 rgba(255,255,255,0.2)
                `;
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
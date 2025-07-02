// pages/student-dashboard.js - UPDATED to use Firebase instead of localStorage
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, getSchoolNominees } from '../lib/firebase';
import Head from 'next/head'

export default function StudentDashboard() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState('');
  const [nominees, setNominees] = useState([]);

  // Real dashboard data from Firebase
  const [dashboardData, setDashboardData] = useState({
    booksReadThisYear: 0,
    totalBooksRead: 0,
    saintCount: 0,
    readingStreak: 0,
    currentlyReading: null,
    recentlyCompleted: []
  });

  // Theme definitions (same as onboarding)
  const themes = {
    classic_lux: {
    name: 'Lux Libris Classic',
    primary: '#ADD4EA',      // Soft blue (UNCHANGED)
    secondary: '#C3E0DE',    // Sage blue-green
    accent: '#A1E5DB',       // Light aqua
    background: '#FFFCF5',   // Cream white
    surface: '#FFFFFF',      // Pure white
    textPrimary: '#223848',  // Dark blue-grey
    textSecondary: '#556B7A' // Medium blue-grey
  },

  darkwood_sports: {
    name: 'Athletic Champion',
    primary: '#2F5F5F',      // Deep teal (was brown)
    secondary: '#8B2635',    // Burnt subdued red (was orange)
    accent: '#F5DEB3',       // Warm wheat/cream
    background: '#F5F5DC',   // Beige (kept)
    surface: '#FFF8DC',      // Cream surface
    textPrimary: '#2F1B14',  // Dark brown
    textSecondary: '#5D4037' // Medium brown
  },

  lavender_space: {
    name: 'Cosmic Explorer',
    primary: '#9C88C4',      // Lavender (UNCHANGED)
    secondary: '#B19CD9',    // Light lavender
    accent: '#E1D5F7',       // Very light lavender
    background: '#2A1B3D',   // Dark purple
    surface: '#3D2B54',      // Medium purple
    textPrimary: '#E1D5F7',  // Light lavender text
    textSecondary: '#B19CD9' // Medium lavender text
  },

  mint_music: {
    name: 'Musical Harmony',
    primary: '#87A96B',      // Sage green (was bright mint)
    secondary: '#C8B6DB',    // Soft lavender (was bright green)
    accent: '#F0F4F0',       // Very soft green-tinted white
    background: '#FEFEFE',   // Pure white
    surface: '#F8FAF8',      // Very subtle green tint
    textPrimary: '#2E4739',  // Dark green
    textSecondary: '#4A6B57' // Medium green
  },

  pink_plushies: {
    name: 'Kawaii Dreams',
    primary: '#FFB6C1',      // Light pink (UNCHANGED)
    secondary: '#FFC0CB',    // Pink
    accent: '#FFE4E1',       // Very light pink
    background: '#FFF0F5',   // Lavender blush
    surface: '#FFE4E6',      // Light pink surface
    textPrimary: '#4A2C2A',  // Dark brown
    textSecondary: '#8B4B5C' // Medium brown-pink
  },

  teal_anime: {
    name: 'Otaku Paradise',
    primary: '#20B2AA',      // Teal (UNCHANGED)
    secondary: '#48D1CC',    // Medium turquoise
    accent: '#7FFFD4',       // Aquamarine
    background: '#E0FFFF',   // Light cyan
    surface: '#AFEEEE',      // Pale turquoise
    textPrimary: '#2F4F4F',  // Dark slate grey
    textSecondary: '#5F9EA0' // Cadet blue
  },

  white_nature: {
    name: 'Pure Serenity',
    primary: '#6B8E6B',      // Forest green (was bright lime)
    secondary: '#D2B48C',    // Warm tan/khaki (woodland feel)
    accent: '#F5F5DC',       // Beige accent
    background: '#FFFEF8',   // Warm white
    surface: '#FFFFFF',      // Pure white
    textPrimary: '#2F4F2F',  // Dark forest green
    textSecondary: '#556B2F' // Olive green
  },

  little_luminaries: {
    name: 'Little Luminaries',
    primary: '#4A4A4A',      // Charcoal grey (regal monochrome)
    secondary: '#808080',    // Medium grey
    accent: '#F8F8F8',       // Very light grey
    background: '#E8E8E8',   // Light grey background
    surface: '#FFFFFF',      // Pure white surface
    textPrimary: '#1A1A1A',  // Near black for contrast
    textSecondary: '#4A4A4A' // Charcoal for secondary text
  }
};
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadStudentData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user]);

  const loadStudentData = async () => {
    try {
      console.log('📚 Loading student data from Firebase...');
      
      // Get student data using Firebase helper function
      const firebaseStudentData = await getStudentData(user.uid);
      
      if (!firebaseStudentData) {
        console.log('❌ No student data found, redirecting to onboarding');
        router.push('/student-onboarding');
        return;
      }
      
      console.log('✅ Student data loaded:', firebaseStudentData.firstName);
      setStudentData(firebaseStudentData);
      
      // Set theme
      const selectedTheme = firebaseStudentData.selectedTheme || 'classic_lux';
      setCurrentTheme(themes[selectedTheme]);
      
      // Load school nominees if we have school info
      if (firebaseStudentData.dioceseId && firebaseStudentData.schoolId) {
        try {
          const schoolNominees = await getSchoolNominees(
            firebaseStudentData.dioceseId, 
            firebaseStudentData.schoolId
          );
          setNominees(schoolNominees);
          console.log('📖 Loaded', schoolNominees.length, 'nominee books');
        } catch (error) {
          console.error('Error loading nominees:', error);
        }
      }
      
      // Calculate real dashboard data from Firebase
      const bookshelf = firebaseStudentData.bookshelf || [];
      const completedBooks = bookshelf.filter(book => book.completed);
      const inProgressBooks = bookshelf.filter(book => !book.completed && book.currentProgress > 0);
      
      setDashboardData({
        booksReadThisYear: firebaseStudentData.booksSubmittedThisYear || 0,
        totalBooksRead: firebaseStudentData.lifetimeBooksSubmitted || 0,
        saintCount: firebaseStudentData.saintUnlocks?.length || 0,
        readingStreak: firebaseStudentData.readingStreaks?.current || 0,
        currentlyReading: inProgressBooks.length > 0 ? inProgressBooks[0] : null,
        recentlyCompleted: completedBooks.slice(-3).reverse() // Last 3 completed books
      });

    } catch (error) {
      console.error('❌ Error loading student data:', error);
      router.push('/student-onboarding');
    }
    
    setIsLoading(false);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    const { booksReadThisYear, readingStreak } = dashboardData;
    const { currentYearGoal } = studentData || {};

    if (booksReadThisYear >= currentYearGoal) {
      return '🎉 You crushed your goal! Keep reading!';
    } else if (booksReadThisYear >= currentYearGoal * 0.8) {
      return '⚡ So close to your goal! You&apos;ve got this!';
    } else if (readingStreak >= 7) {
      return '🔥 Amazing streak! You&apos;re on fire!';
    } else {
      return '📚 Ready for your next reading adventure?';
    }
  };

  const handleTabClick = (tabName) => {
  if (tabName === 'Dashboard') {
    // Already on dashboard, maybe add a subtle feedback
    setShowComingSoon('You\'re already here! 📍');
    setTimeout(() => setShowComingSoon(''), 1500);
  } else if (tabName === 'Nominees') {
    router.push('/student-nominees');
  } else if (tabName === 'Bookshelf') {
    router.push('/student-bookshelf');
  } else {
    setShowComingSoon(`${tabName} coming soon! 🚀`);
    setTimeout(() => setShowComingSoon(''), 3000);
  }
};

  const handleSettingsClick = () => {
    router.push('/student-settings');
  };

  const handleStartReading = () => {
    if (nominees.length > 0) {
      router.push('/student-nominees');
    } else {
      setShowComingSoon('Select your books first! 📖');
      setTimeout(() => setShowComingSoon(''), 3000);
    }
  };

  const getCurrentlyReadingTitle = () => {
    if (!dashboardData.currentlyReading) return 'No books in progress';
    
    // Find the book title from nominees
    const book = nominees.find(n => n.id === dashboardData.currentlyReading.bookId);
    return book ? book.title : 'Unknown Book';
  };

  // Show loading while authentication is checking
  if (loading) {
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
          <p style={{ color: '#223848' }}>Checking your account...</p>
        </div>
      </div>
    );
  }

  // Show loading while student data is loading
  if (isLoading || !studentData || !currentTheme) {
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
          <p style={{ color: '#223848' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const studentDisplayName = studentData.lastInitial 
    ? `${studentData.firstName} ${studentData.lastInitial}.`
    : studentData.firstName;

  return (
  <>
    <Head>
      <title>Student Dashboard - Lux Libris</title>
      <meta name="description" content="Track your reading progress, collect saints, and achieve your reading goals" />
      <link rel="icon" href="/images/lux_libris_logo.png" />
    </Head>
    
    <div style={{
      backgroundColor: currentTheme.background,
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: '80px' // Space for bottom nav
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.secondary}CC)`,
        padding: '20px 24px 40px',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '20px',
            color: currentTheme.textPrimary,
            margin: 0
          }}>
            Dashboard
          </h1>
          <button
            onClick={handleSettingsClick}
            style={{
              background: 'none',
              border: 'none',
              color: currentTheme.textPrimary,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ⚙️
          </button>
        </div>

        {/* Welcome Card */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}CC)`,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: `0 8px 24px ${currentTheme.primary}30`
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: currentTheme.textPrimary,
            fontFamily: 'Didot, serif',
            margin: '0 0 8px 0'
          }}>
            {getTimeBasedGreeting()}, {studentDisplayName}!
          </h2>
          <p style={{
            fontSize: '16px',
            color: `${currentTheme.textPrimary}E6`,
            margin: 0
          }}>
            {getMotivationalMessage()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Progress Wheels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <ProgressWheel
            title="This Year"
            current={dashboardData.booksReadThisYear}
            goal={studentData.currentYearGoal}
            color={currentTheme.primary}
            emoji="📖"
          />
          <ProgressWheel
            title="Lifetime Journey"
            current={dashboardData.totalBooksRead}
            goal={100}
            color={currentTheme.accent}
            emoji="🏆"
          />
        </div>

        {/* Currently Reading */}
        {dashboardData.currentlyReading && (
          <CurrentlyReadingCard
            bookTitle={getCurrentlyReadingTitle()}
            progress={dashboardData.currentlyReading}
            theme={currentTheme}
            onTap={() => handleTabClick('Book Details')}
          />
        )}

        {/* Quick Access Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <QuickActionButton
            emoji="🎴"
            label="Browse Books"
            onClick={() => handleTabClick('Nominees')}
            theme={currentTheme}
          />
          <QuickActionButton
            emoji="📚"
            label="My Bookshelf"
            onClick={() => handleTabClick('Bookshelf')}
            theme={currentTheme}
          />
        </div>

        {/* Reading Streak */}
        <ReadingStreakCard
          streak={dashboardData.readingStreak}
          theme={currentTheme}
        />

        {/* Recently Completed */}
        <RecentlyCompletedCard
          books={dashboardData.recentlyCompleted}
          nominees={nominees}
          theme={currentTheme}
        />

        {/* Quick Stats */}
        <QuickStatsCard
          saintCount={dashboardData.saintCount}
          goalPercentage={Math.round((dashboardData.booksReadThisYear / (studentData.currentYearGoal || 1)) * 100)}
          theme={currentTheme}
        />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleStartReading}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          backgroundColor: currentTheme.primary,
          color: currentTheme.textPrimary,
          border: 'none',
          borderRadius: '28px',
          padding: '14px 20px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        📚 Start Reading
      </button>

{/* Bottom Navigation */}
{/* Updated Bottom Navigation JSX (replace the existing bottom navigation div) */}
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
    { icon: '▦', label: 'Dashboard', active: true, route: 'Dashboard' },
    { icon: '▢', label: 'Nominees', active: false, route: 'Nominees' },
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
        margin: '0 2px'
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

      {/* Success/Coming Soon Message */}
      {showComingSoon && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: currentTheme.primary,
          color: currentTheme.textPrimary,
          padding: '12px 24px',
          borderRadius: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {showComingSoon}
        </div>
      )}

      {/* Loading Animation CSS */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  );
}

// Progress Wheel Component
function ProgressWheel({ title, current, goal, color, emoji }) {
  const progress = goal > 0 ? Math.min(current / goal, 1.0) : 0;
  const circumference = 2 * Math.PI * 35; // radius = 35
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <p style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#556B7A',
        margin: '0 0 16px 0'
      }}>
        {title}
      </p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={`${color}30`}
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '2px' }}>{emoji}</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#223848'
          }}>
            {current}
          </div>
        </div>
      </div>
      
      <p style={{
        fontSize: '12px',
        color: '#556B7A',
        margin: '8px 0 0 0'
      }}>
        of {goal}
      </p>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ emoji, label, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.primary}30`,
        borderRadius: '12px',
        padding: '16px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = `${theme.primary}20`;
        e.target.style.transform = 'scale(1.02)';
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = theme.surface;
        e.target.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '24px' }}>{emoji}</span>
      <span style={{
        fontSize: '12px',
        fontWeight: '600',
        color: theme.textPrimary
      }}>
        {label}
      </span>
    </button>
  );
}

// Currently Reading Card
function CurrentlyReadingCard({ bookTitle, progress, theme, onTap }) {
  const progressPercent = progress.totalPages > 0 
    ? Math.round((progress.currentProgress / progress.totalPages) * 100)
    : 0;

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '16px',
      border: `1px solid ${theme.primary}30`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>📖</span>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: theme.textPrimary,
          margin: 0
        }}>
          Currently Reading
        </h3>
      </div>
      
      <button
        onClick={onTap}
        style={{
          width: '100%',
          backgroundColor: `${theme.primary}20`,
          border: 'none',
          borderRadius: '12px',
          padding: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{
          width: '40px',
          height: '60px',
          backgroundColor: `${theme.primary}50`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          📚
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textPrimary,
            margin: '0 0 4px 0'
          }}>
            {bookTitle}
          </p>
          <p style={{
            fontSize: '12px',
            color: theme.textSecondary,
            margin: 0
          }}>
            {progressPercent}% complete - Tap to continue
          </p>
        </div>
        <span style={{ color: theme.primary, fontSize: '16px' }}>→</span>
      </button>
    </div>
  );
}

// Reading Streak Card
function ReadingStreakCard({ streak, theme }) {
  const isOnFire = streak >= 7;
  
  return (
    <div style={{
      background: isOnFire 
        ? 'linear-gradient(135deg, #FF6B35, #F7931E)'
        : `linear-gradient(135deg, ${theme.accent}80, ${theme.primary}80)`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ 
        fontSize: '32px',
        animation: isOnFire ? 'pulse 1.5s infinite' : 'none'
      }}>
        {isOnFire ? '🔥' : '📖'}
      </span>
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: theme.textPrimary,
          margin: '0 0 4px 0'
        }}>
          {streak > 0 ? `${streak} Day Reading Streak!` : 'Start Your Reading Streak'}
        </h3>
        <p style={{
          fontSize: '12px',
          color: `${theme.textPrimary}CC`,
          margin: 0
        }}>
          {isOnFire ? 'Keep the fire burning!' : 'Read every day to build your streak!'}
        </p>
      </div>
      {isOnFire && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '4px 8px',
          fontSize: '10px',
          fontWeight: 'bold',
          color: theme.textPrimary
        }}>
          ON FIRE!
        </div>
      )}
    </div>
  );
}

// Recently Completed Card
function RecentlyCompletedCard({ books, nominees, theme }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>✅</span>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: theme.textPrimary,
          margin: 0
        }}>
          Recently Completed
        </h3>
      </div>
      
      {books.length === 0 ? (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{
            color: theme.textSecondary,
            fontSize: '14px',
            margin: 0
          }}>
            Complete your first book to see it here!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {books.slice(0, 2).map((book, index) => {
            // Find book title from nominees
            const nominee = nominees.find(n => n.id === book.bookId);
            const title = nominee ? nominee.title : 'Unknown Book';
            
            return (
              <div
                key={index}
                style={{
                  backgroundColor: `${theme.accent}20`,
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '30px',
                  height: '45px',
                  backgroundColor: `${theme.accent}50`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  📚
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    margin: '0 0 2px 0'
                  }}>
                    {title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{
                          color: i < (book.rating || 0) ? '#FFD700' : '#DDD',
                          fontSize: '12px'
                        }}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: theme.textSecondary
                    }}>
                      Just finished!
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Quick Stats Card
function QuickStatsCard({ saintCount, goalPercentage, theme }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '100px' // Space for bottom nav
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: theme.textPrimary,
        margin: '0 0 12px 0'
      }}>
        Quick Stats
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        <StatChip emoji="👑" label="Saints" value={`${saintCount}/137`} theme={theme} />
        <StatChip emoji="📚" label="Books" value={goalPercentage > 0 ? `${Math.min(goalPercentage, 100)}%` : '0%'} theme={theme} />
        <StatChip emoji="🏆" label="Goal" value={`${goalPercentage}%`} theme={theme} />
      </div>
    </div>
  );
}

// Stat Chip Component
function StatChip({ emoji, label, value, theme }) {
  return (
    <div style={{
      backgroundColor: `${theme.primary}20`,
      borderRadius: '8px',
      padding: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{emoji}</div>
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: theme.textPrimary,
        marginBottom: '2px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '9px',
        color: theme.textSecondary
      }}>
        {label}
      </div>
    </div>
  );
}
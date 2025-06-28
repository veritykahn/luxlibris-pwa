// pages/student-dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function StudentDashboard() {
  const router = useRouter();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState('');

  // Mock data that will be replaced with real Firebase data
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
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      // Try to get student data from localStorage first (PWA offline support)
      const savedStudentData = localStorage.getItem('studentData');
      const studentId = localStorage.getItem('studentId');
      
      if (savedStudentData) {
        const parsed = JSON.parse(savedStudentData);
        setStudentData(parsed);
        setCurrentTheme(themes[parsed.selectedTheme] || themes.classic_lux);
        
        // If we have studentId, try to fetch fresh data from Firebase
        if (studentId) {
          try {
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (studentDoc.exists()) {
              const freshData = studentDoc.data();
              setStudentData(freshData);
              setCurrentTheme(themes[freshData.selectedTheme] || themes.classic_lux);
              localStorage.setItem('studentData', JSON.stringify(freshData));
            }
          } catch (firebaseError) {
            console.log('Using offline data, Firebase unavailable:', firebaseError);
          }
        }
      } else {
        // No saved data, redirect to onboarding
        router.push('/student-onboarding');
        return;
      }

      // TODO: Load real dashboard data from Firebase
      // For now, using mock data that matches the localStorage structure
      setDashboardData({
        booksReadThisYear: studentData?.booksSubmittedThisYear || 0,
        totalBooksRead: studentData?.lifetimeBooksSubmitted || 0,
        saintCount: studentData?.saintUnlocks?.length || 0,
        readingStreak: studentData?.readingStreaks?.current || 0,
        currentlyReading: null, // Will be fetched from bookProgress collection
        recentlyCompleted: [] // Will be fetched from bookProgress collection
      });

    } catch (error) {
      console.error('Error loading student data:', error);
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
    setShowComingSoon(`${tabName} coming soon! 🚀`);
    setTimeout(() => setShowComingSoon(''), 3000);
  };

  const handleSettingsClick = () => {
    router.push('/student-settings');
  };

  const handleStartReading = () => {
    setShowComingSoon('Book selection coming soon! 📖');
    setTimeout(() => setShowComingSoon(''), 3000);
  };

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
            book={dashboardData.currentlyReading}
            theme={currentTheme}
            onTap={() => handleTabClick('Book Details')}
          />
        )}

        {/* Reading Streak */}
        <ReadingStreakCard
          streak={dashboardData.readingStreak}
          theme={currentTheme}
        />

        {/* Recently Completed */}
        <RecentlyCompletedCard
          books={dashboardData.recentlyCompleted}
          theme={currentTheme}
        />

        {/* Quick Stats */}
        <QuickStatsCard
          saintCount={dashboardData.saintCount}
          goalPercentage={Math.round((dashboardData.booksReadThisYear / studentData.currentYearGoal) * 100)}
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
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: currentTheme.surface,
        borderTop: `1px solid ${currentTheme.primary}20`,
        padding: '8px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px'
      }}>
        {[
          { icon: '📊', label: 'Dashboard', active: true },
          { icon: '🎴', label: 'Nominees' },
          { icon: '📚', label: 'Bookshelf' },
          { icon: '💪', label: 'Habits' },
          { icon: '👑', label: 'Saints' },
          { icon: '📈', label: 'Stats' }
        ].map((tab, index) => (
          <button
            key={tab.label}
            onClick={() => handleTabClick(tab.label)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: tab.active ? currentTheme.primary : currentTheme.textSecondary
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '500' }}>{tab.label}</span>
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
    </div>
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

// Currently Reading Card
function CurrentlyReadingCard({ book, theme, onTap }) {
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
            {book}
          </p>
          <p style={{
            fontSize: '12px',
            color: theme.textSecondary,
            margin: 0
          }}>
            Tap to continue reading
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
function RecentlyCompletedCard({ books, theme }) {
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
          {books.slice(0, 2).map((book, index) => (
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
                  {book.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex' }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{
                        color: i < book.rating ? '#FFD700' : '#DDD',
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
                    Earned: {book.saint}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
        <StatChip emoji="👑" label="Saints" value={`${saintCount}/138`} theme={theme} />
        <StatChip emoji="🏆" label="Rank" value="#42" theme={theme} />
        <StatChip emoji="🎯" label="Goal" value={`${goalPercentage}%`} theme={theme} />
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
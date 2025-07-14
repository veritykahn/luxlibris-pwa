// pages/student-stats/lux-dna-lab.js - Complete Lux DNA Lab with Saint Quizzes
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities, updateStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

export default function LuxDnaLab() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [showMyDnaModal, setShowMyDnaModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isSaintQuizzesExpanded, setIsSaintQuizzesExpanded] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);

  // Theme definitions (consistent with all other pages)
  const themes = useMemo(() => ({
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
      primary: '#6B8E6B',
      secondary: '#D2B48C',
      accent: '#F5F5DC',
      background: '#FFFEF8',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F',
      textSecondary: '#556B2F'
    },
    little_luminaries: {
      name: 'Luxlings™',
      primary: '#666666',
      secondary: '#000000',
      accent: '#E8E8E8',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      textPrimary: '#B8860B',
      textSecondary: '#AAAAAA'
    }
  }), []);

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { name: 'Nominees', path: '/student-nominees', icon: '□' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], []);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
  { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
  { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
  { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
  { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
  { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '⛪', description: 'Coming soon!', disabled: true },
  { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
  { name: 'Lux DNA Lab', path: '/student-stats/lux-dna-lab', icon: '🧬', description: 'Discover your reading personality', current: true },
  { name: 'Family Battle', path: '/student-stats/family-battle', icon: '👨‍👩‍👧‍👦', description: 'Coming soon!', disabled: true }
], []);

  // Series colors for quiz results (same as saints collection)
  const seriesColors = useMemo(() => ({
    'Ultimate Redeemer': { bg: '#FFD700', text: '#2F1B14', border: '#FFA500', modalText: '#FFFFFF' },
    'Mini Marians': { bg: '#4169E1', text: '#FFFFFF', border: '#1E3A8A', modalText: '#FFFFFF' },
    'Sacred Circle': { bg: '#DAA520', text: '#2F1B14', border: '#B8860B', modalText: '#FFFFFF' },
    'Faithful Families': { bg: '#9370DB', text: '#FFFFFF', border: '#7B68EE', modalText: '#FFFFFF' },
    'Halo Hatchlings': { bg: '#BDB76B', text: '#2F1B14', border: '#8B864E', modalText: '#FFFFFF' },
    'Apostolic All-Stars': { bg: '#DC143C', text: '#FFFFFF', border: '#B22222', modalText: '#FFFFFF' },
    'Cherub Chibis': { bg: '#6A5ACD', text: '#FFFFFF', border: '#4B0082', modalText: '#FFFFFF' },
    'Contemplative Cuties': { bg: '#9932CC', text: '#FFFFFF', border: '#8B008B', modalText: '#FFFFFF' },
    'Founder Flames': { bg: '#FF6347', text: '#FFFFFF', border: '#DC143C', modalText: '#FFFFFF' },
    'Desert Disciples': { bg: '#D2691E', text: '#FFFFFF', border: '#8B4513', modalText: '#FFFFFF' },
    'Regal Royals': { bg: '#8A2BE2', text: '#FFFFFF', border: '#9370DB', modalText: '#FFFFFF' },
    'Culture Carriers': { bg: '#228B22', text: '#FFFFFF', border: '#006400', modalText: '#FFFFFF' },
    'Learning Legends': { bg: '#008B8B', text: '#FFFFFF', border: '#20B2AA', modalText: '#FFFFFF' },
    'Super Sancti': { bg: '#FF4500', text: '#FFFFFF', border: '#FF0000', modalText: '#FFFFFF' },
    'Heavenly Helpers': { bg: '#FFD700', text: '#2F1B14', border: '#FFA500', modalText: '#FFFFFF' },
    'Pocket Patrons': { bg: '#708090', text: '#FFFFFF', border: '#2F4F4F', modalText: '#FFFFFF' },
    'Virtue Vignettes': { bg: '#CD5C5C', text: '#FFFFFF', border: '#8B1A1A', modalText: '#FFFFFF' }
  }), []);

  // Load quizzes from Firebase
  const loadQuizzes = useCallback(async () => {
    try {
      console.log('🧬 Loading saint quizzes from Firebase...');
      const quizzesRef = collection(db, 'saints-quizzes');
      const quizzesSnapshot = await getDocs(quizzesRef);
      
      const quizzesData = [];
      quizzesSnapshot.forEach(doc => {
        quizzesData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ Loaded', quizzesData.length, 'saint quizzes');
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('❌ Error loading quizzes:', error);
      setQuizzes([]);
    }
  }, []);

  // Close nav menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false);
      }
      if (showStatsDropdown && !event.target.closest('.stats-dropdown-container')) {
        setShowStatsDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNavMenu(false);
        setShowStatsDropdown(false);
      }
    };

    if (showNavMenu || showStatsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown]);

  // Handle stats navigation
  const handleStatsNavigation = (option) => {
    setShowStatsDropdown(false);
    
    if (option.disabled) {
      alert(`${option.name} is coming soon! 🚧`);
      return;
    }
    
    if (option.current) {
      return; // Already on current page
    }
    
    router.push(option.path);
  };

  // Load student data for theme
  const loadData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = themes[selectedThemeKey];
      setCurrentTheme(selectedTheme);
      
      // Load quizzes
      await loadQuizzes();
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes, loadQuizzes]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadData]);

  // Calculate quiz score with improved tie-breaking and fallback
  const calculateQuizResult = useCallback((quiz, answers) => {
    const scores = {};
    
    // Initialize scores for all possible results
    Object.keys(quiz.results).forEach(saintKey => {
      scores[saintKey] = 0;
    });
    
    // Calculate scores based on answers
    quiz.questions.forEach((question, questionIndex) => {
      const answer = answers[questionIndex];
      if (answer !== undefined && question.answers[answer] && question.answers[answer].points) {
        Object.entries(question.answers[answer].points).forEach(([saintKey, points]) => {
          if (scores.hasOwnProperty(saintKey)) {
            scores[saintKey] += points;
          }
        });
      }
    });
    
    console.log('🧮 Quiz scores calculated:', scores);
    
    // Find the highest score
    const maxScore = Math.max(...Object.values(scores));
    console.log('🏆 Highest score:', maxScore);
    
    // Get all saints with the highest score (handles ties)
    const winners = Object.entries(scores).filter(([saintKey, score]) => score === maxScore);
    console.log('🎯 Winners (tied for highest):', winners);
    
    // If no one has any points, pick a random result as fallback
    if (maxScore === 0) {
      console.log('⚠️ No points scored, using random fallback');
      const allResults = Object.keys(quiz.results);
      const randomKey = allResults[Math.floor(Math.random() * allResults.length)];
      return quiz.results[randomKey];
    }
    
    // If there are ties, pick randomly among winners
    const randomWinner = winners[Math.floor(Math.random() * winners.length)];
    const [winnerKey] = randomWinner;
    
    console.log('✅ Final result:', winnerKey, quiz.results[winnerKey]?.name || 'Unknown');
    return quiz.results[winnerKey];
  }, []);

  // Start a quiz
  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowQuizModal(true);
  };

  // Answer a question
  const answerQuestion = (answerIndex) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answerIndex };
    setAnswers(newAnswers);
    
    // Move to next question or finish quiz
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz complete - calculate result
      const result = calculateQuizResult(currentQuiz, newAnswers);
      setQuizResult(result);
      setShowQuizModal(false);
      setShowQuizResult(true);
      
      // Save result to student profile
      saveQuizResult(currentQuiz.quiz_id, result);
    }
  };

  // Save quiz result to student profile
  const saveQuizResult = async (quizId, result) => {
    try {
      console.log('💾 Saving quiz result:', quizId, result?.saint_id);
      
      const existingResults = studentData.quizResults || {};
      const updatedResults = {
        ...existingResults,
        [quizId]: {
          result: result?.saint_id || 'unknown',
          saintName: result?.name || 'Unknown',
          completedAt: new Date(),
          timesCompleted: (existingResults[quizId]?.timesCompleted || 0) + 1
        }
      };
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        quizResults: updatedResults
      });
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        quizResults: updatedResults
      }));
      
      console.log('✅ Quiz result saved successfully');
    } catch (error) {
      console.error('❌ Error saving quiz result:', error);
    }
  };

  // Get completed quizzes count
  const getCompletedQuizzesCount = () => {
    return Object.keys(studentData?.quizResults || {}).length;
  };

  // Check if quiz is completed
  const isQuizCompleted = (quizId) => {
    return !!(studentData?.quizResults?.[quizId]);
  };

  // Get quiz result for display
  const getQuizResult = (quizId) => {
    return studentData?.quizResults?.[quizId];
  };

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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading Lux DNA Lab...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];

  return (
    <>
      <Head>
        <title>Lux DNA Lab - Lux Libris</title>
        <meta name="description" content="Discover your unique reading personality through fun quizzes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* HEADER WITH DROPDOWN NAVIGATION */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.push('/student-stats')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: currentTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          {/* STATS DROPDOWN */}
          <div className="stats-dropdown-container" style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowStatsDropdown(!showStatsDropdown)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                fontSize: '16px',
                fontWeight: '500',
                minHeight: '40px',
                margin: '0 auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>🧬</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Lux DNA Lab</span>
              <span style={{ fontSize: '12px', transform: showStatsDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {showStatsDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: currentTheme.surface,
                borderRadius: '16px',
                minWidth: '280px',
                maxWidth: '320px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: `${currentTheme.primary}20`,
                  borderBottom: `1px solid ${currentTheme.primary}40`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    textAlign: 'center'
                  }}>
                    📊 Stats Explorer
                  </div>
                </div>
                
                {statsNavOptions.map((option, index) => (
                  <button
                    key={option.name}
                    onClick={() => handleStatsNavigation(option)}
                    disabled={option.disabled}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: option.current ? `${currentTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < statsNavOptions.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: option.disabled ? 'not-allowed' : option.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: option.disabled ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: option.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      opacity: option.disabled ? 0.6 : 1,
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!option.disabled && !option.current) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.disabled && !option.current) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{option.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '2px'
                      }}>
                        {option.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: currentTheme.textSecondary,
                        opacity: 0.8
                      }}>
                        {option.description}
                      </div>
                    </div>
                    {option.current && (
                      <span style={{ fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                    {option.disabled && (
                      <span style={{
                        fontSize: '9px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        SOON
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: currentTheme.surface,
                borderRadius: '12px',
                minWidth: '180px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowNavMenu(false);
                      if (!item.current) {
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${currentTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* MY LUX DNA SUMMARY */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '12px'
            }}>
              🧬
            </div>
            
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              marginBottom: '8px',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Welcome to Your DNA Lab!
            </div>
            
            <div style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Discover your personality through fun quizzes and learn which saints match your spirit!
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {getCompletedQuizzesCount()}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: currentTheme.textSecondary
                }}>
                  Quizzes Completed
                </div>
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {quizzes.length}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: currentTheme.textSecondary
                }}>
                  Total Available
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMyDnaModal(true)}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.textPrimary,
                border: 'none',
                borderRadius: '16px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              🔬 View My Lux DNA
            </button>
          </div>

          {/* QUIZ CATEGORIES */}
          
          {/* Lux Libris Nominees DNA - Coming Soon */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            opacity: 0.7
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '32px' }}>📚</div>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Lux Libris Nominees DNA
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Which book character are you?
                </div>
              </div>
            </div>
            
            <div style={{
              backgroundColor: `${currentTheme.primary}20`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              border: `2px dashed ${currentTheme.primary}60`
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                marginBottom: '4px'
              }}>
                🚧 Coming Soon! 🚧
              </div>
              <div style={{
                fontSize: '12px',
                color: currentTheme.textSecondary
              }}>
                Book character personality quizzes are in development
              </div>
            </div>
          </div>

          {/* Saint DNA Quizzes */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {/* Collapsible Header */}
            <button
              onClick={() => setIsSaintQuizzesExpanded(!isSaintQuizzesExpanded)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: isSaintQuizzesExpanded ? '16px' : '0',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{ fontSize: '32px' }}>♔</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Saint DNA Quizzes
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Discover which saints match your personality! • {getCompletedQuizzesCount()}/{quizzes.length} completed
                </div>
              </div>
              <div style={{
                fontSize: '20px',
                color: currentTheme.textSecondary,
                transform: isSaintQuizzesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▶
              </div>
            </button>

            {/* Collapsible Quiz List */}
            {isSaintQuizzesExpanded && (
              <div style={{
                display: 'grid',
                gap: '8px',
                animation: 'fadeIn 0.3s ease'
              }}>
                {quizzes.map((quiz) => {
                  const completed = isQuizCompleted(quiz.quiz_id);
                  const result = getQuizResult(quiz.quiz_id);
                  
                  return (
                    <button
                      key={quiz.quiz_id}
                      onClick={() => startQuiz(quiz)}
                      style={{
                        backgroundColor: completed ? `${currentTheme.primary}30` : `${currentTheme.primary}15`,
                        border: completed ? `2px solid ${currentTheme.primary}80` : `1px solid ${currentTheme.primary}40`,
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        fontSize: '24px',
                        flexShrink: 0
                      }}>
                        {completed ? '✅' : '🧬'}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '2px'
                        }}>
                          {quiz.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: currentTheme.textSecondary
                        }}>
                          {quiz.description}
                        </div>
                        {completed && result && (
                          <div style={{
                            fontSize: '10px',
                            color: currentTheme.primary,
                            fontWeight: '600',
                            marginTop: '4px'
                          }}>
                            Your result: {result.saintName} • Completed {result.timesCompleted} time{result.timesCompleted > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        fontSize: '16px',
                        color: currentTheme.textSecondary
                      }}>
                        ▶
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QUIZ TAKING MODAL */}
        {showQuizModal && currentQuiz && currentQuestion && (
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
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              maxWidth: '380px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={() => setShowQuizModal(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                ✕
              </button>

              {/* Quiz Header */}
              <div style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                borderRadius: '20px 20px 0 0',
                padding: '20px',
                textAlign: 'center',
                color: currentTheme.textPrimary
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  {currentQuiz.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
                </div>
              </div>

              {/* Question Content */}
              <div style={{ padding: '20px' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '20px',
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  {currentQuestion.question}
                </div>

                {/* Answer Options */}
                <div style={{
                  display: 'grid',
                  gap: '10px'
                }}>
                  {currentQuestion.answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => answerQuestion(index)}
                      style={{
                        backgroundColor: `${currentTheme.primary}15`,
                        border: `2px solid ${currentTheme.primary}40`,
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: currentTheme.textPrimary,
                        fontWeight: '500',
                        lineHeight: '1.3',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = `${currentTheme.primary}25`;
                        e.target.style.borderColor = `${currentTheme.primary}60`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = `${currentTheme.primary}15`;
                        e.target.style.borderColor = `${currentTheme.primary}40`;
                      }}
                    >
                      {answer.text}
                    </button>
                  ))}
                </div>

                {/* Progress Bar */}
                <div style={{
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    height: '6px',
                    backgroundColor: '#E0E0E0',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme.textSecondary
                  }}>
                    {Math.round(((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100)}% Complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ RESULT MODAL */}
        {showQuizResult && quizResult && (() => {
          const seriesColor = seriesColors[quizResult.series] || seriesColors['Pocket Patrons'];
          
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
                maxWidth: '360px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setShowQuizResult(false)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  ✕
                </button>

                {/* LARGE SAINT IMAGE */}
                <div style={{
                  width: '300px',
                  height: '360px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '40px'
                }}>
                  <img 
                    src={quizResult.icon_asset?.replace('assets/', '/') || `/saints/${quizResult.saint_id}.png`} 
                    alt={quizResult.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.3)) drop-shadow(0 0 40px rgba(255,255,255,0.2))'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback icon */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '80px',
                    color: 'rgba(255,255,255,0.8)',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.3)) drop-shadow(0 0 40px rgba(255,255,255,0.2))'
                  }}>
                    ♔
                  </div>
                </div>

                {/* RESULT INFO CARD */}
                <div style={{
                  backgroundColor: seriesColor.bg,
                  borderRadius: '14px',
                  padding: '20px',
                  width: '90%',
                  maxWidth: '320px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  textAlign: 'center'
                }}>
                  {/* Result Header */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: seriesColor.modalText,
                    marginBottom: '8px'
                  }}>
                    🎉 Your Quiz Result 🎉
                  </div>

                  {/* Saint Name */}
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: seriesColor.modalText,
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    You are {quizResult.name}!
                  </h2>

                  {/* Series Pill */}
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#2F1B14',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    display: 'inline-block',
                    marginBottom: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {quizResult.series}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: '13px',
                    color: seriesColor.modalText,
                    lineHeight: '1.4',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    {quizResult.description}
                  </div>

                  {/* Fun Fact */}
                  {quizResult.fun_fact && (
                    <div style={{
                      fontSize: '12px',
                      color: seriesColor.modalText,
                      lineHeight: '1.4',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: seriesColor.modalText
                      }}>
                        ✨ Fun Fact:
                      </div>
                      {quizResult.fun_fact}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => {
                        setShowQuizResult(false);
                        startQuiz(currentQuiz);
                      }}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: seriesColor.modalText,
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      🔄 Retake Quiz
                    </button>
                    
                    <button
                      onClick={() => setShowQuizResult(false)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#2F1B14',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      ✨ Awesome!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MY DNA RESULTS MODAL */}
        {showMyDnaModal && (
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
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              maxWidth: '380px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={() => setShowMyDnaModal(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                ✕
              </button>

              <div style={{
                padding: '20px 20px 10px',
                textAlign: 'center',
                backgroundColor: currentTheme.primary,
                borderRadius: '20px 20px 0 0'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  margin: '0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  🧬 My Lux DNA Results
                </h2>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 20px 20px'
              }}>
                {Object.keys(studentData?.quizResults || {}).length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔬</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      No DNA Results Yet
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: currentTheme.textSecondary,
                      lineHeight: '1.5'
                    }}>
                      Take some saint quizzes to discover your personality matches!
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      Your Saint Personality Matches:
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gap: '8px'
                    }}>
                      {Object.entries(studentData?.quizResults || {}).map(([quizId, result]) => {
                        const quiz = quizzes.find(q => q.quiz_id === quizId);
                        if (!quiz) return null;
                        
                        return (
                          <div
                            key={quizId}
                            style={{
                              backgroundColor: `${currentTheme.primary}15`,
                              border: `1px solid ${currentTheme.primary}30`,
                              borderRadius: '12px',
                              padding: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div style={{
                              fontSize: '20px',
                              flexShrink: 0
                            }}>
                              ♔
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '12px',
                                color: currentTheme.textSecondary,
                                marginBottom: '2px'
                              }}>
                                {quiz.title}
                              </div>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: currentTheme.textPrimary,
                                marginBottom: '2px'
                              }}>
                                {result.saintName}
                              </div>
                              <div style={{
                                fontSize: '10px',
                                color: currentTheme.textSecondary
                              }}>
                                Completed {result.timesCompleted} time{result.timesCompleted > 1 ? 's' : ''} • Last: {new Date(result.completedAt.seconds * 1000).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                setShowMyDnaModal(false);
                                const quiz = quizzes.find(q => q.quiz_id === quizId);
                                if (quiz) startQuiz(quiz);
                              }}
                              style={{
                                backgroundColor: currentTheme.primary,
                                color: currentTheme.textPrimary,
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                              }}
                            >
                              Retake
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </div>
    </>
  );
}
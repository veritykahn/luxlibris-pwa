// pages/student-stats/lux-dna-lab.js - Complete Lux DNA Lab with Student Reading DNA, Saint Quizzes, and Nominee Quizzes
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usePhaseAccess } from '../../hooks/usePhaseAccess';
import { getStudentDataEntities, updateStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getTheme, getSeasonalThemeAnnouncement } from '../../lib/themes'; // ADD THIS LINE
import Head from 'next/head';

export default function LuxDnaLab() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // STEP 2: ADDED THESE NEW STATE VARIABLES
  const [readingDnaQuestions, setReadingDnaQuestions] = useState([]);
  const [readingDnaTypes, setReadingDnaTypes] = useState({});
  const [studentFriendlyModifiers, setStudentFriendlyModifiers] = useState({});
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  
  const [quizzes, setQuizzes] = useState([]);
  const [nomineeQuizzes, setNomineeQuizzes] = useState([]);
  const [masterNominees, setMasterNominees] = useState([]);
  
  // Reading DNA States
  const [showReadingDnaModal, setShowReadingDnaModal] = useState(false);
  const [readingDnaCurrentQuestion, setReadingDnaCurrentQuestion] = useState(0);
  const [readingDnaAnswers, setReadingDnaAnswers] = useState({});
  const [showReadingDnaResult, setShowReadingDnaResult] = useState(false);
  const [readingDnaResult, setReadingDnaResult] = useState(null);
  const [isCompletingReadingDna, setIsCompletingReadingDna] = useState(false);
  
  // Other modal states
  const [showMyDnaModal, setShowMyDnaModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showNomineeQuizModal, setShowNomineeQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentNomineeQuiz, setCurrentNomineeQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showNomineeQuizResult, setShowNomineeQuizResult] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [nomineeQuizResult, setNomineeQuizResult] = useState(null);
  const [isSaintQuizzesExpanded, setIsSaintQuizzesExpanded] = useState(false);
  const [isNomineeQuizzesExpanded, setIsNomineeQuizzesExpanded] = useState(false);
  const [isReadingDnaExpanded, setIsReadingDnaExpanded] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showReadingDnaInfoModal, setShowReadingDnaInfoModal] = useState(false);
  const [showLearningStyleModal, setShowLearningStyleModal] = useState(false);
  const [isUnlockCelebrating, setIsUnlockCelebrating] = useState(false);
  const [isSaintResultsExpanded, setIsSaintResultsExpanded] = useState(false);
  const [isNomineeResultsExpanded, setIsNomineeResultsExpanded] = useState(false);
  const [seasonalThemeAlert, setSeasonalThemeAlert] = useState(null);

  const fixedTextPrimary = currentTheme?.assetPrefix === 'lavender_space' ? '#2A1B3D' : (currentTheme?.textPrimary || '#223848');
  const fixedTextSecondary = currentTheme?.assetPrefix === 'lavender_space' ? '#4A3B5C' : (currentTheme?.textSecondary || '#556B7A');

  // STEP 3: ADDED THIS NEW FUNCTION
  const loadReadingDnaAssessment = useCallback(async () => {
  try {
    setAssessmentLoading(true);
    console.log('🧬 Loading Reading DNA assessment from Firebase...');
    
    // Fetch questions
    const questionsRef = collection(db, 'reading-dna-questions');
    const questionsSnapshot = await getDocs(questionsRef);
    const questions = [];
    questionsSnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    
    // Fetch types
    const typesRef = collection(db, 'reading-dna-types');
    const typesSnapshot = await getDocs(typesRef);
    const types = {};
    typesSnapshot.forEach(doc => {
      types[doc.id] = doc.data();
    });
    
    // Fetch modifiers
    // Fetch modifiers
const modifiersRef = collection(db, 'reading-dna-modifiers');
const modifiersSnapshot = await getDocs(modifiersRef);
const studentModifiers = {};

modifiersSnapshot.forEach(doc => {
  const fullId = doc.id; // e.g., "student_S"
  const modifierData = doc.data();
  
  // Extract just the letter code (S, P, I, etc.) from IDs like "student_S"
  const modifierCode = fullId.includes('student_') 
    ? fullId.replace('student_', '') 
    : fullId;
  
  // Store it with just the letter code as the key
  studentModifiers[modifierCode] = modifierData;
  
  console.log('📝 Modifier loaded:', fullId, '→', modifierCode, modifierData);
});

console.log('🔍 All loaded modifiers:', studentModifiers);
    
    setReadingDnaQuestions(questions);
    setReadingDnaTypes(types);
    setStudentFriendlyModifiers(studentModifiers);
    
    console.log(`✅ Loaded ${questions.length} questions, ${Object.keys(types).length} types, ${Object.keys(studentModifiers).length} modifiers`);
    
  } catch (error) {
    console.error('❌ Error loading Reading DNA assessment:', error);
    // Fallback to empty data
    setReadingDnaQuestions([]);
    setReadingDnaTypes({});
    setStudentFriendlyModifiers({});
  } finally {
    setAssessmentLoading(false);
  }
}, []);

  // STEP 4: ADDED THIS NEW useEffect
  useEffect(() => {
    loadReadingDnaAssessment();
  }, [loadReadingDnaAssessment]);
// UPDATED: Navigation menu items with phase-aware locking
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { 
      name: 'Nominees', 
      path: '/student-nominees', 
      icon: '□', 
      locked: !hasAccess('nomineesBrowsing'), 
      lockReason: phaseData.currentPhase === 'VOTING' ? 'Nominees locked during voting' : 
                 phaseData.currentPhase === 'RESULTS' ? 'Nominees locked during results' :
                 phaseData.currentPhase === 'TEACHER_SELECTION' ? 'New amazing nominees coming this week!' : 'Nominees not available'
    },
    { 
      name: 'Bookshelf', 
      path: '/student-bookshelf', 
      icon: '⚏', 
      locked: !hasAccess('bookshelfViewing'), 
      lockReason: phaseData.currentPhase === 'RESULTS' ? 'Bookshelf locked during results' :
                 phaseData.currentPhase === 'TEACHER_SELECTION' ? 'Stats refreshing - new bookshelf coming!' : 'Bookshelf not available'
    },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], [hasAccess, phaseData.currentPhase]);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
    { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '⛪', description: 'Coming soon!', disabled: true },
    { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
    { name: 'Lux DNA Lab', path: '/student-stats/lux-dna-lab', icon: '🧬', description: 'Discover your reading personality', current: true },
    { name: 'Family Battle', path: '/student-stats/family-battle', icon: '🥊', description: 'WWE-style reading showdown!', disabled: false }
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

  // STEP 5: UPDATED calculateReadingDnaType function to use Firebase data
  const calculateReadingDnaType = useCallback((responses) => {
    if (readingDnaQuestions.length === 0) {
      console.warn('⚠️ No Reading DNA questions loaded from Firebase');
      return null;
    }

    const motivationCounts = {};
    const modifierCounts = { A: 0, E: 0, S: 0, P: 0, I: 0, F: 0, G: 0, R: 0 };
    
    // Count motivation type occurrences and modifier hints
    Object.entries(responses).forEach(([questionIndex, answerIndex]) => {
      const questionIdx = parseInt(questionIndex);
      const answerIdx = parseInt(answerIndex);
      
      const question = readingDnaQuestions[questionIdx]; // NOW USES FIREBASE DATA
      const answer = question?.options[answerIdx];
      
      if (answer?.motivationType) {
        motivationCounts[answer.motivationType] = (motivationCounts[answer.motivationType] || 0) + 1;
      }
      
      // Count modifier hints
      if (answer?.modifierHints) {
        answer.modifierHints.forEach(modifier => {
          modifierCounts[modifier]++;
        });
      }
    });

    console.log('🧮 Reading DNA motivation counts:', motivationCounts);
    console.log('🔍 Modifier counts:', modifierCounts);

    // Ensure we have at least one result, provide fallback
    if (Object.keys(motivationCounts).length === 0) {
      console.warn('⚠️ No motivation types counted, using fallback');
      return {
        type: 'curious_investigator',
        details: readingDnaTypes['curious_investigator'], // NOW USES FIREBASE DATA
        motivationCounts: { curious_investigator: 1 },
        modifiers: ['I'],
        modifierDetails: [{ name: 'Independent', description: 'Self-directed learner' }],
        fullCode: 'curious_investigator-I',
        responses: responses
      };
    }

    // Find the highest scoring motivation type
    const bestType = Object.entries(motivationCounts).reduce((a, b) => 
      motivationCounts[a[0]] > motivationCounts[b[0]] ? a : b
    )[0];

    // Enhanced modifier detection
    const allModifiers = Object.entries(modifierCounts)
      .filter(([modifier, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    let significantModifiers;
    
    if (allModifiers.length === 0) {
      significantModifiers = ['I'];
    } else if (allModifiers.length === 1) {
      significantModifiers = [allModifiers[0][0]];
    } else {
      const highestScore = allModifiers[0][1];
      const secondHighestScore = allModifiers[1]?.[1] || 0;
      
      if (highestScore > secondHighestScore) {
        significantModifiers = allModifiers.slice(0, 2).map(([modifier]) => modifier);
      } else {
        significantModifiers = allModifiers
          .filter(([modifier, count]) => count === highestScore)
          .slice(0, 3)
          .map(([modifier]) => modifier);
      }
    }

    console.log('✅ Reading DNA result:', bestType, readingDnaTypes[bestType]?.name);
    console.log('🏷️ Significant modifiers:', significantModifiers);

    return {
      type: bestType,
      details: readingDnaTypes[bestType], // NOW USES FIREBASE DATA
      motivationCounts,
      modifiers: significantModifiers,
      modifierDetails: significantModifiers.map(mod => {
  const modifierData = studentFriendlyModifiers[mod];
  console.log('🔍 Looking for modifier:', mod, modifierData);
  
  if (modifierData) {
    return {
      code: mod,
      name: modifierData.name,
      emoji: modifierData.emoji,
      description: modifierData.description,
      studentInsights: modifierData.studentInsights,
      studentTips: modifierData.studentTips
    };
  }
  
  return null;
}).filter(Boolean),
      fullCode: significantModifiers.length > 0 ? `${bestType}-${significantModifiers.join('')}` : bestType,
      responses: responses
    };
  }, [readingDnaQuestions, readingDnaTypes, studentFriendlyModifiers]); // UPDATED DEPENDENCIES
// Helper function to get combined support strategies
  const getCombinedSupportStrategies = (baseType, modifiers) => {
    const baseStrategies = readingDnaTypes[baseType]?.supportStrategies || [];
    const modifierStrats = modifiers.flatMap(mod => 
      modifierStrategies[mod]?.strategies || []
    );
    
    return [...baseStrategies, ...modifierStrats];
  };

  // Check if learning style is unlocked
  const isLearningStyleUnlocked = () => {
    // Auto-unlock if student already has Reading DNA results (grandfathering)
    if (studentData?.readingDNA) {
      return true;
    }
    // Check family-wide unlock (NEW)
    if (studentData?.familyReadingDnaUnlocked) {
      return true;
    }
    // Check individual unlock (LEGACY)
    return !!(studentData?.learningStyleUnlocked);
  };

  // Unlock Reading DNA assessment function (for parent app)
  const unlockReadingDnaForStudent = async (studentId, entityId, schoolId) => {
    try {
      await updateStudentDataEntities(studentId, entityId, schoolId, {
        learningStyleUnlocked: true,
        learningStyleUnlockedAt: new Date()
      });
      
      console.log('✅ Learning style unlocked for student');
      return { success: true };
    } catch (error) {
      console.error('❌ Error unlocking learning style:', error);
      return { success: false, error };
    }
  };

  // Show learning style discovery modal
  const showLearningStyleDiscovery = () => {
    const result = getReadingDnaResult();
    if (result && isLearningStyleUnlocked()) {
      setIsUnlockCelebrating(true);
      setTimeout(() => {
        setShowLearningStyleModal(true);
        setIsUnlockCelebrating(false);
      }, 1500);
    }
  };

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

  // Load nominee quizzes from Firebase
  const loadNomineeQuizzes = useCallback(async () => {
    try {
      console.log('📚 Loading nominee quizzes from Firebase...');
      const nomineeQuizzesRef = collection(db, 'nominee-quizzes');
      const nomineeQuizzesSnapshot = await getDocs(nomineeQuizzesRef);
      
      const nomineeQuizzesData = [];
      nomineeQuizzesSnapshot.forEach(doc => {
        nomineeQuizzesData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ Loaded', nomineeQuizzesData.length, 'nominee quizzes');
      setNomineeQuizzes(nomineeQuizzesData);
    } catch (error) {
      console.error('❌ Error loading nominee quizzes:', error);
      setNomineeQuizzes([]);
    }
  }, []);

  // Load master nominees from Firebase (for book cover images)
  const loadMasterNominees = useCallback(async () => {
    try {
      console.log('📖 Loading master nominees from Firebase...');
      const masterNomineesRef = collection(db, 'masterNominees');
      const masterNomineesSnapshot = await getDocs(masterNomineesRef);
      
      const nomineesData = [];
      masterNomineesSnapshot.forEach(doc => {
        const data = doc.data();
        nomineesData.push({ firebaseId: doc.id, ...data });
      });
      
      console.log('✅ Loaded', nomineesData.length, 'master nominees');
      setMasterNominees(nomineesData);
    } catch (error) {
      console.error('❌ Error loading master nominees:', error);
      setMasterNominees([]);
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
        setShowQuizModal(false);
        setShowNomineeQuizModal(false);
        setShowQuizResult(false);
        setShowNomineeQuizResult(false);
        setShowMyDnaModal(false);
        setShowReadingDnaModal(false);
        setShowReadingDnaResult(false);
        setShowReadingDnaInfoModal(false);
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
      
      // Check for family-wide Reading DNA unlock
if (firebaseStudentData.familyId) {
  const familyRef = doc(db, 'families', firebaseStudentData.familyId);
  const familyDoc = await getDoc(familyRef);
  if (familyDoc.exists()) {
    const familyData = familyDoc.data();
    if (familyData.readingDnaSettings?.unlocked) {
      // Add family unlock status to student data
      firebaseStudentData.familyReadingDnaUnlocked = true;
      console.log('✅ Reading DNA unlocked via family settings');
    }
  }
}
      
      setStudentData(firebaseStudentData);
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = getTheme(selectedThemeKey); // CHANGED: Use getTheme instead of themes[selectedThemeKey]
      setCurrentTheme(selectedTheme);
      
      // ADD: Check for seasonal themes
      const seasonalAnnouncements = getSeasonalThemeAnnouncement();
      if (seasonalAnnouncements.length > 0 && !firebaseStudentData.selectedTheme) {
        // Show seasonal theme notification if user hasn't selected a theme
        setSeasonalThemeAlert(seasonalAnnouncements[0]);
        setTimeout(() => setSeasonalThemeAlert(null), 5000);
      }
      
      // Load quizzes
      await loadQuizzes();
      await loadNomineeQuizzes();
      await loadMasterNominees();
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, loadQuizzes, loadNomineeQuizzes, loadMasterNominees]);

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

  // Calculate nominee quiz result
  const calculateNomineeQuizResult = useCallback((quiz, answers) => {
    const scores = {};
    
    // Initialize scores for all possible book results
    quiz.results.forEach(result => {
      scores[result.book_id] = 0;
    });
    
    // Calculate scores based on answers
    quiz.questions.forEach((question, questionIndex) => {
      const answer = answers[questionIndex];
      if (answer !== undefined && question.options[answer] && question.options[answer].points) {
        Object.entries(question.options[answer].points).forEach(([bookId, points]) => {
          if (scores.hasOwnProperty(bookId)) {
            scores[bookId] += points;
          }
        });
      }
    });
    
    console.log('📚 Nominee quiz scores calculated:', scores);
    
    // Find the highest score
    const maxScore = Math.max(...Object.values(scores));
    console.log('🏆 Highest score:', maxScore);
    
    // Get all books with the highest score (handles ties)
    const winners = Object.entries(scores).filter(([bookId, score]) => score === maxScore);
    console.log('🎯 Winners (tied for highest):', winners);
    
    // If no one has any points, pick a random result as fallback
    if (maxScore === 0) {
      console.log('⚠️ No points scored, using random fallback');
      const randomResult = quiz.results[Math.floor(Math.random() * quiz.results.length)];
      return randomResult;
    }
    
    // If there are ties, pick randomly among winners
    const randomWinner = winners[Math.floor(Math.random() * winners.length)];
    const [winnerBookId] = randomWinner;
    
    // Find the result object for this book_id
    const result = quiz.results.find(r => r.book_id === winnerBookId);
    
    console.log('✅ Final nominee result:', winnerBookId, result?.title || 'Unknown');
    return result;
  }, []);

  // Start Reading DNA assessment
  const startReadingDnaAssessment = () => {
    setReadingDnaCurrentQuestion(0);
    setReadingDnaAnswers({});
    setShowReadingDnaModal(true);
  };

  // Handle Reading DNA answer selection
  const answerReadingDnaQuestion = (answerIndex) => {
    const newAnswers = { ...readingDnaAnswers, [readingDnaCurrentQuestion]: answerIndex };
    setReadingDnaAnswers(newAnswers);
    
    // Move to next question or finish assessment
    if (readingDnaCurrentQuestion < readingDnaQuestions.length - 1) {
      setReadingDnaCurrentQuestion(readingDnaCurrentQuestion + 1);
    } else {
      // Assessment complete - calculate result
      completeReadingDnaAssessment(newAnswers);
    }
  };

  // Complete Reading DNA assessment and save results
const completeReadingDnaAssessment = async (answers) => {
  try {
    setIsCompletingReadingDna(true);
    
    const dnaResult = calculateReadingDnaType(answers);
    
    // Save to student profile
    await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
      readingDNA: dnaResult,
      readingDNACompletedAt: new Date()
    });
    
    // Track completion in family document
    if (studentData.familyId) {
      try {
        const familyRef = doc(db, 'families', studentData.familyId);
        await updateDoc(familyRef, {
          [`readingDnaSettings.completedStudents.${studentData.id}`]: {
            completedAt: new Date(),
            resultType: dnaResult.type,
            studentName: `${studentData.firstName} ${studentData.lastInitial}.`
          }
        });
        console.log('✅ Updated family document with student completion');
      } catch (familyError) {
        console.error('Error updating family document:', familyError);
        // Don't block the student's completion if family update fails
      }
    }
    
    setReadingDnaResult(dnaResult);
    setShowReadingDnaModal(false);
    setShowReadingDnaResult(true);
      
      // Update local state
      const newStudentData = {
        ...studentData,
        readingDNA: dnaResult
      };
      setStudentData(newStudentData);
      
      console.log('✅ Reading DNA result saved successfully');
      
    } catch (error) {
      console.error('❌ Error completing Reading DNA assessment:', error);
    }
    
    setIsCompletingReadingDna(false);
  };

  // Start a quiz
  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowQuizModal(true);
  };

  // Start a nominee quiz
  const startNomineeQuiz = (quiz) => {
    setCurrentNomineeQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowNomineeQuizModal(true);
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

  // Answer a nominee quiz question
  const answerNomineeQuestion = (answerIndex) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answerIndex };
    setAnswers(newAnswers);
    
    // Move to next question or finish quiz
    if (currentQuestionIndex < currentNomineeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz complete - calculate result
      const result = calculateNomineeQuizResult(currentNomineeQuiz, newAnswers);
      setNomineeQuizResult(result);
      setShowNomineeQuizModal(false);
      setShowNomineeQuizResult(true);
      
      // Save result to student profile
      saveNomineeQuizResult(currentNomineeQuiz.id, result);
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
      const newStudentData = {
        ...studentData,
        quizResults: updatedResults
      };
      setStudentData(newStudentData);
      
      console.log('✅ Quiz result saved successfully');
    } catch (error) {
      console.error('❌ Error saving quiz result:', error);
    }
  };

  // Save nominee quiz result to student profile
  const saveNomineeQuizResult = async (quizId, result) => {
    try {
      console.log('💾 Saving nominee quiz result:', quizId, result?.book_id);
      
      const existingResults = studentData.nomineeQuizResults || {};
      const updatedResults = {
        ...existingResults,
        [quizId]: {
          result: result?.book_id || 'unknown',
          bookTitle: result?.title || 'Unknown',
          completedAt: new Date(),
          timesCompleted: (existingResults[quizId]?.timesCompleted || 0) + 1
        }
      };
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        nomineeQuizResults: updatedResults
      });
      
      // Update local state
      const newStudentData = {
        ...studentData,
        nomineeQuizResults: updatedResults
      };
      setStudentData(newStudentData);
      
      console.log('✅ Nominee quiz result saved successfully');
    } catch (error) {
      console.error('❌ Error saving nominee quiz result:', error);
    }
  };

  // Get completed quizzes count
  const getCompletedQuizzesCount = () => {
    const saintQuizzes = Object.keys(studentData?.quizResults || {}).length;
    const nomineeQuizzes = Object.keys(studentData?.nomineeQuizResults || {}).length;
    const readingDnaCompleted = studentData?.readingDNA ? 1 : 0;
    return saintQuizzes + nomineeQuizzes + readingDnaCompleted;
  };

  // Get total available quizzes count
  const getTotalQuizzesCount = () => {
    return quizzes.length + nomineeQuizzes.length + 1; // +1 for Reading DNA
  };

  // Check if quiz is completed
  const isQuizCompleted = (quizId) => {
    return !!(studentData?.quizResults?.[quizId]);
  };

  // Check if nominee quiz is completed
  const isNomineeQuizCompleted = (quizId) => {
    return !!(studentData?.nomineeQuizResults?.[quizId]);
  };

  // Check if Reading DNA is completed
  const isReadingDnaCompleted = () => {
    return !!(studentData?.readingDNA);
  };

  // Get quiz result for display
  const getQuizResult = (quizId) => {
    return studentData?.quizResults?.[quizId];
  };

  // Get nominee quiz result for display
  const getNomineeQuizResult = (quizId) => {
    return studentData?.nomineeQuizResults?.[quizId];
  };

  // Get Reading DNA result for display
  const getReadingDnaResult = () => {
    return studentData?.readingDNA;
  };

  // Get book details from master nominees
  const getBookDetails = (bookId) => {
    return masterNominees.find(book => book.id === bookId);
  };

  // Show result modal from DNA results
  const showDnaResult = (quizId, result) => {
    // Find the quiz that matches this result
    const quiz = quizzes.find(q => q.quiz_id === quizId);
    if (!quiz) {
      return;
    }

    // Find the full saint result data from the quiz
    let saintResult = quiz.results[result.result];
    
    // If not found by key, try to find by saint name as backup
    if (!saintResult) {
      saintResult = Object.values(quiz.results).find(s => s.name === result.saintName);
    }
    
    if (!saintResult) {
      return;
    }
    
    // Set the current quiz for retake functionality
    setCurrentQuiz(quiz);
    
    // Set the quiz result and show modal
    setQuizResult(saintResult);
    setShowMyDnaModal(false);
    setShowQuizResult(true);
  };

  // Show nominee result modal from DNA results
  const showNomineeDnaResult = (quizId, result) => {
    // Find the quiz that matches this result with flexible ID matching
    let quiz = nomineeQuizzes.find(q => q.id === quizId);
    if (!quiz) {
      quiz = nomineeQuizzes.find(q => q.id === String(quizId));
    }
    if (!quiz) {
      quiz = nomineeQuizzes.find(q => q.id === Number(quizId));
    }
    
    if (!quiz) {
      return;
    }

    // Find the result object for this book_id
    const bookResult = quiz.results.find(r => r.book_id === result.result);
    
    if (!bookResult) {
      return;
    }
    
    // Set the current quiz for retake functionality
    setCurrentNomineeQuiz(quiz);
    
    // Set the quiz result and show modal
    setNomineeQuizResult(bookResult);
    setShowMyDnaModal(false);
    setShowNomineeQuizResult(true);
  };

  // Show Reading DNA result modal from DNA results
  const showReadingDnaResultModal = () => {
    const result = getReadingDnaResult();
    if (result) {
      setReadingDnaResult(result);
      setShowMyDnaModal(false);
      setShowReadingDnaResult(true);
    }
  };

  // Get phase-specific messaging for the DNA Lab
  const getPhaseSpecificMessage = () => {
    switch (phaseData.currentPhase) {
      case 'VOTING':
        return "🗳️ This year's amazing reading program is complete! Keep discovering your unique Lux DNA and personality through fun quizzes while you vote for your favorite books!";
      case 'RESULTS':
        return "🏆 Congratulations on an incredible reading year! Book character DNA is now closed for this year, but you can still explore your amazing saint personality matches and keep building those reading habits!";
      case 'TEACHER_SELECTION':
        return "🚀 Get ready! The new reading program starts in just ONE WEEK! Brand new Lux Book DNA quizzes are coming soon! In the meantime, keep discovering your saint personality and building those super reading habits to earn XP and unlock more saints! 📚✨";
      default:
        return null;
    }
  };

  // Check if nominees DNA should be locked (during RESULTS phase)
  const isNomineesDnaLocked = () => {
    return phaseData.currentPhase === 'RESULTS';
  };

  // STEP 6: UPDATED loading condition
  if (loading || isLoading || assessmentLoading || !studentData || !currentTheme) {
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
          <p style={{ color: '#223848', fontSize: '14px' }}>
            Loading Lux DNA Lab...
            {assessmentLoading && (
              <>
                <br />
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  Fetching assessment questions...
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  // STEP 7: Current question reference (uses Firebase data)
  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
  const currentNomineeQuestion = currentNomineeQuiz?.questions[currentQuestionIndex];
  const currentReadingDnaQuestion = readingDnaQuestions[readingDnaCurrentQuestion];
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
        
        {/* ADD: Seasonal theme notification */}
        {seasonalThemeAlert && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: 'white',
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1002,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            animation: 'slideInDown 0.6s ease-out'
          }}
          onClick={() => router.push('/student-settings')}
          >
            {seasonalThemeAlert.icon} {seasonalThemeAlert.message} Tap to use!
          </div>
        )}

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

          {/* UPDATED: Hamburger Menu with Phase-Aware Locking */}
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
                      if (item.locked) {
                        alert(`🔒 ${item.lockReason}`);
                        return;
                      }
                      if (!item.current) {
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${currentTheme.primary}30` : 
                                      item.locked ? `${currentTheme.textSecondary}10` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: item.locked ? 'not-allowed' : (item.current ? 'default' : 'pointer'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: item.locked ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      opacity: item.locked ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current && !item.locked) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current && !item.locked) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={item.locked ? item.lockReason : undefined}
                  >
                    <span style={{ 
                      fontSize: '16px',
                      filter: item.locked ? 'grayscale(1)' : 'none'
                    }}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                    {item.locked && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.textSecondary }}>🔒</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
{/* Phase-Specific Alert Banner */}
        {getPhaseSpecificMessage() && (
          <div className="phase-alert-banner" style={{
            background: phaseData.currentPhase === 'VOTING' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 
                       phaseData.currentPhase === 'RESULTS' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 
                       'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            padding: '16px 20px',
            margin: '0 16px 16px 16px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'slideInDown 0.6s ease-out'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>
              {phaseData.currentPhase === 'VOTING' ? '🗳️' : 
               phaseData.currentPhase === 'RESULTS' ? '🏆' : '🚀'}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px',
              lineHeight: '1.3',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              {phaseData.currentPhase === 'VOTING' ? 'DNA Lab Still Open!' :
               phaseData.currentPhase === 'RESULTS' ? 'DNA Lab Update!' :
               'Get Ready for New DNA!'}
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '400',
              lineHeight: '1.4',
              opacity: 0.95
            }}>
              {getPhaseSpecificMessage()}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="stats-main-content" style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* MY LUX DNA SUMMARY */}
          <div className="dna-summary-card" style={{
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
              Welcome to Your Lux DNA Lab!
            </div>
            
            <div style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              {phaseData.currentPhase === 'RESULTS' ? 
                'Discover your Lux Libris literary and saint personality through fun quizzes! Book character DNA is closed for this year.' :
                phaseData.currentPhase === 'TEACHER_SELECTION' ?
                'Discover your Lux Libris literary and saint personality and get ready for brand new book character quizzes coming next week!' :
                'Discover your personality through fun quizzes and learn which Lux Libris literary characters and saints match your spirit!'}
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
                  {getTotalQuizzesCount()}
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
          
          {/* Student Reading DNA Assessment */}
          <div className="quiz-category-card" style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {/* Collapsible Header */}
            <button
              onClick={() => setIsReadingDnaExpanded(!isReadingDnaExpanded)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: isReadingDnaExpanded ? '16px' : '0',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{ fontSize: '32px' }}>⬢</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Your Reading DNA
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Discover your unique reading personality • {isReadingDnaCompleted() ? 'Completed!' : 'Take assessment'}
                </div>
              </div>
              <div style={{
                fontSize: '20px',
                color: currentTheme.textSecondary,
                transform: isReadingDnaExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▶
              </div>
            </button>

            {/* Collapsible Content */}
            {isReadingDnaExpanded && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {isReadingDnaCompleted() ? (
                  <button
                    onClick={showReadingDnaResultModal}
                    style={{
                      backgroundColor: `${currentTheme.primary}30`,
                      border: `2px solid ${currentTheme.primary}80`,
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      fontSize: '32px',
                      flexShrink: 0
                    }}>
                      ✅
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: currentTheme.textPrimary,
                        marginBottom: '2px'
                      }}>
                        You are a {getReadingDnaResult()?.details?.name}!
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: currentTheme.textSecondary
                      }}>
                        {getReadingDnaResult()?.details?.description?.substring(0, 60)}...
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: currentTheme.primary,
                        fontWeight: '600',
                        marginTop: '4px'
                      }}>
                        View result • Retake assessment
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      color: currentTheme.textSecondary
                    }}>
                      ▶
                    </div>
                  </button>
                ) : (
                  <div style={{
                    backgroundColor: `${currentTheme.primary}15`,
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '32px',
                      marginBottom: '12px'
                    }}>
                      🔬
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      Discover Your Reading Personality
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textSecondary,
                      marginBottom: '16px',
                      lineHeight: '1.4'
                    }}>
                      Take our science-inspired quiz to learn what motivates you to read and how to make reading even more amazing!
                    </div>

                    <div style={{
                      backgroundColor: `${currentTheme.secondary}20`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: currentTheme.textSecondary,
                      marginBottom: '12px'
                    }}>
                      <span>🔬</span>
                      <span>Science-Inspired Fun Tool</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReadingDnaInfoModal(true);
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: currentTheme.primary,
                          fontSize: '10px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '0 0 0 4px'
                        }}
                      >
                        Learn More
                      </button>
                    </div>

                    {isLearningStyleUnlocked() ? (
                      <button
                        onClick={startReadingDnaAssessment}
                        style={{
                          backgroundColor: currentTheme.primary,
                          color: currentTheme.textPrimary,
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: '0 auto',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        🧬 Take Assessment
                      </button>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        backgroundColor: `${currentTheme.primary}10`,
                        borderRadius: '12px',
                        border: `2px solid ${currentTheme.primary}30`
                      }}>
                        <div style={{
                          fontSize: '24px',
                          marginBottom: '8px'
                        }}>
                          🔒
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '4px'
                        }}>
                          Reading DNA Assessment Locked
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: currentTheme.textSecondary,
                          lineHeight: '1.4'
                        }}>
                          Ask your parent to unlock Reading DNA for your family! This fun tool helps you discover your unique reading personality.
                        </div>
                      </div>
                    )}

                    <div style={{
                      fontSize: '11px',
                      color: currentTheme.textSecondary,
                      marginTop: '8px'
                    }}>
                      Takes about 3 minutes • {readingDnaQuestions.length} fun questions
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
{/* Lux Libris Nominees DNA with Phase Awareness and Collapsible */}
          <div className="quiz-category-card" style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            opacity: isNomineesDnaLocked() ? 0.7 : (phaseData.currentPhase === 'TEACHER_SELECTION' ? 1 : 1)
          }}>
            {/* Collapsible Header */}
            <button
              onClick={() => setIsNomineeQuizzesExpanded(!isNomineeQuizzesExpanded)}
              disabled={isNomineesDnaLocked() || phaseData.currentPhase === 'TEACHER_SELECTION'}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: (isNomineesDnaLocked() || phaseData.currentPhase === 'TEACHER_SELECTION') ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: isNomineeQuizzesExpanded ? '16px' : '0',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{ fontSize: '32px' }}>□</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
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
                  {isNomineesDnaLocked() ? 
                    'Book character quizzes are closed for this academic year' :
                    phaseData.currentPhase === 'TEACHER_SELECTION' ?
                    'Brand new book character personality quizzes launch with the new program!' :
                    `Which book character are you? • ${Object.keys(studentData?.nomineeQuizResults || {}).length}/${nomineeQuizzes.length} completed`}
                </div>
              </div>
              {!isNomineesDnaLocked() && phaseData.currentPhase !== 'TEACHER_SELECTION' && (
                <div style={{
                  fontSize: '20px',
                  color: currentTheme.textSecondary,
                  transform: isNomineeQuizzesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▶
                </div>
              )}
            </button>
            
            {/* Status/Content Area */}
            {isNomineesDnaLocked() ? (
              <div style={{
                backgroundColor: `${currentTheme.textSecondary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: `2px dashed ${currentTheme.textSecondary}60`
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme.textSecondary,
                  marginBottom: '4px'
                }}>
                  🔒 Closed for This Year!
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Book character quizzes are closed for this academic year
                </div>
              </div>
            ) : phaseData.currentPhase === 'TEACHER_SELECTION' ? (
              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                border: `2px solid ${currentTheme.primary}60`
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  🚀 NEW DNA Coming Next Week!
                </div>
                <div style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  Brand new book character personality quizzes launch with the new program!
                </div>
              </div>
            ) : (
              /* Collapsible Quiz List */
              isNomineeQuizzesExpanded && (
                <div className="nominee-quiz-grid" style={{
                  display: 'grid',
                  gap: '8px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  {nomineeQuizzes.map((quiz) => {
                    const completed = isNomineeQuizCompleted(quiz.id);
                    const result = getNomineeQuizResult(quiz.id);
                    
                    return (
                      <button
                        key={quiz.id}
                        onClick={() => startNomineeQuiz(quiz)}
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
                          {completed ? '✅' : '🔬'}
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
                              Your result: {result.bookTitle} • Completed {result.timesCompleted} time{result.timesCompleted > 1 ? 's' : ''} • Retake?
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
              )
            )}
          </div>

          {/* Saint DNA Quizzes */}
          <div className="quiz-category-card" style={{
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
                  {phaseData.currentPhase === 'RESULTS' ? 
                    'Discover which saints match your personality! Always available! ✨' :
                    phaseData.currentPhase === 'TEACHER_SELECTION' ?
                    'Keep discovering your saint matches while we prep new book quizzes! 🌟' :
                    'Discover which saints match your personality!'} • {Object.keys(studentData?.quizResults || {}).length}/{quizzes.length} completed
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
              <div className="quiz-grid" style={{
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
                            Your result: {result.saintName} • Completed {result.timesCompleted} time{result.timesCompleted > 1 ? 's' : ''} • Retake?
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
{/* READING DNA ASSESSMENT MODAL */}
        {showReadingDnaModal && currentReadingDnaQuestion && (
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
            <div className="reading-dna-modal-content" style={{
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
                onClick={() => setShowReadingDnaModal(false)}
                disabled={isCompletingReadingDna}
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
                  cursor: isCompletingReadingDna ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  opacity: isCompletingReadingDna ? 0.6 : 1
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
                  Your Reading DNA
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  Question {readingDnaCurrentQuestion + 1} of {readingDnaQuestions.length}
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
                  {currentReadingDnaQuestion.question}
                </div>

                {/* Answer Options */}
                <div style={{
                  display: 'grid',
                  gap: '10px'
                }}>
                  {currentReadingDnaQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => answerReadingDnaQuestion(index)}
                      disabled={isCompletingReadingDna}
                      style={{
                        backgroundColor: `${currentTheme.primary}15`,
                        border: `2px solid ${currentTheme.primary}40`,
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: isCompletingReadingDna ? 'wait' : 'pointer',
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
                        transition: 'all 0.2s ease',
                        opacity: isCompletingReadingDna ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isCompletingReadingDna) {
                          e.target.style.backgroundColor = `${currentTheme.primary}25`;
                          e.target.style.borderColor = `${currentTheme.primary}60`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCompletingReadingDna) {
                          e.target.style.backgroundColor = `${currentTheme.primary}15`;
                          e.target.style.borderColor = `${currentTheme.primary}40`;
                        }
                      }}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>

                {isCompletingReadingDna && (
                  <div style={{
                    marginTop: '20px',
                    fontSize: '14px',
                    color: currentTheme.textSecondary,
                    textAlign: 'center'
                  }}>
                    ⏳ Calculating your Reading DNA...
                  </div>
                )}

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
                      width: `${((readingDnaCurrentQuestion + 1) / readingDnaQuestions.length) * 100}%`,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme.textSecondary
                  }}>
                    {Math.round(((readingDnaCurrentQuestion + 1) / readingDnaQuestions.length) * 100)}% Complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReadingDnaResult && readingDnaResult && (() => {
          const dnaType = readingDnaResult.details;
          const hasModifiers = readingDnaResult.modifiers && readingDnaResult.modifiers.length > 0;
          const isUnlocked = isLearningStyleUnlocked();
          
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
              <div className="reading-dna-result-modal-content" style={{
                maxWidth: '380px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => {
  setShowReadingDnaResult(false);
  setShowMyDnaModal(true);
}}
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

                {/* LARGE READING DNA IMAGE */}
                <div className="reading-dna-result-image-container" style={{
                  width: '280px',
                  height: '340px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '40px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '20px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(8px)',
                    zIndex: 0
                  }} />
                  <img 
                    src={`/reading-dna/${readingDnaResult.type}.png`}
                    alt={dnaType.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                      borderRadius: '12px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback emoji */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '120px',
                    color: 'rgba(255,255,255,0.8)',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                  }}>
                    {dnaType.emoji}
                  </div>
                </div>

                {/* RESULT INFO CARD */}
                <div className="reading-dna-result-info-card" style={{
                  backgroundColor: dnaType.color,
                  borderRadius: '14px',
                  padding: '20px',
                  width: '90%',
                  maxWidth: '340px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  textAlign: 'center'
                }}>
                  {/* Result Header */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: '8px'
                  }}>
                    🎉 Your Reading DNA 🎉
                  </div>

                  {/* DNA Type Name */}
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    You are a {dnaType.name}!
                  </h2>

                  {/* Science Note */}
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
                    Science-Inspired Reading Personality
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: '13px',
                    color: '#FFFFFF',
                    lineHeight: '1.4',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    {dnaType.description}
                  </div>

                  {/* Research Note */}
                  <div style={{
                    fontSize: '12px',
                    color: '#FFFFFF',
                    lineHeight: '1.4',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: '#FFFFFF'
                    }}>
                      ✨ Cool Science Fact:
                    </div>
                    {dnaType.researchNote}
                  </div>

                  {/* LEARNING STYLE DETAILS - ALWAYS AVAILABLE AFTER UNLOCK */}
                  {hasModifiers && (
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '16px',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '8px'
                      }}>
                        🌟 Your Special Learning Style:
                      </div>
                      <button
                        onClick={() => setShowLearningStyleModal(true)}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          color: '#2F1B14',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        🔍 Discover Your Complete Learning Style
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="reading-dna-result-action-buttons" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => {
                        setShowReadingDnaResult(false);
                        startReadingDnaAssessment();
                      }}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#FFFFFF',
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
                      🔄 Retake
                    </button>
                    
                    <button
                      onClick={() => {
  setShowReadingDnaResult(false);
  setShowMyDnaModal(true);
}}
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
                      ✨ Amazing!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
{/* LEARNING STYLE DISCOVERY MODAL */}
        {showLearningStyleModal && readingDnaResult && isLearningStyleUnlocked() && (() => {
          const dnaType = readingDnaResult.details;
          const modifiers = readingDnaResult.modifiers || [];
          
          
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: currentTheme.surface,
                borderRadius: '20px',
                maxWidth: '420px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}>
                <button
                  onClick={() => setShowLearningStyleModal(false)}
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

                {/* Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  borderRadius: '20px 20px 0 0',
                  padding: '24px',
                  textAlign: 'center',
                  color: currentTheme.textPrimary
                }}>
                  <div style={{
                    fontSize: '24px',
                    marginBottom: '8px'
                  }}>
                    🎉✨🎉
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    Special Discovery Unlocked!
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.9
                  }}>
                    Your Complete Learning Style Profile
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                  {/* Main Type */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: currentTheme.textPrimary,
                      marginBottom: '8px'
                    }}>
                      You are a {dnaType.name}! {dnaType.emoji}
                    </div>
                  </div>

                  {/* Learning Style Details */}
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    🌟 Your Amazing Learning Style:
                  </div>

                  {/* Modifier Details */}
{modifiers.map((modifier, index) => {
  // Check if modifier is a string (like "S") or an object
  const modifierCode = typeof modifier === 'string' ? modifier : modifier.code;
  const modifierData = typeof modifier === 'string' 
    ? studentFriendlyModifiers[modifier] 
    : readingDnaResult.modifierDetails?.[index];
    
  console.log('🎯 Rendering modifier:', modifierCode, modifierData);
  
  if (!modifierData || !modifierData.name) return null;

  return (
    <div key={modifierCode} style={{
      backgroundColor: `${currentTheme.primary}15`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: `1px solid ${currentTheme.primary}30`
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: currentTheme.textPrimary,
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '16px' }}>{modifierData.emoji}</span>
        {modifierData.name}
      </div>
      
      <div style={{
        fontSize: '13px',
        color: currentTheme.textPrimary,
        lineHeight: '1.4',
        marginBottom: '12px'
      }}>
        {modifierData.description}
      </div>

      {modifierData.studentInsights && modifierData.studentInsights.length > 0 && (
        <>
          <div style={{
            fontSize: '12px',
            color: currentTheme.textSecondary,
            marginBottom: '8px'
          }}>
            ✨ What this means:
          </div>
          {modifierData.studentInsights.map((insight, i) => (
            <div key={i} style={{
              fontSize: '11px',
              color: currentTheme.textSecondary,
              marginBottom: '4px',
              paddingLeft: '12px'
            }}>
              • {insight}
            </div>
          ))}
        </>
      )}

      {modifierData.studentTips && modifierData.studentTips.length > 0 && (
        <>
          <div style={{
            fontSize: '12px',
            color: currentTheme.textSecondary,
            marginBottom: '8px',
            marginTop: '12px'
          }}>
            🚀 Ways to use your learning style:
          </div>
          {modifierData.studentTips.map((tip, i) => (
            <div key={i} style={{
              fontSize: '11px',
              color: currentTheme.textSecondary,
              marginBottom: '4px',
              paddingLeft: '12px'
            }}>
              • {tip}
            </div>
          ))}
        </>
      )}
    </div>
  );
})}

                  {/* Footer Message */}
                  <div style={{
                    backgroundColor: `${currentTheme.secondary}20`,
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    marginTop: '20px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: currentTheme.textPrimary,
                      lineHeight: '1.4',
                      marginBottom: '8px'
                    }}>
                      💝 This special insight was unlocked by someone who cares about your learning!
                    </div>
                    
                    <div style={{
                      fontSize: '11px',
                      color: currentTheme.textSecondary,
                      fontStyle: 'italic',
                      marginBottom: '8px'
                    }}>
                      Remember: This describes how you learn best RIGHT NOW. As you grow and try new things, you might discover even more about yourself!
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textPrimary,
                      fontWeight: '600'
                    }}>
                      🌱 Every reader is unique and amazing!
                    </div>
                  </div>

                  {/* Close Button */}
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={() => setShowLearningStyleModal(false)}
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: currentTheme.textPrimary,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      ✨ This is so cool!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* CELEBRATION ANIMATION MODAL */}
        {isUnlockCelebrating && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{
              textAlign: 'center',
              color: 'white',
              animation: 'bounceIn 1s ease'
            }}>
              <div style={{
                fontSize: '80px',
                marginBottom: '20px',
                animation: 'pulse 1s infinite'
              }}>
                🎉✨🔓✨🎉
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Special Discovery Unlocked!
              </div>
              <div style={{
                fontSize: '16px',
                opacity: 0.9
              }}>
                Get ready to learn something amazing about yourself...
              </div>
            </div>
          </div>
        )}

        {/* READING DNA INFO MODAL */}
        {showReadingDnaInfoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: currentTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: currentTheme.textPrimary, fontSize: '18px' }}>🔬 About This Cool Tool</h3>
                <button 
                  onClick={() => setShowReadingDnaInfoModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: currentTheme.textSecondary,
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ color: currentTheme.textPrimary, fontSize: '14px', margin: '0 0 6px 0' }}>
                  🧪 What Makes This Scientific?
                </h4>
                <p style={{ 
                  fontSize: '12px', 
                  color: currentTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Scientists who study how kids learn to love reading have discovered cool things about what makes reading exciting! 
                  This tool is inspired by their discoveries, but it&apos;s our fun way of helping you understand yourself.
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ color: currentTheme.textPrimary, fontSize: '14px', margin: '0 0 6px 0' }}>
                  🎮 This is For Fun and Learning About Yourself
                </h4>
                <p style={{ 
                  fontSize: '12px', 
                  color: currentTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  This isn&apos;t a test or grade - it&apos;s like a fun personality quiz! It helps you think about what you like 
                  and how you can make reading even more awesome for yourself.
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ color: currentTheme.textPrimary, fontSize: '14px', margin: '0 0 6px 0' }}>
                  🌟 You&apos;re Unique and Special!
                </h4>
                <p style={{ 
                  fontSize: '12px', 
                  color: currentTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Remember, this is just one way to think about reading. You might be a mix of different types, 
                  or you might change over time. Every reader is different and that&apos;s what makes it exciting!
                </p>
              </div>

              <div style={{
                backgroundColor: `${currentTheme.primary}15`,
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: currentTheme.textPrimary,
                  margin: 0,
                  lineHeight: '1.3',
                  fontWeight: '600'
                }}>
                  The most important thing? Have fun with reading! 📖✨
                </p>
              </div>
            </div>
          </div>
        )}
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
            <div className="quiz-modal-content" style={{
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

        {/* NOMINEE QUIZ TAKING MODAL */}
        {showNomineeQuizModal && currentNomineeQuiz && currentNomineeQuestion && (
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
            <div className="nominee-quiz-modal-content" style={{
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
                onClick={() => setShowNomineeQuizModal(false)}
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
                  {currentNomineeQuiz.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  Question {currentQuestionIndex + 1} of {currentNomineeQuiz.questions.length}
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
                  {currentNomineeQuestion.question}
                </div>

                {/* Answer Options */}
                <div style={{
                  display: 'grid',
                  gap: '10px'
                }}>
                  {currentNomineeQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => answerNomineeQuestion(index)}
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
                      {option.text}
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
                      width: `${((currentQuestionIndex + 1) / currentNomineeQuiz.questions.length) * 100}%`,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme.textSecondary
                  }}>
                    {Math.round(((currentQuestionIndex + 1) / currentNomineeQuiz.questions.length) * 100)}% Complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}{/* QUIZ RESULT MODAL */}
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
              <div className="result-modal-content" style={{
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
                  onClick={() => {
  setShowQuizResult(false);
  setShowMyDnaModal(true);  // Return to DNA results
}}
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
                <div className="result-image-container" style={{
                  width: '300px',
                  height: '360px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '40px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '20px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(8px)',
                    zIndex: 0
                  }} />
                  <img 
                    src={quizResult.icon_asset?.replace('assets/', '/') || `/saints/${quizResult.saint_id}.png`} 
                    alt={quizResult.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                      borderRadius: '12px'
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
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                  }}>
                    ♔
                  </div>
                </div>

                {/* RESULT INFO CARD */}
                <div className="result-info-card" style={{
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
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
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
                  <div className="result-action-buttons" style={{
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
                      onClick={() => {
  setShowQuizResult(false);
  setShowMyDnaModal(true);  // Return to DNA results
}}
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

        {/* NOMINEE QUIZ RESULT MODAL */}
        {showNomineeQuizResult && nomineeQuizResult && (() => {
          const bookDetails = getBookDetails(nomineeQuizResult.book_id);
          const resultTitlePrefix = currentNomineeQuiz?.result_title_prefix || 'Your Book World Result';
          
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
              <div className="nominee-result-modal-content" style={{
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
                  onClick={() => {
  setShowNomineeQuizResult(false);
  setShowMyDnaModal(true);
}}
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

                {/* LARGE BOOK COVER */}
                <div className="nominee-result-image-container" style={{
                  width: '280px',
                  height: '420px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '40px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '20px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
                    borderRadius: '12px',
                    filter: 'blur(8px)',
                    zIndex: 0
                  }} />
                  <img 
                    src={bookDetails?.coverImageUrl || '/placeholder-book.png'} 
                    alt={nomineeQuizResult.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
                      zIndex: 1,
                      position: 'relative'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback for missing cover */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px',
                    color: 'rgba(255,255,255,0.8)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    zIndex: 1,
                    position: 'relative'
                  }}>
                    □
                  </div>
                </div>

                {/* RESULT INFO CARD */}
                <div className="nominee-result-info-card" style={{
                  backgroundColor: currentTheme.surface,
                  borderRadius: '14px',
                  padding: '20px',
                  width: '90%',
                  maxWidth: '320px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  textAlign: 'center',
                  border: `2px solid ${currentTheme.primary}40`
                }}>
                  {/* Result Header */}
                  <div style={{
                    fontSize: resultTitlePrefix.length > 25 ? '14px' : '16px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '12px',
                    lineHeight: '1.3',
                    textAlign: 'center'
                  }}>
                    🎉 {resultTitlePrefix} 🎉
                  </div>

                  {/* Book Title */}
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    margin: '0 0 8px 0',
                    fontFamily: 'Didot, "Times New Roman", serif',
                    lineHeight: '1.3'
                  }}>
                    {nomineeQuizResult.title}
                  </h2>

                  {/* Book Details */}
                  {bookDetails && (
                    <div style={{
                      backgroundColor: `${currentTheme.primary}20`,
                      color: currentTheme.textPrimary,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      display: 'inline-block',
                      marginBottom: '12px'
                    }}>
                      {bookDetails.title} by {bookDetails.authors}
                    </div>
                  )}

                  {/* Description */}
                  <div style={{
                    fontSize: '13px',
                    color: currentTheme.textPrimary,
                    lineHeight: '1.4',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    {nomineeQuizResult.description}
                  </div>

                  {/* Action Buttons */}
                  <div className="nominee-result-action-buttons" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => {
                        setShowNomineeQuizResult(false);
                        startNomineeQuiz(currentNomineeQuiz);
                      }}
                      style={{
                        backgroundColor: `${currentTheme.primary}20`,
                        color: currentTheme.textPrimary,
                        border: `1px solid ${currentTheme.primary}40`,
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
                      onClick={() => {
  setShowNomineeQuizResult(false);
  setShowMyDnaModal(true);
}}
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: currentTheme.textPrimary,
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
                      ✨ Perfect!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
{/* MY DNA RESULTS MODAL - UPDATED WITH READING DNA */}
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
            <div className="my-dna-modal-content" style={{
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

              <div className="my-dna-modal-header" style={{
                padding: '20px 20px 10px',
                textAlign: 'center',
                backgroundColor: currentTheme.primary,
                borderRadius: '20px 20px 0 0'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: fixedTextPrimary,
                  margin: '0',
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  🧬 My Lux DNA Results
                </h2>
              </div>

              <div className="my-dna-modal-body" style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 20px 20px'
              }}>
                {getCompletedQuizzesCount() === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔬</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: fixedTextPrimary,
                      marginBottom: '8px'
                    }}>
                      No DNA Results Yet
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: currentTheme.textSecondary,
                      lineHeight: '1.5'
                    }}>
                      Take some quizzes to discover your personality matches!
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Reading DNA Result - Featured at Top */}
                    {isReadingDnaCompleted() && (
                      <>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: fixedTextPrimary,
                          marginBottom: '16px',
                          textAlign: 'center'
                        }}>
                          🧬 Your Reading DNA:
                        </div>
                        
                        <button
                          onClick={showReadingDnaResultModal}
                          style={{
                            backgroundColor: `${getReadingDnaResult()?.details?.color}30`,
                            border: `2px solid ${getReadingDnaResult()?.details?.color}80`,
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            textAlign: 'left',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            width: '100%',
                            marginBottom: '24px'
                          }}
                        >
                          <div style={{
                            fontSize: '28px',
                            flexShrink: 0
                          }}>
                            {getReadingDnaResult()?.details?.emoji}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: currentTheme.textSecondary,
                              marginBottom: '4px'
                            }}>
                              {getReadingDnaResult()?.details?.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: currentTheme.textSecondary,
                              lineHeight: '1.3'
                            }}>
                              {getReadingDnaResult()?.details?.description?.substring(0, 80)}...
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: getReadingDnaResult()?.details?.color,
                              fontWeight: '600',
                              marginTop: '4px'
                            }}>
                              ✨ View Your Reading DNA
                            </div>
                          </div>
                        </button>
                      </>
                    )}

                    {/* Saint Quiz Results */}
{Object.keys(studentData?.quizResults || {}).length > 0 && (
  <>
    <button
      onClick={() => setIsSaintResultsExpanded(!isSaintResultsExpanded)}
      style={{
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        padding: '0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: isSaintResultsExpanded ? '16px' : '20px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <span style={{
        fontSize: '14px',
        fontWeight: '600',
        color: fixedTextPrimary,
        textAlign: 'center'
      }}>
        ♔ Your Saint Personality Matches ({Object.keys(studentData?.quizResults || {}).length})
      </span>
      <span style={{
        fontSize: '12px',
        color: fixedTextPrimary,
        transform: isSaintResultsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease'
      }}>
        ▶
      </span>
    </button>
    
    {isSaintResultsExpanded && (
      <div className="dna-results-grid" style={{
        display: 'grid',
        gap: '8px',
        marginBottom: '20px',
        animation: 'fadeIn 0.3s ease'
      }}>
        {Object.entries(studentData?.quizResults || {}).map(([quizId, result]) => {
                            const quiz = quizzes.find(q => q.quiz_id === quizId);
                            if (!quiz) return null;
                            
                            return (
                              <button
                                key={quizId}
                                onClick={() => showDnaResult(quizId, result)}
                                style={{
                                  backgroundColor: `${currentTheme.primary}15`,
                                  border: `1px solid ${currentTheme.primary}30`,
                                  borderRadius: '12px',
                                  padding: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  textAlign: 'left',
                                  touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent',
                                  width: '100%'
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
                                    color: fixedTextPrimary,
opacity: 0.9,
                                    marginBottom: '2px'
                                  }}>
                                    {quiz.title}
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: fixedTextPrimary,
                                    marginBottom: '2px'
                                  }}>
                                    {result.saintName}
                                  </div>
                                  <div style={{
                                    fontSize: '10px',
                                    color: fixedTextPrimary,
opacity: 0.85
                                  }}>
                                    Completed {result.timesCompleted} time{result.timesCompleted > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        )}
                      </>
                    )}

                    {/* Nominee Quiz Results */}
{Object.keys(studentData?.nomineeQuizResults || {}).length > 0 && (
  <>
    <button
      onClick={() => setIsNomineeResultsExpanded(!isNomineeResultsExpanded)}
      style={{
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        padding: '0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: isNomineeResultsExpanded ? '16px' : '0',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <span style={{
        fontSize: '14px',
        fontWeight: '600',
        color: fixedTextPrimary,
        textAlign: 'center'
      }}>
        □ Your Book World Matches ({Object.keys(studentData?.nomineeQuizResults || {}).length})
      </span>
      <span style={{
        fontSize: '12px',
        color: fixedTextPrimary,
        transform: isNomineeResultsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease'
      }}>
        ▶
      </span>
    </button>
    
    {isNomineeResultsExpanded && (
      <div className="nominee-dna-results-grid" style={{
        display: 'grid',
        gap: '8px',
        animation: 'fadeIn 0.3s ease'
      }}>
        {Object.entries(studentData?.nomineeQuizResults || {}).map(([quizId, result]) => {
                            // Try finding quiz with flexible ID matching
                            let quiz = nomineeQuizzes.find(q => q.id === quizId);
                            if (!quiz) {
                              quiz = nomineeQuizzes.find(q => q.id === String(quizId));
                            }
                            if (!quiz) {
                              quiz = nomineeQuizzes.find(q => q.id === Number(quizId));
                            }
                            
                            if (!quiz) return null;
                            
                            return (
                              <button
                                key={quizId}
                                onClick={() => showNomineeDnaResult(quizId, result)}
                                style={{
                                  backgroundColor: `${currentTheme.secondary}15`,
                                  border: `1px solid ${currentTheme.secondary}30`,
                                  borderRadius: '12px',
                                  padding: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  textAlign: 'left',
                                  touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent',
                                  width: '100%'
                                }}
                              >
                                <div style={{
                                  fontSize: '20px',
                                  flexShrink: 0
                                }}>
                                  □
                                </div>
                                
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: '12px',
                                    color: fixedTextPrimary,
opacity: 0.9,
                                    marginBottom: '2px'
                                  }}>
                                    {quiz.title}
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: fixedTextPrimary,
                                    marginBottom: '2px'
                                  }}>
                                    {result.bookTitle}
                                  </div>
                                  <div style={{
                                    fontSize: '10px',
                                    color: fixedTextPrimary,
opacity: 0.85
                                  }}>
                                    Completed {result.timesCompleted} time{result.timesCompleted > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        )}
                      </>
                    )}
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
          
          @keyframes slideInDown {
            from { 
              opacity: 0; 
              transform: translateY(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
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

          @media screen and (min-width: 768px) and (max-width: 1024px) {
            .stats-main-content {
              max-width: 600px !important;
              padding: 24px !important;
            }
            
            .phase-alert-banner {
              margin: 0 24px 20px 24px !important;
              padding: 20px 24px !important;
            }
            
            .dna-summary-card {
              padding: 28px !important;
              margin-bottom: 28px !important;
            }
            
            .quiz-category-card {
              padding: 24px !important;
              margin-bottom: 24px !important;
            }
            
            .quiz-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
            
            .nominee-quiz-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
            
            .quiz-modal-content {
              max-width: 480px !important;
              padding: 24px !important;
            }
            
            .nominee-quiz-modal-content {
              max-width: 480px !important;
              padding: 24px !important;
            }
            
            .reading-dna-modal-content {
              max-width: 480px !important;
              padding: 24px !important;
            }
            
            .reading-dna-result-modal-content {
              max-width: 420px !important;
            }
            
            .reading-dna-result-image-container {
              width: 340px !important;
              height: 400px !important;
            }
            
            .reading-dna-result-info-card {
              padding: 24px !important;
              width: 95% !important;
              max-width: 360px !important;
            }
            
            .reading-dna-result-action-buttons {
              gap: 12px !important;
            }
            
            .result-modal-content {
              max-width: 420px !important;
            }
            
            .nominee-result-modal-content {
              max-width: 420px !important;
            }
            
            .result-image-container {
              width: 340px !important;
              height: 400px !important;
            }
            
            .nominee-result-image-container {
              width: 320px !important;
              height: 460px !important;
            }
            
            .result-info-card {
              padding: 24px !important;
              width: 95% !important;
              max-width: 360px !important;
            }
            
            .nominee-result-info-card {
              padding: 24px !important;
              width: 95% !important;
              max-width: 360px !important;
            }
            
            .result-action-buttons {
              gap: 12px !important;
            }
            
            .nominee-result-action-buttons {
              gap: 12px !important;
            }
            
            .my-dna-modal-content {
              max-width: 480px !important;
            }
            
            .my-dna-modal-header {
              padding: 24px 24px 12px !important;
            }
            
            .my-dna-modal-body {
              padding: 24px !important;
            }
            
            .dna-results-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
            
            .nominee-dna-results-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
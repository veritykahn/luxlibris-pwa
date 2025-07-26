// pages/parent/dna-lab/index.js - Optimized Dashboard with Professional Design
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { usePremiumFeatures } from '../../../hooks/usePremiumFeatures';
import PremiumGate from '../../../components/PremiumGate';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { updateStudentDataEntities } from '../../../lib/firebase';
import { getCurrentWeekContent, categoryColors, bottomLineMessages } from '../../../lib/weekly-tips-facts';
import { READING_SCIENCE_RESEARCH, getScienceHelpers } from '../../../lib/science-of-reading';

// DNA Type Configuration - Professional approach
const dnaTypeConfig = {
  'authentic_modeler': { emoji: '🦋', color: '#9B59B6' },
  'competence_builder': { emoji: '🦉', color: '#3498DB' },
  'connection_creator': { emoji: '🐬', color: '#E74C3C' },
  'autonomy_supporter': { emoji: '🦅', color: '#F39C12' },
  'meaning_maker': { emoji: '🌟', color: '#1ABC9C' },
  'growth_facilitator': { emoji: '🌱', color: '#27AE60' }
};

// Daily 5-Minute Wins
const dailyWins = {
  Monday: { emoji: '🔮', task: 'Let your child predict what happens next', tip: 'Pause at an exciting moment and ask!' },
  Tuesday: { emoji: '🎵', task: 'Find rhyming words together', tip: 'Try during meals or car rides' },
  Wednesday: { emoji: '📍', task: 'New reading spot adventure', tip: 'Under a table? In a closet?' },
  Thursday: { emoji: '🎭', task: 'Character voices make it fun', tip: 'Be silly - kids love it!' },
  Friday: { emoji: '🎨', task: 'Draw the story together', tip: 'Stick figures are perfect!' },
  Saturday: { emoji: '❓', task: 'Question time - they ask YOU', tip: 'No wrong questions exist!' },
  Sunday: { emoji: '👑', task: 'Role reversal - they teach', tip: 'Let them "read" using pictures' }
};

// Reflection prompts for dashboard
const reflectionPrompts = [
  "What surprised you about reading with your child this week?",
  "When did you feel most connected during reading time?",
  "What reading challenge did you overcome together?",
  "How has your understanding of your child's reading style grown?",
  "What small reading victory are you celebrating today?",
  "How did you honor your child's reading preferences this week?",
  "What did you learn about yourself as a reading parent?",
  "When did reading feel effortless and joyful recently?"
];

// Memoized Discovery Card Component
const DiscoveryCard = memo(({ 
  title, 
  subtitle, 
  icon, 
  content, 
  onClick, 
  borderColor, 
  hoverColor,
  actionText,
  minHeight = '180px'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
        border: `2px solid ${isHovered ? hoverColor : borderColor}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '24px' }}>{icon}</div>
        <div>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#556B7A',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {subtitle}
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#223848'
          }}>
            {title}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '13px',
        color: '#223848',
        lineHeight: '1.5',
        flex: 1
      }}>
        {content}
      </div>
      {actionText && onClick && (
        <div style={{
          fontSize: '11px',
          color: '#ADD4EA',
          fontWeight: '600',
          textAlign: 'right',
          marginTop: '8px'
        }}>
          {actionText}
        </div>
      )}
    </div>
  );
});

DiscoveryCard.displayName = 'DiscoveryCard';

export default function ParentDnaLabDashboard() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const { hasFeature, isPilotPhase } = usePremiumFeatures();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoadedData, setHasLoadedData] = useState(false); // Prevent multiple loads
  
  // Parent DNA states
  const [parentDnaTypes, setParentDnaTypes] = useState({});
  const [parentDnaQuestions, setParentDnaQuestions] = useState([]);
  const [parentData, setParentData] = useState(null);
  const [hasParentDna, setHasParentDna] = useState(false);
  const [parentDnaType, setParentDnaType] = useState(null);
  
  // Children data states
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [childrenDnaData, setChildrenDnaData] = useState({});
  const [childrenDnaTypes, setChildrenDnaTypes] = useState({});
  const [compatibilityData, setCompatibilityData] = useState({});
  
  // Weekly facts/insights
  const [weeklyParentFact, setWeeklyParentFact] = useState(null);
  const [weeklyChildFact, setWeeklyChildFact] = useState(null);
  const [weeklyScienceFact, setWeeklyScienceFact] = useState(null);
  
  // UI states
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockingChild, setUnlockingChild] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showRetakeInfo, setShowRetakeInfo] = useState(false);
  const [showDnaAnimation, setShowDnaAnimation] = useState(false);
  const [showBottomLine, setShowBottomLine] = useState(false);
  const [expandedTip, setExpandedTip] = useState(null);
  const [hoveredDna, setHoveredDna] = useState(null);
  
  // Get current week's content
  const weeklyContent = useMemo(() => {
    const content = getCurrentWeekContent();
    const randomBottomLine = bottomLineMessages[Math.floor(Math.random() * bottomLineMessages.length)];
    return { ...content, bottomLine: randomBottomLine };
  }, []);

  // Get today's 5-minute win
  const todaysWin = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return { day: today, ...dailyWins[today] };
  }, []);

  // Get today's reflection prompt
  const todaysReflectionPrompt = useMemo(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return reflectionPrompts[dayOfYear % reflectionPrompts.length];
  }, []);

  // Get current week number for superpower (Academic Year: June to May)
  const currentWeekNumber = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Determine academic year start
    let academicYearStart;
    if (currentMonth >= 5) { // June (5) or later
      academicYearStart = new Date(currentYear, 5, 1); // June 1st of current year
    } else { // January to May
      academicYearStart = new Date(currentYear - 1, 5, 1); // June 1st of previous year
    }
    
    // Calculate weeks since academic year start
    const weeksSinceStart = Math.floor((now - academicYearStart) / (7 * 24 * 60 * 60 * 1000));
    return weeksSinceStart + 1; // 1-based week number
  }, []);

  // Get time-based theme - memoized with hour dependency
  const timeTheme = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        name: 'morning',
        gradient: 'linear-gradient(135deg, #FFE5B4, #FFD4A3, #FFC594)',
        message: 'Good morning! Perfect time for reading together ☀️',
        overlay: 'rgba(255, 220, 160, 0.1)'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        name: 'afternoon',
        gradient: 'linear-gradient(135deg, #87CEEB, #98D8E8, #ADD8E6)',
        message: 'Afternoon reading break? 📚',
        overlay: 'rgba(135, 206, 235, 0.1)'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #FFB347, #FF8C42, #FF6B35)',
        message: 'Cozy evening reading time 🌅',
        overlay: 'rgba(255, 140, 66, 0.1)'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #4B0082, #6A0DAD, #7B68EE)',
        message: 'Bedtime stories await 🌙',
        overlay: 'rgba(75, 0, 130, 0.1)'
      };
    }
  }, [Math.floor(new Date().getHours() / 6)]); // Only recalc every 6 hours
  
  // Lux Libris Classic Theme with time-based adjustments
  const luxTheme = useMemo(() => ({
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A',
    timeOverlay: timeTheme.overlay
  }), [timeTheme]);

  // DNA Lab navigation options (7 pages)
  const dnaNavOptions = useMemo(() => [
    { 
      name: 'Dashboard', 
      path: '/parent/dna-lab', 
      icon: '🏠', 
      description: 'Command center for family reading',
      current: true 
    },
    { 
      name: 'My Reading DNA', 
      path: '/parent/dna-lab/my-reading-dna', 
      icon: '🧬', 
      description: 'Deep insights about your style' 
    },
    { 
      name: 'My Reading Toolkit', 
      path: '/parent/dna-lab/reading-toolkit', 
      icon: '📚', 
      description: 'Strategies and scripts' 
    },
    { 
      name: "My Kids' Library", 
      path: '/parent/dna-lab/kids-library', 
      icon: '👨‍👩‍👧‍👦', 
      description: 'Child profiles and support' 
    },
    { 
      name: 'Family Dynamics', 
      path: '/parent/dna-lab/family-dynamics', 
      icon: '🤝', 
      description: 'Parent-child compatibility' 
    },
    { 
      name: 'Science Center', 
      path: '/parent/dna-lab/science-center', 
      icon: '🧪', 
      description: 'Research and evidence' 
    },
    { 
      name: 'Reflection & Growth', 
      path: '/parent/dna-lab/reflection-growth', 
      icon: '🌱', 
      description: 'Track your journey' 
    }
  ], []);

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢', current: true },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], []);

  // Get parent primary DNA type key
  const getParentDnaTypeKey = useCallback(() => {
    if (!parentData?.parentDNA) return null;
    
    // Check if primaryType has an id field
    if (parentData.parentDNA.primaryType?.id) {
      return parentData.parentDNA.primaryType.id;
    }
    
    // Then try type field
    if (parentData.parentDNA.type) {
      return parentData.parentDNA.type;
    }
    
    // Otherwise find highest percentage
    if (parentData.parentDNA.percentages) {
      let highestKey = null;
      let highestValue = 0;
      Object.entries(parentData.parentDNA.percentages).forEach(([key, value]) => {
        if (value > highestValue) {
          highestValue = value;
          highestKey = key;
        }
      });
      return highestKey;
    }
    
    return null;
  }, [parentData]);

  // Get weekly science fact (changes once per week)
  const getWeeklyScienceFact = useCallback(() => {
    // Use week number as seed for consistent weekly fact
    const weekSeed = currentWeekNumber;
    const studies = READING_SCIENCE_RESEARCH.featuredStudies;
    if (!studies || studies.length === 0) return null;
    
    // Use week number to pick a consistent study for the week
    const studyIndex = weekSeed % studies.length;
    return studies[studyIndex];
  }, [currentWeekNumber]);

  // Get weekly parent fact (changes once per week)
  const getWeeklyParentFact = useCallback(() => {
    if (!parentDnaType) return null;
    
    const factSources = [];
    
    // From DNA type
    if (parentDnaType.strengths) {
      parentDnaType.strengths.forEach(s => 
        factSources.push({ fact: s, source: 'dna', label: 'Your Strength' })
      );
    }
    
    if (parentDnaType.psychologicalCore?.dailyBehaviors) {
      parentDnaType.psychologicalCore.dailyBehaviors.forEach(b => 
        factSources.push({ fact: b, source: 'dna', label: 'How You Show Up' })
      );
    }
    
    if (parentDnaType.confidenceBuilders) {
      parentDnaType.confidenceBuilders.forEach(c => 
        factSources.push({ fact: c, source: 'dna', label: 'Research Says' })
      );
    }
    
    // From toolkit strategies
    if (parentDnaType.dailyStrategies) {
      Object.entries(parentDnaType.dailyStrategies).forEach(([category, strategies]) => {
        strategies.forEach(s => 
          factSources.push({ fact: s, source: 'toolkit', label: `${category} Strategy` })
        );
      });
    }
    
    if (factSources.length === 0) return null;
    
    // Use week number as seed for consistent weekly fact
    const weekSeed = currentWeekNumber;
    const factIndex = weekSeed % factSources.length;
    return factSources[factIndex];
  }, [parentDnaType, currentWeekNumber]);

  // Get weekly child fact (changes once per week)
  const getWeeklyChildFact = useCallback(() => {
    const childrenWithDna = linkedStudents.filter(s => s.readingDNA);
    if (childrenWithDna.length === 0) return null;
    
    // Use week number to pick child consistently
    const weekSeed = currentWeekNumber;
    const childIndex = weekSeed % childrenWithDna.length;
    const child = childrenWithDna[childIndex];
    
    if (!child) return null;
    
    const childDnaTypeKey = child.readingDNA?.type || child.readingDNA?.primaryType?.id;
    const childType = childrenDnaTypes[childDnaTypeKey];
    const parentDnaTypeKey = getParentDnaTypeKey();
    const compatibility = parentDnaTypeKey && childDnaTypeKey ? 
      compatibilityData[`${parentDnaTypeKey}_${childDnaTypeKey}`] : null;
    
    const factSources = [];
    
    // From child type - add safety checks
    if (childType?.intrinsicMotivators && Array.isArray(childType.intrinsicMotivators)) {
      childType.intrinsicMotivators.forEach(m => 
        factSources.push({ 
          fact: m, 
          source: 'library', 
          label: `What Motivates ${child.firstName}`,
          childName: child.firstName 
        })
      );
    }
    
    // Check child details as fallback
    if (!childType && child.readingDNA?.details?.intrinsicMotivators) {
      child.readingDNA.details.intrinsicMotivators.forEach(m => 
        factSources.push({ 
          fact: m, 
          source: 'library', 
          label: `What Motivates ${child.firstName}`,
          childName: child.firstName 
        })
      );
    }
    
    // From compatibility - try different key formats
    if (compatibility?.realityCheck?.howToNavigate) {
      factSources.push({ 
        fact: compatibility.realityCheck.howToNavigate, 
        source: 'dynamics', 
        label: `Working with ${child.firstName}`,
        childName: child.firstName 
      });
    }
    
    if (compatibility?.specificStrategies && Array.isArray(compatibility.specificStrategies)) {
      compatibility.specificStrategies.forEach(s => 
        factSources.push({ 
          fact: s, 
          source: 'dynamics', 
          label: `Activity for ${child.firstName}`,
          childName: child.firstName 
        })
      );
    }
    
    // Try without parent DNA if no compatibility found
    if (!compatibility && childDnaTypeKey) {
      // Just use child type data if no compatibility data
      if (childType?.encouragingWords) {
        factSources.push({ 
          fact: childType.encouragingWords[0], 
          source: 'library', 
          label: `Encouraging ${child.firstName}`,
          childName: child.firstName 
        });
      }
    }
    
    if (factSources.length === 0) return null;
    
    // Use week number + child index to vary facts weekly
    const factIndex = (weekSeed + childIndex) % factSources.length;
    return factSources[factIndex];
  }, [linkedStudents, childrenDnaTypes, compatibilityData, currentWeekNumber, getParentDnaTypeKey, parentData]);

  // Load parent DNA types from Firebase
  const loadParentDnaTypes = useCallback(async () => {
    try {
      console.log('🧬 Loading parent DNA types...');
      const typesRef = collection(db, 'parent-dna-types');
      const typesSnapshot = await getDocs(typesRef);
      const types = {};
      typesSnapshot.forEach(doc => {
        types[doc.id] = doc.data();
      });
      setParentDnaTypes(types);
      console.log('✅ Loaded', Object.keys(types).length, 'parent DNA types');
      return types;
    } catch (error) {
      console.error('❌ Error loading parent DNA types:', error);
      return {};
    }
  }, []);

  // Load parent DNA questions from Firebase
  const loadParentDnaQuestions = useCallback(async () => {
    try {
      console.log('📋 Loading parent DNA questions...');
      const questionsRef = collection(db, 'parent-dna-questions');
      const questionsSnapshot = await getDocs(questionsRef);
      const questions = [];
      questionsSnapshot.forEach(doc => {
        questions.push({ id: doc.id, ...doc.data() });
      });
      setParentDnaQuestions(questions);
      console.log('✅ Loaded', questions.length, 'parent DNA questions');
    } catch (error) {
      console.error('❌ Error loading parent DNA questions:', error);
    }
  }, []);

  // Load linked students and their DNA data
  const loadLinkedStudentsData = useCallback(async (linkedStudentIds) => {
    try {
      const students = [];
      const dnaData = {};
      
      // Search all entities/schools for linked students
      const entitiesRef = collection(db, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id;
        const schoolsRef = collection(db, `entities/${entityId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          const schoolData = schoolDoc.data();
          const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
          const studentsSnapshot = await getDocs(studentsRef);
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              };
              students.push(studentData);
              
              // Store DNA data separately for easy access
              if (studentData.readingDNA) {
                dnaData[studentDoc.id] = studentData.readingDNA;
              }
            }
          }
        }
      }
      
      setLinkedStudents(students);
      setChildrenDnaData(dnaData);
      console.log('✅ Linked students loaded:', students.length);
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error);
    }
  }, []);

  // Load additional data for random facts
  const loadAdditionalData = useCallback(async () => {
    try {
      // Load children DNA types
      const typesRef = collection(db, 'reading-dna-types');
      const typesSnapshot = await getDocs(typesRef);
      const types = {};
      typesSnapshot.forEach(doc => {
        types[doc.id] = doc.data();
      });
      setChildrenDnaTypes(types);
      
      // Load compatibility data
      const compatRef = collection(db, 'parent-child-compatibility');
      const compatSnapshot = await getDocs(compatRef);
      const compat = {};
      compatSnapshot.forEach(doc => {
        compat[doc.id] = doc.data();
      });
      setCompatibilityData(compat);
      
      // Get weekly science fact
      const weeklyFact = getWeeklyScienceFact();
      setWeeklyScienceFact(weeklyFact);
      
    } catch (error) {
      console.error('❌ Error loading additional data:', error);
    }
  }, [getWeeklyScienceFact]);

  // Initial data load
  const loadDashboardData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🏠 Loading DNA Lab dashboard data...');
      
      // Load DNA types first and get them immediately
      const types = await loadParentDnaTypes();
      await loadParentDnaQuestions();
      
      // Load parent data
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        setParentData(data);
        setHasParentDna(!!data.parentDNA);
        
        // If parent has DNA, find their type
        if (data.parentDNA) {
          // Extract the type key from different possible locations
          let dnaTypeKey = null;
          
          // Check if primaryType has an id field
          if (data.parentDNA.primaryType?.id) {
            dnaTypeKey = data.parentDNA.primaryType.id;
          }
          // Check for type field
          else if (data.parentDNA.type) {
            dnaTypeKey = data.parentDNA.type;
          }
          // Find the highest percentage if no explicit type
          else if (data.parentDNA.percentages) {
            let highestPercentage = 0;
            Object.entries(data.parentDNA.percentages).forEach(([key, value]) => {
              if (value > highestPercentage) {
                highestPercentage = value;
                dnaTypeKey = key;
              }
            });
          }
          
          // Get the full type data
          if (dnaTypeKey && types[dnaTypeKey]) {
            const typeData = types[dnaTypeKey];
            
            // If primaryType has details, merge them
            if (data.parentDNA.primaryType?.details) {
              Object.assign(typeData, data.parentDNA.primaryType.details);
            }
            
            setParentDnaType(typeData);
            console.log('✅ Found parent DNA type:', typeData.name);
            
            // Trigger fun animation for first-time viewers
            if (!localStorage.getItem(`dna_viewed_${user.uid}`)) {
              setShowDnaAnimation(true);
              localStorage.setItem(`dna_viewed_${user.uid}`, 'true');
            }
          } else {
            console.log('❌ Could not find parent DNA type for key:', dnaTypeKey);
          }
        }
        
        // Load linked students if any
        if (data.linkedStudents?.length > 0) {
          await loadLinkedStudentsData(data.linkedStudents);
        }
      }
      
      // Load additional data for random facts
      await loadAdditionalData();
      
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
    }
    
    setLoading(false);
  }, [loadParentDnaTypes, loadParentDnaQuestions, loadLinkedStudentsData, loadAdditionalData, user]);

  // Set weekly facts when data is loaded
  useEffect(() => {
    if (parentDnaType && currentWeekNumber) {
      const weeklyFact = getWeeklyParentFact();
      setWeeklyParentFact(weeklyFact);
    }
  }, [parentDnaType, currentWeekNumber, getWeeklyParentFact]);

  useEffect(() => {
    if (linkedStudents.length > 0 && 
        childrenDnaTypes && Object.keys(childrenDnaTypes).length > 0 &&
        compatibilityData && Object.keys(compatibilityData).length > 0 &&
        currentWeekNumber && parentData) {
      const weeklyFact = getWeeklyChildFact();
      setWeeklyChildFact(weeklyFact);
    }
  }, [linkedStudents, childrenDnaTypes, compatibilityData, currentWeekNumber, parentData, getWeeklyChildFact]);

  // Effect to load initial data - FIXED to prevent constant reloading
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent' && !hasLoadedData) {
      if (hasFeature('dnaLab')) {
        setHasLoadedData(true);
        loadDashboardData();
      } else {
        setLoading(false);
      }
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector');
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard');
    }
  }, [authLoading, isAuthenticated, user?.uid, userProfile?.accountType, hasLoadedData, hasFeature]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDnaDropdown && !event.target.closest('.dna-dropdown-container')) {
        setShowDnaDropdown(false);
      }
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDnaDropdown(false);
        setShowNavMenu(false);
        setShowUnlockModal(false);
        setShowResearchModal(false);
        setShowBottomLine(false);
        setShowSuccess('');
      }
    };

    if (showDnaDropdown || showNavMenu || showUnlockModal || showResearchModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDnaDropdown, showNavMenu, showUnlockModal, showResearchModal]);

  // Unlock Reading DNA for a child
  const unlockReadingDnaForChild = async () => {
    if (!unlockingChild || !user?.uid) return;
    
    try {
      console.log('🔓 Unlocking Reading DNA for:', unlockingChild.firstName);
      
      await updateStudentDataEntities(
        unlockingChild.id, 
        unlockingChild.entityId, 
        unlockingChild.schoolId, 
        {
          learningStyleUnlocked: true,
          learningStyleUnlockedAt: new Date(),
          learningStyleUnlockedBy: user.uid
        }
      );
      
      setShowSuccess(`✅ Reading DNA unlocked for ${unlockingChild.firstName}!`);
      setShowUnlockModal(false);
      setUnlockingChild(null);
      
      // Reload student data
      if (parentData?.linkedStudents) {
        await loadLinkedStudentsData(parentData.linkedStudents);
      }
      
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error unlocking Reading DNA:', error);
      setShowSuccess('❌ Failed to unlock. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  // Navigate to DNA pages
  const handleDnaNavigation = (option) => {
    if (option.current) return;
    setShowDnaDropdown(false);
    router.push(option.path);
  };

  // Handle back button click
  const handleBackClick = () => {
    console.log('Back button clicked - navigating to parent dashboard');
    router.push('/parent/dashboard');
  };

  // Check if child has completed Reading DNA
  const hasChildCompletedDna = (child) => {
    return !!child.readingDNA;
  };

  // Check if child's learning style is unlocked
  const isChildLearningStyleUnlocked = (child) => {
    return !!child.learningStyleUnlocked || !!child.readingDNA;
  };

  // Get child's DNA type name
  const getChildDnaTypeName = (child) => {
    return child.readingDNA?.details?.name || 'Not completed';
  };

  // Navigate based on fact source - simplified navigation
  const handleFactClick = (source, factData) => {
    // Simple navigation without query params since they might not be handled
    switch(source) {
      case 'dna':
        router.push('/parent/dna-lab/my-reading-dna');
        break;
      case 'toolkit':
        router.push('/parent/dna-lab/reading-toolkit');
        break;
      case 'library':
        router.push('/parent/dna-lab/kids-library');
        break;
      case 'dynamics':
        router.push('/parent/dna-lab/family-dynamics');
        break;
      case 'science':
        router.push('/parent/dna-lab/science-center');
        break;
      default:
        break;
    }
  };

  // Show loading
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading Reading DNA Lab...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reading DNA Lab - Lux Libris</title>
        <meta name="description" content="Discover your family's reading personalities and unlock powerful insights" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative'
      }}>
        {/* Time-based overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: timeTheme.overlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: showSuccess.includes('❌') ? '#DC143C' : '#4CAF50',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
            maxWidth: '90vw',
            animation: 'slideInDown 0.3s ease-out'
          }}>
            {showSuccess}
          </div>
        )}
        
        {/* Header with DNA Lab Dropdown */}
        <div style={{
          background: timeTheme.gradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            style={{
              position: 'absolute',
              left: '20px',
              top: '30px',
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
              color: luxTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              zIndex: 101
            }}
          >
            ←
          </button>

          {/* DNA Lab Dropdown Navigation */}
          <div className="dna-dropdown-container" style={{ 
            display: 'flex',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowDnaDropdown(!showDnaDropdown)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                fontSize: '16px',
                fontWeight: '500',
                minHeight: '40px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>🧬</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Reading DNA Lab</span>
              {isPilotPhase && (
                <span style={{
                  backgroundColor: '#10B981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '600',
                  marginLeft: '4px'
                }}>
                  PILOT
                </span>
              )}
              <span style={{ 
                fontSize: '12px', 
                transform: showDnaDropdown ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s' 
              }}>
                ▼
              </span>
            </button>

            {showDnaDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                minWidth: '280px',
                maxWidth: '320px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: `${luxTheme.primary}20`,
                  borderBottom: `1px solid ${luxTheme.primary}40`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    textAlign: 'center'
                  }}>
                    🧬 Reading DNA Lab
                  </div>
                </div>
                
                {dnaNavOptions.map((option, index) => (
                  <button
                    key={option.name}
                    onClick={() => handleDnaNavigation(option)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: option.current ? `${luxTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < dnaNavOptions.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: option.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      fontWeight: option.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!option.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.current) {
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
                        color: luxTheme.textSecondary,
                        opacity: 0.8
                      }}>
                        {option.description}
                      </div>
                    </div>
                    {option.current && (
                      <span style={{ fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px', top: '30px' }}>
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
                color: luxTheme.textPrimary,
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
                backgroundColor: luxTheme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
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
                      backgroundColor: item.current ? `${luxTheme.primary}20` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ 
                        marginLeft: 'auto', 
                        fontSize: '12px', 
                        color: luxTheme.primary 
                      }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time-based message */}
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            marginTop: '8px'
          }}>
            {timeTheme.message}
          </div>
        </div>

        {/* Main Content - NOW wrapped in PremiumGate */}
        <PremiumGate 
          feature="dnaLab"
          customMessage={isPilotPhase ? 
            "🧬 Premium Reading DNA Lab unlocked for pilot users!" :
            "Discover your family's unique reading personalities and unlock powerful insights with personalized strategies."
          }
        >
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            
            {/* Pilot Notice Banner */}
            {isPilotPhase && (
              <div style={{
                background: `linear-gradient(135deg, #10B981, #059669)`,
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧬</div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  Premium Reading DNA Lab Unlocked!
                </h3>
                <p style={{
                  fontSize: '12px',
                  margin: 0,
                  opacity: 0.9
                }}>
                  You&apos;re part of our pilot - discover your family&apos;s reading personalities free during the trial!
                </p>
              </div>
            )}
            
            {/* Welcome/Family DNA Header Card - Time-based theme */}
            <div style={{
              background: timeTheme.gradient,
              borderRadius: '16px',
              padding: '20px',
              boxShadow: `0 8px 24px rgba(0,0,0,0.1)`,
              marginBottom: '20px',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧬</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'Didot, serif',
                margin: '0 0 8px 0'
              }}>
                Your Family&apos;s Reading DNA
              </h2>
              
              <p style={{
                fontSize: '16px',
                margin: '0 0 12px 0',
                opacity: 0.9
              }}>
                Discover unique reading personalities and unlock powerful insights
              </p>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowResearchModal(true);
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease',
                  margin: '0 auto',
                  textDecoration: 'underline'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                <span>💡</span>
                <span>Research-Inspired Tool</span>
              </button>
            </div>
            
            {/* Family DNA Visualization - Redesigned Layout */}
            <div style={{
              background: `linear-gradient(180deg, transparent, ${luxTheme.primary}05)`,
              borderRadius: '20px',
              padding: '32px 20px',
              marginBottom: '24px',
              position: 'relative'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: luxTheme.textPrimary,
                margin: '0 0 24px 0',
                textAlign: 'center',
                fontFamily: 'Didot, serif'
              }}>
                Your Family
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px', // Reduced from 40px
                position: 'relative',
                paddingBottom: '20px'
              }}>
                {/* Parent DNA - Large and Centered */}
                <div style={{ position: 'relative' }}>
                  {!hasParentDna ? (
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => router.push('/parent/dna-lab/assessment')}
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                          border: '3px dashed rgba(255,255,255,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🧬</div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          textAlign: 'center',
                          padding: '0 10px'
                        }}>
                          Discover Your<br />Reading DNA
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: parentDnaType ? 
                            `linear-gradient(135deg, ${parentDnaType.color}, ${parentDnaType.color}DD)` :
                            `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: hoveredDna === 'parent' ? 
                            (parentDnaType ? `0 12px 32px ${parentDnaType.color}60, 0 0 40px ${parentDnaType.color}40` : '0 12px 32px rgba(0,0,0,0.15)') : 
                            (parentDnaType ? `0 8px 24px ${parentDnaType.color}40, 0 0 20px ${parentDnaType.color}20` : '0 8px 24px rgba(0,0,0,0.1)'),
                          transform: hoveredDna === 'parent' ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.3s ease',
                          animation: showDnaAnimation && parentDnaType ? 'dnaReveal 0.6s ease-out' : 'none'
                        }}
                        onClick={() => router.push('/parent/dna-lab/my-reading-dna')}
                        onMouseEnter={() => setHoveredDna('parent')}
                        onMouseLeave={() => setHoveredDna(null)}
                      >
                        <div style={{
                          fontSize: '48px',
                          marginBottom: '4px'
                        }}>
                          {parentDnaType?.emoji || '🧬'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          textAlign: 'center'
                        }}>
                          You
                        </div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: luxTheme.textPrimary,
                        marginTop: '12px',
                        textAlign: 'center',
                        lineHeight: '1.4'
                      }}>
                        {parentDnaType?.name?.split(' ').map((word, i) => (
                          <span key={i}>
                            {word}
                            {i < parentDnaType.name.split(' ').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Children DNA Bubbles - Positioned around parent */}
                  {linkedStudents.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '100%',
                      transform: 'translateY(-50%)',
                      marginLeft: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      {linkedStudents.map((child, index) => {
                        const childDnaType = childrenDnaData[child.id]?.details || childrenDnaTypes[childrenDnaData[child.id]?.type];
                        const angle = (index * 40) - (linkedStudents.length - 1) * 20; // Center vertically
                        
                        return (
                          <div 
                            key={child.id} 
                            style={{ 
                              textAlign: 'center',
                              transform: `translateY(${angle}px)`
                            }}
                          >
                            <div
                              style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: hasChildCompletedDna(child) 
                                  ? `linear-gradient(135deg, ${childDnaType?.color || luxTheme.accent}, ${childDnaType?.color || luxTheme.accent}DD)`
                                  : 'linear-gradient(135deg, #E0E0E0, #BDBDBD)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: hasChildCompletedDna(child) ? 'pointer' : 'default',
                                position: 'relative',
                                boxShadow: hoveredDna === child.id ? '0 6px 16px rgba(0,0,0,0.15)' : '0 3px 10px rgba(0,0,0,0.1)',
                                transform: hoveredDna === child.id ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s ease',
                                border: hasChildCompletedDna(child) && !isChildLearningStyleUnlocked(child) 
                                  ? '2px solid #FFB347' 
                                  : 'none'
                              }}
                              onClick={() => {
                                if (hasChildCompletedDna(child) && !isChildLearningStyleUnlocked(child)) {
                                  setUnlockingChild(child);
                                  setShowUnlockModal(true);
                                } else if (hasChildCompletedDna(child)) {
                                  router.push('/parent/dna-lab/kids-library');
                                }
                              }}
                              onMouseEnter={() => setHoveredDna(child.id)}
                              onMouseLeave={() => setHoveredDna(null)}
                            >
                              <div style={{
                                fontSize: '24px',
                                marginBottom: '2px'
                              }}>
                                {hasChildCompletedDna(child) 
                                  ? childDnaType?.emoji || '✨'
                                  : '❓'}
                              </div>
                              <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: hasChildCompletedDna(child) ? 'white' : luxTheme.textSecondary,
                                textAlign: 'center'
                              }}>
                                {child.firstName}
                              </div>
                              {hasChildCompletedDna(child) && !isChildLearningStyleUnlocked(child) && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-6px',
                                  right: '-6px',
                                  backgroundColor: '#FFB347',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                  animation: 'bounce 2s ease-in-out infinite'
                                }}>
                                  🔓
                                </div>
                              )}
                            </div>
                            {hasChildCompletedDna(child) && (
                              <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                marginTop: '8px',
                                lineHeight: '1.3'
                              }}>
                                {childDnaType?.name?.split(' ').map((word, i) => (
                                  <span key={i}>
                                    {word}
                                    {i < childDnaType.name.split(' ').length - 1 && <br />}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add More Children Info */}
                {linkedStudents.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: luxTheme.textSecondary,
                    fontSize: '14px',
                    backgroundColor: `${luxTheme.primary}10`,
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '300px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.8 }}>👨‍👩‍👧‍👦</div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>No children linked yet</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Check your account setup to link children</div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{
              width: '60%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${luxTheme.primary}40, transparent)`,
              margin: '0 auto 24px'
            }} />

            {/* Three-Column Layout for Discovery Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Daily 5-Minute Win */}
              <DiscoveryCard
                icon={todaysWin.emoji}
                subtitle={`${todaysWin.day}'s 5-Minute Win`}
                title="Quick Daily Challenge"
                content={
                  <>
                    <div style={{ marginBottom: '8px' }}>{todaysWin.task}</div>
                    <div style={{
                      fontSize: '11px',
                      color: luxTheme.textSecondary,
                      fontStyle: 'italic'
                    }}>
                      💡 {todaysWin.tip}
                    </div>
                  </>
                }
                borderColor={`${categoryColors['Motivation & Engagement']}30`}
                hoverColor={categoryColors['Motivation & Engagement']}
                minHeight="auto"
              />

              {/* Reflection Prompt */}
              <DiscoveryCard
                icon="✍️"
                subtitle="Today's Reflection"
                title="Take a Moment"
                content={
                  <div style={{
                    fontStyle: 'italic',
                    marginBottom: '8px'
                  }}>
                    &quot;{todaysReflectionPrompt}&quot;
                  </div>
                }
                onClick={() => router.push('/parent/dna-lab/reflection-growth')}
                borderColor={`${luxTheme.accent}30`}
                hoverColor={luxTheme.accent}
                actionText="Write your thoughts →"
                minHeight="auto"
              />
            </div>

            {/* Second Row - Learn About Yourself, Child, and Research */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Learn About Yourself */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${parentDnaType?.color || luxTheme.primary}30`,
                cursor: weeklyParentFact ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => weeklyParentFact && handleFactClick(weeklyParentFact.source, weeklyParentFact)}
              onMouseOver={(e) => {
                if (weeklyParentFact) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = parentDnaType?.color || luxTheme.primary;
                }
              }}
              onMouseOut={(e) => {
                if (weeklyParentFact) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = `${parentDnaType?.color || luxTheme.primary}30`;
                }
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '24px'
                  }}>
                    🌟
                  </div>
                  <div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      This Week&apos;s Discovery
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary
                    }}>
                      Learn About Yourself
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5',
                  flex: 1
                }}>
                  {weeklyParentFact ? (
                    <>
                      <div style={{
                        fontSize: '11px',
                        color: parentDnaType?.color || luxTheme.primary,
                        fontWeight: '600',
                        marginBottom: '6px'
                      }}>
                        {weeklyParentFact.label}:
                      </div>
                      <div>
                        {weeklyParentFact.fact}
                      </div>
                    </>
                  ) : hasParentDna ? (
                    'Your insights will appear here after we gather more data.'
                  ) : (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        Take the assessment to discover insights about your parenting style!
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/parent/dna-lab/assessment');
                        }}
                        style={{
                          backgroundColor: luxTheme.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      >
                        Start Assessment →
                      </button>
                    </>
                  )}
                </div>
                {weeklyParentFact && (
                  <div style={{
                    fontSize: '11px',
                    color: luxTheme.primary,
                    fontWeight: '600',
                    textAlign: 'right',
                    marginTop: '8px'
                  }}>
                    {weeklyParentFact.source === 'dna' ? 'Explore your DNA →' : 'View your toolkit →'}
                  </div>
                )}
              </div>

              {/* Learn About Your Child */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.secondary}30`,
                cursor: weeklyChildFact ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => weeklyChildFact && handleFactClick(weeklyChildFact.source, weeklyChildFact)}
              onMouseOver={(e) => {
                if (weeklyChildFact) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = luxTheme.secondary;
                }
              }}
              onMouseOut={(e) => {
                if (weeklyChildFact) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = `${luxTheme.secondary}30`;
                }
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '24px'
                  }}>
                    👨‍👩‍👧‍👦
                  </div>
                  <div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      This Week&apos;s Insight
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary
                    }}>
                      Learn About Your Child
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5',
                  flex: 1
                }}>
                  {weeklyChildFact ? (
                    <>
                      <div style={{
                        fontSize: '11px',
                        color: luxTheme.secondary,
                        fontWeight: '600',
                        marginBottom: '6px'
                      }}>
                        {weeklyChildFact.label}:
                      </div>
                      <div>
                        {weeklyChildFact.fact}
                      </div>
                    </>
                  ) : linkedStudents.some(s => s.readingDNA) ? (
                    'Your insights will appear here as we learn more about your children.'
                  ) : (
                    'Once your children complete their Reading DNA, discover new insights weekly!'
                  )}
                </div>
                {weeklyChildFact && (
                  <div style={{
                    fontSize: '11px',
                    color: luxTheme.primary,
                    fontWeight: '600',
                    textAlign: 'right',
                    marginTop: '8px'
                  }}>
                    {weeklyChildFact.source === 'library' ? "View kids' library →" : 'See family dynamics →'}
                  </div>
                )}
              </div>

              {/* Research Spotlight - Compact Version */}
              {weeklyScienceFact && (
                <div style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${luxTheme.accent}30`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => handleFactClick('science', weeklyScienceFact)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = luxTheme.accent;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = `${luxTheme.accent}30`;
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '24px'
                    }}>
                      🔬
                    </div>
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: luxTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Research Spotlight
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        lineHeight: '1.3'
                      }}>
                        Science of Reading
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    flex: 1
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: luxTheme.accent,
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}>
                      Key Finding:
                    </div>
                    <div>
                      {weeklyScienceFact.keyFinding}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: luxTheme.primary,
                    fontWeight: '600',
                    textAlign: 'right',
                    marginTop: '8px'
                  }}>
                    Visit Science Center →
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Tips & Facts Section */}
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${hasParentDna && parentDnaType ? parentDnaType.color : luxTheme.primary}20`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 20px 0',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>✨</span> This Week&apos;s Reading Wisdom <span>✨</span>
              </h3>

              {/* Weekly Strategy Card */}
              <div 
                style={{
                  backgroundColor: expandedTip === 'strategy' ? `${categoryColors[weeklyContent.strategy.category]}10` : `${luxTheme.primary}05`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: `1px solid ${expandedTip === 'strategy' ? categoryColors[weeklyContent.strategy.category] : luxTheme.primary}30`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setExpandedTip(expandedTip === 'strategy' ? null : 'strategy')}
                onMouseOver={(e) => {
                  if (expandedTip !== 'strategy') {
                    e.currentTarget.style.backgroundColor = `${categoryColors[weeklyContent.strategy.category]}10`;
                    e.currentTarget.style.borderColor = `${categoryColors[weeklyContent.strategy.category]}60`;
                  }
                }}
                onMouseOut={(e) => {
                  if (expandedTip !== 'strategy') {
                    e.currentTarget.style.backgroundColor = `${luxTheme.primary}05`;
                    e.currentTarget.style.borderColor = `${luxTheme.primary}30`;
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    flexShrink: 0
                  }}>
                    💡
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: luxTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Weekly Strategy
                      </div>
                      <div style={{
                        backgroundColor: categoryColors[weeklyContent.strategy.category],
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        whiteSpace: 'nowrap'
                      }}>
                        {weeklyContent.strategy.category}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: expandedTip === 'strategy' ? '12px' : '0'
                    }}>
                      {weeklyContent.strategy.title}
                    </div>
                    {expandedTip === 'strategy' && (
                      <div style={{
                        fontSize: '14px',
                        color: luxTheme.textSecondary,
                        lineHeight: '1.6',
                        animation: 'fadeIn 0.3s ease-out'
                      }}>
                        {weeklyContent.strategy.content}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: luxTheme.textSecondary,
                    transform: expandedTip === 'strategy' ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Weekly Fact Card */}
              <div 
                style={{
                  backgroundColor: expandedTip === 'fact' ? `${categoryColors[weeklyContent.fact.category]}10` : `${luxTheme.secondary}05`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: `1px solid ${expandedTip === 'fact' ? categoryColors[weeklyContent.fact.category] : luxTheme.secondary}30`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setExpandedTip(expandedTip === 'fact' ? null : 'fact')}
                onMouseOver={(e) => {
                  if (expandedTip !== 'fact') {
                    e.currentTarget.style.backgroundColor = `${categoryColors[weeklyContent.fact.category]}10`;
                    e.currentTarget.style.borderColor = `${categoryColors[weeklyContent.fact.category]}60`;
                  }
                }}
                onMouseOut={(e) => {
                  if (expandedTip !== 'fact') {
                    e.currentTarget.style.backgroundColor = `${luxTheme.secondary}05`;
                    e.currentTarget.style.borderColor = `${luxTheme.secondary}30`;
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    flexShrink: 0
                  }}>
                    🤯
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: luxTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Mind-Blowing Fact
                      </div>
                      <div style={{
                        backgroundColor: categoryColors[weeklyContent.fact.category],
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        whiteSpace: 'nowrap'
                      }}>
                        {weeklyContent.fact.category}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: expandedTip === 'fact' ? '12px' : '0'
                    }}>
                      {weeklyContent.fact.title}
                    </div>
                    {expandedTip === 'fact' && (
                      <div style={{
                        fontSize: '14px',
                        color: luxTheme.textSecondary,
                        lineHeight: '1.6',
                        animation: 'fadeIn 0.3s ease-out'
                      }}>
                        {weeklyContent.fact.fact}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: luxTheme.textSecondary,
                    transform: expandedTip === 'fact' ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Bottom Line Button */}
              <div style={{
                textAlign: 'center',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => setShowBottomLine(true)}
                  style={{
                    backgroundColor: hasParentDna && parentDnaType ? parentDnaType.color : luxTheme.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transform: 'translateY(0)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                >
                  <span>🌟</span>
                  <span>Why Reading Matters</span>
                </button>
              </div>
            </div>

          </div>
        </PremiumGate>

        {/* Modals stay outside PremiumGate */}
        {/* Unlock Modal with DNA type colors */}
        {showUnlockModal && unlockingChild && (
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
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: hasParentDna && parentDnaType ? `3px solid ${parentDnaType.color}40` : 'none'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 16px 0',
                textAlign: 'center'
              }}>
                🔓 Unlock Learning Style Insights
              </h3>
              
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                Unlock detailed learning style insights for <strong>{unlockingChild.firstName}</strong>? 
                This will help them understand their unique reading personality better!
              </p>
              
              <div style={{
                backgroundColor: hasParentDna && parentDnaType ? `${parentDnaType.color}10` : `${luxTheme.primary}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: luxTheme.textPrimary,
                lineHeight: '1.4'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: hasParentDna && parentDnaType ? parentDnaType.color : luxTheme.primary,
                  marginBottom: '8px',
                  fontSize: '12px'
                }}>
                  🌟 What this unlocks:
                </div>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>Detailed personality traits</li>
                  <li>Learning style modifiers</li>
                  <li>Personalized reading tips</li>
                  <li>Growth strategies</li>
                </ul>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockingChild(null);
                  }}
                  style={{
                    backgroundColor: `${luxTheme.textSecondary}20`,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={unlockReadingDnaForChild}
                  style={{
                    backgroundColor: '#FFB347',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  🔓 Unlock Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Research Disclaimer Modal */}
        {showResearchModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: luxTheme.textPrimary,
                  fontSize: '20px',
                  fontFamily: 'Didot, serif'
                }}>
                  💡 About This Research-Inspired Tool
                </h3>
                <button 
                  onClick={() => setShowResearchModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: luxTheme.textSecondary,
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: luxTheme.textPrimary,
                  fontSize: '16px',
                  margin: '0 0 8px 0'
                }}>
                  🔬 Science-Inspired, Not Scientific
                </h4>
                <p style={{ 
                  fontSize: '14px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  This Reading DNA assessment is inspired by decades of research on motivation, parenting styles, and reading development. 
                  However, it&apos;s not a rigorously tested diagnostic tool or scientific assessment. Think of it as a thoughtful framework 
                  based on research insights, designed to spark curiosity and conversation.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: luxTheme.textPrimary,
                  fontSize: '16px',
                  margin: '0 0 8px 0'
                }}>
                  🎯 What This Tool Is For
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  lineHeight: '1.6'
                }}>
                  <li>Sparking self-reflection about your parenting approaches</li>
                  <li>Offering new perspectives and strategies to try</li>
                  <li>Creating a shared language for discussing reading support</li>
                  <li>Encouraging experimentation with different approaches</li>
                  <li>Building confidence in your unique parenting style</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: luxTheme.textPrimary,
                  fontSize: '16px',
                  margin: '0 0 8px 0'
                }}>
                  🚫 What This Tool Is NOT
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  lineHeight: '1.6'
                }}>
                  <li>A diagnostic assessment or psychological test</li>
                  <li>A definitive categorization of your parenting</li>
                  <li>A judgment about &quot;right&quot; or &quot;wrong&quot; approaches</li>
                  <li>A replacement for professional guidance when needed</li>
                  <li>A one-size-fits-all prescription</li>
                </ul>
              </div>

              <div style={{
                backgroundColor: `${luxTheme.primary}20`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: luxTheme.textPrimary,
                  margin: 0,
                  lineHeight: '1.5',
                  fontWeight: '600'
                }}>
                  🌟 Remember: You know your child best! Use these insights as a starting point for exploration, 
                  not as rigid rules. Every family&apos;s reading journey is unique and beautiful.
                </p>
              </div>
              
              <button
                onClick={() => setShowResearchModal(false)}
                style={{
                  width: '100%',
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '20px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Got it! Let&apos;s explore
              </button>
            </div>
          </div>
        )}

        {/* Bottom Line Modal */}
        {showBottomLine && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
                animation: 'bounce 1s ease-out'
              }}>
                🌟
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 16px 0',
                fontFamily: 'Didot, serif'
              }}>
                Why Reading Matters
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: luxTheme.textSecondary,
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                {weeklyContent.bottomLine}
              </p>
              
              <button
                onClick={() => setShowBottomLine(false)}
                style={{
                  backgroundColor: hasParentDna && parentDnaType ? parentDnaType.color : luxTheme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Let&apos;s Build Readers! 📚
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideInDown {
            from { 
              opacity: 0; 
              transform: translate(-50%, -30px); 
            }
            to { 
              opacity: 1; 
              transform: translate(-50%, 0); 
            }
          }
          
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
            100% { transform: translateY(0px) rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes dnaReveal {
            0% { 
              transform: scale(0) rotate(-180deg); 
              opacity: 0;
            }
            100% { 
              transform: scale(1) rotate(0deg); 
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: translateY(-10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-30px); }
            60% { transform: translateY(-15px); }
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
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          /* Hover classes for better performance */
          .hover-lift {
            transition: all 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          }
          
          .hover-scale {
            transition: transform 0.2s ease;
          }
          
          .hover-scale:hover {
            transform: scale(1.05);
          }
        `}</style>
      </div>
    </>
  );
}
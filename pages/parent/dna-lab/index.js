// pages/parent/dna-lab/index.js - Parent Reading DNA Lab Dashboard
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { updateStudentDataEntities } from '../../../lib/firebase';

export default function ParentDnaLabDashboard() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Parent DNA states
  const [parentDnaTypes, setParentDnaTypes] = useState({});
  const [parentDnaQuestions, setParentDnaQuestions] = useState([]);
  const [parentData, setParentData] = useState(null);
  const [hasParentDna, setHasParentDna] = useState(false);
  
  // Children data states
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [childrenDnaData, setChildrenDnaData] = useState({});
  
  // UI states
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockingChild, setUnlockingChild] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [showResearchModal, setShowResearchModal] = useState(false);
  
  // Lux Libris Classic Theme
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  };

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

  // Updated Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢', current: true },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], []);

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
    } catch (error) {
      console.error('❌ Error loading parent DNA types:', error);
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

  // Initial data load
  const loadDashboardData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🏠 Loading DNA Lab dashboard data...');
      
      // Load DNA types and questions
      await Promise.all([
        loadParentDnaTypes(),
        loadParentDnaQuestions()
      ]);
      
      // Load parent data first
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        setParentData(data);
        setHasParentDna(!!data.parentDNA);
        
        // Then load linked students if any
        if (data.linkedStudents?.length > 0) {
          await loadLinkedStudentsData(data.linkedStudents);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
    }
    
    setLoading(false);
  }, [loadParentDnaTypes, loadParentDnaQuestions, loadLinkedStudentsData, user]);

  // Effect to load initial data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector');
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard');
    }
  }, [authLoading, isAuthenticated, user, userProfile, loadDashboardData, router]);

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
  }, [showDnaDropdown, showNavMenu, showUnlockModal]);

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
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
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
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/parent/dashboard')}
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
              WebkitTapHighlightColor: 'transparent'
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
        </div>

        {/* Main Content */}
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Welcome Section */}
          <div style={{
            background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px ${luxTheme.primary}30`,
            marginBottom: '20px',
            color: luxTheme.textPrimary,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧬</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              Welcome to Your Family's Reading DNA Lab!
            </h2>
            
            <p style={{
              fontSize: '16px',
              margin: '0 0 12px 0',
              opacity: 0.9
            }}>
              Discover your unique reading personality and unlock powerful insights about your children's learning styles
            </p>
          </div>

          {/* Quick Assessment CTA */}
          {!hasParentDna && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔬</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 12px 0'
              }}>
                Discover Your Reading DNA!
              </h3>
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                Take our science-inspired assessment to understand your parenting style and get personalized strategies for supporting your children's reading journey.
              </p>
              
              <div style={{
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowResearchModal(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: luxTheme.primary,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = `${luxTheme.primary}10`}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span>💡</span>
                  <span style={{ textDecoration: 'underline' }}>Research-Inspired Tool</span>
                </button>
              </div>
              
              <button
                onClick={() => router.push('/parent/dna-lab/assessment')}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                🧬 Take Assessment (3 minutes)
              </button>
            </div>
          )}

          {/* Parent DNA Summary (if completed) */}
          {hasParentDna && parentData.parentDNA && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🧬</span> Your Reading DNA Profile
              </h3>
              
              <div style={{
                backgroundColor: `${luxTheme.primary}15`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  {parentData.parentDNA && parentDnaTypes[parentData.parentDNA.type]?.name || 'Unknown Type'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  {parentData.parentDNA && parentDnaTypes[parentData.parentDNA.type]?.quickDescription || 'No description available'}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <button
                  onClick={() => router.push('/parent/dna-lab/my-reading-dna')}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  View Full Profile →
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowResearchModal(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: luxTheme.primary,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px',
                    textDecoration: 'underline'
                  }}
                >
                  <span>💡</span>
                  <span>Research-Inspired</span>
                </button>
              </div>
            </div>
          )}

          {/* Family Overview - Children's Reading DNA */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${luxTheme.primary}30`
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>👨‍👩‍👧‍👦</span> Your Children's Reading DNA
            </h3>
            
            {linkedStudents.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {linkedStudents.map((child) => (
                  <div 
                    key={child.id}
                    style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: `1px solid ${luxTheme.primary}30`
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: luxTheme.textPrimary,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {child.firstName?.charAt(0) || '?'}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {child.firstName} {child.lastInitial}.
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: luxTheme.textSecondary
                      }}>
                        Grade {child.grade} • {child.schoolName}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: hasChildCompletedDna(child) ? '#4CAF50' : luxTheme.textSecondary,
                        marginTop: '4px'
                      }}>
                        {hasChildCompletedDna(child) ? 
                          `✅ Reading DNA: ${getChildDnaTypeName(child)}` : 
                          '⏳ Reading DNA not completed'}
                      </div>
                    </div>
                    
                    {hasChildCompletedDna(child) && !isChildLearningStyleUnlocked(child) && (
                      <button
                        onClick={() => {
                          setUnlockingChild(child);
                          setShowUnlockModal(true);
                        }}
                        style={{
                          backgroundColor: '#FFB347',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          flexShrink: 0,
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        🔓 Unlock
                      </button>
                    )}
                    
                    {isChildLearningStyleUnlocked(child) && (
                      <div style={{
                        fontSize: '11px',
                        color: '#4CAF50',
                        fontWeight: '600'
                      }}>
                        ✨ Unlocked
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: luxTheme.textSecondary
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
                <p>No children linked yet. Check your account setup!</p>
              </div>
            )}
          </div>

          {/* Quick Action Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <QuickActionCard
              icon="📚"
              title="Reading Toolkit"
              description="Strategies & scripts for every situation"
              onClick={() => router.push('/parent/dna-lab/reading-toolkit')}
              theme={luxTheme}
            />
            
            <QuickActionCard
              icon="🤝"
              title="Family Dynamics"
              description="Parent-child compatibility insights"
              onClick={() => router.push('/parent/dna-lab/family-dynamics')}
              theme={luxTheme}
            />
            
            <QuickActionCard
              icon="🧪"
              title="Science Center"
              description="Research behind the methods"
              onClick={() => router.push('/parent/dna-lab/science-center')}
              theme={luxTheme}
            />
          </div>
        </div>

        {/* Unlock Modal */}
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
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
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
                backgroundColor: `${luxTheme.primary}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: luxTheme.textPrimary,
                lineHeight: '1.4'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
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
                  However, it's not a rigorously tested diagnostic tool or scientific assessment. Think of it as a thoughtful framework 
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
                  <li>A judgment about "right" or "wrong" approaches</li>
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
                  not as rigid rules. Every family's reading journey is unique and beautiful.
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
                Got it! Let's explore
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
        `}</style>
      </div>
    </>
  );
}

// Quick Action Card Component
function QuickActionCard({ icon, title, description, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.primary}30`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.3s ease',
        transform: 'translateY(0)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = `${theme.primary}20`;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
        e.currentTarget.style.borderColor = theme.primary;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = theme.surface;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = `${theme.primary}30`;
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{
        fontSize: '16px',
        fontWeight: '600',
        color: theme.textPrimary,
        marginBottom: '4px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '12px',
        color: theme.textSecondary,
        lineHeight: '1.4'
      }}>
        {description}
      </div>
    </button>
  );
}
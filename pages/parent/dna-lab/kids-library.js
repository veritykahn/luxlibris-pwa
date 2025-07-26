// pages/parent/dna-lab/kids-library.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function KidsLibrary() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [parentData, setParentData] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [readingDnaTypes, setReadingDnaTypes] = useState({});
  const [modifiers, setModifiers] = useState({ educator: {}, student: {} });
  const [parentGuidance, setParentGuidance] = useState({});
  
  // UI states
  const [selectedChild, setSelectedChild] = useState(null);
  const [viewMode, setViewMode] = useState('parent'); // 'parent' or 'student'
  const [expandedSections, setExpandedSections] = useState({
    modifiers: false,
    books: false
  });
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  
  // Hardcoded mapping of reading DNA types to image files
  const readingDnaImages = {
    'challenge-seeker': 'challenge_seeker.png',
    'creative-explorer': 'creative_explorer.png',
    'curious-investigator': 'curious_investigator.png',
    'freedom-reader': 'freedom_reader.png',
    'reflective-thinker': 'reflective_thinker.png',
    'social-connector': 'social_connector.png'
  };
  
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

  // DNA Lab navigation options
  const dnaNavOptions = useMemo(() => [
    { name: 'Dashboard', path: '/parent/dna-lab', icon: '🏠', description: 'Command center for family reading' },
    { name: 'My Reading DNA', path: '/parent/dna-lab/my-reading-dna', icon: '🧬', description: 'Deep insights about your style' },
    { name: 'My Reading Toolkit', path: '/parent/dna-lab/reading-toolkit', icon: '📚', description: 'Strategies and scripts' },
    { name: "My Kids' Library", path: '/parent/dna-lab/kids-library', icon: '👨‍👩‍👧‍👦', description: 'Child profiles and support', current: true },
    { name: 'Family Dynamics', path: '/parent/dna-lab/family-dynamics', icon: '🤝', description: 'Parent-child compatibility' },
    { name: 'Science Center', path: '/parent/dna-lab/science-center', icon: '🧪', description: 'Research and evidence' },
    { name: 'Reflection & Growth', path: '/parent/dna-lab/reflection-growth', icon: '🌱', description: 'Track your journey' }
  ], []);

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], []);

  // Load all necessary data
  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('📚 Loading Kids Library data...');
      
      // Load parent data
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (!parentDoc.exists()) {
        router.push('/parent/dashboard');
        return;
      }
      
      const parentInfo = parentDoc.data();
      setParentData(parentInfo);
      
      // Load reading DNA types
      const typesRef = collection(db, 'reading-dna-types');
      const typesSnapshot = await getDocs(typesRef);
      const types = {};
      typesSnapshot.forEach(doc => {
        types[doc.id] = doc.data();
      });
      setReadingDnaTypes(types);
      
      // Load modifiers (both educator and student versions)
      const modifiersRef = collection(db, 'reading-dna-modifiers');
      const modifiersSnapshot = await getDocs(modifiersRef);
      const mods = { educator: {}, student: {} };
      modifiersSnapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        if (id.startsWith('educator_')) {
          const modCode = id.replace('educator_', '');
          mods.educator[modCode] = data;
        } else if (id.startsWith('student_')) {
          const modCode = id.replace('student_', '');
          mods.student[modCode] = data;
        }
      });
      setModifiers(mods);
      
      // Load parent guidance content
      const guidanceRef = collection(db, 'parent-guidance-content');
      const guidanceSnapshot = await getDocs(guidanceRef);
      const guidance = {};
      guidanceSnapshot.forEach(doc => {
        const id = doc.id;
        if (id.startsWith('childtype_')) {
          const typeId = id.replace('childtype_', '');
          guidance[typeId] = doc.data();
        } else if (id.startsWith('modifier_')) {
          const modId = id.replace('modifier_', '');
          guidance[`mod_${modId}`] = doc.data();
        }
      });
      setParentGuidance(guidance);
      
      // Load linked students
      if (parentInfo.linkedStudents?.length > 0) {
        await loadLinkedStudentsData(parentInfo.linkedStudents);
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
    
    setLoading(false);
  }, [user, router]);

  // Load linked students data
  const loadLinkedStudentsData = useCallback(async (linkedStudentIds) => {
    try {
      const students = [];
      
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
            }
          }
        }
      }
      
      setLinkedStudents(students);
      
      // Select first child by default
      if (students.length > 0 && !selectedChild) {
        setSelectedChild(students[0]);
      }
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error);
    }
  }, [selectedChild]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle back navigation
  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/parent/dna-lab');
  };

  // Handle navigation
  const handleDnaNavigation = (option) => {
    if (option.current) return;
    setShowDnaDropdown(false);
    router.push(option.path);
  };

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
      }
    };

    if (showDnaDropdown || showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDnaDropdown, showNavMenu]);

  // Load data on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadData();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector');
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard');
    }
  }, [authLoading, isAuthenticated, user, userProfile, loadData, router]);

  // Loading state
  if (authLoading || loading) {
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
          <p style={{ color: luxTheme.textPrimary }}>Loading Kids&apos; Library...</p>
        </div>
      </div>
    );
  }

  // Get child's DNA data
  const getChildDnaData = (child) => {
    if (!child?.readingDNA) return null;
    const typeData = readingDnaTypes[child.readingDNA.type];
    const guidanceData = parentGuidance[child.readingDNA.type];
    return {
      ...child.readingDNA,
      typeData,
      guidanceData
    };
  };

  return (
    <>
      <Head>
        <title>My Kids&apos; Library - Reading DNA Lab</title>
        <meta name="description" content="Understand your children's reading personalities and get personalized support strategies" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
          {/* Back Button - Fixed */}
          <button
            type="button"
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
              zIndex: 10
            }}
          >
            ←
          </button>

          {/* DNA Lab Dropdown */}
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
                minHeight: '40px'
              }}
            >
              <span style={{ fontSize: '18px' }}>👨‍👩‍👧‍👦</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>My Kids&apos; Library</span>
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
                backdropFilter: 'blur(10px)'
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
                      router.push(item.path);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: '500',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${luxTheme.primary}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Child Selector */}
          {linkedStudents.length > 0 ? (
            <>
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
                  textAlign: 'center'
                }}>
                  Select a Child to View Their Reading Profile
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {linkedStudents.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      style={{
                        backgroundColor: selectedChild?.id === child.id ? luxTheme.primary : `${luxTheme.primary}20`,
                        border: selectedChild?.id === child.id ? `2px solid ${luxTheme.primary}` : `1px solid ${luxTheme.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
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
                        margin: '0 auto 8px'
                      }}>
                        {child.firstName?.charAt(0) || '?'}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary
                      }}>
                        {child.firstName}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: luxTheme.textSecondary
                      }}>
                        Grade {child.grade}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Child Profile */}
              {selectedChild && (
                <>
                  {/* View Mode Toggle */}
                  <div style={{
                    backgroundColor: luxTheme.surface,
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `2px solid ${luxTheme.primary}30`,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => setViewMode('parent')}
                      style={{
                        backgroundColor: viewMode === 'parent' ? luxTheme.primary : 'transparent',
                        color: viewMode === 'parent' ? luxTheme.textPrimary : luxTheme.textSecondary,
                        border: `1px solid ${luxTheme.primary}`,
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👨‍👩‍👦 Parent View
                    </button>
                    <button
                      onClick={() => setViewMode('student')}
                      style={{
                        backgroundColor: viewMode === 'student' ? luxTheme.primary : 'transparent',
                        color: viewMode === 'student' ? luxTheme.textPrimary : luxTheme.textSecondary,
                        border: `1px solid ${luxTheme.primary}`,
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👦 {selectedChild.firstName}&apos;s View
                    </button>
                  </div>

                  {/* Child's Reading DNA Profile */}
                  {getChildDnaData(selectedChild) ? (
                    <>
                      {/* Reading Type Card */}
                      <div style={{
                        backgroundColor: viewMode === 'student' && getChildDnaData(selectedChild).typeData?.color ? 
                          `${getChildDnaData(selectedChild).typeData.color}20` : luxTheme.surface,
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: `2px solid ${viewMode === 'student' && getChildDnaData(selectedChild).typeData?.color ? 
                          getChildDnaData(selectedChild).typeData.color : luxTheme.primary}30`,
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          {viewMode === 'parent' ? (
                            <div style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              backgroundColor: getChildDnaData(selectedChild).typeData?.color || luxTheme.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '36px',
                              margin: '0 auto 16px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                            }}>
                              {getChildDnaData(selectedChild).typeData?.emoji || '📚'}
                            </div>
                          ) : (
                            <div style={{
                              width: '120px',
                              height: '120px',
                              borderRadius: '50%',
                              backgroundColor: getChildDnaData(selectedChild).typeData?.color || luxTheme.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 16px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                              padding: '20px'
                            }}>
                              <img 
                                src={`/reading-dna/${readingDnaImages[selectedChild.readingDNA?.type] || 'curious_investigator.png'}`}
                                alt={getChildDnaData(selectedChild).typeData?.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain'
                                }}
                              />
                            </div>
                          )}
                          
                          <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: luxTheme.textPrimary,
                            marginBottom: '8px',
                            fontFamily: 'Didot, serif'
                          }}>
                            {getChildDnaData(selectedChild).typeData?.name}
                          </h2>
                          
                          <p style={{
                            fontSize: '14px',
                            color: luxTheme.textSecondary,
                            lineHeight: '1.5',
                            maxWidth: '500px',
                            margin: '0 auto'
                          }}>
                            {getChildDnaData(selectedChild).typeData?.description}
                          </p>
                        </div>

                        {viewMode === 'parent' && (
                          <>
                            {/* Parent Strategies */}
                            <div style={{
                              backgroundColor: `${luxTheme.primary}10`,
                              borderRadius: '12px',
                              padding: '16px',
                              marginBottom: '16px'
                            }}>
                              <h4 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                margin: '0 0 12px 0'
                              }}>
                                🎯 How to Support {selectedChild.firstName}
                              </h4>
                              {getChildDnaData(selectedChild).guidanceData?.parentStrategies?.map((strategy, idx) => (
                                <div key={idx} style={{
                                  fontSize: '13px',
                                  color: luxTheme.textPrimary,
                                  marginBottom: '8px',
                                  paddingLeft: '20px',
                                  position: 'relative'
                                }}>
                                  <span style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '2px',
                                    fontSize: '10px'
                                  }}>•</span>
                                  {strategy}
                                </div>
                              ))}
                            </div>

                            {/* What This Means */}
                            {getChildDnaData(selectedChild).guidanceData?.whatThisMeans && (
                              <div style={{
                                backgroundColor: `${luxTheme.secondary}10`,
                                borderRadius: '12px',
                                padding: '16px'
                              }}>
                                <h4 style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary,
                                  margin: '0 0 8px 0'
                                }}>
                                  💡 What This Means
                                </h4>
                                <p style={{
                                  fontSize: '13px',
                                  color: luxTheme.textPrimary,
                                  lineHeight: '1.5',
                                  margin: 0
                                }}>
                                  {getChildDnaData(selectedChild).guidanceData.whatThisMeans}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {viewMode === 'student' && (
                          <>
                            {/* Student-Friendly Info */}
                            <div style={{
                              backgroundColor: `${luxTheme.accent}20`,
                              borderRadius: '12px',
                              padding: '16px',
                              marginBottom: '16px'
                            }}>
                              <h4 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                margin: '0 0 12px 0'
                              }}>
                                🌟 What Makes You Awesome
                              </h4>
                              {getChildDnaData(selectedChild).typeData?.intrinsicMotivators?.map((motivator, idx) => (
                                <div key={idx} style={{
                                  fontSize: '13px',
                                  color: luxTheme.textPrimary,
                                  marginBottom: '8px',
                                  paddingLeft: '20px',
                                  position: 'relative'
                                }}>
                                  <span style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '2px'
                                  }}>✨</span>
                                  {motivator}
                                </div>
                              ))}
                            </div>

                            {/* Research Note for Kids */}
                            {getChildDnaData(selectedChild).typeData?.researchNote && (
                              <div style={{
                                backgroundColor: '#FFF3CD',
                                borderRadius: '12px',
                                padding: '16px'
                              }}>
                                <h4 style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary,
                                  margin: '0 0 8px 0'
                                }}>
                                  🔬 Cool Science Fact
                                </h4>
                                <p style={{
                                  fontSize: '13px',
                                  color: luxTheme.textPrimary,
                                  lineHeight: '1.5',
                                  margin: 0
                                }}>
                                  {getChildDnaData(selectedChild).typeData.researchNote}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Modifiers Section */}
                      {selectedChild.readingDNA?.modifiers?.length > 0 && (
                        <div style={{
                          backgroundColor: luxTheme.surface,
                          borderRadius: '16px',
                          padding: '24px',
                          marginBottom: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: `2px solid ${luxTheme.primary}30`
                        }}>
                          <button
                            onClick={() => toggleSection('modifiers')}
                            style={{
                              width: '100%',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: expandedSections.modifiers ? '16px' : 0
                            }}
                          >
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: luxTheme.textPrimary,
                              margin: 0,
                              textAlign: 'left'
                            }}>
                              🌈 {selectedChild.firstName}&apos;s Learning Style Traits
                            </h3>
                            <span style={{
                              fontSize: '20px',
                              color: luxTheme.textSecondary,
                              transform: expandedSections.modifiers ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}>
                              ⌄
                            </span>
                          </button>

                          {expandedSections.modifiers && (
                            <div style={{ display: 'grid', gap: '12px' }}>
                            {selectedChild.readingDNA.modifiers.map((modCode) => {
                              const modData = viewMode === 'parent' ? 
                                modifiers.educator[modCode] : 
                                modifiers.student[modCode];
                              
                              if (!modData) return null;
                              
                              return (
                                <div
                                  key={modCode}
                                  style={{
                                    backgroundColor: `${luxTheme.primary}10`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: `1px solid ${luxTheme.primary}30`
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px'
                                  }}>
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      backgroundColor: luxTheme.primary,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '18px'
                                    }}>
                                      {modData.emoji || modCode}
                                    </div>
                                    <div>
                                      <div style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: luxTheme.textPrimary
                                      }}>
                                        {modData.name}
                                      </div>
                                      <div style={{
                                        fontSize: '12px',
                                        color: luxTheme.textSecondary
                                      }}>
                                        {modData.description}
                                      </div>
                                    </div>
                                  </div>

                                  {viewMode === 'parent' && modData.strategies && (
                                    <div style={{
                                      fontSize: '12px',
                                      color: luxTheme.textPrimary,
                                      lineHeight: '1.5'
                                    }}>
                                      <div style={{ fontWeight: '600', marginBottom: '6px' }}>
                                        Support Strategies:
                                      </div>
                                      {modData.strategies.map((strategy, idx) => (
                                        <div key={idx} style={{
                                          marginBottom: '4px',
                                          paddingLeft: '16px',
                                          position: 'relative'
                                        }}>
                                          <span style={{
                                            position: 'absolute',
                                            left: '0',
                                            top: '2px',
                                            fontSize: '8px'
                                          }}>•</span>
                                          {strategy}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {viewMode === 'student' && modData.studentTips && (
                                    <div style={{
                                      fontSize: '12px',
                                      color: luxTheme.textPrimary,
                                      lineHeight: '1.5'
                                    }}>
                                      <div style={{ fontWeight: '600', marginBottom: '6px' }}>
                                        🚀 Tips for You:
                                      </div>
                                      {modData.studentTips.map((tip, idx) => (
                                        <div key={idx} style={{
                                          marginBottom: '4px',
                                          paddingLeft: '16px',
                                          position: 'relative'
                                        }}>
                                          <span style={{
                                            position: 'absolute',
                                            left: '0',
                                            top: '2px'
                                          }}>✨</span>
                                          {tip}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Book Recommendations */}
                      {getChildDnaData(selectedChild).guidanceData?.bookRecommendations && (
                        <div style={{
                          backgroundColor: luxTheme.surface,
                          borderRadius: '16px',
                          padding: '24px',
                          marginBottom: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: `2px solid ${luxTheme.primary}30`
                        }}>
                          <button
                            onClick={() => toggleSection('books')}
                            style={{
                              width: '100%',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: expandedSections.books ? '16px' : 0
                            }}
                          >
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: luxTheme.textPrimary,
                              margin: 0,
                              textAlign: 'left'
                            }}>
                              📚 Perfect Books for {selectedChild.firstName}
                            </h3>
                            <span style={{
                              fontSize: '20px',
                              color: luxTheme.textSecondary,
                              transform: expandedSections.books ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}>
                              ⌄
                            </span>
                          </button>

                          {expandedSections.books && (
                            <div style={{
                              display: 'grid',
                              gap: '8px'
                            }}>
                              {getChildDnaData(selectedChild).guidanceData.bookRecommendations.map((book, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    backgroundColor: `${luxTheme.accent}10`,
                                    borderRadius: '8px',
                                    padding: '12px',
                                    fontSize: '13px',
                                    color: luxTheme.textPrimary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  <span style={{ fontSize: '16px' }}>📖</span>
                                  {book}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      backgroundColor: luxTheme.surface,
                      borderRadius: '16px',
                      padding: '40px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: `2px solid ${luxTheme.primary}30`
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        marginBottom: '8px'
                      }}>
                        {selectedChild.firstName} hasn&apos;t completed their Reading DNA yet
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: luxTheme.textSecondary,
                        lineHeight: '1.5'
                      }}>
                        Once they complete the assessment, you&apos;ll see their reading personality type, 
                        learning style traits, and personalized support strategies here.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                No Children Linked Yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                lineHeight: '1.5'
              }}>
                Link your children&apos;s accounts to see their reading personalities and get personalized support strategies.
              </p>
              <button
                onClick={() => router.push('/parent/settings')}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Go to Settings
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
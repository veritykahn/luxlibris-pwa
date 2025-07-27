// pages/parent/dna-lab/family-dynamics.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function FamilyDynamics() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [parentData, setParentData] = useState(null);
  const [parentDnaType, setParentDnaType] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [readingDnaTypes, setReadingDnaTypes] = useState({});
  const [compatibilityData, setCompatibilityData] = useState({});
  
  // UI states
  const [selectedChild, setSelectedChild] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  
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

  // Handle back navigation
  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/parent/dna-lab');
  };

  // DNA Lab navigation options
  const dnaNavOptions = useMemo(() => [
    { name: 'Dashboard', path: '/parent/dna-lab', icon: '🏠', description: 'Command center' },
    { name: 'My Reading DNA', path: '/parent/dna-lab/my-reading-dna', icon: '🧬', description: 'Your profile' },
    { name: 'My Reading Toolkit', path: '/parent/dna-lab/reading-toolkit', icon: '📚', description: 'Strategies' },
    { name: "My Kids' Library", path: '/parent/dna-lab/kids-library', icon: '👨‍👩‍👧‍👦', description: 'Child profiles' },
    { name: 'Family Dynamics', path: '/parent/dna-lab/family-dynamics', icon: '🤝', description: 'Compatibility', current: true },
    { name: 'Science Center', path: '/parent/dna-lab/science-center', icon: '🧪', description: 'Research' },
    { name: 'Reflection & Growth', path: '/parent/dna-lab/reflection-growth', icon: '🌱', description: 'Track journey' }
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

  // Load all necessary data
  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🤝 Loading Family Dynamics data...');
      
      // Load parent data and type
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (!parentDoc.exists() || !parentDoc.data().parentDNA) {
        router.push('/parent/dna-lab');
        return;
      }
      
      const parentInfo = parentDoc.data();
      setParentData(parentInfo);
      
      // Load parent DNA types
      const parentTypesRef = collection(db, 'parent-dna-types');
      const parentTypesSnapshot = await getDocs(parentTypesRef);
      const parentTypes = {};
      parentTypesSnapshot.forEach(doc => {
        parentTypes[doc.id] = doc.data();
      });
      
      const currentParentType = parentTypes[parentInfo.parentDNA.type];
      setParentDnaType(currentParentType);
      
      // Load reading DNA types for children
      const typesRef = collection(db, 'reading-dna-types');
      const typesSnapshot = await getDocs(typesRef);
      const types = {};
      typesSnapshot.forEach(doc => {
        types[doc.id] = doc.data();
      });
      setReadingDnaTypes(types);
      
      // Load compatibility data
      const compatRef = collection(db, 'parent-child-compatibility');
      const compatSnapshot = await getDocs(compatRef);
      const compat = {};
      compatSnapshot.forEach(doc => {
        compat[doc.id] = doc.data();
      });
      setCompatibilityData(compat);
      
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
      
      // Select first child with DNA by default
      const childrenWithDna = students.filter(s => s.readingDNA);
      if (childrenWithDna.length > 0 && !selectedChild) {
        setSelectedChild(childrenWithDna[0]);
      }
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error);
    }
  }, [selectedChild]);

  // Get compatibility data for parent-child combination
  const getCompatibility = useCallback((childType) => {
    if (!parentData?.parentDNA?.type || !childType) return null;
    const key = `${parentData.parentDNA.type}_${childType}`;
    return compatibilityData[key];
  }, [parentData, compatibilityData]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

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
          <p style={{ color: luxTheme.textPrimary }}>Loading Family Dynamics...</p>
        </div>
      </div>
    );
  }

  // Helper function to get mobile-friendly circle size
  const getCircleSize = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 480 ? '70px' : '100px';
    }
    return '100px';
  };

  return (
    <>
      <Head>
        <title>Family Dynamics - Reading DNA Lab</title>
        <meta name="description" content="Understand your parent-child reading compatibility and strengthen your family's reading relationships" />
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
          backgroundColor: `${luxTheme.primary}F0`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 10000
        }}>
          {/* Back Button */}
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
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
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
                minHeight: '40px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>🤝</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Family Dynamics</span>
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
                top: '55px',
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
                top: '55px',
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
          
          {/* Hero Section */}
          <div style={{
            backgroundColor: parentDnaType?.color || luxTheme.primary,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px ${parentDnaType?.color || luxTheme.primary}30`,
            marginBottom: '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              Your Family Reading Dynamics
            </h2>
            <p style={{
              fontSize: '16px',
              margin: '0',
              opacity: 0.9
            }}>
              Understanding how your {parentDnaType?.name} style connects with each child&apos;s reading personality
            </p>
          </div>

          {/* Child Selector */}
          {linkedStudents.filter(s => s.readingDNA).length > 0 ? (
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
                  Select a Child to Explore Your Compatibility
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {linkedStudents.filter(s => s.readingDNA).map((child) => {
                    const childType = readingDnaTypes[child.readingDNA?.type];
                    return (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChild(child)}
                        style={{
                          backgroundColor: selectedChild?.id === child.id ? 
                            `${childType?.color || luxTheme.primary}20` : 
                            luxTheme.surface,
                          border: selectedChild?.id === child.id ? 
                            `2px solid ${childType?.color || luxTheme.primary}` : 
                            `1px solid ${luxTheme.primary}40`,
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          transform: 'translateY(0)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: childType?.color || luxTheme.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          margin: '0 auto 8px',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}>
                          {childType?.emoji || '📚'}
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
                          {childType?.name || 'Reader'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compatibility Analysis */}
              {selectedChild && (
                <>
                  {(() => {
                    const childType = readingDnaTypes[selectedChild.readingDNA?.type];
                    const compatibility = getCompatibility(selectedChild.readingDNA?.type);
                    
                    return (
                      <>
                        {/* Compatibility Overview */}
                        <div style={{
                          backgroundColor: luxTheme.surface,
                          borderRadius: '16px',
                          padding: '24px',
                          marginBottom: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: `2px solid ${childType?.color || luxTheme.primary}30`
                        }}>
                          {/* Parent-Child Visual - Fixed for Mobile */}
                          <div className="parent-child-visual" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '15px',
                            marginBottom: '32px',
                            padding: '10px'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div className="circle-parent" style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: parentDnaType?.color || luxTheme.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                border: '3px solid white'
                              }}>
                                {parentDnaType?.emoji || '🌟'}
                              </div>
                              <div className="circle-label" style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                marginTop: '8px'
                              }}>
                                You
                              </div>
                              <div className="circle-sublabel" style={{
                                fontSize: '12px',
                                color: luxTheme.textSecondary
                              }}>
                                {parentDnaType?.name}
                              </div>
                            </div>
                            
                            <div className="connector-dots" style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: luxTheme.textSecondary,
                              flexShrink: 0
                            }}>
                              <div className="connector-line" style={{
                                width: '15px',
                                height: '2px',
                                backgroundColor: luxTheme.primary,
                                opacity: 0.3
                              }} />
                              <div style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: luxTheme.primary,
                                animation: 'pulse 2s ease-in-out infinite',
                                flexShrink: 0
                              }} />
                              <div style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: luxTheme.secondary,
                                animation: 'pulse 2s ease-in-out infinite 0.5s',
                                flexShrink: 0
                              }} />
                              <div className="connector-line" style={{
                                width: '15px',
                                height: '2px',
                                backgroundColor: luxTheme.secondary,
                                opacity: 0.3
                              }} />
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                              <div className="circle-child" style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: childType?.color || luxTheme.secondary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                border: '3px solid white'
                              }}>
                                {childType?.emoji || '📚'}
                              </div>
                              <div className="circle-label" style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                marginTop: '8px'
                              }}>
                                {selectedChild.firstName}
                              </div>
                              <div className="circle-sublabel" style={{
                                fontSize: '12px',
                                color: luxTheme.textSecondary
                              }}>
                                {childType?.name}
                              </div>
                            </div>
                          </div>

                          {/* Match Level */}
                          {compatibility && compatibility.level && (
                            <div style={{
                              textAlign: 'center',
                              marginBottom: '32px'
                            }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: `${luxTheme.accent}30`,
                                borderRadius: '24px',
                                padding: '8px 20px',
                                border: `2px solid ${luxTheme.accent}50`
                              }}>
                                <span style={{ fontSize: '20px' }}>
                                  {compatibility.level === 'Excellent Match' ? '🌟' : 
                                   compatibility.level === 'Good Match' ? '✨' : '💫'}
                                </span>
                                <span style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary
                                }}>
                                  {compatibility.level}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Honeymoon Phase - Beautiful Quote Display */}
                          {compatibility?.realityCheck?.honeymoonPhase && (
                            <div style={{
                              textAlign: 'center',
                              padding: '24px',
                              backgroundColor: `${luxTheme.accent}10`,
                              borderRadius: '16px',
                              border: `2px solid ${luxTheme.accent}20`,
                              marginBottom: '24px'
                            }}>
                              <div style={{
                                fontSize: '13px',
                                color: luxTheme.textSecondary,
                                marginBottom: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                opacity: 0.7
                              }}>
                                The Honeymoon Phase
                              </div>
                              <p style={{
                                fontSize: '17px',
                                color: luxTheme.textPrimary,
                                margin: 0,
                                lineHeight: '1.6',
                                fontWeight: '500',
                                fontStyle: 'italic'
                              }}>
                                &quot;{compatibility.realityCheck.honeymoonPhase}&quot;
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Detailed Sections */}
                        {compatibility && (
                          <>
                            {/* The Honest Truth */}
                            <CompatibilitySection
                              title="The Honest Truth"
                              emoji="💭"
                              description="Where tensions might arise (and that&apos;s okay!)"
                              isExpanded={expandedSections['realityCheck']}
                              onToggle={() => toggleSection('realityCheck')}
                              theme={luxTheme}
                              color={childType?.color}
                            >
                              {compatibility.realityCheck && (
                                <>
                                  <div style={{
                                    backgroundColor: '#FFF3CD',
                                    border: '1px solid #FFE69C',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    color: '#664D03',
                                    lineHeight: '1.6'
                                  }}>
                                    <div style={{
                                      fontWeight: '600',
                                      marginBottom: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span>⚡</span> Where Tension Arises:
                                    </div>
                                    <p style={{ margin: '0 0 12px 0' }}>
                                      {compatibility.realityCheck.whereTensionArises}
                                    </p>
                                    
                                    {compatibility.realityCheck.theClash && (
                                      <>
                                        <div style={{
                                          fontWeight: '600',
                                          marginBottom: '8px',
                                          marginTop: '16px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px'
                                        }}>
                                          <span>💥</span> The Clash:
                                        </div>
                                        <p style={{ 
                                          margin: 0,
                                          fontStyle: 'italic',
                                          backgroundColor: 'rgba(255,255,255,0.5)',
                                          padding: '12px',
                                          borderRadius: '8px'
                                        }}>
                                          {compatibility.realityCheck.theClash}
                                        </p>
                                      </>
                                    )}
                                  </div>

                                  <div style={{
                                    backgroundColor: `${luxTheme.accent}20`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    fontSize: '14px',
                                    color: luxTheme.textPrimary,
                                    lineHeight: '1.6'
                                  }}>
                                    <div style={{
                                      fontWeight: '600',
                                      marginBottom: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <span>💡</span> How to Navigate:
                                    </div>
                                    {compatibility.realityCheck.howToNavigate}
                                  </div>
                                </>
                              )}
                            </CompatibilitySection>

                            {/* Growth Opportunities */}
                            <CompatibilitySection
                              title="Growth Opportunities"
                              emoji="🌱"
                              description="What this relationship can teach you both"
                              isExpanded={expandedSections['growth']}
                              onToggle={() => toggleSection('growth')}
                              theme={luxTheme}
                              color={childType?.color}
                            >
                              {compatibility.realityCheck?.growthOpportunity && (
                                <div style={{
                                  backgroundColor: `${luxTheme.accent}10`,
                                  borderRadius: '12px',
                                  padding: '20px',
                                  fontSize: '14px',
                                  color: luxTheme.textPrimary,
                                  lineHeight: '1.8',
                                  textAlign: 'center'
                                }}>
                                  <div style={{
                                    fontSize: '32px',
                                    marginBottom: '16px'
                                  }}>
                                    🌟
                                  </div>
                                  <p style={{
                                    margin: 0,
                                    fontWeight: '500'
                                  }}>
                                    {compatibility.realityCheck.growthOpportunity}
                                  </p>
                                </div>
                              )}
                            </CompatibilitySection>

                            {/* Family Reading Activities */}
                            <CompatibilitySection
                              title="Activities That Work for You Both"
                              emoji="🎯"
                              description="Reading experiences that honor both personalities"
                              isExpanded={expandedSections['activities']}
                              onToggle={() => toggleSection('activities')}
                              theme={luxTheme}
                              color={childType?.color}
                            >
                              {compatibility.specificStrategies && (
                                <div style={{
                                  display: 'grid',
                                  gap: '12px'
                                }}>
                                  {compatibility.specificStrategies.map((strategy, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        backgroundColor: luxTheme.surface,
                                        border: `1px solid ${luxTheme.primary}30`,
                                        borderRadius: '12px',
                                        padding: '16px',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`;
                                        e.currentTarget.style.transform = 'translateX(4px)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = luxTheme.surface;
                                        e.currentTarget.style.transform = 'translateX(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                      }}
                                    >
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                      }}>
                                        <span style={{
                                          fontSize: '20px',
                                          flexShrink: 0
                                        }}>
                                          {['📚', '🎯', '🌟', '💡'][idx % 4]}
                                        </span>
                                        <div style={{
                                          fontSize: '14px',
                                          color: luxTheme.textPrimary,
                                          lineHeight: '1.5',
                                          flex: 1
                                        }}>
                                          {strategy}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CompatibilitySection>
                          </>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </>
          ) : (
            // No children with DNA
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧬</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                No Children Have Completed Reading DNA Yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                lineHeight: '1.5',
                marginBottom: '20px'
              }}>
                Once your children complete their Reading DNA assessments, you&apos;ll be able to explore 
                your unique parent-child dynamics and get personalized relationship insights here.
              </p>
              <button
                onClick={() => router.push('/parent/dna-lab/kids-library')}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Check Children&apos;s Status
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0.3; }
          }
          
          @keyframes slideIn {
            from { 
              opacity: 0; 
              transform: translateY(20px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
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
          
          @media (max-width: 480px) {
            .parent-child-visual {
              gap: 10px !important;
            }
            
            .circle-parent, .circle-child {
              width: 60px !important;
              height: 60px !important;
              font-size: 24px !important;
            }
            
            .circle-label {
              font-size: 12px !important;
            }
            
            .circle-sublabel {
              font-size: 10px !important;
            }
            
            .connector-dots {
              gap: 3px !important;
            }
            
            .connector-line {
              width: 10px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

// Compatibility Section Component
function CompatibilitySection({ title, emoji, description, isExpanded, onToggle, theme, color, children }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: `2px solid ${color || theme.primary}20`
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left'
        }}
      >
        <div style={{
          fontSize: '32px',
          flexShrink: 0
        }}>
          {emoji}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '4px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textSecondary
          }}>
            {description}
          </div>
        </div>
        
        <div style={{
          fontSize: '20px',
          color: theme.textSecondary,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▶
        </div>
      </button>
      
      {isExpanded && (
        <div style={{
          padding: '0 20px 20px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
// pages/parent/dna-lab/science-center.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  READING_SCIENCE_RESEARCH, 
  getScienceHelpers, 
  RESEARCH_STATS 
} from '../../../lib/science-of-reading';

export default function ScienceCenter() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [parentData, setParentData] = useState(null);
  const [parentDnaType, setParentDnaType] = useState(null);
  const [featuredStudy, setFeaturedStudy] = useState(null);
  const [relevantResearch, setRelevantResearch] = useState([]);
  
  // UI states
  const [viewMode, setViewMode] = useState('personalized'); // 'personalized' or 'all'
  const [expandedSections, setExpandedSections] = useState({
    overview: false,
    motivation: false,
    attachment: false,
    development: false,
    neuroscience: false,
    homeEnvironment: false,
    yourType: false
  });
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Get time-based theme with smoother transitions
  const timeTheme = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        name: 'morning',
        gradient: 'linear-gradient(135deg, #F5C99B, #F0B88A, #EBAD7A)',
        backgroundGradient: 'linear-gradient(to bottom, #FDF4E7, #FAE8D4, #F5DCC1)',
        overlay: 'rgba(245, 201, 155, 0.1)',
        glow: '#F5C99B'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        name: 'afternoon',
        gradient: 'linear-gradient(135deg, #6BB6E3, #7AC5EA, #89D0EE)',
        backgroundGradient: 'linear-gradient(to bottom, #E8F4FD, #D1E9FB, #B8DDF8)',
        overlay: 'rgba(107, 182, 227, 0.1)',
        glow: '#6BB6E3'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #FFB347, #FF8C42, #FF6B35)',
        backgroundGradient: 'linear-gradient(to bottom, #FFF0E6, #FFE4D1, #FFD7BC)',
        overlay: 'rgba(255, 140, 66, 0.1)',
        glow: '#FF8C42'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #4B0082, #6A0DAD, #7B68EE)',
        backgroundGradient: 'linear-gradient(to bottom, #2D1B4E, #3D2B5E, #4D3B6E)',
        overlay: 'rgba(75, 0, 130, 0.1)',
        glow: '#7B68EE'
      };
    }
  }, [Math.floor(new Date().getHours() / 6)]);

  // Lux Libris Classic Theme - adapted for time-based backgrounds
  const luxTheme = useMemo(() => {
    const isNight = timeTheme.name === 'night';
    return {
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: timeTheme.backgroundGradient, // Now uses time-based gradient
      surface: isNight ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF', // Slightly transparent for night mode
      textPrimary: isNight ? '#1F2937' : '#223848', // Darker for night mode contrast
      textSecondary: isNight ? '#374151' : '#556B7A',
      timeOverlay: timeTheme.overlay,
      timeGlow: timeTheme.glow
    }
  }, [timeTheme]);

  // DNA Lab navigation options
  const dnaNavOptions = useMemo(() => [
    { name: 'Dashboard', path: '/parent/dna-lab', icon: '🏠', description: 'Command center' },
    { name: 'My Reading DNA', path: '/parent/dna-lab/my-reading-dna', icon: '🧬', description: 'Your profile' },
    { name: 'My Reading Toolkit', path: '/parent/dna-lab/reading-toolkit', icon: '📚', description: 'Strategies' },
    { name: "My Kids' Library", path: '/parent/dna-lab/kids-library', icon: '👨‍👩‍👧‍👦', description: 'Child profiles' },
    { name: 'Family Dynamics', path: '/parent/dna-lab/family-dynamics', icon: '🤝', description: 'Compatibility' },
    { name: 'Science Center', path: '/parent/dna-lab/science-center', icon: '🧪', description: 'Research', current: true },
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

  // Load data and set featured study
  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🧪 Loading Science Center data...');
      
      // Load parent data
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (!parentDoc.exists()) {
        router.push('/parent/dashboard');
        return;
      }
      
      const parentInfo = parentDoc.data();
      setParentData(parentInfo);
      
      // Set parent DNA type
      if (parentInfo.parentDNA?.type) {
        setParentDnaType(parentInfo.parentDNA.type);
        
        // Get research relevant to their type
        const typeResearch = getScienceHelpers.getResearchForParentType(parentInfo.parentDNA.type);
        setRelevantResearch(typeResearch);
      }
      
      // Set featured study
      const featured = getScienceHelpers.getRandomFeaturedStudy();
      setFeaturedStudy(featured);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
    
    setLoading(false);
  }, [user, router]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Show research detail modal
  const showResearch = (research) => {
    setSelectedResearch(research);
    setShowResearchModal(true);
  };

  // Handle navigation
  const handleDnaNavigation = (option) => {
    if (option.current) return;
    setShowDnaDropdown(false);
    router.push(option.path);
  };

  // Handle back navigation
  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/parent/dna-lab');
  };

  // Search research
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term) {
      const results = getScienceHelpers.searchStudies(term);
      // Handle search results display
    }
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
        setShowResearchModal(false);
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
        background: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Time-based overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: luxTheme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading Science Center...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Science Center - Reading DNA Lab</title>
        <meta name="description" content="Explore the research and evidence behind your family's reading DNA insights" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        background: luxTheme.background,
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
          background: luxTheme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Header with time-based gradient */}
        <div style={{
          background: timeTheme.gradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 40px ${luxTheme.timeGlow}30`,
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
              color: timeTheme.name === 'night' ? '#FFFFFF' : luxTheme.textPrimary,
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
                color: timeTheme.name === 'night' ? '#FFFFFF' : luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                fontSize: '16px',
                fontWeight: '500',
                minHeight: '40px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>🧪</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Science Center</span>
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
          <div className="nav-menu-container" style={{ 
            position: 'absolute', 
            right: '20px', 
            top: '30px'
          }}>
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
                color: timeTheme.name === 'night' ? '#FFFFFF' : luxTheme.textPrimary,
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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          
          {/* Hero Section with time-based gradient */}
          <div style={{
            background: timeTheme.gradient,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px rgba(0,0,0,0.15), 0 0 40px ${luxTheme.timeGlow}30`,
            marginBottom: '20px',
            color: timeTheme.name === 'night' ? '#FFFFFF' : luxTheme.textPrimary,
            textAlign: 'center',
            animation: 'slideInDown 0.8s ease-out'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧪</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0',
              textShadow: timeTheme.name === 'night' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
            }}>
              The Science Behind Your Reading DNA
            </h2>
            <p style={{
              fontSize: '16px',
              margin: '0',
              opacity: 0.9
            }}>
              {RESEARCH_STATS.totalStudies}+ peer-reviewed studies validating personalized reading support
            </p>
          </div>

          {/* Combined Featured Research and Quick Help Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Featured Research */}
            {featuredStudy && (
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.accent}30`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                animation: 'slideInUp 0.8s ease-out 0.3s both'
              }}
              onClick={() => showResearch(featuredStudy)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '24px' }}>⭐</span>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary
                  }}>
                    Featured Research
                  </div>
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0',
                  lineHeight: '1.3'
                }}>
                  {featuredStudy.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: luxTheme.textSecondary,
                  marginBottom: '12px'
                }}>
                  {featuredStudy.authors} ({featuredStudy.year})
                </p>
                <div style={{
                  backgroundColor: `${luxTheme.accent}20`,
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px'
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: luxTheme.textPrimary,
                    margin: '0',
                    lineHeight: '1.5'
                  }}>
                    <strong>Key Finding:</strong> {featuredStudy.keyFinding}
                  </p>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: luxTheme.textPrimary,
                  margin: '0',
                  fontStyle: 'italic',
                  lineHeight: '1.4',
                  marginTop: 'auto'
                }}>
                  💡 {featuredStudy.practicalTakeaway}
                </p>
              </div>
            )}

            {/* Quick Help Section */}
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              animation: 'slideInUp 0.8s ease-out 0.4s both'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '24px' }}>📋</span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary
                }}>
                  Quick Help
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                flex: 1,
                alignContent: 'center'
              }}>
                {Object.entries(READING_SCIENCE_RESEARCH.commonConcerns).map(([concernId, concern], idx) => (
                  <button
                    key={concernId}
                    onClick={() => showResearch({
                      title: concernId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                      details: concern.research.map((r, i) => `${i + 1}. ${r}`).join('\n\n'),
                      strategies: concern.strategies,
                      type: 'concern'
                    })}
                    style={{
                      backgroundColor: idx === 0 ? `${luxTheme.accent}15` : 
                                      idx === 1 ? `${luxTheme.primary}15` :
                                      idx === 2 ? `${luxTheme.secondary}15` : 
                                      '#FFF0E8',
                      border: `1.5px solid ${
                        idx === 0 ? luxTheme.accent : 
                        idx === 1 ? luxTheme.primary :
                        idx === 2 ? luxTheme.secondary : 
                        '#FFB68A'
                      }40`,
                      borderRadius: '10px',
                      padding: '16px 12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '80px',
                      position: 'relative',
                      overflow: 'visible'
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
                      fontSize: '24px'
                    }}>
                      {concernId === 'reluctantReader' && '😔'}
                      {concernId === 'screenTime' && '📱'}
                      {concernId === 'summerSlide' && '☀️'}
                      {concernId === 'readingLevels' && '📊'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textPrimary,
                      fontWeight: '500',
                      lineHeight: '1.2'
                    }}>
                      {concernId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

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
            gap: '12px',
            animation: 'slideInUp 0.8s ease-out 0.5s both'
          }}>
            <button
              onClick={() => setViewMode('personalized')}
              style={{
                backgroundColor: viewMode === 'personalized' ? luxTheme.primary : 'transparent',
                color: viewMode === 'personalized' ? luxTheme.textPrimary : luxTheme.textSecondary,
                border: `1px solid ${luxTheme.primary}`,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🌟 For Your DNA Type
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                backgroundColor: viewMode === 'all' ? luxTheme.primary : 'transparent',
                color: viewMode === 'all' ? luxTheme.textPrimary : luxTheme.textSecondary,
                border: `1px solid ${luxTheme.primary}`,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🌍 All Research
            </button>
          </div>

          {/* Personalized Research for Parent Type */}
          {viewMode === 'personalized' && parentDnaType && relevantResearch.length > 0 && (
            <ResearchSection
              title={`Research That Validates Your Approach`}
              emoji="✨"
              description={`Studies that support ${parentDnaType} parents`}
              isExpanded={expandedSections.yourType}
              onToggle={() => toggleSection('yourType')}
              theme={luxTheme}
              color={luxTheme.primary}
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                {relevantResearch.slice(0, 5).map((study, idx) => (
                  <ResearchCard
                    key={study.id}
                    title={study.title}
                    authors={study.authors}
                    year={study.year}
                    finding={study.keyFinding}
                    application={study.application || study.practicalTakeaway}
                    categoryBadge={study.categoryName}
                    onClick={() => showResearch(study)}
                    theme={luxTheme}
                  />
                ))}
              </div>
              
              {READING_SCIENCE_RESEARCH.parentTypeApplications[parentDnaType] && (
                <div style={{
                  backgroundColor: `${luxTheme.accent}20`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0'
                  }}>
                    🎯 Your Research-Backed Strengths
                  </h4>
                  {READING_SCIENCE_RESEARCH.parentTypeApplications[parentDnaType].validatingResearch.map((point, idx) => (
                    <div key={idx} style={{
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      marginBottom: '8px',
                      paddingLeft: '20px',
                      position: 'relative'
                    }}>
                      <span style={{ position: 'absolute', left: 0 }}>•</span>
                      {point}
                    </div>
                  ))}
                </div>
              )}
            </ResearchSection>
          )}

          {/* Research Categories */}
          {Object.entries(READING_SCIENCE_RESEARCH.categories).map(([categoryId, category]) => (
            <ResearchSection
              key={categoryId}
              title={category.name}
              emoji={category.icon}
              description={category.description}
              isExpanded={expandedSections[categoryId]}
              onToggle={() => toggleSection(categoryId)}
              theme={luxTheme}
              color={luxTheme.primary}
            >
              {viewMode === 'all' || (viewMode === 'personalized' && category.studies.some(s => 
                s.parentTypeApplications && s.parentTypeApplications[parentDnaType]
              )) ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {category.studies
                    .filter(study => viewMode === 'all' || 
                      (study.parentTypeApplications && study.parentTypeApplications[parentDnaType]))
                    .map((study) => (
                      <ResearchCard
                        key={study.id}
                        title={study.title}
                        authors={study.authors}
                        year={study.year}
                        finding={study.keyFinding}
                        application={study.application}
                        onClick={() => showResearch(study)}
                        theme={luxTheme}
                        highlight={viewMode === 'personalized' && study.parentTypeApplications?.[parentDnaType]}
                      />
                    ))
                  }
                </div>
              ) : null}
            </ResearchSection>
          ))}

        </div>

        {/* Research Detail Modal */}
        {showResearchModal && selectedResearch && (
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: luxTheme.textPrimary,
                  fontSize: '20px',
                  paddingRight: '20px'
                }}>
                  {selectedResearch.title}
                </h3>
                <button 
                  onClick={() => setShowResearchModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: luxTheme.textSecondary,
                    padding: '4px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
              
              {selectedResearch.authors && (
                <p style={{
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  marginBottom: '16px'
                }}>
                  {selectedResearch.authors} {selectedResearch.year && `(${selectedResearch.year})`}
                </p>
              )}
              
              {selectedResearch.journal && (
                <p style={{
                  fontSize: '13px',
                  color: luxTheme.textSecondary,
                  fontStyle: 'italic',
                  marginBottom: '16px'
                }}>
                  Published in: {selectedResearch.journal}
                </p>
              )}
              
              {selectedResearch.keyFinding && (
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
                    margin: '0 0 8px 0'
                  }}>
                    📊 Key Finding
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {selectedResearch.keyFinding}
                  </p>
                </div>
              )}
              
              {selectedResearch.details && (
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
                    margin: '0 0 8px 0'
                  }}>
                    📚 Research Details
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.6',
                    margin: 0,
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedResearch.details}
                  </p>
                </div>
              )}
              
              {(selectedResearch.application || selectedResearch.practicalTakeaway || selectedResearch.implications) && (
                <div style={{
                  backgroundColor: `${luxTheme.secondary}20`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    💡 What This Means for You
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {selectedResearch.application || selectedResearch.practicalTakeaway || selectedResearch.implications}
                  </p>
                </div>
              )}
              
              {selectedResearch.strategies && (
                <div style={{
                  backgroundColor: luxTheme.surface,
                  border: `1px solid ${luxTheme.primary}30`,
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0'
                  }}>
                    🛠️ Practical Strategies
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {selectedResearch.strategies.map((strategy, idx) => (
                      <div key={idx} style={{
                        fontSize: '14px',
                        color: luxTheme.textPrimary,
                        paddingLeft: '24px',
                        position: 'relative',
                        lineHeight: '1.5',
                        paddingBottom: '8px',
                        borderBottom: idx < selectedResearch.strategies.length - 1 ? `1px solid ${luxTheme.primary}10` : 'none'
                      }}>
                        <span style={{ 
                          position: 'absolute', 
                          left: '8px',
                          color: luxTheme.primary,
                          fontWeight: 'bold'
                        }}>
                          {idx + 1}.
                        </span>
                        {strategy}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedResearch.doi && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${luxTheme.primary}30`,
                  fontSize: '12px',
                  color: luxTheme.textSecondary
                }}>
                  DOI: <a 
                    href={`https://doi.org/${selectedResearch.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: luxTheme.primary,
                      textDecoration: 'none'
                    }}
                  >
                    {selectedResearch.doi}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
          
          @keyframes slideInUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
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
        `}</style>
      </div>
    </>
  );
}

// Research Section Component
function ResearchSection({ title, emoji, description, isExpanded, onToggle, theme, color, children }) {
  // Don't render if there are no children
  if (!children || (Array.isArray(children) && children.every(child => !child))) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: `2px solid ${color || theme.primary}20`,
      animation: 'slideInUp 0.5s ease-out'
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

// Research Card Component
function ResearchCard({ title, authors, year, finding, application, categoryBadge, onClick, theme, highlight }) {
  // Assign different colors based on the card's position or content
  const getCardColor = () => {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorOptions = [
      { bg: `${theme.primary}08`, border: `${theme.primary}50` },
      { bg: `${theme.secondary}08`, border: `${theme.secondary}50` },
      { bg: `${theme.accent}08`, border: `${theme.accent}50` },
      { bg: '#E8F3FF', border: '#7CB9E8' },  // Light blue
      { bg: '#FFF0E8', border: '#FFB68A' },  // Light peach
      { bg: '#F0E8FF', border: '#B19CD9' },  // Light purple
    ];
    return colorOptions[hash % colorOptions.length];
  };
  
  const cardColor = getCardColor();
  
  return (
    <div
      style={{
        backgroundColor: highlight ? `${theme.accent}15` : cardColor.bg,
        border: `2px solid ${highlight ? theme.accent : cardColor.border}`,
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        marginBottom: '8px'
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {categoryBadge && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: cardColor.border,
          color: 'white',
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          {categoryBadge}
        </div>
      )}
      
      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: theme.textPrimary,
        marginBottom: '8px',
        paddingRight: categoryBadge ? '90px' : '0',
        lineHeight: '1.3'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '13px',
        color: theme.textSecondary,
        marginBottom: '12px'
      }}>
        {authors} {year && `(${year})`}
      </div>
      
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '12px',
          color: cardColor.border,
          fontWeight: '700',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Key Finding
        </div>
        <div style={{
          fontSize: '15px',
          color: theme.textPrimary,
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          {finding}
        </div>
      </div>
      
      {application && (
        <div style={{
          fontSize: '14px',
          color: theme.textPrimary,
          lineHeight: '1.5',
          fontStyle: 'italic',
          paddingLeft: '16px',
          borderLeft: `3px solid ${cardColor.border}40`
        }}>
          💡 {application}
        </div>
      )}
      
      {highlight && (
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: theme.accent,
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ✨ Validates your parenting approach
        </div>
      )}
    </div>
  );
}
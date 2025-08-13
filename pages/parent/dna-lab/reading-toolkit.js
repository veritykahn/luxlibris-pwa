// pages/parent/dna-lab/reading-toolkit.js - Enhanced with Time-Based Themes
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ReadingToolkit() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Parent DNA states
  const [parentData, setParentData] = useState(null);
  const [parentDnaType, setParentDnaType] = useState(null);
  const [parentDnaTypes, setParentDnaTypes] = useState({});
  
  // UI states
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [expandedSections, setExpandedSections] = useState({});
  const [starredStrategies, setStarredStrategies] = useState(new Set());
  const [triedStrategies, setTriedStrategies] = useState(new Set());
  const [dismissedStrategies, setDismissedStrategies] = useState(new Set());
  
  // Ref for scrolling
  const strategyRefs = useRef({});
  
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
    };
  }, [timeTheme]);

  // DNA Lab navigation options
  const dnaNavOptions = useMemo(() => [
    { name: 'Dashboard', path: '/parent/dna-lab', icon: '🏠', description: 'Command center' },
    { name: 'My Reading DNA', path: '/parent/dna-lab/my-reading-dna', icon: '🧬', description: 'Your profile' },
    { name: 'My Reading Toolkit', path: '/parent/dna-lab/reading-toolkit', icon: '🧰', description: 'Strategies', current: true },
    { name: "My Kids' Library", path: '/parent/dna-lab/kids-library', icon: '👨‍👩‍👧‍👦', description: 'Child profiles' },
    { name: 'Family Dynamics', path: '/parent/dna-lab/family-dynamics', icon: '🤝', description: 'Compatibility' },
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

  // Fixed back button handler
  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Back button clicked - navigating to /parent/dna-lab');
    router.push('/parent/dna-lab');
  };

  // Load parent DNA data
  const loadParentDnaData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      // Load parent data
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (!parentDoc.exists() || !parentDoc.data().parentDNA) {
        router.push('/parent/dna-lab');
        return;
      }
      
      const data = parentDoc.data();
      setParentData(data);
      
      // Load all parent DNA types
      const typesRef = collection(db, 'parent-dna-types');
      const typesSnapshot = await getDocs(typesRef);
      const types = {};
      typesSnapshot.forEach(doc => {
        types[doc.id] = doc.data();
      });
      setParentDnaTypes(types);
      
      // Get specific parent's type
      const parentType = types[data.parentDNA.type];
      if (parentType) {
        setParentDnaType(parentType);
      }
      
    } catch (error) {
      setError('Failed to load your toolkit. Please try again.');
    }
    
    setLoading(false);
  }, [user, router]);

  // Load data on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadParentDnaData();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector');
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard');
    }
  }, [authLoading, isAuthenticated, user, userProfile, loadParentDnaData, router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDnaDropdown && !event.target.closest('.dna-dropdown-container')) {
        setShowDnaDropdown(false);
      }
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false);
      }
      if (showSearchModal && !event.target.closest('.search-modal-container')) {
        setShowSearchModal(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDnaDropdown(false);
        setShowNavMenu(false);
        setShowSearchModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDnaDropdown, showNavMenu, showSearchModal]);

  // Navigate to DNA pages
  const handleDnaNavigation = (option) => {
    if (option.current) return;
    setShowDnaDropdown(false);
    router.push(option.path);
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Strategy actions
  const toggleStar = (strategyId) => {
    setStarredStrategies(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(strategyId)) {
        newStarred.delete(strategyId);
      } else {
        newStarred.add(strategyId);
      }
      return newStarred;
    });
  };

  const toggleTried = (strategyId) => {
    setTriedStrategies(prev => {
      const newTried = new Set(prev);
      if (newTried.has(strategyId)) {
        newTried.delete(strategyId);
      } else {
        newTried.add(strategyId);
      }
      return newTried;
    });
  };

  const dismissStrategy = (strategyId) => {
    setDismissedStrategies(prev => new Set([...prev, strategyId]));
  };

  const restoreStrategy = (strategyId) => {
    setDismissedStrategies(prev => {
      const newDismissed = new Set(prev);
      newDismissed.delete(strategyId);
      return newDismissed;
    });
  };

  // Enhanced search functionality with exact content
  const searchStrategies = useCallback((query) => {
    if (!query || !parentDnaType) return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    const results = [];
    
    // Helper function to calculate match score
    const getMatchScore = (text) => {
      const lowerText = text.toLowerCase();
      return searchTerms.filter(term => lowerText.includes(term)).length;
    };

    // Search in daily strategies
    if (parentDnaType.dailyStrategies) {
      Object.entries(parentDnaType.dailyStrategies).forEach(([category, strategies]) => {
        strategies.forEach((strategy, index) => {
          const matchScore = getMatchScore(strategy);
          
          if (matchScore > 0) {
            results.push({
              type: 'daily',
              category: category,
              id: `daily-${category}`,
              strategyId: `${category}-${index}`,
              title: `Daily ${category.charAt(0).toUpperCase() + category.slice(1)}`,
              content: strategy,
              matchScore
            });
          }
        });
      });
    }

    // Search in seasonal support
    if (parentDnaType.seasonalSupport) {
      Object.entries(parentDnaType.seasonalSupport).forEach(([season, support]) => {
        if (support.strategies) {
          support.strategies.forEach((strategy, index) => {
            const matchScore = getMatchScore(strategy);
            
            if (matchScore > 0) {
              results.push({
                type: 'seasonal',
                season: season,
                id: `seasonal-${season}`,
                strategyId: `${season}-${index}`,
                title: `${season.charAt(0).toUpperCase() + season.slice(1)} - Strategy`,
                content: strategy,
                matchScore
              });
            }
          });
        }
      });
    }

    // Search in emergency toolkit with more detail
    if (parentDnaType.problemsToolkit) {
      Object.entries(parentDnaType.problemsToolkit).forEach(([key, scenario]) => {
        // Search in scripts
        if (scenario.scripts) {
          scenario.scripts.doSay?.forEach((script, index) => {
            const matchScore = getMatchScore(script);
            if (matchScore > 0) {
              results.push({
                type: 'emergency',
                scenarioId: key,
                id: `emergency-${key}`,
                strategyId: `${key}-doSay-${index}`,
                title: `${key.replace(/([A-Z])/g, ' $1').trim()} - DO Say`,
                content: `"${script}"`,
                matchScore
              });
            }
          });

          scenario.scripts.dontSay?.forEach((script, index) => {
            const matchScore = getMatchScore(script);
            if (matchScore > 0) {
              results.push({
                type: 'emergency',
                scenarioId: key,
                id: `emergency-${key}`,
                strategyId: `${key}-dontSay-${index}`,
                title: `${key.replace(/([A-Z])/g, ' $1').trim()} - DON&apos;T Say`,
                content: `"${script}"`,
                matchScore
              });
            }
          });
        }

        // Search in approaches
        scenario.gentleApproaches?.forEach((approach, index) => {
          const matchScore = getMatchScore(approach);
          if (matchScore > 0) {
            results.push({
              type: 'emergency',
              scenarioId: key,
              id: `emergency-${key}`,
              strategyId: `${key}-approach-${index}`,
              title: `${key.replace(/([A-Z])/g, ' $1').trim()} - Gentle Approach`,
              content: approach,
              matchScore
            });
          }
        });

        // Search in practical tips
        scenario.practicalTips?.forEach((tip, index) => {
          const matchScore = getMatchScore(tip);
          if (matchScore > 0) {
            results.push({
              type: 'emergency',
              scenarioId: key,
              id: `emergency-${key}`,
              strategyId: `${key}-tip-${index}`,
              title: `${key.replace(/([A-Z])/g, ' $1').trim()} - Practical Tip`,
              content: tip,
              matchScore
            });
          }
        });

        // Search in other fields
        if (scenario.prevention) {
          const matchScore = getMatchScore(scenario.prevention);
          if (matchScore > 0) {
            results.push({
              type: 'emergency',
              scenarioId: key,
              id: `emergency-${key}`,
              strategyId: `${key}-prevention`,
              title: `${key.replace(/([A-Z])/g, ' $1').trim()} - Prevention`,
              content: scenario.prevention,
              matchScore
            });
          }
        }
      });
    }
    
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [parentDnaType]);

  const searchResults = useMemo(() => {
    return searchStrategies(searchQuery);
  }, [searchQuery, searchStrategies]);

  // Handle search result click with scroll
  const handleSearchResultClick = (result) => {
    // Navigate to the correct tab
    setActiveTab(result.type);
    
    // Expand the section
    setExpandedSections(prev => ({
      ...prev,
      [result.id]: true
    }));
    
    // Close search modal
    setShowSearchModal(false);
    setSearchQuery('');
    
    // Scroll to the specific strategy after a short delay
    setTimeout(() => {
      const element = strategyRefs.current[result.strategyId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        element.style.backgroundColor = '#FFD700';
        setTimeout(() => {
          element.style.backgroundColor = '';
          element.style.transition = 'background-color 1s ease';
        }, 500);
      }
    }, 300);
  };

  // Show loading
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
          <p style={{ color: luxTheme.textPrimary }}>Loading your toolkit...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (error || !parentDnaType) {
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
        
        <div style={{ textAlign: 'center', padding: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>
            {error || 'Unable to load your toolkit'}
          </p>
          <button
            onClick={() => router.push('/parent/dna-lab')}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to DNA Lab
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Reading Toolkit - Lux Libris</title>
        <meta name="description" content="Practical strategies and crisis management for reading support" />
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
        
        {/* Header with DNA Lab Dropdown - Now with time-based gradient */}
        <div style={{
          background: timeTheme.gradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 40px ${luxTheme.timeGlow}30`,
          zIndex: 1000
        }}>
          {/* Back Button - Fixed with explicit handler */}
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
              zIndex: 1001
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
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
              <span style={{ fontSize: '18px' }}>🧰</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>My Reading Toolkit</span>
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
                zIndex: 10000
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
                zIndex: 10000
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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Toolkit Header - Enhanced with time-based styling */}
          <div style={{
            background: timeTheme.gradient,
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 4px 20px rgba(0,0,0,0.15), 0 0 40px ${luxTheme.timeGlow}30`
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: 'radial-gradient(circle at 20% 30%, white 0%, transparent 50%), radial-gradient(circle at 80% 60%, white 0%, transparent 50%)'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '16px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}>
                🧰
              </div>
              
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                fontFamily: 'Didot, serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Your Reading Toolkit
              </h1>
              
              <p style={{
                fontSize: '18px',
                margin: '0 0 0 0',
                opacity: 0.95,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.5'
              }}>
                Personalized strategies, scripts, and crisis management for your {parentDnaType.name} style
              </p>
            </div>
          </div>

          {/* Emergency Button - Underneath Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setShowSearchModal(true)}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#DC143C',
                color: 'white',
                border: 'none',
                fontSize: '32px',
                cursor: 'pointer',
                boxShadow: '0 6px 30px rgba(220, 20, 60, 0.5)',
                animation: 'emergencyPulse 1.5s infinite',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Reading Emergency Search"
            >
              🚨
            </button>
          </div>

          {/* Tab Navigation - Mobile Optimized */}
          <div style={{
            display: 'flex',
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '6px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            gap: '4px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {[
              { id: 'daily', label: 'Daily', icon: '📖' },
              { id: 'seasonal', label: 'Seasonal', icon: '🗓️' },
              { id: 'emergency', label: 'Emergency', icon: '🚨' },
              { id: 'strategies', label: 'My Strategies', icon: '⭐' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  minWidth: 'max-content',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? luxTheme.primary : 'transparent',
                  color: activeTab === tab.id ? luxTheme.textPrimary : luxTheme.textSecondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'strategies' && starredStrategies.size > 0 && (
                  <span style={{
                    backgroundColor: parentDnaType.color || luxTheme.secondary,
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {starredStrategies.size}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'daily' && (
            <DailyStrategiesSection 
              parentDnaType={parentDnaType}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              starredStrategies={starredStrategies}
              triedStrategies={triedStrategies}
              dismissedStrategies={dismissedStrategies}
              toggleStar={toggleStar}
              toggleTried={toggleTried}
              dismissStrategy={dismissStrategy}
              theme={luxTheme}
              strategyRefs={strategyRefs}
            />
          )}

          {activeTab === 'seasonal' && (
            <SeasonalStrategiesSection 
              parentDnaType={parentDnaType}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              starredStrategies={starredStrategies}
              triedStrategies={triedStrategies}
              dismissedStrategies={dismissedStrategies}
              toggleStar={toggleStar}
              toggleTried={toggleTried}
              dismissStrategy={dismissStrategy}
              theme={luxTheme}
              strategyRefs={strategyRefs}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencySection 
              parentDnaType={parentDnaType}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              starredStrategies={starredStrategies}
              triedStrategies={triedStrategies}
              dismissedStrategies={dismissedStrategies}
              toggleStar={toggleStar}
              toggleTried={toggleTried}
              dismissStrategy={dismissStrategy}
              theme={luxTheme}
              strategyRefs={strategyRefs}
            />
          )}

          {activeTab === 'strategies' && (
            <MyStrategiesSection 
              parentDnaType={parentDnaType}
              starredStrategies={starredStrategies}
              triedStrategies={triedStrategies}
              dismissedStrategies={dismissedStrategies}
              toggleStar={toggleStar}
              restoreStrategy={restoreStrategy}
              theme={luxTheme}
            />
          )}
        </div>

        {/* Enhanced Search Modal */}
        {showSearchModal && (
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
            <div className="search-modal-container" style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: `1px solid ${luxTheme.primary}30`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: luxTheme.textPrimary,
                    fontSize: '20px',
                    fontFamily: 'Didot, serif'
                  }}>
                    🚨 Emergency Search
                  </h3>
                  <button 
                    onClick={() => setShowSearchModal(false)}
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

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Try: &apos;My child won&apos;t read anymore&apos; or &apos;reading battles&apos;"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      border: `2px solid ${luxTheme.primary}30`,
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '16px',
                      backgroundColor: luxTheme.background,
                      color: luxTheme.textPrimary,
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                    onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}30`}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{
                maxHeight: '400px',
                overflow: 'auto',
                padding: '20px'
              }}>
                {searchQuery && searchResults.length > 0 ? (
                  <div>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '12px'
                    }}>
                      Found {searchResults.length} strategies:
                    </h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {searchResults.map((result, index) => (
                        <div
                          key={`${result.strategyId}-${index}`}
                          style={{
                            backgroundColor: luxTheme.background,
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            border: `2px solid ${luxTheme.primary}30`,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleSearchResultClick(result)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = luxTheme.primary;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = `${luxTheme.primary}30`;
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ 
                            fontWeight: '600', 
                            marginBottom: '8px',
                            color: luxTheme.primary,
                            fontSize: '14px'
                          }}>
                            {result.title}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: luxTheme.textPrimary,
                            lineHeight: '1.5'
                          }}>
                            {result.content}
                          </div>
                          <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: luxTheme.textSecondary,
                            fontStyle: 'italic'
                          }}>
                            Click to view in context →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchQuery ? (
                  <div style={{ textAlign: 'center', color: luxTheme.textSecondary, padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <p>No strategies found for &quot;{searchQuery}&quot;</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      Try different keywords like &quot;won&apos;t read&quot;, &quot;battles&quot;, or &quot;pressure&quot;
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: luxTheme.textSecondary, padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
                    <p>Quick search through all your strategies</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      Type your situation to find immediate help
                    </p>
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
          
          @keyframes emergencyPulse {
            0% { box-shadow: 0 6px 30px rgba(220, 20, 60, 0.5); }
            50% { box-shadow: 0 8px 40px rgba(220, 20, 60, 0.8); }
            100% { box-shadow: 0 6px 30px rgba(220, 20, 60, 0.5); }
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
          
          /* Hide scrollbar for Chrome, Safari and Opera */
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </>
  );
}

// Daily Strategies Section Component
function DailyStrategiesSection({ parentDnaType, expandedSections, toggleSection, starredStrategies, triedStrategies, dismissedStrategies, toggleStar, toggleTried, dismissStrategy, theme, strategyRefs }) {
  if (!parentDnaType.dailyStrategies) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
        <p>Daily strategies not available for your DNA type.</p>
      </div>
    );
  }

  const categoryColors = {
    engagement: '#4CAF50',
    conflict: '#FF9800',
    celebration: '#9C27B0'
  };

  const categoryEmojis = {
    engagement: '💫',
    conflict: '⚡',
    celebration: '🎉'
  };

  const categoryTitles = {
    engagement: 'Daily Engagement',
    conflict: 'Navigating Conflicts',
    celebration: 'Celebration Moments'
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {Object.entries(parentDnaType.dailyStrategies).map(([category, strategies]) => {
        const sectionId = `daily-${category}`;
        const isExpanded = expandedSections[sectionId];
        
        return (
          <div
            key={category}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${categoryColors[category]}30`,
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => toggleSection(sectionId)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${categoryColors[category]}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {categoryEmojis[category]}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {categoryTitles[category]}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  {strategies.length} strategies available
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
                borderTop: `1px solid ${categoryColors[category]}30`
              }}>
                <div style={{ 
                  display: 'grid', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {strategies.map((strategy, index) => {
                    const strategyId = `${category}-${index}`;
                    const isStarred = starredStrategies.has(strategyId);
                    const isTried = triedStrategies.has(strategyId);
                    const isDismissed = dismissedStrategies.has(strategyId);
                    
                    if (isDismissed) return null;
                    
                    return (
                      <div
                        key={index}
                        ref={el => strategyRefs.current[strategyId] = el}
                        style={{
                          backgroundColor: `${categoryColors[category]}15`,
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '14px',
                          color: theme.textPrimary,
                          lineHeight: '1.5',
                          border: `1px solid ${categoryColors[category]}30`,
                          display: 'flex',
                          alignItems: 'start',
                          gap: '12px'
                        }}
                      >
                        {/* Left side - Star/Try buttons */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexShrink: 0
                        }}>
                          <button
                            onClick={() => toggleStar(strategyId)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontSize: '16px',
                              cursor: 'pointer',
                              color: isStarred ? '#FFD700' : theme.textSecondary,
                              padding: '2px'
                            }}
                            title="Star this strategy"
                          >
                            {isStarred ? '★' : '☆'}
                          </button>
                          <button
                            onClick={() => toggleTried(strategyId)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontSize: '14px',
                              cursor: 'pointer',
                              color: isTried ? categoryColors[category] : theme.textSecondary,
                              padding: '2px'
                            }}
                            title="Mark as tried"
                          >
                            {isTried ? '✓' : '○'}
                          </button>
                        </div>
                        
                        {/* Strategy content */}
                        <span style={{ flex: 1 }}>{strategy}</span>
                        
                        {/* Right side - Dismiss button */}
                        <button
                          onClick={() => dismissStrategy(strategyId)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: theme.textSecondary,
                            padding: '2px',
                            flexShrink: 0
                          }}
                          title="Dismiss this strategy"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Seasonal Strategies Section Component
function SeasonalStrategiesSection({ parentDnaType, expandedSections, toggleSection, starredStrategies, triedStrategies, dismissedStrategies, toggleStar, toggleTried, dismissStrategy, theme, strategyRefs }) {
  if (!parentDnaType.seasonalSupport) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗓️</div>
        <p>Seasonal support not available for your DNA type.</p>
      </div>
    );
  }

  const seasonColors = {
    backToSchool: '#FF6B6B',
    summer: '#FFD93D',
    holidays: '#6BCF7F',
    spring: '#FF69B4',
    winter: '#4ECDC4'
  };

  const seasonEmojis = {
    backToSchool: '🎒',
    summer: '☀️',
    holidays: '🎄',
    spring: '🌸',
    winter: '❄️'
  };

  const seasonTitles = {
    backToSchool: 'Back to School',
    summer: 'Summer Reading',
    holidays: 'Holiday Season',
    spring: 'Spring Renewal',
    winter: 'Winter Challenges'
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {Object.entries(parentDnaType.seasonalSupport).map(([season, support]) => {
        const sectionId = `seasonal-${season}`;
        const isExpanded = expandedSections[sectionId];
        const seasonColor = seasonColors[season] || theme.primary;
        
        return (
          <div
            key={season}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${seasonColor}30`,
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => toggleSection(sectionId)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${seasonColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {seasonEmojis[season] || '📅'}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {seasonTitles[season] || season}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  {support.strategies?.length || 0} strategies available
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
                borderTop: `1px solid ${seasonColor}30`
              }}>
                {support.challenge && (
                  <div style={{
                    backgroundColor: `${seasonColor}15`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '16px',
                    marginBottom: '16px',
                    border: `1px solid ${seasonColor}30`
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: seasonColor,
                      marginBottom: '8px'
                    }}>
                      🎯 Challenge
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.textPrimary,
                      lineHeight: '1.5'
                    }}>
                      {support.challenge}
                    </div>
                  </div>
                )}

                {support.strategies && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {support.strategies.map((strategy, index) => {
                      const strategyId = `${season}-${index}`;
                      const isStarred = starredStrategies.has(strategyId);
                      const isTried = triedStrategies.has(strategyId);
                      const isDismissed = dismissedStrategies.has(strategyId);
                      
                      if (isDismissed) return null;
                      
                      return (
                        <div
                          key={index}
                          ref={el => strategyRefs.current[strategyId] = el}
                          style={{
                            backgroundColor: `${seasonColor}10`,
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '14px',
                            color: theme.textPrimary,
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'start',
                            gap: '8px',
                            border: `1px solid ${seasonColor}20`
                          }}
                        >
                          {/* Left side - Star/Try buttons */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}>
                            <button
                              onClick={() => toggleStar(strategyId)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: '16px',
                                cursor: 'pointer',
                                color: isStarred ? '#FFD700' : theme.textSecondary,
                                padding: '2px'
                              }}
                              title="Star this strategy"
                            >
                              {isStarred ? '★' : '☆'}
                            </button>
                            <button
                              onClick={() => toggleTried(strategyId)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: '14px',
                                cursor: 'pointer',
                                color: isTried ? seasonColor : theme.textSecondary,
                                padding: '2px'
                              }}
                              title="Mark as tried"
                            >
                              {isTried ? '✓' : '○'}
                            </button>
                          </div>
                          
                          {/* Strategy content */}
                          <span style={{ flex: 1 }}>{strategy}</span>
                          
                          {/* Right side - Dismiss button */}
                          <button
                            onClick={() => dismissStrategy(strategyId)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontSize: '14px',
                              cursor: 'pointer',
                              color: theme.textSecondary,
                              padding: '2px',
                              flexShrink: 0
                            }}
                            title="Dismiss this strategy"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Emergency Section Component
function EmergencySection({ parentDnaType, expandedSections, toggleSection, starredStrategies, triedStrategies, dismissedStrategies, toggleStar, toggleTried, dismissStrategy, theme, strategyRefs }) {
  if (!parentDnaType.problemsToolkit) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
        <p>Emergency toolkit not available for your DNA type.</p>
      </div>
    );
  }

  // Get ALL available scenarios from Firebase data
  const emergencyScenarios = [
    { id: 'reluctantReader', title: 'Child Refuses to Read', emoji: '😤' },
    { id: 'powerStruggles', title: 'Reading Power Struggles', emoji: '⚔️' },
    { id: 'achievementPressure', title: 'Too Much Pressure', emoji: '📊' },
    { id: 'bookChoiceStruggles', title: 'Book Choice Struggles', emoji: '📖' },
    { id: 'differentLearningSpeeds', title: 'Different Learning Speeds', emoji: '🐌' },
    { id: 'readingHabitBuilding', title: 'Reading Habit Building', emoji: '🏗️' }
  ];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {emergencyScenarios.map((scenarioMeta) => {
        const scenario = parentDnaType.problemsToolkit[scenarioMeta.id];
        if (!scenario) {
          console.log(`❌ Missing scenario: ${scenarioMeta.id}`);
          return null;
        }

        const sectionId = `emergency-${scenarioMeta.id}`;
        const isExpanded = expandedSections[sectionId];
        
        return (
          <div
            key={scenarioMeta.id}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #DC143C30',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => toggleSection(sectionId)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FFE4E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {scenarioMeta.emoji}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {scenarioMeta.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  {scenario.yourInstinct?.substring(0, 60) || 'Crisis management strategies'}...
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
                borderTop: '1px solid #DC143C30'
              }}>
                <ScenarioDetails 
                  scenario={scenario} 
                  scenarioId={scenarioMeta.id}
                  starredStrategies={starredStrategies}
                  triedStrategies={triedStrategies}
                  dismissedStrategies={dismissedStrategies}
                  toggleStar={toggleStar}
                  toggleTried={toggleTried}
                  dismissStrategy={dismissStrategy}
                  theme={theme}
                  strategyRefs={strategyRefs}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// My Strategies Section Component (formerly My Toolkit)
function MyStrategiesSection({ parentDnaType, starredStrategies, triedStrategies, dismissedStrategies, toggleStar, restoreStrategy, theme }) {
  const starredItems = Array.from(starredStrategies);
  const triedItems = Array.from(triedStrategies);
  const dismissedItems = Array.from(dismissedStrategies);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Starred Strategies */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⭐</span> Starred Strategies ({starredItems.length})
        </h3>
        
        {starredItems.length === 0 ? (
          <p style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
            No starred strategies yet. Star your favorites from Daily, Seasonal, or Emergency sections!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {starredItems.map((strategyId) => (
              <div
                key={strategyId}
                style={{
                  backgroundColor: '#FFF9C4',
                  border: '2px solid #FFD700',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '16px' }}>⭐</span>
                <span style={{ flex: 1, fontSize: '14px' }}>
                  {strategyId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <button
                  onClick={() => toggleStar(strategyId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tried Strategies */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span> Tried Strategies ({triedItems.length})
        </h3>
        
        {triedItems.length === 0 ? (
          <p style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
            No tried strategies yet. Mark strategies you&apos;ve tested!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {triedItems.map((strategyId) => (
              <div
                key={strategyId}
                style={{
                  backgroundColor: '#E8F5E8',
                  border: '1px solid #4CAF50',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '16px', color: '#4CAF50' }}>✓</span>
                <span style={{ flex: 1, fontSize: '14px' }}>
                  {strategyId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dismissed Strategies */}
      {dismissedItems.length > 0 && (
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📦</span> Dismissed Strategies ({dismissedItems.length})
          </h3>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            {dismissedItems.map((strategyId) => (
              <div
                key={strategyId}
                style={{
                  backgroundColor: '#F5F5F5',
                  border: '1px solid #CCC',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.7
                }}
              >
                <span style={{ fontSize: '16px' }}>📦</span>
                <span style={{ flex: 1, fontSize: '14px' }}>
                  {strategyId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <button
                  onClick={() => restoreStrategy(strategyId)}
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.textPrimary,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Scenario Details Component
function ScenarioDetails({ scenario, scenarioId, starredStrategies, triedStrategies, dismissedStrategies, toggleStar, toggleTried, dismissStrategy, theme, strategyRefs }) {
  return (
    <div style={{ marginTop: '20px' }}>
      {/* Your Instinct */}
      {scenario.yourInstinct && (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🎯</span> Your Instinct
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.yourInstinct}
          </div>
        </div>
      )}

      {/* Your Approach */}
      {scenario.yourApproach && (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🎯</span> Your Approach
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.yourApproach}
          </div>
        </div>
      )}

      {/* Your Philosophy */}
      {scenario.yourPhilosophy && (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>💭</span> Your Philosophy
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.yourPhilosophy}
          </div>
        </div>
      )}

      {/* Prevention */}
      {scenario.prevention && (
        <div 
          ref={el => strategyRefs.current[`${scenarioId}-prevention`] = el}
          style={{
            backgroundColor: '#FFF3CD',
            border: '2px solid #FFE69C',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexShrink: 0
          }}>
            <button
              onClick={() => toggleStar(`${scenarioId}-prevention`)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: starredStrategies.has(`${scenarioId}-prevention`) ? '#FFD700' : '#664D03',
                padding: '2px'
              }}
            >
              {starredStrategies.has(`${scenarioId}-prevention`) ? '★' : '☆'}
            </button>
            <button
              onClick={() => toggleTried(`${scenarioId}-prevention`)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                color: triedStrategies.has(`${scenarioId}-prevention`) ? '#FF9800' : '#664D03',
                padding: '2px'
              }}
            >
              {triedStrategies.has(`${scenarioId}-prevention`) ? '✓' : '○'}
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#664D03',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🛡️</span> Prevention
            </div>
            <div style={{
              fontSize: '14px',
              color: '#664D03',
              lineHeight: '1.5'
            }}>
              {scenario.prevention}
            </div>
          </div>
          
          <button
            onClick={() => dismissStrategy(`${scenarioId}-prevention`)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#664D03',
              padding: '2px',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Scripts Section - Larger and better paired */}
      {scenario.scripts && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💬</span> What to Say vs. What NOT to Say
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '12px'
          }}>
            {/* Do Say - Larger */}
            {scenario.scripts.doSay && (
              <div style={{
                backgroundColor: '#E8F5E8',
                borderRadius: '16px',
                padding: '20px',
                border: '3px solid #4CAF50'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2E7D32',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✅</span> DO Say
                </div>
                {scenario.scripts.doSay.map((script, index) => (
                  <div
                    key={index}
                    ref={el => strategyRefs.current[`${scenarioId}-doSay-${index}`] = el}
                    style={{
                      fontSize: '15px',
                      color: '#2E7D32',
                      marginBottom: '12px',
                      paddingLeft: '20px',
                      position: 'relative',
                      lineHeight: '1.5',
                      fontStyle: 'italic',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: '#4CAF50',
                      fontSize: '16px'
                    }}>•</span>
                    &quot;{script}&quot;
                  </div>
                ))}
              </div>
            )}

            {/* Don't Say - Larger */}
            {scenario.scripts.dontSay && (
              <div style={{
                backgroundColor: '#FFE4E1',
                borderRadius: '16px',
                padding: '20px',
                border: '3px solid #F44336'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#C62828',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>❌</span> DON&apos;T Say
                </div>
                {scenario.scripts.dontSay.map((script, index) => (
                  <div
                    key={index}
                    ref={el => strategyRefs.current[`${scenarioId}-dontSay-${index}`] = el}
                    style={{
                      fontSize: '15px',
                      color: '#C62828',
                      marginBottom: '12px',
                      paddingLeft: '20px',
                      position: 'relative',
                      lineHeight: '1.5',
                      fontStyle: 'italic',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: '#F44336',
                      fontSize: '16px'
                    }}>•</span>
                    &quot;{script}&quot;
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gentle Approaches */}
      {scenario.gentleApproaches && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🌟</span> Gentle Approaches
          </h4>
          
          {scenario.gentleApproaches.map((approach, index) => {
            const approachId = `${scenarioId}-approach-${index}`;
            const isStarred = starredStrategies.has(approachId);
            const isTried = triedStrategies.has(approachId);
            const isDismissed = dismissedStrategies.has(approachId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[approachId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                {/* Left side - Star/Try buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(approachId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(approachId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{approach}</span>
                
                <button
                  onClick={() => dismissStrategy(approachId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Practical Tips */}
      {scenario.practicalTips && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡</span> Practical Tips
          </h4>
          
          {scenario.practicalTips.map((tip, index) => {
            const tipId = `${scenarioId}-tip-${index}`;
            const isStarred = starredStrategies.has(tipId);
            const isTried = triedStrategies.has(tipId);
            const isDismissed = dismissedStrategies.has(tipId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[tipId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(tipId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(tipId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{tip}</span>
                
                <button
                  onClick={() => dismissStrategy(tipId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Why This Works */}
      {scenario.whyThisWorks && (
        <div style={{
          backgroundColor: `${theme.secondary}20`,
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>💡</span> Why This Works
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.whyThisWorks}
          </div>
        </div>
      )}

      {/* When to Worry */}
      {scenario.whenToWorry && (
        <div style={{
          backgroundColor: '#FFE4E1',
          border: '2px solid #F44336',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#C62828',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>⚠️</span> When to Seek Additional Support
          </div>
          <div style={{
            fontSize: '14px',
            color: '#C62828',
            lineHeight: '1.5'
          }}>
            {scenario.whenToWorry}
          </div>
        </div>
      )}
    </div>
  );
}
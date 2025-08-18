// pages/parent/dna-lab/reading-toolkit.js - Simplified with starring only
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// Import tab components
import DailyStrategiesTab from '../../../components/parent/readingtoolkit/DailyStrategiesTab';
import SeasonalStrategiesTab from '../../../components/parent/readingtoolkit/SeasonalStrategiesTab';
import EmergencyTab from '../../../components/parent/readingtoolkit/EmergencyTab';

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
  
  // Simplified - only starred strategies
  const [starredStrategies, setStarredStrategies] = useState(new Set());
  const [savingState, setSavingState] = useState(false);
  
  // Refs
  const strategyRefs = useRef({});
  const unsubscribers = useRef([]);
  
  // Calculate starred counts per tab
  const starredCounts = useMemo(() => {
    const counts = {
      daily: 0,
      seasonal: 0,
      emergency: 0
    };
    
    starredStrategies.forEach(strategyId => {
      // Parse the strategy ID to determine its type
      const parts = strategyId.split('-');
      
      // Daily strategies: category-index (e.g., "engagement-0", "conflict-1", "celebration-2")
      if (parts[0] === 'engagement' || parts[0] === 'conflict' || parts[0] === 'celebration') {
        counts.daily++;
      }
      // Seasonal strategies: season-index (e.g., "summer-0", "winter-1")
      else if (parts[0] === 'backToSchool' || parts[0] === 'summer' || 
               parts[0] === 'holidays' || parts[0] === 'spring' || 
               parts[0] === 'winter') {
        counts.seasonal++;
      }
      // Emergency strategies: scenarioId-type-index (e.g., "reluctantReader-prevention", "powerStruggles-approach-0")
      else if (parts[0] === 'reluctantReader' || parts[0] === 'powerStruggles' || 
               parts[0] === 'achievementPressure' || parts[0] === 'bookChoiceStruggles' || 
               parts[0] === 'differentLearningSpeeds' || parts[0] === 'readingHabitBuilding') {
        counts.emergency++;
      }
    });
    
    return counts;
  }, [starredStrategies]);

  // Get time-based theme
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

  // Lux Libris Theme
  const luxTheme = useMemo(() => {
    const isNight = timeTheme.name === 'night';
    return {
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: timeTheme.backgroundGradient,
      surface: isNight ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
      textPrimary: isNight ? '#1F2937' : '#223848',
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

  // Load strategies from Firebase
  const loadUserStrategies = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      // Load starred strategies
      const starredRef = collection(db, 'parents', user.uid, 'starredStrategies');
      const starredSnapshot = await getDocs(starredRef);
      const starredSet = new Set();
      starredSnapshot.forEach(doc => {
        starredSet.add(doc.id);
      });
      setStarredStrategies(starredSet);
      
      console.log('✅ Loaded starred strategies:', starredSet.size);
    } catch (error) {
      console.error('Error loading user strategies:', error);
    }
  }, [user]);

  // Set up real-time listeners for strategy collections
  const setupStrategyListeners = useCallback(() => {
    if (!user?.uid) return;
    
    // Clear previous listeners
    unsubscribers.current.forEach(unsub => unsub());
    unsubscribers.current = [];
    
    // Listen to starred strategies
    const starredRef = collection(db, 'parents', user.uid, 'starredStrategies');
    const starredUnsub = onSnapshot(starredRef, (snapshot) => {
      const newStarred = new Set();
      snapshot.forEach(doc => {
        newStarred.add(doc.id);
      });
      setStarredStrategies(newStarred);
    });
    unsubscribers.current.push(starredUnsub);
  }, [user]);

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
      
      // Load user's saved strategies
      await loadUserStrategies();
      
      // Set up real-time listeners
      setupStrategyListeners();
      
    } catch (error) {
      setError('Failed to load your toolkit. Please try again.');
    }
    
    setLoading(false);
  }, [user, router, loadUserStrategies, setupStrategyListeners]);

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

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      unsubscribers.current.forEach(unsub => unsub());
    };
  }, []);

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

  // Simplified - only toggle star
  const toggleStar = async (strategyId) => {
    if (!user?.uid) return;
    
    setSavingState(true);
    try {
      const docRef = doc(db, 'parents', user.uid, 'starredStrategies', strategyId);
      
      if (starredStrategies.has(strategyId)) {
        await deleteDoc(docRef);
        console.log('✅ Removed star:', strategyId);
      } else {
        await setDoc(docRef, {
          strategyId,
          addedAt: new Date(),
          parentDnaType: parentDnaType?.id || 'unknown'
        });
        console.log('✅ Added star:', strategyId);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
    setSavingState(false);
  };

  // Navigation handlers
  const handleDnaNavigation = (option) => {
    if (option.current) return;
    setShowDnaDropdown(false);
    router.push(option.path);
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/parent/dna-lab');
  };

  // Section toggle
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Search functionality
  const searchStrategies = useCallback((query) => {
    if (!query || !parentDnaType) return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    const results = [];
    
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

    // Search in emergency toolkit
    if (parentDnaType.problemsToolkit) {
      Object.entries(parentDnaType.problemsToolkit).forEach(([key, scenario]) => {
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
                title: `${key.replace(/([A-Z])/g, ' $1').trim()} - DON'T Say`,
                content: `"${script}"`,
                matchScore
              });
            }
          });
        }
      });
    }
    
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [parentDnaType]);

  const searchResults = useMemo(() => {
    return searchStrategies(searchQuery);
  }, [searchQuery, searchStrategies]);

  const handleSearchResultClick = (result) => {
    setActiveTab(result.type);
    setExpandedSections(prev => ({
      ...prev,
      [result.id]: true
    }));
    setShowSearchModal(false);
    setSearchQuery('');
    
    setTimeout(() => {
      const element = strategyRefs.current[result.strategyId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: luxTheme.timeOverlay,
          pointerEvents: 'none'
        }} />
        
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
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
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
          pointerEvents: 'none'
        }} />
        
        {/* Header with DNA Lab Dropdown */}
        <div style={{
          background: timeTheme.gradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          borderRadius: '0 0 25px 25px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 40px ${luxTheme.timeGlow}30`,
          zIndex: 1000
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
                fontWeight: '500'
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
                zIndex: 1001
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
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{option.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                        {option.name}
                      </div>
                      <div style={{ fontSize: '11px', color: luxTheme.textSecondary, opacity: 0.8 }}>
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
                zIndex: 1001
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
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Spacer for fixed header */}
        <div style={{ height: '80px' }} />

        {/* Main Content */}
        <div style={{ 
          padding: '20px', 
          maxWidth: '800px', 
          margin: '0 auto'
        }}>
          
          {/* Toolkit Header */}
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
            <div>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧰</div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                fontFamily: 'Didot, serif'
              }}>
                Your Reading Toolkit
              </h1>
              <p style={{
                fontSize: '18px',
                margin: '0',
                opacity: 0.95,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                Personalized strategies for your {parentDnaType.name} style
              </p>
            </div>
          </div>

          {/* Emergency Button */}
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
                animation: 'emergencyPulse 1.5s infinite'
              }}
              title="Reading Emergency Search"
            >
              🚨
            </button>
          </div>

          {/* Saving Indicator */}
          {savingState && (
            <div style={{
              position: 'fixed',
              top: '100px',
              right: '20px',
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 999,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Saving...
            </div>
          )}

          {/* Tab Navigation - With badges showing starred count per tab */}
          <div style={{
            display: 'flex',
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '6px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            gap: '4px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'daily', label: 'Daily', icon: '📖', count: starredCounts.daily },
              { id: 'seasonal', label: 'Seasonal', icon: '🗓️', count: starredCounts.seasonal },
              { id: 'emergency', label: 'Emergency', icon: '🚨', count: starredCounts.emergency }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? luxTheme.primary : 'transparent',
                  color: activeTab === tab.id ? luxTheme.textPrimary : luxTheme.textSecondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span style={{
                    backgroundColor: '#FFD700',
                    color: '#000',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    minWidth: '18px',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ paddingBottom: '100px' }}>
            {activeTab === 'daily' && (
              <DailyStrategiesTab
                parentDnaType={parentDnaType}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                starredStrategies={starredStrategies}
                toggleStar={toggleStar}
                theme={luxTheme}
                strategyRefs={strategyRefs}
              />
            )}

            {activeTab === 'seasonal' && (
              <SeasonalStrategiesTab
                parentDnaType={parentDnaType}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                starredStrategies={starredStrategies}
                toggleStar={toggleStar}
                theme={luxTheme}
                strategyRefs={strategyRefs}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencyTab
                parentDnaType={parentDnaType}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                starredStrategies={starredStrategies}
                toggleStar={toggleStar}
                theme={luxTheme}
                strategyRefs={strategyRefs}
              />
            )}
          </div>
        </div>

        {/* Search Modal - Same as before */}
        {showSearchModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 2000,
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
                    placeholder="Try: 'My child won't read anymore' or 'reading battles'"
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
        `}</style>
      </div>
    </>
  );
}
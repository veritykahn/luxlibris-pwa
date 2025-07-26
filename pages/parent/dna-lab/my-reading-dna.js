// pages/parent/dna-lab/my-reading-dna.js - Parent's Full DNA Profile
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function MyReadingDna() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Parent DNA states
  const [parentData, setParentData] = useState(null);
  const [parentDnaType, setParentDnaType] = useState(null);
  const [parentDnaTypes, setParentDnaTypes] = useState({});
  
  // UI states
  const [expandedSections, setExpandedSections] = useState({
    psychology: false,
    identity: false,
    strengths: false,
    growth: false,
    research: false,
    behaviors: false
  });
  const [confirmedInsights, setConfirmedInsights] = useState({});
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  
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
    { name: 'Dashboard', path: '/parent/dna-lab', icon: '🏠', description: 'Command center' },
    { name: 'My Reading DNA', path: '/parent/dna-lab/my-reading-dna', icon: '🧬', description: 'Your profile', current: true },
    { name: 'My Reading Toolkit', path: '/parent/dna-lab/reading-toolkit', icon: '📚', description: 'Strategies' },
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

  // Handle back navigation
  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/parent/dna-lab');
  };

  // Load parent DNA data
  const loadParentDnaData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🧬 Loading parent DNA profile...');
      
      // Load parent data
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (!parentDoc.exists() || !parentDoc.data().parentDNA) {
        console.log('❌ No DNA assessment found');
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
      
      console.log('✅ Loaded parent DNA profile:', data.parentDNA.type);
      
    } catch (error) {
      console.error('❌ Error loading parent DNA:', error);
      setError('Failed to load your DNA profile. Please try again.');
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

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Confirm insight
  const confirmInsight = (insightId) => {
    setConfirmedInsights(prev => ({
      ...prev,
      [insightId]: !prev[insightId]
    }));
  };

  // Calculate days since assessment
  const daysSinceAssessment = useMemo(() => {
    if (!parentData?.parentDNA?.completedAt) return null;
    const assessmentDate = parentData.parentDNA.completedAt.toDate();
    return Math.floor((new Date() - assessmentDate) / (1000 * 60 * 60 * 24));
  }, [parentData]);

  // Navigate to DNA pages
  const handleDnaNavigation = (option) => {
    if (option.current) return;
    setShowDnaDropdown(false);
    router.push(option.path);
  };

  // Show loading
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
          <p style={{ color: luxTheme.textPrimary }}>Loading your Reading DNA profile...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (error || !parentDnaType) {
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
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>
            {error || 'Unable to load your DNA profile'}
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
        <title>My Reading DNA - Lux Libris</title>
        <meta name="description" content="Discover deep insights about your parenting style and reading support approach" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header with DNA Lab Dropdown */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 10000
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
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>My Reading DNA</span>
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
        <div style={{ padding: '40px 20px 20px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* DNA Type Hero Section */}
          <div style={{
            backgroundColor: parentDnaType.color || luxTheme.primary,
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
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
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: (() => {
                  // Calculate complementary color
                  const color = parentDnaType.color || luxTheme.primary;
                  // Simple complementary color calculation
                  const hex = color.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  // Convert to HSL and rotate hue by 180 degrees for complementary
                  const max = Math.max(r, g, b) / 255;
                  const min = Math.min(r, g, b) / 255;
                  let h, s, l = (max + min) / 2;
                  
                  if (max === min) {
                    h = s = 0;
                  } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                      case r/255: h = ((g/255 - b/255) / d + (g < b ? 6 : 0)) / 6; break;
                      case g/255: h = ((b/255 - r/255) / d + 2) / 6; break;
                      case b/255: h = ((r/255 - g/255) / d + 4) / 6; break;
                    }
                  }
                  
                  // Rotate hue by 180 degrees
                  h = (h + 0.5) % 1;
                  
                  // Convert back to RGB
                  let r1, g1, b1;
                  if (s === 0) {
                    r1 = g1 = b1 = l;
                  } else {
                    const hue2rgb = (p, q, t) => {
                      if (t < 0) t += 1;
                      if (t > 1) t -= 1;
                      if (t < 1/6) return p + (q - p) * 6 * t;
                      if (t < 1/2) return q;
                      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                      return p;
                    };
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;
                    r1 = hue2rgb(p, q, h + 1/3);
                    g1 = hue2rgb(p, q, h);
                    b1 = hue2rgb(p, q, h - 1/3);
                  }
                  
                  return `rgba(${Math.round(r1 * 255)}, ${Math.round(g1 * 255)}, ${Math.round(b1 * 255)}, 0.3)`;
                })(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                <div style={{
                  fontSize: '64px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}>
                  {parentDnaType.emoji || '🌟'}
                </div>
              </div>
              
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                fontFamily: 'Didot, serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                You are {(() => {
                  const firstLetter = parentDnaType.name.charAt(0).toLowerCase();
                  const article = ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
                  return `${article} ${parentDnaType.name}`;
                })()}!
              </h1>
              
              <p style={{
                fontSize: '18px',
                margin: '0 0 24px 0',
                opacity: 0.95,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.5'
              }}>
                {parentDnaType.quickDescription}
              </p>
              
              {/* Centered Retake Link */}
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => router.push('/parent/dna-lab/assessment')}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                    border: 'none',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>↻</span>
                  <span>Retake assessment</span>
                </button>
              </div>
            </div>
          </div>

          {/* Core Philosophy Card */}
          {parentDnaType.psychologicalCore?.unconsciousDrive && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${parentDnaType.color}30`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: parentDnaType.color || luxTheme.primary,
                marginBottom: '12px'
              }}>
                YOUR CORE BELIEF
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '500',
                color: luxTheme.textPrimary,
                lineHeight: '1.5',
                fontStyle: 'italic'
              }}>
                {parentDnaType.psychologicalCore.unconsciousDrive}
              </div>
            </div>
          )}

          {/* Psychology Insights Section */}
          <InsightSection
            title="Psychology Insights"
            emoji="🧠"
            description="Wow, I didn't know this about me!"
            isExpanded={expandedSections.psychology}
            onToggle={() => toggleSection('psychology')}
            theme={luxTheme}
            color={parentDnaType.color}
          >
            {parentDnaType.psychologicalCore && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px'
                }}>
                  Your Unconscious Drives
                </h4>
                <div style={{
                  backgroundColor: `${luxTheme.primary}10`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {parentDnaType.psychologicalCore.unconsciousDrive}
                  </p>
                </div>
                
                <button
                  onClick={() => confirmInsight('unconscious')}
                  style={{
                    backgroundColor: confirmedInsights.unconscious ? parentDnaType.color : 'transparent',
                    color: confirmedInsights.unconscious ? 'white' : parentDnaType.color,
                    border: `1px solid ${parentDnaType.color}`,
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    margin: '0 auto'
                  }}
                >
                  {confirmedInsights.unconscious ? '✓' : '○'} Yes, this sounds like me!
                </button>
              </div>
            )}

            {parentDnaType.psychologicalCore?.dailyBehaviors && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px'
                }}>
                  How This Shows Up Daily
                </h4>
                {parentDnaType.psychologicalCore.dailyBehaviors.map((behavior, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: `${luxTheme.secondary}20`,
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.5',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '8px'
                    }}
                  >
                    <span style={{ color: parentDnaType.color, flexShrink: 0 }}>▸</span>
                    <span>{behavior}</span>
                  </div>
                ))}
              </div>
            )}

            {parentDnaType.psychologicalCore?.stressResponse && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px'
                }}>
                  Under Stress, You...
                </h4>
                <div style={{
                  backgroundColor: '#FFF3CD',
                  border: '1px solid #FFE69C',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  color: '#664D03',
                  lineHeight: '1.6'
                }}>
                  {parentDnaType.psychologicalCore.stressResponse}
                </div>
              </div>
            )}
            
            {parentDnaType.psychologicalCore?.childExperience && (
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px'
                }}>
                  How Your Children Experience You
                </h4>
                <div style={{
                  backgroundColor: `${luxTheme.accent}20`,
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.6'
                }}>
                  {parentDnaType.psychologicalCore.childExperience}
                </div>
              </div>
            )}
          </InsightSection>

          {/* Strengths Section */}
          <InsightSection
            title="Your Superpowers"
            emoji="💪"
            description="What you naturally do well"
            isExpanded={expandedSections.strengths}
            onToggle={() => toggleSection('strengths')}
            theme={luxTheme}
            color={parentDnaType.color}
          >
            {parentDnaType.strengths?.map((strength, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: luxTheme.surface,
                  border: `2px solid ${parentDnaType.color}30`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  animation: expandedSections.strengths ? `slideIn ${0.3 + index * 0.1}s ease-out` : 'none',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}
              >
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: `${parentDnaType.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  ⭐
                </span>
                <p style={{
                  fontSize: '14px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {strength}
                </p>
              </div>
            ))}
          </InsightSection>

          {/* Growth Edges Section */}
          <InsightSection
            title="Growth Opportunities"
            emoji="🌱"
            description="Areas to explore and develop"
            isExpanded={expandedSections.growth}
            onToggle={() => toggleSection('growth')}
            theme={luxTheme}
            color={parentDnaType.color}
          >
            {parentDnaType.growthEdges?.areas?.map((edge, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  {edge.challenge}
                </div>
                <p style={{
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  {edge.insight}
                </p>
                
                {edge.growthAction && (
                  <div style={{
                    backgroundColor: `${parentDnaType.color}10`,
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    color: luxTheme.textPrimary
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: parentDnaType.color,
                      marginBottom: '4px',
                      fontSize: '12px'
                    }}>
                      Try This:
                    </div>
                    {edge.growthAction}
                  </div>
                )}
              </div>
            ))}
          </InsightSection>

          {/* Research Validation Section */}
          <InsightSection
            title="Research That Validates You"
            emoji="🔬"
            description="Evidence-based confidence builders"
            isExpanded={expandedSections.research}
            onToggle={() => toggleSection('research')}
            theme={luxTheme}
            color={parentDnaType.color}
          >
            {parentDnaType.researchFoundation && (
              <div style={{
                backgroundColor: `${luxTheme.accent}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '14px',
                color: luxTheme.textPrimary,
                lineHeight: '1.6'
              }}>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  📊 Research Foundation: {parentDnaType.researchFoundation.coreTheory}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Key Finding:</strong> {parentDnaType.researchFoundation.keyFinding}
                </div>
                <div>
                  <strong>Application:</strong> {parentDnaType.researchFoundation.application}
                </div>
              </div>
            )}

            {parentDnaType.confidenceBuilders?.map((builder, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: luxTheme.surface,
                  border: `1px solid ${luxTheme.primary}30`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.6'
                }}
              >
                {builder}
              </div>
            ))}
          </InsightSection>

          {/* Daily Strategies Section */}
          <InsightSection
            title="Your Daily Playbook"
            emoji="📖"
            description="Practical strategies for everyday situations"
            isExpanded={expandedSections.behaviors}
            onToggle={() => toggleSection('behaviors')}
            theme={luxTheme}
            color={parentDnaType.color}
          >
            {parentDnaType.dailyStrategies && (
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {Object.entries(parentDnaType.dailyStrategies).map(([category, strategies]) => (
                  <div
                    key={category}
                    style={{
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: parentDnaType.color,
                      marginBottom: '10px',
                      textTransform: 'capitalize'
                    }}>
                      {category === 'celebration' ? '🎉 Celebration Moments' :
                       category === 'conflict' ? '⚡ Navigating Conflicts' :
                       category === 'engagement' ? '💫 Daily Engagement' : category}
                    </div>
                    {strategies.map((strategy, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: '13px',
                          color: luxTheme.textPrimary,
                          marginBottom: '6px',
                          paddingLeft: '16px',
                          position: 'relative',
                          lineHeight: '1.5'
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: parentDnaType.color
                        }}>•</span>
                        {strategy}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </InsightSection>

          {/* Reflection Prompts Section */}
          {parentDnaType.reflectionPrompts && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '24px',
              marginTop: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${parentDnaType.color}20`
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💭</span> This Week&apos;s Reflection Questions
              </div>
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {parentDnaType.reflectionPrompts.slice(0, 3).map((prompt, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.5',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '8px'
                    }}
                  >
                    <span style={{ color: parentDnaType.color, flexShrink: 0 }}>•</span>
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '16px',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => router.push('/parent/dna-lab/reflection-growth')}
                  style={{
                    backgroundColor: 'transparent',
                    color: parentDnaType.color,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  See all reflection prompts →
                </button>
              </div>
            </div>
          )}

          {/* Bottom Retake Note */}
          {daysSinceAssessment !== null && daysSinceAssessment > 300 && (
            <div style={{
              textAlign: 'center',
              marginTop: '32px',
              fontSize: '12px',
              color: luxTheme.textSecondary
            }}>
              <button
                onClick={() => router.push('/parent/dna-lab/assessment')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: luxTheme.primary,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>↻</span>
                <span>Been a while? Consider retaking the assessment to see how you&apos;ve grown</span>
              </button>
            </div>
          )}
        </div>

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

// Insight Section Component
function InsightSection({ title, emoji, description, isExpanded, onToggle, theme, color, children }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: `2px solid ${color}20`
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
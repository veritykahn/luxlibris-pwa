// pages/parent/dna-lab/reflection-growth.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ReflectionGrowth() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [parentData, setParentData] = useState(null);
  const [parentDnaType, setParentDnaType] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [readingGoals, setReadingGoals] = useState([]);
  const [readingWins, setReadingWins] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('reflect'); // 'reflect', 'journal', 'goals', 'wins'
  const [showDnaDropdown, setShowDnaDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryType, setEntryType] = useState(''); // 'journal', 'goal', 'win'
  const [entryContent, setEntryContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState({});
  
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
    { name: 'My Reading DNA', path: '/parent/dna-lab/my-reading-dna', icon: '🧬', description: 'Your profile' },
    { name: 'My Reading Toolkit', path: '/parent/dna-lab/reading-toolkit', icon: '📚', description: 'Strategies' },
    { name: "My Kids' Library", path: '/parent/dna-lab/kids-library', icon: '👨‍👩‍👧‍👦', description: 'Child profiles' },
    { name: 'Family Dynamics', path: '/parent/dna-lab/family-dynamics', icon: '🤝', description: 'Compatibility' },
    { name: 'Science Center', path: '/parent/dna-lab/science-center', icon: '🧪', description: 'Research' },
    { name: 'Reflection & Growth', path: '/parent/dna-lab/reflection-growth', icon: '🌱', description: 'Track journey', current: true }
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

  // Get current week's reflection prompts
  const getCurrentPrompts = useCallback(() => {
    if (!parentDnaType?.reflectionPrompts || !Array.isArray(parentDnaType.reflectionPrompts)) {
      return [];
    }
    
    // Rotate through prompts based on week of year
    const weekOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    const promptsPerWeek = 3;
    const totalPrompts = parentDnaType.reflectionPrompts.length;
    
    if (totalPrompts === 0) return [];
    
    const startIndex = (weekOfYear * promptsPerWeek) % totalPrompts;
    const endIndex = Math.min(startIndex + promptsPerWeek, totalPrompts);
    
    // Handle wrap-around if we're at the end of the array
    if (endIndex > totalPrompts) {
      return [
        ...parentDnaType.reflectionPrompts.slice(startIndex),
        ...parentDnaType.reflectionPrompts.slice(0, endIndex - totalPrompts)
      ];
    }
    
    return parentDnaType.reflectionPrompts.slice(startIndex, endIndex);
  }, [parentDnaType]);

  // Load all necessary data
  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🌱 Loading Reflection & Growth data...');
      
      // Load parent data and type
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (!parentDoc.exists() || !parentDoc.data().parentDNA) {
        router.push('/parent/dna-lab');
        return;
      }
      
      const parentInfo = parentDoc.data();
      setParentData(parentInfo);
      
      // Load parent DNA type
      const typeRef = doc(db, 'parent-dna-types', parentInfo.parentDNA.type);
      const typeDoc = await getDoc(typeRef);
      if (typeDoc.exists()) {
        setParentDnaType(typeDoc.data());
      }
      
      // Load journal entries
      const journalRef = collection(db, `users/${user.uid}/reading-journal`);
      const journalQuery = query(journalRef, orderBy('createdAt', 'desc'), limit(50));
      const journalSnapshot = await getDocs(journalQuery);
      const entries = [];
      journalSnapshot.forEach(doc => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      setJournalEntries(entries);
      
      // Load reading goals
      const goalsRef = collection(db, `users/${user.uid}/reading-goals`);
      const goalsQuery = query(goalsRef, orderBy('createdAt', 'desc'));
      const goalsSnapshot = await getDocs(goalsQuery);
      const goals = [];
      goalsSnapshot.forEach(doc => {
        goals.push({ id: doc.id, ...doc.data() });
      });
      setReadingGoals(goals);
      
      // Load reading wins
      const winsRef = collection(db, `users/${user.uid}/reading-wins`);
      const winsQuery = query(winsRef, orderBy('createdAt', 'desc'), limit(50));
      const winsSnapshot = await getDocs(winsQuery);
      const wins = [];
      winsSnapshot.forEach(doc => {
        wins.push({ id: doc.id, ...doc.data() });
      });
      setReadingWins(wins);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
    
    setLoading(false);
  }, [user, router]);

  // Save new entry
  const saveEntry = useCallback(async () => {
    if (!user?.uid || !entryContent.trim()) return;
    
    try {
      const entryData = {
        content: entryContent,
        createdAt: new Date(),
        prompt: selectedPrompt,
        mood: null // Could add mood tracking
      };
      
      let collectionName = '';
      switch (entryType) {
        case 'journal':
          collectionName = 'reading-journal';
          break;
        case 'goal':
          collectionName = 'reading-goals';
          entryData.status = 'active';
          entryData.progress = 0;
          break;
        case 'win':
          collectionName = 'reading-wins';
          break;
      }
      
      await addDoc(collection(db, `users/${user.uid}/${collectionName}`), entryData);
      
      // Refresh data
      await loadData();
      
      // Reset form
      setShowNewEntry(false);
      setEntryContent('');
      setSelectedPrompt(null);
      setEntryType('');
      
    } catch (error) {
      console.error('❌ Error saving entry:', error);
    }
  }, [user, entryContent, entryType, selectedPrompt, loadData]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId, progress) => {
    if (!user?.uid) return;
    
    try {
      const goalRef = doc(db, `users/${user.uid}/reading-goals`, goalId);
      await updateDoc(goalRef, {
        progress: Number(progress), // Ensure progress is a number
        updatedAt: new Date(),
        status: Number(progress) >= 100 ? 'completed' : 'active'
      });
      
      await loadData();
    } catch (error) {
      console.error('❌ Error updating goal:', error);
    }
  }, [user, loadData]);

  // Delete journal entry
  const deleteJournalEntry = useCallback(async (entryId) => {
    if (!user?.uid || !confirm('Are you sure you want to delete this journal entry?')) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.uid}/reading-journal`, entryId));
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting journal entry:', error);
    }
  }, [user, loadData]);

  // Delete goal
  const deleteGoal = useCallback(async (goalId) => {
    if (!user?.uid || !confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.uid}/reading-goals`, goalId));
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting goal:', error);
    }
  }, [user, loadData]);

  // Delete win
  const deleteWin = useCallback(async (winId) => {
    if (!user?.uid || !confirm('Are you sure you want to delete this win?')) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.uid}/reading-wins`, winId));
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting win:', error);
    }
  }, [user, loadData]);

  // Toggle entry expansion
  const toggleEntry = (entryId) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
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
        setShowNewEntry(false);
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
          <p style={{ color: luxTheme.textPrimary }}>Loading your reflection space...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reflection & Growth - Reading DNA Lab</title>
        <meta name="description" content="Track your family's reading journey with reflection prompts, journaling, and goal setting" />
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
              <span style={{ fontSize: '18px' }}>🌱</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Reflection & Growth</span>
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
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              Your Reading Journey
            </h2>
            <p style={{
              fontSize: '16px',
              margin: '0',
              opacity: 0.9
            }}>
              Reflect, celebrate, and grow as a {parentDnaType?.name || 'reading'} parent
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${luxTheme.primary}30`,
            display: 'flex',
            gap: '8px'
          }}>
            <TabButton
              active={activeTab === 'reflect'}
              onClick={() => setActiveTab('reflect')}
              emoji="💭"
              label="Reflect"
              theme={luxTheme}
              color={parentDnaType?.color}
            />
            <TabButton
              active={activeTab === 'journal'}
              onClick={() => setActiveTab('journal')}
              emoji="📖"
              label="Journal"
              theme={luxTheme}
              color={parentDnaType?.color}
            />
            <TabButton
              active={activeTab === 'goals'}
              onClick={() => setActiveTab('goals')}
              emoji="🎯"
              label="Goals"
              theme={luxTheme}
              color={parentDnaType?.color}
            />
            <TabButton
              active={activeTab === 'wins'}
              onClick={() => setActiveTab('wins')}
              emoji="🎉"
              label="Wins"
              theme={luxTheme}
              color={parentDnaType?.color}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'reflect' && (
            <>
              {/* Weekly Reflection Prompts */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${parentDnaType?.color || luxTheme.primary}30`
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
                  <span>💭</span> This Week's Reflection Questions
                </h3>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  {getCurrentPrompts().map((prompt, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: `${luxTheme.primary}10`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setEntryType('journal');
                        setEntryContent('');
                        setShowNewEntry(true);
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = `${parentDnaType?.color || luxTheme.primary}20`;
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`;
                        e.currentTarget.style.transform = 'translateX(0)';
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
                          {idx === 0 ? '🌟' : idx === 1 ? '💡' : '🌈'}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: luxTheme.textPrimary,
                          lineHeight: '1.5',
                          flex: 1
                        }}>
                          {prompt}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: luxTheme.textSecondary
                        }}>
                          →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  marginTop: '20px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: luxTheme.textSecondary
                }}>
                  New reflection questions appear each week tailored to your {parentDnaType?.name} style
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                <StatCard
                  emoji="📖"
                  label="Journal Entries"
                  value={journalEntries.length}
                  theme={luxTheme}
                  color={luxTheme.primary}
                />
                <StatCard
                  emoji="🎯"
                  label="Active Goals"
                  value={readingGoals.filter(g => g.status === 'active').length}
                  theme={luxTheme}
                  color={luxTheme.secondary}
                />
                <StatCard
                  emoji="🎉"
                  label="Wins Celebrated"
                  value={readingWins.length}
                  theme={luxTheme}
                  color={luxTheme.accent}
                />
              </div>
            </>
          )}

          {activeTab === 'journal' && (
            <>
              {/* New Journal Entry Button */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.primary}30`,
                textAlign: 'center'
              }}>
                <button
                  onClick={() => {
                    setEntryType('journal');
                    setSelectedPrompt(null);
                    setEntryContent('');
                    setShowNewEntry(true);
                  }}
                  style={{
                    backgroundColor: parentDnaType?.color || luxTheme.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '16px',
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
                  <span>✍️</span>
                  <span>Write New Entry</span>
                </button>
              </div>

              {/* Journal Entries */}
              {journalEntries.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {journalEntries.map((entry) => (
                    <JournalEntry
                      key={entry.id}
                      entry={entry}
                      isExpanded={expandedEntries[entry.id]}
                      onToggle={() => toggleEntry(entry.id)}
                      onDelete={() => deleteJournalEntry(entry.id)}
                      theme={luxTheme}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  emoji="📖"
                  message="Start your reading reflection journey"
                  action="Write Your First Entry"
                  onAction={() => {
                    setEntryType('journal');
                    setSelectedPrompt(null);
                    setEntryContent('');
                    setShowNewEntry(true);
                  }}
                  theme={luxTheme}
                />
              )}
            </>
          )}

          {activeTab === 'goals' && (
            <>
              {/* New Goal Button */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.primary}30`,
                textAlign: 'center'
              }}>
                <button
                  onClick={() => {
                    setEntryType('goal');
                    setSelectedPrompt(null);
                    setEntryContent('');
                    setShowNewEntry(true);
                  }}
                  style={{
                    backgroundColor: luxTheme.secondary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '16px',
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
                  <span>🎯</span>
                  <span>Set New Goal</span>
                </button>
              </div>

              {/* Goals List */}
              {readingGoals.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {readingGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdateProgress={(progress) => updateGoalProgress(goal.id, progress)}
                      onDelete={() => deleteGoal(goal.id)}
                      theme={luxTheme}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  emoji="🎯"
                  message="Set goals to guide your family's reading journey"
                  action="Create Your First Goal"
                  onAction={() => {
                    setEntryType('goal');
                    setSelectedPrompt(null);
                    setEntryContent('');
                    setShowNewEntry(true);
                  }}
                  theme={luxTheme}
                />
              )}
            </>
          )}

          {activeTab === 'wins' && (
            <>
              {/* New Win Button */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.primary}30`,
                textAlign: 'center'
              }}>
                <button
                  onClick={() => {
                    setEntryType('win');
                    setSelectedPrompt(null);
                    setEntryContent('');
                    setShowNewEntry(true);
                  }}
                  style={{
                    backgroundColor: luxTheme.accent,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '16px',
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
                  <span>🎉</span>
                  <span>Celebrate a Win</span>
                </button>
              </div>

              {/* Wins List */}
              {readingWins.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {readingWins.map((win) => (
                    <WinCard
                      key={win.id}
                      win={win}
                      onDelete={() => deleteWin(win.id)}
                      theme={luxTheme}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  emoji="🎉"
                  message="Every reading moment is worth celebrating"
                  action="Share Your First Win"
                  onAction={() => {
                    setEntryType('win');
                    setSelectedPrompt(null);
                    setEntryContent('');
                    setShowNewEntry(true);
                  }}
                  theme={luxTheme}
                />
              )}
            </>
          )}
        </div>

        {/* New Entry Modal */}
        {showNewEntry && (
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
                  fontSize: '20px'
                }}>
                  {entryType === 'journal' ? '📖 New Journal Entry' :
                   entryType === 'goal' ? '🎯 Set a New Goal' :
                   entryType === 'win' ? '🎉 Celebrate a Win' : ''}
                </h3>
                <button 
                  onClick={() => setShowNewEntry(false)}
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
              
              {selectedPrompt && (
                <div style={{
                  backgroundColor: `${luxTheme.primary}10`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5'
                }}>
                  <div style={{
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Reflecting on:
                  </div>
                  {selectedPrompt}
                </div>
              )}
              
              <textarea
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder={
                  entryType === 'journal' ? 'Write your thoughts here...' :
                  entryType === 'goal' ? 'What reading goal would you like to set?' :
                  entryType === 'win' ? 'What reading win are you celebrating?' : ''
                }
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${luxTheme.primary}30`,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />
              
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px'
              }}>
                <button
                  onClick={() => setShowNewEntry(false)}
                  style={{
                    flex: 1,
                    backgroundColor: `${luxTheme.textSecondary}20`,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={!entryContent.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: entryContent.trim() ? 
                      (entryType === 'journal' ? parentDnaType?.color || luxTheme.primary :
                       entryType === 'goal' ? luxTheme.secondary :
                       luxTheme.accent) : '#ccc',
                    color: entryContent.trim() ? 'white' : '#666',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: entryContent.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save
                </button>
              </div>
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
          
          @keyframes celebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.1) rotate(-5deg); }
            75% { transform: scale(1.1) rotate(5deg); }
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

// Tab Button Component
function TabButton({ active, onClick, emoji, label, theme, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        backgroundColor: active ? color || theme.primary : 'transparent',
        color: active ? 'white' : theme.textSecondary,
        border: 'none',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: '16px' }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

// Stat Card Component
function StatCard({ emoji, label, value, theme, color }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${color}30`,
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '8px'
      }}>
        {emoji}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: theme.textPrimary,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '12px',
        color: theme.textSecondary
      }}>
        {label}
      </div>
    </div>
  );
}

// Journal Entry Component
function JournalEntry({ entry, isExpanded, onToggle, onDelete, theme }) {
  const date = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
  
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${theme.primary}30`,
      position: 'relative'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: 'calc(100% - 40px)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}
      >
        <span style={{
          fontSize: '20px',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          📖
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '12px',
            color: theme.textSecondary,
            marginBottom: '4px'
          }}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          {entry.prompt && (
            <div style={{
              fontSize: '13px',
              color: theme.textPrimary,
              fontStyle: 'italic',
              marginBottom: '8px',
              opacity: 0.8
            }}>
              "{entry.prompt}"
            </div>
          )}
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: isExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: isExpanded ? 'none' : 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {entry.content}
          </div>
        </div>
      </button>
      
      {/* Expand/Collapse arrow */}
      <span style={{
        position: 'absolute',
        right: '12px',
        top: '16px',
        fontSize: '14px',
        color: theme.textSecondary,
        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
        pointerEvents: 'none'
      }}>
        ▶
      </span>
      
      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: '12px',
          right: '40px',
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          borderRadius: '4px',
          opacity: 0.6,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#e74c3c';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = theme.textSecondary;
        }}
      >
        🗑️
      </button>
    </div>
  );
}

// Goal Card Component
function GoalCard({ goal, onUpdateProgress, onDelete, theme }) {
  const [localProgress, setLocalProgress] = useState(goal.progress || 0);
  
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${goal.status === 'completed' ? '#4CAF50' : theme.secondary}30`,
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'start',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <span style={{
          fontSize: '24px',
          flexShrink: 0
        }}>
          {goal.status === 'completed' ? '✅' : '🎯'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '4px'
          }}>
            {goal.content}
          </div>
          <div style={{
            fontSize: '12px',
            color: theme.textSecondary
          }}>
            Created {goal.createdAt?.toDate ? 
              goal.createdAt.toDate().toLocaleDateString() : 
              new Date(goal.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      {goal.status !== 'completed' && (
        <>
          <div style={{
            backgroundColor: `${theme.secondary}20`,
            borderRadius: '8px',
            height: '8px',
            marginBottom: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: theme.secondary,
              height: '100%',
              width: `${localProgress}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="range"
              min="0"
              max="100"
              value={localProgress}
              onChange={(e) => setLocalProgress(Number(e.target.value))}
              onMouseUp={() => onUpdateProgress(localProgress)}
              onTouchEnd={() => onUpdateProgress(localProgress)}
              style={{
                flex: 1,
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.textPrimary,
              minWidth: '45px',
              textAlign: 'right'
            }}>
              {localProgress}%
            </span>
          </div>
        </>
      )}
      
      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          borderRadius: '4px',
          opacity: 0.6,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#e74c3c';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = theme.textSecondary;
        }}
      >
        🗑️
      </button>
    </div>
  );
}

// Win Card Component
function WinCard({ win, onDelete, theme }) {
  const date = win.createdAt?.toDate ? win.createdAt.toDate() : new Date(win.createdAt);
  
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${theme.accent}30`,
      animation: 'celebrate 2s ease-in-out',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'start',
        gap: '12px'
      }}>
        <span style={{
          fontSize: '32px',
          flexShrink: 0,
          animation: 'celebrate 2s ease-in-out infinite'
        }}>
          🎉
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5',
            marginBottom: '8px'
          }}>
            {win.content}
          </div>
          <div style={{
            fontSize: '12px',
            color: theme.textSecondary
          }}>
            {date.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
        </div>
      </div>
      
      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          borderRadius: '4px',
          opacity: 0.6,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#e74c3c';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = theme.textSecondary;
        }}
      >
        🗑️
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState({ emoji, message, action, onAction, theme }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '40px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${theme.primary}30`
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {emoji}
      </div>
      <p style={{
        fontSize: '16px',
        color: theme.textSecondary,
        marginBottom: '20px'
      }}>
        {message}
      </p>
      <button
        onClick={onAction}
        style={{
          backgroundColor: theme.primary,
          color: theme.textPrimary,
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        {action}
      </button>
    </div>
  );
}
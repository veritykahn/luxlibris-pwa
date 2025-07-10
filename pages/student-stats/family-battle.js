// pages/student-stats/family-battle.js - Complete Family Battle Coming Soon Page
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities } from '../../lib/firebase';
import Head from 'next/head';

export default function FamilyBattle() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Theme definitions (consistent with all other pages)
  const themes = useMemo(() => ({
    classic_lux: {
      name: 'Lux Libris Classic',
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: '#FFFCF5',
      surface: '#FFFFFF',
      textPrimary: '#223848',
      textSecondary: '#556B7A'
    },
    darkwood_sports: {
      name: 'Athletic Champion',
      primary: '#2F5F5F',
      secondary: '#8B2635',
      accent: '#F5DEB3',
      background: '#F5F5DC',
      surface: '#FFF8DC',
      textPrimary: '#2F1B14',
      textSecondary: '#5D4037'
    },
    lavender_space: {
      name: 'Cosmic Explorer',
      primary: '#9C88C4',
      secondary: '#B19CD9',
      accent: '#E1D5F7',
      background: '#2A1B3D',
      surface: '#3D2B54',
      textPrimary: '#E1D5F7',
      textSecondary: '#B19CD9'
    },
    mint_music: {
      name: 'Musical Harmony',
      primary: '#B8E6B8',
      secondary: '#FFB3BA',
      accent: '#FFCCCB',
      background: '#FEFEFE',
      surface: '#F8FDF8',
      textPrimary: '#2E4739',
      textSecondary: '#4A6B57'
    },
    pink_plushies: {
      name: 'Kawaii Dreams',
      primary: '#FFB6C1',
      secondary: '#FFC0CB',
      accent: '#FFE4E1',
      background: '#FFF0F5',
      surface: '#FFE4E6',
      textPrimary: '#4A2C2A',
      textSecondary: '#8B4B5C'
    },
    teal_anime: {
      name: 'Otaku Paradise',
      primary: '#20B2AA',
      secondary: '#48D1CC',
      accent: '#7FFFD4',
      background: '#E0FFFF',
      surface: '#AFEEEE',
      textPrimary: '#2F4F4F',
      textSecondary: '#5F9EA0'
    },
    white_nature: {
      name: 'Pure Serenity',
      primary: '#6B8E6B',
      secondary: '#D2B48C',
      accent: '#F5F5DC',
      background: '#FFFEF8',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F',
      textSecondary: '#556B2F'
    },
    little_luminaries: {
      name: 'Luxlings™',
      primary: '#666666',
      secondary: '#000000',
      accent: '#E8E8E8',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      textPrimary: '#B8860B',
      textSecondary: '#AAAAAA'
    }
  }), []);

  // Load student data for theme
  const loadData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      setStudentData(firebaseStudentData);
      
      const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
      const selectedTheme = themes[selectedThemeKey];
      setCurrentTheme(selectedTheme);
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router, themes]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadData]);

  if (loading || isLoading || !studentData || !currentTheme) {
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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading family battle...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris</title>
        <meta name="description" content="Challenge your parents and siblings to epic reading competitions" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* HEADER */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          <h1 style={{
            fontSize: '24px',
            fontWeight: '400',
            color: currentTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center',
            flex: 1
          }}>
            👨‍👩‍👧‍👦 Family Battle
          </h1>

          <div style={{ width: '44px' }} />
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: 'clamp(16px, 5vw, 20px)', maxWidth: '400px', margin: '0 auto' }}>
          
          {/* COMING SOON CARD */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '20px',
            padding: '40px 20px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'clamp(48px, 15vw, 64px)',
              marginBottom: '20px'
            }}>
              ⚔️
            </div>
            
            <div style={{
              fontSize: 'clamp(18px, 5vw, 20px)',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              marginBottom: '12px',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Family Battle Coming Soon!
            </div>
            
            <div style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              color: currentTheme.textSecondary,
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Challenge your parents and siblings to epic reading competitions!
            </div>

            <div style={{
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: `${currentTheme.primary}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  📊 Parent vs Kid Challenges
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  • Challenge your parents to reading races
                  <br />
                  • Compare reading speeds and comprehension
                  <br />
                  • Prove that kids can be reading champions too!
                </div>
              </div>

              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  🏆 Family Leaderboards
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  • See who's the ultimate reading champion in your family
                  <br />
                  • Track progress across weekly and monthly challenges
                  <br />
                  • Celebrate family reading achievements together
                </div>
              </div>

              <div style={{
                backgroundColor: `${currentTheme.accent}20`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  👪 Sibling Rivalries
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  • Compete with your brothers and sisters
                  <br />
                  • Compare saint collections and reading milestones
                  <br />
                  • Turn reading into a fun family competition
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: `${currentTheme.primary}10`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: currentTheme.textSecondary,
                fontStyle: 'italic',
                marginBottom: '8px'
              }}>
                &quot;Family Battle will let you challenge your parents and siblings to reading competitions!&quot;
              </div>
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary,
                fontWeight: '600'
              }}>
                - Making Reading a Family Adventure
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: `${currentTheme.primary}15`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 20px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {studentData.schoolName}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  Your School
                </div>
              </div>
              
              <div style={{
                backgroundColor: `${currentTheme.secondary}15`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 20px)',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary,
                  marginBottom: '4px'
                }}>
                  Coming Soon
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 3vw, 12px)',
                  color: currentTheme.textSecondary
                }}>
                  Family Ranking
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/student-stats')}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.textPrimary,
                border: 'none',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              ← Back to Stats Dashboard
            </button>
          </div>
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
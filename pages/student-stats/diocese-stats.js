// pages/student-stats/diocese-stats.js - Complete Diocese Stats Coming Soon Page
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDataEntities } from '../../lib/firebase';
import { getTheme } from '../../lib/themes';
import Head from 'next/head';

export default function DioceseStats() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const selectedTheme = getTheme(selectedThemeKey);
      setCurrentTheme(selectedTheme);
      
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/student-dashboard');
    }
    
    setIsLoading(false);
  }, [user, router]);

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
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading diocese stats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Diocese Stats - Lux Libris</title>
        <meta name="description" content="Compare your reading progress with students across your entire diocese" />
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
            🌍 Diocese Stats
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
              ⛪
            </div>
            
            <div style={{
              fontSize: 'clamp(18px, 5vw, 20px)',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              marginBottom: '12px',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Diocese Stats Coming Soon!
            </div>
            
            <div style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              color: currentTheme.textSecondary,
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Compare your reading progress with students across your entire diocese!
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
                  📊 Diocese-Wide Comparisons
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  • See how your school ranks among all Catholic schools in your diocese
                  <br />
                  • Compare reading achievements across multiple parishes
                  <br />
                  • Anonymous aggregated data protecting individual privacy
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
                  🏆 Regional Achievements
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  • Discover which schools are leading in reading milestones
                  <br />
                  • See diocese-wide saint collection progress
                  <br />
                  • Celebrate regional reading challenges and competitions
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
                  ⛪ Catholic School Network
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  • Connect with the broader Catholic educational community
                  <br />
                  • See how Catholic values inspire reading across schools
                  <br />
                  • Join diocese-wide reading initiatives and events
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
                &quot;Diocese-wide stats will show you how your school is doing compared to other Catholic schools in your region, all while keeping individual student data completely private!&quot;
              </div>
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary,
                fontWeight: '600'
              }}>
                - Building Community Through Reading
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
                  Diocese Ranking
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
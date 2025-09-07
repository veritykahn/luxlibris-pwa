// pages/god-mode/admin-fixes.js - Admin Health & Fixes Hub (God Mode Styled)
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import Link from 'next/link';
import GodModeAuth from '../../components/god-mode/GodModeAuth';
import GodModeHeader from '../../components/god-mode/GodModeHeader';

export default function AdminFixesHub() {
  const [healthStats, setHealthStats] = useState({
    totalFamilies: 0,
    incompleteParents: 0,
    brokenFamilyBattles: 0,
    dualStructureFamilies: 0,
    inconsistentStates: 0,
    missingHistories: 0,
    orphanedStudents: 0,
    systemHealthScore: 0
  });
  const [loading, setLoading] = useState(true);

  // Comprehensive system health check
  const runSystemHealthCheck = async () => {
    try {
      setLoading(true);
      console.log('🔍 Running comprehensive system health check...');
      
      const stats = {
        totalFamilies: 0,
        incompleteParents: 0,
        brokenFamilyBattles: 0,
        dualStructureFamilies: 0,
        inconsistentStates: 0,
        missingHistories: 0,
        orphanedStudents: 0,
        systemHealthScore: 0
      };

      // Check Parent Accounts
      const parentsSnapshot = await getDocs(collection(db, 'parents'));
      parentsSnapshot.forEach(doc => {
        const parentData = doc.data();
        const isIncomplete = !parentData.onboardingCompleted || 
                            !parentData.familyId || 
                            !parentData.parentProfile ||
                            !parentData.readingGoals;
        if (isIncomplete) {
          stats.incompleteParents++;
        }
      });

      // Check Family Battle Health
      const familiesSnapshot = await getDocs(collection(db, 'families'));
      stats.totalFamilies = familiesSnapshot.size;
      
      familiesSnapshot.forEach(doc => {
        const data = doc.data();
        const battle = data.familyBattle;
        
        // Check for dual structure (old + new)
        const hasOldStructure = data.familyBattleHistory;
        const hasNewStructure = battle?.history;
        if (hasOldStructure && hasNewStructure) {
          stats.dualStructureFamilies++;
        }
        
        // Check for inconsistent enabled state
        const hasInconsistentState = battle && (!battle.enabled && (battle.currentWeek || battle.completedWeek));
        if (hasInconsistentState) {
          stats.inconsistentStates++;
        }
        
        // Check for missing history
        const hasMissingHistory = battle?.enabled && !battle.history;
        if (hasMissingHistory) {
          stats.missingHistories++;
        }
        
        // Count as broken if any issue exists
        if (hasOldStructure || hasInconsistentState || hasMissingHistory) {
          stats.brokenFamilyBattles++;
        }
      });

      // Check for orphaned students (students with familyId but family doesn't link back)
      let orphanedCount = 0;
      try {
        const entitiesSnapshot = await getDocs(collection(db, 'entities'));
        for (const entityDoc of entitiesSnapshot.docs) {
          try {
            const schoolsSnapshot = await getDocs(collection(db, `entities/${entityDoc.id}/schools`));
            for (const schoolDoc of schoolsSnapshot.docs) {
              try {
                const studentsSnapshot = await getDocs(collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`));
                studentsSnapshot.forEach(studentDoc => {
                  const studentData = studentDoc.data();
                  if (studentData.familyId && studentData.familyBattleSettings?.enabled) {
                    // This student thinks they're in a battle-enabled family
                    const familyData = familiesSnapshot.docs.find(f => f.id === studentData.familyId)?.data();
                    if (!familyData?.familyBattle?.enabled) {
                      orphanedCount++;
                    }
                  }
                });
              } catch (err) {
                // No students in this school
              }
            }
          } catch (err) {
            // No schools in this entity
          }
        }
      } catch (err) {
        console.error('Error checking orphaned students:', err);
      }
      stats.orphanedStudents = orphanedCount;

      // Calculate system health score (0-100)
      const totalIssues = stats.incompleteParents + stats.brokenFamilyBattles + stats.orphanedStudents;
      const maxPossibleIssues = Math.max(1, stats.totalFamilies + parentsSnapshot.size);
      stats.systemHealthScore = Math.max(0, Math.round(100 - (totalIssues / maxPossibleIssues) * 100));

      setHealthStats(stats);
      console.log('📊 Health check complete:', stats);
      
    } catch (error) {
      console.error('❌ Error running health check:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    runSystemHealthCheck();
  }, []);

  // Fix tool definitions
  const fixTools = [
    {
      id: 'parent-recovery',
      title: 'Parent Account Recovery',
      icon: '👨‍👩‍👧‍👦',
      description: 'Find and fix incomplete parent accounts that got stuck during onboarding',
      href: '/god-mode/parent-recovery',
      color: '#f59e0b',
      issueCount: healthStats.incompleteParents,
      severity: healthStats.incompleteParents > 5 ? 'high' : healthStats.incompleteParents > 0 ? 'medium' : 'low',
      lastUpdated: 'Existing tool'
    },
    {
      id: 'family-battle-health',
      title: 'Family Battle Health Check',
      icon: '⚔️',
      description: 'Detect and repair dual data structures, inconsistent states, and missing histories',
      href: '/god-mode/family-battle-health',
      color: '#ec4899',
      issueCount: healthStats.brokenFamilyBattles,
      severity: healthStats.brokenFamilyBattles > 3 ? 'high' : healthStats.brokenFamilyBattles > 0 ? 'medium' : 'low',
      lastUpdated: 'New comprehensive tool'
    },
    {
      id: 'family-linking-diagnostics',
      title: 'Family Linking Diagnostics',
      icon: '🔗',
      description: 'Fix orphaned students and parent-family connection issues',
      href: '/god-mode/family-linking-diagnostics',
      color: '#8b5cf6',
      issueCount: healthStats.orphanedStudents,
      severity: healthStats.orphanedStudents > 5 ? 'high' : healthStats.orphanedStudents > 0 ? 'medium' : 'low',
      lastUpdated: 'Coming soon'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '💤';
    }
  };

  return (
    <GodModeAuth pageName="Admin Health & Fixes Hub">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Admin Health & Fixes - GOD MODE - Lux Libris</title>
          </Head>

          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Admin Health & Fixes"
              icon="🔧"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
              showDashboardButton={true}
              showManagerButton={true}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Header */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(236, 72, 153, 0.3)'
              }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 1rem 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  🔧 Admin Health & Fixes Control Center
                </h1>
                <p style={{
                  color: '#c084fc',
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.125rem'
                }}>
                  Comprehensive database health monitoring and repair tools
                </p>
                
                {/* System Health Score */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: healthStats.systemHealthScore >= 90 ? 'rgba(16, 185, 129, 0.2)' : 
                               healthStats.systemHealthScore >= 70 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `2px solid ${healthStats.systemHealthScore >= 90 ? '#10b981' : 
                                        healthStats.systemHealthScore >= 70 ? '#f59e0b' : '#ef4444'}`,
                    borderRadius: '1rem',
                    padding: '1rem 1.5rem',
                    flex: 1
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{ fontSize: '2rem' }}>
                        {healthStats.systemHealthScore >= 90 ? '💚' : healthStats.systemHealthScore >= 70 ? '💛' : '❤️'}
                      </span>
                      <div>
                        <div style={{
                          color: healthStats.systemHealthScore >= 90 ? '#10b981' : 
                                 healthStats.systemHealthScore >= 70 ? '#f59e0b' : '#ef4444',
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}>
                          {loading ? '...' : `${healthStats.systemHealthScore}%`}
                        </div>
                        <div style={{
                          color: '#c084fc',
                          fontSize: '0.875rem'
                        }}>
                          System Health Score
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={runSystemHealthCheck}
                    disabled={loading}
                    style={{
                      background: loading ? '#6b7280' : 'linear-gradient(135deg, #ec4899, #be185d)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? '⏳ Scanning...' : '🔄 Refresh Health Check'}
                  </button>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: '2px solid #6b728040'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#c084fc'
                  }}>
                    {loading ? '...' : healthStats.totalFamilies}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Total Families
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: `2px solid ${healthStats.incompleteParents > 0 ? '#f59e0b40' : '#10b98140'}`
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: healthStats.incompleteParents > 0 ? '#f59e0b' : '#10b981'
                  }}>
                    {loading ? '...' : healthStats.incompleteParents}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Incomplete Parents
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: `2px solid ${healthStats.brokenFamilyBattles > 0 ? '#ec489940' : '#10b98140'}`
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: healthStats.brokenFamilyBattles > 0 ? '#ec4899' : '#10b981'
                  }}>
                    {loading ? '...' : healthStats.brokenFamilyBattles}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Broken Family Battles
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: `2px solid ${healthStats.orphanedStudents > 0 ? '#8b5cf640' : '#10b98140'}`
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: healthStats.orphanedStudents > 0 ? '#8b5cf6' : '#10b981'
                  }}>
                    {loading ? '...' : healthStats.orphanedStudents}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Orphaned Students
                  </div>
                </div>
              </div>

              {/* Detailed Health Report */}
              {!loading && (healthStats.dualStructureFamilies > 0 || healthStats.inconsistentStates > 0 || healthStats.missingHistories > 0) && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid #ef444460',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#ef4444',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🚨 Critical Issues Detected
                  </h2>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {healthStats.dualStructureFamilies > 0 && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '1px solid #ef444460'
                      }}>
                        <strong style={{ color: 'white' }}>
                          {healthStats.dualStructureFamilies} families with dual battle structures
                        </strong>
                        <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          Families have both old (familyBattleHistory) and new (familyBattle.history) data structures
                        </div>
                      </div>
                    )}
                    
                    {healthStats.inconsistentStates > 0 && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '1px solid #ef444460'
                      }}>
                        <strong style={{ color: 'white' }}>
                          {healthStats.inconsistentStates} families with inconsistent enabled states
                        </strong>
                        <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          Families have enabled=false but contain active battle data
                        </div>
                      </div>
                    )}
                    
                    {healthStats.missingHistories > 0 && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '1px solid #ef444460'
                      }}>
                        <strong style={{ color: 'white' }}>
                          {healthStats.missingHistories} families with missing battle histories
                        </strong>
                        <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          Families have enabled=true but no history structure
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fix Tools Grid */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '0.75rem',
                padding: '2rem',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 1.5rem 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  🛠️ Available Fix Tools
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {fixTools.map(tool => (
                    <div key={tool.id}>
                      {tool.href === '/god-mode/family-linking-diagnostics' ? (
                        // Coming soon - not clickable
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem',
                          border: `2px solid ${tool.color}40`,
                          opacity: 0.6,
                          cursor: 'not-allowed',
                          height: '100%'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              width: '3rem',
                              height: '3rem',
                              background: `linear-gradient(135deg, ${tool.color}, ${tool.color}dd)`,
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem'
                            }}>
                              {tool.icon}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                color: 'white',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                margin: '0 0 0.25rem',
                                fontFamily: 'Georgia, serif'
                              }}>
                                {tool.title}
                              </h3>
                              <p style={{
                                color: '#c084fc',
                                fontSize: '0.875rem',
                                margin: 0,
                                lineHeight: '1.4'
                              }}>
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(107, 114, 128, 0.2)',
                            borderRadius: '0.5rem',
                            textAlign: 'center'
                          }}>
                            <span style={{ color: '#9ca3af', fontWeight: '600' }}>
                              🚧 Coming Soon
                            </span>
                          </div>
                        </div>
                      ) : (
                        // Active tool - clickable
                        <Link href={tool.href} style={{ textDecoration: 'none' }}>
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            border: `2px solid ${tool.color}40`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            height: '100%'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.boxShadow = `0 10px 30px ${tool.color}30`
                            e.currentTarget.style.borderColor = `${tool.color}80`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.borderColor = `${tool.color}40`
                          }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem',
                              marginBottom: '1rem'
                            }}>
                              <div style={{
                                width: '3rem',
                                height: '3rem',
                                background: `linear-gradient(135deg, ${tool.color}, ${tool.color}dd)`,
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem'
                              }}>
                                {tool.icon}
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <h3 style={{
                                  color: 'white',
                                  fontSize: '1.25rem',
                                  fontWeight: 'bold',
                                  margin: '0 0 0.25rem',
                                  fontFamily: 'Georgia, serif'
                                }}>
                                  {tool.title}
                                </h3>
                                <p style={{
                                  color: '#c084fc',
                                  fontSize: '0.875rem',
                                  margin: 0,
                                  lineHeight: '1.4'
                                }}>
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                            
                            {/* Issue Count and Severity */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '1rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: `${getSeverityColor(tool.severity)}20`,
                                border: `1px solid ${getSeverityColor(tool.severity)}60`,
                                borderRadius: '1rem',
                                padding: '0.25rem 0.75rem'
                              }}>
                                <span>{getSeverityIcon(tool.severity)}</span>
                                <span style={{
                                  color: getSeverityColor(tool.severity),
                                  fontWeight: 'bold',
                                  fontSize: '1.25rem'
                                }}>
                                  {loading ? '...' : tool.issueCount}
                                </span>
                                <span style={{
                                  color: getSeverityColor(tool.severity),
                                  fontSize: '0.875rem'
                                }}>
                                  issues
                                </span>
                              </div>
                              
                              <div style={{
                                color: '#9ca3af',
                                fontSize: '0.75rem'
                              }}>
                                {tool.lastUpdated}
                              </div>
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.25rem',
                              color: tool.color,
                              fontSize: '0.875rem',
                              fontWeight: '600'
                            }}>
                              <span>Open Tool</span>
                              <span>→</span>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status Summary */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginTop: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  📊 System Status Summary
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <strong style={{ color: '#c084fc' }}>Database Health:</strong>
                    <div style={{ color: 'white', marginTop: '0.25rem' }}>
                      {loading ? 'Scanning...' : 
                       healthStats.systemHealthScore >= 90 ? '🟢 Excellent' :
                       healthStats.systemHealthScore >= 70 ? '🟡 Good' : '🔴 Needs Attention'}
                    </div>
                  </div>
                  
                  <div>
                    <strong style={{ color: '#c084fc' }}>Priority Actions:</strong>
                    <div style={{ color: 'white', marginTop: '0.25rem' }}>
                      {loading ? 'Calculating...' : 
                       (healthStats.incompleteParents + healthStats.brokenFamilyBattles + healthStats.orphanedStudents) === 0 ? 
                       '✨ No issues found' : 
                       `${healthStats.incompleteParents + healthStats.brokenFamilyBattles + healthStats.orphanedStudents} items need attention`}
                    </div>
                  </div>
                  
                  <div>
                    <strong style={{ color: '#c084fc' }}>Last Health Check:</strong>
                    <div style={{ color: 'white', marginTop: '0.25rem' }}>
                      {loading ? 'Running now...' : new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  );
}
// pages/god-mode/index.js - GOD MODE DASHBOARD (Updated with Admin Health & Fixes)
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db, dbHelpers } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function GodModeDashboard() {
  const [stats, setStats] = useState({
    entities: 0,
    schools: 0,
    students: 0,
    currentPhase: 'SETUP',
    academicYear: '2025-26',
    totalVotes: 0,
    auditLogs: 0,
    incompleteParents: 0,
    brokenFamilyBattles: 0,
    systemHealthScore: 0
  })
  const [loading, setLoading] = useState(true)

  // Quick health check for family battles
  const quickFamilyBattleHealthCheck = async () => {
    try {
      const familiesSnapshot = await getDocs(collection(db, 'families'))
      let brokenCount = 0
      
      familiesSnapshot.forEach(doc => {
        const data = doc.data()
        const battle = data.familyBattle
        
        // Check for common issues
        const hasOldStructure = data.familyBattleHistory
        const hasNewStructure = battle?.history
        const hasInconsistentState = battle && (!battle.enabled && (battle.currentWeek || battle.completedWeek))
        const hasMissingHistory = battle?.enabled && !battle.history
        
        if (hasOldStructure || hasInconsistentState || hasMissingHistory) {
          brokenCount++
        }
      })
      
      return brokenCount
    } catch (error) {
      console.error('Error checking family battle health:', error)
      return 0
    }
  }

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Get entity counts
      const entitiesSnapshot = await getDocs(collection(db, 'entities'))
      const schoolsSnapshot = await getDocs(collection(db, 'schools'))
      
      let totalStudents = 0
      let totalSchools = 0
      let dioceseCount = 0
      let isdCount = 0
      
      // Count entities and their schools
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityData = entityDoc.data()
        
        if (entityData.type === 'diocese') {
          dioceseCount++
        } else if (entityData.type === 'isd') {
          isdCount++
        }
        
        // Count schools in this entity
        try {
          const entitySchoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
          const entitySchoolsSnapshot = await getDocs(entitySchoolsRef)
          totalSchools += entitySchoolsSnapshot.size
          
          // Count students in these schools
          for (const schoolDoc of entitySchoolsSnapshot.docs) {
            try {
              const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`)
              const studentsSnapshot = await getDocs(studentsRef)
              totalStudents += studentsSnapshot.size
            } catch (err) {
              console.log('No students in school:', schoolDoc.id)
            }
          }
        } catch (err) {
          console.log('No schools in entity:', entityDoc.id)
        }
      }
      
      // Count single schools and their students
      schoolsSnapshot.forEach((doc) => {
        const schoolData = doc.data()
        if (schoolData.type === 'single_school' || schoolData.type === 'single_library') {
          totalSchools++
          totalStudents += schoolData.studentCount || 0
        }
      })
      
      // Get current phase and academic year
      let config = { programPhase: 'SETUP', currentAcademicYear: '2025-26' }
      try {
        config = await dbHelpers.getSystemConfig()
      } catch (err) {
        console.log('Using default config')
      }
      
      // Get voting stats
      let totalVotes = 0
      try {
        const votesSnapshot = await getDocs(collection(db, 'votes'))
        votesSnapshot.forEach(doc => {
          const voteData = doc.data()
          if (voteData.academicYear === config.currentAcademicYear) {
            totalVotes += voteData.totalVotes || 0
          }
        })
      } catch (err) {
        console.log('Could not load votes')
      }
      
      // Get audit log count
      let auditLogCount = 0
      try {
        const auditSnapshot = await getDocs(collection(db, 'accountDeletionLogs'))
        auditLogCount = auditSnapshot.size
      } catch (err) {
        console.log('Could not load audit logs')
      }
      
      // Get incomplete parent count
      let incompleteParentCount = 0
      try {
        const parentsSnapshot = await getDocs(collection(db, 'parents'))
        parentsSnapshot.forEach(doc => {
          const parentData = doc.data()
          const isIncomplete = !parentData.onboardingCompleted || 
                              !parentData.familyId || 
                              !parentData.parentProfile ||
                              !parentData.readingGoals
          if (isIncomplete) {
            incompleteParentCount++
          }
        })
      } catch (err) {
        console.log('Could not load parent accounts')
      }
      
      // Get broken family battle count
      const brokenFamilyBattles = await quickFamilyBattleHealthCheck()
      
      // Calculate system health score (0-100)
      const maxIssues = incompleteParentCount + brokenFamilyBattles
      const healthScore = maxIssues === 0 ? 100 : Math.max(0, 100 - (maxIssues * 5))
      
      setStats({
        entities: entitiesSnapshot.size,
        schools: totalSchools,
        students: totalStudents,
        currentPhase: config.programPhase || 'SETUP',
        academicYear: config.currentAcademicYear || '2025-26',
        totalVotes,
        auditLogs: auditLogCount,
        incompleteParents: incompleteParentCount,
        brokenFamilyBattles,
        systemHealthScore: healthScore
      })
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      // Set default values so UI doesn't break
      setStats({
        entities: 0,
        schools: 0,
        students: 0,
        currentPhase: 'SETUP',
        academicYear: '2025-26',
        totalVotes: 0,
        auditLogs: 0,
        incompleteParents: 0,
        brokenFamilyBattles: 0,
        systemHealthScore: 0
      })
    }
    setLoading(false)
  }
  
  // Load stats on mount
  useEffect(() => {
    loadDashboardStats()
  }, [])

  // Dashboard sections
  const sections = [
    { 
      id: 'entities',
      title: 'Entity Management',
      icon: '🏛️',
      description: 'Create and manage dioceses, ISDs, schools, and libraries',
      href: '/god-mode/entities',
      color: '#a855f7',
      stats: [
        { label: 'Total Entities', value: loading ? null : stats.entities },
        { label: 'Total Schools', value: loading ? null : stats.schools }
      ]
    },
    {
      id: 'phases',
      title: 'Phase Control',
      icon: '🎯',
      description: 'Academic year and program phase management',
      href: '/god-mode/phases',
      color: '#10b981',
      stats: [
        { label: 'Current Phase', value: loading ? null : stats.currentPhase },
        { label: 'Academic Year', value: loading ? null : stats.academicYear }
      ]
    },
    {
      id: 'voting',
      title: 'Voting Results',
      icon: '🗳️',
      description: 'View voting results and announce winners',
      href: '/god-mode/voting',
      color: '#8b5cf6',
      stats: [
        { label: 'Total Votes', value: loading ? null : stats.totalVotes }
      ]
    },
    {
      id: 'admin-fixes',
      title: 'Admin Health & Fixes',
      icon: '🔧',
      description: 'Database health checks and repair tools',
      href: '/god-mode/admin-fixes',
      color: '#ec4899',
      stats: [
        { label: 'System Health', value: loading ? null : `${stats.systemHealthScore}%` },
        { label: 'Issues Found', value: loading ? null : (stats.incompleteParents + stats.brokenFamilyBattles) }
      ]
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      icon: '📋',
      description: 'Account deletion audit trail and compliance',
      href: '/god-mode/audit',
      color: '#ef4444',
      stats: [
        { label: 'Total Logs', value: loading ? null : stats.auditLogs }
      ]
    },
    {
      id: 'xp-tools',
      title: 'XP Diagnostics',
      icon: '🔧',
      description: 'Student XP management and diagnostics tools',
      href: '/god-mode/xp-tools',
      color: '#06b6d4',
      stats: [
        { label: 'Total Students', value: loading ? null : stats.students }
      ]
    },
    {
      id: 'manager',
      title: 'Manager Tools',
      icon: '⚡',
      description: 'Books, quizzes, saints, programs, and more',
      href: '/god-mode/manager',
      color: '#f59e0b',
      stats: [
        { label: 'Tools Available', value: 9 }
      ]
    }
  ]

  return (
    <GodModeAuth pageName="God Mode Dashboard">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>GOD MODE Dashboard - Lux Libris</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="GOD MODE Dashboard"
              icon="👑"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
              showDashboardButton={false}
              showManagerButton={true}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Welcome Section with System Health */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: `1px solid rgba(168, 85, 247, 0.3)`,
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  ⚡ Supreme System Control ⚡
                </h2>
                <p style={{
                  color: '#c084fc',
                  fontSize: '1.125rem',
                  margin: '0 0 1rem 0'
                }}>
                  Complete administrative control over the Lux Libris platform
                </p>
                
                {/* System Health Indicator */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: stats.systemHealthScore >= 90 ? 'rgba(16, 185, 129, 0.2)' : 
                             stats.systemHealthScore >= 70 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `2px solid ${stats.systemHealthScore >= 90 ? '#10b981' : 
                                      stats.systemHealthScore >= 70 ? '#f59e0b' : '#ef4444'}`,
                  borderRadius: '2rem',
                  padding: '0.5rem 1rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>
                    {stats.systemHealthScore >= 90 ? '💚' : stats.systemHealthScore >= 70 ? '💛' : '❤️'}
                  </span>
                  <span style={{
                    color: stats.systemHealthScore >= 90 ? '#10b981' : 
                           stats.systemHealthScore >= 70 ? '#f59e0b' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '1.125rem'
                  }}>
                    System Health: {loading ? '...' : `${stats.systemHealthScore}%`}
                  </span>
                </div>
                
                <button
                  onClick={loadDashboardStats}
                  disabled={loading}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: loading ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh Stats'}
                </button>
                
                {!loading && (stats.incompleteParents > 0 || stats.brokenFamilyBattles > 0) && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem'
                  }}>
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      ⚠️ {stats.incompleteParents + stats.brokenFamilyBattles} system issues detected
                    </p>
                    <Link href="/god-mode/admin-fixes" style={{ 
                      color: '#ef4444', 
                      textDecoration: 'underline',
                      fontSize: '0.875rem'
                    }}>
                      View Admin Health & Fixes →
                    </Link>
                  </div>
                )}
              </div>

              {/* Section Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {sections.map(section => (
                  <Link key={section.id} href={section.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: `2px solid ${section.color}40`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      height: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = `0 10px 30px ${section.color}30`
                      e.currentTarget.style.borderColor = `${section.color}80`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = `${section.color}40`
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
                          background: `linear-gradient(135deg, ${section.color}, ${section.color}dd)`,
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem'
                        }}>
                          {section.icon}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            color: 'white',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            margin: '0 0 0.25rem',
                            fontFamily: 'Georgia, serif'
                          }}>
                            {section.title}
                          </h3>
                          <p style={{
                            color: '#c084fc',
                            fontSize: '0.875rem',
                            margin: 0,
                            lineHeight: '1.4'
                          }}>
                            {section.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      {section.stats && section.stats.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: `1px solid ${section.color}30`
                        }}>
                          {section.stats.map((stat, index) => (
                            <div key={index} style={{ flex: 1 }}>
                              <div style={{
                                color: section.color,
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                minHeight: '2rem'
                              }}>
                                {loading ? (
                                  <span style={{ 
                                    display: 'inline-block',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                  }}>
                                    •••
                                  </span>
                                ) : (
                                  stat.value !== undefined && stat.value !== null 
                                    ? (typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value)
                                    : '0'
                                )}
                              </div>
                              <div style={{
                                color: '#a78bfa',
                                fontSize: '0.75rem'
                              }}>
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.25rem',
                        marginTop: '1rem',
                        color: section.color,
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        <span>Open</span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
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
                  ⚡ Quick Actions
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <Link href="/god-mode/entities#create" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      ➕ Create Entity
                    </button>
                  </Link>
                  
                  <Link href="/god-mode/phases" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      🎯 Check Phases
                    </button>
                  </Link>
                  
                  <Link href="/god-mode/admin-fixes" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #ec4899, #be185d)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      🔧 Health Check
                    </button>
                  </Link>
                  
                  <Link href="/god-mode/parent-recovery" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      👨‍👩‍👧‍👦 Fix Parent Accounts
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            
            <style jsx>{`
              @keyframes pulse {
                0%, 100% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.5;
                }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  )
}

// Initialize on mount
GodModeDashboard.getInitialProps = async () => {
  return {}
}
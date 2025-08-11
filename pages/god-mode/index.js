// pages/god-mode/index.js - GOD MODE DASHBOARD
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
    auditLogs: 0
  })
  const [loading, setLoading] = useState(true) // Start with loading true

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
      
      setStats({
        entities: entitiesSnapshot.size,
        schools: totalSchools,
        students: totalStudents,
        currentPhase: config.programPhase || 'SETUP',
        academicYear: config.currentAcademicYear || '2025-26',
        totalVotes,
        auditLogs: auditLogCount
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
        auditLogs: 0
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
              
              {/* Welcome Section */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
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
                  margin: 0
                }}>
                  Complete administrative control over the Lux Libris platform
                </p>
                <button
                  onClick={loadDashboardStats}
                  disabled={loading}
                  style={{
                    marginTop: '1rem',
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
                  
                  <Link href="/god-mode/voting" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      🗳️ View Results
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
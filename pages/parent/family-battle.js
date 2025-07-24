// pages/parent/family-battle.js - Updated with Premium Gate (No Unlock Requirements)
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'
import PremiumGate from '../../components/PremiumGate'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function ParentFamilyBattle() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const { hasFeature, isPilotPhase } = usePremiumFeatures()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [familyBattleData, setFamilyBattleData] = useState(null)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')

  // Lux Libris Classic Theme
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // Updated Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Child Progress', path: '/parent/child-progress', icon: '◐' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️', current: true },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  // Utility function for local date
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Load family battle data (aggregate parent + student minutes)
  const loadFamilyBattleData = useCallback(async () => {
    try {
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const weekStr = getLocalDateString(startOfWeek)
      
      // Get parent minutes this week
      const parentSessionsRef = collection(db, `parents/${user.uid}/readingSessions`)
      const parentWeekQuery = query(
        parentSessionsRef,
        where('date', '>=', weekStr)
      )
      const parentWeekSnapshot = await getDocs(parentWeekQuery)
      let parentMinutes = 0
      
      parentWeekSnapshot.forEach(docSnap => {
        const session = docSnap.data()
        parentMinutes += session.duration
      })

      // Get children's minutes this week
      let childrenMinutes = 0
      const childrenDetails = []
      
      for (const student of linkedStudents) {
        const studentSessionsRef = collection(db, `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}/readingSessions`)
        const studentWeekQuery = query(
          studentSessionsRef,
          where('date', '>=', weekStr)
        )
        const studentWeekSnapshot = await getDocs(studentWeekQuery)
        
        let studentMinutes = 0
        studentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data()
          studentMinutes += session.duration
          childrenMinutes += session.duration
        })
        
        childrenDetails.push({
          name: student.firstName,
          minutes: studentMinutes,
          grade: student.grade
        })
      }

      const battleData = {
        weekStarting: weekStr,
        parentMinutes,
        childrenMinutes,
        childrenDetails,
        totalMinutes: parentMinutes + childrenMinutes,
        winner: parentMinutes > childrenMinutes ? 'parents' : 'children',
        lead: Math.abs(parentMinutes - childrenMinutes),
        weekNumber: getWeekNumber(new Date())
      }

      setFamilyBattleData(battleData)
    } catch (error) {
      console.error('Error loading family battle data:', error)
    }
  }, [linkedStudents, user?.uid])

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  // Load initial data with premium check
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      // Check if they have access to family battle feature
      if (hasFeature('familyBattle')) {
        loadInitialData()
      } else {
        setLoading(false) // Don't load data if no premium access
      }
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile, hasFeature])

  const loadInitialData = async () => {
    try {
      console.log('🏆 Loading family battle data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)
      
      // Load linked students
      await loadLinkedStudentsData(parentProfile.linkedStudents || [])
      
    } catch (error) {
      console.error('❌ Error loading family battle data:', error)
      setError('Failed to load family battle data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsData = async (linkedStudentIds) => {
    try {
      const students = []
      const entitiesSnapshot = await getDocs(collection(db, 'entities'))
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools`))
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools/${schoolId}/students`))
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              }
              students.push(studentData)
            }
          }
        }
      }
      
      setLinkedStudents(students)
      console.log('✅ Linked students loaded:', students.length)
      
      // Load battle data once students are loaded
      if (students.length > 0) {
        await loadFamilyBattleData()
      }
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
    }
  }

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false)
      }
    }

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu])

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <>
        <Head>
          <title>Family Battle - Lux Libris Parent</title>
          <meta name="description" content="Compete with your children in weekly family reading challenges" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        </Head>
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
            <p style={{ color: luxTheme.textPrimary }}>Loading family battle...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Family Battle - Lux Libris Parent</title>
          <meta name="description" content="Compete with your children in weekly family reading challenges" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        </Head>
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
            <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: luxTheme.primary,
                color: luxTheme.textPrimary,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris Parent</title>
        <meta name="description" content="Compete with your children in weekly family reading challenges" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px'
      }}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/parent/dashboard')}
            style={{
              position: 'absolute',
              left: '20px',
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
            ←
          </button>

          {/* Centered Title with Premium Badge */}
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <h1 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: '400',
              color: luxTheme.textPrimary,
              margin: '0',
              letterSpacing: '1px',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Family Battle
            </h1>
            {isPilotPhase && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-16px',
                backgroundColor: '#10B981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                PILOT
              </div>
            )}
          </div>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
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

            {/* Dropdown Menu */}
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
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNavigation(item)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
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
                        e.target.style.backgroundColor = `${luxTheme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
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

        {/* Main Content - Wrapped in Premium Gate */}
        <PremiumGate 
          feature="familyBattle"
          customMessage={isPilotPhase ? 
            "🏆 Premium Family Battle unlocked for pilot users!" :
            "Compete with your children in weekly reading challenges and motivate each other!"
          }
        >
          {/* Pilot Notice Banner */}
          {isPilotPhase && (
            <div style={{
              background: `linear-gradient(135deg, #10B981, #059669)`,
              borderRadius: '16px',
              padding: '16px',
              margin: '20px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 0 8px 0'
              }}>
                Premium Family Battle Unlocked!
              </h3>
              <p style={{
                fontSize: '12px',
                margin: 0,
                opacity: 0.9
              }}>
                You&apos;re part of our pilot - premium family reading competition is free during the trial!
              </p>
            </div>
          )}

          <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

            {/* Family Battle Dashboard - Full Feature */}
            {familyBattleData ? (
              <>
                {/* Header Card */}
                <div style={{
                  background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '20px',
                  boxShadow: `0 8px 24px ${luxTheme.primary}30`,
                  color: luxTheme.textPrimary,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    fontFamily: 'Didot, serif',
                    margin: '0 0 8px 0'
                  }}>
                    Weekly Family Reading Battle
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    margin: '0 0 16px 0',
                    opacity: 0.9,
                    lineHeight: '1.4'
                  }}>
                    Week {familyBattleData.weekNumber} • {new Date(familyBattleData.weekStarting).toLocaleDateString()}
                  </p>

                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    Winner: {familyBattleData.winner === 'parents' ? '👨‍👩 Parents' : '👧👦 Children'} 
                    {familyBattleData.lead > 0 && ` (+${familyBattleData.lead} min)`}
                    {familyBattleData.lead === 0 && ' (Tied!)'}
                  </div>
                </div>

                {/* Battle Dashboard */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {/* Parents Team */}
                  <div style={{
                    backgroundColor: familyBattleData.winner === 'parents' ? `${luxTheme.primary}30` : luxTheme.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    border: familyBattleData.winner === 'parents' ? `3px solid ${luxTheme.primary}` : '2px solid #E5E7EB',
                    boxShadow: familyBattleData.winner === 'parents' ? `0 8px 24px ${luxTheme.primary}30` : '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>👨‍👩</div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      Parents
                    </h3>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      {familyBattleData.parentMinutes}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      minutes this week
                    </div>
                    {familyBattleData.winner === 'parents' && (
                      <div style={{
                        backgroundColor: luxTheme.primary,
                        color: 'white',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        marginTop: '8px',
                        display: 'inline-block'
                      }}>
                        🎉 WINNING!
                      </div>
                    )}
                  </div>
                  
                  {/* Children Team */}
                  <div style={{
                    backgroundColor: familyBattleData.winner === 'children' ? '#10B98130' : luxTheme.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    border: familyBattleData.winner === 'children' ? '3px solid #10B981' : '2px solid #E5E7EB',
                    boxShadow: familyBattleData.winner === 'children' ? '0 8px 24px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>👧👦</div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      Children
                    </h3>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: luxTheme.textPrimary,
                      marginBottom: '4px'
                    }}>
                      {familyBattleData.childrenMinutes}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      minutes this week
                    </div>
                    {familyBattleData.winner === 'children' && (
                      <div style={{
                        backgroundColor: '#10B981',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        marginTop: '8px',
                        display: 'inline-block'
                      }}>
                        🎉 WINNING!
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Children Breakdown */}
                {familyBattleData.childrenDetails && familyBattleData.childrenDetails.length > 0 && (
                  <div style={{
                    backgroundColor: luxTheme.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 16px 0'
                    }}>
                      👧👦 Individual Progress
                    </h3>
                    
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {familyBattleData.childrenDetails.map((child, index) => (
                        <div key={index} style={{
                          backgroundColor: `${luxTheme.primary}10`,
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: luxTheme.textPrimary
                            }}>
                              {child.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: luxTheme.textSecondary
                            }}>
                              Grade {child.grade}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: luxTheme.textPrimary
                            }}>
                              {child.minutes}
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: luxTheme.textSecondary
                            }}>
                              minutes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Family Total & Motivation */}
                <div style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${luxTheme.primary}30`
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    📊 Family Reading Total
                  </h3>
                  
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: luxTheme.primary,
                    marginBottom: '8px'
                  }}>
                    {familyBattleData.totalMinutes} minutes
                  </div>
                  
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textSecondary,
                    margin: '0 0 16px 0'
                  }}>
                    Your family read together this week!
                  </p>

                  <div style={{
                    backgroundColor: `${luxTheme.primary}15`,
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    fontWeight: '500',
                    lineHeight: '1.4'
                  }}>
                    {familyBattleData.winner === 'parents' 
                      ? "🏆 Amazing leadership! You're showing your children how valuable reading is!"
                      : familyBattleData.winner === 'children'
                        ? "📚 The kids are motivating you! Time to read more and catch up!"
                        : "🤝 Perfect tie! You're all equally dedicated to reading!"
                    }
                  </div>
                </div>
              </>
            ) : (
              /* No Data Yet - Welcome Message */
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: `2px solid ${luxTheme.primary}40`
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚⚔️</div>
                
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: luxTheme.textPrimary,
                  marginBottom: '12px'
                }}>
                  Family Battle Ready!
                </h2>
                
                <p style={{
                  fontSize: '16px',
                  color: luxTheme.textSecondary,
                  marginBottom: '24px',
                  lineHeight: '1.5'
                }}>
                  Start reading sessions to see your family&apos;s weekly competition unfold! Both parents and children contribute to their team&apos;s total.
                </p>

                <div style={{
                  backgroundColor: `${luxTheme.primary}15`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 8px 0'
                  }}>
                    📊 How It Works:
                  </h4>
                  <ul style={{
                    fontSize: '12px',
                    color: luxTheme.textSecondary,
                    margin: 0,
                    paddingLeft: '20px',
                    textAlign: 'left',
                    lineHeight: '1.4'
                  }}>
                    <li>Parents compete against children each week</li>
                    <li>All reading minutes count toward your team</li>
                    <li>Competition resets every Monday</li>
                    <li>Motivate each other to read more!</li>
                  </ul>
                </div>

                <button
                  onClick={() => router.push('/parent/healthy-habits')}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  📚 Start Reading Session
                </button>
              </div>
            )}
          </div>

        </PremiumGate>

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: luxTheme.primary,
            color: luxTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1001,
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showSuccess}
          </div>
        )}

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
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          @media (max-width: 768px) {
            .nav-menu-container > div {
              right: 10px !important;
              min-width: 180px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}
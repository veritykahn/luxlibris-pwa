// pages/teacher/achievements.js - Updated with Lux Libris branding and achievement terminology
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePhaseAccess } from '../../hooks/usePhaseAccess'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { generateAwardsSpeech } from '../../lib/templates/speechTemplate'

export default function TeacherAchievements() {
  const router = useRouter()
  const { 
    user, 
    userProfile, 
    loading: authLoading, 
    isAuthenticated, 
    isSessionExpired, 
    signOut,
    updateLastActivity
  } = useAuth()

  const { 
    phaseData, 
    permissions, 
    hasAccess, 
    getPhaseMessage, 
    getPhaseInfo,
    refreshPhase,
    isLoading: phaseLoading 
  } = usePhaseAccess(userProfile)

  const [loading, setLoading] = useState(true)
  const [achievementTiers, setAchievementTiers] = useState([])
  const [studentAchievements, setStudentAchievements] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [showSuccess, setShowSuccess] = useState('')
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [expandedTiers, setExpandedTiers] = useState(new Set())
  const [allExpanded, setAllExpanded] = useState(false)

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return

      if (!isAuthenticated) {
        router.push('/sign-in')
        return
      }

      if (userProfile && !['teacher', 'admin'].includes(userProfile.accountType)) {
        router.push('/role-selector')
        return
      }

      if (userProfile?.accountType && ['teacher', 'admin'].includes(userProfile.accountType) && isSessionExpired()) {
        await signOut({ redirectTo: '/sign-in?reason=session-expired' })
        return
      }

      if (userProfile) {
        loadAchievementsData()
      }
    }

    checkAuth()
  }, [authLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

  // Session timeout checking
  useEffect(() => {
    if (!userProfile?.accountType || !['teacher', 'admin'].includes(userProfile.accountType)) return

    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        signOut({ redirectTo: '/sign-in?reason=session-expired' })
      } else {
        const warningTime = 55 * 60 * 1000
        const timeLeft = warningTime - (Date.now() - (parseInt(localStorage.getItem('luxlibris_last_activity')) || Date.now()))
        
        if (timeLeft <= 0 && timeLeft > -60000) {
          setShowTimeoutWarning(true)
        }
      }
    }, 60000)

    return () => clearInterval(sessionCheckInterval)
  }, [userProfile, isSessionExpired, signOut])

  // Activity tracking
  const handleUserActivity = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  useEffect(() => {
    document.addEventListener('click', handleUserActivity)
    document.addEventListener('keypress', handleUserActivity)

    return () => {
      document.removeEventListener('click', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [])

  // Load achievements data
  const loadAchievementsData = async () => {
    try {
      console.log('🏆 Loading achievements data...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing teacher profile data')
        setLoading(false)
        return
      }

      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        console.error('❌ Teacher document not found')
        setLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherData = teacherDoc.data()
      const teacherId = teacherDoc.id

      const tiers = teacherData.achievementTiers || []
      console.log('🎯 Achievement tiers:', tiers)
      setAchievementTiers(tiers)
      
      const selectedBooksCount = teacherData.selectedNominees?.length || 0
      console.log('📚 Teacher has selected', selectedBooksCount, 'books')
      
      window.totalBooksInProgram = selectedBooksCount

      const students = []
      const maxBookRequirement = Math.max(...tiers.map(tier => tier.books))

      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsQuery = query(appStudentsRef, where('currentTeacherId', '==', teacherId))
      const appStudentsSnapshot = await getDocs(appStudentsQuery)

      appStudentsSnapshot.forEach(doc => {
        const studentData = { id: doc.id, ...doc.data() }
        if (studentData.status !== 'deleted') {
          students.push({
            ...studentData,
            type: 'app',
            booksCompleted: studentData.booksSubmittedThisYear || 0,
            lifetimeBooksCompleted: studentData.lifetimeBooksSubmitted || 0,
            maxBookRequirement
          })
        }
      })

      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      let manualStudentsSnapshot = { docs: [] }
      try {
        manualStudentsSnapshot = await getDocs(manualStudentsRef)
      } catch (error) {
        console.log('No manual students collection yet')
      }

      manualStudentsSnapshot.forEach(doc => {
        const studentData = { id: doc.id, ...doc.data() }
        students.push({
          ...studentData,
          type: 'manual',
          booksCompleted: studentData.totalBooksThisYear || 0,
          lifetimeBooksCompleted: studentData.lifetimeBooksSubmitted || studentData.totalBooksThisYear || 0,
          maxBookRequirement
        })
      })

      console.log('📚 All students loaded:', students.length)
      setAllStudents(students)

      const achievements = calculateAchievements(tiers, students)
      setStudentAchievements(achievements)

    } catch (error) {
      console.error('❌ Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAchievements = (tiers, students) => {
    const maxBookRequirement = Math.max(...tiers.map(t => t.books))
    
    const achievements = tiers.map(tier => {
      const achievedStudents = students.filter(student => {
        const booksToCheck = tier.books === maxBookRequirement 
          ? student.lifetimeBooksCompleted 
          : student.booksCompleted
        return booksToCheck >= tier.books
      }).sort((a, b) => {
        if (b.booksCompleted !== a.booksCompleted) {
          return b.booksCompleted - a.booksCompleted
        }
        return a.firstName.localeCompare(b.firstName)
      })

      return {
        ...tier,
        achievedStudents,
        count: achievedStudents.length
      }
    })

    return achievements.sort((a, b) => a.books - b.books)
  }

  const getStudentsHighestAchievements = () => {
    const studentsWithHighestTier = new Map()
    
    const sortedAchievements = [...studentAchievements].sort((a, b) => b.books - a.books)
    
    sortedAchievements.forEach(achievement => {
      achievement.achievedStudents.forEach(student => {
        if (!studentsWithHighestTier.has(student.id)) {
          studentsWithHighestTier.set(student.id, {
            ...student,
            achievementTier: achievement
          })
        }
      })
    })
    
    return studentsWithHighestTier
  }

  const exportAchievements = () => {
    setIsExporting(true)
    
    try {
      const txtContent = generateTXT()
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${userProfile.schoolName || 'School'}_Achievements_${new Date().getFullYear()}.txt`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      setShowSuccess('✅ Achievements exported successfully!')
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error exporting achievements:', error)
      setShowSuccess('❌ Error exporting file. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  const generateTXT = () => {
    const currentDate = new Date().toLocaleDateString()
    const schoolName = userProfile.schoolName || 'School'
    const teacherName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
    
    let txt = `${'='.repeat(60)}\n`
    txt += `${schoolName.toUpperCase()} - READING ACHIEVEMENT REPORT\n`
    txt += `${'='.repeat(60)}\n\n`
    txt += `Teacher: ${teacherName}\n`
    txt += `Date Generated: ${currentDate}\n`
    txt += `Total Students: ${allStudents.length}\n\n`

    txt += `${'─'.repeat(60)}\n`
    txt += `ACHIEVEMENT SUMMARY - ACHIEVEMENT GUIDE\n`
    txt += `${'─'.repeat(60)}\n\n`
    
    txt += `ACHIEVEMENTS NEEDED BY TIER:\n\n`
    
    studentAchievements.forEach(achievement => {
      txt += `📚 ${achievement.books} Books - "${achievement.reward}": ${achievement.count} achievements earned\n`
    })

    txt += `\n${'─'.repeat(60)}\n`
    txt += `DETAILED ACHIEVEMENT ROSTER\n`
    txt += `(Students appear in ALL tiers they have achieved)\n`
    txt += `${'─'.repeat(60)}\n\n`

    studentAchievements.forEach(achievement => {
      if (achievement.count > 0) {
        txt += `\n🏆 ${achievement.reward.toUpperCase()} (${achievement.books} Books Required)\n`
        txt += `   ${achievement.count} Student${achievement.count !== 1 ? 's' : ''} Achieved\n`
        txt += `   ${'─'.repeat(40)}\n\n`
        
        achievement.achievedStudents.forEach((student, index) => {
          const studentType = student.type === 'app' ? '[App]' : '[Manual]'
          txt += `   ${(index + 1).toString().padStart(2)}. ${student.firstName} ${student.lastInitial}. `
          txt += `(Grade ${student.grade}) - ${student.booksCompleted} books completed ${studentType}\n`
        })
        txt += '\n'
      }
    })

    const noAchievements = allStudents.filter(student => 
      !studentAchievements.some(achievement => 
        achievement.achievedStudents.some(achieved => achieved.id === student.id)
      )
    )

    if (noAchievements.length > 0) {
      txt += `\n${'─'.repeat(60)}\n`
      txt += `STUDENTS WORKING TOWARD FIRST ACHIEVEMENT\n`
      txt += `${'─'.repeat(60)}\n\n`
      txt += `Total: ${noAchievements.length} students\n\n`
      
      noAchievements
        .sort((a, b) => {
          if (b.booksCompleted !== a.booksCompleted) {
            return b.booksCompleted - a.booksCompleted
          }
          return a.firstName.localeCompare(b.firstName)
        })
        .forEach((student, index) => {
          const studentType = student.type === 'app' ? '[App]' : '[Manual]'
          txt += `   ${(index + 1).toString().padStart(2)}. ${student.firstName} ${student.lastInitial}. `
          txt += `(Grade ${student.grade}) - ${student.booksCompleted} books completed ${studentType}\n`
        })
    }

    txt += `\n${'='.repeat(60)}\n`
    txt += `TOTAL ACHIEVEMENTS:\n`
    txt += `${'='.repeat(60)}\n\n`
    
    let totalAchievements = 0
    studentAchievements.forEach(achievement => {
      if (achievement.count > 0) {
        txt += `${achievement.reward}: ${achievement.count} achievements\n`
        totalAchievements += achievement.count
      }
    })
    
    txt += `\nTOTAL: ${totalAchievements} achievements\n`

    txt += `\n${'='.repeat(60)}\n`
    txt += `END OF REPORT\n`
    txt += `${'='.repeat(60)}\n`

    return txt
  }

  const exportSpeechForMass = () => {
    setIsExporting(true)
    
    try {
      const speechContent = generateSpeech()
      const blob = new Blob([speechContent], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${userProfile.schoolName || 'School'}_Awards_Speech_${new Date().getFullYear()}.txt`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      setShowSuccess('✅ Awards speech exported successfully!')
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error exporting speech:', error)
      setShowSuccess('❌ Error exporting speech. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  const generateSpeech = () => {
    const currentDate = new Date().toLocaleDateString()
    const schoolName = userProfile.schoolName || 'School'
    
    const studentsHighestAchievements = getStudentsHighestAchievements()
    
    const tiersWithHighestOnly = studentAchievements.map(achievement => {
      const studentsInThisTier = []
      studentsHighestAchievements.forEach((studentData) => {
        if (studentData.achievementTier.books === achievement.books) {
          studentsInThisTier.push(studentData)
        }
      })
      
      return {
        ...achievement,
        highestTierStudents: studentsInThisTier.sort((a, b) => 
          a.firstName.localeCompare(b.firstName)
        )
      }
    })

    const totalBooksInProgram = window.totalBooksInProgram || 50
    const maxBookRequirement = Math.max(...achievementTiers.map(t => t.books))
    
    return generateAwardsSpeech(
      schoolName,
      currentDate,
      totalBooksInProgram,
      tiersWithHighestOnly,
      maxBookRequirement
    )
  }
  
  const toggleTierExpansion = (tierIndex) => {
    const newExpanded = new Set(expandedTiers)
    if (newExpanded.has(tierIndex)) {
      newExpanded.delete(tierIndex)
    } else {
      newExpanded.add(tierIndex)
    }
    setExpandedTiers(newExpanded)
  }
  
  const toggleAllTiers = () => {
    if (allExpanded) {
      setExpandedTiers(new Set())
      setAllExpanded(false)
    } else {
      const allIndices = studentAchievements.map((_, index) => index)
      setExpandedTiers(new Set(allIndices))
      setAllExpanded(true)
    }
  }

  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
  }

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    await refreshPhase()
    await loadAchievementsData()
    setShowSuccess('🔄 Data refreshed!')
    setTimeout(() => setShowSuccess(''), 2000)
  }

  if (authLoading || loading || phaseLoading || !userProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #C3E0DE',
            borderTop: '4px solid #223848',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ 
            color: '#223848', 
            fontSize: '1.1rem',
            fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
          }}>
            Loading achievements...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile || !['teacher', 'admin'].includes(userProfile.accountType)) {
    return null
  }

  return (
    <>
      <Head>
        <title>Student Achievements - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        paddingBottom: '80px'
      }}>

        {/* Session Timeout Warning Modal */}
        {showTimeoutWarning && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏰</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                Session Expiring Soon
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.4',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                Your session will expire in a few minutes for security. Continue working?
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleTimeoutSignOut}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  Sign Out
                </button>
                <button
                  onClick={extendSession}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  Continue Working
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(195, 224, 222, 0.3)',
          padding: '1rem 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem'
            }}>
              <button
                onClick={() => router.push('/admin/school-dashboard')}
                style={{
                  backgroundColor: 'rgba(195, 224, 222, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#223848'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, "Times New Roman", serif'
                }}>
                  Student Achievements
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}>
                  Track reading milestones and export for awards
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(173, 212, 234, 0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#223848',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                <span>{getPhaseInfo().icon}</span>
                <span>{phaseData.currentPhase}</span>
              </div>
              
              <button
                onClick={handleManualRefresh}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(173, 212, 234, 0.2)',
                  color: '#223848',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                title="Refresh data"
              >
                🔄
              </button>
              
              <button
                onClick={exportSpeechForMass}
                disabled={isExporting || studentAchievements.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #9333EA, #7C3AED)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (isExporting || studentAchievements.length === 0) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              >
                {isExporting ? '⏳' : '🎤'} Speech
              </button>
              
              <button
                onClick={exportAchievements}
                disabled={isExporting || studentAchievements.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (isExporting || studentAchievements.length === 0) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              >
                {isExporting ? '⏳' : '📥'} Report
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(173, 212, 234, 0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#223848',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                <span>{userProfile.firstName || 'Teacher'}</span>
              </div>
              <button 
                onClick={() => signOut()}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem'
        }}>

          {/* Overview Stats */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                🏆 Achievement Overview
              </h2>
              {studentAchievements.length > 0 && (
                <button
                  onClick={toggleAllTiers}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#223848',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                  }}
                >
                  {allExpanded ? '➖ Collapse All Tiers' : '➕ Expand All Tiers'}
                </button>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <OverviewCard
                icon="👥"
                title="Total Students"
                value={allStudents.length}
                subtitle="In your class"
                color="#ADD4EA"
              />
              <OverviewCard
                icon="🎯"
                title="Achievement Levels"
                value={achievementTiers.length}
                subtitle="Configured rewards"
                color="#C3E0DE"
              />
              <OverviewCard
                icon="⭐"
                title="Students with Awards"
                value={allStudents.filter(student => 
                  studentAchievements.some(achievement => 
                    achievement.achievedStudents.some(achieved => achieved.id === student.id)
                  )
                ).length}
                subtitle="Have earned achievements"
                color="#A1E5DB"
              />
              <OverviewCard
                icon="📊"
                title="Average Books"
                value={allStudents.length > 0 ? 
                  Math.round(allStudents.reduce((sum, student) => sum + student.booksCompleted, 0) / allStudents.length) : 0}
                subtitle="Per student"
                color="#B6DFEB"
              />
            </div>
          </div>

          {/* Phase-aware Achievement Display */}
          {phaseData.currentPhase === 'TEACHER_SELECTION' && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '2px solid #F59E0B'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#92400E', 
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                New Year Setup in Progress
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#B45309', 
                marginBottom: '1rem',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {getPhaseMessage()}
              </p>
              <button
                onClick={() => router.push('/teacher/settings')}
                style={{
                  background: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}
              >
                Configure Achievements
              </button>
            </div>
          )}

          {phaseData.currentPhase === 'VOTING' && (
            <div style={{
              background: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '2px solid #6366F1'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#4338CA', 
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Achievement Year Complete
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#5B21B6', 
                marginBottom: '1rem',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {getPhaseMessage()}
              </p>
            </div>
          )}

          {phaseData.currentPhase === 'RESULTS' && (
            <div style={{
              background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '2px solid #10B981'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#047857', 
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Final Achievement Results
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#065F46', 
                marginBottom: '1rem',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {getPhaseMessage()}
              </p>
            </div>
          )}

          {phaseData.currentPhase === 'SETUP' && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '2px solid #F59E0B'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#92400E', 
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                System Setup Mode
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#B45309', 
                marginBottom: '1rem',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {getPhaseMessage()}
              </p>
            </div>
          )}

          {phaseData.currentPhase === 'CLOSED' && (
            <div style={{
              background: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '2px solid #6B7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❄️</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Program Closed
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6B7280', 
                marginBottom: '1rem',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {getPhaseMessage()}
              </p>
            </div>
          )}

          {/* Achievement Levels */}
          {studentAchievements.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '0.5rem',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                No Achievement Data
              </h3>
              <p style={{ 
                color: '#6b7280',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                Achievement tiers will appear here once configured during teacher onboarding.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {studentAchievements.map((achievement, index) => (
                <AchievementLevelCard
                  key={index}
                  achievement={achievement}
                  index={index}
                  isExpanded={expandedTiers.has(index)}
                  onToggle={() => toggleTierExpansion(index)}
                />
              ))}
            </div>
          )}

        </div>

        {/* Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '8px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard', active: false },
            { id: 'students', icon: '👥', label: 'Students', active: false },
            { id: 'submissions', icon: '📋', label: 'Submissions', active: false },
            { id: 'achievements', icon: '🏆', label: 'Achievements', active: true },
            { id: 'settings', icon: '⚙️', label: 'Settings', active: false }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'dashboard') router.push('/admin/school-dashboard')
                else router.push(`/teacher/${tab.id}`)
              }}
              style={{
                background: tab.active 
                  ? `linear-gradient(135deg, #ADD4EA15, #ADD4EA25)`
                  : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                color: tab.active ? '#ADD4EA' : '#6b7280',
                transition: 'all 0.2s ease',
                position: 'relative',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}
            >
              <span style={{ 
                fontSize: '20px',
                filter: tab.active ? 'none' : 'opacity(0.7)'
              }}>
                {tab.icon}
              </span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: tab.active ? '600' : '500'
              }}>
                {tab.label}
              </span>
              {tab.active && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#ADD4EA',
                  borderRadius: '50%'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '85vw',
            textAlign: 'center',
            fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}

// Supporting Components
function OverviewCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      border: `2px solid ${color}20`,
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <div style={{
          width: '2rem',
          height: '2rem',
          background: `${color}15`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '60%',
            height: '60%',
            background: color,
            borderRadius: '50%'
          }}></div>
        </div>
      </div>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 0.25rem 0',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        {value}
      </h3>
      <p style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        margin: 0,
        fontWeight: '600',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '0.65rem',
        color: '#9ca3af',
        margin: '0.125rem 0 0 0',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        {subtitle}
      </p>
    </div>
  )
}

function AchievementLevelCard({ achievement, index, isExpanded, onToggle }) {
  const tierColors = ['#FFB366', '#ADD4EA', '#C3E0DE', '#A1E5DB', '#B6DFEB']
  const tierIcons = ['🥉', '🥈', '🥇', '🏆', '⭐']
  const color = tierColors[index % tierColors.length]
  const icon = tierIcons[index % tierIcons.length]

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: `2px solid ${color}30`,
      overflow: 'hidden'
    }}>
      <div 
        onClick={onToggle}
        style={{
          padding: '1.5rem',
          cursor: 'pointer',
          background: isExpanded ? `${color}08` : 'white',
          transition: 'background 0.2s'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}>
              ▶
            </div>
            
            <div style={{
              width: '3rem',
              height: '3rem',
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {icon}
            </div>
            
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                {achievement.reward}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0,
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {achievement.books} book{achievement.books !== 1 ? 's' : ''} required
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              background: `${color}15`,
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#223848',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                {achievement.count}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                student{achievement.count !== 1 ? 's' : ''}
              </span>
            </div>
            <span style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              fontStyle: 'italic',
              fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
            }}>
              Click to {isExpanded ? 'collapse' : 'expand'}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{
          padding: '0 1.5rem 1.5rem 1.5rem',
          borderTop: `1px solid ${color}20`
        }}>
          {achievement.count === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280',
              fontStyle: 'italic',
              fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
            }}>
              No students have achieved this level yet
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 1fr 1fr 100px',
                gap: '1rem',
                padding: '0.75rem 0',
                borderBottom: `2px solid ${color}20`,
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
              }}>
                <div>#</div>
                <div>Student Name</div>
                <div>Grade</div>
                <div>Books Read</div>
                <div>Type</div>
              </div>
              
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {achievement.achievedStudents.map((student, idx) => (
                  <div
                    key={`${student.type}-${student.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 2fr 1fr 1fr 100px',
                      gap: '1rem',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid #f3f4f6',
                      alignItems: 'center',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div style={{
                      color: '#9ca3af',
                      fontWeight: '500',
                      fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{
                      fontWeight: '600',
                      color: '#223848',
                      fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                    }}>
                      {student.firstName} {student.lastInitial}.
                    </div>
                    <div style={{
                      color: '#6b7280',
                      fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                    }}>
                      Grade {student.grade}
                    </div>
                    <div style={{
                      color: '#223848',
                      fontWeight: '600',
                      fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                    }}>
                      {student.booksCompleted}
                    </div>
                    <div>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: student.type === 'app' ? '#ADD4EA20' : '#C3E0DE20',
                        color: '#223848',
                        borderRadius: '0.25rem',
                        fontWeight: '600',
                        border: `1px solid ${student.type === 'app' ? '#ADD4EA' : '#C3E0DE'}`,
                        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                      }}>
                        {student.type === 'app' ? 'APP' : 'MANUAL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {achievement.count > 10 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: `${color}08`,
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
                }}>
                  <span>Total: {achievement.count} students</span>
                  <span>
                    App: {achievement.achievedStudents.filter(s => s.type === 'app').length} | 
                    Manual: {achievement.achievedStudents.filter(s => s.type === 'manual').length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
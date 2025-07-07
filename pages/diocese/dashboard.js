// pages/diocese/dashboard.js - ENHANCED DIOCESE DASHBOARD WITH PROGRAM MANAGEMENT
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { db, authHelpers } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore'

// Import program functions
import { 
  getAllActivePrograms,
  getProgramsByIds,
  getTierDisplayInfo,
  calculateProgramPricing
} from '../../setup-programs'

export default function DioceseDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  // Authentication
  const [authData, setAuthData] = useState({
    accessCode: '',
    password: '',
    isAuthenticated: false
  })
  
  // Diocese Data & Schools
  const [dioceseData, setDioceseData] = useState(null)
  const [schools, setSchools] = useState([])
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  const [usageStats, setUsageStats] = useState({
    totalSchools: 0,
    tierLimit: 15,
    remaining: 15
  })

  // Program Management State
  const [availablePrograms, setAvailablePrograms] = useState([])
  const [diocesePrograms, setDiocesePrograms] = useState([])
  const [programStats, setProgramStats] = useState({
    totalPrograms: 0,
    includedPrograms: 0,
    extraPrograms: 0,
    totalCost: 0
  })

  // Password Change
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Session timeout (2 hours = 7200000 ms)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // Load program data when diocese data is loaded
  useEffect(() => {
    if (dioceseData && dioceseData.selectedPrograms) {
      loadProgramData()
    }
  }, [dioceseData])

  // Load program data
  const loadProgramData = async () => {
    try {
      // Load all available programs
      const allPrograms = await getAllActivePrograms()
      setAvailablePrograms(allPrograms)

      // Load diocese's specific programs
      if (dioceseData.selectedPrograms && dioceseData.selectedPrograms.length > 0) {
        const dioceseSelectedPrograms = await getProgramsByIds(dioceseData.selectedPrograms)
        setDiocesePrograms(dioceseSelectedPrograms)

        // Calculate program statistics
        const tierInfo = getTierDisplayInfo(dioceseData.tier)
        const pricing = calculateProgramPricing(
          dioceseData.tier, 
          dioceseData.selectedPrograms.length,
          dioceseData.customProgramOverride,
          dioceseData.customMaxPrograms
        )

        setProgramStats({
          totalPrograms: dioceseData.selectedPrograms.length,
          includedPrograms: Math.min(dioceseData.selectedPrograms.length, tierInfo?.maxPrograms || 1),
          extraPrograms: Math.max(0, dioceseData.selectedPrograms.length - (tierInfo?.maxPrograms || 1)),
          totalCost: pricing.totalPrice,
          extraCost: pricing.breakdown.extraLists,
          pricePerExtra: pricing.pricePerExtraList
        })
      }
      
      console.log('✅ Program data loaded successfully')
    } catch (error) {
      console.error('Error loading program data:', error)
    }
  }

  // Initialize session from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('dioceseSession')
    if (savedSession) {
      const sessionData = JSON.parse(savedSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT && sessionData.dioceseData) {
        setAuthData({ 
          accessCode: sessionData.accessCode || '',
          password: '',
          isAuthenticated: true 
        })
        setDioceseData(sessionData.dioceseData)
        setLastActivity(sessionData.lastActivity)
        loadDioceseData(sessionData.dioceseData.id)
      } else {
        localStorage.removeItem('dioceseSession')
      }
    }
  }, [])

  // Save session to localStorage whenever authentication changes
  useEffect(() => {
    if (authData.isAuthenticated && dioceseData) {
      localStorage.setItem('dioceseSession', JSON.stringify({
        authenticated: true,
        accessCode: authData.accessCode,
        dioceseData: dioceseData,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('dioceseSession')
    }
  }, [authData.isAuthenticated, dioceseData, lastActivity])

  // Check session timeout
  useEffect(() => {
    if (!authData.isAuthenticated) return

    const checkSession = () => {
      const now = Date.now()
      const timeRemaining = SESSION_TIMEOUT - (now - lastActivity)
      const minutesRemaining = Math.max(0, Math.round(timeRemaining / 60000))
      
      setSessionTimeRemaining(minutesRemaining)
      
      if (timeRemaining <= 0) {
        alert('Session expired after 2 hours. Please sign in again.')
        handleLogout()
        return
      }
    }

    // Check every minute
    const interval = setInterval(checkSession, 60000)
    checkSession() // Initial check
    
    return () => clearInterval(interval)
  }, [authData.isAuthenticated, lastActivity])

  // Update activity on user interactions
  useEffect(() => {
    if (!authData.isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      // Update localStorage immediately
      if (dioceseData) {
        localStorage.setItem('dioceseSession', JSON.stringify({
          authenticated: true,
          accessCode: authData.accessCode,
          dioceseData: dioceseData,
          lastActivity: newActivity
        }))
      }
    }
    
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    events.forEach(event => 
      document.addEventListener(event, updateActivity, true)
    )

    return () => {
      events.forEach(event => 
        document.removeEventListener(event, updateActivity, true)
      )
    }
  }, [authData.isAuthenticated, dioceseData])

  const handleDioceseAuth = async () => {
    if (!authData.accessCode || !authData.password) {
      alert('Please enter both access code and password')
      return
    }

    setLoading(true)
    try {
      console.log('🔐 Authenticating diocese...')
      console.log('🔑 Access Code:', authData.accessCode)

      // Find diocese by access code
      const diocese = await findDioceseByAccessCode(authData.accessCode.toUpperCase())
      if (!diocese) {
        alert('Diocese not found with that access code')
        setLoading(false)
        return
      }

      // Verify password (in production, this should be hashed comparison)
      if (diocese.passwordHash !== authData.password) {
        alert('Incorrect password')
        setLoading(false)
        return
      }

      console.log('✅ Diocese authenticated:', diocese.name)
      
      // Set diocese data and update last activity
      const now = Date.now()
      setDioceseData(diocese)
      setAuthData(prev => ({ ...prev, isAuthenticated: true }))
      setLastActivity(now)
      
      // Save to localStorage
      localStorage.setItem('dioceseSession', JSON.stringify({
        authenticated: true,
        accessCode: authData.accessCode,
        dioceseData: diocese,
        lastActivity: now
      }))
      
      // Load diocese schools and stats
      await loadDioceseData(diocese.id)

    } catch (error) {
      console.error('Diocese auth error:', error)
      alert('Authentication failed. Please check your credentials.')
    }
    setLoading(false)
  }

  // Find diocese by access code
  const findDioceseByAccessCode = async (accessCode) => {
    try {
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityData = entityDoc.data()
        if (entityData.accessCode === accessCode && (entityData.type === 'diocese' || entityData.type === 'isd')) {
          return {
            id: entityDoc.id,
            ...entityData
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error finding diocese:', error)
      return null
    }
  }

  // Load diocese data
  const loadDioceseData = async (dioceseId) => {
    try {
      // Load schools under this diocese from entities subcollection
      const schoolsRef = collection(db, `entities/${dioceseId}/schools`)
      const schoolsSnapshot = await getDocs(schoolsRef)
      const schoolsData = []
      
      schoolsSnapshot.forEach((doc) => {
        schoolsData.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setSchools(schoolsData)
      
      // Calculate usage stats with proper null checks
      console.log('📊 Loading fresh diocese data for tier limits...')
      
      // Get fresh diocese data to ensure we have current maxSubEntities
      const freshDioceseDoc = await getDoc(doc(db, 'entities', dioceseId))
      const freshDioceseData = freshDioceseDoc.exists() ? freshDioceseDoc.data() : dioceseData
      
      const maxEntities = freshDioceseData?.maxSubEntities || dioceseData?.maxSubEntities || 15
      console.log('📊 Diocese data:', freshDioceseData)
      console.log('📊 Max entities (tier limit):', maxEntities)
      console.log('📊 Schools found:', schoolsData.length)
      
      const stats = {
        totalSchools: schoolsData.length,
        activeSchools: schoolsData.filter(s => s.status === 'active').length,
        totalTeachers: schoolsData.reduce((sum, s) => sum + (s.teacherCount || 0), 0),
        totalStudents: schoolsData.reduce((sum, s) => sum + (s.studentCount || 0), 0),
        tierLimit: maxEntities,
        remaining: Math.max(0, maxEntities - schoolsData.length)
      }
      
      console.log('📊 Final usage stats:', stats)
      setUsageStats(stats)
      
      // Update the diocese entity with current school count
      try {
        await updateDoc(doc(db, 'entities', dioceseId), {
          currentSubEntities: schoolsData.length,
          lastModified: new Date()
        })
      } catch (error) {
        console.log('Could not update diocese school count:', error)
      }
      
    } catch (error) {
      console.error('Error loading diocese data:', error)
    }
  }

  // Change password
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in both password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    try {
      setLoading(true)
      
      // Update password in entities collection
      await updateDoc(doc(db, 'entities', dioceseData.id), {
        passwordHash: newPassword,
        lastModified: new Date()
      })
      
      // Update local diocese data
      const updatedDioceseData = {
        ...dioceseData,
        passwordHash: newPassword
      }
      setDioceseData(updatedDioceseData)
      
      // Update localStorage
      localStorage.setItem('dioceseSession', JSON.stringify({
        authenticated: true,
        accessCode: authData.accessCode,
        dioceseData: updatedDioceseData,
        lastActivity: lastActivity
      }))
      
      alert('Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
      
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Error changing password: ' + error.message)
    }
    setLoading(false)
  }

  // Delete school
  const handleDeleteSchool = async (schoolId, schoolName) => {
    const confirmed = window.confirm(`⚠️ DELETE SCHOOL?

This will permanently delete:
• School: ${schoolName}
• ALL teachers in this school
• ALL students in this school
• ALL data associated with this school

This action CANNOT be undone!

Click OK to confirm deletion.`)
    
    if (confirmed) {
      try {
        setLoading(true)
        console.log('🗑️ Deleting school:', schoolName)
        
        // Delete the school document from entities subcollection
        await deleteDoc(doc(db, `entities/${dioceseData.id}/schools`, schoolId))
        
        console.log('✅ School deleted successfully')
        alert(`School "${schoolName}" has been deleted.`)
        
        // Reload data
        await loadDioceseData(dioceseData.id)
      } catch (error) {
        console.error('❌ Error deleting school:', error)
        alert('Error deleting school: ' + error.message)
      }
      setLoading(false)
    }
  }

  // Logout function
  const handleLogout = () => {
    setAuthData({ accessCode: '', password: '', isAuthenticated: false })
    setDioceseData(null)
    setSchools([])
    localStorage.removeItem('dioceseSession')
    setLastActivity(Date.now())
  }

  // Authentication Screen
  if (!authData.isAuthenticated) {
    return (
      <>
        <Head>
          <title>Diocese Dashboard - Authentication</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          background: '#FFFCF5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #C3E0DE',
            boxShadow: '0 10px 25px rgba(34, 56, 72, 0.1)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #223848, #ADD4EA)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              ⛪
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '300',
              color: '#223848',
              margin: '0 0 0.5rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Diocese Dashboard
            </h1>
            <p style={{
              color: '#ADD4EA',
              marginBottom: '2rem',
              fontFamily: 'Avenir',
              letterSpacing: '1.2px'
            }}>
              Diocese Administrator Access
            </p>
            
            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#223848',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Diocese Access Code
              </label>
              <input
                type="text"
                placeholder="TXAUSTIN-DIOCESE-2025"
                value={authData.accessCode}
                onChange={(e) => setAuthData(prev => ({ ...prev, accessCode: e.target.value.toUpperCase() }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #C3E0DE',
                  background: '#FFFCF5',
                  color: '#223848',
                  fontSize: '1rem',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  boxSizing: 'border-box',
                  fontFamily: 'Avenir'
                }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#223848',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Diocese Password
              </label>
              <input
                type="password"
                placeholder="Password provided by Lux Libris LLC"
                value={authData.password}
                onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleDioceseAuth()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #C3E0DE',
                  background: '#FFFCF5',
                  color: '#223848',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'Avenir'
                }}
              />
            </div>

            <button
              onClick={handleDioceseAuth}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: loading 
                  ? '#B6DFEB' 
                  : 'linear-gradient(135deg, #223848, #ADD4EA)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}
            >
              {loading && (
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              )}
              {loading ? 'Authenticating...' : '🚀 Access Diocese Dashboard'}
            </button>

            <div style={{
              background: '#C3E0DE',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginTop: '1.5rem'
            }}>
              <p style={{
                color: '#223848',
                fontSize: '0.875rem',
                margin: 0,
                lineHeight: '1.4',
                fontFamily: 'Avenir'
              }}>
                ⛪ <strong>Diocese Access:</strong> These credentials were provided when your diocese was created by Lux Libris LLC.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Main Dashboard
  return (
    <>
      <Head>
        <title>{dioceseData?.name} - Diocese Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: '#FFFCF5',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #C3E0DE',
          padding: '1rem 0',
          boxShadow: '0 2px 10px rgba(34, 56, 72, 0.05)'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #223848, #ADD4EA)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                ⛪
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                  fontWeight: '300',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, Georgia, serif',
                  letterSpacing: '1.2px'
                }}>
                  {dioceseData?.name}
                </h1>
                <p style={{
                  color: '#ADD4EA',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}>
                  Diocese Management Dashboard
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Session Timer */}
              <div style={{
                padding: '0.25rem 0.5rem',
                background: sessionTimeRemaining <= 10 
                  ? '#FED7D7' 
                  : '#C3E0DE',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: sessionTimeRemaining <= 10 ? '#E53E3E' : '#223848',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                ⏰ {sessionTimeRemaining}m
              </div>
              
              <button 
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg, #E53E3E, #C53030)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
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
          padding: '2rem 1.5rem'
        }}>
          
          {/* Diocese Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard 
              title="School Capacity" 
              value={`${usageStats.totalSchools}/${usageStats.tierLimit}`} 
              subtitle={`${usageStats.remaining} slots remaining`}
              icon="🏫" 
              color="#223848"
              warning={usageStats.remaining <= 2}
            />
            <StatCard 
              title="Active Schools" 
              value={schools.filter(s => s.status === 'active').length} 
              subtitle="Currently running"
              icon="✅" 
              color="#A1E5DB"
            />
            <StatCard 
              title="Teachers" 
              value={schools.reduce((sum, s) => sum + (s.teacherCount || 0), 0)} 
              subtitle="Across all schools"
              icon="👨‍🏫" 
              color="#ADD4EA"
            />
            <StatCard 
              title="Students" 
              value={schools.reduce((sum, s) => sum + (s.studentCount || 0), 0)} 
              subtitle="Total enrollment"
              icon="🎓" 
              color="#B6DFEB"
            />
          </div>

          {/* NEW: Program Management Section */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #C3E0DE',
            boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              color: '#223848',
              marginBottom: '1.5rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Your Active Reading Programs
            </h2>

            {/* Program Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <ProgramOverviewCard 
                title="Total Programs"
                value={programStats.totalPrograms}
                subtitle={`${programStats.includedPrograms} included + ${programStats.extraPrograms} extra`}
                icon="📚"
                color="#223848"
              />
              <ProgramOverviewCard 
                title="Annual Cost"
                value={`$${programStats.totalCost.toLocaleString()}`}
                subtitle={programStats.extraCost > 0 ? `+$${programStats.extraCost} for extra programs` : 'Base tier pricing'}
                icon="💰"
                color="#A1E5DB"
              />
              <ProgramOverviewCard 
                title="Tier Level"
                value={dioceseData?.tier?.toUpperCase() || 'MEDIUM'}
                subtitle={`Max ${getTierDisplayInfo(dioceseData?.tier)?.maxPrograms || 2} programs included`}
                icon="🎯"
                color="#ADD4EA"
              />
            </div>

            {/* Active Programs List */}
            <div style={{
              background: '#C3E0DE',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#223848',
                marginBottom: '0.75rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Active Programs ({diocesePrograms.length})
              </h3>
              
              {diocesePrograms.length === 0 ? (
                <p style={{
                  color: '#223848',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir'
                }}>
                  📚 Using default Lux Libris program
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {diocesePrograms.map((program, index) => {
                    const isIncluded = index < (getTierDisplayInfo(dioceseData?.tier)?.maxPrograms || 1)
                    return (
                      <div key={program.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'white',
                        borderRadius: '0.375rem',
                        border: `1px solid ${isIncluded ? '#A1E5DB' : '#F6AD55'}`
                      }}>
                        <div>
                          <span style={{
                            fontWeight: '600',
                            color: '#223848',
                            fontFamily: 'Avenir'
                          }}>
                            {program.icon} {program.name}
                          </span>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#ADD4EA',
                            fontFamily: 'Avenir'
                          }}>
                            {program.targetAudience} • {program.targetGrades?.join(', ')}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: isIncluded ? '#A1E5DB' : '#F6AD55',
                          fontFamily: 'Avenir'
                        }}>
                          {isIncluded ? 'INCLUDED' : `+$${programStats.pricePerExtra}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Program Analytics */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#ADD4EA',
              borderRadius: '0.5rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#223848',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                📊 Program Usage Analytics
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                fontSize: '0.875rem',
                fontFamily: 'Avenir'
              }}>
                <div>
                  <div style={{ color: '#223848', fontWeight: '600' }}>Schools Using Programs</div>
                  <div style={{ color: '#223848' }}>{schools.length} of {schools.length} schools</div>
                </div>
                <div>
                  <div style={{ color: '#223848', fontWeight: '600' }}>Teachers Enabled</div>
                  <div style={{ color: '#223848' }}>{schools.reduce((sum, s) => sum + (s.teacherCount || 0), 0)} teachers</div>
                </div>
                <div>
                  <div style={{ color: '#223848', fontWeight: '600' }}>Students Enrolled</div>
                  <div style={{ color: '#223848' }}>{schools.reduce((sum, s) => sum + (s.studentCount || 0), 0)} students</div>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Warning */}
          {usageStats && usageStats.totalSchools > 0 && usageStats.remaining <= 2 && (
            <div style={{
              background: '#FED7D7',
              border: '1px solid #E53E3E',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#E53E3E',
                fontSize: '0.875rem',
                margin: 0,
                fontWeight: '600',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                🚨 Almost at capacity! Contact Dr. Kahn to upgrade your tier before adding more schools.
              </p>
            </div>
          )}

          {/* Password Change Section */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #C3E0DE',
            boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: showPasswordChange ? '1.5rem' : '0'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '300',
                color: '#223848',
                margin: 0,
                fontFamily: 'Didot, Georgia, serif',
                letterSpacing: '1.2px'
              }}>
                Security Settings
              </h2>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                style={{
                  background: 'linear-gradient(135deg, #F6AD55, #ED8936)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}
              >
                {showPasswordChange ? '❌ Cancel' : '🔒 Change Password'}
              </button>
            </div>

            {showPasswordChange && (
              <div style={{
                background: '#FFFCF5',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #C3E0DE'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#223848',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      New Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #C3E0DE',
                        background: 'white',
                        color: '#223848',
                        fontSize: '1rem',
                        fontFamily: 'Avenir'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#223848',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #C3E0DE',
                        background: 'white',
                        color: '#223848',
                        fontSize: '1rem',
                        fontFamily: 'Avenir'
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  style={{
                    background: loading ? '#B6DFEB' : 'linear-gradient(135deg, #A1E5DB, #68D391)',
                    color: '#223848',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir',
                    letterSpacing: '1.2px'
                  }}
                >
                  {loading ? '⏳ Updating...' : '✅ Change Password'}
                </button>
              </div>
            )}
          </div>

          {/* Principal Join Code Display */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #C3E0DE',
            boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Principal Join Code
            </h2>
            <p style={{
              color: '#ADD4EA',
              marginBottom: '1.5rem',
              fontSize: '1rem',
              fontFamily: 'Avenir'
            }}>
              Share this ONE code with ALL principals in your {dioceseData?.type || 'diocese'}:
            </p>
            <div style={{
              background: '#C3E0DE',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '2px solid #ADD4EA',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '0.5rem',
                letterSpacing: '0.1em',
                fontFamily: 'Avenir'
              }}>
                {dioceseData?.principalJoinCode || 'Loading...'}
              </div>
              <div style={{
                color: '#223848',
                fontSize: '0.875rem',
                fontFamily: 'Avenir'
              }}>
                All principals use this same code to self-register their schools
              </div>
            </div>
            
            {/* Email Template Button */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Lux Libris Registration - ${dioceseData?.name}`)
                  const body = encodeURIComponent(`Dear Principal,

Your school has been invited to join our Lux Libris reading program!

Registration Instructions:
1. Go to: luxlibris.org/school/signup
2. Enter this join code: ${dioceseData?.principalJoinCode}
3. Use your email and create a password
4. Enter your school name and last name
5. Your school will be automatically set up!

After registration, you'll receive your unique school dashboard access to manage teachers and students.

If you have any questions, please don't hesitate to contact us.

Best regards,
${dioceseData?.name} Administration`)
                  
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
                }}
                style={{
                  background: 'linear-gradient(135deg, #A1E5DB, #68D391)',
                  color: '#223848',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}
              >
                📧 Email Template
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dioceseData?.principalJoinCode || '')
                  alert('Principal join code copied to clipboard!')
                }}
                style={{
                  background: 'linear-gradient(135deg, #ADD4EA, #B6DFEB)',
                  color: '#223848',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}
              >
                📋 Copy Code
              </button>
            </div>
          </div>

          {/* Schools List */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #C3E0DE',
            boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '300',
                color: '#223848',
                margin: 0,
                fontFamily: 'Didot, Georgia, serif',
                letterSpacing: '1.2px'
              }}>
                Schools in {dioceseData?.name} ({schools.length})
              </h2>
              
              <button
                onClick={async () => {
                  setLoading(true)
                  await loadDioceseData(dioceseData.id)
                  setLoading(false)
                }}
                disabled={loading}
                style={{
                  background: loading 
                    ? '#B6DFEB' 
                    : 'linear-gradient(135deg, #223848, #ADD4EA)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}
              >
                {loading && (
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                🔄 {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {schools.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#ADD4EA'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
                <h3 style={{ color: '#223848', marginBottom: '0.5rem', fontSize: '1.25rem', fontFamily: 'Didot, Georgia, serif' }}>
                  No schools registered yet
                </h3>
                <p style={{ fontSize: '1rem', marginBottom: '1rem', fontFamily: 'Avenir' }}>
                  Principals will appear here when they create accounts with your join code
                </p>
                <div style={{
                  background: '#C3E0DE',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}>
                  <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: '1.4', color: '#223848', fontFamily: 'Avenir' }}>
                    💡 <strong>Tip:</strong> Email the principal join code above to your school leaders so they can register their schools!
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {schools.map(school => (
                  <SchoolCard 
                    key={school.id} 
                    school={school} 
                    onDelete={() => handleDeleteSchool(school.id, school.name)}
                  />
                ))}
              </div>
            )}
          </div>
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

// Supporting Components with Updated Styling
function StatCard({ title, value, subtitle, icon, color, warning }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: warning ? '1px solid #F6AD55' : '1px solid #C3E0DE',
      boxShadow: '0 2px 8px rgba(34, 56, 72, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        {warning && <span style={{ color: '#F6AD55', fontSize: '0.75rem' }}>⚠️</span>}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#223848',
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#ADD4EA',
        fontFamily: 'Avenir'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

function ProgramOverviewCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: '#C3E0DE',
      borderRadius: '0.5rem',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#223848',
        fontWeight: '600',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#223848',
        fontFamily: 'Avenir'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

function SchoolCard({ school, onDelete }) {
  return (
    <div style={{
      background: '#FFFCF5',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      border: '1px solid #C3E0DE'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#223848',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'Avenir'
          }}>
            🏫 {school.name}
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#ADD4EA', lineHeight: '1.5', fontFamily: 'Avenir' }}>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              📍 {school.city}, {school.state}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              📧 Principal: {school.principalEmail || 'Not provided'}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              👥 Admins: {school.adminCount || 0} • 👨‍🏫 Teachers: {school.teacherCount || 0} • 🎓 Students: {school.studentCount || 0}
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              📅 Registered: {school.createdAt ? new Date(school.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
            </p>
          </div>
          
          {/* Show school codes if available */}
          {(school.schoolAccessCode || school.teacherJoinCode) && (
            <div style={{
              background: '#C3E0DE',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#223848',
              fontFamily: 'Avenir'
            }}>
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>School Codes:</strong>
              </div>
              {school.schoolAccessCode && (
                <div>🏫 School: <strong>{school.schoolAccessCode}</strong></div>
              )}
              {school.teacherJoinCode && (
                <div>👨‍🏫 Teacher: <strong>{school.teacherJoinCode}</strong></div>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: school.status === 'active' 
              ? '#A1E5DB' 
              : '#F6AD55',
            color: '#223848',
            fontFamily: 'Avenir'
          }}>
            {school.status === 'active' ? '✅ Active' : '⏳ Setup Pending'}
          </span>
          <button
            onClick={onDelete}
            style={{
              background: 'rgba(229, 62, 62, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              fontFamily: 'Avenir'
            }}
            title="Delete School"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}
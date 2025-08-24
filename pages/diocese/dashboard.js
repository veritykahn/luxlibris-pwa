// pages/diocese/dashboard.js - FIXED DIOCESE DASHBOARD WITH COMPACT LAYOUT
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { db, authHelpers } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore'

// Import pricing functions
import {
  calculateBilling,
  checkOverageStatus,
  formatCurrency,
  getTierInfo,
  PRICING_CONFIG
} from '../../lib/pricing-config'

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

  // Billing state
  const [billingInfo, setBillingInfo] = useState(null)
  const [showBillingDetails, setShowBillingDetails] = useState(false)

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

  // Load billing info when diocese data is loaded
  useEffect(() => {
    if (dioceseData) {
      const billing = calculateBilling(dioceseData)
      setBillingInfo(billing)
    }
  }, [dioceseData, schools])

  // Load program data when diocese data is loaded
  useEffect(() => {
    if (dioceseData && dioceseData.selectedPrograms) {
      loadProgramData()
    }
  }, [dioceseData])

  // Load program data
  const loadProgramData = async () => {
    try {
      const allPrograms = await getAllActivePrograms()
      setAvailablePrograms(allPrograms)

      if (dioceseData.selectedPrograms && dioceseData.selectedPrograms.length > 0) {
        const dioceseSelectedPrograms = await getProgramsByIds(dioceseData.selectedPrograms)
        setDiocesePrograms(dioceseSelectedPrograms)

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

    const interval = setInterval(checkSession, 60000)
    checkSession()
    
    return () => clearInterval(interval)
  }, [authData.isAuthenticated, lastActivity])

  // Update activity on user interactions
  useEffect(() => {
    if (!authData.isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
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

      const diocese = await findDioceseByAccessCode(authData.accessCode.toUpperCase())
      if (!diocese) {
        alert('Diocese not found with that access code')
        setLoading(false)
        return
      }

      if (diocese.passwordHash !== authData.password) {
        alert('Incorrect password')
        setLoading(false)
        return
      }

      console.log('✅ Diocese authenticated:', diocese.name)
      
      const now = Date.now()
      setDioceseData(diocese)
      setAuthData(prev => ({ ...prev, isAuthenticated: true }))
      setLastActivity(now)
      
      localStorage.setItem('dioceseSession', JSON.stringify({
        authenticated: true,
        accessCode: authData.accessCode,
        dioceseData: diocese,
        lastActivity: now
      }))
      
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

  // Load diocese data with capacity checking
  const loadDioceseData = async (dioceseId) => {
    try {
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
      
      const freshDioceseDoc = await getDoc(doc(db, 'entities', dioceseId))
      const freshDioceseData = freshDioceseDoc.exists() ? freshDioceseDoc.data() : dioceseData
      
      const billing = calculateBilling(freshDioceseData)
      setBillingInfo(billing)
      
      const tierInfo = getTierInfo(freshDioceseData.tier)
      const overage = checkOverageStatus(schoolsData.length, freshDioceseData.maxSubEntities)
      
      const stats = {
        totalSchools: schoolsData.length,
        activeSchools: schoolsData.filter(s => s.status === 'active').length,
        totalTeachers: schoolsData.reduce((sum, s) => sum + (s.teacherCount || 0), 0),
        totalStudents: schoolsData.reduce((sum, s) => sum + (s.studentCount || 0), 0),
        tierLimit: freshDioceseData.maxSubEntities,
        remaining: Math.max(0, freshDioceseData.maxSubEntities - schoolsData.length),
        overage: overage
      }
      
      setUsageStats(stats)
      
      try {
        await updateDoc(doc(db, 'entities', dioceseId), {
          currentSubEntities: schoolsData.length,
          actualSchoolCount: schoolsData.length,
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
      
      await updateDoc(doc(db, 'entities', dioceseData.id), {
        passwordHash: newPassword,
        lastModified: new Date()
      })
      
      const updatedDioceseData = {
        ...dioceseData,
        passwordHash: newPassword
      }
      setDioceseData(updatedDioceseData)
      
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
        
        await deleteDoc(doc(db, `entities/${dioceseData.id}/schools`, schoolId))
        
        console.log('✅ School deleted successfully')
        alert(`School "${schoolName}" has been deleted.`)
        
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
              {loading ? 'Authenticating...' : 'Access Diocese Dashboard'}
            </button>

            {/* Password Recovery Link */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link 
                href="/diocese/recover"
                style={{
                  color: '#ADD4EA',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}
              >
                Forgot your access code or password?
              </Link>
            </div>

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
                <strong>Diocese Access:</strong> These credentials were provided when your diocese was created by Lux Libris LLC.
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
                {sessionTimeRemaining}m
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
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem'
        }}>
          
          {/* Diocese Stats Cards - FIXED GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <StatCard 
              title="School Capacity" 
              value={`${usageStats.totalSchools}/${usageStats.tierLimit}`} 
              subtitle={
                usageStats.overage?.isOver 
                  ? usageStats.overage.message
                  : `${usageStats.remaining} slots remaining`
              }
              icon="🏫" 
              warning={usageStats.remaining <= 2 || usageStats.overage?.isOver}
            />
            <StatCard 
              title="Billing Status" 
              value={PRICING_CONFIG.billing.statuses[dioceseData?.billingStatus] || 'Pending'} 
              subtitle={`Tier: ${getTierInfo(dioceseData?.tier)?.displayName}`}
              icon="💰" 
              warning={dioceseData?.billingStatus !== 'active'}
            />
            <StatCard 
              title="Annual Cost" 
              value={formatCurrency(billingInfo?.totalDue || 0)} 
              subtitle={`${formatCurrency(billingInfo?.perSchoolEffective || 0)}/school`}
              icon="💳" 
            />
            <StatCard 
              title="Total Students" 
              value={usageStats.totalStudents} 
              subtitle="Across all schools"
              icon="🎓" 
            />
          </div>

          {/* Capacity Warnings */}
          {usageStats && usageStats.overage?.status === 'soft_warning' && (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#B45309',
                fontSize: '0.875rem',
                margin: 0,
                fontWeight: '600',
                fontFamily: 'Avenir'
              }}>
                {usageStats.overage.message}
                {usageStats.overage.overageCost > 0 && (
                  <span> - Additional annual fee: {formatCurrency(usageStats.overage.overageCost)}</span>
                )}
              </p>
            </div>
          )}

          {usageStats && usageStats.overage?.status === 'upgrade_recommended' && (
            <div style={{
              background: '#FED7D7',
              border: '1px solid #E53E3E',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#E53E3E',
                fontSize: '0.875rem',
                margin: 0,
                fontWeight: '600',
                fontFamily: 'Avenir'
              }}>
                {usageStats.overage.message}. Contact Dr. Kahn to upgrade your tier.
              </p>
            </div>
          )}

          {/* TWO COLUMN LAYOUT FOR MAIN CONTENT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            
            {/* BILLING SECTION - COMPACT */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #C3E0DE',
              boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '300',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  Billing & Contract
                </h2>
                <button
                  onClick={() => setShowBillingDetails(!showBillingDetails)}
                  style={{
                    background: 'linear-gradient(135deg, #223848, #ADD4EA)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir'
                  }}
                >
                  {showBillingDetails ? 'Hide' : 'Details'}
                </button>
              </div>

              {showBillingDetails && billingInfo && (
                <div style={{
                  background: '#FFFCF5',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Contract</div>
                      <div>Tier: {getTierInfo(dioceseData?.tier)?.displayName}</div>
                      <div>Schools: {dioceseData?.maxSubEntities}</div>
                      <div>Programs: {dioceseData?.selectedPrograms?.length || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Pricing</div>
                      <div>Base: {formatCurrency(billingInfo.basePrice)}</div>
                      {billingInfo.programCost > 0 && (
                        <div>Programs: +{formatCurrency(billingInfo.programCost)}</div>
                      )}
                      <div style={{ fontWeight: 'bold', paddingTop: '0.25rem' }}>
                        Total: {formatCurrency(billingInfo.totalDue)}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    background: '#C3E0DE',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem'
                  }}>
                    <strong>Billing Support:</strong> For contract questions, contact Dr. Verity Kahn at billing@luxlibris.org
                  </div>
                </div>
              )}
            </div>

            {/* PROGRAMS SECTION - COMPACT */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #C3E0DE',
              boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '300',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, Georgia, serif'
              }}>
                Reading Programs
              </h2>

              {/* Program Stats - HORIZONTAL LAYOUT */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: '#C3E0DE',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#223848' }}>
                    {programStats.totalPrograms}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#223848' }}>Programs</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: '#A1E5DB',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#223848' }}>
                    ${programStats.totalCost.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#223848' }}>Annual</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: '#ADD4EA',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#223848' }}>
                    {dioceseData?.tier?.toUpperCase() || 'MEDIUM'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#223848' }}>Tier</div>
                </div>
              </div>

              {/* Active Programs List - COMPACT */}
              <div style={{
                background: '#FFFCF5',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Active Programs ({diocesePrograms.length})
                </div>
                
                {diocesePrograms.length === 0 ? (
                  <div style={{ fontSize: '0.875rem', color: '#ADD4EA' }}>
                    Using default Lux Libris program
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.25rem' }}>
                    {diocesePrograms.slice(0, 3).map((program, index) => {
                      const isIncluded = index < (getTierDisplayInfo(dioceseData?.tier)?.maxPrograms || 1)
                      return (
                        <div key={program.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          <span>{program.icon} {program.name}</span>
                          <span style={{ color: isIncluded ? '#A1E5DB' : '#F6AD55', fontWeight: '600' }}>
                            {isIncluded ? 'INCLUDED' : `+$${programStats.pricePerExtra}`}
                          </span>
                        </div>
                      )
                    })}
                    {diocesePrograms.length > 3 && (
                      <div style={{ fontSize: '0.75rem', color: '#ADD4EA', textAlign: 'center' }}>
                        +{diocesePrograms.length - 3} more programs
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECONDARY ROW - THREE COLUMN LAYOUT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            
            {/* SECURITY SETTINGS - COMPACT */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #C3E0DE',
              boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: showPasswordChange ? '1rem' : '0'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '300',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  Security Settings
                </h2>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  style={{
                    background: 'linear-gradient(135deg, #F6AD55, #ED8936)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    fontFamily: 'Avenir'
                  }}
                >
                  {showPasswordChange ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordChange && (
                <div style={{
                  background: '#FFFCF5',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #C3E0DE',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #C3E0DE',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    style={{
                      background: loading ? '#B6DFEB' : 'linear-gradient(135deg, #A1E5DB, #68D391)',
                      color: '#223848',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              )}
            </div>

            {/* PRINCIPAL JOIN CODE - COMPACT */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #C3E0DE',
              boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '300',
                color: '#223848',
                marginBottom: '0.75rem',
                fontFamily: 'Didot, Georgia, serif'
              }}>
                Principal Join Code
              </h2>
              <p style={{
                color: '#ADD4EA',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                Share with ALL principals:
              </p>
              <div style={{
                background: '#C3E0DE',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '0.25rem',
                  letterSpacing: '0.1em'
                }}>
                  {dioceseData?.principalJoinCode || 'Loading...'}
                </div>
                <div style={{ color: '#223848', fontSize: '0.75rem' }}>
                  All principals use this same code
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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

Best regards,
${dioceseData?.name} Administration`)
                    
                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #A1E5DB, #68D391)',
                    color: '#223848',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}
                >
                  Email Template
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(dioceseData?.principalJoinCode || '')
                    alert('Code copied!')
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #ADD4EA, #B6DFEB)',
                    color: '#223848',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* QUICK STATS - COMPACT */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #C3E0DE',
              boxShadow: '0 4px 15px rgba(34, 56, 72, 0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '300',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, Georgia, serif'
              }}>
                Quick Stats
              </h2>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#FFFCF5',
                  borderRadius: '0.375rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#223848' }}>Active Schools</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#223848' }}>
                    {usageStats.activeSchools}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#FFFCF5',
                  borderRadius: '0.375rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#223848' }}>Total Teachers</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#223848' }}>
                    {usageStats.totalTeachers}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#FFFCF5',
                  borderRadius: '0.375rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#223848' }}>Capacity Used</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#223848' }}>
                    {Math.round((usageStats.totalSchools / usageStats.tierLimit) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SCHOOLS LIST - FULL WIDTH */}
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
                fontFamily: 'Didot, Georgia, serif'
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
                  fontWeight: '600'
                }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {schools.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#ADD4EA'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
                <h3 style={{ color: '#223848', marginBottom: '0.5rem', fontSize: '1.25rem', fontFamily: 'Didot, Georgia, serif' }}>
                  No schools registered yet
                </h3>
                <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                  Principals will appear here when they create accounts with your join code
                </p>
                <div style={{
                  background: '#C3E0DE',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  maxWidth: '400px',
                  margin: '0 auto',
                  fontSize: '0.875rem'
                }}>
                  <strong>Tip:</strong> Email the principal join code above to your school leaders so they can register their schools!
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

// FIXED Supporting Components
function StatCard({ title, value, subtitle, icon, warning }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: warning ? '1px solid #F6AD55' : '1px solid #C3E0DE',
      boxShadow: '0 2px 8px rgba(34, 56, 72, 0.05)',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column'
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
        flex: 1
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#223848',
        fontWeight: '600',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#ADD4EA'
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
      padding: '1rem',
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
            gap: '0.5rem'
          }}>
            🏫 {school.name}
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#ADD4EA', lineHeight: '1.4' }}>
            <div>📍 {school.city}, {school.state}</div>
            <div>📧 {school.principalEmail || 'Not provided'}</div>
            <div>👥 {school.adminCount || 0} admins • 👨‍🏫 {school.teacherCount || 0} teachers • 🎓 {school.studentCount || 0} students</div>
            <div>📅 {school.createdAt ? new Date(school.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</div>
          </div>
          
          {(school.schoolAccessCode || school.teacherJoinCode) && (
            <div style={{
              background: '#C3E0DE',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#223848',
              marginTop: '0.5rem'
            }}>
              <div><strong>Codes:</strong></div>
              {school.schoolAccessCode && <div>🏫 School: <strong>{school.schoolAccessCode}</strong></div>}
              {school.teacherJoinCode && <div>👨‍🏫 Teacher: <strong>{school.teacherJoinCode}</strong></div>}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: school.status === 'active' ? '#A1E5DB' : '#F6AD55',
            color: '#223848'
          }}>
            {school.status === 'active' ? '✅ Active' : '⏳ Setup'}
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
              fontWeight: '600'
            }}
            title="Delete School"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
// pages/school/dashboard.js - FIXED SCHOOL DASHBOARD WITH PROGRAM INTEGRATION & GREEN PALETTE
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { db, authHelpers } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore'

// Import program functions
import { 
  getAllActivePrograms,
  getProgramsByIds,
  getProgramById
} from '../../setup-programs'

export default function SchoolDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  // Authentication
  const [authData, setAuthData] = useState({
    schoolCode: '',
    email: '',
    password: '',
    isAuthenticated: false
  })
  
  // School Data
  const [schoolData, setSchoolData] = useState(null)
  const [parentEntity, setParentEntity] = useState(null) // Diocese/ISD data
  const [admins, setAdmins] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // Program Management State - FIXED WITH PROPER ERROR HANDLING
  const [availablePrograms, setAvailablePrograms] = useState([])
  const [schoolPrograms, setSchoolPrograms] = useState([])
  const [defaultProgram, setDefaultProgram] = useState(null)
  const [programStats, setProgramStats] = useState({
    totalPrograms: 0,
    availablePrograms: 0,
    activeTeachers: 0,
    programSource: 'default' // 'school', 'diocese', 'default'
  })
  
  // Stats
  const [schoolStats, setSchoolStats] = useState({
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    activePrograms: 0
  })

  // Co-Admin Management
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'administrator'
  })

  // Program Configuration
  const [showProgramConfig, setShowProgramConfig] = useState(false)

  // Session timeout (2 hours = 7200000 ms)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // ENHANCED: Load program data when school data is loaded - WITH COMPREHENSIVE ERROR HANDLING
  useEffect(() => {
    if (schoolData) {
      loadProgramData()
    }
  }, [schoolData, parentEntity])

  // FIXED: Load program data with comprehensive fallbacks and error handling
  const loadProgramData = async () => {
    try {
      console.log('🔍 Loading program data for school...')
      console.log('📊 School data:', schoolData)
      console.log('📊 Parent entity:', parentEntity)

      // Load all available programs first
      const allPrograms = await getAllActivePrograms()
      setAvailablePrograms(allPrograms)

      // Determine which programs this school should have access to
      let programsToLoad = []
      let programSource = 'default'

      // ENHANCED LOGIC: Handle different school scenarios gracefully
      if (schoolData?.selectedPrograms && Array.isArray(schoolData.selectedPrograms) && schoolData.selectedPrograms.length > 0) {
        // School has explicitly defined programs
        programsToLoad = schoolData.selectedPrograms
        programSource = 'school'
        console.log('📚 School has explicit programs:', programsToLoad)
      } else if (parentEntity?.selectedPrograms && Array.isArray(parentEntity.selectedPrograms) && parentEntity.selectedPrograms.length > 0) {
        // School inherits from parent diocese/ISD
        programsToLoad = parentEntity.selectedPrograms
        programSource = 'diocese'
        console.log('📚 School inherits from parent:', programsToLoad)
      } else {
        // Fallback to default Lux Libris program
        programsToLoad = ['luxlibris']
        programSource = 'default'
        console.log('📚 Using default Lux Libris program')
      }

      // Load the specific programs with error handling
      let loadedPrograms = []
      if (programsToLoad.length > 0) {
        try {
          const programResults = await getProgramsByIds(programsToLoad)
          loadedPrograms = programResults.filter(p => p !== null && p !== undefined)
          console.log('✅ Loaded school programs:', loadedPrograms.length)
        } catch (programError) {
          console.error('Error loading programs by IDs:', programError)
          loadedPrograms = []
        }
      }

      // Ensure we have at least Lux Libris as fallback
      if (loadedPrograms.length === 0) {
        try {
          const luxLibris = await getProgramById('luxlibris')
          if (luxLibris) {
            loadedPrograms = [luxLibris]
            programSource = 'default'
            console.log('🔄 Fallback: Using Lux Libris only')
          }
        } catch (fallbackError) {
          console.error('Even Lux Libris fallback failed:', fallbackError)
        }
      }

      setSchoolPrograms(loadedPrograms)

      // Always ensure we have Lux Libris as default reference
      try {
        const luxLibris = await getProgramById('luxlibris')
        if (luxLibris) {
          setDefaultProgram(luxLibris)
        }
      } catch (defaultError) {
        console.error('Could not load default program:', defaultError)
      }

      // Update program statistics
      setProgramStats({
        totalPrograms: loadedPrograms.length,
        availablePrograms: allPrograms.length,
        activeTeachers: teachers.length,
        programSource: programSource
      })

      console.log('✅ Program data loading complete:', {
        loaded: loadedPrograms.length,
        source: programSource,
        available: allPrograms.length
      })

    } catch (error) {
      console.error('Error loading program data:', error)
      
      // Even if there's a complete error, try to load Lux Libris as absolute fallback
      try {
        const luxLibris = await getProgramById('luxlibris')
        if (luxLibris) {
          setDefaultProgram(luxLibris)
          setSchoolPrograms([luxLibris])
          setProgramStats({
            totalPrograms: 1,
            availablePrograms: 1,
            activeTeachers: teachers.length,
            programSource: 'emergency_fallback'
          })
          console.log('🆘 Emergency fallback: Loaded Lux Libris only')
        }
      } catch (emergencyError) {
        console.error('Emergency fallback also failed:', emergencyError)
        // Set empty state but don't crash
        setSchoolPrograms([])
        setProgramStats({
          totalPrograms: 0,
          availablePrograms: 0,
          activeTeachers: teachers.length,
          programSource: 'error'
        })
      }
    }
  }

  // Initialize session from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('schoolSession')
    if (savedSession) {
      const sessionData = JSON.parse(savedSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT && sessionData.schoolData) {
        setAuthData({ 
          schoolCode: sessionData.schoolCode || '',
          email: sessionData.email || '',
          password: '',
          isAuthenticated: true 
        })
        setSchoolData(sessionData.schoolData)
        setLastActivity(sessionData.lastActivity)
        loadSchoolData(sessionData.schoolData.id, sessionData.schoolData.dioceseId || sessionData.schoolData.parentEntityId)
      } else {
        localStorage.removeItem('schoolSession')
      }
    }

    // Auto-populate school code from URL
    const { school } = router.query
    if (school) {
      setAuthData(prev => ({ ...prev, schoolCode: school.toUpperCase() }))
    }
  }, [router.query])

  // Save session to localStorage
  useEffect(() => {
    if (authData.isAuthenticated && schoolData) {
      localStorage.setItem('schoolSession', JSON.stringify({
        authenticated: true,
        schoolCode: authData.schoolCode,
        email: authData.email,
        schoolData: schoolData,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('schoolSession')
    }
  }, [authData.isAuthenticated, schoolData, lastActivity])

  // Session management effects (timeout, activity tracking)
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

  useEffect(() => {
    if (!authData.isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      if (schoolData) {
        localStorage.setItem('schoolSession', JSON.stringify({
          authenticated: true,
          schoolCode: authData.schoolCode,
          email: authData.email,
          schoolData: schoolData,
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
  }, [authData.isAuthenticated, schoolData])

  // Handle school authentication (3-field: school code + email + password)
  const handleSchoolAuth = async () => {
    if (!authData.schoolCode || !authData.email || !authData.password) {
      alert('Please enter school code, email, and password')
      return
    }

    setLoading(true)
    try {
      console.log('🔐 Authenticating school admin...')
      console.log('🏫 School Code:', authData.schoolCode)
      console.log('📧 Email:', authData.email)

      // Find school by access code
      const school = await findSchoolByAccessCode(authData.schoolCode.toUpperCase())
      if (!school) {
        alert('School not found with that access code')
        setLoading(false)
        return
      }

      // Find admin in school admins collection
      const admin = await findAdminInSchool(school.dioceseId || school.parentEntityId, school.id, authData.email)
      if (!admin) {
        alert('Admin account not found with that email for this school')
        setLoading(false)
        return
      }

      // Sign in with Firebase Auth
      try {
        await authHelpers.signIn(authData.email, authData.password)
        console.log('✅ Admin authenticated successfully')
      } catch (error) {
        alert('Incorrect password')
        setLoading(false)
        return
      }

      // Set school data and update last activity
      const now = Date.now()
      setSchoolData(school)
      setAuthData(prev => ({ ...prev, isAuthenticated: true }))
      setLastActivity(now)
      
      // Save to localStorage
      localStorage.setItem('schoolSession', JSON.stringify({
        authenticated: true,
        schoolCode: authData.schoolCode,
        email: authData.email,
        schoolData: school,
        lastActivity: now
      }))
      
      // Load school data
      await loadSchoolData(school.id, school.dioceseId || school.parentEntityId)

    } catch (error) {
      console.error('School auth error:', error)
      alert('Authentication failed. Please check your credentials.')
    }
    setLoading(false)
  }

  // ENHANCED: Find school by access code with better error handling
  const findSchoolByAccessCode = async (accessCode) => {
    try {
      // First check single schools/libraries in schools collection
      const schoolsRef = collection(db, 'schools')
      const schoolsSnapshot = await getDocs(schoolsRef)
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolData = schoolDoc.data()
        if (schoolData.accessCode === accessCode) {
          return {
            id: schoolDoc.id,
            ...schoolData,
            parentEntityId: null,
            dioceseId: null,
            isStandalone: true
          }
        }
      }

      // Then check schools within diocese/ISD entities
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsSubRef = collection(db, `entities/${entityDoc.id}/schools`)
          const schoolsSubSnapshot = await getDocs(schoolsSubRef)
          
          for (const schoolSubDoc of schoolsSubSnapshot.docs) {
            const schoolSubData = schoolSubDoc.data()
            if (schoolSubData.schoolAccessCode === accessCode || schoolSubData.accessCode === accessCode) {
              return {
                id: schoolSubDoc.id,
                ...schoolSubData,
                parentEntityId: entityDoc.id,
                dioceseId: entityDoc.id, // For backwards compatibility
                isStandalone: false
              }
            }
          }
        } catch (subError) {
          console.log(`No schools subcollection for entity ${entityDoc.id}`)
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding school:', error)
      return null
    }
  }

  // Find admin in school admins subcollection
  const findAdminInSchool = async (dioceseId, schoolId, email) => {
    try {
      if (!dioceseId || !schoolId) {
        console.error('Missing dioceseId or schoolId for admin search')
        return null
      }

      const adminsRef = collection(db, `entities/${dioceseId}/schools/${schoolId}/admins`)
      const adminQuery = query(adminsRef, where('email', '==', email))
      const adminSnapshot = await getDocs(adminQuery)
      
      if (!adminSnapshot.empty) {
        const adminDoc = adminSnapshot.docs[0]
        return { id: adminDoc.id, ...adminDoc.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error finding admin:', error)
      return null
    }
  }

  // ENHANCED: Load school data with parent entity loading
  const loadSchoolData = async (schoolId, parentEntityId) => {
    try {
      console.log('📊 Loading school data...')
      console.log('🏫 School ID:', schoolId)
      console.log('🏛️ Parent Entity ID:', parentEntityId)

      // Load parent entity data if this school has a parent (diocese/ISD)
      if (parentEntityId) {
        try {
          const parentEntityDoc = await getDoc(doc(db, 'entities', parentEntityId))
          if (parentEntityDoc.exists()) {
            const parentData = parentEntityDoc.data()
            setParentEntity({
              id: parentEntityDoc.id,
              ...parentData
            })
            console.log('✅ Loaded parent entity:', parentData.name)
          }
        } catch (parentError) {
          console.log('Could not load parent entity:', parentError)
          setParentEntity(null)
        }
      } else {
        setParentEntity(null)
      }

      // Load admins
      if (parentEntityId) {
        const adminsRef = collection(db, `entities/${parentEntityId}/schools/${schoolId}/admins`)
        const adminsSnapshot = await getDocs(adminsRef)
        const adminsData = []
        adminsSnapshot.forEach((doc) => {
          adminsData.push({ id: doc.id, ...doc.data() })
        })
        setAdmins(adminsData)
        
        // Load teachers
        const teachersRef = collection(db, `entities/${parentEntityId}/schools/${schoolId}/teachers`)
        const teachersSnapshot = await getDocs(teachersRef)
        const teachersData = []
        teachersSnapshot.forEach((doc) => {
          teachersData.push({ id: doc.id, ...doc.data() })
        })
        setTeachers(teachersData)
        
        // Load students
        const studentsRef = collection(db, `entities/${parentEntityId}/schools/${schoolId}/students`)
        const studentsSnapshot = await getDocs(studentsRef)
        const studentsData = []
        studentsSnapshot.forEach((doc) => {
          studentsData.push({ id: doc.id, ...doc.data() })
        })
        setStudents(studentsData)

        // Update stats
        const stats = {
          totalAdmins: adminsData.length,
          totalTeachers: teachersData.length,
          totalStudents: studentsData.length,
          activePrograms: 1 // Will be updated when programs load
        }
        setSchoolStats(stats)
        
        // Update school document counts
        await updateDoc(doc(db, `entities/${parentEntityId}/schools`, schoolId), {
          adminCount: adminsData.length,
          teacherCount: teachersData.length,
          studentCount: studentsData.length,
          lastModified: new Date()
        })
      } else {
        // Handle standalone schools
        setAdmins([])
        setTeachers([])
        setStudents([])
        setSchoolStats({
          totalAdmins: 0,
          totalTeachers: 0,
          totalStudents: 0,
          activePrograms: 1
        })
      }
      
      console.log('✅ School data loaded')
      
    } catch (error) {
      console.error('Error loading school data:', error)
    }
  }

  // Add co-administrator
  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.firstName || !newAdmin.lastName) {
      alert('Please fill in all admin details')
      return
    }

    if (admins.length >= 5) {
      alert('Maximum 5 administrators per school')
      return
    }

    try {
      setLoading(true)
      console.log('👥 Adding co-administrator...')
      
      // Check if email already exists
      const existingAdmin = admins.find(admin => admin.email === newAdmin.email)
      if (existingAdmin) {
        alert('An administrator with this email already exists')
        setLoading(false)
        return
      }
      
      // Generate temporary password
      const tempPassword = `${schoolData.name.replace(/\s/g, '')}${Math.floor(1000 + Math.random() * 9000)}`
      
      // Create Firebase Auth account
      const adminAuth = await authHelpers.createAdminAccount(
        newAdmin.email,
        tempPassword,
        { name: `${newAdmin.firstName} ${newAdmin.lastName}` }
      )
      
      // Create admin document
      const adminData = {
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        role: newAdmin.role,
        authUid: adminAuth.uid,
        tempPassword: tempPassword,
        passwordChangeRequired: true,
        schoolId: schoolData.id,
        dioceseId: schoolData.dioceseId || schoolData.parentEntityId,
        schoolName: schoolData.name,
        addedBy: authData.email,
        createdAt: new Date(),
        status: 'active'
      }
      
      // Save to admins subcollection
      const parentId = schoolData.dioceseId || schoolData.parentEntityId
      await addDoc(collection(db, `entities/${parentId}/schools/${schoolData.id}/admins`), adminData)
      
      console.log('✅ Co-administrator added successfully')
      
      // Show success with login details
      alert(`✅ Co-Administrator Added Successfully!

👤 Name: ${newAdmin.firstName} ${newAdmin.lastName}
📧 Email: ${newAdmin.email}
🔒 Temporary Password: ${tempPassword}

IMPORTANT: Send these login credentials to the new admin. They will be required to change their password on first login.

Login URL: ${window.location.origin}/school/dashboard`)
      
      // Reset form
      setNewAdmin({
        email: '',
        firstName: '',
        lastName: '',
        role: 'administrator'
      })
      setShowAddAdmin(false)
      
      // Reload school data
      await loadSchoolData(schoolData.id, schoolData.dioceseId || schoolData.parentEntityId)
      
    } catch (error) {
      console.error('❌ Error adding co-administrator:', error)
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already registered in the system')
      } else {
        alert('Error adding co-administrator: ' + error.message)
      }
    }
    setLoading(false)
  }

  // Remove administrator
  const handleRemoveAdmin = async (adminId, adminEmail, adminName) => {
    if (admins.length <= 1) {
      alert('Cannot remove the last administrator. Schools must have at least one admin.')
      return
    }

    const confirmed = window.confirm(`Remove Administrator?

👤 ${adminName}
📧 ${adminEmail}

This will remove their access to the school dashboard immediately.

Continue?`)
    
    if (confirmed) {
      try {
        setLoading(true)
        
        const parentId = schoolData.dioceseId || schoolData.parentEntityId
        await deleteDoc(doc(db, `entities/${parentId}/schools/${schoolData.id}/admins`, adminId))
        
        console.log('✅ Administrator removed successfully')
        alert(`Administrator "${adminName}" has been removed.`)
        
        // Reload school data
        await loadSchoolData(schoolData.id, parentId)
      } catch (error) {
        console.error('❌ Error removing administrator:', error)
        alert('Error removing administrator: ' + error.message)
      }
      setLoading(false)
    }
  }

  // Logout function
  const handleLogout = () => {
    setAuthData({ schoolCode: '', email: '', password: '', isAuthenticated: false })
    setSchoolData(null)
    setParentEntity(null)
    setAdmins([])
    setTeachers([])
    setStudents([])
    setSchoolPrograms([])
    localStorage.removeItem('schoolSession')
    setLastActivity(Date.now())
  }

  // Get programs source description
  const getProgramSourceDescription = () => {
    switch (programStats.programSource) {
      case 'school':
        return 'School-specific programs'
      case 'diocese':
        return `Inherited from ${parentEntity?.name || 'Diocese'}`
      case 'default':
        return 'Default Lux Libris program'
      case 'emergency_fallback':
        return 'Emergency fallback (Lux Libris only)'
      case 'error':
        return 'Error loading programs'
      default:
        return 'Loading programs...'
    }
  }

  // Authentication Screen with GREEN PALETTE
  if (!authData.isAuthenticated) {
    return (
      <>
        <Head>
          <title>School Dashboard - Authentication</title>
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
            border: '1px solid #A1E5DB',
            boxShadow: '0 10px 25px rgba(161, 229, 219, 0.15)',
            textAlign: 'center',
            maxWidth: '450px',
            width: '100%'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #A1E5DB, #68D391)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              🏫
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '300',
              color: '#065F46',
              margin: '0 0 0.5rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              School Dashboard
            </h1>
            <p style={{
              color: '#A1E5DB',
              marginBottom: '2rem',
              fontFamily: 'Avenir',
              letterSpacing: '1.2px'
            }}>
              School Administrator Access
            </p>
            
            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                School Access Code
              </label>
              <input
                type="text"
                placeholder="TXAUS-HOLY-SMITH-2025"
                value={authData.schoolCode}
                onChange={(e) => setAuthData(prev => ({ ...prev, schoolCode: e.target.value.toUpperCase() }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #A1E5DB',
                  background: '#FFFCF5',
                  color: '#065F46',
                  fontSize: '1rem',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  boxSizing: 'border-box',
                  fontFamily: 'Avenir'
                }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Admin Email
              </label>
              <input
                type="email"
                placeholder="admin@school.edu"
                value={authData.email}
                onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #A1E5DB',
                  background: '#FFFCF5',
                  color: '#065F46',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'Avenir'
                }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Your admin password"
                value={authData.password}
                onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSchoolAuth()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #A1E5DB',
                  background: '#FFFCF5',
                  color: '#065F46',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'Avenir'
                }}
              />
            </div>

            <button
              onClick={handleSchoolAuth}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: loading 
                  ? '#D1FAE5' 
                  : 'linear-gradient(135deg, #065F46, #A1E5DB)',
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
              {loading ? 'Authenticating...' : '🚀 Access School Dashboard'}
            </button>

            <div style={{
              background: '#A1E5DB',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginTop: '1.5rem'
            }}>
              <p style={{
                color: '#065F46',
                fontSize: '0.875rem',
                margin: 0,
                lineHeight: '1.4',
                fontFamily: 'Avenir'
              }}>
                🏫 <strong>School Access:</strong> Use your school access code and individual admin credentials to manage your school's reading program.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Main Dashboard with GREEN PALETTE
  return (
    <>
      <Head>
        <title>{schoolData?.name} - School Dashboard</title>
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
          borderBottom: '1px solid #A1E5DB',
          padding: '1rem 0',
          boxShadow: '0 2px 10px rgba(161, 229, 219, 0.1)'
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
                background: 'linear-gradient(135deg, #065F46, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🏫
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                  fontWeight: '300',
                  color: '#065F46',
                  margin: 0,
                  fontFamily: 'Didot, Georgia, serif',
                  letterSpacing: '1.2px'
                }}>
                  {schoolData?.name}
                </h1>
                <p style={{
                  color: '#A1E5DB',
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}>
                  School Management Dashboard
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Session Timer */}
              <div style={{
                padding: '0.25rem 0.5rem',
                background: sessionTimeRemaining <= 10 
                  ? '#FED7D7' 
                  : '#A1E5DB',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: sessionTimeRemaining <= 10 ? '#E53E3E' : '#065F46',
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
          
          {/* School Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard 
              title="Administrators" 
              value={schoolStats.totalAdmins} 
              subtitle="Managing school"
              icon="👥" 
              color="#065F46"
            />
            <StatCard 
              title="Teachers" 
              value={schoolStats.totalTeachers} 
              subtitle="Active educators"
              icon="👨‍🏫" 
              color="#A1E5DB"
            />
            <StatCard 
              title="Students" 
              value={schoolStats.totalStudents} 
              subtitle="Total enrollment"
              icon="🎓" 
              color="#68D391"
            />
            <StatCard 
              title="Programs" 
              value={programStats.totalPrograms} 
              subtitle="Reading initiatives"
              icon="📚" 
              color="#10B981"
            />
          </div>

          {/* NEW: Program Management Section with GREEN PALETTE */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              color: '#065F46',
              marginBottom: '1.5rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Your Reading Programs
            </h2>

            {/* Program Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <ProgramOverviewCard 
                title="Active Programs"
                value={programStats.totalPrograms}
                subtitle={getProgramSourceDescription()}
                icon="📚"
                color="#065F46"
              />
              <ProgramOverviewCard 
                title="Available Programs"
                value={programStats.availablePrograms}
                subtitle="System-wide reading programs"
                icon="🌟"
                color="#A1E5DB"
              />
              <ProgramOverviewCard 
                title="Active Teachers"
                value={programStats.activeTeachers}
                subtitle="Using these programs"
                icon="👨‍🏫"
                color="#68D391"
              />
            </div>

            {/* Active Programs List */}
            <div style={{
              background: '#A1E5DB',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#065F46',
                marginBottom: '0.75rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Active Programs ({schoolPrograms.length})
              </h3>
              
              {schoolPrograms.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#065F46'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
                  <p style={{ margin: 0, fontFamily: 'Avenir' }}>
                    Loading reading programs...
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {schoolPrograms.map((program, index) => (
                    <div key={program.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      border: '1px solid #68D391'
                    }}>
                      <div>
                        <span style={{
                          fontWeight: '600',
                          color: '#065F46',
                          fontFamily: 'Avenir'
                        }}>
                          {program.icon} {program.name}
                        </span>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#A1E5DB',
                          fontFamily: 'Avenir'
                        }}>
                          {program.targetAudience} • {program.targetGrades?.join(', ')}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#10B981',
                        fontFamily: 'Avenir'
                      }}>
                        ACTIVE
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Program Source Info */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#68D391',
              borderRadius: '0.5rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#065F46',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                📊 Program Information
              </h4>
              <div style={{
                fontSize: '0.875rem',
                color: '#065F46',
                fontFamily: 'Avenir'
              }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Program Source:</strong> {getProgramSourceDescription()}
                </div>
                {parentEntity && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Parent Organization:</strong> {parentEntity.name}
                  </div>
                )}
                <div>
                  <strong>Teachers Using Programs:</strong> {programStats.activeTeachers} educators
                </div>
              </div>
            </div>
          </div>

          {/* Administrator Management Section */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)'
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
                color: '#065F46',
                margin: 0,
                fontFamily: 'Didot, Georgia, serif',
                letterSpacing: '1.2px'
              }}>
                School Administrators ({admins.length})
              </h2>
              
              <button
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                disabled={admins.length >= 5}
                style={{
                  background: admins.length >= 5 
                    ? '#D1FAE5' 
                    : 'linear-gradient(135deg, #065F46, #A1E5DB)',
                  color: admins.length >= 5 ? '#065F46' : 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: admins.length >= 5 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  fontFamily: 'Avenir',
                  letterSpacing: '1.2px'
                }}
              >
                {showAddAdmin ? '❌ Cancel' : '➕ Add Co-Admin'}
              </button>
            </div>

            {showAddAdmin && (
              <div style={{
                background: '#FFFCF5',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #A1E5DB',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  color: '#065F46',
                  fontSize: '1.125rem',
                  marginBottom: '1rem',
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  Add Co-Administrator
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#065F46',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      placeholder="coadmin@school.edu"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #A1E5DB',
                        background: 'white',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#065F46',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      value={newAdmin.firstName}
                      onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #A1E5DB',
                        background: 'white',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#065F46',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Smith"
                      value={newAdmin.lastName}
                      onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #A1E5DB',
                        background: 'white',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#065F46',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      Role
                    </label>
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #A1E5DB',
                        background: 'white',
                        color: '#065F46',
                        fontSize: '1rem',
                        fontFamily: 'Avenir'
                      }}
                    >
                      <option value="administrator">Administrator</option>
                      <option value="principal">Principal</option>
                      <option value="vice_principal">Vice Principal</option>
                      <option value="it_admin">IT Administrator</option>
                      <option value="librarian">Head Librarian</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddAdmin}
                  disabled={loading || !newAdmin.email || !newAdmin.firstName || !newAdmin.lastName}
                  style={{
                    background: loading ? '#D1FAE5' : 'linear-gradient(135deg, #68D391, #10B981)',
                    color: loading ? '#065F46' : 'white',
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
                  {loading ? '⏳ Adding...' : '✅ Add Co-Administrator'}
                </button>
              </div>
            )}

            {/* Admins List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {admins.map(admin => (
                <AdminCard 
                  key={admin.id} 
                  admin={admin} 
                  currentUserEmail={authData.email}
                  canRemove={admins.length > 1}
                  onRemove={() => handleRemoveAdmin(admin.id, admin.email, `${admin.firstName} ${admin.lastName}`)}
                />
              ))}
            </div>
          </div>

          {/* Teacher Join Code Display */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              color: '#065F46',
              marginBottom: '1rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Teacher Join Code
            </h2>
            <p style={{
              color: '#A1E5DB',
              marginBottom: '1.5rem',
              fontSize: '1rem',
              fontFamily: 'Avenir'
            }}>
              Share this code with ALL teachers and librarians at your school:
            </p>
            <div style={{
              background: '#A1E5DB',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '2px solid #68D391',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#065F46',
                marginBottom: '0.5rem',
                letterSpacing: '0.1em',
                fontFamily: 'Avenir'
              }}>
                {schoolData?.teacherJoinCode || 'Loading...'}
              </div>
              <div style={{
                color: '#065F46',
                fontSize: '0.875rem',
                fontFamily: 'Avenir'
              }}>
                All teachers use this same code to create their accounts
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Teacher Registration - ${schoolData?.name}`)
                  const body = encodeURIComponent(`Dear Teacher,

You have been invited to join our Lux Libris reading program!

Teacher Registration Instructions:
1. Go to: ${window.location.origin}/teacher/signup
2. Enter this teacher join code: ${schoolData?.teacherJoinCode}
3. Use your email and create a password
4. Complete the teacher onboarding process
5. Start managing your students and reading program!

After registration, you will receive unique student codes to share with your students and parents.

Welcome to our reading community!

Best regards,
${schoolData?.name} Administration`)
                  
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
                }}
                style={{
                  background: 'linear-gradient(135deg, #68D391, #10B981)',
                  color: 'white',
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
                  navigator.clipboard.writeText(schoolData?.teacherJoinCode || '')
                  alert('Teacher join code copied to clipboard!')
                }}
                style={{
                  background: 'linear-gradient(135deg, #A1E5DB, #68D391)',
                  color: '#065F46',
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

          {/* Quick Actions Section */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 4px 15px rgba(161, 229, 219, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              color: '#065F46',
              marginBottom: '1rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Quick Actions
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <QuickActionCard
                title="Configure Reading Program"
                description="Select book nominees and achievement tiers"
                icon="📚"
                action={() => setShowProgramConfig(true)}
                color="#065F46"
              />
              
              <QuickActionCard
                title="View Teachers"
                description="Manage teacher accounts and permissions"
                icon="👨‍🏫"
                action={() => alert('Teacher management coming soon!')}
                color="#A1E5DB"
              />
              
              <QuickActionCard
                title="Student Reports"
                description="View reading progress and achievements"
                icon="📊"
                action={() => alert('Student reports coming soon!')}
                color="#68D391"
              />
              
              <QuickActionCard
                title="School Settings"
                description="Configure school policies and preferences"
                icon="⚙️"
                action={() => alert('School settings coming soon!')}
                color="#10B981"
              />
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
    </>
  )
}

// Supporting Components with GREEN PALETTE
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid #A1E5DB',
      boxShadow: '0 2px 8px rgba(161, 229, 219, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#065F46',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#065F46',
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#A1E5DB',
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
      background: '#A1E5DB',
      borderRadius: '0.5rem',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#065F46',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#065F46',
        fontWeight: '600',
        marginBottom: '0.25rem',
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#065F46',
        fontFamily: 'Avenir'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

function AdminCard({ admin, currentUserEmail, canRemove, onRemove }) {
  const isCurrentUser = admin.email === currentUserEmail
  
  return (
    <div style={{
      background: '#FFFCF5',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      border: '1px solid #A1E5DB'
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
            color: '#065F46',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'Avenir'
          }}>
            👤 {admin.firstName} {admin.lastName}
            {isCurrentUser && <span style={{ fontSize: '0.75rem', color: '#A1E5DB' }}>(You)</span>}
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#A1E5DB', lineHeight: '1.5', fontFamily: 'Avenir' }}>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              📧 {admin.email}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              🏷️ Role: {admin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              📅 Added: {admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
            </p>
            {admin.passwordChangeRequired && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#F6AD55' }}>
                ⚠️ Password change required on next login
              </p>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: admin.status === 'active' 
              ? '#68D391' 
              : '#F6AD55',
            color: '#065F46',
            fontFamily: 'Avenir'
          }}>
            {admin.status === 'active' ? '✅ Active' : '⏳ Pending'}
          </span>
          
          {canRemove && !isCurrentUser && (
            <button
              onClick={onRemove}
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
              title="Remove Administrator"
            >
              🗑️ Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, icon, action, color }) {
  return (
    <div 
      onClick={action}
      style={{
        background: '#A1E5DB',
        borderRadius: '0.5rem',
        padding: '1.25rem',
        border: '1px solid #68D391',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.75rem'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#065F46',
        marginBottom: '0.5rem',
        fontFamily: 'Avenir'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: '#065F46',
        margin: 0,
        lineHeight: '1.4',
        fontFamily: 'Avenir'
      }}>
        {description}
      </p>
    </div>
  )
}
// pages/admin/god-mode.js - GOD MODE WITH PHASE MANAGEMENT AND DROPDOWN PROGRAM SELECTION
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { db, authHelpers, dbHelpers } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'

// Import program functions
import { 
  getAllActivePrograms,
  getAvailableProgramsForTier,
  getTierDisplayInfo,
  validateProgramSelection,
  calculateProgramPricing,
  getProgramsByIds
} from '../../setup-programs'

export default function GodModeWithPrograms() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  // Entity Management
  const [entities, setEntities] = useState([])
  const [showCreateEntity, setShowCreateEntity] = useState(false)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120) // minutes
  
  // Program Management State
  const [availablePrograms, setAvailablePrograms] = useState([])
  const [selectedPrograms, setSelectedPrograms] = useState([]) // Start empty
  const [customOverride, setCustomOverride] = useState(false)
  const [customMaxPrograms, setCustomMaxPrograms] = useState(null)
  const [programPricing, setProgramPricing] = useState(null)

  // PHASE MANAGEMENT STATE - ADDED
  const [phaseData, setPhaseData] = useState({
    currentPhase: 'SETUP',
    academicYear: '2025-26',
    teachersSelected: 0,
    totalTeachers: 0,
    teachersReleased: 0,
    studentsActive: 0,
    lastUpdated: null
  });
  const [phaseLoading, setPhaseLoading] = useState(false);

  const [newEntity, setNewEntity] = useState({
    entityType: 'diocese', // diocese, isd, single_school, single_library
    name: '',
    location: '',
    adminEmail: '',
    principalLastName: '', // for single schools/libraries
    tier: 'medium', // only for multi-school entities
    selectedPrograms: [], // Start empty - let user choose
    customProgramCount: null, // Override program count
    contactInfo: {}
  })

  // Session timeout (2 hours = 7200000 ms)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // Operational functions to replace test functions
  const runSystemHealthCheck = async () => {
    setLoading(true);
    try {
      const currentYear = dbHelpers.getCurrentAcademicYear();
      const config = await dbHelpers.getSystemConfig();
      
      alert(`🔧 System Health Check Results:

📅 Current Academic Year: ${currentYear}
⚙️ Program Phase: ${config.programPhase}
🗳️ Voting Period: ${config.votingStartDate.toDate().toLocaleDateString()} - ${config.votingEndDate.toDate().toLocaleDateString()}
✅ All systems operational!`);
    } catch (error) {
      alert('❌ System health check failed: ' + error.message);
    }
    setLoading(false);
  };

  const showAcademicYearInfo = async () => {
    setLoading(true);
    try {
      const currentYear = dbHelpers.getCurrentAcademicYear();
      const { startDate, endDate } = dbHelpers.getAcademicYearDates(currentYear);
      const config = await dbHelpers.getSystemConfig();
      
      alert(`📅 Academic Year Information:

📚 Current Year: ${currentYear}
🗓️ Program Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
📊 Current Phase: ${config.programPhase}
🏆 Competition ends: March 31, 2026
🗳️ Voting: April 1-14, 2026`);
    } catch (error) {
      alert('❌ Error loading academic year info: ' + error.message);
    }
    setLoading(false);
  };

  // Initialize session from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('godModeSession')
    if (savedSession) {
      const sessionData = JSON.parse(savedSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT) {
        setIsAuthenticated(true)
        setLastActivity(sessionData.lastActivity)
        fetchAllEntities()
        loadAllPrograms() // Load programs on auth
      } else {
        localStorage.removeItem('godModeSession')
      }
    }
  }, [])

  // Load all available programs
  const loadAllPrograms = async () => {
    try {
      const programs = await getAllActivePrograms()
      setAvailablePrograms(programs)
      console.log('✅ Loaded programs:', programs.length)
    } catch (error) {
      console.error('Error loading programs:', error)
    }
  }

  // Load programs when tier changes
  useEffect(() => {
    const loadProgramsForTier = async () => {
      if (newEntity.tier && ['diocese', 'isd'].includes(newEntity.entityType)) {
        try {
          const tierPrograms = await getAvailableProgramsForTier(newEntity.tier)
          setAvailablePrograms(tierPrograms)
          console.log('🔍 Available programs for', newEntity.tier, ':', tierPrograms)
          
          // Reset selections when tier changes - NO DEFAULT REQUIRED
          setNewEntity(prev => ({
            ...prev,
            selectedPrograms: [], // Allow empty selection initially
            customProgramCount: null
          }))
          setCustomOverride(false)
          setCustomMaxPrograms(null)
          
        } catch (error) {
          console.error('Error loading tier programs:', error)
        }
      }
    }
    
    loadProgramsForTier()
  }, [newEntity.tier, newEntity.entityType])

  // Calculate pricing when selections change
  useEffect(() => {
    if (newEntity.tier && newEntity.selectedPrograms.length > 0) {
      const pricing = calculateProgramPricing(
        newEntity.tier, 
        newEntity.selectedPrograms.length, 
        customOverride,
        customMaxPrograms
      )
      setProgramPricing(pricing)
    }
  }, [newEntity.tier, newEntity.selectedPrograms, customOverride, customMaxPrograms])

  // Save session to localStorage whenever authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('godModeSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('godModeSession')
    }
  }, [isAuthenticated, lastActivity])

  // Check session timeout
  useEffect(() => {
    if (!isAuthenticated) return

    const checkSession = () => {
      const now = Date.now()
      const timeRemaining = SESSION_TIMEOUT - (now - lastActivity)
      const minutesRemaining = Math.max(0, Math.round(timeRemaining / 60000))
      
      setSessionTimeRemaining(minutesRemaining)
      
      if (timeRemaining <= 0) {
        alert('Session expired after 2 hours. Please sign in again.')
        setIsAuthenticated(false)
        setPassword('')
        localStorage.removeItem('godModeSession')
        return
      }
    }

    // Check every minute
    const interval = setInterval(checkSession, 60000)
    checkSession() // Initial check
    
    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity])

  // Update activity on user interactions
  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      // Update localStorage immediately
      localStorage.setItem('godModeSession', JSON.stringify({
        authenticated: true,
        lastActivity: newActivity
      }))
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
  }, [isAuthenticated])

  // God Mode Password Protection
  const handleLogin = () => {
    if (password === 'LUXLIBRIS-GOD-2025') {
      const now = Date.now()
      setIsAuthenticated(true)
      setLastActivity(now)
      localStorage.setItem('godModeSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
    } else {
      alert('Invalid God Mode password')
    }
  }

  // Fetch entities on load - UPDATED TO INCLUDE PHASE DATA
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllEntities()
      loadAllPrograms() // Load programs
      loadPhaseData() // ADD this line
    }
  }, [isAuthenticated])

  // PHASE MANAGEMENT FUNCTIONS - ADDED
  // Load current phase data and teacher stats
  const loadPhaseData = async () => {
    try {
      setPhaseLoading(true);
      
      // Get system config
      const config = await dbHelpers.getSystemConfig();
      const currentYear = dbHelpers.getCurrentAcademicYear();
      
      // Count teacher progress across all entities
      let totalTeachers = 0;
      let teachersSelected = 0;
      let teachersReleased = 0;
      let studentsActive = 0;
      
      // Check entities collection (dioceses/ISDs)
      const entitiesRef = collection(db, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`);
          const schoolsSnapshot = await getDocs(schoolsRef);
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            try {
              const teachersRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/teachers`);
              const teachersSnapshot = await getDocs(teachersRef);
              
              teachersSnapshot.forEach(teacherDoc => {
                const teacherData = teacherDoc.data();
                
                // Only count teachers for current academic year
                if (teacherData.academicYear === currentYear || teacherData.onboardingAcademicYear === currentYear) {
                  totalTeachers++;
                  
                  // Check if teacher has selected books
                  if (teacherData.selectedNominees && teacherData.selectedNominees.length > 0) {
                    teachersSelected++;
                  }
                  
                  // Check if teacher has released to students (custom field we'll add)
                  if (teacherData.releasedToStudents) {
                    teachersReleased++;
                  }
                }
              });
              
              // Count students in this school
              const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`);
              const studentsSnapshot = await getDocs(studentsRef);
              studentsActive += studentsSnapshot.size;
              
            } catch (teacherError) {
              console.log('No teachers in school:', schoolDoc.id);
            }
          }
        } catch (schoolError) {
          console.log('No schools in entity:', entityDoc.id);
        }
      }
      
      // Also check direct schools collection (single schools)
      const directSchoolsRef = collection(db, 'schools');
      const directSchoolsSnapshot = await getDocs(directSchoolsRef);
      
      for (const schoolDoc of directSchoolsSnapshot.docs) {
        const schoolData = schoolDoc.data();
        if (schoolData.type === 'single_school') {
          // For single schools, count the school itself as having 1 "teacher" (principal)
          totalTeachers++;
          if (schoolData.selectedNominees && schoolData.selectedNominees.length > 0) {
            teachersSelected++;
          }
          if (schoolData.releasedToStudents) {
            teachersReleased++;
          }
          studentsActive += schoolData.studentCount || 0;
        }
      }
      
      setPhaseData({
        currentPhase: config.programPhase || 'SETUP',
        academicYear: currentYear,
        teachersSelected,
        totalTeachers,
        teachersReleased,
        studentsActive,
        lastUpdated: new Date()
      });
      
      console.log('✅ Phase data loaded:', {
        phase: config.programPhase,
        year: currentYear,
        teachers: `${teachersSelected}/${totalTeachers}`,
        released: teachersReleased,
        students: studentsActive
      });
      
    } catch (error) {
      console.error('❌ Error loading phase data:', error);
      alert('Error loading phase data: ' + error.message);
    }
    setPhaseLoading(false);
  };

  // Release nominees to teachers (SETUP → TEACHER_SELECTION)
  const releaseNomineesToTeachers = async () => {
    const confirmed = window.confirm(`🚀 RELEASE NOMINEES TO TEACHERS?

This will:
• Change program phase to TEACHER_SELECTION
• Allow ALL teachers to see and select ${dbHelpers.getCurrentAcademicYear()} books
• Send notification to teachers that new books are available

Teachers can then select their books and release to students individually.

Continue?`);

    if (!confirmed) return;

    try {
      setPhaseLoading(true);
      
      // Update system phase
      await dbHelpers.updateProgramPhase('TEACHER_SELECTION');
      
      // Reload phase data
      await loadPhaseData();
      
      alert(`✅ SUCCESS! 

📚 Nominees released to teachers for ${dbHelpers.getCurrentAcademicYear()}
🎯 Phase: TEACHER_SELECTION
👩‍🏫 ${phaseData.totalTeachers} teachers can now select books

Next steps:
1. Teachers select their books for this year
2. Teachers individually release to their students
3. Program becomes ACTIVE when students start reading`);
      
    } catch (error) {
      console.error('❌ Error releasing nominees:', error);
      alert('Error releasing nominees: ' + error.message);
    }
    setPhaseLoading(false);
  };

  // Force start voting period (ACTIVE → VOTING)
  const forceStartVoting = async () => {
    const confirmed = window.confirm(`🗳️ START VOTING PERIOD?

This will:
• End the reading period (no new book submissions)
• Start the voting period for students
• Change phase to VOTING

Normally this happens automatically on March 31st.

Continue?`);

    if (!confirmed) return;

    try {
      setPhaseLoading(true);
      
      await dbHelpers.updateProgramPhase('VOTING');
      await loadPhaseData();
      
      alert(`✅ VOTING PERIOD STARTED!

🗳️ Students can now vote for their favorite books
📅 Voting ends April 14th
🏆 Results will be announced April 15th`);
      
    } catch (error) {
      console.error('❌ Error starting voting:', error);
      alert('Error starting voting: ' + error.message);
    }
    setPhaseLoading(false);
  };

  // Force end academic year and start new setup
  const startNewAcademicYear = async () => {
    const nextYear = getNextAcademicYear();
    
    const confirmed = window.confirm(`📅 START NEW ACADEMIC YEAR?

This will:
• End current year (${phaseData.academicYear})
• Start new year (${nextYear})
• Change phase to SETUP
• Reset teacher selections for new year

This should only be done in June when new nominees are ready.

Continue?`);

    if (!confirmed) return;

    try {
      setPhaseLoading(true);
      
      // Update system to new academic year
      await dbHelpers.updateProgramPhase('SETUP');
      
      // Update academic year in system config
      const systemConfigRef = doc(db, 'systemConfig', 'current');
      await updateDoc(systemConfigRef, {
        currentAcademicYear: nextYear,
        programPhase: 'SETUP',
        lastModified: new Date()
      });
      
      await loadPhaseData();
      
      alert(`✅ NEW ACADEMIC YEAR STARTED!

📅 Academic Year: ${nextYear}
📝 Phase: SETUP
🎯 Ready for new masterNominees upload

Next steps:
1. Upload new masterNominees for ${nextYear}
2. Release nominees to teachers
3. Teachers select and release to students`);
      
    } catch (error) {
      console.error('❌ Error starting new year:', error);
      alert('Error starting new academic year: ' + error.message);
    }
    setPhaseLoading(false);
  };

  // Helper function to get next academic year
  const getNextAcademicYear = () => {
    const current = dbHelpers.getCurrentAcademicYear();
    const [startYear] = current.split('-');
    const nextStart = parseInt(startYear) + 1;
    const nextEnd = (nextStart + 1).toString().slice(-2);
    return `${nextStart}-${nextEnd}`;
  };

  // Get phase display info
  const getPhaseInfo = (phase) => {
    const phases = {
      SETUP: {
        icon: '📝',
        name: 'Setup',
        description: 'Nominees uploaded, waiting to release to teachers',
        color: '#f59e0b'
      },
      TEACHER_SELECTION: {
        icon: '👩‍🏫',
        name: 'Teacher Selection',
        description: 'Teachers selecting books for their students',
        color: '#3b82f6'
      },
      ACTIVE: {
        icon: '📚',
        name: 'Active Reading',
        description: 'Students reading and submitting books',
        color: '#10b981'
      },
      VOTING: {
        icon: '🗳️',
        name: 'Voting Period',
        description: 'Students voting for favorite books (Mar 31 - Apr 14)',
        color: '#8b5cf6'
      },
      RESULTS: {
        icon: '🏆',
        name: 'Results',
        description: 'Winners announced, preparing for next year',
        color: '#f59e0b'
      },
      CLOSED: {
        icon: '❄️',
        name: 'Closed',
        description: 'Between academic years',
        color: '#6b7280'
      }
    };
    
    return phases[phase] || phases.SETUP;
  };

  const fetchAllEntities = async () => {
    setLoading(true)
    try {
      const entitiesData = []
      
      // Fetch from entities collection (dioceses/ISDs)
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const doc of entitiesSnapshot.docs) {
        const entityData = { id: doc.id, ...doc.data() }
        
        // For dioceses/ISDs, count actual schools in entities collection
        if (entityData.type === 'diocese' || entityData.type === 'isd') {
          try {
            const schoolsRef = collection(db, `entities/${doc.id}/schools`)
            const schoolsSnapshot = await getDocs(schoolsRef)
            entityData.actualSchoolCount = schoolsSnapshot.size
            
            // Count students and teachers across all schools in this entity
            let totalStudents = 0
            let totalTeachers = 0
            
            for (const schoolDoc of schoolsSnapshot.docs) {
              const schoolData = schoolDoc.data()
              totalStudents += schoolData.studentCount || 0
              totalTeachers += schoolData.teacherCount || 0
            }
            
            entityData.totalStudents = totalStudents
            entityData.totalTeachers = totalTeachers
          } catch (error) {
            console.log('No schools found for entity:', doc.id)
            entityData.actualSchoolCount = 0
            entityData.totalStudents = 0
            entityData.totalTeachers = 0
          }
        }
        
        entitiesData.push(entityData)
      }
      
      // Fetch from schools collection (single schools and libraries)
      const schoolsRef = collection(db, 'schools')
      const schoolsSnapshot = await getDocs(schoolsRef)
      
      schoolsSnapshot.forEach((doc) => {
        const schoolData = { id: doc.id, ...doc.data() }
        // Add type if not present (for backward compatibility)
        if (!schoolData.type) {
          schoolData.type = 'single_school'
        }
        entitiesData.push(schoolData)
      })
      
      setEntities(entitiesData)
      console.log('✅ Loaded entities:', entitiesData.length)
    } catch (error) {
      console.error('Error fetching entities:', error)
      alert('Error loading entities: ' + error.message)
    }
    setLoading(false)
  }

  // Generate codes based on entity type with geographic uniqueness
  const generateEntityCodes = async (entityData, entityType) => {
    const year = new Date().getFullYear()
    const stateCode = entityData.location.split(',')[1]?.trim().substring(0,2).toUpperCase() || 'US'
    const cityCode = entityData.location.split(',')[0]?.trim().replace(/[^A-Za-z]/g, '').substring(0,6).toUpperCase() || 'CITY'
    const geoPrefix = `${stateCode}${cityCode}`
    
    // Get existing codes to check for collisions
    const existingCodes = await getExistingEntityCodes()
    
    switch (entityType) {
      case 'diocese':
        const dioceseBaseCode = `${geoPrefix}-DIOCESE-${year}`
        const dioceseCode = await generateUniqueCode(dioceseBaseCode, existingCodes)
        const diocesePassword = generateSecurePassword(16)
        return {
          accessCode: dioceseCode,
          passwordHash: diocesePassword,
          type: 'diocese',
          // Diocese admin and principals use the SAME code (admin needs password, principals don't)
          principalJoinCode: dioceseCode
        }
      
      case 'isd':
        const isdBaseCode = `${geoPrefix}-ISD-${year}`
        const isdCode = await generateUniqueCode(isdBaseCode, existingCodes)
        const isdPassword = generateSecurePassword(16)
        return {
          accessCode: isdCode,
          passwordHash: isdPassword,
          type: 'isd',
          // ISD admin and principals use the SAME code (admin needs password, principals don't)
          principalJoinCode: isdCode
        }
      
      case 'single_school':
        const schoolPrefix = entityData.name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
        const principalLastName = entityData.principalLastName.replace(/[^A-Za-z]/g, '').substring(0, 6).toUpperCase()
        const schoolBaseCode = `${geoPrefix}-${schoolPrefix}-${principalLastName}-${year}`
        const schoolPassword = generateSecurePassword(16)
        return {
          accessCode: await generateUniqueCode(schoolBaseCode, existingCodes),
          passwordHash: schoolPassword,
          type: 'single_school',
          // Single schools get teacher join code for their dashboard
          teacherJoinCode: `${geoPrefix}-${schoolPrefix}-TEACHER-${year}`
        }
      
      case 'single_library':
        const libraryPrefix = entityData.name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
        const librarianLastName = entityData.principalLastName.replace(/[^A-Za-z]/g, '').substring(0, 6).toUpperCase()
        const libraryBaseCode = `${geoPrefix}-${libraryPrefix}-${librarianLastName}-${year}`
        const libraryPassword = generateSecurePassword(16)
        return {
          accessCode: await generateUniqueCode(libraryBaseCode, existingCodes),
          passwordHash: libraryPassword,
          type: 'single_library',
          // Single libraries get staff join code for their dashboard
          staffJoinCode: `${geoPrefix}-${libraryPrefix}-STAFF-${year}`
        }
      
      default:
        throw new Error('Unknown entity type')
    }
  }

  // Get existing entity codes to prevent collisions
  const getExistingEntityCodes = async () => {
    try {
      const codes = []
      
      // Check entities collection
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      entitiesSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.accessCode) codes.push(data.accessCode)
        if (data.principalJoinCode) codes.push(data.principalJoinCode)
      })
      
      // Check schools collection
      const schoolsRef = collection(db, 'schools')
      const schoolsSnapshot = await getDocs(schoolsRef)
      schoolsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.accessCode) codes.push(data.accessCode)
        if (data.teacherJoinCode) codes.push(data.teacherJoinCode)
      })
      
      return codes
    } catch (error) {
      console.error('Error getting existing codes:', error)
      return []
    }
  }

  // Generate unique code with collision detection
  const generateUniqueCode = async (baseCode, existingCodes) => {
    if (!existingCodes.includes(baseCode)) {
      return baseCode
    }
    
    let counter = 2
    let uniqueCode = `${baseCode}${counter}`
    
    while (existingCodes.includes(uniqueCode)) {
      counter++
      uniqueCode = `${baseCode}${counter}`
    }
    
    return uniqueCode
  }

  const generateSecurePassword = (length = 16) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one of each type
    password += randomFromSet('ABCDEFGHIJKLMNOPQRSTUVWXYZ') // Upper
    password += randomFromSet('abcdefghijklmnopqrstuvwxyz') // Lower  
    password += randomFromSet('0123456789') // Number
    password += randomFromSet('!@#$%^&*') // Special
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const randomFromSet = (set) => {
    return set.charAt(Math.floor(Math.random() * set.length))
  }

  // Dropdown-based program selection handlers
  const handleAddProgram = (programId) => {
    if (!programId || newEntity.selectedPrograms.includes(programId)) return
    
    setNewEntity(prev => ({
      ...prev,
      selectedPrograms: [...prev.selectedPrograms, programId]
    }))
  }

  const handleRemoveProgram = (programId) => {
    setNewEntity(prev => ({
      ...prev,
      selectedPrograms: prev.selectedPrograms.filter(p => p !== programId)
    }))
  }

  const getAvailableToAdd = () => {
    return availablePrograms.filter(program => 
      !newEntity.selectedPrograms.includes(program.id)
    )
  }

  const getTierInfo = () => {
    const tiers = {
      small: { maxPrograms: 1, price: 2000, extraListPrice: 500 },
      medium: { maxPrograms: 2, price: 4500, extraListPrice: 750 },
      large: { maxPrograms: 3, price: 8000, extraListPrice: 1000 },
      enterprise: { maxPrograms: 4, price: 15000, extraListPrice: 1250 }
    }
    return tiers[newEntity.tier] || tiers.medium
  }

  // Create new entity with enhanced program handling
  const handleCreateEntity = async () => {
    if (!newEntity.name || !newEntity.location) {
      alert('Please fill in all required fields')
      return
    }

    // Check for principal last name on single schools/libraries
    if ((newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') && !newEntity.principalLastName) {
      alert('Principal/Librarian last name is required for single institutions')
      return
    }

    // Validate program selection for multi-school entities
    if (['diocese', 'isd'].includes(newEntity.entityType)) {
      // Allow override validation but require at least one program for creation
      if (newEntity.selectedPrograms.length === 0) {
        alert('Please select at least one reading program for this ' + newEntity.entityType)
        return
      }
      
      const programValidation = validateProgramSelection(
        newEntity.tier, 
        newEntity.selectedPrograms, 
        customOverride,
        customMaxPrograms
      )
      
      if (!programValidation.valid && !customOverride) {
        const confirmOverride = window.confirm(
          `${programValidation.error}\n\nWould you like to override the tier limit? This will add custom pricing.`
        )
        if (!confirmOverride) return
        
        setCustomOverride(true)
        setCustomMaxPrograms(newEntity.selectedPrograms.length)
        return
      }
    }

    try {
      setLoading(true)
      
      // Generate appropriate codes for entity type
      const entityCodes = await generateEntityCodes(newEntity, newEntity.entityType)
      
      // Create entity data structure based on type
      let entityData
      
      if (newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') {
        // Single schools/libraries go directly in schools collection
        entityData = {
          // Basic info
          type: newEntity.entityType,
          name: newEntity.name,
          city: newEntity.location.split(',')[0]?.trim() || '',
          state: newEntity.location.split(',')[1]?.trim() || '',
          
          // Access codes
          accessCode: entityCodes.accessCode,
          passwordHash: entityCodes.passwordHash,
          teacherJoinCode: entityCodes.teacherJoinCode || null,
          staffJoinCode: entityCodes.staffJoinCode || null,
          
          // Principal/Librarian info
          principalLastName: newEntity.principalLastName,
          adminEmail: newEntity.adminEmail,
          
          // Program configuration (single institutions get default)
          selectedPrograms: ['luxlibris'], // Default for single institutions
          programsIncluded: 1,
          
          // Configuration (no parent entity)
          parentEntityId: null,
          parentEntityType: null,
          
          // Contact info
          contactInfo: newEntity.contactInfo,
          
          // Institution specifics
          selectedNominees: [],
          achievementTiers: [],
          submissionOptions: { quiz: true },
          
          // Counts
          teacherCount: 0,
          studentCount: 0,
          
          // Status
          status: 'active',
          createdAt: new Date(),
          createdBy: 'Dr. Verity Kahn',
          lastModified: new Date()
        }
      } else {
        // Diocese/ISD goes in entities collection
        entityData = {
          // Basic info
          type: newEntity.entityType,
          name: newEntity.name,
          city: newEntity.location.split(',')[0]?.trim() || '',
          state: newEntity.location.split(',')[1]?.trim() || '',
          
          // Access codes
          accessCode: entityCodes.accessCode,
          passwordHash: entityCodes.passwordHash,
          principalJoinCode: entityCodes.principalJoinCode,
          
          // Program configuration
          selectedPrograms: newEntity.selectedPrograms,
          programsIncluded: newEntity.selectedPrograms.length,
          customProgramOverride: customOverride,
          customMaxPrograms: customMaxPrograms,
          programPricing: programPricing,
          
          // Licensing (for multi-school entities)
          tier: newEntity.tier,
          maxSubEntities: getTierLimits(newEntity.tier).maxSchools,
          currentSubEntities: 0,
          licenseExpiration: `${new Date().getFullYear() + 1}-08-31`,
          
          // Contact Info
          adminEmail: newEntity.adminEmail,
          contactInfo: newEntity.contactInfo,
          
          // Status
          status: 'active',
          createdAt: new Date(),
          createdBy: 'Dr. Verity Kahn',
          lastModified: new Date()
        }
      }

      // Save to appropriate collection
      let entityDocRef
      if (newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') {
        // Save to schools collection for single institutions
        entityDocRef = await addDoc(collection(db, 'schools'), entityData)
      } else {
        // Save to entities collection for dioceses/ISDs
        entityDocRef = await addDoc(collection(db, 'entities'), entityData)
      }
      
      console.log('✅ Entity created with ID:', entityDocRef.id)

      // Show success with codes
      showEntityCreatedSuccess(entityData, entityCodes)
      
      // Reset form
      setNewEntity({
        entityType: 'diocese',
        name: '',
        location: '',
        adminEmail: '',
        principalLastName: '',
        tier: 'medium',
        selectedPrograms: [],
        customProgramCount: null,
        contactInfo: {}
      })
      setCustomOverride(false)
      setCustomMaxPrograms(null)
      setShowCreateEntity(false)
      
      // Refresh entities list
      fetchAllEntities()
      
    } catch (error) {
      console.error('Error creating entity:', error)
      alert('Error creating entity: ' + error.message)
    }
    setLoading(false)
  }

  const getTierLimits = (tier) => {
    const tiers = {
      small: { maxSchools: 5, price: 2000 },
      medium: { maxSchools: 15, price: 4500 },
      large: { maxSchools: 30, price: 8000 },
      enterprise: { maxSchools: 100, price: 15000 }
    }
    return tiers[tier] || tiers.medium
  }

  const showEntityCreatedSuccess = (entityData, codes) => {
    const instructions = generateEntityInstructions(entityData, codes)
    alert(`🎉 ${entityData.type.toUpperCase()} CREATED SUCCESSFULLY!

${instructions}

Access these credentials securely!`)
  }

  // Generate instructions with program info
  const generateEntityInstructions = (entityData, codes) => {
    const programsList = entityData.selectedPrograms?.join(', ') || 'Lux Libris'
    const programCount = entityData.programsIncluded || 1
    const pricing = entityData.programPricing
    
    const programInfo = `
📚 Programs: ${programsList} (${programCount} lists)
${pricing?.extraListsAdded > 0 ? `💰 Extra Lists: ${pricing.extraListsAdded} (+$${pricing.breakdown.extraLists})` : ''}
${pricing?.totalPrice ? `💳 Total Price: $${pricing.totalPrice}` : ''}`

    switch (entityData.type) {
      case 'diocese':
        return `
📋 DIOCESE SETUP COMPLETE:
🏛️ Entity: ${entityData.name}
${programInfo}
🔑 Diocese Access Code: ${codes.accessCode}
🔒 Diocese Password: ${codes.passwordHash}
📍 Dashboard: luxlibris.org/diocese/dashboard

👥 PRINCIPAL JOIN CODE (share with ALL principals):
🎯 Principal Code: ${codes.principalJoinCode}

📝 NEXT STEPS:
1. Send diocese access code + password to diocese administrator
2. Diocese admin logs in and shares principal join code with schools
3. Principals self-register at: luxlibris.org/school/signup
4. Schools automatically appear in diocese dashboard`

      case 'isd':
        return `
📋 ISD SETUP COMPLETE:
🏫 Entity: ${entityData.name}
${programInfo}
🔑 ISD Access Code: ${codes.accessCode}
🔒 ISD Password: ${codes.passwordHash}
📍 Dashboard: luxlibris.org/diocese/dashboard

👥 PRINCIPAL JOIN CODE (share with ALL principals):
🎯 Principal Code: ${codes.principalJoinCode}

📝 NEXT STEPS:
1. Send ISD access code + password to ISD administrator
2. ISD admin logs in and shares principal join code with schools
3. Principals self-register at: luxlibris.org/school/signup
4. Schools automatically appear in ISD dashboard`

      case 'single_school':
        return `
📋 SINGLE SCHOOL SETUP COMPLETE:
🏫 School: ${entityData.name}
📚 Program: Lux Libris (default)
🔑 Principal Login Code: ${codes.accessCode}
🔒 Principal Password: ${codes.passwordHash}
👨‍🏫 Teacher Join Code: ${codes.teacherJoinCode}
📍 Dashboard: luxlibris.org/school/dashboard

📝 NEXT STEPS:
1. Send principal login code + password to principal
2. Principal logs in and creates teacher accounts with teacher join code
3. Teachers get student/parent codes from their dashboard
4. Start managing reading program independently`

      case 'single_library':
        return `
📋 SINGLE LIBRARY SETUP COMPLETE:
📚 Library: ${entityData.name}
📚 Program: Lux Libris (default)
🔑 Librarian Login Code: ${codes.accessCode}
🔒 Librarian Password: ${codes.passwordHash}
👥 Staff Join Code: ${codes.staffJoinCode}
📍 Dashboard: luxlibris.org/library/dashboard

📝 NEXT STEPS:
1. Send librarian login code + password to head librarian
2. Librarian logs in and creates staff accounts with staff join code
3. Staff manage reading programs and patron accounts
4. Start managing library reading initiatives`

      default:
        return 'Entity created successfully!'
    }
  }

  // Delete entity
  const handleDeleteEntity = async (entityId, entityName, entityType) => {
    const confirmed = window.confirm(`⚠️ DELETE ENTIRE ${entityType.toUpperCase()}?

This will permanently delete:
• Entity: ${entityName}
• ALL schools/branches under this entity (if applicable)
• ALL users in these schools
• ALL data associated with this entity

This action CANNOT be undone!

Type "DELETE" to confirm:`)
    
    if (confirmed) {
      const userInput = window.prompt('Type "DELETE" to confirm:')
      if (userInput === 'DELETE') {
        try {
          setLoading(true)
          
          // Delete from appropriate collection
          if (entityType === 'single_school' || entityType === 'single_library') {
            await deleteDoc(doc(db, 'schools', entityId))
          } else {
            await deleteDoc(doc(db, 'entities', entityId))
            
            // For dioceses/ISDs, also clean up the entities subcollection if it exists
            try {
              const schoolsRef = collection(db, `entities/${entityId}/schools`)
              const schoolsSnapshot = await getDocs(schoolsRef)
              
              // Delete all schools in the entity
              for (const schoolDoc of schoolsSnapshot.docs) {
                await deleteDoc(schoolDoc.ref)
              }
            } catch (error) {
              console.log('No entities subcollection to clean up')
            }
          }
          
          console.log('✅ Entity deleted successfully')
          alert(`Entity "${entityName}" has been deleted.`)
          fetchAllEntities()
        } catch (error) {
          console.error('❌ Error deleting entity:', error)
          alert('Error deleting entity: ' + error.message)
        }
        setLoading(false)
      }
    }
  }

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('godModeSession')
    setEntities([])
    setLastActivity(Date.now())
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>GOD MODE - Authentication Required</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              👑
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              GOD MODE
            </h1>
            <p style={{
              color: '#c084fc',
              marginBottom: '2rem'
            }}>
              Supreme Administrator Access - Entity & Program Management
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter God Mode Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🚀 ENTER GOD MODE
            </button>
          </div>
        </div>
      </>
    )
  }

  // Main Interface
  return (
    <>
      <Head>
        <title>GOD MODE - Entity & Program Management</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
          padding: '1rem 0'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                👑
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  GOD MODE
                </h1>
                <p style={{
                  color: '#c084fc',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Entity & Program Management System
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Session Timer */}
              <div style={{
                padding: '0.5rem 1rem',
                background: sessionTimeRemaining <= 10 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(168, 85, 247, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#c084fc',
                border: sessionTimeRemaining <= 10 
                  ? '1px solid rgba(239, 68, 68, 0.3)' 
                  : '1px solid rgba(168, 85, 247, 0.3)',
                fontWeight: '600'
              }}>
                ⏰ Session: {sessionTimeRemaining} minutes
              </div>
              
              {/* Operational buttons replacing test buttons */}
              <button
                onClick={runSystemHealthCheck}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginRight: '1rem'
                }}
              >
                🔧 System Health
              </button>

              <button
                onClick={showAcademicYearInfo}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginRight: '1rem'
                }}
              >
                📅 Academic Year Info
              </button>
              
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
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
          
          {/* Global Stats Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <GlobalStatCard 
              title="Dioceses" 
              value={entities.filter(e => e.type === 'diocese').length}
              subtitle="Catholic dioceses active"
              icon="⛪" 
              color="#3b82f6"
            />
            <GlobalStatCard 
              title="ISDs" 
              value={entities.filter(e => e.type === 'isd').length}
              subtitle="School districts active"
              icon="🏫" 
              color="#8b5cf6"
            />
            <GlobalStatCard 
              title="Total Schools" 
              value={
                entities.filter(e => e.type === 'single_school' || e.type === 'single_library').length + 
                entities.filter(e => e.type === 'diocese' || e.type === 'isd').reduce((sum, e) => sum + (e.actualSchoolCount || 0), 0)
              }
              subtitle="All schools & libraries"
              icon="🎓" 
              color="#10b981"
            />
            <GlobalStatCard 
              title="Active Programs" 
              value={availablePrograms.length}
              subtitle="Reading programs available"
              icon="📚" 
              color="#f59e0b"
            />
            <GlobalStatCard 
              title="Students" 
              value={
                entities.reduce((sum, e) => {
                  if (e.type === 'single_school' || e.type === 'single_library') {
                    return sum + (e.studentCount || 0)
                  } else if (e.type === 'diocese' || e.type === 'isd') {
                    return sum + (e.totalStudents || 0)
                  }
                  return sum
                }, 0)
              }
              subtitle="Total enrollment"
              icon="👨‍🎓" 
              color="#ef4444"
            />
          </div>

          {/* PHASE MANAGEMENT SECTION - INSERTED AFTER GLOBAL STATS */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(16, 185, 129, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                fontFamily: 'Georgia, serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎯 Academic Year Control Center
              </h2>
              <button
                onClick={loadPhaseData}
                disabled={phaseLoading}
                style={{
                  background: phaseLoading ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: phaseLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                {phaseLoading ? '⏳ Loading...' : '🔄 Refresh Data'}
              </button>
            </div>

            {/* Current Status Display */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {/* Current Phase */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: `2px solid ${getPhaseInfo(phaseData.currentPhase).color}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {getPhaseInfo(phaseData.currentPhase).icon}
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  {getPhaseInfo(phaseData.currentPhase).name}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#c084fc'
                }}>
                  {getPhaseInfo(phaseData.currentPhase).description}
                </div>
              </div>

              {/* Academic Year */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '2px solid #3b82f6',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  {phaseData.academicYear}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#c084fc'
                }}>
                  Current Academic Year
                </div>
              </div>

              {/* Teacher Progress */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '2px solid #8b5cf6',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👩‍🏫</div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  {phaseData.teachersSelected}/{phaseData.totalTeachers}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#c084fc'
                }}>
                  Teachers Selected Books
                </div>
              </div>

              {/* Student Activity */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '2px solid #f59e0b',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  {phaseData.studentsActive}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#c084fc'
                }}>
                  Active Students
                </div>
              </div>
            </div>

            {/* Phase Control Buttons */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '1rem',
                fontFamily: 'Georgia, serif'
              }}>
                🎛️ Phase Controls
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                
                {/* Release to Teachers Button */}
                {phaseData.currentPhase === 'SETUP' && (
                  <button
                    onClick={releaseNomineesToTeachers}
                    disabled={phaseLoading}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: phaseLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}
                  >
                    🚀 Release Nominees to Teachers
                  </button>
                )}

                {/* Force Start Voting Button */}
                {phaseData.currentPhase === 'ACTIVE' && (
                  <button
                    onClick={forceStartVoting}
                    disabled={phaseLoading}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: phaseLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}
                  >
                    🗳️ Force Start Voting Period
                  </button>
                )}

                {/* Start New Academic Year Button */}
                {(phaseData.currentPhase === 'RESULTS' || phaseData.currentPhase === 'CLOSED') && (
                  <button
                    onClick={startNewAcademicYear}
                    disabled={phaseLoading}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: phaseLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}
                  >
                    📅 Start New Academic Year
                  </button>
                )}

                {/* Always Available: Generate Report */}
                <button
                  onClick={() => alert('📊 Annual report generation coming soon!')}
                  disabled={phaseLoading}
                  style={{
                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: phaseLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}
                >
                  📊 Generate Annual Report
                </button>
              </div>

              {/* Phase Information */}
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.375rem',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.5rem'
                }}>
                  ℹ️ Current Phase: {getPhaseInfo(phaseData.currentPhase).name}
                </h4>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#c084fc',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {getPhaseInfo(phaseData.currentPhase).description}
                  {phaseData.lastUpdated && (
                    <span style={{ display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      Last updated: {phaseData.lastUpdated.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Create Entity Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                fontFamily: 'Georgia, serif'
              }}>
                Create New Entity
              </h2>
              <button
                onClick={() => setShowCreateEntity(!showCreateEntity)}
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                {showCreateEntity ? '❌ Cancel' : '➕ Create Entity'}
              </button>
            </div>

            {showCreateEntity && (
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Entity Type Selection */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      Entity Type *
                    </label>
                    <select
                      value={newEntity.entityType}
                      onChange={(e) => setNewEntity({...newEntity, entityType: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="diocese">🏛️ Catholic Diocese</option>
                      <option value="isd">🏫 Independent School District</option>
                      <option value="single_school">🎓 Single School</option>
                      <option value="single_library">📚 Single Library</option>
                    </select>
                  </div>

                  {/* Entity Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {newEntity.entityType === 'diocese' ? 'Diocese Name *' : 
                       newEntity.entityType === 'isd' ? 'ISD Name *' :
                       newEntity.entityType === 'single_library' ? 'Library Name *' :
                       'School Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder={newEntity.entityType === 'diocese' ? 'Diocese of Austin' : 
                                 newEntity.entityType === 'isd' ? 'Austin ISD' :
                                 newEntity.entityType === 'single_library' ? 'Austin Central Library' :
                                 'Holy Family Catholic School'}
                      value={newEntity.name}
                      onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      Location *
                    </label>
                    <input
                      type="text"
                      placeholder="Austin, TX"
                      value={newEntity.location}
                      onChange={(e) => setNewEntity({...newEntity, location: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Admin Email */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {newEntity.entityType === 'diocese' ? 'Diocese Admin Email' : 
                       newEntity.entityType === 'isd' ? 'ISD Admin Email' :
                       newEntity.entityType === 'single_library' ? 'Librarian Email' :
                       'Principal Email'}
                    </label>
                    <input
                      type="email"
                      placeholder={newEntity.entityType === 'diocese' ? 'admin@diocese.org' : 
                                 newEntity.entityType === 'isd' ? 'admin@austinisd.org' :
                                 newEntity.entityType === 'single_library' ? 'librarian@library.org' :
                                 'principal@school.edu'}
                      value={newEntity.adminEmail}
                      onChange={(e) => setNewEntity({...newEntity, adminEmail: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Principal/Librarian Last Name (for single schools/libraries) */}
                  {(newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') && (
                    <div>
                      <label style={{
                        display: 'block',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {newEntity.entityType === 'single_library' ? 'Librarian Last Name *' : 'Principal Last Name *'}
                      </label>
                      <input
                        type="text"
                        placeholder={newEntity.entityType === 'single_library' ? 'Johnson' : 'Smith'}
                        value={newEntity.principalLastName}
                        onChange={(e) => setNewEntity({...newEntity, principalLastName: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  )}

                  {/* Tier Selection (only for multi-school entities) */}
                  {['diocese', 'isd'].includes(newEntity.entityType) && (
                    <div>
                      <label style={{
                        display: 'block',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        License Tier *
                      </label>
                      <select
                        value={newEntity.tier}
                        onChange={(e) => setNewEntity({...newEntity, tier: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="small">Small (1 program) - $2,000/year</option>
                        <option value="medium">Medium (2 programs) - $4,500/year</option>
                        <option value="large">Large (3 programs) - $8,000/year</option>
                        <option value="enterprise">Enterprise (4+ programs) - $15,000/year</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Dropdown-based Program Selection Section (only for multi-school entities) */}
                {['diocese', 'isd'].includes(newEntity.entityType) && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      📚 Reading Programs *
                    </label>
                    
                    {/* Tier Information */}
                    <div style={{ 
                      marginBottom: '1rem', 
                      padding: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: '#a78bfa' }}>
                          🎯 <strong>{newEntity.tier.toUpperCase()}</strong> tier includes: {getTierInfo().maxPrograms} programs
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
                          💰 Base price: ${getTierInfo().price.toLocaleString()}/year
                        </span>
                      </div>
                      
                      {customOverride && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem',
                          background: 'rgba(245, 158, 11, 0.2)',
                          borderRadius: '0.25rem',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          <span style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: '600' }}>
                            ⚠️ OVERRIDE ACTIVE: {customMaxPrograms} max programs
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Currently Selected Programs */}
                    {newEntity.selectedPrograms.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ 
                          color: 'white', 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          marginBottom: '0.5rem' 
                        }}>
                          Selected Programs ({newEntity.selectedPrograms.length}):
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {newEntity.selectedPrograms.map((programId, index) => {
                            const program = availablePrograms.find(p => p.id === programId)
                            const isIncludedInTier = index < getTierInfo().maxPrograms
                            const isExtra = !isIncludedInTier && !customOverride
                            
                            return (
                              <div key={programId} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                background: isExtra 
                                  ? 'rgba(245, 158, 11, 0.2)' 
                                  : 'rgba(16, 185, 129, 0.2)',
                                borderRadius: '0.375rem',
                                border: isExtra 
                                  ? '1px solid rgba(245, 158, 11, 0.3)' 
                                  : '1px solid rgba(16, 185, 129, 0.3)'
                              }}>
                                <div>
                                  <span style={{ 
                                    color: 'white', 
                                    fontWeight: '600',
                                    marginRight: '0.5rem'
                                  }}>
                                    {program ? `${program.icon} ${program.name}` : programId}
                                  </span>
                                  {isExtra && (
                                    <span style={{ 
                                      fontSize: '0.75rem', 
                                      color: '#f59e0b',
                                      fontWeight: '600'
                                    }}>
                                      (+${getTierInfo().extraListPrice} extra)
                                    </span>
                                  )}
                                  {!isIncludedInTier && customOverride && (
                                    <span style={{ 
                                      fontSize: '0.75rem', 
                                      color: '#8b5cf6',
                                      fontWeight: '600'
                                    }}>
                                      (Override)
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveProgram(programId)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.8)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}
                                >
                                  ❌ Remove
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add Program Dropdown */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            Add Reading Program:
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddProgram(e.target.value)
                                e.target.value = '' // Reset dropdown
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: 'white',
                              fontSize: '0.875rem'
                            }}
                          >
                            <option value="">
                              {getAvailableToAdd().length === 0 
                                ? 'All programs selected' 
                                : 'Choose a program to add...'}
                            </option>
                            {getAvailableToAdd().map(program => (
                              <option key={program.id} value={program.id}>
                                {program.icon} {program.name} - {program.targetAudience}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Calculation */}
                    {newEntity.selectedPrograms.length > 0 && (
                      <div style={{
                        padding: '0.75rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ 
                          color: 'white', 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          marginBottom: '0.5rem' 
                        }}>
                          💰 Pricing Breakdown:
                        </h4>
                        {(() => {
                          const tierInfo = getTierInfo()
                          const includedPrograms = Math.min(newEntity.selectedPrograms.length, tierInfo.maxPrograms)
                          const extraPrograms = Math.max(0, newEntity.selectedPrograms.length - tierInfo.maxPrograms)
                          const extraCost = extraPrograms * tierInfo.extraListPrice
                          const totalCost = tierInfo.price + extraCost
                          
                          return (
                            <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                              <div>• Base ({tierInfo.maxPrograms} programs): ${tierInfo.price.toLocaleString()}</div>
                              {extraPrograms > 0 && (
                                <div style={{ color: '#f59e0b' }}>
                                  • Extra programs ({extraPrograms}): ${extraCost.toLocaleString()}
                                </div>
                              )}
                              <div style={{ 
                                fontWeight: '600', 
                                fontSize: '0.875rem', 
                                color: 'white', 
                                marginTop: '0.25rem',
                                borderTop: '1px solid rgba(168, 85, 247, 0.3)',
                                paddingTop: '0.25rem'
                              }}>
                                Total Annual Cost: ${totalCost.toLocaleString()}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Override Controls */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {!customOverride && newEntity.selectedPrograms.length >= getTierInfo().maxPrograms && (
                        <button
                          onClick={() => {
                            setCustomOverride(true)
                            setCustomMaxPrograms(newEntity.selectedPrograms.length + 1)
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ➕ Enable Extra Programs (+${getTierInfo().extraListPrice}/program)
                        </button>
                      )}
                      
                      {customOverride && (
                        <button
                          onClick={() => {
                            setCustomOverride(false)
                            setCustomMaxPrograms(null)
                            // Trim selection back to tier limit
                            const tierInfo = getTierInfo()
                            if (newEntity.selectedPrograms.length > tierInfo.maxPrograms) {
                              setNewEntity(prev => ({
                                ...prev,
                                selectedPrograms: prev.selectedPrograms.slice(0, tierInfo.maxPrograms)
                              }))
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          🚫 Remove Override (trim to {getTierInfo().maxPrograms})
                        </button>
                      )}
                    </div>

                    {/* Validation Message */}
                    {newEntity.selectedPrograms.length === 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                          ⚠️ Please select at least one reading program
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCreateEntity}
                  disabled={loading || !newEntity.name || !newEntity.location || 
                           ((newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') && !newEntity.principalLastName) ||
                           (['diocese', 'isd'].includes(newEntity.entityType) && newEntity.selectedPrograms.length === 0)}
                  style={{
                    background: loading ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginTop: '1rem'
                  }}
                >
                  {loading ? '⏳ Creating...' : `✅ Create ${newEntity.entityType.charAt(0).toUpperCase() + newEntity.entityType.slice(1).replace('_', ' ')}`}
                </button>
              </div>
            )}
          </div>

          {/* Entities List */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                fontFamily: 'Georgia, serif'
              }}>
                All Entities ({entities.length})
              </h2>
              
              <button
                onClick={() => fetchAllEntities()}
                disabled={loading}
                style={{
                  background: loading ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                {loading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {entities.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#c084fc',
                padding: '2rem'
              }}>
                <p>No entities created yet. Create your first entity above!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {entities.map(entity => (
                  <EntityCard 
                    key={entity.id} 
                    entity={entity} 
                    onDelete={handleDeleteEntity}
                    availablePrograms={availablePrograms}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Global Statistics Card Component
function GlobalStatCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '0.25rem'
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#c084fc',
        fontWeight: '600',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#a78bfa'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

// Entity Card with Program Info
function EntityCard({ entity, onDelete, availablePrograms }) {
  const getEntityIcon = (type) => {
    switch (type) {
      case 'diocese': return '🏛️'
      case 'isd': return '🏫'
      case 'single_school': return '🎓'
      case 'single_library': return '📚'
      default: return '🏢'
    }
  }

  const getEntityLabel = (type) => {
    switch (type) {
      case 'diocese': return 'Catholic Diocese'
      case 'isd': return 'Independent School District'
      case 'single_school': return 'Single School'
      case 'single_library': return 'Single Library'
      default: return 'Entity'
    }
  }

  const getUsageDisplay = (entity) => {
    if (entity.type === 'single_school' || entity.type === 'single_library') {
      const staffLabel = entity.type === 'single_library' ? 'staff' : 'teachers'
      const patronLabel = entity.type === 'single_library' ? 'patrons' : 'students'
      return `👨‍🏫 ${entity.teacherCount || 0} ${staffLabel} • 🎓 ${entity.studentCount || 0} ${patronLabel}`
    } else {
      const actual = entity.actualSchoolCount || 0
      const max = entity.maxSubEntities || 0
      const isNearLimit = actual >= max * 0.8
      const isOverLimit = actual > max
      
      return (
        <span style={{ 
          color: isOverLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#a78bfa'
        }}>
          🏫 {actual}/{max} schools {isOverLimit ? '(OVER LIMIT!)' : ''}
        </span>
      )
    }
  }

  // Get program names from IDs
  const getProgramNames = (programIds) => {
    if (!programIds || programIds.length === 0) return ['Lux Libris (default)']
    
    return programIds.map(id => {
      const program = availablePrograms.find(p => p.id === id)
      return program ? `${program.icon} ${program.name}` : id
    })
  }

  return (
    <div style={{
      background: 'rgba(139, 92, 246, 0.2)',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid rgba(139, 92, 246, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.5rem'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {getEntityIcon(entity.type)} {entity.name}
          </h3>
          <p style={{ color: '#c084fc', margin: '0.25rem 0', fontSize: '0.875rem' }}>
            📍 {entity.city}, {entity.state} • {getEntityLabel(entity.type)}
          </p>

          {/* ENHANCED: Program Info */}
          {entity.selectedPrograms && entity.selectedPrograms.length > 0 && (
            <div style={{ margin: '0.5rem 0' }}>
              <p style={{ color: '#10b981', margin: '0.25rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                📚 Programs ({entity.programsIncluded || entity.selectedPrograms.length}):
              </p>
              <div style={{ marginLeft: '1rem' }}>
                {getProgramNames(entity.selectedPrograms).map((programName, index) => (
                  <p key={index} style={{ color: '#a78bfa', margin: '0.125rem 0', fontSize: '0.75rem' }}>
                    • {programName}
                  </p>
                ))}
              </div>
              {entity.customProgramOverride && (
                <p style={{ color: '#f59e0b', margin: '0.25rem 0', fontSize: '0.75rem' }}>
                  ⚠️ Custom override: {entity.customMaxPrograms} max programs
                </p>
              )}
              {entity.programPricing && entity.programPricing.extraListsAdded > 0 && (
                <p style={{ color: '#f59e0b', margin: '0.25rem 0', fontSize: '0.75rem' }}>
                  💰 Extra lists: +${entity.programPricing.breakdown.extraLists} (Total: ${entity.programPricing.totalPrice})
                </p>
              )}
            </div>
          )}
          
          <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
            🔑 {entity.type === 'diocese' || entity.type === 'isd' ? 'Admin Access' : 'Login Code'}: <strong>{entity.accessCode}</strong>
          </p>
          
          {/* Show diocesan password for dioceses/ISDs (since admin code = principal join code) */}
          {(entity.type === 'diocese' || entity.type === 'isd') && entity.passwordHash && (
            <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              🔒 Admin Password: <strong>{entity.passwordHash}</strong>
            </p>
          )}
          
          {/* Show teacher/staff join code for single institutions */}
          {entity.type === 'single_school' && entity.teacherJoinCode && (
            <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              👨‍🏫 Teacher Code: <strong>{entity.teacherJoinCode}</strong>
            </p>
          )}
          
          {entity.type === 'single_library' && entity.staffJoinCode && (
            <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              👥 Staff Code: <strong>{entity.staffJoinCode}</strong>
            </p>
          )}
          
          {/* Show principal/librarian last name for single institutions */}
          {(entity.type === 'single_school' || entity.type === 'single_library') && entity.principalLastName && (
            <p style={{ color: '#c084fc', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              👤 {entity.type === 'single_library' ? 'Librarian' : 'Principal'}: {entity.principalLastName}
            </p>
          )}
          
          {/* Usage statistics */}
          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
            {getUsageDisplay(entity)}
          </p>
          
          {/* Tier info for multi-school entities */}
          {entity.tier && (
            <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              📊 Tier: <strong>{entity.tier}</strong> • Status: {entity.status || 'active'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onDelete(entity.id, entity.name, entity.type)}
            style={{
              background: 'rgba(239, 68, 68, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
            title={`Delete ${entity.type}`}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}
// pages/god-mode/entities.js - ENTITY MANAGEMENT
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { 
  getAllActivePrograms,
  getAvailableProgramsForTier,
  validateProgramSelection,
  calculateProgramPricing
} from '../../setup-programs'

export default function EntitiesManagement() {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateEntity, setShowCreateEntity] = useState(false)
  
  // Program Management State
  const [availablePrograms, setAvailablePrograms] = useState([])
  const [customOverride, setCustomOverride] = useState(false)
  const [customMaxPrograms, setCustomMaxPrograms] = useState(null)
  const [programPricing, setProgramPricing] = useState(null)

  const [newEntity, setNewEntity] = useState({
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
          setNewEntity(prev => ({
            ...prev,
            selectedPrograms: [],
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

  const fetchAllEntities = async () => {
    setLoading(true)
    try {
      const entitiesData = []
      
      // Fetch from entities collection (dioceses/ISDs)
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const doc of entitiesSnapshot.docs) {
        const entityData = { id: doc.id, ...doc.data() }
        
        if (entityData.type === 'diocese' || entityData.type === 'isd') {
          try {
            const schoolsRef = collection(db, `entities/${doc.id}/schools`)
            const schoolsSnapshot = await getDocs(schoolsRef)
            entityData.actualSchoolCount = schoolsSnapshot.size
            
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

  // Entity creation functions
  const generateEntityCodes = async (entityData, entityType) => {
    const year = new Date().getFullYear()
    const stateCode = entityData.location.split(',')[1]?.trim().substring(0,2).toUpperCase() || 'US'
    const cityCode = entityData.location.split(',')[0]?.trim().replace(/[^A-Za-z]/g, '').substring(0,6).toUpperCase() || 'CITY'
    const geoPrefix = `${stateCode}${cityCode}`
    
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
          staffJoinCode: `${geoPrefix}-${libraryPrefix}-STAFF-${year}`
        }
      
      default:
        throw new Error('Unknown entity type')
    }
  }

  const getExistingEntityCodes = async () => {
    try {
      const codes = []
      
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      entitiesSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.accessCode) codes.push(data.accessCode)
        if (data.principalJoinCode) codes.push(data.principalJoinCode)
      })
      
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
    
    password += randomFromSet('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    password += randomFromSet('abcdefghijklmnopqrstuvwxyz')
    password += randomFromSet('0123456789')
    password += randomFromSet('!@#$%^&*')
    
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const randomFromSet = (set) => {
    return set.charAt(Math.floor(Math.random() * set.length))
  }

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

  const getTierLimits = (tier) => {
    const tiers = {
      small: { maxSchools: 5, price: 2000 },
      medium: { maxSchools: 15, price: 4500 },
      large: { maxSchools: 30, price: 8000 },
      enterprise: { maxSchools: 100, price: 15000 }
    }
    return tiers[tier] || tiers.medium
  }

  const handleCreateEntity = async () => {
    if (!newEntity.name || !newEntity.location) {
      alert('Please fill in all required fields')
      return
    }

    if ((newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') && !newEntity.principalLastName) {
      alert('Principal/Librarian last name is required for single institutions')
      return
    }

    if (['diocese', 'isd'].includes(newEntity.entityType)) {
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
      
      const entityCodes = await generateEntityCodes(newEntity, newEntity.entityType)
      
      let entityData
      
      if (newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') {
        entityData = {
          type: newEntity.entityType,
          name: newEntity.name,
          city: newEntity.location.split(',')[0]?.trim() || '',
          state: newEntity.location.split(',')[1]?.trim() || '',
          accessCode: entityCodes.accessCode,
          passwordHash: entityCodes.passwordHash,
          teacherJoinCode: entityCodes.teacherJoinCode || null,
          staffJoinCode: entityCodes.staffJoinCode || null,
          principalLastName: newEntity.principalLastName,
          adminEmail: newEntity.adminEmail,
          selectedPrograms: ['luxlibris'],
          programsIncluded: 1,
          parentEntityId: null,
          parentEntityType: null,
          contactInfo: newEntity.contactInfo,
          selectedNominees: [],
          achievementTiers: [],
          submissionOptions: { quiz: true },
          teacherCount: 0,
          studentCount: 0,
          status: 'active',
          createdAt: new Date(),
          createdBy: 'Dr. Verity Kahn',
          lastModified: new Date()
        }
      } else {
        entityData = {
          type: newEntity.entityType,
          name: newEntity.name,
          city: newEntity.location.split(',')[0]?.trim() || '',
          state: newEntity.location.split(',')[1]?.trim() || '',
          accessCode: entityCodes.accessCode,
          passwordHash: entityCodes.passwordHash,
          principalJoinCode: entityCodes.principalJoinCode,
          selectedPrograms: newEntity.selectedPrograms,
          programsIncluded: newEntity.selectedPrograms.length,
          customProgramOverride: customOverride,
          customMaxPrograms: customMaxPrograms,
          programPricing: programPricing,
          tier: newEntity.tier,
          maxSubEntities: getTierLimits(newEntity.tier).maxSchools,
          currentSubEntities: 0,
          licenseExpiration: `${new Date().getFullYear() + 1}-08-31`,
          adminEmail: newEntity.adminEmail,
          contactInfo: newEntity.contactInfo,
          status: 'active',
          createdAt: new Date(),
          createdBy: 'Dr. Verity Kahn',
          lastModified: new Date()
        }
      }

      let entityDocRef
      if (newEntity.entityType === 'single_school' || newEntity.entityType === 'single_library') {
        entityDocRef = await addDoc(collection(db, 'schools'), entityData)
      } else {
        entityDocRef = await addDoc(collection(db, 'entities'), entityData)
      }
      
      console.log('✅ Entity created with ID:', entityDocRef.id)
      showEntityCreatedSuccess(entityData, entityCodes)
      
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
      
      fetchAllEntities()
      
    } catch (error) {
      console.error('Error creating entity:', error)
      alert('Error creating entity: ' + error.message)
    }
    setLoading(false)
  }

  const showEntityCreatedSuccess = (entityData, codes) => {
    const instructions = generateEntityInstructions(entityData, codes)
    alert(`🎉 ${entityData.type.toUpperCase()} CREATED SUCCESSFULLY!\n\n${instructions}\n\nAccess these credentials securely!`)
  }

  const generateEntityInstructions = (entityData, codes) => {
    const programsList = entityData.selectedPrograms?.join(', ') || 'Lux Libris'
    const programCount = entityData.programsIncluded || 1
    const pricing = entityData.programPricing
    
    const programInfo = `📚 Programs: ${programsList} (${programCount} lists)\n${pricing?.extraListsAdded > 0 ? `💰 Extra Lists: ${pricing.extraListsAdded} (+$${pricing.breakdown.extraLists})\n` : ''}${pricing?.totalPrice ? `💳 Total Price: $${pricing.totalPrice}` : ''}`

    switch (entityData.type) {
      case 'diocese':
        return `📋 DIOCESE SETUP COMPLETE:\n🏛️ Entity: ${entityData.name}\n${programInfo}\n🔑 Diocese Access Code: ${codes.accessCode}\n🔒 Diocese Password: ${codes.passwordHash}\n📍 Dashboard: luxlibris.org/diocese/dashboard\n\n👥 PRINCIPAL JOIN CODE: ${codes.principalJoinCode}`
      case 'isd':
        return `📋 ISD SETUP COMPLETE:\n🏫 Entity: ${entityData.name}\n${programInfo}\n🔑 ISD Access Code: ${codes.accessCode}\n🔒 ISD Password: ${codes.passwordHash}\n📍 Dashboard: luxlibris.org/diocese/dashboard\n\n👥 PRINCIPAL JOIN CODE: ${codes.principalJoinCode}`
      case 'single_school':
        return `📋 SINGLE SCHOOL SETUP COMPLETE:\n🏫 School: ${entityData.name}\n📚 Program: Lux Libris (default)\n🔑 Principal Login Code: ${codes.accessCode}\n🔒 Principal Password: ${codes.passwordHash}\n👨‍🏫 Teacher Join Code: ${codes.teacherJoinCode}\n📍 Dashboard: luxlibris.org/school/dashboard`
      case 'single_library':
        return `📋 SINGLE LIBRARY SETUP COMPLETE:\n📚 Library: ${entityData.name}\n📚 Program: Lux Libris (default)\n🔑 Librarian Login Code: ${codes.accessCode}\n🔒 Librarian Password: ${codes.passwordHash}\n👥 Staff Join Code: ${codes.staffJoinCode}\n📍 Dashboard: luxlibris.org/library/dashboard`
      default:
        return 'Entity created successfully!'
    }
  }

  const handleDeleteEntity = async (entityId, entityName, entityType) => {
    const confirmed = window.confirm(`⚠️ DELETE ENTIRE ${entityType.toUpperCase()}?\n\nThis will permanently delete:\n• Entity: ${entityName}\n• ALL schools/branches under this entity\n• ALL users in these schools\n• ALL data associated with this entity\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`)
    
    if (confirmed) {
      const userInput = window.prompt('Type "DELETE" to confirm:')
      if (userInput === 'DELETE') {
        try {
          setLoading(true)
          
          if (entityType === 'single_school' || entityType === 'single_library') {
            await deleteDoc(doc(db, 'schools', entityId))
          } else {
            await deleteDoc(doc(db, 'entities', entityId))
            
            try {
              const schoolsRef = collection(db, `entities/${entityId}/schools`)
              const schoolsSnapshot = await getDocs(schoolsRef)
              
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

  // Initialize on mount
  useEffect(() => {
    fetchAllEntities()
    loadAllPrograms()
  }, [])

  // Check for hash navigation
  useEffect(() => {
    if (window.location.hash === '#create') {
      setShowCreateEntity(true)
    }
  }, [])

  return (
    <GodModeAuth pageName="Entity Management">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Entity Management - God Mode</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Entity Management"
              icon="🏛️"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
            />

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

                    {/* Program Selection Section (only for multi-school entities) */}
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
                                    e.target.value = ''
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
      )}
    </GodModeAuth>
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

// Entity Card Component
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

          {/* Program Info */}
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
          
          {(entity.type === 'diocese' || entity.type === 'isd') && entity.passwordHash && (
            <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              🔒 Admin Password: <strong>{entity.passwordHash}</strong>
            </p>
          )}
          
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
          
          {(entity.type === 'single_school' || entity.type === 'single_library') && entity.principalLastName && (
            <p style={{ color: '#c084fc', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              👤 {entity.type === 'single_library' ? 'Librarian' : 'Principal'}: {entity.principalLastName}
            </p>
          )}
          
          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
            {getUsageDisplay(entity)}
          </p>
          
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
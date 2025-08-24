// pages/god-mode/entities.js - FIXED VERSION WITH WORKING CHECKBOXES
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore'
import { 
  getAllActivePrograms,
  getAvailableProgramsForTier,
  validateProgramSelection,
  getProgramsByIds
} from '../../setup-programs'
import {
  PRICING_CONFIG,
  calculateDiocesePrice,
  recommendTier,
  checkOverageStatus,
  calculateBilling,
  getTierInfo,
  formatCurrency
} from '../../lib/pricing-config'

export default function EntitiesManagement() {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateEntity, setShowCreateEntity] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [selectedEntityForBilling, setSelectedEntityForBilling] = useState(null)
  
  // Program Management State
  const [availablePrograms, setAvailablePrograms] = useState([])

  const [newEntity, setNewEntity] = useState({
    entityType: 'diocese',
    name: '',
    location: '',
    adminEmail: '',
    principalLastName: '',
    tier: 'medium',
    selectedPrograms: [],
    contactInfo: {},
    // Billing fields
    billingStatus: 'pending_contract',
    contractSigned: false,
    paymentReceived: false,
    specialDiscounts: {
      founding: false,
      referral: false,
      multiYear: 0
    }
  })

  // Billing management state
  const [billingUpdate, setBillingUpdate] = useState({
    status: '',
    paymentMethod: '',
    paymentAmount: '',
    paymentDate: '',
    invoiceNumber: '',
    notes: ''
  })

  // FIXED: Handle special discount changes with proper event handling
  const handleSpecialDiscountChange = (discountType, value) => {
    console.log('Discount change:', discountType, value) // Debug log
    
    setNewEntity(prev => ({
      ...prev,
      specialDiscounts: {
        ...prev.specialDiscounts,
        [discountType]: value
      }
    }))
  }

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
    if (newEntity.tier && ['diocese', 'isd'].includes(newEntity.entityType)) {
      const tierConfig = getTierInfo(newEntity.tier)
      if (tierConfig) {
        const recommended = recommendTier(tierConfig.maxSchools)
        console.log('Tier config:', tierConfig, 'Recommended:', recommended)
      }
    }
  }, [newEntity.tier, newEntity.entityType])

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
            
            // Calculate billing info
            entityData.billing = calculateBilling(entityData)
            
          } catch (error) {
            console.log('No schools found for entity:', doc.id)
            entityData.actualSchoolCount = 0
            entityData.totalStudents = 0
            entityData.totalTeachers = 0
          }
        }
        
        entitiesData.push(entityData)
      }
      
      // Fetch from schools collection (single schools)
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

  // Generate entity codes (same as before)
  const generateEntityCodes = async (entityData, entityType) => {
    const year = new Date().getFullYear()
    const stateCode = entityData.location.split(',')[1]?.trim().substring(0,2).toUpperCase() || 'US'
    const cityCode = entityData.location.split(',')[0]?.trim().replace(/[^A-Za-z]/g, '').substring(0,6).toUpperCase() || 'CITY'
    const geoPrefix = `${stateCode}${cityCode}`
    
    const existingCodes = await getExistingEntityCodes()
    
    switch (entityType) {
      case 'diocese':
      case 'isd':
        const entityPrefix = entityType === 'diocese' ? 'DIOCESE' : 'ISD'
        const baseCode = `${geoPrefix}-${entityPrefix}-${year}`
        const code = await generateUniqueCode(baseCode, existingCodes)
        const password = generateSecurePassword(16)
        return {
          accessCode: code,
          passwordHash: password,
          type: entityType,
          principalJoinCode: code
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
    
    const tierConfig = getTierInfo(newEntity.tier)
    if (newEntity.selectedPrograms.length >= tierConfig.programs.max) {
      alert(`Maximum ${tierConfig.programs.max} programs allowed for ${tierConfig.displayName} tier`)
      return
    }
    
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

  const handleCreateEntity = async () => {
    if (!newEntity.name || !newEntity.location) {
      alert('Please fill in all required fields')
      return
    }

    if ((newEntity.entityType === 'single_school') && !newEntity.principalLastName) {
      alert('Principal last name is required for single schools')
      return
    }

    if (['diocese', 'isd'].includes(newEntity.entityType)) {
      if (newEntity.selectedPrograms.length === 0) {
        alert('Please select at least one reading program')
        return
      }
    }

    try {
      setLoading(true)
      
      const entityCodes = await generateEntityCodes(newEntity, newEntity.entityType)
      const tierConfig = getTierInfo(newEntity.tier)
      
      let entityData
      
      if (newEntity.entityType === 'single_school') {
        entityData = {
          type: newEntity.entityType,
          name: newEntity.name,
          city: newEntity.location.split(',')[0]?.trim() || '',
          state: newEntity.location.split(',')[1]?.trim() || '',
          accessCode: entityCodes.accessCode,
          passwordHash: entityCodes.passwordHash,
          teacherJoinCode: entityCodes.teacherJoinCode || null,
          principalLastName: newEntity.principalLastName,
          adminEmail: newEntity.adminEmail,
          selectedPrograms: ['luxlibris'],
          programsIncluded: 1,
          parentEntityId: null,
          parentEntityType: null,
          contactInfo: newEntity.contactInfo,
          
          // Billing
          billingStatus: 'pending_payment',
          annualPrice: PRICING_CONFIG.singleSchool,
          
          // Metadata
          teacherCount: 0,
          studentCount: 0,
          status: 'pending',
          createdAt: new Date(),
          createdBy: 'Dr. Verity Kahn',
          lastModified: new Date()
        }
      } else {
        // Calculate pricing
        const pricing = calculateDiocesePrice(
          tierConfig.maxSchools,
          newEntity.tier,
          newEntity.selectedPrograms.length,
          newEntity.specialDiscounts
        )
        
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
          tier: newEntity.tier,
          maxSubEntities: tierConfig.maxSchools,
          currentSubEntities: 0,
          
          // Billing
          billingStatus: 'pending_contract',
          contractSigned: false,
          paymentReceived: false,
          annualPrice: pricing.totalPrice,
          perSchoolPrice: pricing.perSchoolEffective,
          billingDetails: pricing,
          specialDiscounts: newEntity.specialDiscounts,
          
          // Contract
          licenseExpiration: `${new Date().getFullYear() + 1}-08-31`,
          adminEmail: newEntity.adminEmail,
          contactInfo: newEntity.contactInfo,
          
          // Metadata
          status: 'pending',
          createdAt: new Date(),
          createdBy: 'Dr. Verity Kahn',
          lastModified: new Date()
        }
      }

      let entityDocRef
      if (newEntity.entityType === 'single_school') {
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
        contactInfo: {},
        billingStatus: 'pending_contract',
        contractSigned: false,
        paymentReceived: false,
        specialDiscounts: {
          founding: false,
          referral: false,
          multiYear: 0
        }
      })
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
    alert(instructions)
  }

  const generateEntityInstructions = (entityData, codes) => {
    if (entityData.type === 'single_school') {
      return `🎉 SINGLE SCHOOL CREATED!

🏫 School: ${entityData.name}
📍 Location: ${entityData.city}, ${entityData.state}
💰 Annual Price: ${formatCurrency(PRICING_CONFIG.singleSchool)}

🔑 ACCESS CODES:
• Principal Login: ${codes.accessCode}
• Principal Password: ${codes.passwordHash}
• Teacher Join Code: ${codes.teacherJoinCode}

📋 NEXT STEPS:
1. Send invoice for ${formatCurrency(PRICING_CONFIG.singleSchool)}
2. Upon payment, update status to ACTIVE
3. Share credentials with principal`
    }
    
    const pricing = entityData.billingDetails
    const tierConfig = getTierInfo(entityData.tier)
    
    return `🎉 ${entityData.type.toUpperCase()} CREATED!

🏛️ Entity: ${entityData.name}
📍 Location: ${entityData.city}, ${entityData.state}
📊 Tier: ${tierConfig.displayName} (up to ${entityData.maxSubEntities} schools)

💰 PRICING BREAKDOWN:
• Base: ${formatCurrency(pricing.basePrice)} (${pricing.numSchools} schools × ${formatCurrency(pricing.perSchoolPrice)})
• Programs: ${pricing.programCost > 0 ? formatCurrency(pricing.programCost) : 'Included'}
• Total Annual: ${formatCurrency(pricing.totalPrice)}
• Per School: ${formatCurrency(pricing.perSchoolEffective)}
• Savings: ${formatCurrency(pricing.savings)} (${pricing.savingsPercent}% off)

🔑 ACCESS CODES:
• Diocese Admin: ${codes.accessCode}
• Diocese Password: ${codes.passwordHash}
• Principal Join Code: ${codes.principalJoinCode}

📋 NEXT STEPS:
1. Send contract for signature
2. Generate invoice for ${formatCurrency(pricing.totalPrice)}
3. Upon payment, update status to ACTIVE
4. Share principal join code with schools`
  }

  const handleUpdateBilling = async (entityId) => {
    try {
      setLoading(true)
      
      const updates = {
        billingStatus: billingUpdate.status,
        lastPayment: {
          amount: parseFloat(billingUpdate.paymentAmount),
          date: billingUpdate.paymentDate,
          method: billingUpdate.paymentMethod,
          invoiceNumber: billingUpdate.invoiceNumber
        },
        notes: billingUpdate.notes,
        lastModified: new Date()
      }
      
      if (billingUpdate.status === 'active') {
        updates.status = 'active'
        updates.contractSigned = true
        updates.paymentReceived = true
      }
      
      await updateDoc(doc(db, 'entities', entityId), updates)
      
      alert('✅ Billing status updated successfully')
      setShowBillingModal(false)
      fetchAllEntities()
      
    } catch (error) {
      console.error('Error updating billing:', error)
      alert('Error updating billing: ' + error.message)
    }
    setLoading(false)
  }

  const handleDeleteEntity = async (entityId, entityName, entityType) => {
    const confirmed = window.confirm(`⚠️ DELETE ENTIRE ${entityType.toUpperCase()}?

This will permanently delete:
• Entity: ${entityName}
• ALL schools/branches under this entity
• ALL users in these schools
• ALL data associated with this entity

This action CANNOT be undone!`)
    
    if (confirmed) {
      const userInput = window.prompt('Type "DELETE" to confirm:')
      if (userInput === 'DELETE') {
        try {
          setLoading(true)
          
          if (entityType === 'single_school') {
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
              console.log('No schools subcollection to clean up')
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
                  subtitle="Catholic dioceses"
                  icon="⛪" 
                  color="#3b82f6"
                />
                <GlobalStatCard 
                  title="ISDs" 
                  value={entities.filter(e => e.type === 'isd').length}
                  subtitle="School districts"
                  icon="🏫" 
                  color="#8b5cf6"
                />
                <GlobalStatCard 
                  title="Total Schools" 
                  value={
                    entities.filter(e => e.type === 'single_school').length + 
                    entities.filter(e => e.type === 'diocese' || e.type === 'isd')
                      .reduce((sum, e) => sum + (e.actualSchoolCount || 0), 0)
                  }
                  subtitle="All schools"
                  icon="🎓" 
                  color="#10b981"
                />
                <GlobalStatCard 
                  title="Annual Revenue" 
                  value={formatCurrency(
                    entities.reduce((sum, e) => sum + (e.annualPrice || 0), 0)
                  )}
                  subtitle="Total contracted"
                  icon="💰" 
                  color="#f59e0b"
                />
                <GlobalStatCard 
                  title="Active Entities" 
                  value={entities.filter(e => e.status === 'active' || e.billingStatus === 'active').length}
                  subtitle="Paid & active"
                  icon="✅" 
                  color="#10b981"
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
                           'School Name *'}
                        </label>
                        <input
                          type="text"
                          placeholder={newEntity.entityType === 'diocese' ? 'Diocese of Austin' : 
                                     newEntity.entityType === 'isd' ? 'Austin ISD' :
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
                            fontSize: '1rem',
                            boxSizing: 'border-box'
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
                          Location (City, State) *
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
                            fontSize: '1rem',
                            boxSizing: 'border-box'
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
                          Admin Email
                        </label>
                        <input
                          type="email"
                          placeholder="admin@diocese.org"
                          value={newEntity.adminEmail}
                          onChange={(e) => setNewEntity({...newEntity, adminEmail: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Principal Last Name (for single schools) */}
                      {newEntity.entityType === 'single_school' && (
                        <div>
                          <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            Principal Last Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Smith"
                            value={newEntity.principalLastName}
                            onChange={(e) => setNewEntity({...newEntity, principalLastName: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: 'white',
                              fontSize: '1rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      )}

                      {/* Tier Selection (for multi-school entities) */}
                      {['diocese', 'isd'].includes(newEntity.entityType) && (
                        <div>
                          <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            Select Tier *
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
                              fontSize: '1rem',
                              boxSizing: 'border-box'
                            }}
                          >
                            {Object.entries(PRICING_CONFIG.tiers).map(([key, tier]) => (
                              <option key={key} value={key}>
                                {tier.displayName} ({tier.minSchools}-{tier.maxSchools} schools) - {formatCurrency(tier.perSchoolPrice)}/school
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Special Discounts - Dropdown Version */}
                      {['diocese', 'isd'].includes(newEntity.entityType) && (
                        <div>
                          <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            Special Discounts
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            
                            {/* Founding Diocese Discount */}
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#c084fc',
                                fontSize: '0.75rem',
                                marginBottom: '0.25rem'
                              }}>
                                Founding Diocese Program (15% off)
                              </label>
                              <select
                                value={newEntity.specialDiscounts.founding ? 'yes' : 'no'}
                                onChange={(e) => handleSpecialDiscountChange('founding', e.target.value === 'yes')}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  background: 'rgba(0, 0, 0, 0.5)',
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <option value="no">Not a Founding Diocese</option>
                                <option value="yes">Apply Founding Diocese Discount (15% off)</option>
                              </select>
                            </div>

                            {/* Referral Discount */}
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#c084fc',
                                fontSize: '0.75rem',
                                marginBottom: '0.25rem'
                              }}>
                                Referral Program (10% off)
                              </label>
                              <select
                                value={newEntity.specialDiscounts.referral ? 'yes' : 'no'}
                                onChange={(e) => handleSpecialDiscountChange('referral', e.target.value === 'yes')}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  background: 'rgba(0, 0, 0, 0.5)',
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <option value="no">No Referral</option>
                                <option value="yes">Apply Referral Discount (10% off)</option>
                              </select>
                            </div>

                            {/* Multi-Year Discount */}
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#c084fc',
                                fontSize: '0.75rem',
                                marginBottom: '0.25rem'
                              }}>
                                Multi-Year Contract (5% per additional year)
                              </label>
                              <select
                                value={newEntity.specialDiscounts.multiYear || 0}
                                onChange={(e) => handleSpecialDiscountChange('multiYear', parseInt(e.target.value))}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  background: 'rgba(0, 0, 0, 0.5)',
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <option value={0}>1 Year (No Discount)</option>
                                <option value={2}>2 Years (5% off)</option>
                                <option value={3}>3 Years (10% off)</option>
                              </select>
                            </div>

                            {/* Show Applied Discounts Summary */}
                            {(newEntity.specialDiscounts.founding || newEntity.specialDiscounts.referral || newEntity.specialDiscounts.multiYear > 0) && (
                              <div style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: 'rgba(245, 158, 11, 0.2)',
                                borderRadius: '0.25rem',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }}>
                                <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '600' }}>
                                  Applied Discounts:
                                </div>
                                {newEntity.specialDiscounts.founding && (
                                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                                    • Founding Diocese: 15% off
                                  </div>
                                )}
                                {newEntity.specialDiscounts.referral && (
                                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                                    • Referral: 10% off
                                  </div>
                                )}
                                {newEntity.specialDiscounts.multiYear > 0 && (
                                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                                    • Multi-Year ({newEntity.specialDiscounts.multiYear} years): {(newEntity.specialDiscounts.multiYear - 1) * 5}% off
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Program Selection (only for multi-school entities) */}
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
                        
                        {/* Show pricing preview */}
                        {newEntity.tier && (
                          <div style={{ 
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '0.375rem',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            {(() => {
                              const tierConfig = getTierInfo(newEntity.tier)
                              const pricing = calculateDiocesePrice(
                                tierConfig.maxSchools,
                                newEntity.tier,
                                newEntity.selectedPrograms.length,
                                newEntity.specialDiscounts
                              )
                              
                              return (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#a78bfa' }}>
                                      <strong>{tierConfig.displayName} Tier:</strong> {tierConfig.minSchools}-{tierConfig.maxSchools} schools
                                    </span>
                                    <span style={{ color: '#10b981' }}>
                                      {formatCurrency(pricing.perSchoolPrice)}/school
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#60a5fa' }}>
                                    • Includes {tierConfig.programs.included} program(s)
                                    • Max {tierConfig.programs.max} programs total
                                    • Extra programs: {formatCurrency(tierConfig.programs.extraCost)} each
                                  </div>
                                  {pricing.discounts.amount > 0 && (
                                    <div style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                                      Discounts Applied: {formatCurrency(pricing.discounts.amount)}
                                    </div>
                                  )}
                                  <div style={{ 
                                    fontSize: '1rem', 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    marginTop: '0.5rem',
                                    borderTop: '1px solid rgba(168, 85, 247, 0.3)',
                                    paddingTop: '0.5rem'
                                  }}>
                                    Total Annual: {formatCurrency(pricing.totalPrice)}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        {/* Program selection UI */}
                        <div style={{ marginBottom: '1rem' }}>
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
                            <option value="">Add a reading program...</option>
                            {getAvailableToAdd().map(program => (
                              <option key={program.id} value={program.id}>
                                {program.icon} {program.name} - {program.targetAudience}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selected programs */}
                        {newEntity.selectedPrograms.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {newEntity.selectedPrograms.map((programId, index) => {
                              const program = availablePrograms.find(p => p.id === programId)
                              const tierConfig = getTierInfo(newEntity.tier)
                              const isIncluded = index < tierConfig.programs.included
                              
                              return (
                                <div key={programId} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.75rem',
                                  background: isIncluded 
                                    ? 'rgba(16, 185, 129, 0.2)' 
                                    : 'rgba(245, 158, 11, 0.2)',
                                  borderRadius: '0.375rem',
                                  border: isIncluded 
                                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                                    : '1px solid rgba(245, 158, 11, 0.3)'
                                }}>
                                  <div>
                                    <span style={{ color: 'white', fontWeight: '600' }}>
                                      {program ? `${program.icon} ${program.name}` : programId}
                                    </span>
                                    {!isIncluded && (
                                      <span style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#f59e0b',
                                        marginLeft: '0.5rem'
                                      }}>
                                        (+{formatCurrency(tierConfig.programs.extraCost)})
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
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleCreateEntity}
                      disabled={loading}
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
                      {loading ? '⏳ Creating...' : '✅ Create Entity'}
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
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1.5rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  All Entities ({entities.length})
                </h2>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  {entities.map(entity => (
                    <EntityCard 
                      key={entity.id} 
                      entity={entity} 
                      onDelete={handleDeleteEntity}
                      onBilling={(e) => {
                        setSelectedEntityForBilling(e)
                        setShowBillingModal(true)
                      }}
                      availablePrograms={availablePrograms}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Billing Modal */}
            {showBillingModal && selectedEntityForBilling && (
              <BillingModal
                entity={selectedEntityForBilling}
                onClose={() => setShowBillingModal(false)}
                onUpdate={handleUpdateBilling}
                billingUpdate={billingUpdate}
                setBillingUpdate={setBillingUpdate}
              />
            )}
          </div>
        </>
      )}
    </GodModeAuth>
  )
}

// Supporting Components (same as before)
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
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {icon}
      </div>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '0.25rem'
      }}>
        {value}
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

function EntityCard({ entity, onDelete, onBilling, availablePrograms }) {
  const getEntityIcon = (type) => {
    switch (type) {
      case 'diocese': return '🏛️'
      case 'isd': return '🏫'
      case 'single_school': return '🎓'
      default: return '🏢'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'pending_payment': return '#f59e0b'
      case 'pending_contract': return '#ef4444'
      case 'suspended': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const billing = entity.billing || calculateBilling(entity)

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
            📍 {entity.city}, {entity.state}
          </p>

          {entity.tier && (
            <p style={{ color: '#a78bfa', margin: '0.25rem 0', fontSize: '0.875rem' }}>
              📊 Tier: <strong>{PRICING_CONFIG.tiers[entity.tier]?.displayName}</strong> • 
              🏫 Schools: {entity.actualSchoolCount || 0}/{entity.maxSubEntities || 0}
              {billing?.overage?.isOver && (
                <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
                  ({billing.overage.message})
                </span>
              )}
            </p>
          )}

          {billing && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.25rem'
            }}>
              <p style={{ color: '#10b981', margin: '0.25rem 0', fontSize: '0.875rem' }}>
                💰 Annual: {formatCurrency(billing.totalDue || entity.annualPrice || 0)}
                {entity.type !== 'single_school' && (
                  <span style={{ color: '#a78bfa', marginLeft: '0.5rem' }}>
                    ({formatCurrency(billing.perSchoolEffective || 0)}/school)
                  </span>
                )}
              </p>
              <p style={{ 
                color: getStatusColor(entity.billingStatus), 
                margin: '0.25rem 0', 
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Status: {PRICING_CONFIG.billing.statuses[entity.billingStatus] || entity.billingStatus || 'pending'}
              </p>
            </div>
          )}

          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#c084fc'
          }}>
            <p style={{ margin: '0.125rem 0' }}>
              🔑 Access: <strong>{entity.accessCode}</strong>
            </p>
            {entity.principalJoinCode && (
              <p style={{ margin: '0.125rem 0' }}>
                👥 Principal Code: <strong>{entity.principalJoinCode}</strong>
              </p>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
          <button
            onClick={() => onBilling(entity)}
            style={{
              background: 'rgba(16, 185, 129, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            💰 Billing
          </button>
          <button
            onClick={() => onDelete(entity.id, entity.name, entity.type)}
            style={{
              background: 'rgba(239, 68, 68, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function BillingModal({ entity, onClose, onUpdate, billingUpdate, setBillingUpdate }) {
  const billing = calculateBilling(entity)
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '2px solid rgba(168, 85, 247, 0.3)'
      }}>
        <h2 style={{
          color: 'white',
          marginBottom: '1.5rem',
          fontSize: '1.5rem'
        }}>
          💰 Billing Management: {entity.name}
        </h2>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#c084fc', fontSize: '1rem', marginBottom: '0.5rem' }}>
            Current Contract
          </h3>
          <div style={{ color: '#a78bfa', fontSize: '0.875rem' }}>
            <p>Tier: {PRICING_CONFIG.tiers[entity.tier]?.displayName}</p>
            <p>Schools: {entity.actualSchoolCount}/{entity.maxSubEntities}</p>
            <p>Annual: {formatCurrency(billing.totalDue)}</p>
            <p>Status: {PRICING_CONFIG.billing.statuses[entity.billingStatus] || 'Pending'}</p>
            {billing.overage?.overageCost > 0 && (
              <p style={{ color: '#f59e0b' }}>
                Overage Fee: {formatCurrency(billing.overage.overageCost)}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ color: 'white', fontSize: '0.875rem' }}>
              Update Status
            </label>
            <select
              value={billingUpdate.status}
              onChange={(e) => setBillingUpdate({...billingUpdate, status: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <option value="">Select status...</option>
              {Object.entries(PRICING_CONFIG.billing.statuses).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'white', fontSize: '0.875rem' }}>
              Payment Method
            </label>
            <select
              value={billingUpdate.paymentMethod}
              onChange={(e) => setBillingUpdate({...billingUpdate, paymentMethod: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <option value="">Select method...</option>
              <option value="check">Check</option>
              <option value="wire">Wire Transfer</option>
              <option value="card">Credit Card</option>
              <option value="po">Purchase Order</option>
            </select>
          </div>

          <div>
            <label style={{ color: 'white', fontSize: '0.875rem' }}>
              Payment Amount
            </label>
            <input
              type="number"
              value={billingUpdate.paymentAmount}
              onChange={(e) => setBillingUpdate({...billingUpdate, paymentAmount: e.target.value})}
              placeholder={billing.totalDue}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ color: 'white', fontSize: '0.875rem' }}>
              Payment Date
            </label>
            <input
              type="date"
              value={billingUpdate.paymentDate}
              onChange={(e) => setBillingUpdate({...billingUpdate, paymentDate: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ color: 'white', fontSize: '0.875rem' }}>
              Invoice Number
            </label>
            <input
              type="text"
              value={billingUpdate.invoiceNumber}
              onChange={(e) => setBillingUpdate({...billingUpdate, invoiceNumber: e.target.value})}
              placeholder="INV-2025-001"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ color: 'white', fontSize: '0.875rem' }}>
              Notes
            </label>
            <textarea
              value={billingUpdate.notes}
              onChange={(e) => setBillingUpdate({...billingUpdate, notes: e.target.value})}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(107, 114, 128, 0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(entity.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Update Billing
          </button>
        </div>
      </div>
    </div>
  )
}
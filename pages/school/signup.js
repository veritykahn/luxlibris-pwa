// pages/school/signup.js - ENHANCED WITH CAPACITY CHECKING
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { db, authHelpers } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore'
import {
  canAddSchool,
  formatCurrency,
  checkOverageStatus,
  PRICING_CONFIG
} from '../../lib/pricing-config'

export default function SchoolSignup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    dioceseJoinCode: '',
    principalEmail: '',
    principalPassword: '',
    confirmPassword: '',
    principalFirstName: '',
    principalLastName: '',
    principalRole: 'principal',
    schoolName: '',
    city: '',
    state: ''
  })
  
  // Validation and feedback
  const [errors, setErrors] = useState({})
  const [dioceseInfo, setDioceseInfo] = useState(null)
  const [capacityInfo, setCapacityInfo] = useState(null)
  const [isValidatingCode, setIsValidatingCode] = useState(false)

  // Auto-populate from URL parameters if available
  useEffect(() => {
    const { diocese } = router.query
    if (diocese) {
      setFormData(prev => ({ ...prev, dioceseJoinCode: diocese.toUpperCase() }))
    }
  }, [router.query])

  // Validate diocese join code when entered
  useEffect(() => {
    const validateDioceseCode = async () => {
      if (formData.dioceseJoinCode.length >= 10) {
        setIsValidatingCode(true)
        try {
          const diocese = await findDioceseByJoinCode(formData.dioceseJoinCode.toUpperCase())
          if (diocese) {
            setDioceseInfo(diocese)
            setErrors(prev => ({ ...prev, dioceseJoinCode: '' }))
            
            // ENHANCED: Check capacity and overage status
            const capacity = canAddSchool(
              diocese.currentSubEntities || 0,
              diocese.maxSubEntities || 15,
              false // Don't enforce limit yet - just check
            )
            
            const overage = checkOverageStatus(
              (diocese.currentSubEntities || 0) + 1, // +1 for the school being added
              diocese.maxSubEntities || 15
            )
            
            setCapacityInfo({
              ...capacity,
              overage,
              currentSchools: diocese.currentSubEntities || 0,
              maxSchools: diocese.maxSubEntities || 15,
              tierName: PRICING_CONFIG.tiers[diocese.tier]?.displayName || diocese.tier
            })
            
          } else {
            setDioceseInfo(null)
            setCapacityInfo(null)
            setErrors(prev => ({ ...prev, dioceseJoinCode: 'Diocese not found with this join code' }))
          }
        } catch (error) {
          setDioceseInfo(null)
          setCapacityInfo(null)
          setErrors(prev => ({ ...prev, dioceseJoinCode: 'Error validating diocese code' }))
        }
        setIsValidatingCode(false)
      } else {
        setDioceseInfo(null)
        setCapacityInfo(null)
        setErrors(prev => ({ ...prev, dioceseJoinCode: '' }))
      }
    }

    const timeoutId = setTimeout(validateDioceseCode, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.dioceseJoinCode])

  // Find diocese by join code
  const findDioceseByJoinCode = async (joinCode) => {
    try {
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityData = entityDoc.data()
        if (entityData.accessCode === joinCode && (entityData.type === 'diocese' || entityData.type === 'isd')) {
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

  // Generate school codes
  const generateSchoolCodes = (schoolData, diocese) => {
    const year = new Date().getFullYear()
    const stateCode = schoolData.state.substring(0, 2).toUpperCase()
    const cityCode = schoolData.city.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
    const schoolPrefix = schoolData.schoolName.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
    const principalLastName = schoolData.principalLastName.replace(/[^A-Za-z]/g, '').substring(0, 6).toUpperCase()
    
    const schoolAccessCode = `${stateCode}${cityCode}-${schoolPrefix}-${principalLastName}-${year}`
    const teacherJoinCode = `${stateCode}${cityCode}-${schoolPrefix}-TEACHER-${year}`
    
    return {
      schoolAccessCode,
      teacherJoinCode
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.dioceseJoinCode) {
      newErrors.dioceseJoinCode = 'Diocese join code is required'
    } else if (!dioceseInfo) {
      newErrors.dioceseJoinCode = 'Please enter a valid diocese join code'
    }
    
    if (!formData.principalEmail) {
      newErrors.principalEmail = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.principalEmail)) {
      newErrors.principalEmail = 'Please enter a valid email address'
    }
    
    if (!formData.principalPassword) {
      newErrors.principalPassword = 'Password is required'
    } else if (formData.principalPassword.length < 8) {
      newErrors.principalPassword = 'Password must be at least 8 characters'
    }
    
    if (formData.principalPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.schoolName) {
      newErrors.schoolName = 'School name is required'
    }
    
    if (!formData.principalFirstName) {
      newErrors.principalFirstName = 'First name is required'
    }
    
    if (!formData.principalLastName) {
      newErrors.principalLastName = 'Last name is required'
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required'
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle school registration with capacity checking
  const handleSchoolRegistration = async () => {
    if (!validateForm()) return
    
    // ENHANCED: Check capacity before proceeding
    if (!capacityInfo?.allowed) {
      alert(capacityInfo?.message || 'Cannot add school due to capacity limits')
      return
    }
    
    // Show overage warning if applicable
    if (capacityInfo.overageFee > 0) {
      const proceedWithOverage = confirm(
        `⚠️ CAPACITY WARNING\n\n` +
        `This will exceed your ${capacityInfo.tierName} tier limit.\n` +
        `Current: ${capacityInfo.currentSchools}/${capacityInfo.maxSchools} schools\n` +
        `Additional cost: ${formatCurrency(capacityInfo.overageFee)}/year\n\n` +
        `Proceed with overage billing?`
      )
      
      if (!proceedWithOverage) {
        return
      }
    }

    setLoading(true)
    try {
      console.log('🏫 Creating school registration with capacity check...')
      
      // Generate school codes
      const schoolCodes = generateSchoolCodes(formData, dioceseInfo)
      console.log('🔑 Generated codes:', schoolCodes)
      
      // Create Firebase Auth account for principal
      const principalAuth = await authHelpers.createAdminAccount(
        formData.principalEmail,
        formData.principalPassword,
        { name: formData.schoolName }
      )
      
      console.log('✅ Principal Firebase Auth created:', principalAuth.uid)
      
      // Create school document
      const schoolData = {
        name: formData.schoolName,
        city: formData.city,
        state: formData.state,
        principalEmail: formData.principalEmail,
        principalLastName: formData.principalLastName,
        principalAuthUid: principalAuth.uid,
        schoolAccessCode: schoolCodes.schoolAccessCode,
        teacherJoinCode: schoolCodes.teacherJoinCode,
        parentEntityId: dioceseInfo.id,
        parentEntityType: dioceseInfo.type,
        parentEntityName: dioceseInfo.name,
        selectedPrograms: dioceseInfo.selectedPrograms || ['luxlibris'],
        programsIncluded: dioceseInfo.selectedPrograms?.length || 1,
        selectedNominees: [],
        achievementTiers: [],
        submissionOptions: { quiz: true, presentation: false },
        teacherCount: 0,
        studentCount: 0,
        
        // ENHANCED: Add capacity tracking
        addedWithOverage: capacityInfo.overageFee > 0,
        overageFeeAtCreation: capacityInfo.overageFee || 0,
        
        status: 'active',
        setupCompleted: false,
        createdAt: new Date(),
        lastModified: new Date()
      }
      
      // Save school
      const schoolRef = await addDoc(collection(db, `entities/${dioceseInfo.id}/schools`), schoolData)
      console.log('✅ School created with ID:', schoolRef.id)
      
      // Create first admin
      const firstAdminData = {
        email: formData.principalEmail,
        firstName: formData.principalFirstName,
        lastName: formData.principalLastName,
        role: formData.principalRole,
        authUid: principalAuth.uid,
        schoolId: schoolRef.id,
        dioceseId: dioceseInfo.id,
        schoolName: formData.schoolName,
        isFounder: true,
        createdAt: new Date(),
        status: 'active'
      }
      
      await addDoc(collection(db, `entities/${dioceseInfo.id}/schools/${schoolRef.id}/admins`), firstAdminData)
      console.log('✅ First admin account created')
      
      // ENHANCED: Update diocese count and billing if overage
      const updateData = {
        currentSubEntities: (dioceseInfo.currentSubEntities || 0) + 1,
        lastModified: new Date()
      }
      
      // If there's overage, flag for billing update
      if (capacityInfo.overageFee > 0) {
        updateData.hasOverageSchools = true
        updateData.lastOverageDate = new Date()
        
        // Log overage event for billing tracking
        try {
          await addDoc(collection(db, 'billingEvents'), {
            entityId: dioceseInfo.id,
            entityName: dioceseInfo.name,
            eventType: 'school_overage',
            schoolId: schoolRef.id,
            schoolName: formData.schoolName,
            overageFee: capacityInfo.overageFee,
            currentSchools: (dioceseInfo.currentSubEntities || 0) + 1,
            tierLimit: dioceseInfo.maxSubEntities,
            createdAt: new Date()
          })
        } catch (logError) {
          console.log('Could not log billing event:', logError)
        }
      }
      
      await updateDoc(doc(db, 'entities', dioceseInfo.id), updateData)
      
      // Success message with overage info
      let successMessage = `🎉 SCHOOL REGISTRATION SUCCESSFUL!\n\n` +
        `🏫 School: ${formData.schoolName}\n` +
        `🔑 School Access Code: ${schoolCodes.schoolAccessCode}\n` +
        `👨‍🏫 Teacher Join Code: ${schoolCodes.teacherJoinCode}\n\n`
      
      if (capacityInfo.overageFee > 0) {
        successMessage += `💰 OVERAGE NOTICE:\n` +
          `Your diocese will be billed an additional ${formatCurrency(capacityInfo.overageFee)}/year for exceeding the ${capacityInfo.tierName} tier limit.\n\n`
      }
      
      successMessage += `NEXT STEPS:\n` +
        `1. You will now be taken to your school dashboard\n` +
        `2. Use your school code + email/password to sign in\n` +
        `3. Share the teacher join code with your teachers\n\n` +
        `Save these codes securely!`
      
      alert(successMessage)
      
      // Redirect to school dashboard
      router.push(`/school/dashboard?school=${schoolCodes.schoolAccessCode}`)
      
    } catch (error) {
      console.error('❌ Error creating school:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ principalEmail: 'An account with this email already exists' })
      } else {
        alert('Error creating school: ' + error.message)
      }
    }
    setLoading(false)
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <>
      <Head>
        <title>School Registration - Lux Libris</title>
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
            maxWidth: '60rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #065F46, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 0.5rem'
              }}>
                🏫
              </div>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: '300',
                color: '#065F46',
                margin: 0,
                fontFamily: 'Didot, Georgia, serif',
                letterSpacing: '1.2px'
              }}>
                School Registration
              </h1>
              <p style={{
                color: '#A1E5DB',
                fontSize: '0.875rem',
                margin: 0,
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Join your diocese reading program
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '50rem',
          margin: '0 auto',
          padding: '2rem 1.5rem'
        }}>
          
          {/* Registration Form */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #A1E5DB',
            boxShadow: '0 10px 30px rgba(161, 229, 219, 0.15)'
          }}>
            
            {/* Diocese Validation Section */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                Diocese Join Code *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="TXAUSTIN-DIOCESE-2025"
                  value={formData.dioceseJoinCode}
                  onChange={(e) => handleInputChange('dioceseJoinCode', e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: errors.dioceseJoinCode 
                      ? '2px solid #E53E3E' 
                      : dioceseInfo 
                        ? '2px solid #68D391'
                        : '1px solid #A1E5DB',
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
                {isValidatingCode && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #065F46',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
              </div>
              
              {errors.dioceseJoinCode && (
                <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontFamily: 'Avenir' }}>
                  {errors.dioceseJoinCode}
                </p>
              )}
              
              {dioceseInfo && (
                <div style={{
                  background: '#A1E5DB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <p style={{
                    color: '#065F46',
                    fontSize: '0.875rem',
                    margin: '0 0 0.5rem 0',
                    fontWeight: '600',
                    fontFamily: 'Avenir'
                  }}>
                    ✅ Found: {dioceseInfo.name}
                  </p>
                  <p style={{
                    color: '#065F46',
                    fontSize: '0.75rem',
                    margin: '0.25rem 0',
                    fontFamily: 'Avenir'
                  }}>
                    📊 {capacityInfo?.tierName} Tier • Schools: {capacityInfo?.currentSchools}/{capacityInfo?.maxSchools} • {dioceseInfo.city}, {dioceseInfo.state}
                  </p>
                  
                  {/* ENHANCED: Capacity Status Display */}
                  {capacityInfo && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      background: capacityInfo.overageFee > 0 
                        ? 'rgba(245, 158, 11, 0.2)' 
                        : 'rgba(16, 185, 129, 0.2)',
                      border: `1px solid ${capacityInfo.overageFee > 0 ? '#F59E0B' : '#10B981'}`
                    }}>
                      {capacityInfo.overageFee > 0 ? (
                        <p style={{
                          color: '#F59E0B',
                          fontSize: '0.75rem',
                          margin: 0,
                          fontWeight: '600',
                          fontFamily: 'Avenir'
                        }}>
                          ⚠️ Adding this school will exceed tier limit
                          <br />Additional cost: {formatCurrency(capacityInfo.overageFee)}/year
                        </p>
                      ) : (
                        <p style={{
                          color: '#10B981',
                          fontSize: '0.75rem',
                          margin: 0,
                          fontWeight: '600',
                          fontFamily: 'Avenir'
                        }}>
                          ✅ Capacity available - no additional cost
                        </p>
                      )}
                    </div>
                  )}
                  
                  {dioceseInfo.selectedPrograms && dioceseInfo.selectedPrograms.length > 0 && (
                    <p style={{
                      color: '#065F46',
                      fontSize: '0.75rem',
                      margin: '0.25rem 0 0 0',
                      fontFamily: 'Avenir'
                    }}>
                      📚 Programs: {dioceseInfo.selectedPrograms.length} reading program(s) available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Rest of the form - Principal Account Section */}
            {dioceseInfo && (
              <>
                {/* Principal account fields (same as before) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  
                  {/* Principal Email */}
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
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      placeholder="admin@school.edu"
                      value={formData.principalEmail}
                      onChange={(e) => handleInputChange('principalEmail', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.principalEmail ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.principalEmail && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.principalEmail}
                      </p>
                    )}
                  </div>

                  {/* Principal Role */}
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
                      Your Role *
                    </label>
                    <select
                      value={formData.principalRole}
                      onChange={(e) => handleInputChange('principalRole', e.target.value)}
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
                    >
                      <option value="principal">Principal</option>
                      <option value="administrator">Administrator</option>
                      <option value="vice_principal">Vice Principal</option>
                      <option value="it_admin">IT Administrator</option>
                      <option value="librarian">Head Librarian</option>
                    </select>
                  </div>
                </div>

                {/* Name fields */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
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
                      First Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      value={formData.principalFirstName}
                      onChange={(e) => handleInputChange('principalFirstName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.principalFirstName ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.principalFirstName && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.principalFirstName}
                      </p>
                    )}
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
                      value={formData.principalLastName}
                      onChange={(e) => handleInputChange('principalLastName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.principalLastName ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.principalLastName && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.principalLastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password fields */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
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
                      Create Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={formData.principalPassword}
                      onChange={(e) => handleInputChange('principalPassword', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.principalPassword ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.principalPassword && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.principalPassword}
                      </p>
                    )}
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
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.confirmPassword ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.confirmPassword && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* School Information */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{
                      display: 'block',
                      color: '#065F46',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Avenir',
                      letterSpacing: '1.2px'
                    }}>
                      School Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Holy Family Catholic School"
                      value={formData.schoolName}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.schoolName ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.schoolName && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.schoolName}
                      </p>
                    )}
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
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="Austin"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.city ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.city && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.city}
                      </p>
                    )}
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
                      State *
                    </label>
                    <input
                      type="text"
                      placeholder="TX"
                      maxLength="2"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: errors.state ? '2px solid #E53E3E' : '1px solid #A1E5DB',
                        background: '#FFFCF5',
                        color: '#065F46',
                        fontSize: '1rem',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        fontFamily: 'Avenir'
                      }}
                    />
                    {errors.state && (
                      <p style={{ color: '#E53E3E', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'Avenir' }}>
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>

                {/* Code Preview (same as before) */}
                {formData.schoolName && formData.principalLastName && formData.city && formData.state && (
                  <div style={{
                    background: '#A1E5DB',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{
                      color: '#065F46',
                      fontSize: '1.125rem',
                      marginBottom: '1rem',
                      fontFamily: 'Didot, Georgia, serif',
                      letterSpacing: '1.2px'
                    }}>
                      Your School Codes Preview
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #68D391'
                      }}>
                        <p style={{ color: '#68D391', fontSize: '0.875rem', margin: '0 0 0.5rem 0', fontFamily: 'Avenir' }}>
                          🏫 School Access Code
                        </p>
                        <p style={{
                          color: '#065F46',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          margin: 0,
                          fontFamily: 'monospace',
                          letterSpacing: '0.1em'
                        }}>
                          {generateSchoolCodes(formData, dioceseInfo).schoolAccessCode}
                        </p>
                      </div>
                      <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #68D391'
                      }}>
                        <p style={{ color: '#68D391', fontSize: '0.875rem', margin: '0 0 0.5rem 0', fontFamily: 'Avenir' }}>
                          👨‍🏫 Teacher Join Code
                        </p>
                        <p style={{
                          color: '#065F46',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          margin: 0,
                          fontFamily: 'monospace',
                          letterSpacing: '0.1em'
                        }}>
                          {generateSchoolCodes(formData, dioceseInfo).teacherJoinCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ENHANCED: Register Button with capacity validation */}
                <button
                  onClick={handleSchoolRegistration}
                  disabled={loading || !dioceseInfo || Object.keys(errors).some(key => errors[key]) || !capacityInfo?.allowed}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading || !capacityInfo?.allowed
                      ? '#D1FAE5' 
                      : 'linear-gradient(135deg, #065F46, #A1E5DB)',
                    color: loading || !capacityInfo?.allowed ? '#065F46' : 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: loading || !capacityInfo?.allowed ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: 'Didot, Georgia, serif',
                    letterSpacing: '1.2px'
                  }}
                >
                  {loading && (
                    <div style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      border: loading ? '2px solid #065F46' : '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  {loading ? 'Creating School...' : 
                   !capacityInfo?.allowed ? 'Capacity Limit Reached' :
                   capacityInfo?.overageFee > 0 ? `Register School (${formatCurrency(capacityInfo.overageFee)} overage)` :
                   'Register School'}
                </button>
              </>
            )}

            {/* Information Footer */}
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
                lineHeight: '1.5',
                fontFamily: 'Avenir'
              }}>
                🎯 <strong>How it works:</strong> Enter your diocese join code, create your principal account, 
                and your school will be automatically added to your diocese. 
                {capacityInfo?.overageFee > 0 && (
                  <span style={{ fontWeight: 'bold', color: '#F59E0B' }}>
                    {' '}Note: This registration will trigger overage billing for your diocese.
                  </span>
                )}
              </p>
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
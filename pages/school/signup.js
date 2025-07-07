// pages/school/signup.js - FIXED SCHOOL SIGNUP WITH GREEN PALETTE & TYPOGRAPHY
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { db, authHelpers } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore'

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
          } else {
            setDioceseInfo(null)
            setErrors(prev => ({ ...prev, dioceseJoinCode: 'Diocese not found with this join code' }))
          }
        } catch (error) {
          setDioceseInfo(null)
          setErrors(prev => ({ ...prev, dioceseJoinCode: 'Error validating diocese code' }))
        }
        setIsValidatingCode(false)
      } else {
        setDioceseInfo(null)
        setErrors(prev => ({ ...prev, dioceseJoinCode: '' }))
      }
    }

    const timeoutId = setTimeout(validateDioceseCode, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.dioceseJoinCode])

  // Find diocese by join code (diocese access code = principal join code)
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

  // Generate school codes based on geographic and school data
  const generateSchoolCodes = (schoolData, diocese) => {
    const year = new Date().getFullYear()
    const stateCode = schoolData.state.substring(0, 2).toUpperCase()
    const cityCode = schoolData.city.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
    const schoolPrefix = schoolData.schoolName.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
    const principalLastName = schoolData.principalLastName.replace(/[^A-Za-z]/g, '').substring(0, 6).toUpperCase()
    
    // School access code: TXAUS-HOLY-SMITH-2025
    const schoolAccessCode = `${stateCode}${cityCode}-${schoolPrefix}-${principalLastName}-${year}`
    
    // Teacher join code: TXAUS-HOLY-TEACHER-2025  
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

  // Handle school registration
  const handleSchoolRegistration = async () => {
    if (!validateForm()) return
    
    // Check diocese capacity
    if (dioceseInfo.currentSubEntities >= dioceseInfo.maxSubEntities) {
      alert(`Diocese has reached capacity (${dioceseInfo.maxSubEntities} schools). Please contact your diocese administrator to upgrade.`)
      return
    }

    setLoading(true)
    try {
      console.log('🏫 Creating school registration...')
      
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
      
      // Create school document in diocese subcollection
      const schoolData = {
        // Basic school info
        name: formData.schoolName,
        city: formData.city,
        state: formData.state,
        
        // Principal info
        principalEmail: formData.principalEmail,
        principalLastName: formData.principalLastName,
        principalAuthUid: principalAuth.uid,
        
        // Access codes
        schoolAccessCode: schoolCodes.schoolAccessCode,
        teacherJoinCode: schoolCodes.teacherJoinCode,
        
        // Diocese relationship
        parentEntityId: dioceseInfo.id,
        parentEntityType: dioceseInfo.type,
        parentEntityName: dioceseInfo.name,
        
        // Program configuration - ENHANCED: inherit from diocese
        selectedPrograms: dioceseInfo.selectedPrograms || ['luxlibris'],
        programsIncluded: dioceseInfo.selectedPrograms?.length || 1,
        selectedNominees: [],
        achievementTiers: [],
        submissionOptions: { quiz: true, presentation: false },
        
        // Counts
        teacherCount: 0,
        studentCount: 0,
        
        // Status
        status: 'active',
        setupCompleted: false,
        createdAt: new Date(),
        lastModified: new Date()
      }
      
      // Save school to entities subcollection
      const schoolRef = await addDoc(collection(db, `entities/${dioceseInfo.id}/schools`), schoolData)
      console.log('✅ School created with ID:', schoolRef.id)
      
      // Create the first admin account in the admins subcollection
      const firstAdminData = {
        email: formData.principalEmail,
        firstName: formData.principalFirstName,
        lastName: formData.principalLastName,
        role: formData.principalRole,
        authUid: principalAuth.uid,
        schoolId: schoolRef.id,
        dioceseId: dioceseInfo.id,
        schoolName: formData.schoolName,
        isFounder: true, // Mark as the school founder
        createdAt: new Date(),
        status: 'active'
      }
      
      // Save first admin to admins subcollection
      await addDoc(collection(db, `entities/${dioceseInfo.id}/schools/${schoolRef.id}/admins`), firstAdminData)
      console.log('✅ First admin account created')
      
      // Update diocese school count
      await updateDoc(doc(db, 'entities', dioceseInfo.id), {
        currentSubEntities: (dioceseInfo.currentSubEntities || 0) + 1,
        lastModified: new Date()
      })
      
      // Show success message with school codes
      alert(`🎉 SCHOOL REGISTRATION SUCCESSFUL!

🏫 School: ${formData.schoolName}
🔑 Your School Access Code: ${schoolCodes.schoolAccessCode}
👨‍🏫 Teacher Join Code: ${schoolCodes.teacherJoinCode}

NEXT STEPS:
1. You will now be taken to your school dashboard
2. Use your school code + email/password to sign in
3. Share the teacher join code with your teachers
4. Configure your reading program

Save these codes securely!`)
      
      // Redirect to school dashboard with pre-filled school code
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
    // Clear error when user starts typing
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
                    margin: 0,
                    fontWeight: '600',
                    fontFamily: 'Avenir'
                  }}>
                    ✅ Found: {dioceseInfo.name}
                  </p>
                  <p style={{
                    color: '#065F46',
                    fontSize: '0.75rem',
                    margin: '0.25rem 0 0 0',
                    fontFamily: 'Avenir'
                  }}>
                    Schools: {dioceseInfo.currentSubEntities || 0}/{dioceseInfo.maxSubEntities || 0} • 
                    {dioceseInfo.city}, {dioceseInfo.state}
                  </p>
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

            {/* Principal Account Section */}
            {dioceseInfo && (
              <>
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>

                  {/* Principal First Name */}
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

                  {/* Principal Last Name */}
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

                {/* Password Section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  
                  {/* Password */}
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

                  {/* Confirm Password */}
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

                {/* School Information Section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  
                  {/* School Name */}
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

                  {/* City */}
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

                  {/* State */}
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

                {/* Code Preview Section */}
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

                {/* Register Button */}
                <button
                  onClick={handleSchoolRegistration}
                  disabled={loading || !dioceseInfo || Object.keys(errors).some(key => errors[key])}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading 
                      ? '#D1FAE5' 
                      : 'linear-gradient(135deg, #065F46, #A1E5DB)',
                    color: loading ? '#065F46' : 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
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
                  {loading ? 'Creating School...' : '🚀 Register School'}
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
                and your school will be automatically added to your diocese. You will receive unique school 
                codes to manage teachers and students.
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
// contexts/AuthContext.js - FIXED: Prevents double sign-out processing
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  
  // 🔧 NEW: Add refs to prevent double processing
  const lastAuthState = useRef(null)
  const processingAuth = useRef(false)

  // Session timeout settings
  const ADMIN_TIMEOUT = 60 * 60 * 1000 // 60 minutes for admins
  const STUDENT_TIMEOUT = 7 * 24 * 60 * 60 * 1000 // 7 days for students

  const initializeLastActivity = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('luxlibris_last_activity')
      return stored ? parseInt(stored) : Date.now()
    }
    return Date.now()
  }

  const [lastActivity, setLastActivity] = useState(initializeLastActivity)

  const updateLastActivity = (timestamp = Date.now()) => {
    setLastActivity(timestamp)
    if (typeof window !== 'undefined') {
      localStorage.setItem('luxlibris_last_activity', timestamp.toString())
    }
  }

  // Update last activity on meaningful user interactions
  useEffect(() => {
    const updateActivity = () => updateLastActivity()
    
    if (typeof window !== 'undefined') {
      const events = ['click', 'keypress', 'touchstart']
      events.forEach(event => 
        document.addEventListener(event, updateActivity, true)
      )

      return () => {
        events.forEach(event => 
          document.removeEventListener(event, updateActivity, true)
        )
      }
    }
  }, [])

  // Check if session is expired
  const isSessionExpired = () => {
    if (!userProfile) return false
    
    // Only check timeout for admins
    if (userProfile.accountType !== 'admin') return false
    
    const now = Date.now()
    const stored = typeof window !== 'undefined' 
      ? localStorage.getItem('luxlibris_last_activity') 
      : null
    
    const lastActivityTime = stored ? parseInt(stored) : lastActivity
    const timeSinceActivity = now - lastActivityTime
    
    return timeSinceActivity > ADMIN_TIMEOUT
  }

  // 🔧 NEW: Helper function to detect inconsistent states
  const checkForInconsistentState = (profile) => {
    if (typeof window === 'undefined') return false
    
    // Check for new account markers
    const hasNewAccountMarkers = 
      localStorage.getItem('luxlibris_account_created') === 'true' ||
      localStorage.getItem('tempParentData') ||
      localStorage.getItem('parentOnboardingData')
    
    if (!hasNewAccountMarkers) return false
    
    // For parents: if they just completed onboarding but profile shows incomplete
    if (profile.accountType === 'parent') {
      const hasOnboardingTimestamp = profile.onboardingCompletedAt
      const onboardingIncomplete = profile.onboardingCompleted !== true
      
      // If we have timestamp but incomplete flag, it's likely stale read
      if (hasOnboardingTimestamp && onboardingIncomplete) {
        console.log('🔍 Detected inconsistent parent state: has timestamp but incomplete flag')
        return true
      }
      
      // If account created very recently (< 60 seconds) and incomplete
      if (profile.accountCreated && onboardingIncomplete) {
        const accountAge = Date.now() - profile.accountCreated.toMillis()
        if (accountAge < 60000) { // 60 seconds
          console.log('🔍 Detected fresh parent account with incomplete onboarding')
          return true
        }
      }
    }
    
    // For students: similar logic can be added
    if (profile.accountType === 'student') {
      const hasOnboardingTimestamp = profile.accountCreated
      const onboardingIncomplete = profile.onboardingCompleted !== true
      
      if (hasOnboardingTimestamp && onboardingIncomplete) {
        const accountAge = Date.now() - hasOnboardingTimestamp.toMillis()
        if (accountAge < 60000) {
          console.log('🔍 Detected fresh student account with incomplete onboarding')
          return true
        }
      }
    }
    
    return false
  }

  // 🔧 NEW: Helper to determine if error is worth retrying
  const isRetriableError = (error) => {
    return error.code === 'unavailable' || 
           error.code === 'deadline-exceeded' ||
           error.message?.includes('timeout') ||
           error.message?.includes('network') ||
           error.message?.includes('cancelled')
  }

  // 🔧 ENHANCED: getUserProfile with retry logic
  const getUserProfile = async (uid, retryAttempt = 0) => {
    const maxRetries = 3
    const baseDelay = 1000 // 1 second
    
    try {
      console.log(`🔍 Getting user profile (attempt ${retryAttempt + 1}/${maxRetries + 1}) for UID:`, uid)
      
      // FIRST: Check parents collection
      try {
        const parentRef = doc(db, 'parents', uid)
        const parentDoc = await getDoc(parentRef)
        
        if (parentDoc.exists()) {
          const profile = {
            id: parentDoc.id,
            ...parentDoc.data()
          }
          
          // 🔧 CRITICAL: Check for consistency issues
          const isInconsistentState = checkForInconsistentState(profile)
          
          if (isInconsistentState && retryAttempt < maxRetries) {
            const delay = baseDelay * (retryAttempt + 1)
            console.log(`🔄 Inconsistent parent state detected, retrying in ${delay}ms`)
            
            await new Promise(resolve => setTimeout(resolve, delay))
            return await getUserProfile(uid, retryAttempt + 1)
          }
          
          // 🔧 Success: Clean up consistency markers
          if (typeof window !== 'undefined' && profile.onboardingCompleted === true) {
            localStorage.removeItem('luxlibris_account_created')
            localStorage.removeItem('tempParentData')
            localStorage.removeItem('parentOnboardingData')
          }
          
          console.log('✅ Found parent profile')
          return profile
        }
      } catch (error) {
        console.log('No parent found with UID')
      }
      
      // SECOND: Search in entities structure for teachers, admins, and students
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            // Check teachers collection
            const teachersRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/teachers`)
            const teacherQuery = query(teachersRef, where('uid', '==', uid))
            const teacherSnapshot = await getDocs(teacherQuery)
            
            if (!teacherSnapshot.empty) {
              const teacherDoc = teacherSnapshot.docs[0]
              const profile = {
                id: teacherDoc.id,
                entityId: entityDoc.id,
                schoolId: schoolDoc.id,
                ...teacherDoc.data()
              }
              console.log('✅ Found teacher profile in entities structure')
              return profile
            }
            
            // Check admins collection  
            const adminsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/admins`)
            const adminQuery = query(adminsRef, where('uid', '==', uid))
            const adminSnapshot = await getDocs(adminQuery)
            
            if (!adminSnapshot.empty) {
              const adminDoc = adminSnapshot.docs[0]
              const profile = {
                id: adminDoc.id,
                entityId: entityDoc.id,
                schoolId: schoolDoc.id,
                ...adminDoc.data()
              }
              console.log('✅ Found admin profile in entities structure')
              return profile
            }

            // Check students collection in entities structure
            const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`)
            const studentQuery = query(studentsRef, where('uid', '==', uid))
            const studentSnapshot = await getDocs(studentQuery)
            
            if (!studentSnapshot.empty) {
              const studentDoc = studentSnapshot.docs[0]
              const profile = {
                id: studentDoc.id,
                entityId: entityDoc.id,
                schoolId: schoolDoc.id,
                ...studentDoc.data()
              }

              // Check if student needs grade progression
              if (profile.accountType === 'student') {
                try {
                  const { checkGradeProgression } = await import('../lib/firebase')
                  const progressionCheck = await checkGradeProgression(profile)
                  profile.needsGradeUpdate = progressionCheck.needsUpdate
                  profile.suggestedGrade = progressionCheck.suggestedGrade
                  profile.shouldBeAlumni = progressionCheck.shouldBeAlumni
                  
                  if (progressionCheck.needsUpdate) {
                    console.log('📈 Student needs grade progression:', profile.firstName)
                  }
                } catch (gradeError) {
                  console.log('Grade progression check failed:', gradeError)
                }
              }

              // 🔧 Check for student consistency issues
              const isInconsistentState = checkForInconsistentState(profile)
              
              if (isInconsistentState && retryAttempt < maxRetries) {
                const delay = baseDelay * (retryAttempt + 1)
                console.log(`🔄 Inconsistent student state detected, retrying in ${delay}ms`)
                
                await new Promise(resolve => setTimeout(resolve, delay))
                return await getUserProfile(uid, retryAttempt + 1)
              }

              console.log('✅ Found student profile in entities structure')
              return profile
            }
          }
        } catch (error) {
          console.log(`No schools in entity ${entityDoc.id}`)
        }
      }
      
      console.log('❌ User profile not found')
      return null
      
    } catch (error) {
      console.error('❌ Error fetching user profile:', error)
      
      // If we have retries left and it's a retriable error, try again
      if (retryAttempt < maxRetries && isRetriableError(error)) {
        const delay = baseDelay * (retryAttempt + 1)
        console.log(`🔄 Retriable error, retrying in ${delay}ms:`, error.message)
        await new Promise(resolve => setTimeout(resolve, delay))
        return await getUserProfile(uid, retryAttempt + 1)
      }
      
      return null
    }
  }

  // Helper function to get teacher profile from entities structure
  const getTeacherProfile = async (uid) => {
    try {
      // Search for teacher in entities structure
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const teachersRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/teachers`)
          const teacherQuery = query(teachersRef, where('uid', '==', uid))
          const teacherSnapshot = await getDocs(teacherQuery)
          
          if (!teacherSnapshot.empty) {
            const teacherDoc = teacherSnapshot.docs[0]
            return {
              id: teacherDoc.id,
              entityId: entityDoc.id,
              schoolId: schoolDoc.id,
              ...teacherDoc.data()
            }
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error getting teacher profile:', error)
      return null
    }
  }

  // Helper function to get school data
  const getSchoolData = async (entityId, schoolId) => {
    try {
      const schoolRef = doc(db, `entities/${entityId}/schools`, schoolId)
      const schoolDoc = await getDoc(schoolRef)
      return schoolDoc.exists() ? schoolDoc.data() : null
    } catch (error) {
      console.error('Error getting school data:', error)
      return null
    }
  }

  // Check teacher onboarding status
  const checkTeacherOnboardingStatus = async (userProfile) => {
    if (!userProfile || userProfile.accountType !== 'teacher') {
      return { needsOnboarding: false, onboardingCompleted: true }
    }

    try {
      // Check if teacher completed onboarding by looking at school data
      if (userProfile.entityId && userProfile.schoolId) {
        const schoolData = await getSchoolData(userProfile.entityId, userProfile.schoolId)
        
        if (schoolData) {
          return {
            needsOnboarding: !schoolData.onboardingCompleted,
            onboardingCompleted: schoolData.onboardingCompleted || false,
            onboardingCompletedBy: schoolData.onboardingCompletedBy,
            hasSelectedNominees: schoolData.selectedNominees?.length > 0,
            hasAchievementTiers: schoolData.achievementTiers?.length > 0
          }
        }
      }
      
      return { needsOnboarding: true, onboardingCompleted: false }
    } catch (error) {
      console.error('Error checking teacher onboarding status:', error)
      return { needsOnboarding: true, onboardingCompleted: false }
    }
  }

  // Find school by student access code (entities structure only)
  const findSchoolByStudentAccessCode = async (studentAccessCode) => {
    try {
      // Search entities structure only
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        try {
          const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolData = schoolDoc.data()
            if (schoolData.studentAccessCode === studentAccessCode || 
                schoolData.accessCode === studentAccessCode) {
              return {
                id: schoolDoc.id,
                entityId: entityDoc.id,
                ...schoolData
              }
            }
          }
        } catch (error) {
          console.log(`No schools in entity ${entityDoc.id}`)
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding school:', error)
      return null
    }
  }

  // Get appropriate dashboard URL based on user type
  const getDashboardUrl = () => {
    if (!userProfile) {
      console.log('❌ No user profile, redirecting to role selector')
      return '/role-selector'
    }
    
    console.log('🎯 Determining dashboard URL for:', {
      accountType: userProfile.accountType,
      email: userProfile.email
    })

    try {
      switch (userProfile.accountType) {
        case 'student':
          const studentComplete = userProfile.onboardingCompleted === true
          console.log('🧑‍🎓 Student onboarding status:', studentComplete)
          return studentComplete ? '/student-dashboard' : '/student-onboarding'
          
        case 'teacher':
          console.log('👩‍🏫 Using cached teacher onboarding status...')
          const teacherComplete = userProfile.onboardingCompleted === true
          console.log('📊 Teacher onboarding status:', teacherComplete)
          
          if (teacherComplete) {
            console.log('✅ Teacher onboarding complete → dashboard')
            return '/admin/school-dashboard'
          } else {
            console.log('⚠️ Teacher onboarding incomplete → onboarding')
            return '/admin/school-onboarding'
          }
          
        case 'admin':
          const adminComplete = userProfile.schoolSetupCompleted === true
          console.log('👑 Admin setup status:', adminComplete)
          return adminComplete ? '/admin/school-dashboard' : '/admin/school-onboarding'
          
        case 'parent':
          const parentComplete = userProfile.onboardingCompleted === true
          console.log('👨‍👩‍👧‍👦 Parent onboarding status:', parentComplete)
          return parentComplete ? '/parent/dashboard' : '/parent/onboarding'
          
        default:
          console.log('❓ Unknown account type, redirecting to role selector')
          return '/role-selector'
      }
    } catch (error) {
      console.error('❌ Error determining dashboard URL:', error)
      return '/role-selector'
    }
  }

  // Helper function to prevent redirect loops
  const shouldRedirectToOnboarding = async () => {
    if (!userProfile) return false
    
    try {
      if (userProfile.accountType === 'teacher') {
        const status = await checkTeacherOnboardingStatus(userProfile)
        return !status.onboardingCompleted
      }
      
      if (userProfile.accountType === 'admin') {
        return !userProfile.schoolSetupCompleted
      }
      
      if (userProfile.accountType === 'student') {
        return !userProfile.onboardingCompleted
      }
      
      if (userProfile.accountType === 'parent') {
        return !userProfile.onboardingCompleted
      }
      
      return false
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      return false
    }
  }

  // 🔧 ENHANCED: Initialize auth state listener with debouncing
  useEffect(() => {
    let authTimeout = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  // Skip processing if account is being deleted
  if (typeof window !== 'undefined' && window.luxlibris_deleting_account) {
    console.log('🗑️ Skipping auth processing during account deletion');
    return;
  }
  
  // 🔧 NEW: Clear any pending timeout
  if (authTimeout) {
    clearTimeout(authTimeout);
    authTimeout = null;
  }
  
  // 🔧 NEW: Debounce rapid auth state changes
  authTimeout = setTimeout(async () => {
    // 🔧 NEW: Check if this is actually a new auth state
    const currentAuthState = firebaseUser ? firebaseUser.uid : null;
        
        // Only skip if we're signing out AND it's the same state
        if (signingOut && currentAuthState === lastAuthState.current) {
          console.log('🔄 Duplicate auth state during sign out, skipping');
          return;
        }
        
        // 🔧 NEW: Prevent concurrent processing only during sign out
        if (processingAuth.current && signingOut) {
          console.log('⏳ Already processing sign out, skipping');
          return;
        }
        
        processingAuth.current = true;
        lastAuthState.current = currentAuthState;
        
        if (firebaseUser) {
          console.log('👤 Firebase user signed in:', firebaseUser.email)
          setUser(firebaseUser)
          
          try {
            const profile = await getUserProfile(firebaseUser.uid)
            setUserProfile(profile)
            
            if (profile) {
              console.log('✅ User profile loaded:', {
                accountType: profile.accountType,
                email: profile.email,
                name: profile.firstName || profile.name,
                onboardingComplete: profile.onboardingCompleted || profile.schoolSetupCompleted
              })
              
              // Check session expiry immediately after loading profile
              if (profile?.accountType === 'admin') {
                updateLastActivity()
                
                if (isSessionExpired()) {
                  console.log('⏰ Admin session expired on page load')
                  await signOut({ redirectTo: '/sign-in?reason=session-expired' })
                  processingAuth.current = false;
                  return
                }
              } else {
                updateLastActivity()
              }
            } else {
              console.log('❌ No user profile found for UID:', firebaseUser.uid)
            }
          } catch (error) {
            console.error('❌ Error loading user profile:', error)
            setUserProfile(null)
          }
          
          if (!initialized) {
            setInitialized(true)
          }
          setLoading(false)
          
        } else {
          // Only log if this is a new sign out
          if (lastAuthState.current !== null) {
            console.log('👤 User signed out');
          }
          setUser(null)
          setUserProfile(null)
          
          // Clear activity tracking
          if (typeof window !== 'undefined') {
            localStorage.removeItem('luxlibris_last_activity')
          }
          
          if (!initialized) {
            setInitialized(true)
          }
          setLoading(false)
        }
        
        processingAuth.current = false;
      }, 50); // 50ms debounce - shorter for better responsiveness
    })

    return () => {
      unsubscribe()
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      // Reset refs on unmount
      lastAuthState.current = null;
      processingAuth.current = false;
    }
  }, [initialized, signingOut]) // 🔧 Added signingOut to dependencies

  // In AuthContext.js - CLEAN & RELIABLE signOut function
  const signOut = async (options = {}) => {
    console.log('🚪 Starting sign out...')
    
    try {
      // 1. Set signing out state to prevent other redirects
      setSigningOut(true)
      
      // 2. Clear React state immediately  
      setUser(null)
      setUserProfile(null)
      
      // 3. Clear all localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear() // 🔧 SIMPLE: Just clear everything
      }
      
      // 4. Sign out from Firebase
      await firebaseSignOut(auth)
      
      // 5. 🔧 IMMEDIATE redirect to homepage
      const homepage = options.redirectTo || '/'
      console.log('🏠 Redirecting to:', homepage)
      
      if (typeof window !== 'undefined') {
        window.location.replace(homepage) // Most reliable redirect method
      }
      
    } catch (error) {
      console.error('❌ Sign out error:', error)
      
      // Even if Firebase fails, still go to homepage
      if (typeof window !== 'undefined') {
        console.log('🏠 Force redirect to homepage after error')
        window.location.replace('/')
      }
    }
    
    // Note: We don't set setSigningOut(false) because we're leaving the page
  }

  // Refresh profile function
  const refreshProfile = async () => {
    if (user) {
      try {
        console.log('🔄 Refreshing user profile...')
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
        return profile
      } catch (error) {
        console.error('Error refreshing profile:', error)
        return null
      }
    }
    return null
  }

  // Check if user has completed onboarding
  const hasCompletedOnboarding = async () => {
    if (!userProfile) return false
    
    if (userProfile.accountType === 'student') {
      return userProfile.onboardingCompleted === true
    }
    
    if (userProfile.accountType === 'teacher') {
      const status = await checkTeacherOnboardingStatus(userProfile)
      return status.onboardingCompleted
    }
    
    if (userProfile.accountType === 'admin') {
      return userProfile.schoolSetupCompleted === true
    }
    
    if (userProfile.accountType === 'parent') {
      return userProfile.onboardingCompleted === true
    }
    
    return true
  }

  // Check if user belongs to a specific school
  const belongsToSchool = (schoolId) => {
    if (!userProfile) return false
    return userProfile.schoolId === schoolId || 
           (userProfile.schoolIds && userProfile.schoolIds.includes(schoolId))
  }

  // Get user's school information
  const getUserSchool = async () => {
    if (!userProfile || !userProfile.schoolId) return null
    
    try {
      const schoolsRef = collection(db, 'schools')
      const schoolDoc = await getDoc(doc(schoolsRef, userProfile.schoolId))
      
      if (schoolDoc.exists()) {
        return { id: schoolDoc.id, ...schoolDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching user school:', error)
      return null
    }
  }

  const value = {
    // State
    user,
    userProfile,
    loading,
    initialized,
    lastActivity,
    signingOut,
    
    // Helper functions
    signOut,
    refreshProfile,
    hasCompletedOnboarding,
    getDashboardUrl,
    shouldRedirectToOnboarding,
    belongsToSchool,
    getUserSchool,
    isSessionExpired,
    updateLastActivity,
    
    // Onboarding-related functions
    checkTeacherOnboardingStatus,
    getTeacherProfile,
    getSchoolData,
    findSchoolByStudentAccessCode,
    getUserProfile,
    
    // Computed values
    isAuthenticated: !!user && !signingOut,
    isStudent: userProfile?.accountType === 'student',
    isParent: userProfile?.accountType === 'parent',
    isAdmin: userProfile?.accountType === 'admin',
    isTeacher: userProfile?.accountType === 'teacher',
    
    // Quick access to user data
    firstName: userProfile?.firstName || userProfile?.name?.split(' ')[0] || '',
    schoolName: userProfile?.schoolName || '',
    accountType: userProfile?.accountType || null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protected routes with session checking
export const withAuth = (WrappedComponent, allowedAccountTypes = ['student', 'parent', 'admin', 'teacher']) => {
  const AuthenticatedComponent = (props) => {
    const { 
      user, 
      userProfile, 
      loading, 
      initialized,
      isAuthenticated, 
      getDashboardUrl, 
      hasCompletedOnboarding,
      isSessionExpired,
      signOut
    } = useAuth()
    const router = useRouter()

    useEffect(() => {
      const checkAuth = async () => {
        if (!loading && initialized) {
          if (!isAuthenticated) {
            router.push('/')
            return
          }

          // Check session expiry for admins
          if (userProfile?.accountType === 'admin' && isSessionExpired()) {
            console.log('⏰ Admin session expired in protected route')
            await signOut({ redirectTo: '/sign-in?reason=session-expired' })
            return
          }

          if (userProfile && !allowedAccountTypes.includes(userProfile.accountType)) {
            const dashboardUrl = await getDashboardUrl()
            router.push(dashboardUrl)
            return
          }

          // Check onboarding status
          if (userProfile) {
            const completed = await hasCompletedOnboarding()
            if (!completed) {
              const dashboardUrl = await getDashboardUrl()
              router.push(dashboardUrl)
              return
            }
          }
        }
      }

      checkAuth()
    }, [loading, initialized, isAuthenticated, userProfile, router])

    // Show loading while checking authentication
    if (loading || !isAuthenticated || !userProfile) {
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
            <p style={{ color: '#223848', fontSize: '1.1rem' }}>
              Loading your account...
            </p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  return AuthenticatedComponent
}

// Hook for checking authentication status without redirecting
export const useAuthStatus = () => {
  const { user, userProfile, loading, isAuthenticated } = useAuth()
  
  return {
    user,
    userProfile,
    loading,
    isAuthenticated,
    isStudent: userProfile?.accountType === 'student',
    isParent: userProfile?.accountType === 'parent',
    isAdmin: userProfile?.accountType === 'admin',
    isTeacher: userProfile?.accountType === 'teacher'
  }
}
// contexts/AuthContext.js - UPDATED for Entities Structure Only
import { createContext, useContext, useEffect, useState } from 'react'
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

  // Session timeout settings
  const ADMIN_TIMEOUT = 60 * 60 * 1000 // 60 minutes (1 hour) for admins
  const STUDENT_TIMEOUT = 7 * 24 * 60 * 60 * 1000 // 7 days for students (effectively no timeout)

  // Initialize last activity from localStorage or current time
  const initializeLastActivity = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('luxlibris_last_activity')
      return stored ? parseInt(stored) : Date.now()
    }
    return Date.now()
  }

  const [lastActivity, setLastActivity] = useState(initializeLastActivity)

  // Store activity in localStorage whenever it changes
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
    
    console.log('🕐 Admin session check:', {
      now: new Date(now).toLocaleTimeString(),
      lastActivity: new Date(lastActivityTime).toLocaleTimeString(),
      timeSinceActivity: Math.round(timeSinceActivity / 1000 / 60) + ' minutes',
      timeout: Math.round(ADMIN_TIMEOUT / 1000 / 60) + ' minutes',
      isExpired: timeSinceActivity > ADMIN_TIMEOUT
    })
    
    return timeSinceActivity > ADMIN_TIMEOUT
  }

  // UPDATED: Complete entities-only getUserProfile
  const getUserProfile = async (uid) => {
    try {
      console.log('🔍 Looking for user profile with UID:', uid)
      
      // Search in entities structure for teachers, admins, AND students
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

            // NEW: Check students collection in entities structure
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

// NEW: Check if student needs grade progression
if (profile.accountType === 'student') {
  const { checkGradeProgression } = await import('../lib/firebase')
  const progressionCheck = await checkGradeProgression(profile)
  profile.needsGradeUpdate = progressionCheck.needsUpdate
  profile.suggestedGrade = progressionCheck.suggestedGrade
  profile.shouldBeAlumni = progressionCheck.shouldBeAlumni
  
  if (progressionCheck.needsUpdate) {
    console.log('📈 Student needs grade progression:', profile.firstName)
  }
}

console.log('✅ Found student profile in entities structure')
return profile
            }
          }
        } catch (error) {
          console.log(`No schools in entity ${entityDoc.id}`)
        }
      }
      
      // REMOVED: No more fallback to users collection - entities structure only!
      console.log('❌ User profile not found in entities structure')
      return null
      
    } catch (error) {
      console.error('❌ Error fetching user profile:', error)
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
        console.log('👨‍👩‍👧‍👦 Parent → dashboard')
        return '/parent-dashboard'
        
      default:
        console.log('❓ Unknown account type, redirecting to role selector')
        return '/role-selector'
    }
  } catch (error) {
    console.error('❌ Error determining dashboard URL:', error)
    // On error, send to role selector to be safe
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
      
      return false
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      return false
    }
  }

  // Initialize auth state listener with increased timeout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('👤 Firebase user signed in:', firebaseUser.email)
        setUser(firebaseUser)
        
        // Give Firebase more time to finish writing data
        setTimeout(async () => {
          try {
            const profile = await getUserProfile(firebaseUser.uid)
            setUserProfile(profile)
            
            if (profile) {
              console.log('✅ User profile loaded:', {
                accountType: profile.accountType,
                email: profile.email,
                name: profile.firstName || profile.name
              })
              
              // Check session expiry immediately after loading profile
              if (profile?.accountType === 'admin') {
                updateLastActivity()
                
                if (isSessionExpired()) {
                  console.log('⏰ Admin session expired on page load')
                  await signOut({ redirectTo: '/sign-in?reason=session-expired' })
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
        }, 2000) // Give it 2 seconds for database writes to complete
        
      } else {
        console.log('👤 User signed out')
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
    })

    return () => unsubscribe()
  }, [initialized])

  // Enhanced sign out with redirect options
  const signOut = async (options = {}) => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('luxlibris_student_profile')
        localStorage.removeItem('luxlibris_account_created')
        localStorage.removeItem('luxlibris_onboarding_complete')
        localStorage.removeItem('luxlibris_last_activity')
        // Clear teacher onboarding data
        localStorage.removeItem('teacherProgramSelection')
        localStorage.removeItem('tempTeacherCodes')
      }
      
      // Handle redirects
      if (options.redirectTo) {
        window.location.href = options.redirectTo
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Refresh profile function
  const refreshProfile = async () => {
    if (user) {
      try {
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
    isAuthenticated: !!user,
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
          // CORRECT - should redirect to homepage instead
if (!isAuthenticated) {
  // User not authenticated, redirect to homepage
  router.push('/')  // ✅ This is correct!
  return
}

          // Check session expiry for admins
          if (userProfile?.accountType === 'admin' && isSessionExpired()) {
            console.log('⏰ Admin session expired in protected route')
            await signOut({ redirectTo: '/sign-in?reason=session-expired' })
            return
          }

          if (userProfile && !allowedAccountTypes.includes(userProfile.accountType)) {
            // User doesn't have permission for this page
            const dashboardUrl = await getDashboardUrl()
            router.push(dashboardUrl)
            return
          }

          // Check onboarding status
          if (userProfile) {
            const completed = await hasCompletedOnboarding()
            if (!completed) {
              // User needs to complete onboarding
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
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { authHelpers, dbHelpers, db } from '../lib/firebase'
import { collection, getDoc, doc } from 'firebase/firestore'

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

  // Update last activity on meaningful user interactions (reduced events)
  useEffect(() => {
    const updateActivity = () => updateLastActivity()
    
    if (typeof window !== 'undefined') {
      // Only track meaningful interactions, not mouse movements
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

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = authHelpers.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser)
        
        // Get user profile from database
        try {
          const profile = await dbHelpers.getUserProfile(firebaseUser.uid)
          setUserProfile(profile)
          
          // Check session expiry immediately after loading profile
          if (profile?.accountType === 'admin') {
            // Initialize activity tracking for admin
            updateLastActivity()
            
            // Check if session is expired
            if (isSessionExpired()) {
              console.log('⏰ Admin session expired on page load')
              await signOut({ redirectTo: '/sign-in?reason=session-expired' })
              return
            }
          } else {
            // For students, just update activity
            updateLastActivity()
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUserProfile(null)
        }
      } else {
        // User is signed out
        setUser(null)
        setUserProfile(null)
        // Clear activity tracking
        if (typeof window !== 'undefined') {
          localStorage.removeItem('luxlibris_last_activity')
        }
      }
      
      if (!initialized) {
        setInitialized(true)
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [initialized])

  // Enhanced sign out with redirect options
  const signOut = async (options = {}) => {
    try {
      await authHelpers.signOut()
      setUser(null)
      setUserProfile(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('luxlibris_student_profile')
        localStorage.removeItem('luxlibris_account_created')
        localStorage.removeItem('luxlibris_onboarding_complete')
        localStorage.removeItem('luxlibris_last_activity')
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

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await dbHelpers.getUserProfile(user.uid)
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
  const hasCompletedOnboarding = () => {
    if (!userProfile) return false
    
    if (userProfile.accountType === 'student') {
      return userProfile.onboardingCompleted === true
    }
    
    if (userProfile.accountType === 'admin') {
      return userProfile.schoolSetupCompleted === true
    }
    
    return true
  }

  // Get appropriate dashboard URL based on user type
  const getDashboardUrl = () => {
    if (!userProfile) return '/role-selector'
    
    switch (userProfile.accountType) {
      case 'student':
        return hasCompletedOnboarding() ? '/student-dashboard' : '/student-onboarding'
      case 'admin':
        return hasCompletedOnboarding() ? '/admin/school-dashboard' : '/admin/school-onboarding'
      case 'parent':
        return '/parent-dashboard'
      default:
        return '/role-selector'
    }
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
    belongsToSchool,
    getUserSchool,
    isSessionExpired,
    updateLastActivity,
    
    // Computed values
    isAuthenticated: !!user,
    isStudent: userProfile?.accountType === 'student',
    isParent: userProfile?.accountType === 'parent',
    isAdmin: userProfile?.accountType === 'admin',
    
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

// Updated Higher-order component for protected routes with session checking
export const withAuth = (WrappedComponent, allowedAccountTypes = ['student', 'parent', 'admin']) => {
  const AuthenticatedComponent = (props) => {
    const { 
      user, 
      userProfile, 
      loading, 
      isAuthenticated, 
      getDashboardUrl, 
      hasCompletedOnboarding,
      isSessionExpired,
      signOut
    } = useAuth()
    const router = useRouter()

    useEffect(() => {
      const checkAuth = async () => {
        if (!loading) {
          if (!isAuthenticated) {
            // User not authenticated, redirect to role selector
            router.push('/role-selector')
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
            router.push(getDashboardUrl())
            return
          }

          if (userProfile && !hasCompletedOnboarding()) {
            // User needs to complete onboarding
            router.push(getDashboardUrl())
            return
          }
        }
      }

      checkAuth()
    }, [loading, isAuthenticated, userProfile, router])

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
    isAdmin: userProfile?.accountType === 'admin'
  }
}
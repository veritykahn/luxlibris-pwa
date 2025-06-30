// contexts/AuthContext.js
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
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUserProfile(null)
        }
      } else {
        // User is signed out
        setUser(null)
        setUserProfile(null)
      }
      
      if (!initialized) {
        setInitialized(true)
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [initialized])

  // Helper functions
  const signOut = async () => {
    try {
      await authHelpers.signOut()
      setUser(null)
      setUserProfile(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('luxlibris_student_profile')
        localStorage.removeItem('luxlibris_account_created')
        localStorage.removeItem('luxlibris_onboarding_complete')
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
    
    // Helper functions
    signOut,
    refreshProfile,
    hasCompletedOnboarding,
    getDashboardUrl,
    belongsToSchool,
    getUserSchool,
    
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

// Higher-order component for protected routes
export const withAuth = (WrappedComponent, allowedAccountTypes = ['student', 'parent', 'admin']) => {
  const AuthenticatedComponent = (props) => {
    const { user, userProfile, loading, isAuthenticated, getDashboardUrl, hasCompletedOnboarding } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          // User not authenticated, redirect to role selector
          router.push('/role-selector')
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
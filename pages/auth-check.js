// pages/auth-check.js - UPDATED for new AuthContext

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCheck() {
  const router = useRouter()
  const { 
    isAuthenticated, 
    loading, 
    userProfile, 
    isSessionExpired, 
    signOut, 
    getDashboardUrl 
  } = useAuth()

  useEffect(() => {
    const handleAuthentication = async () => {
      if (loading) return // Wait for auth to load

      console.log('🔄 Checking authentication state...')
      
      if (!isAuthenticated) {
        // Not logged in - go to homepage
        console.log('❌ Not authenticated, redirecting to homepage')
        router.replace('/')
        return
      }

      if (!userProfile) {
        // Authenticated but no profile - wait a bit more
        console.log('⏳ Authenticated but no profile yet...')
        return
      }

      // Check for session expiry for admins only
      if (userProfile.accountType === 'admin' && isSessionExpired()) {
        console.log('⏰ Admin session expired, signing out and redirecting')
        await signOut({ redirectTo: '/sign-in?reason=session-expired' })
        return
      }

      // Use existing getDashboardUrl logic for routing
      const dashboardUrl = getDashboardUrl()
      console.log(`✅ Authenticated ${userProfile.accountType}, redirecting to: ${dashboardUrl}`)
      router.replace(dashboardUrl)
    }

    handleAuthentication()
  }, [loading, isAuthenticated, userProfile, router, isSessionExpired, signOut, getDashboardUrl])

  // Loading screen
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
          Loading Lux Libris...
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
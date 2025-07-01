'use client'

import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSignOutMessage, setShowSignOutMessage] = useState(false)
  const router = useRouter()
  const { isAuthenticated, loading, userProfile, signOut } = useAuth()

  // Handle authenticated users
  useEffect(() => {
    const handleAuthenticatedUser = async () => {
      if (!loading && isAuthenticated && userProfile) {
        console.log('🔄 User is already signed in, checking account type...')
        
        if (userProfile.accountType === 'admin') {
          // Sign out admin users and show message
          console.log('👑 Admin detected, signing out...')
          try {
            await signOut()
            setShowSignOutMessage(true)
            // Hide message after 10 seconds
            setTimeout(() => setShowSignOutMessage(false), 10000)
          } catch (error) {
            console.error('Error signing out admin:', error)
          }
        } else if (userProfile.accountType === 'student') {
          // Redirect students to splash page, then to their account
          console.log('🧑‍🎓 Student detected, redirecting to splash...')
          router.push('/splash?type=student')
        } else if (userProfile.accountType === 'parent') {
          // Redirect parents to their dashboard
          console.log('👨‍👩‍👧‍👦 Parent detected, redirecting to dashboard...')
          router.push('/parent-dashboard')
        }
      }
    }

    handleAuthenticatedUser()
  }, [loading, isAuthenticated, userProfile, router, signOut])

  // Show loading while checking authentication
  if (loading) {
    return (
      <>
        <Head>
          <title>Lux Libris - Illuminating the World Through Stories</title>
          <link rel="icon" href="/images/lux_libris_logo.png" />
        </Head>
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
              Checking your account...
            </p>
          </div>
        </div>
      </>
    )
  }

  // Only show homepage if user is not authenticated or after admin sign out

  return (
    <>
      <Head>
        <title>Lux Libris - Illuminating the World Through Stories</title>
        <meta name="description" content="The Lux Libris Award curates exceptional books spanning diverse voices, cultures, and experiences. Rooted in Catholic faith, we guide readers through truth, goodness, and beauty." />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        
        {/* Admin Sign Out Message */}
        {showSignOutMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
              ✅ You've been signed out of your admin account
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Please sign in below to access your school dashboard
            </p>
          </div>
        )}

        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={50}
                height={50}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em'}}>
                Lux Libris
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <a href="#features" className="text-slate-600 hover:text-teal-600 transition-colors">
                Features
              </a>
              <a href="#for-schools" className="text-slate-600 hover:text-teal-600 transition-colors">
                For Schools
              </a>
              <a href="#contact" className="text-slate-600 hover:text-teal-600 transition-colors">
                Contact
              </a>
              <Link href="/sign-in" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all">
                Sign In
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-3">
              <Link href="/sign-in" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all">
                Sign In
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-teal-600 transition-colors p-2"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-200">
              <div className="px-6 py-4 space-y-3">
                <a 
                  href="#features" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#for-schools" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </a>
                <a 
                  href="#contact" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </a>
              </div>
            </div>
          )}
        </header>

        {/* Rest of your homepage content stays the same */}
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">
            <div className="mb-8">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                  style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
                Illuminating the World Through
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                  {" "}Stories
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                The Lux Libris Award curates 20 exceptional books each year—spanning diverse voices,
                cultures, and experiences from around the globe. Rooted in Catholic faith, we guide
                readers to engage with the world through the lens of truth, goodness, and beauty.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/role-selector" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block">
                Start Your Journey
              </Link>
              <button className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all">
                Watch Demo
              </button>
            </div>

            {/* App Preview */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Student Dashboard Preview */}
                <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Student Dashboard</h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Reading Progress</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Saint Collection</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Achievements</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Dashboard Preview */}
                <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Admin Dashboard</h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Student Progress</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Book Management</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Analytics</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 text-lg">📚</span>
                    </div>
                    <span className="text-slate-700">Interactive Reading</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🏆</span>
                    </div>
                    <span className="text-slate-700">Little Luminaries™ Saints</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 text-lg">📊</span>
                    </div>
                    <span className="text-slate-700">Progress Tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-lg">🎯</span>
                    </div>
                    <span className="text-slate-700">Goal Setting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Forming the Whole Child
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Built by a Catholic school librarian who understands that stories illuminate minds,
                hearts, and souls—cultivating empathy, expanding knowledge, and inspiring action.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎮</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Gamified Experience</h3>
                <p className="text-slate-600">
                  Students collect saints, unlock achievements, and build reading streaks that keep them engaged
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Easy Management</h3>
                <p className="text-slate-600">
                  Students collect beautiful Little Luminaries™ saints, unlock achievements, and build reading streaks that keep them engaged
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✝️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Catholic Values</h3>
                <p className="text-slate-600">
                  Integrates faith formation with literacy through saint achievements and Catholic literature
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Image
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={40}
                height={40}
                className="rounded-full"
              />
              <h3 className="text-xl font-bold" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Lux Libris
              </h3>
            </div>
            <p className="text-slate-400 mb-6">
              Transforming reading education, one saint at a time.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="mailto:support@luxlibris.org" className="text-slate-400 hover:text-teal-400 transition-colors">
                support@luxlibris.org
              </a>
            </div>
          </div>
        </footer>

        {/* CSS for responsive behavior and loading animation */}
        <style jsx>{`
          @media (min-width: 768px) {
            .desktop-menu {
              display: flex !important;
            }
            .mobile-menu-toggle {
              display: none !important;
            }
          }
          
          @media (max-width: 767px) {
            .desktop-menu {
              display: none !important;
            }
            .mobile-menu-toggle {
              display: block !important;
            }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </>
  )
}
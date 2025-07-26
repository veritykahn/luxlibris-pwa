import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, userProfile, loading, isAuthenticated, getDashboardUrl, signingOut } = useAuth()

  useEffect(() => {
    console.log('🔍 HOMEPAGE DEBUG - Auth state:', {
      loading,
      isAuthenticated,
      signingOut,
      userProfile: userProfile ? {
        accountType: userProfile.accountType,
        firstName: userProfile.firstName,
        uid: userProfile.uid || 'no uid'
      } : 'null',
      shouldRedirect: !loading && isAuthenticated && userProfile && !signingOut
    });

    if (!loading && isAuthenticated && userProfile && !signingOut) {
      const dashboardUrl = getDashboardUrl();
      console.log('✅ User already authenticated, redirecting to:', dashboardUrl);
      router.push(dashboardUrl);
    } else if (signingOut) {
      console.log('🚪 Currently signing out, not redirecting');
    } else {
      console.log('❌ Not redirecting because conditions not met');
    }
  }, [loading, isAuthenticated, userProfile, router, getDashboardUrl, signingOut])

  if (loading || signingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">
            {signingOut ? 'Signing out...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && userProfile) {
    return null
  }
  
  return (
    <>
      <Head>
        <title>Lux Libris - Forming Saints, One Book at a Time</title>
        <meta name="description" content="Transform Catholic school reading with gamified learning. Students collect Luxlings™ saints while building lifelong reading habits." />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={50}
                height={50}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em'}}>
                Lux Libris
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/features" className="text-slate-600 hover:text-teal-600 transition-colors">
                Features
              </Link>
              <Link href="/for-schools" className="text-slate-600 hover:text-teal-600 transition-colors">
                For Schools
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-teal-600 transition-colors">
                Contact
              </Link>
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
                <Link 
                  href="/features" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="/for-schools"
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Main Content - Ultra Clean */}
        <section className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo and Brand */}
            <div className="mb-8">
              <img
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={80}
                height={80}
                className="rounded-full mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-slate-800 mb-2" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Lux Libris
              </h1>
            </div>

            {/* Main Tagline */}
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
              Forming
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                {" "}Saints
              </span>
              , One
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                {" "}Book
              </span>
              {" "}at a Time
            </h2>

            {/* Simple Description */}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              The complete Catholic reading ecosystem where students discover saints, families grow together, and schools build a culture of joyful literacy.

            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/role-selector" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block">
                Start Your Journey
              </Link>
              <Link href="/for-schools" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block">
                For Schools
              </Link>
            </div>

            {/* Attractive Feature Boxes */}
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Student Box */}
                <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl p-4 mb-4">
                    <div className="text-4xl text-center">🎒</div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-3 text-center">For Students</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Collect 234 Luxlings™ saints</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Earn badges & XP points</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Build 20+ min daily habits</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Vote for book champions</span>
                    </li>
                  </ul>
                </div>

                {/* Teacher Box */}
                <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl p-4 mb-4">
                    <div className="text-4xl text-center">👩‍🏫</div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-3 text-center">For Teachers</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>5-minute easy setup</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Track every student</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Custom reward milestones</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Printable certificates</span>
                    </li>
                  </ul>
                </div>

                {/* Parent Box */}
                <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-amber-100 to-teal-100 rounded-xl p-4 mb-4">
                    <div className="text-4xl text-center">👨‍👩‍👧</div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-3 text-center">For Families</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Free parent app</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Reading DNA analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Family reading battles</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 mt-0.5">✓</span>
                      <span>Support tools & guides</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom highlight */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500 mb-6">
                  📚 20 Curated Books • ⛪ Faith-Integrated • 🏆 Real Rewards • 📱 Complete Ecosystem
                </p>
                
                {/* Demo Pill */}
                <Link href="/demo" className="inline-flex items-center bg-white/90 backdrop-blur text-slate-700 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
                  <span className="mr-2">🎬</span>
                  <span className="font-medium">Watch 3-min Demo</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="bg-white/90 backdrop-blur-sm border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid md:grid-cols-4 gap-6 text-sm">
              {/* Programs */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Programs</h4>
                <ul className="space-y-2 text-slate-600">
                  <li><Link href="/programs#lux-libris-award" className="hover:text-teal-600">The Lux Libris Award</Link></li>
                  <li><Link href="/programs#classroom-reading" className="hover:text-teal-600">Classroom Reading</Link></li>
                </ul>
              </div>
              
              {/* About */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">About</h4>
                <ul className="space-y-2 text-slate-600">
                  <li><Link href="/features" className="hover:text-teal-600">Features</Link></li>
                  <li><Link href="/luxlings" className="hover:text-teal-600">Luxlings™ Saints</Link></li>
                  <li><Link href="/how-it-works" className="hover:text-teal-600">How It Works</Link></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Support</h4>
                <ul className="space-y-2 text-slate-600">
                  <li><Link href="/contact" className="hover:text-teal-600">Contact Us</Link></li>
                  <li><a href="mailto:support@luxlibris.org" className="hover:text-teal-600">Help Center</a></li>
                </ul>
              </div>
              
              {/* Connect */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Get Started</h4>
                <ul className="space-y-2 text-slate-600">
                  <li><Link href="/for-schools" className="hover:text-teal-600">For Schools</Link></li>
                  <li><a href="mailto:inquiries@luxlibris.org" className="hover:text-teal-600">School Inquiries</a></li>
                  <li><a href="mailto:partnerships@luxlibris.org" className="hover:text-teal-600">Partnerships</a></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
              <p>&copy; 2025 Lux Libris. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* CSS for loading animation */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </>
  )
}
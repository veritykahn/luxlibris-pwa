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
  // More defensive check - ensure we have a valid profile with accountType
  if (!loading && isAuthenticated && userProfile && !signingOut) {
    // Double-check that we have a valid account type before getting dashboard URL
    if (userProfile.accountType) {
      const dashboardUrl = getDashboardUrl();
      // Only redirect if we get a valid dashboard URL (not role-selector)
      if (dashboardUrl && dashboardUrl !== '/role-selector') {
        router.push(dashboardUrl);
      }
    }
  }
}, [loading, isAuthenticated, userProfile, router, getDashboardUrl, signingOut])

  if (loading || signingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" 
               style={{borderColor: '#E0E7ED', borderTopColor: '#223848'}}></div>
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
              <h1 className="text-2xl font-bold" style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em', color: '#223848'}}>
                Lux Libris
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/features" className="hover:text-[#A1E5DB] transition-colors" style={{color: '#223848'}}>
                Features
              </Link>
              <Link href="/for-schools" className="hover:text-[#A1E5DB] transition-colors" style={{color: '#223848'}}>
                For Schools
              </Link>
              <Link href="/contact" className="hover:text-[#A1E5DB] transition-colors" style={{color: '#223848'}}>
                Contact
              </Link>
              <Link href="/sign-in" className="text-white px-6 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105" style={{backgroundColor: '#A1E5DB'}}>
                Sign In
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-3">
              <Link href="/sign-in" className="text-white px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{backgroundColor: '#A1E5DB'}}>
                Sign In
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:text-[#A1E5DB] transition-colors p-2"
                style={{color: '#223848'}}
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
                  className="block transition-colors py-2"
                  style={{color: '#223848'}}
                  onMouseEnter={(e) => e.target.style.color = '#2A4558'}
                  onMouseLeave={(e) => e.target.style.color = '#223848'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="/for-schools"
                  className="block transition-colors py-2"
                  style={{color: '#223848'}}
                  onMouseEnter={(e) => e.target.style.color = '#2A4558'}
                  onMouseLeave={(e) => e.target.style.color = '#223848'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </Link>
                <Link 
                  href="/contact" 
                  className="block transition-colors py-2"
                  style={{color: '#223848'}}
                  onMouseEnter={(e) => e.target.style.color = '#2A4558'}
                  onMouseLeave={(e) => e.target.style.color = '#223848'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Main Content - Ultra Clean */}
        <section className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-4">
              <img
                src="/images/lux_libris_name.png"
                alt="Lux Libris"
                width={380}
                height={380}
                className="mx-auto mb-2"
              />
            </div>

            {/* Main Tagline */}
            <h2 className="text-5xl md:text-6xl font-bold mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
              Forming
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFAB91] via-[#ADD4EA] to-[#A1E5DB]">
                {" "}Saints
              </span>
              , One
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC4A3] via-[#C3E0DE] to-[#A1E5DB]">
                {" "}Book
              </span>
              {" "}at a Time
            </h2>

            {/* Simple Description */}
            <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{color: '#223848'}}>
              The complete Catholic reading ecosystem where students discover saints, families grow together, and schools build a culture of joyful literacy.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/role-selector" 
                className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
                style={{backgroundColor: '#A1E5DB'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#8DD4CE'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
              >
                Start Your Journey
              </Link>
              <Link 
                href="/for-schools" 
                className="border-2 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
                style={{
                  borderColor: '#A1E5DB',
                  color: '#A1E5DB',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#A1E5DB'
                  e.target.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = '#A1E5DB'
                }}
              >
                For Schools
              </Link>
            </div>

            {/* Bottom highlight */}
            <div className="mt-8 text-center">
              <p className="text-sm mb-6" style={{color: '#223848'}}>
                📚 20 Curated Books • ⛪ Faith-Integrated • 🏆 Real Rewards • 📱 Complete Ecosystem
              </p>
              
              {/* Demo Pill */}
              <Link href="/demo" className="inline-flex items-center bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all" style={{color: '#223848'}}>
                <span className="mr-2">🎬</span>
                <span className="font-medium">Watch 3-min Demo</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer style={{backgroundColor: '#223848'}}>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid md:grid-cols-4 gap-6 text-sm">
              {/* Programs */}
              <div>
                <h4 className="font-semibold mb-3 text-white">Programs</h4>
                <ul className="space-y-2">
                  <li><Link href="/lux-libris-award" className="text-white/80 hover:text-white transition-colors">The Lux Libris Award</Link></li>
                  <li><Link href="/classroom-reading" className="text-white/80 hover:text-white transition-colors">Classroom Reading</Link></li>
                </ul>
              </div>
              
              {/* About */}
              <div>
                <h4 className="font-semibold mb-3 text-white">About</h4>
                <ul className="space-y-2">
                  <li><Link href="/features" className="text-white/80 hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="/luxlings" className="text-white/80 hover:text-white transition-colors">Luxlings™ Saints</Link></li>
                  <li><Link href="/demo" className="text-white/80 hover:text-white transition-colors">How It Works</Link></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="font-semibold mb-3 text-white">Support</h4>
                <ul className="space-y-2">
                  <li><Link href="/contact" className="text-white/80 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/help-center" className="text-white/80 hover:text-white transition-colors">Help Center</Link></li>
                </ul>
              </div>
              
              {/* Connect */}
              <div>
                <h4 className="font-semibold mb-3 text-white">Get Started</h4>
                <ul className="space-y-2">
                  <li><Link href="/for-schools" className="text-white/80 hover:text-white transition-colors">For Schools</Link></li>
                  <li><Link href="/licensing-inquiries" className="text-white/80 hover:text-white transition-colors">Licensing Inquiries</Link></li>
                  <li><Link href="/partnerships" className="text-white/80 hover:text-white transition-colors">Partnerships</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm text-white/60">
              <p>&copy; 2025 Lux Libris. All rights reserved. Made with ❤️ for Catholic schools.</p>
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
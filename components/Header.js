// components/Header.js
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  
  // Check if the current path matches the link
  const isActive = (path) => {
    return router.pathname === path || router.pathname === `/home${path}`
  }

  return (
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
          <Link 
            href="/features" 
            className={`transition-colors ${isActive('/features') ? 'font-semibold' : 'hover:text-[#A1E5DB]'}`} 
            style={{color: isActive('/features') ? '#A1E5DB' : '#223848'}}
          >
            Features
          </Link>
          <Link 
            href="/for-schools" 
            className={`transition-colors ${isActive('/for-schools') ? 'font-semibold' : 'hover:text-[#A1E5DB]'}`} 
            style={{color: isActive('/for-schools') ? '#A1E5DB' : '#223848'}}
          >
            For Schools
          </Link>
          <Link 
            href="/contact" 
            className={`transition-colors ${isActive('/contact') ? 'font-semibold' : 'hover:text-[#A1E5DB]'}`} 
            style={{color: isActive('/contact') ? '#A1E5DB' : '#223848'}}
          >
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
              className={`block transition-colors py-2 ${isActive('/features') ? 'font-semibold' : 'hover:text-[#A1E5DB]'}`}
              style={{color: isActive('/features') ? '#A1E5DB' : '#223848'}}
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/for-schools"
              className={`block transition-colors py-2 ${isActive('/for-schools') ? 'font-semibold' : 'hover:text-[#A1E5DB]'}`}
              style={{color: isActive('/for-schools') ? '#A1E5DB' : '#223848'}}
              onClick={() => setMobileMenuOpen(false)}
            >
              For Schools
            </Link>
            <Link 
              href="/contact" 
              className={`block transition-colors py-2 ${isActive('/contact') ? 'font-semibold' : 'hover:text-[#A1E5DB]'}`}
              style={{color: isActive('/contact') ? '#A1E5DB' : '#223848'}}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
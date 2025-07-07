// pages/for-schools.js - FOR SCHOOLS LANDING PAGE
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function ForSchools() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <Head>
        <title>For Schools - Lux Libris Reading Platform</title>
        <meta name="description" content="Transform your school's reading program with Lux Libris. Gamified Catholic literature platform for students, teachers, and administrators." />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
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
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/#features" className="text-slate-600 hover:text-teal-600 transition-colors">
                Features
              </Link>
              <Link href="/for-schools" className="text-teal-600 font-semibold">
                For Schools
              </Link>
              <Link href="/#contact" className="text-slate-600 hover:text-teal-600 transition-colors">
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
                  href="/#features" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/for-schools" 
                  className="block text-teal-600 font-semibold py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </Link>
                <Link 
                  href="/#contact" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">
            <div className="mb-8">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                  style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
                Transform Your School&apos;s
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                  {" "}Reading Program
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Engage students with gamified Catholic literature through our comprehensive platform 
                designed for schools, dioceses, and independent school districts.
              </p>
            </div>

            {/* Quick Access Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <AccessCard
                title="New School?"
                description="Register your school and join a diocese reading program"
                icon="🏫"
                ctaText="Register School"
                ctaLink="/school/signup"
                bgColor="from-teal-100 to-blue-100"
                textColor="text-teal-700"
                buttonColor="bg-teal-600 hover:bg-teal-700"
              />
              
              <AccessCard
                title="School Admin?"
                description="Access your school dashboard to manage teachers and students"
                icon="👥"
                ctaText="School Dashboard"
                ctaLink="/school/dashboard"
                bgColor="from-blue-100 to-slate-100"
                textColor="text-blue-700"
                buttonColor="bg-blue-600 hover:bg-blue-700"
              />
              
              <AccessCard
                title="Diocese Admin?"
                description="Manage schools and programs across your diocese"
                icon="⛪"
                ctaText="Diocese Dashboard"
                ctaLink="/diocese/dashboard"
                bgColor="from-slate-100 to-teal-100"
                textColor="text-slate-700"
                buttonColor="bg-slate-600 hover:bg-slate-700"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                How Lux Libris Works for Schools
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                A simple three-step process to transform your school&apos;s reading culture
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <ProcessStep
                number="1"
                title="Setup & Registration"
                description="Diocese registers schools or individual schools sign up independently. Each school receives unique access codes for administrators and teachers."
                icon="🚀"
                color="teal"
              />
              
              <ProcessStep
                number="2"
                title="Teacher Onboarding"
                description="Teachers use their join codes to create accounts and set up their classrooms. They receive student codes to share with families."
                icon="👨‍🏫"
                color="blue"
              />
              
              <ProcessStep
                number="3"
                title="Student Engagement"
                description="Students read, complete quizzes, collect saint achievements, and track their progress through gamified learning experiences."
                icon="📚"
                color="slate"
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Why Schools Choose Lux Libris
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <BenefitCard
                icon="🎮"
                title="Gamified Learning"
                description="Students collect saints, unlock achievements, and build reading streaks"
              />
              
              <BenefitCard
                icon="📊"
                title="Easy Management"
                description="Comprehensive dashboards for administrators, teachers, and diocese staff"
              />
              
              <BenefitCard
                icon="✝️"
                title="Catholic Values"
                description="Integrates faith formation with literacy through saint achievements"
              />
              
              <BenefitCard
                icon="📖"
                title="Curated Literature"
                description="20 exceptional books annually spanning diverse voices and cultures"
              />
            </div>
          </div>
        </section>

        {/* Organizational Structure Section */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Flexible for Any Organization
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Whether you&apos;re part of a large diocese, an independent school district, 
                or a single institution, Lux Libris adapts to your structure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <OrganizationCard
                title="Multi-School Organizations"
                subtitle="Dioceses & School Districts"
                features={[
                  "Centralized program management",
                  "Individual school dashboards",
                  "Diocese-wide reporting",
                  "Bulk student management",
                  "Tiered pricing options"
                ]}
                icon="🏛️"
                bgColor="from-teal-100 to-blue-100"
              />
              
              <OrganizationCard
                title="Independent Institutions"
                subtitle="Single Schools & Libraries"
                features={[
                  "Direct registration process",
                  "Self-managed programs",
                  "Teacher and student codes",
                  "Individual reporting",
                  "Simplified setup"
                ]}
                icon="🏫"
                bgColor="from-blue-100 to-slate-100"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-teal-600 to-blue-600 py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Ready to Transform Your Reading Program?
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of schools already using Lux Libris to engage students 
              with meaningful literature and Catholic values.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/school/signup" 
                className="bg-white text-teal-600 px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              >
                Register New School
              </Link>
              
              <Link 
                href="/school/dashboard" 
                className="border-2 border-white text-white hover:bg-white hover:text-teal-600 px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              >
                Access School Dashboard
              </Link>
            </div>
            
            <div className="mt-8">
              <p className="text-teal-100 text-sm mb-2">Diocese administrators:</p>
              <Link 
                href="/diocese/dashboard" 
                className="text-white hover:text-teal-100 underline text-lg font-medium"
              >
                Access Diocese Dashboard →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
              <img
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={40}
                height={40}
                className="rounded-full"
              />
              <h3 className="text-xl font-bold" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Lux Libris
              </h3>
            </Link>
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

        {/* CSS for responsive behavior */}
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
        `}</style>
      </main>
    </>
  )
}

// Supporting Components
function AccessCard({ title, description, icon, ctaText, ctaLink, bgColor, textColor, buttonColor }) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-2xl p-6 text-center h-full flex flex-col`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className={`text-xl font-bold ${textColor} mb-3`} style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h3>
      <p className="text-slate-600 mb-6 flex-grow leading-relaxed">
        {description}
      </p>
      <Link 
        href={ctaLink}
        className={`${buttonColor} text-white px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg inline-block`}
      >
        {ctaText}
      </Link>
    </div>
  )
}

function ProcessStep({ number, title, description, icon, color }) {
  const colorClasses = {
    teal: 'bg-teal-100 text-teal-600 border-teal-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className="text-center">
      <div className={`w-16 h-16 ${colorClasses[color]} rounded-full flex items-center justify-center mx-auto mb-4 border-2 font-bold text-xl`}>
        {number}
      </div>
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-3" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function BenefitCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 mb-3" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function OrganizationCard({ title, subtitle, features, icon, bgColor }) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-2xl p-8`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h3>
      <p className="text-slate-600 font-medium mb-6">{subtitle}</p>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-slate-700">
            <span className="text-teal-500 mr-3">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
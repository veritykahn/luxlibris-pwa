// pages/for-schools.js - UPDATED FOR SCHOOLS LANDING PAGE
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function ForSchools() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <Head>
        <title>For Schools - Lux Libris Catholic Reading Platform</title>
        <meta name="description" content="Transform your Catholic school's reading culture. Two powerful programs, comprehensive dashboards, and Luxlings™ saints collection. Perfect for dioceses, schools, and libraries." />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        
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
              <Link href="/for-schools" className="text-teal-600 font-semibold">
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
                  className="block text-teal-600 font-semibold py-2"
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

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">
            <div className="mb-8">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                  style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
                Built for Catholic Schools,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                  {" "}By Catholic Educators
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Join the reading revolution that&apos;s transforming Catholic education. 
                Two powerful programs, one unified platform that connects students, 
                teachers, parents, and administrators.
              </p>
            </div>

            {/* Quick Access Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <AccessCard
                title="Diocese Admin"
                description="Manage multiple schools, track district-wide progress"
                icon="⛪"
                ctaText="Diocese Dashboard"
                ctaLink="/diocese/dashboard"
                bgColor="from-purple-100 to-slate-100"
                textColor="text-purple-700"
                buttonColor="bg-purple-600 hover:bg-purple-700"
              />
              
              <AccessCard
                title="School Admin"
                description="Oversee teachers, students, and reading programs"
                icon="🏫"
                ctaText="School Dashboard"
                ctaLink="/school/dashboard"
                bgColor="from-teal-100 to-blue-100"
                textColor="text-teal-700"
                buttonColor="bg-teal-600 hover:bg-teal-700"
              />
              
              <AccessCard
                title="New School?"
                description="Register your school and transform reading culture"
                icon="🚀"
                ctaText="Get Started"
                ctaLink="/school/signup"
                bgColor="from-blue-100 to-teal-100"
                textColor="text-blue-700"
                buttonColor="bg-blue-600 hover:bg-blue-700"
              />
            </div>
          </div>
        </section>

        {/* Two Programs Section */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Choose Your Perfect Program
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Flexible options designed for different needs and grade levels
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Lux Libris Award Program */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8 border-2 border-teal-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Lux Libris Award Program
                  </h3>
                  <span className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Grades 4-8
                  </span>
                </div>
                
                <p className="text-slate-600 mb-6 font-medium">
                  Perfect for Libraries & Reading Specialists
                </p>
                
                <div className="space-y-4 mb-6">
                  <Feature icon="📚" text="20 exceptional books curated annually" />
                  <Feature icon="🗓️" text="June through March reading calendar" />
                  <Feature icon="🏆" text="Customizable milestone rewards (5, 10, 15, 20 books)" />
                  <Feature icon="📝" text="Multiple submission options: quizzes, discussions, projects" />
                  <Feature icon="🗳️" text="Student voting for Luminous Champion (April 1-14)" />
                  <Feature icon="⛪" text="Luxlings™ saints collection system" />
                  <Feature icon="🎯" text="5-year journey with ultimate 100-book goal" />
                  <Feature icon="📊" text="Comprehensive tracking & reporting" />
                </div>
                
                <div className="bg-white/70 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-600 mb-2">Annual Timeline:</p>
                  <p className="font-semibold text-slate-800">June 1: Launch → March 31: Complete → April 15: Winner → May: Preview Next Year</p>
                </div>
              </div>
              
              {/* Classroom Reading Program */}
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl p-8 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Classroom Reading Program
                  </h3>
                  <span className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    All Grades
                  </span>
                </div>
                
                <p className="text-slate-600 mb-6 font-medium">
                  Perfect for Classroom Teachers
                </p>
                
                <div className="space-y-4 mb-6">
                  <Feature icon="📖" text="Daily reading habit tracker" />
                  <Feature icon="⏱️" text="20+ minute daily reading goals" />
                  <Feature icon="👪" text="Built-in parent sign-off system" />
                  <Feature icon="📚" text="Works with ANY books or curriculum" />
                  <Feature icon="🎮" text="Gamified motivation system" />
                  <Feature icon="📈" text="Real-time progress monitoring" />
                  <Feature icon="🏅" text="Weekly challenges & achievements" />
                  <Feature icon="📱" text="Parent app integration" />
                </div>
                
                <div className="bg-blue-100/50 rounded-xl p-4 text-center">
                  <span className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    <span className="mr-2">🚀</span>
                    Pilot Launch: Spring 2025
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Organizational Structure */}
        <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Flexible for Any Structure
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Whether you&apos;re a diocese managing 50 schools or a single institution, 
                Lux Libris scales to meet your needs with powerful administrative tools.
              </p>
            </div>

            {/* Hierarchy Visual */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
              <h3 className="text-2xl font-bold text-center text-slate-800 mb-8" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Your Complete Ecosystem
              </h3>
              
              <div className="grid md:grid-cols-4 gap-6">
                <HierarchyCard
                  level="Diocese"
                  icon="⛪"
                  features={[
                    "Multi-school oversight",
                    "District-wide analytics",
                    "Bulk enrollment",
                    "Custom pricing tiers"
                  ]}
                  color="purple"
                />
                
                <HierarchyCard
                  level="School"
                  icon="🏫"
                  features={[
                    "Teacher management",
                    "Program selection",
                    "Reward customization",
                    "School-wide reports"
                  ]}
                  color="teal"
                />
                
                <HierarchyCard
                  level="Teacher"
                  icon="👩‍🏫"
                  features={[
                    "Class rosters",
                    "Book approvals",
                    "Progress tracking",
                    "Parent communication"
                  ]}
                  color="blue"
                />
                
                <HierarchyCard
                  level="Family"
                  icon="👨‍👩‍👧‍👦"
                  features={[
                    "Student progress",
                    "Reading support",
                    "Family challenges",
                    "Achievement alerts"
                  ]}
                  color="amber"
                />
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-slate-600">
                  <span className="font-semibold">One Platform.</span> Every stakeholder connected. 
                  Real-time insights at every level.
                </p>
              </div>
            </div>

            {/* Setup Options */}
            <div className="grid md:grid-cols-2 gap-8">
              <OrganizationCard
                title="Diocese & Districts"
                subtitle="Centralized Management"
                features={[
                  "Add unlimited schools with unique codes",
                  "Diocese-wide reading analytics",
                  "Standardized or custom programs per school",
                  "Bulk pricing & volume discounts",
                  "Regional leaderboards & competitions",
                  "Professional development resources"
                ]}
                icon="🏛️"
                bgColor="from-purple-100 to-slate-100"
              />
              
              <OrganizationCard
                title="Individual Schools"
                subtitle="Direct Registration"
                features={[
                  "Quick 5-minute setup process",
                  "Immediate teacher access codes",
                  "Choose one or both programs",
                  "Custom milestone configuration",
                  "School-branded certificates",
                  "Dedicated support channel"
                ]}
                icon="🎯"
                bgColor="from-teal-100 to-blue-100"
              />
            </div>
          </div>
        </section>

        {/* Admin Features Deep Dive */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Powerful Tools for Administrators
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Everything you need to run a successful reading program, simplified
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <AdminFeature
                icon="📊"
                title="Real-Time Analytics"
                description="Track participation, completion rates, and reading trends across your entire organization with beautiful, actionable dashboards."
              />
              
              <AdminFeature
                icon="🎯"
                title="Custom Milestones"
                description="Set your own reward intervals and physical prizes. Mass at 5 books? Certificate at 10? Pizza party at 20? You decide."
              />
              
              <AdminFeature
                icon="👥"
                title="Easy Management"
                description="Add students manually or digitally. Generate access codes for teachers. Approve submissions. All in one place."
              />
              
              <AdminFeature
                icon="📈"
                title="Progress Reports"
                description="Printable achievement reports for assemblies, parent nights, and diocesan meetings. Show your reading success!"
              />
              
              <AdminFeature
                icon="📚"
                title="Historical Tracking"
                description="Credit past reading achievements. Track multi-year progress. Celebrate the full journey."
              />
              
              <AdminFeature
                icon="🏆"
                title="Recognition Tools"
                description="Automated certificate generation, achievement alerts, and tools to celebrate every milestone."
              />
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="bg-gradient-to-br from-amber-50 to-teal-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Built for Success
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Designed by a Catholic school librarian who understands your unique needs
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 text-center">
              <MetricCard
                number="234"
                label="Collectible Luxlings™ Saints"
                icon="⛪"
              />
              
              <MetricCard
                number="20"
                label="Curated Books Annually"
                icon="📚"
              />
              
              <MetricCard
                number="5"
                label="Year Complete Program"
                icon="🎯"
              />
              
              <MetricCard
                number="8"
                label="Customizable Themes"
                icon="🎨"
              />
            </div>

            <div className="mt-12 bg-white rounded-3xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-center text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
                What Makes Us Different
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <DifferencePoint
                  title="Faith-Integrated Gamification"
                  description="Saints aren't just collectibles—each comes with feast days, facts, and faith formation."
                />
                
                <DifferencePoint
                  title="Parent Partnership Built-In"
                  description="Free parent app with reading DNA analysis, family battles, and support tools."
                />
                
                <DifferencePoint
                  title="No Distractions"
                  description="Healthy Habits timer bricks the device—no switching apps during reading time!"
                />
                
                <DifferencePoint
                  title="Teacher Autonomy"
                  description="Choose your books, set your rewards, approve submissions your way."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-teal-600 to-blue-600 py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Join the Pilot Program Today
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Get premium features FREE for the first year. Transform how your 
              students experience books, faith, and learning.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <CTABox
                title="Diocese Leaders"
                action="Register Your Diocese"
                link="/diocese/signup"
              />
              
              <CTABox
                title="School Admins"
                action="Register Your School"
                link="/school/signup"
              />
              
              <CTABox
                title="Teachers"
                action="Join with Code"
                link="/teacher/join"
              />
            </div>
            
            <p className="text-teal-100 text-sm">
              Questions? Email us at{" "}
              <a href="mailto:inquiries@luxlibris.org" className="text-white underline">
                inquiries@luxlibris.org
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <Link href="/" className="flex items-center space-x-3 mb-4">
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
                <p className="text-slate-400 text-sm">
                  Forming saints, one book at a time.
                </p>
              </div>
              
              {/* Programs */}
              <div>
                <h4 className="font-semibold mb-4">Programs</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/programs#lux-libris-award" className="hover:text-teal-400">The Lux Libris Award</Link></li>
                  <li><Link href="/programs#classroom-reading" className="hover:text-teal-400">Classroom Reading</Link></li>
                </ul>
              </div>
              
              {/* About */}
              <div>
                <h4 className="font-semibold mb-4">About</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/features" className="hover:text-teal-400">Features</Link></li>
                  <li><Link href="/luxlings" className="hover:text-teal-400">Luxlings™ Saints</Link></li>
                  <li><Link href="/how-it-works" className="hover:text-teal-400">How It Works</Link></li>
                </ul>
              </div>
              
              {/* Support & Get Started */}
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-slate-400 mb-4">
                  <li><Link href="/contact" className="hover:text-teal-400">Contact Us</Link></li>
                  <li><a href="mailto:support@luxlibris.org" className="hover:text-teal-400">Help Center</a></li>
                </ul>
                <h4 className="font-semibold mb-2">Get Started</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/for-schools" className="hover:text-teal-400">For Schools</Link></li>
                  <li><a href="mailto:inquiries@luxlibris.org" className="hover:text-teal-400">School Inquiries</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
              <p>&copy; 2025 Lux Libris. All rights reserved. Made with ❤️ for Catholic schools.</p>
            </div>
          </div>
        </footer>
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

function Feature({ icon, text }) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <p className="text-slate-700">{text}</p>
    </div>
  )
}

function HierarchyCard({ level, icon, features, color }) {
  const colorClasses = {
    purple: 'from-purple-100 to-purple-200 border-purple-300',
    teal: 'from-teal-100 to-teal-200 border-teal-300',
    blue: 'from-blue-100 to-blue-200 border-blue-300',
    amber: 'from-amber-100 to-amber-200 border-amber-300'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border-2`}>
      <div className="text-3xl mb-3 text-center">{icon}</div>
      <h4 className="font-bold text-slate-800 text-center mb-4">{level}</h4>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm text-slate-700">
            • {feature}
          </li>
        ))}
      </ul>
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
          <li key={index} className="flex items-start text-slate-700">
            <span className="text-teal-500 mr-3 mt-0.5">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdminFeature({ icon, title, description }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
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

function MetricCard({ number, label, icon }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-4xl font-bold text-teal-600 mb-2" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {number}
      </div>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  )
}

function DifferencePoint({ title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-2xl text-teal-500 mt-1">✨</span>
      <div>
        <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function CTABox({ title, action, link }) {
  return (
    <Link 
      href={link}
      className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4 hover:bg-white/30 transition-all"
    >
      <p className="text-teal-100 text-sm mb-2">{title}</p>
      <p className="text-white font-semibold">{action} →</p>
    </Link>
  )
}
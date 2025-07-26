// pages/demo.js - DEMO PAGE WITH VIDEO WALKTHROUGHS
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Demo() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState('overview')

  return (
    <>
      <Head>
        <title>Demo - See Lux Libris in Action</title>
        <meta name="description" content="Watch video demos of Lux Libris: student app walkthrough, teacher dashboard tour, parent features, and administrative tools." />
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
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
              See Lux Libris
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                {" "}in Action
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Explore our platform through guided video tours. See how students collect saints, 
              teachers track progress, and families engage with reading together.
            </p>

            {/* Video Selector */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <VideoTab
                active={activeVideo === 'overview'}
                onClick={() => setActiveVideo('overview')}
                icon="🎬"
                label="Platform Overview"
                duration="3:47"
              />
              <VideoTab
                active={activeVideo === 'student'}
                onClick={() => setActiveVideo('student')}
                icon="🎒"
                label="Student Experience"
                duration="5:23"
              />
              <VideoTab
                active={activeVideo === 'teacher'}
                onClick={() => setActiveVideo('teacher')}
                icon="👩‍🏫"
                label="Teacher Dashboard"
                duration="4:15"
              />
              <VideoTab
                active={activeVideo === 'parent'}
                onClick={() => setActiveVideo('parent')}
                icon="👨‍👩‍👧"
                label="Parent Features"
                duration="3:52"
              />
            </div>
          </div>
        </section>

        {/* Video Content Section */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            {/* Platform Overview Video */}
            {activeVideo === 'overview' && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8 shadow-xl">
                  <div className="aspect-w-16 aspect-h-9 mb-8">
                    <div className="bg-slate-200 rounded-2xl flex items-center justify-center" style={{height: '500px'}}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <p className="text-slate-600 mb-4">Platform Overview Video</p>
                        <p className="text-sm text-slate-500">
                          YouTube embed: https://youtube.com/watch?v=luxlibris-overview
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                        Welcome to Lux Libris
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Get a complete overview of how Lux Libris transforms Catholic school 
                        reading programs through gamification, saint collections, and family engagement.
                      </p>
                      <ul className="space-y-2">
                        <VideoHighlight text="Two powerful program options" />
                        <VideoHighlight text="Complete ecosystem for all users" />
                        <VideoHighlight text="Faith-integrated gamification" />
                        <VideoHighlight text="Real success stories" />
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <h4 className="font-bold text-slate-800 mb-4">In This Video:</h4>
                      <ul className="space-y-3">
                        <TimeStamp time="0:00" label="Introduction" />
                        <TimeStamp time="0:45" label="Program Options" />
                        <TimeStamp time="1:30" label="Student Features" />
                        <TimeStamp time="2:15" label="Teacher Tools" />
                        <TimeStamp time="2:50" label="Parent Engagement" />
                        <TimeStamp time="3:20" label="Getting Started" />
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student Experience Video */}
            {activeVideo === 'student' && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-8 shadow-xl">
                  <div className="aspect-w-16 aspect-h-9 mb-8">
                    <div className="bg-slate-200 rounded-2xl flex items-center justify-center" style={{height: '500px'}}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎒</div>
                        <p className="text-slate-600 mb-4">Student App Walkthrough</p>
                        <p className="text-sm text-slate-500">
                          YouTube embed: https://youtube.com/watch?v=luxlibris-student
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                        The Student Journey
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Follow Sarah, a 5th grader, as she explores the Lux Libris student app, 
                        collects Luxlings™ saints, and builds her reading habits.
                      </p>
                      <ul className="space-y-2">
                        <VideoHighlight text="Dashboard and book selection" />
                        <VideoHighlight text="Healthy Habits Timer in action" />
                        <VideoHighlight text="Earning saints and badges" />
                        <VideoHighlight text="Taking quizzes and submissions" />
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <h4 className="font-bold text-slate-800 mb-4">Featured Elements:</h4>
                      <ul className="space-y-3">
                        <TimeStamp time="0:00" label="Student Dashboard" />
                        <TimeStamp time="0:50" label="Book Selection Process" />
                        <TimeStamp time="1:45" label="Reading Timer Demo" />
                        <TimeStamp time="2:40" label="Luxlings™ Collection" />
                        <TimeStamp time="3:35" label="Quiz System" />
                        <TimeStamp time="4:30" label="Achievements & Rewards" />
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Dashboard Video */}
            {activeVideo === 'teacher' && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-teal-50 to-slate-50 rounded-3xl p-8 shadow-xl">
                  <div className="aspect-w-16 aspect-h-9 mb-8">
                    <div className="bg-slate-200 rounded-2xl flex items-center justify-center" style={{height: '500px'}}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">👩‍🏫</div>
                        <p className="text-slate-600 mb-4">Teacher Dashboard Tour</p>
                        <p className="text-sm text-slate-500">
                          YouTube embed: https://youtube.com/watch?v=luxlibris-teacher
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                        Powerful Teaching Tools
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Join Mrs. Martinez as she manages her 4th-grade class, tracks progress, 
                        and celebrates student achievements through the teacher dashboard.
                      </p>
                      <ul className="space-y-2">
                        <VideoHighlight text="Quick 5-minute setup" />
                        <VideoHighlight text="Managing student rosters" />
                        <VideoHighlight text="Approving submissions" />
                        <VideoHighlight text="Generating reports" />
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <h4 className="font-bold text-slate-800 mb-4">Key Features:</h4>
                      <ul className="space-y-3">
                        <TimeStamp time="0:00" label="Dashboard Overview" />
                        <TimeStamp time="0:40" label="Adding Students" />
                        <TimeStamp time="1:25" label="Program Setup" />
                        <TimeStamp time="2:10" label="Progress Tracking" />
                        <TimeStamp time="2:55" label="Reward Management" />
                        <TimeStamp time="3:40" label="Reports & Analytics" />
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parent Features Video */}
            {activeVideo === 'parent' && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-3xl p-8 shadow-xl">
                  <div className="aspect-w-16 aspect-h-9 mb-8">
                    <div className="bg-slate-200 rounded-2xl flex items-center justify-center" style={{height: '500px'}}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">👨‍👩‍👧</div>
                        <p className="text-slate-600 mb-4">Parent App Features</p>
                        <p className="text-sm text-slate-500">
                          YouTube embed: https://youtube.com/watch?v=luxlibris-parent
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                        Family Reading Partnership
                      </h3>
                      <p className="text-slate-600 mb-4">
                        See how the Rodriguez family uses the parent app to support their 
                        children's reading journey and build family reading culture.
                      </p>
                      <ul className="space-y-2">
                        <VideoHighlight text="Multi-child tracking" />
                        <VideoHighlight text="Book guidance & discussions" />
                        <VideoHighlight text="Family reading battles" />
                        <VideoHighlight text="Reading DNA analysis" />
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <h4 className="font-bold text-slate-800 mb-4">App Walkthrough:</h4>
                      <ul className="space-y-3">
                        <TimeStamp time="0:00" label="Parent Dashboard" />
                        <TimeStamp time="0:35" label="Child Progress View" />
                        <TimeStamp time="1:20" label="Book Information" />
                        <TimeStamp time="2:00" label="Premium Features" />
                        <TimeStamp time="2:45" label="Reading DNA Lab" />
                        <TimeStamp time="3:25" label="Family Challenges" />
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Additional Resources */}
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-3xl font-bold text-center text-slate-800 mb-12" style={{fontFamily: 'Didot, Georgia, serif'}}>
              More Ways to Explore
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <ResourceCard
                icon="📱"
                title="Interactive Demo"
                description="Try a limited version of the student app right in your browser"
                buttonText="Coming Soon"
                buttonDisabled
              />
              
              <ResourceCard
                icon="📄"
                title="Download Guide"
                description="Get our comprehensive PDF guide with screenshots and tutorials"
                buttonText="Download PDF"
                link="/resources/lux-libris-guide.pdf"
              />
              
              <ResourceCard
                icon="🗓️"
                title="Schedule Demo"
                description="Book a personalized walkthrough with our team"
                buttonText="Book Demo"
                link="/contact#demo"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h3 className="text-3xl font-bold text-center text-slate-800 mb-12" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Frequently Asked Questions
            </h3>
            
            <div className="space-y-6">
              <FAQItem
                question="How long does it take to set up Lux Libris for our school?"
                answer="Initial setup takes just 5 minutes! School administrators receive a unique code, teachers join with their codes, and students can start reading immediately. Our support team is available to help with onboarding."
              />
              
              <FAQItem
                question="Do students need devices to participate?"
                answer="No! While the app enhances the experience, teachers can manually track students who prefer traditional reading. The program is designed to be inclusive for all families."
              />
              
              <FAQItem
                question="What makes Luxlings™ saints special?"
                answer="Luxlings™ are exclusive collectible vinyl chibi-style saint figures (digital in the app). Each of the 234 saints includes feast days, biographies, and virtue lessons. Students earn them through reading achievements, creating tangible faith connections."
              />
              
              <FAQItem
                question="Can we customize the book list for our school?"
                answer="Absolutely! While we curate 20 exceptional books annually, schools can select all or choose specific titles that align with their curriculum. You can also set custom reward milestones."
              />
              
              <FAQItem
                question="Is parent participation required?"
                answer="Parent engagement enhances the experience but isn't mandatory. The free parent app helps families support their readers, but students can fully participate through school alone."
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
              Join the pilot program today and get all premium features free for the first year.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact" 
                className="bg-white text-teal-600 px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              >
                Get Started
              </Link>
              
              <Link 
                href="/pricing" 
                className="border-2 border-white text-white hover:bg-white hover:text-teal-600 px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              >
                View Pricing
              </Link>
            </div>
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

        {/* Styles */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          .aspect-w-16 {
            position: relative;
            padding-bottom: calc(9 / 16 * 100%);
          }
          
          .aspect-h-9 {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }
        `}</style>
      </main>
    </>
  )
}

// Supporting Components
function VideoTab({ active, onClick, icon, label, duration }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-full font-semibold transition-all transform flex items-center gap-2
        ${active 
          ? 'bg-teal-600 text-white shadow-lg scale-105' 
          : 'bg-white text-slate-600 hover:bg-slate-50 shadow'
        }
      `}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
      <span className="text-sm opacity-75">({duration})</span>
    </button>
  )
}

function VideoHighlight({ text }) {
  return (
    <li className="flex items-start">
      <span className="text-teal-500 mr-2 mt-1">✓</span>
      <span className="text-slate-700">{text}</span>
    </li>
  )
}

function TimeStamp({ time, label }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-teal-600 font-mono">{time}</span>
      <span className="text-slate-600">{label}</span>
    </li>
  )
}

function ResourceCard({ icon, title, description, buttonText, link, buttonDisabled }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-bold text-slate-800 mb-3" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h4>
      <p className="text-slate-600 mb-6">
        {description}
      </p>
      {buttonDisabled ? (
        <button 
          disabled
          className="bg-slate-200 text-slate-400 px-6 py-3 rounded-full font-semibold cursor-not-allowed"
        >
          {buttonText}
        </button>
      ) : (
        <Link 
          href={link}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-semibold transition-all inline-block"
        >
          {buttonText}
        </Link>
      )}
    </div>
  )
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
      <h4 className="text-lg font-bold text-slate-800 mb-3">
        {question}
      </h4>
      <p className="text-slate-600 leading-relaxed">
        {answer}
      </p>
    </div>
  )
}
// pages/features.js - COMPREHENSIVE FEATURES PAGE
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Features() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('student')

  return (
    <>
      <Head>
        <title>Features - Lux Libris Platform</title>
        <meta name="description" content="Explore all features of Lux Libris: Student app with Luxlings™ saints, teacher dashboards, parent engagement tools, and administrative controls." />
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
              <Link href="/features" className="text-teal-600 font-semibold">
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
                  className="block text-teal-600 font-semibold py-2"
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

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
              Every Feature,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                {" "}Thoughtfully Designed
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              From gamified student experiences to powerful administrative tools, 
              discover how Lux Libris transforms Catholic school reading programs.
            </p>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <TabButton
                active={activeTab === 'student'}
                onClick={() => setActiveTab('student')}
                icon="🎒"
                label="Student App"
              />
              <TabButton
                active={activeTab === 'teacher'}
                onClick={() => setActiveTab('teacher')}
                icon="👩‍🏫"
                label="Teacher Dashboard"
              />
              <TabButton
                active={activeTab === 'parent'}
                onClick={() => setActiveTab('parent')}
                icon="👨‍👩‍👧"
                label="Parent App"
              />
              <TabButton
                active={activeTab === 'admin'}
                onClick={() => setActiveTab('admin')}
                icon="🏫"
                label="Admin Tools"
              />
            </div>
          </div>
        </section>

        {/* Features Content */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            {/* Student Features */}
            {activeTab === 'student' && (
              <div className="animate-fadeIn">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Student App Features
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    A magical reading journey that motivates, engages, and rewards
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {/* Reading Experience */}
                  <FeatureSection
                    title="Reading Experience"
                    icon="📚"
                    color="teal"
                    features={[
                      {
                        title: "Interactive Book Dashboard",
                        description: "Browse 20 annual nominees with covers, descriptions, and availability (book/audiobook)"
                      },
                      {
                        title: "Personal Bookshelf",
                        description: "Track reading progress, add star ratings, and write personal notes"
                      },
                      {
                        title: "Smart Quiz System",
                        description: "30-minute timed quizzes unlocked by parents, instant feedback on completion"
                      },
                      {
                        title: "Multiple Submission Options",
                        description: "Choose between quizzes, teacher discussions, storyboards, or custom options"
                      }
                    ]}
                  />

                  {/* Gamification */}
                  <FeatureSection
                    title="Gamification & Rewards"
                    icon="🏆"
                    color="amber"
                    features={[
                      {
                        title: "XP System",
                        description: "Earn 1 XP per minute read, compete on anonymous leaderboard"
                      },
                      {
                        title: "Weekly Bird Badges",
                        description: "Complete reading challenges to collect badges and learn bird facts"
                      },
                      {
                        title: "Luxlings™ Saints Collection",
                        description: "234 collectible saints earned through streaks and achievements"
                      },
                      {
                        title: "Bragging Rights Certificate",
                        description: "End-of-year achievement showcase with all accomplishments"
                      }
                    ]}
                  />

                  {/* Healthy Habits */}
                  <FeatureSection
                    title="Healthy Habits Timer"
                    icon="⏱️"
                    color="blue"
                    features={[
                      {
                        title: "Focus Mode",
                        description: "Timer pauses if student navigates away - no distractions allowed!"
                      },
                      {
                        title: "Daily Goals",
                        description: "Build consistent 20+ minute reading habits with visual progress"
                      },
                      {
                        title: "Streak Tracking",
                        description: "14-day, 30-day, and 90-day streaks unlock special saints"
                      },
                      {
                        title: "Parent Verification",
                        description: "Parents can verify reading sessions for accountability"
                      }
                    ]}
                  />

                  {/* Personalization */}
                  <FeatureSection
                    title="Personalization & Fun"
                    icon="🎨"
                    color="purple"
                    features={[
                      {
                        title: "8 Custom Themes",
                        description: "Personalize the app with different color schemes and styles"
                      },
                      {
                        title: "Lux DNA Lab",
                        description: "Fun personality quizzes about book characters and saints"
                      },
                      {
                        title: "Reading DNA Test",
                        description: "Discover your reading style and get personalized recommendations"
                      },
                      {
                        title: "Student Voice",
                        description: "Vote for Luminous Champion (April 1-14) and shape the program"
                      }
                    ]}
                  />
                </div>

                {/* Saint Collection Details */}
                <div className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-3xl p-8">
                  <h4 className="text-2xl font-bold text-center text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    The Luxlings™ Saint Collection System
                  </h4>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <SaintCategory
                      title="Reading Streaks"
                      items={[
                        "14-day streak: Common Saint",
                        "30-day streak: Rare Saint",
                        "90-day streak: Legendary Saint"
                      ]}
                    />
                    
                    <SaintCategory
                      title="Grade Achievements"
                      items={[
                        "First book submitted: Grade Saint",
                        "Program completion: Mini Marian",
                        "Liturgical seasons: Special Saints"
                      ]}
                    />
                    
                    <SaintCategory
                      title="Ultimate Goal"
                      items={[
                        "Complete all 5 years",
                        "Read 100 books total",
                        "Unlock the Ultimate Redeemer"
                      ]}
                    />
                  </div>
                  
                  <p className="text-center text-slate-600 mt-6 italic">
                    Each saint includes feast day, biography, virtues, and fun facts!
                  </p>
                </div>
              </div>
            )}

            {/* Teacher Features */}
            {activeTab === 'teacher' && (
              <div className="animate-fadeIn">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Teacher Dashboard Features
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Powerful tools to manage, track, and celebrate student success
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {/* Classroom Management */}
                  <FeatureSection
                    title="Classroom Management"
                    icon="👥"
                    color="blue"
                    features={[
                      {
                        title: "Flexible Student Enrollment",
                        description: "Add students digitally with codes or manually for app-free participation"
                      },
                      {
                        title: "Program Selection",
                        description: "Choose Lux Libris Award, Classroom Reading, or both programs"
                      },
                      {
                        title: "Custom Book Lists",
                        description: "Select all 20 books or create custom reading lists for your class"
                      },
                      {
                        title: "Submission Options",
                        description: "Enable quizzes, discussions, projects, or custom submission types"
                      }
                    ]}
                  />

                  {/* Progress Tracking */}
                  <FeatureSection
                    title="Progress Tracking"
                    icon="📊"
                    color="teal"
                    features={[
                      {
                        title: "Real-Time Dashboard",
                        description: "See all students' progress, submissions, and achievements at a glance"
                      },
                      {
                        title: "Book Approval System",
                        description: "Review submissions, provide feedback, request revisions easily"
                      },
                      {
                        title: "Historical Tracking",
                        description: "Add past books from previous grades to complete student records"
                      },
                      {
                        title: "Milestone Alerts",
                        description: "Get notified when students reach reward milestones"
                      }
                    ]}
                  />

                  {/* Reward Management */}
                  <FeatureSection
                    title="Reward Customization"
                    icon="🎯"
                    color="amber"
                    features={[
                      {
                        title: "Flexible Intervals",
                        description: "Set custom milestones (5, 10, 15, 20 books or any combination)"
                      },
                      {
                        title: "Physical Rewards",
                        description: "Configure real-world prizes: mass recognition, certificates, parties"
                      },
                      {
                        title: "Achievement Reports",
                        description: "Generate printable certificates and progress summaries"
                      },
                      {
                        title: "Class Celebrations",
                        description: "Tools to recognize and celebrate reading achievements"
                      }
                    ]}
                  />

                  {/* Communication */}
                  <FeatureSection
                    title="Communication Tools"
                    icon="💬"
                    color="purple"
                    features={[
                      {
                        title: "Parent Connection",
                        description: "Send achievement updates and reading recommendations"
                      },
                      {
                        title: "Student Feedback",
                        description: "Provide personalized feedback on book submissions"
                      },
                      {
                        title: "Class Announcements",
                        description: "Share reading challenges and upcoming milestones"
                      },
                      {
                        title: "Progress Reports",
                        description: "Export data for parent conferences and meetings"
                      }
                    ]}
                  />
                </div>

                {/* Teacher Tips */}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-8">
                  <h4 className="text-2xl font-bold text-center text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Designed for Real Classrooms
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl mb-3">⚡</div>
                      <h5 className="font-semibold text-slate-800 mb-2">Quick Setup</h5>
                      <p className="text-sm text-slate-600">5-minute onboarding with your school's teacher code</p>
                    </div>
                    <div>
                      <div className="text-3xl mb-3">🎓</div>
                      <h5 className="font-semibold text-slate-800 mb-2">Pedagogically Sound</h5>
                      <p className="text-sm text-slate-600">Built by a Catholic school librarian who gets it</p>
                    </div>
                    <div>
                      <div className="text-3xl mb-3">📱</div>
                      <h5 className="font-semibold text-slate-800 mb-2">Works Anywhere</h5>
                      <p className="text-sm text-slate-600">Access from any device, anytime</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parent Features */}
            {activeTab === 'parent' && (
              <div className="animate-fadeIn">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Parent App Features
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Free tools to support your child's reading journey and build family reading culture
                  </p>
                </div>

                {/* Free vs Premium */}
                <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-2xl p-6 mb-8 text-center">
                  <p className="text-slate-800 font-semibold">
                    All basic features FREE with school subscription • Premium features only $10/year (FREE during pilot!)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {/* Free Features */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-teal-200">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <span className="text-2xl mr-3">🆓</span>
                      Free Features
                    </h4>
                    
                    <FeatureList
                      features={[
                        {
                          title: "Family Dashboard",
                          description: "Track multiple children in one app"
                        },
                        {
                          title: "Book Information",
                          description: "View nominees with parent guides and discussion questions"
                        },
                        {
                          title: "Quiz Approval",
                          description: "Unlock timed quizzes for your children"
                        },
                        {
                          title: "Progress Tracking",
                          description: "See reading progress, achievements, and milestones"
                        },
                        {
                          title: "Bragging Rights",
                          description: "View and share achievement certificates"
                        },
                        {
                          title: "Reading Support",
                          description: "Tips for tricky themes and age-appropriate guidance"
                        }
                      ]}
                    />
                  </div>

                  {/* Premium Features */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg p-8 border-2 border-amber-300">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <span className="text-2xl mr-3">⭐</span>
                      Premium Features
                      <span className="ml-auto text-sm bg-amber-200 text-amber-800 px-3 py-1 rounded-full">
                        Free in Pilot!
                      </span>
                    </h4>
                    
                    <FeatureList
                      features={[
                        {
                          title: "Parent Healthy Habits Timer",
                          description: "Model good reading habits alongside your child"
                        },
                        {
                          title: "Family Reading Battles",
                          description: "Weekly challenges - can kids out-read their parents?"
                        },
                        {
                          title: "Reading DNA Lab",
                          description: "Science-based analysis of your reading support style"
                        },
                        {
                          title: "Compatibility Analysis",
                          description: "See how your style matches your child's needs"
                        },
                        {
                          title: "Emergency Toolkit",
                          description: "Quick help for 'My child won't read!' moments"
                        },
                        {
                          title: "Research Library",
                          description: "Access to 50+ reading research papers"
                        }
                      ]}
                    />
                  </div>
                </div>

                {/* Reading DNA Lab Detail */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8">
                  <h4 className="text-2xl font-bold text-center text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    The Science of Reading Support
                  </h4>
                  
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <DNAFeature
                      icon="🧬"
                      title="Parent DNA"
                      description="Discover your reading support style"
                    />
                    <DNAFeature
                      icon="🔬"
                      title="Child Analysis"
                      description="Understand their reading personality"
                    />
                    <DNAFeature
                      icon="🤝"
                      title="Compatibility"
                      description="See how your styles work together"
                    />
                    <DNAFeature
                      icon="🛠️"
                      title="Custom Toolkit"
                      description="Get personalized strategies"
                    />
                  </div>
                  
                  <p className="text-center text-slate-600 mt-6 text-sm">
                    Based on 50+ peer-reviewed research papers on reading development
                  </p>
                </div>
              </div>
            )}

            {/* Admin Features */}
            {activeTab === 'admin' && (
              <div className="animate-fadeIn">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Administrative Tools
                  </h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Comprehensive controls for schools and dioceses
                  </p>
                </div>

                {/* Admin Levels */}
                <div className="mb-12">
                  <div className="flex justify-center gap-4 mb-8">
                    <AdminLevelCard
                      title="Diocese Admin"
                      icon="⛪"
                      color="purple"
                      features={[
                        "Manage multiple schools",
                        "District-wide analytics",
                        "Bulk enrollment tools",
                        "Custom pricing tiers"
                      ]}
                    />
                    
                    <AdminLevelCard
                      title="School Admin"
                      icon="🏫"
                      color="teal"
                      features={[
                        "Teacher management",
                        "Program configuration",
                        "School-wide reports",
                        "Parent communication"
                      ]}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Setup & Management */}
                  <FeatureSection
                    title="Setup & Management"
                    icon="⚙️"
                    color="slate"
                    features={[
                      {
                        title: "Quick Onboarding",
                        description: "5-minute setup with automatic teacher code generation"
                      },
                      {
                        title: "Flexible Structure",
                        description: "Works for single schools or entire dioceses"
                      },
                      {
                        title: "User Management",
                        description: "Add/remove teachers, track active users, manage permissions"
                      },
                      {
                        title: "Program Selection",
                        description: "Enable specific programs for different grades or classes"
                      }
                    ]}
                  />

                  {/* Analytics & Reporting */}
                  <FeatureSection
                    title="Analytics & Reporting"
                    icon="📊"
                    color="blue"
                    features={[
                      {
                        title: "Comprehensive Dashboards",
                        description: "Real-time data on participation, completion, and engagement"
                      },
                      {
                        title: "Custom Reports",
                        description: "Generate reports for board meetings, parent nights, grants"
                      },
                      {
                        title: "Trend Analysis",
                        description: "Track reading habits and program growth over time"
                      },
                      {
                        title: "Export Options",
                        description: "Download data in multiple formats for further analysis"
                      }
                    ]}
                  />

                  {/* Customization */}
                  <FeatureSection
                    title="Program Customization"
                    icon="🎨"
                    color="teal"
                    features={[
                      {
                        title: "Reward Configuration",
                        description: "Set custom milestones and physical reward intervals"
                      },
                      {
                        title: "Book Selection",
                        description: "Choose which books from the annual list to include"
                      },
                      {
                        title: "Submission Methods",
                        description: "Enable/disable different submission options"
                      },
                      {
                        title: "Branding Options",
                        description: "Add school logos to certificates and reports"
                      }
                    ]}
                  />

                  {/* Support & Resources */}
                  <FeatureSection
                    title="Support & Resources"
                    icon="🤝"
                    color="amber"
                    features={[
                      {
                        title: "Dedicated Support",
                        description: "Priority email and phone support for administrators"
                      },
                      {
                        title: "Training Resources",
                        description: "Video tutorials, guides, and best practices"
                      },
                      {
                        title: "Community Forum",
                        description: "Connect with other Catholic school administrators"
                      },
                      {
                        title: "Regular Updates",
                        description: "New features based on educator feedback"
                      }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Feature Comparison
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                See what's included for each user type
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Feature</th>
                    <th className="px-6 py-4 text-center">Student</th>
                    <th className="px-6 py-4 text-center">Teacher</th>
                    <th className="px-6 py-4 text-center">Parent</th>
                    <th className="px-6 py-4 text-center">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    feature="Book Reading & Tracking"
                    student="✓"
                    teacher="View"
                    parent="View"
                    admin="Overview"
                  />
                  <ComparisonRow
                    feature="Luxlings™ Saints Collection"
                    student="✓"
                    teacher="View"
                    parent="View"
                    admin="-"
                    isAlt
                  />
                  <ComparisonRow
                    feature="Healthy Habits Timer"
                    student="✓"
                    teacher="-"
                    parent="Premium"
                    admin="-"
                  />
                  <ComparisonRow
                    feature="Progress Analytics"
                    student="Basic"
                    teacher="✓"
                    parent="✓"
                    admin="✓"
                    isAlt
                  />
                  <ComparisonRow
                    feature="Quiz System"
                    student="✓"
                    teacher="Manage"
                    parent="Approve"
                    admin="-"
                  />
                  <ComparisonRow
                    feature="Reward Management"
                    student="View"
                    teacher="✓"
                    parent="View"
                    admin="✓"
                    isAlt
                  />
                  <ComparisonRow
                    feature="Multi-User Management"
                    student="-"
                    teacher="✓"
                    parent="✓"
                    admin="✓"
                  />
                  <ComparisonRow
                    feature="Reading DNA Analysis"
                    student="✓"
                    teacher="-"
                    parent="Premium"
                    admin="-"
                    isAlt
                  />
                </tbody>
              </table>
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
              Join the pilot program and get all premium features free for the first year
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/demo" 
                className="bg-white text-teal-600 px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              >
                Watch Demo
              </Link>
              
              <Link 
                href="/contact" 
                className="border-2 border-white text-white hover:bg-white hover:text-teal-600 px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              >
                Get Started
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
        `}</style>
      </main>
    </>
  )
}

// Supporting Components
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-full font-semibold transition-all transform
        ${active 
          ? 'bg-teal-600 text-white shadow-lg scale-105' 
          : 'bg-white text-slate-600 hover:bg-slate-50 shadow'
        }
      `}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  )
}

function FeatureSection({ title, icon, color, features }) {
  const colorClasses = {
    teal: 'from-teal-50 to-teal-100 border-teal-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    slate: 'from-slate-50 to-slate-100 border-slate-200'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 border-2`}>
      <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        {title}
      </h4>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index}>
            <h5 className="font-semibold text-slate-800 mb-1">{feature.title}</h5>
            <p className="text-sm text-slate-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureList({ features }) {
  return (
    <div className="space-y-4">
      {features.map((feature, index) => (
        <div key={index}>
          <h5 className="font-semibold text-slate-800 mb-1">{feature.title}</h5>
          <p className="text-sm text-slate-600">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}

function SaintCategory({ title, items }) {
  return (
    <div className="bg-white/70 rounded-xl p-4">
      <h5 className="font-semibold text-slate-800 mb-3">{title}</h5>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-slate-600 flex items-start">
            <span className="text-teal-500 mr-2">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DNAFeature({ icon, title, description }) {
  return (
    <div>
      <div className="text-3xl mb-2">{icon}</div>
      <h5 className="font-semibold text-slate-800 mb-1">{title}</h5>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}

function AdminLevelCard({ title, icon, color, features }) {
  const colorClasses = {
    purple: 'from-purple-100 to-purple-200 border-purple-300',
    teal: 'from-teal-100 to-teal-200 border-teal-300'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border-2 max-w-xs`}>
      <div className="text-3xl mb-3 text-center">{icon}</div>
      <h4 className="font-bold text-slate-800 text-center mb-4">{title}</h4>
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

function ComparisonRow({ feature, student, teacher, parent, admin, isAlt }) {
  return (
    <tr className={isAlt ? 'bg-slate-50' : 'bg-white'}>
      <td className="px-6 py-4 font-medium text-slate-800">{feature}</td>
      <td className="px-6 py-4 text-center">{renderCheck(student)}</td>
      <td className="px-6 py-4 text-center">{renderCheck(teacher)}</td>
      <td className="px-6 py-4 text-center">{renderCheck(parent)}</td>
      <td className="px-6 py-4 text-center">{renderCheck(admin)}</td>
    </tr>
  )
}

function renderCheck(value) {
  if (value === '✓') return <span className="text-teal-600 font-bold text-lg">✓</span>
  if (value === '-') return <span className="text-slate-300">-</span>
  if (value === 'Premium') return <span className="text-amber-600 font-medium">Premium</span>
  return <span className="text-slate-600">{value}</span>
}
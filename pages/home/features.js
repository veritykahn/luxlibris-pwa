// pages/features.js - UPDATED WITH LAYOUT AND CONSISTENT STYLING
import { useState } from 'react'
import Layout from '../../components/Layout'

export default function Features() {
  const [activeTab, setActiveTab] = useState('student')

  return (
    <Layout 
      title="Features - Lux Libris Platform" 
      description="Explore all features of Lux Libris: Student app with Luxlings™ saints, teacher dashboards, parent engagement tools, and administrative controls."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20" style={{background: 'linear-gradient(to bottom, #f0fdfa, #eff6ff, white)'}}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            Every Feature,
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Thoughtfully Designed
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed" style={{color: '#223848'}}>
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
                <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Student App Features
                </h3>
                <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
                  A magical reading journey that motivates, engages, and rewards
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Reading Experience */}
                <FeatureSection
                  title="Reading Experience"
                  icon="📚"
                  color="#C3E0DE"
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
                  color="#FFC4A3"
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
                  color="#ADD4EA"
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
                  color="#E6D9F2"
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
              <div className="rounded-3xl p-8" style={{background: 'linear-gradient(to bottom right, #F5EBDC, #F5D5E0)'}}>
                <h4 className="text-2xl font-bold text-center mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
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
                
                <p className="text-center mt-6 italic" style={{color: '#223848'}}>
                  Each saint includes feast day, biography, virtues, and fun facts!
                </p>
              </div>
            </div>
          )}

          {/* Teacher Features */}
          {activeTab === 'teacher' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Teacher Dashboard Features
                </h3>
                <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
                  Powerful tools to manage, track, and celebrate student success
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Classroom Management */}
                <FeatureSection
                  title="Classroom Management"
                  icon="👥"
                  color="#ADD4EA"
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
                  color="#C3E0DE"
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
                  color="#FFAB91"
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
                  color="#D4C5E8"
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
              <div className="rounded-3xl p-8" style={{background: 'linear-gradient(to bottom right, #C3E0DE, #B6DFEB)'}}>
                <h4 className="text-2xl font-bold text-center mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Designed for Real Classrooms
                </h4>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl mb-3">⚡</div>
                    <h5 className="font-semibold mb-2" style={{color: '#223848'}}>Quick Setup</h5>
                    <p className="text-sm" style={{color: '#223848'}}>5-minute onboarding with your school&apos;s teacher code</p>
                  </div>
                  <div>
                    <div className="text-3xl mb-3">🎓</div>
                    <h5 className="font-semibold mb-2" style={{color: '#223848'}}>Pedagogically Sound</h5>
                    <p className="text-sm" style={{color: '#223848'}}>Built by a Catholic school librarian who gets it</p>
                  </div>
                  <div>
                    <div className="text-3xl mb-3">📱</div>
                    <h5 className="font-semibold mb-2" style={{color: '#223848'}}>Works Anywhere</h5>
                    <p className="text-sm" style={{color: '#223848'}}>Access from any device, anytime</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parent Features */}
          {activeTab === 'parent' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Parent App Features
                </h3>
                <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
                  Free tools to support your child&apos;s reading journey and build family reading culture
                </p>
              </div>

              {/* Free vs Premium */}
              <div className="rounded-2xl p-6 mb-8 text-center" style={{background: 'linear-gradient(to right, #C3E0DE, #ADD4EA)'}}>
                <p className="font-semibold" style={{color: '#223848'}}>
                  All basic features FREE with school subscription • Premium features only $10/year (FREE during pilot!)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Free Features */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2" style={{borderColor: '#A1E5DB'}}>
                  <h4 className="text-xl font-bold mb-6 flex items-center" style={{color: '#223848'}}>
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
                <div className="rounded-2xl shadow-lg p-8 border-2" style={{background: 'linear-gradient(to bottom right, #FFAB91, #FFC4A3)', borderColor: '#FFAB91'}}>
                  <h4 className="text-xl font-bold mb-6 flex items-center" style={{color: '#223848'}}>
                    <span className="text-2xl mr-3">⭐</span>
                    Premium Features
                    <span className="ml-auto text-sm text-white px-3 py-1 rounded-full" style={{backgroundColor: '#FFAB91'}}>
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
              <div className="rounded-3xl p-8" style={{background: 'linear-gradient(to bottom right, #E6D9F2, #ADD4EA)'}}>
                <h4 className="text-2xl font-bold text-center mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
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
                
                <p className="text-center mt-6 text-sm" style={{color: '#223848'}}>
                  Based on 50+ peer-reviewed research papers on reading development
                </p>
              </div>
            </div>
          )}

          {/* Admin Features */}
          {activeTab === 'admin' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Administrative Tools
                </h3>
                <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
                  Comprehensive controls for schools and dioceses
                </p>
              </div>

              {/* Admin Levels */}
              <div className="mb-12">
                <div className="flex justify-center gap-4 mb-8">
                  <AdminLevelCard
                    title="Diocese Admin"
                    icon="⛪"
                    color="#E6D9F2"
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
                    color="#C3E0DE"
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
                  color="#E5E8EB"
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
                  color="#ADD4EA"
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
                  color="#C3E0DE"
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
                  color="#FFC4A3"
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
      <section className="py-20" style={{background: 'linear-gradient(to bottom right, #F0F2F4, #E5E8EB)'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Feature Comparison
            </h3>
            <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
              See what&apos;s included for each user type
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead className="text-white" style={{background: 'linear-gradient(to right, #A1E5DB, #ADD4EA)'}}>
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
      <section className="py-20" style={{background: 'linear-gradient(to right, #A1E5DB, #ADD4EA)'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
            Ready to Transform Your Reading Program?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the pilot program and get all premium features free for the first year
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/demo" 
              className="bg-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              style={{color: '#A1E5DB'}}
            >
              Watch Demo
            </a>
            
            <a 
              href="/contact" 
              className="border-2 border-white text-white hover:bg-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              style={{':hover': {color: '#A1E5DB'}}}
              onMouseEnter={(e) => e.target.style.color = '#A1E5DB'}
              onMouseLeave={(e) => e.target.style.color = 'white'}
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

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
    </Layout>
  )
}

// Supporting Components
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-full font-semibold transition-all transform"
      style={{
        backgroundColor: active ? '#A1E5DB' : 'white',
        color: active ? 'white' : '#223848',
        boxShadow: active ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 4px 10px rgba(0, 0, 0, 0.1)',
        transform: active ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  )
}

function FeatureSection({ title, icon, color, features }) {
  return (
    <div className="rounded-2xl p-6 border-2" style={{backgroundColor: `${color}20`, borderColor: color}}>
      <h4 className="text-xl font-bold mb-4 flex items-center" style={{color: '#223848'}}>
        <span className="text-2xl mr-3">{icon}</span>
        {title}
      </h4>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index}>
            <h5 className="font-semibold mb-1" style={{color: '#223848'}}>{feature.title}</h5>
            <p className="text-sm" style={{color: '#223848'}}>{feature.description}</p>
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
          <h5 className="font-semibold mb-1" style={{color: '#223848'}}>{feature.title}</h5>
          <p className="text-sm" style={{color: '#223848'}}>{feature.description}</p>
        </div>
      ))}
    </div>
  )
}

function SaintCategory({ title, items }) {
  return (
    <div className="bg-white/70 rounded-xl p-4">
      <h5 className="font-semibold mb-3" style={{color: '#223848'}}>{title}</h5>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm flex items-start" style={{color: '#223848'}}>
            <span className="mr-2" style={{color: '#A1E5DB'}}>•</span>
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
      <h5 className="font-semibold mb-1" style={{color: '#223848'}}>{title}</h5>
      <p className="text-sm" style={{color: '#223848'}}>{description}</p>
    </div>
  )
}

function AdminLevelCard({ title, icon, color, features }) {
  return (
    <div className="rounded-xl p-6 border-2 max-w-xs" style={{backgroundColor: color, borderColor: color}}>
      <div className="text-3xl mb-3 text-center">{icon}</div>
      <h4 className="font-bold text-center mb-4" style={{color: '#223848'}}>{title}</h4>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm" style={{color: '#223848'}}>
            • {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ComparisonRow({ feature, student, teacher, parent, admin, isAlt }) {
  return (
    <tr style={{backgroundColor: isAlt ? '#F0F2F4' : 'white'}}>
      <td className="px-6 py-4 font-medium" style={{color: '#223848'}}>{feature}</td>
      <td className="px-6 py-4 text-center">{renderCheck(student)}</td>
      <td className="px-6 py-4 text-center">{renderCheck(teacher)}</td>
      <td className="px-6 py-4 text-center">{renderCheck(parent)}</td>
      <td className="px-6 py-4 text-center">{renderCheck(admin)}</td>
    </tr>
  )
}

function renderCheck(value) {
  if (value === '✓') return <span className="font-bold text-lg" style={{color: '#A1E5DB'}}>✓</span>
  if (value === '-') return <span style={{color: '#D5D8DB'}}>-</span>
  if (value === 'Premium') return <span className="font-medium" style={{color: '#FFAB91'}}>Premium</span>
  return <span style={{color: '#223848'}}>{value}</span>
}
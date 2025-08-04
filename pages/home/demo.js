// pages/home/demo.js - DEMO PAGE WITH VIDEO WALKTHROUGHS
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function Demo() {
  const [activeVideo, setActiveVideo] = useState('overview')

  return (
    <Layout 
      title="Demo - See Lux Libris in Action" 
      description="Watch video demos of Lux Libris: student app walkthrough with Luxlings™ saints collection, teacher dashboard tour, parent features, and administrative tools for Catholic schools."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            See Lux Libris
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}in Action
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed" style={{color: '#223848'}}>
            Explore our Catholic school reading platform through guided video tours. See how students collect Luxlings™ saints, 
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

      {/* Video Content Section - FIXED CENTERING */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Platform Overview Video */}
          {activeVideo === 'overview' && (
            <div className="animate-fadeIn">
              <div className="rounded-3xl p-8 shadow-xl" style={{background: 'linear-gradient(to bottom right, #A1E5DB20, #ADD4EA20)'}}>
                {/* Video Container - FIXED */}
                <div className="relative w-full mb-8" style={{paddingBottom: '56.25%'}}>
                  <div className="absolute inset-0 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎬</div>
                      <p className="mb-4" style={{color: '#223848'}}>Platform Overview Video</p>
                      <p className="text-sm" style={{color: '#223848'}}>
                        YouTube embed: https://youtube.com/watch?v=luxlibris-overview
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                      Welcome to Lux Libris
                    </h3>
                    <p className="mb-4" style={{color: '#223848'}}>
                      Get a complete overview of how Lux Libris transforms Catholic school 
                      reading programs through gamification, 234 collectible Luxlings™ saints, and family engagement.
                    </p>
                    <ul className="space-y-2">
                      <VideoHighlight text="Lux Libris Award (grades 4-8) and Classroom Reading programs" />
                      <VideoHighlight text="Complete ecosystem for diocese, school, teacher, student, and parent users" />
                      <VideoHighlight text="Faith-integrated gamification with exclusive Luxlings™ saints" />
                      <VideoHighlight text="Pilot program launching September 1st" />
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h4 className="font-bold mb-4" style={{color: '#223848'}}>In This Video:</h4>
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
              <div className="rounded-3xl p-8 shadow-xl" style={{background: 'linear-gradient(to bottom right, #ADD4EA20, #A1E5DB20)'}}>
                {/* Video Container - FIXED */}
                <div className="relative w-full mb-8" style={{paddingBottom: '56.25%'}}>
                  <div className="absolute inset-0 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎒</div>
                      <p className="mb-4" style={{color: '#223848'}}>Student App Walkthrough</p>
                      <p className="text-sm" style={{color: '#223848'}}>
                        YouTube embed: https://youtube.com/watch?v=luxlibris-student
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                      The Student Journey
                    </h3>
                    <p className="mb-4" style={{color: '#223848'}}>
                      Follow Emma, a 4th grader, as she explores the Lux Libris student app, 
                      collects Luxlings™ saints through reading achievements, and builds her daily reading habits.
                    </p>
                    <ul className="space-y-2">
                      <VideoHighlight text="Personal dashboard with 20 annual book nominees" />
                      <VideoHighlight text="Healthy Habits Timer requiring focused reading" />
                      <VideoHighlight text="Earning Luxlings™ saints and weekly bird badges" />
                      <VideoHighlight text="Multiple submission options: quizzes or teacher discussions" />
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h4 className="font-bold mb-4" style={{color: '#223848'}}>Featured Elements:</h4>
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
              <div className="rounded-3xl p-8 shadow-xl" style={{background: 'linear-gradient(to bottom right, #A1E5DB20, #E5E8EB20)'}}>
                {/* Video Container - FIXED */}
                <div className="relative w-full mb-8" style={{paddingBottom: '56.25%'}}>
                  <div className="absolute inset-0 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👩‍🏫</div>
                      <p className="mb-4" style={{color: '#223848'}}>Teacher Dashboard Tour</p>
                      <p className="text-sm" style={{color: '#223848'}}>
                        YouTube embed: https://youtube.com/watch?v=luxlibris-teacher
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                      Powerful Teaching Tools
                    </h3>
                    <p className="mb-4" style={{color: '#223848'}}>
                      Join Mrs. Rodriguez as she manages her 4th-grade class through the Lux Libris Award program, 
                      customizes achievement milestones, and celebrates student reading success.
                    </p>
                    <ul className="space-y-2">
                      <VideoHighlight text="Quick 5-minute setup with school teacher code" />
                      <VideoHighlight text="Managing digital and manual student rosters" />
                      <VideoHighlight text="Customizing book lists and reward intervals" />
                      <VideoHighlight text="Generating printable achievement reports" />
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h4 className="font-bold mb-4" style={{color: '#223848'}}>Key Features:</h4>
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
              <div className="rounded-3xl p-8 shadow-xl" style={{background: 'linear-gradient(to bottom right, #FFAB9120, #A1E5DB20)'}}>
                {/* Video Container - FIXED */}
                <div className="relative w-full mb-8" style={{paddingBottom: '56.25%'}}>
                  <div className="absolute inset-0 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👨‍👩‍👧</div>
                      <p className="mb-4" style={{color: '#223848'}}>Parent App Features</p>
                      <p className="text-sm" style={{color: '#223848'}}>
                        YouTube embed: https://youtube.com/watch?v=luxlibris-parent
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                      Family Reading Partnership
                    </h3>
                    <p className="mb-4" style={{color: '#223848'}}>
                      See how the Johnson family uses the parent app (FREE with school subscription) to support their 
                      children's reading journey and explore premium features like the Reading DNA Lab.
                    </p>
                    <ul className="space-y-2">
                      <VideoHighlight text="Multi-child tracking across multiple schools" />
                      <VideoHighlight text="Book guidance with discussion questions" />
                      <VideoHighlight text="Premium: Family reading battles and parent timer" />
                      <VideoHighlight text="Premium: Science-based Reading DNA analysis" />
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h4 className="font-bold mb-4" style={{color: '#223848'}}>App Walkthrough:</h4>
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
      <section className="py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
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
              link="/home/contact#demo"
            />
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20" style={{background: 'linear-gradient(to right, #ADD4EA, #A1E5DB)'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
            Ready to Transform Your Reading Program?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Join the pilot program today and get all premium features free for the first year.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/home/contact" 
              className="bg-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              style={{color: '#A1E5DB'}}
            >
              Get Started
            </Link>
            
            <Link 
              href="/home/for-schools" 
              className="border-2 border-white text-white hover:bg-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              style={{':hover': {color: '#A1E5DB'}}}
              onMouseEnter={(e) => e.target.style.color = '#A1E5DB'}
              onMouseLeave={(e) => e.target.style.color = 'white'}
            >
              Learn More
            </Link>
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
function VideoTab({ active, onClick, icon, label, duration }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-full font-semibold transition-all transform flex items-center gap-2"
      style={{
        backgroundColor: active ? '#A1E5DB' : 'white',
        color: active ? 'white' : '#223848',
        boxShadow: active ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 4px 10px rgba(0, 0, 0, 0.1)',
        transform: active ? 'scale(1.05)' : 'scale(1)'
      }}
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
      <span className="mr-2 mt-1" style={{color: '#A1E5DB'}}>✓</span>
      <span style={{color: '#223848'}}>{text}</span>
    </li>
  )
}

function TimeStamp({ time, label }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="font-mono" style={{color: '#A1E5DB'}}>{time}</span>
      <span style={{color: '#223848'}}>{label}</span>
    </li>
  )
}

function ResourceCard({ icon, title, description, buttonText, link, buttonDisabled }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-bold mb-3" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
        {title}
      </h4>
      <p className="mb-6" style={{color: '#223848'}}>
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
          className="text-white px-6 py-3 rounded-full font-semibold transition-all inline-block"
          style={{backgroundColor: '#A1E5DB', ':hover': {backgroundColor: '#8CD4C9'}}}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#8CD4C9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
        >
          {buttonText}
        </Link>
      )}
    </div>
  )
}
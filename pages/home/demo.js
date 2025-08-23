// pages/home/demo.js - DEMO PAGE WITH VIDEO WALKTHROUGHS
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function Demo() {
  const [activeVideo, setActiveVideo] = useState('student')

  return (
    <Layout 
      title="Demo - See Lux Libris in Action" 
      description="Watch video demos of Lux Libris: student app walkthrough with Luxlings™ saints collection, teacher dashboard tour, parent features, and administrative tools for Catholic schools."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            See Lux Libris
            <span className="block sm:inline" style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}in Action
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-4" style={{color: '#223848'}}>
            Explore our Catholic school reading platform through guided video tours. See how students collect Luxlings™ saints, 
            teachers track progress, and families engage with reading together.
          </p>

          {/* Video Selector */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12 px-4">
            <VideoTab
              active={activeVideo === 'student'}
              onClick={() => setActiveVideo('student')}
              icon="🎒"
              label="Student Experience"
              duration="3:47"
            />
            <VideoTab
              active={false}
              onClick={() => {}}
              icon="🎬"
              label="Platform Overview"
              duration="Coming Soon"
              disabled
            />
            <VideoTab
              active={false}
              onClick={() => {}}
              icon="👩‍🏫"
              label="Teacher Dashboard"
              duration="Coming Soon"
              disabled
            />
            <VideoTab
              active={false}
              onClick={() => {}}
              icon="👨‍👩‍👧"
              label="Parent Features"
              duration="Coming Soon"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Video Content Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Student Experience Video */}
          {activeVideo === 'student' && (
            <div className="animate-fadeIn">
              <div className="rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl" 
                   style={{background: 'linear-gradient(to bottom right, #ADD4EA20, #A1E5DB20)'}}>
                {/* Video Container with actual YouTube embed */}
                <div className="relative w-full mb-6 md:mb-8" style={{paddingBottom: '56.25%'}}>
                  <iframe 
                    className="absolute inset-0 w-full h-full rounded-lg sm:rounded-xl md:rounded-2xl"
                    src="https://www.youtube.com/embed/m5MrOQiHyTU?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=0&iv_load_policy=3&color=white&playsinline=1"
                    title="Lux Libris Student Experience Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4" 
                        style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                      Take a Sneak Peek at the World&apos;s First Catholic Literacy Platform
                    </h3>
                    <p className="text-sm sm:text-base mb-4" style={{color: '#223848'}}>
                      Explore the Lux Libris student app and see how students collect Luxlings™ saints through reading achievements and build daily reading habits.
                    </p>
                    <ul className="space-y-2">
                      <VideoHighlight text="Personal dashboard with 20 annual book nominees" />
                      <VideoHighlight text="Healthy Habits Timer requiring focused reading" />
                      <VideoHighlight text="Earning Luxlings™ saints and weekly bird badges" />
                      <VideoHighlight text="Multiple submission options: quizzes or teacher discussions" />
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                    <h4 className="font-bold mb-3 md:mb-4 text-sm sm:text-base" style={{color: '#223848'}}>
                      Featured Elements:
                    </h4>
                    <ul className="space-y-2 sm:space-y-3">
                      <TimeStamp time="0:00" label="Student Dashboard" />
                      <TimeStamp time="0:16" label="Nominees and Bookshelf" />
                      <TimeStamp time="0:34" label="Healthy Habits" />
                      <TimeStamp time="1:04" label="Book Submissions" />
                      <TimeStamp time="1:27" label="Saints Shelf" />
                      <TimeStamp time="1:42" label="Stats Dashboard" />
                      <TimeStamp time="2:35" label="Lux DNA" />
                      <TimeStamp time="3:00" label="Family Battle" />
                      <TimeStamp time="3:10" label="Themes" />
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-12 md:py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 md:mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            More Ways to Explore
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
              buttonText="Coming Soon"
              buttonDisabled
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
      <section className="py-12 md:py-20" style={{background: 'linear-gradient(to right, #ADD4EA, #A1E5DB)'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6" 
              style={{fontFamily: 'Didot, Georgia, serif'}}>
            Ready to Transform Your Reading Program?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join the pilot program today and get all premium features free for the first year.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Link 
              href="/home/contact" 
              className="bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              style={{color: '#A1E5DB'}}
            >
              Get Started
            </Link>
            
            <Link 
              href="/home/for-schools" 
              className="border-2 border-white text-white hover:bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all inline-block"
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
function VideoTab({ active, onClick, icon, label, duration, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all transform flex items-center gap-2 ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
      style={{
        backgroundColor: active ? '#A1E5DB' : disabled ? '#E5E8EB' : 'white',
        color: active ? 'white' : disabled ? '#9CA3AF' : '#223848',
        boxShadow: active ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 4px 10px rgba(0, 0, 0, 0.1)',
        transform: active ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      <span className="text-lg sm:text-xl">{icon}</span>
      <span>{label}</span>
      <span className="text-xs sm:text-sm opacity-75">({duration})</span>
    </button>
  )
}

function VideoHighlight({ text }) {
  return (
    <li className="flex items-start text-sm sm:text-base">
      <span className="mr-2 mt-1" style={{color: '#A1E5DB'}}>✓</span>
      <span style={{color: '#223848'}}>{text}</span>
    </li>
  )
}

function TimeStamp({ time, label }) {
  return (
    <li className="flex items-center justify-between text-xs sm:text-sm">
      <span className="font-mono" style={{color: '#A1E5DB'}}>{time}</span>
      <span style={{color: '#223848'}}>{label}</span>
    </li>
  )
}

function ResourceCard({ icon, title, description, buttonText, link, buttonDisabled }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-center">
      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{icon}</div>
      <h4 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" 
          style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
        {title}
      </h4>
      <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{color: '#223848'}}>
        {description}
      </p>
      {buttonDisabled ? (
        <button 
          disabled
          className="bg-slate-200 text-slate-400 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold cursor-not-allowed"
        >
          {buttonText}
        </button>
      ) : (
        <Link 
          href={link}
          className="text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all inline-block"
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
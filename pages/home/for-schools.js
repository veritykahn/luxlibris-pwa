// pages/for-schools.js - UPDATED WITH LAYOUT AND CONSISTENT STYLING
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

export default function ForSchools() {
  const router = useRouter()

  return (
    <Layout 
      title="For Schools - Lux Libris Catholic Reading Platform" 
      description="Transform your Catholic school's reading culture. Two powerful programs, comprehensive dashboards, and Luxlings™ saints collection. Perfect for dioceses, schools, and libraries."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{background: 'linear-gradient(to bottom, #f0fdfa, #eff6ff, white)'}}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-bold mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
              Built for Catholic Schools, By
              <span style={{
                background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {" "} Catholic Educators
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto mb-8 leading-relaxed" style={{color: '#223848'}}>
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
              bgColor="#E6D9F2"
              textColor="#223848"
              buttonColor="#C8B6E2"
            />
            
            <AccessCard
              title="School Admin"
              description="Oversee teachers, students, and reading programs"
              icon="🏫"
              ctaText="School Dashboard"
              ctaLink="/school/dashboard"
              bgColor="#C3E0DE"
              textColor="#223848"
              buttonColor="#A1E5DB"
            />
            
            <AccessCard
              title="New School?"
              description="Register your school and transform reading culture"
              icon="🚀"
              ctaText="Get Started"
              ctaLink="/school/signup"
              bgColor="#ADD4EA"
              textColor="#223848"
              buttonColor="#B6DFEB"
            />
          </div>
          
          {/* Educator Role Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-center mb-8" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Are You a Teacher or Librarian?
            </h3>
            
            {/* Educator Card */}
            <div className="max-w-md mx-auto">
              <EducatorCard
                icon="👩‍🏫"
                title="Educators"
                description="Teachers & librarians managing reading programs"
                features={[
                  "📚 Run school reading programs",
                  "👥 Manage class reading",
                  "📊 Student progress tracking",
                  "🏆 Achievement celebrations",
                  "📈 Reading analytics"
                ]}
                buttonText="Join as Educator"
                onClick={() => router.push('/admin/teacher-setup-choice')}
                highlight="Teachers & Librarians"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Two Programs Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Choose Your Perfect Program
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{color: '#223848'}}>
              Flexible options designed for different needs and grade levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Lux Libris Award Program */}
            <div className="rounded-3xl p-8 border-2" style={{background: 'linear-gradient(to bottom right, #C3E0DE, #B6DFEB)', borderColor: '#A1E5DB'}}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Lux Libris Award Program
                </h3>
                <span className="text-white px-4 py-2 rounded-full text-sm font-semibold" style={{backgroundColor: '#A1E5DB'}}>
                  Grades 4-8
                </span>
              </div>
              
              <p className="mb-6 font-medium" style={{color: '#223848'}}>
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
                <p className="text-sm mb-2" style={{color: '#223848'}}>Annual Timeline:</p>
                <p className="font-semibold" style={{color: '#223848'}}>June 1: Launch → March 31: Complete → April 15: Winner → May: Preview Next Year</p>
              </div>
            </div>
            
            {/* Classroom Reading Program */}
            <div className="rounded-3xl p-8 border-2" style={{background: 'linear-gradient(to bottom right, #FFAB91, #FFC4A3)', borderColor: '#FFAB91'}}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  Classroom Reading Program
                </h3>
                <span className="text-white px-4 py-2 rounded-full text-sm font-semibold" style={{backgroundColor: '#FFAB91'}}>
                  All Grades
                </span>
              </div>
              
              <p className="mb-6 font-medium" style={{color: '#223848'}}>
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
              
              <div className="rounded-xl p-4 text-center" style={{backgroundColor: 'rgba(255, 171, 145, 0.3)'}}>
                <span className="inline-flex items-center text-white px-4 py-2 rounded-full text-sm font-semibold" style={{backgroundColor: '#FFAB91'}}>
                  <span className="mr-2">🚀</span>
                  Pilot Launch: Spring 2025
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizational Structure */}
      <section className="py-20" style={{background: 'linear-gradient(to bottom right, #f0fdfa, #eff6ff)'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Flexible for Any Structure
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{color: '#223848'}}>
              Whether you&apos;re a diocese managing 50 schools or a single institution, 
              Lux Libris scales to meet your needs with powerful administrative tools.
            </p>
          </div>

          {/* Hierarchy Visual */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-center mb-8" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
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
                color="#E6D9F2"
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
                color="#C3E0DE"
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
                color="#ADD4EA"
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
                color="#FFC4A3"
              />
            </div>
            
            <div className="mt-8 text-center">
              <p style={{color: '#223848'}}>
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
              bgColor="#E6D9F2"
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
              bgColor="#C3E0DE"
            />
          </div>
        </div>
      </section>

      {/* Admin Features Deep Dive */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Powerful Tools for Administrators
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{color: '#223848'}}>
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
      <section className="py-20" style={{background: 'linear-gradient(to bottom right, #F5EBDC, #F5D5E0)'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Built for Success
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{color: '#223848'}}>
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
            <h3 className="text-2xl font-bold text-center mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
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
      <section className="py-20" style={{background: 'linear-gradient(to right, #A1E5DB, #ADD4EA)'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
            Join the Pilot Program Today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
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
          
          <p className="text-white/80 text-sm">
            Questions? Email us at{" "}
            <a href="mailto:inquiries@luxlibris.org" className="text-white underline">
              inquiries@luxlibris.org
            </a>
          </p>
        </div>
      </section>
    </Layout>
  )
}

// Supporting Components

// Supporting Components
function AccessCard({ title, description, icon, ctaText, ctaLink, bgColor, textColor, buttonColor }) {
  return (
    <div className="rounded-2xl p-6 text-center h-full flex flex-col" style={{backgroundColor: bgColor}}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3" style={{fontFamily: 'Didot, Georgia, serif', color: textColor}}>
        {title}
      </h3>
      <p className="mb-6 flex-grow leading-relaxed" style={{color: textColor}}>
        {description}
      </p>
      <a 
        href={ctaLink}
        className="text-white px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
        style={{backgroundColor: buttonColor}}
      >
        {ctaText}
      </a>
    </div>
  )
}

function EducatorCard({ icon, title, description, features, buttonText, onClick, highlight }) {
  const cardStyle = {
    background: 'white',
    borderRadius: '1rem',
    padding: 'clamp(1.25rem, 3vw, 1.75rem)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #C3E0DE',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    position: 'relative',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '420px'
  }

  return (
    <div style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}
    >
      
      {highlight && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #FFAB91, #FFC4A3)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontFamily: 'Avenir',
          letterSpacing: '1.2px'
        }}>
          {highlight}
        </div>
      )}
      
      <div style={{
        width: 'clamp(3rem, 8vw, 3.5rem)',
        height: 'clamp(3rem, 8vw, 3.5rem)',
        background: 'linear-gradient(135deg, #C8B6E2, #D4C5E8)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
        margin: '0 auto 1.25rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: 'clamp(1.125rem, 3vw, 1.375rem)',
        fontWeight: '300',
        color: '#223848',
        marginBottom: '1rem',
        fontFamily: 'Didot, Georgia, serif',
        letterSpacing: '1.2px'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: '#223848',
        marginBottom: '1.25rem',
        lineHeight: '1.5',
        fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
        flexGrow: 1,
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
      }}>
        {description}
      </p>
      
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: '0 0 1.5rem 0',
        textAlign: 'left'
      }}>
        {features.map((feature, index) => (
          <li key={index} style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            color: '#223848',
            marginBottom: '0.5rem',
            lineHeight: '1.3',
            fontFamily: 'Avenir'
          }}>
            {feature}
          </li>
        ))}
      </ul>
      
      <div style={{ padding: '0 0.5rem' }}>
        <button onClick={onClick} style={{
          display: 'block',
          width: '100%',
          background: 'linear-gradient(135deg, #C8B6E2, #E2D5F0)',
          color: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          fontWeight: '600',
          transition: 'all 0.2s',
          textAlign: 'center',
          fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
          marginTop: 'auto',
          boxSizing: 'border-box',
          cursor: 'pointer',
          minHeight: '44px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          fontFamily: 'Avenir',
          letterSpacing: '1.2px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <p style={{color: '#223848'}}>{text}</p>
    </div>
  )
}

function HierarchyCard({ level, icon, features, color }) {
  return (
    <div className="rounded-xl p-6 border-2" style={{backgroundColor: color, borderColor: color}}>
      <div className="text-3xl mb-3 text-center">{icon}</div>
      <h4 className="font-bold text-center mb-4" style={{color: '#223848'}}>{level}</h4>
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

function OrganizationCard({ title, subtitle, features, icon, bgColor }) {
  return (
    <div className="rounded-2xl p-8" style={{backgroundColor: bgColor}}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
        {title}
      </h3>
      <p className="font-medium mb-6" style={{color: '#223848'}}>{subtitle}</p>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start" style={{color: '#223848'}}>
            <span className="mr-3 mt-0.5" style={{color: '#A1E5DB'}}>✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdminFeature({ icon, title, description }) {
  return (
    <div className="rounded-xl p-6 border" style={{backgroundColor: '#F0F2F4', borderColor: '#E5E8EB'}}>
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-3" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{color: '#223848'}}>
        {description}
      </p>
    </div>
  )
}

function MetricCard({ number, label, icon }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-4xl font-bold mb-2" style={{fontFamily: 'Didot, Georgia, serif', color: '#A1E5DB'}}>
        {number}
      </div>
      <p className="text-sm" style={{color: '#223848'}}>{label}</p>
    </div>
  )
}

function DifferencePoint({ title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-2xl mt-1" style={{color: '#A1E5DB'}}>✨</span>
      <div>
        <h4 className="font-semibold mb-1" style={{color: '#223848'}}>{title}</h4>
        <p className="text-sm" style={{color: '#223848'}}>{description}</p>
      </div>
    </div>
  )
}

function CTABox({ title, action, link }) {
  return (
    <a 
      href={link}
      className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4 hover:bg-white/30 transition-all block"
    >
      <p className="text-white/90 text-sm mb-2">{title}</p>
      <p className="text-white font-semibold">{action} →</p>
    </a>
  )
}
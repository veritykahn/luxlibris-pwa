// pages/home/classroom-reading.js
import Layout from '../../components/Layout'
import Link from 'next/link'

export default function ClassroomReading() {
  return (
    <Layout 
      title="Classroom Reading Program - Lux Libris" 
      description="Build daily reading habits with our classroom management system. 20+ minutes of daily reading, parent sign-off, and year-round engagement."
    >
      {/* Hero Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-coral-100 to-peach-100 px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-semibold" style={{color: '#FFAB91'}}>
                Coming 2026-2027 School Year
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Build Daily
              <span style={{
                background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {" "}Reading Habits
              </span>
            </h1>
            <p className="text-xl leading-relaxed max-w-3xl mx-auto" style={{color: '#223848'}}>
              The Classroom Reading program helps teachers track and encourage 
              daily reading habits, with built-in parent engagement and 
              gamified motivation for every student.
            </p>
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Perfect for Classroom Teachers
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="font-bold mb-2" style={{color: '#223848'}}>Any Books</h3>
              <p className="text-sm" style={{color: '#223848'}}>
                Works with your existing curriculum or independent reading choices
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="font-bold mb-2" style={{color: '#223848'}}>20+ Minutes</h3>
              <p className="text-sm" style={{color: '#223848'}}>
                Daily reading goal with built-in healthy habits timer
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-4xl mb-4">👨‍👩‍👧</div>
              <h3 className="font-bold mb-2" style={{color: '#223848'}}>Parent Sign-Off</h3>
              <p className="text-sm" style={{color: '#223848'}}>
                Built-in accountability with easy parent verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            How Classroom Reading Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                For Teachers
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Quick Setup</h4>
                    <p style={{color: '#223848'}}>
                      Join with your school's teacher code and create your class 
                      in minutes. No complex configuration needed.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Distribute Codes</h4>
                    <p style={{color: '#223848'}}>
                      Give students their unique join codes. Parents get separate 
                      codes for sign-off access and progress viewing.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Monitor Progress</h4>
                    <p style={{color: '#223848'}}>
                      See real-time dashboards of who's reading, when they're reading, 
                      and parent verification status.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Celebrate Success</h4>
                    <p style={{color: '#223848'}}>
                      Weekly reports, achievement celebrations, and easy parent 
                      communication tools keep everyone engaged.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                For Students
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-coral-100 to-peach-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Choose Any Book</h4>
                    <p style={{color: '#223848'}}>
                      Read what you love! Track progress with any physical book, 
                      audiobook, or e-book from any source.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-mint-100 to-seafoam-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Start Timer</h4>
                    <p style={{color: '#223848'}}>
                      Use the Healthy Habits timer for 20+ minute reading sessions. 
                      Build streaks and earn achievements!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-lavender-100 to-purple-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Parent Sign-Off</h4>
                    <p style={{color: '#223848'}}>
                      Parents verify reading sessions with a simple tap. No more 
                      paper reading logs to lose!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-coral-100 to-peach-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2" style={{color: '#223848'}}>Unlock Saints</h4>
                    <p style={{color: '#223848'}}>
                      Reading streaks unlock Luxlings™ saints. Collect them all 
                      through consistent daily reading!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Powerful Features for Real Classrooms
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📊"
              title="Real-Time Analytics"
              description="See who's reading, when they're reading, and track weekly trends across your entire class."
              color="#C3E0DE"
            />
            
            <FeatureCard
              icon="🎯"
              title="Custom Goals"
              description="Set different reading targets for different students. Support struggling readers while challenging advanced ones."
              color="#ADD4EA"
            />
            
            <FeatureCard
              icon="🏅"
              title="Weekly Challenges"
              description="Automatic weekly challenges keep students motivated. Class vs. class competitions drive engagement."
              color="#FFC4A3"
            />
            
            <FeatureCard
              icon="📱"
              title="Parent App"
              description="Parents track progress, sign off on reading, and get notifications about their child's achievements."
              color="#E6D9F2"
            />
            
            <FeatureCard
              icon="⏱️"
              title="Healthy Habits Timer"
              description="Built-in timer promotes focused reading sessions with movement breaks. No app switching allowed!"
              color="#A1E5DB"
            />
            
            <FeatureCard
              icon="⛪"
              title="Saints Integration"
              description="Reading streaks unlock Luxlings™ saints. Perfect for Catholic identity formation."
              color="#D4C5E8"
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Two Programs, One Platform
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Lux Libris Award */}
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Lux Libris Award
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="mr-3" style={{color: '#A1E5DB'}}>✓</span>
                  <p style={{color: '#223848'}}>20 curated Catholic books annually</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: '#A1E5DB'}}>✓</span>
                  <p style={{color: '#223848'}}>Perfect for school libraries</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: '#A1E5DB'}}>✓</span>
                  <p style={{color: '#223848'}}>June-March reading calendar</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: '#A1E5DB'}}>✓</span>
                  <p style={{color: '#223848'}}>Grades 4-8 focus</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: '#A1E5DB'}}>✓</span>
                  <p style={{color: '#223848'}}>Student voting for winners</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: '#A1E5DB'}}>✓</span>
                  <p style={{color: '#223848'}}>Quiz-based completion</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t" style={{borderColor: '#A1E5DB'}}>
                <p className="font-semibold" style={{color: '#223848'}}>Available Now</p>
              </div>
            </div>
            
            {/* Classroom Reading */}
            <div className="rounded-3xl p-8 border-2" style={{background: 'linear-gradient(to bottom right, #FFAB91, #FFC4A3)', borderColor: '#FFAB91'}}>
              <h3 className="text-2xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Classroom Reading
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="mr-3" style={{color: 'white'}}>✓</span>
                  <p style={{color: '#223848'}}>Any books from any source</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: 'white'}}>✓</span>
                  <p style={{color: '#223848'}}>Perfect for classroom teachers</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: 'white'}}>✓</span>
                  <p style={{color: '#223848'}}>Year-round daily tracking</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: 'white'}}>✓</span>
                  <p style={{color: '#223848'}}>All grade levels</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: 'white'}}>✓</span>
                  <p style={{color: '#223848'}}>Parent sign-off system</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-3" style={{color: 'white'}}>✓</span>
                  <p style={{color: '#223848'}}>Time-based tracking</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t" style={{borderColor: 'rgba(255, 171, 145, 0.5)'}}>
                <p className="font-semibold" style={{color: '#223848'}}>Pilot: 2026-2027</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-lg" style={{color: '#223848'}}>
              Schools can choose one or both programs based on their needs!
            </p>
          </div>
        </div>
      </section>

      {/* Teacher Testimonial Preview */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="text-5xl mb-6">👩‍🏫</div>
            <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Built by Teachers, for Teachers
            </h3>
            <p className="text-lg mb-6 italic" style={{color: '#223848'}}>
              "Finally, a reading tracker that actually works in real classrooms! 
              No more lost paper logs, no more manual calculations. I can see at 
              a glance who's reading and celebrate their success immediately."
            </p>
            <p className="font-semibold" style={{color: '#223848'}}>
              - Early Beta Tester, 4th Grade Teacher
            </p>
          </div>
        </div>
      </section>

      {/* Pilot Program CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-coral-50 to-peach-50 rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Join the Classroom Reading
              <span style={{
                background: 'linear-gradient(to right, #FFAB91, #FFC4A3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {" "}Pilot Program
              </span>
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{color: '#223848'}}>
              We're looking for innovative teachers to help shape the future 
              of classroom reading management. Pilot participants get:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-2" style={{color: '#223848'}}>Free Access</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  Full program access for the entire 2026-2027 school year
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-2" style={{color: '#223848'}}>Direct Input</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  Monthly feedback sessions with our development team
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-2" style={{color: '#223848'}}>Early Features</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  Be first to try new features and enhancements
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-2" style={{color: '#223848'}}>Recognition</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  Founding teacher status and success story opportunities
                </p>
              </div>
            </div>
            
            <Link href="/contact">
              <button className="bg-gradient-to-r from-coral-500 to-peach-500 hover:from-coral-600 hover:to-peach-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                Apply for Pilot Program
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Coming Soon Timeline */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Development Timeline
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <TimelineItem
                date="Now - Spring 2026"
                title="Development & Testing"
                description="Building core features with teacher input"
                active={true}
              />
              
              <TimelineItem
                date="Summer 2026"
                title="Pilot Applications Open"
                description="Select teachers invited to participate"
                active={false}
              />
              
              <TimelineItem
                date="Fall 2026"
                title="Pilot Launch"
                description="Live testing in real classrooms"
                active={false}
              />
              
              <TimelineItem
                date="2027-2028"
                title="Full Launch"
                description="Available to all Lux Libris schools"
                active={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Questions About Classroom Reading?
          </h2>
          <p className="text-xl mb-8" style={{color: '#223848'}}>
            We'd love to hear from teachers interested in daily reading management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                Contact Us
              </button>
            </Link>
            
            <Link href="/for-schools">
              <button className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all">
                Learn About All Programs
              </button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

// Supporting Components
function FeatureCard({ icon, title, description, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="rounded-xl p-4 mb-4 flex items-center justify-center" 
           style={{backgroundColor: color}}>
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="font-bold mb-3" style={{color: '#223848'}}>
        {title}
      </h3>
      <p className="text-sm" style={{color: '#223848'}}>
        {description}
      </p>
    </div>
  )
}

function TimelineItem({ date, title, description, active }) {
  return (
    <div className={`flex items-start ${active ? '' : 'opacity-60'}`}>
      <div className={`rounded-full p-3 mr-4 flex-shrink-0 ${
        active 
          ? 'bg-gradient-to-br from-coral-500 to-peach-500' 
          : 'bg-gray-300'
      }`}>
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </div>
      <div className="text-left">
        <p className="font-semibold text-sm mb-1" style={{color: active ? '#FFAB91' : '#999'}}>
          {date}
        </p>
        <h4 className="font-bold mb-1" style={{color: '#223848'}}>
          {title}
        </h4>
        <p className="text-sm" style={{color: '#223848'}}>
          {description}
        </p>
      </div>
    </div>
  )
}
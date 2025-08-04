// pages/home/licensing-inquiries.js
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function LicensingInquiries() {
  const [selectedTier, setSelectedTier] = useState('school')

  return (
    <Layout 
      title="Licensing Inquiries - Lux Libris" 
      description="License Lux Libris for your Catholic school or diocese. Flexible pricing tiers and comprehensive support for your reading program."
    >
      {/* Hero Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Bring Lux Libris to Your
              <span style={{
                background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {" "}Catholic Community
              </span>
            </h1>
            <p className="text-xl leading-relaxed max-w-3xl mx-auto" style={{color: '#223848'}}>
              Transform your reading program with our comprehensive platform. 
              Built by Catholic educators, for Catholic schools.
            </p>
          </div>
        </div>
      </section>

      {/* Licensing Options */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Flexible Licensing Options
          </h2>
          <p className="text-center mb-12" style={{color: '#223848'}}>
            Choose the plan that best fits your organization&apos;s needs
          </p>
          
          {/* Tier Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={() => setSelectedTier('school')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedTier === 'school' 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              style={selectedTier === 'school' ? {backgroundColor: '#A1E5DB'} : {}}
            >
              Single School
            </button>
            <button
              onClick={() => setSelectedTier('diocese')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedTier === 'diocese' 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              style={selectedTier === 'diocese' ? {backgroundColor: '#A1E5DB'} : {}}
            >
              Diocese/Multi-School
            </button>
            <button
              onClick={() => setSelectedTier('library')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedTier === 'library' 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              style={selectedTier === 'library' ? {backgroundColor: '#A1E5DB'} : {}}
            >
              Library System
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="max-w-4xl mx-auto">
            {selectedTier === 'school' && (
              <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full mb-4">
                    <span className="text-3xl">🏫</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                    Single School License
                  </h3>
                  <p className="text-lg mb-4" style={{color: '#223848'}}>
                    Perfect for individual Catholic schools ready to transform their reading culture
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h4 className="font-bold" style={{color: '#223848'}}>Everything you need:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Unlimited teacher accounts
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Unlimited student accounts
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Access to all 20 annual book nominees
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Complete Luxlings™ saints collection (234 saints)
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Parent app access (basic features free)
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Real-time analytics dashboard
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Customizable achievement tiers
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Priority email support
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Professional development resources
                    </li>
                  </ul>
                </div>
                
                <div className="text-center pt-6 border-t" style={{borderColor: '#E5E8EB'}}>
                  <Link href="/contact">
                    <button className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{backgroundColor: '#A1E5DB'}}>
                      Request Pricing
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {selectedTier === 'diocese' && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                      <span className="text-3xl">⛪</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                      Diocese & Multi-School Licensing
                    </h3>
                    <p className="mb-4" style={{color: '#223848'}}>
                      Volume pricing for multiple schools under one administration
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-6 rounded-xl" style={{backgroundColor: '#F5EBDC'}}>
                      <h4 className="font-bold mb-2" style={{color: '#223848'}}>Small Diocese</h4>
                      <p className="text-lg font-semibold mb-2" style={{color: '#4A8B7C'}}>2-5 Schools</p>
                      <p className="text-sm" style={{color: '#223848'}}>Ideal for smaller dioceses</p>
                    </div>
                    <div className="text-center p-6 rounded-xl" style={{backgroundColor: '#E6D9F2'}}>
                      <h4 className="font-bold mb-2" style={{color: '#223848'}}>Medium Diocese</h4>
                      <p className="text-lg font-semibold mb-2" style={{color: '#8B6DB2'}}>6-15 Schools</p>
                      <p className="text-sm" style={{color: '#223848'}}>Most popular tier</p>
                    </div>
                    <div className="text-center p-6 rounded-xl" style={{backgroundColor: '#C3E0DE'}}>
                      <h4 className="font-bold mb-2" style={{color: '#223848'}}>Large Diocese</h4>
                      <p className="text-lg font-semibold mb-2" style={{color: '#4A8B7C'}}>16+ Schools</p>
                      <p className="text-sm" style={{color: '#223848'}}>Enterprise solutions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold" style={{color: '#223848'}}>Diocese benefits include:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start" style={{color: '#223848'}}>
                        <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                        Centralized administration dashboard
                      </li>
                      <li className="flex items-start" style={{color: '#223848'}}>
                        <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                        Cross-school analytics and reporting
                      </li>
                      <li className="flex items-start" style={{color: '#223848'}}>
                        <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                        Bulk user management tools
                      </li>
                      <li className="flex items-start" style={{color: '#223848'}}>
                        <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                        Dedicated implementation specialist
                      </li>
                      <li className="flex items-start" style={{color: '#223848'}}>
                        <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                        Custom professional development sessions
                      </li>
                      <li className="flex items-start" style={{color: '#223848'}}>
                        <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                        Volume discount pricing
                      </li>
                    </ul>
                  </div>
                  
                  <div className="text-center pt-6 mt-6 border-t" style={{borderColor: '#E5E8EB'}}>
                    <Link href="/contact">
                      <button className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{backgroundColor: '#A1E5DB'}}>
                        Get Custom Quote
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {selectedTier === 'library' && (
              <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full mb-4">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                    Library System License
                  </h3>
                  <p className="text-lg mb-4" style={{color: '#223848'}}>
                    Tailored solutions for public libraries serving Catholic communities
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h4 className="font-bold" style={{color: '#223848'}}>Flexible features:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Patron-based access model
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Integration with library card systems
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Community reading programs
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Branch management capabilities
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Custom achievement systems
                    </li>
                    <li className="flex items-start" style={{color: '#223848'}}>
                      <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                      Flexible program options
                    </li>
                  </ul>
                </div>
                
                <div className="text-center pt-6 border-t" style={{borderColor: '#E5E8EB'}}>
                  <Link href="/contact">
                    <button className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{backgroundColor: '#A1E5DB'}}>
                      Discuss Options
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            What Every License Includes
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📖</span>
              </div>
              <h3 className="font-bold mb-3" style={{color: '#223848'}}>
                Complete Reading Programs
              </h3>
              <p style={{color: '#223848'}}>
                Access to both the Lux Libris Award program (20 curated books) and 
                the upcoming Classroom Reading daily habits tracker.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⛪</span>
              </div>
              <h3 className="font-bold mb-3" style={{color: '#223848'}}>
                234 Luxlings™ Saints
              </h3>
              <p style={{color: '#223848'}}>
                Complete collection of exclusive saint characters with feast days, 
                stories, and virtue lessons that students unlock through reading.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="font-bold mb-3" style={{color: '#223848'}}>
                Comprehensive Analytics
              </h3>
              <p style={{color: '#223848'}}>
                Real-time dashboards showing student progress, engagement metrics, 
                and reading trends to inform your educational decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Support */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Implementation & Support
          </h2>
          
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h3 className="text-xl font-bold mb-6" style={{color: '#223848'}}>
              We&apos;re with you every step of the way
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-full p-3 mr-4">
                  <span className="text-2xl font-bold" style={{color: '#223848'}}>1</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2" style={{color: '#223848'}}>Initial Setup</h4>
                  <p style={{color: '#223848'}}>
                    Dedicated onboarding specialist helps configure your program, 
                    set up administrator accounts, and customize achievement tiers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-3 mr-4">
                  <span className="text-2xl font-bold" style={{color: '#223848'}}>2</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2" style={{color: '#223848'}}>Teacher Training</h4>
                  <p style={{color: '#223848'}}>
                    Professional development sessions (virtual or in-person) to ensure 
                    your educators are confident using all platform features.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full p-3 mr-4">
                  <span className="text-2xl font-bold" style={{color: '#223848'}}>3</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2" style={{color: '#223848'}}>Launch Support</h4>
                  <p style={{color: '#223848'}}>
                    Marketing materials, parent communications templates, and student 
                    onboarding resources to ensure a successful program launch.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-full p-3 mr-4">
                  <span className="text-2xl font-bold" style={{color: '#223848'}}>4</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2" style={{color: '#223848'}}>Ongoing Success</h4>
                  <p style={{color: '#223848'}}>
                    Regular check-ins, quarterly webinars, and priority support ensure 
                    your reading program continues to thrive throughout the year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Program */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Join Our Pilot Program
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{color: '#223848'}}>
              Be among the first schools to transform your reading culture. 
              Special pricing and exclusive benefits for pilot participants.
            </p>
            
            <div className="bg-white rounded-xl p-6 mb-6">
              <h3 className="font-bold mb-3" style={{color: '#223848'}}>
                Pilot Program Benefits:
              </h3>
              <ul className="space-y-2 text-left max-w-md mx-auto">
                <li style={{color: '#223848'}}>• Special pilot pricing</li>
                <li style={{color: '#223848'}}>• Direct input on feature development</li>
                <li style={{color: '#223848'}}>• Exclusive saint collections</li>
                <li style={{color: '#223848'}}>• Case study partnership opportunities</li>
                <li style={{color: '#223848'}}>• Founding member recognition</li>
              </ul>
            </div>
            
            <Link href="/contact">
              <button className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:opacity-90" style={{backgroundColor: '#A1E5DB'}}>
                Learn About Pilot Program
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Ready to Transform Your
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Reading Program?
            </span>
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{color: '#223848'}}>
            Let&apos;s discuss how Lux Libris can support your educational mission.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <button className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:opacity-90" style={{backgroundColor: '#A1E5DB'}}>
                Request a Demo
              </button>
            </Link>
            
            <a href="mailto:licensing@luxlibris.org">
              <button className="border-2 px-8 py-4 rounded-full text-lg font-semibold transition-all hover:text-white" 
                      style={{borderColor: '#A1E5DB', color: '#A1E5DB'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#A1E5DB'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                Contact Sales
              </button>
            </a>
          </div>
          
          <p className="mt-8 text-sm" style={{color: '#223848'}}>
            Questions? Email us at{" "}
            <a href="mailto:licensing@luxlibris.org" className="underline" style={{color: '#A1E5DB'}}>
              licensing@luxlibris.org
            </a>
            {" "}or call 1-800-LUX-READ
          </p>
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  )
}
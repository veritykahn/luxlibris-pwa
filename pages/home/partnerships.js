// pages/home/partnerships.js
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function Partnerships() {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    partnershipType: '',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Form submission logic would go here
    // For now, we'll use a mailto link approach
    const subject = `Partnership Inquiry - ${formData.partnershipType}`
    const body = `Name: ${formData.name}%0D%0AOrganization: ${formData.organization}%0D%0AEmail: ${formData.email}%0D%0APartnership Type: ${formData.partnershipType}%0D%0A%0D%0AMessage:%0D%0A${formData.message}`
    window.location.href = `mailto:partnerships@luxlibris.org?subject=${subject}&body=${body}`
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <Layout 
      title="Partnerships - Lux Libris" 
      description="Partner with Lux Libris to transform Catholic education through reading. Join publishers, organizations, and technology partners in our mission."
    >
      {/* Hero Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Partner With
              <span style={{
                background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {" "}Lux Libris
              </span>
            </h1>
            <p className="text-xl leading-relaxed max-w-3xl mx-auto" style={{color: '#223848'}}>
              Join us in our mission to form saints through reading. We're building 
              partnerships that strengthen Catholic education and inspire young readers.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Partnership Opportunities
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Publisher Partnerships */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Catholic Publishers
              </h3>
              <p className="mb-6 leading-relaxed" style={{color: '#223848'}}>
                Connect your books with thousands of Catholic school students. Our curated 
                annual list showcases the best in Catholic children's literature.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Annual book nominations for our award program
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Direct access to Catholic school market
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Reader analytics and engagement data
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Co-marketing opportunities
                </li>
              </ul>
            </div>

            {/* Reading List Partners */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">📖</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Reading List Organizations
              </h3>
              <p className="mb-6 leading-relaxed" style={{color: '#223848'}}>
                Bring your curated reading lists to our platform. We'll create quizzes, 
                integrate achievements, and help schools implement your program.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Custom quiz creation for your book lists
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Achievement system integration
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Multi-program support on one platform
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Analytics for program effectiveness
                </li>
              </ul>
            </div>

            {/* Educational Organizations */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Educational Organizations
              </h3>
              <p className="mb-6 leading-relaxed" style={{color: '#223848'}}>
                Collaborate to enhance Catholic education through innovative reading programs 
                that combine faith formation with literacy development.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Diocese-wide implementation support
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Professional development opportunities
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Curriculum alignment assistance
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Research collaboration on reading outcomes
                </li>
              </ul>
            </div>

            {/* Technology Partners */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">💻</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Technology Partners
              </h3>
              <p className="mb-6 leading-relaxed" style={{color: '#223848'}}>
                Help us build the future of educational technology with innovative solutions 
                that engage young readers and support educators.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Integration opportunities
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  API access for compatible platforms
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Co-development of new features
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  White-label opportunities
                </li>
              </ul>
            </div>

            {/* Content Creators */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-coral-100 to-peach-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Content Creators
              </h3>
              <p className="mb-6 leading-relaxed" style={{color: '#223848'}}>
                Authors, illustrators, and content creators - bring your faith-based stories 
                to life through our platform and inspire the next generation.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Author spotlight features
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Virtual author visits program
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Saint illustration opportunities
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Educational content development
                </li>
              </ul>
            </div>

            {/* Future Expansion */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-mint-100 to-seafoam-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Future Opportunities
              </h3>
              <p className="mb-6 leading-relaxed" style={{color: '#223848'}}>
                As we grow, we're exploring partnerships for merchandise, physical products, 
                and expanded educational offerings.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Luxlings™ merchandise licensing
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Physical saint collectibles
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  Curriculum supplements
                </li>
                <li className="flex items-start" style={{color: '#223848'}}>
                  <span className="mr-3 font-bold" style={{color: '#4A8B7C'}}>✓</span>
                  International expansion
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Partnership Impact
          </h2>
          
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8 mb-8">
            <div className="text-center">
              <p className="text-5xl font-bold mb-4" style={{color: '#4A8B7C'}}>234</p>
              <p className="text-xl font-semibold mb-2" style={{color: '#223848'}}>
                Luxlings™ Saints Created
              </p>
              <p style={{color: '#223848'}}>
                Original artwork bringing Catholic saints to life for young readers
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold mb-2" style={{color: '#D65A3A'}}>20+</p>
              <p style={{color: '#223848'}}>Books Curated Annually</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold mb-2" style={{color: '#4E8AA8'}}>Growing</p>
              <p style={{color: '#223848'}}>Publisher Network</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold mb-2" style={{color: '#4A8B7C'}}>1000+</p>
              <p style={{color: '#223848'}}>Students Engaged</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Why Partner with Lux Libris?
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-3" style={{color: '#223848'}}>
                Mission-Aligned Impact
              </h3>
              <p style={{color: '#223848'}}>
                Join a movement that's transforming how Catholic schools approach reading, 
                combining faith formation with literacy in an engaging, gamified experience.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-3" style={{color: '#223848'}}>
                Growing Market Reach
              </h3>
              <p style={{color: '#223848'}}>
                Access thousands of Catholic school students, teachers, and families across 
                the United States through our expanding network of partner schools and dioceses.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-3" style={{color: '#223848'}}>
                Innovation in Education
              </h3>
              <p style={{color: '#223848'}}>
                Be part of the cutting edge in educational technology, where gamification 
                meets faith-based learning to create unprecedented engagement.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-3" style={{color: '#223848'}}>
                Data-Driven Success
              </h3>
              <p style={{color: '#223848'}}>
                Leverage our comprehensive analytics to understand reader engagement, 
                optimize content, and demonstrate impact to stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-6" 
                style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Start the Conversation
            </h2>
            <p className="text-center mb-8" style={{color: '#223848'}}>
              Tell us about your partnership ideas and how we can work together.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block mb-2 font-semibold" style={{color: '#223848'}}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{borderColor: '#E5E8EB', focusRingColor: '#A1E5DB'}}
                  />
                </div>
                
                <div>
                  <label htmlFor="organization" className="block mb-2 font-semibold" style={{color: '#223848'}}>
                    Organization *
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{borderColor: '#E5E8EB', focusRingColor: '#A1E5DB'}}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-2 font-semibold" style={{color: '#223848'}}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{borderColor: '#E5E8EB', focusRingColor: '#A1E5DB'}}
                />
              </div>
              
              <div>
                <label htmlFor="partnershipType" className="block mb-2 font-semibold" style={{color: '#223848'}}>
                  Partnership Type *
                </label>
                <select
                  id="partnershipType"
                  name="partnershipType"
                  required
                  value={formData.partnershipType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{borderColor: '#E5E8EB', focusRingColor: '#A1E5DB'}}
                >
                  <option value="">Select a partnership type</option>
                  <option value="Publisher">Catholic Publisher</option>
                  <option value="Reading List">Reading List Organization</option>
                  <option value="Educational">Educational Organization</option>
                  <option value="Technology">Technology Partner</option>
                  <option value="Content Creator">Content Creator</option>
                  <option value="Other">Other Partnership</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block mb-2 font-semibold" style={{color: '#223848'}}>
                  Tell us about your partnership ideas *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{borderColor: '#E5E8EB', focusRingColor: '#A1E5DB'}}
                  placeholder="Describe your organization and how you'd like to partner with Lux Libris..."
                />
              </div>
              
              <div className="text-center pt-4">
                <button 
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Send Partnership Inquiry
                </button>
              </div>
            </form>
            
            <p className="text-center mt-6 text-sm" style={{color: '#666'}}>
              Or email us directly at{" "}
              <a href="mailto:partnerships@luxlibris.org" className="text-teal-600 underline">
                partnerships@luxlibris.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" 
              style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Let's Build Something
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Amazing Together
            </span>
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{color: '#223848'}}>
            Ready to explore partnership opportunities? We'd love to hear from you.
          </p>
          
          <Link href="/licensing-inquiries">
            <button className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all">
              Learn About Licensing
            </button>
          </Link>
        </div>
      </section>
    </Layout>
  )
}
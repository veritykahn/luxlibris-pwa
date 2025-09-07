// pages/home/partnerships.js - Updated with Real Email Integration
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

// Success Modal Component
const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🤝</span>
        </div>
        <h3 className="text-2xl font-bold mb-4 text-gray-800" 
            style={{fontFamily: 'Didot, Georgia, serif'}}>
          Partnership Inquiry Sent!
        </h3>
        <p className="text-gray-700 mb-6">
          Thank you for your partnership inquiry! We'll review your submission and get back to you within 3-5 business days.
        </p>
        <button
          onClick={onClose}
          className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90"
          style={{backgroundColor: '#A1E5DB'}}
        >
          Submit Another Inquiry
        </button>
      </div>
    </div>
  )
}

export default function Partnerships() {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    partnershipType: '',
    message: ''
  })
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    submitting: false,
    error: null
  })

  const [showModal, setShowModal] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormStatus({ submitted: false, submitting: true, error: null })
    
    try {
      // Format the email content
      const emailSubject = `New Partnership Inquiry: ${formData.partnershipType} from ${formData.organization}`
      
      const emailText = `
New Partnership Inquiry

Name: ${formData.name}
Organization: ${formData.organization}
Email: ${formData.email}
Partnership Type: ${formData.partnershipType}

Message:
${formData.message}

---
Submitted: ${new Date().toLocaleString()}
      `.trim()

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #223848;">New Partnership Inquiry</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Organization:</strong> ${formData.organization}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Partnership Type:</strong> ${formData.partnershipType}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <p><strong>Partnership Ideas:</strong></p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #A1E5DB; margin-top: 10px;">
              ${formData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Submitted: ${new Date().toLocaleString()}
          </p>
        </div>
      `

      // Send the email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'partnerships@luxlibris.org',
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
          fromAccount: 'noreply'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      // Show success modal
      setFormStatus({ submitted: true, submitting: false, error: null })
      setShowModal(true)
      
    } catch (error) {
      console.error('Email sending error:', error)
      setFormStatus({ 
        submitted: false, 
        submitting: false, 
        error: 'Something went wrong. Please try again or email us directly at partnerships@luxlibris.org' 
      })
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleModalClose = () => {
    setShowModal(false)
    setFormData({
      name: '',
      organization: '',
      email: '',
      partnershipType: '',
      message: ''
    })
    setFormStatus({ submitted: false, submitting: false, error: null })
  }

  return (
    <Layout 
      title="Partnerships - Lux Libris" 
      description="Partner with Lux Libris to transform Catholic education through reading. Join publishers, organizations, and technology partners in our mission."
    >
      {/* Success Modal */}
      <SuccessModal 
        isOpen={showModal} 
        onClose={handleModalClose} 
      />

      {/* Hero Section */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800" 
                style={{fontFamily: 'Didot, Georgia, serif'}}>
              Partner With
              <span style={{
                background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {" "}Lux Libris
              </span>
            </h1>
            <p className="text-xl leading-relaxed max-w-3xl mx-auto text-gray-700">
              Join us in our mission to form saints through reading. We&apos;re building 
              partnerships that strengthen Catholic education and inspire young readers.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="px-6 py-20 bg-orange-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800" 
              style={{fontFamily: 'Didot, Georgia, serif'}}>
            Partnership Opportunities
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Publisher Partnerships */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-blue-100 to-emerald-50 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Catholic Publishers
              </h3>
              <p className="mb-6 leading-relaxed text-gray-700">
                Connect your books with thousands of Catholic school students. Our curated 
                annual list showcases the best in Catholic children&apos;s literature.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Annual book nominations for our award program
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Direct access to Catholic school market
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Reader analytics and engagement data
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Co-marketing opportunities
                </li>
              </ul>
            </div>

            {/* Reading List Partners */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">📖</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Reading List Organizations
              </h3>
              <p className="mb-6 leading-relaxed text-gray-700">
                Bring your curated reading lists to our platform. We&apos;ll create quizzes, 
                integrate achievements, and help schools implement your program.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Custom quiz creation for your book lists
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Achievement system integration
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Multi-program support on one platform
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Analytics for program effectiveness
                </li>
              </ul>
            </div>

            {/* Educational Organizations */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Educational Organizations
              </h3>
              <p className="mb-6 leading-relaxed text-gray-700">
                Collaborate to enhance Catholic education through innovative reading programs 
                that combine faith formation with literacy development.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Diocese-wide implementation support
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Professional development opportunities
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Curriculum alignment assistance
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Research collaboration on reading outcomes
                </li>
              </ul>
            </div>

            {/* Technology Partners */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">💻</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Technology Partners
              </h3>
              <p className="mb-6 leading-relaxed text-gray-700">
                Help us build the future of educational technology with innovative solutions 
                that engage young readers and support educators.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Integration opportunities
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  API access for compatible platforms
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Co-development of new features
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  White-label opportunities
                </li>
              </ul>
            </div>

            {/* Content Creators */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Content Creators
              </h3>
              <p className="mb-6 leading-relaxed text-gray-700">
                Authors, illustrators, and content creators - bring your faith-based stories 
                to life through our platform and inspire the next generation.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Author spotlight features
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Virtual author visits program
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Saint illustration opportunities
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Educational content development
                </li>
              </ul>
            </div>

            {/* Future Expansion */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl p-4 mb-6 w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Future Opportunities
              </h3>
              <p className="mb-6 leading-relaxed text-gray-700">
                As we grow, we&apos;re exploring partnerships for merchandise, physical products, 
                and expanded educational offerings.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Luxlings™ merchandise licensing
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Physical saint collectibles
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  Curriculum supplements
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="mr-3 font-bold" style={{color: '#A1E5DB'}}>✓</span>
                  International expansion
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800" 
              style={{fontFamily: 'Didot, Georgia, serif'}}>
            Why Partner with Lux Libris?
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Mission-Aligned Impact
              </h3>
              <p className="text-gray-700">
                Join a movement that&apos;s transforming how Catholic schools approach reading, 
                combining faith formation with literacy in an engaging, gamified experience.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Growing Market Reach
              </h3>
              <p className="text-gray-700">
                Access thousands of Catholic school students, teachers, and families across 
                the United States through our expanding network of partner schools and dioceses.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Innovation in Education
              </h3>
              <p className="text-gray-700">
                Be part of the cutting edge in educational technology, where gamification 
                meets faith-based learning to create unprecedented engagement.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Data-Driven Success
              </h3>
              <p className="text-gray-700">
                Leverage our comprehensive analytics to understand reader engagement, 
                optimize content, and demonstrate impact to stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800" 
                style={{fontFamily: 'Didot, Georgia, serif'}}>
              Start the Conversation
            </h2>
            <p className="text-center mb-8 text-gray-700">
              Tell us about your partnership ideas and how we can work together.
            </p>
            
            {/* Error Message */}
            {formStatus.error && (
              <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-800 text-center">{formStatus.error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block mb-2 font-semibold text-gray-700">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={formStatus.submitting}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                  />
                </div>
                
                <div>
                  <label htmlFor="organization" className="block mb-2 font-semibold text-gray-700">
                    Organization *
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    disabled={formStatus.submitting}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={formStatus.submitting}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                />
              </div>
              
              <div>
                <label htmlFor="partnershipType" className="block mb-2 font-semibold text-gray-700">
                  Partnership Type *
                </label>
                <select
                  id="partnershipType"
                  name="partnershipType"
                  required
                  value={formData.partnershipType}
                  onChange={handleChange}
                  disabled={formStatus.submitting}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
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
                <label htmlFor="message" className="block mb-2 font-semibold text-gray-700">
                  Tell us about your partnership ideas *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={formStatus.submitting}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                  placeholder="Describe your organization and how you'd like to partner with Lux Libris..."
                />
              </div>
              
              <div className="text-center pt-4">
                <button 
                  type="submit"
                  disabled={formStatus.submitting}
                  className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: formStatus.submitting ? '#9CA3AF' : '#A1E5DB'
                  }}
                >
                  {formStatus.submitting ? 'Sending...' : 'Send Partnership Inquiry'}
                </button>
              </div>
            </form>
            
            <p className="text-center mt-6 text-sm text-gray-600">
              Or email us directly at{" "}
              <a href="mailto:partnerships@luxlibris.org" className="font-semibold hover:underline" style={{color: '#A1E5DB'}}>
                partnerships@luxlibris.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800" 
              style={{fontFamily: 'Didot, Georgia, serif'}}>
            Let&apos;s Build Something
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Amazing Together
            </span>
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700">
            Ready to explore partnership opportunities? We&apos;d love to hear from you.
          </p>
        </div>
      </section>
    </Layout>
  )
}
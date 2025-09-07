// pages/home/licensing-inquiries.js - Updated with Real Email Integration
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, licenseType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎓</span>
        </div>
        <h3 className="text-2xl font-bold mb-4 text-gray-800" 
            style={{fontFamily: 'Didot, Georgia, serif'}}>
          Licensing Inquiry Sent!
        </h3>
        <p className="text-gray-700 mb-6">
          Thank you for your interest in {licenseType}! Our team will review your inquiry and 
          get back to you within 24-48 hours with pricing and next steps.
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

// Contact Form Component
const ContactForm = ({ selectedTier, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    studentCount: '',
    schoolCount: '',
    message: '',
    phone: '',
    timeline: ''
  })
  
  const [formStatus, setFormStatus] = useState({
    submitting: false,
    error: null
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormStatus({ submitting: true, error: null })
    
    try {
      // Format the email content based on selected tier
      const emailSubject = `New ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} License Inquiry from ${formData.organization || formData.name}`
      
      const emailText = `
New Licensing Inquiry

License Type: ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
Name: ${formData.name}
Email: ${formData.email}
Organization: ${formData.organization}
Role: ${formData.role}
Phone: ${formData.phone || 'Not provided'}
${selectedTier === 'school' ? `Student Count: ${formData.studentCount || 'Not provided'}` : ''}
${selectedTier === 'diocese' ? `School Count: ${formData.schoolCount || 'Not provided'}` : ''}
Timeline: ${formData.timeline || 'Not provided'}

Message:
${formData.message}

---
Submitted: ${new Date().toLocaleString()}
      `.trim()

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #223848;">New Licensing Inquiry</h2>
          
          <div style="background-color: #A1E5DB; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0;">${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} License</h3>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Organization:</strong> ${formData.organization}</p>
            <p><strong>Role:</strong> ${formData.role}</p>
            <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
            ${selectedTier === 'school' ? `<p><strong>Student Count:</strong> ${formData.studentCount || 'Not provided'}</p>` : ''}
            ${selectedTier === 'diocese' ? `<p><strong>School Count:</strong> ${formData.schoolCount || 'Not provided'}</p>` : ''}
            <p><strong>Timeline:</strong> ${formData.timeline || 'Not provided'}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <p><strong>Message:</strong></p>
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
          to: 'inquiries@luxlibris.org',
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
      setFormStatus({ submitting: false, error: null })
      onSuccess()
      
    } catch (error) {
      console.error('Email sending error:', error)
      setFormStatus({ 
        submitting: false, 
        error: 'Something went wrong. Please try again or email us directly at inquiries@luxlibris.org' 
      })
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-center mb-6 text-gray-800" 
          style={{fontFamily: 'Didot, Georgia, serif'}}>
        Request {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} License Information
      </h3>
      
      {/* Error Message */}
      {formStatus.error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
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
              placeholder="John Smith"
            />
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
              placeholder="john@school.edu"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="organization" className="block mb-2 font-semibold text-gray-700">
              {selectedTier === 'library' ? 'Library System' : 'School/Organization'} *
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
              placeholder={selectedTier === 'library' ? 'City Public Library' : 'St. Mary\'s Catholic School'}
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block mb-2 font-semibold text-gray-700">
              Your Role *
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              disabled={formStatus.submitting}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
            >
              <option value="">Select your role</option>
              <option value="Principal">Principal</option>
              <option value="Librarian">Librarian</option>
              <option value="Teacher">Teacher</option>
              <option value="Diocese Administrator">Diocese Administrator</option>
              <option value="IT Director">IT Director</option>
              <option value="Curriculum Director">Curriculum Director</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {selectedTier === 'school' && (
            <div>
              <label htmlFor="studentCount" className="block mb-2 font-semibold text-gray-700">
                Approximate Student Count
              </label>
              <select
                id="studentCount"
                name="studentCount"
                value={formData.studentCount}
                onChange={handleChange}
                disabled={formStatus.submitting}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
              >
                <option value="">Select student count</option>
                <option value="Under 100">Under 100</option>
                <option value="100-250">100-250</option>
                <option value="250-500">250-500</option>
                <option value="500-750">500-750</option>
                <option value="750+">750+</option>
              </select>
            </div>
          )}
          
          {selectedTier === 'diocese' && (
            <div>
              <label htmlFor="schoolCount" className="block mb-2 font-semibold text-gray-700">
                Number of Schools
              </label>
              <select
                id="schoolCount"
                name="schoolCount"
                value={formData.schoolCount}
                onChange={handleChange}
                disabled={formStatus.submitting}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
              >
                <option value="">Select school count</option>
                <option value="2-5 schools">2-5 schools</option>
                <option value="6-15 schools">6-15 schools</option>
                <option value="16+ schools">16+ schools</option>
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="phone" className="block mb-2 font-semibold text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={formStatus.submitting}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="timeline" className="block mb-2 font-semibold text-gray-700">
            Implementation Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            disabled={formStatus.submitting}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
          >
            <option value="">Select timeline</option>
            <option value="Immediately">Immediately</option>
            <option value="Within 30 days">Within 30 days</option>
            <option value="Next quarter">Next quarter</option>
            <option value="Next school year">Next school year</option>
            <option value="Just exploring options">Just exploring options</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="message" className="block mb-2 font-semibold text-gray-700">
            Questions or Additional Information *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            disabled={formStatus.submitting}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
            placeholder="Tell us about your goals, current reading programs, or any specific questions..."
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
            {formStatus.submitting ? 'Sending...' : 'Request Information'}
          </button>
        </div>
      </form>
      
      <p className="text-center mt-6 text-sm text-gray-600">
        Or call us directly at{" "}
        <a href="tel:1-800-589-7323" className="font-semibold hover:underline" style={{color: '#A1E5DB'}}>
          1-800-LUX-READ
        </a>
      </p>
    </div>
  )
}

export default function LicensingInquiries() {
  const [selectedTier, setSelectedTier] = useState('school')
  const [showModal, setShowModal] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)

  const handleFormSuccess = () => {
    setShowModal(true)
    setShowContactForm(false)
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const getTierDisplayName = (tier) => {
    switch (tier) {
      case 'school': return 'Single School License'
      case 'diocese': return 'Diocese License'
      case 'library': return 'Library System License'
      default: return 'License'
    }
  }

  return (
    <Layout 
      title="Licensing Inquiries - Lux Libris" 
      description="License Lux Libris for your Catholic school or diocese. Flexible pricing tiers and comprehensive support for your reading program."
    >
      {/* Success Modal */}
      <SuccessModal 
        isOpen={showModal} 
        onClose={handleModalClose} 
        licenseType={getTierDisplayName(selectedTier)}
      />

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

      {/* Contact Form Section (shows when contact form is open) */}
      {showContactForm && (
        <section className="px-6 py-20" style={{backgroundColor: '#F5EBDC'}}>
          <div className="max-w-3xl mx-auto">
            <ContactForm 
              selectedTier={selectedTier} 
              onSuccess={handleFormSuccess}
            />
          </div>
        </section>
      )}

      {/* Licensing Options (shows when contact form is closed) */}
      {!showContactForm && (
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
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
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
                        Complete Luxlings™ saints collection (227 saints)
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
                    <button 
                      onClick={() => setShowContactForm(true)}
                      className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90" 
                      style={{backgroundColor: '#A1E5DB'}}
                    >
                      Request Pricing
                    </button>
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
                      <button 
                        onClick={() => setShowContactForm(true)}
                        className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90" 
                        style={{backgroundColor: '#A1E5DB'}}
                      >
                        Get Custom Quote
                      </button>
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
                    <button 
                      onClick={() => setShowContactForm(true)}
                      className="text-white px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90" 
                      style={{backgroundColor: '#A1E5DB'}}
                    >
                      Discuss Options
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* What's Included - only show when contact form is closed */}
      {!showContactForm && (
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
                  227 Luxlings™ Saints
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
      )}

      {/* Implementation Support - only show when contact form is closed */}
      {!showContactForm && (
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
      )}

      {/* Pilot Program - only show when contact form is closed */}
      {!showContactForm && (
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
              
              <button 
                onClick={() => setShowContactForm(true)}
                className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:opacity-90" 
                style={{backgroundColor: '#A1E5DB'}}
              >
                Learn About Pilot Program
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - only show when contact form is closed */}
      {!showContactForm && (
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
              <button 
                onClick={() => setShowContactForm(true)}
                className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:opacity-90" 
                style={{backgroundColor: '#A1E5DB'}}
              >
                Request a Demo
              </button>
              
              <a href="mailto:inquiries@luxlibris.org">
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
              <a href="mailto:inquiries@luxlibris.org" className="underline" style={{color: '#A1E5DB'}}>
                inquiries@luxlibris.org
              </a>
              {" "}or call 1-800-LUX-READ
            </p>
          </div>
        </section>
      )}

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
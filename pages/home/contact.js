// pages/home/contact.js - CONTACT/SUPPORT PAGE with Lux Libris Mint Color
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    inquiryType: '',
    message: ''
  })
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    submitting: false,
    error: null
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormStatus({ submitted: false, submitting: true, error: null })
    
    // Simulate form submission with a delay
    try {
      // In a real implementation, you would send this to your API endpoint
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success message
      setFormStatus({ submitted: true, submitting: false, error: null })
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          organization: '',
          role: '',
          inquiryType: '',
          message: ''
        })
        setFormStatus({ submitted: false, submitting: false, error: null })
      }, 5000)
      
    } catch (error) {
      setFormStatus({ 
        submitted: false, 
        submitting: false, 
        error: 'Something went wrong. Please try again or email us directly.' 
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
    <Layout 
      title="Contact - Lux Libris Support" 
      description="Get in touch with Lux Libris. Technical support, school inquiries, partnership opportunities, and personalized demos available."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
            We&apos;re Here
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}to Help
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed text-gray-700">
            Whether you need technical support, want to learn more about bringing 
            Lux Libris to your school, or have partnership ideas, we&apos;d love to hear from you.
          </p>
          
          {/* Quick Links Section */}
          <div className="bg-gray-50 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-lg text-gray-700 mb-4">
              Need immediate assistance? Browse our{' '}
              <Link href="/home/help-center" className="font-semibold hover:opacity-80 transition-opacity" style={{color: '#A1E5DB'}}>
                FAQ and Help Center
              </Link>{' '}
              for quick answers to common questions, or fill out the form below and we&apos;ll respond within 24-48 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-3xl p-8 shadow-xl bg-white border border-gray-100">
            <h3 className="text-3xl font-bold text-center mb-8 text-gray-800" 
                style={{fontFamily: 'Didot, Georgia, serif'}}>
              Send Us a Message
            </h3>
            
            {/* Success Message */}
            {formStatus.submitted && (
              <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-green-800 text-center font-semibold">
                  ✓ Thank you for your message! We&apos;ll get back to you within {
                    formData.inquiryType === 'support' ? '24-48 hours' :
                    formData.inquiryType === 'pricing' || formData.inquiryType === 'demo' ? '24 hours' :
                    '3-5 business days'
                  }.
                </p>
              </div>
            )}
            
            {/* Error Message */}
            {formStatus.error && (
              <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-800 text-center">{formStatus.error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-700">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                    placeholder="John Smith"
                    disabled={formStatus.submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                    placeholder="john@school.edu"
                    disabled={formStatus.submitting}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold mb-2 text-gray-700">
                    School/Organization
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all text-gray-800"
                    placeholder="St. Mary's Catholic School"
                    disabled={formStatus.submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold mb-2 text-gray-700">
                    Your Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all text-gray-800"
                    disabled={formStatus.submitting}
                  >
                    <option value="">Select your role</option>
                    <option value="teacher">Teacher</option>
                    <option value="librarian">Librarian</option>
                    <option value="principal">Principal</option>
                    <option value="diocese">Diocese Administrator</option>
                    <option value="parent">Parent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="inquiryType" className="block text-sm font-semibold mb-2 text-gray-700">
                  Inquiry Type *
                </label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  required
                  value={formData.inquiryType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all text-gray-800"
                  disabled={formStatus.submitting}
                >
                  <option value="">Select inquiry type</option>
                  <option value="demo">Schedule a Demo</option>
                  <option value="pricing">Pricing Information</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="general">General Question</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2 text-gray-700">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all text-gray-800"
                  placeholder="Tell us how we can help..."
                  disabled={formStatus.submitting}
                />
              </div>
              
              <div className="text-center">
                <button
                  type="submit"
                  disabled={formStatus.submitting}
                  className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: formStatus.submitting ? '#9CA3AF' : '#A1E5DB'
                  }}
                >
                  {formStatus.submitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  )
}
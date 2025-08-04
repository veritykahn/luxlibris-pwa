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

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
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
      <section className="relative overflow-hidden py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            We&apos;re Here
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}to Help
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed" style={{color: '#223848'}}>
            Whether you need technical support, want to learn more about bringing 
            Lux Libris to your school, or have partnership ideas, we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <ContactCard
              icon="💬"
              title="Technical Support"
              email="support@luxlibris.org"
              description="For existing users needing help with the platform"
              responseTime="24-48 hours"
              topics={[
                "Account issues",
                "App troubleshooting", 
                "Feature questions",
                "Student/parent help"
              ]}
            />
            
            <ContactCard
              icon="🏫"
              title="School Inquiries"
              email="inquiries@luxlibris.org"
              description="For schools interested in joining Lux Libris"
              responseTime="24 hours"
              topics={[
                "Pricing information",
                "Pilot program details",
                "Implementation timeline",
                "Diocese coordination"
              ]}
            />
            
            <ContactCard
              icon="🤝"
              title="Partnerships"
              email="partnerships@luxlibris.org"
              description="For publishers, sponsors, and collaborators"
              responseTime="3-5 days"
              topics={[
                "Book submissions",
                "Sponsorship opportunities",
                "Integration partners",
                "Media inquiries"
              ]}
            />
          </div>

          {/* Contact Form */}
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl p-8 shadow-xl" style={{background: 'linear-gradient(to br, #A1E5DB20, #ADD4EA20)'}}>
              <h3 className="text-3xl font-bold text-center mb-8" 
                  style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Send Us a Message
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{color: '#223848'}}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 transition-all"
                      style={{
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A1E5DB'
                        e.target.style.boxShadow = '0 0 0 3px rgba(161, 229, 219, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1'
                        e.target.style.boxShadow = 'none'
                      }}
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{color: '#223848'}}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 transition-all"
                      style={{
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A1E5DB'
                        e.target.style.boxShadow = '0 0 0 3px rgba(161, 229, 219, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1'
                        e.target.style.boxShadow = 'none'
                      }}
                      placeholder="john@school.edu"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="organization" className="block text-sm font-semibold mb-2" style={{color: '#223848'}}>
                      School/Organization
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 transition-all"
                      style={{
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A1E5DB'
                        e.target.style.boxShadow = '0 0 0 3px rgba(161, 229, 219, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1'
                        e.target.style.boxShadow = 'none'
                      }}
                      placeholder="St. Mary's Catholic School"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold mb-2" style={{color: '#223848'}}>
                      Your Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 transition-all"
                      style={{
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A1E5DB'
                        e.target.style.boxShadow = '0 0 0 3px rgba(161, 229, 219, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1'
                        e.target.style.boxShadow = 'none'
                      }}
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
                  <label htmlFor="inquiryType" className="block text-sm font-semibold mb-2" style={{color: '#223848'}}>
                    Inquiry Type *
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 transition-all"
                    style={{
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A1E5DB'
                      e.target.style.boxShadow = '0 0 0 3px rgba(161, 229, 219, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1'
                      e.target.style.boxShadow = 'none'
                    }}
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
                  <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{color: '#223848'}}>
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 transition-all"
                    style={{
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A1E5DB'
                      e.target.style.boxShadow = '0 0 0 3px rgba(161, 229, 219, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="Tell us how we can help..."
                  />
                </div>
                
                <div className="text-center">
                  <button
                    type="submit"
                    className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                    style={{
                      backgroundColor: '#A1E5DB',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#8DD4C9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Demo Section */}
      <section id="demo" className="py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Schedule a Personalized Demo
          </h3>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{color: '#223848'}}>
            See Lux Libris in action with a guided walkthrough tailored to your school&apos;s needs. 
            Our team will show you exactly how the platform can transform your reading program.
          </p>
          
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h4 className="font-bold mb-4" style={{color: '#223848'}}>What to Expect:</h4>
                <ul className="space-y-3">
                  <DemoFeature text="30-minute personalized walkthrough" />
                  <DemoFeature text="Live Q&A with our education team" />
                  <DemoFeature text="Custom pricing for your organization" />
                  <DemoFeature text="Implementation timeline discussion" />
                </ul>
              </div>
              
              <div className="text-left">
                <h4 className="font-bold mb-4" style={{color: '#223848'}}>Available Times:</h4>
                <p className="mb-4" style={{color: '#223848'}}>
                  Monday - Friday: 9:00 AM - 4:00 PM CST
                </p>
                <p className="text-sm mb-4" style={{color: '#223848'}}>
                  We&apos;ll work around your school schedule!
                </p>
                <a 
                  href="mailto:veritykahn@luxlibris.org?subject=Demo Request"
                  className="text-white px-6 py-3 rounded-full font-semibold transition-all inline-block"
                  style={{
                    backgroundColor: '#A1E5DB',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8DD4C9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
                >
                  Book Your Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Quick Answers
          </h3>
          
          <div className="space-y-6">
            <FAQItem
              question="I'm having trouble logging in. What should I do?"
              answer="First, ensure you're using the correct email associated with your account. Try resetting your password using the 'Forgot Password' link. If issues persist, email support@luxlibris.org with your school name and we'll help immediately."
            />
            
            <FAQItem
              question="How do I get a teacher code to join my school?"
              answer="Teacher codes are provided by your school administrator. Contact your principal or librarian to receive your unique join code. If your school hasn't registered yet, direct them to luxlibris.org/for-schools."
            />
            
            <FAQItem
              question="Can parents use the app if they don't have a smartphone?"
              answer="Yes! The parent app works on any device with internet access, including computers and tablets. Parents can also participate without the app - teachers can print progress reports to send home."
            />
            
            <FAQItem
              question="Our diocese wants to implement Lux Libris. Who should we contact?"
              answer="For diocese-wide implementations, email inquiries@luxlibris.org. We offer special pricing for multi-school organizations and can coordinate rollout across all your schools."
            />
            
            <FAQItem
              question="Is there a help center or documentation available?"
              answer="Yes! Once logged in, you'll find comprehensive help documentation in your dashboard. We also offer video tutorials and PDF guides. For immediate assistance, email support@luxlibris.org."
            />
          </div>
        </div>
      </section>

      {/* Office Hours */}
      <section className="py-20" style={{background: 'linear-gradient(to bottom right, #C3E0DE, #B6DFEB)'}}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Support Hours & Response Times
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-3xl mb-3">📧</div>
                <h4 className="font-semibold mb-2" style={{color: '#223848'}}>Email Support</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  Monday - Friday<br />
                  24-48 hour response
                </p>
              </div>
              
              <div>
                <div className="text-3xl mb-3">📞</div>
                <h4 className="font-semibold mb-2" style={{color: '#223848'}}>Phone Support</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  Coming Soon<br />
                  For urgent issues
                </p>
              </div>
              
              <div>
                <div className="text-3xl mb-3">💬</div>
                <h4 className="font-semibold mb-2" style={{color: '#223848'}}>Live Chat</h4>
                <p className="text-sm" style={{color: '#223848'}}>
                  In development<br />
                  Launching 2025
                </p>
              </div>
            </div>
            
            <p className="text-sm" style={{color: '#223848'}}>
              <strong>Note:</strong> During the school year (September - May), we prioritize 
              support requests from active classrooms to ensure minimal disruption to reading programs.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}

// Supporting Components
function ContactCard({ icon, title, email, description, responseTime, topics }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
        {title}
      </h3>
      <a 
        href={`mailto:${email}`} 
        className="font-semibold mb-3 block transition-colors"
        style={{
          color: '#A1E5DB',
          transition: 'color 0.3s'
        }}
        onMouseEnter={(e) => e.target.style.color = '#8DD4C9'}
        onMouseLeave={(e) => e.target.style.color = '#A1E5DB'}
      >
        {email}
      </a>
      <p className="mb-4 text-sm" style={{color: '#223848'}}>
        {description}
      </p>
      <p className="text-sm mb-4" style={{color: '#223848'}}>
        Response time: <span className="font-semibold">{responseTime}</span>
      </p>
      <div className="border-t pt-4">
        <p className="text-xs font-semibold mb-2" style={{color: '#223848'}}>Common topics:</p>
        <ul className="space-y-1">
          {topics.map((topic, index) => (
            <li key={index} className="text-xs flex items-start" style={{color: '#223848'}}>
              <span className="mr-1" style={{color: '#A1E5DB'}}>•</span>
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DemoFeature({ text }) {
  return (
    <li className="flex items-start">
      <span className="mr-2 mt-1" style={{color: '#A1E5DB'}}>✓</span>
      <span style={{color: '#223848'}}>{text}</span>
    </li>
  )
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
      <h4 className="text-lg font-bold mb-3" style={{color: '#223848'}}>
        {question}
      </h4>
      <p className="leading-relaxed" style={{color: '#223848'}}>
        {answer}
      </p>
    </div>
  )
}
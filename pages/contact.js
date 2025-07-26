// pages/contact.js - CONTACT/SUPPORT PAGE
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Contact() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <>
      <Head>
        <title>Contact - Lux Libris Support</title>
        <meta name="description" content="Get in touch with Lux Libris. Technical support, school inquiries, partnership opportunities, and personalized demos available." />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={50}
                height={50}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em'}}>
                Lux Libris
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/features" className="text-slate-600 hover:text-teal-600 transition-colors">
                Features
              </Link>
              <Link href="/for-schools" className="text-slate-600 hover:text-teal-600 transition-colors">
                For Schools
              </Link>
              <Link href="/contact" className="text-teal-600 font-semibold">
                Contact
              </Link>
              <Link href="/sign-in" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all">
                Sign In
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-3">
              <Link href="/sign-in" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all">
                Sign In
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-teal-600 transition-colors p-2"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-200">
              <div className="px-6 py-4 space-y-3">
                <Link 
                  href="/features" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/for-schools" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-teal-600 font-semibold py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-blue-50 to-white py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
              We're Here
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
                {" "}to Help
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Whether you need technical support, want to learn more about bringing 
              Lux Libris to your school, or have partnership ideas, we'd love to hear from you.
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
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-8 shadow-xl">
                <h3 className="text-3xl font-bold text-center text-slate-800 mb-8" style={{fontFamily: 'Didot, Georgia, serif'}}>
                  Send Us a Message
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                        placeholder="john@school.edu"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="organization" className="block text-sm font-semibold text-slate-700 mb-2">
                        School/Organization
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                        placeholder="St. Mary's Catholic School"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">
                        Your Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
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
                    <label htmlFor="inquiryType" className="block text-sm font-semibold text-slate-700 mb-2">
                      Inquiry Type *
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      required
                      value={formData.inquiryType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
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
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  
                  <div className="text-center">
                    <button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
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
        <section id="demo" className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Schedule a Personalized Demo
            </h3>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              See Lux Libris in action with a guided walkthrough tailored to your school's needs. 
              Our team will show you exactly how the platform can transform your reading program.
            </p>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 mb-4">What to Expect:</h4>
                  <ul className="space-y-3">
                    <DemoFeature text="30-minute personalized walkthrough" />
                    <DemoFeature text="Live Q&A with our education team" />
                    <DemoFeature text="Custom pricing for your organization" />
                    <DemoFeature text="Implementation timeline discussion" />
                  </ul>
                </div>
                
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 mb-4">Available Times:</h4>
                  <p className="text-slate-600 mb-4">
                    Monday - Friday: 9:00 AM - 4:00 PM EST
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    We'll work around your school schedule!
                  </p>
                  <a 
                    href="https://calendly.com/luxlibris-demo"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-semibold transition-all inline-block"
                    target="_blank"
                    rel="noopener noreferrer"
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
            <h3 className="text-3xl font-bold text-center text-slate-800 mb-12" style={{fontFamily: 'Didot, Georgia, serif'}}>
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
        <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Support Hours & Response Times
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-3xl mb-3">📧</div>
                  <h4 className="font-semibold text-slate-800 mb-2">Email Support</h4>
                  <p className="text-sm text-slate-600">
                    Monday - Friday<br />
                    24-48 hour response
                  </p>
                </div>
                
                <div>
                  <div className="text-3xl mb-3">📞</div>
                  <h4 className="font-semibold text-slate-800 mb-2">Phone Support</h4>
                  <p className="text-sm text-slate-600">
                    Coming Soon<br />
                    For urgent issues
                  </p>
                </div>
                
                <div>
                  <div className="text-3xl mb-3">💬</div>
                  <h4 className="font-semibold text-slate-800 mb-2">Live Chat</h4>
                  <p className="text-sm text-slate-600">
                    In development<br />
                    Launching 2025
                  </p>
                </div>
              </div>
              
              <p className="text-slate-600 text-sm">
                <strong>Note:</strong> During the school year (September - May), we prioritize 
                support requests from active classrooms to ensure minimal disruption to reading programs.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <Link href="/" className="flex items-center space-x-3 mb-4">
                  <img
                    src="/images/lux_libris_logo.png"
                    alt="Lux Libris"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <h3 className="text-xl font-bold" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Lux Libris
                  </h3>
                </Link>
                <p className="text-slate-400 text-sm">
                  Forming saints, one book at a time.
                </p>
              </div>
              
              {/* Programs */}
              <div>
                <h4 className="font-semibold mb-4">Programs</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/programs#lux-libris-award" className="hover:text-teal-400">The Lux Libris Award</Link></li>
                  <li><Link href="/programs#classroom-reading" className="hover:text-teal-400">Classroom Reading</Link></li>
                </ul>
              </div>
              
              {/* About */}
              <div>
                <h4 className="font-semibold mb-4">About</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/features" className="hover:text-teal-400">Features</Link></li>
                  <li><Link href="/luxlings" className="hover:text-teal-400">Luxlings™ Saints</Link></li>
                  <li><Link href="/how-it-works" className="hover:text-teal-400">How It Works</Link></li>
                </ul>
              </div>
              
              {/* Support & Get Started */}
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-slate-400 mb-4">
                  <li><Link href="/contact" className="hover:text-teal-400">Contact Us</Link></li>
                  <li><a href="mailto:support@luxlibris.org" className="hover:text-teal-400">Help Center</a></li>
                </ul>
                <h4 className="font-semibold mb-2">Get Started</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/for-schools" className="hover:text-teal-400">For Schools</Link></li>
                  <li><a href="mailto:inquiries@luxlibris.org" className="hover:text-teal-400">School Inquiries</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
              <p>&copy; 2025 Lux Libris. All rights reserved. Made with ❤️ for Catholic schools.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

// Supporting Components
function ContactCard({ icon, title, email, description, responseTime, topics }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h3>
      <a href={`mailto:${email}`} className="text-teal-600 hover:text-teal-700 font-semibold mb-3 block">
        {email}
      </a>
      <p className="text-slate-600 mb-4 text-sm">
        {description}
      </p>
      <p className="text-sm text-slate-500 mb-4">
        Response time: <span className="font-semibold">{responseTime}</span>
      </p>
      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Common topics:</p>
        <ul className="space-y-1">
          {topics.map((topic, index) => (
            <li key={index} className="text-xs text-slate-600 flex items-start">
              <span className="text-teal-500 mr-1">•</span>
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
      <span className="text-teal-500 mr-2 mt-1">✓</span>
      <span className="text-slate-700">{text}</span>
    </li>
  )
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
      <h4 className="text-lg font-bold text-slate-800 mb-3">
        {question}
      </h4>
      <p className="text-slate-600 leading-relaxed">
        {answer}
      </p>
    </div>
  )
}
// pages/home/help-center.js
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function HelpCenter() {
  const [activeCategory, setActiveCategory] = useState('general')

  const faqCategories = {
    general: {
      title: 'General Questions',
      icon: '📚',
      questions: [
        {
          question: "What is Lux Libris?",
          answer: "Lux Libris is a Catholic reading gamification platform where students unlock Luxlings™ saint achievements through curated book reading. With 137 original Little Luminaries™ saint characters, comprehensive school administration tools, and optional parent premium features, it transforms Catholic school reading programs."
        },
        {
          question: "How does the gamification work?",
          answer: "Students earn XP (1 point per minute read), collect weekly bird badges, and unlock Luxlings™ saints through reading streaks and achievements. The Healthy Habits Timer promotes 20+ minute daily reading sessions, and students compete on anonymous leaderboards while building consistent reading habits."
        },
        {
          question: "What are Luxlings™ saints?",
          answer: "Luxlings™ are 234 collectible vinyl chibi-style saint figures (digital in-app) created by Dr. Verity Kahn. Students unlock different series (Common, Rare, Legendary) through reading streaks, book completions, and grade achievements. Each saint includes feast days, patronage info, biographies, and fun facts."
        },
        {
          question: "When is the program available each year?",
          answer: "The reading program runs from June 1st to March 31st. After that, students vote for their favorite books (April 1-14), winners are announced April 15th, and the new year's nominees are revealed in late May before the cycle begins again June 1st."
        }
      ]
    },
    schools: {
      title: 'For Schools',
      icon: '🏫',
      questions: [
        {
          question: "How does school setup work?",
          answer: "Schools receive access codes from their diocese or directly from Dr. Kahn. Administrators use these codes to create school accounts, then generate teacher join codes. Teachers create accounts and receive unique student/parent codes for their classes. The entire process takes about 5 minutes."
        },
        {
          question: "What's included in a school subscription?",
          answer: "Schools get the Lux Libris Award program (20 curated books) and/or the Classroom Reading program. This includes teacher dashboards, student accounts, basic parent access, customizable achievement tiers, submission management, school-wide analytics, and the complete Luxlings™ saint collection system."
        },
        {
          question: "How much does it cost?",
          answer: "During the 2025/2026 pilot year at Holy Family Catholic School, all features are FREE. Starting in 2026/2027, schools pay $2,000-5,000 annually depending on size. Diocese bulk subscriptions offer discounted rates for multiple schools."
        },
        {
          question: "Can we customize the program for our school?",
          answer: "Yes! Schools select 15-20 books from our annual list, set custom achievement intervals (e.g., rewards at 5, 10, 15, 20 books), configure submission options (quizzes, teacher discussions, projects), and define real-world rewards like mass recognition or certificates."
        }
      ]
    },
    students: {
      title: 'For Students',
      icon: '🎒',
      questions: [
        {
          question: "How do students join the program?",
          answer: "Students enter their teacher's unique student code, provide their first name and last initial (for privacy), select their grade (4-8), and set a personal reading goal. They can then customize their app theme and start reading immediately."
        },
        {
          question: "What happens when I finish a book?",
          answer: "When you reach 100% on a book, you can either take a parent-unlocked quiz (10 random questions, need 7/10 to pass) or submit to your teacher through discussion, storyboard, or other approved methods. Once approved, the book is marked complete and counts toward your goals."
        },
        {
          question: "How do I unlock Luxlings™ saints?",
          answer: "Saints unlock through various achievements: 14-day reading streak (Common saint), 30-day streak (Rare saint), 90-day streak (Legendary saint), first book submitted (Grade saint), program completion (Mini Marian), and the ultimate 100-book goal unlocks Jesus Christ."
        },
        {
          question: "Can I use the app without internet?",
          answer: "The reading timer and basic features work offline. You only need internet to sync progress, take quizzes, submit books, and view leaderboards. Your reading data is saved locally and syncs when you reconnect."
        }
      ]
    },
    parents: {
      title: 'For Parents',
      icon: '👨‍👩‍👧',
      questions: [
        {
          question: "How do parents access the program?",
          answer: "Parents receive a code from their child's teacher. Basic features are FREE with your school's subscription, including progress tracking, quiz unlocking, and achievement viewing. Premium features ($10/year, free during pilot) add Reading DNA analysis and family challenges."
        },
        {
          question: "What's included in the free parent access?",
          answer: "Free features include: family dashboard for multiple children, book information with discussion questions, quiz approval system, progress and achievement tracking, bragging rights certificates, and guidance for age-appropriate content discussions."
        },
        {
          question: "What are the premium parent features?",
          answer: "Premium features (normally $10/year, free during pilot) include: Parent Healthy Habits Timer to model reading, weekly family reading battles, Reading DNA Lab with science-based analysis, parent-child compatibility insights, emergency toolkit for reluctant readers, and access to 50+ reading research papers."
        },
        {
          question: "Can homeschool families use Lux Libris?",
          answer: "Yes! Homeschool families can subscribe independently for $25/year (coming in Phase 3). This includes up to 6 children, a scaled reading program, basic saint achievements, and family progress tracking - perfect for homeschool co-ops and reading groups."
        }
      ]
    },
    technical: {
      title: 'Technical Support',
      icon: '🔧',
      questions: [
        {
          question: "What devices are supported?",
          answer: "Lux Libris is a Progressive Web App (PWA) that works on any modern browser (Chrome, Safari, Firefox, Edge) and can be installed like a native app on iOS and Android devices. It's optimized for phones, tablets, and Chromebooks."
        },
        {
          question: "How is student privacy protected?",
          answer: "We follow COPPA compliance standards. Students only provide first name and last initial, no email required. All data is encrypted, we never sell information, and schools own their student data. Parents control data collection permissions."
        },
        {
          question: "What if students don't have devices?",
          answer: "Teachers can manually track students without devices. The program is designed to be inclusive - students can participate through teacher-managed accounts, with physical reading logs, and still earn real-world achievement rewards."
        },
        {
          question: "How do teacher accounts work?",
          answer: "Teachers join with school-provided codes, create email/password accounts, and receive unique codes for their students and parents. Each teacher can manage their own classroom, track submissions, and view class-specific analytics while maintaining student privacy."
        }
      ]
    }
  }

  return (
    <Layout 
      title="Help Center - Lux Libris Support" 
      description="Find answers to frequently asked questions about Lux Libris. Get help with setup, features, technical support, and more."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            How Can We
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Help You?
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed" style={{color: '#223848'}}>
            Find answers to common questions or reach out to our support team for personalized assistance.
          </p>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full px-6 py-4 rounded-full shadow-lg text-lg pr-12"
                style={{backgroundColor: 'white', color: '#223848'}}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                🔍
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4">
            <QuickLink icon="📧" text="Email Support" href="mailto:support@luxlibris.org" />
            <QuickLink icon="📅" text="Schedule Demo" href="/home/contact#demo" />
            <QuickLink icon="📄" text="Download Guide" href="/resources/lux-libris-guide.pdf" />
            <QuickLink icon="🎥" text="Watch Videos" href="/home/demo" />
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {Object.entries(faqCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`
                  px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2
                  ${activeCategory === key 
                    ? 'text-white shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }
                `}
                style={activeCategory === key ? {backgroundColor: '#A1E5DB'} : {}}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.title}</span>
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {faqCategories[activeCategory].questions.map((item, index) => (
                <FAQItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Still Need Help?
          </h2>
          <p className="text-xl mb-8" style={{color: '#223848'}}>
            Our support team is here to assist you with any questions about Lux Libris.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <ContactCard
              icon="📧"
              title="Email Support"
              description="Get a response within 24 hours"
              action="Send Email"
              href="mailto:support@luxlibris.org"
            />
            
            <ContactCard
              icon="💬"
              title="Live Chat"
              description="Chat with our team Mon-Fri 9am-5pm CST"
              action="Coming Soon"
              disabled
            />
            
            <ContactCard
              icon="📞"
              title="Phone Support"
              description="For urgent school inquiries"
              action="Contact Dr. Kahn"
              href="mailto:veritykahn@luxlibris.org"
            />
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Helpful Resources
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ResourceLink
              icon="📖"
              title="Getting Started Guide"
              description="Step-by-step setup instructions"
              href="/resources/getting-started"
            />
            
            <ResourceLink
              icon="🎥"
              title="Video Tutorials"
              description="Watch walkthroughs and demos"
              href="/home/demo"
            />
            
            <ResourceLink
              icon="📊"
              title="Best Practices"
              description="Tips for maximum engagement"
              href="/resources/best-practices"
            />
            
            <ResourceLink
              icon="🎯"
              title="Success Stories"
              description="See how schools are thriving"
              href="/home/for-schools#success"
            />
          </div>
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
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

// Supporting Components
function QuickLink({ icon, text, href }) {
  return (
    <Link
      href={href}
      className="bg-white hover:bg-gray-50 px-6 py-3 rounded-full shadow transition-all flex items-center gap-2"
    >
      <span className="text-xl">{icon}</span>
      <span style={{color: '#223848'}}>{text}</span>
    </Link>
  )
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <h4 className="text-lg font-bold pr-4" style={{color: '#223848'}}>
          {question}
        </h4>
        <span className="text-2xl transform transition-transform" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ⌄
        </span>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 animate-fadeIn">
          <p className="leading-relaxed" style={{color: '#223848'}}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

function ContactCard({ icon, title, description, action, href, disabled }) {
  const content = (
    <>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2" style={{color: '#223848'}}>
        {title}
      </h3>
      <p className="mb-4" style={{color: '#223848'}}>
        {description}
      </p>
      <div className={`
        px-6 py-3 rounded-full font-semibold inline-block text-white
        ${disabled 
          ? 'bg-gray-200 text-gray-400' 
          : ''
        }
      `}
        style={!disabled ? {backgroundColor: '#A1E5DB'} : {}}
        onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#8FD4CA')}
        onMouseLeave={(e) => !disabled && (e.target.style.backgroundColor = '#A1E5DB')}
      >
        {action}
      </div>
    </>
  )

  if (disabled) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg text-center cursor-not-allowed opacity-75">
        {content}
      </div>
    )
  }

  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-2xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
        {content}
      </div>
    </Link>
  )
}

function ResourceLink({ icon, title, description, href }) {
  return (
    <Link href={href} className="block">
      <div className="rounded-xl p-6 hover:shadow-lg transition-all" 
           style={{background: 'linear-gradient(to br, #A1E5DB20, #ADD4EA20)'}}>
        <div className="text-3xl mb-3">{icon}</div>
        <h4 className="font-bold mb-2" style={{color: '#223848'}}>
          {title}
        </h4>
        <p className="text-sm" style={{color: '#223848'}}>
          {description}
        </p>
      </div>
    </Link>
  )
}